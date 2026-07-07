// ============================================================================
// --- 1. GLOBAL DEĞİŞKENLER & AYARLAR ---
// ============================================================================
let activeGame = "snake"; 
let score = 0;
let isGameRunning = false;
let isGameWaitingToStart = true;
let gameInterval = null;
let currentSkin = "classic";
let purchasedSkins = ["classic"];

const scoreElement = document.getElementById("score");
const startBtn = document.getElementById("startBtn");
const mobileStartBtn = document.getElementById("mobileStartBtn");
const welcomeText = document.getElementById("welcomeText");
const nameModal = document.getElementById("nameModal");
const mPanel = document.getElementById("multiplayerPanel");
const totalGoldEl = document.getElementById("totalGold");
const totalTimeDisplay = document.getElementById("totalTimeDisplay");

let audioCtx = null;
function playSound(type) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        if (type === "eat") {
            osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); 
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            osc.start(); osc.stop(audioCtx.currentTime + 0.08);
        } else if (type === "hit") {
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            osc.start(); osc.stop(audioCtx.currentTime + 0.2);
        }
    } catch(e) {}
}
window.playSound = playSound;

// ============================================================================
// --- 2. GİRİŞ FONKSİYONLARI (400 HATASI KORUMALI TAM SÜRÜM) ---
// ============================================================================
window.googleIleGiris = () => {
    const authObj = window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
    if (!authObj) return alert("Firebase henüz hazır değil, lütfen sayfayı yenileyip bekleyin.");

    const provider = new firebase.auth.GoogleAuthProvider();
    authObj.signInWithPopup(provider)
        .then(() => location.reload())
        .catch((error) => {
            if (error.code === 'auth/popup-blocked') {
                authObj.signInWithRedirect(provider);
            } else {
                alert("Google Giriş Hatası: " + error.message);
            }
        });
};

window.girisYapVeyaKaydol = async () => {
    const authObj = window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
    const dbObj = window.database || (typeof firebase !== 'undefined' ? firebase.database() : null);

    if (!authObj || !dbObj) return alert("Firebase bağlantısı bekleniyor, lütfen 2 saniye sonra deneyin.");

    let rawInput = document.getElementById("usernameInput").value.trim();
    const passwordInput = document.getElementById("passwordInput").value.trim();

    if (!rawInput || !passwordInput) return alert("Kullanıcı adı ve şifre alanları boş bırakılamaz!");
    if (passwordInput.length < 6) return alert("Firebase kuralı gereği şifreniz en az 6 karakter olmalıdır!");

    // Türkçe karakterleri güvenli bir şekilde İngilizce karakterlere dönüştür
    let cleanedInput = rawInput
        .toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '');

    if (!cleanedInput || cleanedInput.length < 3) {
        cleanedInput = "player_" + Math.random().toString(36).substring(2, 7);
    }

    const email = `${cleanedInput}@arcadeapp.com`;

    try {
        // 1. Önce Giriş Yapmayı Dene
        await authObj.signInWithEmailAndPassword(email, passwordInput);
        location.reload();
    } catch (error) {
        console.warn("Giriş denemesi başarısız, hata kodu:", error.code);
        
        // Firebase artık şifre yanlışsa veya kullanıcı yoksa INVALID_LOGIN_CREDENTIALS dönüyor.
        // Bu yüzden kontrol listemize 'auth/invalid-login-credentials' kodunu da ekledik.
        if (
            error.code === 'auth/user-not-found' || 
            error.code === 'auth/invalid-credential' || 
            error.code === 'auth/wrong-password' || 
            error.code === 'auth/invalid-email' ||
            error.code === 'auth/invalid-login-credentials' ||
            String(error.message).includes("INVALID_LOGIN_CREDENTIALS")
        ) {
            try {
                console.log("Kullanıcı bulunamadı veya bilgiler eşleşmedi. Yeni hesap oluşturuluyor...");
                const userCredential = await authObj.createUserWithEmailAndPassword(email, passwordInput);
                
                // Realtime Database'e orijinal kullanıcı adıyla kaydet
                await dbObj.ref('users/' + userCredential.user.uid).set({
                    username: rawInput, 
                    gold: 0,
                    totalTime: 0,
                    snake_best: 0,
                    brick_best: 0,
                    space_best: 0,
                    flappy_best: 0,
                    pong_best: 0,
                    blockblast_best: 0,
                    created_at: new Date().toISOString()
                });
                
                console.log("Kayıt işlemi başarılı!");
                location.reload();
            } catch (kayitHata) {
                console.error("Kayıt sırasında hata:", kayitHata);
                alert("Kayıt Başarısız: " + kayitHata.message);
            }
        } else {
            alert("Firebase Hatası: " + error.message);
        }
    }
};

// ============================================================================
// --- 3. FIREBASE OTO-DİNLEYİCİLER (EKRAN KİLİDİ KALDIRILMIŞ SÜRÜM) ---
// ============================================================================
setTimeout(() => {
    const authObj = window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
    const dbObj = window.database || (typeof firebase !== 'undefined' ? firebase.database() : null);

    if (authObj && dbObj) {
        authObj.onAuthStateChanged((user) => {
            if (user) {
                // KİLİT NOKTA: Giriş penceresini sadece gizlemiyoruz, ekrandan tamamen söküyoruz 
                // böylece tıklamaların önüne geçemiyor.
                if (nameModal) {
                    nameModal.style.setProperty("display", "none", "important");
                    nameModal.style.pointerEvents = "none"; // Tıklamaları arkaya geçir
                }
                
                const username = user.email.split('@')[0];
                if (welcomeText) welcomeText.innerText = `🎮 Hoş geldin, ${username}!`;
                
                dbObj.ref('users/' + user.uid).on('value', (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        if (totalGoldEl) totalGoldEl.innerText = data.gold || 0;
                        if (totalTimeDisplay) totalTimeDisplay.innerText = (data.totalTime || 0) + "s";
                        updateLeaderboardUI(data);
                    }
                });
                
                dbObj.ref('users').orderByChild("snake_best").limitToLast(5).on("value", (snapshot) => {
                    let enYuksek = 0;
                    snapshot.forEach((childSnapshot) => {
                        let veri = childSnapshot.val();
                        if (veri.snake_best && veri.snake_best > enYuksek) enYuksek = veri.snake_best;
                    });
                    const allTimeBestEl = document.getElementById("allTimeBest");
                    if (allTimeBestEl) allTimeBestEl.innerText = enYuksek + " Puan";
                });
            } else {
                if (nameModal) {
                    nameModal.style.display = "flex";
                    nameModal.style.pointerEvents = "auto";
                }
            }
        });
    }
}, 1000);

function skorKaydet(oyunTuru, puan) {
    const authObj = window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
    const dbObj = window.database || (typeof firebase !== 'undefined' ? firebase.database() : null);
    if (authObj && authObj.currentUser && dbObj) {
        const uid = authObj.currentUser.uid;
        const skorYolu = `${oyunTuru}_best`;
        dbObj.ref(`users/${uid}/${skorYolu}`).once('value', (snapshot) => {
            const mevcutEnIyi = snapshot.val() || 0;
            if (puan > mevcutEnIyi) {
                const updateData = {}; updateData[skorYolu] = puan;
                dbObj.ref('users/' + uid).update(updateData);
            }
        });
    }
}

function addGold(amount) {
    const authObj = window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
    const dbObj = window.database || (typeof firebase !== 'undefined' ? firebase.database() : null);
    if (authObj && authObj.currentUser && dbObj) {
        dbObj.ref('users/' + authObj.currentUser.uid + '/gold').transaction((g) => (g || 0) + amount);
    }
}

setInterval(() => {
    const authObj = window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
    const dbObj = window.database || (typeof firebase !== 'undefined' ? firebase.database() : null);
    if (authObj && authObj.currentUser && dbObj && isGameRunning && !isGameWaitingToStart) {
        dbObj.ref('users/' + authObj.currentUser.uid + '/totalTime').transaction((t) => (t || 0) + 1);
    }
}, 1000);

function updateLeaderboardUI(data) {
    const games = ["snake", "brick", "space", "flappy", "pong", "blockblast"];
    games.forEach(game => {
        const el = document.getElementById(`${game}Best`);
        if (el) el.innerText = (data[game + "_best"] || 0) + " Puan";
    });
}

// ============================================================================
// --- 4. OYUN MOTORU SISTEMI ---
// ============================================================================
function switchGame(g) {
    if(isGameRunning) gameOver(true); activeGame = g; score = 0; 
    if(scoreElement) scoreElement.innerText = score; if(mPanel) mPanel.classList.add("hidden");
    document.querySelectorAll(".game-selector button").forEach(b => b.classList.remove("active")); 
    let tBtn = document.getElementById("select" + g.charAt(0).toUpperCase() + g.slice(1)) || document.getElementById("select" + g);
    if(tBtn) tBtn.classList.add("active");
    
    if (g === "snake") { if(welcomeText) welcomeText.innerText = "🐍 Klasik Yılan Oyunu"; initSnake(); }
    else if (g === "brick") { if(welcomeText) welcomeText.innerText = "🧱 Tuğla Kırma"; initBrick(); }
    else if (g === "space") { if(welcomeText) welcomeText.innerText = "🚀 Uzay Savaşı"; spaceWave = 1; initSpace(); }
    else if (g === "flappy") { if(welcomeText) welcomeText.innerText = "🛸 Neon Bird"; initFlappy(); }
    else if (g === "pong") { if(welcomeText) welcomeText.innerText = "🔴 Pong"; initPong(); }
    else if (g === "blockblast") { if(welcomeText) welcomeText.innerText = "🟨 Block Blast"; initBlockBlast(); }
    else if (g === "dino") { if(welcomeText) welcomeText.innerText = "🦖 Dino Run"; initDino(); }
    else if (g === "catch") { if(welcomeText) welcomeText.innerText = "🌟 Yıldız Avcısı"; initCatch(); }
}
window.switchGame = switchGame;

function startActiveGame() {
    const authObj = window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
    if (!authObj || !authObj.currentUser) {
        alert("Oyuna başlamak için önce giriş yapmalısın!");
        if (nameModal) nameModal.style.display = "flex"; return;
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
    else if (activeGame === "dino") { initDino(); isGameWaitingToStart = false; }
    else if (activeGame === "catch") { initCatch(); isGameWaitingToStart = false; }

    clearInterval(gameInterval); 
    if(activeGame !== "blockblast") {
        gameInterval = setInterval(updateEngine, activeGame === "snake" ? 100 : 1000 / 60);
    } else {
        updateEngine();
    }
}
window.startActiveGame = startActiveGame;

function gameOver(silent = false) {
    isGameRunning = false; clearInterval(gameInterval);
    if(!silent) {
        playSound("hit"); alert("💥 Oyun Bitti! Skorun: " + score);
        skorKaydet(activeGame, score);
        let goldEarned = Math.floor(score / 5); if(goldEarned > 0) addGold(goldEarned);
    }
    if(startBtn) startBtn.innerText = "Oyunu Başlat";
    if(mobileStartBtn) mobileStartBtn.innerText = "🎮 OYUNU BAŞLAT / YENİDEN BAŞLAT";
}

function updateEngine() {
    if (activeGame === "snake") updateSnake();
    else if (activeGame === "brick") updateBrick();
    else if (activeGame === "space") updateSpace();
    else if (activeGame === "flappy") updateFlappy();
    else if (activeGame === "pong") updatePong();
    else if (activeGame === "dino") updateDino();
    else if (activeGame === "catch") updateCatch();
}

// --- SNAKE ---
let snake = []; let snakeDir = {x:1, y:0}; let food = {x:10, y:10};
function initSnake() { snake = [{x:10, y:10}, {x:9, y:10}, {x:8, y:10}]; snakeDir = {x:1, y:0}; generateFood(); }
function generateFood() { food = { x: Math.floor(Math.random()*20), y: Math.floor(Math.random()*20) }; }
function updateSnake() {
    if(!isGameRunning || isGameWaitingToStart) return;
    let head = { x: snake[0].x + snakeDir.x, y: snake[0].y + snakeDir.y };
    if(head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20) return gameOver();
    for(let s of snake) { if(s.x === head.x && s.y === head.y) return gameOver(); }
    snake.unshift(head);
    if(head.x === food.x && head.y === food.y) {
        score += 10; if(scoreElement) scoreElement.innerText = score; playSound("eat"); generateFood();
    } else { snake.pop(); }
    drawSnake();
}
function drawSnake() {
    const c = document.getElementById("gameCanvas"); if(!c) return; const ctx = c.getContext("2d");
    ctx.fillStyle = "#222"; ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle = currentSkin === "blue" ? "#00b0ff" : currentSkin === "red" ? "#ff1744" : "#00e676";
    for(let s of snake) ctx.fillRect(s.x*20, s.y*20, 18, 18);
    ctx.fillStyle = "#ff1744"; ctx.fillRect(food.x*20, food.y*20, 18, 18);
}

// --- BRICK ---
let ball = {x:200, y:200, dx:3, dy:-3, r:6}; let paddle = {x:150, w:80, h:10}; let bricks = [];
function initBrick() {
    ball = {x:200, y:300, dx:3, dy:-3, r:6}; paddle.x = 160; bricks = [];
    for(let r=0; r<4; r++) { for(let c=0; c<5; c++) { bricks.push({x: c*75 + 15, y: r*20 + 50, w:65, h:15, active:true}); } }
}
function updateBrick() {
    if(!isGameRunning) return; if(isGameWaitingToStart) { drawBrick(); return; }
    ball.x += ball.dx; ball.y += ball.dy;
    if(ball.x - ball.r < 0 || ball.x + ball.r > 400) ball.dx *= -1;
    if(ball.y - ball.r < 0) ball.dy *= -1;
    if(ball.y + ball.r > 390) {
        if(ball.x > paddle.x && ball.x < paddle.x + paddle.w) { ball.dy *= -1; } else { return gameOver(); }
    }
    for(let b of bricks) {
        if(b.active && ball.x > b.x && ball.x < b.x + b.w && ball.y > b.y && ball.y < b.y + b.h) {
            ball.dy *= -1; b.active = false; score += 20; if(scoreElement) scoreElement.innerText = score;
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
    for(let b of bricks) { if(b.active) { ctx.fillStyle = "#ffca28"; ctx.fillRect(b.x, b.y, b.w, b.h); } }
}

// --- SPACE ---
let playerX = 180; let playerLasers = []; let enemies = []; let spaceWave = 1;
function initSpace() { playerX = 180; playerLasers = []; enemies = []; spawnSpaceEnemies(); }
function spawnSpaceEnemies() {
    enemies = []; for(let r=0; r<3; r++) { for(let c=0; c<6; c++) { enemies.push({x: c*55 + 40, y: r*30 + 50, w:35, h:20, hp: spaceWave}); } }
}
function updateSpace() {
    if(!isGameRunning || isGameWaitingToStart) return;
    playerLasers.forEach((l, i) => { l.y -= 5; if(l.y < 0) playerLasers.splice(i,1); });
    let desc = false;
    enemies.forEach((e) => {
        e.x += 1; if(e.x > 365 || e.x < 10) { desc = true; }
        playerLasers.forEach((l, li) => {
            if(l.x > e.x && l.x < e.x + e.w && l.y > e.y && l.y < e.y + e.h) {
                playerLasers.splice(li,1); e.hp--; score += 10; if(scoreElement) scoreElement.innerText = score;
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

// --- FLAPPY ---
let bird = {y:200, v:0, g:0.4, j:-7}; let pipes = []; let pipeTimer = 0;
function initFlappy() { bird.y = 200; bird.v = 0; pipes = []; pipeTimer = 0; }
function updateFlappy() {
    if(!isGameRunning) return; if(isGameWaitingToStart) { drawFlappy(); return; }
    bird.v += bird.g; bird.y += bird.v; if(bird.y > 400 || bird.y < 0) return gameOver();
    pipeTimer++;
    if(pipeTimer % 90 === 0) {
        let h = Math.floor(Math.random()*150) + 50;
        pipes.push({x:400, top:h, bottom: 400 - h - 110, passed:false});
    }
    pipes.forEach((p, i) => {
        p.x -= 3; if(p.x < -60) pipes.splice(i,1);
        if(!p.passed && p.x < 100) { p.passed = true; score += 1; if(scoreElement) scoreElement.innerText = score; }
        if(100 + 20 > p.x && 100 < p.x + 50) { if(bird.y < p.top || bird.y + 20 > 400 - p.bottom) return gameOver(); }
    });
    drawFlappy();
}
function drawFlappy() {
    const c = document.getElementById("gameCanvas"); if(!c) return; const ctx = c.getContext("2d");
    ctx.fillStyle = "#111"; ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle = "#ffca28"; ctx.fillRect(100, bird.y, 24, 24);
    ctx.fillStyle = "#00b0ff"; pipes.forEach(p => { ctx.fillRect(p.x, 0, 50, p.top); ctx.fillRect(p.x, 400 - p.bottom, 50, p.bottom); });
}

// --- PONG ---
let pongBall = {x:200, y:200, dx:3, dy:2}; let p1Y = 150; let p2Y = 150;
function initPong() { pongBall = {x:200, y:200, dx:4, dy:2}; p1Y = 150; p2Y = 150; }
function updatePong() {
    if(!isGameRunning || isGameWaitingToStart) return;
    pongBall.x += pongBall.dx; pongBall.y += pongBall.dy;
    if(pongBall.y < 0 || pongBall.y > 390) pongBall.dy *= -1;
    let target = pongBall.y - 30; p2Y += (target - p2Y) * 0.08;
    if(pongBall.x < 25) {
        if(pongBall.y > p1Y && pongBall.y < p1Y + 70) { pongBall.dx *= -1.05; score += 5; if(scoreElement) scoreElement.innerText = score; }
        else { return gameOver(); }
    }
    if(pongBall.x > 370) { if(pongBall.y > p2Y && pongBall.y < p2Y + 70) { pongBall.dx *= -1; } else { score += 50; initPong(); } }
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

// --- DINO RUN ---
let dinoY = 0; let dinoV = 0; let obstacleX = 400;
function initDino() { dinoY = 0; dinoV = 0; obstacleX = 400; }
function updateDino() {
    if(!isGameRunning || isGameWaitingToStart) return;
    dinoV -= 0.5; dinoY += dinoV; if(dinoY < 0) { dinoY = 0; dinoV = 0; }
    obstacleX -= 5; if(obstacleX < -20) { obstacleX = 400; score += 10; if(scoreElement) scoreElement.innerText = score; }
    if(obstacleX > 40 && obstacleX < 70 && dinoY < 30) return gameOver();
    drawDino();
}
function drawDino() {
    const c = document.getElementById("gameCanvas"); if(!c) return; const ctx = c.getContext("2d");
    ctx.fillStyle = "#111"; ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle = "#00b0ff"; ctx.fillRect(40, 350 - dinoY, 30, 30);
    ctx.fillStyle = "#ff1744"; ctx.fillRect(obstacleX, 350, 20, 30);
}

// --- CATCH ---
let catcherX = 170; let star = {x:200, y:0};
function initCatch() { catcherX = 170; star = {x: Math.random()*360 + 20, y:0}; }
function updateCatch() {
    if(!isGameRunning || isGameWaitingToStart) return; star.y += 4;
    if(star.y > 360 && star.x > catcherX && star.x < catcherX + 60) {
        score += 15; if(scoreElement) scoreElement.innerText = score;
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
// --- 5. EVENT LISTENERS (KESİN ÇALIŞTIRMA VE ODAKLANMA SÜRÜMÜ) ---
// ============================================================================

// Klavyeden gelen tuşları doğrudan yakala ve sayfayı kaydırmasını engelle
window.addEventListener("keydown", (e) => {
    // Eğer oyun oynamıyorsa tuşları dinleme
    if (!isGameRunning) return;

    // Yön tuşları ve Boşluk (Space) basıldığında sayfanın aşağı yukarı kaymasını engelle
    if(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
    }

    // SNAKE (YILAN) KONTROLLERİ
    if(activeGame === "snake") {
        if((e.key === "ArrowUp" || e.key === "w" || e.key === "W") && snakeDir.y !== 1) snakeDir = {x:0, y:-1};
        else if((e.key === "ArrowDown" || e.key === "s" || e.key === "S") && snakeDir.y !== -1) snakeDir = {x:0, y:1};
        else if((e.key === "ArrowLeft" || e.key === "a" || e.key === "A") && snakeDir.x !== 1) snakeDir = {x:-1, y:0};
        else if((e.key === "ArrowRight" || e.key === "d" || e.key === "D") && snakeDir.x !== -1) snakeDir = {x:1, y:0};
    }
    
    // BRICK & PONG KONTROLLERİ
    if(activeGame === "brick" || activeGame === "pong") {
        if(isGameWaitingToStart && (e.key === " " || e.code === "Space")) isGameWaitingToStart = false;
        if((e.key === "ArrowLeft" || e.key === "a" || e.key === "A") && paddle.x > 0) paddle.x -= 25;
        if((e.key === "ArrowRight" || e.key === "d" || e.key === "D") && paddle.x < 320) paddle.x += 25;
        if(e.key === "ArrowUp" && p1Y > 0) p1Y -= 20;
        if(e.key === "ArrowDown" && p1Y < 330) p1Y += 20;
    }
    
    // SPACE (UZAY) KONTROLLERİ
    if(activeGame === "space") {
        if((e.key === "ArrowLeft" || e.key === "a" || e.key === "A") && playerX > 10) playerX -= 20;
        if((e.key === "ArrowRight" || e.key === "d" || e.key === "D") && playerX < 350) playerX += 20;
        if(e.key === " " || e.code === "Space") playerLasers.push({x: playerX + 18, y: 350});
    }
    
    // FLAPPY BIRD KONTROLLERİ
    if(activeGame === "flappy") {
        if(e.key === " " || e.code === "Space" || e.key === "ArrowUp") { 
            if(isGameWaitingToStart) isGameWaitingToStart = false; 
            bird.v = bird.j; 
        }
    }
    
    // DINO RUN KONTROLLERİ
    if(activeGame === "dino") {
        if((e.key === " " || e.code === "Space" || e.key === "ArrowUp") && dinoY === 0) dinoV = 11;
    }
    
    // CATCH KONTROLLERİ
    if(activeGame === "catch") {
        if((e.key === "ArrowLeft" || e.key === "a" || e.key === "A") && catcherX > 0) catcherX -= 25;
        if((e.key === "ArrowRight" || e.key === "d" || e.key === "D") && catcherX < 340) catcherX += 25;
    }
}, { passive: false });

// Mobil Ekran Dokunma ve Tıklama Desteği
const canvasElement = document.getElementById("gameCanvas");
if (canvasElement) {
    // Tıklandığında oyunu canlandır ve odakla
    canvasElement.addEventListener("click", () => {
        if(!isGameRunning) return;
        if(isGameWaitingToStart) isGameWaitingToStart = false;
        
        if(activeGame === "flappy") bird.v = bird.j;
        if(activeGame === "dino" && dinoY === 0) dinoV = 11;
    });
    
    // Mobil dokunmatik ekranlar için ekstra tetikleyici
    canvasElement.addEventListener("touchstart", (e) => {
        if(!isGameRunning) return;
        if(isGameWaitingToStart) isGameWaitingToStart = false;
        
        if(activeGame === "flappy") bird.v = bird.j;
        if(activeGame === "dino" && dinoY === 0) dinoV = 11;
    }, { passive: true });
}

// Butonları Tetikleyicilere Bağlama Bölümü
const sBtn = document.getElementById("startBtn");
const mStartBtn = document.getElementById("mobileStartBtn");

if(sBtn) sBtn.addEventListener("click", () => { startActiveGame(); if(canvasElement) canvasElement.focus(); });
if(mStartBtn) mStartBtn.addEventListener("click", () => { startActiveGame(); if(canvasElement) canvasElement.focus(); });

// Menüden oyun değiştirme butonlarını bağla
document.getElementById("selectSnake")?.addEventListener("click", () => switchGame("snake"));
document.getElementById("selectBrick")?.addEventListener("click", () => switchGame("brick"));
document.getElementById("selectSpace")?.addEventListener("click", () => switchGame("space"));
document.getElementById("selectFlappy")?.addEventListener("click", () => switchGame("flappy"));
document.getElementById("selectPong")?.addEventListener("click", () => switchGame("pong"));
document.getElementById("selectBlockblast")?.addEventListener("click", () => switchGame("blockblast"));
document.getElementById("selectDino")?.addEventListener("click", () => switchGame("dino"));
document.getElementById("selectCatch")?.addEventListener("click", () => switchGame("catch"));

// Oyunu yılan oyunuyla hazır başlat
switchGame("snake");