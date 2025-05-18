# How DKIM works (and why it is not a silver bullet)

DKIM operates like a digital wax seal for emails, but with more cryptography and fewer medieval vibes. Here's the 
process in plain terms:

When sending an email:

1. The sender decides which parts of the email get "sealed" - either the entire message (headers and body) or specific header fields. These chosen elements become untouchable; any alteration during transit will break the seal.

2. The sender's mail server automatically creates a cryptographic hash of these protected elements, then encrypts this hash using a private key. This encrypted hash becomes the DKIM signature, attached to the email like a tamper-evident sticker.

When receiving the email:

3. The receiving server spots the DKIM signature and checks which domain/selector combo created it (think of this like checking which wax stamp was used). It then performs a DNS lookup to retrieve the sender's public key - the only key that can decrypt that particular signature.

4. The magic happens: The receiver decrypts the signature to get the original hash, then generates its own hash of the protected email parts. If the two hashes match, the email passes inspection. If not, something's been meddled with.

The good:

* Provides proof that critical elements weren't altered in transit
* Some implementations can verify full message integrity

The reality check:

* Not widely adopted, so absence of DKIM doesn't automatically mean foul play
* Invisible to end users - you'd need to inspect email headers like a cyber detective to see it
* Doesn't stop "From:" spoofing - a message can pass DKIM while still showing a fake sender address
* Complexity wins - the technical overhead means many organizations half-implement it or skip it entirely

