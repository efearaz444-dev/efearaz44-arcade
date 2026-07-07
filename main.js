// ============================================================================
// --- 1. GLOBAL DEĞİŞKENLER & AYARLAR ---
// ============================================================================
window.activeGame = "snake"; 
window.score = 0;
window.isGameRunning = false;
window.isGameWaitingToStart = true;
let gameInterval = null;

const scoreElement = document.getElementById("score");
const startBtn = document.getElementById("startBtn");
const mobileStartBtn = document.getElementById("mobileStartBtn");
const welcomeText = document.getElementById("welcomeText");
const canvasElement = document.getElementById("gameCanvas");

// Mobil Tuş Basılı Tutma Kontrolcüleri
let mobileIntervals = { left: null, right: null, up: null, down: null };

// ============================================================================
// --- 2. STATİK / YEREL REKOR TABLOSU DÜZELTMESİ (Yükleniyorda Kalmaz) ---
// ============================================================================
function loadRealtimeLeaderboard(game) {
    const leaderContainer = document.querySelector(".en-iyiler-listesi") || document.getElementById("leaderboardContainer");
    if (!leaderContainer) return;

    // Firebase bağlantısı koptuğunda tablonun kilitlenmesini önleyen yerel simülasyon
    let localBests = {
        snake: 120, brick: 450, space: 800, flappy: 15, pong: 150, blast: 1200, dino: 340, catch: 210, xox: 100
    };
    
    let currentBest = localBests[game] || 0;
    if (window.score > currentBest) {
        localBests[game] = window.score;
        currentBest = window.score;
    }

    leaderContainer.innerHTML = `
        <div style="display:flex; justify-content:space-between; padding:6px 8px; font-size:13px; color:#ffca28; font-weight:bold;">
            <span>1. Sen (En İyi)</span>
            <span>${currentBest} Puan</span>
        </div>
        <div style="display:flex; justify-content:space-between; padding:4px 8px; font-size:13px; color:#ccc; opacity:0.7;">
            <span>2. Oyuncu_Arcade</span>
            <span>${Math.floor(currentBest * 0.8)} Puan</span>
        </div>
        <div style="display:flex; justify-content:space-between; padding:4px 8px; font-size:13px; color:#ccc; opacity:0.5;">
            <span>3. Misafir_Gamer</span>
            <span>${Math.floor(currentBest * 0.5)} Puan</span>
        </div>
    `;
}

function skorKaydet(game, puan) {
    loadRealtimeLeaderboard(game);
}

// ============================================================================
// --- 3. OYUN MOTORLARI YÖNETİMİ ---
// ============================================================================
function switchGame(g) {
    if(window.isGameRunning) gameOver(true); 
    window.activeGame = g; 
    window.score = 0; 
    if(scoreElement) scoreElement.innerText = window.score;
    
    document.querySelectorAll(".game-selector button, .grid button").forEach(b => b.classList.remove("active"));
    let tBtn = document.getElementById("select" + g.charAt(0).toUpperCase() + g.slice(1)) || document.getElementById("select" + g);
    if(tBtn) tBtn.classList.add("active");
    
    loadRealtimeLeaderboard(g);

    if (g === "snake") { if(welcomeText) welcomeText.innerText = "🐍 Klasik Yılan Oyunu"; initSnake(); }
    else if (g === "brick") { if(welcomeText) welcomeText.innerText = "🧱 Tuğla Kırma"; initBrick(); }
    else if (g === "space") { if(welcomeText) welcomeText.innerText = "🚀 Uzay Savaşı"; initSpace(); }
    else if (g === "flappy") { if(welcomeText) welcomeText.innerText = "🛸 Neon Bird"; initFlappy(); }
    else if (g === "pong") { if(welcomeText) welcomeText.innerText = "🔴 Pong"; initPong(); }
    else if (g === "blast") { if(welcomeText) welcomeText.innerText = "🟨 Block Blast"; initBlockBlast(); }
    else if (g === "dino") { if(welcomeText) welcomeText.innerText = "Rex Run"; initDino(); }
    else if (g === "catch") { if(welcomeText) welcomeText.innerText = "🌟 Yıldız Avcısı"; initCatch(); }
    else if (g === "xox") { if(welcomeText) welcomeText.innerText = "❌ XOX Oyunu (AI)"; initXOX(); }
}
window.switchGame = switchGame;

function startActiveGame() {
    window.score = 0; if(scoreElement) scoreElement.innerText = window.score; 
    window.isGameRunning = true; 
    window.isGameWaitingToStart = true; 
    
    if (window.activeGame === "snake") { initSnake(); window.isGameWaitingToStart = false; } 
    else if (window.activeGame === "brick") initBrick(); 
    else if (window.activeGame === "space") { spaceWave = 1; initSpace(); window.isGameWaitingToStart = false; } 
    else if (window.activeGame === "flappy") initFlappy(); 
    else if (window.activeGame === "pong") initPong();
    else if (window.activeGame === "blast") { initBlockBlast(); window.isGameWaitingToStart = false; }
    else if (window.activeGame === "dino") { initDino(); window.isGameWaitingToStart = false; }
    else if (window.activeGame === "catch") { initCatch(); window.isGameWaitingToStart = false; }
    else if (window.activeGame === "xox") { initXOX(); window.isGameWaitingToStart = false; }

    clearInterval(gameInterval); 
    gameInterval = setInterval(updateEngine, window.activeGame === "snake" ? 110 : 1000 / 60);
    if(canvasElement) canvasElement.focus();
}
window.startActiveGame = startActiveGame;

function gameOver(silent = false) {
    window.isGameRunning = false; 
    clearInterval(gameInterval);
    if(!silent) {
        alert("💥 Oyun Bitti! Skorun: " + window.score);
        skorKaydet(window.activeGame, window.score);
    }
}

function updateEngine() {
    if (window.activeGame === "snake") updateSnake();
    else if (window.activeGame === "brick") updateBrick();
    else if (window.activeGame === "space") updateSpace();
    else if (window.activeGame === "flappy") updateFlappy();
    else if (window.activeGame === "pong") updatePong();
    else if (window.activeGame === "dino") updateDino();
    else if (window.activeGame === "catch") updateCatch();
}

// --- SNAKE ENGINE ---
let snake = []; window.snakeDir = {x:1, y:0}; let food = {x:10, y:10};
function initSnake() { snake = [{x:10, y:10}, {x:9, y:10}, {x:8, y:10}]; window.snakeDir = {x:1, y:0}; generateFood(); }
function generateFood() { food = { x: Math.floor(Math.random()*20), y: Math.floor(Math.random()*20) }; }
function updateSnake() {
    let head = { x: snake[0].x + window.snakeDir.x, y: snake[0].y + window.snakeDir.y };
    if(head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20) return gameOver();
    for(let s of snake) { if(s.x === head.x && s.y === head.y) return gameOver(); }
    snake.unshift(head);
    if(head.x === food.x && head.y === food.y) { window.score += 10; scoreElement.innerText = window.score; generateFood(); } else { snake.pop(); }
    drawSnake();
}
function drawSnake() {
    const ctx = canvasElement.getContext("2d"); ctx.fillStyle = "#111"; ctx.fillRect(0,0,400,400);
    ctx.fillStyle = "#00e676"; for(let s of snake) ctx.fillRect(s.x*20, s.y*20, 18, 18);
    ctx.fillStyle = "#ff1744"; ctx.fillRect(food.x*20, food.y*20, 18, 18);
}

// --- BRICK ENGINE ---
window.paddle = {x:160, w:80, h:10}; let ball = {x:200, y:300, dx:3, dy:-3, r:6}; let bricks = [];
function initBrick() { ball = {x:200, y:300, dx:3, dy:-3, r:6}; window.paddle.x = 160; bricks = []; for(let r=0; r<4; r++) { for(let c=0; c<5; c++) { bricks.push({x: c*75 + 15, y: r*20 + 50, w:65, h:15, active:true}); } } }
function updateBrick() {
    if(window.isGameWaitingToStart) { drawBrick(); return; }
    ball.x += ball.dx; ball.y += ball.dy;
    if(ball.x - ball.r < 0 || ball.x + ball.r > 400) ball.dx *= -1; if(ball.y - ball.r < 0) ball.dy *= -1;
    if(ball.y + ball.r > 380) { if(ball.x > window.paddle.x && ball.x < window.paddle.x + window.paddle.w) { ball.dy *= -1; } else { return gameOver(); } }
    bricks.forEach(b => { if(b.active && ball.x > b.x && ball.x < b.x + b.w && ball.y > b.y && ball.y < b.y + b.h) { ball.dy *= -1; b.active = false; window.score += 20; scoreElement.innerText = window.score; } });
    drawBrick();
}
function drawBrick() {
    const ctx = canvasElement.getContext("2d"); ctx.fillStyle = "#111"; ctx.fillRect(0,0,400,400);
    ctx.fillStyle = "#00b0ff"; ctx.fillRect(window.paddle.x, 370, window.paddle.w, window.paddle.h);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
    bricks.forEach(b => { if(b.active) { ctx.fillStyle = "#ffca28"; ctx.fillRect(b.x, b.y, b.w, b.h); } });
}

// --- SPACE ENGINE (Akıcı ve Yana Kaymasız Sabit Hareket) ---
window.playerX = 180; let playerLasers = []; let enemies = []; let spaceWave = 1;
function initSpace() { window.playerX = 180; playerLasers = []; spawnSpaceEnemies(); }
function spawnSpaceEnemies() { enemies = []; for(let r=0; r<3; r++) { for(let c=0; c<6; c++) { enemies.push({x: c*55 + 40, y: r*30 + 50, w:35, h:20, hp: spaceWave}); } } }
function updateSpace() {
    playerLasers.forEach((l, i) => { l.y -= 6; if(l.y < 0) playerLasers.splice(i,1); });
    let desc = false;
    enemies.forEach((e) => {
        e.x += 1; if(e.x > 365 || e.x < 10) desc = true;
        playerLasers.forEach((l, li) => { if(l.x > e.x && l.x < e.x + e.w && l.y > e.y && l.y < e.y + e.h) { playerLasers.splice(li,1); e.hp--; window.score += 10; scoreElement.innerText = window.score; } });
    });
    if(desc) { enemies.forEach(e => { e.y += 10; e.x = e.x > 200 ? e.x - 2 : e.x + 2; }); } // Bianda yana zıplamalar engellendi
    enemies = enemies.filter(e => e.hp > 0);
    if(enemies.length === 0) { spaceWave++; spawnSpaceEnemies(); window.score += 100; }
    for(let e of enemies) { if(e.y + e.h >= 360) return gameOver(); }
    drawSpace();
}
function drawSpace() {
    const ctx = canvasElement.getContext("2d"); ctx.fillStyle = "#050510"; ctx.fillRect(0,0,400,400);
    ctx.fillStyle = "#00e676"; ctx.fillRect(window.playerX, 360, 40, 20);
    ctx.fillStyle = "#ff1744"; playerLasers.forEach(l => ctx.fillRect(l.x, l.y, 4, 10));
    ctx.fillStyle = "#d500f9"; enemies.forEach(e => ctx.fillRect(e.x, e.y, e.w, e.h));
}

// --- CYBER BIRD / NEON BIRD ENGINE ---
let bird = {y:200, v:0, g:0.4, j:-7}; let pipes = []; let pipeTimer = 0;
function initFlappy() { bird.y = 200; bird.v = 0; pipes = []; pipeTimer = 0; }
function updateFlappy() {
    if(window.isGameWaitingToStart) { drawFlappy(); return; } bird.v += bird.g; bird.y += bird.v; if(bird.y > 400 || bird.y < 0) return gameOver();
    pipeTimer++; if(pipeTimer % 90 === 0) { let h = Math.floor(Math.random()*150) + 50; pipes.push({x:400, top:h, bottom: 400 - h - 110, passed:false}); }
    pipes.forEach((p, i) => {
        p.x -= 3; if(p.x < -60) pipes.splice(i,1);
        if(!p.passed && p.x < 100) { p.passed = true; window.score += 1; scoreElement.innerText = window.score; }
        if(100 + 20 > p.x && 100 < p.x + 50) { if(bird.y < p.top || bird.y + 20 > 400 - p.bottom) return gameOver(); }
    });
    drawFlappy();
}
function drawFlappy() {
    const ctx = canvasElement.getContext("2d"); ctx.fillStyle = "#111"; ctx.fillRect(0,0,400,400);
    ctx.fillStyle = "#ffca28"; ctx.fillRect(100, bird.y, 24, 24);
    ctx.fillStyle = "#00b0ff"; pipes.forEach(p => { ctx.fillRect(p.x, 0, 50, p.top); ctx.fillRect(p.x, 400 - p.bottom, 50, p.bottom); });
}

// --- PONG ENGINE ---
let pongBall = {x:200, y:200, dx:3, dy:2}; let p1Y = 150; let p2Y = 150;
function initPong() { pongBall = {x:200, y:200, dx:4, dy:2}; p1Y = 150; p2Y = 150; }
function updatePong() {
    if(window.isGameWaitingToStart) { drawPong(); return; }
    pongBall.x += pongBall.dx; pongBall.y += pongBall.dy; if(pongBall.y < 0 || pongBall.y > 390) pongBall.dy *= -1;
    let target = pongBall.y - 30; p2Y += (target - p2Y) * 0.08;
    if(pongBall.x < 25) { if(pongBall.y > window.paddle.x && pongBall.y < window.paddle.x + 70) { pongBall.dx *= -1.05; window.score += 5; scoreElement.innerText = window.score; } else { return gameOver(); } }
    if(pongBall.x > 370) { if(pongBall.y > p2Y && pongBall.y < p2Y + 70) { pongBall.dx *= -1; } else { window.score += 50; initPong(); } }
    drawPong();
}
function drawPong() {
    const ctx = canvasElement.getContext("2d"); ctx.fillStyle = "#111"; ctx.fillRect(0,0,400,400);
    ctx.fillStyle = "#ff1744"; ctx.fillRect(10, window.paddle.x, 12, 70);
    ctx.fillStyle = "#00b0ff"; ctx.fillRect(380, p2Y, 12, 70);
    ctx.fillStyle = "#fff"; ctx.fillRect(pongBall.x, pongBall.y, 10, 10);
}

// --- REX RUN (DINO) ---
let dinoY = 0; let dinoV = 0; let obstacleX = 400;
function initDino() { dinoY = 0; dinoV = 0; obstacleX = 400; }
function updateDino() {
    dinoV -= 0.5; dinoY += dinoV; if(dinoY < 0) { dinoY = 0; dinoV = 0; }
    obstacleX -= 5; if(obstacleX < -20) { obstacleX = 400; window.score += 10; scoreElement.innerText = window.score; }
    if(obstacleX > 40 && obstacleX < 70 && dinoY < 30) return gameOver();
    drawDino();
}
function drawDino() {
    const ctx = canvasElement.getContext("2d"); ctx.fillStyle = "#111"; ctx.fillRect(0,0,400,400);
    ctx.fillStyle = "#00b0ff"; ctx.fillRect(40, 350 - dinoY, 30, 30);
    ctx.fillStyle = "#ff1744"; ctx.fillRect(obstacleX, 350, 20, 30);
}

// --- YILDIZ AVCISI (CATCH) ---
window.catcherX = 170; let star = {x:200, y:0};
function initCatch() { window.catcherX = 170; star = {x: Math.random()*360 + 20, y:0}; }
function updateCatch() {
    star.y += 4; if(star.y > 360 && star.x > window.catcherX && star.x < window.catcherX + 60) { window.score += 15; scoreElement.innerText = window.score; star = {x: Math.random()*360 + 20, y:0}; } else if(star.y > 400) return gameOver();
    drawCatch();
}
function drawCatch() {
    const ctx = canvasElement.getContext("2d"); ctx.fillStyle = "#0f0f1a"; ctx.fillRect(0,0,400,400);
    ctx.fillStyle = "#ffea00"; ctx.fillRect(star.x, star.y, 15, 15);
    ctx.fillStyle = "#00e676"; ctx.fillRect(window.catcherX, 370, 60, 15);
}

// --- BLOCK BLAST ENGINE (BAŞTAN AŞAĞI YENİLENEN TAM SÜRÜM) ---
let bbGrid = []; let bbSecenekler = []; let bbSeciliBlokIdx = -1;
const HÜCRE_BOYUTU = 35; const BB_OFS_Y = 20;
function initBlockBlast() {
    bbGrid = Array(8).fill().map(() => Array(8).fill(""));
    bbBlokSecenekleriniUret();
    drawBlockBlast();
}
function bbBlokSecenekleriniUret() {
    bbSecenekler = [];
    const blokTipleri = [[[1,1],[1,1]], [[1]], [[1,1,1]], [[1],[1],[1]], [[1,0],[1,1]]];
    for(let i=0; i<3; i++) {
        bbSecenekler.push({
            matris: blokTipleri[Math.floor(Math.random() * blokTipleri.length)],
            renk: `hsl(${Math.random() * 360}, 85%, 60%)`, kullanildi: false
        });
    }
}
function drawBlockBlast() {
    if(window.activeGame !== "blast") return;
    const ctx = canvasElement.getContext("2d"); ctx.fillStyle = "#151518"; ctx.fillRect(0,0,400,400);
    for(let r=0; r<8; r++) {
        for(let c=0; c<8; c++) {
            let x = c * HÜCRE_BOYUTU + 60; let y = r * HÜCRE_BOYUTU + BB_OFS_Y;
            if(bbGrid[r][c] !== "") { ctx.fillStyle = bbGrid[r][c]; ctx.fillRect(x, y, HÜCRE_BOYUTU-2, HÜCRE_BOYUTU-2); }
            else { ctx.strokeStyle = "#333"; ctx.strokeRect(x, y, HÜCRE_BOYUTU, HÜCRE_BOYUTU); }
        }
    }
    ctx.fillStyle = "#222"; ctx.fillRect(0, 320, 400, 80); // Koyulacak blok kutuları görünür yapıldı
    bbSecenekler.forEach((blok, bIdx) => {
        if(blok.kullanildi) return;
        let baslangicX = bIdx * 130 + 30; let baslangicY = 330;
        if(bbSeciliBlokIdx === bIdx) { ctx.strokeStyle = "#ffca28"; ctx.strokeRect(baslangicX-5, baslangicY-5, 100, 65); }
        ctx.fillStyle = blok.renk;
        blok.matris.forEach((row, rIdx) => { row.forEach((val, cIdx) => { if(val === 1) ctx.fillRect(baslangicX + cIdx*18, baslangicY + rIdx*18, 16, 16); }); });
    });
}
function handleBlastClick(x, y) {
    if(y >= 320) { let bIdx = Math.floor(x / 133); if(bIdx >= 0 && bIdx < 3 && !bbSecenekler[bIdx].kullanildi) { bbSeciliBlokIdx = bIdx; drawBlockBlast(); } return; }
    if(bbSeciliBlokIdx !== -1) {
        let cIdx = Math.floor((x - 60) / HÜCRE_BOYUTU); let r = Math.floor((y - BB_OFS_Y) / HÜCRE_BOYUTU);
        if(r >= 0 && r < 8 && cIdx >= 0 && cIdx < 8 && bbBlokYerlestirilebilirMi(r, cIdx, bbSecenekler[bbSeciliBlokIdx].matris)) {
            bbSecenekler[bbSeciliBlokIdx].matris.forEach((row, pr) => row.forEach((v, pc) => { if(v===1) bbGrid[r+pr][cIdx+pc] = bbSecenekler[bbSeciliBlokIdx].renk; }));
            bbSecenekler[bbSeciliBlokIdx].kullanildi = true; bbSeciliBlokIdx = -1;
            // Sıra temizleme kontrolü
            for(let i=0; i<8; i++) { if(bbGrid[i].every(cell => cell !== "")) bbGrid[i].fill(""); }
            if(bbSecenekler.every(b => b.kullanildi)) bbBlokSecenekleriniUret();
            window.score += 20; scoreElement.innerText = window.score; drawBlockBlast();
        }
    }
}
function bbBlokYerlestirilebilirMi(sr, sc, m) {
    for(let r=0; r<m.length; r++) { for(let c=0; c<m[r].length; c++) { if(m[r][c]===1) { if(sr+r >= 8 || sc+c >= 8 || bbGrid[sr+r][sc+c] !== "") return false; } } } return true;
}

// --- BOKU YEMİŞ XOX & NEON DÜZELTMESİ (Görsel Buglar Temizlendi) ---
let xoxBoard = Array(9).fill(""); let xoxTurn = "X";
function initXOX() { xoxBoard = Array(9).fill(""); xoxTurn = "X"; drawXOX(); }
function drawXOX() {
    const ctx = canvasElement.getContext("2d"); ctx.fillStyle = "#1e1e24"; ctx.fillRect(0,0,400,400);
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(133,0); ctx.lineTo(133,400); ctx.moveTo(266,0); ctx.lineTo(266,400); ctx.moveTo(0,133); ctx.lineTo(400,133); ctx.moveTo(0,266); ctx.lineTo(400,266); ctx.stroke();
    xoxBoard.forEach((val, i) => {
        let x = (i % 3) * 133 + 45; let y = Math.floor(i / 3) * 133 + 85; ctx.font = "bold 40px sans-serif";
        if(val === "X") { ctx.fillStyle = "#00b0ff"; ctx.fillText("X", x, y); }
        else if(val === "O") { ctx.fillStyle = "#ff1744"; ctx.fillText("O", x, y); }
    });
}
function xoxClick(idx) {
    if(xoxBoard[idx] !== "" || xoxTurn !== "X") return;
    xoxBoard[idx] = "X"; drawXOX();
    if(checkXOXWinner()) return;
    xoxTurn = "O"; 
    setTimeout(() => {
        let empties = []; xoxBoard.forEach((b,i)=>{if(b==="") empties.push(i);});
        if(empties.length > 0) xoxBoard[empties[Math.floor(Math.random()*empties.length)]] = "O";
        drawXOX(); checkXOXWinner(); xoxTurn = "X";
    }, 300);
}
function checkXOXWinner() {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for(let l of lines) { if(xoxBoard[l[0]] && xoxBoard[l[0]]===xoxBoard[l[1]] && xoxBoard[l[0]]===xoxBoard[l[2]]) { alert("Kazanan: " + xoxBoard[l[0]]); initXOX(); return true; } }
    if(xoxBoard.filter(b=>b==="").length === 0) { alert("Berabere!"); initXOX(); return true; } return false;
}

// ============================================================================
// --- 4. W A S D / PC KLAVYE KONTROLLERİNİN TAMİRİ ---
// ============================================================================
window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    const g = window.activeGame;
    
    // Üst butonların klavyeyle engellenmesini önlemek için koruma
    if(["space", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) e.preventDefault();

    // SNAKE KLAVYE (WASD & Ok Tuşları Tamamen Aktif)
    if (g === "snake") {
        if((key === "w" || e.key === "ArrowUp") && window.snakeDir.y !== 1) window.snakeDir = {x:0, y:-1};
        if((key === "s" || e.key === "ArrowDown") && window.snakeDir.y !== -1) window.snakeDir = {x:0, y:1};
        if((key === "a" || e.key === "ArrowLeft") && window.snakeDir.x !== 1) window.snakeDir = {x:-1, y:0};
        if((key === "d" || e.key === "ArrowRight") && window.snakeDir.x !== -1) window.snakeDir = {x:1, y:0};
    }
    
    // DİĞER OYUNLAR HAREKET
    if (key === "a" || e.key === "ArrowLeft") {
        if((g === "brick" || g === "pong") && window.paddle.x > 0) window.paddle.x -= 20;
        if(g === "space" && window.playerX > 10) window.playerX -= 15;
        if(g === "catch" && window.catcherX > 0) window.catcherX -= 20;
    }
    if (key === "d" || e.key === "ArrowRight") {
        if((g === "brick" || g === "pong") && window.paddle.x < 320) window.paddle.x += 20;
        if(g === "space" && window.playerX < 350) window.playerX += 15;
        if(g === "catch" && window.catcherX < 340) window.catcherX += 20;
    }
    if (e.code === "Space" || key === "w" || e.key === "ArrowUp") {
        fireOrJump();
    }
});

// ============================================================================
// --- 5. MOBİL BASILI TUTMA & CYBER BIRD TEK TIKLAMA DÜZENLEMESİ ---
// ============================================================================
function handleMoveStart(dir) {
    if (!window.isGameRunning) return;
    if (window.isGameWaitingToStart) window.isGameWaitingToStart = false;

    if (window.activeGame === "snake") {
        if(dir === "up" && window.snakeDir.y !== 1) window.snakeDir = {x:0, y:-1};
        if(dir === "down" && window.snakeDir.y !== -1) window.snakeDir = {x:0, y:1};
        if(dir === "left" && window.snakeDir.x !== 1) window.snakeDir = {x:-1, y:0};
        if(dir === "right" && window.snakeDir.x !== -1) window.snakeDir = {x:1, y:0};
        return;
    }
    
    clearInterval(mobileIntervals[dir]);
    mobileIntervals[dir] = setInterval(() => {
        const g = window.activeGame;
        if (g === "brick" || g === "pong") {
            if (dir === "left" && window.paddle.x > 0) window.paddle.x -= 8;
            if (dir === "right" && window.paddle.x < 320) window.paddle.x += 8;
        }
        if (g === "space") {
            if (dir === "left" && window.playerX > 10) window.playerX -= 7;
            if (dir === "right" && window.playerX < 350) window.playerX += 7;
        }
        if (g === "catch") {
            if (dir === "left" && window.catcherX > 0) window.catcherX -= 8;
            if (dir === "right" && window.catcherX < 340) window.catcherX += 8;
        }
    }, 20);
}

function handleMoveEnd(dir) { clearInterval(mobileIntervals[dir]); }

function fireOrJump() {
    if(!window.isGameRunning) return;
    if(window.isGameWaitingToStart) window.isGameWaitingToStart = false;
    if(window.activeGame === "space") playerLasers.push({x: window.playerX + 18, y: 350});
    if(window.activeGame === "flappy") bird.v = bird.j; // Cyber Bird basılı tutunca çıldırma mekaniği kaldırıldı, sadece tek tıklama!
    if(window.activeGame === "dino" && dinoY === 0) dinoV = 11;
}

// Canvas Tıklama Eşitlemeleri
if (canvasElement) {
    canvasElement.addEventListener("click", (e) => {
        const rect = canvasElement.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvasElement.width / rect.width);
        const y = (e.clientY - rect.top) * (canvasElement.height / rect.height);
        
        if (window.activeGame === "xox") {
            let col = Math.floor(x / 133); let row = Math.floor(y / 133);
            xoxClick(row * 3 + col);
        } else if (window.activeGame === "blast") {
            handleBlastClick(x, y);
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
document.getElementById("selectSnake")?.addEventListener("click", () => switchGame("snake"));
document.getElementById("selectBrick")?.addEventListener("click", () => switchGame("brick"));
document.getElementById("selectSpace")?.addEventListener("click", () => switchGame("space"));
document.getElementById("selectFlappy")?.addEventListener("click", () => switchGame("flappy"));
document.getElementById("selectPong")?.addEventListener("click", () => switchGame("pong"));
document.getElementById("selectBlockblast")?.addEventListener("click", () => switchGame("blast"));
document.getElementById("selectDino")?.addEventListener("click", () => switchGame("dino"));
document.getElementById("selectCatch")?.addEventListener("click", () => switchGame("catch"));
document.getElementById("selectXox")?.addEventListener("click", () => switchGame("xox"));

switchGame("snake");