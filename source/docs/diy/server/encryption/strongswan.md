# strongSwan

strongSwan is the standard IKEv2/IPsec implementation on Linux, used for both site-to-site tunnels
and road warrior (mobile client) configurations. The modern configuration format uses
`swanctl.conf`; the older `ipsec.conf` format still works but is not covered here.

## Installation

```bash
apt install strongswan strongswan-pki charon-systemd
```

## Road warrior (mobile clients with username/password)

This setup accepts connections from any client using EAP-MSCHAPv2 credentials. Clients receive a
full tunnel (all traffic routed through the VPN).

### Generating a CA and server certificate

```bash
# CA key and self-signed certificate
pki --gen --type rsa --size 4096 --outform pem > caKey.pem
pki --self --ca --lifetime 3650 --in caKey.pem \
    --dn "CN=VPN CA" --outform pem > caCert.pem

# Server key and certificate signed by the CA
pki --gen --type rsa --size 2048 --outform pem > serverKey.pem
pki --issue --lifetime 1825 \
    --cacert caCert.pem --cakey caKey.pem \
    --dn "CN=vpn.example.com" --san vpn.example.com \
    --flag serverAuth --outform pem < serverKey.pem > serverCert.pem
```

### Installing certificates

```bash
cp caCert.pem    /etc/swanctl/x509ca/
cp serverCert.pem /etc/swanctl/x509/
cp serverKey.pem  /etc/swanctl/private/
```

### /etc/swanctl/swanctl.conf

```
connections {
    rw {
        local_addrs = 203.0.113.1   # server public IP

        local {
            auth = pubkey
            certs = serverCert.pem
            id = "vpn.example.com"
        }
        remote {
            auth = eap-mschapv2
            eap_id = %any
        }
        children {
            rw {
                local_ts = 0.0.0.0/0, ::/0
                esp_proposals = aes256gcm16-x25519, aes128gcm16-x25519
            }
        }
        version = 2
        proposals = aes256-sha256-x25519, aes128-sha256-x25519
    }
}

secrets {
    eap-alice {
        id = alice
        secret = "a-strong-passphrase"
    }
    eap-bob {
        id = bob
        secret = "another-strong-passphrase"
    }
}
```

### Enabling and loading

```bash
systemctl enable --now strongswan
swanctl --load-all
```

Client devices receive the CA certificate (`caCert.pem`) and connect using the server hostname,
username, and password. iOS, Android, macOS, and Windows all support IKEv2 natively.

### Checking active connections

```bash
swanctl --list-sas
swanctl --list-conns
```

## Site-to-site and certificate-based client authentication

For site-to-site tunnels between two strongSwan gateways, or for client certificates instead of
username/password, see the [strongSwan documentation](https://www.strongswan.org/documentation.html).
The configuration structure is the same; the `remote` block changes from EAP to `pubkey` and
each peer supplies a certificate.