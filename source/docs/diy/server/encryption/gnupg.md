# GNU Privacy Guard

GNU Privacy Guard (GPG) is based on Pretty Good Privacy, the OpenPGP standard.

Pretty Good Privacy (PGP) is used widely to encrypt and decrypt email by using asymmetrical and symmetrical systems. When you first send your email, it is encrypted with your own public key, as well as a session key, which is a one-time use random number called a `nonce`. The session key is then encrypted into the public key and sent with the cipher text. To decrypt your email, the receiving end must use their private key in order to discover the session key. The session key combined with the private key are then used to decrypt the cipher text back into the original document.

GPG comes pre-installed on Ubuntu. Its main advantages:

* Easy encryption for email and files.
* Mentioned in 2017 by Snowden, referring to 2014, supposedly, then, the NSA could not crack PGP.
* Asymmetric encryption removes the need to provide a password for decrypting or unlocking files thus improving security overall.

## Using GPG

To create keys:

    gpg --gen-key

To verify the keys were created:

    gpg --list-keys

## Encrypting files with GPG

### Symmetric

    gpg -c <file>

This will prompt the user to enter a passphrase to protect the file. **This is not the passphrase you used to create your keys**

The `-d` option while targeting our gpg file that was encrypted, will print out the contents of the file after prompting for the secret passphrase.

### Asymmetric

Asymmetric encryption works by using two keys - one to encrypt, and one to decrypt. The public key is used to encrypt the data while the private key is used to decrypt the data. So using the typical Bob and Alice example, let's say Bob wants to send Alice an encrypted file.

He would first encrypt the file using Alice's public key and then send the file away. Once Alice receives the file, she can decrypt it with her private key. The big takeaway here is that public keys can be shared, private keys should be kept private and held onto for dear life. **NEVER SHARE YOUR PRIVATE KEY!**

To use the scheme, users need to extract their **public keys** and send them to each other. Go to the `.gnupg` folder and extract with:

    gpg --export -a -o <filename>

This will export the user's public key as ASCII armored output as the filename specified. In order to import the file, (be in `.gnupg` directory or know the path).

    gpg --import <filename.txt>

To encrypt a document asymmetrically:

    gpg -e <document>

When the other party wishes to decrypt it, he/she will be prompted for his/her passphrase for his/her private key. After entering that he/she is greeted with the text from the file.

    gpg -d <document>.gpg

