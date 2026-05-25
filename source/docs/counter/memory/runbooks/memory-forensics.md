# Memory forensics for exploit investigation

When a crash is ambiguous or post-exploitation activity is suspected, memory analysis
of the affected process provides the strongest evidence. This runbook covers both live
process inspection and offline analysis from a memory image.

## Live process inspection (Linux)

If the process is still running and accessible, inspect its memory maps before it
exits or is killed:

```text
# memory map: look for anonymous executable regions
cat /proc/PID/maps

# suspicious patterns:
# rwx regions (writable AND executable: common shellcode staging area)
# r-xp regions not backed by a file (anonymous executable code)
# heap or stack with execute permission

# example: filter for executable anonymous mappings
grep " r-xp " /proc/PID/maps | grep -v "\.so\|\.bin\|vdso\|vsyscall"
```

Extract a suspicious region:

```text
# note the start and end address from /proc/PID/maps
# e.g.: 7f1234560000-7f1234570000 rwxp 00000000 00:00 0

# dump the region
dd if=/proc/PID/mem bs=1 skip=$((16#7f1234560000)) \
   count=$((16#7f1234570000 - 16#7f1234560000)) \
   of=/tmp/suspicious_region.bin 2>/dev/null

# or with gdb
gdb -p PID
(gdb) dump memory /tmp/region.bin 0x7f1234560000 0x7f1234570000
```

## Capture a full memory image

### Linux

```text
# LiME (Linux Memory Extractor): kernel module for full RAM capture
git clone https://github.com/504ensicsLabs/LiME
cd LiME/src && make
sudo insmod lime.ko "path=/tmp/memory.lime format=lime"

# for a single process without kernel module:
# use /proc/PID/mem with a reader script
python3 - <<'EOF'
import re

pid = TARGET_PID
maps_file = f'/proc/{pid}/maps'
mem_file  = f'/proc/{pid}/mem'

with open(maps_file) as maps, open(mem_file, 'rb', 0) as mem:
    with open(f'/tmp/proc_{pid}.bin', 'wb') as out:
        for line in maps:
            m = re.match(r'([0-9a-f]+)-([0-9a-f]+)', line)
            if not m:
                continue
            start, end = int(m.group(1), 16), int(m.group(2), 16)
            try:
                mem.seek(start)
                out.write(mem.read(end - start))
            except OSError:
                pass
EOF
```

### Windows

```text
# WinPmem for full RAM
winpmem_mini_x64_rc2.exe memory.raw

# or use Task Manager / ProcDump for a single process minidump
procdump.exe -ma PID output.dmp
```

## Analyse with Volatility

Volatility analyses memory images offline. It works with LiME captures and Windows
raw/crash dumps.

```text
pip install volatility3

# identify the profile / OS version
vol -f memory.lime banners.Banners
vol -f memory.raw windows.info

# list processes
vol -f memory.lime linux.pslist
vol -f memory.raw windows.pslist

# find injected code: malfind identifies executable anonymous regions
vol -f memory.raw windows.malfind
vol -f memory.lime linux.malfind

# check loaded modules (look for unsigned or unusual DLLs)
vol -f memory.raw windows.dlllist --pid PID

# dump a suspicious memory region
vol -f memory.raw windows.memmap --pid PID --dump
```

Malfind output to investigate:
- VAD entries marked executable but not backed by a file on disk
- Memory regions containing PE headers (DLL injected without a corresponding file)
- Regions containing shellcode signatures (MZ header, NOP sleds, common syscall stubs)

## Shellcode identification

Once a suspicious region is extracted:

```python
import re

with open('/tmp/suspicious_region.bin', 'rb') as f:
    data = f.read()

# NOP sled
nop_matches = list(re.finditer(b'\x90+', data))
nop_run = max(len(m.group(0)) for m in nop_matches) if nop_matches else 0
print(f'Longest NOP run: {nop_run} bytes')

# common shellcode patterns
patterns = {
    'execve (x86)':       b'\x31\xc0\x50\x68\x2f\x2f\x73\x68',
    'execve (x64)':       b'\x48\x31\xd2\x48\xbb',
    'bind shell marker':  b'\x66\x68',   # push word (port number)
    'meterpreter stub':   b'\xfc\x48\x83',
    'Windows shellcode':  b'\x60\x89\xe5',  # pushad; mov ebp, esp
}

for name, pat in patterns.items():
    pos = data.find(pat)
    if pos != -1:
        print(f'Pattern "{name}" at offset {hex(pos)}')
        print(f'  Context: {data[max(0,pos-8):pos+32].hex()}')
```

Use `scdbg` or `speakeasy` for shellcode emulation:

```text
# scdbg: x86 shellcode emulation
scdbg /f /tmp/suspicious_region.bin

# speakeasy: Windows shellcode and PE emulation
pip install speakeasy-emulator
speakeasy -t /tmp/suspicious_region.bin -r -a x64
```

## ROP chain detection

A ROP chain in memory is a sequence of addresses pointing into executable regions
(gadget addresses), each differing by a small fixed offset from a known image base.
Detecting this manually:

```python
# given a dump of the stack region:
import struct

with open('/tmp/stack_dump.bin', 'rb') as f:
    stack = f.read()

# known executable regions (from maps or Volatility)
exec_regions = [
    (0x7f1200000000, 0x7f12001b0000, 'libc'),
    (0x400000, 0x401000, 'target'),
]

# scan for pointers into executable regions
potential_gadgets = []
for i in range(0, len(stack) - 8, 8):
    addr = struct.unpack('<Q', stack[i:i+8])[0]
    for start, end, name in exec_regions:
        if start <= addr < end:
            potential_gadgets.append((i, addr, name))

print(f'Potential gadget pointers on stack: {len(potential_gadgets)}')
for offset, addr, region in potential_gadgets[:20]:
    print(f'  stack+{offset:#x}: {addr:#x} ({region})')
```

A long sequence of pointers into libc with no intervening data is a strong indicator
of a ROP chain.

## Preserve evidence

Before taking any remediation action:

```text
# hash the binary and memory image
sha256sum ./service_binary > evidence_hashes.txt
sha256sum /tmp/memory.lime >> evidence_hashes.txt

# record process state
ps auxf > process_tree.txt
ss -tulnp > network_state.txt
cat /proc/PID/maps > pid_maps.txt
cat /proc/PID/status > pid_status.txt

# timestamp everything
date -u > collection_time.txt
```

Chain of custody: document who collected what and when before any changes are made
to the system.
