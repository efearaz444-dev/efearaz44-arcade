// ============================================================================
// --- MOBİL VE DOKUNMATİK TOUCHSTART TETİKLENMESİ ---
// ============================================================================
const bUp = document.getElementById("btnUp");
const bDown = document.getElementById("btnDown");
const bLeft = document.getElementById("btnLeft");
const bRight = document.getElementById("btnRight");
const bAction = document.getElementById("btnAction");

if (bUp) { 
    bUp.addEventListener("touchstart", (e) => { e.preventDefault(); if(isGameWaitingToStart){ isGameWaitingToStart = false; return; } if(activeGame==="snake" && dy===0){ dx=0; dy=-gridSize; } else actionKey(); }); 
    bUp.addEventListener("click", () => { if(isGameWaitingToStart){ isGameWaitingToStart = false; return; } if(activeGame==="snake" && dy===0){ dx=0; dy=-gridSize; } else actionKey(); }); 
}
if (bDown) { 
    bDown.addEventListener("touchstart", (e) => { e.preventDefault(); if(isGameWaitingToStart){ isGameWaitingToStart = false; return; } if(activeGame==="snake" && dy===0){ dx=0; dy=gridSize; } }); 
    bDown.addEventListener("click", () => { if(isGameWaitingToStart){ isGameWaitingToStart = false; return; } if(activeGame==="snake" && dy===0){ dx=0; dy=gridSize; } }); 
}
if (bLeft) { 
    bLeft.addEventListener("touchstart", (e) => { e.preventDefault(); if(isGameWaitingToStart){ isGameWaitingToStart = false; return; } moveLeft(); }); 
    bLeft.addEventListener("click", () => { if(isGameWaitingToStart){ isGameWaitingToStart = false; return; } moveLeft(); }); 
}
if (bRight) { 
    bRight.addEventListener("touchstart", (e) => { e.preventDefault(); if(isGameWaitingToStart){ isGameWaitingToStart = false; return; } moveRight(); }); 
    bRight.addEventListener("click", () => { if(isGameWaitingToStart){ isGameWaitingToStart = false; return; } moveRight(); }); 
}
if (bAction) { 
    bAction.addEventListener("touchstart", (e) => { e.preventDefault(); actionKey(); }); 
    bAction.addEventListener("click", actionKey); 
}