# Memory safety in C and C++

C gives direct access to memory and no bounds checking by default. Every array access is a pointer arithmetic operation,
and the runtime does not verify whether the resulting address is within the intended allocation. In OT/ICS environments
the consequences are worse than in most places: a buffer overflow that crashes a web server process restarts within
seconds; the same vulnerability in a PLC runtime can freeze a control loop or corrupt setpoint values with no automatic
recovery.

## Stack buffer overflows

The classic pattern: a fixed-size buffer on the stack, filled from input without a length check.

```c
/* unsafe: no bound on how much is copied into local[] */
void parse_modbus_frame(uint8_t *buf) {
    uint8_t local[16];
    memcpy(local, buf, received_length);
}
```

If `received_length` exceeds 16, `memcpy` writes past the end of `local` into the stack frame, overwriting the saved
return address or adjacent variables. In an OT context the attacker does not need a reliable exploit: corrupting any
part of the control loop stack may be enough to cause a process fault.

```c
void parse_modbus_frame(uint8_t *buf, size_t received_length) {
    uint8_t local[16];
    if (received_length > sizeof(local)) {
        return;
    }
    memcpy(local, buf, received_length);
}
```

`sizeof(local)` is evaluated at compile time and does not depend on a separately maintained constant that can drift out
of sync with the array declaration.

## Integer overflow in length calculations

Protocol parsers routinely compute buffer sizes from fields in incoming frames. Integer overflow in those calculations
produces an allocation smaller than the data that follows, which the subsequent copy overflows:

```c
/* unsafe: multiplication overflows if count is large */
uint8_t *buf = malloc(count * sizeof(struct record));
memcpy(buf, src, count * sizeof(struct record));
```

A Modbus or DNP3 parser that derives `count` from a frame field is reachable from the network. A crafted frame sets
`count` to a value that overflows the multiplication, producing a small allocation followed by a large copy.

```c
if (count > SIZE_MAX / sizeof(struct record)) {
    return ERROR_OVERFLOW;
}
uint8_t *buf = malloc(count * sizeof(struct record));
if (buf == NULL) {
    return ERROR_ALLOC;
}
```

Signed integer overflow is undefined behaviour in C. Use `size_t` or explicitly sized unsigned types (`uint32_t`,
`uint64_t`) for length values.

## Heap buffer overflows

Heap overflows follow the same pattern but corrupt adjacent heap allocations rather than stack frames. In a multitasking
RTOS environment, an adjacent allocation may belong to an unrelated task.

The most common form is an allocation derived from one field and a copy bounded by a different field:

```c
/* unsafe: full_length may exceed payload_len */
char *buf = malloc(payload_len);
memcpy(buf, frame->payload, frame->full_length);
```

Where the allocation size and the copy size come from different sources, they need explicit comparison before the copy
proceeds.

## Use-after-free in C++

Objects passed between tasks or stored in shared state can be freed while a pointer to them still exists. Use-after-free
in an OT RTOS is harder to catch than on a general-purpose OS because there is typically no memory protection between
tasks: a freed region may be reallocated to a different task's data immediately.

The RAII pattern removes most manual lifetime management. Shared ownership across task boundaries is clearer through
`std::shared_ptr` than raw pointer passing with manual free calls, where the ownership question ("which task calls
delete?") often has no documented answer.

```cpp
/* unclear ownership */
Sensor *s = new Sensor(channel_id);
xQueueSend(sensor_queue, &s, portMAX_DELAY);

/* explicit shared ownership */
auto s = std::make_shared<Sensor>(channel_id);
xQueueSend(sensor_queue, &s, portMAX_DELAY);
```

`std::shared_ptr` involves atomic reference counting, which has overhead. In hard real-time tasks, arena allocation or
static allocation with explicit ownership transfer may be preferable to reference counting.

## Static analysis

MISRA C and MISRA C++ define rule sets for safety-critical embedded code. Several rules directly address the patterns
above: no dynamic allocation in critical sections (MISRA C rule 21.3), no unchecked return values from functions that
can fail (rule 17.7), and explicit bounds on array indexing. Compliance tools include PC-lint Plus, Polyspace, and LDRA.

The CERT C Coding Standard covers overlapping ground with more detail on specific vulnerability patterns. Both are worth
treating as a code review reference rather than a compliance checkbox.

Compiler warnings catch a substantial portion of the above before static analysis runs. At minimum:
`-Wall -Wextra -Wformat-security -Wshadow -Wconversion` on GCC or Clang, with `-Werror` in CI to prevent warning
accumulation.
Last updated: 10 July 2026
