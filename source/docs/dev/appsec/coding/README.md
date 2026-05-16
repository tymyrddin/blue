# Secure coding

Secure code is not a separate phase bolted onto a working codebase. It is what happens when
the boundary between untrusted and trusted data is respected consistently, from the first
function that touches external input to the last one that produces output.

The pages in this section cover the specific patterns that appear most often in vulnerability
reports: how user-controlled values reach file paths, external URLs, shell commands, and HTML
output, and what the safe alternatives look like in current Python and JavaScript. Alongside
those attack surfaces, the section covers authentication, file handling, caching, and keeping
secrets out of version control.

The examples use Python and JavaScript. The underlying principles apply across languages;
the specific APIs differ.
