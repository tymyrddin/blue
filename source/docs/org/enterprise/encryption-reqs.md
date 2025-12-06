# The Assassins' Guild encryption requirement

Lord Downey himself visits. This is unusual. The Assassins' Guild typically sends intermediaries. His presence 
means the matter is important.

"Ms. Dearheart," he begins, settling into a chair with predatory grace, "we wish to use your services. However, 
we have one absolute requirement: we must be certain that even you cannot read our data. Not with legal pressure. 
Not with technical capability. Not under any circumstances."

"Client-side encryption," Ponder says immediately. "You encrypt before sending data to us. We never see plaintext."

"Precisely. Can you implement this?"

Adora Belle and Ponder exchange glances. "Yes. Give us two weeks."

## What they built

Ponder architects a customer-controlled encryption system using Vault's Transit secrets engine. Each customer gets 
dedicated encryption keys. Keys never leave Vault. Vault performs encryption operations but never sees the keys 
used for data at rest.

For the Assassins' Guild: client-side encryption. Their applications encrypt data using Vault Transit engine before 
storage. Golem Trust stores only ciphertext. Decryption happens client-side when they retrieve data.

Encryption contexts provide additional security. Each contract encrypted with unique context (contract ID). 
Prevents cross-contamination.

Key hierarchy: master keys in Vault, data keys per customer, encryption keys per data classification. 
Separation of duties: Golem Trust operators cannot access customer keys.

Audit trail complete: every encryption/decryption operation logged. Who requested it, what was encrypted (metadata 
only, not plaintext), when, from where.

The Assassins' Guild conducts penetration testing. Their best inhumators (reformed, mostly) attempt to access data. 
Multiple approaches: social engineering, technical exploitation, physical access to servers. All fail.

Lord Downey signs the contract. "Acceptable. You may host our contracts."

## Runbooks

* Vault Transit engine setup
* Key hierarchy design
* Client-side encryption implementation
* Audit logging
* Key rotation procedures

