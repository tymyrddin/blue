# Compiler and linker hardening

The compiler and linker can insert or enforce a set of mitigations that raise the cost of exploiting memory corruption
vulnerabilities. Most are off by default. In hosted environments they are routine; in embedded and OT targets the
picture is more complicated, because some mitigations carry runtime overhead that conflicts with real-time constraints,
and some require OS or hardware support that bare-metal targets lack entirely.

The practical approach is to enable everything the target supports, know why each flag exists, and document explicitly
which mitigations are absent and why.

## Stack canaries

`-fstack-protector-strong` inserts a random value (the canary) between local variables and the saved return address. On
function return the canary is checked; a mismatch triggers an abort before the corrupted return address is used.

`-fstack-protector-strong` instruments functions that have stack-allocated buffers, use `alloca`, or take the address of
a local variable. It is narrower than `-fstack-protector-all` (which instruments every function) and wider than
`-fstack-protector` (which only instruments functions with character arrays larger than eight bytes).

On RTOS targets the canary abort handler needs to be implemented: the default `__stack_chk_fail` provided by the C
library either calls `abort()` or is a stub. In safety-critical OT code, a well-configured abort handler logs the fault, transitions the controlled process to a
safe state, and halts or restarts.

Stack canaries do not stop a heap overflow or a write-what-where primitive that targets the canary directly, but they
stop naive stack smashing reliably.

## Position-independent code

`-fPIC` and `-fPIE` generate position-independent code and executables, which is the prerequisite for ASLR at the OS
level. On a general-purpose OS, ASLR randomises load addresses at runtime, making it harder to predict where shellcode
or return-oriented programming gadgets land.

On bare-metal targets without an OS there is no ASLR, so `-fPIE` provides no runtime randomisation benefit. It is still
worth using on engineering workstations, historian servers, and HMI applications running on Windows or Linux, where the
OS can apply ASLR.

On microcontroller targets with fixed memory maps, the flag is typically omitted or unsupported by the toolchain.

## RELRO and GOT protection

On Linux-based OT systems (historians, HMIs, soft PLCs), the dynamic linker's Global Offset Table is a common target for
write-primitive exploits: overwriting a GOT entry redirects the next call to a library function.

Full RELRO (`-Wl,-z,relro,-z,now`) resolves all dynamic symbols at load time and marks the GOT read-only before
execution begins. The cost is slightly longer startup time as all symbols are resolved eagerly. For OT processes
that run continuously, the startup cost is paid once.

```
LDFLAGS += -Wl,-z,relro,-z,now
```

Partial RELRO (`-z,relro` without `-z,now`) marks some sections read-only but leaves the GOT writeable for lazy binding.
It is weaker.

## Format string hardening

`-Wformat -Wformat-security -Werror=format-security` produces an error when a format string argument to `printf`-family
functions is not a string literal. A non-literal format string that contains user-controlled data is a format string
vulnerability.

```c
/* unsafe: user_input as format string */
printf(user_input);

/* safe: explicit format specifier */
printf("%s", user_input);
```

This is a warning-as-error at compile time with no runtime cost.

## Integer overflow detection

`-fsanitize=signed-integer-overflow` (and `-fsanitize=unsigned-integer-overflow` with Clang's UBSan) instruments integer
arithmetic to trap on overflow at runtime. This is a debugging and testing tool: the instrumentation adds overhead
and the trap handler needs to be defined for embedded targets.

Running with sanitisers in a hardware-in-the-loop test environment catches overflow bugs before they reach production
firmware, where the sanitiser overhead would be unacceptable.

## A note on `-Wconversion`

`-Wconversion` warns on implicit type conversions that may silently truncate or change sign. In C code that processes
protocol frame fields, a `uint16_t` field silently narrowed to `uint8_t` is a class of bug that produces incorrect
behaviour under specific frame values. The warning is noisy on legacy codebases but worth enabling
for new code.

## Practical flag set

For a cross-compiled embedded target (GCC, ARM Cortex-M, FreeRTOS):

```makefile
CFLAGS  += -Wall -Wextra -Wformat -Wformat-security -Werror=format-security
CFLAGS  += -Wconversion -Wshadow
CFLAGS  += -fstack-protector-strong
CFLAGS  += -fno-common
LDFLAGS += -Wl,--warn-common
```

ASLR, RELRO, and full PIE are omitted because the target has no OS and a fixed memory map.

For a Linux-based soft PLC, historian, or HMI application:

```makefile
CFLAGS  += -Wall -Wextra -Wformat -Wformat-security -Werror=format-security
CFLAGS  += -Wconversion -Wshadow
CFLAGS  += -fstack-protector-strong
CFLAGS  += -fPIE
LDFLAGS += -pie
LDFLAGS += -Wl,-z,relro,-z,now
```

The flag set is a floor, not a ceiling. Each mitigation addresses a different failure mode; omitting one because another
is present does not close the gap.
Last updated: 09 July 2026
