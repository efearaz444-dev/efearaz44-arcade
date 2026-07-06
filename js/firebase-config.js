// Firebase Yapılandırma Bilgileri (Sadece Ayarlar Kalacak)
const firebaseConfig = {
    apiKey: "AIzaSyAo0_FoG-yasmF9tAOyH1BfRJWhs4DYSZs",
    authDomain: "ucretsiz-oyun-sitem.firebaseapp.com",
    databaseURL: "https://ucretsiz-oyun-sitem-default-rtdb.firebaseio.com",
    projectId: "ucretsiz-oyun-sitem",
    storageBucket: "ucretsiz-oyun-sitem.firebasestorage.app",
    messagingSenderId: "602558212782",
    appId: "1:602558212782:web:4dcdfeb0ebb914cdc0db3f",
    measurementId: "G-YVYQ50PQ11"
};

// Firebase'i başlatıyoruz
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Global olarak auth ve database nesnelerini tanımlıyoruz
window.auth = typeof firebase !== 'undefined' ? firebase.auth() : null;
window.database = typeof firebase !== 'undefined' ? firebase.database() : null;