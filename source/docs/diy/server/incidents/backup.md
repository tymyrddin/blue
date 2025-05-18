# Implementing a backup plan

Backups are one of those things that some people don’t seem to take seriously until it’s too late. Data
loss can be a catastrophic event for an organisation, so it’s imperative that you implement a solid
backup plan. 

There’s no one best backup solution, since it all depends on what kind of data you need to secure, and
what software and hardware resources are available to you. This may mean that you’ll need to make some compromises, such as creating regular snapshots of
your database server’s storage volume or regularly dumping a backup of your important databases to
an external storage device.

The `rsync` utility is one of the most valuable pieces of software around to server administrators. It
allows us to do some really wonderful things. In some cases, it can save us quite a bit of money. For
example, online backup solutions are wonderful in the sense that we can use them to store off-site
copies of our important files. And depending on the volume of data, they can be quite expensive.
With `rsync`, we can back up our data in much the same way, with not only our current files copied over
to a backup target but also differentials. If we have another server to send the backup to, even better.

    sudo rsync -a /home /backup

Where the `-a` option, the archive mode, is a wrapper option that includes the following options all at the same time:

    -rlptgoD

To point `rsync` to another server, rather than to another directory on the local server:

    sudo rsync -av /home/myuser admin@IP_ADDRESS:/backup

By default, `rsync` copies data between two locations, but it doesn’t remove anything. With the `--delete` option, you can synchronise two points, telling `rsync` to make them the same by allowing it to delete files in the target that are no longer in the source.

## Incremental backups

    sudo rsync -avb --delete --backup-dir=/backup/incremental /src /target

Copying files from `/src` to `/target`, but now sending replaced files to the `/backup/incremental` directory. This means that when a file is going to be replaced on the target, the original file will be copied to `/backup/incremental`. This works because we used the`-b` option (backup) and the `--backup-dir` option, which means that the replaced files will not be renamed; they’ll simply be moved to the designated directory. This allows us to effectively perform incremental backups.

Using the Bash shell to make incremental backups work even better:

    CURDATE=$(date +%m-%d-%Y)
    sudo rsync -avb --delete --backup-dir=/backup/incremental/$CURDATE /src /target

## Simple script

```python
""" Simple backup script which just creates the root structure in an other
folder and syncs everything which recursively lies within one of the source
folders. For files bigger than a threshold they are first gziped."""

import argparse
import gzip
import os
import shutil
import sys
import threading

def parse_input():
    parser = argparse.ArgumentParser()
    parser.add_argument('-target', nargs=1, required=True,
                        help='Target Backup folder')
    parser.add_argument('-source', nargs='+', required=True,
                        help='Source Files to be added')
    parser.add_argument('-compress', nargs=1,  type=int,
                        help='Gzip threshold in bytes', default=[100000])

    # no input means show me the help
    if len(sys.argv) == 1:
        parser.print_help()
        sys.exit()

    return parser.parse_args()


def size_if_newer(source, target):
    # If newer it returns size, otherwise it returns False

    src_stat = os.stat(source)
    try:
        target_ts = os.stat(target).st_mtime
    except FileNotFoundError:
        try:
            target_ts = os.stat(target + '.gz').st_mtime
        except FileNotFoundError:
            target_ts = 0

    # The time difference of one second is necessary since subsecond accuracy
    # of os.st_mtime is striped by copy2
    return src_stat.st_size if (src_stat.st_mtime - target_ts > 1) else False

def threaded_sync_file(source, target, compress):
    size = size_if_newer(source, target)

    if size:
        thread = threading.Thread(target=transfer_file, 
                                  args=(source, target, size > compress))
        thread.start()
        return thread

def sync_file(source, target, compress):
    size = size_if_newer(source, target)

    if size:
        transfer_file(source, target, size > compress)


def transfer_file(source, target, compress):
    """ Either copy or compress and copies the file """

    try:
        if compress:
            with gzip.open(target + '.gz', 'wb') as target_fid:
                with open(source, 'rb') as source_fid:
                    target_fid.writelines(source_fid)
            print('Compress {}'.format(source))
        else:
            shutil.copy2(source, target)
            print('Copy {}'.format(source))
    except FileNotFoundError:
        os.makedirs(os.path.dirname(target))
        transfer_file(source, target, compress)


def sync_root(root, arg):
    target = arg.target[0]
    compress = arg.compress[0]
    threads = []

    for path, _, files in os.walk(root):
        for source in files:
            source = path + '/' + source
            threads.append(threaded_sync_file(source, 
                           target + source, compress))
#            sync_file(source, target + source, compress)
    for thread in threads:
        thread.join()


if __name__ == '__main__':
    arg = parse_input()
    print('### Start copy ####')
    for root in arg.source:
        sync_root(root, arg)
    print('### Done ###')
```


