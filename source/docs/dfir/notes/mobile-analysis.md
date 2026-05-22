# Mobile analysis

Static analysis notes for potentially malicious mobile application samples.

## Basic static analysis of samples

Decompilation tools include `jadx`, `radare2`, `rizin`, and `jeb`. `droidlysis` automates offline static analysis.

1. Get the sample. For Android, `mvt` can download the APK from a compromised device; `apkeep` retrieves it from the Play Store. ADB runs with a non-privileged account on unrooted devices, limiting access to internal application data. On a rooted device, ADB runs as root and exposes application data and OS files; BusyBox extends this further.

2. Store the sample, compute its SHA256 hash, and work only on copies.

```text
sha256sum sample.apk
```

3. Identify the file type. `.apk` is an Android package. `.ipa` is an iOS application archive, encrypted with Apple's FairPlay DRM and compiled for ARM. Re-signing with a PGP key may be necessary before analysis.

4. Retrieve basic information using `jadx`, `androguard`, Pithus (online), or a sandbox.
   * Signing certificate fingerprints are worth checking against the Play Store listing. Android app signatures cannot be forged.
   * For Android, check whether the sample was frosted by Google Play Store.
   * Review requested permissions against the stated application purpose.

## Resources

* Esther Onfroy, [Beginner guide - How to handle a potentially malicious mobile app](https://pts-project.org/guides/g3/), 2023, PTS Project
