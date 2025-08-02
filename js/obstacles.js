import { Utils } from './utils.js';

export class Obstacle {
    constructor(x, y, type, config = {}) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = config.width || 30;
        this.height = config.height || 30;
        this.speed = config.speed || 150;
        this.collected = false;
        this.hit = false;
        this.destroyed = false;
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.destroyEffect = {
            active: false,
            timer: 0,
            particles: []
        };
    }
    
    update(deltaTime, gameSpeed) {
        this.x -= this.speed * gameSpeed * deltaTime;
        
        // Update animation
        this.animationTimer += deltaTime;
        if (this.animationTimer >= 0.2) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }
        
        // Update destroy effect
        if (this.destroyEffect.active) {
            this.destroyEffect.timer += deltaTime;
            this.destroyEffect.particles.forEach(particle => {
                particle.x += particle.vx * deltaTime;
                particle.y += particle.vy * deltaTime;
                particle.life -= deltaTime;
            });
            this.destroyEffect.particles = this.destroyEffect.particles.filter(p => p.life > 0);
            
            if (this.destroyEffect.timer > 0.5) {
                this.destroyed = true;
            }
        }
    }
    
    getCollisionRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    isOffScreen() {
        return this.x + this.width < 0;
    }
    
    shouldRemove() {
        return this.isOffScreen() || this.collected || this.hit || this.destroyed;
    }
    
    destroy() {
        if (this.type === 'coin' || this.type === 'meat') {
            this.collected = true;
            return;
        }
        
        this.destroyEffect.active = true;
        this.destroyEffect.timer = 0;
        
        // Create explosion particles
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const speed = Utils.random(50, 150);
            this.destroyEffect.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5,
                color: this.getParticleColor()
            });
        }
    }
    
    getParticleColor() {
        switch (this.type) {
            case 'cactus': return '#228B22';
            case 'rock': return '#708090';
            case 'bird': return '#4169E1';
            case 'pterodactyl': return '#8B4513';
            default: return '#FF6B6B';
        }
    }
    
    render(ctx) {
        if (this.collected || this.hit) return;
        
        // Draw destroy effect particles
        if (this.destroyEffect.active) {
            this.destroyEffect.particles.forEach(particle => {
                ctx.save();
                ctx.globalAlpha = particle.life / 0.5;
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
            return; // Don't draw the obstacle if it's being destroyed
        }
        
        switch (this.type) {
            case 'cactus':
                this.drawCactus(ctx);
                break;
            case 'rock':
                this.drawRock(ctx);
                break;
            case 'bird':
                this.drawBird(ctx);
                break;
            case 'pterodactyl':
                this.drawPterodactyl(ctx);
                break;
            case 'coin':
                this.drawCoin(ctx);
                break;
            case 'meat':
                this.drawMeat(ctx);
                break;
        }
    }
    
    drawCactus(ctx) {
        // Main body
        ctx.fillStyle = '#228B22';
        ctx.fillRect(this.x + 5, this.y, this.width - 10, this.height);
        
        // Arms
        ctx.fillRect(this.x, this.y + 10, 8, 15);
        ctx.fillRect(this.x + this.width - 8, this.y + 8, 8, 12);
        
        // Spikes
        ctx.fillStyle = '#32CD32';
        for (let i = 0; i < this.height; i += 8) {
            ctx.fillRect(this.x + 3, this.y + i, 2, 3);
            ctx.fillRect(this.x + this.width - 5, this.y + i + 2, 2, 3);
        }
    }
    
    drawRock(ctx) {
        ctx.fillStyle = '#708090';
        
        // Main rock shape
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height * 0.3);
        ctx.lineTo(this.x + this.width * 0.8, this.y + this.height);
        ctx.lineTo(this.x + this.width * 0.2, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height * 0.6);
        ctx.closePath();
        ctx.fill();
        
        // Rock details
        ctx.fillStyle = '#696969';
        ctx.fillRect(this.x + 5, this.y + 8, 8, 6);
        ctx.fillRect(this.x + 15, this.y + 12, 6, 8);
    }
    
    drawBird(ctx) {
        const wingOffset = Math.sin(this.animationFrame * Math.PI) * 3;
        
        // Body
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(this.x + 8, this.y + 8, 12, 8);
        
        // Head
        ctx.fillRect(this.x + 15, this.y + 5, 8, 8);
        
        // Wings
        ctx.fillStyle = '#1E90FF';
        ctx.fillRect(this.x + 2, this.y + 10 + wingOffset, 12, 4);
        ctx.fillRect(this.x + 18, this.y + 10 - wingOffset, 12, 4);
        
        // Beak
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(this.x + 23, this.y + 8, 4, 2);
    }
    
    drawPterodactyl(ctx) {
        const wingOffset = Math.sin(this.animationFrame * Math.PI * 0.5) * 5;
        
        // Body
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x + 15, this.y + 10, 20, 8);
        
        // Head
        ctx.fillRect(this.x + 25, this.y + 5, 15, 10);
        
        // Beak
        ctx.fillStyle = '#654321';
        ctx.fillRect(this.x + 35, this.y + 8, 8, 3);
        
        // Wings
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + 15 + wingOffset);
        ctx.lineTo(this.x + 15, this.y + 12);
        ctx.lineTo(this.x + 25, this.y + 18);
        ctx.lineTo(this.x + 10, this.y + 25 + wingOffset);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.x + 35, this.y + 12);
        ctx.lineTo(this.x + 50, this.y + 15 - wingOffset);
        ctx.lineTo(this.x + 60, this.y + 25 - wingOffset);
        ctx.lineTo(this.x + 45, this.y + 18);
        ctx.closePath();
        ctx.fill();
    }
    
    drawCoin(ctx) {
        const spinOffset = Math.sin(this.animationFrame * Math.PI * 0.5) * 0.3;
        
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.scale(1 + spinOffset, 1);
        
        // Outer ring
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner design
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Center dot
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    drawMeat(ctx) {
        // Bone
        ctx.fillStyle = '#F5F5DC';
        ctx.fillRect(this.x + 2, this.y + 8, this.width - 4, 6);
        
        // Bone ends
        ctx.beginPath();
        ctx.arc(this.x + 4, this.y + 11, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + this.width - 4, this.y + 11, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Meat
        ctx.fillStyle = '#CD5C5C';
        ctx.fillRect(this.x + 8, this.y + 3, this.width - 16, 16);
        
        // Meat highlight
        ctx.fillStyle = '#F08080';
        ctx.fillRect(this.x + 9, this.y + 4, 4, 6);
    }
}

export class ObstacleManager {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.obstacles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 2.0; // Base spawn interval
        this.groundY = gameHeight - 50;
        this.patterns = this.createPatterns();
        this.currentPatternIndex = 0;
    }
    
    createPatterns() {
        return [
            // Pattern 1: Single cactus
            [{ type: 'cactus', delay: 0 }],
            
            // Pattern 2: Two cacti with gap
            [
                { type: 'cactus', delay: 0 },
                { type: 'cactus', delay: 1.5 }
            ],
            
            // Pattern 3: Rock and bird
            [
                { type: 'rock', delay: 0 },
                { type: 'bird', delay: 1.0 }
            ],
            
            // Pattern 4: Flying enemies
            [
                { type: 'bird', delay: 0 },
                { type: 'pterodactyl', delay: 0.8 }
            ],
            
            // Pattern 5: Coin collection
            [
                { type: 'coin', delay: 0 },
                { type: 'coin', delay: 0.3 },
                { type: 'coin', delay: 0.6 }
            ],
            
            // Pattern 6: Mixed obstacles
            [
                { type: 'cactus', delay: 0 },
                { type: 'coin', delay: 0.8 },
                { type: 'bird', delay: 1.2 }
            ],
            
            // Pattern 7: High-low combo
            [
                { type: 'rock', delay: 0 },
                { type: 'pterodactyl', delay: 0.5 },
                { type: 'meat', delay: 1.0 }
            ],
            
            // Pattern 8: Rapid fire
            [
                { type: 'cactus', delay: 0 },
                { type: 'cactus', delay: 0.8 },
                { type: 'cactus', delay: 1.6 }
            ]
        ];
    }
    
    reset() {
        this.obstacles = [];
        this.spawnTimer = 0;
        this.currentPatternIndex = 0;
    }
    
    update(deltaTime, gameSpeed) {
        // Update existing obstacles
        this.obstacles.forEach(obstacle => {
            obstacle.update(deltaTime, gameSpeed);
        });
        
        // Remove obstacles that are off-screen or collected
        this.obstacles = this.obstacles.filter(obstacle => !obstacle.shouldRemove());
        
        // Spawn new obstacles
        this.spawnTimer += deltaTime;
        const adjustedSpawnInterval = this.spawnInterval / Math.max(1, gameSpeed * 0.5);
        
        if (this.spawnTimer >= adjustedSpawnInterval) {
            this.spawnPattern();
            this.spawnTimer = 0;
        }
    }
    
    spawnPattern() {
        const pattern = this.patterns[this.currentPatternIndex];
        
        pattern.forEach(item => {
            setTimeout(() => {
                this.spawnObstacle(item.type);
            }, item.delay * 1000);
        });
        
        this.currentPatternIndex = (this.currentPatternIndex + 1) % this.patterns.length;
    }
    
    spawnObstacle(type) {
        let obstacle;
        const x = this.gameWidth + 50;
        
        switch (type) {
            case 'cactus':
                obstacle = new Obstacle(x, this.groundY - 40, 'cactus', {
                    width: 25,
                    height: 40,
                    speed: 150
                });
                break;
                
            case 'rock':
                obstacle = new Obstacle(x, this.groundY - 25, 'rock', {
                    width: 30,
                    height: 25,
                    speed: 150
                });
                break;
                
            case 'bird':
                obstacle = new Obstacle(x, this.groundY - Utils.random(80, 120), 'bird', {
                    width: 30,
                    height: 20,
                    speed: Utils.random(120, 180)
                });
                break;
                
            case 'pterodactyl':
                obstacle = new Obstacle(x, this.groundY - Utils.random(100, 150), 'pterodactyl', {
                    width: 60,
                    height: 30,
                    speed: Utils.random(100, 140)
                });
                break;
                
            case 'coin':
                obstacle = new Obstacle(x, this.groundY - Utils.random(30, 80), 'coin', {
                    width: 20,
                    height: 20,
                    speed: 150
                });
                break;
                
            case 'meat':
                obstacle = new Obstacle(x, this.groundY - 30, 'meat', {
                    width: 25,
                    height: 20,
                    speed: 150
                });
                break;
        }
        
        if (obstacle) {
            this.obstacles.push(obstacle);
        }
    }
    
    getObstacles() {
        return this.obstacles;
    }
    
    render(ctx) {
        this.obstacles.forEach(obstacle => {
            obstacle.render(ctx);
        });
    }
}