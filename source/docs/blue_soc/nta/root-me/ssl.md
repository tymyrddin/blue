# SSL HTTP exchange

[root-me challenge SSL - HTTP Exchange](https://www.root-me.org/en/Challenges/Network/SSL-HTTP-exchange): This challenge comes from the 19th DEFCON CTF’s qualification (pkt300).

CLUE : "google is your friend : inurl:server.pem..."

----

Google Dorking: 

    inurl:server.pem apple intext:-----BEGIN RSA PRIVATE KEY-----

```text
-----BEGIN CERTIFICATE-----
MIIDBjCCAm+gAwIBAgIBATANBgkqhkiG9w0BAQQFADB7MQswCQYDVQQGEwJTRzER
MA8GA1UEChMITTJDcnlwdG8xFDASBgNVBAsTC00yQ3J5cHRvIENBMSQwIgYDVQQD
ExtNMkNyeXB0byBDZXJ0aWZpY2F0ZSBNYXN0ZXIxHTAbBgkqhkiG9w0BCQEWDm5n
cHNAcG9zdDEuY29tMB4XDTAwMDkxMDA5NTEzMFoXDTAyMDkxMDA5NTEzMFowUzEL
MAkGA1UEBhMCU0cxETAPBgNVBAoTCE0yQ3J5cHRvMRIwEAYDVQQDEwlsb2NhbGhv
c3QxHTAbBgkqhkiG9w0BCQEWDm5ncHNAcG9zdDEuY29tMFwwDQYJKoZIhvcNAQEB
BQADSwAwSAJBAKy+e3dulvXzV7zoTZWc5TzgApr8DmeQHTYC8ydfzH7EECe4R1Xh
5kwIzOuuFfn178FBiS84gngaNcrFi0Z5fAkCAwEAAaOCAQQwggEAMAkGA1UdEwQC
MAAwLAYJYIZIAYb4QgENBB8WHU9wZW5TU0wgR2VuZXJhdGVkIENlcnRpZmljYXRl
MB0GA1UdDgQWBBTPhIKSvnsmYsBVNWjj0m3M2z0qVTCBpQYDVR0jBIGdMIGagBT7
hyNp65w6kxXlxb8pUU/+7Sg4AaF/pH0wezELMAkGA1UEBhMCU0cxETAPBgNVBAoT
CE0yQ3J5cHRvMRQwEgYDVQQLEwtNMkNyeXB0byBDQTEkMCIGA1UEAxMbTTJDcnlw
dG8gQ2VydGlmaWNhdGUgTWFzdGVyMR0wGwYJKoZIhvcNAQkBFg5uZ3BzQHBvc3Qx
LmNvbYIBADANBgkqhkiG9w0BAQQFAAOBgQA7/CqT6PoHycTdhEStWNZde7M/2Yc6
BoJuVwnW8YxGO8Sn6UJ4FeffZNcYZddSDKosw8LtPOeWoK3JINjAk5jiPQ2cww++
7QGG/g5NDjxFZNDJP1dGiLAxPW6JXwov4v0FmdzfLOZ01jDcgQQZqEpYlgpuI5JE
WUQ9Ho4EzbYCOQ==
-----END CERTIFICATE-----
-----BEGIN RSA PRIVATE KEY-----
MIIBPAIBAAJBAKy+e3dulvXzV7zoTZWc5TzgApr8DmeQHTYC8ydfzH7EECe4R1Xh
5kwIzOuuFfn178FBiS84gngaNcrFi0Z5fAkCAwEAAQJBAIqm/bz4NA1H++Vx5Ewx
OcKp3w19QSaZAwlGRtsUxrP7436QjnREM3Bm8ygU11BjkPVmtrKm6AayQfCHqJoT
ZIECIQDW0BoMoL0HOYM/mrTLhaykYAVqgIeJsPjvkEhTFXWBuQIhAM3deFAvWNu4
nklUQ37XsCT2c9tmNt1LAT+slG2JOTTRAiAuXDtC/m3NYVwyHfFm+zKHRzHkClk2
HjubeEgjpj32AQIhAJqMGTaZVOwevTXvvHwNEH+vRWsAYU/gbx+OQB+7VOcBAiEA
oolb6NMg/R3enNPvS1O4UU1H8wpaF77L4yiSWlE0p4w=
-----END RSA PRIVATE KEY-----
-----BEGIN CERTIFICATE REQUEST-----
MIIBDTCBuAIBADBTMQswCQYDVQQGEwJTRzERMA8GA1UEChMITTJDcnlwdG8xEjAQ
BgNVBAMTCWxvY2FsaG9zdDEdMBsGCSqGSIb3DQEJARYObmdwc0Bwb3N0MS5jb20w
XDANBgkqhkiG9w0BAQEFAANLADBIAkEArL57d26W9fNXvOhNlZzlPOACmvwOZ5Ad
NgLzJ1/MfsQQJ7hHVeHmTAjM664V+fXvwUGJLziCeBo1ysWLRnl8CQIDAQABoAAw
DQYJKoZIhvcNAQEEBQADQQA7uqbrNTjVWpF6By5ZNPvhZ4YdFgkeXFVWi5ao/TaP
Vq4BG021fJ9nlHRtr4rotpgHDX1rr+iWeHKsx4+5DRSy
-----END CERTIFICATE REQUEST-----
```

Use [ssldump](https://www.kali.org/tools/ssldump/):

```text
ssldump -dq -r ch5.pcap -k server.pem
```

```text
New TCP connection #1: 192.168.1.5(51663) <-> 192.168.1.9(4433)
1 1  0.0976 (0.0976)  C>S SSLv2 compatible client hello
1 2  0.1700 (0.0724)  S>C  Handshake      ServerHello
Short read: 0 bytes available (expecting 2)
1 3  0.1700 (0.0000)  S>C  Handshake      Certificate
1 4  0.1700 (0.0000)  S>C  Handshake      ServerHelloDone
1 5  0.1712 (0.0011)  C>S  Handshake      ClientKeyExchange
1 6  0.1712 (0.0000)  C>S  ChangeCipherSpec
1 7  0.1712 (0.0000)  C>S  Handshake      Finished
1 8  0.2046 (0.0333)  S>C  ChangeCipherSpec
1 9  0.2046 (0.0000)  S>C  Handshake      Finished
1 10 0.2180 (0.0134)  S>C  application_data
    ---------------------------------------------------------------
    ---------------------------------------------------------------
1 11 0.2180 (0.0000)  S>C  application_data
...
```

## Resources

* [BlackHat USA 09 Zusman Attack](https://repository.root-me.org/R%C3%A9seau/EN%20-%20BlackHat%20USA%2009%20Zusman%20AttackExtSSL%20slides.pdf)
* [BlackHat USA 09 Marlin Spike Defeat](https://repository.root-me.org/R%C3%A9seau/EN%20-%20BlackHat%20USA%2009%20Marlin%20Spike%20DefeatSSL%20slides.pdf)
* [BlackHat USA 09 Zusman Attack](https://repository.root-me.org/R%C3%A9seau/EN%20-%20BlackHat%20USA%2009%20Zusman%20AttackExtSSL%20paper.pdf)
* [Breaking TLS using SSLv2](https://repository.root-me.org/Cryptographie/Asym%C3%A9trique/EN%20-%20DROWN:%20Breaking%20TLS%20using%20SSLv2.pdf)
* [rfc2246](https://repository.root-me.org/RFC/EN%20-%20rfc2246.txt)