# Memory protection

| Technique	                         | Description	                                 | Implementation                                                   |
|------------------------------------|----------------------------------------------|------------------------------------------------------------------|
| System Integrity Protection (SIP)	 | Prevents root from modifying protected dirs	 | `csrutil status`                                                 |
| Library Validation	                | Blocks injection of unsigned libraries	      | Entitlements: `com.apple.security.cs.disable-library-validation` |
| Kernel Extensions (KEXT) Blocking	 | Monitor unauthorized kext loading	           | `kmutil showloaded`                                              |