# Dangers of the lxd group

Ubuntu places users (unless otherwise specified) into the `lxd` group. This group is a known privilege escalation vector and is worth removing from any user that is a part of it.

It is well known enough that `Linux-Smart-Enumeration` checks for it. Remove it from any user that has it assigned. Using [adduser](homes.md) does not add the user to any predefined groups, making it a good choice when adding new users.

## Resources

* [diego-treitos/linux-smart-enumeration](https://github.com/diego-treitos/linux-smart-enumeration)