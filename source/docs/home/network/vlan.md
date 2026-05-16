# Network segmentation for IoT devices

IoT devices on the same network as computers and phones create a lateral movement path: a compromised
device can probe other devices on the network. A guest network or VLAN puts IoT devices on an isolated
segment.

## Using the guest network method

Works on most home routers: ASUS, TP-Link, Netgear, and similar.

1. Log into the router:
   * Type the router's IP into a browser (usually 192.168.1.1 or 192.168.0.1).
   * Credentials are often on the router's sticker.
2. Enable guest network:
   * ASUS/TP-Link: Wireless Settings → Guest Network
   * Netgear: Advanced → Guest Access
   * Name it something memorable. Enable "Isolate devices" (blocks devices from seeing each other).
3. Optionally restrict internet access:
   * Some routers allow the guest network to be restricted to local traffic only.
   * Look for "Client Isolation" or "AP Isolation" in settings.
4. Connect IoT devices to the guest network.

IoT devices on the isolated network can reach the internet (for firmware updates and cloud features)
but cannot probe computers or phones on the primary network.
