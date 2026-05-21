# DKIM: not a silver bullet

DKIM operates as a cryptographic signature for emails. The process:

When sending an email:

1. The sender decides which parts of the email get "sealed" - either the entire message (headers and body) or specific header fields. These chosen elements become untouchable; any alteration during transit will break the seal.

2. The sender's mail server creates a cryptographic hash of these protected elements, then encrypts this hash using a private key. This encrypted hash becomes the DKIM signature, appended to the email headers.

When receiving the email:

3. The receiving server reads the DKIM signature and identifies the domain/selector pair that created it, then performs a DNS lookup to retrieve the sender's public key.

4. The receiver decrypts the signature to recover the original hash, then generates its own hash of the protected email parts. Matching hashes confirm nothing was altered in transit.

The good:

* Provides proof that critical elements weren't altered in transit
* Some implementations can verify full message integrity

The reality check:

* Increasingly required by major providers (Gmail and Yahoo now enforce it for bulk senders), though absence alone is not conclusive evidence of foul play in other contexts
* Invisible to end users; verification requires inspecting raw email headers
* Doesn't stop "From:" spoofing - a message can pass DKIM while still showing a fake sender address
* Complexity wins - the technical overhead means many organisations half-implement it or skip it entirely

