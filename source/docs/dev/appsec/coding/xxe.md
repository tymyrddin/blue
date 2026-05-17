# XML external entity injection

XML parsers can be configured to resolve external entity references: references that fetch content from a URI (file path, HTTP URL, or other scheme) and include it in the parsed document. When an application processes attacker-controlled XML, that feature becomes an arbitrary file read, an SSRF vector, and in some configurations a denial-of-service primitive. The [XXE attack techniques](https://red.tymyrddin.dev/docs/in/app/techniques/xxe.html) page covers the exploitation side.

The payload structure is:

```xml
<?xml version="1.0"?>
<!DOCTYPE foo [
    <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<root>&xxe;</root>
```

If the parser resolves `&xxe;`, the response includes the contents of `/etc/passwd`.

## Python: defusedxml and lxml

The `defusedxml` library wraps the standard library parsers and disables external entity processing and DTD loading by default:

```python
import defusedxml.ElementTree as ET

# safe: external entities and DTDs are disabled
tree = ET.parse(xml_input)
```

Using `defusedxml` as a drop-in replacement for `xml.etree.ElementTree` requires no other change. The standard library parsers (`xml.etree.ElementTree`, `xml.sax`, `xml.dom.minidom`) are safe against XXE in CPython as of Python 3.8 (the expat library used internally ignores external entities by default), but the safety is an implementation detail, not an API guarantee. Explicit use of `defusedxml` removes the dependency on that detail.

For `lxml`, external entities are controlled via parser options:

```python
from lxml import etree

# safe: no network access, no external DTDs
parser = etree.XMLParser(
    resolve_entities=False,
    no_network=True,
    load_dtd=False,
)
tree = etree.parse(xml_input, parser)
```

The default `lxml` parser does not resolve external entities in most builds, but passing the parser explicitly makes the configuration self-documenting.

## Node.js

The `fast-xml-parser` library does not support external entities at all by default. The older `xml2js` library is also safe against XXE in its standard configuration. If using a parser that requires explicit configuration:

```javascript
const { XMLParser } = require("fast-xml-parser");

const parser = new XMLParser({
    allowBooleanAttributes: true,
    // fast-xml-parser does not support DTD entities; no additional config needed
});

const result = parser.parse(xmlString);
```

If the application uses `libxmljs` or a native binding that exposes entity resolution, check whether the library supports disabling DTD processing and do so explicitly.

## Java

The Java `DocumentBuilderFactory` resolves external entities by default. Disabling requires explicit configuration:

```java
DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
dbf.setFeature("http://xml.org/sax/features/external-general-entities", false);
dbf.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
dbf.setXIncludeAware(false);
dbf.setExpandEntityReferences(false);
DocumentBuilder db = dbf.newDocumentBuilder();
```

The OWASP XXE Prevention Cheat Sheet maintains current recommendations for each Java XML parser.

## Eliminating the XML surface

If the application receives data in XML because the client or upstream service sends it, and the format is otherwise arbitrary, JSON is the safer choice. JSON has no concept of external entities or DTDs; switching to JSON removes the XXE surface entirely.

Where XML is required (SOAP, some document formats), restricting the allowed document structure to a known schema (XSD validation after safe parsing) catches unexpectedly structured documents without relying solely on parser configuration.
