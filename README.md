# Solid Web Push

This is a simple demo for Web Push Notifications for Solid PWAs.
This server-side script subscribes via WebSocket to the resource and passes any notification on that resource from the server to the Solid PWA via Web Push.

To experience Solid Web Push Notifications, see this [live demo] of a Solid PWA and visit the corresponding [code repository]().

## How it works.
Basically, this service is a server-side script that lives in or along side a Solid Pod Server (see more setup variants below).

An agent can find details of the service in its profile (e.g. my [example](./model/service$.ttl)) which may be advertised by resources the agent wants to receive updates on.
The agent learns the `VAPID Public Key` of the service and its `inbox` from the profile.
The public key is needed for the  _Voluntary Application Server Identification_ as defined [here](https://datatracker.ietf.org/doc/html/draft-ietf-webpush-vapid-01).
The inbox is the resource the agent may post its subscription to.  

This subscription contains all the details necessary for the regular Web Push Subscription, i.e. an `endpoint` and `keys` for authentifcation and encrpytion.
In addition, the agent specifies the `object` of the subscription, i.e. the resource for which updates should be received.  

The service receives the new subscription from the agent and listens for updates on that resource as an intermediary for the client.
When the resource is updated, the service forwards the notification via Web Push to the client.



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


## Setup Variants

At the moment, websocket notifications work without authentication and authorization (at least for NSS). 
This is why this demo of a Solid Web Push works under the hood with websockets.
It is not the point of this demo to provide a full fletched solution, but rather to demonstrate the usefullness of Web Push on Solid Servers.
Details on how to properly design and implement a spec-compliant Solid Web Push Service should (and hopefully will be) part of the discussion of the [Notification Panel](https://github.com/solid/notifications-panel/).

With the current state of the spec and thus this project, I see three setup variants:

### (1) The standalone Web Push
Each appclication is responsible to manage Web Push Notifications on its own.
In fact, an application can _always_ choose to implement its own Web Push service.
An applicatoin _does not need_ to rely on a Web Push Service offered by a Pod.

With this project, you can configure the agent of the web push service as you like, e.g. run it locally at your Pod and give it access to your Pod.
Then, this would be your personal Web Push Service, or, if you are an app developer, the Web Push service you could use for your app.
Since the current state of Solid Websocket subscriptions allow to receive notifcations on any pod-stored resource, you do not need to worry about implementing authorization!
But this will be an issue when the issues are resolved and authentication/authorization is needed to receive notifications.
You will need to handle some oauth token or whatever.
This variant allows an agent to receive push messages for any resource directly from one Web Push service.

### (2) The pod-based Web Push
A Pod could offer a Web Push service for any resource, similar to the standalone Web Push service.
In this case, authorization and authentication need to be handled carefully (especially for resources outside of the Pod's control).
This variant allows an agent to receive push messages for any resource directly from one Web Push service.

### (3) The pod-scoped Web Push
Each pod offers a Web Push service for resources stored on it.
The Pod is able to handle authentication and authorization for subscribed to resources as the Pod can simply check the ACLs:
The first check for authorizatoin is carried out when the subscription is posted by the subscriber.
Additional checks are carried out, whenever the resource is updated.
When the subscriber does not have any rights on the resource, she will receive no notifications (anymore).
This variant allows an agent to receive push messages for resource that are stored on the same Pod or Pod server (!) where the Web Push service is provided.
To receive notifications from other Pods or Pod servers, the client can arrange (e.g.) to receive [Linked Data Notifications](https://solid.github.io/notifications/protocol#linkeddatanotificationssubscription2021) to a particular (sub-)inbox on her Pod.
Then the client can set up a Web Push subscription at her Pod for that (sub-)inbox to receive the forwarded LDNs as Web Push Notifications.

### This Project's Recommended Setup?
With the current behaviour of Solid's Websocket Subscriptions, it depends on who you are!
If you are an application developer longing to simply integrate Web Push in your PWA, you choose variant (1).
If you are a person managing a Pod Server, then you can use variant (1) to mimic variant (2) without effort or variant (3) by restricting subscriptions to resources on your Pod Server.

As the Solid Notifications Spec matures, this may change :)

### Additional Comments
General:
- _I do not want to take anything away from the currently proposed Solid Notification Spec!_
- I would like to build upon the currently proposed Spec.
- I would like to add a direct Pod-to-Client Notification via Solid Web Push.  

Application Notifications:
- An application developer _does not need_ to use Solid Web Push. He can implemnt his own service.
- An application developer can rely on Solid Web Push to forward notifications that are sent via other Notification Schemes to the user's Pod.
- An application developer can set up an application-specific inbox that he can post notifications (sales,re-engagement,...) to, which will be forwarded to the client by Solid Web Push. 
    - So the UX is still up to the app developer.
    - It's easy: Set up app-inbox, subscribe to the app inbox, have Web Push Notifications, profit!
- A user _could_ be able to intercept those messages to only receive the ones she would like. For example, I hate those premium-sales-push-notifications but I like to get notified about new things. This would give the _user_ more fine-grained control.

Server-side Components
- Providing Web Push out-of-the-box with Solid Pods may facilitate development of client-side applications that do not rely on server-side components.
- Providing Web Push out-of-the-box with Solid Pods does not forbid to have server-side components. Instead, Web Push is already there to use via server-to-server (or Pod-to-Pod) notification schemes.

Potential Drawbacks
- Additional Load on the Pod Servers (but then again, this is for every notification scheme)
- Can you think of any? Let me know!
- ...
---

## Installation
```
npm install
```

## .env
The web push service uses `VAPID` which is configured using the `.env` file. 
You need to generate these VAPID keys first.
Take a look at the [.env.example](./.env.example).

```ts
// only once
import webpush from "web-push"; 
let vapidKeys = webpush.generateVAPIDKeys();
console.log(vapidKeys);
```

You also need to define the inbox of the service, i.e. where the clients post their Solid Web Push Subscriptions and Unsubscriptions to.

In addition, you need to provide the credentials of the Web Push service agent, e.g. a dedicated agent or you if you use it for your personal projects.
This agents needs access rights to the inbox and its content on the corresponding Solid Pod, of course.

## Run
```
npx ts--node src/index.ts
```

## Docker
Or use docker :)