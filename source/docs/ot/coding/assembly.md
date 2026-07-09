# Secure patterns in assembly

Handwritten assembly appears in OT/ICS codebases in three places: bootloaders and startup routines, interrupt service
routines where latency requirements exclude C overhead, and inline assembly in C/C++ for hardware access or
cycle-accurate timing. Each has its own security-relevant patterns.

## Stack discipline in ISRs

An ISR that corrupts the stack of the interrupted context produces behaviour that can be difficult to distinguish from a
hardware fault. The common failure is saving and restoring the wrong set of registers, or saving them in the wrong
order.

On ARM Cortex-M, the hardware automatically saves and restores a subset of registers (R0–R3, R12, LR, PC, xPSR) on
exception entry and exit. A handwritten ISR that additionally saves callee-saved registers (R4–R11) restores them in exactly reversed order
before the exception return:

```asm
my_isr:
    push    {r4-r11, lr}    ; save callee-saved regs and exception return LR
    ; handler body
    pop     {r4-r11, pc}    ; restore; pc <- exception return value triggers return sequence
```

Using `pc` as the pop target causes the processor to perform the exception return sequence, including stack pointer
validation if the security extension is active. Any path through the ISR that exits without the matching `pop` leaves
the stack misaligned. On Cortex-M a misaligned stack on exception return triggers a HardFault; on architectures without
that protection it silently corrupts the interrupted context.

## Inline assembly in C and C++

GCC and Clang extended inline assembly (`asm volatile(...)`) introduces bugs that are difficult to detect because the
compiler does not analyse the assembly operands. Not listing all clobbered registers tells the compiler they are
preserved, producing incorrect code after the block. A hardcoded register name like `"r5"` instead of a constraint such
as `"=r"(var)` conflicts silently if the compiler has already allocated that register for something else. Omitting
`"memory"` from the clobber list when the assembly accesses memory through a pointer the compiler holds in a register
causes it to use a stale cached value.

Where hardware access is the goal, compiler intrinsics (CMSIS intrinsics on ARM, vendor-supplied headers) express the
intent more safely than inline assembly. The clobber list of any inline assembly block is worth a dedicated code review
pass.

## Writable and executable memory

In systems with an MPU (Memory Protection Unit), marking a region as both writable and executable creates the same class
of risk as NX-bypass attacks on general-purpose systems. A control-flow hijack that redirects execution into a writable
buffer can inject arbitrary instructions rather than relying on existing code.

On Cortex-M with an MPU, code sections are marked RX (read/execute), data and stack regions are RW (read/write), and no
region is both writable and executable at runtime. If a bootloader or firmware update mechanism needs to write to flash
and then execute from it, write and execute permissions are not held simultaneously: write the region, revoke write
access, then execute.

## Bootloader integrity

A bootloader that verifies a firmware image before transferring control is an effective barrier against unauthorised
firmware. The guarantee depends entirely on performing the check before execution begins.

```c
/* verify first, transfer control second */
if (verify_firmware_signature(flash_base, flash_length, public_key) != VERIFY_OK) {
    enter_recovery_mode();
    /* does not return */
}
jump_to_application(flash_base);
```

The public key lives in a write-protected region of flash or in a hardware security module. A key stored in the same
writeable region as the firmware it verifies can be replaced alongside it, and the verification step becomes decorative.

An implementation that begins execution and checks the signature as a background task, or that checks only a subset of
the image, provides weaker guarantees than it appears to.
