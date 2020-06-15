[![codecov](https://codecov.io/gh/mr-parus/sce-chat-server/branch/master/graph/badge.svg?token=R90VRBWZPF)](https://codecov.io/gh/mr-parus/sce-chat-server)
[![Heroku](https://heroku-badge.herokuapp.com/?app=sce-chat)](https://sce-chat.herokuapp.com/)

# sce-chat-server
Simple, websocket based chat.

[Client heroku deploy](https://sce-chat.herokuapp.com/)

[Server heroku deploy](https://sce-chat.herokuapp.com/)

[Client repository](https://github.com/mr-parus/sce-chat-client)


## Features:
* ✅ Sessions using JWT
* ✅ Sending/Receiving messages
* ✅ Restoring messages
* ✅ Reading messages
* ✅ Notifications
    * connected users about user disconnection
    * a user that his message read
    * notification to connected users about new user joins the chat
    * message delivered to the server 
    * etc..
* ✅ No users with same username online
* ❌ Authentication with passwords =) it's for demo purpose

## Known issues:
### Security
* ✅ Unexpected activity tracking
    * unexpected message events
    * unexpected message schemas
* ❌ CORS restrictions (to make possible to connect from everywhere and test) 
* ❌ Rate limitation (per session, per IP, etc)
    * https://github.com/animir/node-rate-limiter-flexible
* ❌ Payload size restrictions
* ❌ Authentication before WS connection establishes (X-Auth-Token)

...
* ❌ SSL

## Socket API
### Supported Events
* [Event Names](src/api/modules/common/types/SocketEventName.ts)
* [Messages Schema](src/api/modules/common/types/SocketEvent.ts)

