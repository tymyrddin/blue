# Internal PKI

An Internal PKI consists of

* A master-your-own master Certificate Authority (CA) certificate and key which is used to sign each of the server and client certificates.
* A separate certificate (also known as a public key) and private key for the server and each client.

The most secure way of doing this is to generate the Certificate Authority keys on a stand-alone (not Internet-connected) machine in a secure location. 

## Master Certificate Authority (CA)

[easy-rsa](https://github.com/OpenVPN/easy-rsa) is a CLI utility to build and manage a PKI CA. It has a [quickstart documentation](https://github.com/OpenVPN/easy-rsa/blob/master/README.quickstart.md) and OpenVPN has example files.

    cd /etc/openvpn/
    mkdir easy-rsa
    cd easy-rsa
    cp -r /usr/share/doc/openvpn/examples/easy-rsa/2.0/* .

Edit the `/etc/openvpn/easy-rsa/vars` file
    
    #vi /etc/openvpn/easy-rsa/vars

Append content to some of its variables. This will make the next step in the process faster. You can also skip this. The only parameter which must be explicitly entered is the Common Name. 

Now create the Certificate Authority Certificate and Key:

    # source vars
    # ./clean-all
    # ./build-ca
        
    Generating a 2048 bit RSA private key
    ............++++++
    ...........++++++
    writing new private key to 'ca.key'
    -----
    You are about to be asked to enter information that will be incorporated
    into your certificate request.
    What you are about to enter is what is called a Distinguished Name or a DN.
    There are quite a few fields but you can leave some blank
    For some fields there will be a default value,
    If you enter '.', the field will be left blank.
    -----
    Country Name (2 letter code) [KG]:
    State or Province Name (full name) [NA]:
    Locality Name (eg, city) [BISHKEK]:
    Organization Name (eg, company) [OpenVPN-TEST]:
    Organizational Unit Name (eg, section) []:
    Common Name (eg, your name or your server's hostname) []: <hostname>
    Email Address [me@myhost.mydomain]:

Hit enter, and again, and again ...

Later more master certificates and keys can be added, and when doing so do NOT use the `./clean-all` instruction again. It wipes the Certificate Authority.

## Server key

Generate the server certificate and key with:

    # ./build-key-server <servername>

Hit enter, and again, and again ... including when it asks you to add a pass phrase. This is between servers. When it asks you if you wish to sign, answers yes, and you also want to commit.

## Client keys
For security, each client will get its own certificate and key. Per client:

    # ./build-key <clientname>

Hit enter, and again, and again ... including when it asks you to add a pass phrase. This is between servers. When it asks you if you wish to sign, answers yes, and you also want to commit.

## Diffie-Hellman parameters
Use the `build-dh` script to determine the encryption parameters necessary for the server end of a SSL/​TLS connection:

    ./build-dh

And the system will get very busy with prime numbers.

## Copy keys

In the most secure possible way (for instance with `scp`), copy keys and certs to their respective locations.

* `ca.crt`, `dh2048.pem`, `<servername>.crt`, and `<servername>.key` to `/etc/openvpn` on `<servername>`
* `ca.crt`, `<clientname>.crt`, and `<clientname>.key` to `/etc/openvpn` on `<clientname>` for each client server.

## Security improvement

All keys were created, signed and then distributed to the clients. A more secure way would be to generate the keys in their locations, submit a Certificate Signing Request (CSR) to the key-signing machine or transfer the CSR to the offline CA, the key-signing machine could have processed the request and returned a signed certificate which could have been transferred back to the clients. That way, the secret .key files stay on the machine on which they were generated.

