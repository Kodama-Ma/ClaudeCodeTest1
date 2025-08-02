import { Player } from './player.js';
import { ObstacleManager } from './obstacles.js';
import { Utils, InputManager } from './utils.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.gameState = 'start'; // 'start', 'playing', 'gameOver', 'clear'
        this.score = 0;
        this.lives = 3;
        this.gameTime = 180; // 3 minutes
        this.currentTime = this.gameTime;
        this.highScore = parseInt(localStorage.getItem('dinoHighScore') || '0');
        
        this.background = {
            x1: 0,
            x2: this.width,
            speed: 2
        };
        
        this.inputManager = new InputManager();
        this.player = new Player(this.width * 0.1, this.height - 100);
        this.obstacleManager = new ObstacleManager(this.width, this.height);
        
        this.lastTime = 0;
        this.gameSpeed = 1;
        this.speedIncreaseTimer = 0;
        
        this.setupUI();
    }
    
    setupUI() {
        this.scoreElement = document.getElementById('score');
        this.livesElement = document.getElementById('lives');
        this.timerElement = document.getElementById('timer');
        this.gameOverlay = document.getElementById('gameOverlay');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.gameClearScreen = document.getElementById('gameClearScreen');
        
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('restartButton').addEventListener('click', () => this.restartGame());
        document.getElementById('playAgainButton').addEventListener('click', () => this.restartGame());
    }
    
    startGame() {
        this.gameState = 'playing';
        this.gameOverlay.style.display = 'none';
        this.resetGame();
        this.gameLoop();
    }
    
    resetGame() {
        this.score = 0;
        this.lives = 3;
        this.currentTime = this.gameTime;
        this.gameSpeed = 1;
        this.speedIncreaseTimer = 0;
        this.background.x1 = 0;
        this.background.x2 = this.width;
        this.player.reset(this.width * 0.1, this.height - 100);
        this.obstacleManager.reset();
        this.updateUI();
    }
    
    restartGame() {
        this.gameState = 'start';
        this.gameOverlay.style.display = 'flex';
        this.startScreen.style.display = 'block';
        this.gameOverScreen.style.display = 'none';
        this.gameClearScreen.style.display = 'none';
    }
    
    gameLoop() {
        if (this.gameState !== 'playing') return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        // Update timer
        this.currentTime -= deltaTime;
        if (this.currentTime <= 0) {
            this.currentTime = 0;
            this.gameWin();
            return;
        }
        
        // Increase speed gradually
        this.speedIncreaseTimer += deltaTime;
        if (this.speedIncreaseTimer >= 10) {
            this.gameSpeed += 0.1;
            this.speedIncreaseTimer = 0;
        }
        
        // Update background
        this.updateBackground(deltaTime);
        
        // Update player
        this.player.update(deltaTime, this.inputManager);
        
        // Update obstacles
        this.obstacleManager.update(deltaTime, this.gameSpeed);
        
        // Check collisions
        this.checkCollisions();
        
        // Update score
        this.score += Math.floor(this.gameSpeed * deltaTime * 10);
        
        this.updateUI();
    }
    
    updateBackground(deltaTime) {
        const speed = this.background.speed * this.gameSpeed * 60 * deltaTime;
        this.background.x1 -= speed;
        this.background.x2 -= speed;
        
        if (this.background.x1 <= -this.width) {
            this.background.x1 = this.background.x2 + this.width;
        }
        if (this.background.x2 <= -this.width) {
            this.background.x2 = this.background.x1 + this.width;
        }
    }
    
    checkCollisions() {
        const playerRect = this.player.getCollisionRect();
        const obstacles = this.obstacleManager.getObstacles();
        const beams = this.player.getBeams();
        
        // Check player-obstacle collisions
        for (const obstacle of obstacles) {
            if (obstacle.destroyed || obstacle.destroyEffect.active) continue;
            
            if (obstacle.type === 'coin') {
                if (Utils.rectCollision(playerRect, obstacle.getCollisionRect())) {
                    this.score += 100;
                    obstacle.collected = true;
                }
            } else if (obstacle.type === 'meat') {
                if (Utils.rectCollision(playerRect, obstacle.getCollisionRect())) {
                    this.lives = Math.min(3, this.lives + 1);
                    obstacle.collected = true;
                }
            } else {
                if (Utils.rectCollision(playerRect, obstacle.getCollisionRect())) {
                    this.takeDamage();
                    obstacle.hit = true;
                }
            }
        }
        
        // Check beam-obstacle collisions
        for (const beam of beams) {
            if (!beam.active) continue;
            
            const beamRect = beam.getCollisionRect();
            for (const obstacle of obstacles) {
                if (obstacle.destroyed || obstacle.destroyEffect.active || obstacle.collected || obstacle.hit) continue;
                
                if (Utils.rectCollision(beamRect, obstacle.getCollisionRect())) {
                    // Add score for destroying obstacles
                    if (obstacle.type !== 'coin' && obstacle.type !== 'meat') {
                        this.score += 50;
                    }
                    obstacle.destroy();
                    beam.active = false;
                    break;
                }
            }
        }
    }
    
    takeDamage() {
        this.lives--;
        this.player.takeDamage();
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.updateHighScore();
        this.showGameOverScreen();
    }
    
    gameWin() {
        this.gameState = 'clear';
        this.updateHighScore();
        this.showGameClearScreen();
    }
    
    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('dinoHighScore', this.highScore.toString());
        }
    }
    
    showGameOverScreen() {
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        this.gameOverlay.style.display = 'flex';
        this.startScreen.style.display = 'none';
        this.gameOverScreen.style.display = 'block';
        this.gameClearScreen.style.display = 'none';
    }
    
    showGameClearScreen() {
        document.getElementById('clearScore').textContent = this.score;
        document.getElementById('clearHighScore').textContent = this.highScore;
        this.gameOverlay.style.display = 'flex';
        this.startScreen.style.display = 'none';
        this.gameOverScreen.style.display = 'none';
        this.gameClearScreen.style.display = 'block';
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.livesElement.textContent = this.lives;
        this.timerElement.textContent = Math.ceil(this.currentTime);
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw background
        this.drawBackground();
        
        // Draw ground
        this.drawGround();
        
        // Draw obstacles
        this.obstacleManager.render(this.ctx);
        
        // Draw player
        this.player.render(this.ctx);
        
        // Draw effects
        this.drawEffects();
    }
    
    drawBackground() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height * 0.7);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#F0E68C');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height * 0.7);
        
        // Clouds
        this.drawClouds();
        
        // Mountains
        this.drawMountains();
    }
    
    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const cloudOffset = (this.background.x1 * 0.3) % (this.width + 100);
        
        // Cloud 1
        this.ctx.beginPath();
        this.ctx.arc(100 + cloudOffset, 60, 25, 0, Math.PI * 2);
        this.ctx.arc(130 + cloudOffset, 60, 35, 0, Math.PI * 2);
        this.ctx.arc(160 + cloudOffset, 60, 25, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Cloud 2
        this.ctx.beginPath();
        this.ctx.arc(400 + cloudOffset, 40, 20, 0, Math.PI * 2);
        this.ctx.arc(425 + cloudOffset, 40, 30, 0, Math.PI * 2);
        this.ctx.arc(450 + cloudOffset, 40, 20, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawMountains() {
        const mountainOffset = (this.background.x1 * 0.5) % (this.width + 200);
        this.ctx.fillStyle = '#8B7355';
        
        this.ctx.beginPath();
        this.ctx.moveTo(-100 + mountainOffset, this.height * 0.7);
        this.ctx.lineTo(100 + mountainOffset, this.height * 0.3);
        this.ctx.lineTo(300 + mountainOffset, this.height * 0.5);
        this.ctx.lineTo(500 + mountainOffset, this.height * 0.2);
        this.ctx.lineTo(700 + mountainOffset, this.height * 0.6);
        this.ctx.lineTo(this.width + 100 + mountainOffset, this.height * 0.7);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawGround() {
        const groundY = this.height - 50;
        
        // Ground
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(0, groundY, this.width, 50);
        
        // Ground texture
        this.ctx.fillStyle = '#D2B48C';
        for (let x = 0; x < this.width; x += 40) {
            const offsetX = (x + this.background.x1) % 40;
            this.ctx.fillRect(x - offsetX, groundY + 5, 20, 3);
            this.ctx.fillRect(x - offsetX + 10, groundY + 15, 15, 3);
        }
    }
    
    drawEffects() {
        // Speed indicator
        if (this.gameSpeed > 1.5) {
            this.ctx.fillStyle = `rgba(255, 255, 0, ${Math.sin(Date.now() * 0.01) * 0.3 + 0.3})`;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    }
}