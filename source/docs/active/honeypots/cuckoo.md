# Cuckoo sandbox – Malware’s worst Airbnb

*Where malware checks in… but doesn’t check out.*

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

*The only sandbox where ‘beach’ means ‘beachhead exploit’.*

## Integration

* Slack alerts: Use cuckoo-web API + webhooks
* Splunk: Parse `storage/analyses/<id>/report.json`