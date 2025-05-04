# Secure caching

Best practices

* Cache-Control Headers – Prevent sensitive data caching (no-store, private).
* Redis/Memcached Security – Enable TLS + authentication.

Risks

* Cache poisoning
* Side-channel attacks

Example (HTTP Headers):

```
Cache-Control: no-store, must-revalidate  
```
