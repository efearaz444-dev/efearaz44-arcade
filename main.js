// ============================================================================
// --- SİSTEM VE SES MOTORU VE GLOBAL DEĞİŞKENLER ---
// ============================================================================
let audioCtx = null; let bgmInterval = null; let isMusicPlaying = false;
const canvas = document.getElementById("gameCanvas"); const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score"); const startBtn = document.getElementById("startBtn");
const mobileStartBtn = document.getElementById("mobileStartBtn"); const nameModal = document.getElementById("nameModal");
const usernameInput = document.getElementById("usernameInput"); const saveNameBtn = document.getElementById("saveNameBtn");
const welcomeText = document.getElementById("welcomeText"); const totalGoldElement = document.getElementById("totalGold");
const shopPanel = document.getElementById("shopPanel");

const allTimeBestCtx = document.getElementById("allTimeBest"); const snakeBestCtx = document.getElementById("snakeBest");
const brickBestCtx = document.getElementById("brickBest"); const spaceBestCtx = document.getElementById("spaceBest");
const flappyBestCtx = document.getElementById("flappyBest"); const pongBestCtx = document.getElementById("pongBest");
const mPanel = document.getElementById("multiplayerPanel");

let activeGame = "snake"; let score = 0; let gameInterval; let isGameRunning = false; let isGameWaitingToStart = false; const gridSize = 20;
let currentPlayer = ""; let totalGold = parseInt(localStorage.getItem("arc_gold")) || 0;
let ownedSkins = JSON.parse(localStorage.getItem("arc_skins")) || ["classic"]; let currentSkin = localStorage.getItem("arc_current_skin") || "classic";
let arcadeScores = JSON.parse(localStorage.getItem("arc_scores")) || { snake: 0, brick: 0, space: 0, flappy: 0, pong: 0, allTimePlayer: "" };

let snake = []; let food = {x:0, y:0}; let dx = gridSize, dy = 0;
let paddle = { x: 160, y: 370, width: 90, height: 12, speed: 14 }; let ball = { x: 200, y: 200, radius: 7, dx: 4, dy: -4 }; let bricks = [];
let playerShip = { x: 180, y: 360, width: 40, height: 20, speed: 9 }; let playerLasers = []; let invaders = []; let invaderDirection = 1; let spaceWave = 1;
let bird = { x: 50, y: 150, velocity: 0, gravity: 0.5, jump: -7, radius: 10 }; let pipes = [];
let pongPad = { y: 160, width: 10, height: 80, speed: 8 }; let aiPad = { y: 160, width: 10, height: 80, speed: 3.5 }; let pongBall = { x: 200, y: 200, dx: 4, dy: 3 };

let keysPressed = {};
window.addEventListener("keydown", e => { keysPressed[e.key] = true; initAudio(); if(isGameWaitingToStart && isGameRunning) { isGameWaitingToStart = false; } });
window.addEventListener("keyup", e => { keysPressed[e.key] = false; });

function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function playSound(type) {
    if (!audioCtx) return;
    try {
        let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain(); osc.connect(gain); gain.connect(audioCtx.destination);
        if (type === "dink") { osc.frequency.setValueAtTime(440, audioCtx.currentTime); gain.gain.setValueAtTime(0.1, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1); osc.start(); osc.stop(audioCtx.currentTime + 0.1); }
        else if (type === "laser") { osc.frequency.setValueAtTime(880, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.15); gain.gain.setValueAtTime(0.08, audioCtx.currentTime); osc.start(); osc.stop(audioCtx.currentTime + 0.15); }
        else if (type === "boom") { osc.type = "sawtooth"; osc.frequency.setValueAtTime(150, audioCtx.currentTime); osc.frequency.linearRampToValueAtTime(40, audioCtx.currentTime + 0.3); gain.gain.setValueAtTime(0.2, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3); osc.start(); osc.stop(audioCtx.currentTime + 0.3); }
        else if (type === "coin") { osc.frequency.setValueAtTime(587, audioCtx.currentTime); osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); gain.gain.setValueAtTime(0.1, audioCtx.currentTime); osc.start(); osc.stop(audioCtx.currentTime + 0.2); }
    } catch(e) {}
}

function toggleBGM() {
    initAudio();
    if (isMusicPlaying) { clearInterval(bgmInterval); isMusicPlaying = false; if(document.getElementById("bgmBtn")) document.getElementById("bgmBtn").innerText = "🔊 Müzik Aç"; }
    else {
        isMusicPlaying = true; if(document.getElementById("bgmBtn")) document.getElementById("bgmBtn").innerText = "🔇 Müzik Kapat";
        bgmInterval = setInterval(() => {
            try {
                let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain(); osc.connect(gain); gain.connect(audioCtx.destination);
                let notes = [110, 130, 146, 165]; let randomNote = notes[Math.floor(Math.random() * notes.length)];
                osc.frequency.setValueAtTime(randomNote, audioCtx.currentTime); gain.gain.setValueAtTime(0.04, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4); osc.start(); osc.stop(audioCtx.currentTime + 0.4);
            } catch(e){}
        }, 500);
    }
}

// ============================================================================
// --- MENÜ VE BAŞLANGIÇ YÖNETİMİ ---
// ============================================================================
window.onload = function() {
    updateGoldUI(); updateLeaderboardUI(); updateShopUI();
    const savedName = localStorage.getItem("arc_username");
    if (savedName) { currentPlayer = savedName; if(nameModal) nameModal.style.display = "none"; if(welcomeText) welcomeText.innerText = "🎮 Efearaz44 Arcade'e Hoş geldin!"; }
    if(document.getElementById("bgmBtn")) document.getElementById("bgmBtn").addEventListener("click", toggleBGM);
    if(document.getElementById("selectSnake")) document.getElementById("selectSnake").addEventListener("click", () => switchGame("snake"));
    if(document.getElementById("selectBrick")) document.getElementById("selectBrick").addEventListener("click", () => switchGame("brick"));
    if(document.getElementById("selectSpace")) document.getElementById("selectSpace").addEventListener("click", () => switchGame("space"));
    if(document.getElementById("selectFlappy")) document.getElementById("selectFlappy").addEventListener("click", () => switchGame("flappy"));
    if(document.getElementById("selectPong")) document.getElementById("selectPong").addEventListener("click", () => switchGame("pong"));
    if(document.getElementById("selectMulti")) document.getElementById("selectMulti").addEventListener("click", () => switchGame("multi"));
    if(document.getElementById("shopBtn")) document.getElementById("shopBtn").addEventListener("click", () => { if(shopPanel) shopPanel.classList.toggle("hidden"); });
    if(startBtn) startBtn.addEventListener("click", startActiveGame); if(mobileStartBtn) mobileStartBtn.addEventListener("click", startActiveGame);
    switchGame("snake");
};

if(saveNameBtn) {
    saveNameBtn.addEventListener("click", () => {
        let name = usernameInput.value.trim(); if (!name) return alert("Geçerli bir isim yazmalısın!");
        const yasakliKelimeler = ["31", "otuzbir", "otuz bir", "otuz-bir", "o31", "otuz1", "piç", "pic", "sik", "sg", "sktir", "siktir", "orospu", "orspu", "oç", "oc", "göt", "got", "gto", "amk", "aq", "amq", "am", "yarrak", "yarak", "fuck", "bitch", "sikiş", "sikis", "meme", "daşşak", "dassak", "taşşak", "pezevenk", "pznk", "ibne", "ipne", "orospu cocugu", "orospu çocuğu", "şerefsiz", "serefsiz", "salak", "gerizekalı", "gerizekali", "mal"]; 
        const kontrolIsmi = name.toLowerCase().replace(/\s+/g, ''); const yasakliBulundu = yasakliKelimeler.some(kelime => { const temizKelime = kelime.toLowerCase().replace(/\s+/g, ''); return kontrolIsmi.includes(temizKelime); });
        if (yasakliBulundu) { alert("Lütfen düzgün bir kullanıcı adı giriniz! 🚫"); usernameInput.value = ""; return; }
        currentPlayer = name; localStorage.setItem("arc_username", name); if(nameModal) nameModal.style.display = "none"; if(welcomeText) welcomeText.innerText = `🎮 Hoş geldin, ${currentPlayer}!`;
    });
}

function switchGame(g) {
    if(isGameRunning) gameOver(); activeGame = g; score = 0; if(scoreElement) scoreElement.innerText = score; if(mPanel) mPanel.classList.add("hidden");
    document.querySelectorAll(".game-selector button").forEach(b => b.classList.remove("active")); let targetBtn = document.getElementById("select" + g.charAt(0).toUpperCase() + g.slice(1)); if(targetBtn) targetBtn.classList.add("active");
    if (g === "snake") { if(welcomeText) welcomeText.innerText = "🐍 Klasik Yılan Oyunu"; initSnake(); }
    else if (g === "brick") { if(welcomeText) welcomeText.innerText = "🧱 Akıcı Siber Tuğla Kırma"; initBrick(); }
    else if (g === "space") { if(welcomeText) welcomeText.innerText = "🚀 Sonsuz Neon Uzay Savaşı"; spaceWave = 1; initSpace(); }
    else if (g === "flappy") { if(welcomeText) welcomeText.innerText = "🛸 Neon Cyber Bird"; initFlappy(); }
    else if (g === "pong") { if(welcomeText) welcomeText.innerText = "🔴 Yapay Zekaya Karşı Pong"; initPong(); }
    else if (g === "multi") { if(welcomeText) welcomeText.innerText = "🌐 Multiplayer X-O-X Arenası"; if(mPanel) mPanel.classList.remove("hidden"); initMulti(); }
}

function startActiveGame() {
    if (!currentPlayer) return; score = 0; if(scoreElement) scoreElement.innerText = score; isGameRunning = true; isGameWaitingToStart = true; 
    if(startBtn) startBtn.innerText = "Yeniden Başlat"; if(mobileStartBtn) mobileStartBtn.innerText = "Yeniden Başlat";
    if (activeGame === "snake") { initSnake(); isGameWaitingToStart = false; } else if (activeGame === "brick") initBrick(); else if (activeGame === "space") { spaceWave = 1; initSpace(); isGameWaitingToStart = false; } else if (activeGame === "flappy") initFlappy(); else if (activeGame === "pong") initPong();
    clearInterval(gameInterval); gameInterval = setInterval(updateEngine, activeGame === "snake" ? 100 : 1000 / 60);
}

function updateEngine() { if (isGameWaitingToStart) { drawWaitingScreen(); return; } handleContinuousInput(); if (activeGame === "snake") updateSnake(); else if (activeGame === "brick") updateBrick(); else if (activeGame === "space") updateSpace(); else if (activeGame === "flappy") updateFlappy(); else if (activeGame === "pong") updatePong(); }
function drawWaitingScreen() { if (activeGame === "flappy") drawFlappy(); else if (activeGame === "brick") drawBrick(); else if (activeGame === "pong") drawPong(); ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = "#00b0ff"; ctx.font = "bold 16px Arial"; ctx.textAlign = "center"; ctx.fillText("HAZIR! BAŞLAMAK İÇİN AŞAĞIDAKİ", canvas.width / 2, canvas.height / 2 - 15); ctx.fillText("BUTONLARA DOKUNUN VEYA ZIPLAYIN", canvas.width / 2, canvas.height / 2 + 15); }
function handleContinuousInput() { if (!isGameRunning) return; if (keysPressed["ArrowLeft"] || keysPressed["a"] || keysPressed["A"]) moveLeft(); if (keysPressed["ArrowRight"] || keysPressed["d"] || keysPressed["D"]) moveRight(); }

// A. YILAN
function initSnake() { snake = [{x:100,y:100},{x:80,y:100},{x:60,y:100}]; dx=gridSize; dy=0; moveFood(); drawSnake(); }
function updateSnake() { let head = { x: snake[0].x + dx, y: snake[0].y + dy }; if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height || checkSelfCollision(head)) { gameOver(); return; } snake.unshift(head); if (head.x === food.x && head.y === food.y) { score += 10; if(scoreElement) scoreElement.innerText = score; playSound("coin"); addGold(10); moveFood(); } else { snake.pop(); } drawSnake(); }
function drawSnake() { clearCanvas(); drawWatermark(); let c = getSkinColors(); snake.forEach((p, i) => { ctx.fillStyle = i===0?c.head:c.body; ctx.fillRect(p.x+1, p.y+1, gridSize-2, gridSize-2); }); ctx.fillStyle = "#ff1744"; ctx.beginPath(); ctx.arc(food.x+10, food.y+10, 8, 0, Math.PI*2); ctx.fill(); }

// B. TUĞLA
function initBrick() { ball.x = 200; ball.y = 250; ball.dx = 3; ball.dy = -4; paddle.x = 155; bricks = []; for(let c=0; c<5; c++) { for(let r=0; r<4; r++) { bricks.push({ x: c * 75 + 15, y: r * 22 + 40, status: 1 }); } } drawBrick(); }
function updateBrick() { ball.x += ball.dx; ball.y += ball.dy; if (ball.x < ball.radius || ball.x > canvas.width - ball.radius) ball.dx = -ball.dx; if (ball.y < ball.radius) ball.dy = -ball.dy; if (ball.y + ball.radius >= paddle.y && ball.y <= paddle.y + paddle.height) { if (ball.x >= paddle.x && ball.x <= paddle.x + paddle.width) { ball.dy = -Math.abs(ball.dy); playSound("dink"); } } if (ball.y > canvas.height) { gameOver(); return; } bricks.forEach(b => { if (b.status === 1) { if (ball.x > b.x && ball.x < b.x + 68 && ball.y > b.y && ball.y < b.y + 18) { ball.dy = -ball.dy; b.status = 0; score += 20; if(scoreElement) scoreElement.innerText = score; playSound("coin"); addGold(5); } } }); drawBrick(); }
function drawBrick() { clearCanvas(); drawWatermark(); let c = getSkinColors(); ctx.fillStyle = c.head; ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height); ctx.fillStyle = "#00ffff"; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2); ctx.fill(); bricks.forEach(b => { if(b.status===1) { ctx.fillStyle = c.body; ctx.fillRect(b.x, b.y, 68, 18); } }); }

// C. UZAY
function initSpace() { playerShip.x = 180; playerLasers = []; invaders = []; invaderDirection = 1; let currentSpeed = 0.6 + (spaceWave * 0.3); for(let x=0; x<6; x++) { for(let y=0; y<3; y++) { invaders.push({ x: x*55+40, y: y*25+40, w:30, h:15, alive:true, speed: currentSpeed }); } } drawSpace(); }
function updateSpace() { let edgeReached = false; invaders.forEach(inv => { if (!inv.alive) return; inv.x += invaderDirection * inv.speed; if (inv.x + inv.w > canvas.width || inv.x < 0) edgeReached = true; if (inv.y + inv.h >= playerShip.y) { gameOver(); return; } }); if (edgeReached) { invaderDirection *= -1; invaders.forEach(inv => inv.y += 15); } playerLasers.forEach((l, li) => { l.y -= 6; if(l.y < 0) playerLasers.splice(li,1); invaders.forEach(inv => { if (inv.alive && l.x > inv.x && l.x < inv.x + inv.w && l.y > inv.y && l.y < inv.y + inv.h) { inv.alive = false; playerLasers.splice(li,1); score += 30; if(scoreElement) scoreElement.innerText = score; playSound("boom"); addGold(10); } }); }); if (invaders.filter(i => i.alive).length === 0) { spaceWave++; playSound("coin"); initSpace(); } drawSpace(); }
function drawSpace() { clearCanvas(); drawWatermark(); let c = getSkinColors(); ctx.fillStyle = c.head; ctx.fillRect(playerShip.x, playerShip.y, playerShip.width, playerShip.height); ctx.fillStyle = "#ff0"; playerLasers.forEach(l => ctx.fillRect(l.x, l.y, 3, 12)); invaders.forEach(inv => { if(inv.alive) { ctx.fillStyle = "#ff1744"; ctx.fillRect(inv.x, inv.y, inv.w, inv.h); } }); ctx.fillStyle = "#fff"; ctx.font = "12px sans-serif"; ctx.fillText("Dalga: " + spaceWave, 40, 20); }

// D. BIRD
function initFlappy() { bird.y = 150; bird.velocity = 0; pipes = []; drawFlappy(); }
function updateFlappy() { bird.velocity += bird.gravity; bird.y += bird.velocity; if (bird.y > canvas.height || bird.y < 0) { gameOver(); return; } if (Math.random() < 0.015 && (pipes.length === 0 || pipes[pipes.length-1].x < 260)) { let gap = 110; let topH = Math.floor(Math.random() * 160) + 40; pipes.push({ x: canvas.width, top: topH, bottom: canvas.height - topH - gap, passed: false }); } pipes.forEach((p, pi) => { p.x -= 2.5; if(p.x < -50) pipes.splice(pi,1); if(!p.passed && p.x < bird.x) { p.passed = true; score += 50; if(scoreElement) scoreElement.innerText = score; playSound("coin"); addGold(15); } if (bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + 50) { if (bird.y - bird.radius < p.top || bird.y + bird.radius > canvas.height - p.bottom) { gameOver(); return; } } }); drawFlappy(); }
function drawFlappy() { clearCanvas(); drawWatermark(); let c = getSkinColors(); ctx.fillStyle = c.head; ctx.beginPath(); ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = "#e91e63"; pipes.forEach(p => { ctx.fillRect(p.x, 0, 50, p.top); ctx.fillRect(p.x, canvas.height - p.bottom, 50, p.bottom); }); }

// E. PONG
function initPong() { pongBall.x = 200; pongBall.y = 200; pongBall.dx = 4; pongBall.dy = 2; pongPad.y = 160; aiPad.y = 160; drawPong(); }
function updatePong() { pongBall.x += pongBall.dx; pongBall.y += pongBall.dy; if (pongBall.y < 5 || pongBall.y > canvas.height - 5) pongBall.dy = -pongBall.dy; if (pongBall.y > aiPad.y + 40) aiPad.y += aiPad.speed; else aiPad.y -= aiPad.speed; if (pongBall.x <= 20 && pongBall.y >= pongPad.y && pongBall.y <= pongPad.y + pongPad.height) { pongBall.dx = Math.abs(pongBall.dx) + 0.2; playSound("dink"); score += 5; if(scoreElement) scoreElement.innerText = score; } if (pongBall.x >= canvas.width - 20 && pongBall.y >= aiPad.y && pongBall.y <= aiPad.y + aiPad.height) { pongBall.dx = -Math.abs(pongBall.dx) - 0.2; playSound("dink"); } if (pongBall.x < 0) { gameOver(); return; } if (pongBall.x > canvas.width) { score += 100; if(scoreElement) scoreElement.innerText = score; playSound("coin"); addGold(50); initPong(); } drawPong(); }
function drawPong() { clearCanvas(); drawWatermark(); let c = getSkinColors(); ctx.fillStyle = c.head; ctx.fillRect(10, pongPad.y, pongPad.width, pongPad.height); ctx.fillStyle = "#ff1744"; ctx.fillRect(canvas.width - 20, aiPad.y, aiPad.width, aiPad.height); ctx.fillStyle = "#fff"; ctx.fillRect(pongBall.x - 4, pongBall.y - 4, 8, 8); }

function moveLeft() { if(activeGame === "snake" && dx===0) { dx = -gridSize; dy = 0; } else if(activeGame === "brick" && paddle.x > 0) paddle.x -= paddle.speed; else if(activeGame === "space" && playerShip.x > 0) playerShip.x -= playerShip.speed; else if(activeGame === "pong" && pongPad.y > 0) pongPad.y -= pongPad.speed; }
function moveRight() { if(activeGame === "snake" && dx===0) { dx = gridSize; dy = 0; } else if(activeGame === "brick" && paddle.x < canvas.width - paddle.width) paddle.x += paddle.speed; else if(activeGame === "space" && playerShip.x < canvas.width - playerShip.width) playerShip.x += playerShip.speed; else if(activeGame === "pong" && pongPad.y < canvas.height - pongPad.height) pongPad.y += pongPad.speed; }
function actionKey() { if(isGameWaitingToStart) { isGameWaitingToStart = false; return; } if (activeGame === "space" && isGameRunning) { playerLasers.push({ x: playerShip.x + 18, y: playerShip.y }); playSound("laser"); } else if (activeGame === "flappy" && isGameRunning) { bird.velocity = bird.jump; playSound("dink"); } }

function clearCanvas() { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
function drawWatermark() { ctx.fillStyle = "rgba(255, 255, 255, 0.03)"; ctx.font = "bold 32px sans-serif"; ctx.textAlign = "center"; ctx.fillText("EFEARAZ44 ARCADE", canvas.width / 2, canvas.height / 2); }
function getSkinColors() { if (currentSkin === "blue") return { head: "#00b0ff", body: "#0091ea", glow: "#00b0ff" }; if (currentSkin === "red") return { head: "#ff1744", body: "#d50000", glow: "#ff1744" }; if (currentSkin === "gold") return { head: "#ffd700", body: "#ffaa00", glow: "#ffd700" }; return { head: "#4caf50", body: "#388e3c", glow: "#4caf50" }; }
function moveFood() { food.x = Math.floor(Math.random() * 20) * 20; food.y = Math.floor(Math.random() * 20) * 20; }
function checkSelfCollision(h) { for(let i=1;i<snake.length;i++){ if(snake[i].x===h.x && snake[i].y===h.y) return true; } return false; }
function addGold(a) { totalGold += a; localStorage.setItem("arc_gold", totalGold); updateGoldUI(); }
function updateGoldUI() { if(totalGoldElement) totalGoldElement.innerText = totalGold; }

function gameOver() { clearInterval(gameInterval); isGameRunning = false; isGameWaitingToStart = false; playSound("boom"); if(score > arcadeScores[activeGame]) { arcadeScores[activeGame] = score; } let max = Math.max(arcadeScores.snake, arcadeScores.brick, arcadeScores.space, arcadeScores.flappy, arcadeScores.pong); if(max === score) arcadeScores.allTimePlayer = currentPlayer + " (" + activeGame.toUpperCase() + ")"; localStorage.setItem("arc_scores", JSON.stringify(arcadeScores)); updateLeaderboardUI(); ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle = "#ff1744"; ctx.font = "bold 30px Arial"; ctx.textAlign = "center"; ctx.fillText("OYUN BİTTİ!", canvas.width/2, canvas.height/2); }
function updateLeaderboardUI() { if(snakeBestCtx) snakeBestCtx.innerText = arcadeScores.snake + " Puan"; if(brickBestCtx) brickBestCtx.innerText = arcadeScores.brick + " Puan"; if(spaceBestCtx) spaceBestCtx.innerText = arcadeScores.space + " Puan"; if(flappyBestCtx) flappyBestCtx.innerText = arcadeScores.flappy + " Puan"; if(pongBestCtx) pongBestCtx.innerText = arcadeScores.pong + " Puan"; let max = Math.max(arcadeScores.snake, arcadeScores.brick, arcadeScores.space, arcadeScores.flappy, arcadeScores.pong); if(allTimeBestCtx) allTimeBestCtx.innerText = max > 0 ? arcadeScores.allTimePlayer + " - " + max + " Puan" : "Henüz yok..."; }
function updateShopUI() { document.querySelectorAll(".skin-btn").forEach(btn => { let s = btn.getAttribute("data-skin"); let c = parseInt(btn.getAttribute("data-cost")) || 0; if(currentSkin===s){ btn.innerText="Seçili"; btn.className="skin-btn active"; } else if(ownedSkins.includes(s)){ btn.innerText="Seç"; btn.className="skin-btn"; btn.style.background="#2196f3"; } else { btn.innerText="Satın Al (" + c + ")"; btn.className="skin-btn"; btn.style.background="#555"; } }); }

document.querySelectorAll(".skin-btn").forEach(btn => { btn.addEventListener("click", e => { let s = e.target.getAttribute("data-skin"); let c = parseInt(e.target.getAttribute("data-cost")) || 0; if(ownedSkins.includes(s)){ currentSkin = s; localStorage.setItem("arc_current_skin", s); } else if(totalGold >= c) { totalGold -= c; ownedSkins.push(s); currentSkin = s; localStorage.setItem("arc_gold", totalGold); localStorage.setItem("arc_skins", JSON.stringify(ownedSkins)); localStorage.setItem("arc_current_skin", s); updateGoldUI(); } updateShopUI(); switchGame(activeGame); }); });
// ============================================================================
// --- 8. ZAMAN ÖLÇER SİSTEMİ (KORUNAKLI BLOK) ---
// ============================================================================
(() => {
    let toplamSaniye = parseInt(localStorage.getItem("arcade_total_time")) || 0;

    function zamanFormatla(saniye) { 
        let sa = Math.floor(saniye / 3600); 
        let dk = Math.floor((saniye % 3600) / 60); 
        let sn = saniye % 60; 
        let sonuc = ""; 
        if (sa > 0) sonuc += sa + "sa "; 
        if (dk > 0) sonuc += dk + "dk "; 
        sonuc += sn + "s"; 
        return sonuc; 
    }

    const timeDisplayElement = document.getElementById("totalTimeDisplay"); 
    if (timeDisplayElement) { 
        timeDisplayElement.innerText = zamanFormatla(toplamSaniye); 
    }

    setInterval(() => { 
        toplamSaniye++; 
        localStorage.setItem("arcade_total_time", toplamSaniye); 
        if (timeDisplayElement) { 
            timeDisplayElement.innerText = zamanFormatla(toplamSaniye); 
        } 
    }, 1000);
})();