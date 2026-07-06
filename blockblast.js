// ============================================================================
// --- BLOCK BLAST MODÜLÜ (EFEARAZ44 ARCADE ÖZEL) ---
// ============================================================================

const BB_GRID = 8;
let bbCellSize = 40; // Canvas boyutuna göre otomatik dengelenecek
let bbBoard = Array(BB_GRID).fill(null).map(() => Array(BB_GRID).fill(0));
let bbPieces = [null, null, null];
let bbSelectedIdx = null;
let bbOffsetX = 20;  // Tahtanın sol boşluğu
let bbOffsetY = 20;  // Tahtanın üst boşluğu

// Popüler Block Blast Şekilleri (Matris formu ve neon renkleri)
const BB_SHAPES = [
    { matrix: [[1]], color: "#ff1744" }, // 1x1 Tekli Kare
    { matrix: [[1, 1], [1, 1]], color: "#00b0ff" }, // 2x2 Kare
    { matrix: [[1, 1, 1]], color: "#00e676" }, // 3'lü Yatay Çizgi
    { matrix: [[1], [1], [1]], color: "#ffd600" }, // 3'lü Dikey Çizgi
    { matrix: [[1, 0], [1, 1]], color: "#e040fb" }, // L Blok Küçük
    { matrix: [[1, 1, 1], [0, 1, 0]], color: "#00e5ff" }, // T Blok
    { matrix: [[1, 1, 1, 1]], color: "#ff5722" } // 4'lü Yatay Çizgi
];

// 1. Oyunu Başlatma Fonksiyonu
function startBlockBlastGame() {
    bbBoard = Array(BB_GRID).fill(null).map(() => Array(BB_GRID).fill(0));
    bbPieces = [null, null, null];
    bbSelectedIdx = null;
    
    // Canvas boyutuna göre hücre boyutunu ayarla
    bbCellSize = Math.floor((canvas.width - 40) / BB_GRID);
    
    generateBBPieces();
    drawBlockBlast();
    
    // Tıklama olayını canvas'a bağla
    canvas.onclick = handleBBGridClick;
}

// 2. Rastgele 3 Yeni Parça Üretme
function generateBBPieces() {
    for (let i = 0; i < 3; i++) {
        const randomShape = BB_SHAPES[Math.floor(Math.random() * BB_SHAPES.length)];
        bbPieces[i] = JSON.parse(JSON.stringify(randomShape)); // Derin kopyalama
    }
}

// 3. Ekranı Çizme Motoru (Ana oyun döngüsünden veya manuel çağrılır)
function drawBlockBlast() {
    if (activeGame !== "blockblast") return;
    clearCanvas();
    drawWatermark();

    // --- 8x8 OYUN TAHTASINI ÇİZ ---
    for (let r = 0; r < BB_GRID; r++) {
        for (let c = 0; c < BB_GRID; c++) {
            let x = bbOffsetX + c * bbCellSize;
            let y = bbOffsetY + r * bbCellSize;

            if (bbBoard[r][c]) {
                ctx.fillStyle = bbBoard[r][c]; // Dolu hücrenin kendi rengi
                ctx.shadowBlur = 8;
                ctx.shadowColor = bbBoard[r][c];
            } else {
                ctx.fillStyle = "#1c1f30"; // Boş hücre arka planı
                ctx.shadowBlur = 0;
            }
            
            ctx.strokeStyle = "#25293e";
            ctx.lineWidth = 2;
            
            ctx.fillRect(x + 2, y + 2, bbCellSize - 4, bbCellSize - 4);
            ctx.strokeRect(x + 2, y + 2, bbCellSize - 4, bbCellSize - 4);
        }
    }
    ctx.shadowBlur = 0; // Gölgeleri sıfırla

    // --- ALTAKİ 3 ADET PARÇAYI ÇİZ ---
    let holderWidth = canvas.width / 3;
    let holderY = bbOffsetY + (BB_GRID * bbCellSize) + 30;

    bbPieces.forEach((piece, index) => {
        if (!piece) return;

        let startX = index * holderWidth + (holderWidth / 2);
        
        // Eğer parça seçiliyse etrafına neon bir çember veya efekt çiz
        if (bbSelectedIdx === index) {
            ctx.fillStyle = "rgba(0, 176, 255, 0.15)";
            ctx.beginPath();
            ctx.arc(startX, holderY + 30, 45, 0, Math.PI * 2);
            ctx.fill();
        }

        // Parçanın matrisini mini boyutta çiz
        let miniSize = 15;
        let pMatrix = piece.matrix;
        let pRows = pMatrix.length;
        let pCols = pMatrix[0].length;

        // Merkezleme hesapları
        let totalW = pCols * miniSize;
        let totalH = pRows * miniSize;
        let pX = startX - (totalW / 2);
        let pY = holderY + 30 - (totalH / 2);

        for (let r = 0; r < pRows; r++) {
            for (let c = 0; c < pCols; c++) {
                if (pMatrix[r][c] === 1) {
                    ctx.fillStyle = piece.color;
                    ctx.fillRect(pX + c * miniSize, pY + r * miniSize, miniSize - 1, miniSize - 1);
                }
            }
        }
    });

    // Bilgilendirme Yazısı
    ctx.fillStyle = "#ffffff";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Alttaki parçaya tıkla, sonra tahtada koyacağın yere tıkla!", canvas.width / 2, canvas.height - 15);
}

// 4. Tıklama ve Yerleştirme Kontrolleri
function handleBBGridClick(e) {
    if (activeGame !== "blockblast" || !isGameRunning) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let holderWidth = canvas.width / 3;
    let holderY = bbOffsetY + (BB_GRID * bbCellSize) + 10;

    // A. Alt Kısımdaki Parçalardan Birine mi Tıklandı?
    if (mouseY >= holderY && mouseY <= holderY + 80) {
        let clickedIdx = Math.floor(mouseX / holderWidth);
        if (clickedIdx >= 0 && clickedIdx < 3 && bbPieces[clickedIdx] !== null) {
            bbSelectedIdx = clickedIdx;
            if (typeof playSound === "function") playSound("select"); // Varsa seçim sesi
            drawBlockBlast();
        }
        return;
    }

    // B. Tahtaya mı Tıklandı ve Parça Seçili mi?
    if (bbSelectedIdx !== null) {
        const c = Math.floor((mouseX - bbOffsetX) / bbCellSize);
        const r = Math.floor((mouseY - bbOffsetY) / bbCellSize);

        // Geçerli bir hücre sınırındaysa
        if (r >= 0 && r < BB_GRID && c >= 0 && c < BB_GRID) {
            const piece = bbPieces[bbSelectedIdx];

            if (canPlaceBB(piece.matrix, r, c)) {
                placeBB(piece.matrix, piece.color, r, c);
                
                bbPieces[bbSelectedIdx] = null;
                bbSelectedIdx = null;

                checkBBPointsAndLines();

                // 3 parça da bittiyse yenilerini çek
                if (bbPieces.every(p => p === null)) {
                    generateBBPieces();
                }

                drawBlockBlast();
                
                // Kaybedip kaybetmediğini kontrol et
                if (checkBBGameOver()) {
                    gameOver();
                }
            } else {
                if (typeof playSound === "function") playSound("hit"); // Hatalı yerleşim sesi
            }
        }
    }
}

// 5. Parça Buraya Sığıyor mu / Konabilir mi?
function canPlaceBB(matrix, startRow, startCol) {
    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c] === 1) {
                let targetR = startRow + r;
                let targetC = startCol + c;
                // Sınır dışı mı ya da orası zaten dolu mu?
                if (targetR >= BB_GRID || targetC >= BB_GRID || bbBoard[targetR][targetC] !== 0) {
                    return false;
                }
            }
        }
    }
    return true;
}

// 6. Parçayı Tahtaya Yaz
function placeBB(matrix, color, startRow, startCol) {
    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c] === 1) {
                bbBoard[startRow + r][startCol + c] = color;
                score += 10; // Her yerleştirilen blok için 10 puan
            }
        }
    }
    if (scoreElement) scoreElement.innerText = score;
}

// 7. Dolan Satır ve Sütunları Patlatma
function checkBBPointsAndLines() {
    let rowsToClear = [];
    let colsToClear = [];

    // Satırları tara
    for (let r = 0; r < BB_GRID; r++) {
        if (bbBoard[r].every(val => val !== 0)) {
            rowsToClear.push(r);
        }
    }

    // Sütunları tara
    for (let c = 0; c < BB_GRID; c++) {
        let colFilled = true;
        for (let r = 0; r < BB_GRID; r++) {
            if (bbBoard[r][c] === 0) colFilled = false;
        }
        if (colFilled) colsToClear.push(c);
    }

    // Temizleme ve puan/altın ekleme
    let combo = rowsToClear.length + colsToClear.length;
    if (combo > 0) {
        rowsToClear.forEach(r => {
            bbBoard[r] = Array(BB_GRID).fill(0);
        });

        colsToClear.forEach(c => {
            for (let r = 0; r < BB_GRID; r++) {
                bbBoard[r][c] = 0;
            }
        });

        score += combo * 100; // Combo başına 100 ekstra puan
        if (scoreElement) scoreElement.innerText = score;
        if (typeof playSound === "function") playSound("coin");
        if (typeof addGold === "function") addGold(combo * 5); // Market için altın ekleme sistemi varsa
    }
}

// 8. Oyun Bitti mi Kontrolü (Eldeki parçalardan hiçbiri tahtaya sığmıyorsa game over)
function checkBBGameOver() {
    let hasValidMove = false;

    for (let i = 0; i < 3; i++) {
        const piece = bbPieces[i];
        if (!piece) continue; // Zaten yerleştirilmiş parça, geç

        // Tahtadaki tüm hücreleri tek tek dene
        for (let r = 0; r < BB_GRID; r++) {
            for (let c = 0; c < BB_GRID; c++) {
                if (canPlaceBB(piece.matrix, r, c)) {
                    hasValidMove = true;
                    break;
                }
            }
            if (hasValidMove) break;
        }
        if (hasValidMove) break;
    }

    // Eğer eldeki hiçbir parça hiçbir yere sığmıyorsa true döner (Oyun biter)
    return !hasValidMove;
}