# Process & behaviour monitoring

## Kernel Callbacks

Hooks into Windows kernel (via ETW or MiniFilter) to monitor:

    Process creation (PsSetCreateProcessNotifyRoutineEx)

    Thread injection (PsSetLoadImageNotifyRoutine)

    DLL loading (NtCreateThreadEx)

Detects:

    Process hollowing (malware spawning svchost.exe then hollowing it)

    Reflective DLL injection (Cobalt Strike)

Tools:

    Microsoft Defender for Endpoint (uses ETW)

    Custom drivers (e.g., Sysmon with SwiftOnSecurity configs)

## User-Mode hooking

Injects hooks into APIs like:

    CreateRemoteThread (blocks thread injection)

    WriteProcessMemory (stops code injection)

Catches fileless attacks (PowerShell scripts, WMI persistence).

Example:

```
// Detecting thread injection
if (lpStartAddress == "C:\Windows\System32\amsi.dll") { 
  BlockExecution(); 
}
```

