# WebSocket security

WebSocket connections start as HTTP requests and upgrade to a persistent bidirectional channel. The upgrade handshake inherits HTTP's authentication mechanisms (cookies, `Authorization` header), but once the connection is established the protocol carries arbitrary messages with no built-in concept of per-message authentication or authorisation. The [WebSocket attack techniques](https://red.tymyrddin.dev/docs/in/app/techniques/sockets.html) page covers how Cross-Site WebSocket Hijacking and input injection are exploited.

## Origin validation during handshake

The WebSocket handshake includes an `Origin` header that identifies the page that initiated the connection. Validating it server-side prevents a third-party site from opening a WebSocket connection using the victim's session cookies:

```python
# Django Channels example
from channels.middleware import BaseMiddleware
from channels.exceptions import DenyConnection
from django.conf import settings

class OriginValidationMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        origin = dict(scope.get("headers", [])).get(b"origin", b"").decode()
        allowed = getattr(settings, "WEBSOCKET_ALLOWED_ORIGINS", [])
        if allowed and origin not in allowed:
            raise DenyConnection()
        return await super().__call__(scope, receive, send)
```

Without origin validation, any page the victim visits can open a WebSocket connection to the application using the victim's credentials.

## Authentication within the channel

Because the WebSocket protocol has no native authentication mechanism, applications authenticate during the handshake. Cookie-based session authentication works if the cookie is validated server-side during the upgrade request. Token-based APIs often pass the token as a query parameter on the upgrade URL or as the first message after connection:

```javascript
// client: pass token in first message after connect
const ws = new WebSocket("wss://api.example.com/ws");
ws.onopen = () => {
    ws.send(JSON.stringify({ type: "auth", token: sessionToken }));
};
```

On the server, the connection is rejected or placed in an unauthenticated state until the token message is received and verified. Messages that arrive before authentication is confirmed are discarded.

## Input validation on messages

WebSocket messages are user-controlled input. All the same validation that applies to HTTP request bodies applies to WebSocket message bodies. Messages that construct database queries, render HTML, or invoke system operations are injection vectors:

```python
# server-side message handler
import json
from pydantic import BaseModel, ValidationError

class ChatMessage(BaseModel):
    content: str
    room_id: int

async def handle_message(raw: str) -> None:
    try:
        msg = ChatMessage.model_validate_json(raw)
    except ValidationError:
        return  # discard invalid messages
    # proceed with validated msg.content and msg.room_id
```

Content passed to HTML rendering is encoded at the point of output. SQL queries use parameterised statements. The channel is not a trusted input channel simply because a connection was authenticated.

## Transport security

`ws://` transmits messages in plain text. `wss://` is the TLS-encrypted equivalent and is appropriate wherever `https://` is used. Mixed deployments where the page is served over HTTPS but connects to a `ws://` WebSocket are blocked by modern browsers under mixed content restrictions. Using `wss://` everywhere removes this as a configuration concern.

## Connection timeouts and rate limiting

A WebSocket connection that stays open indefinitely consumes a file descriptor and memory on the server. Setting a connection timeout and a per-connection rate limit on messages prevents resource exhaustion from a high volume of persistent connections or message flooding:

```python
# in an async handler: disconnect idle connections
import asyncio

async def connection_handler(websocket):
    try:
        async with asyncio.timeout(300):  # 5-minute idle timeout; requires Python 3.11+
            async for message in websocket:
                await handle_message(message)
    except asyncio.TimeoutError:
        await websocket.close()
```
