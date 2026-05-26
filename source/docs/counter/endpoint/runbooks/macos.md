# macOS endpoint detection and response

macOS endpoint protection combines Apple's built-in security frameworks (Endpoint Security API, XProtect, MRT)
with third-party tooling. Detection focuses on ESF events (process executions, file operations, mount events),
notarisation and Gatekeeper decisions, and suspicious entitlement usage. Common attack vectors include abuse of
AppleScript, JXA (JavaScript for Automation), and persistence through launch agents and TCC database manipulation.

## Process monitoring

| Technique                         | Description                                                 | Tools/Commands                             |
|-----------------------------------|-------------------------------------------------------------|--------------------------------------------|
| ESF (Endpoint Security Framework) | Apple's official API for real-time process/event monitoring | `eslogger`, `EndpointSecurity` API         |
| XPC service analysis              | Detect suspicious inter-process communication               | `launchctl list`, `lsof -i`                |
| Mach-O binary inspection          | Check for unsigned or hooked binaries                       | `codesign -dv --verbose=2 /path/to/binary` |

## Memory protection

| Technique                         | Description                                        | Implementation                                                   |
|-----------------------------------|----------------------------------------------------|------------------------------------------------------------------|
| System Integrity Protection (SIP) | Prevents root from modifying protected directories | `csrutil status`                                                 |
| Library validation                | Blocks injection of unsigned libraries             | Entitlements: `com.apple.security.cs.disable-library-validation` |
| Kernel Extensions (KEXT) blocking | Monitor unauthorised kext loading                  | `kmutil showloaded`                                              |

## Behavioural detection

| Technique              | Example                         | Detection method                                      |
|------------------------|---------------------------------|-------------------------------------------------------|
| Persistence mechanisms | LaunchAgents, cron jobs         | `launchctl print system/`, `ls -la /Library/Launch*/` |
| Fileless attacks       | Python/Ruby in-memory execution | Monitor `execsnoop` or `opensnoop`                    |
| API hook detection     | `DYLD_INSERT_LIBRARIES` abuse   | `vmmap <PID>` + signature validation                  |

## Network monitoring

```bash
sudo lsof -i -P -n | grep ESTABLISHED
sudo nettop -P -m route
```
