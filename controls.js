// ============================================================================
// --- MOBİL BASILI TUTMA VE GELİŞMİŞ HIZLANDIRMA MOTORU (CONTROLS.JS) ---
// ============================================================================

// Global değişkenleri window üzerine tanımlıyoruz ki main.js ve diğerleri görebilsin
window.dx = 0;
window.dy = 0;
window.gridSize = 20;

const bUp = document.getElementById("btnUp");
const bDown = document.getElementById("btnDown");
const bLeft = document.getElementById("btnLeft");
const bRight = document.getElementById("btnRight");
const bAction = document.getElementById("btnAction");

let mobilHareketInterval = null;
const MOBIL_HIZ_DONGUSU_MS = 45;

// --- MOBİL ÖZEL HAREKET FONKSİYONLARI ---
function mobilMoveLeft() {
    // Canvas kontrolünü global nesnelerden alıyoruz
    if (typeof paddle !== "undefined" && activeGame === "brick" && paddle.x > 0) paddle.x -= (paddle.speed * 1.5);
    else if (typeof playerShip !== "undefined" && activeGame === "space" && playerShip.x > 0) playerShip.x -= (playerShip.speed * 1.5);
    else if (typeof pongPad !== "undefined" && activeGame === "pong" && pongPad.y > 0) pongPad.y -= (pongPad.speed * 1.4);
    else if (typeof moveLeft === "function") moveLeft(); 
}

function mobilMoveRight() {
    const canvas = document.getElementById("gameCanvas");
    if (typeof paddle !== "undefined" && activeGame === "brick" && paddle.x < canvas.width - paddle.width) paddle.x += (paddle.speed * 1.5);
    else if (typeof playerShip !== "undefined" && activeGame === "space" && playerShip.x < canvas.width - playerShip.width) playerShip.x += (playerShip.speed * 1.5);
    else if (typeof pongPad !== "undefined" && activeGame === "pong" && pongPad.y < canvas.height - pongPad.height) pongPad.y += (pongPad.speed * 1.4);
    else if (typeof moveRight === "function") moveRight();
}

// --- DÖNGÜ BAŞLATMA ---
function mobilDonguBaslat(fonksiyon) {
    if (typeof isGameWaitingToStart !== "undefined" && isGameWaitingToStart) { isGameWaitingToStart = false; return; }
    if (typeof isGameRunning !== "undefined" && !isGameRunning) return;
    
    fonksiyon();
    clearInterval(mobilHareketInterval);
    mobilHareketInterval = setInterval(fonksiyon, MOBIL_HIZ_DONGUSU_MS);
}

function mobilDonguDurdur() { clearInterval(mobilHareketInterval); }

// --- BUTON DİNLEYİCİLERİ ---

if (bLeft) { 
    bLeft.addEventListener("touchstart", (e) => { e.preventDefault(); mobilDonguBaslat(mobilMoveLeft); }); 
    bLeft.addEventListener("touchend", mobilDonguDurdur);
}

if (bRight) { 
    bRight.addEventListener("touchstart", (e) => { e.preventDefault(); mobilDonguBaslat(mobilMoveRight); }); 
    bRight.addEventListener("touchend", mobilDonguDurdur);
}

// YUKARI (Yılan ve Ateş)
if (bUp) { 
    bUp.addEventListener("touchstart", (e) => { 
        e.preventDefault(); 
        if(activeGame === "snake") {
            if(window.dy === 0) { window.dx = 0; window.dy = -window.gridSize; }
        } else if (typeof actionKey === "function") {
            if(activeGame === "space") mobilDonguBaslat(actionKey);
            else actionKey();
        }
    }); 
}

// AŞAĞI
if (bDown) { 
    bDown.addEventListener("touchstart", (e) => { 
        e.preventDefault(); 
        if(activeGame === "snake") {
            if(window.dy === 0) { window.dx = 0; window.dy = window.gridSize; }
        }
    }); 
}

// AKSİYON
if (bAction) { 
    bAction.addEventListener("touchstart", (e) => { 
        e.preventDefault(); 
        if (typeof actionKey === 'function') actionKey();
    }); 
}