import { Game } from './game.js';

class DinosaurGame {
    constructor() {
        this.canvas = null;
        this.game = null;
        this.init();
    }
    
    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupGame());
        } else {
            this.setupGame();
        }
    }
    
    setupGame() {
        this.canvas = document.getElementById('gameCanvas');
        
        if (!this.canvas) {
            console.error('Game canvas not found!');
            return;
        }
        
        // Check for canvas support
        if (!this.canvas.getContext) {
            this.showError('このブラウザはCanvasをサポートしていません。');
            return;
        }
        
        // Set up canvas
        this.setupCanvas();
        
        // Create game instance
        try {
            this.game = new Game(this.canvas);
            console.log('恐竜アクションゲーム初期化完了！');
        } catch (error) {
            console.error('ゲーム初期化エラー:', error);
            this.showError('ゲームの初期化に失敗しました。');
        }
        
        // Setup resize handler
        window.addEventListener('resize', () => this.handleResize());
        
        // Prevent context menu on canvas
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Focus management
        this.setupFocusManagement();
    }
    
    setupCanvas() {
        const ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 400;
        
        // Improve rendering quality
        ctx.imageSmoothingEnabled = false;
        
        // Set CSS size for responsive design
        this.handleResize();
    }
    
    handleResize() {
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const aspectRatio = this.canvas.width / this.canvas.height;
        
        let displayWidth = Math.min(containerWidth - 20, 800);
        let displayHeight = displayWidth / aspectRatio;
        
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';
    }
    
    setupFocusManagement() {
        // Ensure the game can receive keyboard input
        this.canvas.setAttribute('tabindex', '0');
        
        // Focus on canvas when clicked
        this.canvas.addEventListener('click', () => {
            this.canvas.focus();
        });
        
        // Focus on canvas when page loads
        setTimeout(() => {
            this.canvas.focus();
        }, 100);
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4444;
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-family: Arial, sans-serif;
            text-align: center;
            z-index: 1000;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        // Remove error after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

// Initialize the game
new DinosaurGame();