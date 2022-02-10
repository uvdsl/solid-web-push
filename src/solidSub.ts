import { Store } from "n3";
import { LDP } from "./lib/namespaces";
import { parseToN3 } from "./lib/parse";
import { getFollowSubs, getUndoSubs } from "./lib/queries";
import { SolidNodeClient } from "solid-node-client";
import {
  areEqual,
  notifySubscribersForResource,
  WebPushSubscription,
} from "./webPush";
import { w3cwebsocket as WebSocket } from "websocket";

export interface SolidSub {
  object: string;
  sub: WebPushSubscription;
}

const createWebSocketSub = async (uri: string) => {
  const _uri = new URL(uri);
  _uri.protocol = "wss";
  const ws = new WebSocket(_uri.href, ["solid-0.1"]);
  ws.onopen = () => ws.send(`sub ${uri}`);
  return ws;
};

// does work because no authentication required atm, flawed but works atm :)
// polling would require to get client credentials => not a good idea atm.

const addSubscriptions = (
  subs: Map<string, SolidSub[]>,
  follows: SolidSub[]
) => {
  follows.forEach((follow) => {
    // look at the object of the follow and
    // check if some element of existing subs is equal to the current one
    const existing = subs.get(follow.object);
    if (!existing) {
      subs.set(follow.object, []);
    }
    if (subs.get(follow.object).some((e) => areEqual(e.sub, follow.sub)))
      return;
    // if not, then the current one is new, add
    subs.get(follow.object).push(follow);
  });
};

const removeSubscriptions = (
  subs: Map<string, SolidSub[]>,
  undos: SolidSub[]
) => {
  undos.forEach((undo) => {
    // look at the object of the follow and
    // filter the elements of existing subs that are equal to the current one
    const filtered = subs
      .get(undo.object)
      .filter((e) => !areEqual(e.sub, undo.sub));
    // set the filtered as the new
    subs.set(undo.object, filtered);
    if (filtered.length == 0) subs.delete(undo.object);
  });
};

const updateConnections = async (
  cons: Map<string, WebSocket>,
  subs: Map<string, SolidSub[]>
) => {
  // close unused ones
  for (const [cURI, ws] of cons.entries()) {
    if (subs.has(cURI)) return;
    ws.close();
    cons.delete(cURI);
  }
  // open new ones
  for (const [sURI, ssub] of subs.entries()) {
    if (cons.has(sURI)) return;
    const ws = await createWebSocketSub(sURI);
    ws.onmessage = (msg) => {
      if (msg.data && msg.data.slice(0, 3) === "pub") {
        // resource updated, dispatch event for web push
        console.log("### SUB  \t| PUB\n" + msg.data.toString().substring(4));
        notifySubscribersForResource(msg.data.toString().substring(4), subs);
      }
    };
    cons.set(sURI, ws);
  }
};

export const updateSubsAndCons = async (
  client: SolidNodeClient,
  inboxURI: string,
  subscriptions: Map<string, SolidSub[]>,
  connections: Map<string, WebSocket>
) => {
  console.log("Update");
  const store = new Store();
  // get all the subscription items
  const resp = await client.fetch(inboxURI, {
    headers: { Accept: "text/turtle" },
  });
  const txt = await resp.text();
  const { store: inboxStore } = await parseToN3(txt, inboxURI);
  const inboxItems = inboxStore
    .getObjects(inboxURI, LDP("contains"), null)
    .map((obj) => obj.value);
  // get current status of subs and undos
  const subStorePromises = inboxItems.map((itemURI) =>
    client
      .fetch(itemURI, { headers: { Accept: "text/turtle" } })
      .then((resp) => resp.text())
      .then((txt) => parseToN3(txt, itemURI))
      .catch(() => {
        return { store: new Store() };
      })
      .then((parsedN3) => parsedN3.store)
      .then((pstore) => store.addQuads(pstore.getQuads(null, null, null, null)))
  );
  await Promise.all(subStorePromises);
  // get from RDF
  const follows = getFollowSubs(store);
  const undos = getUndoSubs(store);
  console.log(undos)
  // add new subs
  addSubscriptions(subscriptions, follows);
  // undo any subs
  removeSubscriptions(subscriptions, undos);
  // check connections
  await updateConnections(connections, subscriptions);
};
