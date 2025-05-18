# Configuring sudo

`sudo` stands for "super-user do". Sudo allows any non-root user to run applications as root. When `sudo` is configured correctly, it greatly increases the security of the environment.

* Slowing hackers down. Since the root login will most likely be disabled and your users are properly granted sudo, any attacker will not know which account to go after, thus slowing them down. If they are slowed down enough, they may stop the attack and give up.
* Allow non-privileged users to perform privileged tasks by entering their own passwords.
* Keeps in line with the principle of least privilege by allowing administrators to assign certain users full privileges, while assigning other users only the privileges they need to complete their daily tasks.

## Adding users to the sudo group

On Ubuntu 18.04, unless otherwise specified upon account creation, the user is automatically added to the `sudo` group.

To add a user who is not part of the sudo group already, add him/her with:

    usermod -aG sudo <username>

Using the `-a` option helps `username` retain any previously existing groups.

To directly add a user to the sudo group upon `username` account creation:

    useradd -G sudo <username>

By default, Ubuntu allows sudo users to execute any program as root with their password. There are a few ways we can check this information. The first way is as user with `sudo -l`.

Another way to view this information is with `visudo`. This opens the sudo policy file. The sudo policy file is stored in `/etc/sudoers`. 

This gives the same information as `sudo -l` but with one difference; the `%sudo` indicates that it is for the group, sudo. There can be other groups in this file such as `admin`. This is where administrators can set what programs a user in a certain group can perform and whether they need a password. 

In the `%sudo ALL=(ALL:ALL) ALL NOPASSWD: ALL`, the `NOPASSWD` part says that the user that is part of the sudo group does not need to enter their local password to use sudo privileges. Generally, this is not recommended - not even for home use.

Users can also be added to the `sudoers` using the `sudo` policy file. **Always edit sudoers with the `sudo visudo` command.**

If you are managing users in a network across multiple flavours of Linux (CentOS, Red Hat, etc.), where the sudo group may be called something different, this method may be more preferable: add a `User Alias` to the policy file and add users to that alias, or add lines for individual users.

    User_Alias ADMINS = lela, barzh

and:

    ADMINS ALL=(ALL) ALL

or for an individual user: 

    username ALL=(ALL) ALL

It is not recommended to use individual user aliases in a large network since this can become unwieldy very quickly. The first option is going to be your best bet as you can simply add users to this alias and control which commands they have access to with `sudo` easily.

## Setting up sudo for only certain delegated privileges

To ensure that users are assigned to the groups they belong to and only are allowed access to the programs they need to complete their daily tasks, set Command Aliases in the sudo policy file: Use `sudo visudo`, and edit the line under the comment `# Cmnd alias specification`.

    Cmnd_Alias SOFTWARE = /bin/rpm, /usr/bin/up2date, /usr/bin/yum

To assign the `SOFTWARE` command alias to the `SOFTWAREADMINS` user alias:

    SOFTWAREADMINS ALL=(ALL) SOFTWARE

You can also assign Command Aliases to individual users, specific commands to individual users, and Command Aliases to groups.

## Host aliases

`Host Aliases` are a way to trickle down a sudo policy across the network and different servers. For example, you may have a `MAILSERVERS` `Host Alias` which contains servers `mail1` and `mail2`. This `Host Alias` has certain users or groups assigned to it, and that `Host Alias` has a `Command Alias` assigned to it stating which commands those users are able to run.

When those users run a command on `mail1` or `mail2`, the server will check the sudo policy file to see if they can do what they are trying to do.

In a home environment and small-medium business environments, it probably is just easier to copy the sudo policy file to each server in the network. This will really only come into play with large enterprise networks and even then they will probably be using a centralised Ansible or other automation in effect.

## Preventing users from using shell escapes

Programs like text editors and pagers have a handy shell escape feature. This allows a user to run a shell command without having to exit the program first. For example, from the command mode of the `vi` and `vim` editors, someone could run the `ls` command by running `:!ls`.

To allow a user to edit the `sshd_config` file and only that file, add a line to the sudo configuration:

    username ALL=(ALL) sudoedit /etc/ssh/sshd_config

`sudoedit` has no shell escape feature.

Other programs that have a shell escape feature: `emacs`, `less`, `view`, and `more`.

## Preventing users from using other dangerous programs

Some programs that don't have shell escapes can still be dangerous if you give users unrestricted privileges to use them, like `cat`, `cut`, `awk`, and `sed`.

If you must give someone `sudo` privileges to use one of these programs, limit their use to only specific files.

## Preventing abuse via user's shell scripts

A rule for Fritz so he can create scripts running with elevated privileges:

    fritz ALL=(ALL) /home/fritz/fritz_script.sh

And his script reads:

    #!/bin/bash
    echo "This script belongs to Fritz the Cat."
    sudo -i

What can happen next:

    fritz@server:~$ sudo ./fritz_script.sh
    This script belongs to Fritz the Cat.
    root@server:~#

`sudo -i` logs a person in to the root user's shell, the same way that `sudo su -` does.

To remedy this, move Fritz' script to the `/usr/local/sbin` directory and change the ownership to the `root` user so that Fritz will not be able to edit it. And delete that `sudo -i` line in it.