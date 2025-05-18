# Mandatory access control (MAC)

Mandatory Access Control (MAC) is a type of Access Control. It goes along with Discretionary Access Control, Role Based Access Control, and Rule Based Access Control. MAC is considered the strongest form of access control due to allowing more control over who has access over what. In a Linux system, there are multiple ways to implement MAC. Two of which being SELinux and AppArmor.

## SELinux

SELinux is a free open source software project that was developed by the U.S. National Security Agency. While it can theoretically be installed on any Linux distribution, Red Hat-type distributions are the only ones that come with it already set up and enabled. It uses code in Linux kernel modules, along with extended filesystem attributes, to help ensure that only authorised users and processes can access either sensitive files or system resources. There are three ways in which SELinux can be used:

* It can help prevent intruders from exploiting a system.
* It can be used to ensure that only users with the proper security clearance can access files that are labeled with a security classification.
* In addition to MAC, SELinux can also be used as a type of role-based access control.

## AppArmor

AppArmor is the MAC system that comes installed with the SUSE and the Ubuntu families of Linux. Although it's designed to do pretty much the same job as SELinux, its mode of operation is substantially different:

* SELinux labels all system processes and all objects such as files, directories, or network ports. For files and directories, SELinux stores the labels in their respective inodes as extended attributes. (An inode is the basic filesystem component that contains all information about a file, except for the filename.)
* AppArmor uses pathname enforcement, which means that you specify the path to the executable file that you want AppArmor to control. This way, there's no need to insert labels into the extended attributes of files or directories.
* With SELinux, you have system-wide protection out of the box.
* With AppArmor, you have a profile for each individual application.
* With either SELinux or AppArmor, you might occasionally find yourself having to create custom policy modules from scratch, especially if you're dealing with either third-party applications or home-grown software. With AppArmor, this is easier, because the syntax for writing AppArmor profiles is much easier than the syntax for writing SELinux policies. And AppArmor comes with utilities that can help you automate the process.
* Just as SELinux can, AppArmor can help prevent malicious actors from ruining your day and can help protect user data.

The AppArmor directory is located at `/etc/apparmor.d`. This directory contains all the AppArmor profiles. The `sbin.dhclient` and `usr.*` files are AppArmor profiles.

The `abstractions` directory is a sort of "includes" folder that has partially written profiles that can be used and included in custom profiles. Part of the work has already been done. 

Additional profiles can be installed with:

    sudo apt install apparmor-profiles apparmor-profiles-extra