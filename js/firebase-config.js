// Firebase Yapılandırma Bilgileri (Sadece Ayarlar Kalacak)
const firebaseConfig = {
    apiKey: "AIzaSyAMkf1fwDYYyjRmeNT5s28RwUyF3dQrsA4",
    authDomain: "efearaz44-arcade.firebaseapp.com",
    databaseURL: "https://efearaz44-arcade-default-rtdb.firebaseio.com",
    projectId: "efearaz44-arcade",
    storageBucket: "efearaz44-arcade.firebasestorage.app",
    messagingSenderId: "487940692682",
    appId: "1:487940692682:web:f2e34153ff9763288ff233",
    measurementId: "G-LQKP79GEVM"
};

// Firebase başlatma
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Nesneleri hemen global yap
window.auth = firebase.auth();
window.database = firebase.database();