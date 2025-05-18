# Disabling root access

## Disabling the root login shell

When creating a virtual private server on a cloud service (Rackspace, DigitalOcean, Vultr), the cloud service will
have you log in to that virtual machine as the root user. (Even with Ubuntu).

The first thing that you will want to do is to create a normal user account and give it full sudo privileges. Then, log out of the root account and log back in with the normal user account, and disable the root account:

    sudo passwd -l root

## Disabling root SSH login

To disable the `root` SSH login, set `#PermitRootLogin` to `no` in `/etc/ssh/sshd_config.conf`.

## Disabling root using PAM

The PAM is "a powerful suite of shared libraries used to dynamically authenticate a user to applications (or services) in a Linux system". The PAM settings are controlled by the conf file in `/etc/pam.d` or `/etc/pam.conf`. 

    $ sudo vim /etc/pam.d/sshd

OR

    $ sudo vim /etc/pam.d/login

**!!! WARNING !!! Editing the `/etc/pam.d/*` or `/etc/pam.conf` files can lock you out of your system.**

Add this rule in both files:

    auth    required       pam_listfile.so \
            onerr=succeed  item=user  sense=deny  file=/etc/ssh/deniedusers


* `auth`: is the module type (or context).
* `required`: is a control-flag that means if the module is used, it must pass or the overall result will be fail, regardless of the status of other modules.
* `pam_listfile.so`: is a module which provides a way to deny or allow services based on an arbitrary file.
* `onerr=succeed`: module argument.
* `item=user`: module argument which specifies what is listed in the file and should be checked for.
* `sense=deny`: module argument which specifies action to take if found in file, if the item is NOT found in the file, then the opposite action is requested.
* `file=/etc/ssh/deniedusers`: module argument which specifies file containing one item per line.

Next, create the file `/etc/ssh/deniedusers` and add the name `root` in it:

    $ sudo vim /etc/ssh/deniedusers

Save the changes and close the file, then set the required permissions on it:

    $ sudo chmod 600 /etc/ssh/deniedusers

From now on, the above rule will tell PAM to consult the `/etc/ssh/deniedusers` file and deny access to the SSH and login services for any listed user.

## Resources

* [How to Configure and Use PAM in Linux](https://www.tecmint.com/configure-pam-in-centos-ubuntu-linux/)