# Linux and container privilege escalation

Linux privilege escalation at the OS level centres on three surfaces: SUID binaries that
execute with the file owner's identity, capabilities granted to
binaries or processes beyond what their function requires, and sudo rules that allow
lower-privileged users to run specific commands as root. Container escalation adds a
fourth: misconfigurations in container runtimes that allow a process inside a container
to reach the host.

## SUID binaries and capabilities

The set-user-ID bit instructs the kernel to execute a file with the permissions of the
file owner, not the caller. For /usr/bin/passwd this is deliberate: a standard user needs
passwd to write /etc/shadow, which only root can modify directly. The bit is appropriate
on a small set of system utilities and becomes a privilege escalation path when it appears
on binaries that were not intended to have it, or on utilities that can be induced to
execute arbitrary code.

The GTFOBins catalogue documents which standard binaries, when run with SUID or sudo
permissions, allow shell escapes or arbitrary reads and writes. find, vim, perl, python,
awk, and bash are common examples. A find binary with the SUID bit set can execute
arbitrary commands as root via its -exec option. Most Linux distributions do not ship
these binaries with SUID, but misconfigured deployments, post-installation scripts, and
application installers sometimes set it.

Linux capabilities are a finer-grained alternative to the all-or-nothing SUID model.
Capabilities assign individual kernel privileges
to binaries or running processes. cap_setuid allows a process to change its user identity.
cap_sys_ptrace allows attaching to arbitrary processes. cap_dac_override bypasses
filesystem permission checks. A binary with cap_setuid set, regardless of whether it also
carries the SUID bit, can produce a root shell through a short code path.

## sudo misconfiguration

sudo allows a user to run specific commands as another user, usually root, according to
rules in /etc/sudoers and files under /etc/sudoers.d/. The intended model is narrow: a
backup user might run rsync as root, a developer might restart a specific service.
Misconfigured rules broaden this in ways that create escalation paths.

NOPASSWD entries remove the password confirmation step. For a compromised account, this
eliminates the only remaining friction between the attacker and the escalated command.

Wildcard arguments are a frequent audit finding. A rule permitting
`sudo /usr/bin/vim /etc/*.conf` is intended to allow editing configuration files, but
vim's `:!command` functionality allows executing arbitrary shell commands from within the
editor. The wildcard and the binary together enable unrestricted escalation regardless of
the intended scope.

LD_PRELOAD via env_keep is less common but high-severity. If the sudoers configuration
preserves LD_PRELOAD in the environment (`env_keep += LD_PRELOAD`), any sudo-permitted
command will load an attacker-specified shared library before execution, with root
privileges.

NOPASSWD ALL, sometimes added as a convenience during initial setup and never reviewed,
grants unrestricted root access. It appears in automated deployment scripts and development
environments more often than in deliberately designed production configuration.

## Container escape

Container isolation rests on Linux namespaces, which limit what the container can see, and
cgroups, which limit what it can consume. Both are kernel features that can be weakened or
bypassed through runtime configuration choices. Container escapes are almost
always configuration errors, not kernel vulnerabilities.

Privileged containers (`--privileged`) receive the full Linux capability set, including
CAP_SYS_ADMIN. With CAP_SYS_ADMIN, a process can mount host filesystems, load kernel
modules, and interact with the host kernel in ways that nullify namespace isolation. A
process inside a privileged container with access to the host's block devices can mount
the root filesystem and modify it directly.

Docker socket exposure is a common and immediately exploitable misconfiguration. Mounting
/var/run/docker.sock into a container gives that container control over the Docker daemon
on the host. A process inside the container can use the socket to create a new privileged
container with a host filesystem mount and use that to read or write host files as root.

Cgroup release_agent abuse exploits a notification mechanism intended for cgroup resource
management. If the cgroup filesystem is writable and the release_agent file is accessible,
writing a shell command to it and triggering it by causing a cgroup process to exit
executes the command on the host, outside the container namespace. This requires a writable
cgroup mount, which appears in certain older Kubernetes configurations and some
development setups.

Host namespace sharing weakens isolation incrementally. `--pid=host` allows the container
to see and signal all host processes. `--net=host` removes network namespace isolation.
`--ipc=host` shares the host IPC namespace. Each option alone may be justifiable for a
specific purpose; combinations increase the escape surface substantially.

Missing seccomp and AppArmor profiles remove syscall and filesystem access filtering that
the default container runtime applies. Docker's default seccomp profile blocks roughly
forty calls that are rarely needed by application containers but are useful for escape
techniques, including `add_key`, `keyctl`, `unshare`, and certain `clone` flag
combinations. A container run with `--security-opt seccomp=unconfined` removes this
layer. The default profiles are not infallible, but their absence represents a measurable
reduction in the barrier to exploitation.
Last updated: 10 July 2026
