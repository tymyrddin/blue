# Forensic choreographies

## First responder

A dedicated first responder who is alerted and called to the scene usually has some knowledge or understanding of the workings of devices, networks, and perhaps even of the IT infrastructure in the community or organisation, if applicable. First responders do not have to be may not be skilled in digital forensics or digital investigations.

First responders are responsible for securing the scene and ensuring that the data, peripherals, equipment, and storage are not used, tampered with, removed, or compromised by unauthorised individuals, so as not to compromise a possible investigation for a legal case. The below therefor assumes heading for a legal case. Better too much than too little.

Documentation of the scene is usually also done by first responders to aid in further investigations. Documentation of the scene can include photographs, video, voice recording, and manual documentation of:

* The room where the device is located (desk, ceiling, entrance/exit, windows, lighting, electrical outlets, and data drops)
* The state of the device (on, off, power light blinking)
* The screen contents and whether the device is on (operating system, running programs, date and time, wired and/or wireless network connectivity)
* Books, notes, and pieces of paper
* Connected and disconnected cables

### Audit trails

An audit trail or log maintains a historical record of actions, events, and tasks. It can have various levels of detail and can be manual or automated.

During a forensic examination, it’s beneficial to keep a high-level log of pending and completed activity. Pending tasks turn into completed tasks, and completed tasks make up the examination’s historical record. Often while working, you’ll think of a task that you need to address sometime in the future or a task you’ve completed and should note. Making quick notes and more comprehensive task lists becomes increasingly valuable as the length of the examination grows (possibly to many hours, days, or longer) or when more than one examiner is involved.

### Task management

* Helps ensure nothing was forgotten
* Avoids duplicating work already done
* Improves collaboration and coordination when working in teams
* Shows compliance with policies and procedures
* Facilitates accounting, including billing
* Helps produce documentation and reports (formal incident reports or forensic reports)
* Allows for post-incident review to identify lessons learned and support process optimization
* Helps to maintain a longer-term historical record of completed activity
* Supports learning and education for new team members
* Serves as a guide to remember complex procedures
* Provides information for troubleshooting problems and getting support
* Maintains a record of work done by external and third-party examiners

### Chain of custody (CoC)

A CoC is a form that legally ensures the integrity of evidence as it is exchanged between individuals, and provides a level of accountability as personal identification is required when completing the forms. This form gives an exact log and account of the transportation and the exchange between parties, from collection at the scene to a presentation in a court. More in [Computer forensics: Chain of custody [updated 2019]](https://resources.infosecinstitute.com/topic/computer-forensics-chain-custody/).

## Data acquisition

Once the scene has been secured and documented, the forensic investigation can start: the process of acquiring what can be considered as physical evidence. There are multiple scenarios in which data is acquired for a digital forensic investigation. Procedures which can be used in every environment:

1. Make sure a write blocker is attached/active.
2. Identify devices, partitions, input and output files, and parameters 
3. Make image
4. Hash the evidence before and during, or after, acquisition to provide proof that it was not tampered with.

### Live acquisition

Investigating a live system means that logs and timestamps will be generated while the system is being examined. Therefore, thorough documentation will justify the actions taken and not be viewed as evidence tampering. When investigating a powered-on device:

* Move the mouse or glide your fingers across the touchpad if you suspect the device may be in a sleep state. Do not click on the buttons as this may open or close programs and processes.
* Photograph and record the screen and all visible programs, data, time, and desktop items.
* Data stored in RAM and paging files must be collected with as little modification to the data as possible. Use Guymager, dc3dd in Kali Linux. CAINE and Helix can also be used for acquiring RAM and the paging file.
* Due to the easy availability of full disk encryption or full volume encryption, ***DO NOT*** pull the plug on computer systems.

### Mobile

If the device is powered on, it may contain volatile encryption keys and should not be turned off. A power source should be connected as soon as possible to avoid the device losing power. Be sure to seize the charging cable to keep power to the device. Place the device in "Airplane Mode" and verify that Wi-Fi and Bluetooth are off. 

If you cannot put the device in "AirplaneMode", place device in a Faraday Bag or double wrap in aluminum foil to keep signals from potentially altering the device. Keep device charging if at all possible.

### Post-mortem acquisition

At boot time, a PC, mobile phone, or media player executes boot activities that can overwrite previously cached data. Powered-off devices should never be turned on (unless done so by a forensic investigator), to ensure that existing data is not erased and that new data is not written. Devices can appear as if they are off while in a sleep or hibernate state. As a simple test, the mouse can be moved and monitors (if any) can be switched on to check state. Even if they are in an off state, photograph the screen and ports.

Depending on the incident type, use a pair of latex gloves, to avoid leaving additional fingerprints on the system and components.

Phones, media players, laptops, or any devices that can communicate over any network can potentially be altered while being seized or even after they have been seized. This can be caused by either deliberate tampering or unintentional changes (humidity or electricity). Switch the device to airplane mode to avoid any further connections and communications, and consider the use of containers that can shield the device from external radiofrequency (RF) sources, such as a Faraday bag.

When investigating portable and mobile devices ***in an already off state*** and not damaged, do not turn it back on. Remove the battery (if possible) and if required (Note that removing the battery can ***alter the contents in the volatile memory***, even when in an off state. Whether to remove the battery depends on the type of incident). Place it in an evidence bag to ensure that there will be no way of accidentally turning on the device once unplugged.

If the device is submerged in liquid, or had liquid damage, remove it from the liquid only if you feel you can remove the battery (normally possible with Android devices). Once the battery is removed, place the device back in the liquid. 

Collect basic information about the device including Model, Serial Number, Android OS or iOS Version and/or Networks.

### Write blocking

This is when a forensic investigator gains access to the electronic device(s) containing raw data that has been identified as relevant for the specific case.

The original evidence should only be used to create forensic copies or images. A write blocker (either in hardware or in software) is typically used to guarantee that no data is written to the original storage media. If a hardware write blocker is not available, software versions are available as standalone features in Caine, and as a part of some commercial and open source tools, such as EnCase and Autopsy. Choose a write blocker based on functionality, not just cost.

### Data imaging and hashing

[Imaging](acquisition.md) is the exact copying of data either as a file, folder, partition, or entire storage media or drive. When doing a regular copy of files and folders, not all files may be copied due to their attributes being set to the system or even hidden. To prevent files from being left out, a ***bit-stream copy*** is used in which every bit is copied or imaged exactly as it is on the current medium as if taking a picture or snapshot of the data, creating a ***physical image***.

A digital signature (cryptographic hash) is calculated both for the original media and for the copy, to verify that the evidence was not tampered with or modified after the evidence was acquired. The stronger the cryptographic algorithm used, the less chance of it being attacked or compromised. This means that the integrity of the evidence and physical images created remain intact, which will prove useful in forensic cases and expert testimony.

The standard cryptographic algorithms used in digital forensics are Message Digest 5 (MD5) and the Secure Hashing Algorithm (SHA-1). MD5 creates a 128-bit digital fingerprint, SHA-1 produces a 160-bit digital fingerprint.

### Volatile evidence

The term ***forensically sound manner*** means leaving the smallest possible footprint during collection to minimise the amount of data being changed with the collection. To collect volatile evidence, start from the most to the least volatile:

1. Live system
2. Running
3. Network
4. Virtual
5. Physical

Approach volatile data collection with the same mindset as creating forensic images. Document each step, because any interaction with the machine to collect volatile data, which will change the evidence. Changes made do not affect what is under investigation, but changes are being made to the system; In a legal case a question can be asked about potential changes to the evidence while testifying at an administrative or judicial proceeding.

### Collecting RAM

RAM is considered to be the most volatile of all volatile data.

Collecting the volatile data may not always be possible, depending on the specific set of circumstances on the scene. 
If, for example, there is a destructive process running on the machine and the information to be collected is being altered or overwritten, you may not want to take the time to collect the RAM as evidence is being manipulated.
If it is a remote connection causing the destructive process, document the connection, sever the connection, and then collect the RAM. It depends. 

If the attacker is connected remotely and is accessing highly sensitive data, you will probably want to interrupt the connection.If it is not critical information, it may be useful to let the attacker maintain access while you collect the RAM.

### Making a working copy

* A forensic copy is a straight bit-for-bit copy of the source to the destination. Not very common. Make sure the  destination device has no old data on it to prevent cross-contamination between the current and a past investigation. Recover deleted files, file slack, and partition slack. 
* A forensic image or forensic evidence file is a bit-for-bit copy of the source device, with the data stored in a forensic image format (DD, E01, AFF). Recover deleted files, file slack, and partition slack.
* A logical forensic image is restricted to specific datasets. It is not allowed to access the entire container. This can be used when extracting data from a server (the server can not be shut down) by making logical copies of the files and folders pertinent to an investigation. Deleted files, file slack, and partition slack are not recovered.

## File recovery and data carving

File recovery techniques make use of the file system information and, by using this information, many files can be recovered. If the information is not correct, then it will not work. Data carving works only on raw data on the media and is not connected with file system structure. Data carving doesn’t care about any file systems which is used for storing files and is widely used for recovering deleted files and restoring valuable information from corrupted drives.

### Recovery

Most computer systems, digital devices, and file systems are typically designed to treat information in the most efficient way to enhance performance and the user experience. They are not designed to securely wipe or destroy data. In most modern file systems, only the pointer to the file is marked `available` or `unallocated`, marking the space as being available, and a new file can overwrite the previous file. Data can thus be recovered from the storage area even after deletion of a file, as long as the data area was not overwritten.

Even if an image were deleted years prior to an investigation, parts of the image might still be extracted. The image data can be rebuilt in a viewer, and represent the original material and its content, even with details or portions of the data missing.

In cases of deleted files, it is essential to carefully document traceability to the original data source, since methods used for examination may change the state of data. These actions need to be documented to maintain evidence integrity.

Corrupt, severely damaged, or partially wiped and overwritten filesystems require manually reassembling sectors or blocks into files for recovery and other low level analysis techniques.

### Carving

Carving only uses the information in the raw data, not the file system information. 

There are many carving techniques and [carving tools](https://testlab.tymyrddin.dev/docs/dfir/carving) and there is no standard method of rating or comparing between them.

Always use multiple tools to ensure that the results are accurate by comparing the results of the tools used. And keep a log of tool testing for verification of the findings.

### Parsers

Media file parsers use techniques to identify patterns or signatures associated with particular file formats and types. Most file types contain headers and footers that make them readable to the applications handling them; these applications render the file as intended for use by the user. The use of carving tools allows for selecting a set of file types to recover from a piece of media. Media carving can be quite useful in order to acquire deleted files such as previously deleted images.

Other parsers are useful for examining one of the most common electronic communication protocols: email. Email parsers can crawl through the raw data copied from a digital device and render individual emails in a manner that makes it easier to analyse them in later phases of an investigation.

The parsing of proprietary files and objects requires examining the information contained within files.

Automation is an objective in itself during the examination phase, for reasons of both forensic soundness and efficiency. Most of the tasks in the examination phase can be automated using scripts or programs. File parsing, string searches, and extraction of compressed files will significantly reduce the manual task load, in particular when working with large datasets.

## Analysis in general

In the analysis phase, the digital objects to be used as digital evidence to support or refute a hypothesis of a crime, incident, or event, are determined. For example:

* Identifying and fingerprinting devices, operating systems, and running services.
* Analysing memory dumps to discover traces of ransomware.
* Swap analysis.
* Password dumping.
* Examining a Firefox browser and Gmail artifacts.

Statistical methods, manual analysis, techniques for understanding protocols and data formats, linking of multiple data objects (for example with data mining), and timelining are some of the techniques that are used during analysis.

## Mobile forensics

The term "mobile devices" includes mobile phones, smartphones, tablets, and GPS units to wearables and PDAs. These small-sized machines amass huge quantities of data on a daily basis, which can be extracted to facilitate an investigation.

* Incoming, outgoing, missed call history
* Phonebook or contact lists
* SMS text, application based, and multimedia messaging content
* Pictures, videos, and audio files and sometimes voicemail messages
* Internet browsing history, content, cookies, search history, analytics information
* To-do lists, notes, calendar entries, ringtones
* Documents, spreadsheets, presentation files and other user-created data
* Passwords, passcodes, swipe codes, user account credentials
* Historical geolocation data, cell phone tower related location data, Wi-Fi connection information
* User dictionary content
* Data from various installed apps
* System files, usage logs, error messages
* Deleted data from all of the above

It is hard to be in control of data on mobile devices because the data is mobile as well. Once communications or files are sent from a smartphone, control is lost. Although there are different devices having the capability to store considerable amounts of data, the data in itself may physically be in another location. 

