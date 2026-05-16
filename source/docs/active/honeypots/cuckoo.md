# Cuckoo sandbox

Malware analysis sandbox. Submits files or URLs to an isolated environment, executes them, and reports
on behaviour: network connections, file system changes, registry modifications, and process activity.

Cuckoo v2 is no longer actively maintained and does not install cleanly on modern Python. The actively
maintained fork is [CAPE Sandbox](https://github.com/kevoreilly/CAPEv2), which extends Cuckoo with
configuration extraction and unpacking capabilities and continues to receive updates.

## CAPE Sandbox

```bash
git clone https://github.com/kevoreilly/CAPEv2
cd CAPEv2
sudo ./installer/cape2.sh
```

CAPE requires a dedicated Linux host (Ubuntu 22.04 LTS is the tested base) with KVM virtualisation.
Installation is more involved than Cuckoo v2 was; the project documentation covers the prerequisites.

## Configuration (CAPE)

Edit `conf/cuckoo.conf`:

```
[result_server]
ip = 0.0.0.0
port = 2042
```

## Usage

```bash
cuckoo submit --url http://malware.example.com/evil.exe
```

## Integration

* Slack alerts: use the CAPE web API with webhooks.
* Splunk: parse `storage/analyses/<id>/report.json`.
