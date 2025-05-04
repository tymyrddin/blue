# Image acquisition

Maximizing the amount of data extracted from a storage medium, minimising the disturbance to the storage device and medium, preserving the collected evidence, and documenting the process (including errors).

[Assumptions](preparation.md):

* The storage device is physically attached to the forensics examiner’s acquisition workstation.
* The storage device has been positively identified.
* The appropriate write-blocking mitigation is in place to prevent modification of the subject drive.
* Disk capacity planning has been performed to ensure disk space is not an issue.

## dd tools

### Standard dd

To copy a disk block device to a file:

    # dd if=/dev/sde of=image.raw

with protection from unreadable blocks by skipping (`noerror`) and padding them with zeros (`sync`):

    # dd if=/dev/sde of=image.raw conv=noerror,sync

### dcfldd

To image a disk, ensuring blocks containing unreadable sectors are padded:

    # dcfldd if=/dev/sde of=image.raw conv=noerror,sync errlog=error.log

### dc3dd

To image a disk, adding the `conv=noerror,sync` flag is not needed because it is built in:

    # dc3dd if=/dev/sde of=image.raw log=error.log

Traditional `dd` has no capability for hashing, logging to a file, or other features handy for forensic acquisition. Both `dcfldd` and `dc3dd` have additional features for cryptographic hashing, image splitting, and piping to external programs.

## Forensic formats

Several imaging formats, like FTK and EnCase for example, were specifically designed with forensics in mind. These are commercial proprietary formats and have been reverse engineered to allow development of open source–compatible tools.

### ewfacquire

`libewf` is a library to access the Expert Witness Compression Format (EWF). Its `ewfacquire` tool creates acquisition files that enable interoperability with EnCase, FTK, and Sleuth Kit. The tool can also convert raw images into other formats.

To acquire an attached disk device (a MacBook Air connected to the examiner workstation in Target Disk Mode with a Thunderbolt-to-FireWire adapter):

```text
# ewfacquire -c best -t /exam/macbookair /dev/sdf
```

### ftkimager

The ftkimager tool can take input from a raw device, a file, or `stdin`. It outputs to an FTK SMART format, an EnCase EWF format, or `stdout`. A number of other features are supported, including the addition of case metadata into the saved formats, compression, output file splitting ("image fragments"), hashing, and encrypted images.

Example:

```text
# ftkimager /dev/sdf --s01 --description "serial number and model string" sandisk
```

The ftkimager creates a log file with basic metadata and any additional information that was added using flags on the command line.

### SquashFS forensic evidence container

Configure [sfsimage](https://testlab.tymyrddin.dev/docs/dfir/squashfs) to use `dc3dd` as the imaging tool by editing the `DD` variable in the beginning of the shell script:

    DD="dc3dd if=$DDIN log=errorlog.txt hlog=hashlog.txt hash=md5"

Then the block device can be imaged using the `-i` flag:

    $ sfsimage -i /dev/sde philips-usb-drive.sfs

The size of the compressed `*.sfs` file:

    $ ls -lh *.sfs

## Cryptographic hashing

The cryptographic hashing of forensic images is typically included as part of the imaging process.

    # dcfldd if=/dev/sde of=image.raw conv=noerror,sync hash=md5,sha256
    # dc3dd if=/dev/sde of=image.raw hash=md5 hash=sha1 hash=sha512
    # dd if=/dev/sde | tee image.raw | md5sum

When imaging an older or damaged disk, block read errors can occur. These errors can happen in random places during the acquisition, and the frequency can increase over time, and the cryptographic hash might be different each time the disk is read. The solution to this problem is to use hash windows, or piecewise hashing.

    # dcfldd if=/dev/sde of=image.raw conv=noerror,sync hashwindow=1M
    # dc3dd if=/dev/sda hof=image.raw ofs=image.000 ofsz=1G hlog=hash.log hash=md5

## Signing images

Cryptographic signing of forensic images binds a person (or that person’s key) to the integrity of the image.

Sign the log output containing the MD5 hash and other details:

    $ gpg --clearsign hash.log
    $ cat hash.log.asc

The `gpgsm` tool is part of GnuPG2 and supports managing X.509 keys, encryption, and signatures using the S/MIME standard. Once the necessary keys have been generated and certificates have been installed, you can use `gpgsm` to sign files in a similar manner to GPG:

    $ gpgsm -a -r username@example.com -o hash.log.pem --sign hash.log

## Timestamping

n some cases, it is also useful to bind the forensic acquisition results to a specific point in time. Timestamping is a formal standard defined in RFC-3161, which describes the format of a timestamp request and response. OpenSSL can create and send timestamp requests and verify responses.

To request an RFC-3161 compliant timestamp for the acquisition log:

    $ openssl ts -query -data hash.log -out hash.log.tsq -cert

This timestamp request contains a hash of the hash.log file, not the actual file. The file is not sent to the timestamping server. This is important from an information security perspective. The timestamp service provider is only trusted with timestamp information, not the contents of the files being timestamped.

The generated request can then be sent to a timestamping service using the `tsget` command included with OpenSSL:

    $ tsget -h https://freetsa.org/tsr hash.log.tsq

If the timestamping server accepts the request, it returns an RFC-3161 compliant timestamp. To view it:

    $ openssl ts -reply -in hash.log.tsr -text

