# Probe design patterns

Common probe types and their implementation patterns:

## HTTP Probes

```yaml
protocol: "tcp/http"
port: 80
send: "GET / HTTP/1.1\r\nHost: {{target}}\r\n\r\n"
receive_match: "Server:.*2\\.1\\.4"
```

## TLS Probes

```yaml
protocol: "tls"
port: 443
extract: "certificate.serial"
match_value: "00:AB:CD:EF"
```

## TCP Banner probes

```yaml
protocol: "tcp"
port: 22
receive_match: "^SSH-2\\.0.*OpenSSH_8\\.4"
```
