# Configuring password complexity

NIST has come to agree with Bill Burr's changed mind and have now changed their password implementation criteria to match Mr. Burr's new recommendations:

Passphrases do not meet any complexity criteria, and use dictionary words. How is that secure? It is a phrase with distinct words separated by blank spaces. That makes it secure and very difficult to brute-force. Passphrases are more difficult to crack than traditional passwords, and they are easier for users to remember.

And, there is the reality that many organizations are still using complex passwords that regularly expire, and you'll have to abide by their rules if you can't convince them otherwise. And besides, if you are using traditional passwords, you do want them to be strong enough to resist any sort of password attack.

## Pwquality

`pwquality` is a PAM module that allows configuring password complexity requirements for users. It is fairly easy to install on Ubuntu. 

    sudo apt-get install libpam-pwquality

Once installed, it automatically adds an entry into the `/etc/pam.d/common-password` file. The `pam.d` directory is just another location where PAM adds files for basic services like `ssh`, basic `login`, etc.

The `pwquality.conf` file found in `/etc/security`, has many options the administrator can set for password quality. The lines just need to be uncommented and modified.

## Resources

* [You Might Not Need Complex, Alphanumeric Passwords After All](https://www.pcmag.com/news/you-might-not-need-complex-alphanumeric-passwords-after-all)
* [The New NIST Guidelines: We Had it All Wrong Before](https://www.riskcontrolstrategies.com/2018/01/08/new-nist-guidelines-wrong/)