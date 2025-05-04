# Hunt clear-text credentials

Wireshark is not an IDS, but it provides suggestions for some cases under the expert info. And sometimes anomalies 
replicate the legitimate traffic, so the detection becomes harder. For example, in a clear-text credential hunting 
case, it is not easy to spot the multiple credential inputs and decide if there is a brute-force attack or if it 
is a standard user who mistyped their credentials.

As everything is presented at the packet level, it is hard to spot the multiple username/password entries at first 
glance. The detection time will decrease when an analyst can view the credential entries as a list. Wireshark has 
such a feature to help analysts who want to hunt clear-text credential entries.

Some Wireshark dissectors (FTP, HTTP, IMAP, pop and SMTP) are programmed to extract clear-text passwords from the 
capture file. View detected credentials using the "Tools -> Credentials" menu. This feature works only after 
specific versions of Wireshark (v3.1 and later). Since the feature works only with particular protocols, it is 
suggested to have manual checks and not entirely rely on this feature to decide if there is a clear-text credential 
in the traffic.

## Questions

Use the `Desktop/exercise-pcaps/bonus/Bonus-exercise.pcap` file.

**What is the packet number of the credentials using `HTTP Basic Auth`?**

| ![HTTP Basic Auth](/_static/images/shark-29.png)
|:--:|
| `237` |

**What is the packet number where `empty password` was submitted?**

| ![empty password](/_static/images/shark-30.png)
|:--:|
| `170` |

.
