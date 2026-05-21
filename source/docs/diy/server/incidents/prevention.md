# Reducing incident likelihood

* The principle of least privilege: give users as few permissions as the task requires.
* The `sudo` command is often misused. By default, anyone in the sudo group can do whatever they want. Limiting sudo access to particular commands narrows that exposure considerably.
* Network shares default well to read-only. The risk is not just accidental deletion by users; applications can malfunction and delete data too. Read-write shares can be created for those who genuinely need them.
* Physical security is as important as securing operating systems, applications, and data.
* Security updates installed promptly, alongside failure monitors, firewalls, and hardened OpenSSH settings, reduce the available attack surface.

