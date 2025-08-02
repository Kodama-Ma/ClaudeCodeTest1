import { Utils } from './utils.js';
import { BeamManager } from './beam.js';

export class Player {
    constructor(x, y) {
        this.initialX = x;
        this.initialY = y;
        
        // Load player image
        this.image = new Image();
        this.image.src = 'assets/images/player.png';
        this.imageLoaded = false;
        
        this.image.onload = () => {
            this.imageLoaded = true;
        };
        
        // Fallback if image fails to load
        this.image.onerror = () => {
            console.warn('Player image failed to load, using default drawing');
            this.imageLoaded = false;
        };
        
        this.reset(x, y);
    }
    
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 50;
        this.velocityY = 0;
        this.velocityX = 0;
        this.isGrounded = true;
        this.isDucking = false;
        this.isDashing = false;
        this.dashCooldown = 0;
        this.invulnerable = false;
        this.invulnerabilityTimer = 0;
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.groundY = y;
        
        // Physics constants
        this.gravity = 800;
        this.jumpPower = 350;
        this.dashPower = 200;
        this.dashDuration = 0.3;
        this.maxFallSpeed = 600;
        
        // Beam system
        this.beamManager = new BeamManager();
        this.beamCooldown = 0;
        this.beamCooldownTime = 0.2; // 200ms cooldown
    }
    
    update(deltaTime, inputManager) {
        this.handleInput(inputManager, deltaTime);
        this.updatePhysics(deltaTime);
        this.updateAnimation(deltaTime);
        this.updateTimers(deltaTime);
        this.beamManager.update(deltaTime);
    }
    
    handleInput(inputManager, deltaTime) {
        // Jump
        if (inputManager.isJumping() && this.isGrounded) {
            this.jump();
        }
        
        // Duck
        this.isDucking = inputManager.isDucking() && this.isGrounded;
        
        // Dash
        if (inputManager.isDashing() && this.dashCooldown <= 0) {
            this.dash();
        }
        
        // Beam attack
        if (inputManager.isShootingBeam() && this.beamCooldown <= 0) {
            this.shootBeam();
        }
    }
    
    jump() {
        if (this.isGrounded) {
            this.velocityY = -this.jumpPower;
            this.isGrounded = false;
        }
    }
    
    dash() {
        this.isDashing = true;
        this.velocityX = this.dashPower;
        this.dashCooldown = 1.0; // 1 second cooldown
    }
    
    shootBeam() {
        const beamX = this.x + this.width;
        const beamY = this.y + this.height / 2 - 2;
        this.beamManager.addBeam(beamX, beamY, 1);
        this.beamCooldown = this.beamCooldownTime;
    }
    
    updatePhysics(deltaTime) {
        // Apply gravity
        if (!this.isGrounded) {
            this.velocityY += this.gravity * deltaTime;
            this.velocityY = Math.min(this.velocityY, this.maxFallSpeed);
        }
        
        // Apply horizontal velocity with decay
        if (this.isDashing) {
            this.velocityX *= Math.pow(0.1, deltaTime); // Exponential decay
            if (this.velocityX < 10) {
                this.isDashing = false;
                this.velocityX = 0;
            }
        }
        
        // Update position
        this.y += this.velocityY * deltaTime;
        this.x += this.velocityX * deltaTime;
        
        // Ground collision
        if (this.y >= this.groundY) {
            this.y = this.groundY;
            this.velocityY = 0;
            this.isGrounded = true;
        }
        
        // Keep player in bounds
        this.x = Utils.clamp(this.x, 0, 800 - this.width);
    }
    
    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;
        if (this.animationTimer >= 0.1) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }
    }
    
    updateTimers(deltaTime) {
        if (this.dashCooldown > 0) {
            this.dashCooldown -= deltaTime;
        }
        
        if (this.beamCooldown > 0) {
            this.beamCooldown -= deltaTime;
        }
        
        if (this.invulnerable) {
            this.invulnerabilityTimer -= deltaTime;
            if (this.invulnerabilityTimer <= 0) {
                this.invulnerable = false;
            }
        }
    }
    
    takeDamage() {
        if (!this.invulnerable) {
            this.invulnerable = true;
            this.invulnerabilityTimer = 2.0; // 2 seconds of invulnerability
        }
    }
    
    getCollisionRect() {
        const height = this.isDucking ? this.height * 0.6 : this.height;
        const y = this.isDucking ? this.y + this.height * 0.4 : this.y;
        
        return {
            x: this.x + 5,
            y: y + 5,
            width: this.width - 10,
            height: height - 10
        };
    }
    
    getBeams() {
        return this.beamManager.getBeams();
    }
    
    render(ctx) {
        ctx.save();
        
        // Invulnerability flashing effect
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2) {
            ctx.globalAlpha = 0.5;
        }
        
        // Draw dinosaur
        this.drawDinosaur(ctx);
        
        // Draw dash effect
        if (this.isDashing) {
            this.drawDashEffect(ctx);
        }
        
        // Draw dash cooldown indicator
        if (this.dashCooldown > 0) {
            this.drawCooldownIndicator(ctx);
        }
        
        // Draw beams
        this.beamManager.render(ctx);
        
        ctx.restore();
    }
    
    drawDinosaur(ctx) {
        // Try to draw image first
        if (this.imageLoaded && this.image.complete) {
            const drawWidth = this.width;
            const drawHeight = this.isDucking ? this.height * 0.6 : this.height;
            const drawY = this.isDucking ? this.y + this.height * 0.4 : this.y;
            
            // Draw the player image
            ctx.drawImage(this.image, this.x, drawY, drawWidth, drawHeight);
            return;
        }
        
        // Fallback to original drawing if image not loaded
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Body
        ctx.fillStyle = '#4A4A4A';
        if (this.isDucking) {
            // Ducking pose - wider, shorter body
            ctx.fillRect(this.x, this.y + this.height * 0.4, this.width, this.height * 0.4);
            
            // Head (smaller when ducking)
            ctx.fillRect(this.x - 10, this.y + this.height * 0.2, 20, 20);
        } else {
            // Normal pose
            ctx.fillRect(this.x + 5, this.y + 10, this.width - 10, this.height - 20);
            
            // Head
            ctx.fillRect(this.x - 8, this.y, 25, 25);
        }
        
        // Eyes
        ctx.fillStyle = '#FFFFFF';
        if (!this.isDucking) {
            ctx.fillRect(this.x - 5, this.y + 5, 4, 4);
            ctx.fillRect(this.x + 2, this.y + 5, 4, 4);
            
            // Eye pupils
            ctx.fillStyle = '#000000';
            ctx.fillRect(this.x - 4, this.y + 6, 2, 2);
            ctx.fillRect(this.x + 3, this.y + 6, 2, 2);
        }
        
        // Legs (animated)
        ctx.fillStyle = '#4A4A4A';
        if (this.isGrounded && !this.isDucking) {
            const legOffset = Math.sin(this.animationFrame * Math.PI / 2) * 3;
            
            // Left leg
            ctx.fillRect(this.x + 8, this.y + this.height - 15, 6, 15 + legOffset);
            
            // Right leg  
            ctx.fillRect(this.x + 20, this.y + this.height - 15, 6, 15 - legOffset);
        } else if (!this.isDucking) {
            // Jumping pose
            ctx.fillRect(this.x + 8, this.y + this.height - 10, 6, 10);
            ctx.fillRect(this.x + 20, this.y + this.height - 10, 6, 10);
        }
        
        // Arms
        if (!this.isDucking) {
            ctx.fillRect(this.x + 2, this.y + 15, 4, 15);
            ctx.fillRect(this.x + this.width - 6, this.y + 15, 4, 15);
        }
        
        // Tail
        ctx.fillStyle = '#3A3A3A';
        if (this.isDucking) {
            ctx.fillRect(this.x + this.width, this.y + this.height * 0.5, 15, 8);
        } else {
            ctx.fillRect(this.x + this.width - 5, this.y + 20, 20, 6);
        }
    }
    
    drawDashEffect(ctx) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        for (let i = 0; i < 5; i++) {
            const offsetX = -i * 8;
            const alpha = (5 - i) / 5 * 0.3;
            ctx.globalAlpha = alpha;
            ctx.fillRect(this.x + offsetX, this.y, this.width, this.height);
        }
        ctx.globalAlpha = 1;
    }
    
    drawCooldownIndicator(ctx) {
        const progress = 1 - (this.dashCooldown / 1.0);
        const barWidth = 30;
        const barHeight = 4;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x, this.y - 10, barWidth, barHeight);
        
        // Progress
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.x, this.y - 10, barWidth * progress, barHeight);
    }
}