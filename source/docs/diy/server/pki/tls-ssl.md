# TLS/SSL

The CA is always the first subsystem to be configured; every other subsystem depends on the CA for its configuration. The CA, along with setting up the CA hierarchy for the PKI, issues certificates which every subsystem uses to function and sets up a security domain which establishes trusted relationships between subsystems. 

## Installation

On all systems and subsystems install openssl.

    # apt-get install openssl

Use the script that comes with the openssl package:

    # /usr/lib/ssl/misc/CA.pl -newca

The script will take you through all the steps of creating your CA. The fields do not matter much. It is rather self-explanatory.

## Configuration

The script has created a new directory `demoCA` with the CA's private key and public key/certificate in it. Demo useful. 

    # vi /etc/ssl/openssl.cnf

Change:

    dir = /etc/ssl/ca
    ...
    default_days = 730
    default_bits = 2048

Edit the script too:

    # vi /usr/lib/ssl/misc/CA.pl

Change:

    $DAYS="-days 730";     # 2 year
    $CADAYS="-days 3650";  # 10 years
    ...
    default_bits = 2048

And change (further down):

    system ("$REQ -new -keyout " .

to

    system ("$REQ -newkey rsa:2048 -keyout " .

## Generating keys

For creating digital certificates for servers on your LAN, for VPN clients or for whatever service you need to use with SSL, two steps are needed: 

To create a private key and a certificate request (Many questions. Not important, except that the CN of the certificate must be the domain name of the site you wish to secure):

    # /usr/lib/ssl/misc/CA.pl -newreq

Sign the request and generate a newcert.pem with the signed certificate. You will have to enter the password for your CA key which you supplied when creating the CA key, certificate and store.

    # /usr/lib/ssl/misc/CA.pl -sign

The certificate's key has a passphrase assigned during the `-newreq` phase. If you want your software to be able to autostart this won't work. To remove a passphrase:

    # openssl rsa -in newkey.pem -out newkey.nopass.pem

Rename `newkey.pem` and `newcert.pem` to something useful, like `hostname.key` and `hostname.cert`.

## Configuration resources

* [OpenSSL PKI Tutorial v1.1](https://pki-tutorial.readthedocs.io/en/latest/)
* [Building a Root CA and an Intermediate CA using OpenSSL and Debian Stretch](http://dadhacks.org/2017/12/27/building-a-root-ca-and-an-intermediate-ca-using-openssl-and-debian-stretch/)
