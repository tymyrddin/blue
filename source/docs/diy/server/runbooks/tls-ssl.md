# Internal certificate authority

Hardening runbook. Sets up a private certificate authority and issues certificates for internal services, so that traffic between an organisation's own servers can be encrypted and authenticated without a public CA. For public-facing services, [Let's Encrypt](lets-encrypt.md) is the simpler choice; this is for internal hosts that public CAs cannot certify.

## When to run

When internal services (a database, an internal API, a mail server between back-end hosts) need TLS and are not reachable by a public CA's validation. Once, to establish the CA; then per service that needs a certificate.

## The trust model, briefly

A private CA issues certificates that only systems configured to trust it will accept. The CA's own key is the root of that trust: anything that key signs is trusted by those systems. This makes the CA private key the most sensitive item in the setup.

## Risk

The CA private key can sign a certificate for any internal name. Anyone who obtains it can impersonate any internal service to systems that trust the CA. Generate it with restrictive permissions, keep it off general-access machines, and never copy it onto the servers that merely use the certificates it signs.

## Establishing the CA

Install OpenSSL, then create the CA directory with a locked-down private key location:

```
sudo apt-get install openssl
mkdir -p /etc/ssl/ca/{certs,private,newcerts}
chmod 700 /etc/ssl/ca/private
touch /etc/ssl/ca/index.txt
echo '01' > /etc/ssl/ca/serial
```

Generate the CA key and self-signed certificate. The key is set read-only to its owner immediately:

```
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096 \
    -out /etc/ssl/ca/private/ca.key
chmod 400 /etc/ssl/ca/private/ca.key
openssl req -new -x509 -days 3650 \
    -key /etc/ssl/ca/private/ca.key \
    -out /etc/ssl/ca/certs/ca.crt
```

`-days 3650` gives the CA a ten-year life. The Common Name is the field that identifies the CA.

## Issuing a certificate

For each service, generate a key and signing request. The Subject Alternative Name is required; modern clients reject certificates without one:

```
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out hostname.key
openssl req -new -key hostname.key -out hostname.csr \
    -addext "subjectAltName=DNS:hostname.example.com"
```

Use the actual name clients will connect to. Sign the request with the CA, copying the SAN into the signed certificate:

```
openssl x509 -req -days 730 \
    -in hostname.csr \
    -CA /etc/ssl/ca/certs/ca.crt \
    -CAkey /etc/ssl/ca/private/ca.key \
    -CAcreateserial \
    -copy_extensions copyall \
    -out hostname.crt
```

Rename the key and certificate to reflect the service (`mail.example.com.key`). A service that needs to start without a passphrase prompt uses an unencrypted key, generated unencrypted from the outset.

## Verify

Confirm the issued certificate is valid and carries the expected name:

```
openssl verify -CAfile /etc/ssl/ca/certs/ca.crt hostname.crt
openssl x509 -in hostname.crt -noout -text | grep -A1 "Subject Alternative Name"
```

`verify` should report `OK`, and the SAN should list the intended hostname. After installing the CA certificate (`ca.crt`) into the trust store of each client system, confirm the client connects to the service without a trust warning.

## Done

CA established with its private key restricted to owner-read. Each service holds a certificate signed by the CA, carrying the correct SAN, that verifies against `ca.crt`. Client systems trust the CA and connect without warnings.

## Rollback

A misissued service certificate is replaced by issuing a new one and pointing the service at it; the old one simply stops being used. Replacing the CA itself is disruptive: every issued certificate and every client trust store has to be updated. Treat the CA key with that cost in mind.

## Follow-up

- For public-facing services, [Let's Encrypt](lets-encrypt.md) avoids the trust-distribution problem entirely.
- Track certificate expiry. A 730-day service certificate that lapses unnoticed breaks the service as surely as a misconfiguration.
