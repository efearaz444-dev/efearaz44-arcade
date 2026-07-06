// ============================================================================
// --- REALTIME FIREBASE MULTIPLAYER XOX MOTORU (İSİM DESTEKLİ) ---
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
let oyuncuX_Isim = "Bekleniyor..."; let oyuncuO_Isim = "Bekleniyor...";

const odaOlusturBtn = document.getElementById("btnCreateRoom");
const odayaKatilBtn = document.getElementById("btnJoinRoom"); 
const odaInput = document.getElementById("roomCodeInput");
const durumYazisi = document.getElementById("roomStatus");

if (odaOlusturBtn) {
    odaOlusturBtn.addEventListener("click", () => {
        aktifOdaKod = Math.floor(1000 + Math.random() * 9000).toString(); 
        benimRolum = "X";
        oyuncuX_Isim = currentPlayer || "Oyuncu X"; // main.js'deki ismi alıyoruz
        oyuncuO_Isim = "Bekleniyor...";
        
        if(odaInput) odaInput.value = aktifOdaKod;
        if(durumYazisi) durumYazisi.innerText = "Oda Kuruldu! Kod: " + aktifOdaKod + ". Arkadaşının girmesi bekleniyor...";
        
        if(mPanel) mPanel.classList.remove("hidden");
        activeGame = "multi";
        score = 0; if(document.getElementById("score")) document.getElementById("score").innerText = score;

        database.ref('odalar/' + aktifOdaKod).set({ 
            tahta: ["", "", "", "", "", "", "", "", ""], 
            sira: "X", 
            misafirKatildi: false, 
            sonHamle: -1,
            isimX: oyuncuX_Isim,
            isimO: oyuncuO_Isim
        });
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
                oyuncuO_Isim = currentPlayer || "Oyuncu O";
                
                activeGame = "multi";
                score = 0; if(document.getElementById("score")) document.getElementById("score").innerText = score;
                if(mPanel) mPanel.classList.remove("hidden");
                
                document.querySelectorAll(".game-selector button").forEach(b => b.classList.remove("active"));
                const multiBtn = document.getElementById("selectMulti");
                if(multiBtn) multiBtn.classList.add("active");
                
                if(welcomeText) welcomeText.innerText = "🌐 Multiplayer X-O-X Arenası";
                
                // Kendi ismimizi Firebase'e yazıp odaya dahil oluyoruz
                database.ref('odalar/' + aktifOdaKod).update({ 
                    misafirKatildi: true,
                    isimO: oyuncuO_Isim
                });
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
        oyuncuX_Isim = data.isimX || "Oyuncu X";
        oyuncuO_Isim = data.isimO || "Oyuncu O";
        
        drawXOX();
        
        if (data.misafirKatildi && durumYazisi && roomCode === aktifOdaKod) { 
            let siraMetni = (benimRolum === mevcutSira) ? 'SENİN SIRAN' : 'RAKİBİN SIRASI';
            durumYazisi.innerHTML = `<span style="color: #00b0ff">${oyuncuX_Isim} (X)</span> <strong style="color: #fff">VS</strong> <span style="color: #ff1744">${oyuncuO_Isim} (O)</span><br><br>Sıra: <b>${mevcutSira}</b> oyuncusunda. (${siraMetni})`; 
        }
        checkXOXWinner();
    });
}

function drawXOX() {
    clearCanvas(); ctx.strokeStyle = "#555"; ctx.lineWidth = 4;
    
    // XOX Çizgileri (Üstte isim alanı bırakmak için biraz aşağı kaydırdık)
    let ofs = 40; // Ofset kayması
    for(let i=1; i<3; i++) {
        ctx.beginPath(); ctx.moveTo(i*133, ofs); ctx.lineTo(i*133, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, ofs + i*120); ctx.lineTo(canvas.width, ofs + i*120); ctx.stroke();
    }
    
    // Tepedeki Janti Canlı Skor/İsim Tablosu (Canvas İçi)
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.fillRect(0, 0, canvas.width, ofs);
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "left"; ctx.fillStyle = "#00b0ff"; ctx.fillText("  " + oyuncuX_Isim + " (X)", 10, ofs/2 + 4);
    ctx.textAlign = "right"; ctx.fillStyle = "#ff1744"; ctx.fillText(oyuncuO_Isim + " (O)  ", canvas.width - 10, ofs/2 + 4);
    ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.fillText("VS", canvas.width/2, ofs/2 + 4);

    // Taşların Çizimi
    xoxTahta.forEach((val, index) => {
        if(!val) return;
        let r = Math.floor(index / 3); let c = index % 3;
        let x = c * 133 + 66; 
        let y = ofs + r * 120 + 60;
        ctx.font = "bold 45px Arial"; ctx.fillStyle = val === "X" ? "#00b0ff" : "#ff1744";
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
            let kazananIsim = xoxTahta[w[0]] === "X" ? oyuncuX_Isim : oyuncuO_Isim;
            alert("Oyun Bitti! Kazanan Muazzam Oyuncu: " + kazananIsim);
            if(xoxTahta[w[0]] === benimRolum) addGold(100);
            if(durumYazisi) durumYazisi.innerText = "Oyun bitti! Yeni oda açabilirsiniz.";
            database.ref('odalar/' + aktifOdaKod).off();
            aktifOdaKod = null;
            return true;
        }
    }
    if(xoxTahta.filter(v => v === "").length === 0 && aktifOdaKod !== null) {
        alert("Yenişemediniz, Berabere!");
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
        let ofs = 40;
        if (y < ofs) return; // İsim alanına tıklayınca hamle yapmasın
        let c = Math.floor(x / 133); 
        let r = Math.floor((y - ofs) / 120); 
        if(r > 2) r = 2; if(c > 2) c = 2;
        let index = r * 3 + c;
        if(index >= 0 && index <= 8) hamleGonder(index);
    }
});