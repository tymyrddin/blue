# Locking home directories

This is another area where different Linux distribution families are different from each other. Each distribution family comes with different default security settings. A security administrator who oversees a mixed environment of different Linux distributions will need to take this into account.

The `UMASK` line is in the `login.defs` file for all Linux distributions, but Red Hat-type distributions are the only ones that have `UMASK` set to a restrictive value of `077` by default, which removes all permissions from the group and others.

Other distros set it to `022` by default, which creates home directories with a permissions value of `755`. This allows everybody to enter everybody else's home directories and access each others' files.

## Red Hat and CentOS

Red Hat Enterprise Linux and all of its descendants have better out-of-the-box security than any other Linux distribution. One thing that's already been done is locking down users' home directories.

By default, the `useradd` utility on Red Hat-type systems creates user home directories with a permissions setting of `700`. Only the user who owns the home directory can access it. The `UMASK` is set in `/etc/login.defs`.

    CREATE_HOME yes
    UMASK 077

## Debian and Ubuntu

Debian and its offspring, such as Ubuntu, have two user creation utilities: `useradd` and `adduser`.

### useradd

Using `useradd`:

    sudo useradd -m -d /home/username -s /bin/bash username

Otherwise, `username` would have no `home` directory and would be assigned the wrong default shell.

Home directories are wide open, with `execute` and `read` privileges for everybody.

    cd /home
    sudo chmod 700 *

To change the default permissions setting for home directories, open `/etc/login.defs` and change `UMASK 022` to `UMASK 077`. Now, new users' home directories will get locked down on creation, just as they do with Red Hat.

### adduser

The `adduser` utility is an interactive way to create user accounts and passwords with a single command, which is unique to the Debian family of Linux distributions. Most of the default settings that are missing from the Debian implementation of useradd are already set for adduser. The only thing wrong with the default settings is that it creates user `home` directories with the wide-open `755` permissions value. 

`777` is the numerical equivalent of `rwxrwxrwx` in Linux, subtracting that from the `UMASK` of `022`, you get the resulting permissions that will be set on a user's home directory and files. Change the `UMASK` to `077` in `/etc/login.defs`.