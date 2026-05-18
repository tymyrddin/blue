# Hardcoded credentials

Hardcoded credentials are endemic in OT firmware. They arrive via several routes: a password typed into a source file during development and never removed, a symmetric key compiled in because the device has no secure storage, a default credential that ships from the vendor and is never changed during commissioning. The coding page covers the first two; vendor defaults and commissioning practice belong to deployment.

## How they end up in firmware

The most direct route is a string literal in source:

```c
#define ADMIN_PASSWORD   "admin1234"
#define MQTT_API_KEY     "a3f8c21b9e4d7f06"

bool authenticate(const char *password) {
    return strcmp(password, ADMIN_PASSWORD) == 0;
}
```

A slightly less obvious route is a key used for symmetric encryption or HMAC, compiled in as a byte array:

```c
static const uint8_t device_key[16] = {
    0x2b, 0x7e, 0x15, 0x16, 0x28, 0xae, 0xd2, 0xa6,
    0xab, 0xf7, 0x15, 0x88, 0x09, 0xcf, 0x4f, 0x3c
};
```

Both survive in the compiled binary unchanged. A firmware image extracted from a device — via JTAG, a flash chip reader, or a firmware update file downloaded from the vendor's support portal — yields its secrets to `strings` in seconds:

```
$ strings firmware.bin | grep -i "pass\|key\|secret\|token"
admin1234
a3f8c21b9e4d7f06
```

`binwalk` goes further: it identifies file systems, compressed sections, and certificate stores embedded in the image, unpacks them, and makes their contents searchable. A firmware image that contains a private key in a PEM file inside a squashfs partition is not meaningfully more protected than one with the key as a byte array in `.rodata`.

The extraction does not require sophisticated tooling or physical access to every device. If the firmware update mechanism accepts images from a server, or if update files are distributed without encryption, the binary is available to anyone who intercepts or downloads it.

## Alternatives in code

### Environment-specific provisioning

The simplest improvement is to remove the credential from source entirely and require it to be provisioned at manufacture or first boot rather than compiled in. The firmware reads the credential from a known location in flash (a dedicated provisioning partition or a protected sector) and refuses to operate if none is present:

```c
int load_device_key(uint8_t *key_out, size_t key_len) {
    if (provisioning_partition_read(key_out, key_len) != PROV_OK) {
        log_fault("no device key provisioned");
        return ERR_NOT_PROVISIONED;
    }
    return OK;
}
```

This separates the firmware image from the credential. The same binary can be deployed to many devices, each with a unique key written at manufacture. The firmware image on the vendor's support portal contains no credentials.

### Derivation from a device identity

Where a hardware identity is available — a silicon serial number, a MAC address written to OTP fuses — a device-unique key can be derived from it and a shared secret known only to the manufacturer:

```c
void derive_device_key(uint8_t *key_out, size_t key_len) {
    uint8_t device_id[8];
    read_silicon_serial(device_id, sizeof(device_id));
    hmac_sha256(manufacturer_secret, sizeof(manufacturer_secret),
                device_id, sizeof(device_id),
                key_out, key_len);
}
```

The manufacturer secret never appears in the firmware. An attacker who extracts the firmware can see the derivation function but cannot reconstruct keys for other devices without the secret. The quality of this approach depends entirely on keeping the manufacturer secret out of the binary — which means it lives in a hardware security module at the factory, not in a build system variable.

### Secure element storage

Some microcontrollers include a secure element or a dedicated key storage peripheral (ATECC608, STM32 STSAFE, Microchip Trust&GO). These store key material in hardware that resists extraction: the key is used via the peripheral's API and never exposed on the bus. The firmware holds a reference to the key slot, not the key:

```c
int sign_firmware_hash(uint8_t *hash, size_t hash_len,
                       uint8_t *sig_out, size_t sig_len) {
    /* key slot 0 holds the device private key; it never leaves the secure element */
    return atecc608_sign(KEY_SLOT_0, hash, hash_len, sig_out, sig_len);
}
```

Secure element storage is the strongest option available on constrained hardware. The cost is the additional component and the complexity of the provisioning workflow that loads the key into the secure element at manufacture.

## What to scan for in code review

String literals of high entropy with no obvious semantic meaning are the first thing to look for. Byte arrays in
`.rodata` that are 16, 24, or 32 bytes long and passed to cryptographic functions are likely key material. `#define` and
`const` declarations with names containing `PASSWORD`, `SECRET`, `KEY`, `TOKEN`, or `CREDENTIAL` are obvious candidates.
A hardcoded IP address or hostname in the same function as a credential suggests the credential is bound to a fixed
endpoint. Comments describing a credential as removed or replaced may indicate the pattern existed and is likely to
recur.

Static analysis tools and secret scanning (truffleHog, `git-secrets`, GitLab's secret detection) catch the obvious patterns in source. They do not catch credentials that are constructed at runtime from fragments or that arrive via a compiled-in lookup table. Those require binary analysis.
