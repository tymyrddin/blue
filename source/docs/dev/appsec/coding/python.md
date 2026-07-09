# Python security patterns

Python's standard library and common packages have well-known unsafe defaults. Most are documented; some are still
encountered in production code years after the safer alternative became available.

## YAML parsing

PyYAML's `yaml.load()` with no explicit Loader executes arbitrary Python when it encounters `!!python/object` and
related tags. A crafted YAML document can run any code the Python process can run:

```python
import yaml

# unsafe: executes Python via !!python/object tags
data = yaml.load(user_input)

# safe: restricted parser, no code execution
data = yaml.safe_load(user_input)
```

Since PyYAML 6.0 `yaml.load()` without an explicit Loader emits a warning. Passing `Loader=yaml.FullLoader` is not
sufficient for untrusted input; `SafeLoader` (used by `yaml.safe_load()`) restricts parsing to scalar types and
collections.

## pickle

Python's `pickle` module can execute arbitrary code during deserialization. The `__reduce__` method on a class controls
how instances are serialized and deserialized; an attacker who controls pickle bytes controls what runs:

```python
import pickle


# unsafe: any code the attacker encodes runs here
def load_from_cache(data: bytes):
    return pickle.loads(data)
```

[Insecure deserialisation](https://red.tymyrddin.dev/docs/in/app/techniques/id.html) covers the attack patterns built on this execution primitive.

JSON carries no executable semantics and is the appropriate format for data that crosses trust boundaries:

```python
import json


def load_from_cache(data: str) -> dict:
    return json.loads(data)
```

When typed Python objects are needed across a boundary, deserializing from JSON into a Pydantic model gives both
structure and validation without execution risk.

## subprocess and shell invocation

`subprocess.run()` with a list does not invoke a shell. Shell metacharacters in user-supplied arguments are treated as
literal strings:

```python
import subprocess

# safe: list form, no shell
subprocess.run(["convert", input_path, output_path], check=True, capture_output=True)

# unsafe: shell=True passes the string to /bin/sh
subprocess.run(f"convert {input_path} {output_path}", shell=True)
```

`os.system()` and `os.popen()` always invoke a shell. Both carry the same injection risk as
`subprocess.run(..., shell=True)`. When a shell is genuinely required (for pipes or shell built-ins), `shlex.quote()`
wraps each user-controlled value:

```python
import shlex, subprocess

cmd = f"grep {shlex.quote(pattern)} {shlex.quote(logfile)}"
result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
```

Prefer the list form where the command structure allows it.

## Jinja2 template injection

`Environment(autoescape=True)` is the safe default for HTML templates; it escapes output at render time. The dangerous
pattern is passing user-controlled content as a template string rather than as a variable:

```python
from jinja2 import Environment

env = Environment(autoescape=True)

# safe: user_value is a variable
template = env.from_string("Hello, {{ name }}!")
output = template.render(name=user_value)

# unsafe: user controls the template itself; Jinja2 expressions execute before escaping
template = env.from_string(user_supplied_template)
output = template.render()
```

`autoescape=True` does not protect against template injection because the payload runs before escaping is applied. The
fix is to ensure no user-controlled data reaches `from_string()` or `render_template_string()`. The [server-side
template injection attack page](https://red.tymyrddin.dev/docs/in/app/techniques/ssti.html) covers the exploitation side.

## TLS verification

`requests.get(url, verify=False)` disables TLS certificate verification entirely. The connection is encrypted, but the
application accepts any certificate, including those from a man-in-the-middle. This pattern appears in development to
skip certificate errors and tends to stay in production:

```python
import requests

# unsafe: accepts any certificate
response = requests.get(url, verify=False)

# safe: default behaviour verifies the certificate chain
response = requests.get(url)
```

If the problem is a self-signed or internal CA certificate, the correct fix is to pass the CA bundle path as
`verify="/path/to/ca-bundle.pem"`.

## eval and safe alternatives

`eval()` executes an arbitrary Python expression. `ast.literal_eval()` evaluates Python literals only (strings, numbers,
lists, dicts, tuples, booleans, `None`) and raises on anything else:

```python
import ast

# unsafe: runs any Python expression
result = eval(user_input)

# safe: literals only, no function calls or imports
result = ast.literal_eval(user_input)
```

`ast.literal_eval()` is appropriate for deserializing simple Python-format data (configuration values, structured
constants). It is not a general-purpose expression evaluator; for that, a purpose-built library with explicit resource
limits is more appropriate.
