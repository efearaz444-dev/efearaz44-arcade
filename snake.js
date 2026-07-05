// --- 1. SİSTEM VE SES MOTORU (AUDIO CONTEXT) ---
let audioCtx = null;
let bgmInterval = null;
let isMusicPlaying = false;

function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

// Sentetik Ses Efektleri Üretici (Sıfır Dosya Gereksinimi)
function playSound(type) {
    if (!audioCtx) return;
    try {
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === "dink") { // Tuğla Çarpması
            osc.frequency.setValueAtTime(440, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.start(); osc.stop(audioCtx.currentTime + 0.1);
        } else if (type === "laser") { // Uzay Savaşı Ateş
            osc.frequency.setValueAtTime(880, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            osc.start(); osc.stop(audioCtx.currentTime + 0.15);
        } else if (type === "boom") { // Patlama / Ölüm
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(40, audioCtx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.start(); osc.stop(audioCtx.currentTime + 0.3);
        } else if (type === "coin") { // Puan / Altın Kazanma
            osc.frequency.setValueAtTime(587, audioCtx.currentTime);
            osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            osc.start(); osc.stop(audioCtx.currentTime + 0.2);
        }
    } catch(e) {}
}

// Dinamik Siber Arka Plan Müziği (Aksiyon Ritmi)
function toggleBGM() {
    initAudio();
    if (isMusicPlaying) {
        clearInterval(bgmInterval);
        isMusicPlaying = false;
        document.getElementById("bgmBtn").innerText = "🔊 Müzik Aç";
    } else {
        isMusicPlaying = true;
        document.getElementById("bgmBtn").innerText = "🔇 Müzik Kapat";
        bgmInterval = setInterval(() => {
            try {
                let osc = audioCtx.createOscillator();
                let gain = audioCtx.createGain();
                osc.connect(gain); gain.connect(audioCtx.destination);
                let notes = [110, 130, 146, 165];
                let randomNote = notes[Math.floor(Math.random() * notes.length)];
                osc.frequency.setValueAtTime(randomNote, audioCtx.currentTime);
                gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
                osc.start(); osc.stop(audioCtx.currentTime + 0.4);
            } catch(e){}
        }, 500);
    }
}
document.getElementById("bgmBtn").addEventListener("click", toggleBGM);

// --- 2. GLOBAL TANIMLAMALAR VE BAĞLANTILAR ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const startBtn = document.getElementById("startBtn");
const nameModal = document.getElementById("nameModal");
const usernameInput = document.getElementById("usernameInput");
const saveNameBtn = document.getElementById("saveNameBtn");
const welcomeText = document.getElementById("welcomeText");
const totalGoldElement = document.getElementById("totalGold");
const shopPanel = document.getElementById("shopPanel");

const allTimeBestCtx = document.getElementById("allTimeBest");
const snakeBestCtx = document.getElementById("snakeBest");
const brickBestCtx = document.getElementById("brickBest");
const spaceBestCtx = document.getElementById("spaceBest");
const flappyBestCtx = document.getElementById("flappyBest");
const pongBestCtx = document.getElementById("pongBest");

const mPanel = document.getElementById("multiplayerPanel");

let activeGame = "snake"; 
let score = 0;
let gameInterval;
let isGameRunning = false;
const gridSize = 20;

// Sistem Hafızası
let currentPlayer = "";
let totalGold = parseInt(localStorage.getItem("arc_gold")) || 0;
let ownedSkins = JSON.parse(localStorage.getItem("arc_skins")) || ["classic"];
let currentSkin = localStorage.getItem("arc_current_skin") || "classic";
let arcadeScores = JSON.parse(localStorage.getItem("arc_scores")) || { snake: 0, brick: 0, space: 0, flappy: 0, pong: 0, allTimePlayer: "" };

// --- OYUN MATRİSLERİ VE KONTROLLER ---
let snake = []; let food = {x:0, y:0}; let dx = gridSize, dy = 0; // Yılan
let paddle = { x: 160, y: 370, width: 90, height: 12, speed: 14 }; let ball = { x: 200, y: 200, radius: 7, dx: 4, dy: -4 }; let bricks = []; // Tuğla
let playerShip = { x: 180, y: 360, width: 40, height: 20, speed: 9 }; let playerLasers = []; let invaders = []; let invaderDirection = 1; let spaceWave = 1; // Uzay
let bird = { x: 50, y: 150, velocity: 0, gravity: 0.5, jump: -7, radius: 10 }; let pipes = []; // Flappy
let pongPad = { y: 160, width: 10, height: 80, speed: 8 }; let aiPad = { y: 160, width: 10, height: 80, speed: 3.5 }; let pongBall = { x: 200, y: 200, dx: 4, dy: 3 }; // Pong
let mpState = { board: Array(9).fill(null), turn: "X", mySymbol: "X", roomCode: "", isMyTurn: false }; // Multiplayer XOX

// Tuş Basılı Tutma Kontrolü Mekanizması (Akıcı sürüş sağlar)
let keysPressed = {};
window.addEventListener("keydown", e => { keysPressed[e.key] = true; initAudio(); });
window.addEventListener("keyup", e => { keysPressed[e.key] = false; });

// --- 3. MENÜ VE BAŞLANGIÇ YÖNETİMİ ---
window.onload = function() {
    updateGoldUI(); updateLeaderboardUI(); updateShopUI();
    const savedName = localStorage.getItem("arc_username");
    if (savedName) { currentPlayer = savedName; nameModal.style.display = "none"; welcomeText.innerText = `🎮 Efearaz44 Arcade'e Hoş geldin!`; }
    switchGame("snake");
};

saveNameBtn.addEventListener("click", () => {
    let name = usernameInput.value.trim();
    if (!name) return alert("Geçerli bir isim yazmalısın!");

    // Genişletilmiş ve güçlendirilmiş yasaklı kelimeler listesi
    const yasakliKelimeler = [
        "31", "otuzbir", "otuz bir", "otuz-bir", "o31", "otuz1",
        "piç", "pic", "sik", "sg", "sktir", "siktir", "orospu", "orspu", "oç", "oc", 
        "göt", "got", "gto", "amk", "aq", "amq", "am", "yarrak", "yarak", 
        "fuck", "bitch", "sikiş", "sikis", "meme", "daşşak", "dassak", "taşşak",
        "pezevenk", "pznk", "ibne", "ipne", "orospu cocugu", "orospu çocuğu",
        "şerefsiz", "serefsiz", "salak", "gerizekalı", "gerizekali", "mal"
    ]; 
    
    // Büyük/küçük harf veya boşluk hilelerini engellemek için ismi temizliyoruz
    const kontrolIsmi = name.toLowerCase().replace(/\s+/g, ''); 

    // Küfür veya yasaklı kelime kontrolü yapılıyor
    const yasakliBulundu = yasakliKelimeler.some(kelime => {
        // Yasaklı kelimenin de boşluklarını temizleyip öyle kontrol ediyoruz
        const temizKelime = kelime.toLowerCase().replace(/\s+/g, '');
        return kontrolIsmi.includes(temizKelime);
    });

    if (yasakliBulundu) {
        alert("Lütfen düzgün bir kullanıcı adı giriniz! Yasaklı kelime veya sayı tespit edildi. 🚫");
        usernameInput.value = ""; // Giriş kutusunu temizler
        return; // Oyuna sokmadan burada durdurur
    }

    // İsim temizse oyun sorunsuz başlar
    currentPlayer = name; 
    localStorage.setItem("arc_username", name);
    nameModal.style.display = "none"; 
    welcomeText.innerText = `🎮 Hoş geldin, ${currentPlayer}!`;
});

function switchGame(g) {
    if(isGameRunning) gameOver();
    activeGame = g; score = 0; scoreElement.innerText = score;
    mPanel.classList.add("hidden");
    
    document.querySelectorAll(".game-selector button").forEach(b => b.classList.remove("active"));
    document.getElementById("select" + g.charAt(0).toUpperCase() + g.slice(1)).classList.add("active");

    if (g === "snake") { welcomeText.innerText = "🐍 Klasik Yılan Oyunu"; initSnake(); }
    else if (g === "brick") { welcomeText.innerText = "🧱 Akıcı Siber Tuğla Kırma"; initBrick(); }
    else if (g === "space") { welcomeText.innerText = "🚀 Sonsuz Neon Uzay Savaşı"; spaceWave = 1; initSpace(); }
    else if (g === "flappy") { welcomeText.innerText = "🛸 Neon Cyber Bird"; initFlappy(); }
    else if (g === "pong") { welcomeText.innerText = "🔴 Yapay Zekaya Karşı Pong"; initPong(); }
    else if (g === "multi") { welcomeText.innerText = "🌐 Multiplayer X-O-X Arenası"; mPanel.classList.remove("hidden"); initMulti(); }
}

// Menü Eventleri
document.getElementById("selectSnake").addEventListener("click", () => switchGame("snake"));
document.getElementById("selectBrick").addEventListener("click", () => switchGame("brick"));
document.getElementById("selectSpace").addEventListener("click", () => switchGame("space"));
document.getElementById("selectFlappy").addEventListener("click", () => switchGame("flappy"));
document.getElementById("selectPong").addEventListener("click", () => switchGame("pong"));
document.getElementById("selectMulti").addEventListener("click", () => switchGame("multi"));
document.getElementById("shopBtn").addEventListener("click", () => shopPanel.classList.toggle("hidden"));

function startActiveGame() {
    if (!currentPlayer) return;
    score = 0; scoreElement.innerText = score; isGameRunning = true;
    startBtn.innerText = "Yeniden Başlat";

    if (activeGame === "snake") initSnake();
    else if (activeGame === "brick") initBrick();
    else if (activeGame === "space") { spaceWave = 1; initSpace(); }
    else if (activeGame === "flappy") initFlappy();
    else if (activeGame === "pong") initPong();

    clearInterval(gameInterval);
    gameInterval = setInterval(updateEngine, activeGame === "snake" ? 100 : 1000 / 60);
}

function updateEngine() {
    handleContinuousInput();
    if (activeGame === "snake") updateSnake();
    else if (activeGame === "brick") updateBrick();
    else if (activeGame === "space") updateSpace();
    else if (activeGame === "flappy") updateFlappy();
    else if (activeGame === "pong") updatePong();
}

// --- 4. AKICI TUŞ BASILI TUTMA MOTORU ---
function handleContinuousInput() {
    if (!isGameRunning) return;
    if (keysPressed["ArrowLeft"] || keysPressed["a"] || keysPressed["A"]) moveLeft();
    if (keysPressed["ArrowRight"] || keysPressed["d"] || keysPressed["D"]) moveRight();
}

// --- 5. MODÜLER OYUN MEKANİKLERİ ---

// A. YILAN OYUNU
function initSnake() { snake = [{x:100,y:100},{x:80,y:100},{x:60,y:100}]; dx=gridSize; dy=0; moveFood(); drawSnake(); }
function updateSnake() {
    let head = { x: snake[0].x + dx, y: snake[0].y + dy };
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height || checkSelfCollision(head)) { gameOver(); return; }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) { score += 10; scoreElement.innerText = score; playSound("coin"); addGold(10); moveFood(); }
    else { snake.pop(); }
    drawSnake();
}
function drawSnake() {
    clearCanvas(); drawWatermark(); let c = getSkinColors();
    snake.forEach((p, i) => { ctx.fillStyle = i===0?c.head:c.body; ctx.fillRect(p.x+1, p.y+1, gridSize-2, gridSize-2); });
    ctx.fillStyle = "#ff1744"; ctx.beginPath(); ctx.arc(food.x+10, food.y+10, 8, 0, Math.PI*2); ctx.fill();
}

// B. TUĞLA KIRMA (Fizik Açıkları Kapatılmış Düzenek)
function initBrick() {
    ball.x = 200; ball.y = 250; ball.dx = 3; ball.dy = -4; paddle.x = 155; bricks = [];
    for(let c=0; c<5; c++) { for(let r=0; r<4; r++) { bricks.push({ x: c * 75 + 15, y: r * 22 + 40, status: 1 }); } }
    drawBrick();
}
function updateBrick() {
    ball.x += ball.dx; ball.y += ball.dy;
    if (ball.x < ball.radius || ball.x > canvas.width - ball.radius) ball.dx = -ball.dx;
    if (ball.y < ball.radius) ball.dy = -ball.dy;

    // Kusursuz Çarpışma Mekaniği (Mavi Çubuğun Üst Yüzeyi)
    if (ball.y + ball.radius >= paddle.y && ball.y <= paddle.y + paddle.height) {
        if (ball.x >= paddle.x && ball.x <= paddle.x + paddle.width) {
            ball.dy = -Math.abs(ball.dy); // Aşağı kaçış hatasını önler, kesin yukarı zıplatır
            playSound("dink");
        }
    }
    if (ball.y > canvas.height) { gameOver(); return; }

    bricks.forEach(b => {
        if (b.status === 1) {
            if (ball.x > b.x && ball.x < b.x + 68 && ball.y > b.y && ball.y < b.y + 18) {
                ball.dy = -ball.dy; b.status = 0; score += 20; scoreElement.innerText = score; playSound("coin"); addGold(5);
            }
        }
    });
    drawBrick();
}
function drawBrick() {
    clearCanvas(); drawWatermark(); let c = getSkinColors();
    ctx.fillStyle = c.head; ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillStyle = "#00ffff"; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2); ctx.fill();
    bricks.forEach(b => { if(b.status===1) { ctx.fillStyle = c.body; ctx.fillRect(b.x, b.y, 68, 18); } });
}

// C. SONSUZ UZAY SAVAŞI (Dinamik Katlanan Hız)
function initSpace() {
    playerShip.x = 180; playerLasers = []; invaders = []; invaderDirection = 1;
    let currentSpeed = 0.6 + (spaceWave * 0.3); // Her dalgada daha da hızlanırlar!
    for(let x=0; x<6; x++) { for(let y=0; y<3; y++) { invaders.push({ x: x*55+40, y: y*25+40, w:30, h:15, alive:true, speed: currentSpeed }); } }
    drawSpace();
}
function updateSpace() {
    let edgeReached = false;
    invaders.forEach(inv => {
        if (!inv.alive) return;
        inv.x += invaderDirection * inv.speed;
        if (inv.x + inv.w > canvas.width || inv.x < 0) edgeReached = true;
        if (inv.y + inv.h >= playerShip.y) { gameOver(); return; }
    });
    if (edgeReached) { invaderDirection *= -1; invaders.forEach(inv => inv.y += 15); }

    playerLasers.forEach((l, li) => {
        l.y -= 6; if(l.y < 0) playerLasers.splice(li,1);
        invaders.forEach(inv => {
            if (inv.alive && l.x > inv.x && l.x < inv.x + inv.w && l.y > inv.y && l.y < inv.y + inv.h) {
                inv.alive = false; playerLasers.splice(li,1); score += 30; scoreElement.innerText = score; playSound("boom"); addGold(10);
            }
        });
    });

    // Sonsuz Dalga Tetikleyicisi
    if (invaders.filter(i => i.alive).length === 0) {
        spaceWave++; playSound("coin"); initSpace();
    }
    drawSpace();
}
function drawSpace() {
    clearCanvas(); drawWatermark(); let c = getSkinColors();
    ctx.fillStyle = c.head; ctx.fillRect(playerShip.x, playerShip.y, playerShip.width, playerShip.height);
    ctx.fillStyle = "#ff0"; playerLasers.forEach(l => ctx.fillRect(l.x, l.y, 3, 12));
    invaders.forEach(inv => { if(inv.alive) { ctx.fillStyle = "#ff1744"; ctx.fillRect(inv.x, inv.y, inv.w, inv.h); } });
    
    ctx.fillStyle = "#fff"; ctx.font = "12px sans-serif"; ctx.fillText(`Dalga: ${spaceWave}`, 40, 20);
}

// D. YENİ OYUN: CYBER BIRD
function initFlappy() { bird.y = 150; bird.velocity = 0; pipes = []; drawFlappy(); }
function updateFlappy() {
    bird.velocity += bird.gravity; bird.y += bird.velocity;
    if (bird.y > canvas.height || bird.y < 0) { gameOver(); return; }
    
    if (Math.random() < 0.015 && (pipes.length === 0 || pipes[pipes.length-1].x < 260)) {
        let gap = 110; let topH = Math.floor(Math.random() * 160) + 40;
        pipes.push({ x: canvas.width, top: topH, bottom: canvas.height - topH - gap, passed: false });
    }
    pipes.forEach((p, pi) => {
        p.x -= 2.5;
        if(p.x < -50) pipes.splice(pi,1);
        if(!p.passed && p.x < bird.x) { p.passed = true; score += 50; scoreElement.innerText = score; playSound("coin"); addGold(15); }
        // Çarpışma Matrisi
        if (bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + 50) {
            if (bird.y - bird.radius < p.top || bird.y + bird.radius > canvas.height - p.bottom) { gameOver(); return; }
        }
    });
    drawFlappy();
}
function drawFlappy() {
    clearCanvas(); drawWatermark(); let c = getSkinColors();
    ctx.fillStyle = c.head; ctx.beginPath(); ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#e91e63"; pipes.forEach(p => { ctx.fillRect(p.x, 0, 50, p.top); ctx.fillRect(p.x, canvas.height - p.bottom, 50, p.bottom); });
}

// E. YENİ OYUN: NEON PONG
function initPong() { pongBall.x = 200; pongBall.y = 200; pongBall.dx = 4; pongBall.dy = 2; pongPad.y = 160; aiPad.y = 160; drawPong(); }
function updatePong() {
    pongBall.x += pongBall.dx; pongBall.y += pongBall.dy;
    if (pongBall.y < 5 || pongBall.y > canvas.height - 5) pongBall.dy = -pongBall.dy;
    
    // Basit Yapay Zeka Takibi
    if (pongBall.y > aiPad.y + 40) aiPad.y += aiPad.speed; else aiPad.y -= aiPad.speed;
    
    // Çarpışmalar
    if (pongBall.x <= 20 && pongBall.y >= pongPad.y && pongBall.y <= pongPad.y + pongPad.height) { pongBall.dx = Math.abs(pongBall.dx) + 0.2; playSound("dink"); score += 5; scoreElement.innerText = score; }
    if (pongBall.x >= canvas.width - 20 && pongBall.y >= aiPad.y && pongBall.y <= aiPad.y + aiPad.height) { pongBall.dx = -Math.abs(pongBall.dx) - 0.2; playSound("dink"); }
    
    if (pongBall.x < 0) { gameOver(); return; }
    if (pongBall.x > canvas.width) { score += 100; scoreElement.innerText = score; playSound("coin"); addGold(50); initPong(); }
    drawPong();
}
function drawPong() {
    clearCanvas(); drawWatermark(); let c = getSkinColors();
    ctx.fillStyle = c.head; ctx.fillRect(10, pongPad.y, pongPad.width, pongPad.height);
    ctx.fillStyle = "#ff1744"; ctx.fillRect(canvas.width - 20, aiPad.y, aiPad.width, aiPad.height);
    ctx.fillStyle = "#fff"; ctx.fillRect(pongBall.x - 4, pongBall.y - 4, 8, 8);
}

// F. MP ARENA: AKILLI HAFİF BANT MULTIPLAYER SİMÜLATÖRÜ
function initMulti() {
    clearCanvas(); ctx.fillStyle = "#fff"; ctx.font = "14px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Çevrimiçi bir odaya katılın veya kurun!", canvas.width/2, canvas.height/2);
}
document.getElementById("createRoomBtn").addEventListener("click", () => {
    let code = Math.floor(1000 + Math.random() * 9000);
    mpState.roomCode = code.toString(); mpState.mySymbol = "X"; mpState.isMyTurn = true; mpState.board.fill(null);
    document.getElementById("roomStatus").innerText = `Oda Kuruldu! Kod: ${code}. Arkadaşın bu kodu yazıp girmeli. Sıra Sende (X)`;
    drawXOX();
});
document.getElementById("joinRoomBtn").addEventListener("click", () => {
    let code = document.getElementById("roomCodeInput").value.trim();
    if(!code) return alert("Kod girin!");
    mpState.roomCode = code; mpState.mySymbol = "O"; mpState.isMyTurn = false; mpState.board.fill(null);
    document.getElementById("roomStatus").innerText = `Odaya Bağlanıldı! Sembolün: O. Rakibin (X) oynaması bekleniyor...`;
    drawXOX();
    // Rakip taklit hamlesi tetikleyicisi
    setTimeout(() => { simulateOpponentMove(); }, 2000);
});

function drawXOX() {
    clearCanvas(); ctx.strokeStyle = "#555"; ctx.lineWidth = 4;
    for(let i=1; i<3; i++) {
        ctx.beginPath(); ctx.moveTo(i*133, 0); ctx.lineTo(i*133, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i*133); ctx.lineTo(canvas.width, i*133); ctx.stroke();
    }
    mpState.board.forEach((val, index) => {
        if(!val) return;
        let r = Math.floor(index / 3); let c = index % 3;
        let x = c * 133 + 66; let y = r * 133 + 66;
        ctx.font = "bold 50px Arial"; ctx.fillStyle = val === "X" ? "#00b0ff" : "#ff1744";
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(val, x, y);
    });
}

function handleXOXClick(x, y) {
    if(activeGame !== "multi" || !mpState.roomCode || !mpState.isMyTurn) return;
    let c = Math.floor(x / 133); let r = Math.floor(y / 133); let index = r * 3 + c;
    if(mpState.board[index]) return;

    mpState.board[index] = mpState.mySymbol; playSound("dink"); drawXOX();
    checkXOXWinner();
    
    mpState.isMyTurn = false;
    document.getElementById("roomStatus").innerText = "Hamle yapıldı! Rakibin internet üzerinden oynaması bekleniyor...";
    
    setTimeout(() => { simulateOpponentMove(); }, 2500);
}

function simulateOpponentMove() {
    if(activeGame !== "multi" || isGameRunning) return;
    let emptyIndices = mpState.board.map((v, i) => v === null ? i : null).filter(v => v !== null);
    if(emptyIndices.length === 0) return;
    let oppSymbol = mpState.mySymbol === "X" ? "O" : "X";
    let randomMove = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    
    mpState.board[randomMove] = oppSymbol; playSound("boom"); drawXOX();
    if(!checkXOXWinner()) {
        mpState.isMyTurn = true;
        document.getElementById("roomStatus").innerText = `Sıra Sende! Hamleni yap.`;
    }
}

function checkXOXWinner() {
    let b = mpState.board;
    let wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let w of wins) {
        if(b[w[0]] && b[w[0]] === b[w[1]] && b[w[0]] === b[w[2]]) {
            alert(`Oyun Bitti! Kazanan: ${b[w[0]]}`);
            if(b[w[0]] === mpState.mySymbol) addGold(100);
            mpState.roomCode = ""; document.getElementById("roomStatus").innerText = "Oyun bitti! Yeni oda açabilirsiniz.";
            return true;
        }
    }
    if(b.filter(v => v === null).length === 0) {
        alert("Berabere!"); mpState.roomCode = ""; return true;
    }
    return false;
}

canvas.addEventListener("click", e => {
    if(activeGame === "multi") {
        let rect = canvas.getBoundingClientRect();
        let x = e.clientX - rect.left; let y = e.clientY - rect.top;
        handleXOXClick(x, y);
    }
});

// --- 6. HAREKET EMİRLERİ ---
function moveLeft() {
    if(activeGame === "snake" && dx===0) { dx = -gridSize; dy = 0; }
    else if(activeGame === "brick" && paddle.x > 0) paddle.x -= paddle.speed;
    else if(activeGame === "space" && playerShip.x > 0) playerShip.x -= playerShip.speed;
    else if(activeGame === "pong" && pongPad.y > 0) pongPad.y -= pongPad.speed;
}
function moveRight() {
    if(activeGame === "snake" && dx===0) { dx = gridSize; dy = 0; }
    else if(activeGame === "brick" && paddle.x < canvas.width - paddle.width) paddle.x += paddle.speed;
    else if(activeGame === "space" && playerShip.x < canvas.width - playerShip.width) playerShip.x += playerShip.speed;
    else if(activeGame === "pong" && pongPad.y < canvas.height - pongPad.height) pongPad.y += pongPad.speed;
}
function actionKey() {
    if (activeGame === "space" && isGameRunning) { playerLasers.push({ x: playerShip.x + 18, y: playerShip.y }); playSound("laser"); }
    else if (activeGame === "flappy" && isGameRunning) { bird.velocity = bird.jump; playSound("dink"); }
}

// Klavye Dinleyicileri (Ek Tuşlar)
document.addEventListener("keydown", e => {
    if(e.key === " " || e.key === "f" || e.key === "F" || e.key === "ArrowUp" || e.key === "w" || e.key === "W") actionKey();
    if(activeGame === "snake") {
        if((e.key === "ArrowUp" || e.key === "w" || e.key === "W") && dy === 0) { dx = 0; dy = -gridSize; }
        if((e.key === "ArrowDown" || e.key === "s" || e.key === "S") && dy === 0) { dx = 0; dy = gridSize; }
    }
    if(activeGame === "pong") {
        if(e.key === "ArrowUp" || e.key === "w" || e.key === "W") moveLeft(); // Üst panel
        if(e.key === "ArrowDown" || e.key === "s" || e.key === "S") moveRight(); // Alt panel
    }
});

// Mobil Bağlantı Dinleyicileri
document.getElementById("btnLeft").addEventListener("click", moveLeft);
document.getElementById("btnRight").addEventListener("click", moveRight);
document.getElementById("btnUp").addEventListener("click", () => { 
    if(activeGame==="snake" && dy===0){ dx=0; dy=-gridSize; } 
    else if(activeGame==="pong" || activeGame==="flappy") actionKey(); 
});
document.getElementById("btnDown").addEventListener("click", () => { if(activeGame==="snake" && dy===0){ dx=0; dy=gridSize; } });
document.getElementById("btnAction").addEventListener("click", actionKey);

// --- 7. SİSTEM YARDIMCILARI VE SKOR PANELİ ---
function clearCanvas() { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
function drawWatermark() {
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)"; ctx.font = "bold 32px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("EFEARAZ44 ARCADE", canvas.width / 2, canvas.height / 2);
}
function getSkinColors() {
    if (currentSkin === "blue") return { head: "#00b0ff", body: "#0091ea", glow: "#00b0ff" };
    if (currentSkin === "red") return { head: "#ff1744", body: "#d50000", glow: "#ff1744" };
    if (currentSkin === "gold") return { head: "#ffd700", body: "#ffaa00", glow: "#ffd700" };
    return { head: "#4caf50", body: "#388e3c", glow: "#4caf50" };
}
function moveFood() { food.x = Math.floor(Math.random() * 20) * 20; food.y = Math.floor(Math.random() * 20) * 20; }
function checkSelfCollision(h) { for(let i=1;i<snake.length;i++){ if(snake[i].x===h.x && snake[i].y===h.y) return true; } return false; }
function addGold(a) { totalGold += a; localStorage.setItem("arc_gold", totalGold); updateGoldUI(); }
function updateGoldUI() { totalGoldElement.innerText = totalGold; }

function gameOver() {
    clearInterval(gameInterval); isGameRunning = false; playSound("boom");
    if(score > arcadeScores[activeGame]) { arcadeScores[activeGame] = score; }
    let max = Math.max(arcadeScores.snake, arcadeScores.brick, arcadeScores.space, arcadeScores.flappy, arcadeScores.pong);
    if(max === score) arcadeScores.allTimePlayer = `${currentPlayer} (${activeGame.toUpperCase()})`;
    localStorage.setItem("arc_scores", JSON.stringify(arcadeScores));
    updateLeaderboardUI();
    ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#ff1744"; ctx.font = "bold 30px Arial"; ctx.textAlign = "center"; ctx.fillText("OYUN BİTTİ!", canvas.width/2, canvas.height/2);
}
function updateLeaderboardUI() {
    snakeBestCtx.innerText = `${arcadeScores.snake} Puan`; brickBestCtx.innerText = `${arcadeScores.brick} Puan`;
    spaceBestCtx.innerText = `${arcadeScores.space} Puan`; flappyBestCtx.innerText = `${arcadeScores.flappy} Puan`;
    pongBestCtx.innerText = `${arcadeScores.pong} Puan`;
    let max = Math.max(arcadeScores.snake, arcadeScores.brick, arcadeScores.space, arcadeScores.flappy, arcadeScores.pong);
    allTimeBestCtx.innerText = max > 0 ? `${arcadeScores.allTimePlayer} - ${max} Puan` : "Henüz yok...";
}
function updateShopUI() {
    document.querySelectorAll(".skin-btn").forEach(btn => {
        let s = btn.getAttribute("data-skin"); let c = parseInt(btn.getAttribute("data-cost")) || 0;
        if(currentSkin===s){ btn.innerText="Seçili"; btn.className="skin-btn active"; }
        else if(ownedSkins.includes(s)){ btn.innerText="Seç"; btn.className="skin-btn"; btn.style.background="#2196f3"; }
        else { btn.innerText=`Satın Al (${c})`; btn.className="skin-btn"; btn.style.background="#555"; }
    });
}
document.querySelectorAll(".skin-btn").forEach(btn => {
    btn.addEventListener("click", e => {
        let s = e.target.getAttribute("data-skin"); let c = parseInt(e.target.getAttribute("data-cost")) || 0;
        if(ownedSkins.includes(s)){ currentSkin = s; localStorage.setItem("arc_current_skin", s); }
        else if(totalGold >= c) { totalGold -= c; ownedSkins.push(s); currentSkin = s; localStorage.setItem("arc_gold", totalGold); localStorage.setItem("arc_skins", JSON.stringify(ownedSkins)); localStorage.setItem("arc_current_skin", s); updateGoldUI(); }
        updateShopUI(); switchGame(activeGame);
    });
});
startBtn.addEventListener("click", startActiveGame);
// ==================== ZAMAN ÖLÇER SİSTEMİ ====================
// Tarayıcı hafızasından daha önceki süreyi saniye olarak çekiyoruz, yoksa 0'dan başlatıyoruz
let toplamSaniye = parseInt(localStorage.getItem("arcade_total_time")) || 0;

// Saniyeyi saat, dakika ve saniye formatına (Örn: 1sa 14dk 25s) çeviren fonksiyon
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

// Sayfa ilk açıldığında eski süreyi ekrana yazdırıyoruz
const timeDisplayElement = document.getElementById("totalTimeDisplay");
if (timeDisplayElement) {
    timeDisplayElement.innerText = zamanFormatla(toplamSaniye);
}

// Her 1 saniyede (1000 milisaniye) bir çalışacak sayaç
setInterval(() => {
    toplamSaniye++; // Süreyi 1 artır
    localStorage.setItem("arcade_total_time", toplamSaniye); // Tarayıcıya kaydet

    // Ekrandaki yazıyı güncelle
    if (timeDisplayElement) {
        timeDisplayElement.innerText = zamanFormatla(toplamSaniye);
    }
}, 1000);
// =============================================================
// ==================== MOBİL KONTROL SİSTEMİ ====================
// HTML'deki mobil butonları çekiyoruz
const btnUp = document.getElementById("btnUp");
const btnDown = document.getElementById("btnDown");
const btnLeft = document.getElementById("btnLeft");
const btnRight = document.getElementById("btnRight");

// Klavyedeki yön tuşlarını taklit eden yardımcı fonksiyon
function yapayTusBas(tusKodu) {
    // Oyunlarının yön tuşlarını algıladığı event mekanizmasını tetikliyoruz
    const event = new KeyboardEvent("keydown", { key: tusKodu });
    window.dispatchEvent(event); // Eğer oyun pencereyi dinliyorsa
    document.dispatchEvent(event); // Eğer oyun dokümanı dinliyorsa
}

// Butonlara dokunulduğunda (Touchstart mobilde daha hızlı tepki verir)
if (btnUp && btnDown && btnLeft && btnRight) {
    btnUp.addEventListener("touchstart", (e) => { e.preventDefault(); yapayTusBas("ArrowUp"); });
    btnDown.addEventListener("touchstart", (e) => { e.preventDefault(); yapayTusBas("ArrowDown"); });
    btnLeft.addEventListener("touchstart", (e) => { e.preventDefault(); yapayTusBas("ArrowLeft"); });
    btnRight.addEventListener("touchstart", (e) => { e.preventDefault(); yapayTusBas("ArrowRight"); });

    // Bilgisayardan mouse ile test edebilmek için tıklama destekleri:
    btnUp.addEventListener("click", () => yapayTusBas("ArrowUp"));
    btnDown.addEventListener("click", () => yapayTusBas("ArrowDown"));
    btnLeft.addEventListener("click", () => yapayTusBas("ArrowLeft"));
    btnRight.addEventListener("click", () => yapayTusBas("ArrowRight"));
}
// ===============================================================