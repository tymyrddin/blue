# Pluggable Authentication Modules (PAM)

Pluggable Authentication Modules (PAM) is a suite of shared libraries, providing an abstraction layer between the various methods available that provide authentication and the applications that require authentication and would otherwise have to support those methods directly. With PAM, all that is necessary for these components to cooperate is that a specific PAM module be available for each of them. 

## Passwords

Never reuse old passwords ever. .

Open `/etc/pam.d/common-password`:

To restrict users from using their old passwords on the same machine, in the `auth` section, enter the following line: 

    auth sufficient pam_unix.so likeauth nullok

If you want to allow a user to reuse his/her password from a number of passwords that were last used, add the following line in the `password` section: 

    password sufficient pam_unix.so nullok use_authtok md5 shadow remember=3

## SSH

The `pam_listfile.so` module authenticates users based on the contents of a specified file. For example, if username exists in a file `/etc/ssh/ssh.allow`, ssh will grant login access.

### Deny access

Append `/etc/pam.d/ssh`:

    auth required pam_listfile.so item=user sense=deny file=/etc/ssh/ssh.deny onerr=succeed

Add all usernames you wish to deny access for to a `/etc/ssh/ssh.deny` file.

### Allow access

Append `/etc/pam.d/ssh`:

    auth required pam_listfile.so item=user sense=allow file=/etc/ssh/ssh.allow onerr=fail

Add all usernames to allow access for to a `/etc/ssh/ssh.deny` file.

## SASL

SASL can use different authentication methods. The default one is PAM (as configured in `/etc/conf.d/saslauthd`)

Create `/etc/pam.d/smtp`

    #%PAM-1.0
    auth            required        pam_unix.so
    account         required        pam_unix.so

