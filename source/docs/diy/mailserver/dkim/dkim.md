# DKIM configuration

## Installation

    # apt-get install opendkim opendkim-tools

## Unix socket

Postfix and opendkim communicate through a unix socket. Socket address is usually the one specified in `/etc/postfix/main.cf`, but the default configuration of postfix in debian runs under a chroot (`/var/spool/postfix`) so the socket must be created in the jail:

```text
# sockdir=/var/spool/postfix/var/run/opendkim
# mkdir -p $sockdir
# chown opendkim. $sockdir
# chmod go-rwx $sockdir
# chmod g+x $sockdir
```

## Generate keys

Generate the key pair. To generate a secret signing key, you need to specify the domain used to send mails and a selector which is used to refer to the key (choose anything you like, alpha-numeric strings will do).

```text
# opendkim-genkey -r -s myselector -b 2048 -d $domain.tld
```

This creates two files in `/etc/dkimkeys/`: `myselector.private` and `myselector.txt`, the private and public key. Make sure that only the `opendkim` user can read them:

    chgrp opendkim /etc/dkimkeys/*
    chmod go-rwx /etc/dkimkeys/*

## Configuration

Copy the sample configuration file `/etc/opendkim/opendkim.conf.sample` (or `/usr/share/doc/opendkim/opendkim.conf.sample`) to `/etc/opendkim/opendkim.conf` and change:

```text
Domain                  $domain.tld
KeyFile                 /path/to/keys/myselector.private
Selector                myselector
Socket                  inet:8891@localhost
UserID                  opendkim
```

On debian, for the unix socket:

```text
Syslog                   yes

# Required to use local socket with MTAs that access the socket as a non-
# privileged user (e.g. Postfix)
UMask                   007

# DO NOT BELIEVE that /etc/default/opendkim overrides the following :
# (In stretch, it does not on 2019-08-13)
Socket                  local:/var/spool/postfix/var/run/opendkim/opendkim.sock
```

### Multiple domains

If you are providing mail server service to multiple virtual domains on the same server, provide these directives:

```text
KeyTable                refile:/etc/opendkim/KeyTable
SigningTable            refile:/etc/opendkim/SigningTable
ExternalIgnoreList      refile:/etc/opendkim/TrustedHosts
InternalHosts           refile:/etc/opendkim/TrustedHosts
```

You have to create/move/copy DKIM keys in a separate domain folder for each domain, for example 
`/etc/opendkim/keys/domain1.com/`.  Otherwise you will receive 
`dkim: FAILED, invalid (public key: not available)” error message with DKIM email test`. You can use the same key 
for all the domains or generate a separate key for each domain. 

Edit the `/etc/opendkim/KeyTable` file to specify key locations:

```text
myselector._domainkey.domain1.com domain1.com:mail:/etc/opendkim/keys/domain1.com/myselector.private
myselector._domainkey.domain2.com domain2.com:mail:/etc/opendkim/keys/domain2.com/myselector.private
```
    
Edit the /etc/opendkim/SigningTable file to specify which key will sign a domain.

```text
*@domain1.com myselector._domainkey.domain1.com
*@domain2.com myselector._domainkey.domain2.com
```

In `/etc/opendkim/TrustedHosts`, add trusted domain and IP addresses who can use the keys. If needed, include localhost as it is not implicit.

```text
127.0.0.1
::1
localhost
<some_server_ip>
hostname.domain1.com
domain1.com
hostname.domain2.com
domain2.com
...
```

* This is referenced by the `ExternalIgnoreList` directive. Opendkim will ignore this list of hosts when verifying incoming mail.
* It is also referenced by the `InternalHosts` directive, this same list of hosts will be considered “internal,” and opendkim will sign their outgoing mail.

The flow for DKIM lookup starts with the sender’s address. The signing table is scanned until an entry whose pattern matches the address is found. Then, the second item’s value is used to locate the entry in the key table whose key information will be used. For incoming mail the domain and selector are then used to find the public key TXT record in DNS and that public key is used to validate the signature. For outgoing mail the private key is read from the named file and used to generate the signature on the message.

## Postfix integration

To make Postfix listen to the unix socket on debian (set up as above):

Add user `postfix` to the `opendkim` group (postfix needs to be able to access the socket):

```text
# adduser postfix opendkim
```

And append to `/etc/postfix/main.cf`:

```text
milter_default_action = accept
milter_protocol = 6
# from inside the chroot, the socket will be in /var/run/opendkim 
smtpd_milters = unix:/var/run/opendkim/opendkim.sock
non_smtpd_milters = unix:/var/run/opendkim/opendkim.sock
```

### Restart postfix

    # systemctl restart postfix

## DNS Configuration

Add a TXT record for your domain(s). For example: As a Hostname, use the `myselector` followed by the literal string `._domainkey` and use as Text: 

    v=DKIM1; p=yourPublicKey

Or

    v=DKIM1; h=sha256; k=rsa; s=email; p=yourPublicKey

Exact format may vary per DNS provider. Check the documentation for the exact style required.

## Testing

* Try to send a mail. Check `/var/log/mail.log`
* Test the installation with `opendkim-testkey`: 

```text
# opendkim-testkey -d $domain.tld -s myselector -vvv
```

## Configuration resources

* [Breaking DKIM - on Purpose and by Chance](https://noxxi.de/research/breaking-dkim-on-purpose-and-by-chance.html), October 2017, Update 08/2018
* [Debian: opendkim](https://wiki.debian.org/opendkim)

