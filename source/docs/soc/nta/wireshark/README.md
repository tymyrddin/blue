![Wireshark](/_static/images/wireshark-room-banner.png)

# Wireshark

## What is it?

Wireshark is the go-to tool for inspecting raw network traffic. It captures live packets or analyzes PCAP files, 
showing every byte sent over the wire.

## Why use it?

* Ground truth – When you need to see exactly what happened, Wireshark doesn’t abstract or summarize—it shows the data.
* Protocol savvy – Decodes 1,000+ protocols (HTTP, TCP, even obscure industrial ones).
* Troubleshooting superpower – Is the server sending RST packets? Is TLS failing? Wireshark reveals the "why."

Example: A user complains their app keeps disconnecting. Wireshark would let you:

* Filter for their IP.
* Spot retransmissions or connection resets.
* Pinpoint if the issue is network, client, or server-side.

## How use Wireshark?

* [Nmap scans](nmap.md)
* [ARP poisoning & on-path](on-path.md)
* [Identifying hosts](hosts.md)
* [Tunneling traffic](tunnels.md)
* [Clear-text protocol analysis](clear-text.md)
* [Encrypted protocol analysis](encrypted.md)
* [Hunt clear-text credentials](creds.md)
* [Firewall rules](rules.md)

----

![RootMe](/_static/images/memes/wireshark.jpg)


