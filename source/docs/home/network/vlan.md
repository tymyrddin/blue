# Block IoT Internet access with VLANs (Guest Network Method)

Works on most home routers, ASUS, TP-Link, Netgear, etc.

Steps:

1. Log into your router:
   * Type your router’s IP into a browser (usually 192.168.1.1 or 192.168.0.1).
   * Default login is often admin + password (check the router’s sticker).
2. Enable "Guest Network":
   * Find Wireless Settings → Guest Network (ASUS/TP-Link) or Advanced → Guest Access (Netgear).
   * Name it "IoT Jail" (or anything memorable).
   * Check "Isolate devices" (blocks gadgets from talking to each other).
3. Block Internet Access (Optional):
   * Some routers let you restrict guest networks to local only (no web access).
   * Look for "Client Isolation" or "AP Isolation" in settings.
4. Connect IoT devices to the Guest Network:
   * Go to your smart device’s Wi-Fi settings and join "IoT Jail" instead of your main network.

Done! Now your smart bulbs/cameras can’t spy on your laptop or phone.