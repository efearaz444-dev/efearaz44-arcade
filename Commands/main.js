// --- 1. SİSTEM VE SES MOTORU ---
let audioCtx = null; let isMusicPlaying = false; let bgmInterval = null;
function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function playSound(type) { if (!audioCtx) return; try { let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain(); osc.connect(gain); gain.connect(audioCtx.destination); if (type === "dink") { osc.frequency.setValueAtTime(440, audioCtx.currentTime); gain.gain.setValueAtTime(0.1, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1); osc.start(); osc.stop(audioCtx.currentTime + 0.1); } else if (type === "boom") { osc.type = "sawtooth"; osc.frequency.setValueAtTime(150, audioCtx.currentTime); osc.frequency.linearRampToValueAtTime(40, audioCtx.currentTime + 0.3); gain.gain.setValueAtTime(0.2, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3); osc.start(); osc.stop(audioCtx.currentTime + 0.3); } else if (type === "coin") { osc.frequency.setValueAtTime(587, audioCtx.currentTime); osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); gain.gain.setValueAtTime(0.1, audioCtx.currentTime); osc.start(); osc.stop(audioCtx.currentTime + 0.2); } } catch(e) {} }

// --- 2. GLOBAL TANIMLAMALAR ---
const canvas = document.getElementById("gameCanvas"); const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
let activeGame = "snake"; let score = 0; let gameInterval; let isGameRunning = false;
let totalGold = parseInt(localStorage.getItem("arc_gold")) || 0;
let currentSkin = localStorage.getItem("arc_current_skin") || "classic";

// --- 3. OYUN YÖNETİMİ ---
function switchGame(g) {
    if(isGameRunning) gameOver();
    activeGame = g; score = 0; scoreElement.innerText = score;
    // Buraya oyun başlatıcı init fonksiyonlarını bağlayabilirsin
    console.log(g + " başlatıldı");
}

function gameOver() {
    clearInterval(gameInterval); isGameRunning = false; playSound("boom");
    ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0,0,400,400);
    ctx.fillStyle = "#ff1744"; ctx.font = "bold 30px Arial"; ctx.textAlign = "center";
    ctx.fillText("OYUN BİTTİ!", 200, 200);
}

// --- 4. YARDIMCI FONKSİYONLAR ---
function addGold(a) { totalGold += a; localStorage.setItem("arc_gold", totalGold); updateGoldUI(); }
function updateGoldUI() { if(document.getElementById("totalGold")) document.getElementById("totalGold").innerText = totalGold; }
function clearCanvas() { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 400, 400); }
function drawWatermark() { ctx.fillStyle = "rgba(255, 255, 255, 0.03)"; ctx.font = "bold 32px sans-serif"; ctx.textAlign = "center"; ctx.fillText("EFEARAZ44 ARCADE", 200, 200); }

function getSkinColors() {
    if (currentSkin === "blue") return { head: "#00b0ff", body: "#0091ea" };
    if (currentSkin === "red") return { head: "#ff1744", body: "#d50000" };
    if (currentSkin === "gold") return { head: "#ffd700", body: "#ffaa00" };
    return { head: "#4caf50", body: "#388e3c" };
}

// --- 5. MOBİL KONTROL ---
function yapayTusBas(tusKodu) {
    const event = new KeyboardEvent("keydown", { key: tusKodu });
    window.dispatchEvent(event);
}
// Mobil buton eventleri
if(document.getElementById("btnUp")) document.getElementById("btnUp").addEventListener("click", () => yapayTusBas("ArrowUp"));
if(document.getElementById("btnDown")) document.getElementById("btnDown").addEventListener("click", () => yapayTusBas("ArrowDown"));
if(document.getElementById("btnLeft")) document.getElementById("btnLeft").addEventListener("click", () => yapayTusBas("ArrowLeft"));
if(document.getElementById("btnRight")) document.getElementById("btnRight").addEventListener("click", () => yapayTusBas("ArrowRight"));