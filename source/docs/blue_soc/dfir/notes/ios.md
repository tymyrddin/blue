# iOS analysis

## iOS File systems

Apple has created their own sets of file system formattings: AFS (Apple File System) and HFS+ (macOS Extended). The latter is the oldest and the legacy file system  which is still supported today. HFS was not future-proof as it cannot support file timestamps past February 6th, 2040. HFS+ did not support encryption at its entirety, and any device such as iMac or iPhone past iOS 10.3 will have had their file system converted from HFS+ to AFS automatically.

AFS features full disk encryption, and smarter data management where a file requiring 3 blocks worth of space when copied, does not require another 3 blocks, but a reference to the file, similar to inodes in Linux.

## Time

iOS devices adopted the use of Mac absolute time with iOS 5 for most of the data. [Mac absolute time](https://www.epochconverter.com/coredata) is the number of seconds that offsets the Mac epoch time, which starts on January 1, 2001.

When analyzing iOS application data, especially web browsers such as Google Chrome, Safari, and Opera, another timestamp format appears: [WebKit/Chrome time](https://www.epochconverter.com/webkit). This is the number of microseconds since January 1, 1601.

## SQLite databases

Apple iOS devices, like other smartphones, make heavy use of SQLite databases for data storage. Many of the built-in applications, such as phone, messages, mail, calendar, and notes, store data in SQLite databases. Apart from this, third-party applications installed on the device also leverage SQLite databases for data storage.

SQLite databases are created with or without a file extension. They typically have the `.sqlitedb` or `.db` file extensions, but some databases are given other extensions as well. 

macOS includes the SQLite command-line utility (sqlite3) by default. This commandline utility can easily access individual files and issue SQL queries against a database.

Raw disk images, filesystems and logical dumps, and backups contain the following SQLite databases that may be important to
an investigation:

* The address book database is a `HomeDomain` file, and it can be found at `private/var/mobile/Library/AddressBook/AddressBook.sqlitedb`. The `AddressBook.sqlitedb` file contains several tables, of which the following three are of particular interest: `ABPerson`, `ABMultiValue`, and `ABMultiValueLabel`.
* In addition to the address book's data, each contact may contain an image associated with it. The address book images database is a `HomeDomain` file, and it can be found at `/private/var/mobile/Library/AddressBook/AddressBookImages.sqlitedb`.
* Phone or FaceTime calls placed, missed, and received by the user are logged in the call history along with other metadata, such as call duration, date/time, and more (iOS 8 +). The call history database is a `WirelessDomain` file, and it can be found at `/private/var/mobile/Library/CallHistoryDB/CallHistory.storedata`. The `ZCALLRECORD` table in the `CallHistory.storedata` file contains the call history.
* The Short Message Service (SMS) database contains text and multimedia messages that were sent from and received by the device along with the phone number of the remote party, date and time, and other carrier information. The SMS database is a `HomeDomain` file, and it can be found at `/private/var/mobile/Library/SMS/sms.db`. 
* Calendar events that have been manually created by the user or synced using a mail application or other third-party applications are stored in the calendar database. The calendar database is a `HomeDomain` file and can be found at `/private/var/mobile/Library/Calendar/Calendar.sqlitedb`.
* The Notes database contains the notes that are created by the user using the device's built-in Notes application. Notes is the simplest application, often containing the most sensitive and confidential information. The Notes database is a `HomeDomain` file and can be found at `/private/var/mobile/Library/Notes/notes.sqlite`.
  * The Safari browser used on an Apple device allows users to bookmark their favorite websites. The bookmarks database is a `HomeDomain` file, and it can be found at `/private/var/mobile/Library/Safari/Bookmarks.db`. The Safari browser stores the recently downloaded and cached data in a database. The database is a HomeDomain file and can be found at `/private/var/mobile/Library/Caches/com.apple.mobilesafari/Cache.db`.
  * A manifestation of the photos in the device's photo album is stored in a database located at `/private/var/mobile/Media/PhotoData/Photos.sqlite`. The photo metadata database file is a member of `CameraRollDomain`.
  * Geolocation history of cell towers and Wi-Fi on the device is stored in a database that is located at `/private/var/root/Caches/locationd/consolidated.db`. The database is a member of `RootDomain`. It contains location information for towers that the device came into proximity with, as well as Wi-Fi networks that were available for the device to connect to. This database is often used to place a person near a specific location, as this data is cached to the database file without the user's consent. The `CompassCalibration` table in the `consolidated.db` file contains the location information along with the timestamps.
  * The voicemail database is a `HomeDomain` file, and it can be found at `/private/var/mobile/Library/Voicemail/voicemail.db`, while the actual voicemail recordings are stored in the `/private/var/mobile/Library/Voicemail/` directory.

## Property lists

Apple uses their own standardisation for files within their file systems: `.plist` files are property files who consist of data from anything such as preferences to application settings and data. They can be formatted as XML, or cannot be opened with a normal text editor and require a hex editor such as `HxD`.

### HomeDomain plist files

* `/private/var/mobile/Library/Preferences/com.apple.mobilephone.plist`, containing the last phone number entered into the keypad regardless of whether it was dialed or not
* `/private/var/mobile/Library/Preferences/com.apple.mobilephone.speeddial.plist`, containing a list of the contacts that were added to the phone's favorites list
* `/private/var/mobile/Library/Preferences/com.apple.AppSupport.plist`, containing the country code that was used for the App Store on the device
* `/private/var/mobile/Library/Preferences/com.apple.Maps.plist`, containing the last latitude, longitude, and address pinned in the Maps application
* `/private/var/mobile/Library/Preferences/com.apple.mobiletimer.plist`, containing a list of world clocks used
* `/private/var/mobile/Library/Preferences/com.apple.Preferences.plist`, containing the keyboard language that was last used on the device
* `/private/var/mobile/Library/Preferences/com.apple.springboard.plist`, containing a list of applications that are shown in the interface and iOS version
* `/private/var/mobile/Library/Preferences/com.apple.mobiletimer.plist`, containing information about the current time zone, timers, alarms, and stopwatches
* `/private/var/mobile/Library/Preferences/com.apple.weather.plist`, containing the cities for weather reports, date, and time of the last update
* `/private/var/mobile/Library/Preferences/com.apple.preferences.network.plist`, containing the status of Bluetooth and Wi-Fi networks
* `/private/var/mobile/Library/Preferences/com.apple.locationd.plist`, containing a list of application identifiers that use the location service on the device 
* `/private/var/mobile/Library/Preferences/com.apple.assistant.backedup.plist`: This will help an examiner to determine whether cloud synchronization is enabled or not

### RootDomain plist files

* `/private/var/root/Library/Preferences/com.apple.preferences.network.plist`, containing information about whether airplane mode is presently enabled on the device
* `/private/var/root/Library/Preferences/com.apple.MobileBackup.plist`, containing the timestamp of when the device was last restored from the backup, the device build version, and the backup build version
* `/private/var/root/Library/Caches/locationd/clients.plist`, containing the location settings for applications and system services

### WirelessDomain plist files

* `/private/wireless/Library/Preferences/com.apple.commcenter.plist`

### SystemPreferencesDomain plist files

* `/private/var/preferences/SystemConfiguration/com.apple.network.identification.plist`, containing networking information of the cached IP
* `/private/var/preferences/SystemConfiguration/com.apple.wifi.plist`, containing a list of previously known Wi-Fi networks and the last time each one was connected to

## Cookies

Cookies can be recovered from `/private/var/mobile/Library/Cookies/Cookies.binarycookies`. This file is a standard binary file containing cookies that are saved when web pages are accessed on the device. This information can be a good indication of what websites the user has been actively visiting. Keep in mind that third-party applications may also contain this file.

To convert the binary cookie to human-readable format, run the [BinaryCookieReader.py](https://gist.github.com/sh1n0b1/4bb8b737370bfe5f5ab8) script.

## Keyboard cache

The keyboard cache is captured and saved in the `dynamic-text.dat` file. This file is located at `/private/var/mobile/Library/Keyboard/dynamic-text.dat` and contains the keyboard cache of text entered by the user. It was designed to autocomplete the predictive common words as well as cache words typed by the user on the device. The file keeps a list of approximately 600 words per language that are used on the iOS device. ***This file is the only source of the artifact should the data be inaccessible, encrypted, or permanently deleted from the iOS device***.

The `dynamic-text.dat` is a binary file, and it can be viewed using a hex editor. This file may contain passwords that are cached by the iOS device, and they can be used to achieve brute force attacks on the device or an encrypted backup of the device. This is sometimes one of the best artifacts recovered from an iOS device.

## Photos

Photos are stored in a directory located at `/private/var/mobile/Camera Roll/Media/DCIM/`, which contains the photos taken with the device's built-in camera, screenshots, selfies, photo stream, recently deleted photos, and accompanying thumbnails. Some third-party applications will also store photos taken in this directory. Every photo stored in the DCIM folder contains Exchangeable Image File Format (EXIF) data. EXIF data stored in the photo can be extracted using ExifTool.

## Thumbnails

The `ithmb` files can be found in `/private/var/mobile/Camera Roll/Media/PhotoData/Thumbnails`. These files contain thumbnails not only for actual photos on the device, but also for deleted ones. For parsing  use the [iThmb Converter](http://www.ithmbconverter.com/en/download/).

## Wallpaper

The current background wallpaper set for the iOS device can be recovered from the `LockBackgroundThumbnail.jpg` file that is found in `/private/var/mobile/Library/SpringBoard/LockBackgroundThumbnail.jpg`.

## Recordings

The recorded voice memos are stored in the /private/var/mobile/Media/Recordings/ directory. Recordings could be used to identify a person, based on their voice, and they may also contain information, such as voice reminders, which won't be stored in the calendar database.

## Downloaded applications

Third-party applications, which are downloaded and installed from the App Store, including applications such as Facebook, WhatsApp, Viber, Threema, Tango, Skype, Gmail, and more, contain a wealth of information that is useful for an investigation. Some third-party applications use Base64 encoding, which needs to be converted for viewing purposes as well as encryption. 

Applications that encrypt the database file may prevent the researcher from accessing the data residing in the tables. Encryption varies among these applications based on the application and iOS versions.

A unique subdirectory GUI is created for each application that is installed on the device in the `/private/var/mobile/App/` directory. Most of the files stored in the application's directory are in the SQLite and plist format. Each file can be examined for relevance. Oxygen Forensics and Magnet AXIOM can extract these artifacts, and manually running queries and parsing the data is always a possibility.

## Resources

* [About DFIR/Tools & Artifacts > iOS](https://aboutdfir.com/toolsandartifacts/ios/)
* [DFIR Artifacts > iOS Artifact List](https://dfirartifacts.com/ios-artifacts/)
* [iOS Forensic Investigative Methods](http://www.zdziarski.com/blog/wp-content/uploads/2013/05/iOS-Forensic-Investigative-Methods.pdf)
