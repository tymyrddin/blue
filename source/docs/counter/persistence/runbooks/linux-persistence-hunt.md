# Linux host persistence hunting

Six hunts for Linux-specific persistence mechanisms not covered by the cron,
systemd, and SSH key enumeration in [autoruns-hunt.md](autoruns-hunt.md): shell profile and rc file
injection, PAM module tampering, dynamic linker preload, kernel modules from
unexpected paths, privileged account additions, and legacy init mechanisms.

## Shell profile and rc file injection

Hypothesis: an attacker with user-level access has added a payload to a shell
initialisation file that executes on login or interactive shell spawn.

```bash
# system-wide profile files (explicit files and profile.d .sh scripts separately)
grep -n -E 'curl|wget|bash.*http|python.*-c|nc |ncat |/tmp/|/dev/shm/' \
  /etc/profile /etc/bash.bashrc /etc/zshenv 2>/dev/null
grep -rn --include='*.sh' \
  -E 'curl|wget|bash.*http|python.*-c|nc |ncat |/tmp/|/dev/shm/' \
  /etc/profile.d/ 2>/dev/null

# per-user profile and rc files for all accounts with home directories
while IFS=: read -r user _ uid _ _ homedir _; do
  [[ $uid -ge 1000 || $user == "root" ]] || continue
  for f in "$homedir"/.bashrc "$homedir"/.bash_profile "$homedir"/.profile \
            "$homedir"/.zshrc "$homedir"/.zprofile "$homedir"/.bash_logout; do
    [[ -f "$f" ]] || continue
    if grep -qE 'curl|wget|bash.*http|python.*-c|nc |ncat |/tmp/|/dev/shm/' "$f" 2>/dev/null; then
      echo "SUSPICIOUS: $f"
      grep -nE 'curl|wget|bash.*http|python.*-c|nc |ncat |/tmp/|/dev/shm/' "$f"
    fi
  done
done < /etc/passwd

# files modified in the past 14 days
find /etc/profile.d /etc/profile /etc/bash.bashrc \
  $(awk -F: '$3>=1000 || $1=="root" {print $6}' /etc/passwd | \
    while read h; do
      for f in .bashrc .bash_profile .profile .zshrc .zprofile; do
        echo "$h/$f"
      done
    done) \
  -newer /etc/fstab -ls 2>/dev/null
```

An alias or function definition that shadows a legitimate command name is a
less obvious variant. A `.bashrc` containing `alias sudo='...'` or a function
named `ls` that calls a payload before passing through to the real binary is
worth checking in any profile file flagged above.

## PAM module tampering

Hypothesis: a malicious PAM module has been installed that captures credentials
or accepts any password for a targeted account.

```bash
# PAM config lines referencing a full path rather than a bare module name
# legitimate entries look like "pam_unix.so"; a full path suggests a planted module
grep -rn '^[^#]' /etc/pam.d/ | \
  grep -E '/[^[:space:]]*/pam_[^[:space:]]+\.so'

# all .so files referenced in PAM configuration
grep -rh 'pam_[^.]*\.so' /etc/pam.d/ | \
  grep -v '^#' | \
  grep -oE 'pam_[^[:space:]]+\.so[^[:space:]]*' | \
  sort -u | while read mod; do
    found=$(find /lib/security /lib64/security \
      /lib/x86_64-linux-gnu/security \
      /usr/lib/x86_64-linux-gnu/security \
      /usr/lib/security /usr/lib64/security \
      -name "$mod" 2>/dev/null)
    if [ -z "$found" ]; then
      echo "MISSING: $mod (referenced in PAM config but not found)"
    else
      echo "OK: $found"
    fi
  done

# PAM module files modified in the past 30 days
find /lib/security /lib64/security \
  /lib/x86_64-linux-gnu/security /usr/lib/security \
  -name '*.so' -newer /etc/passwd -ls 2>/dev/null

# check hashes of PAM modules against package manager records (Debian/Ubuntu)
dpkg -V 2>/dev/null | grep -E 'lib.*/security/.*\.so'
# on RHEL/CentOS/Fedora:
rpm -Va 2>/dev/null | grep -E 'lib.*/security/.*\.so'
```

A PAM module present on disk but not in the package manager's file integrity
records is a strong indicator of a planted backdoor. The `dpkg -V` and `rpm -Va`
outputs flag files whose checksum, size, or permissions differ from the installed
package record.

## Dynamic linker preload

Hypothesis: `/etc/ld.so.preload` or a per-process `LD_PRELOAD` environment
variable is pointing to a library that intercepts calls to standard functions.

```bash
# global preload file (unusual to have any entries on a clean system)
if [ -s /etc/ld.so.preload ]; then
  echo "=== /etc/ld.so.preload contains: ==="
  cat /etc/ld.so.preload
  # check each listed library
  while read lib; do
    [ -f "$lib" ] && ls -la "$lib" || echo "MISSING: $lib"
  done < /etc/ld.so.preload
else
  echo "/etc/ld.so.preload is empty or absent"
fi

# LD_PRELOAD set in environment files or shell profiles
grep -rn 'LD_PRELOAD' \
  /etc/environment /etc/profile /etc/profile.d/ \
  /etc/bash.bashrc \
  $(awk -F: '$3>=1000 || $1=="root" {print $6}' /etc/passwd | \
    while read h; do
      for f in .bashrc .bash_profile .profile .zshrc; do
        echo "$h/$f"
      done
    done) 2>/dev/null

# running processes with LD_PRELOAD in their environment
for pid in /proc/[0-9]*/environ; do
  if tr '\0' '\n' < "$pid" 2>/dev/null | grep -q 'LD_PRELOAD'; then
    proc=$(cat "${pid%/environ}/cmdline" 2>/dev/null | tr '\0' ' ')
    echo "PID ${pid//[^0-9]/}: LD_PRELOAD set: $proc"
  fi
done
```

Any entry in `/etc/ld.so.preload` on a production system warrants immediate
investigation. The file is not used by any standard application and is a
well-known rootkit installation point.

## Kernel modules from unexpected paths

Hypothesis: a kernel module has been loaded from a path outside the standard
module directory, or a module is present in the kernel but not in the expected
module list for the running kernel version.

```bash
# all currently loaded modules
lsmod

# module file path for each loaded module
while read mod rest; do
  modinfo "$mod" 2>/dev/null | grep -E '^filename:|^description:' | \
    awk -v m="$mod" 'NR==1{print m": "$0}'
done < <(lsmod | tail -n +2 | awk '{print $1}')

# modules loaded from outside the standard kernel module directory
KVER=$(uname -r)
while read mod rest; do
  path=$(modinfo "$mod" 2>/dev/null | awk '/^filename:/{print $2}')
  if [ -n "$path" ] && [ "$path" != "(builtin)" ] && \
     ! echo "$path" | grep -q "/lib/modules/$KVER/"; then
    echo "NON-STANDARD PATH: $mod at $path"
  fi
done < <(lsmod | tail -n +2 | awk '{print $1}')

# kernel module files modified more recently than the running kernel image
find "/lib/modules/$(uname -r)" \( -name '*.ko' -o -name '*.ko.xz' -o -name '*.ko.zst' \) | \
  xargs ls -lt 2>/dev/null | head -20
```

## Privileged account additions

Hypothesis: an attacker has added a new account with UID 0 or added an existing
account to sudoers to establish a login-capable backdoor.

```bash
# accounts with UID 0 other than root
awk -F: '$3 == 0 && $1 != "root" {print "UID-0:", $0}' /etc/passwd

# accounts with login shells (not /bin/false or /usr/sbin/nologin)
# that were not present in the system package manifest
awk -F: '$7 !~ /nologin|false/ {print $1, $3, $7}' /etc/passwd | \
  sort -k2 -n

# sudoers entries granting NOPASSWD or full sudo to non-standard accounts
grep -rn 'NOPASSWD\|ALL=(ALL' /etc/sudoers /etc/sudoers.d/ 2>/dev/null | \
  grep -v '^#'

# modification times for the core account files
ls -la /etc/passwd /etc/shadow /etc/gshadow /etc/sudoers
# package manager integrity check: note that /etc/passwd and /etc/shadow
# are conffiles on Debian/Ubuntu (excluded from dpkg -V hash checks) and
# belong to the 'setup' package on RHEL/CentOS (not shadow-utils)
# mtime comparison against /etc/fstab is more reliable than package verification
find /etc/passwd /etc/shadow /etc/gshadow /etc/sudoers \
  -newer /etc/fstab -ls 2>/dev/null

# accounts created in the past 14 days (by checking home directory mtime)
find /home /root -maxdepth 1 -type d -newer /etc/fstab -ls 2>/dev/null
```

A UID 0 account other than `root` is an immediate finding. A `NOPASSWD ALL`
sudoers entry for an account with no documented operational purpose is the
more common variant in practice.

## At jobs and legacy init mechanisms

Hypothesis: one-time scheduled tasks or legacy startup scripts are being used
to re-establish a foothold after service restarts or reboots.

```bash
# at jobs (one-time scheduled tasks)
atq 2>/dev/null
# examine each job
atq 2>/dev/null | awk '{print $1}' | while read job; do
  echo "=== at job $job ==="
  at -c "$job" 2>/dev/null
done

# /etc/rc.local (legacy, still present and executed on many distributions)
if [ -f /etc/rc.local ]; then
  echo "=== /etc/rc.local ==="
  grep -v '^#' /etc/rc.local | grep -v '^$'
fi

# SysV init.d scripts not corresponding to an installed package
for script in /etc/init.d/*; do
  name=$(basename "$script")
  # check if this init script belongs to any installed package
  if ! dpkg -S "$script" > /dev/null 2>&1 && \
     ! rpm -qf "$script" > /dev/null 2>&1; then
    echo "UNPACKAGED: $script"
  fi
done

# rc?.d symlinks pointing to unusual targets
find /etc/rc*.d -type l | while read link; do
  target=$(readlink -f "$link")
  if [ ! -f "$target" ]; then
    echo "BROKEN SYMLINK: $link -> $target"
  elif ! dpkg -S "$target" > /dev/null 2>&1 && \
       ! rpm -qf "$target" > /dev/null 2>&1; then
    echo "UNPACKAGED TARGET: $link -> $target"
  fi
done 2>/dev/null
```

*An unrecognised init.d script named `network-helper` or `update-service` on a
host that has not had a recent package install is the archetype of this
mechanism. The script is executable, runs as root on boot, and re-downloads the
implant if it has been removed. The PAM module hunt and the profile hunt are the
two that require the most care: a modified `/etc/pam.d/sshd` that adds
`pam_permit.so` as a sufficient auth module allows login with any password and
leaves nothing in the process list to see.*
