# Cuckoo sandbox

Malware analysis sandbox. Submits files or URLs to an isolated environment, executes them, and reports
on behaviour: network connections, file system changes, registry modifications, and process activity.

Cuckoo v2 is no longer actively maintained and does not install cleanly on modern Python. The actively
maintained fork is [CAPE Sandbox](https://github.com/kevoreilly/CAPEv2), which continues directly from the Cuckoo v2
codebase and extends it with configuration extraction and unpacking capabilities.

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
[cuckoo]
analysis_timeout = 120

[result_server]
ip = 0.0.0.0
port = 2042
```

Lower `analysis_timeout` for throughput, raise it (240–300) for malware that delays execution.

Edit `conf/machinery.conf` to select the virtualisation backend. On Ubuntu installs with KVM:

```
[machinery]
machinery = kvm
```

Edit `conf/reporting.conf` to enable SIEM integration. The `[misp]` and `[elasticsearch]` blocks are disabled by
default; enable the relevant one and add connection details.

## Usage

```bash
cape submit --url http://malware.example.com/evil.exe
cape submit /path/to/sample.exe
```

The web interface at port 8000 is the more common entry point for day-to-day submission.

## Integration

* Slack alerts: use the CAPE web API with webhooks.
* Splunk: parse `storage/analyses/<id>/report.json`.
Last updated: 21 May 2026
