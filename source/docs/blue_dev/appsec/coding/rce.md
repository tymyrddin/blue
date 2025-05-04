# Arbitrary code execution defence

Prevention

* Sandboxing – Use restricted environments (Docker, gVisor).
* No `eval()` – Ever.

Example (Node.js - Safe Alternative):

```javascript
// BAD: eval is dangerous  
eval(userInput);  

// GOOD: Use a parser  
math.evaluate(userInput);  // From 'mathjs' library  
```
