# Key management

## Generate a key

    $ ssh-keygen -t

Enter a passphrase. It will create 2 files in the `~/.ssh` directory: `id_rsa`, a private key and `id_rsa.pub`, a public key. 

Note: **Do not leave the passphrase empty. An attacker who gets hold of your private key can otherwise connect to the hosts where you put you public key. Choose a loooooong and complex passphrase. Remember the passphrase. Better yet, put it in a password manager.**

## Copy key to server

    $ scp ~/.ssh/id_rsa.pub user@server:~/.ssh/authorized_keys
    The authenticity of host 'XXX.XXX.XXX.XXX (XXX.XXX.XXX.XXX)' can't be established.
    ECDSA key fingerprint is [fingerprint].
    Are you sure you want to continue connecting (yes/no)? yes

If ssh access is already available, by using the `cat` command to read the contents of the public key on the local computer and piping that through an SSH connection to the remote server (and avoiding overriding already existing keys):

    $ cat ~/.ssh/id_rsa.pub | ssh user@server "mkdir -p ~/.ssh && touch ~/.ssh/authorized_keys && chmod -R go= ~/.ssh && cat >> ~/.ssh/authorized_keys"
    The authenticity of host 'XXX.XXX.XXX.XXX (XXX.XXX.XXX.XXX)' can't be established.
    ECDSA key fingerprint is [fingerprint].
    Are you sure you want to continue connecting (yes/no)? yes

For password-less login install the public key using the `ssh-copy-id` command:

    $ ssh-copy-id user@server
    $ ssh-copy-id -i ~/.ssh/id_rsa.pub user@server

The authenticity message means that the local computer does not recognize the remote host. This will happen the first time connecting to a new host. Type "yes" and press ENTER to continue. 

    /usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed
    /usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys
    user@XXX.XXX.XXX.XXX's password:

    Enter password (not displayed for security purposes) and the following response is given:

    Number of key(s) added: 1

## Connect 
`ssh` to the server:

    $ ssh user@server

## Changing passphrase

    ssh-keygen -p

Or:

    cd ~/.ssh/
    ssh-keygen -f id_rsa -p

And upload it to the server. If you then connect, you may get an [authentication error](../trouble/ssh-auth-error.md)
