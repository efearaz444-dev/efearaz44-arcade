// js/firebase-config.js
const firebaseConfig = { databaseURL: "https://ucretsiz-oyun-sitem-default-rtdb.firebaseio.com/" };
if (typeof firebase !== "undefined" && !firebase.apps.length) { 
    firebase.initializeApp(firebaseConfig); 
}
window.database = typeof firebase !== "undefined" ? firebase.database() : null;
window.auth = typeof firebase !== "undefined" ? firebase.auth() : null;

// Kayıt ve Giriş Fonksiyonu
async function girisYapVeyaKaydol() {
    const user = document.getElementById("usernameInput").value;
    const pass = document.getElementById("passwordInput").value;
    if (!user || !pass) return alert("Lütfen boş alan bırakma!");
    
    // Sahte e-posta hilesi
    const email = user.toLowerCase().replace(/\s/g, '') + "@arcadesalonu.com";
    
    try {
        await auth.signInWithEmailAndPassword(email, pass);
        location.reload();
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            await auth.createUserWithEmailAndPassword(email, pass);
            alert("Yeni hesap oluşturuldu!");
            location.reload();
        } else {
            alert("Hata: " + error.message);
        }
    }
}

// Google ile Giriş
function googleIleGiris() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then(() => location.reload());
}