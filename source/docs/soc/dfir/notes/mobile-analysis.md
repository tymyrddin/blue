# Mobile analysis

Malicious applications are commonly delivered through different types of channel:

* a link in a phishing email
* a link in a chat group
* a link on a shady website
* on Google Play Store
* on alternative application stores

## Basic static analysis of samples

Static analysis can be done with various tools to decompile the binary, such as [jadx](https://testlab.tymyrddin.dev/docs/dfir/jadx), [radare2](https://testlab.tymyrddin.dev/docs/dis/r2), [rizin](https://testlab.tymyrddin.dev/docs/dis/rizin), and [jeb](https://testlab.tymyrddin.dev/docs/dis/jeb). Tools such as [droidlysis](https://testlab.tymyrddin.dev/docs/dfir/droidlysis) for automatic offline static analysis can also be used.

1. Get the sample: In some cases, a sample will have to be retrieved from a potentially compromised device. For Android, you can try using [mvt](https://testlab.tymyrddin.dev/docs/dfir/mvt) to download the APK file. If the application to be analysed is available on Google Play Store, try using [apkeep](https://testlab.tymyrddin.dev/docs/dfir/apkeep) to download it. 
   * Note that ADB usually runs with a non-privileged account. It will not provide access to internal application data. On a rooted phone, ADB will run as root and provide access to internal application data and OS files and folders. Perhaps [BusyBox](https://testlab.tymyrddin.dev/docs/dfir/busybox) can be used.
2. Store the sample, compute its SHA256 hash and only work on copies of the original file (to preserve its integrity).

```text
sha256sum sample.apk
```

3. Identify the type of sample: The `.apk` file extension is an Android Package file used to distribute applications via Google Play Store (or FDroid). The `.ipa` file extension indicates an iPhone application archive file. It is usually encrypted with Apple's FairPlay DRM technology, and compressed for the ARM architecture and can only be installed on an iPhone, iPod Touch, or iPad -> You may have to digitally sign the sample with your PGP key.
4. Retrieve basic information: Use tools to extract information that will help you identify the binary and its potential origin ([jadx](https://testlab.tymyrddin.dev/docs/dfir/jadx), [androguard](https://testlab.tymyrddin.dev/docs/dfir/androguard), [Pithus (online)](https://testlab.tymyrddin.dev/docs/dfir/pithus), and a [sandbox](https://testlab.tymyrddin.dev/docs/phishing/sandbox))
    * The certificate can help distinguish between an original application and a potentially suspicious file. Search for it on the Google Play Store and compare the signing certificate fingerprints. Digital signatures of Android applications cannot be faked. 
    * Check if the sample was frosted by Google Play Store (Android only).
    * Review the permissions requested and evaluate if they align with the legitimate purpose and functionality of the application.

## Related labs

* [Android malware analysis (Pithus and jadx)](../thm/android.md)

## Resources

* Esther Onfroy, [Beginner guide - How to handle a potentially malicious mobile app](https://pts-project.org/guides/g3/), 2023, PTS Project
