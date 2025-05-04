# Linux analysis

## Filesystem hierarchy

The POSIX and Open Group UNIX standards didn't define a detailed directory layout for Unix vendors to follow. Unix systems and Linux distributions document their directory hierarchy in the [hier(7)](https://www.man7.org/linux/man-pages/man7/hier.7.html) or [hier(5)](https://www.unix.com/man-page/hpux/5/hier/) man pages. The Linux community developed the [Filesystem Hierarchy Standard (FHS)](https://refspecs.linuxfoundation.org/fhs.shtml) to encourage a common layout across distributions.

* The `/boot/` and `/boot/efi/` directories contain files for booting the system. Boot configuration (kernel parameters and so on) can be found here. Current and previous kernels can be found here together with the initial ramfs, which can be examined. On EFI systems, the EFI partition (a FAT filesystem) is often mounted inside the `/boot/` directory. Any non-standard and non-default files that have been added to the `/boot/` and `/boot/efi/` directories should be examined.
* The `/etc/` directory is the traditional location for system-wide configuration files and other data. The majority of these files are easily examined plain-text files. Configuration files may have a corresponding directory with a `.d` extension for drop-in files that are included as part of the configuration. The creation and modification timestamps indicate when a particular configuration file was added or changed. In addition, user-specific configuration files in a user's `/home/` directory may override system-wide `/etc/` files. Deviations from the distro or software defaults are often found here and may be of forensic interest. Copies of the distro default files are sometimes found in `/usr/share/factory/etc/*` and can be compared with those in the `/etc/` directory. When some distros perform upgrades to config files in `/etc/`, they may create a backup copy of the old files or add the new file with an extension. 
* The `/srv/` directory is available for use by server application content, such as FTP or HTTP files (unused on many distributions and may be empty). This is a good directory to examine in case it contains files that were published or otherwise accessible over a network. 
* The `/tmp/` directory is for storing temporary files. These files may be deleted periodically or during boot, depending on the distro or system's configuration. In some Linux distros, the contents of `/tmp/` resides in RAM using the `tmpfs` virtual memory filesystem. On a forensic image, systems using `tmpfs` to mount `/tmp/` will likely be empty.
* The `/run/` directory is a `tmpfs`-mounted directory residing in RAM and will likely be empty on a forensic image. On a running system, this directory contains runtime information like `PID` and `lock` files, `systemd` runtime configuration, etc. There may be references to files and directories in `/run/` found in logs or configuration files.
* The `/home/` directory is the default location for user home directories. A user's home directory contains files the user created or downloaded, including configuration, cache, data, documents, media, desktop contents, and other files the user owns. The `/etc/skel/` directory (which might only contain hidden “.” files) contains the default contents of a newly created `/home/*` directory. The `root` user's home directory is typically `/root/` of the root filesystem. This is intentional so that `root` can log in even when `/home/` is not mounted. These home directories are of significant interest because they provide information about a system's human users. If `/home/` is empty on a forensic image, it's likely the user's home directories are mounted from another filesystem or over a network. The creation (birth) timestamp of a user's home directory may indicate when the user account was first added.

## Shells

The term Linux technically refers only to the kernel, which is the actual OS. Graphical interface, tools and utilities, and even the command line shell are not Linux but parts of a Linux distribution. A distribution is a functional package that typically contains the Linux kernel, installers and package managers (usually unique to the distribution), and programs and utilities (including standard applications, such as Office suites, web browsers, email/chat clients, ...). 

The shell is a command prompt that humans and/or machines use to submit commands to instruct and control an OS. The shell starts or stops programs, installs software, shuts down a system, and performs other work. The command shell offers more powerful features and possibilities than graphical environments.

The most common shell in use today, and the default in most Linux distributions, is Bash.

### Shell history

The Unix/Linux shell was not originally designed with logging or audit trails in mind. In the past, patches have been created to augment the history mechanism and hacks have attempted to capture commands as the shell is used. Using basic Bash shell history as an audit trail is rudimentary. The Bash shell history can be configured to satisfy the following basic requirements:

* Record the command entered by the examiner
* Record a timestamp for each command entered
* Record all commands, including duplicates, comments, and space-prefixed commands
* Avoid truncating or overwriting history files
* Avoid conflicts when using multiple terminal windows on the same system
* Include root and non-root command history

Important information, such as the command completion time, the working directory where the command was executed, and the return code, are not logged. The Bash history is also not a tamper-resistant system: the examiner can easily modify or delete the history.

Some shells, such as `zsh`, have additional history features that allow for the logging of elapsed time. Other proposed solutions to improve shell logging include the use of `PS1`, `PROMPT_COMMAND`, `trap` and `DEBUG`, and key bindings to modify a command before executing. Using `sudo logging`; `auditd logging`; or special scripts, such as [Bash-Preexec](https://github.com/rcaloras/bash-preexec), can also improve command line logging.

For basic shell command logging, the built-in shell history functionality can be configured to record command line activity. Add these commands to `~/.bashrc` or `/etc/profile`:

```bash
set -o history
shopt -s histappend
export HISTCONTROL=
export HISTIGNORE=
export HISTFILE=~/.bash_history
export HISTFILESIZE=-1
export HISTSIZE=-1
export HISTTIMEFORMAT="%F-%R "
```

These mean that history is enabled and in append mode (as opposed to overwriting with each new login). The two variables `HISTCONTROL`and `HISTIGNORE` control which commands are saved to the history file. A common default setting is to ignore duplicates and commands beginning with a space. To ensure complete logging of all commands, the `HISTCONTROL` and `HISTIGNORE` variables are explicitly set to null. The `HISTFILE` variable is explicitly set to ensure command history held in memory is saved when a shell exits. `HISTFILESIZE` and `HISTSIZE` are set to `-1` to ensure history is not truncated or overwritten. The `HISTTIMEFORMAT` variable enables timestamps to be written to the history file and allows for setting a time format.

### Enumerating

To monitor received events:

```shell
udevadm monitor
```

Listing the associated files and paths for attached devices:

```shell
udevadm info /dev/sdx
```

### Special devices

Several other devices are useful to know: 

* The bit bucket, `/dev/null`, discards any data written to it. 
* A steady stream of zeros is provided when accessing `/dev/zero`. 
* The random number generator, `/dev/random`, provides a stream of random data when accessed. 
* Tape drives typically start with `/dev/st`.
* Access other external media via `/dev/cdrom` or `/dev/dvd` (these are often symbolic links to `/dev/sr*`). 
* In some cases, devices are accessed through the generic SCSI device driver interface `/dev/sg*`. 
* Other special pseudo devices include `/dev/loop*` and `/dev/mapper/*` devices.

## Files

### Enumerating

Recursively look for particular file types, and once you find the files get their hashes:

```shell
find . type f -exec sha256sum {} \; 2> /dev/null | grep -Ei '.asp|.js' | sort
```

Recursively list out folders and filders in their tree-branch relationship:

```shell
tree
```

Tree and show the users who own the files and directories:

```shell
tree -u
```

Stack with a `grep` to find a particular user:

```shell
tree -u | grep 'root'
```

Get information about a file:

```shell
stat file.txt
```

### Files and dates

Note: timestamps can be manipulated and can't be trusted during an IR.

Print the files and their corresponding timestamp:

```shell
find . -printf "%T+ %p\n"
```

Show all files created between two dates:

```shell
find -newerct "01 Jun 2021 18:30:00" ! -newerct "03 Jun 2021 19:00:00" -ls | sort
```

### Compare files

```shell
vimdiff file1.txt file2.txt
```

## Processes 

Track parent-child processes:

```shell
ps -aux --forest
```

Get an overview of every running process running from a non-standard path:

```shell
sudo ls -l /proc/[0-9]*/exe 2>/dev/null | awk '/ -> / && !/\/usr\/(lib(exec)?|s?bin)\// {print $9, $10, $11}' | sed 's,/proc/\([0-9]*\)/exe,\1,'
```

List every process:

```shell
sudo ls -l /proc/[0-9]*/exe 2>/dev/null | awk '/ -> / {print $NF}' | sort | tac
```

## Networks

Get a quick overview of network activity:

```shell
netstat -plunt
```

This alternative also helps re-visualise the originating command and user that a network connection belongs to:

```shell
sudo lsof -i
```

## Persistence

Persistence helps a malware persist on a machine after startup or any other mechanism that would stop a malware 
from running.

### Cron jobs

```shell
cat /etc/crontab
```

### Services

A list of services can be found in the `/etc/init.d` directory:

```shell
ls /etc/init.d/
```

### Bash

Check `.bashrc`:

```shell
cat ~/.bashrc
```

System wide settings:

```shell
/etc/bash.bashrc
/etc/profile
```

## Evidence of execution

Execution history of `sudo`:

```shell
cat /var/log/auth.log* |grep -i COMMAND|tail
```

Bash history:

```shell
cat ~/.bash_history
```

Check file access using `vim`:

```shell
cat ~/.viminfo
```

## Log files

`Syslog` contains messages that are recorded by the host about system activity:

```shell
cat /var/log/syslog* | head
```

`Auth` logs have information about users and authentication-related logs:

```shell
cat /var/log/auth.log* | head
```

`/var/log` contains logs for third-party applications, for example `Apache2` logs:

```shell
ls /var/log/apache2/
```

## Resources

* [About DFIR/Tools & Artifacts > Linux](https://aboutdfir.com/toolsandartifacts/linux/)
* [You Don't Know Jack About .bash_history - SANS DFIR Summit 2016](https://www.youtube.com/watch?v=wv1xqOV2RyE)
* [Linux Storage Stack Diagram](https://www.thomas-krenn.com/en/wiki/Linux_Storage_Stack_Diagram)