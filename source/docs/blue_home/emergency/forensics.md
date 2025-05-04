# Device forensic check

If you are going to report it, do not shut down the device, and document everything, including keeping case numbers and reports.

## Windows

Open Command Prompt as Admin > Type:

```
netstat -ano | findstr ESTABLISHED
```

Google any suspicious IPs.

## Mac

Open Terminal > Type:

```
lsof -i
```

Investigate unknown connections.