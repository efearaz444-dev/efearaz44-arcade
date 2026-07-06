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
// main.js içindeki moveLeft ve moveRight fonksiyonlarını ezmeden mobil hızı katlıyoruz
function mobilMoveLeft() {
    if (activeGame === "brick" && paddle.x > 0) paddle.x -= (paddle.speed * 1.5);
    else if (activeGame === "space" && playerShip.x > 0) playerShip.x -= (playerShip.speed * 1.5);
    else if (activeGame === "pong" && pongPad.y > 0) pongPad.y -= (pongPad.speed * 1.4);
    else if (activeGame === "catch" && catcher.x > 0) catcher.x -= (catcher.speed * 1.5);
    else if (typeof moveLeft === "function") moveLeft(); // Diğer oyunlar için fallback
}

function mobilMoveRight() {
    if (activeGame === "brick" && paddle.x < canvas.width - paddle.width) paddle.x += (paddle.speed * 1.5);
    else if (activeGame === "space" && playerShip.x < canvas.width - playerShip.width) playerShip.x += (playerShip.speed * 1.5);
    else if (activeGame === "pong" && pongPad.y < canvas.height - pongPad.height) paddle.y += (pongPad.speed * 1.4);
    else if (activeGame === "catch" && catcher.x < canvas.width - catcher.w) catcher.x += (catcher.speed * 1.5);
    else if (typeof moveRight === "function") moveRight(); // Diğer oyunlar için fallback
}

// --- DÖNGÜ BAŞLATMA VE DURDURMA ---
function mobilDonguBaslat(fonksiyon) {
    if (isGameWaitingToStart) { isGameWaitingToStart = false; return; }
    if (!isGameRunning) return;
    
    // Önce basar basmaz tek bir kere tetikle (Gecikme hissini yok eder)
    fonksiyon();
    
    // Sonra basılı tutulduğu sürece döngüye sok
    clearInterval(mobilHareketInterval);
    mobilHareketInterval = setInterval(fonksiyon, MOBIL_HIZ_DONGUSU_MS);
}

function mobilDonguDurdur() {
    clearInterval(mobilHareketInterval);
}

// --- BUTON DİNLEYİCİLERİ ---

// A. SOL BUTON
if (bLeft) { 
    bLeft.addEventListener("touchstart", (e) => { e.preventDefault(); mobilDonguBaslat(mobilMoveLeft); }); 
    bLeft.addEventListener("touchend", mobilDonguDurdur);
    bLeft.addEventListener("touchcancel", mobilDonguDurdur);
    bLeft.addEventListener("click", () => { if(isGameWaitingToStart){ isGameWaitingToStart = false; return; } mobilMoveLeft(); }); 
}

// B. SAĞ BUTON
if (bRight) { 
    bRight.addEventListener("touchstart", (e) => { e.preventDefault(); mobilDonguBaslat(mobilMoveRight); }); 
    bRight.addEventListener("touchend", mobilDonguDurdur);
    bRight.addEventListener("touchcancel", mobilDonguDurdur);
    bRight.addEventListener("click", () => { if(isGameWaitingToStart){ isGameWaitingToStart = false; return; } mobilMoveRight(); }); 
}

// C. YUKARI BUTON (Yılan için yön, Flappy/Dino için zıplama)
if (bUp) { 
    bUp.addEventListener("touchstart", (e) => { 
        e.preventDefault(); 
        if(isGameWaitingToStart){ isGameWaitingToStart = false; return; } 
        if(activeGame === "snake") {
            if(dy === 0) { dx = 0; dy = -gridSize; }
        } else {
            // Uzay savaşında basılı tutunca seri ateş etsin diye döngüye bağlıyoruz
            if(activeGame === "space") mobilDonguBaslat(actionKey);
            else actionKey();
        }
    }); 
    bUp.addEventListener("touchend", mobilDonguDurdur);
    bUp.addEventListener("click", () => { 
        if(isGameWaitingToStart){ isGameWaitingToStart = false; return; } 
        if(activeGame === "snake" && dy === 0){ dx = 0; dy = -gridSize; } else actionKey(); 
    }); 
}

// D. AŞAĞI BUTON (Sadece Yılan oyunu için yön)
if (bDown) { 
    bDown.addEventListener("touchstart", (e) => { 
        e.preventDefault(); 
        if(isGameWaitingToStart){ isGameWaitingToStart = false; return; } 
        if(activeGame === "snake" && dy === 0){ dx = 0; dy = gridSize; } 
    }); 
    bDown.addEventListener("click", () => { 
        if(isGameWaitingToStart){ isGameWaitingToStart = false; return; } 
        if(activeGame === "snake" && dy === 0){ dx = 0; dy = gridSize; } 
    }); 
}

// E. AKSİYON / ATEŞ / ZIPLAMA BUTONU
if (bAction) { 
    bAction.addEventListener("touchstart", (e) => { 
        e.preventDefault(); 
        if(activeGame === "space") {
            mobilDonguBaslat(actionKey); // Uzayda basılı tutunca aralıksız tarasın
        } else {
            actionKey();
        }
    }); 
    bAction.addEventListener("touchend", mobilDonguDurdur);
    bAction.addEventListener("click", actionKey); 
}