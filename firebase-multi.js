// ============================================================================
// --- REALTIME FIREBASE MULTIPLAYER XOX MOTORU ---
// ============================================================================
function initMulti() {
    clearCanvas(); ctx.fillStyle = "#fff"; ctx.font = "14px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Çevrimiçi bir odaya katılın veya kurun!", canvas.width/2, canvas.height/2);
}

const firebaseConfig = { databaseURL: "https://xox-multiplayer-test-default-rtdb.firebaseio.com/" };
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const database = firebase.database();

let aktifOdaKod = null; let benimRolum = null; let mevcutSira = "X";
let xoxTahta = ["", "", "", "", "", "", "", "", ""];

const odaOlusturBtn = document.getElementById("btnCreateRoom");
const odayaKatilBtn = document.getElementById("btnJoinRoom"); 
const odaInput = document.getElementById("roomCodeInput");
const durumYazisi = document.getElementById("roomStatus");

if (odaOlusturBtn) {
    odaOlusturBtn.addEventListener("click", () => {
        aktifOdaKod = Math.floor(1000 + Math.random() * 9000).toString(); benimRolum = "X";
        if(odaInput) odaInput.value = aktifOdaKod;
        if(durumYazisi) durumYazisi.innerText = "Oda Kuruldu! Kod: " + aktifOdaKod + ". Arkadaşının girmesi bekleniyor...";
        database.ref('odalar/' + aktifOdaKod).set({ tahta: ["", "", "", "", "", "", "", "", ""], sira: "X", misafirKatildi: false, sonHamle: -1 });
        odayiDizle(aktifOdaKod);
    });
}

if (odayaKatilBtn) {
    odayaKatilBtn.addEventListener("click", () => {
        if(!odaInput) return;
        const girilenKod = odaInput.value.trim(); 
        if (!girilenKod) return alert("Lütfen geçerli bir oda kodu gir iki gözümün çiçeği!");
        
        database.ref('odalar/' + girilenKod).once('value', (snapshot) => {
            if (snapshot.exists()) {
                aktifOdaKod = girilenKod; 
                benimRolum = "O";
                
                // --- PANEL GEÇİŞİ VE EKRAN GÜNCELLEME DESTEĞİ ---
                if (typeof switchGame === "function") {
                    switchGame("multi"); 
                } else {
                    if (mPanel) mPanel.classList.remove("hidden");
                    activeGame = "multi";
                }
                
                if(durumYazisi) durumYazisi.innerText = "Odaya Bağlanıldı! Kod: " + aktifOdaKod + ". Sıra X'te.";
                database.ref('odalar/' + aktifOdaKod).update({ misafirKatildi: true });
                odayiDizle(aktifOdaKod);
            } else { 
                alert("Böyle bir oda bulunamadı! Kodu kontrol et iki gözümün çiçeği."); 
            }
        });
    });
}

function odayiDizle(roomCode) {
    database.ref('odalar/' + roomCode).on('value', (snapshot) => {
        const data = snapshot.val(); 
        if (!data) return;
        xoxTahta = data.tahta; 
        mevcutSira = data.sira;
        drawXOX();
        checkXOXWinner();
        if(data.misafirKatildi && durumYazisi && roomCode === aktifOdaKod) { 
            let siraMetni = (benimRolum === mevcutSira) ? 'SENİN SIRAN' : 'RAKİBİN SIRASI';
            durumYazisi.innerText = "Düello Başladı! Sıra: " + mevcutSira + " oyuncusunda. (" + siraMetni + ")"; 
        }
    });
}

function drawXOX() {
    clearCanvas(); ctx.strokeStyle = "#555"; ctx.lineWidth = 4;
    for(let i=1; i<3; i++) {
        ctx.beginPath(); ctx.moveTo(i*133, 0); ctx.lineTo(i*133, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i*133); ctx.lineTo(canvas.width, i*133); ctx.stroke();
    }
    xoxTahta.forEach((val, index) => {
        if(!val) return;
        let r = Math.floor(index / 3); let c = index % 3;
        let x = c * 133 + 66; let y = r * 133 + 66;
        ctx.font = "bold 50px Arial"; ctx.fillStyle = val === "X" ? "#00b0ff" : "#ff1744";
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(val, x, y);
    });
}

function hamleGonder(index) {
    if (!aktifOdaKod || mevcutSira !== benimRolum || xoxTahta[index] !== "") return;
    xoxTahta[index] = benimRolum;
    playSound("dink");
    const sonrakiSira = (benimRolum === "X") ? "O" : "X";
    database.ref('odalar/' + aktifOdaKod).update({ tahta: xoxTahta, sira: sonrakiSira, sonHamle: index });
}

function checkXOXWinner() {
    let wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let w of wins) {
        if(xoxTahta[w[0]] && xoxTahta[w[0]] === xoxTahta[w[1]] && xoxTahta[w[0]] === xoxTahta[w[2]]) {
            alert("Oyun Bitti! Kazanan: " + xoxTahta[w[0]]);
            if(xoxTahta[w[0]] === benimRolum) addGold(100);
            if(durumYazisi) durumYazisi.innerText = "Oyun bitti! Yeni oda açabilirsiniz.";
            database.ref('odalar/' + aktifOdaKod).off();
            aktifOdaKod = null;
            return true;
        }
    }
    if(xoxTahta.filter(v => v === "").length === 0 && aktifOdaKod !== null) {
        alert("Berabere!");
        if(durumYazisi) durumYazisi.innerText = "Berabere bitti! Yeni oda açabilirsiniz.";
        database.ref('odalar/' + aktifOdaKod).off();
        aktifOdaKod = null;
        return true;
    }
    return false;
}

canvas.addEventListener("click", e => {
    if(activeGame === "multi") {
        let rect = canvas.getBoundingClientRect();
        let x = e.clientX - rect.left; let y = e.clientY - rect.top;
        let c = Math.floor(x / 133); let r = Math.floor(y / 133); let index = r * 3 + c;
        hamleGonder(index);
    }
});