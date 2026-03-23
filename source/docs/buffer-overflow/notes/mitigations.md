# Memory corruption mitigations

The goal of mitigations is not to make memory corruption impossible -- that requires
fixing the code -- but to make exploitation unreliable or infeasible even when a bug
exists. A well-mitigated system forces an attacker to chain multiple techniques
together and reduces the probability of a reliable exploit.

## ASLR

Address Space Layout Randomisation randomises the base addresses of the stack, heap,
and loaded libraries on each execution. A hardcoded address in an exploit will point
to unmapped memory and crash the process instead of redirecting control.

```text
# check ASLR status
cat /proc/sys/kernel/randomize_va_space
# 0 = disabled, 1 = partial (stack/libs), 2 = full (including heap)

# enable full ASLR
echo 2 | sudo tee /proc/sys/kernel/randomize_va_space

# make persistent
echo 'kernel.randomize_va_space = 2' | sudo tee /etc/sysctl.d/10-aslr.conf
```

ASLR effectiveness depends on address space size. 64-bit binaries have 48 bits of
virtual address space; 64-bit ASLR entropy is high and brute force is not practical.
32-bit ASLR is significantly weaker (8-16 bits of entropy) and brute force is feasible.

Position-independent executables (PIE) are required for the main binary to be
ASLR-protected. Without PIE, the binary itself loads at a fixed address and provides
stable gadgets for ROP regardless of ASLR status.

```text
# check if a binary is PIE
checksec --file=target
file target | grep "position independent"
```

## NX/DEP

The NX (No-Execute) bit on Intel, or DEP (Data Execution Prevention) in Windows
terminology, marks memory regions as either executable or writable but not both.
Stack and heap memory is writable but not executable, preventing direct shellcode
injection.

```text
# verify NX on a binary
checksec --file=target
# look for NX enabled
```

NX does not prevent ROP, which reuses existing executable code rather than injecting
new code.

## Stack canaries

A canary is a random value placed between local variables and the saved return address
when a function is entered. Before the function returns, the canary is checked; if
it has changed, the process is terminated. This detects stack overflows that overwrite
the return address.

```text
# compile with stack protection (GCC, enabled by default in most distributions)
gcc -fstack-protector-strong -o target source.c

# check canary status
checksec --file=target
```

Stack canaries do not protect against overwrites that skip over the canary (targeting
other stack data), heap overflows, or format string vulnerabilities that can leak the
canary value before the overflow.

## Control Flow Integrity

CFI restricts where indirect calls and jumps can transfer control. Forward-edge CFI
(protecting indirect calls and jumps) and backward-edge CFI (protecting returns)
together make ROP and JOP chains fail: gadgets are unreachable from legitimate
call sites.

LLVM CFI and Microsoft's Control Flow Guard (CFG) are the major implementations.
Clang's `-fsanitize=cfi` provides forward-edge CFI for C and C++ code.

```text
# compile with Clang CFI
clang -fsanitize=cfi -fvisibility=hidden -flto -o target source.c
```

CFI is most effective in combination with ASLR and NX. Without CFI, ROP bypasses
both of those.

## SafeStack

LLVM's SafeStack separates the stack into a safe stack (for return addresses and other
sensitive data) and an unsafe stack (for buffers that could be overflowed). The safe
stack is placed at a secret location not reachable through a linear overflow of the
unsafe stack.

```text
clang -fsanitize=safe-stack -o target source.c
```

## Sandboxing

Sandboxing limits what a compromised process can do even after code execution is
achieved. The most important deployment of sandboxing is in browsers: the renderer
process runs with minimal privileges, preventing a memory corruption exploit in the
renderer from directly compromising the system.

Sandboxing mechanisms:

- Linux: seccomp-bpf (restrict syscalls), namespaces, cgroups, SELinux/AppArmor
- Windows: Job objects, restricted tokens, AppContainer
- Browser-specific: Chromium's sandbox, Firefox's RLBox for third-party code

```text
# check seccomp status of a running process
cat /proc/PID/status | grep Seccomp
# 0 = none, 1 = strict, 2 = filter (seccomp-bpf)
```

A sandbox escape requires a second vulnerability (usually in the browser process or
kernel) in addition to the renderer exploit. This is why modern browser exploit chains
involve two or three separate bugs.

## Memory-safe languages

The most effective long-term mitigation is not using C or C++ for security-sensitive
code. Rust provides memory safety by construction through its ownership and borrow
checker, eliminating use-after-free, buffer overflows, and data races at compile time.

Rust does not eliminate memory bugs entirely: `unsafe` blocks exist for FFI and
performance-critical code, and bugs in those blocks are as dangerous as C bugs. But
the attack surface is dramatically reduced compared to a fully unsafe codebase.

Go and Java provide memory safety through garbage collection and bounds checking, at
the cost of runtime overhead and reduced control over memory layout.

For existing C/C++ codebases, rewriting is unrealistic in the short term. Incremental
rewrites of the highest-risk components (parsers, protocol handlers, crypto
implementations) in Rust while keeping the rest in C is the practical approach.

## Fuzzing as a prevention control

Fuzzing finds memory corruption bugs before deployment. A bug found by your fuzzer
is a bug that does not become a CVE.

```text
# libFuzzer with AddressSanitizer
clang -fsanitize=fuzzer,address -o fuzz_target fuzz_target.c
./fuzz_target -max_len=1024 corpus/

# AFL++ for black-box or source-available targets
afl-fuzz -i corpus/ -o findings/ -- ./target @@
```

Continuous fuzzing on CI pipelines (Google's OSS-Fuzz for open source projects)
catches regressions as they are introduced rather than months or years later.
