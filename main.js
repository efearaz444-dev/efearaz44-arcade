// ============================================================================
// --- GLOBAL DEĞİŞKENLER & AYARLAR ---
// ============================================================================
let activeGame = "snake"; 
let score = 0;
let isGameRunning = false;
let isGameWaitingToStart = true;
let gameInterval = null;
let currentSkin = "classic";
let purchasedSkins = ["classic"];

// Ses efektleri yükleme kontrolü
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        if (type === "eat") {
            osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            osc.start(); osc.stop(audioCtx.currentTime + 0.08);
        } else if (type === "hit") {
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            osc.start(); osc.stop(audioCtx.currentTime + 0.2);
        } else if (type === "dink") {
            osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
            gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
            osc.start(); osc.stop(audioCtx.currentTime + 0.05);
        }
    } catch(e) {}
}
window.playSound = playSound;

// DOM Elemanları
const scoreElement = document.getElementById("score");
const startBtn = document.getElementById("startBtn");
const mobileStartBtn = document.getElementById("mobileStartBtn");
const welcomeText = document.getElementById("welcomeText");
const nameModal = document.getElementById("nameModal");
const mPanel = document.getElementById("multiplayerPanel");
const totalGoldEl = document.getElementById("totalGold");
const totalTimeDisplay = document.getElementById("totalTimeDisplay");

// ============================================================================
// --- FIREBASE AUTH & KULLANICI YÖNETİMİ (YENİ SİSTEM) ---
// ============================================================================

// Kullanıcı Giriş Durumunu İzle
auth.onAuthStateChanged((user) => {
    if (user) {
        // Kullanıcı giriş yaptıysa modalı kapat, arayüzü güncelle
        if (nameModal) nameModal.style.display = "none";
        const username = user.email.split('@')[0];
        if (welcomeText) welcomeText.innerText = `🎮 Hoş geldin, ${username}!`;
        
        // Kullanıcının mevcut verilerini (Altın, Süre ve Skorlar) veritabanından çek
        database.ref('users/' + user.uid).on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                if (totalGoldEl) totalGoldEl.innerText = data.gold || 0;
                if (totalTimeDisplay) totalTimeDisplay.innerText = (data.totalTime || 0) + "s";
                
                // En iyiler tablosundaki kendi skorlarını güncelle
                updateLeaderboardUI(data);
            }
        });
        
        // Genel Skor Tablosunu (Top 5) Yükle
        skorTablosunuGuncelle();
    } else {
        // Giriş yapılmadıysa modalı göster
        if (nameModal) nameModal.style.display = "flex";
    }
});

// ============================================================================
// --- FIREBASE GOOGLE & E-POSTA GİRİŞ SİSTEMİ (SORUNSUZ MOD) ---
// ============================================================================

window.googleIleGiris = () => {
    // window.auth nesnesinin yüklendiğinden emin oluyoruz
    if (!window.auth) return alert("Firebase henüz başlatılmadı, lütfen biraz bekle.");

    const provider = new firebase.auth.GoogleAuthProvider();
    window.auth.signInWithPopup(provider)
        .then(() => location.reload())
        .catch((error) => {
            if (error.code === 'auth/popup-blocked') {
                window.auth.signInWithRedirect(provider);
            } else {
                alert("Google Giriş Hatası: " + error.message);
            }
        });
};

window.girisYapVeyaKaydol = async () => {
    // Nesneleri global window üzerinden güvenli çekiyoruz
    const auth = window.auth;
    const database = window.database;
    
    if (!auth || !database) return alert("Firebase bağlantısı bekleniyor...");

    const emailInput = document.getElementById("usernameInput").value.trim();
    const passwordInput = document.getElementById("passwordInput").value.trim();

    if (!emailInput || !passwordInput) return alert("Kullanıcı adı ve şifre girmelisin!");

    const email = emailInput.includes("@") ? emailInput : `${emailInput}@arcade.com`;

    try {
        await auth.signInWithEmailAndPassword(email, passwordInput);
        location.reload();
    } catch (error) {
        // Yeni Firebase sürümlerinde hata kodları değişebiliyor, yakalamayı genişlettik
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, passwordInput);
                
                await database.ref('users/' + userCredential.user.uid).set({
                    username: emailInput,
                    gold: 0,
                    score: 0,
                    created_at: new Date().toISOString()
                });
                location.reload();
            } catch (kayitHata) {
                alert("Kayıt olunamadı: " + kayitHata.message);
            }
        } else {
            alert("Giriş Hatası: " + error.message);
        }
    }
};

// ============================================================================
// --- VERİTABANI YAZMA & OKUMA İŞLEMLERİ ---
// ============================================================================

// Skor Kaydetme Fonksiyonu (Tüm Oyunlar İçin Ortak)
function skorKaydet(oyunTuru, puan) {
    if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        const skorYolu = `${oyunTuru}_best`;
        
        // Önce mevcut rekoru kontrol et, yeni puan yüksekse güncelle
        database.ref(`users/${uid}/${skorYolu}`).once('value', (snapshot) => {
            const mevcutEnIyi = snapshot.val() || 0;
            if (puan > mevcutEnIyi) {
                const updateData = {};
                updateData[skorYolu] = puan;
                database.ref('users/' + uid).update(updateData);
            }
        });
    }
}

// Altın Ekleme Fonksiyonu
function addGold(amount) {
    if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        database.ref('users/' + uid + '/gold').transaction((currentGold) => {
            return (currentGold || 0) + amount;
        });
    }
}
window.addGold = addGold;

// Süre Sayacı Ekleme (Her saniye çalışır)
setInterval(() => {
    if (auth.currentUser && isGameRunning && !isGameWaitingToStart) {
        const uid = auth.currentUser.uid;
        database.ref('users/' + uid + '/totalTime').transaction((currentTime) => {
            return (currentTime || 0) + 1;
        });
    }
}, 1000);

// Yan Paneldeki Skor Durumlarını Güncelleme
function updateLeaderboardUI(data) {
    const games = ["snake", "brick", "space", "flappy", "pong", "blockblast"];
    games.forEach(game => {
        const el = document.getElementById(`${game}Best`);
        if (el) {
            el.innerText = (data[game + "_best"] || 0) + " Puan";
        }
    });
}

// Global Skor Tablosunu Güncelleme (En İyi 5 Kişi)
function skorTablosunuGuncelle() {
    database.ref('users').orderByChild("snake_best").limitToLast(5).on("value", (snapshot) => {
        let enYuksek = 0;
        snapshot.forEach((childSnapshot) => {
            let veri = childSnapshot.val();
            if (veri.snake_best && veri.snake_best > enYuksek) {
                enYuksek = veri.snake_best;
            }
        });
        const allTimeBestEl = document.getElementById("allTimeBest");
        if (allTimeBestEl) allTimeBestEl.innerText = enYuksek + " Puan";
    });
}

// ============================================================================
// --- OYUN MOTORU & KONTROLLER ---
// ============================================================================

function switchGame(g) {
    if(isGameRunning) gameOver(true); 
    activeGame = g; score = 0; if(scoreElement) scoreElement.innerText = score; if(mPanel) mPanel.classList.add("hidden");
    
    document.querySelectorAll(".game-selector button").forEach(b => b.classList.remove("active")); 
    let targetBtn = document.getElementById("select" + g.charAt(0).toUpperCase() + g.slice(1)) || document.getElementById("select" + g) || document.getElementById("select" + g.toLowerCase());
    if(targetBtn) targetBtn.classList.add("active");
    
    if (g === "snake") { if(welcomeText) welcomeText.innerText = "🐍 Klasik Yılan Oyunu"; initSnake(); }
    else if (g === "brick") { if(welcomeText) welcomeText.innerText = "🧱 Siber Tuğla Kırma"; initBrick(); }
    else if (g === "space") { if(welcomeText) welcomeText.innerText = "🚀 Neon Uzay Savaşı"; spaceWave = 1; initSpace(); }
    else if (g === "flappy") { if(welcomeText) welcomeText.innerText = "🛸 Neon Cyber Bird"; initFlappy(); }
    else if (g === "pong") { if(welcomeText) welcomeText.innerText = "🔴 Yapay Zekaya Karşı Pong"; initPong(); }
    else if (g === "multi") { if(welcomeText) welcomeText.innerText = "🌐 Multiplayer X-O-X Arenası"; if(mPanel) mPanel.classList.remove("hidden"); initMulti(); }
    else if (g === "blockblast") { if(welcomeText) welcomeText.innerText = "🟨 Neon Block Blast Arenası"; initBlockBlast(); }
    else if (g === "gartic") { if(welcomeText) welcomeText.innerText = "🎨 Neon Çizim (Gartic Modu)"; initGartic(); startActiveGame(); }
    else if (g === "dino") { if(welcomeText) welcomeText.innerText = "🦖 Neon Dino Run"; initDino(); }
    else if (g === "catch") { if(welcomeText) welcomeText.innerText = "🌟 Yıldız Avcısı"; initCatch(); }
}

function startActiveGame() {
    if (!auth.currentUser) {
        alert("Oyuna başlamak için önce giriş yapmalısın!");
        if (nameModal) nameModal.style.display = "flex";
        return;
    }
    
    score = 0; if(scoreElement) scoreElement.innerText = score; 
    isGameRunning = true; isGameWaitingToStart = true; 
    if(startBtn) startBtn.innerText = "Yeniden Başlat"; if(mobileStartBtn) mobileStartBtn.innerText = "Yeniden Başlat";
    
    if (activeGame === "snake") { initSnake(); isGameWaitingToStart = false; } 
    else if (activeGame === "brick") initBrick(); 
    else if (activeGame === "space") { spaceWave = 1; initSpace(); isGameWaitingToStart = false; } 
    else if (activeGame === "flappy") initFlappy(); 
    else if (activeGame === "pong") initPong();
    else if (activeGame === "blockblast") { initBlockBlast(); isGameWaitingToStart = false; }
    else if (activeGame === "gartic") { initGartic(); isGameWaitingToStart = false; }
    else if (activeGame === "dino") { initDino(); isGameWaitingToStart = false; }
    else if (activeGame === "catch") { initCatch(); isGameWaitingToStart = false; }

    clearInterval(gameInterval); 
    if(activeGame !== "blockblast" && activeGame !== "gartic") {
        gameInterval = setInterval(updateEngine, activeGame === "snake" ? 100 : 1000 / 60);
    } else {
        updateEngine();
    }
}

function gameOver(silent = false) {
    isGameRunning = false;
    clearInterval(gameInterval);
    if(!silent) {
        playSound("hit");
        alert("💥 Oyun Bitti! Skorun: " + score);
        
        // SKORU VE ALTINI GÜVENLİ ŞEKİLDE YENİ SİSTEME KAYDET
        skorKaydet(activeGame, score);
        let goldEarned = Math.floor(score / 5);
        if(goldEarned > 0) addGold(goldEarned);
    }
    if(startBtn) startBtn.innerText = "Oyunu Başlat";
    if(mobileStartBtn) mobileStartBtn.innerText = "🎮 OYUNU BAŞLAT / YENİDEN BAŞLAT";
}

// Buton Olay Dinleyicileri
if(startBtn) startBtn.addEventListener("click", startActiveGame);
if(mobileStartBtn) mobileStartBtn.addEventListener("click", startActiveGame);

document.getElementById("selectSnake")?.addEventListener("click", () => switchGame("snake"));
document.getElementById("selectBrick")?.addEventListener("click", () => switchGame("brick"));
document.getElementById("selectSpace")?.addEventListener("click", () => switchGame("space"));
document.getElementById("selectFlappy")?.addEventListener("click", () => switchGame("flappy"));
document.getElementById("selectPong")?.addEventListener("click", () => switchGame("pong"));
document.getElementById("selectMulti")?.addEventListener("click", () => switchGame("multi"));
document.getElementById("selectBlockblast")?.addEventListener("click", () => switchGame("blockblast"));
document.getElementById("selectGartic")?.addEventListener("click", () => switchGame("gartic"));
document.getElementById("selectDino")?.addEventListener("click", () => switchGame("dino"));
document.getElementById("selectCatch")?.addEventListener("click", () => switchGame("catch"));

// Tuval Temizleme (Dışarıdan erişim için pencereye bağlandı)
function clearCanvas() {
    const c = document.getElementById("gameCanvas");
    if(!c) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0,0,c.width,c.height);
}
window.clearCanvas = clearCanvas;

function updateEngine() {
    if (activeGame === "snake") updateSnake();
    else if (activeGame === "brick") updateBrick();
    else if (activeGame === "space") updateSpace();
    else if (activeGame === "flappy") updateFlappy();
    else if (activeGame === "pong") updatePong();
    else if (activeGame === "dino") updateDino();
    else if (activeGame === "catch") updateCatch();
}

// ============================================================================
// --- [BURADAN SONRASI OYUNLARIN KENDİ KODLARIDIR - DEĞİŞİKLİK YAPILMADI] ---
// ============================================================================

// --- SNAKE OYUNU ---
let snake = []; let snakeDir = {x:1, y:0}; let food = {x:10, y:10};
function initSnake() {
    snake = [{x:10, y:10}, {x:9, y:10}, {x:8, y:10}];
    snakeDir = {x:1, y:0}; generateFood();
}
function generateFood() {
    food = { x: Math.floor(Math.random()*20), y: Math.floor(Math.random()*20) };
}
function updateSnake() {
    if(!isGameRunning || isGameWaitingToStart) return;
    let head = { x: snake[0].x + snakeDir.x, y: snake[0].y + snakeDir.x }; 
    // Hatalı eksen hareket düzeltmesi
    head.x = snake[0].x + snakeDir.x; head.y = snake[0].y + snakeDir.y;
    
    if(head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20) return gameOver();
    for(let s of snake) { if(s.x === head.x && s.y === head.y) return gameOver(); }
    
    snake.unshift(head);
    if(head.x === food.x && head.y === food.y) {
        score += 10; if(scoreElement) scoreElement.innerText = score;
        playSound("eat"); generateFood();
    } else {
        snake.pop();
    }
    drawSnake();
}
function drawSnake() {
    const c = document.getElementById("gameCanvas"); if(!c) return; const ctx = c.getContext("2d");
    ctx.fillStyle = "#222"; ctx.fillRect(0,0,c.width,c.height);
    
    ctx.fillStyle = currentSkin === "blue" ? "#00b0ff" : currentSkin === "red" ? "#ff1744" : currentSkin === "gold" ? "#ffca28" : "#00e676";
    for(let s of snake) ctx.fillRect(s.x*20, s.y*20, 18, 18);
    
    ctx.fillStyle = "#ff1744"; ctx.fillRect(food.x*20, food.y*20, 18, 18);
}

// --- TUĞLA KIRMA ---
let ball = {x:200, y:200, dx:3, dy:-3, r:6}; let paddle = {x:150, w:80, h:10}; let bricks = [];
function initBrick() {
    ball = {x:200, y:300, dx:3, dy:-3, r:6}; paddle.x = 160; bricks = [];
    for(let r=0; r<4; r++) {
        for(let c=0; c<5; c++) { bricks.push({x: c*75 + 15, y: r*20 + 50, w:65, h:15, active:true}); }
    }
}
function updateBrick() {
    if(!isGameRunning) return;
    if(isGameWaitingToStart) { drawBrick(); return; }
    ball.x += ball.dx; ball.y += ball.dy;
    if(ball.x - ball.r < 0 || ball.x + ball.r > 400) ball.dx *= -1;
    if(ball.y - ball.r < 0) ball.dy *= -1;
    if(ball.y + ball.r > 390) {
        if(ball.x > paddle.x && ball.x < paddle.x + paddle.w) { ball.dy *= -1; playSound("eat"); }
        else { return gameOver(); }
    }
    for(let b of bricks) {
        if(b.active && ball.x > b.x && ball.x < b.x + b.w && ball.y > b.y && ball.y < b.y + b.h) {
            ball.dy *= -1; b.active = false; score += 20; if(scoreElement) scoreElement.innerText = score;
            playSound("eat");
        }
    }
    if(bricks.filter(b=>b.active).length === 0) { score += 500; gameOver(false); }
    drawBrick();
}
function drawBrick() {
    const c = document.getElementById("gameCanvas"); if(!c) return; const ctx = c.getContext("2d");
    ctx.fillStyle = "#111"; ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle = "#00b0ff"; ctx.fillRect(paddle.x, 380, paddle.w, paddle.h);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
    for(let b of bricks) {
        if(b.active) { ctx.fillStyle = "#ffca28"; ctx.fillRect(b.x, b.y, b.w, b.h); }
    }
}

// --- UZAY SAVAŞI ---
let playerX = 180; let playerLasers = []; let enemies = []; let spaceWave = 1;
function initSpace() {
    playerX = 180; playerLasers = []; enemies = [];
    spawnSpaceEnemies();
}
function spawnSpaceEnemies() {
    enemies = [];
    for(let r=0; r<3; r++) {
        for(let c=0; c<6; c++) { enemies.push({x: c*55 + 40, y: r*30 + 50, w:35, h:20, hp: spaceWave}); }
    }
}
function updateSpace() {
    if(!isGameRunning || isGameWaitingToStart) return;
    playerLasers.forEach((l, i) => { l.y -= 5; if(l.y < 0) playerLasers.splice(i,1); });
    let desc = false;
    enemies.forEach((e) => {
        e.x += 1; if(e.x > 365 || e.x < 10) { desc = true; }
        playerLasers.forEach((l, li) => {
            if(l.x > e.x && l.x < e.x + e.w && l.y > e.y && l.y < e.y + e.h) {
                playerLasers.splice(li,1); e.hp--; score += 10;
                if(scoreElement) scoreElement.innerText = score; playSound("eat");
            }
        });
    });
    if(desc) { enemies.forEach(e => { e.y += 10; e.x = e.x > 200 ? e.x - 15 : e.x + 15; }); }
    for(let e of enemies) { if(e.hp <= 0) enemies.splice(enemies.indexOf(e),1); }
    if(enemies.length === 0) { spaceWave++; spawnSpaceEnemies(); score += 100; }
    for(let e of enemies) { if(e.y + e.h >= 360) return gameOver(); }
    drawSpace();
}
function drawSpace() {
    const c = document.getElementById("gameCanvas"); if(!c) return; const ctx = c.getContext("2d");
    ctx.fillStyle = "#050510"; ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle = "#00e676"; ctx.fillRect(playerX, 360, 40, 20);
    ctx.fillStyle = "#ff1744"; playerLasers.forEach(l => ctx.fillRect(l.x, l.y, 4, 10));
    enemies.forEach(e => { ctx.fillStyle = "#ff1744"; ctx.fillRect(e.x, e.y, e.w, e.h); });
}

// --- CYBER BIRD ---
let bird = {y:200, v:0, g:0.4, j:-7}; let pipes = []; let pipeTimer = 0;
function initFlappy() { bird.y = 200; bird.v = 0; pipes = []; pipeTimer = 0; }
function updateFlappy() {
    if(!isGameRunning) return;
    if(isGameWaitingToStart) { drawFlappy(); return; }
    bird.v += bird.g; bird.y += bird.v;
    if(bird.y > 400 || bird.y < 0) return gameOver();
    pipeTimer++;
    if(pipeTimer % 90 === 0) {
        let h = Math.floor(Math.random()*150) + 50;
        pipes.push({x:400, top:h, bottom: 400 - h - 110, passed:false});
    }
    pipes.forEach((p, i) => {
        p.x -= 3; if(p.x < -60) pipes.splice(i,1);
        if(!p.passed && p.x < 100) { p.passed = true; score += 1; if(scoreElement) scoreElement.innerText = score; playSound("eat"); }
        if(100 + 20 > p.x && 100 < p.x + 50) {
            if(bird.y < p.top || bird.y + 20 > 400 - p.bottom) return gameOver();
        }
    });
    drawFlappy();
}
function drawFlappy() {
    const c = document.getElementById("gameCanvas"); if(!c) return; const ctx = c.getContext("2d");
    ctx.fillStyle = "#111"; ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle = "#ffca28"; ctx.fillRect(100, bird.y, 24, 24);
    ctx.fillStyle = "#00b0ff"; pipes.forEach(p => { ctx.fillRect(p.x, 0, 50, p.top); ctx.fillRect(p.x, 400 - p.bottom, 50, p.bottom); });
}

// --- NEON PONG ---
let pongBall = {x:200, y:200, dx:3, dy:2}; let p1Y = 150; let p2Y = 150;
function initPong() { pongBall = {x:200, y:200, dx:4, dy:2}; p1Y = 150; p2Y = 150; }
function updatePong() {
    if(!isGameRunning || isGameWaitingToStart) return;
    pongBall.x += pongBall.dx; pongBall.y += pongBall.dy;
    if(pongBall.y < 0 || pongBall.y > 390) pongBall.dy *= -1;
    let target = pongBall.y - 30; p2Y += (target - p2Y) * 0.08;
    if(pongBall.x < 25) {
        if(pongBall.y > p1Y && pongBall.y < p1Y + 70) { pongBall.dx *= -1.05; score += 5; if(scoreElement) scoreElement.innerText = score; playSound("eat"); }
        else { return gameOver(); }
    }
    if(pongBall.x > 370) { if(pongBall.y > p2Y && pongBall.y < p2Y + 70) { pongBall.dx *= -1; playSound("dink"); } else { score += 50; initPong(); } }
    drawPong();
}
function drawPong() {
    const c = document.getElementById("gameCanvas"); if(!c) return; const ctx = c.getContext("2d");
    ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle = "#ff1744"; ctx.fillRect(10, p1Y, 12, 70);
    ctx.fillStyle = "#00b0ff"; ctx.fillRect(380, p2Y, 12, 70);
    ctx.fillStyle = "#fff"; ctx.fillRect(pongBall.x, pongBall.y, 10, 10);
}

// --- BLOCK BLAST ---
let grid = Array(8).fill().map(() => Array(8).fill(0));
function initBlockBlast() { grid = Array(8).fill().map(() => Array(8).fill(0)); drawBlockBlast(); }
function updateBlockBlast() { drawBlockBlast(); }
function drawBlockBlast() {
    const c = document.getElementById("gameCanvas"); if(!c) return; const ctx = c.getContext("2d");
    ctx.fillStyle = "#151515"; ctx.fillRect(0,0,c.width,c.height);
    for(let r=0; r<8; r++) {
        for(let col=0; col<8; col++) {
            ctx.strokeStyle = "#333"; ctx.strokeRect(col*45 + 20, r*45 + 20, 42, 42);
            if(grid[r][col] !== 0) { ctx.fillStyle = "#aa00ff"; ctx.fillRect(col*45 + 22, r*45 + 22, 38, 38); }
        }
    }
}

// --- NEON ÇİZİM ---
function initGartic() { clearCanvas(); drawGarticPlaceholder(); }
function drawGarticPlaceholder() {
    const c = document.getElementById("gameCanvas"); if(!c) return; const ctx = c.getContext("2d");
    ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(0, 0, c.width, 40);
    ctx.fillStyle = "#fff"; ctx.font = "12px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Serbest Çizim Modu: Tuval üzerine tıklayıp sürükleyin!", c.width/2, 25);
}

// --- DINO RUN ---
let dinoY = 0; let dinoV = 0; let obstacleX = 400;
function initDino() { dinoY = 0; dinoV = 0; obstacleX = 400; }
function updateDino() {
    if(!isGameRunning || isGameWaitingToStart) return;
    dinoV -= 0.5; dinoY += dinoV; if(dinoY < 0) { dinoY = 0; dinoV = 0; }
    obstacleX -= 5; if(obstacleX < -20) { obstacleX = 400; score += 10; if(scoreElement) scoreElement.innerText = score; playSound("eat"); }
    if(obstacleX > 40 && obstacleX < 70 && dinoY < 30) return gameOver();
    drawDino();
}
function drawDino() {
    const c = document.getElementById("gameCanvas"); if(!c) return; const ctx = c.getContext("2d");
    ctx.fillStyle = "#111"; ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle = "#00b0ff"; ctx.fillRect(40, 350 - dinoY, 30, 30);
    ctx.fillStyle = "#ff1744"; ctx.fillRect(obstacleX, 350, 20, 30);
    ctx.fillStyle = "#555"; ctx.fillRect(0, 380, 400, 2);
}

// --- YILDIZ AVCISI ---
let catcherX = 170; let star = {x:200, y:0};
function initCatch() { catcherX = 170; star = {x: Math.random()*360 + 20, y:0}; }
function updateCatch() {
    if(!isGameRunning || isGameWaitingToStart) return;
    star.y += 4;
    if(star.y > 360 && star.x > catcherX && star.x < catcherX + 60) {
        score += 15; if(scoreElement) scoreElement.innerText = score; playSound("eat");
        star = {x: Math.random()*360 + 20, y:0};
    } else if(star.y > 400) { return gameOver(); }
    drawCatch();
}
function drawCatch() {
    const c = document.getElementById("gameCanvas"); if(!c) return; const ctx = c.getContext("2d");
    ctx.fillStyle = "#0f0f1a"; ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle = "#ffea00"; ctx.fillRect(star.x, star.y, 15, 15);
    ctx.fillStyle = "#00e676"; ctx.fillRect(catcherX, 370, 60, 15);
}

// ============================================================================
// --- MARKET (SKIN SHOP) YÖNETİMİ ---
// ============================================================================
const shopBtn = document.getElementById("shopBtn");
const shopPanel = document.getElementById("shopPanel");
if(shopBtn && shopPanel) {
    shopBtn.addEventListener("click", () => shopPanel.classList.toggle("hidden"));
}
document.querySelectorAll(".skin-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        if (!auth.currentUser) return alert("Kostüm satın almak için giriş yapmalısın!");
        
        const b = e.target; const skin = b.getAttribute("data-skin"); const cost = parseInt(b.getAttribute("data-cost"));
        const goldDisplay = document.getElementById("totalGold");
        let currentGold = goldDisplay ? parseInt(goldDisplay.innerText) : 0;
        
        if(purchasedSkins.includes(skin)) {
            currentSkin = skin;
            document.querySelectorAll(".skin-btn").forEach(x => { if(purchasedSkins.includes(x.getAttribute("data-skin"))) x.innerText = "Seç"; });
            b.innerText = "Seçili";
        } else {
            if(currentGold >= cost) {
                currentGold -= cost;
                // Veritabanındaki altını düşür
                database.ref('users/' + auth.currentUser.uid).update({ gold: currentGold });
                purchasedSkins.push(skin); b.innerText = "Seçili";
                currentSkin = skin;
            } else {
                alert("Yetersiz Altın! Oyun oynayarak altın kazanabilirsin.");
            }
        }
    });
});

// Sayfa ilk yüklendiğinde yılan oyununu hazırlayalım
switchGame("snake");