# Auditing network services

`netstat` (from the `net-tools` package) is deprecated on modern Linux systems. The replacement is `ss` from `iproute2`, which is faster and provides more detail. Both commands are covered here; `ss` is preferred on current distributions.

Two reasons to keep track of what network services are running on a system:

* To ensure that no legitimate network services that you don't need are running
* To ensure that you don't have any malware that's listening for network connections from its master C&C

To see a list of network services that are listening, waiting for someone to connect to them:

    ss -tlnp

With:

* `-t`: TCP sockets only (use `-u` for UDP, or omit to see all).
* `-l`: listening sockets only.
* `-n`: show port numbers and IP addresses rather than names.
* `-p`: show the process name and PID.

To view established TCP connections, leave out the `-l` option:

    ss -tnp

The legacy `netstat` equivalent (still works if `net-tools` is installed):

    netstat -lp -A inet

If you want to see port numbers and IP addresses instead of network names, add the `n` option to `-lp`. To view established TCP connections, leave out the `l` option.

Something to keep in mind is that rootkits can replace legitimate Linux utilities with their own trojaned versions. For example, a rootkit could have its own trojaned version of `netstat` that would show all network processes except for those that are associated with the rootkit. That's why you want something such as Rootkit Hunter in your toolbox.

## Resources

* [What Port Is - Network Port and Protocol Database](https://whatportis.com/)