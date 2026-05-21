# TLS/SSL

The CA is the first subsystem to configure; every other subsystem depends on it. The CA issues certificates that each subsystem uses and establishes the trusted relationships within the PKI.

## Installation

Install OpenSSL on all systems:

```bash
apt-get install openssl
```

## Setting up a CA

The `CA.pl` helper script was removed from OpenSSL 3.0 (the default on Ubuntu 22.04+ and Debian 12+). The commands below work on any current system.

Set up the CA directory structure:

```bash
mkdir -p /etc/ssl/ca/{certs,private,newcerts}
chmod 700 /etc/ssl/ca/private
touch /etc/ssl/ca/index.txt
echo '01' > /etc/ssl/ca/serial
```

Generate the CA key and self-signed certificate. The `-days 3650` value gives a ten-year CA lifetime:

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096 \
    -out /etc/ssl/ca/private/ca.key
chmod 400 /etc/ssl/ca/private/ca.key
openssl req -new -x509 -days 3650 \
    -key /etc/ssl/ca/private/ca.key \
    -out /etc/ssl/ca/certs/ca.crt
```

The prompts ask for the Distinguished Name fields. The Common Name is the only field likely to matter for internal use.

## Generating certificates

For each server or service that needs a certificate:

```bash
# Generate a key and certificate signing request
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 \
    -out hostname.key
openssl req -new -key hostname.key -out hostname.csr \
    -addext "subjectAltName=DNS:hostname.example.com"
```

Replace `hostname.example.com` with the actual name clients will use to connect. Modern browsers (Chrome 58+, Safari 13+) require a Subject Alternative Name and reject certificates without one.

Sign the request with the CA. The `-copy_extensions copyall` flag copies the SAN from the CSR into the signed certificate (OpenSSL 3.0+):

```bash
openssl x509 -req -days 730 \
    -in hostname.csr \
    -CA /etc/ssl/ca/certs/ca.crt \
    -CAkey /etc/ssl/ca/private/ca.key \
    -CAcreateserial \
    -copy_extensions copyall \
    -out hostname.crt
```

Rename `hostname.key` and `hostname.crt` to something that reflects the service (e.g. `mail.example.com.key`).

If the service needs to start without a passphrase, generate an unencrypted key from the outset with `genpkey` as shown above. To strip a passphrase from an existing key:

```bash
openssl rsa -in hostname.key -out hostname.nopass.key
```

## Configuration resources

* [OpenSSL PKI Tutorial v1.1](https://pki-tutorial.readthedocs.io/en/latest/)
