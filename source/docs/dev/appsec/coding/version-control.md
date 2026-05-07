# Configuring version control

I created accounts on GitHub, Gitlab and Bitbucket. In GitHub and GitLab we set our email addresses to private to have
the warehouses generate a commit email address.

## Gitconfig

We cannot configure git globally with two different email addresses at the same time (mutually exclusive).

We can either configure each GitHub or gitlab repository locally with whichever commit email address applies OR we can
create, GitHub, gitlab and bitbucket folders in a Development folder for the respective repositories and put in the
user's root folder a .gitconfig:

```
\[includeIf "gitdir/i:\~/Development/github/"]
path = .gitconfig-hub
\[includeIf "gitdir/i:\~/Development/gitlab/"]
path = .gitconfig-lab
\[includeIf "gitdir/i:\~/Development/bitbucket/"]
path = .gitconfig-bitbucket
```

And in the same root folder as the .gitconfig, we created a .gitconfig-hub, a .gitconfig-lab, and a
.gitconfig-bitbucket. These contain:

For the github gitdir:

```
\[user]
    name=\[github username]
    email=\[number]+\[username]@users.noreply.github.com
```

For the gitlab gitdir (mind the minus sign):

```
\[user]
    name=\[gitlab username]
    email=\[number]-\[username]@users.noreply.gitlab.com
```

For the bitbucket gitdir:

```
\[user]
    name= \[bitbucket username]
    email=\[user\@email.address]
```

If this is a change of name and/or email address, reset the author information on the last commit with:

```
$ git commit --amend --reset-author
```

## SSH keys

Create a set of SSH keys for each warehouse, and connect those with the warehouse accounts

```
$ ssh-keygen -f \~/github-key-ed25519 -t ed25519 -C "\[number]+\[username]@users.noreply.github.com"

$ ssh-keygen -f \~/gitlab-key-ed25519 -t ed25519 -C "\[number]-\[username]@users.noreply.gitlab.com"

$ ssh-keygen -f \~/bitbucket-key-ed25519 -t ed25519 -C "\[username]@email.com"
```

## SSH configuration

Check to see if \~/.ssh/config exists:

```
$ ls \~/.ssh/
```

If not create it, and create the default keys. Either way, move all key pairs into that folder. Create or change the
\`\~/.ssh/config\`:

```
Host github.com
    HostName github.com
    IdentityFile \~/.ssh/github-key-ed25519
    IdentitiesOnly yes
    User \[github username]

Host gitlab.com
    HostName gitlab.com
    IdentityFile \~/.ssh/gitlab-key-ed25519
    IdentitiesOnly yes
    User \[gitlab username]

Host bitbucket.org
    Hostname bitbucket.org
    IdentityFile \~/.ssh/bitbucket-key-ed25519
    IdentitiesOnly yes
    User \[bitbucket username]

Host \*
    IdentityFile \~/.ssh/key-ed25519
    User \[username]
```

Start the ssh-agent in the background:

```
$ eval "$(ssh-agent -s)"
```

For each warehouse, add the private keys to the ssh-agent:

```
$ ssh-add -k \~/.ssh/\[warehouse]-key-ed25519
```

And add public key (content of clipboard) to the warehouse:

* Go to your warehouse Account Settings
* Find the section where SSH and GPG Keys can be added.
* Click New SSH Key button.
* Add a label (any) and paste the public key into the big text box.

Check the connection:

```
$ ssh -T git@\[warehouse].\[tld]
```

Now you can clone repos with:

```
\[warehouse] $ git clone git@\[warehouse].\[tld]:\[name]/\[repo-name]
```

cd into repo directory and connect local and remote repo:

```
\[warehouse]/repo-name $ git remote set-url origin git@\[warehouse].\[tld]:\[name]/\[repo-name].git
```
