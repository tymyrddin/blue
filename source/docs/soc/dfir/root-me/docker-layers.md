# Docker layers

[root-me challenge](https://www.root-me.org/en/Challenges/Forensic/Docker-layers): I lost the password I used to encrypt my secret flag file. Could you help me to recover it ?

----

What?

```text
┌──(kali㉿kali)-[~/Downloads/root-me/forensic/docker-layer]
└─$ container-diff analyze -t history ch29.tar

-----History-----

Analysis for ch29.tar:
-/bin/sh -c #(nop) ADD file:d2abf27fe2e8b0b5f4da68c018560c73e11c53098329246e3e6fe176698ef941 in /
-/bin/sh -c #(nop)  CMD ["bash"]
-/bin/sh -c apt update -y
-/bin/sh -c apt install -y curl openssl
-/bin/sh -c #(nop) COPY file:2ca89eb39686ffcc3d2d87bbc9293559252cff471f80c2ed5d024b214f9a6fa3 in /
-/bin/sh -c echo -n $(curl -s https://pastebin.com/raw/P9Nkw866) | openssl enc -aes-256-cbc -iter 10 -pass pass:$(cat /pass.txt) -out flag.enc
-/bin/sh -c rm /pass.txt
```

Unpack:

```text
┌──(kali㉿kali)-[~/Downloads/root-me/forensic/docker-layer]
└─$ tar -xf ch29.tar
                                                                                                                    
┌──(kali㉿kali)-[~/Downloads/root-me/forensic/docker-layer]
└─$ ll                                        
total 238916
drwxr-xr-x 2 kali kali      4096 May  9 03:16 1bbd61a572ad5f5e2ac0f073465d10dc1c94a71359b0adfd2c105be4c1cb2507
-r--r--r-- 1 kali kali      2048 Dec 31  1969 316bbb8c58be42c73eefeb8fc0fdc6abb99bf3d5686dd5145fc7bb2f32790229.tar
-r--r--r-- 1 kali kali      2048 Dec 31  1969 3309d6da2bd696689a815f55f18db3f173bc9b9a180e5616faf4927436cf199d.tar
-r--r--r-- 1 kali kali  75156480 Dec 31  1969 4942a1abcbfa1c325b1d7ed93d3cf6020f555be706672308a4a4a6b6d631d2e7.tar
drwxr-xr-x 2 kali kali      4096 May  9 03:16 5bcc45940862d5b93517a60629b05c844df751c9187a293d982047f01615cb30
-r--r--r-- 1 kali kali  16729088 Dec 31  1969 743c70a5f809c27d5c396f7ece611bc2d7c85186f9fdeb68f70986ec6e4d165f.tar
drwxr-xr-x 2 kali kali      4096 May  9 03:16 82ba49da0bd5d767f35d4ae9507d6c4552f74e10f29777a2a27c97778962476d
-r--r--r-- 1 kali kali      1536 Dec 31  1969 8d364403e7bf70d7f57e807803892edf7304760352a397983ecccb3e76ca39fa.tar
drwxr-xr-x 2 kali kali      4096 May  9 03:16 8f0d75885373613641edc42db2a0007684a0e5de14c6f854e365c61f292f3b4d
-r--r--r-- 1 kali kali      2439 Dec 31  1969 b324f85f8104bfebd1ed873e90437c0235d7a43f025a047d5695fe461da717c6.json
-r--r--r-- 1 kali kali  30390272 Dec 31  1969 b58c5e8ccaba8886661ddd3b315989f5cf7839ea06bbe36547c6f49993b0d0aa.tar
drwxr-xr-x 2 kali kali      4096 May  9 03:16 ca7f60c6e2a66972abcc3147da47397d1c2edb80bddf0db8ef94770ed28c5e16
-rw-r--r-- 1 kali kali 122307584 May  9 03:03 ch29.tar
drwxr-xr-x 2 kali kali      4096 May  9 03:16 db04fe239ab708e4ab56ea0e5c1047449b7ea9e04df9db5b1b95d00c6980ff3f
-r--r--r-- 1 kali kali       573 Dec 31  1969 manifest.json
-r--r--r-- 1 kali kali       111 Dec 31  1969 repositories
```

Find `pass.txt`:

```text
┌──(kali㉿kali)-[~/Downloads/root-me/forensic/docker-layer]
└─$ cd 82ba49da0bd5d767f35d4ae9507d6c4552f74e10f29777a2a27c97778962476d 
                                                                                                                                  
┌──(kali㉿kali)-[~/…/root-me/forensic/docker-layer/82ba49da0bd5d767f35d4ae9507d6c4552f74e10f29777a2a27c97778962476d]
└─$ tar -xf layer.tar
                                                                                                                                  
┌──(kali㉿kali)-[~/…/root-me/forensic/docker-layer/82ba49da0bd5d767f35d4ae9507d6c4552f74e10f29777a2a27c97778962476d]
└─$ ls
json  layer.tar  pass.txt  VERSION
```

Find `flag.enc`:

```text
┌──(kali㉿kali)-[~/Downloads/root-me/forensic/docker-layer]
└─$ cd ca7f60c6e2a66972abcc3147da47397d1c2edb80bddf0db8ef94770ed28c5e16 
                                                                                                                                  
┌──(kali㉿kali)-[~/…/root-me/forensic/docker-layer/ca7f60c6e2a66972abcc3147da47397d1c2edb80bddf0db8ef94770ed28c5e16]
└─$ tar -xf layer.tar                                                  
                                                                                                                                  
┌──(kali㉿kali)-[~/…/root-me/forensic/docker-layer/ca7f60c6e2a66972abcc3147da47397d1c2edb80bddf0db8ef94770ed28c5e16]
└─$ ls
flag.enc  json  layer.tar  VERSION
```

Decode the flag with:

```text
┌──(kali㉿kali)-[~/Downloads/root-me/forensic/docker-layer]
└─$ cat pass.txt
```

```text
┌──(kali㉿kali)-[~/Downloads/root-me/forensic/docker-layer]
└─$ openssl enc -aes-256-cbc -iter 10 -d -in flag.enc -out flag.txt
enter AES-256-CBC decryption password:
```


