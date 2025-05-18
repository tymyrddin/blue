# Using git for configuration management

One of the most valuable assets on a server is its configuration. This is second only to the data the server stores. Often, when we implement new technology on a server, we’ll spend a great deal of time editing configuration files all over the server to make it work as best as we can. This can include any number of things, from Apache virtual host files to DHCP server configuration, DNS zone files, and more. If a server were to encounter a disaster from which the only recourse was to completely rebuild it, the last thing we’d want to do is re-engineer all of this configuration from scratch. This is where Git comes in.

Git isn’t just useful for software engineers. It is also a good tool we can leverage for keeping track of configuration files on our servers, for documentation, and for developing guidelines.

When we make configuration changes, we can push the changes back to our Git server. If for some reason we need to restore the configuration after a server fails or is compromised via the config files, we can simply download configuration files from Git back onto the (new) server. 

Another useful aspect of this approach is that if an administrator implements a change to a
configuration file that breaks a service, we can simply revert to a known working commit, and we’ll
be immediately back up and running.

Install `git`:

    sudo apt install git

On the server, create a directory to host the repositories. For example, `/git`:

    sudo mkdir /git

Modify this directory to be owned by the administrative user you use on your Ubuntu servers. Typically, this is the user that was created during the installation of the distribution. Use any user you want, just make sure the user is allowed to use OpenSSH to access the Git server. Change the ownership of the `/git` directory, so it is owned by this user.

    sudo chown lela:lela /git

Create a Git repository in the `/git` directory. For Apache, a bare repository, a skeleton of a Git repository that does not contain any useful data, just some default configuration to allow it to act as a Git folder. To create the bare repository, cd into the `/git` directory and execute:

    git init --bare apache2
    Initialized empty Git repository in /git/apache2/

On the client (the server that houses the configuration you want to place under version control), copy this bare repository by cloning it. To set that up, create a `/git` directory on the Apache server (or whatever kind of server you’re backing up) just as we did before. Then, `cd` into that directory and clone the repository:

    git clone IP_ADDRESS:/git/apache2

Replace the IP_address with either the IP address of the Git server or its hostname (if you’ve created a DNS entry for it).

    warning: You appear to have cloned an empty repository

Make a backup of the current `/etc/apache2` directory on the web server, in case we make a mistake while converting it to being version controlled:

    sudo cp -rp /etc/apache2 /etc/apache2.bak

Then,move all the contents of /etc/apache2 into the repository:

    sudo mv /etc/apache2/* /git/apache2

The `/etc/apache2` directory is now empty. Be careful not to restart Apache at this point; it won’t see its configuration files and will fail. Remove the (now empty) `/etc/apache2` directory:

    sudo rm /etc/apache2

Make sure that Apache’s files are owned by root. Using the `chown`command, as we normally would to change ownership, we’ll also change the .git directory to be owned by root as well. We don’t want that, because the user responsible for pushing changes should be the owner of the `.git` folder. To change the ownership of the files to root, without touching hidden directories such as `.git`:

    sudo find /git/apache2 -name '.?*' -prune -o -exec chown root:root {} +

Create a symbolic link to the Git repository so the `apache2` daemon can find it:

    sudo ln -s /git/apache2 /etc/apache2

Check with:

    ls -l /etc | grep apache2

Reloading Apache, nothing should change, and it should find the same configuration files as it did
before.

    sudo systemctl reload apache2

To push the changes back to the Git server, associate the files within the `/git/apache2` directory into version control:

    git add .

If you run the git status command from within your Git repository, you should see output indicating that Git has new files that haven’t been committed yet. A Git commit simply finalizes the changes locally. Basically, it packages up your current changes to prepare them for being copied to the server.

To create a commit of all the files we’ve added so far, `cd` into the `/git/apache2` directory and run:

    git commit -a -m "Initial commit."

the `-a` option tells Git to include anything that’s changed in the repository. The `-m` option allows attaching a message to the commit, which is required. If you don’t use the `-m` option, it will open your default text editor and allow you to add a comment from there.

Push the changes back to the Git server:

    git push origin main

By default, the git suite of commands utilizes OpenSSH, so our git push command should create an`ssh` connection back to the Git server and push the files there. You won’t be able to inspect the contents of the Git directory on your Git server, because it won’t contain the same file structure as your original directory. But when you pull a Git repository though, the resulting directory structure will be just as you left it.

If you need to restore a repository onto another server, all you should need to do is perform a Git `clone`. To clone the repository into your current working directory:

    git clone IP_ADDRESS:/git/apache2

And each time you make changes to the configuration files, you can perform a git commit and then
push the changes up to the server to keep the content safe:

    git commit -a -m "Updated config: details."
    git push origin main

To revert changes should the configuration get changed with non-working files, locate a known working commit and get its commit hash. A good method is using the `tig` command. The tig package must be installed for this to work:

    sudo apt install tig

To use it, execute the `tig` command from within a Git repository. This will give a semi-graphical interface to browse through the Git commits. Select the best commit to go back to and get the commit hash. Exit `tig` by pressing `q`, then revert to that commit:

    git checkout <commit hash>

Test the application to make sure that the issue is completely fixed. When finished testing, you can make the change permanent. Switch back to the most recent commit:

    git checkout main

Then, permanently switch back to the commit that was found to be working properly:

    git revert --no-commit <commit hash>

Then, commit the reverted Git repository and push it back to the server:

    git commit -a -m "The previous commit broke the application. Reverting."
    git push origin main
