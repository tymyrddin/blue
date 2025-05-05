# Local file inclusion (LFI) defence

Prevention

* Disable dynamic file paths – Use hardcoded whitelists.
* Chroot/Jail – Restrict filesystem access.

Risks

    ../../etc/passwd attacks

Example (PHP - Safe Include):

```php
$allowed = ['page1.php', 'page2.php'];  
if (in_array($_GET['page'], $allowed)) {  
    include($_GET['page']);  
}  
```
