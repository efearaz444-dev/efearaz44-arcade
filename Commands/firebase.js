const firebaseConfig = { databaseURL: "https://xox-multiplayer-test-default-rtdb.firebaseio.com/" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const database = firebase.database();

function hamleGonder(index) {
    if (!aktifOdaKod || mevcutSira !== benimRolum || xoxTahta[index] !== "") return;
    xoxTahta[index] = benimRolum;
    database.ref('odalar/' + aktifOdaKod).update({ tahta: xoxTahta, sira: (benimRolum === "X" ? "O" : "X") });
}

function odayiDizle(roomCode) {
    database.ref('odalar/' + roomCode).on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        xoxTahta = data.tahta; mevcutSira = data.sira;
        drawXOX();
    });
}