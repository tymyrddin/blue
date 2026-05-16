# Thug from the repository

## System requirements

Thug runs on Linux and requires Python 3. Run it in a sandboxed environment (a virtual machine or
container), since the tool visits malicious content by design.

Recommended:

* Debian / Ubuntu
* Kali Linux (Thug is included in several security-focused distributions)
* Docker (see the container guide for an alternative setup)

## Installation

1. Install dependencies:

```
sudo apt update && sudo apt install -y git python3 python3-pip libxml2-dev libxslt1-dev zlib1g-dev libffi-dev libssl-dev
```

2. Clone the repository:

```
git clone https://github.com/buffer/thug.git
cd thug
```

3. Install into a virtual environment:

```
python3 -m venv thug-env
source thug-env/bin/activate
pip install -r requirements.txt
```

4. Configure (optional): edit `thug.conf` to adjust:

* User-Agent string
* Proxy settings
* Output formats (JSON, XML, SQLite)

## Basic usage

```
python thug.py -u http://example.com/suspicious
```

Or point at a local file:

```
python thug.py -f suspicious_file.html
```

Flags worth knowing:

    -u            URL to analyse
    -f            Local file to analyse
    --useragent   Browser to emulate
    --json        Output results in JSON
    --verbose     Detailed output for debugging

## Safety

Run Thug in a VM or container. It is designed to be safe, but visiting malicious content at scale
still carries some risk. Routing traffic through a transparent proxy or network monitor (tcpdump,
Wireshark, mitmproxy) allows inspection of HTTP requests and responses independently of Thug's own
logging. Combining Thug output with CAPE Sandbox or YARA rules adds depth to the analysis.

## Output

By default, Thug logs:

* HTTP requests and responses
* Detected JavaScript exploits
* PDF and Java payload indicators
* Indicators of compromise (IoCs)

Output can be directed to JSON, SQLite, or raw logs, suitable for ingestion into a SIEM.

## Cleanup

Deactivate the virtual environment:

```
deactivate
```

Remove the installation:

```
rm -rf thug thug-env
```
