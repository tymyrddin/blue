# CORS best practices

* Origins specified in the `Access-Control-Allow-Origin` header should only be sites that are trusted. 
* Dynamically reflecting origins from cross-origin requests without validation is exploitable and to be avoided.
* Also avoid using the header `Access-Control-Allow-Origin: null`. Cross-origin resource calls from internal documents and sandboxed requests can specify the `null` origin. CORS headers must be  defined in respect of trusted origins for private and public servers. 
* Avoid using wildcards in internal networks. Trusting network configuration alone to protect internal resources is not sufficient when internal browsers can access untrusted external domains. 
* CORS defines browser behaviours and is not a replacement for server-side protection of sensitive data - an attacker can directly forge a request from any trusted origin. Web servers should apply protections for sensitive data, such as authentication and session management, in addition to properly configured CORS. 