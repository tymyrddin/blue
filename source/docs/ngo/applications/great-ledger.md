# The Great Ledger

The Great Ledger is a federated registry maintained by the Circle Sea Creature Welfare
Consortium, an Ankh-Morpork-based network of which the Home is a member. It serves as the shared
source of truth for known mythological entities across participating organisations: intake
records, rehoming history, known relatives, previous placements, and any outstanding legal
considerations that other facilities should be aware of before accepting a transfer.

Practically, it means that when a distressed chimera arrives at the door having apparently
escaped from a facility in Genua, the Home can check the Ledger before proceeding with a
full intake. It means that when the Home is considering rehoming a resident to a partner
organisation in Bonk, the Bonk facility can see the full history without requiring the
Home to produce a physical transfer dossier, which historically involved a great deal of
fax paper. It also means that when a creature claims to be arriving from somewhere reputable,
this can be verified in under five minutes rather than via a phone call to a country whose
telephony infrastructure is not always cooperative.

The Consortium operates the Ledger under a data sharing agreement signed by all member
organisations. The Home signed the current version of the agreement three years ago. There
have been two amendments since. Whether the Home has formally accepted both amendments
is a question the Head of Programmes has been asked twice and has not yet answered with
certainty.

## Technical details

The Great Ledger is hosted by the Consortium's IT partner, Cogsworth Systems, on
infrastructure in Ankh-Morpork. Access is via a web portal and a REST API that member
organisations can use to integrate the Ledger with their own systems.

The Home has the web portal access. The API integration between Bestiary and the Great
Ledger was scoped in 2022, quoted, and deferred on budget grounds. Staff who need to
cross-reference Bestiary records with the Ledger do so manually, opening both systems in
adjacent browser windows and copying information between them. This process works. It also
means that data entered into one system is not automatically reflected in the other, which
has produced discrepancies. There are currently four known cases where a resident's
rehoming status in Bestiary does not match their status in the Great Ledger. The
discrepancies are known. They have not been corrected.

Authentication to the Ledger portal uses individual accounts issued by the Consortium.
The Home has eight active accounts. The accounts were provisioned when the Home joined the
Consortium and assigned to staff at that time. Of the eight original account holders, three
have since left the Home. Their Consortium accounts were included in a deprovisioning
request sent to the Consortium's membership coordinator fourteen months ago. The coordinator
confirmed receipt. Whether the accounts were deprovisioned has not been verified, because
the Consortium does not provide member organisations with a way to view account status
without emailing the coordinator and waiting.

The Home's primary Ledger contact is listed in the Consortium's records as a staff member
who left eighteen months ago. Correspondence from the Consortium, including security
advisories and the two agreement amendments, goes to her former email address, which is
still active and forwarded to a shared mailbox that is checked inconsistently.

## What it holds and who can see it

The Great Ledger holds records contributed by all forty-seven member organisations. Each
organisation can see all records, not only their own. This is by design: the Consortium's
position is that effective cross-border rehoming and transfer management requires
comprehensive visibility, and that member organisations have accepted appropriate data
handling obligations under the sharing agreement.

The records include species data, physical descriptions, known behaviours, medical flags,
and in many cases information about why a creature left its previous placement. Some of
this information is sensitive in the conventional sense. Some of it is sensitive in less
conventional ways, such as records noting that a particular entity should not be housed
near sources of running water, or should not be informed of current events in certain
regions of Überwald, or requires that its designated handler hold a specific belief
system that the handler need not share but must be willing to perform on request.

The Home contributes records for all current and former residents. The thing in the
basement does not have a Great Ledger entry. This is not an oversight. The Consortium
was informed. The Consortium's legal team considered the matter and advised that the
relevant data fields were not designed with this category of entity in mind, and that
the Home should use its own judgement. The Home's judgement is that the bucket system
is sufficient.

## Known issues

The Ledger's session timeout is set to eight hours, which is the Consortium's default and
cannot be adjusted by member organisations. Staff who are logged in at end of day are
likely to still have an active session the following morning if their device has not been
restarted. This is noted in the Consortium's security guidance, which was circulated in a
newsletter that three of the Home's eight account holders have confirmed receiving.

The Ledger does not log which member organisation viewed a specific record. It logs that
a record was accessed, and by which account, but not what that account holder then did
with the information. The Consortium's position is that this is addressed by the data
sharing agreement. The Home's Data Protection Officer's position is more nuanced and has
been put in writing.