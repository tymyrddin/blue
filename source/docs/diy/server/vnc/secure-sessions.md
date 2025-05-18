# Securing sessions

## TLS

Start the VNC server with:

    # vncserver -SecurityTypes=VeNCrypt,TLSVnc

On the client, connect with vncviewer:

    $ vncviewer -SecurityTypes=VeNCrypt,TLSVnc XXX.XXX.XXX.XXX:1

With TLSVnc, there is standard VNC authentication and traffic is encrypted with GNUTLS but the identity of the server is not verified. TigerVNC also supports other security schemes such as X509Vnc. 

## X509

X509 combines standard VNC authentication with GNUTLS encryption and server identification, and is the recommended mode for a secure connection. Do not set SecurityTypes on the server to a non-encrypted option as high-priority (such as None, VncAuth, Plain, TLSNone, TLSPlain, X509None, X509Plain) because then it is not possible to use encryption. When running vncviewer, it is safer to explicitly set SecurityTypes and not accept any unencrypted traffic. Any other mode is to be used only when accessing a vncserver via SSH tunnels. 

## SSH
On the server install ssh. On the client:

    $ ssh -L 5901:127.0.0.1:5901 -C -N -l vncuser XXX.XXX.XXX.XXX

The `-L` switch specifies binding port 5901 of the remote connection to port 5901 on the local machine (client), `-C` enables compression, `-N` specifies there will be no remote command, and `-l` the remote login name.

