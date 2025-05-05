# File uploads

Best practices

* Whitelist Extensions – Only allow .pdf, .jpg, etc.
* Scan Content – Use libmagic (not just file extensions).
* Isolate Storage – Serve files from a separate domain/CDN.

Risks

* Malicious files (e.g., disguised .php in .jpg)
* Directory traversal

Example (Python - File Validation):

```python
import magic  

def validate_file(file):  
    if not file.filename.endswith(('.png', '.jpg')):  
        raise ValueError("Invalid extension")  
    if magic.from_buffer(file.read(1024), mime=True) != 'image/jpeg':  
        raise ValueError("Invalid content")  
```