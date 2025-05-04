# iOS acquisition

In a court of law, any evidence submitted must be admissible. This complex process involves the "chain of custody". No matter how indicting a piece of evidence is, it can be dismissed if there is insufficient documentation and/or negligence in handling - all the way from the crime scene to the courtroom.

## Extraction methods

* Direct acquisition: Interacting with the device itself if, for example, it was found unlocked. No need to bypass anything!
* Logical/backup acquisition: Using the iTunes backup of a phone for file system entry, or the use of forensics software to analyse data found within these backups i.e. `.plists` 
* Advanced logical acquisition: Using the escalated privileges to an iPhone file system found when pairing an iOS device to a Computer using either iTunes or Xcode.
* Physical acquisition: The most direct approach, physical acquisition is the use of forensic imaging kits such as Cellebrite to take entire bit-for-bit copies of both the data and system partitions. Unsophisticated tools (such as those that don't launch the iPhone into a custom bootloader) will leave the data encrypted. 

## Direct acquisition

Direct acquisition covers three scenarios:

1. There is no password on the phone
2. There is a password, but it is known to the analyst
3. The analyst has a "Lockdown Certificate".

Non-forensically focused, and free, applications such as iFunbox perform the same job in this scenario. Applications such as the iFunbox are capable of writing to the device being analysed. As a result, the image made will be inadmissible as evidence because there is a possibility data was (over)written to the device that wasn't from the suspect - a defence attorney can argue the data could have been left by the forensic analyst.

## Logical or backup acquisition

If you can't analyse a phone, just analyse the unlocked PC that has an entire backup upon it. Applicable to the above three scenarios above, the backup acquisition method is the cheapest way of acquiring data from a device such as an iPhone. By using iTunes' backup facility, analysts can simply use a computer that has been paired with the iPhone. 

Logical acquisition involves copying what the user has access to on their mobile, which means that data is extracted from backup. This method requires the device to be unlocked. It provides readable data, unlike some encrypted parts in the physical image. Recovering data from unallocated space is limited to data recovery from unallocated SQLite records. Logical acquisition is where the big money starts to roll in (for companies such as Cellebrite). 

## iTunes backups & trust certificates

When backing up an iPhone, iTunes accesses the iPhone in a privileged state - similar to using the sudo command on Linux to run a command with root privileges. iPhones will only back up to trusted computers. When plugging into a new device, the iPhone will ask the user whether they wish to trust the computer. "Trusting" a computer involves generating a pair certificate on both iPhone and computer. If the certificate matches up on both devices, the iPhone can be backed up.

iTunes will generate a certificate using the iPhone's unique identifier once data read/write has been allowed by trusting the computer on the iPhone. This certificate will be stored on the trusted computer for 30 days. After which you will need to re-trust the device. The certificate that is generated can only be used for 48 hours since the user has last unlocked their iPhone. 

If the iPhone has been connected to a trusted computer but the iPhone hasn't been unlocked in a week, the certificate will not be used, although it is still valid. Once the iPhone is unlocked, the iPhone will automatically allow read/write access by the trusted computer without the "Trust This Computer" popup. If you were to connect the iPhone to the trusted computer 6 hours since it was last unlocked, the iPhone will allow read/write access straight away.

This process is a security measure to prevent attacks such as "Juice Jacking", an attack involving maliciously created USB chargers or cables (such as the [O.MG Cable](https://testlab.tymyrddin.dev/docs/hardware/hid)) to steal data or infect devices. 

iTunes allows for two types of backups, "Unencrypted" and "Encrypted". Unencrypted backups make a copy of photos that aren't synced to iCloud, a copy of browsing history etcetera. No passwords or health and Homekit data is backed up. These are only backed up if the "Encrypted" option is used.

Because iTunes accesses the iPhone with elevated privileges using lockdown certificates, data can be extracted from the iPhone such as the keychain. This keychain includes (but isn't limited) to passwords such as:

* Wi-Fi Passwords
* Internet Account Credentials from "Autofill Password"
* VPN
* Root certificates for applications
* Exchange/Mail credentials

## Physical acquisition

The copying process in this method includes the device storage and the file system. The copying is done on the bits level acquiring all data. This includes deleted data and the ability to access the unallocated space. ***Physical acquisition is supposedly not useful for iPhone 5s and later*** due to the Secure Enclave hardware feature in Apple devices. It provides an additional layer of security by its isolation from the main processor. This security mechanism keeps the user data encrypted even if the OS is compromised. File system acquisition requires a jailbroken device. Jailbreaking will change the original data on the device. It is not a reversible change.

## Or?

Toolkits such as UFED can use all the acquisition methods. UFED is capable of forcing an iDevice to boot using UFED's custom bootloader, bypassing the entire iOS operating system, similar to rooting an android, and giving an entire dump of the entire device. Mind that Cellebrite code contains the completely unrelated.

## Resources

* [Forensic Analysis of iTunes Backup](https://farleyforensics.com/2019/04/14/forensic-analysis-of-itunes-backups/), Jack Farley, 2019
* [Cellebrite Says It Can Unlock Any iPhone for Cops](https://www.wired.com/story/cellebrite-ufed-ios-12-iphone-hack-android/), 2019
* [Exploiting vulnerabilities in Cellebrite UFED and Physical Analyzer from an app's perspective](https://signal.org/blog/cellebrite-vulnerabilities/), moxie0, 2021

