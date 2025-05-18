# Connection refused

    unable connect to socket: Connection refused (111)

The VNC server is listening only on localhost's loopback interface. Try launching it with the server's IP address specified explicitly, or add the ''-localhost no'' option.

    $ vncserver -interface XXX.XXX.XXX.XXX

    $ vncserver -localhost no

