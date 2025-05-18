# Packet filtering

PF is a packet filtering tool with simple syntax, user-friendliness, and extensive features. The packet filtering takes place in the kernel.  A pseudo-device, `/dev/pf`, allows userland processes to control the behaviour of the packet filter (`ioctl` interface).  There are commands to enable and disable a filter, load rule sets, add and remove individual rules or state table entries, and retrieve statistics. The most commonly used functions are covered by `pfctl`.

## Configuration resources

* [OpenBSD Handbook Packet Filter](https://www.openbsdhandbook.com/pf/)

