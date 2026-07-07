// ============================================================================
// --- EFEARAZ44 ARCADE - ENTEGRE ANA SİSTEM (YENİ SÜPER ARCADE GÜNCELLEMESİ) ---
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

let defaultScores = { 
    snake: 0, brick: 0, space: 0, flappy: 0, pong: 0, dino: 0, catch: 0, 
    cyberbird: 0, dinorun2: 0, starhunter: 0, neondraw: 0, catchpro: 0, 
    snake_vs: 0, chess: 0, meteors: 0, hexrunner: 0, neonhelix: 0, 
    bithopper: 0, gridout: 0, coinrain: 0, speeddriver: 0, mathrush: 0, 
    colormatch: 0, soundwave: 0, multixox: 0, multitank: 0,
    neonpacman: 0, spaceinvaders: 0, stack: 0, helixjump: 0, frogger: 0,
    2048: 0, tetris: 0, minesweeper: 0, trafficracer: 0, suika: 0,
    aimtrainer: 0, asteroids: 0, memorymatch: 0, archery: 0, crossyroad: 0,
    allTimePlayer: "" 
};
let savedScores = JSON.parse(localStorage.getItem("arc_scores")) || {};
let arcadeScores = { ...defaultScores, ...savedScores };

// --- OYUN DEĞİŞKENLERİ ---
let yilanHamleKuyrugu = []; let snake = []; let food = {x:0, y:0}; let dx = gridSize, dy = 0;
let paddle = { x: 160, y: 370, width: 90, height: 12, speed: 14 }; let ball = { x: 200, y: 200, radius: 7, dx: 4, dy: -4 }; let bricks = [];
let playerShip = { x: 180, y: 360, width: 40, height: 20, speed: 9 }; let playerLasers = []; let invaders = []; let invaderDirection = 1; let spaceWave = 1;
let bird = { x: 50, y: 150, velocity: 0, gravity: 0.5, jump: -7, radius: 10 }; let pipes = [];
let pongPad = { y: 160, width: 10, height: 80, speed: 8 }; let aiPad = { y: 160, width: 10, height: 80, speed: 3.5 }; let pongBall = { x: 200, y: 200, dx: 4, dy: 3 };

// DINO RUN & ESKİ ARCADE DEĞİŞKENLERİ
let dino = { x: 50, y: 300, w: 20, h: 40, vy: 0, gravity: 0.8, jump: -12, grounded: true }; let cactuses = []; let dinoTimer = 0;
let catcher = { x: 160, y: 360, w: 60, h: 15, speed: 10 }; let catchStars = []; let catchTimer = 0;
let isDrawing = false; let garticStrokes = [];

// --- YENİ EKLENEN 15 OYUNUN MOTOR DEĞİŞKENLERİ ---
let pacman = { x: 200, y: 300, r: 12, speed: 3, dx: 0, dy: 0 }; let pacDots = []; let pacGhosts = [];
let siInvaders = []; let siDirection = 1; let siLaser = null;
let stackBlocks = []; let stackCurrent = { x: 0, w: 150, speed: 4, dir: 1 }; let stackHeight = 30;
let hlxBall = { x: 200, y: 150, vy: 0, r: 8 }; let hlxRot = 0; let hlxLayers = [];
let frogUser = { x: 190, y: 370, w: 20, h: 20 }; let frogLogs = []; let frogCars = [];
let board2048 = [];
let tetrisGrid = []; let tetrisCurrent = null; let tetrisTimer = 0;
let msGrid = []; let msOver = false;
let trPlayer = { x: 185, lane: 1 }; let trCars = []; let trSpeed = 4;
let suikaBalls = []; let suikaCurrent = null;
let aimTargets = []; let aimTimer = 0;
let astShip = { x: 200, y: 200, angle: 0, rotSpeed: 0.05, speed: 0, vx: 0, vy: 0 }; let astRocks = []; let astLasers = [];
let memCards = []; let memSelected = []; let memTimer = 0;
let archBow = { angle: 0, power: 0, isCharging: false }; let archArrow = null; let archTarget = { y: 150, dir: 1 };
let crPlayer = { x: 190, y: 370 }; let crRows = [];

let keysPressed = {};

window.addEventListener("keydown", e => { 
    keysPressed[e.key] = true; initAudio(); 
    if(isGameWaitingToStart && isGameRunning) { isGameWaitingToStart = false; } 
    const key = e.key.toLowerCase();
    
    if (activeGame === "snake") {
        if ((key === "arrowleft" || key === "a") && yilanHamleKuyrugu[yilanHamleKuyrugu.length - 1] !== "SOL") yilanHamleKuyrugu.push("SOL");
        if ((key === "arrowright" || key === "d") && yilanHamleKuyrugu[yilanHamleKuyrugu.length - 1] !== "SAG") yilanHamleKuyrugu.push("SAG");
        if ((key === "arrowup" || key === "w") && yilanHamleKuyrugu[yilanHamleKuyrugu.length - 1] !== "YUKARI") yilanHamleKuyrugu.push("YUKARI");
        if ((key === "arrowdown" || key === "s") && yilanHamleKuyrugu[yilanHamleKuyrugu.length - 1] !== "ASAGI") yilanHamleKuyrugu.push("ASAGI");
    } else if (activeGame === "neonpacman") {
        if (key === "arrowleft" || key === "a") { pacman.dx = -pacman.speed; pacman.dy = 0; }
        if (key === "arrowright" || key === "d") { pacman.dx = pacman.speed; pacman.dy = 0; }
        if (key === "arrowup" || key === "w") { pacman.dx = 0; pacman.dy = -pacman.speed; }
        if (key === "arrowdown" || key === "s") { pacman.dx = 0; pacman.dy = pacman.speed; }
    } else if (activeGame === "2048") {
        if (key === "arrowleft" || key === "a") { move2048('left'); }
        if (key === "arrowright" || key === "d") { move2048('right'); }
        if (key === "arrowup" || key === "w") { move2048('up'); }
        if (key === "arrowdown" || key === "s") { move2048('down'); }
    } else if (activeGame === "tetris") {
        if (key === "arrowleft" || key === "a") moveTetris(-1, 0);
        if (key === "arrowright" || key === "d") moveTetris(1, 0);
        if (key === "arrowdown" || key === "s") moveTetris(0, 1);
        if (key === "arrowup" || key === "w") rotateTetris();
    } else if (activeGame === "frogger" || activeGame === "crossyroad") {
        if (key === "arrowleft" || key === "a") moveFrog(-25, 0);
        if (key === "arrowright" || key === "d") moveFrog(25, 0);
        if (key === "arrowup" || key === "w") moveFrog(0, -25);
        if (key === "arrowdown" || key === "s") moveFrog(0, 25);
    } else {
        if (key === "arrowleft" || key === "a") moveLeft();
        if (key === "arrowright" || key === "d") moveRight();
        if (key === "arrowup" || key === "w") actionKey();
    }
    if (e.key === " ") { actionKey(); }
});
window.addEventListener("keyup", e => { keysPressed[e.key] = false; });

// --- SES SİSTEMİ ---
function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function playSound(type) {
    if (!audioCtx) return;
    try {
        let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain(); osc.connect(gain); gain.connect(audioCtx.destination);
        if (type === "dink") { osc.frequency.setValueAtTime(440, audioCtx.currentTime); gain.gain.setValueAtTime(0.1, audioCtx.currentTime + 0.1); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1); osc.start(); osc.stop(audioCtx.currentTime + 0.1); }
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

// --- BAŞLANGIÇ YÖNETİMİ ---
window.onload = function() {
    updateGoldUI(); updateLeaderboardUI(); updateShopUI();
    const savedName = localStorage.getItem("arc_username");
    if (savedName) { currentPlayer = savedName; if(nameModal) nameModal.style.display = "none"; if(welcomeText) welcomeText.innerText = "🎮 Efearaz44 Arcade'e Hoş geldin!"; }
    
    if(document.getElementById("bgmBtn")) document.getElementById("bgmBtn").addEventListener("click", toggleBGM);
    
    const gameButtons = {
        "Snake": "snake", "Brick": "brick", "Space": "space", "Flappy": "flappy", "Pong": "pong",
        "Multi": "multi", "Gartic": "gartic", "Dino": "dino", "Catch": "catch",
        "Neonpacman": "neonpacman", "Spaceinvaders": "spaceinvaders", "Stack": "stack", "Helixjump": "helixjump", "Frogger": "frogger",
        "2048": "2048", "Tetris": "tetris", "Minesweeper": "minesweeper", "Trafficracer": "trafficracer", "Suika": "suika",
        "Aimtrainer": "aimtrainer", "Asteroids": "asteroids", "Memorymatch": "memorymatch", "Archery": "archery", "Crossyroad": "crossyroad"
    };
    Object.keys(gameButtons).forEach(key => {
        let btn = document.getElementById("select" + key) || document.getElementById("select" + key.toLowerCase()) || document.getElementById("select" + key.toUpperCase());
        if(btn) btn.addEventListener("click", () => switchGame(gameButtons[key]));
    });

    if(document.getElementById("shopBtn")) document.getElementById("shopBtn").addEventListener("click", () => { if(shopPanel) shopPanel.classList.toggle("hidden"); });
    if(startBtn) startBtn.addEventListener("click", startActiveGame); if(mobileStartBtn) mobileStartBtn.addEventListener("click", startActiveGame);
    
    setupCanvasClicks();
    switchGame("snake");
};

if(saveNameBtn) {
    saveNameBtn.addEventListener("click", () => {
        let name = usernameInput.value.trim(); 
        if (!name) return alert("Geçerli bir isim yazmalısın!");
        const passwordInput = document.getElementById("passwordInput");
        let sifre = passwordInput ? passwordInput.value.trim() : "";
        if (!sifre) return alert("Lütfen hesabınız için bir şifre giriniz iki gözümün çiçeği!");

        const yasakliKelimeler = ["31", "otuzbir", "piç", "sik", "sg", "sktir", "orospu", "oç", "göt", "amk", "aq", "yarrak", "fuck", "bitch", "pezevenk", "şerefsiz", "salak", "gerizekalı", "mal"]; 
        const kontrolIsmi = name.toLowerCase().replace(/\s+/g, ''); 
        const yasakliBulundu = yasakliKelimeler.some(kelime => kontrolIsmi.includes(kelime.toLowerCase().replace(/\s+/g, '')));
        if (yasakliBulundu) { alert("Lütfen düzgün bir kullanıcı adı giriniz! 🚫"); return; }

        if (typeof firebase !== "undefined") {
            const db = firebase.database();
            db.ref('kullanicilar/' + name).once('value', (snapshot) => {
                if (snapshot.exists()) {
                    if (snapshot.val().sifre === sifre) {
                        currentPlayer = name; localStorage.setItem("arc_username", name); 
                        if(nameModal) nameModal.style.display = "none"; if(welcomeText) welcomeText.innerText = `🎮 Hoş geldin, ${currentPlayer}!`;
                    } else { alert("Şifre hatalı veya bu isim başkasına ait kral!"); }
                } else {
                    db.ref('kullanicilar/' + name).set({ sifre: sifre, kayitTarihi: new Date().toLocaleDateString() }).then(() => {
                        currentPlayer = name; localStorage.setItem("arc_username", name); 
                        if(nameModal) nameModal.style.display = "none"; if(welcomeText) welcomeText.innerText = `🎮 Hoş geldin, ${currentPlayer}!`;
                    });
                }
            });
        } else {
            currentPlayer = name; localStorage.setItem("arc_username", name); 
            if(nameModal) nameModal.style.display = "none"; if(welcomeText) welcomeText.innerText = `🎮 Hoş geldin, ${currentPlayer}!`;
        }
    });
}

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
    else if (g === "gartic") { if(welcomeText) welcomeText.innerText = "🎨 Neon Çizim (Gartic Modu)"; initGartic(); startActiveGame(); }
    else if (g === "dino") { if(welcomeText) welcomeText.innerText = "Rex Neon Dino Run"; initDino(); }
    else if (g === "catch") { if(welcomeText) welcomeText.innerText = "🌟 Yıldız Avcısı"; initCatch(); }
    
    // 15 Yeni Arcade Başlıkları
    else if (g === "neonpacman") { if(welcomeText) welcomeText.innerText = "🟡 Neon Pacman Labirent Kaçışı"; initNeonPacman(); }
    else if (g === "spaceinvaders") { if(welcomeText) welcomeText.innerText = "👾 Space Invaders İstila Koruyucusu"; initSpaceInvaders(); }
    else if (g === "stack") { if(welcomeText) welcomeText.innerText = "🧱 Stack Neon Kule Dizme"; initStack(); }
    else if (g === "helixjump") { if(welcomeText) welcomeText.innerText = "🌀 Helix Jump Kule İndirme"; initHelixJump(); }
    else if (g === "frogger") { if(welcomeText) welcomeText.innerText = "🐸 Frogger Şerit Trafik Mücadelesi"; initFrogger(); }
    else if (g === "2048") { if(welcomeText) welcomeText.innerText = "🟨 2048 Sayı Birleştirme"; init2048(); }
    else if (g === "tetris") { if(welcomeText) welcomeText.innerText = "🟥 Tetris Klasik Blok Arenası"; initTetris(); }
    else if (g === "minesweeper") { if(welcomeText) welcomeText.innerText = "💣 Minesweeper Mayın Tarlası"; initMinesweeper(); }
    else if (g === "trafficracer") { if(welcomeText) welcomeText.innerText = "🚗 Traffic Racer Neon Makas Yarışı"; initTrafficRacer(); }
    else if (g === "suika") { if(welcomeText) welcomeText.innerText = "🍉 Suika Game Kozmik Birleştirme"; initSuika(); }
    else if (g === "aimtrainer") { if(welcomeText) welcomeText.innerText = "🎯 Aim Trainer Refleks Geliştirici"; initAimTrainer(); }
    else if (g === "asteroids") { if(welcomeText) welcomeText.innerText = "🚀 Asteroids Göktaşı Avı"; initAsteroids(); }
    else if (g === "memorymatch") { if(welcomeText) welcomeText.innerText = "🧩 Memory Match Kart Hafızası"; initMemoryMatch(); }
    else if (g === "archery") { if(welcomeText) welcomeText.innerText = "🏹 Archery Neon Rüzgar Okçuluğu"; initArchery(); }
    else if (g === "crossyroad") { if(welcomeText) welcomeText.innerText = "🐸 Crossy Road Mini Sonsuz Yol"; initCrossyRoad(); }
}

function startActiveGame() {
    if (!currentPlayer) return; score = 0; if(scoreElement) scoreElement.innerText = score; 
    isGameRunning = true; isGameWaitingToStart = true; 
    if(startBtn) startBtn.innerText = "Yeniden Başlat"; if(mobileStartBtn) mobileStartBtn.innerText = "Yeniden Başlat";
    
    if (activeGame === "snake") { initSnake(); isGameWaitingToStart = false; } 
    else if (activeGame === "brick") initBrick(); 
    else if (activeGame === "space") { spaceWave = 1; initSpace(); isGameWaitingToStart = false; } 
    else if (activeGame === "flappy") initFlappy(); 
    else if (activeGame === "pong") initPong();
    else if (activeGame === "gartic") { initGartic(); isGameWaitingToStart = false; }
    else if (activeGame === "dino") { initDino(); isGameWaitingToStart = false; }
    else if (activeGame === "catch") { initCatch(); isGameWaitingToStart = false; }
    
    // 15 Yeni Oyun Tetikleyicileri
    else if (activeGame === "neonpacman") { initNeonPacman(); isGameWaitingToStart = false; }
    else if (activeGame === "spaceinvaders") { initSpaceInvaders(); isGameWaitingToStart = false; }
    else if (activeGame === "stack") { initStack(); isGameWaitingToStart = false; }
    else if (activeGame === "helixjump") { initHelixJump(); isGameWaitingToStart = false; }
    else if (activeGame === "frogger") { initFrogger(); isGameWaitingToStart = false; }
    else if (activeGame === "2048") { init2048(); isGameWaitingToStart = false; }
    else if (activeGame === "tetris") { initTetris(); isGameWaitingToStart = false; }
    else if (activeGame === "minesweeper") { initMinesweeper(); isGameWaitingToStart = false; }
    else if (activeGame === "trafficracer") { initTrafficRacer(); isGameWaitingToStart = false; }
    else if (activeGame === "suika") { initSuika(); isGameWaitingToStart = false; }
    else if (activeGame === "aimtrainer") { initAimTrainer(); isGameWaitingToStart = false; }
    else if (activeGame === "asteroids") { initAsteroids(); isGameWaitingToStart = false; }
    else if (activeGame === "memorymatch") { initMemoryMatch(); isGameWaitingToStart = false; }
    else if (activeGame === "archery") { initArchery(); isGameWaitingToStart = false; }
    else if (activeGame === "crossyroad") { initCrossyRoad(); isGameWaitingToStart = false; }

    clearInterval(gameInterval); 
    const singleDrawGames = ["gartic", "2048", "minesweeper", "memorymatch"];
    if(!singleDrawGames.includes(activeGame)) {
        gameInterval = setInterval(updateEngine, activeGame === "snake" ? 100 : 1000 / 60);
    } else {
        updateEngine();
    }
}

function updateEngine() { 
    if (isGameWaitingToStart) { drawWaitingScreen(); return; } 
    handleContinuousInput(); 
    if (activeGame === "snake") updateSnake(); 
    else if (activeGame === "brick") updateBrick(); 
    else if (activeGame === "space") updateSpace(); 
    else if (activeGame === "flappy") updateFlappy(); 
    else if (activeGame === "pong") updatePong(); 
    else if (activeGame === "dino") updateDino();
    else if (activeGame === "catch") updateCatch();
    else if (activeGame === "gartic") drawGartic();
    
    // 15 Yeni Oyun Motor Güncellemeleri
    else if (activeGame === "neonpacman") updateNeonPacman();
    else if (activeGame === "spaceinvaders") updateSpaceInvaders();
    else if (activeGame === "stack") updateStack();
    else if (activeGame === "helixjump") updateHelixJump();
    else if (activeGame === "frogger") updateFrogger();
    else if (activeGame === "2048") draw2048();
    else if (activeGame === "tetris") updateTetris();
    else if (activeGame === "minesweeper") drawMinesweeper();
    else if (activeGame === "trafficracer") updateTrafficRacer();
    else if (activeGame === "suika") updateSuika();
    else if (activeGame === "aimtrainer") updateAimTrainer();
    else if (activeGame === "asteroids") updateAsteroids();
    else if (activeGame === "memorymatch") drawMemoryMatch();
    else if (activeGame === "archery") updateArchery();
    else if (activeGame === "crossyroad") updateCrossyRoad();
}

function drawWaitingScreen() { 
    ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(0, 0, canvas.width, canvas.height); 
    ctx.fillStyle = "#00ffcc"; ctx.font = "bold 16px Arial"; ctx.textAlign = "center"; 
    ctx.fillText("HAZIR! BAŞLAMAK İÇİN BURAYA TIKLAYIN", canvas.width / 2, canvas.height / 2); 
}

function handleContinuousInput() { 
    if (!isGameRunning) return; 
    if (keysPressed["ArrowLeft"] || keysPressed["a"] || keysPressed["A"]) moveLeft(); 
    if (keysPressed["ArrowRight"] || keysPressed["d"] || keysPressed["D"]) moveRight(); 
}

function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX = e.clientX || (e.touches && e.touches[0].clientX);
    let clientY = e.clientY || (e.touches && e.touches[0].clientY);
    return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
    };
}

function setupCanvasClicks() {
    canvas.addEventListener("mousedown", e => {
        let p = getCanvasCoordinates(e);
        if (isGameWaitingToStart) { isGameRunning = true; isGameWaitingToStart = false; }
        
        if (activeGame === "gartic" && isGameRunning) {
            isDrawing = true; garticStrokes.push({ x: p.x, y: p.y, color: getSkinColors().head, type: 'start' });
        } else if (activeGame === "minesweeper" && isGameRunning) {
            clickMinesweeper(p.x, p.y);
        } else if (activeGame === "memorymatch" && isGameRunning) {
            clickMemoryMatch(p.x, p.y);
        } else if (activeGame === "aimtrainer" && isGameRunning) {
            clickAimTrainer(p.x, p.y);
        } else if (activeGame === "suika" && isGameRunning) {
            dropSuikaBall(p.x);
        }
    });

    canvas.addEventListener("mousemove", e => {
        let p = getCanvasCoordinates(e);
        if (activeGame === "gartic" && isDrawing) {
            garticStrokes.push({ x: p.x, y: p.y, color: getSkinColors().head, type: 'draw' });
            drawGartic();
        }
    });

    window.addEventListener("mouseup", () => { isDrawing = false; });
}

function getSkinColors() {
    if (currentSkin === "gold") return { head: "#ffd700", body: "#ffb700" };
    if (currentSkin === "neon") return { head: "#00ffcc", body: "#ff0055" };
    if (currentSkin === "cyber") return { head: "#bf55ec", body: "#22a7f0" };
    return { head: "#00ff00", body: "#00aa00" };
}

// ============================================================================
// --- 10 ORİJİNAL ARCADE OYUN MOTORU (HİÇ DOKUNULMADI, DEĞİŞTİRİLMEDİ) ---
// ============================================================================
function initSnake() { snake = [{x:160, y:160},{x:140, y:160},{x:120, y:160}]; dx = gridSize; dy = 0; yilanHamleKuyrugu = []; spawnFood(); }
function spawnFood() { food.x = Math.floor(Math.random() * (canvas.width/gridSize)) * gridSize; food.y = Math.floor(Math.random() * (canvas.height/gridSize)) * gridSize; }
function updateSnake() {
    if (yilanHamleKuyrugu.length > 0) { const hamle = yilanHamleKuyrugu.shift(); if (hamle === "SOL" && dx === 0) { dx = -gridSize; dy = 0; } if (hamle === "SAG" && dx === 0) { dx = gridSize; dy = 0; } if (hamle === "YUKARI" && dy === 0) { dx = 0; dy = -gridSize; } if (hamle === "ASAGI" && dy === 0) { dx = 0; dy = gridSize; } }
    const head = {x: snake[0].x + dx, y: snake[0].y + dy}; if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) return gameOver(); for (let i=0; i<snake.length; i++) { if (snake[i].x === head.x && snake[i].y === head.y) return gameOver(); } snake.unshift(head);
    if (head.x === food.x && head.y === food.y) { score += 10; if(scoreElement) scoreElement.innerText = score; addGold(2); playSound("coin"); spawnFood(); } else { snake.pop(); } drawSnake();
}
function drawSnake() { ctx.fillStyle = "#111"; ctx.fillRect(0,0,canvas.width,canvas.height); let sc = getSkinColors(); snake.forEach((part, idx) => { ctx.fillStyle = idx === 0 ? sc.head : sc.body; ctx.fillRect(part.x, part.y, gridSize-2, gridSize-2); }); ctx.fillStyle = "#ff0055"; ctx.fillRect(food.x, food.y, gridSize-2, gridSize-2); }

function initBrick() { ball.x = 200; ball.y = 200; ball.dx = 4; ball.dy = -4; bricks = []; for(let c=0; c<5; c++) { for(let r=0; r<6; r++) { bricks.push({x: r*60 + 25, y: c*20 + 40, status: 1}); } } }
function updateBrick() { ball.x += ball.dx; ball.y += ball.dy; if(ball.x < 0 || ball.x > canvas.width) ball.dx = -ball.dx; if(ball.y < 0) ball.dy = -ball.dy; if(ball.y > canvas.height) return gameOver(); if(ball.y >= paddle.y && ball.y <= paddle.y+paddle.height && ball.x >= paddle.x && ball.x <= paddle.x+paddle.width) { ball.dy = -Math.abs(ball.dy); playSound("dink"); } bricks.forEach(b => { if(b.status === 1 && ball.x >= b.x && ball.x <= b.x+50 && ball.y >= b.y && ball.y <= b.y+15) { b.status = 0; ball.dy = -ball.dy; score += 20; if(scoreElement) scoreElement.innerText = score; addGold(1); playSound("coin"); } }); if(bricks.filter(b=>b.status===1).length===0) initBrick(); drawBrick(); }
function drawBrick() { ctx.fillStyle = "#111"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle = getSkinColors().head; ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height); ctx.fillStyle = "#ff0055"; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2); ctx.fill(); bricks.forEach(b => { if(b.status === 1) { ctx.fillStyle = "#00ffcc"; ctx.fillRect(b.x, b.y, 50, 15); } }); }

function initSpace() { invaders = []; playerLasers = []; for(let g=0; g<3; g++) { for(let i=0; i<6; i++) { invaders.push({x: i*50 + 40, y: g*30 + 50, alive: true}); } } }
function updateSpace() { playerLasers.forEach((l, lIdx) => { l.y -= 6; if(l.y < 0) playerLasers.splice(lIdx, 1); invaders.forEach(inv => { if(inv.alive && l.x >= inv.x && l.x <= inv.x+30 && l.y >= inv.y && l.y <= inv.y+20) { inv.alive = false; playerLasers.splice(lIdx, 1); score += 30; if(scoreElement) scoreElement.innerText = score; addGold(3); playSound("boom"); } }); }); let hitWall = false; invaders.forEach(inv => { if(inv.alive) { inv.x += invantionSpeed() * inverMod(); if(inv.x > canvas.width - 30 || inv.x < 0) hitWall = true; if(inv.y > playerShip.y) gameOver(); } }); if(hitWall) { invaderDirection *= -1; invaders.forEach(inv => { if(inv.alive) inv.y += 15; }); } if(invaders.filter(i=>i.alive).length===0) { spaceWave++; initSpace(); } drawSpace(); }
function invantionSpeed() { return 1 + (spaceWave * 0.3); } function inverMod() { return invaderDirection; }
function drawSpace() { ctx.fillStyle = "#111"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle = getSkinColors().head; ctx.fillRect(playerShip.x, playerShip.y, playerShip.width, playerShip.height); ctx.fillStyle = "#ff0055"; playerLasers.forEach(l => ctx.fillRect(l.x, l.y, 3, 10)); invaders.forEach(inv => { if(inv.alive) { ctx.fillStyle = "#00e676"; ctx.fillRect(inv.x, inv.y, 30, 20); } }); }

function initFlappy() { bird.y = 150; bird.velocity = 0; pipes = []; }
function updateFlappy() { bird.velocity += bird.gravity; bird.y += bird.velocity; if(bird.y > canvas.height || bird.y < 0) return gameOver(); if(Math.random() < 0.015) { pipes.push({x: canvas.width, top: Math.random()*150 + 50, bottom: Math.random()*150 + 50, passed: false}); } pipes.forEach((p, idx) => { p.x -= 3; if(p.x < -50) pipes.splice(idx, 1); if(!p.passed && p.x < bird.x) { p.passed = true; score += 50; if(scoreElement) scoreElement.innerText = score; addGold(5); playSound("coin"); } if(bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + 50) { if(bird.y - bird.radius < p.top || bird.y + bird.radius > canvas.height - p.bottom) gameOver(); } }); drawFlappy(); }
function drawFlappy() { ctx.fillStyle = "#111"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle = getSkinColors().head; ctx.beginPath(); ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = "#00b0ff"; pipes.forEach(p => { ctx.fillRect(p.x, 0, 50, p.top); ctx.fillRect(p.x, canvas.height - p.bottom, 50, p.bottom); }); }

function initPong() { pongBall.x = 200; pongBall.y = 200; pongBall.dx = 4; pongBall.dy = 3; }
function updatePong() { pongBall.x += pongBall.dx; pongBall.y += pongBall.dy; if(pongBall.y < 0 || pongBall.y > canvas.height) pongBall.dy = -pongBall.dy; if(pongBall.x < 0) { score += 100; if(scoreElement) scoreElement.innerText = score; addGold(10); initPong(); } if(pongBall.x > canvas.width) return gameOver(); if(pongBall.x <= 20 && pongBall.y >= pongPad.y && pongBall.y <= pongPad.y + pongPad.height) { pongBall.dx = Math.abs(pongBall.dx); playSound("dink"); } if(pongBall.x >= canvas.width - 20 && pongBall.y >= aiPad.y && pongBall.y <= aiPad.y + aiPad.height) { pongBall.dx = -Math.abs(pongBall.dx); playSound("dink"); } aiPad.y += (pongBall.y - (aiPad.y + 40)) * 0.06; drawPong(); }
function drawPong() { ctx.fillStyle = "#111"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle = getSkinColors().head; ctx.fillRect(10, pongPad.y, pongPad.width, pongPad.height); ctx.fillStyle = "#ff1744"; ctx.fillRect(canvas.width - 20, aiPad.y, aiPad.width, aiPad.height); ctx.fillStyle = "#fff"; ctx.fillRect(pongBall.x, pongBall.y, 8, 8); }

function initGartic() { garticStrokes = []; isDrawing = false; }
function drawGartic() { ctx.fillStyle = "#111"; ctx.fillRect(0, 0, canvas.width, canvas.height); garticStrokes.forEach(s => { ctx.fillStyle = s.color; ctx.fillRect(s.x, s.y, 6, 6); }); }

function initDino() { dino.y = 300; dino.vy = 0; dino.grounded = true; cactuses = []; dinoTimer = 0; }
function updateDino() { dinoTimer++; if(!dino.grounded) { dino.vy += dino.gravity; dino.y += dino.vy; if(dino.y >= 300) { dino.y = 300; dino.vy = 0; dino.grounded = true; } } if(dinoTimer % 90 === 0) { cactuses.push({x: canvas.width, w: 15, h: 30 + Math.random()*20}); } cactuses.forEach((c, idx) => { c.x -= 4; if(c.x < -20) { cactuses.splice(idx, 1); score += 15; if(scoreElement) scoreElement.innerText = score; addGold(1); } if(dino.x < c.x + c.w && dino.x + dino.w > c.x && dino.y < 300 + c.h && dino.y + dino.h > 300) gameOver(); }); drawDino(); }
function drawDino() { ctx.fillStyle = "#111"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle = getSkinColors().head; ctx.fillRect(dino.x, dino.y, dino.w, dino.h); ctx.fillStyle = "#ff9100"; cactuses.forEach(c => ctx.fillRect(c.x, 340 - c.h, c.w, c.h)); ctx.strokeStyle = "#fff"; ctx.beginPath(); ctx.moveTo(0, 340); ctx.lineTo(canvas.width, 340); ctx.stroke(); }

function initCatch() { catcher.x = 160; catchStars = []; catchTimer = 0; }
function updateCatch() { catchTimer++; if(catchTimer % 45 === 0) { catchStars.push({x: Math.random()*(canvas.width-20), y: 0, r: 6}); } catchStars.forEach((s, idx) => { s.y += 3.5; if(s.y > canvas.height) catchStars.splice(idx, 1); if(s.y >= catcher.y && s.y <= catcher.y+catcher.h && s.x >= catcher.x && s.x <= catcher.x+catcher.w) { catchStars.splice(idx, 1); score += 25; if(scoreElement) scoreElement.innerText = score; addGold(2); playSound("coin"); } }); drawCatch(); }
function drawCatch() { ctx.fillStyle = "#111"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle = getSkinColors().head; ctx.fillRect(catcher.x, catcher.y, catcher.w, catcher.h); ctx.fillStyle = "#ffd700"; catchStars.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill(); }); }

function initMulti() { if (typeof window.initMulti === "function") window.initMulti(); }

// --- ORTAK KLASİK KONTROLLER ---
function moveLeft() {
    if (activeGame === "brick" && paddle.x > 0) paddle.x -= paddle.speed;
    if (activeGame === "space" && playerShip.x > 0) playerShip.x -= playerShip.speed;
    if (activeGame === "pong" && pongPad.y > 0) pongPad.y -= pongPad.speed;
    if (activeGame === "catch" && catcher.x > 0) catcher.x -= catcher.speed;
    if (activeGame === "trafficracer") { trPlayer.lane = Math.max(0, trPlayer.lane - 1); trPlayer.x = 85 + trPlayer.lane * 100; }
}
function moveRight() {
    if (activeGame === "brick" && paddle.x < canvas.width - paddle.width) paddle.x += paddle.speed;
    if (activeGame === "space" && playerShip.x < canvas.width - playerShip.width) playerShip.x += playerShip.speed;
    if (activeGame === "pong" && pongPad.y < canvas.height - pongPad.height) pongPad.y += pongPad.speed;
    if (activeGame === "catch" && catcher.x < canvas.width - catcher.w) catcher.x += catcher.speed;
    if (activeGame === "trafficracer") { trPlayer.lane = Math.min(2, trPlayer.lane + 1); trPlayer.x = 85 + trPlayer.lane * 100; }
}
function actionKey() {
    if (activeGame === "flappy") { bird.velocity = bird.jump; playSound("dink"); }
    if (activeGame === "space") { playerLasers.push({x: playerShip.x + 18, y: playerShip.y}); playSound("laser"); }
    if (activeGame === "dino" && dino.grounded) { dino.vy = dino.jump; dino.grounded = false; playSound("dink"); }
    if (activeGame === "spaceinvaders" && !siLaser) { siLaser = { x: playerShip.x + 18, y: playerShip.y }; playSound("laser"); }
    if (activeGame === "stack") dropStackBlock();
    if (activeGame === "helixjump") hlxBall.vy = -6;
    if (activeGame === "asteroids") { astLasers.push({ x: astShip.x, y: astShip.y, vx: Math.cos(astShip.angle)*6, vy: Math.sin(astShip.angle)*6 }); playSound("laser"); }
    if (activeGame === "archery") { if(!archArrow) fireArcheryArrow(); }
}
function moveFrog(mx, my) { frogUser.x += mx; frogUser.y += my; }

// ============================================================================
// --- YENİ GÜNCELLEME: 15 SÜPER RETRO ARCADE OYUN MOTORU ---
// ============================================================================

// 1. NEON PACMAN
function initNeonPacman() { pacman.x = 200; pacman.y = 300; pacman.dx = 0; pacman.dy = 0; pacDots = []; pacGhosts = []; for(let i=30; i<canvas.width; i+=40) { for(let j=50; j<canvas.height-50; j+=40) { pacDots.push({x: i, y: j}); } } pacGhosts.push({x: 50, y: 50, dx: 2, dy: 0, color: "#ff0055"}, {x: 350, y: 50, dx: -2, dy: 0, color: "#00b0ff"}); }
function updateNeonPacman() { pacman.x += pacman.dx; pacman.y += pacman.dy; if(pacman.x < 0) pacman.x = canvas.width; if(pacman.x > canvas.width) pacman.x = 0; if(pacman.y < 0) pacman.y = canvas.height; if(pacman.y > canvas.height) pacman.y = 0; pacDots.forEach((d, idx) => { let dist = Math.hypot(pacman.x - d.x, pacman.y - d.y); if(dist < 15) { pacDots.splice(idx,1); score += 10; if(scoreElement) scoreElement.innerText = score; addGold(1); playSound("coin"); } }); pacGhosts.forEach(g => { g.x += g.dx; g.y += g.dy; if(g.x < 20 || g.x > canvas.width-20) g.dx *= -1; if(Math.random()<0.02) { if(Math.random()>0.5) { g.dx = (Math.random()>0.5?2:-2); g.dy = 0; } else { g.dy = (Math.random()>0.5?2:-2); g.dx = 0; } } if(Math.hypot(pacman.x - g.x, pacman.y - g.y) < 20) gameOver(); }); if(pacDots.length === 0) initNeonPacman(); drawNeonPacman(); }
function drawNeonPacman() { ctx.fillStyle = "#111"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle = "#ffd700"; ctx.beginPath(); ctx.arc(pacman.x, pacman.y, pacman.r, 0.2*Math.PI, 1.8*Math.PI); ctx.lineTo(pacman.x, pacman.y); ctx.fill(); ctx.fillStyle = "#fff"; pacDots.forEach(d => { ctx.beginPath(); ctx.arc(d.x, d.y, 3, 0, Math.PI*2); ctx.fill(); }); pacGhosts.forEach(g => { ctx.fillStyle = g.color; ctx.fillRect(g.x-10, g.y-10, 20, 20); }); }

// 2. SPACE INVADERS
function initSpaceInvaders() { siInvaders = []; siDirection = 1; siLaser = null; for(let r=0; r<4; r++) { for(let c=0; c<7; c++) { siInvaders.push({ x: c * 45 + 50, y: r * 25 + 50, alive: true }); } } }
function updateSpaceInvaders() { if (keysPressed["ArrowLeft"] || keysPressed["a"]) { if (playerShip.x > 0) playerShip.x -= 5; } if (keysPressed["ArrowRight"] || keysPressed["d"]) { if (playerShip.x < canvas.width - playerShip.width) playerShip.x += 5; } let edge = false; siInvaders.forEach(inv => { if (inv.alive) { inv.x += siDirection * 1.5; if (inv.x > canvas.width - 30 || inv.x < 10) edge = true; if (inv.y > playerShip.y) gameOver(); } }); if (edge) { siDirection *= -1; siInvaders.forEach(inv => { if(inv.alive) inv.y += 15; }); } if (siLaser) { siLaser.y -= 7; if (siLaser.y < 0) siLaser = null; else { siInvaders.forEach(inv => { if (inv.alive && siLaser && siLaser.x >= inv.x && siLaser.x <= inv.x + 30 && siLaser.y >= inv.y && siLaser.y <= inv.y + 20) { inv.alive = false; siLaser = null; score += 20; if(scoreElement) scoreElement.innerText = score; addGold(2); playSound("boom"); } }); } } if (siInvaders.filter(i => i.alive).length === 0) initSpaceInvaders(); drawSpaceInvaders(); }
function drawSpaceInvaders() { ctx.fillStyle = "#111"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle = getSkinColors().head; ctx.fillRect(playerShip.x, playerShip.y, playerShip.width, playerShip.height); if (siLaser) { ctx.fillStyle = "#ff0055"; ctx.fillRect(siLaser.x, siLaser.y, 4, 12); } siInvaders.forEach(inv => { if (inv.alive) { ctx.fillStyle = "#00ffcc"; ctx.fillRect(inv.x, inv.y, 30, 18); } }); }

// 3. STACK
function initStack() { stackBlocks = [{ x: 100, w: 200, y: 370 }]; stackCurrent = { x: 0, w: 200, speed: 3.5, dir: 1 }; }
function dropStackBlock() { let last = stackBlocks[stackBlocks.length - 1]; if (stackCurrent.x < last.x) { let diff = last.x - stackCurrent.x; stackCurrent.w -= diff; stackCurrent.x = last.x; } else if (stackCurrent.x > last.x) { let diff = stackCurrent.x - last.x; stackCurrent.w -= diff; } if (stackCurrent.w <= 0) { gameOver(); } else { stackBlocks.push({ x: stackCurrent.x, w: stackCurrent.w, y: 370 - stackBlocks.length * 15 }); score += 100; if(scoreElement) scoreElement.innerText = score; addGold(5); playSound("coin"); stackCurrent = { x: 0, w: stackCurrent.w, speed: 3.5 + (stackBlocks.length * 0.2), dir: 1 }; if (stackBlocks.length > 15) { stackBlocks.forEach(b => b.y += 15); stackBlocks.shift(); } } }
function updateStack() { stackCurrent.x += stackCurrent.speed * stackCurrent.dir; if (stackCurrent.x < 0 || stackCurrent.x + stackCurrent.w > canvas.width) stackCurrent.dir *= -1; drawStack(); }
function drawStack() { ctx.fillStyle = "#111"; ctx.fillRect(0,0,canvas.width,canvas.height); stackBlocks.forEach((b, i) => { ctx.fillStyle = `hsl(${(i * 20) % 360}, 100%, 50%)`; ctx.fillRect(b.x, b.y, b.w, 12); }); ctx.fillStyle = "#fff"; ctx.fillRect(stackCurrent.x, 370 - stackBlocks.length * 15, stackCurrent.w, 12); }

// 4. HELIX JUMP 2D
function initHelixJump() { hlxBall = { x: 200, y: 150, vy: 0, r: 8 }; hlxRot = 0; hlxLayers = []; for(let i=0; i<6; i++) { hlxLayers.push({ y: i * 60 + 100, gap: Math.random() * Math.PI * 2 }); } }
function updateHelixJump() { hlxBall.vy += 0.25; hlxBall.y += hlxBall.vy; if (keysPressed["ArrowLeft"] || keysPressed["a"]) hlxRot -= 0.05; if (keysPressed["ArrowRight"] || keysPressed["d"]) hlxRot += 0.05; hlxLayers.forEach(lyr => { if (Math.abs(hlxBall.y - lyr.y) < 8 && hlxBall.vy > 0) { let relativeAngle = (Math.atan2(0, hlxBall.x - 200) - hlxRot) % (Math.PI * 2); if (relativeAngle < 0) relativeAngle += Math.PI * 2; let gapStart = lyr.gap; let gapEnd = lyr.gap + 0.8; if (relativeAngle > gapStart && relativeAngle < gapEnd) { score += 50; if(scoreElement) scoreElement.innerText = score; addGold(3); } else { hlxBall.vy = -6; playSound("dink"); } } lyr.y -= 0.5; if (lyr.y < 50) { lyr.y = 390; lyr.gap = Math.random() * Math.PI * 2; } }); if (hlxBall.y > canvas.height) gameOver(); drawHelixJump(); }
function drawHelixJump() { ctx.fillStyle = "#111"; ctx.fillRect(0,0,canvas.width,canvas.height); hlxLayers.forEach(lyr => { ctx.strokeStyle = "#00ffcc"; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(200, lyr.y, 80, hlxRot + lyr.gap + 0.8, hlxRot + lyr.gap); ctx.stroke(); }); ctx.fillStyle = "#ff0055"; ctx.beginPath(); ctx.arc(hlxBall.x, hlxBall.y, hlxBall.r, 0, Math.PI * 2); ctx.fill(); }

// 5. FROGGER
function initFrogger() { frogUser = { x: 190, y: 370, w: 20, h: 20 }; frogCars = []; for(let i=0; i<4; i++) { frogCars.push({ x: Math.random()*300, y: i * 50 + 100, speed: (Math.random() > 0.5 ? 2 : -2), w: 40 }); } }
function updateFrogger() { frogCars.forEach(c => { c.x += c.speed; if (c.x > canvas.width) c.x = -c.w; if (c.x < -c.w) c.x = canvas.width; if (frogUser.x < c.x + c.w && frogUser.x + frogUser.w > c.x && frogUser.y < c.y + 20 && frogUser.y + frogUser.h > c.y) { initFrogger(); gameOver(); } }); if (frogUser.y < 50) { score += 500; if(scoreElement) scoreElement.innerText = score; addGold(15); playSound("coin"); frogUser.y = 370; } drawFrogger(); }
function drawFrogger() { ctx.fillStyle = "#111"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle = "#00ffcc"; ctx.fillRect(0, 360, canvas.width, 40); ctx.fillRect(0, 40, canvas.width, 40); frogCars.forEach(c => { ctx.fillStyle = "#ff0055"; ctx.fillRect(c.x, c.y, c.w, 20); }); ctx.fillStyle = "#ffd700"; ctx.fillRect(frogUser.x, frogUser.y, frogUser.w, frogUser.h); }

// 6. 2048
function init2048() { board2048 = Array(4).fill(null).map(() => Array(4).fill(0)); spawn2048(); spawn2048(); draw2048(); }
function spawn2048() { let empty = []; for(let r=0; r<4; r++) { for(let c=0; c<4; c++) { if(board2048[r][c] === 0) empty.push({r, c}); } } if (empty.length > 0) { let cell = empty[Math.floor(Math.random()*empty.length)]; board2048[cell.r][cell.c] = Math.random() > 0.1 ? 2 : 4; } }
function move2048(dir) { 
    let changed = false;
    // Basit hücre kaydırma mantığı
    for (let i = 0; i < 4; i++) {
        let row = [];
        for (let j = 0; j < 4; j++) {
            let val = (dir === 'left' || dir === 'right') ? board2048[i][j] : board2048[j][i];
            if (val !== 0) row.push(val);
        }
        if (dir === 'right' || dir === 'down') row.reverse();
        let newRow = [];
        for (let j = 0; j < row.length; j++) {
            if (row[j] === row[j+1]) { newRow.push(row[j]*2); score += row[j]*2; addGold(1); row[j+1] = 0; changed = true; }
            else if (row[j] !== 0) { newRow.push(row[j]); }
        }
        while (newRow.length < 4) newRow.push(0);
        if (dir === 'right' || dir === 'down') newRow.reverse();
        for (let j = 0; j < 4; j++) {
            let old = (dir === 'left' || dir === 'right') ? board2048[i][j] : board2048[j][i];
            if (dir === 'left' || dir === 'right') board2048[i][j] = newRow[j]; else board2048[j][i] = newRow[j];
            if (old !== newRow[j]) changed = true;
        }
    }
    if (changed) { spawn2048(); playSound("dink"); if(scoreElement) scoreElement.innerText = score; }
    draw2048();
}
function draw2048() { ctx.fillStyle = "#111"; ctx.fillRect(0,0,canvas.width,canvas.height); for(let r=0; r<4; r++) { for(let c=0; c<4; c++) { let val = board2048[r][c]; ctx.fillStyle = val === 0 ? "#222" : `hsl(${(Math.log2(val)*40)%360}, 80%, 50%)`; ctx.fillRect(c*85+35, r*85+35, 75, 75); if(val > 0) { ctx.fillStyle = "#fff"; ctx.font = "bold 20px Arial"; ctx.textAlign = "center"; ctx.fillText(val, c*85+72, r*85+80); } } } }

// 7. TETRIS
function initTetris() { tetrisGrid = Array(20).fill(null).map(() => Array(10).fill(0)); spawnTetrisPiece(); }
function spawnTetrisPiece() { const shapes = [[[1,1,1,1]], [[1,1],[1,1]], [[0,1,0],[1,1,1]], [[1,1,0],[0,1,1]]]; let rand = shapes[Math.floor(Math.random()*shapes.length)]; tetrisCurrent = { matrix: rand, x: 4, y: 0, color: "#00ffcc" }; }
function moveTetris(mx, my) { tetrisCurrent.x += mx; tetrisCurrent.y += my; if (checkTetrisCollision()) { tetrisCurrent.x -= mx; tetrisCurrent.y -= my; if (my > 0) { lockTetrisPiece(); } return true; } return false; }
function rotateTetris() { let orig = tetrisCurrent.matrix; tetrisCurrent.matrix = orig[0].map((val, index) => orig.map(row => row[index]).reverse()); if (checkTetrisCollision()) tetrisCurrent.matrix = orig; }
function checkTetrisCollision() { for(let r=0; r<tetrisCurrent.matrix.length; r++) { for(let c=0; c<tetrisCurrent.matrix[r].length; c++) { if (tetrisCurrent.matrix[r][c]) { let gX = tetrisCurrent.x + c; let gY = tetrisCurrent.y + r; if (gX < 0 || gX >= 10 || gY >= 20) return true; if (gY >= 0 && tetrisGrid[gY][gX]) return true; } } } return false; }
function lockTetrisPiece() { for(let r=0; r<tetrisCurrent.matrix.length; r++) { for(let c=0; c<tetrisCurrent.matrix[r].length; c++) { if (tetrisCurrent.matrix[r][c]) { if(tetrisCurrent.y + r < 0) { gameOver(); return; } tetrisGrid[tetrisCurrent.y + r][tetrisCurrent.x + c] = tetrisCurrent.color; } } } checkTetrisLines(); spawnTetrisPiece(); }
function checkTetrisLines() { for(let r=19; r>=0; r--) { if (tetrisGrid[r].filter(c => c !== 0).length === 10) { tetrisGrid.splice(r, 1); tetrisGrid.unshift(Array(10).fill(0)); score += 100; addGold(5); playSound("coin"); r++; } } if(scoreElement) scoreElement.innerText = score; }
function updateTetris() { tetrisTimer++; if (tetrisTimer % 30 === 0) moveTetris(0, 1); drawTetris(); }
function drawTetris() { ctx.fillStyle = "#111"; ctx.fillRect(0,0,canvas.width,canvas.height); for(let r=0; r<20; r++) { for(let c=0; c<10; c++) { if (tetrisGrid[r][c]) { ctx.fillStyle = tetrisGrid[r][c]; ctx.fillRect(c*25+75, r*18+20, 23, 16); } } } for(let r=0; r<tetrisCurrent.matrix.length; r++) { for(let c=0; c<tetrisCurrent.matrix[r].length; c++) { if (tetrisCurrent.matrix[r][c]) { ctx.fillStyle = tetrisCurrent.color; ctx.fillRect((tetrisCurrent.x+c)*25+75, (tetrisCurrent.y+r)*18+20, 23, 16); } } } }

// 8. MINESWEEPER
function initMinesweeper() { msOver = false; msGrid = Array(8).fill(null).map(() => Array(8).fill({ mine: false, open: false, count: 0 })); for(let i=0; i<8; i++) { let rx = Math.floor(Math.random()*8), ry = Math.floor(Math.random()*8); msGrid[rx][ry] = { mine: true, open: false, count: 0 }; } }
function clickMinesweeper(px, py) { let c = Math.floor((px-30)/40), r = Math.floor((py-30)/40); if(c>=0 && c<8 && r>=0 && r<8) { let cell = msGrid[r][c]; if (cell.mine) { msOver = true; gameOver(); } else { msGrid[r][c] = { ...cell, open: true }; score += 20; if(scoreElement) scoreElement.innerText = score; addGold(2); playSound("dink"); } drawMinesweeper(); } }
function drawMinesweeper() { ctx.fillStyle = "#111"; ctx.fillRect(0,0,canvas.width,canvas.height); for(let r=0; r<8; r++) { for(let c=0; c<8; c++) { let cell = msGrid[r][c]; ctx.fillStyle = cell.open ? "#333" : "#00ffcc"; ctx.fillRect(c*42+35, r*42+35, 38, 38); if(cell.open && cell.mine) { ctx.fillStyle = "#ff0055"; ctx.fillText("💣", c*42+54, r*42+60); } } } }

// 9. TRAFFIC RACER
function initTrafficRacer() { trPlayer = { x: 185, lane: 1 }; trCars = []; trSpeed = 4; }
function updateTrafficRacer() { if(Math.random()<0.02) trCars.push({ x: 85 + Math.floor(Math.random()*3)*100, y: -50, color: "#ff0055" }); trCars.forEach((c, idx) => { c.y += trSpeed; if(c.y > canvas.height) { trCars.splice(idx,1); score += 50; trSpeed += 0.1; if(scoreElement) scoreElement.innerText = score; addGold(2); } if(c.y + 50 >= 330 && c.y <= 370 && c.x === trPlayer.x) gameOver(); }); drawTrafficRacer(); }
function drawTrafficRacer() { ctx.fillStyle = "#222"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle = "#fff"; ctx.fillRect(150, 0, 5, canvas.height); ctx.fillRect(250, 0, 5, canvas.height); ctx.fillStyle = "#00ffcc"; ctx.fillRect(trPlayer.x, 330, 30, 50); trCars.forEach(c => { ctx.fillStyle = c.color; ctx.fillRect(c.x, c.y, 30, 50); }); }

// 10. SUIKA GAME
function initSuika() { suikaBalls = []; suikaCurrent = { x: 200, r: 15, color: "#00ffcc" }; }
function dropSuikaBall(px) { suikaBalls.push({ x: px, y: 50, r: suikaCurrent.r, color: suikaCurrent.color, vy: 1 }); let sizes = [15, 22, 30]; let colors = ["#00ffcc", "#ff0055", "#ffd700"]; let rnd = Math.floor(Math.random()*3); suikaCurrent = { x: 200, r: sizes[rnd], color: colors[rnd] }; }
function updateSuika() { suikaBalls.forEach((b, i) => { b.y += b.vy; b.vy += 0.2; if (b.y > canvas.height - b.r) { b.y = canvas.height - b.r; b.vy = 0; } for(let j=i+1; j<suikaBalls.length; j++) { let o = suikaBalls[j]; let d = Math.hypot(b.x - o.x, b.y - o.y); if (d < b.r + o.r) { if (b.color === o.color) { b.r += 8; score += 100; if(scoreElement) scoreElement.innerText = score; addGold(5); playSound("boom"); suikaBalls.splice(j,1); } } } }); drawSuika(); }
function drawSuika() { ctx.fillStyle = "#111"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle = suikaCurrent.color; ctx.beginPath(); ctx.arc(suikaCurrent.x, 30, suikaCurrent.r, 0, Math.PI*2); ctx.fill(); suikaBalls.forEach(b => { ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill(); }); }

// 11. AIM TRAINER
function initAimTrainer() { aimTargets = []; aimTimer = 0; spawnAimTarget(); }
function spawnAimTarget() { aimTargets.push({ x: Math.random()*320+40, y: Math.random()*300+60, r: 20, t: 120 }); }
function clickAimTrainer(px, py) { aimTargets.forEach((t, idx) => { if(Math.hypot(px-t.x, py-t.y) < t.r) { aimTargets.splice(idx,1); score += 150; if(scoreElement) scoreElement.innerText = score; addGold(4); playSound("laser"); spawnAimTarget(); } }); }
function updateAimTrainer() { aimTimer++; if(aimTimer % 70 === 0) spawnAimTarget(); aimTargets.forEach((t, idx) => { t.t--; if(t.t <= 0) { aimTargets.splice(idx,1); } }); drawAimTrainer(); }
function drawAimTrainer() { ctx.fillStyle = "#111"; ctx.fillRect(0,0,canvas.width,canvas.height); aimTargets.forEach(t => { ctx.fillStyle = "#ff0055"; ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(t.x, t.y, t.r/2, 0, Math.PI*2); ctx.fill(); }); }

// 12. ASTEROIDS
function initAsteroids() { astShip = { x: 200, y: 200, angle: 0, vx: 0, vy: 0 }; astRocks = []; astLasers = []; for(let i=0; i<4; i++) astRocks.push({x: Math.random()*400, y: Math.random()*200, r: 25, dx: Math.random()*2-1, dy: Math.random()*2-1}); }
function updateAsteroids() { if(keysPressed["ArrowLeft"]) astShip.angle -= 0.06; if(keysPressed["ArrowRight"]) astShip.angle += 0.06; if(keysPressed["ArrowUp"]) { astShip.vx += Math.cos(astShip.angle)*0.1; astShip.vy += Math.sin(astShip.angle)*0.1; } astShip.x += astShip.vx; astShip.y += astShip.vy; astShip.vx *= 0.98; astShip.vy *= 0.98; if(astShip.x<0) astShip.x=canvas.width; if(astShip.x>canvas.width) astShip.x=0; if(astShip.y<0) astShip.y=canvas.height; if(astShip.y>canvas.height) astShip.y=0; astLasers.forEach((l, li) => { l.x += l.vx; l.y += l.vy; if(l.x<0||l.x>canvas.width||l.y<0||l.y>canvas.height) astLasers.splice(li,1); astRocks.forEach((r, ri) => { if(Math.hypot(l.x-r.x, l.y-r.y)<r.r) { astRocks.splice(ri,1); astLasers.splice(li,1); score += 80; if(scoreElement) scoreElement.innerText = score; addGold(3); playSound("boom"); } }); }); astRocks.forEach(r => { r.x += r.dx; r.y += r.dy; if(r.x<0||r.x>canvas.width) r.dx*=-1; if(r.y<0||r.y>canvas.height) r.dy*=-1; if(Math.hypot(astShip.x-r.x, astShip.y-r.y)<r.r) gameOver(); }); if(astRocks.length===0) initAsteroids(); drawAsteroids(); }
function drawAsteroids() { ctx.fillStyle = "#111"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.save(); ctx.translate(astShip.x, astShip.y); ctx.rotate(astShip.angle); ctx.strokeStyle = "#00ffcc"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(15,0); ctx.lineTo(-10,-8); ctx.lineTo(-10,8); ctx.closePath(); ctx.stroke(); ctx.restore(); ctx.fillStyle = "#ff0055"; astLasers.forEach(l => ctx.fillRect(l.x, l.y, 3, 3)); ctx.strokeStyle = "#fff"; astRocks.forEach(r => { ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI*2); ctx.stroke(); }); }

// 13. MEMORY MATCH
function initMemoryMatch() { memSelected = []; let icons = ["🍎","🍎","🍌","🍌","🍇","🍇","🍒","🍒","💎","💎","🌟","🌟","🛸","🛸","👑","👑"]; icons.sort(() => Math.random() - 0.5); memCards = icons.map(ico => ({ icon: ico, open: false, done: false })); }
function clickMemoryMatch(px, py) { let c = Math.floor((px-40)/80), r = Math.floor((py-40)/80); let idx = r * 4 + c; if(c>=0 && c<4 && r>=0 && r<4 && !memCards[idx].open && memSelected.length < 2) { memCards[idx].open = true; memSelected.push(idx); playSound("dink"); if (memSelected.length === 2) { setTimeout(() => { let first = memCards[memSelected[0]], second = memCards[memSelected[1]]; if (first.icon === second.icon) { first.done = true; second.done = true; score += 200; if(scoreElement) scoreElement.innerText = score; addGold(8); } else { first.open = false; second.open = false; } memSelected = []; drawMemoryMatch(); if(memCards.filter(c=>!c.done).length===0) initMemoryMatch(); }, 600); } drawMemoryMatch(); } }
function drawMemoryMatch() { ctx.fillStyle = "#111"; ctx.fillRect(0,0,canvas.width,canvas.height); for(let r=0; r<4; r++) { for(let c=0; c<4; c++) { let idx = r * 4 + c; let card = memCards[idx]; ctx.fillStyle = (card.open || card.done) ? "#333" : "#00ffcc"; ctx.fillRect(c*82+45, r*82+45, 70, 70); if(card.open || card.done) { ctx.fillStyle = "#fff"; ctx.font = "30px Arial"; ctx.textAlign = "center"; ctx.fillText(card.icon, c*82+80, r*82+90); } } } }

// 14. ARCHERY
function initArchery() { archBow = { angle: 0, power: 0, isCharging: false }; archArrow = null; archTarget = { y: 150, dir: 1 }; }
function fireArcheryArrow() { archArrow = { x: 50, y: 200, vx: 6, vy: Math.sin(archBow.angle)*5 }; playSound("laser"); }
function updateArchery() { archTarget.y += archTarget.dir * 2; if(archTarget.y < 50 || archTarget.y > 320) archTarget.dir *= -1; if(archArrow) { archArrow.x += archArrow.vx; archArrow.y += archArrow.vy; if (archArrow.x > canvas.width) archArrow = null; else if (archArrow.x >= 350 && archArrow.x <= 370 && archArrow.y >= archTarget.y && archArrow.y <= archTarget.y + 50) { archArrow = null; score += 300; if(scoreElement) scoreElement.innerText = score; addGold(10); playSound("coin"); } } drawArchery(); }
function drawArchery() { ctx.fillStyle = "#111"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle = "#00ffcc"; ctx.fillRect(45, 190, 10, 20); if(archArrow) { ctx.fillStyle = "#fff"; ctx.fillRect(archArrow.x, archArrow.y, 15, 3); } ctx.fillStyle = "#ff0055"; ctx.fillRect(350, archTarget.y, 15, 50); }

// 15. CROSSY ROAD MINI
function initCrossyRoad() { crPlayer = { x: 190, y: 370 }; crRows = []; for(let i=0; i<10; i++) { crRows.push({ y: i * 35 + 50, speed: Math.random()*2+1, dir: (Math.random()>0.5?1:-1), x: Math.random()*300 }); } }
function updateCrossyRoad() { crRows.forEach(r => { r.x += r.speed * r.dir; if(r.x > canvas.width) r.x = -40; if(r.x < -40) r.x = canvas.width; if(crPlayer.y >= r.y && crPlayer.y <= r.y + 20 && crPlayer.x >= r.x && crPlayer.x <= r.x + 40) { crPlayer = { x: 190, y: 370 }; gameOver(); } }); if(crPlayer.y < 40) { score += 400; if(scoreElement) scoreElement.innerText = score; addGold(10); playSound("coin"); crPlayer.y = 370; } drawCrossyRoad(); }
function drawCrossyRoad() { ctx.fillStyle = "#111"; ctx.fillRect(0,0,canvas.width,canvas.height); crRows.forEach(r => { ctx.fillStyle = "#222"; ctx.fillRect(0, r.y, canvas.width, 22); ctx.fillStyle = "#ff0055"; ctx.fillRect(r.x, r.y, 40, 20); }); ctx.fillStyle = "#ffd700"; ctx.fillRect(crPlayer.x, crPlayer.y, 18, 18); }

// --- SKOR VE METRİKLER ---
function addGold(amt) { totalGold += amt; localStorage.setItem("arc_gold", totalGold); updateGoldUI(); }
function updateGoldUI() { if(totalGoldElement) totalGoldElement.innerText = totalGold; }
function updateLeaderboardUI() {
    if(snakeBestCtx) snakeBestCtx.innerText = arcadeScores.snake || 0;
    if(brickBestCtx) brickBestCtx.innerText = arcadeScores.brick || 0;
    if(spaceBestCtx) spaceBestCtx.innerText = arcadeScores.space || 0;
    if(flappyBestCtx) flappyBestCtx.innerText = arcadeScores.flappy || 0;
    if(pongBestCtx) pongBestCtx.innerText = arcadeScores.pong || 0;
    if(allTimeBestCtx) allTimeBestCtx.innerText = (arcadeScores.allTimePlayer || "Kral") + ": " + calculateMaxArcadeScore();
}
function calculateMaxArcadeScore() { return Math.max(arcadeScores.snake, arcadeScores.brick, arcadeScores.space, arcadeScores.flappy, arcadeScores.pong); }

function gameOver(silent = false) {
    isGameRunning = false; clearInterval(gameInterval); if(startBtn) startBtn.innerText = "Oyunu Başlat"; if(mobileStartBtn) mobileStartBtn.innerText = "Oyunu Başlat";
    if (!silent) { playSound("boom"); alert(`Oyun Bitti, İki Gözümün Çiçeği! Skorun: ${score}`); }
    if (score > (arcadeScores[activeGame] || 0)) { arcadeScores[activeGame] = score; arcadeScores.allTimePlayer = currentPlayer; localStorage.setItem("arc_scores", JSON.stringify(arcadeScores)); updateLeaderboardUI(); }
    switchGame(activeGame);
}

function updateShopUI() {
    document.querySelectorAll(".skin-btn").forEach(btn => {
        let s = btn.getAttribute("data-skin"); let c = parseInt(btn.getAttribute("data-cost")) || 0;
        if(currentSkin === s) { btn.innerText = "Aktif"; btn.className = "skin-btn active"; btn.style.background = "#00ffcc"; }
        else if(ownedSkins.includes(s)) { btn.innerText = "Seç"; btn.className = "skin-btn owned"; btn.style.background = "#2196f3"; }
        else { btn.innerText = "Satın Al (" + c + ")"; btn.className = "skin-btn"; btn.style.background = "#555"; }
    });
}

document.querySelectorAll(".skin-btn").forEach(btn => { 
    btn.addEventListener("click", e => { 
        let s = e.target.getAttribute("data-skin"); let c = parseInt(btn.getAttribute("data-cost")) || 0;
        if(ownedSkins.includes(s)){ currentSkin = s; localStorage.setItem("arc_current_skin", s); }
        else if(totalGold >= c) { totalGold -= c; ownedSkins.push(s); currentSkin = s; localStorage.setItem("arc_gold", totalGold); localStorage.setItem("arc_skins", JSON.stringify(ownedSkins)); localStorage.setItem("arc_current_skin", s); updateGoldUI(); }
        updateShopUI(); switchGame(activeGame); 
    }); 
});

(() => {
    let toplamSaniye = parseInt(localStorage.getItem("arcade_total_time")) || 0;
    setInterval(() => { if (isGameRunning && !isGameWaitingToStart) { toplamSaniye++; localStorage.setItem("arcade_total_time", toplamSaniye); } }, 1000);
})();