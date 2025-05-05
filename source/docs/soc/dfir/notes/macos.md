# macOS analysis

## Configuration files

Configuration files on macOS have the extension `.plist` (property list) and store configuration settings and properties. Read with:

    plutil -p /var/db/locationd/configfile.plist

They are usually formatted in XML, although they can use JSON or be binaries, in which case you can convert them to XML:

    plutil -convert xml1 path/to/JSONformatted.plist

    plutil -convert xml1 path/to/binary.plist

## Downloads

The QuarantineEventsV2 database provides information on when a file was downloaded from the internet. To list the application that did the downloading, the download link, and then the date it was downloaded (by adding `978307200` it converts to an epoch value):

```shell
sqlite3 /Users/[username]/Library/Preferences/com.apple.LaunchServices.QuarantineEventsV2 \
'select LSQuarantineAgentName, LSQuarantineDataURLString, date(LSQuarantineTimeStamp + 978307200, "unixepoch") as downloadedDate from LSQuarantineEvent order by LSQuarantineTimeStamp' \
| sort -u | grep '|' --color
```

## Install history

Find installed applications and the time they were installed from `/Library/Receipts/InstallHistory.plist`:

```shell
plutil -p /Library/Receipts/InstallHistory.plist
```

## Location tracking

Listing programs and services allowed to leverage (your) location information:

```shell
sudo plutil -p /var/db/locationd/clients.plist | ack --passthru 'BundlePath'
```

```shell
sudo plutil -p /var/db/locationd/clients.plist | grep 'BundlePath'
```

## Most recently used

```text
/Users/[username]/Library/Application Support/com.apple.sharedfilelist/com.apple.LSSharedFileList.ApplicationRecentDocuments 
/Users/[username]/Library/Application Support/com.apple.sharedfilelist/com.apple.LSSharedFileList.FavoriteItems.sfl2   
/Users/[username]/Library/Application Support/com.apple.sharedfilelist/com.apple.LSSharedFileList.FavoriteVolumes.sfl2   
/Users/[username]/Library/Application Support/com.apple.sharedfilelist/com.apple.LSSharedFileList.ProjectsItems.sfl2   
/Users/[username]/Library/Application Support/com.apple.sharedfilelist/com.apple.LSSharedFileList.RecentApplications.sfl2
/Users/[username]/Library/Application Support/com.apple.sharedfilelist/com.apple.LSSharedFileList.iCloudItems.sfl2
/Users/[username]/Library/Application Support/com.apple.sharedfilelist/com.apple.LSSharedFileList.RecentServers.sfl2
/Users/[username]/Library/Application Support/com.apple.sharedfilelist/com.apple.LSSharedFileList.RecentHosts.sfl2
/Users/[username]/Library/Application Support/com.apple.sharedfilelist/com.apple.LSSharedFileList.RecentDocuments.sfl2
```

List subdirectory relevant to recent applications:

```text
strings '/Users/[username]/Library/Application Support/com.apple.sharedfilelist/com.apple.LSSharedFileList.ApplicationRecentDocuments/' | sort -u
```

## Audit logs

Read the audit logs:

```shell
praudit /private/var/audit/current | head -n 100
```

Use `auditreduce` to look for specific activity:

```shell
auditreduce -d 20230530 -u [username] /var/audit/* | praudit | head -n 20
```

Show user logins and logouts:

```shell
auditreduce -c lo /var/audit/* | praudit | head -n 10
```

## Evidence of execution

Places to retrieve command line activity (shell is likely `bash` or `zsh`:

```shell
/Users/[username]/.zsh_sessions/*
/Users/[username]/.zsh_history
/private/var/root/.bash_history
```

Check changes to the admin group:

```shell
plutil -p /private/var/db/dslocal/nodes/Default/groups/admin.plist
```

There are at least two TCC (ransparency, Consent, and Control) databases on the system - one per user, and one root:

```text
/Library/Application Support/com.apple.TCC/TCC.db
/Users/[username]/Library/Application Support/com.apple.TCC/TCC.db
```

One of the most important pieces of information is which applicaitons have FDA (Full Disk Access), via the `kTCCServiceSystemPolicyAllFiles` service. This is only located in the root TCC database.

```shell
sqlite3 /Library/Application\ Support/com.apple.TCC/TCC.db
```

## Persistence

### start up / login items

    /var/db/com.apple.xpc.launchd/disabled.*.plist
    /System/Library/StartupItems
    /Users/[username]/Library/Application Support/com.apple.backgroundtaskmanagementagent/backgrounditems.btm
    /var/db/launchd.db/com.apple.launchd/*

### scripts

    /Users/[username]/Library/Preferences/com.apple.loginwindow.plist
    /etc/periodic/[daily, weekly, monthly]

### cronjobs 

    /private/var/at/tabs/
    /usr/lib/cron/jobs/ 

### system extensions

    /Library/SystemExtensions/

### Daemons

    /System/Library/LaunchDaemons/*.plist
    /System/Library/LaunchAgents/*.plist 
    /Library/LaunchDaemons/*.plist 
    /Library/LaunchAgents/*.plist 
    /Users/[username]/Library/LaunchAgents/*.plist

[Full list of possible persistence locations](https://gist.github.com/jipegit/04d1c577f20922adcd2cfd90698c151b).

## Query built-in security mechanisms

Airdrop:

    sudo ifconfig awdl0 | awk '/status/{print $2}'

Filevault:

    sudo fdesetup status

Firewall (Enabled = 1, Disabled = 0):

    defaults read /Library/Preferences/com.apple.alf globalstate

Gatekeeper:

    spctl --status

Network Fileshare:

    nfsd status

Remote Login:

    sudo systemsetup -getremotelogin

Screen sharing:

    sudo launchctl list com.apple.screensharing

SIP:

    csrutil status

## Resources

* [About DFIR/Tools & Artifacts > macOS](https://aboutdfir.com/toolsandartifacts/macos/)
* [DFIR Artifacts > Mac Artifact List](https://dfirartifacts.com/mac-artifacts/)