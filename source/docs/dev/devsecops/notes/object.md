# Securing object storage

Each cloud provider has its own implementation of object storage. The basic idea is the same:

* Object storage is a special type of storage that is meant to store data.
* Files (or objects) are stored inside buckets (these are logical concepts such as directories or logical containers).
* Access to files on object storage is either done through the HTTP(S) protocol API via web command-line tools or programmatically using SDK tools.
* Object storage is not meant to store operating systems or databases (please refer to the Securing block storage section).

## Related

- [AWS: AWS: The bill that never ends](../aws/estimated-costs.md)
- [AWS: AWS lock-in assessment](../aws/lock-in.md)
- [Azure: Azure: Nice dashboard, shame about the costs](../azure/estimated-costs.md)
- [Azure: Microsoft Azure lock-in assessment](../azure/lock-in.md)
- [GCP: GCP: Free-tier until it is not](../gcp/estimated-costs.md)
- [GCP: Google Cloud (GCP) lock-in assessment](../gcp/lock-in.md)
- [On-prem: On-Prem @ Hetzner cloud costs "DIY, but actually sane"](../on-prem/estimated-costs.md)
- [On-prem: On-prem/Alternative clouds (Hetzner, OVH, etc.) lock-in assessment](../on-prem/lock-in.md)

