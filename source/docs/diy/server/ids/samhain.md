# Samhain

The [Samhain](https://www.la-samhna.de/samhain/index.html) host-based intrusion detection system (HIDS) provides file integrity checking, log file monitoring/analysis, rootkit detection, port monitoring, detection of rogue SUID executables, and hidden processes. Like having tripwire when it was still working plus rkhunter rolled into one. 

Plus, it can be expanded to include more (remote) clients if set up in client-server mode and getting [Beltane II](https://www.la-samhna.de/beltane/index.html) as well (not GPL licensed and can be used on a limited amount of (10) machines for a small donation). Something that can maybe be used for guarding client machines remotely. Yum.

## Problems

* A steeper learning curve than for other programs.
* No binaries available, setting it up is not easy for non-techies

## Download

Download samhain-current.tar.gz from [Samhain Labs](https://www.la-samhna.de).

## Verification

    cd Downloads/
    $ gunzip samhain-current.tar.gz
    $ tar -xf samhain-current.tar
    $ gpg --keyserver pgp.mit.edu --recv-key 0F571F6C
    gpg: key 1AAD26C80F571F6C: 3 duplicate signatures removed
    gpg: key 1AAD26C80F571F6C: 96 signatures not checked due to missing keys
    gpg: key 1AAD26C80F571F6C: "Rainer Wichmann <rwichmann@la-samhna.de>" not changed
    gpg: key 3A2AAE330F571F6C: 21 signatures not checked due to missing keys
    gpg: key 3A2AAE330F571F6C: "Rainer Wichmann <rwichmann@la-samhna.de>" not changed
    gpg: Total number processed: 2
    gpg:              unchanged: 2
    $ gpg --fingerprint 0F571F6C
    pub   dsa1024 1999-10-31 [SCA]
          EF6C EF54 701A 0AFD B86A  F4C3 1AAD 26C8 0F57 1F6C
    uid           [ unknown] Rainer Wichmann <rwichmann@la-samhna.de>
    uid           [ unknown] Rainer Wichmann <rwichmann@hs.uni-hamburg.de>
    sub   elg1024 1999-10-31 [E]

    pub   rsa1024 2014-07-21 [SCEA] [revoked: 2016-08-16]
          5B17 5A1C 8C1B 7BC3 CB12  0FAA 3A2A AE33 0F57 1F6C
    uid           [ revoked] Rainer Wichmann <rwichmann@la-samhna.de>

    [nina@archlinux Downloads]$ gpg --verify samhain-4.2.4.tar.gz.asc samhain-4.2.4.tar.gz
    gpg: Signature made Thu 21 Dec 2017 09:05:24 PM CET
    gpg:                using DSA key 1AAD26C80F571F6C
    gpg: Good signature from "Rainer Wichmann <rwichmann@la-samhna.de>" [unknown]
    gpg:                 aka "Rainer Wichmann <rwichmann@hs.uni-hamburg.de>" [unknown]
    gpg: WARNING: This key is not certified with a trusted signature!
    gpg:          There is no indication that the signature belongs to the owner.
    Primary key fingerprint: EF6C EF54 701A 0AFD B86A  F4C3 1AAD 26C8 0F57 1F6C

And that fits with the key given on the site.

## Simple configuration stand-alone 

Configure [stand-alone version](https://www.la-samhna.de/samhain/manual/installation-configure.html):

    $ ./configure
    checking for a BSD-compatible install... /usr/bin/install -c
    checking whether make sets $(MAKE)... yes
    checking build system type... x86_64-unknown-linux-gnu
    checking host system type... x86_64-unknown-linux-gnu
    checking for gcc... gcc
    .
    .
    .
    [snip]
    .
    .
    .
    config.status: creating deploy.sh
    config.status: creating config.h
    config.status: executing default commands

     samhain has been configured as follows:
         System binaries: /usr/local/sbin
      Configuration file: /etc/samhainrc
            Manual pages: /usr/local/man
          Data directory: /var/lib/samhain
           Database file: /var/lib/samhain/samhain_file
                PID file: /run/samhain.pid
                Log file: /var/log/samhain_log
                Base key: 1617215581,281009996

        Selected rc file: samhainrc.linux
    $

## Configuration for watching logins, mounts and rootkits

Watching over logins:
    
    $ ./configure --enable-login-watch

Over mountings:

    ./configure --enable-mount-check

Samhain can check for kernel rootkits on FreeBSD and Linux with:

    $ ./configure --with-kcheck=systemmap

where `systemmap` is the System.map file for a particular system.

## Configuration for stealth

If an intruder cannot discover that samhain is running, he cannot compromise it. You can, for example, use:

    $ ./configure --enable-install-name=somename

where `somename` is an innocuous-sounding executable name. To make it less likely that the program isn't accidentally discovered, samhain can be set to never respond to the command line. Or, it can be set to respond to the command line only after a certain password is given:

    $./configure --enable-nocl=somepass

If `somepass` is set to an empty string it disables command-line interaction completely. Otherwise, invoke samhain with `somepass` as the first argument followed by the other arguments.

There are many other interesting stealth options available, all documented along with the rest of the compilation switches in [Appendix A of the documentation](https://www.la-samhna.de/samhain/manual/compilation-options.html).

## Build

Next step is to [Build](https://www.la-samhna.de/samhain/manual/installation-build.html):

    $ make
    gcc -I. -o depend-gen ./src/depend-gen.c
    update depend.dep ...
    gcc -I. -o mkhdr ./src/mkhdr.c
    gcc -I. -o encode ./src/encode.c
    encode 0 config.h
    ./encode 0 ./src/sh_files.c --> x_sh_files.c
    gcc  -DHAVE_CONFIG_H -I. -I./include   -O2 -D_FORTIFY_SOURCE=2 -fstack-protector-all -pthread -DUSE_MALLOC_LOCK=1 -fPIE -Wall -W  -fno-strength-reduce -fno-omit-frame-pointer -Wno-empty-body -Wno-invalid-source-encoding  -DSH_STANDALONE -o sh_files.o -c x_sh_files.c
    .
    .
    .
    [snip]
    .
    .
    .
    sh_string.o sh_inotify.o dnmalloc.o sh_audit.o sh_registry.o sh_ipvx.o sh_restrict.o sh_filetype.o sh_sub.o sh_fInotify.o sh_checksum.o sh_guid.o sh_sem.o sh_dbIO.o sh_dbCheck.o sh_dbCreate.o  -lz  -lresolv -lnsl  -lnsl -lattr -lacl
    gcc -I.  -o sstrip ./src/sstrip.c
    $

## Installation
      
[Install](https://www.la-samhna.de/samhain/manual/installation-install.html):

    $ make install /usr/bin/install -c -m 700 samhain /usr/local/sbin/samhain
    /usr/bin/install: cannot create regular file '/usr/local/sbin/samhain': Permission denied
    chmod: cannot access '/usr/local/sbin/samhain': No such file or directory
    make: *** [Makefile:518: install-program] Error 1

Ah yes, installing an application and using `./configure` without the `--prefix=` option, the make install process will 
install the compiled files in to the predefined paths in the system's file system, and that means special permissions 
for writing the files is required:

    $ sudo make install
    [sudo] password for nina: 
     /usr/bin/install -c -m 700 samhain /usr/local/sbin/samhain
    /bin/sh ./mkinstalldirs /usr/local/man/man8
    mkdir /usr/local/man/man8
    /bin/sh ./mkinstalldirs /usr/local/man/man5
    mkdir /usr/local/man/man5
      /usr/bin/install -c -m 644 ./man/samhain.8 /usr/local/man/man8/samhain.8
      /usr/bin/install -c -m 644 ./man/samhainrc.5 /usr/local/man/man5/samhainrc.5
    gcc  -DHAVE_CONFIG_H -I. -I./include   -O2 -D_FORTIFY_SOURCE=2 -fstack-protector-all -pthread -DUSE_MALLOC_LOCK=1 -fPIE -Wall -W  -fno-strength-reduce -fno-omit-frame-pointer -Wno-empty-body -Wno-invalid-source-encoding  -DSH_STANDALONE -DSH_IDENT=\"daemon\" -DTRUST_MAIN -DSL_ALWAYS_TRUSTED=0 -o trustfile ./src/trustfile.c
    mkdir /var/lib/samhain
    ./samhain-install.sh --destdir= --express --verbose install-data
      cp samhainrc.linux samhainrc
      cp samhainrc samhainrc.pre
      mv -f samhainrc.pre samhainrc.install
      ./samhain-install.sh --install-sh  -m 600 samhainrc.install /etc/samhainrc
      checking whether paths are trustworthy
      configuration file /etc/samhainrc ... OK
      state directory /run ... OK
      state directory /var/log ... OK
      data directory /var/lib/samhain ... OK

      You can use 'samhain-install.sh uninstall' for uninstalling
      i.e. you might consider saving that script for future use

      Use 'make install-boot' if you want samhain to start on system boot

## Customisation    
[Customize](https://www.la-samhna.de/samhain/manual/installation-customize.html):

    $ sudo vi /etc/samhainrc

I will run with defaults for now, and make changes later.
      
## Initialisation

Initialize the baseline database ([do NOT do twice](https://www.la-samhna.de/samhain/manual/installation-initialize.html)):

    $ samhain -t init
    [snip]
    CRIT   :  [2018-03-04T22:01:33+0100] interface=<lstat>, msg=<No such file or directory>, userid=<0>, path=</var/lib/urandom/random-seed>
    CRIT   :  [2018-03-04T22:01:33+0100] msg=<POLICY MISSING>, path=</var/lib/urandom/random-seed>
    MARK   :  [2018-03-04T22:01:33+0100] msg=<File check completed.>, time=<593>, kBps=<9067.752000>
    NOTICE :  [2018-03-04T22:01:33+0100] msg=<Finished writing baseline database.>
    ALERT  :  [2018-03-04T22:01:33+0100] msg=<EXIT>, program=<Samhain>, status=<exit_success>

Aaaaand a sheitload of errors and garble passed by on my screen for about ten minutes, including all kinds of critical issues on missing files and policies. This was on a worst-case linux, an archlinux halfway in the making (by me), and to be expected. I be reading them logs then. :D

## Usage

[Run samhain](https://www.la-samhna.de/samhain/manual/installation-running.html):

    $ samhain -t check --foreground

Immediately. Okay, so more of that garble of course. Just to see what gets reported and logged as differences.

## Update baseline

Note: Archlinux does not have `apt`, and the `logs` are organised differently.

    sudo vi /etc/samhainrc

The configuration file is divided into several sections:
|Parameter | Note |
| :---- | :---- |
|Attributes |files specified in this section are checked only for change in permission and ownership|
|LogFiles |files put in this section are not checked for timestamp, size, or cryptographic checksum changes, because they change often|
|GrowingLogFiles|files put in this section are not checked for timestamp and cryptographic signature changes and increases in file size (decreases are noted)|
|IgnoreAll|files in this section are never checked for modifications|
|IgnoreNone|these files have all modifications checked, including access time|
|ReadOnly|all modifications are checked except for access time|
|User0|all modifications are checked|
|User1|all modifications are checked|

Files may be specified in two ways, either as

    file=/path/to/some/file or
    dir=number/path/to/directory

where `number` is an option defining how many subdirectories to include; up to 99 can be checked. It is not necessary to define the recursion depth. It is also possible to use wildcards, as in `file=/etc/*.conf`. Normal shell wildcards are allowed: "*", "?", and "..".

* Put a fake file (such as "tripwire") on your filesystem and check for it in the IgnoreNone section. This will alert you if anyone pokes around and accesses that file. 
* Put critical files such as `/etc/passwd` and programs in `/usr/sbin` in the ReadOnly section since they are read often. 
* Put log files in GrowingLogFiles in case an intruder attempts to scrub the logs. If logs are rotated frequently put them under LogFiles. 
* Put samhain, the configuration file, and the database file in IgnoreNone. After samhain is started as a daemon it does not need to re-read configuration file or the database. Any touching of it is very suspicious.

Several hours later, after thoroughly going through `samhainrc`, I got rid of all of the errors and warnings:

    $ sudo samhain -t update
    [happy emptiness]
      
## Start daemon

Start the samhain daemon:

    $ samhain -t check -D

