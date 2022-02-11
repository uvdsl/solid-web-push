// only once
import webpush from "web-push"; 
let vapidKeys = webpush.generateVAPIDKeys();
console.log(vapidKeys);