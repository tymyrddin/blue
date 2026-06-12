# Reducing network attack surface

Network exposure is reduced by eliminating unnecessary services, hardening protocol configurations, and enforcing authentication where protocols currently trust by default. The specific controls below map to the attack techniques documented in the network notes and runbooks.

## Layer 2 hardening

Dynamic ARP inspection validates ARP packets against a trusted DHCP snooping binding table, dropping ARP replies where the claimed IP-to-MAC mapping does not match a known DHCP lease. This prevents ARP poisoning attacks that rely on sending gratuitous ARP replies.

```
! Cisco IOS
ip arp inspection vlan 10,20,30
interface GigabitEthernet0/1
 ip arp inspection limit rate 100
```

Enable DHCP snooping first, as DAI uses its binding table:

```
ip dhcp snooping
ip dhcp snooping vlan 10,20,30
interface GigabitEthernet0/1
 ip dhcp snooping trust  ! Only on uplinks/DHCP server ports
```

Disable DTP on all non-trunk ports to prevent switch spoofing VLAN hopping:

```
interface GigabitEthernet0/1
 switchport mode access
 switchport nonegotiate
```

BPDU guard prevents unauthorised switches from participating in STP:

```
interface GigabitEthernet0/1
 spanning-tree bpduguard enable
```

## Disabling LLMNR and NBT-NS

LLMNR and NBT-NS provide no security benefit that cannot be provided by properly functioning DNS. Disabling them eliminates the primary mechanism for Responder-style credential capture on Windows networks.

Group Policy to disable LLMNR:

```
Computer Configuration > Administrative Templates > Network > DNS Client
  Turn off multicast name resolution = Enabled
```

NBT-NS is disabled per-adapter through DHCP option 001 or registry:

```powershell
# Disable NBT-NS via registry on all adapters
Get-WmiObject -Class Win32_NetworkAdapterConfiguration |
  Where-Object {$_.IPEnabled -eq $true} |
  ForEach-Object {$_.SetTcpipNetbios(2)}
```

## SMB signing

SMB signing authenticates every SMB message with a cryptographic signature, preventing NTLM relay attacks against SMB. Requiring it on all domain controllers and enforcing it across domain-joined workstations and servers via Group Policy is the standard baseline.

```
Computer Configuration > Windows Settings > Security Settings > Local Policies > Security Options
  Microsoft network client: Digitally sign communications (always) = Enabled
  Microsoft network server: Digitally sign communications (always) = Enabled
```

## Kerberos hardening

Managed service accounts and group managed service accounts use 240-character automatically rotated passwords, making Kerberoasting infeasible even if tickets are captured. Migrating service accounts that do not require legacy authentication to gMSA is worth prioritising.

Enforce AES-only Kerberos encryption on sensitive accounts:

```powershell
Set-ADUser -Identity svcaccount -KerberosEncryptionType AES128,AES256
```

Pre-authentication is required on all accounts. Accounts with the `DONT_REQ_PREAUTH` flag are AS-REP roastable:

```powershell
Get-ADUser -Filter {DoesNotRequirePreAuth -eq $true} |
  Set-ADAccountControl -DoesNotRequirePreAuth $false
```

## Wireless security

WPA3 is the reasonable minimum for any new wireless deployment. For existing WPA2 deployments, PMF (Protected Management Frames) is worth enabling to prevent deauthentication frame injection. WPA2 networks use CCMP rather than TKIP.

For enterprise wireless using 802.1X, clients validate the RADIUS server certificate. Deploy the corporate CA certificate to clients and configure the supplicant to reject connections to servers presenting unexpected certificates. Without this, rogue AP attacks capturing MSCHAPv2 exchanges are trivial.

## Network segmentation and routing controls

BCP 38 egress filtering at network boundaries drops packets with source addresses that do not belong to the originating prefix, preventing IP spoofing across provider boundaries. Applying equivalent controls at internal segment boundaries extends this protection inward.

## BGP origin validation

A route-origin hijack works because the routing system trusts whatever a registry announces. Two controls answer it, one on the announcing side and one on the receiving side.

On the announcing side, every prefix an organisation originates is covered by a published Route Origin Authorisation (ROA) in the RPKI, binding the prefix to its legitimate origin AS and a maximum prefix length. A ROA with a tight `maxLength` denies an attacker the more-specific announcement, a /24 carved out of an announced /20, that wins the route by being longer.

On the receiving side, Route Origin Validation (ROV) drops or de-preferences any route whose origin the RPKI marks invalid, before it can become the preferred path. ROV depends on a local validator (Routinator, OctoRPKI, or `rpki-client`) feeding validated payloads to the routers over RTR.

```
! Cisco IOS-XR: validate against RPKI and let invalids lose path selection
router bgp 65000
 rpki server 10.0.0.2
  transport tcp port 3323
 address-family ipv4 unicast
  bgp bestpath origin-as use validity
```

Inbound prefix filters and a maximum-prefix limit per peer bound the damage where validation is unavailable: a peer that suddenly announces far more prefixes than its baseline, or a prefix outside an agreed list, is refused rather than accepted.

```
! Cisco IOS: per-peer guards
router bgp 65000
 neighbor 192.0.2.1 prefix-list CUSTOMER-IN in
 neighbor 192.0.2.1 maximum-prefix 500 90 restart 30
```

## IPv6 first-hop security

IPv6 address autoconfiguration trusts the local segment by default: a host accepts the first Router Advertisement it hears, including the gateway, the on-link prefix, and, where the RDNSS option is present, the resolver it names. A rogue RA or a rogue DHCPv6 server on the segment therefore reroutes traffic or redirects name resolution with no exploit at all. The controls below restore the IPv4-equivalent first-hop protections to IPv6, which dual-stack networks frequently leave off.

RA Guard drops Router Advertisements on access ports, permitting them only on the ports where the legitimate routers live.

```
! Cisco IOS: RA Guard on host-facing ports
ipv6 nd raguard policy HOST-PORTS
 device-role host
interface GigabitEthernet0/1
 ipv6 nd raguard attach-policy HOST-PORTS
```

DHCPv6 Guard does the same for DHCPv6, dropping server-sourced messages (Advertise, Reply) on ports that are not the authorised server's.

```
! Cisco IOS: DHCPv6 Guard on host-facing ports
ipv6 dhcp guard policy HOST-PORTS
 device-role client
interface GigabitEthernet0/1
 ipv6 dhcp guard attach-policy HOST-PORTS
```

IPv6 Snooping builds a binding table of legitimate address-to-port mappings from observed NDP and DHCPv6, the IPv6 equivalent of DHCP snooping, and is the foundation the guards and any source-guard policy rest on.

```
! Cisco IOS: IPv6 snooping
ipv6 snooping policy SNOOP
interface GigabitEthernet0/1
 ipv6 snooping attach-policy SNOOP
```

Where the switching layer cannot enforce these, host RA acceptance can be constrained to a known link-local gateway, but dropping the rogue advertisement at the port is the stronger control.
