import webpush from "web-push";
import { SolidSub } from "./solidSub";

export interface WebPushSubscription {
  endpoint: string;
  expirationTime: number;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const areEqual = (a: WebPushSubscription, b: WebPushSubscription) => {
  if (!(a.endpoint === b.endpoint)) return false;
  if (!(a.expirationTime === b.expirationTime)) return false;
  if (!(a.keys.auth === b.keys.auth)) return false;
  if (!(a.keys.p256dh === b.keys.p256dh)) return false;
  return true;
};

export const notifySubscribersForResource = (
  uri: string,
  subscriptions: Map<string, SolidSub[]>,
) => {
  subscriptions.get(uri).map((solidSub) =>
    webpush.sendNotification(solidSub.sub, `Resource was updated:\n${uri}`)
      .catch(e /*WebPushError*/ => {
        console.error("### ERR ("+ e.statusCode+")\t| Send notification to:"); // e.endpoint
        console.error([e.endpoint]);
        // TODO delete these solidSubs ...
      })

  );
};
