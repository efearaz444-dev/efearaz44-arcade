// ============================================================================
// --- REALTIME FIREBASE MULTIPLAYER XOX MOTORU (KIRMIZILIKSIZ SÜRÜM) ---
// ============================================================================

// main.js'deki global değişkenleri ve fonksiyonları güvenli şekilde pencereden çekiyoruz
const getGlobal = (key, fallback = null) => window[key] !== undefined ? window[key] : fallback;

function initMulti() {
    if (typeof window.clearCanvas === "function") window.clearCanvas();
    const c = document.getElementById("gameCanvas");
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.font = "14px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Çevrimiçi bir odaya katılın veya kurun!", c.width/2, c.height/2);
}

// Global fonksiyona kaydedelim ki main.js çağırabilsin
window.initMulti = initMulti;

const database = window.database || (typeof firebase !== "undefined" ? firebase.database() : null);

let aktifOdaKod = null; let benimRolum = null; let mevcutSira = "X";
let xoxTahta = ["", "", "", "", "", "", "", "", ""];
let oyuncuX_Isim = "Bekleniyor..."; let oyuncuO_Isim = "Bekleniyor...";

const odaOlusturBtn = document.getElementById("btnCreateRoom");
const odayaKatilBtn = document.getElementById("btnJoinRoom"); 
const odaInput = document.getElementById("roomCodeInput");
const durumYazisi = document.getElementById("roomStatus");

if (odaOlusturBtn) {
    odaOlusturBtn.addEventListener("click", () => {
        if (!database) return alert("Firebase bağlantısı hazır değil!");
        
        // Kullanıcı giriş yaptıysa ismini al, yoksa "Oyuncu X" yaz
let aktifIsim = (auth && auth.currentUser) ? auth.currentUser.email.split('@')[0] : "Misafir";
        
        aktifOdaKod = Math.floor(1000 + Math.random() * 9000).toString(); 
        benimRolum = "X";
        oyuncuX_Isim = aktifIsim; 
        oyuncuO_Isim = "Bekleniyor...";
        
        if(odaInput) odaInput.value = aktifOdaKod;
        if(durumYazisi) durumYazisi.innerText = "Oda Kuruldu! Kod: " + aktifOdaKod + ". Arkadaşının girmesi bekleniyor...";
        
        const mPanel = document.getElementById("multiplayerPanel");
        if(mPanel) mPanel.classList.remove("hidden");
        
        window.activeGame = "multi";
        window.score = 0; if(document.getElementById("score")) document.getElementById("score").innerText = "0";

         database.ref('odalar/' + aktifOdaKod).set({ 
            tahta: ["", "", "", "", "", "", "", "", ""], 
            sira: "X", 
            misafirKatildi: false, 
            sonHamle: -1,
            // Giriş yapmamışsa veritabanına da "Misafir" olarak gitsin
            isimX: aktifIsim, 
            isimO: "Bekleniyor..."
        });
        odayiDizle(aktifOdaKod);
    });
}

if (odayaKatilBtn) {
    odayaKatilBtn.addEventListener("click", () => {
        if (!database) return alert("Firebase bağlantısı hazır değil!");
        if(!odaInput) return;
        const girilenKod = odaInput.value.trim(); 
        if (!girilenKod) return alert("Lütfen geçerli bir oda kodu gir iki gözümün çiçeği!");
        
        database.ref('odalar/' + girilenKod).once('value', (snapshot) => {
            if (snapshot.exists()) {
                aktifOdaKod = girilenKod; 
                benimRolum = "O";
                // --- İŞTE DEĞİŞİKLİK BURADA ---
                oyuncuO_Isim = (auth.currentUser) ? auth.currentUser.email.split('@')[0] : "Oyuncu O"; // currentUser değişkenini direkt kullanıyoruz
                
                window.activeGame = "multi";
                window.score = 0; if(document.getElementById("score")) document.getElementById("score").innerText = "0";
                
                const mPanel = document.getElementById("multiplayerPanel");
                if(mPanel) mPanel.classList.remove("hidden");
                
                document.querySelectorAll(".game-selector button").forEach(b => b.classList.remove("active"));
                const multiBtn = document.getElementById("selectMulti");
                if(multiBtn) multiBtn.classList.add("active");
                
                const welcomeTextEl = document.getElementById("welcomeText");
                if(welcomeTextEl) welcomeTextEl.innerText = "🌐 Multiplayer X-O-X Arenası";
                
                if (database && aktifOdaKod) {
                    database.ref('odalar/' + aktifOdaKod).update({ 
                        misafirKatildi: true,
                        isimO: oyuncuO_Isim // Buraya artık senin ismin gidiyor
                    }).then(() => {
                        if (typeof odayiDizle === "function") odayiDizle(aktifOdaKod);
                    }).catch(err => console.log("Veri güncellenemedi:", err));
                }
            } else { 
                alert("Böyle bir oda bulunamadı! Kodu kontrol et iki gözümün çiçeği."); 
            }
        });
    });
}

function odayiDizle(roomCode) {
    if (!database) return;
    database.ref('odalar/' + roomCode).off();
    database.ref('odalar/' + roomCode).on('value', (snapshot) => {
        const data = snapshot.val(); 
        if (!data) return;
        xoxTahta = data.tahta; 
        mevcutSira = data.sira;
        oyuncuX_Isim = data.isimX || "Oyuncu X";
        oyuncuO_Isim = data.isimO || "Oyuncu O";
        
        drawXOX();
        
        if (data.misafirKatildi && durumYazisi && roomCode === aktifOdaKod) { 
            // X veya O yerine kimin sırasıysa direkt onun ismini seçiyoruz
            let aktifOyuncuIsmi = (mevcutSira === "X") ? oyuncuX_Isim : oyuncuO_Isim;
            let siraMetni = (benimRolum === mevcutSira) ? 'SENİN SIRAN!' : 'RAKİBİN SIRASI...';
            
            durumYazisi.innerHTML = `
                <span style="color: #00b0ff; font-weight: bold;">${oyuncuX_Isim}</span> 
                <strong style="color: #fff">VS</strong> 
                <span style="color: #ff1744; font-weight: bold;">${oyuncuO_Isim}</span>
                <br><br>
                Sıra: <b style="color: #ffca28">${aktifOyuncuIsmi}</b> kullanıcısında. (${siraMetni})
            `; 
        }
        checkXOXWinner();
    });
}

function drawXOX() {
    if (typeof window.clearCanvas === "function") window.clearCanvas();
    const c = document.getElementById("gameCanvas");
    if (!c) return;
    const ctx = c.getContext("2d");
    
    ctx.strokeStyle = "#555"; ctx.lineWidth = 4;
    let ofs = 40; 
    for(let i=1; i<3; i++) {
        ctx.beginPath(); ctx.moveTo(i*133, ofs); ctx.lineTo(i*133, c.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, ofs + i*120); ctx.lineTo(c.width, ofs + i*120); ctx.stroke();
    }
    
// --- ÜST TARAFIN GÜVENLİ HALE GETİRİLMİŞ SÜRÜMÜ ---
    const cEl = document.getElementById("gameCanvas");
    const canWidth = cEl ? cEl.width : 400; 
    
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.fillRect(0, 0, canWidth, ofs);
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "left"; ctx.fillStyle = "#00b0ff"; ctx.fillText("  " + oyuncuX_Isim + " (X)", 10, ofs/2 + 4);
    ctx.textAlign = "right"; ctx.fillStyle = "#ff1744"; ctx.fillText(oyuncuO_Isim + " (O)  ", canWidth - 10, ofs/2 + 4);
    ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.fillText("VS", canWidth/2, ofs/2 + 4);

    // --- TAŞLARIN ÇİZİMİ (KIRMIZILIKSIZ DÖNGÜ) ---
    const aktifTahta = (typeof xoxTahta !== "undefined" && Array.isArray(xoxTahta)) ? xoxTahta : ["", "", "", "", "", "", "", "", ""];
    
    aktifTahta.forEach((val, index) => {
        if(!val) return;
        let r = Math.floor(index / 3); 
        let cIndex = index % 3;
        let x = cIndex * 133 + 66; 
        let y = ofs + r * 120 + 60;
        
        ctx.font = "bold 45px Arial"; 
        ctx.fillStyle = val === "X" ? "#00b0ff" : "#ff1744";
        ctx.textAlign = "center"; 
        ctx.textBaseline = "middle"; 
        ctx.fillText(val, x, y);
    });
}

function hamleGonder(index) {
    if (!database || !aktifOdaKod || mevcutSira !== benimRolum || xoxTahta[index] !== "") return;
    xoxTahta[index] = benimRolum;
    if (typeof window.playSound === "function") window.playSound("dink");
    const sonrakiSira = (benimRolum === "X") ? "O" : "X";
    database.ref('odalar/' + aktifOdaKod).update({ tahta: xoxTahta, sira: sonrakiSira, sonHamle: index });
}

function checkXOXWinner() {
    let wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let w of wins) {
        if(xoxTahta[w[0]] && xoxTahta[w[0]] === xoxTahta[w[1]] && xoxTahta[w[0]] === xoxTahta[w[2]]) {
            // Kazanan harfe göre direkt ismi çekiyoruz
            let kazananIsim = xoxTahta[w[0]] === "X" ? oyuncuX_Isim : oyuncuO_Isim;
            
            alert("👑 Oyun Bitti! Kazanan: " + kazananIsim);
            
            if(xoxTahta[w[0]] === benimRolum && typeof window.addGold === "function") window.addGold(100);
            if(durumYazisi) durumYazisi.innerText = "Oyun bitti! Kazanan: " + kazananIsim + ". Yeni oda açabilirsiniz.";
            if (database) database.ref('odalar/' + aktifOdaKod).off();
            aktifOdaKod = null;
            return true;
        }
    }
    if(xoxTahta.filter(v => v === "").length === 0 && aktifOdaKod !== null) {
        alert("🤝 Yenişemediniz, Berabere!");
        if(durumYazisi) durumYazisi.innerText = "Berabere bitti! Yeni oda açabilirsiniz.";
        if (database) database.ref('odalar/' + aktifOdaKod).off();
        aktifOdaKod = null;
        return true;
    }
    return false;
}

const canvasEl = document.getElementById("gameCanvas");
if (canvasEl) {
    const handleXOXClick = (clientX, clientY) => {
        if(getGlobal("activeGame") === "multi") {
            let rect = canvasEl.getBoundingClientRect();
            // Ölçeklendirme hesabı (mobilde ekran boyutu farklı olabildiği için)
            let scaleX = canvasEl.width / rect.width;
            let scaleY = canvasEl.height / rect.height;
            let x = (clientX - rect.left) * scaleX;
            let y = (clientY - rect.top) * scaleY;
            
            let ofs = 40;
            if (y < ofs) return; 
            let c = Math.floor(x / (canvasEl.width / 3)); 
            let r = Math.floor((y - ofs) / ((canvasEl.height - ofs) / 3)); 
            if(r > 2) r = 2; if(c > 2) c = 2;
            let index = r * 3 + c;
            if(index >= 0 && index <= 8) hamleGonder(index);
        }
    };

    // Mouse için
    canvasEl.addEventListener("click", e => handleXOXClick(e.clientX, e.clientY));
    
    // Mobil için (İşte eksik olan parça burası)
    canvasEl.addEventListener("touchstart", e => {
        e.preventDefault();
        handleXOXClick(e.touches[0].clientX, e.touches[0].clientY);
    }, {passive: false});
}