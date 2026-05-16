# Botnets

A botnet is a network of compromised devices under centralised control. The devices, which may include home
routers, security cameras, smart appliances, and computers, are recruited through malware infection and then
used collectively for whatever purpose the operator chooses: DDoS attacks, credential stuffing, spam campaigns,
cryptocurrency mining, or renting access to other criminals.

## Why botnets persist

Home devices make particularly reliable botnet nodes because they are left running continuously, rarely
monitored for unusual activity, and often unpatched. A home router infected in 2019 may still be actively
participating in botnet traffic. The operator sees no indication because the device functions normally for
the household; the malicious activity runs as background traffic.

The infrastructure side has also become more resilient. Botnet command-and-control servers used to be a
single point of failure; taking them down disrupted the botnet. Modern botnets use distributed and redundant
C2 infrastructure, peer-to-peer communication between bots, and fast-flux DNS, which makes takedowns more
difficult and less durable.

## The lifecycle

Recruitment happens through malware delivery, default credential exploitation on IoT devices, or drive-by
downloads. Once infected, the device registers with command-and-control infrastructure. The operator then
directs the fleet: running attacks, relaying traffic, or subdividing access to sell to other operators.

The Mirai botnet in 2016, which recruited hundreds of thousands of IoT devices using default credentials,
demonstrated how large this problem could become when devices with poor security controls are connected at
scale. The fundamental dynamic has not changed.
