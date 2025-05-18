# Dangers of the lxd group

Ubuntu places users (unless otherwise specified) into the `lxd` group. This group is known to be a point of privilege escalation and should be removed from any user that is a part of it.

It is so popular that `Linux-Smart-Enumeration` even checks for it. Remove it from any user that has it assigned. Using [adduser](homes.md) does not add the user to any predefined groups and should probably be used when adding new users.

## Resources

* [diego-treitos/linux-smart-enumeration](https://github.com/diego-treitos/linux-smart-enumeration)