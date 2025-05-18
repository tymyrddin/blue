# Installing SSH

SSH (Secure Shell) is used for managing networks, operating systems, and configurations. It is also used inside many file transfer tools and configuration management tools. Functionally SSH keys resemble passwords. SSH keys are a pair of cryptographic keys using a public key cryptosystem that can be used to authenticate to an SSH server as an alternative to password-based logins. A private and public key pair are created prior to authentication. The private key is kept secret and secure by the user, while the public key can be shared with anyone.

The advantage SSH authentication has over traditional password authentication is that you can be authenticated by the server without having to send your password over the network. Anyone eavesdropping on unencrypted connections will not be able to intercept and crack the password. It also allows for disabling password-based authentication.

## openSSH server 

    # apt-get install openssh-server
    # systemctl enable ssh
    # systemctl start ssh

### Control

On Debian, the default behaviour of an OpenSSH server is that it will start automatically as soon as it is installed. Verify it is running:

    # systemctl status ssh

If it is not running, try to start it with:

    # systemctl start ssh

Stop it with

    # systemctl stop ssh

If you wish to disable OpenSSH server from starting up at boot:

    # systemctl disable ssh

And enable for starting up at boot:

    # systemctl enable ssh

## Filtering

Allow SSH connections in the firewall.

## openSSH client

    § sudo apt-get install openssh-client

* [Generate a key](key-management.md)
* Punch a hole in the firewall
  * If `ufw` is installed on client, open port (22, oruse the port you need)   
* Copy key to server.
* Connect and login.

## Resources

* [OpenSSH Security](https://www.openssh.com/security.html)
* [OpenBSD Security](https://www.openbsd.org/security.html)
