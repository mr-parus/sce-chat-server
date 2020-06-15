[![codecov](https://codecov.io/gh/mr-parus/sce-chat-server/branch/master/graph/badge.svg?token=R90VRBWZPF)](https://codecov.io/gh/mr-parus/sce-chat-server)
[![Heroku](https://heroku-badge.herokuapp.com/?app=sce-chat)](https://sce-chat.herokuapp.com/)

# sce-chat-server
Simple websocket-based chat.

[DEMO: Client heroku deploy](https://sce-chat.herokuapp.com/)

[DEMO: Server heroku deploy](https://sce-chat.herokuapp.com/)

[Client repository (REACT)](https://github.com/mr-parus/sce-chat-client)


## Features:
* ✅ Sessions (JWT token)
* ✅ Sending/Receiving messages
* ✅ Restoring old messages
* ✅ Notifications:
    * about user disconnection
    * 'delivered/read' message status
    * about new user joining the chat
    * etc
* ✅ No users with the same username online
* ❌ Authentication with passwords =) it's for demo purpose

## Known issues:
### Security
* ✅ Handling and tracking unexpected activity:
    * unexpected message events
    * unexpected message schemas
* ❌ CORS restrictions (to make possible to connect from everywhere and test) 
* ❌ Rate limitation (per session, per IP, etc)
    * https://github.com/animir/node-rate-limiter-flexible
* ❌ Payload size restrictions
* ❌ Authentication before WS connection is established (X-Auth-Token)

...
* ❌ SSL

## Socket API
### Supported Events
* [Event Names](src/api/modules/common/types/SocketEventName.ts)
* [Messages Schema](src/api/modules/common/types/SocketEvent.ts)
