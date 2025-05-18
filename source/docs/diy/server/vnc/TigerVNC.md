# TigerVNC

TigerVNC is not as lightweight as [TightVNC](TightVNC.md), but it provides extensions for advanced authentication methods and [TLS encryption](secure-sessions.md), hence a proper candidate for a fallback when ssh fails. 

## Installation

Install the [Xfce desktop environment](https://www.xfce.org) on the server:

    # apt-get install xfce4 xfce4-goodies xorg dbus-x11 x11-xserver-utils

Install the vnc server:

    # apt-get install tigervnc-standalone-server tigervnc-common

Create a new user to access the server.

    # useradd vncuser

Add the user to the sudo group:

    # usermod -aG sudo vncuser

As the vncuser, run the vncserver command to create the initial configuration and set up the password. Do not use sudo.

    $ vncserver
    You will require a password to access your desktops.

    Password:
    Verify:
    Would you like to enter a view-only password (y/n)? n
    /usr/bin/xauth:  file /home/vncuser/.Xauthority does not exist

    New 'debian9.localdomain:1 (vncuser)' desktop at :1 on machine debian9.localdomain

    Starting applications specified in /etc/X11/Xvnc-session
    Log file is /home/vncuser/.vnc/debian9.localdomain:1.log

    Use xtigervncviewer -SecurityTypes VncAuth -passwd /home/vncuser/.vnc/passwd :1 to connect to the VNC server.

## Configuration

Default for the service is on port 5901 (display port `:1`). Stop the service:

    $ vncserver -kill :1

Make a backup of the `xstartup` file:

    $ mv ~/.vnc/xstartup ~/.vnc/xstartup.old

Create a new `xstartup` file and open it (empty file):

    $ vi ~/.vnc/xstartup

To have VNC read the server user's .Xresources file and launch Xfce (in the background), append:

    #!/bin/sh
    unset SESSION_MANAGER
    unset DBUS_SESSION_BUS_ADDRESS
    exec startxfce4 

Write and quit file, and (as root) make it executable.

    # chmod u+x ~/.vnc/xstartup

Restart the service:

    $ vncserver

## Firewall

Open ports in the firewall for inbound communication.

## Control

For starting, stopping, and restarting the service, create a new (empty) systemd unit file `/etc/systemd/system/vncserver@.service`

    # vi /etc/systemd/system/vncserver@.service

The `@` symbol will allow for passing an argument (the VNC display port). Append:

    [Unit]
    Description=Remote desktop service (VNC)
    After=syslog.target network.target

    [Service]
    Type=simple
    User=vncuser
    PAMName=login
    PIDFile=/home/%u/.vnc/%H%i.pid
    ExecStartPre=/bin/sh -c '/usr/bin/vncserver -kill :%i > /dev/null 2>&1 || :'
    ExecStart=/usr/bin/vncserver :%i -geometry 1280x800 -alwaysshared -fg
    ExecStop=/usr/bin/vncserver -kill :%i

    [Install]
    WantedBy=multi-user.targetReload systemd manager configuration

    # systemctl daemon-reload

Enable the unit file

    # systemctl enable vncserver@1.service

Kill the vncserver

    $ vncserver -kill :1

And start it as any other systemd service.

    $ sudo systemctl start vncserver@1

Verify
    $ sudo systemctl status vncserver@1

## Clients

  * Linux: xvnc4viewer

## Configuration resources

* [TigerVNC](https://tigervnc.org/)

