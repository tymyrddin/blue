# Securing object storage

Each cloud provider has its own implementation of object storage. The basic idea is the same:

* Object storage is a special type of storage that is meant to store data.
* Files (or objects) are stored inside buckets (these are logical concepts such as directories or logical containers).
* Access to files on object storage is either done through the HTTP(S) protocol API via web command-line tools or programmatically using SDK tools.
* Object storage is not meant to store operating systems or databases (please refer to the Securing block storage section).

