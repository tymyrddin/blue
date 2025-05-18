# Discretionary access control (DAC)

Discretionary Access Control (DAC) really just means that each user has the ability to control who can get into their stuff.

## Using chown

One unique thing about `chown` is that you must have sudo privileges to use it, even if you're working with your own files in your own directory. You can use it to change the user of a file or directory, the group that's associated with a file or directory, or both.

To change the file ownership from me to `username`:

    sudo chown <username>>: <file>

To change the group association without changing the user:

    sudo chown :<group> <file>

To change the user without changing the group, list the username without the trailing colon:

    sudo chown <username> <file>

These commands work the same way on a directory as they do on a file. If you also want to change the ownership and/or the group association of the contents of a directory, while also making the change on the directory itself, use the `-R` option.

## Using chmod

On Unix and Linux systems, you would use the `chmod` utility to set permissions values on files and directories. You can set permissions for the user of the file or directory, the group that's associated with the file or directory, and more.

There are two ways to use chmod to change permissions settings: symbolic and numerical.

### Symbolic

    chmod u+x cript.sh
    chmod g+x script.sh
    chmod o+x script.sh
    chmod u+x,g+x script.sh
    chmod a+x script.sh

The first three commands add the executable permission for the user, the group, and others.
The fourth command adds executable permissions for both the user and the group, while
the last command adds executable permissions for everybody (a for all). You can also
remove the executable permissions by replacing `+` with `-`. Similarly, you can add or
remove read (`r`) or write (`w`) permissions.

### Numerical

With the numerical method, you'll use an octal value to represent the permissions settings on a file or directory. For the `r`, `w`, and `x` permissions, you assign the numerical values 4, 2,
and 1, respectively. You would do this for the user, group, and others positions, and then
add them all up to get the permissions value for the file or directory:

| User  | Group  | Others  |
|:-----:|:------:|:-------:|
|  rwx  |  rwx   |   rwx   |
|  421  |  421   |   421   |
|   7   |   7    |    7    |

With all permissions set for everybody, a file or directory will have a value of `777`.

## Using SUID and SGID

When a regular file has its SUID permission set, whoever accesses the file will have the
same privileges as the user of the file.

* A file with the SUID permission set has an `s` in the executable position for the user: `-rwsr-xr-x.`
* A file with the SGID permission set has an `s` in the executable position for the group: `-rwxr-sr-x.`

The numerical value for `SUID` is `4000`, and for `SGID` is `2000`. To set `SUID` on a file, add `4000` to whichever permissions value to be set.

As useful as it may be to have SUID or SGID permissions on executable files, it is just a necessary evil. While having SUID or SGID set on certain operating system files is essential for the operation of the system, it becomes a security risk when users can set SUID or SGID on other files. 

If intruders find an executable file that belongs to the root user and has the SUID bit set, they can use that to exploit the system. They may leave behind their own root-owned file with an SUID set, which will allow them to regain entry to the system the next time. If the intruder's SUID file isn't found, the intruder will still have access, even if the original problem has been fixed.

### Finding SUID or SGID files

    sudo find / -type f \( -perm -4000 -o -perm -2000 \) > suid_sgid_files.txt

* `/`: searching through the entire filesystem. Since some directories are only accessible to someone with root privileges, we need to use sudo.
* `-type f`: searching for regular files, which includes executable program files and shell scripts.
* `-perm 4000`: searching for files with the `4000`, or `SUID` permission bit set.
* `-o`: or operator.
* `-perm 2000`: searching for files with the `2000`, or `SGID`, permission bit set.
* `>`: redirecting the output into the suid_sgid_files.txt text file.

### Preventing SUID and SGID usage on a partition

Prevent `SUID` and `SGID` usage on a partition by mounting it with the `nosuid` option.

Do not set `nosuid` for the `/` partition. The operating system doesn't function properly.

## Using extended file attributes to protect sensitive files

Extended file attributes will not keep intruders from accessing files, but they can help prevent sensitive files from being altered or deleted.

* `a`: You can append text to the end of a file that has this attribute, but you can't
overwrite it. Only someone with proper `sudo` privileges can set or delete this
attribute.
* `i`: This makes a file immutable, and only someone with proper `sudo` privileges
can set or delete it. Files with this attribute can't be deleted or changed in any
way. It is also not possible to create hard links to files that have this attribute.

```text
sudo chattr +a <file>
```

## Securing system configuration files

With IoT devices, you have a bit more to worry about than you do with normal servers. Normal servers are protected with a high degree of physical security, while IoT devices often have little to no physical security.

In this context, the open "all can read" is often considered not a good idea. Yo ensure that all the configuration files on the devices are set with the `600` permissions setting: 

    sudo find / -iname '*.conf' -exec chmod 600 {} \;

Only the owner of the files – root user or a system account – can read them.

Test things thoroughly to ensure that you haven't broken anything. Most things work just fine with their configuration files set to a `600` permissions setting, and some do not.



