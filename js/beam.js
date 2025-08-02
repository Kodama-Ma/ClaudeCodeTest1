export class Beam {
    constructor(x, y, direction = 1) {
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 4;
        this.speed = 600;
        this.direction = direction; // 1 for right, -1 for left
        this.active = true;
        this.damage = 1;
        this.maxDistance = 800;
        this.travelDistance = 0;
        
        // Visual effects
        this.glowSize = 0;
        this.sparkles = [];
        this.createSparkles();
    }
    
    createSparkles() {
        for (let i = 0; i < 3; i++) {
            this.sparkles.push({
                x: this.x + Math.random() * this.width,
                y: this.y + Math.random() * this.height,
                life: 1.0,
                size: Math.random() * 2 + 1
            });
        }
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        const movement = this.speed * this.direction * deltaTime;
        this.x += movement;
        this.travelDistance += Math.abs(movement);
        
        // Update glow effect
        this.glowSize = Math.sin(Date.now() * 0.01) * 2 + 3;
        
        // Update sparkles
        this.sparkles.forEach(sparkle => {
            sparkle.life -= deltaTime * 2;
            sparkle.x += movement;
        });
        
        // Remove dead sparkles and create new ones
        this.sparkles = this.sparkles.filter(sparkle => sparkle.life > 0);
        if (this.sparkles.length < 3) {
            this.sparkles.push({
                x: this.x + Math.random() * this.width,
                y: this.y + Math.random() * this.height,
                life: 1.0,
                size: Math.random() * 2 + 1
            });
        }
        
        // Deactivate if traveled too far
        if (this.travelDistance >= this.maxDistance) {
            this.active = false;
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
    
    isOffScreen(gameWidth) {
        return this.x > gameWidth + 50 || this.x < -50;
    }
    
    shouldRemove() {
        return !this.active;
    }
    
    render(ctx) {
        if (!this.active) return;
        
        ctx.save();
        
        // Draw glow effect
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = this.glowSize;
        
        // Main beam
        ctx.fillStyle = '#00FFFF';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Inner bright core
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x + 1, this.y + 1, this.width - 2, this.height - 2);
        
        // Draw sparkles
        ctx.shadowBlur = 0;
        this.sparkles.forEach(sparkle => {
            ctx.globalAlpha = sparkle.life;
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
}

export class BeamManager {
    constructor() {
        this.beams = [];
    }
    
    addBeam(x, y, direction = 1) {
        this.beams.push(new Beam(x, y, direction));
    }
    
    update(deltaTime) {
        this.beams.forEach(beam => beam.update(deltaTime));
        this.beams = this.beams.filter(beam => !beam.shouldRemove() && !beam.isOffScreen(1000));
    }
    
    getBeams() {
        return this.beams.filter(beam => beam.active);
    }
    
    clear() {
        this.beams = [];
    }
    
    render(ctx) {
        this.beams.forEach(beam => beam.render(ctx));
    }
}