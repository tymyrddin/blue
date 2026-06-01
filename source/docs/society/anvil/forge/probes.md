# Probe design patterns

The probe types that come up most often, and the shape each one takes in a fingerprint. Three patterns cover the bulk of what passive identification needs.

## HTTP probes

```yaml
protocol: "tcp/http"
port: 80
send: "GET / HTTP/1.1\r\nHost: {{target}}\r\n\r\n"
receive_match: "Server:.*2\\.1\\.4"
```

## TLS probes

```yaml
protocol: "tls"
port: 443
extract: "certificate.serial"
match_value: "00:AB:CD:EF"
```

## TCP banner probes

```yaml
protocol: "tcp"
port: 22
receive_match: "^SSH-2\\.0.*OpenSSH_8\\.4"
```
