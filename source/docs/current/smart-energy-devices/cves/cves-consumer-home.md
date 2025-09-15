# Example CVEs for consumer / home IoT

| CVE / Issue                                                                   | Device type / vendor                               | Vulnerability summary                                                                                     |
|-------------------------------------------------------------------------------|----------------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| [CVE-2022-47100](https://nvd.nist.gov/vuln/detail/CVE-2022-47100)             | Sengled Smart Bulb 0x0000024                       | Allows attackers to execute a factory reset via a crafted IEEE 802.15.4 frame.                            |
| [CVE-2023-38907](https://nvd.nist.gov/vuln/detail/CVE-2023-38907)             | TP-Link Smart Bulb (Tapo series L530, L510E, etc.) | Replay old messages encrypted with a still valid session key.                                             |
| [CVE-2023-33768](https://nvd.nist.gov/vuln/detail/CVE-2023-33768)             | Belkin Wemo Smart Plug WSP080                      | Incorrect signature verification in firmware update allows Denial of Service via a crafted firmware file. |
| [CVE-2024-46041](https://nvd.nist.gov/vuln/detail/CVE-2024-46041)             | IoT Haat Smart Plug IH-IN-16A-S v5.16.1            | Authentication bypass by replay / capture-replay.                                                         |
| [CVE-2018-6692](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2018-6692) | Belkin Wemo Insight Smart Plug                     | Buffer overflow in UPnP handler allows remote attackers to bypass local security protections.             |


##  Patterns

* Firmware update / signing weaknesses are frequent: poor signature verification, or firmware update paths that can be hijacked. Always check the update mechanism.
* Replay / capture-replay attacks are common, especially when session keys are weak, reused, or when old/encrypted messages can still be reprocessed. Look for freshness / nonce / timestamp protections.
* Buffer overflows / parsing vulnerabilities in web APIs, even in simple form (friendly name fields, HTTP handlers, UPnP). These often lead to remote code execution or device compromise.
* Default credentials or weak authentication are often involved—either none, or insufficient checks between cloud vs local vs Bluetooth/Zigbee.
* Protocol weaknesses (Zigbee, WiFi, mesh wireless) are frequently exploited by crafted radio / frame attacks (e.g. the Sengled bulb via IEEE 802.15.4). So [the lab](../lab.md) should include wireless frame injection / crafted frame tools.

