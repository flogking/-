// 游戏主类
class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.gridWidth = this.canvas.width / this.gridSize;
        this.gridHeight = this.canvas.height / this.gridSize;
        
        // 游戏状态
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
        this.gameOver = false;
        this.paused = false;
        this.gameStarted = false;
        
        // 速度控制
        this.speed = 10; // 初始速度
        this.gameLoop = null;
        this.lastTime = 0;
        
        // 音效
        this.soundEnabled = localStorage.getItem('snakeSound') !== 'false';
        this.eatSound = document.getElementById('eat-sound');
        this.gameoverSound = document.getElementById('gameover-sound');
        
        // 初始化
        this.init();
        this.bindEvents();
        this.loadRecords();
        this.updateUI();
        
        // 预加载音效
        this.preloadSounds();
        
        // 隐藏加载动画
        setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('game-container').style.display = 'block';
        }, 500);
    }
    
    init() {
        // 重置蛇的位置
        this.snake = [];
        this.resetSnake();
        
        // 生成食物
        this.food = { x: 0, y: 0 };
        this.generateFood();
        
        // 方向
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        
        // 重置状态
        this.score = 0;
        this.gameOver = false;
        this.paused = false;
        this.gameStarted = false;
    }
    
    resetSnake() {
        const centerX = Math.floor(this.gridWidth / 2);
        const centerY = Math.floor(this.gridHeight / 2);
        
        this.snake = [
            { x: centerX, y: centerY },
            { x: centerX - 1, y: centerY },
            { x: centerX - 2, y: centerY }
        ];
    }
    
    generateFood() {
        let newFood;
        let onSnake;
        
        do {
            newFood = {
                x: Math.floor(Math.random() * this.gridWidth),
                y: Math.floor(Math.random() * this.gridHeight)
            };
            
            onSnake = this.snake.some(segment => 
                segment.x === newFood.x && segment.y === newFood.y
            );
        } while (onSnake);
        
        this.food = newFood;
    }
    
    moveSnake() {
        if (this.gameOver || this.paused || !this.gameStarted) return;
        
        // 更新方向
        this.direction = { ...this.nextDirection };
        
        // 计算新蛇头位置
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        // 撞墙检测
        if (head.x < 0 || head.x >= this.gridWidth || 
            head.y < 0 || head.y >= this.gridHeight) {
            this.endGame();
            return;
        }
        
        // 撞自己检测
        if (this.snake.some((segment, index) => 
            index > 0 && segment.x === head.x && segment.y === head.y
        )) {
            this.endGame();
            return;
        }
        
        // 添加新头
        this.snake.unshift(head);
        
        // 吃食物检测
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.playSound(this.eatSound);
            this.generateFood();
            this.updateSpeed();
        } else {
            // 移除蛇尾
            this.snake.pop();
        }
        
        this.updateUI();
    }
    
    draw() {
        // 清空画布
        this.ctx.fillStyle = '#1a202c';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        this.drawGrid();
        
        // 绘制食物
        this.drawFood();
        
        // 绘制蛇
        this.drawSnake();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#2d3748';
        this.ctx.lineWidth = 1;
        
        // 竖线
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // 横线
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawSnake() {
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            const isHead = index === 0;
            
            // 身体颜色渐变
            if (isHead) {
                this.ctx.fillStyle = '#48bb78'; // 蛇头颜色
            } else {
                const intensity = 200 - Math.min(150, index * 10);
                this.ctx.fillStyle = `rgb(0, ${intensity}, 0)`;
            }
            
            // 绘制蛇身体
            this.ctx.fillRect(x, y, this.gridSize, this.gridSize);
            
            // 边框
            this.ctx.strokeStyle = isHead ? '#ffffff' : '#2f855a';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, this.gridSize, this.gridSize);
            
            // 绘制眼睛（如果是头部）
            if (isHead) {
                this.drawEyes(x, y);
            }
        });
    }
    
    drawEyes(x, y) {
        const eyeSize = this.gridSize / 4;
        const offset = this.gridSize / 3;
        
        this.ctx.fillStyle = '#ffffff';
        
        // 根据方向确定眼睛位置
        if (this.direction.x === 1) { // 向右
            this.ctx.beginPath();
            this.ctx.arc(x + this.gridSize - offset, y + offset, eyeSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(x + this.gridSize - offset, y + this.gridSize - offset, eyeSize, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (this.direction.x === -1) { // 向左
            this.ctx.beginPath();
            this.ctx.arc(x + offset, y + offset, eyeSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(x + offset, y + this.gridSize - offset, eyeSize, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (this.direction.y === 1) { // 向下
            this.ctx.beginPath();
            this.ctx.arc(x + offset, y + this.gridSize - offset, eyeSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(x + this.gridSize - offset, y + this.gridSize - offset, eyeSize, 0, Math.PI * 2);
            this.ctx.fill();
        } else { // 向上
            this.ctx.beginPath();
            this.ctx.arc(x + offset, y + offset, eyeSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(x + this.gridSize - offset, y + offset, eyeSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // 瞳孔
        this.ctx.fillStyle = '#000000';
        const pupilSize = eyeSize / 2;
        
        if (this.direction.x === 1) {
            this.ctx.beginPath();
            this.ctx.arc(x + this.gridSize - offset, y + offset, pupilSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(x + this.gridSize - offset, y + this.gridSize - offset, pupilSize, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (this.direction.x === -1) {
            this.ctx.beginPath();
            this.ctx.arc(x + offset, y + offset, pupilSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(x + offset, y + this.gridSize - offset, pupilSize, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (this.direction.y === 1) {
            this.ctx.beginPath();
            this.ctx.arc(x + offset, y + this.gridSize - offset, pupilSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(x + this.gridSize - offset, y + this.gridSize - offset, pupilSize, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            this.ctx.beginPath();
            this.ctx.arc(x + offset, y + offset, pupilSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(x + this.gridSize - offset, y + offset, pupilSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawFood() {
        const x = this.food.x * this.gridSize;
        const y = this.food.y * this.gridSize;
        
        // 绘制食物
        this.ctx.fillStyle = '#f56565';
        this.ctx.beginPath();
        this.ctx.arc(
            x + this.gridSize / 2,
            y + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // 高光
        this.ctx.fillStyle = '#fc8181';
        this.ctx.beginPath();
        this.ctx.arc(
            x + this.gridSize / 3,
            y + this.gridSize / 3,
            this.gridSize / 6,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }
    
    startGame() {
        this.gameStarted = true;
        this.gameOver = false;
        this.paused = false;
        
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('game-over-screen').style.display = 'none';
        document.getElementById('pause-screen').style.display = 'none';
        
        this.startGameLoop();
    }
    
    startGameLoop() {
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        
        const gameLoop = (timestamp) => {
            if (!this.gameStarted || this.gameOver || this.paused) return;
            
            const deltaTime = timestamp - this.lastTime;
            
            if (deltaTime > 1000 / this.speed) {
                this.lastTime = timestamp;
                this.moveSnake();
                this.draw();
            }
            
            this.gameLoop = requestAnimationFrame(gameLoop);
        };
        
        this.lastTime = performance.now();
        this.gameLoop = requestAnimationFrame(gameLoop);
    }
    
    pauseGame() {
        this.paused = !this.paused;
        
        if (this.paused) {
            document.getElementById('pause-screen').style.display = 'flex';
            document.getElementById('pause-btn').textContent = '继续';
        } else {
            document.getElementById('pause-screen').style.display = 'none';
            document.getElementById('pause-btn').textContent = '暂停';
            this.startGameLoop();
        }
    }
    
    endGame() {
        this.gameOver = true;
        this.gameStarted = false;
        
        this.playSound(this.gameoverSound);
        this.updateHighScore();
        this.saveRecords();
        
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-length').textContent = this.snake.length;
        document.getElementById('game-over-screen').style.display = 'flex';
    }
    
    restartGame() {
        this.init();
        this.startGame();
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('length').textContent = this.snake.length;
        document.getElementById('high-score').textContent = this.highScore;
    }
    
    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
        }
    }
    
    loadRecords() {
        const records = JSON.parse(localStorage.getItem('snakeRecords')) || {
            playCount: 0,
            maxLength: 0
        };
        
        document.getElementById('play-count').textContent = records.playCount;
        document.getElementById('record-length').textContent = records.maxLength;
    }
    
    saveRecords() {
        const records = JSON.parse(localStorage.getItem('snakeRecords')) || {
            playCount: 0,
            maxLength: 0
        };
        
        records.playCount++;
        if (this.snake.length > records.maxLength) {
            records.maxLength = this.snake.length;
        }
        
        localStorage.setItem('snakeRecords', JSON.stringify(records));
        this.loadRecords();
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('snakeSound', this.soundEnabled);
        
        const soundBtn = document.getElementById('sound-toggle');
        soundBtn.textContent = this.soundEnabled ? '🔊' : '🔇';
        
        if (this.soundEnabled) {
            this.playSound(this.eatSound);
        }
    }
    
    playSound(audio) {
        if (!this.soundEnabled) return;
        
        audio.currentTime = 0;
        audio.play().catch(e => {
            console.log('音效播放失败:', e);
        });
    }
    
    preloadSounds() {
        this.eatSound.load();
        this.gameoverSound.load();
    }
    
    updateSpeed() {
        // 每得100分增加速度
        const speedIncrement = Math.floor(this.score / 100);
        this.speed = 10 + speedIncrement;
        
        const speedSlider = document.getElementById('speed-slider');
        const speedValue = document.getElementById('speed-value');
        
        if (this.speed <= 12) {
            speedValue.textContent = '慢';
        } else if (this.speed <= 18) {
            speedValue.textContent = '中';
        } else {
            speedValue.textContent = '快';
        }
        
        speedSlider.value = this.speed;
    }
    
    bindEvents() {
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            switch (e.key.toLowerCase()) {
                case 'arrowup':
                case 'w':
                    if (this.direction.y === 0) {
                        this.nextDirection = { x: 0, y: -1 };
                    }
                    break;
                    
                case 'arrowdown':
                case 's':
                    if (this.direction.y === 0) {
                        this.nextDirection = { x: 0, y: 1 };
                    }
                    break;
                    
                case 'arrowleft':
                case 'a':
                    if (this.direction.x === 0) {
                        this.nextDirection = { x: -1, y: 0 };
                    }
                    break;
                    
                case 'arrowright':
                case 'd':
                    if (this.direction.x === 0) {
                        this.nextDirection = { x: 1, y: 0 };
                    }
                    break;
                    
                case ' ':
                    if (this.gameStarted) {
                        this.pauseGame();
                    }
                    break;
                    
                case 'r':
                    if (this.gameStarted) {
                        this.restartGame();
                    }
                    break;
                    
                case 'm':
                    this.toggleSound();
                    break;
            }
        });
        
        // 按钮事件
        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('menu-btn').addEventListener('click', () => {
            this.init();
            this.draw();
            document.getElementById('start-screen').style.display = 'flex';
            document.getElementById('game-over-screen').style.display = 'none';
        });
        
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.pauseGame();
        });
        
        document.getElementById('pause-btn').addEventListener('click', () => {
            if (this.gameStarted) {
                this.pauseGame();
            }
        });
        
        document.getElementById('sound-toggle').addEventListener('click', () => {
            this.toggleSound();
        });
        
        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        document.getElementById('speed-slider').addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
            this.updateSpeed();
        });
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`全屏请求失败: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
}

// 初始化游戏
window.addEventListener('load', () => {
    const game = new SnakeGame();
    game.draw(); // 初始绘制
    
    // 确保音效按钮状态正确
    const soundBtn = document.getElementById('sound-toggle');
    soundBtn.textContent = game.soundEnabled ? '🔊' : '🔇';
});