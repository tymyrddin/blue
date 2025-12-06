# Thug in a repo (Docker and VM)

## System requirements

Thug runs on Linux and supports Python 3. You’ll want a clean, sandboxed environment (e.g., a virtual machine or 
container) since you're going to be poking dodgy URLs with a stick.

Recommended OS:

* Debian / Ubuntu
* Kali Linux (Thug is included in many security-focused distros)
* Docker (optional, but handy)

## Installation

1. Get the dependencies

```
sudo apt update && sudo apt install -y git python3 python3-pip libxml2-dev libxslt1-dev zlib1g-dev libffi-dev libssl-dev
```

2. Clone Thug

```
git clone https://github.com/buffer/thug.git
cd thug
```

3. Install Python requirements. Use a virtual environment (highly recommended):

```
python3 -m venv thug-env
source thug-env/bin/activate
pip install -r requirements.txt
```

4. Configure (Optional): Edit `thug.conf` to adjust settings such as:

* User-Agent string
* Proxy settings
* Output formats (JSON, XML, SQLite)

## Basic usage

```
python thug.py -u http://example.com/suspicious
```

Or point it to a local file:

```
python thug.py -f suspicious_file.html
```

Flags worth knowing:

    -u	          URL to analyse
    -f	          Local file to analyse
    --useragent	  Choose a browser to mimic
    --json	      Output results in JSON format
    --verbose	  Chatty mode for debugging

## Safety notes

* Run Thug in a VM or container. Seriously. It’s designed to be safe, but you’re still visiting malicious content.
* Pipe traffic through a transparent proxy or network monitor (like tcpdump, Wireshark, or mitmproxy) if you want to inspect HTTP requests/responses.
* For extra flair, combine Thug with Cuckoo Sandbox or YARA rules.

## Output

By default, Thug logs:

* HTTP requests/responses
* Detected JavaScript exploits
* PDF, Flash, and Java payload indicators
* Indicators of compromise (IoCs)

Output can be redirected to JSON, SQLite, or raw logs. Great for feeding into your SIEM or just hoarding malware like 
a responsible researcher.

## Cleanup

To deactivate the virtual environment:

```
deactivate
```

To remove everything:

```
rm -rf thug thug-env
```
