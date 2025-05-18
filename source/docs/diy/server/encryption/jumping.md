# Jumping hosts

Sometimes it is only possible to access a remote server using `ssh` by first logging in to another server (or firewall/jump host). 

![SSH infra](/_static/images/infra.png)

This means having to authenticate twice and the chain can be long and not limited to just two hosts. I can only access 
the remote "Backend server" via ssh by first login into an intermediary Firewall/Bastion server called "jumphost". 
First, login to jumphost:

    $ ssh user@jumphost

Next, ssh through the intermediary system:

    $ ssh user@backendserver

Or, use `-tt`, forcing "pseudo-tty" allocation:

    $ ssh -tt jumphost ssh -tt backendserver

Alternatives to manually jumping about and making life much easier are ForwardAgent, ProxyCommand and ProxyJump. 
Starting from OpenSSH 7.3, released August 2016, the easiest way to pass through one or more jump hosts is with the 
ProxyJump directive.

## ForwardAgent

SSH agent forwarding can be used to make access to a server. It allows for the use of local SSH keys instead of 
leaving keys (without passphrases!) sitting on the server.

The -A option enables forwarding of the authentication agent connection:

    ssh -A user@server.com 

It forwards the SSH authentication schema to the remote host to allow for the use of SSH on the jump host as if the user was on the local machine. A forwarding socket will be set up so that the SSH client on the first host can connect to the `ssh-agent` on the client machine to perform authentication on its behalf. The key is not forwarded, but the agent, meaning many keys can be added.

### Configuration

Create or open `~/.ssh/config`:

    $ vi ~/.ssh/config

Append the below entry (replacing XXX.XXX.XXX.XXX with actual server domain name or the IP):

    Host jumphost
    HostName XXX.XXX.XXX.XXX
    User user
    ForwardAgent yes

### Security problem

The problem is that while being connected to the first host, anyone with sufficient permission on the first host will be able to use that socket to connect to and use that local ssh-agent. A rogue root or evil admin with root access can eavesdrop on the ongoing session and impersonate the user for authentication to other servers during the time that user is connected to that server.

A mentioned mitigation is using the `-c` option, which will show a confirmation window each time some program wants to use the agent to authenticate somewhere. Recommended is using ProxyCommand instead. Or even better, ProxyJump.

## ProxyCommand

ProxyCommand is an alternative for that is supposedly more secure than the above SSH agent forwarding.

It is possible to connect via an intermediate machine using a SOCKS proxy. SOCKS4 and SOCKS5 proxies are both supported by OpenSSH. SOCKS5 allows for transparent traversal of a firewall or other application barrier by strong authentication with the help of GSS-API. Dynamic application-level port forwarding allows the outgoing port to be allocated on the fly thereby creating a proxy at the TCP session level.

Using the ProxyCommand option to invoke netcat as the last in the chain is a variation of this for very old clients. The SSH protocol is forwarded by ''nc'' (netcat) instead of ''ssh''. Attention must also be paid to whether or not the username changes from host to host in the chain of SSH connections. The somewhat outdated netcat method does not allow a change of username. Other methods do. 

    ssh -o ProxyCommand='ssh user@jumphost nc backendserver 22' user@backendserver

The ''nc'' command sets and establish a TCP pipe between jumphost (or firewall) and backendserver.

Note: **It is not possible to use both the ProxyJump and ProxyCommand directives in the same host configuration. The first one found is used and then the other blocked.**  

### Configuration

Create or open `~/.ssh/config`

    $ vi ~/.ssh/config

Append the below entry (replacing ''XXX.XXX.XXX.XXX'' with actual server domain name or IP and ''user'' with actual user):

    Host jumphost
    HostName XXX.XXX.XXX.XXX
    User user
    ProxyCommand ssh user@backendserver nc %h %p

## ProxyJump

Starting from OpenSSH 7.3, released August 2016, the easiest way to pass through one or more jump hosts is with the ProxyJump directive.

The main method here is to use an SSH connection to forward the SSH protocol through one or more jump hosts, using the ProxyJump directive, to an SSH server running on a destination host (this method cannot be used if an intermediate host denies port forwarding). This is considered the most secure method because encryption is end-to-end.

    $ ssh -J user1@jumphost.whatever.org:22 anotherusername@XXX.XXX.XXX.XXX

And can be chained:

    $ ssh -J user1@jumphost1.whatever.org:22,user2@jumphost2.whatever.org:2222 anotherusername@XXX.XXX.XXX.XXX

### Configuration

    Host server2
    HostName XXX.XXX.XXX.XXX
    ProxyJump user1@jumphost1.whatever.org:22
    User anotherusername

    Host server3
    HostName XXX.XXX.XXX.XXX
    ProxyJump user1@jumphost1.whatever.org:22,user2@jumphost2.whatever.org:2222
    User anotherusername
