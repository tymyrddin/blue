# TightVNC

TightVNC is a fast and lightweight remote control package. This choice will ensure that our VNC connection will be smooth and stable even on slower internet connections. It encrypts VNC passwords sent over the net (DES-encrypted challenge-response scheme and the password is limited by 8 characters), but the rest of the traffic is sent in the clear and are a security risk. Recommended is using TightVNC ***with ssh*** (and that defeats our purpose of only using it when ssh fails)

## Installation

Install the [Xfce desktop environment](https://www.xfce.org/) on the server:

    # apt-get install xfce4 xfce4-goodies

Install the vnc server:

    # apt-get install tightvncserver

Create a new user to access the server.

    # useradd vncuser

Add the user to the sudo group:

    # usermod -aG sudo vncuser

As the vncuser, set up a secure password and create the initial configuration files:

    vncuser@localhost $ vncserver
    You will require a password to access your desktops.

    Password:
    Verify:

    Creating default startup script /home/vncuser/.vnc/xstartup
    Starting applications specified in /home/vncuser/.vnc/xstartup
    Log file is /home/vncuser/.vnc/localhost.localdomain:1.log

Enter and verify a password to access the server remotely. It must be between six and eight characters long. More than 8 characters will be truncated automatically. The process then creates the necessary default configuration files and connection information for the server.

## Configuration

Default for the service is on port 5901 (display port `:1`). Stop the service:

    $ vncserver -kill :1

Make a backup of the `xstartup` file:

    $ mv ~/.vnc/xstartup ~/.vnc/xstartup.old

Create a new `xstartup` file and open it (empty file):

    $ vi ~/.vnc/xstartup

To have VNC read the server user's .Xresources file and launch Xfce (in the background), append:

    #!/bin/bash
    xrdb $HOME/.Xresources
    startxfce4 &

Write and quit file, and (as root) make it executable.

    # chmod +x ~/.vnc/xstartup

Restart VNC:

    $ vncserver

## Firewall

Open ports in the firewall for inbound communication.

## Control

For starting, stopping, and restarting the service, create a new (empty) systemd unit file `/etc/systemd/system/vncserver@.service`

    # vi /etc/systemd/system/vncserver@.service

The `@` symbol will allow for passing an argument (the VNC display port). Append:

    [Unit]
    Description=Start TightVNC server at startup
    After=syslog.target network.target

    [Service]
    Type=forking
    User=vncuser
    Group=vncuser
    WorkingDirectory=/home/vncuser

    PIDFile=/home/vncuser/.vnc/%H:%i.pid
    ExecStartPre=-/usr/bin/vncserver -kill :%i > /dev/null 2>&1
    ExecStart=/usr/bin/vncserver -depth 24 -geometry 1280x800 :%i
    ExecStop=/usr/bin/vncserver -kill :%i

    [Install]
    WantedBy=multi-user.target

Reload systemd manager configuration

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

  * Windows: TightVNC, RealVNC, or UltraVNC.
  * MacOS: Apple Remote or RealVNC.
  * Linux: vinagre, krdc, RealVNC, or TightVNC.

## Configuration resources

* [TightVNC](https://www.tightvnc.com/)

