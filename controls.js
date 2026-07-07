// ============================================================================
// --- MOBİL BASILI TUTMA VE GELİŞMİŞ HIZLANDIRMA MOTORU (CONTROLS.JS) ---
// ============================================================================
window.dx = 0;
window.dy = 0;
window.gridSize = 20;

const bUp = document.getElementById("btnUp");
const bDown = document.getElementById("btnDown");
const bLeft = document.getElementById("btnLeft");
const bRight = document.getElementById("btnRight");
const bAction = document.getElementById("btnAction");

let mobilHareketInterval = null;
const MOBIL_HIZ_DONGUSU_MS = 25; // 45ms'den 25ms'ye düşürülerek daha akıcı basılı tutma sağlandı

function mobilMoveLeft() {
    if (!window.isGameRunning) return;
    const g = window.activeGame;
    
    // main.js'deki global değişken adlarıyla tam senkronizasyon sağlandı
    if (g === "brick" || g === "pong") { if(window.paddle && window.paddle.x > 0) window.paddle.x -= 8; }
    else if (g === "space") { if(window.playerX !== undefined && window.playerX > 10) window.playerX -= 7; }
    else if (g === "catch") { if(window.catcherX !== undefined && window.catcherX > 0) window.catcherX -= 8; }
}

function mobilMoveRight() {
    if (!window.isGameRunning) return;
    const g = window.activeGame;
    
    if (g === "brick" || g === "pong") { if(window.paddle && window.paddle.x < 320) window.paddle.x += 8; }
    else if (g === "space") { if(window.playerX !== undefined && window.playerX < 350) window.playerX += 7; }
    else if (g === "catch") { if(window.catcherX !== undefined && window.catcherX < 340) window.catcherX += 8; }
}

function mobilDonguBaslat(fonksiyon) {
    if (window.isGameWaitingToStart) window.isGameWaitingToStart = false;
    if (!window.isGameRunning) return;
    
    fonksiyon();
    clearInterval(mobilHareketInterval);
    mobilHareketInterval = setInterval(fonksiyon, MOBIL_HIZ_DONGUSU_MS);
}

function mobilDonguDurdur() { 
    clearInterval(mobilHareketInterval); 
}

// MOUSE & TOUCH EVENT BINDINGS (Hem mobil hem masaüstü testleri için entegre)
if (bLeft) { 
    bLeft.addEventListener("touchstart", (e) => { e.preventDefault(); mobilDonguBaslat(mobilMoveLeft); }); 
    bLeft.addEventListener("touchend", (e) => { e.preventDefault(); mobilDonguDurdur(); });
    bLeft.addEventListener("mousedown", () => mobilDonguBaslat(mobilMoveLeft));
    bLeft.addEventListener("mouseup", mobilDonguDurdur);
    bLeft.addEventListener("mouseleave", mobilDonguDurdur);
}

if (bRight) { 
    bRight.addEventListener("touchstart", (e) => { e.preventDefault(); mobilDonguBaslat(mobilMoveRight); }); 
    bRight.addEventListener("touchend", (e) => { e.preventDefault(); mobilDonguDurdur(); });
    bRight.addEventListener("mousedown", () => mobilDonguBaslat(mobilMoveRight));
    bRight.addEventListener("mouseup", mobilDonguDurdur);
    bRight.addEventListener("mouseleave", mobilDonguDurdur);
}

if (bUp) { 
    bUp.addEventListener("touchstart", (e) => { 
        e.preventDefault(); 
        if(window.activeGame === "snake" && window.snakeDir) {
            if(window.snakeDir.y !== 1) window.snakeDir = {x:0, y:-1};
        } else if (typeof window.fireOrJump === "function") {
            window.fireOrJump();
        }
    });
    bUp.addEventListener("mousedown", () => {
        if(window.activeGame === "snake" && window.snakeDir) {
            if(window.snakeDir.y !== 1) window.snakeDir = {x:0, y:-1};
        } else if (typeof window.fireOrJump === "function") {
            window.fireOrJump();
        }
    });
}

if (bDown) { 
    bDown.addEventListener("touchstart", (e) => { 
        e.preventDefault(); 
        if(window.activeGame === "snake" && window.snakeDir) {
            if(window.snakeDir.y !== -1) window.snakeDir = {x:0, y:1};
        }
    });
    bDown.addEventListener("mousedown", () => {
        if(window.activeGame === "snake" && window.snakeDir) {
            if(window.snakeDir.y !== -1) window.snakeDir = {x:0, y:1};
        }
    });
}

if (bAction) { 
    const triggerAction = (e) => {
        if(e) e.preventDefault();
        if (typeof window.fireOrJump === 'function') window.fireOrJump();
    };
    bAction.addEventListener("touchstart", triggerAction); 
    bAction.addEventListener("mousedown", triggerAction);
}