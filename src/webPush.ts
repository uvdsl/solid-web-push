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
    subscriptions[uri].map((sub) =>
    webpush.sendNotification(sub, `Resource was updated:\n${uri}`)
  );
};
