# Logrotate

On most Linux distributions, logrotate is installed by default. If not the case install it using the package manager. The below is for debian and friends.

## Installation

    # apt-get install logrotate

## Configuration

The main configuration file is at `/etc/logrotate.conf`. Creating config files for each service separately can use the folder `/etc/logrotate.d/`.

    # vi /etc/logrotate.d/remote

Append:

    /var/log/remote/*/*
    {
            rotate 7
            daily
            size=10M 
            missingok
            compress
            delaycompress
    }

This will compress and rotate logs every day and keep them for 90 days (3 months).

  * Keep last 7 logs 
  * The logs will be rotated `daily`
  * Each log will not be rotated until it reaches 10MB
  * If the log file is missing, go on to the next one without issuing an error message.
  * All rotated logs, with the exception of the most recent one, should be compressed.
