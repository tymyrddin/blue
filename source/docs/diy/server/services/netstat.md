# Auditing network services with netstat

Two reasons why you would want to keep track of what network services running on systems:

* To ensure that no legitimate network services that you don't need are running
* To ensure that you don't have any malware that's listening for network connections from its master C&C

To see a list of network services that are listening, waiting for someone to connect to them:

    netstat -lp -A inet

With:

* `-lp`: The `l` means that we want to see which network ports are listening. In other words, we want to see which network ports are waiting for someone to connect to them. The `p` means that we want to see the name and process ID number of the program or service that is listening on each port.
* `-A inet`: This means that we only want to see information about the network protocols that are members of the inet family. In other words, we want to see information about the raw, tcp, and udp network sockets, but we don't want to see anything about the Unix sockets that only deal with interprocess communications within the operating system.

If you want to see port numbers and IP addresses instead of network names, add the `n` option to the `-lp`. To view the established TCP connections is to leave out the `l` option.

Something to keep in mind is that rootkits can replace legitimate Linux utilities with their own trojaned versions. For example, a rootkit could have its own trojaned version of `netstat` that would show all network processes except for those that are associated with the rootkit. That's why you want something such as Rootkit Hunter in your toolbox.

## Resources

* [What Port Is - Network Port and Protocol Database](https://whatportis.com/)