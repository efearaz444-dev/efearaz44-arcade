// ============================================================================
// --- BLOCK BLAST MODÜLÜ (EFEARAZ44 ARCADE ÖZEL) ---
// ============================================================================

const BB_GRID = 8;
let bbCellSize = 40; 
let bbBoard = Array(BB_GRID).fill(null).map(() => Array(BB_GRID).fill(0));
let bbPieces = [null, null, null];
let bbSelectedIdx = null;
let bbOffsetX = 20;  
let bbOffsetY = 20;  

const BB_SHAPES = [
    { matrix: [[1]], color: "#ff1744" }, 
    { matrix: [[1, 1], [1, 1]], color: "#00b0ff" }, 
    { matrix: [[1, 1, 1]], color: "#00e676" }, 
    { matrix: [[1], [1], [1]], color: "#ffd600" }, 
    { matrix: [[1, 0], [1, 1]], color: "#e040fb" }, 
    { matrix: [[1, 1, 1], [0, 1, 0]], color: "#00e5ff" }, 
    { matrix: [[1, 1, 1, 1]], color: "#ff5722" } 
];

function startBlockBlastGame() {
    bbBoard = Array(BB_GRID).fill(null).map(() => Array(BB_GRID).fill(0));
    bbPieces = [null, null, null];
    bbSelectedIdx = null;
    
    isGameWaitingToStart = false; 
    isGameRunning = true;
    
    bbCellSize = Math.floor((canvas.width - 40) / BB_GRID);
    
    generateBBPieces();
    drawBlockBlast();
    
    canvas.onclick = handleBBGridClick;
}

function generateBBPieces() {
    for (let i = 0; i < 3; i++) {
        const randomShape = BB_SHAPES[Math.floor(Math.random() * BB_SHAPES.length)];
        bbPieces[i] = JSON.parse(JSON.stringify(randomShape)); 
    }
}

function drawBlockBlast() {
    if (activeGame !== "blockblast") return;
    
    ctx.fillStyle = "#0d0e15"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (typeof drawWatermark === "function") drawWatermark();

    // --- 8x8 OYUN TAHTASINI ÇİZ ---
    for (let r = 0; r < BB_GRID; r++) {
        for (let c = 0; c < BB_GRID; c++) {
            let x = bbOffsetX + c * bbCellSize;
            let y = bbOffsetY + r * bbCellSize;

            if (bbBoard[r][c]) {
                ctx.fillStyle = bbBoard[r][c];
                ctx.shadowBlur = 8;
                ctx.shadowColor = bbBoard[r][c];
            } else {
                ctx.fillStyle = "#1c1f30";
                ctx.shadowBlur = 0;
            }
            
            ctx.strokeStyle = "#25293e";
            ctx.lineWidth = 2;
            
            ctx.fillRect(x + 2, y + 2, bbCellSize - 4, bbCellSize - 4);
            ctx.strokeRect(x + 2, y + 2, bbCellSize - 4, bbCellSize - 4);
        }
    }
    ctx.shadowBlur = 0;

    // --- ALTAKİ 3 ADET PARÇAYI ÇİZ ---
    let holderWidth = canvas.width / 3;
    let holderY = bbOffsetY + (BB_GRID * bbCellSize) + 15; 

    for (let i = 0; i < 3; i++) {
        let piece = bbPieces[i];
        if (!piece) continue;

        let startX = i * holderWidth + (holderWidth / 2);
        
        if (bbSelectedIdx === i) {
            ctx.fillStyle = "rgba(0, 176, 255, 0.3)";
            ctx.beginPath();
            ctx.arc(startX, holderY + 25, 35, 0, Math.PI * 2);
            ctx.fill();
        }

        let miniSize = 12; 
        let pMatrix = piece.matrix;
        let pRows = pMatrix.length;
        let pCols = pMatrix[0].length;

        let totalW = pCols * miniSize;
        let totalH = pRows * miniSize;
        let pX = startX - (totalW / 2);
        let pY = holderY + 25 - (totalH / 2);

        for (let r = 0; r < pRows; r++) {
            for (let c = 0; c < pCols; c++) {
                if (pMatrix[r][c] === 1) {
                    ctx.fillStyle = piece.color;
                    ctx.fillRect(pX + c * miniSize, pY + r * miniSize, miniSize - 1, miniSize - 1);
                }
            }
        }
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Parçaya tıkla, sonra tahtada koyacağın yere tıkla!", canvas.width / 2, canvas.height - 10);
}

function handleBBGridClick(e) {
    if (activeGame !== "blockblast" || !isGameRunning) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let holderWidth = canvas.width / 3;
    let holderY = bbOffsetY + (BB_GRID * bbCellSize) + 10;

    if (mouseY >= holderY && mouseY <= holderY + 80) {
        let clickedIdx = Math.floor(mouseX / holderWidth);
        if (clickedIdx >= 0 && clickedIdx < 3 && bbPieces[clickedIdx] !== null) {
            bbSelectedIdx = clickedIdx;
            if (typeof playSound === "function") playSound("select"); 
            drawBlockBlast();
        }
        return;
    }

    if (bbSelectedIdx !== null) {
        const c = Math.floor((mouseX - bbOffsetX) / bbCellSize);
        const r = Math.floor((mouseY - bbOffsetY) / bbCellSize);

        if (r >= 0 && r < BB_GRID && c >= 0 && c < BB_GRID) {
            const piece = bbPieces[bbSelectedIdx];

            if (canPlaceBB(piece.matrix, r, c)) {
                placeBB(piece.matrix, piece.color, r, c);
                
                bbPieces[bbSelectedIdx] = null;
                bbSelectedIdx = null;

                checkBBPointsAndLines();

                if (bbPieces.every(p => p === null)) {
                    generateBBPieces();
                }

                drawBlockBlast();
                
                if (checkBBGameOver()) {
                    gameOver();
                }
            } else {
                if (typeof playSound === "function") playSound("hit"); 
            }
        }
    }
}

function canPlaceBB(matrix, startRow, startCol) {
    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c] === 1) {
                let targetR = startRow + r;
                let targetC = startCol + c;
                if (targetR >= BB_GRID || targetC >= BB_GRID || bbBoard[targetR][targetC] !== 0) {
                    return false;
                }
            }
        }
    }
    return true;
}

function placeBB(matrix, color, startRow, startCol) {
    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c] === 1) {
                bbBoard[startRow + r][startCol + c] = color;
                score += 10; 
            }
        }
    }
    if (scoreElement) scoreElement.innerText = score;
}

function checkBBPointsAndLines() {
    let rowsToClear = [];
    let colsToClear = [];

    for (let r = 0; r < BB_GRID; r++) {
        if (bbBoard[r].every(val => val !== 0)) {
            rowsToClear.push(r);
        }
    }

    for (let c = 0; c < BB_GRID; c++) {
        let colFilled = true;
        for (let r = 0; r < BB_GRID; r++) {
            if (bbBoard[r][c] === 0) colFilled = false;
        }
        if (colFilled) colsToClear.push(c);
    }

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

        score += combo * 100; 
        if (scoreElement) scoreElement.innerText = score;
        if (typeof playSound === "function") playSound("coin");
        if (typeof addGold === "function") addGold(combo * 5); 
    }
}

function checkBBGameOver() {
    let hasValidMove = false;

    for (let i = 0; i < 3; i++) {
        const piece = bbPieces[i];
        if (!piece) continue; 

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

    return !hasValidMove;
}