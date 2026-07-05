const Oyunlar = {
    yilan: { init: initSnake, update: updateSnake, draw: drawSnake },
    brick: { init: initBrick, update: updateBrick, draw: drawBrick },
    space: { init: initSpace, update: updateSpace, draw: drawSpace },
    flappy: { init: initFlappy, update: updateFlappy, draw: drawFlappy },
    pong: { init: initPong, update: updatePong, draw: drawPong }
};

function updateEngine() {
    if (!isGameRunning) return;
    if (activeGame === "snake") updateSnake();
    else if (activeGame === "brick") updateBrick();
    else if (activeGame === "space") updateSpace();
    else if (activeGame === "flappy") updateFlappy();
    else if (activeGame === "pong") updatePong();
}

function initSnake() { snake = [{x:100,y:100},{x:80,y:100},{x:60,y:100}]; dx=20; dy=0; moveFood(); }
function updateSnake() {
    let head = { x: snake[0].x + dx, y: snake[0].y + dy };
    if (head.x < 0 || head.x >= 400 || head.y < 0 || head.y >= 400 || checkSelfCollision(head)) { gameOver(); return; }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) { score += 10; scoreElement.innerText = score; playSound("coin"); addGold(10); moveFood(); } else snake.pop();
    drawSnake();
}
function drawSnake() { clearCanvas(); drawWatermark(); let c = getSkinColors(); snake.forEach((p, i) => { ctx.fillStyle = i===0?c.head:c.body; ctx.fillRect(p.x+1, p.y+1, 18, 18); }); ctx.fillStyle = "#ff1744"; ctx.beginPath(); ctx.arc(food.x+10, food.y+10, 8, 0, Math.PI*2); ctx.fill(); }

function initBrick() { ball={x:200,y:250,radius:7,dx:3,dy:-4}; paddle={x:155,y:370,width:90,height:12,speed:14}; bricks=[]; for(let c=0;c<5;c++)for(let r=0;r<4;r++)bricks.push({x:c*75+15,y:r*22+40,status:1}); }
function updateBrick() { ball.x+=ball.dx; ball.y+=ball.dy; if(ball.x<7||ball.x>393)ball.dx=-ball.dx; if(ball.y<7)ball.dy=-ball.dy; if(ball.y+7>=paddle.y && ball.x>=paddle.x && ball.x<=paddle.x+90){ball.dy=-Math.abs(ball.dy); playSound("dink");} if(ball.y>400)gameOver(); bricks.forEach(b=>{if(b.status==1 && ball.x>b.x && ball.x<b.x+68 && ball.y>b.y && ball.y<b.y+18){ball.dy=-ball.dy; b.status=0; score+=20; playSound("coin"); addGold(5);}}); drawBrick(); }
function drawBrick() { clearCanvas(); drawWatermark(); ctx.fillStyle="#00b0ff"; ctx.fillRect(paddle.x, paddle.y, 90, 12); ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(ball.x, ball.y, 7, 0, Math.PI*2); ctx.fill(); bricks.forEach(b=>{if(b.status==1){ctx.fillStyle="#0091ea"; ctx.fillRect(b.x, b.y, 68, 18);}}); }

// (Uzay, Flappy, Pong çizim fonksiyonlarını da yukarıdaki mantıkla buraya ekle)