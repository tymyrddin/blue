# iOS forensics (SQLiteDB)

Applying the [fundamentals of iOS forensics](../notes/ios.md) for analysing an actual iPhone in "Operation JustEncase": 

Your crime taskforce has been investigating into the root cause of a recent outbreak of criminal activity. Although you've apprehended a Mr Brandon Hunter, you need to analyse the filesystem dump of his iPhone to find a lead into the gang.

Although the suspect's phone is locked with a passcode, you have been able to use a recent "Lockdown Certificate" from the suspect's computer, allowing you to create a [logical file system dump from an iPhone backup he made recently](../notes/ios-acquisition.md). 

----

Open DB Browser (SQLite), click on open database option and select `sms`, then `message`:

![open db](/_static/images/ios1.png)

Who was the recipient of the SMS message sent on 23rd of August 2020? And what did the SMS message say?

![first name of the other person in the contacts](/_static/images/ios2.png)

Looking at the address book, what is the first name of the other person in the contacts? And what is their listed "Organisation"?

![name of other person and their listed "Organisation"](/_static/images/ios3.png)

Investigate their browsing history, what is the address of the website that they have bookmarked?

![address of the website that they have bookmarked](/_static/images/ios4.png)

The suspect received an email, what is the `remote_id` of the sender?

![remote_id of the sender](/_static/images/ios5.png)

What is the name of the company on one of the images stored on the suspects phone?

![name of the company on one of the images](/_static/images/ios6.png)

What is the value of the cookie that was left behind?

![value of the cookie](/_static/images/ios7.png)
