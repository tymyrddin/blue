Secure coding
===================================================================

Every entry point in an application is a potential trust boundary. The pages here address the coding-level
controls that prevent common vulnerability classes: input validation, output encoding, authentication, access
control, and the framework-specific defaults that determine whether a stack is safe or dangerous out of the
box. Most of what appears in security reviews is not novel. It is familiar patterns in unfamiliar code.

.. toctree::
   :glob:
   :maxdepth: 1
   :includehidden:
   :caption: A vulnerability is usually a recognisable pattern. Finding it requires looking deliberately.

   input.md
   output.md
   authentication.md
   cache.md
   file-upload.md
   js.md
   python.md
   *
