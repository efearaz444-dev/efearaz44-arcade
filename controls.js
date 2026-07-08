// ============================================================================
// --- MOBİL BASILI TUTMA VE GELİŞMİŞ HIZLANDIRMA MOTORU (CONTROLS.JS) ---
// ============================================================================
const bUp = document.getElementById("btnUp");
const bDown = document.getElementById("btnDown");
const bLeft = document.getElementById("btnLeft");
const bRight = document.getElementById("btnRight");
const bAction = document.getElementById("btnAction");

let mobilHareketInterval = null;
const MOBIL_HIZ_DONGUSU_MS = 30; // Tank oyunlarında daha akıcı dönsün diye hızı 30ms'ye çektik

// --- MOBİL ÖZEL HAREKET FONKSİYONLARI ---
function mobilMoveLeft() {
    if (activeGame === "brick" && typeof paddle !== "undefined" && paddle.x > 0) paddle.x -= (paddle.speed * 1.5);
    else if (activeGame === "space" && typeof playerShip !== "undefined" && playerShip.x > 0) playerShip.x -= (playerShip.speed * 1.5);
    else if (activeGame === "pong" && typeof pongPad !== "undefined" && pongPad.y > 0) pongPad.y -= (pongPad.speed * 1.4);
    else if (activeGame === "catch" && typeof catcher !== "undefined" && catcher.x > 0) catcher.x -= (catcher.speed * 1.5);
    else if (activeGame === "multitank") {
        // Tank oyununda SOL buton namluyu döndürür (Hem P1 hem P2 için garantiye alıyoruz)
        if (typeof tankP1 !== "undefined") tankP1.angle -= 0.08;
        if (typeof tankP2 !== "undefined") tankP2.angle -= 0.08;
    }
    
    // Sistemdeki orijinal klavye tetikleyicisini çalıştır
    if (typeof moveLeft === "function") moveLeft(); 
}

function mobilMoveRight() {
    const canvasEl = document.getElementById("gameCanvas");
    const maxW = canvasEl ? canvasEl.width : 400;

    if (activeGame === "brick" && typeof paddle !== "undefined" && paddle.x + paddle.width < maxW) paddle.x += (paddle.speed * 1.5);
    else if (activeGame === "space" && typeof playerShip !== "undefined" && playerShip.x + playerShip.width < maxW) playerShip.x += (playerShip.speed * 1.5);
    else if (activeGame === "pong" && typeof pongPad !== "undefined" && pongPad.y + pongPad.height < canvasEl.height) pongPad.y += (pongPad.speed * 1.4);
    else if (activeGame === "catch" && typeof catcher !== "undefined" && catcher.x + catcher.width < maxW) catcher.x += (catcher.speed * 1.5);
    else if (activeGame === "multitank") {
        // Tank oyununda SAĞ buton namluyu döndürür
        if (typeof tankP1 !== "undefined") tankP1.angle += 0.08;
        if (typeof tankP2 !== "undefined") tankP2.angle += 0.08;
    }
    
    // Sistemdeki orijinal klavye tetikleyicisini çalıştır
    if (typeof moveRight === "function") moveRight(); 
}

function mobilMoveUp() {
    if (activeGame === "multitank") {
        // YUKARI butonu tankları ileri sürer (Açılarına göre hareket)
        if (typeof tankP1 !== "undefined") {
            tankP1.x += Math.cos(tankP1.angle) * 3.5;
            tankP1.y += Math.sin(tankP1.angle) * 3.5;
        }
        if (typeof tankP2 !== "undefined") {
            tankP2.x += Math.cos(tankP2.angle) * 3.5;
            tankP2.y += Math.sin(tankP2.angle) * 3.5;
        }
    }
}

function mobilMoveDown() {
    if (activeGame === "multitank") {
        // AŞAĞI butonu tankları geri sürer
        if (typeof tankP1 !== "undefined") {
            tankP1.x -= Math.cos(tankP1.angle) * 2.5;
            tankP1.y -= Math.sin(tankP1.angle) * 2.5;
        }
        if (typeof tankP2 !== "undefined") {
            tankP2.x -= Math.cos(tankP2.angle) * 2.5;
            tankP2.y -= Math.sin(tankP2.angle) * 2.5;
        }
    }
}

// --- DÖNGÜ YÖNETİCİLERİ ---
function mobilDonguBaslat(fonksiyon) {
    if (mobilHareketInterval) clearInterval(mobilHareketInterval);
    fonksiyon(); 
    mobilHareketInterval = setInterval(fonksiyon, MOBIL_HIZ_DONGUSU_MS);
}

function mobilDonguDurdur() {
    if (mobilHareketInterval) {
        clearInterval(mobilHareketInterval);
        mobilHareketInterval = null;
    }
}

// Global ateş ve aksiyon fonksiyonu
function actionKey() {
    if (typeof isGameWaitingToStart !== "undefined" && isGameWaitingToStart) {
        isGameWaitingToStart = false;
        return;
    }
    
    if (activeGame === "multitank") {
        // Tank P1 ve P2'nin mermi dizisine lazerleri pushla
        if (typeof tankP1 !== "undefined" && tankP1.lasers) {
            tankP1.lasers.push({ x: tankP1.x, y: tankP1.y, dx: Math.cos(tankP1.angle)*6, dy: Math.sin(tankP1.angle)*6 });
        }
        if (typeof tankP2 !== "undefined" && tankP2.lasers) {
            tankP2.lasers.push({ x: tankP2.x, y: tankP2.y, dx: Math.cos(tankP2.angle)*6, dy: Math.sin(tankP2.angle)*6 });
        }
        if (typeof playSound === "function") playSound("laser");
    }
    else if (activeGame === "flappy" && typeof flap === "function") flap();
    else if (activeGame === "dino" && typeof dinoJump === "function") dinoJump();
    else if (activeGame === "space" && typeof fireBullet === "function") fireBullet();
}

// ============================================================================
// --- BUTON OLAY DİNLEYİCİLERİ (TOUCH & CLICK ENTEGRASYONU) ---
// ============================================================================

// SOL BUTON
if (bLeft) {
    bLeft.addEventListener("touchstart", (e) => {
        e.preventDefault();
        mobilDonguBaslat(mobilMoveLeft);
    });
    bLeft.addEventListener("touchend", mobilDonguDurdur);
    bLeft.addEventListener("touchcancel", mobilDonguDurdur);
    bLeft.addEventListener("mousedown", (e) => { e.preventDefault(); mobilDonguBaslat(mobilMoveLeft); });
    bLeft.addEventListener("mouseup", mobilDonguDurdur);
    bLeft.addEventListener("mouseleave", mobilDonguDurdur);
}

// SAĞ BUTON
if (bRight) {
    bRight.addEventListener("touchstart", (e) => {
        e.preventDefault();
        mobilDonguBaslat(mobilMoveRight);
    });
    bRight.addEventListener("touchend", mobilDonguDurdur);
    bRight.addEventListener("touchcancel", mobilDonguDurdur);
    bRight.addEventListener("mousedown", (e) => { e.preventDefault(); mobilDonguBaslat(mobilMoveRight); });
    bRight.addEventListener("mouseup", mobilDonguDurdur);
    bRight.addEventListener("mouseleave", mobilDonguDurdur);
}

// YUKARI BUTON
if (bUp) {
    bUp.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (activeGame === "multitank") {
            mobilDonguBaslat(mobilMoveUp);
        } else {
            actionKey();
        }
    });
    bUp.addEventListener("touchend", mobilDonguDurdur);
    bUp.addEventListener("touchcancel", mobilDonguDurdur);
    bUp.addEventListener("mousedown", (e) => {
        e.preventDefault();
        if (activeGame === "multitank") mobilDonguBaslat(mobilMoveUp);
        else actionKey();
    });
    bUp.addEventListener("mouseup", mobilDonguDurdur);
}

// AŞAĞI BUTON
if (bDown) {
    bDown.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (activeGame === "multitank") mobilDonguBaslat(mobilMoveDown);
    });
    bDown.addEventListener("touchend", mobilDonguDurdur);
    bDown.addEventListener("touchcancel", mobilDonguDurdur);
    bDown.addEventListener("mousedown", (e) => {
        e.preventDefault();
        if (activeGame === "multitank") mobilDonguBaslat(mobilMoveDown);
    });
    bDown.addEventListener("mouseup", mobilDonguDurdur);
}

// AKSİYON / ATEŞ BUTONU
if (bAction) {
    bAction.addEventListener("touchstart", (e) => { 
        e.preventDefault(); 
        actionKey(); 
    });
    bAction.addEventListener("mousedown", (e) => { 
        e.preventDefault(); 
        actionKey(); 
    });
}

// Seçilme/Titreme Engelleme
document.querySelectorAll(".arrow-btn, .action-btn, .mobile-start-btn").forEach(btn => {
    btn.style.webkitUserSelect = "none";
    btn.style.userSelect = "none";
    btn.style.webkitTouchCallout = "none";
});