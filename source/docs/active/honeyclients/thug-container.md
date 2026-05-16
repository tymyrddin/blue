# Thug in a container

Running Thug directly on the host works, but visiting malicious content at scale creates risk of
something escaping the tool's sandboxing. A container keeps Thug in an isolated environment with
controlled network access and a clean filesystem on each run.

## Using the official container

### Requirements

[Docker installed on the system](https://docs.docker.com/get-started/get-docker/#installation)

### Pull the container

```
$ docker pull thughoneyclient/thug
```

### Mount logs to the host

```
$ docker run -it -v ~/logs:/logs buffer/thug
```

Linux:

```bash
# Standard Linux (ext4/xfs)
docker run -it -v /home/user/thug_logs:/logs buffer/thug

# SELinux systems
docker run -it -v /home/user/thug_logs:/logs:Z buffer/thug
```

BSD (FreeBSD):

```bash
docker run -it -v /usr/home/user/thug_logs:/logs:ro buffer/thug
```

Windows:

```powershell
# PowerShell
docker run -it -v C:\Users\YourName\thug_logs:/logs buffer/thug

# CMD
docker run -it -v %USERPROFILE%\thug_logs:/logs buffer/thug
```

macOS:

```bash
docker run -it -v $HOME/thug_logs:/logs buffer/thug
```

### Test the containerised Thug

Analyse samples from the built-in set:

```
$ for item in $(find /opt/thug/samples/ -type f | xargs shuf -e |tail -n 20); do python /opt/thug/src/thug.py -l $item; done
```

## Building a custom container

### Dockerfile

Create a directory (e.g. `thug-container`) and save this as `Dockerfile`:

```
FROM python:3.12-slim

LABEL maintainer="Your Name <you@example.com>"
LABEL description="Thug Honeyclient in a container"

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    git \
    libssl-dev \
    libffi-dev \
    build-essential \
    libxml2-dev \
    libxslt1-dev \
    zlib1g-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/buffer/thug.git /opt/thug

WORKDIR /opt/thug

RUN pip install .

RUN useradd -ms /bin/bash thuguser
USER thuguser

ENTRYPOINT ["thug"]
```

### Build

```
docker build -t thug .
```

### Run

```
docker run --rm thug http://example.com
```

With a local log directory:

```
docker run --rm -v "$(pwd)/logs:/home/thuguser/logs" thug http://malicious-site.tld
```

For repeated use:

```
alias thugscan='docker run --rm thug'
```

## Docker Compose setup

Create a directory `thug-lab` containing a `Dockerfile`:

```
FROM python:3.11-slim

RUN apt-get update && \
    apt-get install -y git libxml2-dev libxslt1-dev zlib1g-dev libffi-dev build-essential && \
    pip install --upgrade pip && \
    pip install thug

RUN mkdir /logs

WORKDIR /app
ENTRYPOINT ["thug"]
```

And a `docker-compose.yml`:

```
services:
  thug:
    build: .
    volumes:
      - ./urls.txt:/app/urls.txt:ro
      - ./logs:/logs
    command: ["-l", "INFO", "-o", "/logs", "-n", "-F", "/app/urls.txt"]
```

This runs Thug with INFO-level logging, writes output to `./logs/`, and scans the URLs in `urls.txt`.

## Batch scan script

`scan.sh`:

```
#!/bin/bash

echo "[*] Starting Thug container for batch scanning..."

docker-compose up --build --abort-on-container-exit

echo "[*] Logs written to ./logs/"
```

```
chmod +x scan.sh
./scan.sh
```

## Sample `urls.txt`

```
http://example.com/malware
http://dodgydomain.co/phish
http://127.0.0.1:8000/test
```

## Reading the logs

The `logs/` directory contains one file per URL, timestamped. Each records HTTP headers,
detected behaviours, and JavaScript activity.

## Network isolation

These containers have no outbound network restrictions by default. For analysis work, pair with a
network firewall or run with `--network=none` and route traffic through a monitored proxy.
