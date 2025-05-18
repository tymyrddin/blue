# Preventing incidents

* Use the **principle of least privilege**. The idea is to give users as few permissions as possible.
* While the `sudo` command is useful, it is often misused. By default, anyone that is a member of the sudo group can use sudo to do whatever they want. Restrict sudo access to particular commands.
* In regard to network shares, it’s always best to default to read-only whenever possible. This is not just because of the chance of a user accidentally deleting data; it’s always possible for applications to malfunction and delete data as well. With a read-only share, the modification or deletion of files is not possible. Additional read-write shares can be created for those who need them, but if possible, always default to read-only.
* Physical security is every bit as important as securing operating systems, applications, and data.
* Ensure security updates are installed in a timely fashion, utilizing security applications such as failure monitors and firewalls, and ensuring secure settings for OpenSSH.

