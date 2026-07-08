// ============================================================================
// --- EFEARAZ44 ARCADE - ENTEGRE ANA SİSTEM (V3 - GERÇEK SÜRÜKLE-BIRAK VE YENİ OYUNLAR) ---
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

let mevcutKullanici = "";
let mevcutSifre = "";
let activeGame = "snake"; let score = 0; let gameInterval; let isGameRunning = false; let isGameWaitingToStart = false; const gridSize = 20;
let currentPlayer = ""; let totalGold = parseInt(localStorage.getItem("arc_gold")) || 0;
let ownedSkins = JSON.parse(localStorage.getItem("arc_skins")) || ["classic"]; let currentSkin = localStorage.getItem("arc_current_skin") || "classic";

let defaultScores = { snake: 0, brick: 0, space: 0, flappy: 0, pong: 0, blockblast: 0, dino: 0, catch: 0, cyberbird: 0, dinorun2: 0, starhunter: 0, neondraw: 0, catchpro: 0, snake_vs: 0, chess: 0, meteors: 0, hexrunner: 0, neonhelix: 0, bithopper: 0, gridout: 0, coinrain: 0, speeddriver: 0, mathrush: 0, colormatch: 0, soundwave: 0, multixox: 0, multitank: 0, allTimePlayer: "" };
let savedScores = JSON.parse(localStorage.getItem("arc_scores")) || {};
let arcadeScores = { ...defaultScores, ...savedScores };

// --- OYUN DEĞİŞKENLERİ ---
let yilanHamleKuyrugu = []; let snake = []; let food = {x:0, y:0}; let dx = gridSize, dy = 0;
let paddle = { x: 160, y: 370, width: 90, height: 12, speed: 14 }; let ball = { x: 200, y: 200, radius: 7, dx: 4, dy: -4 }; let bricks = [];
let playerShip = { x: 180, y: 360, width: 40, height: 20, speed: 9 }; let playerLasers = []; let invaders = []; let invaderDirection = 1; let spaceWave = 1;
let bird = { x: 50, y: 150, velocity: 0, gravity: 0.5, jump: -7, radius: 10 }; let pipes = [];
let pongPad = { y: 160, width: 10, height: 80, speed: 8 }; let aiPad = { y: 160, width: 10, height: 80, speed: 3.5 }; let pongBall = { x: 200, y: 200, dx: 4, dy: 3 };

// DINO RUN & YENİ ARCADE DEĞİŞKENLERİ
let dino = { x: 50, y: 300, w: 20, h: 40, vy: 0, gravity: 0.8, jump: -12, grounded: true }; let cactuses = []; let dinoTimer = 0;
let catcher = { x: 160, y: 360, w: 60, h: 15, speed: 10 }; let catchStars = []; let catchTimer = 0;
let isDrawing = false; let garticStrokes = [];

// --- MULTIPLAYER DÜELLO DEĞİŞKENLERİ ---
let vsP1 = [], vsP2 = []; let vsDir1 = "RIGHT", vsDir2 = "LEFT"; let vsFood = {x:0, y:0};
let chessSelectedPiece = null; let chessBoard = [];

// --- YENİ EKLENEN 12 OYUNUN EK DEĞİŞKENLERİ ---
let arcadeMeteors = []; let meteorTimer = 0;
let hexObstacles = []; let hexTimer = 0;
let helixAngle = 0; let helixGaps = []; let helixBall = { y: 100, vy: 0 };
let hopPlatforms = []; let hopPlayer = { x: 200, y: 300, vy: 0 };
let gridPattern = []; let gridUserSequence = []; let gridGameStage = "show"; let gridTimer = 0;
let coinTimer = 600; let coinItems = [];
let trafficCars = []; let roadX = 180;
let mathQuestion = ""; let mathAnswer = 0; let mathOptions = []; let mathLane = 1;
let colorCircle = { targetColor: "#00ffcc", options: ["#00ffcc", "#ff0055"] };
let wavePlayer = { x: 50, y: 200, angle: 0 }; let waveObstacles = [];
let xoxGrid = Array(9).fill(""); let xoxTurn = "X";
let tankP1 = { x: 100, y: 350, angle: -Math.PI/2, lasers: [] }; let tankP2 = { x: 300, y: 100, angle: Math.PI/2, lasers: [] };

// --- SÜRÜKLE-BIRAK BLOCK BLAST MOTORU ---
const BB_ROWS = 8; const BB_COLS = 8; const BB_CELL_SIZE = 35; const BB_OFFSET_X = 60; const BB_OFFSET_Y = 30;
let bbGrid = []; let bbAvailableShapes = [];
let bbDragState = { isDragging: false, shapeIdx: -1, startX: 0, startY: 0, currentX: 0, currentY: 0 };

const BB_SHAPES = [
    { matrix: [[1, 1], [1, 1]], color: "#ffd700" },
    { matrix: [[1, 1, 1]], color: "#00e676" },
    { matrix: [[1], [1], [1]], color: "#00b0ff" },
    { matrix: [[1]], color: "#ff1744" },
    { matrix: [[1, 0], [1, 1]], color: "#ff9100" }
];

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
    } else if (activeGame === "snake_vs") {
        if (e.key === "ArrowLeft" && vsDir1 !== "RIGHT") vsDir1 = "LEFT";
        if (e.key === "ArrowRight" && vsDir1 !== "LEFT") vsDir1 = "RIGHT";
        if (e.key === "ArrowUp" && vsDir1 !== "DOWN") vsDir1 = "UP";
        if (e.key === "ArrowDown" && vsDir1 !== "UP") vsDir1 = "DOWN";
        if (key === "a" && vsDir2 !== "RIGHT") vsDir2 = "LEFT";
        if (key === "d" && vsDir2 !== "LEFT") vsDir2 = "RIGHT";
        if (key === "w" && vsDir2 !== "DOWN") vsDir2 = "UP";
        if (key === "s" && vsDir2 !== "UP") vsDir2 = "DOWN";
    } else if (activeGame === "multitank") {
        if (key === "q") { tankP2.lasers.push({ x: tankP2.x, y: tankP2.y, dx: Math.cos(tankP2.angle)*6, dy: Math.sin(tankP2.angle)*6 }); playSound("laser"); }
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
    globalLeaderboardCek();
    updateGoldUI(); updateLeaderboardUI(); updateShopUI();
    const savedName = localStorage.getItem("arc_username");
    if (savedName) { currentPlayer = savedName; if(nameModal) nameModal.style.display = "none"; if(welcomeText) welcomeText.innerText = "🎮 Efearaz44 Arcade'e Hoş geldin!"; }
    
    if(document.getElementById("bgmBtn")) document.getElementById("bgmBtn").addEventListener("click", toggleBGM);
    
    // UI Seçim Dinleyicileri
    const gameButtons = {
        "Snake": "snake", "Brick": "brick", "Space": "space", "Flappy": "flappy", "Pong": "pong",
        "Multi": "multi", "Blockblast": "blockblast", "Gartic": "gartic", "Dino": "dino", "Catch": "catch",
        "Cyberbird": "cyberbird", "Dinorun2": "dinorun2", "Starhunter": "starhunter", "Neondraw": "neondraw", 
        "Catchpro": "catchpro", "Snakevs": "snake_vs", "Chess": "chess",
        "Meteors": "meteors", "Hexrunner": "hexrunner", "Neonhelix": "neonhelix", "Bithopper": "bithopper",
        "Gridout": "gridout", "Coinrain": "coinrain", "Speeddriver": "speeddriver", "Mathrush": "mathrush",
        "Colormatch": "colormatch", "Soundwave": "soundwave", "Multixox": "multixox", "Multitank": "multitank"
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

        // --- HİÇBİR SORUN YOKSA ŞİMDİ HAFIZAYA ALIP TABLOYU ÇEKELİM ---
        mevcutKullanici = name;
        mevcutSifre = sifre;
        globalLeaderboardCek();
        // -----------------------------------------------------------

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
    else if (g === "blockblast") { if(welcomeText) welcomeText.innerText = "🟨 Sürükle-Bırak Neon Block Blast"; initBlockBlast(); }
    else if (g === "gartic") { if(welcomeText) welcomeText.innerText = "🎨 Neon Çizim (Gartic Modu)"; initGartic(); startActiveGame(); }
    else if (g === "dino") { if(welcomeText) welcomeText.innerText = "Rex Neon Dino Run"; initDino(); }
    else if (g === "catch") { if(welcomeText) welcomeText.innerText = "🌟 Yıldız Avcısı"; initCatch(); }
    else if (g === "cyberbird") { if(welcomeText) welcomeText.innerText = "🛸 Cyber Bird Pro"; initCyberBird(); }
    else if (g === "dinorun2") { if(welcomeText) welcomeText.innerText = "🦖 Neon Dino Run V2"; initDinoRun2(); }
    else if (g === "starhunter") { if(welcomeText) welcomeText.innerText = "🌌 Yıldız Avcısı Gelişmiş"; initStarHunter(); }
    else if (g === "neondraw") { if(welcomeText) welcomeText.innerText = "🖌️ Serbest Neon Çizim Tuvali"; initNeonDraw(); startActiveGame(); }
    else if (g === "catchpro") { if(welcomeText) welcomeText.innerText = "💎 Süper Element Yakalayıcı"; initCatchPro(); }
    else if (g === "snake_vs") { if(welcomeText) welcomeText.innerText = "⚔️ İki Kişilik Yılan Düellosu"; initSnakeVS(); }
    else if (g === "chess") { if(welcomeText) welcomeText.innerText = "👑 Neon Satranç Arenası"; initChess(); }
    // Yeni eklenen 12 Oyun Başlığı
    else if (g === "meteors") { if(welcomeText) welcomeText.innerText = "☄️ Neon Göktaşı Kaçışı"; initMeteors(); }
    else if (g === "hexrunner") { if(welcomeText) welcomeText.innerText = "🏃 Hex Runner Hız Koşusu"; initHexRunner(); }
    else if (g === "neonhelix") { if(welcomeText) welcomeText.innerText = "🌀 Neon Helix Spiral Kule"; initNeonHelix(); }
    else if (g === "bithopper") { if(welcomeText) welcomeText.innerText = "🔋 Bit Hopper Zıplama Macerası"; initBitHopper(); }
    else if (g === "gridout") { if(welcomeText) welcomeText.innerText = "🧠 Grid Out Hafıza Arenası"; initGridOut(); startActiveGame(); }
    else if (g === "coinrain") { if(welcomeText) welcomeText.innerText = "🪙 Para Yağmuru Mücadelesi"; initCoinRain(); }
    else if (g === "speeddriver") { if(welcomeText) welcomeText.innerText = "🏎️ Neon Speed Driver Yarışı"; initSpeedDriver(); }
    else if (g === "mathrush") { if(welcomeText) welcomeText.innerText = "🧮 Math Rush Sayı Şeridi"; initMathRush(); }
    else if (g === "colormatch") { if(welcomeText) welcomeText.innerText = "🎨 Color Match Renk Eşleme"; initColorMatch(); }
    else if (g === "soundwave") { if(welcomeText) welcomeText.innerText = "🌊 Sound Wave Ses Dalgası"; initSoundWave(); }
    else if (g === "multixox") { if(welcomeText) welcomeText.innerText = "❌ Multiplayer Klasik X-O-X"; initMultiXOX(); startActiveGame(); }
    else if (g === "multitank") { if(welcomeText) welcomeText.innerText = "🛡️ Multiplayer Neon Tank Savaşı"; initMultiTank(); }
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
    else if (activeGame === "blockblast") { initBlockBlast(); isGameWaitingToStart = false; }
    else if (activeGame === "gartic") { initGartic(); isGameWaitingToStart = false; }
    else if (activeGame === "dino") { initDino(); isGameWaitingToStart = false; }
    else if (activeGame === "catch") { initCatch(); isGameWaitingToStart = false; }
    else if (activeGame === "cyberbird") { initCyberBird(); isGameWaitingToStart = false; }
    else if (activeGame === "dinorun2") { initDinoRun2(); isGameWaitingToStart = false; }
    else if (activeGame === "starhunter") { initStarHunter(); isGameWaitingToStart = false; }
    else if (activeGame === "neondraw") { initNeonDraw(); isGameWaitingToStart = false; }
    else if (activeGame === "catchpro") { initCatchPro(); isGameWaitingToStart = false; }
    else if (activeGame === "snake_vs") { initSnakeVS(); isGameWaitingToStart = false; }
    else if (activeGame === "chess") { initChess(); isGameWaitingToStart = false; }
    // Yeni Tetikleyiciler
    else if (activeGame === "meteors") { initMeteors(); isGameWaitingToStart = false; }
    else if (activeGame === "hexrunner") { initHexRunner(); isGameWaitingToStart = false; }
    else if (activeGame === "neonhelix") { initNeonHelix(); isGameWaitingToStart = false; }
    else if (activeGame === "bithopper") { initBitHopper(); isGameWaitingToStart = false; }
    else if (activeGame === "gridout") { initGridOut(); isGameWaitingToStart = false; }
    else if (activeGame === "coinrain") { initCoinRain(); isGameWaitingToStart = false; }
    else if (activeGame === "speeddriver") { initSpeedDriver(); isGameWaitingToStart = false; }
    else if (activeGame === "mathrush") { initMathRush(); isGameWaitingToStart = false; }
    else if (activeGame === "colormatch") { initColorMatch(); isGameWaitingToStart = false; }
    else if (activeGame === "soundwave") { initSoundWave(); isGameWaitingToStart = false; }
    else if (activeGame === "multixox") { initMultiXOX(); isGameWaitingToStart = false; }
    else if (activeGame === "multitank") { initMultiTank(); isGameWaitingToStart = false; }

    clearInterval(gameInterval); 
    const singleDrawGames = ["blockblast", "gartic", "neondraw", "chess", "gridout", "multixox"];
    if(!singleDrawGames.includes(activeGame)) {
    gameInterval = setInterval(updateEngine, (activeGame === "snake" ? 100 : (activeGame === "snake_vs" ? 130 : 1000 / 60)));
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
    else if (activeGame === "blockblast") drawBlockBlast();
    else if (activeGame === "gartic") drawGartic();
    else if (activeGame === "cyberbird") updateCyberBird();
    else if (activeGame === "dinorun2") updateDinoRun2();
    else if (activeGame === "starhunter") updateStarHunter();
    else if (activeGame === "neondraw") drawNeonDraw();
    else if (activeGame === "catchpro") updateCatchPro();
    else if (activeGame === "snake_vs") updateSnakeVS();
    else if (activeGame === "chess") drawChess();
    // Yeni motor döngüleri
    else if (activeGame === "meteors") updateMeteors();
    else if (activeGame === "hexrunner") updateHexRunner();
    else if (activeGame === "neonhelix") updateNeonHelix();
    else if (activeGame === "bithopper") updateBitHopper();
    else if (activeGame === "gridout") drawGridOut();
    else if (activeGame === "coinrain") updateCoinRain();
    else if (activeGame === "speeddriver") updateSpeedDriver();
    else if (activeGame === "mathrush") updateMathRush();
    else if (activeGame === "colormatch") updateColorMatch();
    else if (activeGame === "soundwave") updateSoundWave();
    else if (activeGame === "multixox") drawMultiXOX();
    else if (activeGame === "multitank") updateMultiTank();
}

function drawWaitingScreen() { 
    const renderDrawings = ["flappy", "brick", "pong", "dino", "catch", "blockblast", "gartic", "cyberbird", "dinorun2", "starhunter", "neondraw", "catchpro", "snake_vs", "chess", "meteors", "hexrunner", "neonhelix", "bithopper", "gridout", "coinrain", "speeddriver", "mathrush", "colormatch", "soundwave", "multixox", "multitank"];
    if (renderDrawings.includes(activeGame)) {
        if(activeGame === "flappy") drawFlappy();
        if(activeGame === "brick") drawBrick();
        if(activeGame === "pong") drawPong();
        if(activeGame === "dino") drawDino();
        if(activeGame === "catch") drawCatch();
        if(activeGame === "blockblast") drawBlockBlast();
        if(activeGame === "gartic") drawGartic();
        if(activeGame === "cyberbird") drawCyberBird();
        if(activeGame === "dinorun2") drawDinoRun2();
        if(activeGame === "starhunter") drawStarHunter();
        if(activeGame === "neondraw") drawNeonDraw();
        if(activeGame === "catchpro") drawCatchPro();
        if(activeGame === "snake_vs") drawSnakeVS();
        if(activeGame === "chess") drawChess();
        if(activeGame === "meteors") drawMeteors();
        if(activeGame === "hexrunner") drawHexRunner();
        if(activeGame === "neonhelix") drawNeonHelix();
        if(activeGame === "bithopper") drawBitHopper();
        if(activeGame === "gridout") drawGridOut();
        if(activeGame === "coinrain") drawCoinRain();
        if(activeGame === "speeddriver") drawSpeedDriver();
        if(activeGame === "mathrush") drawMathRush();
        if(activeGame === "colormatch") drawColorMatch();
        if(activeGame === "soundwave") drawSoundWave();
        if(activeGame === "multixox") drawMultiXOX();
        if(activeGame === "multitank") drawMultiTank();
    }
    
    ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height); 
    ctx.fillStyle = "#00b0ff"; ctx.font = "bold 16px Arial"; ctx.textAlign = "center"; 
    ctx.fillText("HAZIR! BAŞLAMAK İÇİN AŞAĞIDAKİ", canvas.width / 2, canvas.height / 2 - 15); 
    ctx.fillText("BUTONLARA DOKUNUN VEYA ZIPLAYIN", canvas.width / 2, canvas.height / 2 + 15); 
}

function handleContinuousInput() { 
    if (!isGameRunning) return; 
    if (keysPressed["ArrowLeft"] || keysPressed["a"] || keysPressed["A"]) moveLeft(); 
    if (keysPressed["ArrowRight"] || keysPressed["d"] || keysPressed["D"]) moveRight(); 
    
    // Tank Girişleri Mekanizması
    if (activeGame === "multitank") {
        if (keysPressed["ArrowUp"]) { tankP1.x += Math.cos(tankP1.angle)*3; tankP1.y += Math.sin(tankP1.angle)*3; }
        if (keysPressed["ArrowDown"]) { tankP1.x -= Math.cos(tankP1.angle)*2; tankP1.y -= Math.sin(tankP1.angle)*2; }
        if (keysPressed["ArrowLeft"]) tankP1.angle -= 0.05;
        if (keysPressed["ArrowRight"]) tankP1.angle += 0.05;
        if (keysPressed["w"] || keysPressed["W"]) { tankP2.x += Math.cos(tankP2.angle)*3; tankP2.y += Math.sin(tankP2.angle)*3; }
        if (keysPressed["s"] || keysPressed["S"]) { tankP2.x -= Math.cos(tankP2.angle)*2; tankP2.y -= Math.sin(tankP2.angle)*2; }
        if (keysPressed["a"] || keysPressed["A"]) tankP2.angle -= 0.05;
        if (keysPressed["d"] || keysPressed["D"]) tankP2.angle += 0.05;
    }
}

// --- SURUKLE BIRAK VE DOKUNMATIK DINELEYICILER ENTEGRASYONU ---
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
        
        if (activeGame === "blockblast" && isGameRunning) {
            bbAvailableShapes.forEach((shape, idx) => {
                if (!shape) return;
                let sX = 45 + (idx * 125); let sY = 410;
                if (p.x >= sX && p.x <= sX + 80 && p.y >= sY && p.y <= sY + 80) {
                    bbDragState = { isDragging: true, shapeIdx: idx, startX: p.x, startY: p.y, currentX: p.x, currentY: p.y };
                    playSound("dink");
                }
            });
        } else if (activeGame === "gartic" && isGameRunning) {
            isDrawing = true;
            garticStrokes.push({ x: p.x, y: p.y, color: getSkinColors().head, type: 'start' });
        } else if (activeGame === "neondraw" && isGameRunning) {
            isDrawing = true;
            garticStrokes.push({ x: p.x, y: p.y, color: "#00ffcc", type: 'start' });
        } else if (activeGame === "chess") {
            handleChessClick(p.x, p.y);
        } else if (activeGame === "gridout" && isGameRunning) {
            handleGridOutClick(p.x, p.y);
        } else if (activeGame === "multixox" && isGameRunning) {
            handleMultiXOXClick(p.x, p.y);
        } else if (activeGame === "multi") {
            if (typeof handleMultiClick === 'function') handleMultiClick(p.x, p.y);
            else if (typeof xoxClick === 'function') xoxClick(p.x, p.y);
        }
    });

    canvas.addEventListener("mousemove", e => {
        let p = getCanvasCoordinates(e);
        if (activeGame === "blockblast" && bbDragState.isDragging) {
            bbDragState.currentX = p.x; bbDragState.currentY = p.y;
            drawBlockBlast();
        } else if ((activeGame === "gartic" || activeGame === "neondraw") && isDrawing) {
            garticStrokes.push({ x: p.x, y: p.y, color: activeGame === "neondraw" ? "#00ffcc" : getSkinColors().head, type: 'draw' });
            if(activeGame === "gartic") drawGartic(); else drawNeonDraw();
        }
    });

    window.addEventListener("mouseup", () => {
        if (activeGame === "blockblast" && bbDragState.isDragging) {
            let shape = bbAvailableShapes[bbDragState.shapeIdx];
            let gridX = Math.round((bbDragState.currentX - BB_OFFSET_X - (shape.matrix[0].length * BB_CELL_SIZE)/2) / BB_CELL_SIZE);
            let gridY = Math.round((bbDragState.currentY - BB_OFFSET_Y - (shape.matrix.length * BB_CELL_SIZE)/2) / BB_CELL_SIZE);
            
            if (canPlaceBBShape(gridY, gridX, shape.matrix)) {
                placeBBShape(gridY, gridX, shape.matrix, shape.color);
                bbAvailableShapes[bbDragState.shapeIdx] = null;
                playSound("coin");
                checkAndClearBBLines();
                if (bbAvailableShapes.filter(s => s !== null).length === 0) generateNewBBShapes();
                if (checkBBGameOver()) gameOver();
            }
            bbDragState.isDragging = false;
            drawBlockBlast();
        }
        isDrawing = false;
    });

    canvas.addEventListener("touchstart", e => {
        e.preventDefault();
        let touch = e.touches[0];
        let mEvt = new MouseEvent("mousedown", { clientX: touch.clientX, clientY: touch.clientY });
        canvas.dispatchEvent(mEvt);
    }, {passive: false});

    canvas.addEventListener("touchmove", e => {
        e.preventDefault();
        let touch = e.touches[0];
        let mEvt = new MouseEvent("mousemove", { clientX: touch.clientX, clientY: touch.clientY });
        canvas.dispatchEvent(mEvt);
    }, {passive: false});

    window.addEventListener("touchend", () => {
        let mEvt = new MouseEvent("mouseup", {});
        window.dispatchEvent(mEvt);
    });
}

// ============================================================================
// --- SÜRÜKLE BIRAK TABANLI BLOCK BLAST MOTORU ---
// ============================================================================
function initBlockBlast() {
    bbGrid = Array(BB_ROWS).fill(null).map(() => Array(BB_COLS).fill(0));
    generateNewBBShapes();
    isGameRunning = true; isGameWaitingToStart = false;
    drawBlockBlast();
}
function generateNewBBShapes() {
    bbAvailableShapes = [];
    for (let i = 0; i < 3; i++) {
        let rand = BB_SHAPES[Math.floor(Math.random() * BB_SHAPES.length)];
        bbAvailableShapes.push(JSON.parse(JSON.stringify(rand))); 
    }
}
function drawBlockBlast() {
    clearCanvas(); drawWatermark();
    for (let r = 0; r < BB_ROWS; r++) {
        for (let c = 0; c < BB_COLS; c++) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
            ctx.strokeRect(BB_OFFSET_X + c * BB_CELL_SIZE, BB_OFFSET_Y + r * BB_CELL_SIZE, BB_CELL_SIZE, BB_CELL_SIZE);
            if (bbGrid[r][c] !== 0) {
                ctx.fillStyle = bbGrid[r][c];
                ctx.fillRect(BB_OFFSET_X + c * BB_CELL_SIZE + 2, BB_OFFSET_Y + r * BB_CELL_SIZE + 2, BB_CELL_SIZE - 4, BB_CELL_SIZE - 4);
            }
        }
    }
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)"; ctx.fillRect(0, 380, canvas.width, 100);
    bbAvailableShapes.forEach((shape, idx) => {
        if (!shape) return;
        let startX = 45 + (idx * 125); let startY = 410;
        if (bbDragState.isDragging && bbDragState.shapeIdx === idx) {
            startX = bbDragState.currentX - (shape.matrix[0].length * BB_CELL_SIZE)/2;
            startY = bbDragState.currentY - (shape.matrix.length * BB_CELL_SIZE)/2;
        }
        shape.matrix.forEach((row, r) => {
            row.forEach((val, c) => {
                if (val === 1) {
                    ctx.fillStyle = shape.color;
                    let size = (bbDragState.isDragging && bbDragState.shapeIdx === idx) ? BB_CELL_SIZE : 15;
                    ctx.fillRect(startX + (c * size), startY + (r * size), size - 2, size - 2);
                }
            });
        });
    });
}
function canPlaceBBShape(row, col, matrix) {
    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c] === 1) {
                let tR = row + r; let tC = col + c;
                if (tR < 0 || tR >= BB_ROWS || tC < 0 || tC >= BB_COLS || bbGrid[tR][tC] !== 0) return false;
            }
        }
    }
    return true;
}
function placeBBShape(row, col, matrix, color) {
    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c] === 1) { bbGrid[row + r][col + c] = color; score += 5; }
        }
    }
    if(scoreElement) scoreElement.innerText = score;
}
function checkAndClearBBLines() {
    let rClear = []; let cClear = [];
    for (let r = 0; r < BB_ROWS; r++) { if (bbGrid[r].every(cell => cell !== 0)) rClear.push(r); }
    for (let c = 0; c < BB_COLS; c++) {
        let colCells = []; for (let r = 0; r < BB_ROWS; r++) colCells.push(bbGrid[r][c]);
        if (colCells.every(cell => cell !== 0)) cClear.push(c);
    }
    rClear.forEach(r => bbGrid[r].fill(0));
    cClear.forEach(c => { for (let r = 0; r < BB_ROWS; r++) bbGrid[r][c] = 0; });
    let total = rClear.length + cClear.length;
    if (total > 0) { score += total * 100; if(scoreElement) scoreElement.innerText = score; playSound("boom"); addGold(total * 20); }
}
function checkBBGameOver() {
    let act = bbAvailableShapes.filter(s => s !== null); if (act.length === 0) return false;
    for (let s of act) {
        for (let r = 0; r < BB_ROWS; r++) {
            for (let c = 0; c < BB_COLS; c++) { if (canPlaceBBShape(r, c, s.matrix)) return false; }
        }
    }
    return true;
}

// ============================================================================
// --- YENİ EKLENEN 10 ADET TEK KİŞİLİK MINI ARCADE OYUNLARI ---
// ============================================================================
// ============================================================================
// --- GÜNCELLENMİŞ OYUN MOTORLARI (SES, ALTIN VE REKOR ENTEGRASYONLU) ---
// ============================================================================

// 1. GÖKTAŞI KAÇIŞI (METEORS)
function initMeteors() { arcadeMeteors = []; meteorTimer = 0; paddle.x = 160; }
function updateMeteors() {
    meteorTimer++; 
    if (meteorTimer % 20 === 0) arcadeMeteors.push({ x: Math.random() * 380, y: 0, size: Math.random() * 15 + 10, speed: Math.random() * 3 + 3 });
    arcadeMeteors.forEach((m, idx) => {
        m.y += m.speed; 
        if (m.y > canvas.height) { 
            arcadeMeteors.splice(idx, 1); 
            score += 10; 
            scoreElement.innerText = score; 
            if (typeof addGold === "function") addGold(1); 
            if (typeof playSound === "function") playSound("coin");
            if (typeof saveLocalScore === "function") saveLocalScore("meteors", score);
        }
        if (m.y + m.size >= paddle.y && m.x >= paddle.x && m.x <= paddle.x + paddle.width) { gameOver(); }
    });
    drawMeteors();
}
function drawMeteors() { clearCanvas(); drawWatermark(); ctx.fillStyle = "#ff5722"; arcadeMeteors.forEach(m => ctx.fillRect(m.x, m.y, m.size, m.size)); ctx.fillStyle = getSkinColors().head; ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height); }

// 2. HEX RUNNER (HIZ KOŞUSU)
function initHexRunner() { hexObstacles = []; hexTimer = 0; dino.y = 300; dino.vy = 0; }
function updateHexRunner() {
    dino.vy += 0.7; dino.y += dino.vy; if(dino.y > 300) { dino.y = 300; dino.vy = 0; }
    hexTimer++; if (hexTimer % 50 === 0) hexObstacles.push({ x: canvas.width, type: Math.random() > 0.5 ? "low" : "high", w: 20, h: 30 });
    hexObstacles.forEach((o, idx) => {
        o.x -= 6; 
        if (o.x < -20) { 
            hexObstacles.splice(idx, 1); 
            score += 15; 
            scoreElement.innerText = score; 
            if (typeof addGold === "function") addGold(2);
            if (typeof playSound === "function") playSound("coin");
            if (typeof saveLocalScore === "function") saveLocalScore("hexrunner", score);
        }
        let oY = o.type === "low" ? 310 : 250;
        if (o.x < dino.x + dino.w && o.x + o.w > dino.x && dino.y < oY + o.h && dino.y + dino.h > oY) { gameOver(); }
    });
    drawHexRunner();
}
function drawHexRunner() { clearCanvas(); drawWatermark(); ctx.fillStyle = "#e040fb"; ctx.fillRect(dino.x, dino.y, dino.w, dino.h); hexObstacles.forEach(o => { ctx.fillStyle = "#00e676"; ctx.fillRect(o.x, o.type === "low" ? 310 : 250, o.w, o.h); }); ctx.fillStyle = "#fff"; ctx.fillRect(0, 340, canvas.width, 2); }

// 3. NEON HELIX (SPIRAL KULE)
function initNeonHelix() { helixAngle = 0; helixGaps = []; helixBall = { y: 60, vy: 0 }; for(let i=0; i<6; i++) helixGaps.push({ y: i*60+120, gap: Math.random()*Math.PI*2 }); }
function updateNeonHelix() {
    helixBall.vy += 0.2; helixBall.y += helixBall.vy;
    helixGaps.forEach(g => {
        if(Math.abs(helixBall.y - g.y) < 8) {
            let relativeAngle = Math.atan2(0, 1) - helixAngle;
            let normalized = (relativeAngle + Math.PI*2) % (Math.PI*2);
            if (Math.abs(normalized - g.gap) < 0.6) { 
                score += 30; 
                scoreElement.innerText = score; 
                if (typeof addGold === "function") addGold(5);
                if (typeof playSound === "function") playSound("coin");
                if (typeof saveLocalScore === "function") saveLocalScore("neonhelix", score);
            } else { helixBall.vy = -5; if (typeof playSound === "function") playSound("dink"); }
        }
        g.y -= 1; if(g.y < 0) { g.y = canvas.height; g.gap = Math.random()*Math.PI*2; }
    });
    if(helixBall.y > canvas.height) gameOver();
    drawNeonHelix();
}
function drawNeonHelix() {
    clearCanvas(); drawWatermark(); ctx.lineWidth = 6;
    helixGaps.forEach(g => {
        ctx.strokeStyle = "#ff0055"; ctx.beginPath(); ctx.arc(canvas.width/2, g.y, 40, helixAngle + g.gap + 0.5, helixAngle + g.gap + Math.PI*2 - 0.5); ctx.stroke();
    });
    ctx.fillStyle = "#00ffcc"; ctx.beginPath(); ctx.arc(canvas.width/2, helixBall.y, 8, 0, Math.PI*2); ctx.fill();
}

// 4. BIT HOPPER (PLATFORM DİKEY TIRMANDI)
function initBitHopper() { hopPlatforms = []; hopPlayer = { x: 200, y: 300, vy: 0 }; for(let i=0; i<7; i++) hopPlatforms.push({ x: Math.random()*300, y: i*60+50, w: 70, h: 10 }); }
function updateBitHopper() {
    hopPlayer.vy += 0.25; hopPlayer.y += hopPlayer.vy;
    hopPlatforms.forEach(p => {
        if(hopPlayer.vy > 0 && hopPlayer.x+15 > p.x && hopPlayer.x < p.x+p.w && hopPlayer.y+20 >= p.y && hopPlayer.y+20 <= p.y+p.h) { 
            hopPlayer.vy = -7.5; 
            score += 5; 
            scoreElement.innerText = score; 
            if (typeof addGold === "function") addGold(1);
            if (typeof playSound === "function") playSound("dink"); 
            if (typeof saveLocalScore === "function") saveLocalScore("bithopper", score);
        }
        if(hopPlayer.y < 200) { p.y += 3; }
    });
    if(hopPlayer.y < 200) hopPlayer.y += 3;
    hopPlatforms.forEach(p => { if(p.y > canvas.height) { p.y = 0; p.x = Math.random()*300; } });
    if(hopPlayer.y > canvas.height) gameOver();
    drawBitHopper();
}
function drawBitHopper() { clearCanvas(); drawWatermark(); ctx.fillStyle = "#ffeb3b"; ctx.fillRect(hopPlayer.x, hopPlayer.y, 18, 20); ctx.fillStyle = "#00e676"; hopPlatforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h)); }

// 5. GRID OUT (HAFIZA ARENASI)
function initGridOut() { gridPattern = []; gridUserSequence = []; gridGameStage = "show"; gridTimer = 0; for(let i=0; i<3; i++) gridPattern.push(Math.floor(Math.random()*9)); }
function drawGridOut() {
    clearCanvas(); drawWatermark();
    let size = 80; let startX = 80, startY = 100;
    gridTimer++; if (gridTimer > 60 && gridGameStage === "show") gridGameStage = "play";
    for(let i=0; i<9; i++) {
        let r = Math.floor(i/3); let c = i%3;
        ctx.fillStyle = "#222"; ctx.strokeStyle = "#00ffcc";
        if (gridGameStage === "show" && gridPattern.includes(i)) ctx.fillStyle = "#ff0055";
        ctx.fillRect(startX + c*size, startY + r*size, size-5, size-5); ctx.strokeRect(startX + c*size, startY + r*size, size-5, size-5);
    }
}
function handleGridOutClick(x, y) {
    if (gridGameStage !== "play") return;
    let size = 80; let startX = 80, startY = 100;
    let c = Math.floor((x - startX)/size); let r = Math.floor((y - startY)/size);
    if(c>=0 && c<3 && r>=0 && r<3) {
        let id = r*3 + c; if (typeof playSound === "function") playSound("dink");
        if (gridPattern.includes(id) && !gridUserSequence.includes(id)) {
            gridUserSequence.push(id); 
            score += 20; 
            scoreElement.innerText = score;
            if (typeof saveLocalScore === "function") saveLocalScore("gridout", score);
            if(gridUserSequence.length === gridPattern.length) { 
                if (typeof addGold === "function") addGold(30); 
                if (typeof playSound === "function") playSound("coin");
                initGridOut(); 
            }
        } else { gameOver(); }
    }
}

// 6. COIN RAIN (PARA YAĞMURU)
function initCoinRain() { coinTimer = 600; coinItems = []; paddle.x = 160; }
function updateCoinRain() {
    coinTimer--; if(coinTimer <= 0) { if (typeof addGold === "function") addGold(score/2); gameOver(); return; }
    if(Math.random() < 0.08) coinItems.push({ x: Math.random()*380, y: 0, t: Math.random() > 0.2 ? "gold" : "bomb" });
    coinItems.forEach((c, idx) => {
        c.y += 4; if (c.y > canvas.height) coinItems.splice(idx, 1);
        if(c.y >= paddle.y && c.x >= paddle.x && c.x <= paddle.x + paddle.width) {
            coinItems.splice(idx, 1);
            if(c.t === "gold") { 
                score += 50; 
                scoreElement.innerText = score; 
                if (typeof addGold === "function") addGold(5);
                if (typeof playSound === "function") playSound("coin"); 
                if (typeof saveLocalScore === "function") saveLocalScore("coinrain", score);
            } else { gameOver(); }
        }
    });
    drawCoinRain();
}
function drawCoinRain() { clearCanvas(); drawWatermark(); ctx.fillStyle = getSkinColors().head; ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height); coinItems.forEach(c => { ctx.fillStyle = c.t === "gold" ? "#ffd700" : "#ff1744"; ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, Math.PI*2); ctx.fill(); }); ctx.fillStyle = "#fff"; ctx.fillText("Süre: " + Math.ceil(coinTimer/60), 40, 30); }

// 7. SPEED DRIVER (NEON YARIŞ)
function initSpeedDriver() { roadX = 180; trafficCars = []; }
function updateSpeedDriver() {
    if (Math.random() < 0.03) trafficCars.push({ x: Math.random()*160 + 100, y: -40, speed: 4 });
    trafficCars.forEach((tc, idx) => {
        tc.y += tc.speed; 
        if (tc.y > canvas.height) { 
            trafficCars.splice(idx,1); 
            score += 25; 
            scoreElement.innerText = score; 
            if (typeof addGold === "function") addGold(3);
            if (typeof playSound === "function") playSound("coin");
            if (typeof saveLocalScore === "function") saveLocalScore("speeddriver", score);
        }
        if (tc.y+40 >= 340 && tc.x+30 >= roadX && tc.x <= roadX+30) { gameOver(); }
    });
    drawSpeedDriver();
}
function drawSpeedDriver() {
    clearCanvas(); drawWatermark();
    ctx.fillStyle = "#333"; ctx.fillRect(100, 0, 200, canvas.height); // Yol
    ctx.fillStyle = "#00ffcc"; ctx.fillRect(roadX, 340, 30, 45); // Oyuncu
    ctx.fillStyle = "#ff1744"; trafficCars.forEach(tc => ctx.fillRect(tc.x, tc.y, 30, 40));
}

// 8. MATH RUSH (SAYI ŞERİDİ)
function initMathRush() {
    mathLane = 1; let n1 = Math.floor(Math.random()*10)+2; let n2 = Math.floor(Math.random()*10)+2;
    mathQuestion = `${n1} x ${n2} = ?`; mathAnswer = n1 * n2;
    mathOptions = [mathAnswer + 5, mathAnswer, mathAnswer - 3].sort(() => Math.random() - 0.5);
    hexTimer = 0;
}
function updateMathRush() {
    hexTimer += 2; if (hexTimer > canvas.height) {
        if (mathOptions[mathLane] === mathAnswer) { 
            score += 100; 
            scoreElement.innerText = score; 
            if (typeof addGold === "function") addGold(15); 
            if (typeof playSound === "function") playSound("coin");
            if (typeof saveLocalScore === "function") saveLocalScore("mathrush", score);
            initMathRush(); 
        } else { gameOver(); }
    }
    drawMathRush();
}
function drawMathRush() {
    clearCanvas(); drawWatermark();
    ctx.fillStyle = "#fff"; ctx.font = "bold 24px Arial"; ctx.textAlign = "center"; ctx.fillText(mathQuestion, canvas.width/2, 50);
    for(let i=0; i<3; i++) {
        ctx.fillStyle = "#222"; if(mathLane === i) ctx.fillStyle = "#00ffcc";
        ctx.fillRect(i*130 + 10, 350, 110, 40);
        ctx.fillStyle = "#fff"; ctx.font = "16px Arial"; ctx.fillText(mathOptions[i], i*130 + 65, 375);
        ctx.fillStyle = "#ff0055"; ctx.fillRect(i*130 + 50, hexTimer, 30, 30);
    }
}

// 9. COLOR MATCH (RENK EŞLEME)
function initColorMatch() { colorCircle = { targetColor: "#00ffcc", options: ["#00ffcc", "#ff0055"] }; ball.y = 0; ball.x = 200; ball.dy = 4; }
function updateColorMatch() {
    ball.y += ball.dy; if(ball.y >= 350) {
        if (colorCircle.targetColor === colorCircle.options[0]) { 
            score += 40; 
            scoreElement.innerText = score; 
            ball.y = 0; 
            if (typeof addGold === "function") addGold(5);
            if (typeof playSound === "function") playSound("coin");
            if (typeof saveLocalScore === "function") saveLocalScore("colormatch", score);
            colorCircle.targetColor = Math.random() > 0.5 ? "#00ffcc" : "#ff0055"; 
        } else { gameOver(); }
    }
    drawColorMatch();
}
function drawColorMatch() {
    clearCanvas(); drawWatermark();
    ctx.fillStyle = colorCircle.targetColor; ctx.beginPath(); ctx.arc(ball.x, ball.y, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = colorCircle.options[0]; ctx.fillRect(150, 350, 100, 20); // Alt bar
}

// 10. SOUND WAVE (SES DALGASI)
function initSoundWave() { wavePlayer = { x: 50, y: 200, angle: 0 }; waveObstacles = []; hexTimer = 0; }
function updateSoundWave() {
    hexTimer++; wavePlayer.angle += 0.05;
    if (keysPressed["ArrowUp"] || keysPressed["w"]) wavePlayer.y -= 4; else wavePlayer.y += 3;
    if (hexTimer % 40 === 0) waveObstacles.push({ x: canvas.width, top: Math.random()*150, bottom: Math.random()*150 + 250 });
    waveObstacles.forEach((o, idx) => {
        o.x -= 4; 
        if(o.x < -40) {
            waveObstacles.splice(idx, 1);
            score += 20;
            scoreElement.innerText = score;
            if (typeof addGold === "function") addGold(3);
            if (typeof playSound === "function") playSound("coin");
            if (typeof saveLocalScore === "function") saveLocalScore("soundwave", score);
        }
        if(wavePlayer.x > o.x && wavePlayer.x < o.x+40 && (wavePlayer.y < o.top || wavePlayer.y > o.bottom)) { gameOver(); }
    });
    if(wavePlayer.y < 0 || wavePlayer.y > canvas.height) gameOver();
    drawSoundWave();
}
function drawSoundWave() {
    clearCanvas(); drawWatermark();
    ctx.fillStyle = "#00ffcc"; ctx.beginPath(); ctx.arc(wavePlayer.x, wavePlayer.y, 10, 0, Math.PI`*2`); ctx.fill();
    ctx.fillStyle = "#ff0055"; waveObstacles.forEach(o => { ctx.fillRect(o.x, 0, 40, o.top); ctx.fillRect(o.x, o.bottom, 40, canvas.height-o.bottom); });
}

// ============================================================================
// --- ÇOK OYUNCULUR (DÜELLO) OYUN MOTORLARI ---
// ============================================================================

// 11. MULTIPLAYER X-O-X (ONLINE / LOKAL)
function initMultiXOX() { xoxGrid = Array(9).fill(""); xoxTurn = "X"; scoreElement.innerText = "X Sırası"; }
function drawMultiXOX() {
    clearCanvas(); drawWatermark(); let size = 100; let start = 50;
    for(let i=0; i<9; i++) {
        let r = Math.floor(i/3); let c = i%3;
        ctx.strokeStyle = "#00ffcc"; ctx.lineWidth = 4;
        ctx.strokeRect(start + c*size, start + r*size, size, size);
        if(xoxGrid[i] !== "") {
            ctx.fillStyle = xoxGrid[i] === "X" ? "#ff0055" : "#00b0ff";
            ctx.font = "bold 40px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(xoxGrid[i], start + c*size + size/2, start + r*size + size/2);
        }
    }
}
function handleMultiXOXClick(x, y) {
    let size = 100; let start = 50;
    let c = Math.floor((x - start)/size); let r = Math.floor((y - start)/size);
    if(c>=0 && c<3 && r>=0 && r<3) {
        let idx = r*3 + c;
        if(xoxGrid[idx] === "") {
            xoxGrid[idx] = xoxTurn; if (typeof playSound === "function") playSound("dink");
            if (checkXOXWin()) { 
                scoreElement.innerText = `${xoxTurn} Kazandı! 🎉`; 
                isGameRunning = false; 
                if (typeof addGold === "function") addGold(50); // Kazanan tarafa 50 Altın bonus
                if (typeof playSound === "function") playSound("coin");
                if (typeof saveLocalScore === "function") saveLocalScore("multixox", 1);
            }
            else { xoxTurn = xoxTurn === "X" ? "O" : "X"; scoreElement.innerText = `${xoxTurn} Sırası`; }
            drawMultiXOX();
        }
    }
}
function checkXOXWin() {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return wins.some(w => xoxGrid[w[0]] !== "" && xoxGrid[w[0]] === xoxGrid[w[1]] && xoxGrid[w[0]] === xoxGrid[w[2]]);
}

// 12. MULTIPLAYER NEON TANK SAVAŞI
function initMultiTank() {
    tankP1 = { x: 60, y: 200, angle: 0, lasers: [], color: "#ff0055" };
    tankP2 = { x: 340, y: 200, angle: Math.PI, lasers: [], color: "#00ffcc" };
}
function updateMultiTank() {
    tankP1.lasers.forEach((l, idx) => {
        l.x += l.dx; l.y += l.dy;
        if (l.x < 0 || l.x > canvas.width || l.y < 0 || l.y > canvas.height) tankP1.lasers.splice(idx, 1);
        if (Math.hypot(l.x - tankP2.x, l.y - tankP2.y) < 18) { 
            scoreElement.innerText = "P1 KAZANDI! 🛡️"; 
            if (typeof addGold === "function") addGold(100); // Tank galibiyetine büyük ödül
            if (typeof playSound === "function") playSound("coin");
            if (typeof saveLocalScore === "function") saveLocalScore("multitank", 100);
            gameOver(); 
        }
    });
    tankP2.lasers.forEach((l, idx) => {
        l.x += l.dx; l.y += l.dy;
        if (l.x < 0 || l.x > canvas.width || l.y < 0 || l.y > canvas.height) tankP2.lasers.splice(idx, 1);
        if (Math.hypot(l.x - tankP1.x, l.y - tankP1.y) < 18) { 
            scoreElement.innerText = "P2 KAZANDI! 🛡️"; 
            if (typeof addGold === "function") addGold(100);
            if (typeof playSound === "function") playSound("coin");
            if (typeof saveLocalScore === "function") saveLocalScore("multitank", 100);
            gameOver(); 
        }
    });
    drawMultiTank();
}
function drawMultiTank() {
    clearCanvas(); drawWatermark();
    [tankP1, tankP2].forEach(t => {
        ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.angle);
        ctx.fillStyle = t.color; ctx.fillRect(-12, -12, 24, 24);
        ctx.fillStyle = "#fff"; ctx.fillRect(0, -3, 16, 6); ctx.restore();
        ctx.fillStyle = "#ffff00"; t.lasers.forEach(l => ctx.fillRect(l.x, l.y, 4, 4));
    });
}


// ============================================================================
// --- CYBER BIRD PRO VE ESKİ AKTİF MEKANİZMALAR (KORUNAN ALAN) ---
// ============================================================================
function initCyberBird() { bird.y = 150; bird.velocity = 0; pipes = []; }
function updateCyberBird() {
    bird.velocity += 0.4; bird.y += bird.velocity;
    if(bird.y > canvas.height || bird.y < 0) { gameOver(); return; }
    if(Math.random() < 0.02 && (pipes.length === 0 || pipes[pipes.length-1].x < 250)) {
        pipes.push({ x: canvas.width, top: Math.random()*150+50, bottom: Math.random()*150+200, passed: false });
    }
    pipes.forEach((p, i) => {
        p.x -= 3; if(p.x < -50) pipes.splice(i,1);
        if(!p.passed && p.x < bird.x) { p.passed = true; score += 20; scoreElement.innerText = score; playSound("coin"); }
        if(bird.x > p.x && bird.x < p.x + 40 && (bird.y < p.top || bird.y > p.bottom)) { gameOver(); return; }
    });
    drawCyberBird();
}
function drawCyberBird() { clearCanvas(); drawWatermark(); ctx.fillStyle = "#00ffcc"; ctx.fillRect(bird.x, bird.y, 16, 16); ctx.fillStyle = "#ff0055"; pipes.forEach(p => { ctx.fillRect(p.x, 0, 40, p.top); ctx.fillRect(p.x, p.bottom, 40, canvas.height - p.bottom); }); }

function initDinoRun2() { dino.y = 300; dino.vy = 0; cactuses = []; dinoTimer = 0; }
function updateDinoRun2() {
    dino.vy += 0.6; dino.y += dino.vy; if(dino.y > 300) { dino.y = 300; dino.vy = 0; dino.grounded = true; }
    dinoTimer++; if(dinoTimer % 60 === 0) cactuses.push({ x: canvas.width, w: 20, h: Math.random()*30+25, passed: false });
    cactuses.forEach((c, i) => {
        c.x -= 5; if(c.x < -20) cactuses.splice(i, 1);
        if(!c.passed && c.x < dino.x) { c.passed = true; score += 10; scoreElement.innerText = score; addGold(2); }
        if(dino.x < c.x + c.w && dino.x + dino.w > c.x && dino.y + dino.h > 340 - c.h) { gameOver(); return; }
    });
    drawDinoRun2();
}
function drawDinoRun2() { clearCanvas(); drawWatermark(); ctx.fillStyle = "#39ff14"; ctx.fillRect(dino.x, dino.y, dino.w, dino.h); ctx.fillStyle = "#ff3333"; cactuses.forEach(c => ctx.fillRect(c.x, 340 - c.h, c.w, c.h)); ctx.fillStyle = "#555"; ctx.fillRect(0, 340, canvas.width, 4); }

function initStarHunter() { catcher.x = 160; catchStars = []; catchTimer = 0; }
function updateStarHunter() {
    catchTimer++; if(catchTimer % 30 === 0) catchStars.push({ x: Math.random()*380, y: 0, speed: 4 });
    catchStars.forEach((s, i) => {
        s.y += s.speed;
        if(s.y > canvas.height) catchStars.splice(i, 1);
        if(s.y > catcher.y && s.x > catcher.x && s.x < catcher.x + catcher.w) { catchStars.splice(i,1); score += 15; scoreElement.innerText = score; playSound("coin"); }
    });
    drawStarHunter();
}
function drawStarHunter() { clearCanvas(); drawWatermark(); ctx.fillStyle = "#ff00aa"; ctx.fillRect(catcher.x, catcher.y, catcher.w, catcher.h); ctx.fillStyle = "#ffff00"; catchStars.forEach(s => ctx.fillRect(s.x, s.y, 10, 10)); }

function initNeonDraw() { garticStrokes = []; }
function drawNeonDraw() {
    clearCanvas(); drawWatermark(); ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.lineWidth = 5;
    for(let i=0; i<garticStrokes.length; i++) {
        let p = garticStrokes[i]; if(p.type === 'start') { ctx.beginPath(); ctx.moveTo(p.x, p.y); } else { ctx.strokeStyle = p.color; ctx.lineTo(p.x, p.y); ctx.stroke(); }
    }
}

function initCatchPro() { catcher.x = 160; catchStars = []; catchTimer = 0; }
function updateCatchPro() {
    catchTimer++; if(catchTimer % 25 === 0) catchStars.push({ x: Math.random()*380, y: 0, speed: 5 });
    catchStars.forEach((s, i) => {
        s.y += s.speed; if(s.y > canvas.height) { gameOver(); return; }
        if(s.y > catcher.y && s.x > catcher.x && s.x < catcher.x + catcher.w) { catchStars.splice(i,1); score += 25; scoreElement.innerText = score; playSound("coin"); addGold(5); }
    });
    drawCatchPro();
}
function drawCatchPro() { clearCanvas(); drawWatermark(); ctx.fillStyle = "#00e676"; ctx.fillRect(catcher.x, catcher.y, catcher.w, catcher.h); ctx.fillStyle = "#00b0ff"; catchStars.forEach(s => ctx.fillRect(s.x, s.y, 12, 12)); }

function initSnakeVS() {
    vsP1 = [{x: 4, y: 10}, {x: 3, y: 10}]; vsP2 = [{x: 15, y: 10}, {x: 16, y: 10}];
    vsDir1 = "RIGHT"; vsDir2 = "LEFT"; vsFood = {x: 10, y: 10};
}
function updateSnakeVS() {
    let head1 = {...vsP1[0]}; if(vsDir1 === "RIGHT") head1.x++; if(vsDir1 === "LEFT") head1.x--; if(vsDir1 === "UP") head1.y--; if(vsDir1 === "DOWN") head1.y++;
    let head2 = {...vsP2[0]}; if(vsDir2 === "RIGHT") head2.x++; if(vsDir2 === "LEFT") head2.x--; if(vsDir2 === "UP") head2.y--; if(vsDir2 === "DOWN") head2.y++;

    if(head1.x < 0 || head1.x >= 20 || head1.y < 0 || head1.y >= 20 || head2.x < 0 || head2.x >= 20 || head2.y < 0 || head2.y >= 20) { gameOver(); return; }

    vsP1.unshift(head1); if(head1.x === vsFood.x && head1.y === vsFood.y) { vsFood = {x:Math.floor(Math.random()*20), y:Math.floor(Math.random()*20)}; score += 10; scoreElement.innerText = "P1 Önde!"; } else vsP1.pop();
    vsP2.unshift(head2); if(head2.x === vsFood.x && head2.y === vsFood.y) { vsFood = {x:Math.floor(Math.random()*20), y:Math.floor(Math.random()*20)}; score += 10; scoreElement.innerText = "P2 Önde!"; } else vsP2.pop();
    drawSnakeVS();
}
function drawSnakeVS() { clearCanvas(); drawWatermark(); ctx.fillStyle = "#00ffcc"; vsP1.forEach(p => ctx.fillRect(p.x*20, p.y*20, 19, 19)); ctx.fillStyle = "#ff0055"; vsP2.forEach(p => ctx.fillRect(p.x*20, p.y*20, 19, 19)); ctx.fillStyle = "#ffff00"; ctx.fillRect(vsFood.x*20, vsFood.y*20, 19, 19); }

function initChess() {
    chessBoard = Array(8).fill(null).map(() => Array(8).fill(""));
    chessBoard[0] = ["R", "N", "B", "Q", "K", "B", "N", "R"]; chessBoard[1] = ["P", "P", "P", "P", "P", "P", "P", "P"];
    chessBoard[6] = ["p", "p", "p", "p", "p", "p", "p", "p"]; chessBoard[7] = ["r", "n", "b", "q", "k", "b", "n", "r"];
    chessSelectedPiece = null;
}
function drawChess() {
    clearCanvas(); let size = 45; let offset = 20;
    for(let r=0; r<8; r++) {
        for(let c=0; c<8; c++) {
            ctx.fillStyle = (r+c)%2===0 ? "#111" : "#222";
            ctx.fillRect(offset + c*size, offset + r*size, size, size);
            ctx.strokeStyle = "rgba(0,255,200,0.2)"; ctx.strokeRect(offset + c*size, offset + r*size, size, size);
            let piece = chessBoard[r][c];
            if(piece) {
                ctx.fillStyle = piece === piece.toUpperCase() ? "#ff0055" : "#00ffcc";
                ctx.font = "bold 20px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
                ctx.fillText(piece, offset + c*size + size/2, offset + r*size + size/2);
            }
        }
    }
}
function handleChessClick(x, y) {
    let size = 45; let offset = 20;
    let c = Math.floor((x - offset) / size); let r = Math.floor((y - offset) / size);
    if(c>=0 && c<8 && r>=0 && r<8) {
        if(!chessSelectedPiece) {
            if(chessBoard[r][c] !== "") chessSelectedPiece = {r, c};
        } else {
            chessBoard[r][c] = chessBoard[chessSelectedPiece.r][chessSelectedPiece.c];
            chessBoard[chessSelectedPiece.r][chessSelectedPiece.c] = ""; chessSelectedPiece = null;
            playSound("dink");
        }
        drawChess();
    }
}

function initSnake() { snake = [{x:100,y:100},{x:80,y:100},{x:60,y:100}]; dx=gridSize; dy=0; moveFood(); drawSnake(); }
function updateSnake() {
    if (yilanHamleKuyrugu.length > 0) {
        const sonraki = yilanHamleKuyrugu.shift();
        if (sonraki === "SOL" && dx === 0) { dx = -gridSize; dy = 0; }
        if (sonraki === "SAG" && dx === 0) { dx = gridSize; dy = 0; }
        if (sonraki === "YUKARI" && dy === 0) { dx = 0; dy = -gridSize; }
        if (sonraki === "ASAGI" && dy === 0) { dx = 0; dy = gridSize; }
    }
    let head = { x: snake[0].x + dx, y: snake[0].y + dy }; 
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height || checkSelfCollision(head)) { yilanHamleKuyrugu = []; gameOver(); return; } 
    snake.unshift(head); 
    if (head.x === food.x && head.y === food.y) { score += 10; if(scoreElement) scoreElement.innerText = score; playSound("coin"); addGold(10); moveFood(); } else { snake.pop(); } 
    drawSnake(); 
}
function drawSnake() { clearCanvas(); drawWatermark(); let c = getSkinColors(); snake.forEach((p, i) => { ctx.fillStyle = i===0?c.head:c.body; ctx.fillRect(p.x+1, p.y+1, gridSize-2, gridSize-2); }); ctx.fillStyle = "#ff1744"; ctx.beginPath(); ctx.arc(food.x+10, food.y+10, 8, 0, Math.PI*2); ctx.fill(); }

function initBrick() { ball.x = 200; ball.y = 250; ball.dx = 3; ball.dy = -4; paddle.x = 155; bricks = []; for(let c=0; c<5; c++) { for(let r=0; r<4; r++) { bricks.push({ x: c * 75 + 15, y: r * 22 + 40, status: 1 }); } } drawBrick(); }
function updateBrick() { ball.x += ball.dx; ball.y += ball.dy; if (ball.x < ball.radius || ball.x > canvas.width - ball.radius) ball.dx = -ball.dx; if (ball.y < ball.radius) ball.dy = -ball.dy; if (ball.y + ball.radius >= paddle.y && ball.y <= paddle.y + paddle.height) { if (ball.x >= paddle.x && ball.x <= paddle.x + paddle.width) { ball.dy = -Math.abs(ball.dy); playSound("dink"); } } if (ball.y > canvas.height) { gameOver(); return; } bricks.forEach(b => { if (b.status === 1) { if (ball.x > b.x && ball.x < b.x + 68 && ball.y > b.y && ball.y < b.y + 18) { ball.dy = -ball.dy; b.status = 0; score += 20; if(scoreElement) scoreElement.innerText = score; playSound("coin"); addGold(5); } } }); drawBrick(); }
function drawBrick() { clearCanvas(); drawWatermark(); let c = getSkinColors(); ctx.fillStyle = c.head; ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height); ctx.fillStyle = "#00ffff"; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2); ctx.fill(); bricks.forEach(b => { if(b.status===1) { ctx.fillStyle = c.body; ctx.fillRect(b.x, b.y, 68, 18); } }); }

function initSpace() { playerShip.x = 180; playerLasers = []; invaders = []; invaderDirection = 1; let sp = 0.6 + (spaceWave * 0.3); for(let x=0; x<6; x++) { for(let y=0; y<3; y++) { invaders.push({ x: x*55+40, y: y*25+40, w:30, h:15, alive:true, speed: sp }); } } drawSpace(); }
function updateSpace() { let eR = false; invaders.forEach(inv => { if (!inv.alive) return; inv.x += invaderDirection * inv.speed; if (inv.x + inv.w > canvas.width || inv.x < 0) eR = true; if (inv.y + inv.h >= playerShip.y) { gameOver(); return; } }); if (eR) { invaderDirection *= -1; invaders.forEach(inv => inv.y += 15); } playerLasers.forEach((l, li) => { l.y -= 6; if(l.y < 0) playerLasers.splice(li,1); invaders.forEach(inv => { if (inv.alive && l.x > inv.x && l.x < inv.x + inv.w && l.y > inv.y && l.y < inv.y + inv.h) { inv.alive = false; playerLasers.splice(li,1); score += 30; if(scoreElement) scoreElement.innerText = score; playSound("boom"); addGold(10); } }); }); if (invaders.filter(i => i.alive).length === 0) { spaceWave++; playSound("coin"); initSpace(); } drawSpace(); }
function drawSpace() { clearCanvas(); drawWatermark(); let c = getSkinColors(); ctx.fillStyle = c.head; ctx.fillRect(playerShip.x, playerShip.y, playerShip.width, playerShip.height); ctx.fillStyle = "#ff0"; playerLasers.forEach(l => ctx.fillRect(l.x, l.y, 3, 12)); invaders.forEach(inv => { if(inv.alive) { ctx.fillStyle = "#ff1744"; ctx.fillRect(inv.x, inv.y, inv.w, inv.h); } }); ctx.fillStyle = "#fff"; ctx.font = "12px sans-serif"; ctx.fillText("Dalga: " + spaceWave, 40, 20); }

function initFlappy() { bird.y = 150; bird.velocity = 0; pipes = []; drawFlappy(); }
function updateFlappy() { bird.velocity += bird.gravity; bird.y += bird.velocity; if (bird.y > canvas.height || bird.y < 0) { gameOver(); return; } if (Math.random() < 0.015 && (pipes.length === 0 || pipes[pipes.length-1].x < 260)) { let gap = 110; let topH = Math.floor(Math.random() * 160) + 40; pipes.push({ x: canvas.width, top: topH, bottom: canvas.height - topH - gap, passed: false }); } pipes.forEach((p, pi) => { p.x -= 2.5; if(p.x < -50) pipes.splice(pi,1); if(!p.passed && p.x < bird.x) { p.passed = true; score += 50; if(scoreElement) scoreElement.innerText = score; playSound("coin"); addGold(15); } if (bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + 50) { if (bird.y - bird.radius < p.top || bird.y + bird.radius > canvas.height - p.bottom) { gameOver(); return; } } }); drawFlappy(); }
function drawFlappy() { clearCanvas(); drawWatermark(); let c = getSkinColors(); ctx.fillStyle = c.head; ctx.beginPath(); ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = "#e91e63"; pipes.forEach(p => { ctx.fillRect(p.x, 0, 50, p.top); ctx.fillRect(p.x, canvas.height - p.bottom, 50, p.bottom); }); }

function initPong() { pongBall.x = 200; pongBall.y = 200; pongBall.dx = 4; pongBall.dy = 2; pongPad.y = 160; aiPad.y = 160; drawPong(); }
function updatePong() { pongBall.x += pongBall.dx; pongBall.y += pongBall.dy; if (pongBall.y < 5 || pongBall.y > canvas.height - 5) pongBall.dy = -pongBall.dy; if (pongBall.y > aiPad.y + 40) aiPad.y += aiPad.speed; else aiPad.y -= aiPad.speed; if (pongBall.x <= 20 && pongBall.y >= pongPad.y && pongBall.y <= pongPad.y + pongPad.height) { pongBall.dx = Math.abs(pongBall.dx) + 0.2; playSound("dink"); score += 5; if(scoreElement) scoreElement.innerText = score; } if (pongBall.x >= canvas.width - 20 && pongBall.y >= aiPad.y && pongBall.y <= aiPad.y + aiPad.height) { pongBall.dx = -Math.abs(pongBall.dx) - 0.2; playSound("dink"); } if (pongBall.x < 0) { gameOver(); return; } if (pongBall.x > canvas.width) { score += 100; if(scoreElement) scoreElement.innerText = score; playSound("coin"); addGold(50); initPong(); } drawPong(); }
function drawPong() { clearCanvas(); drawWatermark(); let c = getSkinColors(); ctx.fillStyle = c.head; ctx.fillRect(10, pongPad.y, pongPad.width, pongPad.height); ctx.fillStyle = "#ff1744"; ctx.fillRect(canvas.width - 20, aiPad.y, aiPad.width, aiPad.height); ctx.fillStyle = "#fff"; ctx.fillRect(pongBall.x - 4, pongBall.y - 4, 8, 8); }

function initGartic() { garticStrokes = []; drawGartic(); }
function drawGartic() {
    clearCanvas(); drawWatermark(); ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.lineWidth = 4;
    for(let i=0; i<garticStrokes.length; i++) {
        let p = garticStrokes[i]; if(p.type === 'start') { ctx.beginPath(); ctx.moveTo(p.x, p.y); } else { ctx.strokeStyle = p.color; ctx.lineTo(p.x, p.y); ctx.stroke(); }
    }
    ctx.fillStyle = "#fff"; ctx.font = "14px Arial"; ctx.textAlign = "center"; ctx.fillText("Serbest Çizim Modu: Ekrana Tıkla ve Çiz!", canvas.width/2, 20);
}

function initDino() { dino.y = 300; dino.vy = 0; cactuses = []; dinoTimer = 0; drawDino(); }
function updateDino() {
    dino.vy += dino.gravity; dino.y += dino.vy;
    if(dino.y >= 300) { dino.y = 300; dino.vy = 0; dino.grounded = true; } else { dino.grounded = false; }
    dinoTimer++;
    if(dinoTimer % 70 === 0) cactuses.push({ x: canvas.width, y: 310, w: 15, h: 30, passed: false });
    cactuses.forEach((c, i) => {
        c.x -= 5 + (dinoTimer * 0.001);
        if(c.x < -20) cactuses.splice(i, 1);
        if(!c.passed && c.x < dino.x) { c.passed = true; score += 10; if(scoreElement) scoreElement.innerText = score; playSound("coin"); addGold(5); }
        if(dino.x < c.x + c.w && dino.x + dino.w > c.x && dino.y < c.y + c.h && dino.y + dino.h > c.y) { gameOver(); return; }
    });
    drawDino();
}
function drawDino() { clearCanvas(); drawWatermark(); let c = getSkinColors(); ctx.fillStyle = c.head; ctx.fillRect(dino.x, dino.y, dino.w, dino.h); ctx.fillStyle = "#ff1744"; cactuses.forEach(cac => ctx.fillRect(cac.x, cac.y, cac.w, cac.h)); ctx.fillStyle = "#fff"; ctx.fillRect(0, 340, canvas.width, 2); }

function initCatch() { catcher.x = 160; catchStars = []; catchTimer = 0; drawCatch(); }
function updateCatch() {
    catchTimer++;
    if(catchTimer % 40 === 0) catchStars.push({ x: Math.random() * (canvas.width - 20), y: -15, w: 15, h: 15, speed: 3 + Math.random()*2 });
    catchStars.forEach((s, i) => {
        s.y += s.speed;
        if(s.y > canvas.height) { gameOver(); return; }
        if(s.y + s.h > catcher.y && s.y < catcher.y + catcher.h && s.x + s.w > catcher.x && s.x < catcher.x + catcher.w) {
            catchStars.splice(i, 1); score += 15; if(scoreElement) scoreElement.innerText = score; playSound("coin"); addGold(5);
        }
    });
    drawCatch();
}
function drawCatch() { clearCanvas(); drawWatermark(); let c = getSkinColors(); ctx.fillStyle = c.head; ctx.beginPath(); ctx.arc(catcher.x + catcher.w/2, catcher.y + catcher.h/2, catcher.w/2, 0, Math.PI); ctx.fill(); ctx.fillStyle = "#ffd700"; catchStars.forEach(s => { ctx.beginPath(); ctx.arc(s.x+s.w/2, s.y+s.h/2, s.w/2, 0, Math.PI*2); ctx.fill(); }); }

function moveLeft() { 
    if(activeGame === "snake" && dx===0) { dx = -gridSize; dy = 0; } 
    else if(["brick", "meteors", "coinrain"].includes(activeGame) && paddle.x > 0) paddle.x -= paddle.speed; 
    else if(activeGame === "space" && playerShip.x > 0) playerShip.x -= playerShip.speed; 
    else if(activeGame === "pong" && pongPad.y > 0) pongPad.y -= pongPad.speed; 
    else if(["catch", "starhunter", "catchpro"].includes(activeGame) && catcher.x > 0) catcher.x -= 20;
    else if(activeGame === "bithopper" && hopPlayer.x > 0) hopPlayer.x -= 15;
    else if(activeGame === "speeddriver" && roadX > 105) roadX -= 15;
    else if(activeGame === "mathrush" && mathLane > 0) mathLane--;
    else if(activeGame === "colormatch") { colorCircle.options.unshift(colorCircle.options.pop()); }
}
function moveRight() { 
    if(activeGame === "snake" && dx===0) { dx = gridSize; dy = 0; } 
    else if(["brick", "meteors", "coinrain"].includes(activeGame) && paddle.x < canvas.width - paddle.width) paddle.x += paddle.speed; 
    else if(activeGame === "space" && playerShip.x < canvas.width - playerShip.width) playerShip.x += playerShip.speed; 
    else if(activeGame === "pong" && pongPad.y < canvas.height - pongPad.height) pongPad.y += pongPad.speed; 
    else if(["catch", "starhunter", "catchpro"].includes(activeGame) && catcher.x < 340) catcher.x += 20;
    else if(activeGame === "bithopper" && hopPlayer.x < canvas.width - 20) hopPlayer.x += 15;
    else if(activeGame === "speeddriver" && roadX < 265) roadX += 15;
    else if(activeGame === "mathrush" && mathLane < 2) mathLane++;
    else if(activeGame === "colormatch") { colorCircle.options.push(colorCircle.options.shift()); }
}
function actionKey() { 
    if(isGameWaitingToStart) { isGameWaitingToStart = false; return; } 
    if (activeGame === "space" && isGameRunning) { playerLasers.push({ x: playerShip.x + 18, y: playerShip.y }); playSound("laser"); } 
    else if (activeGame === "multitank" && isGameRunning) { tankP1.lasers.push({ x: tankP1.x, y: tankP1.y, dx: Math.cos(tankP1.angle)*6, dy: Math.sin(tankP1.angle)*6 }); playSound("laser"); }
    else if (["flappy", "cyberbird", "neonhelix"].includes(activeGame) && isGameRunning) { bird.velocity = bird.jump; helixAngle += 0.4; playSound("dink"); } 
    else if (["dino", "dinorun2", "hexrunner"].includes(activeGame) && isGameRunning && dino.grounded) { dino.vy = dino.jump; dino.grounded = false; playSound("dink"); } 
}

function clearCanvas() { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
function drawWatermark() { ctx.fillStyle = "rgba(255, 255, 255, 0.03)"; ctx.font = "bold 32px sans-serif"; ctx.textAlign = "center"; ctx.fillText("EFEARAZ44 ARCADE", canvas.width / 2, canvas.height / 2); }
function getSkinColors() { if (currentSkin === "blue") return { head: "#00b0ff", body: "#0091ea", glow: "#00b0ff" }; if (currentSkin === "red") return { head: "#ff1744", body: "#d50000", glow: "#ff1744" }; if (currentSkin === "gold") return { head: "#ffd700", body: "#ffaa00", glow: "#ffd700" }; return { head: "#4caf50", body: "#388e3c", glow: "#4caf50" }; }
function moveFood() { food.x = Math.floor(Math.random() * 20) * 20; food.y = Math.floor(Math.random() * 20) * 20; }
function checkSelfCollision(h) { for(let i=1;i<snake.length;i++){ if(snake[i].x===h.x && snake[i].y===h.y) return true; } return false; }
function addGold(a) { totalGold += a; localStorage.setItem("arc_gold", totalGold); updateGoldUI(); }
function updateGoldUI() { if(totalGoldElement) totalGoldElement.innerText = totalGold; }

function gameOver(silent = false) { 
    clearInterval(gameInterval); isGameRunning = false; isGameWaitingToStart = false; 
    if(!silent) playSound("boom"); 
    if(arcadeScores[activeGame] !== undefined && score > arcadeScores[activeGame]) { arcadeScores[activeGame] = score; } 
    let max = Math.max(arcadeScores.snake||0, arcadeScores.brick||0, arcadeScores.space||0, arcadeScores.flappy||0, arcadeScores.pong||0, arcadeScores.blockblast||0, arcadeScores.dino||0, arcadeScores.catch||0); 
    if(max === score && score > 0) arcadeScores.allTimePlayer = currentPlayer + " (" + activeGame.toUpperCase() + ")"; 
    
    // Yerel tarayıcı hafızasına kaydetme
    localStorage.setItem("arc_scores", JSON.stringify(arcadeScores)); 
    
    // --- BİZİM EKLEDİĞİMİZ KISIM: KÜRESEL SKOR KAYDI ---
    // Eğer kullanıcı giriş yaptıysa ve skor 0'dan büyükse Firebase'e fırlat
    if (mevcutKullanici && mevcutKullanici !== "" && score > 0) {
        globalSkorKaydet(mevcutKullanici, mevcutSifre, score);
    }
    // --------------------------------------------------

    updateLeaderboardUI(); 
    if(!silent) { ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle = "#ff1744"; ctx.font = "bold 30px Arial"; ctx.textAlign = "center"; ctx.fillText("OYUN BİTTİ!", canvas.width/2, canvas.height/2); }
}

// --- LOKAL SKOR ARABİRİMİ (ORİJİNAL YAPISINDA KORUNDU) ---
function updateLeaderboardUI() { 
    if(snakeBestCtx) snakeBestCtx.innerText = (arcadeScores.snake || 0) + " Puan"; 
    if(brickBestCtx) brickBestCtx.innerText = (arcadeScores.brick || 0) + " Puan"; 
    if(spaceBestCtx) spaceBestCtx.innerText = (arcadeScores.space || 0) + " Puan"; 
    if(flappyBestCtx) flappyBestCtx.innerText = (arcadeScores.flappy || 0) + " Puan"; 
    if(pongBestCtx) pongBestCtx.innerText = (arcadeScores.pong || 0) + " Puan"; 
    
    let max = Math.max(arcadeScores.snake||0, arcadeScores.brick||0, arcadeScores.space||0, arcadeScores.flappy||0, arcadeScores.pong||0, arcadeScores.blockblast||0, arcadeScores.dino||0, arcadeScores.catch||0); 
    if(allTimeBestCtx) allTimeBestCtx.innerText = max > 0 ? arcadeScores.allTimePlayer + " - " + max + " Puan" : "Henüz yok..."; 
}


// ============================================================================
// --- 3. ADIM: KÜRESEL FİRİBASE MOTOR FONKSİYONLARI (DOSYANIN EN ALTINA EKLE) ---
// ============================================================================

function globalSkorKaydet(kullaniciAdi, sifre, alinanSkor) {
    // window.database kullanıyorduk, onu sabitleyelim
    const db = window.database || firebase.database(); 
    const userRef = db.ref('users/' + kullaniciAdi);

    userRef.once('value').then((snapshot) => {
        const userData = snapshot.val();
        
        if (!userData || userData.sifre === sifre) {
            const eskiRekor = userData ? (Number(userData.enYuksekSkor) || 0) : 0;
            const yeniSkor = Number(alinanSkor); // Kesinlikle sayı olsun!

            if (yeniSkor > eskiRekor) {
                userRef.set({
                    kullaniciAdi: kullaniciAdi,
                    sifre: sifre,
                    enYuksekSkor: yeniSkor
                }).then(() => {
                    console.log("Rekor başarıyla kaydedildi!");
                    globalLeaderboardCek();
                });
            }
        } else {
            console.warn("Şifre hatası!");
        }
    });
}

function globalLeaderboardCek() {
    const db = window.database || firebase.database();
    // 'users' altındaki verileri çek ve enYuksekSkor'a göre sırala
    db.ref('users').orderByChild('enYuksekSkor').limitToLast(10).once('value').then((snapshot) => {
        const panoContainer = document.getElementById("globalPano");
        if (!panoContainer) return;
        
        let oyuncuListesi = [];
        snapshot.forEach((childSnapshot) => {
            oyuncuListesi.push(childSnapshot.val());
        });
        
        // Büyükten küçüğe sırala (limitToLast en küçükleri en başa koyar, reverse lazım)
        oyuncuListesi.sort((a, b) => b.enYuksekSkor - a.enYuksekSkor);

        panoContainer.innerHTML = "";
        oyuncuListesi.forEach((oyuncu, index) => {
            let sira = index === 0 ? "👑" : (index + 1) + ".";
            panoContainer.innerHTML += `
                <div class="score-row" style="display:flex; justify-content:space-between; margin:5px 0;">
                    <span>${sira} ${oyuncu.kullaniciAdi}</span>
                    <span>${oyuncu.enYuksekSkor} Puan</span>
                </div>
            `;
        });
    });
}

function updateShopUI() { 
    document.querySelectorAll(".skin-btn").forEach(btn => { 
        let s = btn.getAttribute("data-skin"); let c = parseInt(btn.getAttribute("data-cost")) || 0; 
        if(currentSkin===s){ btn.innerText="Seçili"; btn.className="skin-btn active"; } else if(ownedSkins.includes(s)){ btn.innerText="Seç"; btn.className="skin-btn"; btn.style.background="#2196f3"; } else { btn.innerText="Satın Al (" + c + ")"; btn.className="skin-btn"; btn.style.background="#555"; } 
    }); 
}

document.querySelectorAll(".skin-btn").forEach(btn => { 
    btn.addEventListener("click", e => { 
        let s = e.target.getAttribute("data-skin"); let c = parseInt(e.target.getAttribute("data-cost")) || 0; 
        if(ownedSkins.includes(s)){ currentSkin = s; localStorage.setItem("arc_current_skin", s); } else if(totalGold >= c) { totalGold -= c; ownedSkins.push(s); currentSkin = s; localStorage.setItem("arc_gold", totalGold); localStorage.setItem("arc_skins", JSON.stringify(ownedSkins)); localStorage.setItem("arc_current_skin", s); updateGoldUI(); } 
        updateShopUI(); switchGame(activeGame); 
    }); 
});

(() => {
    let toplamSaniye = parseInt(localStorage.getItem("arcade_total_time")) || 0;
    function zamanFormatla(saniye) { let sa = Math.floor(saniye / 3600); let dk = Math.floor((saniye % 3600) / 60); let sn = saniye % 60; let sonuc = ""; if (sa > 0) sonuc += sa + "sa "; if (dk > 0) sonuc += dk + "dk "; sonuc += sn + "s"; return sonuc; }
    const timeDisplayElement = document.getElementById("totalTimeDisplay"); if (timeDisplayElement) { timeDisplayElement.innerText = zamanFormatla(toplamSaniye); }
    setInterval(() => { toplamSaniye++; localStorage.setItem("arcade_total_time", toplamSaniye); if (timeDisplayElement) { timeDisplayElement.innerText = zamanFormatla(toplamSaniye); } }, 1000);
})();
// ============================================================================
// --- SİSTEMDE EKSİK OLAN ANA REKOR KAYDETME MOTORU (saveLocalScore) ---
// ============================================================================
function saveLocalScore(gameName, finalScore) {
    if (!gameName) return;
    
    // 1. Gelen oyun adını temizle ve küçük harf standardına getir
    let cleanName = gameName.toLowerCase().replace(/\s+/g, '');
    
    // 2. Tarayıcı hafızasındaki (localStorage) mevcut skoru çek
    let currentBest = parseInt(localStorage.getItem(cleanName + "Best") || "0");
    
    // 3. Eğer yapılan skor eskisinden büyükse rekoru güncelle
    if (finalScore > currentBest) {
        localStorage.setItem(cleanName + "Best", finalScore.toString());
        currentBest = finalScore;
    }
    
    // 4. SOL PANELDEKİ "EN İYİLER" SKOR TABLOSUNU ANLIK GÜNCELLEME
    // HTML'deki id'ler ile JS tarafındaki oyun isimlerini eşleştiriyoruz
    const elementEslestirme = {
        "snake": "snakeBest",       "brick": "brickBest",
        "space": "spaceBest",       "flappy": "flappyBest",
        "pong": "pongBest",         "blockblast": "blockblastBest",
        "dino": "dinoBest",         "catch": "catcherBest",
        "meteors": "meteorsBest",   "hexrunner": "hexrunnerBest",
        "neonhelix": "neonhelixBest","bithopper": "bithopperBest",
        "gridout": "gridoutBest",   "coinrain": "coinrainBest",
        "speeddriver": "speeddriverBest", "mathrush": "mathrushBest",
        "colormatch": "colormatchBest", "soundwave": "soundwaveBest",
        "multixox": "multixoxBest",   "multitank": "multitankBest"
    };

    let targetElementId = elementEslestirme[cleanName];
    if (targetElementId) {
        let el = document.getElementById(targetElementId);
        if (el) {
            el.innerText = currentBest + " Puan";
        }
    }
    
    // Dosyadaki genel arayüz yenileme fonksiyonunu tetikle
    if (typeof updateLeaderboardUI === "function") {
        updateLeaderboardUI();
    }
}