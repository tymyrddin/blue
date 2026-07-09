# Input validation and protocol parsing

OT protocols were designed for reliability on trusted networks. Most carry no authentication, and the length and count fields in their frames were not designed to be adversarial inputs. A parser that trusts those fields produces exactly the memory corruption patterns described in the memory safety page, but the vulnerability lives at the protocol layer: the attacker controls the frame, the frame contains the length, and the length drives the allocation or copy.

The general principle throughout: every numeric field derived from wire data is untrusted until validated against a known bound. The bound comes from the protocol specification (maximum PDU size, valid address range, defined function codes) or from local configuration (the set of registers this device actually has).

## Modbus TCP

The Modbus Application Protocol header (MBAP) is seven bytes: Transaction Identifier (2), Protocol Identifier (2), Length (2), Unit Identifier (1). The Length field gives the number of remaining bytes, starting from the Unit Identifier. A valid Modbus TCP PDU has a maximum data length of 253 bytes, so the MBAP Length field is at most 254 (Unit Identifier plus 253 bytes of PDU).

```c
#define MBAP_HEADER_SIZE  7
#define MAX_PDU_SIZE      253
#define MAX_MBAP_LENGTH   254   /* unit id (1) + max PDU (253) */

int parse_modbus_tcp(uint8_t *buf, size_t buf_len, modbus_frame_t *out) {
    if (buf_len < MBAP_HEADER_SIZE) {
        return ERR_SHORT;
    }

    uint16_t mbap_length = (buf[4] << 8) | buf[5];

    if (mbap_length < 2 || mbap_length > MAX_MBAP_LENGTH) {
        return ERR_INVALID_LENGTH;
    }

    size_t expected_total = MBAP_HEADER_SIZE - 1 + mbap_length;
    if (buf_len < expected_total) {
        return ERR_SHORT;
    }

    out->unit_id  = buf[6];
    out->function = buf[7];
    out->data     = &buf[8];
    out->data_len = mbap_length - 2;   /* subtract unit id and function code */
    return OK;
}
```

After extracting the frame, validate the function code against an allowlist of codes the device implements rather than treating any unrecognised code as a malformed packet to be discarded with a logged warning. A device that silently drops unrecognised function codes is easier to probe than one that returns exception code 01 (Illegal Function).

Validate register addresses and quantities against the device's actual point list. A read request for 125 holding registers starting at address 0 is syntactically valid; if the device only has registers 100–199, addresses 0–99 are out of range regardless of the frame being well-formed.

## DNP3

DNP3 frames have a Data Link Layer frame and an Application Layer that may span multiple transport-layer fragments. Both layers carry length fields that need independent validation.

The Data Link Layer Length field is one byte, covering everything from the Control field onward. Valid values are 5 (minimum: Control + Destination + Source with no data) to 255. A Length value below 5 indicates a malformed frame.

The Application Layer object headers are where the more exploitable patterns appear. Each object header contains a Group, Variation, and Qualifier Code. The Qualifier Code determines how the objects in the header are counted or sized:

Qualifier codes 0x00 and 0x01 specify a start–stop index range; validate that stop is greater than or equal to start
and that both are within the device's configured point count. Codes 0x07 and 0x08 specify a one- or two-byte count of
objects; validate the count against a configured maximum before iterating. Code 0x28, the two-byte count variant, makes
an overflow-inducing value easier to supply; the validation is the same, but the wider field deserves explicit attention
in testing.

```c
int parse_dnp3_object_header(uint8_t *buf, size_t len,
                              dnp3_object_header_t *out) {
    if (len < 3) {
        return ERR_SHORT;
    }

    out->group     = buf[0];
    out->variation = buf[1];
    uint8_t qualifier = buf[2];
    uint8_t prefix    = (qualifier >> 4) & 0x0F;
    uint8_t range     = qualifier & 0x0F;

    if (range == 0x07) {           /* one-byte count */
        if (len < 4) return ERR_SHORT;
        out->count = buf[3];
    } else if (range == 0x08) {    /* two-byte count */
        if (len < 5) return ERR_SHORT;
        out->count = (buf[3] << 8) | buf[4];
    } else {
        return ERR_UNSUPPORTED_QUALIFIER;
    }

    if (out->count > MAX_OBJECTS_PER_HEADER) {
        return ERR_COUNT_TOO_LARGE;
    }

    (void)prefix;  /* prefix handling omitted for brevity */
    return OK;
}
```

Fragment reassembly deserves the same treatment: track the accumulated byte count across fragments. A sequence of intermediate fragments that individually appear valid but together exceed the maximum Application Layer PDU size (2048 bytes) is a resource exhaustion vector as much as a memory safety one.

## OPC UA Binary

OPC UA Binary messages open with a four-byte message type, a one-byte chunk indicator, and a four-byte MessageSize. MessageSize is the total byte count of the message including the header, so the minimum valid value is 8. A parser that subtracts the header length without first checking that MessageSize >= 8 produces an integer underflow.

```c
#define OPC_UA_HEADER_SIZE    8
#define OPC_UA_MAX_MESSAGE    (4 * 1024 * 1024)   /* configured maximum */

int parse_opcua_header(uint8_t *buf, size_t buf_len,
                       opcua_header_t *out) {
    if (buf_len < OPC_UA_HEADER_SIZE) {
        return ERR_SHORT;
    }

    uint32_t msg_size;
    memcpy(&msg_size, &buf[4], sizeof(msg_size));  /* little-endian */

    if (msg_size < OPC_UA_HEADER_SIZE || msg_size > OPC_UA_MAX_MESSAGE) {
        return ERR_INVALID_SIZE;
    }

    if (buf_len < msg_size) {
        return ERR_SHORT;
    }

    out->chunk_type   = buf[3];
    out->payload      = &buf[OPC_UA_HEADER_SIZE];
    out->payload_size = msg_size - OPC_UA_HEADER_SIZE;
    return OK;
}
```

OPC UA strings are length-prefixed with a signed 32-bit length; a value of -1 indicates a null string. A parser that interprets -1 as a large unsigned length and passes it to `malloc` allocates several gigabytes, or overflows. Check for negative values before any allocation.

Chunk reassembly in OPC UA follows the DNP3 pattern: accumulate fragments, enforce a ceiling on the total reassembled size, and reject sequences that exceed it before allocating the reassembly buffer.

## Fuzzing parser code

The patterns above are amenable to fuzzing. A frame parser is a pure function of bytes in, structured data out. AFL++ and libFuzzer both support coverage-guided fuzzing of C parsers with minimal harness code:

```c
/* libFuzzer harness for a Modbus parser */
int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
    modbus_frame_t frame;
    parse_modbus_tcp((uint8_t *)data, size, &frame);
    return 0;
}
```

Running the fuzzer against the parser before deploying on hardware finds the length-field edge cases that code review misses. Keeping the harness in the test suite means regressions are caught when the parser is modified.
Last updated: 18 May 2026
