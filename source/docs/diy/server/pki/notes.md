# Certificates, chaos, and why your IoT toaster shouldn’t have HTTPS

PKI: The Beautiful Mess of Digital Trust (and Why Nothing Works Properly)

Let’s talk about Public Key Infrastructure (PKI)—the system that should make secure communication effortless but instead feels like a Rube Goldberg machine held together by duct tape and expired certificates.

## PKI? Sometimes it’s just text files and prayers

Many "simple" PKIs don’t even bother with certificates. Ever edited `~/.ssh/authorized_keys`? Congrats, you’ve configured a certificate-less PKI where trust is just a flat file and hope.

SSH’s approach: Bind public keys to usernames in a text file. No X.509 nonsense, no certificate authorities—just you, vi, and the crushing weight of responsibility.

## Asymmetric cryptography: The "you can’t have both" principle

Users get public keys (because everyone deserves to know something).

Recipients get private keys (because if everyone could decrypt, what’s the point?).

Lose the private key? Congratulations, your data is now Schrödinger’s cat—both there and not there, forever. Unless, of course, you used weak crypto (in which case, the hackers already have it).

## X.509: The standard so complex, even standards groups regret it

X.509 is what happens when a committee tries to describe a sandwich and ends up with a 300-page document on wheat taxonomy.

Want to deploy it at scale? Good luck. Use a strict, narrow profile—or spend the rest of your life debugging certificate chains.

Bonus: Web PKI (RFC 5280) is a hierarchical trust circus where Certificate Authorities (CAs) charge you money to vouch for your website. Some CAs are so profitable, they might as well sell bottled unicorn tears.

## Let’s encrypt: The hero we (sort of) deserve

"Web PKI is a cash cow!" — Some CA, probably.

Enter Let’s Encrypt: Free, automated, and open. It’s like the Robin Hood of PKI, except instead of stealing from the rich, it just annoys them by existing.

Downside? Now everyone has certificates—even that sketchy IoT toaster that keeps trying to MITM your Wi-Fi.

## The IoT/IoE PKI apocalypse

The Internet of Things (IoT)? More like the Internet of "Why Does This Light Bulb Need a Certificate?"

Medical implants, factory robots, smart fridges—all demanding confidentiality, integrity, and authentication.

Problem: We haven’t even fixed human PKI yet. Now we’re giving certificates to dishwashers that phone home to Russia.

## SSL/TLS: The protocol that refuses to die (despite its best efforts)

SSL (Secure Socket Layer) is the zombie protocol—officially dead but still shambling around, infecting systems with 
POODLE, BEAST, and DROWN.

TLS (Transport Layer Security) is what happens when we patch SSL’s endless holes and pretend it’s a new thing.

Fun fact: People still call it "SSL/TLS" because nostalgia is a powerful drug.

## Internal PKI: Because you can’t trust the outside world either

Internal PKI = Running your own mini certificate dictatorship for servers, containers, VMs, and that one intern’s laptop that keeps getting hacked.

Best practice? Use the bare minimum:

* Bind a name to a key pair.
* Decide if it can sign other certs (please don’t).
* Ignore "advanced" attributes—they’re just future vulnerabilities in disguise.

## The PKI paradox: The more we use it, the more it breaks

Revocations? Often ignored.

Expirations? Set to "sometime after I retire."

New vulnerabilities? Discovered weekly.

Yet, without PKI, we’d still be passing notes in class hoping the teacher doesn’t intercept them.
