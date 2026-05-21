# Mail authentication gaps

Each control in the mail authentication stack has a specific failure mode when absent or misconfigured. Some gaps are exploitable by any sender; others require access to particular infrastructure. The scenarios below name the gap, describe what it enables, and identify which control closes it.

## DMARC absent

SPF and DKIM both pass. The sending IP is authorised and the message is signed. Nothing ties either authenticated domain to the From header the recipient sees. An attacker signs a message with a DKIM key for their own domain and sets the visible From address to a senior executive at the target. The message passes DKIM; receiving servers have no policy to enforce alignment against the From header. The spoofed executive email lands in the inbox unchallenged.

DMARC at `p=quarantine` or `p=reject` with alignment enforced closes this.

## DMARC at p=none

The domain publishes DMARC. Aggregate reports arrive. Spoofed mail still delivers. `p=none` is an observation mode, not an enforcement mode; nothing happens to mail that fails alignment. An attacker running a phishing campaign against the domain's customers generates entries in the next aggregate report and nothing else. The domain owner learns about it after the campaign has run.

Promoting to `p=quarantine` and then `p=reject`, using aggregate reports to confirm legitimate streams pass first, closes this.

## MTA-STS in testing mode

The policy exists, the subdomain resolves, and the policy file is served correctly. `mode: testing` means violations are logged but delivery proceeds regardless. A network attacker strips the STARTTLS advertisement; the sending server sees a policy that declares TLS required, finds the receiving server is not offering it, logs the violation, and delivers the message in plaintext anyway. The policy is cosmetic.

Changing `mode` to `enforce` once the certificate and TLS configuration are confirmed stable closes this.

## SPF without DKIM

A message forwarded through a mailing list arrives carrying the forwarding server's IP, not the original sender's. SPF fails for the original domain because the forwarding server is not listed. Without a DKIM signature to fall back on, DMARC alignment fails too. Legitimate mail forwarded from the domain is indistinguishable from spoofed mail at the receiving end. SPF alone cannot survive the forwarding path.

Deploying DKIM gives DMARC a second alignment path that travels with the message through forwarding.

## SPF record ending with +all

`+all` authorises every IP address on the internet to send as the domain. The SPF record is syntactically valid and present in DNS; it simply means nothing. Any server passes SPF for the domain. The record is frequently introduced while troubleshooting delivery problems and never cleaned up, leaving a permanently open door.

Replacing `+all` with the specific sending infrastructure mechanisms and ending with `~all` or `-all` closes this.

## DKIM key not rotated

DKIM has no built-in expiry. A selector published years ago and never replaced remains valid indefinitely. A 1024-bit key is factorable with current resources; a compromised private key signs mail that passes DKIM verification for every domain using that selector until the selector is explicitly revoked. There is no automatic signal to receivers that the key is stale.

Rotating to 2048-bit or Ed25519 keys on a regular cycle and retiring old selectors closes this.

## DANE published without DNSSEC

A TLSA record exists in DNS. The zone is not DNSSEC-signed. Sending servers that implement DANE cannot verify the authenticity of the TLSA record: the chain of trust from the root to the record does not exist. They fall back to opportunistic TLS or fail the validation check entirely. The TLSA record is present and unverifiable; the downgrade protection it was intended to provide is absent.

Signing the zone with DNSSEC before publishing TLSA records closes this. DANE without DNSSEC is the record without the lock.
