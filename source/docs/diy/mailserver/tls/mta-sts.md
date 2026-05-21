# MTA-STS configuration

MTA-STS lets a domain publish a policy instructing other mail servers to require authenticated TLS
when delivering email. Sending servers cache the policy and refuse to deliver over unencrypted or
unauthenticated connections. This closes the gap where STARTTLS is opportunistic and can be
stripped by an active attacker.

## Policy file

Create the policy file at a path you can serve over HTTPS:

```
version: STSv1
mode: testing
mx: mail.example.com
max_age: 86400
```

`mode: testing` logs failures without enforcing them. Switch to `enforce` once satisfied that
legitimate delivery is unaffected. `max_age` is in seconds; 86400 is one day, suitable during
initial deployment. Increase to 604800 (one week) or higher once stable.

## Serving the policy

The policy needs to be accessible at `https://mta-sts.example.com/.well-known/mta-sts.txt`. The
`mta-sts.` subdomain is required by the standard. Nginx configuration:

```nginx
server {
    listen 443 ssl;
    server_name mta-sts.example.com;

    ssl_certificate     /etc/letsencrypt/live/mta-sts.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mta-sts.example.com/privkey.pem;

    location /.well-known/mta-sts.txt {
        alias /etc/nginx/mta-sts.txt;
        add_header Content-Type text/plain;
    }
}
```

Obtain the certificate first:

```bash
certbot certonly --nginx -d mta-sts.example.com
```

## DNS records

Publish a TXT record advertising the policy:

```
_mta-sts.example.com.  IN  TXT  "v=STSv1; id=20240101000000"
```

The `id` value identifies the policy version. Receiving servers fetch a fresh policy whenever `id`
changes. Update it each time the policy file changes; a timestamp in `YYYYMMDDHHmmss` format
works well.

Optionally, add SMTP TLS reporting to receive failure notifications by email:

```
_smtp._tls.example.com.  IN  TXT  "v=TLSRPTv1; rua=mailto:tls-reports@example.com"
```

## Verification

After DNS propagates, confirm the policy is reachable and parseable:

```bash
curl https://mta-sts.example.com/.well-known/mta-sts.txt
dig TXT _mta-sts.example.com
```

For background on the standard, see
[Introducing MTA Strict Transport Security](https://www.hardenize.com/blog/mta-sts).
