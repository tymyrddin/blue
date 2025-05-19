# Thug in a box (Docker)

## Why containerise Thug?

Because running malware analysis tools directly on your host is like tasting soup with your face. A Docker container 
gives Thug a nice, controlled playpen — no surprises, no infected desktops.

You can either use the official container, or roll your own.

## Using the official container

### Requirements

* [Have Docker installed on your system](https://docs.docker.com/get-started/get-docker/#installation)

### Download the latest stable container

```
$ docker pull thughoneyclient/thug
```

### Mount logs

Then mount your host `~/logs` dir and enable it to keep the logs on the host

```
$ docker run -it -v ~/logs:/logs buffer/thug
```

**Linux**

```bash
# Standard Linux (ext4/xfs)
docker run -it -v /home/user/thug_logs:/logs buffer/thug

# SELinux systems (add :Z for labeling)
docker run -it -v /home/user/thug_logs:/logs:Z buffer/thug
```

**BSD (FreeBSD)**

```bash
# FreeBSD with ZFS
docker run -it -v /usr/home/user/thug_logs:/logs:ro buffer/thug
```

**Windows**

```powershell
# PowerShell (Windows 10/11)
docker run -it -v C:\Users\YourName\thug_logs:/logs buffer/thug

# CMD (legacy systems)
docker run -it -v %USERPROFILE%\thug_logs:/logs buffer/thug
```

**macOS**

```bash
# Modern macOS (Ventura+)
docker run -it -v $HOME/thug_logs:/logs buffer/thug

# Legacy macOS (pre-Monterey)
docker run -it -v /Users/yourname/thug_logs:/logs buffer/thug
```

### Test the dockerized Thug 

Analyse random samples inside the container:

```
$ for item in $(find /opt/thug/samples/ -type f | xargs shuf -e |tail -n 20); do python /opt/thug/src/thug.py -l $item; done
```

## Roll your own container

### Step 1: Dockerfile for Thug

Create a folder (e.g. thug-container) and save the following as Dockerfile:

```
FROM python:3.12-slim

LABEL maintainer="Your Name <you@example.com>"
LABEL description="Thug Honeyclient in a container"

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
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

# Clone Thug
RUN git clone https://github.com/buffer/thug.git /opt/thug

WORKDIR /opt/thug

# Install Thug
RUN pip install .

# Create a non-root user (optional but safer)
RUN useradd -ms /bin/bash thuguser
USER thuguser

# Set a basic entrypoint
ENTRYPOINT ["thug"]
```

### Step 2: Build the container

From the same directory as your Dockerfile:

```
docker build -t thug .
```

### Step 3: Run Thug

Scan a dodgy URL (replace with your own shady specimen):

```
docker run --rm thug http://example.com
```

Or mount a local folder to store logs:

```
docker run --rm -v "$(pwd)/logs:/home/thuguser/logs" thug http://malicious-site.tld
```

### Keep it clean

If you're running this regularly:

```
alias thugscan='docker run --rm thug'
```

Now you can simply run:

```
thugscan http://bad.url
```

### Notes (I am working on these)

* This container has no network restrictions. Consider pairing with a network firewall or Docker's `--network=none` for isolation.
* Logs can be verbose. Redirect or mount volumes to avoid clutter.
* Avoid clicking the URLs yourself. Thug will take the risk for you.