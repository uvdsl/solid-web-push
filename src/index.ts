import "dotenv/config";
import webpush from "web-push";
import { w3cwebsocket as WebSocket } from "websocket";
import { SolidSub, updateSubsAndCons } from "./solidSub";
import { SolidNodeClient } from "solid-node-client";

async function main() {
  // set on init
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log("VAPID");

  const inbox = process.env.SOLID_WP_INBOX;
  console.log("INBOX");
  console.log(inbox);

  const client = new SolidNodeClient();
  const session = await client.login({
    idp: process.env.SOLID_IDP,
    username: process.env.SOLID_USERNAME,
    password: process.env.SOLID_PASSWORD,
  });

  console.log("SOLID");
  console.log({
    idp: process.env.SOLID_IDP,
    username: process.env.SOLID_USERNAME,
  });
  console.log("LoggedIn:",session.isLoggedIn);

  const subscriptions: Map<string, SolidSub[]> = new Map();
  const connections: Map<string, WebSocket> = new Map();

  const _uri = new URL(inbox);
  _uri.protocol = "wss";
  const ws = new WebSocket(_uri.href, ["solid-0.1"]);

  ws.onopen = async () => {
    await updateSubsAndCons(client, inbox, subscriptions, connections);
    ws.send(`sub ${inbox}`);
    console.log(subscriptions)
    console.log(connections)
  };

  ws.onmessage = async (msg) => {
    if (msg.data && msg.data.slice(0, 3) === "pub") {
      // resource updated, dispatch event for web push
      console.log("### INBOX\t| PUB\n" + msg.data.toString().substring(4));
      await updateSubsAndCons(client, inbox, subscriptions, connections);
      console.log(subscriptions)
      console.log(connections)
    }
  };

  console.log("SUB");
  console.log(inbox);
}

main();
