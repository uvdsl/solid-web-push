# Solid Web Push

This is a simple demo for Web Push Notifications for Solid PWAs.
This server-side script subscribes via WebSocket to the resource and passes any notification on that resource from the server to the Solid PWA via Web Push.

## How it works.
Basically, this service is a server-side script that lives in or along side a Solid Pod Server.  

An agent can find details of the service in its profile (e.g. my [example](./model/service$.ttl)) which may be advertised by resources the agent wants to receive updates on.
The agent learns the `VAPID Public Key` of the service and its `inbox` from the profile.
The public key is needed for the  _Voluntary Application Server Identification_ as defined in [here](https://datatracker.ietf.org/doc/html/draft-ietf-webpush-vapid-01).
The inbox is the resource the agent may post its subscription to.  

This subscription contains all the details necessary for the regular Web Push Subscription, i.e. an `endpoint` and `keys` for authentifcation and encrpytion.
In addition, the agent specifies the `object` of the subscription, i.e. the resource for which updates should be received.  

The service receives the new subscription from the agent and opens a websocket connection to that resource to listen for updates.
When the resource is updated, the service forwards the notification via Web Push to the client.

_Note:_ At the moment, websocket notifications work without authentication and authorization (at least for NSS). 
This is why this demo of a Solid Web Push works under the hood with websockets.
It is not the point of this demo to provide a full fletched solution, but rather to demonstrate the usefullness of Web Push on Solid Servers.
Details on how to properly design and implement a spec-compliant Solid Web Push Service should (and hopefully will be) part of the discussion of the [Notification Panel](https://github.com/solid/notifications-panel/).

### Service Profile
My [Solid PWA]() relies on the service profile to learn the necessary information for subscription.
The service MUST be of type `as:Service` and MUST have the properties of `ldp:inbox` and `push:vapidPublicKey`.
An example can be found [here](./model/service$.ttl).  

### Subscription
This Service expects a Subscription to be of type `as:Follow` and to have the properties of `as:object`, `push:endpoint` and `push:keys` which has `push:p256dh` and `push:auth` properties.
An example for the subscription can be found [here](./model/service$.ttl).

If this service was really part of the Solid Pod Server, the server receiving the subscription MUST add the sending agent (authenticated via SOLID-OICD) as `as:actor` (overwriting any other object of this predicate). 
With this, the Solid Push Service is able to check the ACL of the subscribed to resource if the agent is (still) authorized to access that resource.

### Unsubscription
With Web Push, clients to not need to actively unsubscribe from a service.
They just unsubscribe from their subscription at the browsers messaging service.

At the moment I am not sure, how stalling subscriptions are handled.
Thus I included an Unsubscription to my demo, to facilitate housekeeping.

This unsusbscription is of type `as:Undo` with its object having the exact same properties as the `as:Follow` subscription, the agent would like to undo or cancel.
It does not matter if the subscription is identified with its URI as the agent cannot be sure that this resource is still existing or if the service as processed and deleted the subscription resource.

## Installation
```
npm install
```

## .env
The web push service uses `VAPID`` which is configured using the `.env` file. 
You need to generate these VAPID keys first.
Take a look at the [.env.example](./.env.example).

```ts
import webpush from "web-push"; 
// only once
let vapidKeys = webpush.generateVAPIDKeys();
console.log(vapidKeys);
```

## Run
```
npx ts--node src/index.ts
```

