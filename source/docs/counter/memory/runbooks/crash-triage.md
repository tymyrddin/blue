# Crash triage

A process crash is the most visible indicator of an exploitation attempt. The question
is whether the crash is a bug being triggered organically, a fuzzer probing the
service, or an attacker testing or delivering an exploit. Triage determines which.

## Collect the crash

### Linux core dumps

Enable and collect core dumps before an incident if possible:

```text
# enable core dumps (persistent via /etc/security/limits.conf)
ulimit -c unlimited
echo '/tmp/cores/core.%e.%p.%t' | sudo tee /proc/sys/kernel/core_pattern

# with systemd: coredumpctl handles this automatically
coredumpctl list
coredumpctl info PROCESS_NAME
coredumpctl dump PROCESS_NAME -o /tmp/analysis.core
```

### Windows crash dumps

Windows Error Reporting creates minidumps in `%LOCALAPPDATA%\CrashDumps\` for user
processes and `%WINDIR%\Minidump\` for kernel crashes.

Event ID 1000 in the Application event log captures: faulting application, faulting
module, exception code, and faulting offset.

```powershell
# retrieve crash events
Get-EventLog -LogName Application -Source "Application Error" -Newest 20 |
  Where-Object {$_.EventID -eq 1000} |
  Select-Object TimeGenerated, Message | Format-List
```

## Examine the crash

Open the core dump in gdb:

```text
gdb -q ./service_binary /tmp/analysis.core

(gdb) bt             # backtrace: where did it crash?
(gdb) info reg       # register state at crash
(gdb) x/20gx $rsp    # stack contents
(gdb) x/20gx $rip    # instruction at crash (if RIP is accessible)
```

Key questions:

- What is in RIP/EIP? If it contains a pattern (0x41414141, 0x6161616b from a cyclic
  pattern) or an address in a non-image region, someone was probing for the offset.
- What is on the stack? Repeated bytes, NOP sleds, or structured data suggest payload
  delivery rather than an organic crash.
- What is the faulting address? An access violation at a suspicious address (small
  integer, repeated pattern, address in a non-executable memory region) indicates an exploitation attempt.

## Distinguish organic crash from exploit attempt

Organic crash indicators:
- Crash in a known code path with a sensible backtrace
- Null pointer dereference in the service's own code
- Stack contents look like normal programme data
- Single occurrence, not part of a series

Exploit attempt indicators:
- RIP/EIP contains attacker-supplied data (pattern bytes, addresses not in the binary)
- Stack contains a long sequence of a single byte (padding) or structured payloads
- The crash is preceded by many similar crashes from the same source (fuzzing or
  offset-finding loop)
- The crash offset changes systematically across multiple events (attacker measuring
  the overflow)
- Memory at the crash point contains shellcode patterns (NOP sleds, x86 opcodes)
- An access violation at an address that is a libc or binary symbol offset from a
  suspicious value (ret2libc attempt)

## Identify the overflow boundary

If the core dump shows attacker-supplied bytes in RIP/EIP, find the exact offset to
understand what the attacker knows:

```python
from pwn import *

# if RIP/EIP contains 4 bytes of a cyclic pattern
rip_value = 0x6161616b  # from gdb: info reg rip
offset = cyclic_find(rip_value)
print(f'Overflow offset: {offset} bytes')
```

This tells you how many bytes of padding the attacker used, which indicates whether
they have already completed the offset-finding phase and moved to payload delivery.

## Check for multiple events

Exploitation attempts rarely arrive as a single crash. Query logs for correlated
events:

```text
# Linux: crashes from the same source IP in a network service
journalctl -u service_name --since "24 hours ago" | grep "signal\|fault"

# correlate with access logs
grep "source_ip" /var/log/service/access.log | tail -50

# Windows: multiple Application Error events for the same binary
Get-EventLog -LogName Application -Source "Application Error" |
  Where-Object {$_.Message -like "*service_name*"} |
  Group-Object -Property TimeGenerated |
  Sort-Object Count -Descending
```

A burst of crashes from a single source over a short period is a fuzzing or exploit
testing pattern. Isolated crashes from many sources suggest a deployed exploit.

## Extract the payload

If the crash contains attacker payload, extract it for analysis:

```text
(gdb) x/200xb $rsp-400     # dump stack memory
(gdb) dump memory /tmp/stack_dump.bin $rsp-400 $rsp+400
```

```python
# look for shellcode signatures in the dump
with open('/tmp/stack_dump.bin', 'rb') as f:
    data = f.read()

# NOP sled
nop_count = sum(1 for b in data if b == 0x90)
print(f'NOP bytes: {nop_count} of {len(data)}')

# common shellcode prologue patterns
import re
patterns = [
    b'\x31\xc0',      # xor eax, eax
    b'\x48\x31\xc0',  # xor rax, rax (x64)
    b'\x6a\x0b',      # push 11 (execve syscall number)
    b'\x90' * 10,     # NOP sled
]
for pat in patterns:
    if pat in data:
        print(f'Pattern found: {pat.hex()}')
```

## Determine if exploitation succeeded

A crash during exploit delivery means the attempt failed. But absence of a crash does
not mean the attempt failed, a successful exploit may not crash the process at all.

Check for post-exploitation indicators alongside the crash:
- New child processes spawned by the service (unexpected shells, interpreters)
- Network connections from the service to external addresses
- File system changes in directories the service does not normally write to
- New user accounts or privilege changes
- Evidence of lateral movement from the compromised host

If the service recovered (restarted by systemd or a supervisor), check whether the
restart was preceded by a clean exit or a signal-terminated crash.
Last updated: 26 May 2026
