# Deploying the IPA-SIEM stack: Architecture options

Here are several recommended architectures for deploying the IPA-SIEM Stack, based on different organisational 
contexts and resource levels. All are built to support forensic collection, threat detection, and incident response, 
while upholding survivor privacy and legal compliance. Each can be tailored to shelter environments, advocacy networks, 
or decentralised community deployments.

## Shelter-centric on-prem deployment (Low-tech, all-in-one box)

Best for: Shelters with reliable internal networks and a designated tech advocate or volunteer.

* Good for small shelters with no IT team
* Can operate offline or semi-connected
* Log import can be via USB if internet is risky

Architecture: Single-VM Local Shelter Deployment (Low-tech, all-in-one box)

```text
+-------------------------+             +---------------------------+
|     Shelter Laptop      |             |    Optional PîRogue       |
|  (Ubuntu VM or host OS) |             |  (Field Analysis Device)  |
|-------------------------|             |---------------------------|
| - Wazuh Manager         |             | - PiRogue OS              |
| - Elasticsearch         |             | - Packet capture tools    |
| - Kibana                |             | - USB log import          |
| - setup.sh automation   |             +---------------------------+
+-------------------------+                       |
        |                                         |
        | Secure LAN / USB log import             |
        v                                         v
+--------------------------+            +----------------------------+
| Survivor Device Logs     |            |  Field Devices (e.g.       |
| (Windows/macOS/Android)  |            |  suspected tracking phone) |
+--------------------------+            +----------------------------+

```

* One physical or virtual IPA-SIEM Server on-site

  * Runs Wazuh Manager, Elasticsearch, and Kibana
  * Hosts automated scripts (e.g., `quarantine_device.sh`, log parsers)
* Wazuh agents installed on:

  * Windows/macOS devices (direct or via USB boot toolkit)
  * Android (via Termux on rooted devices)
  * iOS (jailbroken or offline backups)
* Internal network used to route logs securely to the server
* Optional hardened PiRogue device for local analysis and field triage

Pros: Data remains on-site; strong privacy control; Cons: Requires local technical maintenance and physical security.

## Private cloud deployment (Shelter/NGO controlled)

Best for: Organisations needing remote access from multiple shelter sites or clinics.

* Remote access for multi-location organisations
* Needs strong VPN/tunnelling + encrypted backups
* Lower on-site risk, but higher opsec discipline

Architecture: Secure Cloud-Based SIEM (e.g. Hetzner)

```text
+------------------------------+
|     Encrypted Cloud VM       |
|------------------------------|
| - Wazuh Manager              |
| - Elasticsearch              |
| - Kibana                     |
| - HTTPS access (VPN optional)|
+------------------------------+
        |
        | Encrypted log transfer
        v
+------------------------------+
| Survivor Devices Anywhere    |
| (via Wazuh agent/ADB/iTunes) |
+------------------------------+
```

* A cloud-hosted virtual machine (e.g., Hetzner, DigitalOcean) running:

  * Wazuh Manager + Elasticsearch + Kibana stack
  * Encrypted VPN access for shelters
* Devices connect via secure tunnel (e.g., WireGuard)
* Logs are anonymised before transmission using local scripts or secure USB transfer

Pros: Centralised visibility across locations; no physical maintenance; Cons: Requires cloud security knowledge; must enforce strict encryption and VPN access control

## Portable analysis lab (offline-first)

Best for: Emergency triage, drop-in shelters, mobile advocacy, high-risk clients

* Ideal for field work, clinics, house calls
* No internet needed, everything local
* Data can be wiped after export if needed

Architecture: Portable “Go Bag” SIEM (Raspberry Pi or Laptop)

```text
+-----------------------------+
|   Portable Analyst Device   |
| (Linux Laptop or Pi 4)      |
|-----------------------------|
| - Wazuh Manager             |
| - Kibana (localhost only)   |
| - setup.sh portable mode    |
+-----------------------------+
        |
        | USB / Wi-Fi tethered logs
        v
+-----------------------------+
|  Survivor Device (offline)  |
+-----------------------------+
```

* Ruggedised laptop or Pi-based forensic workstation with:

  * Full IPA-SIEM stack preloaded (Wazuh, Kibana, Elasticsearch)
  * Air-gapped or firewalled to prevent external leakage
* USB boot tools used to gather data from survivor devices
* Reports stored temporarily on encrypted volume
* Can sync logs manually to a master system later

Pros: No internet required; maximum physical control; Cons: Limited by local disk space and computing power

## Decentralised advocate pods

Best for: Networks of small organisations or distributed support workers

* Multiple shelters feed anonymised data
* Central support handles triage and evidence
* Works best with dedicated tech partner

Architecture: Distributed Partner Org Setup (Shelters + Central Analyst)

```text
+--------------------------+     +--------------------------+
|  Shelter Site A          |     |  Shelter Site B          |
|--------------------------|     |--------------------------|
| - Wazuh Agent/Collector  | --> | - Wazuh Agent/Collector  |
+--------------------------+     +--------------------------+
         \                           /
          \                         /
           v                       v
           +--------------------------+
           |  Central SIEM Analyst VM |
           |--------------------------|
           | - Wazuh Manager          |
           | - Elasticsearch + Kibana |
           +--------------------------+
```

* Lightweight IPA-SIEM micro-nodes (e.g., Raspberry Pi 5 or mini PCs) deployed per advocate
* Each node handles:

  * One or two devices at a time (USB or local Wi-Fi)
  * Real-time analysis with pre-loaded rulesets
* Periodic sync to encrypted central node (monthly/weekly)

Pros: Highly flexible, low cost, resilient to infrastructure loss; Cons: Less central visibility; syncing is manual or periodic

## Hybrid community network

Best for: Larger advocacy coalitions with rotating personnel or volunteers

* For training, malware signature building, or law clinics
* Can use replayed stalkerware traces
* Must be fully sandboxed and isolated

Architecture: Lab Environment for Training or Forensics (Sandboxed)

```text
+----------------------------+
|      Research VM(s)        |
|----------------------------|
| - Wazuh Manager            |
| - Infected VM images       |
| - Log replay or emulation  |
+----------------------------+
        |
        | Export clean evidence to real SIEM
        v
+----------------------------+
| Archive / Legal Evidence   |
+----------------------------+
```

* A tiered system with:

  * One central cloud SIEM stack for coordination and long-term storage
  * Multiple field units (laptops or Pis) with preconfigured IPA-SIEM client scripts
  * Web UI for uploading manual logs if agents aren’t available

Pros: Combines best of both worlds—centralised security with local action; Cons: Requires good coordination and access controls between tiers

## Design considerations

* Data Privacy: Use full-disk encryption on all nodes. Logs should be anonymised by default unless explicit consent is obtained.
* Audit Trails: All forensic actions should generate immutable logs to support legal admissibility.
* Updates: Script-based updates (e.g., via Git or USB sync) should be regularly pushed to maintain detection accuracy.
* Threat Signatures: Shared, updated rulepacks specific to IPA surveillance patterns (e.g., “Calculator+” malware, SIM spoofing logs).

