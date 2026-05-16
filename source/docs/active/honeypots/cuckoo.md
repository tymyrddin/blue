# Cuckoo sandbox

Malware analysis sandbox. Submits files or URLs to an isolated environment, executes them, and reports
on behaviour: network connections, file system changes, registry modifications, and process activity.

## Installation

```bash
pip install cuckoo
cuckoo init
```

## Configuration

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

* Slack alerts: use the cuckoo-web API with webhooks.
* Splunk: parse `storage/analyses/<id>/report.json`.
