# Honeyclients: Turning the tables

Honeypots have a problem. Enter honey clients and honeyports.

## The problem with passive honeypots

Traditional honeypots sit there like a pub landlord waiting for trouble to walk in—useful, but hopeless against 
drive-by downloads, malvertising, and other modern nuisances that don’t bother knocking.

* Phishing emails? Old news.
* Zero-day exploits? Often delivered via compromised websites, not attachments.
* Firewall rules? Useless when the attack rides in on port 80/443 like a Trojan horse in an SSL wrapper.

*The internet’s become a dodgy back alley, and your firewall’s just the bouncer checking IDs at the club next door.*

## How honeyclients fight back

These client-side honeypots don’t wait—they go hunting.

### The basics

* Mimic real users (browsing, clicking, even "typing" in forms).
* Visit sketchy sites so you don’t have to.
* Analyse changes (new files? Modified registry? Uh-oh).

### High vs. low interaction

| Type	             | Pros	                   | Cons	                         | Best for                  |
|-------------------|-------------------------|-------------------------------|---------------------------|
| High-interaction	 | Deep forensic analysis	 | Slow, risky, easily detected	 | Research, APT tracking    |
| Low-interaction	  | Fast, scalable, safer	  | May miss subtle attacks	      | Large-scale malware scans |

*High-interaction honeyclients are like undercover cops—great intel, but one wrong move and they’re compromised.*

## Thug: The Python menace

[Thug](https://github.com/buffer/thug) is a low-interaction honeyclient designed to emulate browser behaviour and 
visit suspicious URLs safely (well—safer than using your actual browser). It simulates the fetching and rendering of 
malicious web pages, identifying exploit attempts without getting itself entirely owned in the process.

* Emulates browsers (IE, Chrome, even user-agent quirks).
* Detects exploits (Java, Flash, PDF—all the classics).
* Logs everything (because if you’re visiting malware hubs, you’d better take notes).

Thug isn’t a full browser sandbox—it doesn’t execute binaries or launch browsers—but it’s a lightweight, 
scriptable way to observe malicious behaviour at arm’s length. It’s particularly useful when you want 
just enough context to spot a threat, without deploying full dynamic analysis suites.

Perfect for:

* Malware researchers who value sleep over debugging infected containers and VMs
* Incident responders
* Home lab tinkerers
* Anyone who’s ever thought "I wonder what’s on this shady URL..."
* Digital sadists who enjoy analysing shady URLs

*Thug: Because manually clicking malware links is just asking for a bad time.*

## Tools of the trade

* [Thug in a repo (VM)](thug-repo.md)
* [Thug in a box (Docker)](thug-container.md)

## DroidCollector: APK spelunking without the rash

DroidCollector is what happens when you want to know what that dodgy Android app does—without giving it the keys to 
your actual phone.

As of now (2025), the original DroidCollector framework—a tool designed for collecting and classifying Android applications—
does not appear to have an active or publicly available code repository on GitHub. While references to its dataset 
and academic papers exist, the source code itself isn't readily accessible.

Been waiting for it. If it takes too long maybe I'll just build one. Feels like a fun challenge.

## Resources

* [Escape from Monkey Island: Evading High-Interaction Honeyclients](https://sites.cs.ucsb.edu/~chris/research/doc/dimva11_honey.pdf) (pdf)
* [DroidCollector Framework](http://loci.ujn.edu.cn/htdocs/DroidCollector/index.html)

