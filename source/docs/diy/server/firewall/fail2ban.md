# Fail2ban

Note: Fail2Ban can reduce the rate of incorrect authentications attempts but cannot eliminate the risk weak 
authentication presents. 

## Installation

Installing fail2ban package in Debian:
    
    # apt-get install fail2ban

Check it was properly installed:

    # fail2ban-client -h

## Configuration

To configure fail2ban, make a local copy of the `jail.conf` file in `/etc/fail2ban`:

    # cd /etc/fail2ban
    # cp jail.conf jail.local

Edit the file:

    # vi jail.local

Set the IPs you want fail2ban to ignore (the list of clients that are not subject to the fail2ban policies), the ban time (in seconds) and maximum number of user attempts:

    [DEFAULT]
    # "ignoreip" can be an IP address, a CIDR mask or a DNS host
    ignoreip = 127.0.0.1
    bantime  = 3600
    maxretry = 3

Jails are the rules which fail2ban apply to a given application/log.

To enable log monitoring for Nginx login attempts, enable the `nginx-http-auth` jail:

    [nginx-http-auth]

    enabled  = true
    filter   = nginx-http-auth
    port     = http,https
    logpath  = /var/log/nginx/error.log
    maxretry = 6

For apache:

    [apache]

    enabled  = true
    port     = http,https
    filter   = apache-auth
    logpath  = /var/log/apache*/*error.log
    maxretry = 6

To tweak or add log filters, see the files in `/etc/fail2ban/filter.d`.

Restart fail2ban.

## Test

To test fail2ban, look at the iptable rules before and after attempting to log in to a service that fail2ban is monitoring from another machine and look at the iptable rules to see if that IP source gets added:

    # iptables -L 

## Usage

To check if an IP is banned (in Nginx):

    $ sudo fail2ban-client status nginx-naxsi

To unban an IP address:

    $ sudo fail2ban-client set nginx-naxsi unbanip xxx.xxx.xxx.xxx

To see all jails:

    $ sudo fail2ban-client status
    [sudo] password for nina: 
    Status
    |- Number of jail:	25
    `- Jail list: http-get-dos, nginx-noscript, proftpd, WP-Login-POST, nginx-login, spam-log, wppingback, postfix-sasl, nginx-conn-limit, nginx-proxy, nginx-auth, block-scanners, nginx-naxsi, nginx-badbots, BASH, sshd, pam-generic, named-refused-udp, postfix, WP-Login, ssh-ddos, wordpress, webmin-auth, dovecot, ssh


## Note for Apache
Fail2ban scans log files like `/var/log/apache/error_log`, `/var/log/auth.log` and `/var/log/apache/access.log` and temporarily or persistently bans failure-prone addresses by updating existing firewall rules. Out of the box Fail2Ban comes with filters for various services (apache, courier, ssh, etc).
