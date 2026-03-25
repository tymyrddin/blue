# Deception technology

Deception technology plants false targets in the environment. When an attacker
interacts with them, the alert is immediate and high-confidence: no legitimate user
or process has any reason to touch a honeypot. It is one of the few areas where
defenders get to be mischievous.

## Why deception works

Most detection is probabilistic: "this looks suspicious". Deception is deterministic:
"nothing should ever touch this, so this touch is definitely suspicious". False
positive rate is near zero for well-placed deception assets.

It catches attackers at the reconnaissance and lateral movement phases: the moment
they start exploring the environment looking for credentials, shares, or systems,
they are likely to interact with a decoy.

## Canary tokens

Canary tokens (canarytokens.org and self-hosted equivalents) embed tracking payloads
in documents, URLs, credentials, and other files. When the token is accessed, a
callback fires.

```text
# generate a canary token for a Word document
# place it in a location an attacker would find attractive:
# - shared drives labelled "Passwords" or "Finance"
# - desktop of a high-value user
# - backup archives
# the token fires when the document is opened, even without executing macros
```

DNS canary tokens: a credential file or configuration document contains a URL
pointing to a unique subdomain. Any DNS resolution of that subdomain is an alert.

AWS canary tokens: a fake `credentials` file in `~/.aws/` or `C:\Users\user\.aws\`
with a unique access key ID. Any API call using the key generates a CloudTrail event.

```text
[default]
aws_access_key_id = AKIAIOSFODNN7CANARY1
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYCANARYKEY
```

Any attempt to use these credentials against AWS generates an alert immediately,
including the source IP, user agent, and attempted API call.

## Honey credentials

Place fake credentials in locations where an attacker doing credential harvesting
will find them. The credentials are monitored: any authentication attempt using them
is an alert.

```powershell
# create a honey account in Active Directory (disabled, monitored)
New-ADUser -Name "svc_backup_legacy" -SamAccountName "svc_backup_legacy" `
  -AccountPassword (ConvertTo-SecureString "Password123!" -AsPlainText -Force) `
  -Enabled $false

# any attempt to authenticate as this account (even if disabled) is logged
# set up alerting on Event ID 4625 (failed login) for this specific account
# also 4768/4769 (Kerberos AS-REQ / TGS-REQ) for this account
```

Honey credentials in memory: configure a process to hold credentials for a
non-existent account in memory in a format that Mimikatz will harvest. Any use of
the harvested credentials is detectable.

## Honeypots and decoy systems

Decoy hosts that appear to be high-value targets (backup servers, legacy systems,
payment processing systems). Any connection to them from an internal host is an alert.

```text
# iptables rule to alert on any connection to the honeypot
iptables -A INPUT -d HONEYPOT_IP -j LOG --log-prefix "HONEYPOT_HIT: "

# or use a dedicated honeypot platform:
# opencanary (Thinkst): easy deployment, multiple service emulators
pip install opencanary
opencanaryd --copyconfig
# configure services: ssh, http, smb, ftp, rdp
opencanaryd --start
```

OpenCanary emulates multiple services and fires alerts when any connection is made.
An internal host scanning for open services and hitting a honeypot SSH is an
immediate lateral movement indicator.

## Honey shares

A network share with an appealing name and plausible content:

```powershell
# create a share on a server (or decoy host)
New-SmbShare -Name "Finance_Archive_2024" -Path "C:\HoneyShare" -ReadAccess "Domain Users"

# place canary token documents inside
# monitor share access: Event ID 5140 (network share object was accessed)
# any access to this share is suspicious
```

The share should contain files that look valuable: spreadsheets with financial data
names, documents labelled "passwords", configuration files with fake credentials.
An attacker enumerating shares will find it attractive.

## Placing deception assets strategically

Deception that is placed randomly may be ignored or discovered. Effective placement:

- In the path of lateral movement: between the initial foothold and the target assets
- In locations where credential files are expected: `.aws/credentials`, `.ssh/`,
  `AppData\Roaming\`, shared drives
- On systems that are high-value targets (file servers, domain controllers) but only
  accessible via movement through other hosts
- In backup archives and exports that would be accessed during data collection

The deception strategy should be based on the organisation's threat model. If the
concern is an attacker who has already achieved initial access and is moving laterally,
deception assets along the likely lateral movement path are most effective.

## Limitations

Sophisticated attackers do reconnaissance before touching anything. An attacker who
maps the environment carefully before interacting with it may identify honeypots by
their lack of real traffic history, their unusual configuration, or simply by knowing
that defenders use deception.

Deception requires maintenance. A canary credential that is accidentally used by
a legitimate process, or a honeypot that generates legitimate-looking traffic,
degrades the signal quality of future alerts.

Coverage cannot be complete. Deception assets catch attackers who touch the specific
assets placed; they do not catch attackers who operate entirely within the legitimate
environment. A credential theft from a live system, replayed against a real service,
does not touch any decoy.
