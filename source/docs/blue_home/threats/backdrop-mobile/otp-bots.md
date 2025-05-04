# OTP bots

Most websites now offer and use multifactor authentication to protect user accounts; with OTP bots, that protection is rendered useless. Using an OTP bot enables an attacker to intercept, redirect, or even spoof authentication codes or tokens. Using social engineering to trick people into giving their authentication codes is a time-intensive process. But OTP bots, with the right contact information for the victim (bough on Telegram or Darkweb for example), can do this automatically. They can intercept large numbers of OTPs and increase the number of victims and profit for the adversary.

OTP bots use the normal process of getting a one-time password for authentication online by tricking the victim into thinking they’re from the company in question, such as a bank.

* The adversary gives the victim’s information to the OTP bot.
* The OTP bot contacts the victim and asks for the account OTP. This can be by [smishing](smishing.md) or by [robocall](vishing.md) for example, asking for authorisation of a charge, or whether a given code is correct, and if not, please give us the correct code.
* The victim provides or enters the OTP.
* The bot distracts the victim while the adversary accesses the account instead.
* The adversary then steals money or card information from the victim's account.

Companies and organisations can use powerful bot management systems that can identify malicious bots and stop their requests before they get to a website, app, or API. What we can do is protect ourselves as good as we can from all phishing forms.

## Resources

* [Threat Spotlight: Illicit Telegram Markets & OTP Bots](https://flare.io/learn/resources/blog/threat-spotlight-illicit-telegram-markets-otp-bots/), 2022
* [Bots for Stealing One-Time Passwords Simplify Fraud Schemes](https://www.recordedfuture.com/bots-stealing-one-time-passwords-simplify-fraud-schemes), 2022
* [How secure are one-time passwords from attacks?](https://www.techtarget.com/searchsecurity/feature/How-secure-are-one-time-passwords-from-attacks), 2022
* [OTP Bot Setup for MFA Bypass Affecting P2P Services](https://www.cloudsek.com/threatintelligence/generaly-otp-bot-setup-for-mfa-bypass-affecting-p2p-services), 2022

