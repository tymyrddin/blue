# Honeyclients: turning the tables

## The problem with passive honeypots

Traditional honeypots wait for connections. That works for attacks that probe for open services, but not
for drive-by downloads, malvertising, and other threats that are delivered through browsing rather than
direct connections.

* Zero-day exploits are often delivered via compromised websites.
* Firewall rules do nothing when the attack rides in on port 80 or 443.
* Phishing links and malicious redirects need a client to follow them.

## How honeyclients work

Client-side honeypots visit URLs rather than waiting to be visited:

* Simulate real users (browsing, clicking, form interaction).
* Visit suspicious sites in a controlled environment.
* Analyse changes to the system (new files, modified registry, new processes).

### High vs. low interaction

| Type             | Pros                   | Cons                         | Best for                  |
|------------------|------------------------|------------------------------|---------------------------|
| High-interaction | Deep forensic analysis | Slow, risky, can be detected | Research, APT tracking    |
| Low-interaction  | Fast, scalable, safer  | May miss subtle attacks      | Large-scale malware scans |

*High-interaction honeyclients are like undercover officers: excellent intelligence, but one wrong move and the cover is blown.*

## Thug

[Thug](https://github.com/buffer/thug) is a low-interaction honeyclient that emulates browser behaviour
and visits suspicious URLs in a controlled way. It simulates fetching and rendering malicious pages,
identifying exploit attempts without fully executing what it finds.

* Emulates browsers (IE, Chrome, various user-agent strings).
* Detects exploits targeting PDF, browser engines, and legacy plugin formats. Java and Flash plugins
  have not been present in mainstream browsers since the early 2020s, so Thug will not reflect current
  browser-delivered attack traffic for those formats. The detection remains relevant for analysing older
  malware samples, investigating compromise of legacy systems running embedded Java HMIs or aging
  enterprise applications, and supply chain analysis of historical payloads.
* Logs all HTTP requests, responses, and indicators of compromise.

Thug does not execute downloaded binaries or launch a real browser. It is a lightweight, scriptable way
to observe malicious behaviour at arm's length, useful when some context is needed without deploying a
full dynamic analysis suite.

Good for:

* Malware researchers.
* Incident responders investigating a suspicious URL.
* Home lab exploration.

## Tools

* [Thug in a VM](thug-repo.md)
* [Thug in a container](thug-container.md)

## DroidCollector

DroidCollector is a framework for collecting and classifying Android applications for analysis. As of
writing, the original code repository does not have an active public presence, though the dataset and
academic papers referencing it remain available.

## Resources

* [Escape from Monkey Island: Evading High-Interaction Honeyclients](https://sites.cs.ucsb.edu/~chris/research/doc/dimva11_honey.pdf) (pdf)
* [DroidCollector Framework](http://loci.ujn.edu.cn/htdocs/DroidCollector/index.html)
