# Concurrency and shared state

RTOS-based OT firmware runs multiple tasks and handles interrupts asynchronously. The bugs that result from incorrect
shared-state access are among the hardest to reproduce: they depend on timing, task scheduling, and interrupt arrival,
and they may only appear under specific load conditions or on hardware with particular cache behaviour. Most of them are
preventable by choosing the right synchronisation primitive for the situation.

## volatile is not synchronisation

`volatile` tells the compiler that a variable may change outside the visible control flow and that every access should
read from or write to memory rather than a cached register value. It is the right tool for memory-mapped I/O registers
and for flags shared between an ISR and a single-core foreground task.

It is not the right tool for sharing data between tasks on a multi-core processor or across a context switch on a single
core. `volatile` does not prevent the compiler from reordering surrounding memory accesses, and on ARM Cortex-A and
Cortex-R processors it does not prevent the CPU from reordering them either.

```c
/* single-core, ISR sets flag, foreground loop checks it */
volatile bool measurement_ready = false;
uint16_t measurement_value;

void ADC_IRQHandler(void) {
    measurement_value = ADC->DR;
    measurement_ready = true;    /* volatile ensures this write is not optimised away */
}

void process_loop(void) {
    if (measurement_ready) {
        measurement_ready = false;
        process(measurement_value);
    }
}
```

This pattern works on a single-core target where the ISR cannot be interrupted by another ISR that reads
`measurement_value`. It does not work safely between two tasks on an RTOS, because the context switch can occur between
reading `measurement_ready` and reading `measurement_value`.

## Interrupt-safe access

In a FreeRTOS application, the canonical way to signal a task from an ISR is through a queue or a task
notification:

```c
static QueueHandle_t adc_queue;

void ADC_IRQHandler(void) {
    uint16_t value = ADC->DR;
    BaseType_t higher_priority_woken = pdFALSE;
    xQueueSendFromISR(adc_queue, &value, &higher_priority_woken);
    portYIELD_FROM_ISR(higher_priority_woken);
}

void sensor_task(void *params) {
    uint16_t value;
    while (xQueueReceive(adc_queue, &value, portMAX_DELAY) == pdTRUE) {
        process(value);
    }
}
```

`xQueueSendFromISR` is the ISR-safe variant. Using the non-ISR `xQueueSend` from an interrupt context calls the
scheduler and corrupts RTOS state.

When a critical section in foreground code needs protection against interrupts, `taskENTER_CRITICAL` and
`taskEXIT_CRITICAL` disable interrupts up to the configured `configMAX_SYSCALL_INTERRUPT_PRIORITY` level. Short
critical sections reduce interrupt latency; holding one across more than a few instructions risks missed deadlines in
control loops.

## RTOS queues and the alternative approaches

Queues are the safest general-purpose mechanism for passing data between tasks: they are internally synchronised, they
transfer ownership of the data, and they block or return an error when full.

Direct shared memory protected by a mutex is an alternative for larger structures where copying through a queue is too
expensive, but it requires the discipline to hold the mutex for every access without exception. A single unprotected
read of a struct field that is simultaneously being written produces torn data: the reader sees part of the old value
and part of the new one.

A single-writer single-reader ring buffer can be used lock-free if the indices are properly typed as atomic or if the
architecture guarantees naturally-aligned word reads and writes are atomic. This pattern is common for high-rate sensor
data where the overhead of a mutex or queue copy is measurable. The correctness constraint is strict: exactly one writer
and one reader, with no other accessors.

## Mutexes and priority inversion

Priority inversion occurs when a high-priority task blocks on a mutex held by a low-priority task, and a medium-priority
task runs instead because it does not need the mutex. The high-priority task is effectively demoted below the
medium-priority one.

The Mars Pathfinder mission produced a real incident of this class in 1997: a high-priority bus management task was
repeatedly preempted by a medium-priority communications task because a low-priority meteorological task held a shared
mutex, eventually triggering the watchdog.

FreeRTOS mutexes created with `xSemaphoreCreateMutex` implement priority inheritance: when a high-priority task blocks
on a mutex, the holding task's priority is temporarily raised to match. This prevents the medium-priority task from
running until the mutex is released. Priority inheritance is not a complete solution to priority inversion, but it
handles the common case.

```c
/* use xSemaphoreCreateMutex, not xSemaphoreCreateBinary, for shared data */
static SemaphoreHandle_t register_mutex;

void write_register(uint16_t address, uint16_t value) {
    xSemaphoreTake(register_mutex, portMAX_DELAY);
    registers[address] = value;
    xSemaphoreGive(register_mutex);
}
```

Never call `xSemaphoreTake` with `portMAX_DELAY` from a task with a hard deadline. A mutex that is held longer than
expected (because the holding task was preempted) causes the waiting task to miss its deadline silently. Use a timeout
and handle the failure case.

## Atomic operations and memory ordering

For simple flags and counters shared between tasks, `std::atomic<T>` (C++11) or `_Atomic T` (C11) is cleaner than a
mutex. The operations are guaranteed atomic and the memory ordering is explicit.

```cpp
#include <atomic>

std::atomic<bool> shutdown_requested{false};

void watchdog_task(void *) {
    shutdown_requested.store(true, std::memory_order_release);
}

void control_task(void *) {
    while (!shutdown_requested.load(std::memory_order_acquire)) {
        run_control_loop();
    }
    transition_to_safe_state();
}
```

`memory_order_release` on the write and `memory_order_acquire` on the read form a synchronises-with relationship: all
writes before the store are visible to the thread that performs the load. `memory_order_relaxed` provides atomicity but
no ordering guarantee, and is appropriate for counters where the order of increments relative to other operations does
not matter.

Check whether `std::atomic<T>` is actually lock-free for the type in question. On 32-bit targets,
`std::atomic<uint64_t>` may not be lock-free and will use an internal mutex. `std::atomic<T>::is_lock_free()` or
`ATOMIC_LLONG_LOCK_FREE` indicates the platform behaviour.

## Deadlock

Two tasks deadlock when each holds a resource the other is waiting for. FreeRTOS does not detect deadlock: the tasks
simply block indefinitely, the watchdog eventually expires, and the system resets without a useful diagnostic.

Lock ordering prevents deadlock: if every task that needs multiple mutexes acquires them in the same global order, a
circular wait cannot form. Document the order and enforce it in code review.

A mutex held across a blocking call is a common source of unexpected deadlock. If task A holds mutex M and then blocks
on a queue receive, and task B needs mutex M to produce the item that task A is waiting for, the system deadlocks. The
rule is: do not hold a mutex while blocking on any other synchronisation primitive.
