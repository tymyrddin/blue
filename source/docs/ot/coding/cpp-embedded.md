# C++ in embedded and OT targets

C++ is common in OT firmware and soft PLC runtimes. The language features that make it useful in general-purpose software — exceptions, dynamic dispatch, heap-allocated containers — carry costs in constrained and real-time environments that are worth understanding explicitly rather than discovering at the wrong moment. Several features are routinely disabled on embedded targets, and the standard library has a safe subset and a problematic one.

## Exception handling

C++ exception handling under the Itanium ABI uses a zero-cost model: no overhead is paid on the non-throwing path, but the cost is paid in code size. Every function in the call stack needs unwind tables so the runtime can walk frames during exception propagation. On a microcontroller with 256KB of flash, the unwind tables from a moderately complex codebase occupy a measurable fraction of that budget.

Beyond code size, stack unwinding requires support from the C runtime and, on some embedded toolchains, is unreliable or unimplemented. A thrown exception that cannot be caught because unwinding fails calls `std::terminate`.

The practical response is `-fno-exceptions`. With this flag the compiler replaces any `throw` expression with a call to `std::terminate` (or rejects it outright, depending on the implementation). Code that relies on exceptions for error propagation needs to be rewritten to use return codes, `std::optional`, or `std::expected` (C++23):

```cpp
/* exception-based: not suitable for -fno-exceptions targets */
int read_register(uint16_t address) {
    if (address > MAX_ADDRESS) throw std::out_of_range("address");
    return registers[address];
}

/* return-value-based: works under -fno-exceptions */
std::optional<int> read_register(uint16_t address) {
    if (address > MAX_ADDRESS) return std::nullopt;
    return registers[address];
}
```

The flag does not mean exceptions cannot occur. Linking against a library compiled without `-fno-exceptions`, or calling through a function pointer into code that throws, can still invoke the exception machinery. On a mixed codebase, audit the link map.

## RTTI

`-fno-rtti` disables run-time type information: `dynamic_cast` and `typeid` both become unavailable. RTTI stores per-class type descriptors and a pointer to each in the vtable; disabling it removes those entries and the associated flash and RAM.

`dynamic_cast` in OT code is usually a design smell rather than a necessity. A class hierarchy where the caller needs to ask at runtime what derived type it has is likely to be replaceable with a virtual dispatch that performs the type-specific operation directly. The Curiously Recurring Template Pattern provides static polymorphism without any runtime cost:

```cpp
template <typename Derived>
class Sensor {
public:
    float read() {
        return static_cast<Derived*>(this)->read_impl();
    }
};

class TemperatureSensor : public Sensor<TemperatureSensor> {
public:
    float read_impl() { return read_adc_celsius(); }
};
```

No vtable lookup, no RTTI, no heap allocation, resolved entirely at compile time.

## The standard library subset

Not all of the C++ standard library is appropriate for hard real-time or severely constrained targets. The split is roughly: header-only type manipulation and fixed-size structures are safe; anything that allocates dynamically, uses `iostream`, or depends on OS threading is not.

Generally safe on embedded targets:

- `<cstdint>`, `<cstring>`, `<cstdlib>` — the C compatibility headers
- `<array>`, `<tuple>`, `<utility>`, `<optional>` — fixed-size, stack-allocated
- `<algorithm>`, `<numeric>` — operate on ranges, no allocation
- `<type_traits>`, `<limits>` — compile-time only
- `<bitset>` — fixed size specified as a template parameter

Generally problematic:

- `std::vector`, `std::string`, `std::map`, `std::unordered_map` — heap allocation, non-deterministic worst-case timing
- `std::function` — type erasure involves a heap allocation for callable objects larger than the small-buffer optimisation threshold
- `<iostream>`, `<fstream>` — heavy, pull in locale and formatting machinery
- `<regex>` — heap-heavy, non-deterministic execution time
- `<thread>`, `<mutex>`, `<condition_variable>` — map to OS primitives; available on RTOS targets that provide a POSIX layer, but not on bare metal

The Embedded Template Library (ETL) provides drop-in equivalents of `std::vector`, `std::string`, and similar containers with fixed capacity specified as a template parameter, no heap allocation, and deterministic performance. It is a practical replacement for the dynamic containers in codebases that cannot use the standard ones.

```cpp
#include "etl/vector.h"

/* fixed capacity of 32, no heap allocation */
etl::vector<uint16_t, 32> register_values;
register_values.push_back(42);
```

## std::terminate on a PLC

`std::terminate` is called when the C++ runtime reaches a state it cannot recover from. With `-fno-exceptions` the cases that remain are:

- A pure virtual function is called — typically a programming error involving a partially-constructed or partially-destroyed object.
- A function declared `noexcept` invokes code that would throw (possible when linking mixed codebases).
- `new` fails and the allocation function calls `std::terminate` rather than returning null (implementation-dependent; check your toolchain's behaviour).
- `std::abort()` is called directly.

The default `std::terminate` handler calls `std::abort()`, which on a bare-metal target either loops forever or triggers a reset, depending on the fault handler. Neither is a controlled response. The controlled process is now in an unknown state: actuators are at whatever position they last received a command to hold, safety interlocks depending on the PLC for confirmation may time out.

Set a custom handler with `std::set_terminate` during initialisation:

```cpp
void ot_terminate_handler() {
    log_fault("std::terminate called");
    set_outputs_to_safe_state();
    trigger_watchdog_reset();
    /* does not return */
    while (true) {}
}

int main() {
    std::set_terminate(ot_terminate_handler);
    /* ... */
}
```

The handler needs to be registered before any C++ constructors that could themselves trigger termination, which in practice means as early as possible in the startup sequence. On targets where `main` is not the entry point, register it in the startup code before jumping to `main`.

The watchdog timer is the last resort: if the terminate handler itself faults before completing the safe-state transition, the watchdog expires and forces a reset. An OT system with a working watchdog has a known restart behaviour; one without has an unknown hang behaviour.
