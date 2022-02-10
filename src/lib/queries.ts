import { Store } from "n3";
import { SolidSub } from "../solidSub";
import { WebPushSubscription } from "../webPush";
import { AS, PUSH, RDF } from "./namespaces";

export const getFollowSubs = (store: Store) => {
  const follows = store.getSubjects(RDF("type"), AS("Follow"), null);
  const subs = follows.map((follow) => {
    // check if it is object of an UNDO
    const undo = store.getSubjects(follow, AS("object"), null);
    if (undo.length > 0) return undefined;
    // else get the sub
    try {
      const object = store.getObjects(follow, AS("object"), null)[0].value;
      const endpoint = store.getObjects(follow, PUSH("endpoint"), null)[0]
        .value;
      const keys = store.getObjects(follow, PUSH("keys"), null)[0];
      const auth = store.getObjects(keys, PUSH("auth"), null)[0].value;
      const p256dh = store.getObjects(keys, PUSH("p256dh"), null)[0].value;
      return {
        object,
        sub: {
          endpoint,
          expirationTime: null,
          keys: { auth, p256dh },
        } as WebPushSubscription,
      } as SolidSub;
    } catch (err) {
      return undefined;
    }
  });
  return subs.filter((e) => e !== undefined);
};

export const getUndoSubs = (store: Store) => {
  const undos = store.getSubjects(RDF("type"), AS("Undo"), null);
  const undosubs = undos.map((undo) => {
    const follows = store.getObjects(undo, AS("object"), null);
    const undosubs = follows.map((follow) => {
      try {
        const object = store.getObjects(follow, AS("object"), null)[0].value;
        const endpoint = store.getObjects(follow, PUSH("endpoint"), null)[0]
          .value;
        const keys = store.getObjects(follow, PUSH("keys"), null)[0];
        const auth = store.getObjects(keys, PUSH("auth"), null)[0].value;
        const p256dh = store.getObjects(keys, PUSH("p256dh"), null)[0].value;
        return {
          object,
          sub: {
            endpoint,
            expirationTime: null,
            keys: { auth, p256dh },
          } as WebPushSubscription,
        } as SolidSub;
      } catch (err) {
        return undefined;
      }
    });
    return undosubs;
  });
  return undosubs.flat().filter((e) => e !== undefined);
};
