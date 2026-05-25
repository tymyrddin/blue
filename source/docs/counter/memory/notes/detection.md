# Detecting memory corruption exploitation

Memory corruption is difficult to detect at the moment of occurrence because the
overflow itself does not produce a visible event. What is detectable is the aftermath:
the process doing things it was not designed to do.

## Blue team visibility

The overflow itself is rarely visible. By the time anything appears in logs, the
attacker already has code execution. Detection strategies therefore focus on:

- Process behaviour after compromise (abnormal child processes, network connections)
- Exploitation technique signatures (ROP chain patterns, shellcode in memory)
- Operating system responses (crashes, canary terminations)
- EDR telemetry on memory regions and control flow

## Crash telemetry

A failed exploit almost always crashes the target process. Process crash telemetry
is therefore the earliest and most reliable indicator of exploitation attempts.

On Linux:

```text
# core dumps with context
coredumpctl list
coredumpctl info PID

# systemd journal for segfaults
journalctl -k | grep "segfault\|general protection"

# check for abnormal crash patterns (same process crashing repeatedly)
journalctl -u service_name --since "1 hour ago" | grep -i "signal\|crash\|fault"
```

On Windows: Windows Error Reporting logs in `%APPDATA%\Microsoft\Windows\WER\`.
Event ID 1000 (Application Error) captures crash details including faulting module
and exception code. Access violation (0xC0000005) at an address in a non-image
region is a suspicious pattern.

## ROP chain detection

ROP chains produce an abnormal pattern of `ret` instruction execution: many returns
in quick succession without intervening function calls. EDR products and some kernel
modules monitor for this pattern.

Intel CET (Control-flow Enforcement Technology), available on 11th-generation Intel
processors (Tiger Lake) and newer, enforces a shadow stack in hardware. Every `ret` must match
a corresponding `call` on the shadow stack; mismatches terminate the process. This
makes ROP chains fail at the hardware level on supported hardware.

```text
# check CET support
grep -m1 " cet" /proc/cpuinfo

# check if a binary is built with CET
objdump -d target | grep -i "endbr\|ibt"
# ENDBR64/ENDBR32 instructions mark valid indirect branch targets
```

At the EDR level, look for:
- Processes spawning shells or cmd.exe with no user interaction
- `mprotect` or `VirtualProtect` calls changing memory regions to executable
- Unexpected DLL loads or shared library mappings
- Network connections from processes that do not normally communicate

## Shellcode detection in memory

Executable memory that does not correspond to a mapped file is a strong indicator
of injected code. Tools that scan process memory for this:

```text
# Linux: check process memory maps for anonymous executable regions
cat /proc/PID/maps | grep "rwx\|r-x" | grep -v "\.so\|target_binary"

# look for executable heap
cat /proc/PID/maps | grep heap | grep "x"

# Windows: use Get-Process with PowerShell and scan VAD entries
# or use volatility on a memory image
volatility -f memory.dmp --profile=Win10x64 malfind
```

`malfind` in Volatility flags memory regions that are executable, not backed by a
file on disk, and contain shellcode-like patterns.

## Sysmon and Windows Event Logs

On Windows, Sysmon provides the most useful telemetry for exploit detection:

```xml
<!-- Sysmon config: flag suspicious process creation from browser/office -->
<ProcessCreate onmatch="include">
  <ParentImage condition="contains">chrome.exe</ParentImage>
  <ParentImage condition="contains">msedge.exe</ParentImage>
  <ParentImage condition="contains">winword.exe</ParentImage>
</ProcessCreate>

<!-- Flag mprotect equivalent: virtual memory protection changes -->
<ProcessTampering onmatch="include">
  <Type condition="is">Image is locked for access</Type>
</ProcessTampering>
```

Event ID 10 (ProcessAccess) captures when one process opens a handle to another,
which is a prerequisite for most injection techniques.

## Heap spray indicators

Heap spray attempts to place attacker-controlled content at predictable addresses
by making many large allocations. Indicators:

- Sudden spike in memory allocation by a browser renderer or other scripted process
- Large allocations of uniform content (detectable with memory scanning)
- High allocation rate in a process handling untrusted content

Modern allocators with guard pages and randomised chunk layout have significantly
reduced heap spray effectiveness, but the allocation pattern may still appear in
telemetry before the exploit fails.

## Sandboxed process escape indicators

If a browser renderer or other sandboxed process achieves code execution, the next
step is a sandbox escape. The escape attempt leaves traces:

- The sandboxed process making syscalls it should not be able to make (seccomp
  violation, resulting in SIGKILL)
- Unexpected IPC messages to the browser process
- Privilege changes on the browser process (Linux: UID/GID transitions in audit log)

On Linux with AppArmor or SELinux, policy violations from a sandboxed process
generate audit events even if the operation is blocked.

```text
# watch for seccomp kills
dmesg | grep "SECCOMP\|audit"
auditctl -w /proc -p rwx -k proc_access
```
