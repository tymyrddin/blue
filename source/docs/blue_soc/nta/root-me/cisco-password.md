# CISCO password

[root-me challenge CISCO - password](https://www.root-me.org/en/Challenges/Network/CISCO-password): Find the "Enable" password. (It’s not always a hash.)

----

Tried the enable secret. No go.

```text
$ cat ch15.txt | grep "password 7"                        
username hub password 7 025017705B3907344E 
username admin privilege 15 password 7 10181A325528130F010D24
username guest password 7 124F163C42340B112F3830
 password 7 144101205C3B29242A3B3C3927
```

Use the [Cisco Password Cracker](https://www.ifm.net.nz/cookbooks/passwordcracker.html) on those. Pattern emerges.

Prepend recursively with pattern in a [rule-based hashcat attack](https://hashcat.net/wiki/doku.php?id=rule_based_attack).

## Resources

* [Cisco passwords](https://repository.root-me.org/R%C3%A9seau/EN%20-%20Cisco%20passwords.pdf)
* [Cisco passwords encryption facts](https://repository.root-me.org/R%C3%A9seau/EN%20-%20Cisco%20passwords%20encryption%20facts.pdf)