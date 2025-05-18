# Configuring other password requirements

## Password expiration

Password expiration can be set in `/etc/login.defs`. scroll down to the "Password aging controls" section:

* `PASS_MAX_DAYS`: Default `99999`; Sets the maximum number of days a password may be used.
* `PASS_MIN_DAYS`: Default `0`; Sets the minimum number of days a user must keep their password before changing it.
* `PASS_WARN_AGE`: Default `7`; Sets the number of days out from expiration that the system will warn the user.

## Password history

When configuring the password history of any system, it is generally considered best practice to remember the previous 10 passwords. This will ensure that the user's passwords stay different and are not reused. Setting a minimum age of 1 and a password history of 10 means that somebody would need to wait at least 11 days before they're able to get back to their original password. Usually this is enough to dissuade anyone from trying.

To configure password history in Ubuntu, use `/etc/pam.d/common-password`:

* `password`: module type we are referencing.
* `required`: module where failure returns a failure to the PAM-API.
* `pam_pwhistory.so`: module that configures the password history requirements.
* `remember=2`: option for the `pam_pwhistory.so` module to remember the last `n` passwords (`n = 2`). These passwords are saved in `/etc/security/opasswd`.
* `retry=3`: option for the `pam_pwhistory.so` module to prompt the user `3` times before returning a failure.

## Resources

* [pam.d(5) - Linux man page](https://linux.die.net/man/5/pam.d)