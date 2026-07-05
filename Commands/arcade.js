// --- 1. SİSTEM VE SES MOTORU ---
let audioCtx = null;
function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function playSound(type) { 
    if (!audioCtx) initAudio(); 
    // Ses fonksiyonların burada kalacak (dink, boom, coin vb.)
}

// --- 2. GLOBAL OYUN DEĞİŞKENLERİ ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let activeGame = ""; let isGameRunning = false; let score = 0;

// --- 3. OYUN YÖNETİMİ ---
function switchGame(g) {
    isGameRunning = false;
    activeGame = g;
    // Oyunları başlatmak için her oyunun init fonksiyonunu buraya yaz
    // Örnek: if(g === 'snake') initSnake();
    isGameRunning = true;
    console.log(g + " başlatıldı");
}

function gameOver() {
    isGameRunning = false;
    ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0,0,400,400);
    ctx.fillStyle = "#ff1744"; ctx.font = "bold 30px Arial"; ctx.textAlign = "center";
    ctx.fillText("OYUN BİTTİ!", 200, 200);
}

// --- 4. OYUNLARINIZI BURAYA EKLEYİN ---
// 800 satırlık kod içindeki init, update, draw fonksiyonlarını
// bu satırın altına yapıştırın.