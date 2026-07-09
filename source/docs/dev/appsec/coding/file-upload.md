# File upload security

File uploads are a consistent source of vulnerabilities not because the feature is inherently difficult, but because the validation tends to happen at the wrong point and on the wrong property. The [file upload attack techniques](https://red.tymyrddin.dev/docs/in/app/techniques/shells.html) page covers how upload functionality is exploited when these controls are absent or incomplete.

## Extension allowlists are insufficient

A file extension is metadata supplied by the client. It can be anything. Checking that the filename ends in `.jpg` before saving it does not prevent a PHP webshell named `shell.php.jpg`, and on some configurations does not prevent the server from executing it.

The MIME type derived from file content is more reliable. The `python-magic` library wraps libmagic, which reads the file header (magic bytes):

```python
import magic

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/gif", "application/pdf"}

def check_mime_type(file_bytes: bytes) -> str:
    mime = magic.from_buffer(file_bytes, mime=True)
    if mime not in ALLOWED_MIME_TYPES:
        raise ValueError(f"file type not permitted: {mime}")
    return mime
```

Note that `magic.from_buffer()` takes bytes. Read the full content (or enough of it for reliable detection) before calling, then use those same bytes for storage:

```python
def handle_upload(file) -> None:
    content = file.read()   # read once into memory
    mime = check_mime_type(content)
    save_file(content, mime)
```

The original pattern of `magic.from_buffer(file.read(1024))` followed by a second `file.read()` has a bug: after reading 1024 bytes the stream position is at byte 1024, so the second read returns only the remainder of the file. For a file shorter than 1024 bytes the second read returns nothing. Reading the full content once avoids this.

## Filename handling

The original filename from the client is not safe to use on the filesystem. It can contain [path traversal](lfi.md) sequences (`../../../etc/passwd`), null bytes, or characters with special meaning on the target OS.

Generate a server-side name instead:

```python
import uuid
import pathlib

def safe_filename(original: str, mime_type: str) -> str:
    allowed_exts = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "application/pdf": ".pdf",
    }
    ext = allowed_exts.get(mime_type, ".bin")
    return f"{uuid.uuid4()}{ext}"
```

The extension in the generated name is derived from the validated MIME type, so the two are consistent even if the client supplied a misleading name.

## Storage location

Files served from the same origin as the application can be loaded in a browser context where they inherit the application's cookies and session. A [stored XSS](xss.md) payload in an SVG file, or a crafted HTML file, runs in the victim's session if served from the same origin.

Options in order of preference:

- A separate domain or CDN with no session sharing (e.g., `uploads.example.com` or a blob storage URL from a cloud provider)
- A path outside the web root, served via the application with a `Content-Disposition: attachment` header and an explicit `Content-Type`
- A dedicated object store (S3-compatible, Google Cloud Storage, Azure Blob) with pre-signed URLs for access

Serving files from a directory inside the web root with no `Content-Disposition` header is the pattern that leads to stored XSS via uploaded content.

## Image re-encoding

Images can carry executable payloads in metadata, EXIF fields, or crafted pixel data. Re-encoding via Pillow strips most of this:

```python
from PIL import Image
import io

def reencode_image(content: bytes, output_format: str = "JPEG") -> bytes:
    img = Image.open(io.BytesIO(content))
    img = img.convert("RGB")  # strips alpha channel and palette-mode tricks
    out = io.BytesIO()
    img.save(out, format=output_format, optimize=True)
    return out.getvalue()
```

Re-encoding is not a substitute for MIME type checking; it is a second layer for environments where uploaded images are later rendered to users.

## Antivirus scanning

For environments where document uploads (PDF, Word, Excel) are expected, ClamAV provides open-source antivirus scanning. The `clamd` daemon exposes a socket interface; `clamd-client` or direct socket communication works from Python:

```python
import io
import clamd

cd = clamd.ClamdUnixSocket()

def scan_content(content: bytes, name: str = "upload") -> None:
    result = cd.instream(io.BytesIO(content))
    status, reason = result["stream"]
    if status != "OK":
        raise ValueError(f"antivirus scan failed: {reason}")
```

Antivirus catches known malware signatures; it does not catch novel or obfuscated payloads. For high-risk environments (document sharing, financial attachments), it is worth combining with sandboxed execution.

## Size limits

Enforce a maximum upload size at the framework level before the file reaches application code. In Flask:

```python
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB
```

Flask returns a 413 error automatically if this limit is exceeded. Without a limit, an upload endpoint is a simple denial-of-service vector.
