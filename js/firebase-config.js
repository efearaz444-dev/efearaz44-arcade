// js/firebase-config.js
const firebaseConfig = { databaseURL: "https://ucretsiz-oyun-sitem-default-rtdb.firebaseio.com/" };
if (typeof firebase !== "undefined" && !firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
window.database = typeof firebase !== "undefined" ? firebase.database() : null;