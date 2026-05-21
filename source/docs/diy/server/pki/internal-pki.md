# Internal PKI

An internal PKI consists of a Certificate Authority (CA) certificate and key used to sign server and client certificates, plus a separate certificate and private key for the server and each client.

The most secure approach is to generate the CA keys on a machine that is not connected to the internet and kept in a secure location.

## Master Certificate Authority (CA)

[easy-rsa](https://github.com/OpenVPN/easy-rsa) is a CLI utility for building and managing a PKI CA. Version 3 is the current release; v2 commands (`build-ca`, `clean-all`, etc.) do not exist in v3.

Install and create a working directory:

```bash
apt install easy-rsa
make-cadir /etc/openvpn/easy-rsa
cd /etc/openvpn/easy-rsa
```

Initialise the PKI and build the CA. `nopass` skips the CA passphrase; omit it if the CA key needs passphrase protection:

```bash
./easyrsa init-pki
./easyrsa build-ca nopass
```

The CA certificate is written to `pki/ca.crt`.

## Server certificate

```bash
./easyrsa gen-req servername nopass
./easyrsa sign-req server servername
```

Confirm the details and type `yes` when prompted. The signed certificate is at `pki/issued/servername.crt`; the key is at `pki/private/servername.key`.

## Client certificates

Each client gets its own certificate and key:

```bash
./easyrsa gen-req clientname nopass
./easyrsa sign-req client clientname
```

Repeat for each client, substituting a distinct name each time. Certificates are in `pki/issued/`; keys are in `pki/private/`.

## Diffie-Hellman parameters

```bash
./easyrsa gen-dh
```

This writes `pki/dh.pem`. The operation takes a few minutes.

## Distributing keys

Copy the relevant files to each machine using a secure method such as `scp`:

- To the server: `pki/ca.crt`, `pki/dh.pem`, `pki/issued/servername.crt`, `pki/private/servername.key`
- To each client: `pki/ca.crt`, `pki/issued/clientname.crt`, `pki/private/clientname.key`

## A more secure workflow

The approach above generates all keys on one machine. A more secure variant generates keys on each machine, submits a Certificate Signing Request (CSR) to the CA machine, and transfers only the signed certificate back. The private key never leaves the machine it was generated on. The easy-rsa [quickstart documentation](https://github.com/OpenVPN/easy-rsa/blob/master/README.quickstart.md) covers this flow.
