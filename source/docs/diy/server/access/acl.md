# Access control lists (ACL) and shared directory management (SDM)

With access control list (ACL), we can allow only a certain person to access a file, or we can allow
multiple people to access a file with different permissions for each person.

To view an ACL for a file or directory:

    getfacl <file>

## Creating an ACL

For setting an ACL, remove all permissions from everyone except for the user of the file. That's because the default permissions settings allow members of the group to have read/write access, and others to have read access.

    chmod 600 <file>

To allow a user or a group to have any combination of read, write, or execute privileges:

    setfacl -m u:<username>:rw <file>

* `-m` modify or create an ACL.
* `u:username:r`: user's name, followed by another colon, and the list of permissions to grant 
this user. In this case, read and write access.

Set an ACL for group access by replacing `u:` with  `g:`.

## Creating an inherited ACL for a directory

To have all files that get created in a shared directory use the same ACL:

    setfacl -m d:u:<username>:r <directory>

## Using an ACL mask

Remove an ACL from a file or directory with the `-x` option:

    setfacl -x u:<username> <file>

The `-x` option removes the entire ACL. To remove permissions with a mask, in this case read permission:

    setfacl -m m::r <file>

`m::r` sets a read-only mask on the ACL. Other permissions stay intact.

## Preventing the loss of ACLs during a backup

When using `tar` to create a backup and then doing a restore, the ACL's are gone. Use the `--acls` option:

    tar cJvf directory_backup.tar.xz dir/ --acls

## User groups

To create a group:

    sudo groupadd <groupname>

Adding members when creating user accounts, on CentOS:

    sudo useradd -G <groupname> <username>

on Debian/Ubuntu:

    sudo useradd -m -d /home/<username> -s /bin/bash -G <groupname> <username>

And assign a password.

To add an existing user to a group (CentOS and Debian families):

    sudo usermod -a -G <groupname> <username>

Adding users to a group by editing the `/etc/group` file:

    ...
    <groupname>>:x:1005:<list of comma separated usernames>
    ...

This method is extremely handy for when you need to add lots of members to a group at the same time.

## Creating a shared directory

    sudo mkdir <directoryname>

The new directory belongs to the root user and has a permissions setting of `755`, which
permits read and execute access to everybody and write access only to the root user. 

To allow only members of a specific group to access the directory, change ownership and group association, and then set the permissions:

    sudo chown nobody:<groupname> <directoryname>
    sudo chmod 770 <directoryname>

Setting the `SGID` bit and the sticky bit on the shared directory (it is safe and useful to set `SGID` on a shared directory):

    sudo chmod 2770 <directoryname>

But now users in the group can delete each other's files.

When the sticky bit is set on files, Linux just ignores it, whereas for directories it has the effect of preventing users from deleting or even renaming the files it contains unless the user owns the directory, the file, or is root.

    sudo chmod o+t <directoryname>

To set the sticky bit in octal form, prepend the number 1 to the current (or desired) basic permissions. Since the SGID bit has a value of 2000, and the sticky bit has a value of 1000, we can just add the two together to get a value of 3000 to add to the permissions:

    sudo chmod 3770 <directoryname>

Having the sticky bit set will prevent group members from deleting anybody else's files.





