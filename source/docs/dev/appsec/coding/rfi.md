# Remote file inclusion (RFI) defence

Prevention

* Disable `allow_url_include` (PHP).
* Whitelist allowed domains for imports/CDNs.

Risks

* Loading malicious JS/CSS from external domains

Example (PHP - Disable RFI):

```ini
; php.ini  
allow_url_fopen = Off  
allow_url_include = Off  
```
