// ============================================================================
// --- MOBİL BASILI TUTMA VE GELİŞMİŞ HIZLANDIRMA MOTORU (CONTROLS.JS) ---
// ============================================================================
const bUp = document.getElementById("btnUp");
const bDown = document.getElementById("btnDown");
const bLeft = document.getElementById("btnLeft");
const bRight = document.getElementById("btnRight");
const bAction = document.getElementById("btnAction");

let mobilHareketInterval = null;
const MOBIL_HIZ_DONGUSU_MS = 45; // Basılı tuttuğunda ne kadar hızlı tekrarlayacağı (Düşük sayı = Daha hızlı)

// --- MOBİL ÖZEL HAREKET FONKSİYONLARI ---
function mobilMoveLeft() {
    if (activeGame === "brick" && typeof paddle !== "undefined" && paddle.x > 0) paddle.x -= (paddle.speed * 1.5);
    else if (activeGame === "space" && typeof playerShip !== "undefined" && playerShip.x > 0) playerShip.x -= (playerShip.speed * 1.5);
    else if (activeGame === "pong" && typeof pongPad !== "undefined" && pongPad.y > 0) pongPad.y -= (pongPad.speed * 1.4);
    else if (activeGame === "catch" && typeof catcher !== "undefined" && catcher.x > 0) catcher.x -= (catcher.speed * 1.5);
    else if (activeGame === "multitank") {
        // İki tankın da yönünü/açısını sola döndürür
        if (typeof tankP1 !== "undefined") tankP1.angle -= 0.05;
        if (typeof tankP2 !== "undefined") tankP2.angle -= 0.05;
    }
    else if (typeof moveLeft === "function") moveLeft(); // Diğer oyunlar için fallback
}

function mobilMoveRight() {
    const canvasEl = document.getElementById("gameCanvas");
    const maxW = canvasEl ? canvasEl.width : 400;

    if (activeGame === "brick" && typeof paddle !== "undefined" && paddle.x + paddle.width < maxW) paddle.x += (paddle.speed * 1.5);
    else if (activeGame === "space" && typeof playerShip !== "undefined" && playerShip.x + playerShip.width < maxW) playerShip.x += (playerShip.speed * 1.5);
    else if (activeGame === "pong" && typeof pongPad !== "undefined" && pongPad.y + pongPad.height < canvasEl.height) pongPad.y += (pongPad.speed * 1.4);
    else if (activeGame === "catch" && typeof catcher !== "undefined" && catcher.x + catcher.width < maxW) catcher.x += (catcher.speed * 1.5);
    else if (activeGame === "multitank") {
        // İki tankın da yönünü/açısını sağa döndürür
        if (typeof tankP1 !== "undefined") tankP1.angle += 0.05;
        if (typeof tankP2 !== "undefined") tankP2.angle += 0.05;
    }
    else if (typeof moveRight === "function") moveRight(); // Diğer oyunlar için fallback
}

function mobilMoveUp() {
    if (activeGame === "multitank") {
        // İki tankı da ileri sürer (Açılarına göre x ve y ekseninde ilerleme)
        if (typeof tankP1 !== "undefined") {
            tankP1.x += Math.cos(tankP1.angle) * 3;
            tankP1.y += Math.sin(tankP1.angle) * 3;
        }
        if (typeof tankP2 !== "undefined") {
            tankP2.x += Math.cos(tankP2.angle) * 3;
            tankP2.y += Math.sin(tankP2.angle) * 3;
        }
    }
}

function mobilMoveDown() {
    if (activeGame === "multitank") {
        // İki tankı da geri sürer
        if (typeof tankP1 !== "undefined") {
            tankP1.x -= Math.cos(tankP1.angle) * 3;
            tankP1.y -= Math.sin(tankP1.angle) * 3;
        }
        if (typeof tankP2 !== "undefined") {
            tankP2.x -= Math.cos(tankP2.angle) * 3;
            tankP2.y -= Math.sin(tankP2.angle) * 3;
        }
    }
}

// --- DÖNGÜ YÖNETİCİLERİ ---
function mobilDonguBaslat(fonksiyon) {
    if (mobilHareketInterval) clearInterval(mobilHareketInterval);
    fonksiyon(); // İlk basışta hemen tetikle (gecikme hissi olmasın)
    mobilHareketInterval = setInterval(fonksiyon, MOBIL_HIZ_DONGUSU_MS);
}

function mobilDonguDurdur() {
    if (mobilHareketInterval) {
        clearInterval(mobilHareketInterval);
        mobilHareketInterval = null;
    }
}

// Global olarak tetiklenecek ortak zıplama/ateş fonksiyonu
function actionKey() {
    if (typeof isGameWaitingToStart !== "undefined" && isGameWaitingToStart) {
        isGameWaitingToStart = false;
        return;
    }
    
    // MULTITANK ÖZEL: İki tank birden aynı anda ateş eder
    if (activeGame === "multitank") {
        if (typeof tankP1 !== "undefined" && tankP1.lasers) {
            tankP1.lasers.push({ x: tankP1.x, y: tankP1.y, dx: Math.cos(tankP1.angle)*6, dy: Math.sin(tankP1.angle)*6 });
        }
        if (typeof tankP2 !== "undefined" && tankP2.lasers) {
            tankP2.lasers.push({ x: tankP2.x, y: tankP2.y, dx: Math.cos(tankP2.angle)*6, dy: Math.sin(tankP2.angle)*6 });
        }
        if (typeof playSound === "function") playSound("laser");
    }
    // Hangi oyundaysak onun ana aksiyonunu tetikle
    else if (activeGame === "flappy" && typeof flap === "function") flap();
    else if (activeGame === "dino" && typeof dinoJump === "function") dinoJump();
    else if (activeGame === "space" && typeof fireBullet === "function") fireBullet();
}

// ============================================================================
// --- BUTON OLAY DİNLEYİCİLERİ (TOUCH & CLICK ENTEGRASYONU) ---
// ============================================================================

// A. SOL BUTON
if (bLeft) {
    bLeft.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (typeof isGameWaitingToStart !== "undefined" && isGameWaitingToStart) { isGameWaitingToStart = false; return; }
        
        if (activeGame === "snake") {
            if (typeof dx !== "undefined" && dx === 0) { dx = -gridSize; dy = 0; }
        } else {
            mobilDonguBaslat(mobilMoveLeft);
        }
    });
    bLeft.addEventListener("touchend", mobilDonguDurdur);
    bLeft.addEventListener("touchcancel", mobilDonguDurdur);
    bLeft.addEventListener("click", () => {
        if (activeGame === "snake" && typeof dx !== "undefined" && dx === 0) { dx = -gridSize; dy = 0; }
    });
}

// B. SAĞ BUTON
if (bRight) {
    bRight.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (typeof isGameWaitingToStart !== "undefined" && isGameWaitingToStart) { isGameWaitingToStart = false; return; }
        
        if (activeGame === "snake") {
            if (typeof dx !== "undefined" && dx === 0) { dx = gridSize; dy = 0; }
        } else {
            mobilDonguBaslat(mobilMoveRight);
        }
    });
    bRight.addEventListener("touchend", mobilDonguDurdur);
    bRight.addEventListener("touchcancel", mobilDonguDurdur);
    bRight.addEventListener("click", () => {
        if (activeGame === "snake" && typeof dx !== "undefined" && dx === 0) { dx = gridSize; dy = 0; }
    });
}

// C. YUKARI BUTON
if (bUp) {
    bUp.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (typeof isGameWaitingToStart !== "undefined" && isGameWaitingToStart) { isGameWaitingToStart = false; return; }
        
        if (activeGame === "snake") {
            if (typeof dy !== "undefined" && dy === 0) { dx = 0; dy = -gridSize; }
        } else if (activeGame === "multitank") {
            mobilDonguBaslat(mobilMoveUp);
        } else {
            if (activeGame === "space") mobilDonguBaslat(actionKey);
            else actionKey();
        }
    });
    bUp.addEventListener("touchend", mobilDonguDurdur);
    bUp.addEventListener("touchcancel", mobilDonguDurdur);
    bUp.addEventListener("click", () => {
        if (activeGame === "snake" && typeof dy !== "undefined" && dy === 0) { dx = 0; dy = -gridSize; }
    });
}

// D. AŞAĞI BUTON
if (bDown) {
    bDown.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (typeof isGameWaitingToStart !== "undefined" && isGameWaitingToStart) { isGameWaitingToStart = false; return; }
        
        if (activeGame === "snake") {
            if (typeof dy !== "undefined" && dy === 0) { dx = 0; dy = gridSize; }
        } else if (activeGame === "multitank") {
            mobilDonguBaslat(mobilMoveDown);
        }
    });
    bDown.addEventListener("touchend", mobilDonguDurdur);
    bDown.addEventListener("touchcancel", mobilDonguDurdur);
    bDown.addEventListener("click", () => {
        if (activeGame === "snake" && typeof dy !== "undefined" && dy === 0) { dx = 0; dy = gridSize; }
    });
}

// E. AKSİYON / ATEŞ / ZIPLAMA BUTONU
if (bAction) {
    bAction.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (activeGame === "space" || activeGame === "multitank") {
            mobilDonguBaslat(actionKey);
        } else {
            actionKey();
        }
    });
    bAction.addEventListener("touchend", mobilDonguDurdur);
    bAction.addEventListener("touchcancel", mobilDonguDurdur);
    bAction.addEventListener("click", () => {
        if (activeGame !== "space" && activeGame !== "multitank") actionKey();
    });
}

// Mobil cihazlarda butonlara basıldığında ekranın titremesini/seçilmesini önlemek için CSS temizliği
document.querySelectorAll(".arrow-btn, .action-btn, .mobile-start-btn").forEach(btn => {
    btn.style.webkitUserSelect = "none";
    btn.style.userSelect = "none";
    btn.style.webkitTouchCallout = "none";
});