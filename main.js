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
const canvasElement = document.getElementById("gameCanvas");

// Mobil Tuş Basılı Tutma Kontrolcüleri
let mobileIntervals = { left: null, right: null, up: null, down: null };

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
// --- 2. GİRİŞ VE FIREBASE SİSTEMİ ---
// ============================================================================
window.googleIleGiris = () => {
    const authObj = window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
    if (!authObj) return alert("Firebase hazır değil.");
    const provider = new firebase.auth.GoogleAuthProvider();
    authObj.signInWithPopup(provider).then(() => location.reload()).catch(e => alert(e.message));
};

window.girisYapVeyaKaydol = async () => {
    const authObj = window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
    const dbObj = window.database || (typeof firebase !== 'undefined' ? firebase.database() : null);
    if (!authObj || !dbObj) return alert("Bağlantı bekleniyor...");

    let rawInput = document.getElementById("usernameInput").value.trim();
    const passwordInput = document.getElementById("passwordInput").value.trim();

    if (!rawInput || !passwordInput) return alert("Alanlar boş bırakılamaz!");
    if (passwordInput.length < 6) return alert("Şifre en az 6 karakter olmalıdır!");

    let cleanedInput = rawInput.toLowerCase().replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9]/g, '');
    if (!cleanedInput || cleanedInput.length < 3) cleanedInput = "player_" + Math.random().toString(36).substring(2, 7);
    const email = `${cleanedInput}@arcadeapp.com`;

    try {
        await authObj.signInWithEmailAndPassword(email, passwordInput);
        location.reload();
    } catch (error) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-login-credentials' || String(error.message).includes("INVALID_LOGIN_CREDENTIALS")) {
            try {
                const userCredential = await authObj.createUserWithEmailAndPassword(email, passwordInput);
                await dbObj.ref('users/' + userCredential.user.uid).set({
                    username: rawInput, gold: 0, totalTime: 0,
                    snake_best: 0, brick_best: 0, space_best: 0, flappy_best: 0, pong_best: 0, blockblast_best: 0, dino_best: 0, catch_best: 0,
                    created_at: new Date().toISOString()
                });
                location.reload();
            } catch (kayitHata) { alert("Kayıt Başarısız: " + kayitHata.message); }
        } else { alert("Hata: " + error.message); }
    }
};

// ============================================================================
// --- 3. LIDER TABLOSU & REALTIME SİSTEM ---
// ============================================================================
function loadRealtimeLeaderboard(game) {
    const dbObj = window.database || (typeof firebase !== 'undefined' ? firebase.database() : null);
    if (!dbObj) return;

    const scorePath = `${game}_best`;
    dbObj.ref('users').orderByChild(scorePath).limitToLast(10).on('value', (snapshot) => {
        const leaderboardList = [];
        snapshot.forEach((child) => {
            const userData = child.val();
            if (userData[scorePath] !== undefined) {
                leaderboardList.push({
                    username: userData.username || child.key.substring(0,6),
                    score: userData[scorePath]
                });
            }
        });
        
        // Büyükten küçüğe sırala
        leaderboardList.sort((a, b) => b.score - a.score);
        
        // HTML UI Güncelleme (Sol Panel)
        const leaderContainer = document.querySelector(".en-iyiler-listesi") || document.getElementById("leaderboardContainer");
        if (leaderContainer) {
            leaderContainer.innerHTML = leaderboardList.map((u, i) => `
                <div style="display:flex; justify-content:space-between; padding:4px 8px; font-size:13px; color:${i===0?'#ffca28':'#fff'}">
                    <span>${i+1}. ${u.username}</span>
                    <span>${u.score} Puan</span>
                </div>
            `).join('');
        }
    });
}

setTimeout(() => {
    const authObj = window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
    const dbObj = window.database || (typeof firebase !== 'undefined' ? firebase.database() : null);

    if (authObj && dbObj) {
        authObj.onAuthStateChanged((user) => {
            if (user) {
                if (nameModal) {
                    nameModal.style.setProperty("display", "none", "important");
                    nameModal.style.pointerEvents = "none";
                }
                dbObj.ref('users/' + user.uid).on('value', (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        if (totalGoldEl) totalGoldEl.innerText = data.gold || 0;
                        if (totalTimeDisplay) totalTimeDisplay.innerText = (data.totalTime || 0) + "s";
                        updateLeaderboardUI(data);
                    }
                });
                loadRealtimeLeaderboard(activeGame);
            } else {
                if (nameModal) { nameModal.style.display = "flex"; nameModal.style.pointerEvents = "auto"; }
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

function updateLeaderboardUI(data) {
    const games = ["snake", "brick", "space", "flappy", "pong", "blockblast", "dino", "catch"];
    games.forEach(game => {
        const el = document.getElementById(`${game}Best`);
        if (el) el.innerText = (data[game + "_best"] || 0) + " Puan";
    });
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
    if (authObj && authObj.currentUser && isGameRunning && !isGameWaitingToStart) {
        window.database.ref('users/' + authObj.currentUser.uid + '/totalTime').transaction((t) => (t || 0) + 1);
    }
}, 1000);

// ============================================================================
// --- 4. OYUN MOTORLARI SİSTEMİ ---
// ============================================================================
function switchGame(g) {
    if(isGameRunning) gameOver(true); 
    activeGame = g; score = 0; 
    if(scoreElement) scoreElement.innerText = score;
    
    document.querySelectorAll(".game-selector button, .grid button").forEach(b => b.classList.remove("active"));
    let tBtn = document.getElementById("select" + g.charAt(0).toUpperCase() + g.slice(1)) || document.getElementById("select" + g);
    if(tBtn) tBtn.classList.add("active");
    
    loadRealtimeLeaderboard(g);

    if (g === "snake") { if(welcomeText) welcomeText.innerText = "🐍 Klasik Yılan Oyunu"; initSnake(); }
    else if (g === "brick") { if(welcomeText) welcomeText.innerText = "🧱 Tuğla Kırma"; initBrick(); }
    else if (g === "space") { if(welcomeText) welcomeText.innerText = "🚀 Uzay Savaşı"; initSpace(); }
    else if (g === "flappy") { if(welcomeText) welcomeText.innerText = "🛸 Neon Bird"; initFlappy(); }
    else if (g === "pong") { if(welcomeText) welcomeText.innerText = "🔴 Pong"; initPong(); }
    else if (g === "blockblast") { if(welcomeText) welcomeText.innerText = "🟨 Block Blast"; initBlockBlast(); }
    else if (g === "dino") { if(welcomeText) welcomeText.innerText = "Rex Run"; initDino(); }
    else if (g === "catch") { if(welcomeText) welcomeText.innerText = "🌟 Yıldız Avcısı"; initCatch(); }
    else if (g === "xox") { if(welcomeText) welcomeText.innerText = "❌ XOX Oyunu"; initXOX(); }
}
window.switchGame = switchGame;

function startActiveGame() {
    score = 0; if(scoreElement) scoreElement.innerText = score; 
    isGameRunning = true; isGameWaitingToStart = true; 
    
    if (activeGame === "snake") { initSnake(); isGameWaitingToStart = false; } 
    else if (activeGame === "brick") initBrick(); 
    else if (activeGame === "space") { spaceWave = 1; initSpace(); isGameWaitingToStart = false; } 
    else if (activeGame === "flappy") initFlappy(); 
    else if (activeGame === "pong") initPong();
    else if (activeGame === "blockblast") { initBlockBlast(); isGameWaitingToStart = false; }
    else if (activeGame === "dino") { initDino(); isGameWaitingToStart = false; }
    else if (activeGame === "catch") { initCatch(); isGameWaitingToStart = false; }
    else if (activeGame === "xox") { initXOX(); isGameWaitingToStart = false; }

    clearInterval(gameInterval); 
    gameInterval = setInterval(updateEngine, activeGame === "snake" ? 110 : 1000 / 60);
    if(canvasElement) canvasElement.focus();
}
window.startActiveGame = startActiveGame;

function gameOver(silent = false) {
    isGameRunning = false; clearInterval(gameInterval);
    if(!silent) {
        playSound("hit"); alert("💥 Oyun Bitti! Skorun: " + score);
        skorKaydet(activeGame, score);
        let goldEarned = Math.floor(score / 5); if(goldEarned > 0) addGold(goldEarned);
    }
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
    let head = { x: snake[0].x + snakeDir.x, y: snake[0].y + snakeDir.y };
    if(head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20) return gameOver();
    for(let s of snake) { if(s.x === head.x && s.y === head.y) return gameOver(); }
    snake.unshift(head);
    if(head.x === food.x && head.y === food.y) { score += 10; scoreElement.innerText = score; playSound("eat"); generateFood(); } else { snake.pop(); }
    drawSnake();
}
function drawSnake() {
    const ctx = canvasElement.getContext("2d"); ctx.fillStyle = "#111"; ctx.fillRect(0,0,400,400);
    ctx.fillStyle = "#00e676"; for(let s of snake) ctx.fillRect(s.x*20, s.y*20, 18, 18);
    ctx.fillStyle = "#ff1744"; ctx.fillRect(food.x*20, food.y*20, 18, 18);
}

// --- BRICK ---
let ball = {x:200, y:300, dx:3, dy:-3, r:6}; let paddle = {x:160, w:80, h:10}; let bricks = [];
function initBrick() { ball = {x:200, y:300, dx:3, dy:-3, r:6}; paddle.x = 160; bricks = []; for(let r=0; r<4; r++) { for(let c=0; c<5; c++) { bricks.push({x: c*75 + 15, y: r*20 + 50, w:65, h:15, active:true}); } } }
function updateBrick() {
    if(isGameWaitingToStart) { drawBrick(); return; }
    ball.x += ball.dx; ball.y += ball.dy;
    if(ball.x - ball.r < 0 || ball.x + ball.r > 400) ball.dx *= -1; if(ball.y - ball.r < 0) ball.dy *= -1;
    if(ball.y + ball.r > 380) { if(ball.x > paddle.x && ball.x < paddle.x + paddle.w) { ball.dy *= -1; } else { return gameOver(); } }
    bricks.forEach(b => { if(b.active && ball.x > b.x && ball.x < b.x + b.w && ball.y > b.y && ball.y < b.y + b.h) { ball.dy *= -1; b.active = false; score += 20; scoreElement.innerText = score; } });
    drawBrick();
}
function drawBrick() {
    const ctx = canvasElement.getContext("2d"); ctx.fillStyle = "#111"; ctx.fillRect(0,0,400,400);
    ctx.fillStyle = "#00b0ff"; ctx.fillRect(paddle.x, 370, paddle.w, paddle.h);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
    bricks.forEach(b => { if(b.active) { ctx.fillStyle = "#ffca28"; ctx.fillRect(b.x, b.y, b.w, b.h); } });
}

// --- SPACE ---
let playerX = 180; let playerLasers = []; let enemies = []; let spaceWave = 1;
function initSpace() { playerX = 180; playerLasers = []; spawnSpaceEnemies(); }
function spawnSpaceEnemies() { enemies = []; for(let r=0; r<3; r++) { for(let c=0; c<6; c++) { enemies.push({x: c*55 + 40, y: r*30 + 50, w:35, h:20, hp: spaceWave}); } } }
function updateSpace() {
    playerLasers.forEach((l, i) => { l.y -= 6; if(l.y < 0) playerLasers.splice(i,1); });
    let desc = false;
    enemies.forEach((e) => {
        e.x += 1; if(e.x > 365 || e.x < 10) desc = true;
        playerLasers.forEach((l, li) => { if(l.x > e.x && l.x < e.x + e.w && l.y > e.y && l.y < e.y + e.h) { playerLasers.splice(li,1); e.hp--; score += 10; scoreElement.innerText = score; } });
    });
    if(desc) { enemies.forEach(e => { e.y += 10; e.x = e.x > 200 ? e.x - 10 : e.x + 10; }); }
    enemies = enemies.filter(e => e.hp > 0);
    if(enemies.length === 0) { spaceWave++; spawnSpaceEnemies(); score += 100; }
    for(let e of enemies) { if(e.y + e.h >= 360) return gameOver(); }
    drawSpace();
}
function drawSpace() {
    const ctx = canvasElement.getContext("2d"); ctx.fillStyle = "#050510"; ctx.fillRect(0,0,400,400);
    ctx.fillStyle = "#00e676"; ctx.fillRect(playerX, 360, 40, 20);
    ctx.fillStyle = "#ff1744"; playerLasers.forEach(l => ctx.fillRect(l.x, l.y, 4, 10));
    ctx.fillStyle = "#d500f9"; enemies.forEach(e => ctx.fillRect(e.x, e.y, e.w, e.h));
}

// --- FLAPPY ---
let bird = {y:200, v:0, g:0.4, j:-7}; let pipes = []; let pipeTimer = 0;
function initFlappy() { bird.y = 200; bird.v = 0; pipes = []; pipeTimer = 0; }
function updateFlappy() {
    if(isGameWaitingToStart) { drawFlappy(); return; } bird.v += bird.g; bird.y += bird.v; if(bird.y > 400 || bird.y < 0) return gameOver();
    pipeTimer++; if(pipeTimer % 90 === 0) { let h = Math.floor(Math.random()*150) + 50; pipes.push({x:400, top:h, bottom: 400 - h - 110, passed:false}); }
    pipes.forEach((p, i) => {
        p.x -= 3; if(p.x < -60) pipes.splice(i,1);
        if(!p.passed && p.x < 100) { p.passed = true; score += 1; scoreElement.innerText = score; }
        if(100 + 20 > p.x && 100 < p.x + 50) { if(bird.y < p.top || bird.y + 20 > 400 - p.bottom) return gameOver(); }
    });
    drawFlappy();
}
function drawFlappy() {
    const ctx = canvasElement.getContext("2d"); ctx.fillStyle = "#111"; ctx.fillRect(0,0,400,400);
    ctx.fillStyle = "#ffca28"; ctx.fillRect(100, bird.y, 24, 24);
    ctx.fillStyle = "#00b0ff"; pipes.forEach(p => { ctx.fillRect(p.x, 0, 50, p.top); ctx.fillRect(p.x, 400 - p.bottom, 50, p.bottom); });
}

// --- PONG ---
let pongBall = {x:200, y:200, dx:3, dy:2}; let p1Y = 150; let p2Y = 150;
function initPong() { pongBall = {x:200, y:200, dx:4, dy:2}; p1Y = 150; p2Y = 150; }
function updatePong() {
    if(isGameWaitingToStart) { drawPong(); return; }
    pongBall.x += pongBall.dx; pongBall.y += pongBall.dy; if(pongBall.y < 0 || pongBall.y > 390) pongBall.dy *= -1;
    let target = pongBall.y - 30; p2Y += (target - p2Y) * 0.08;
    if(pongBall.x < 25) { if(pongBall.y > p1Y && pongBall.y < p1Y + 70) { pongBall.dx *= -1.05; score += 5; scoreElement.innerText = score; } else { return gameOver(); } }
    if(pongBall.x > 370) { if(pongBall.y > p2Y && pongBall.y < p2Y + 70) { pongBall.dx *= -1; } else { score += 50; initPong(); } }
    drawPong();
}
function drawPong() {
    const ctx = canvasElement.getContext("2d"); ctx.fillStyle = "#111"; ctx.fillRect(0,0,400,400);
    ctx.fillStyle = "#ff1744"; ctx.fillRect(10, p1Y, 12, 70);
    ctx.fillStyle = "#00b0ff"; ctx.fillRect(380, p2Y, 12, 70);
    ctx.fillStyle = "#fff"; ctx.fillRect(pongBall.x, pongBall.y, 10, 10);
}

// --- BLOCK BLAST ---
let grid = Array(8).fill().map(() => Array(8).fill(0));
function initBlockBlast() { grid = Array(8).fill().map(() => Array(8).fill(0)); drawBlockBlast(); }
function drawBlockBlast() {
    const ctx = canvasElement.getContext("2d"); ctx.fillStyle = "#151515"; ctx.fillRect(0,0,400,400);
    for(let r=0; r<8; r++) { for(let col=0; col<8; col++) { ctx.strokeStyle = "#333"; ctx.strokeRect(col*45 + 20, r*45 + 20, 42, 42); } }
}

// --- DINO RUN ---
let dinoY = 0; let dinoV = 0; let obstacleX = 400;
function initDino() { dinoY = 0; dinoV = 0; obstacleX = 400; }
function updateDino() {
    dinoV -= 0.5; dinoY += dinoV; if(dinoY < 0) { dinoY = 0; dinoV = 0; }
    obstacleX -= 5; if(obstacleX < -20) { obstacleX = 400; score += 10; scoreElement.innerText = score; }
    if(obstacleX > 40 && obstacleX < 70 && dinoY < 30) return gameOver();
    drawDino();
}
function drawDino() {
    const ctx = canvasElement.getContext("2d"); ctx.fillStyle = "#111"; ctx.fillRect(0,0,400,400);
    ctx.fillStyle = "#00b0ff"; ctx.fillRect(40, 350 - dinoY, 30, 30);
    ctx.fillStyle = "#ff1744"; ctx.fillRect(obstacleX, 350, 20, 30);
}

// --- CATCH ---
let catcherX = 170; let star = {x:200, y:0};
function initCatch() { catcherX = 170; star = {x: Math.random()*360 + 20, y:0}; }
function updateCatch() {
    star.y += 4; if(star.y > 360 && star.x > catcherX && star.x < catcherX + 60) { score += 15; scoreElement.innerText = score; star = {x: Math.random()*360 + 20, y:0}; } else if(star.y > 400) return gameOver();
    drawCatch();
}
function drawCatch() {
    const ctx = canvasElement.getContext("2d"); ctx.fillStyle = "#0f0f1a"; ctx.fillRect(0,0,400,400);
    ctx.fillStyle = "#ffea00"; ctx.fillRect(star.x, star.y, 15, 15);
    ctx.fillStyle = "#00e676"; ctx.fillRect(catcherX, 370, 60, 15);
}

// --- XOX SINGLE PLAYER (AI) ---
let xoxBoard = Array(9).fill(""); 
let xoxTurn = "X";
function initXOX() { xoxBoard = Array(9).fill(""); xoxTurn = "X"; drawXOX(); }
function drawXOX() {
    const ctx = canvasElement.getContext("2d"); ctx.fillStyle = "#1e1e24"; ctx.fillRect(0,0,400,400);
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(133, 0); ctx.lineTo(133, 400); ctx.moveTo(266, 0); ctx.lineTo(266, 400); ctx.moveTo(0, 133); ctx.lineTo(400, 133); ctx.moveTo(0, 266); ctx.lineTo(400, 266); ctx.stroke();
    for(let i=0; i<9; i++) {
        let x = (i % 3) * 133 + 45; let y = Math.floor(i / 3) * 133 + 85; ctx.font = "bold 40px sans-serif";
        if(xoxBoard[i] === "X") { ctx.fillStyle = "#ff1744"; ctx.fillText("X", x, y); }
        else if(xoxBoard[i] === "O") { ctx.fillStyle = "#00b0ff"; ctx.fillText("O", x, y); }
    }
}
function checkXOXWinner() {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for(let l of lines) { if(xoxBoard[l[0]] && xoxBoard[l[0]] === xoxBoard[l[1]] && xoxBoard[l[0]] === xoxBoard[l[2]]) return xoxBoard[l[0]]; }
    if(xoxBoard.filter(b => b === "").length === 0) return "TIE"; return null;
}
function xoxClick(idx) {
    if(!isGameRunning || xoxBoard[idx] !== "" || xoxTurn !== "X") return;
    xoxBoard[idx] = "X"; drawXOX();
    let res = checkXOXWinner();
    if(res) { handleXOXEnd(res); return; }
    xoxTurn = "O"; setTimeout(xoxAI, 400);
}
function xoxAI() {
    let empties = []; xoxBoard.forEach((b,i)=>{if(b==="") empties.push(i);});
    if(empties.length > 0) { let move = empties[Math.floor(Math.random()*empties.length)]; xoxBoard[move] = "O"; drawXOX(); }
    let res = checkXOXWinner(); if(res) { handleXOXEnd(res); } else { xoxTurn = "X"; }
}
function handleXOXEnd(res) {
    isGameRunning = false; clearInterval(gameInterval);
    if(res === "X") { score += 100; scoreElement.innerText = score; alert("🎉 XOX Kazandın! +100 Puan"); skorKaydet("xox", score); addGold(20); }
    else if(res === "O") { alert("🤖 Yapay Zeka Kazandı!"); } else { alert("🏳️ Berabere!"); }
}

// ============================================================================
// --- 5. MOBİL BASILI TUTMA & HAREKET MEKANİZMASI ---
// ============================================================================
function handleMoveStart(dir) {
    if (!isGameRunning) return;
    if (isGameWaitingToStart) isGameWaitingToStart = false;

    if (activeGame === "snake") {
        if(dir === "up" && snakeDir.y !== 1) snakeDir = {x:0, y:-1};
        if(dir === "down" && snakeDir.y !== -1) snakeDir = {x:0, y:1};
        if(dir === "left" && snakeDir.x !== 1) snakeDir = {x:-1, y:0};
        if(dir === "right" && snakeDir.x !== -1) snakeDir = {x:1, y:0};
        return;
    }
    
    // Sürekli basılı tutma gerektiren oyunlar için döngü (Uzay Savaşı, Tuğla Kırma vb.)
    if (mobileIntervals[dir]) clearInterval(mobileIntervals[dir]);
    mobileIntervals[dir] = setInterval(() => {
        if (activeGame === "brick" || activeGame === "pong") {
            if (dir === "left" && paddle.x > 0) paddle.x -= 8;
            if (dir === "right" && paddle.x < 320) paddle.x += 8;
        }
        if (activeGame === "space") {
            if (dir === "left" && playerX > 10) playerX -= 7;
            if (dir === "right" && playerX < 350) playerX += 7;
        }
        if (activeGame === "catch") {
            if (dir === "left" && catcherX > 0) catcherX -= 8;
            if (dir === "right" && catcherX < 340) catcherX += 8;
        }
    }, 20);
}

function handleMoveEnd(dir) {
    if (mobileIntervals[dir]) { clearInterval(mobileIntervals[dir]); mobileIntervals[dir] = null; }
}

function fireOrJump() {
    if(!isGameRunning) return; if(isGameWaitingToStart) isGameWaitingToStart = false;
    if(activeGame === "space") playerLasers.push({x: playerX + 18, y: 350});
    if(activeGame === "flappy") bird.v = bird.j;
    if(activeGame === "dino" && dinoY === 0) dinoV = 11;
}

// ============================================================================
// --- 6. EVENT LISTENERS & BINDINGS ---
// ============================================================================
window.addEventListener("keydown", (e) => {
    if (!isGameRunning) return;
    if(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();

    if(activeGame === "snake") {
        if(e.key === "ArrowUp" && snakeDir.y !== 1) snakeDir = {x:0, y:-1};
        else if(e.key === "ArrowDown" && snakeDir.y !== -1) snakeDir = {x:0, y:1};
        else if(e.key === "ArrowLeft" && snakeDir.x !== 1) snakeDir = {x:-1, y:0};
        else if(e.key === "ArrowRight" && snakeDir.x !== -1) snakeDir = {x:1, y:0};
    }
    if(activeGame === "brick" || activeGame === "pong") {
        if(isGameWaitingToStart && e.code === "Space") isGameWaitingToStart = false;
        if(e.key === "ArrowLeft" && paddle.x > 0) paddle.x -= 20; if(e.key === "ArrowRight" && paddle.x < 320) paddle.x += 20;
    }
    if(activeGame === "space") {
        if(e.key === "ArrowLeft" && playerX > 10) playerX -= 15; if(e.key === "ArrowRight" && playerX < 350) playerX += 15;
        if(e.code === "Space") playerLasers.push({x: playerX + 18, y: 350});
    }
    if(activeGame === "flappy" && (e.code === "Space" || e.key === "ArrowUp")) { if(isGameWaitingToStart) isGameWaitingToStart = false; bird.v = bird.j; }
    if(activeGame === "dino" && (e.code === "Space" || e.key === "ArrowUp") && dinoY === 0) dinoV = 11;
    if(activeGame === "catch") { if(e.key === "ArrowLeft" && catcherX > 0) catcherX -= 20; if(e.key === "ArrowRight" && catcherX < 340) catcherX += 20; }
});

if (canvasElement) {
    canvasElement.addEventListener("click", (e) => {
        if (activeGame === "xox") {
            const rect = canvasElement.getBoundingClientRect();
            const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top;
            const col = Math.floor(mouseX / (rect.width / 3)); const row = Math.floor(mouseY / (rect.height / 3));
            xoxClick(row * 3 + col);
        } else { fireOrJump(); }
    });
}

// Mobil Butonları Dinamik Tetikleyicilere Bağlama
const btnMap = { btnUp: "up", btnDown: "down", btnLeft: "left", btnRight: "right" };
Object.keys(btnMap).forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener("touchstart", (e) => { e.preventDefault(); handleMoveStart(btnMap[id]); });
        el.addEventListener("touchend", (e) => { e.preventDefault(); handleMoveEnd(btnMap[id]); });
        el.addEventListener("mousedown", () => handleMoveStart(btnMap[id]));
        el.addEventListener("mouseup", () => handleMoveEnd(btnMap[id]));
    }
});

const actionBtn = document.getElementById("btnAction") || document.getElementById("mobileStartBtn");
if (actionBtn) {
    actionBtn.addEventListener("click", fireOrJump);
    actionBtn.addEventListener("touchstart", (e) => { e.preventDefault(); fireOrJump(); });
}

if(startBtn) startBtn.addEventListener("click", startActiveGame);
if(mobileStartBtn) mobileStartBtn.addEventListener("click", startActiveGame);

document.getElementById("selectSnake")?.addEventListener("click", () => switchGame("snake"));
document.getElementById("selectBrick")?.addEventListener("click", () => switchGame("brick"));
document.getElementById("selectSpace")?.addEventListener("click", () => switchGame("space"));
document.getElementById("selectFlappy")?.addEventListener("click", () => switchGame("flappy"));
document.getElementById("selectPong")?.addEventListener("click", () => switchGame("pong"));
document.getElementById("selectBlockblast")?.addEventListener("click", () => switchGame("blockblast"));
document.getElementById("selectDino")?.addEventListener("click", () => switchGame("dino"));
document.getElementById("selectCatch")?.addEventListener("click", () => switchGame("catch"));
document.getElementById("selectXox")?.addEventListener("click", () => switchGame("xox"));

switchGame("snake");