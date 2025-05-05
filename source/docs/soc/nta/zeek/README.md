![Zeek](/_static/images/zeek-room-banner.png)

# Zeek

## What is it?

Zeek is an open-source network monitoring framework. Unlike an IDS that just alerts on threats, Zeek passively watches traffic and generates structured logs of what’s happening (HTTP requests, DNS queries, SSL certificates, etc.).

## Why use it?

* Sees everything – Turns raw packets into readable logs, like a secretary taking notes on every network conversation.
* No rules required – Even without custom signatures, Zeek logs let you investigate after something happens.
* Flexible as a detective – Need to track ransomware C2 traffic? Suspicious file downloads? Zeek’s scripting lets you tailor logging.

Example: A device starts beaconing to a shady IP. Zeek would have:

* The DNS query resolving that IP.
* The TLS certificate from the connection.
* Timestamps and duration—ready for analysis in tools like Brim.

## How use Zeek?

* [Network security monitoring](monitoring.md)
* [Signatures](signatures.md)
* [Scripts](scripts.md)
* [Scripts and signatures](and.md)
* [Frameworks](frameworks.md)
* [Packages](packages.md)

Case practice:

* [Anomalous DNS](dns.md)
* [Phishing](phishing.md)
* [Log4J](log4j.md)

----

![RootMe](/_static/images/memes/zeek.jpg)

