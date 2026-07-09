# Path traversal

Path traversal occurs when user-controlled input reaches a file operation without being
constrained to an intended directory. The classic form is `../../etc/passwd`, but the
mechanism appears in any context where a filename or path segment comes from outside the
application: file download endpoints, archive extraction, template loading, log viewing.

The [directory traversal attack page](https://red.tymyrddin.dev/docs/in/app/techniques/traversal.html) covers common exploitation patterns. The common mistake on the defence side is checking the input string rather than the resolved path. An input like
`images/../../etc/shadow` may pass a check for `../` sequences in the raw string while still
resolving outside the intended directory after the OS processes it.

## Python

The safe pattern uses `pathlib.Path.resolve()` to canonicalise the path, then checks whether
the result falls within the allowed base:

```python
from pathlib import Path

BASE_DIR = Path("/var/www/uploads").resolve()

def safe_open(filename: str) -> bytes:
    # resolve() follows symlinks and collapses .. sequences
    target = (BASE_DIR / filename).resolve()

    if not target.is_relative_to(BASE_DIR):
        raise ValueError("access outside upload directory")

    return target.read_bytes()
```

The check happens on the resolved path. `is_relative_to()` is available
from Python 3.9; on earlier versions, use:

```python
    if not str(target).startswith(str(BASE_DIR) + "/"):
        raise ValueError("access outside upload directory")
```

The unsafe pattern, for comparison:

```python
# unsafe: checks the input string
def unsafe_open(filename: str) -> bytes:
    if ".." in filename:
        raise ValueError("invalid path")
    return open(f"/var/www/uploads/{filename}").read()
```

A filename like `images/%2e%2e%2fetc%2fpasswd` (URL-encoded) may bypass the string check.

## Node.js

```javascript
const path = require("path");
const fs = require("fs");

const BASE_DIR = path.resolve("/var/www/uploads");

function safeRead(filename) {
    const target = path.resolve(BASE_DIR, filename);

    if (!target.startsWith(BASE_DIR + path.sep)) {
        throw new Error("access outside upload directory");
    }

    return fs.readFileSync(target);
}
```

The `path.sep` suffix prevents a directory named `/var/www/uploads-other` from passing the
prefix check.

## Archive extraction

Archive extraction is a high-risk context. ZIP and tar archives can contain entries with
absolute paths or `..` sequences. Extraction libraries do not always strip these.

```python
import zipfile
from pathlib import Path

def safe_extract(zip_path: str, dest: str) -> None:
    dest_dir = Path(dest).resolve()

    with zipfile.ZipFile(zip_path) as zf:
        for member in zf.namelist():
            target = (dest_dir / member).resolve()

            if not target.is_relative_to(dest_dir):
                raise ValueError(f"zip slip: {member}")

            zf.extract(member, dest_dir)
```

This is the "zip slip" pattern: a maliciously crafted archive overwrites arbitrary files on
the filesystem if extraction is done without path validation.
