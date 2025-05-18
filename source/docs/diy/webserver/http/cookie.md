# Set-Cookie

The `Set-Cookie` HTTP response header is used to send a cookie from the server to the user agent, so the user agent can send it back to the server later. To send multiple cookies, multiple `Set-Cookie` headers should be sent in the same response.

For example (the Domain attribute has been removed intentionally):

    Set-Cookie: name=value; Secure; HttpOnly; SameSite=Strict

## Resources

* [MDN Web docs: Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#Secure_and_HttpOnly_cookies)


