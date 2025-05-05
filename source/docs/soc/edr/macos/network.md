# Network hardening

Monitor network connections:

```
sudo lsof -i -P -n | grep ESTABLISHED
sudo nettop -P -m route
```