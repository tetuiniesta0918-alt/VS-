import { InputHandler } from './systems/InputHandler.js';
import { Player } from './entities/Player.js';
import { Invader } from './entities/Invader.js';
import { Particle } from './entities/Particle.js';
import { Projectile } from './entities/Projectile.js';
import { checkCollision } from './systems/CollisionSystem.js';
import { SoundSystem } from './systems/SoundSystem.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.lastTime = 0;

        this.input = new InputHandler();
        this.sound = new SoundSystem();

        this.player = new Player(this);
        this.projectiles = [];
        this.enemies = [];
        this.particles = [];
        this.enemyDirection = 1; // 1 = right, -1 = left
        this.enemyStepDown = false;

        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('spaceInvadersHighScore')) || 0;
        this.gameState = 'WAITING'; // WAITING, PLAYING, GAMEOVER

        // Enemy Shooting
        this.enemyShootTimer = 0;
        this.enemyShootInterval = 1000;

        // Diving
        this.diveTimer = 0;
        this.diveInterval = 2000;

        this.updateHighScoreUI();
    }

    updateHighScoreUI() {
        const el = document.getElementById('high-score');
        if (el) el.innerText = this.highScore;
    }

    initEnemies() {
        const rows = 4;
        const cols = 8;
        this.enemies = [];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                this.enemies.push(new Invader(this, 100 + x * 60, 50 + y * 50));
            }
        }
    }

    start() {
        this.animate(0);
    }

    animate(timeStamp) {
        const deltaTime = timeStamp - this.lastTime;
        this.lastTime = timeStamp;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.update(deltaTime);
        this.draw(this.ctx);

        requestAnimationFrame(this.animate.bind(this));
    }

    update(deltaTime) {
        if (this.gameState === 'WAITING') {
            if (this.input.isDown('Enter') || this.input.isDown('Space')) {
                this.startGame();
            }
        } else if (this.gameState === 'PLAYING') {
            this.updatePlaying(deltaTime);
        } else if (this.gameState === 'GAMEOVER') {
            if (this.input.isDown('Enter')) {
                this.startGame();
            }
        }
    }

    startGame() {
        this.gameState = 'PLAYING';
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('spaceInvadersHighScore')) || 0; // Refresh just in case
        this.projectiles = [];
        this.particles = [];
        this.player = new Player(this); // Reset player position
        this.enemyDirection = 1;
        this.enemyStepDown = false; // Reset this too
        this.initEnemies();

        this.sound.startBGM();

        document.getElementById('score').innerText = this.score;
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('ui-layer').style.pointerEvents = 'none'; // Prevent interaction with hidden elements
    }

    createExplosion(x, y, color) {
        for (let i = 0; i < 15; i++) {
            this.particles.push(new Particle(this, x, y, color));
        }
    }

    updatePlaying(deltaTime) {
        this.player.update(deltaTime);

        // Update Projectiles
        this.projectiles.forEach(p => p.update(deltaTime));
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);

        // Update Particles
        this.particles.forEach(p => p.update(deltaTime));
        this.particles = this.particles.filter(p => !p.markedForDeletion);

        // Enemy Shooting Logic
        this.enemyShootTimer -= deltaTime;
        if (this.enemyShootTimer <= 0) {
            this.enemyShoot();
            this.enemyShootTimer = this.enemyShootInterval;
        }

        // Enemy Diving Logic
        this.diveTimer -= deltaTime;
        if (this.diveTimer <= 0) {
            this.triggerEnemyDive();
            this.diveTimer = Math.random() * 2000 + 1000;
        }

        // Update Enemies
        let hitEdge = false;
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime);
            if (enemy.state === 'GRID') {
                enemy.x += 0.1 * deltaTime * this.enemyDirection;
                if (this.enemyDirection === 1 && enemy.x + enemy.width > this.width - 20) hitEdge = true;
                if (this.enemyDirection === -1 && enemy.x < 20) hitEdge = true;
            }
        });

        if (hitEdge) {
            this.enemyDirection *= -1;
            this.enemies.forEach(enemy => {
                if (enemy.state === 'GRID') {
                    enemy.y += 20;
                }
            });
        }

        // Collisions
        this.projectiles.forEach(projectile => {
            // Player vs Enemy Projectile
            if (projectile.direction === 1) { // 1 is enemy projectile (down)
                if (checkCollision(projectile, this.player)) {
                    projectile.markedForDeletion = true;
                    this.triggerGameOver();
                    this.createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, this.player.color);
                    this.sound.playExplosion();
                }
            }
            // Player Projectile vs Enemy
            else {
                this.enemies.forEach(enemy => {
                    if (!enemy.markedForDeletion && !projectile.markedForDeletion && checkCollision(projectile, enemy)) {
                        enemy.markedForDeletion = true;
                        projectile.markedForDeletion = true;
                        this.score += 100;
                        document.getElementById('score').innerText = this.score;
                        this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff0055'); // Specific color not working on image invader but needed for particles
                        this.sound.playExplosion();
                    }
                });
            }
        });

        this.enemies = this.enemies.filter(e => !e.markedForDeletion);

        if (this.enemies.length === 0) {
            this.initEnemies(); // Next wave
        }

        // Game Over Condition (Enemies reach bottom)
        if (this.enemies.some(e => e.y + e.height > this.player.y)) {
            this.triggerGameOver();
        }
    }

    draw(ctx) {
        if (this.gameState === 'PLAYING' || this.gameState === 'GAMEOVER') {
            this.player.draw(ctx);
            this.projectiles.forEach(p => p.draw(ctx));
            this.enemies.forEach(e => e.draw(ctx));
            this.particles.forEach(p => p.draw(ctx));
        }
        // Draw HUD or whatever
    }

    triggerGameOver() {
        this.gameState = 'GAMEOVER';
        this.sound.stopBGM();

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('spaceInvadersHighScore', this.highScore);
            this.updateHighScoreUI();
        }

        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('final-score').innerText = this.score;
        document.getElementById('ui-layer').style.pointerEvents = 'auto'; // allow interaction for restart
    }

    enemyShoot() {
        // Pick a random living enemy
        const livingEnemies = this.enemies.filter(e => !e.markedForDeletion);
        if (livingEnemies.length === 0) return;

        const shooter = livingEnemies[Math.floor(Math.random() * livingEnemies.length)];
        // Create projectile moving down (1)
        import('./entities/Projectile.js').then(({ Projectile }) => {
            // Using dynamic import to avoid circular dependency if not already imported, 
            // but Projectile is not imported in Game.js yet? Wait it is not imported!
            // Actually it is not imported in the top level. Let's fix that.
            // Oh wait, projectiles list handles it.
            // I need to import Projectile in Game.js first if it's not there.
            // It IS NOT in the imports list in Game.js currently?
            // Player imports it.
            // Let's assume I need to add the import or use the dynamic one.
            // Since I am already using multi_replace, I should add the import to the top.
            this.projectiles.push(new Projectile(this, shooter.x + shooter.width / 2, shooter.y + shooter.height, 1));
        });
    }

    triggerEnemyDive() {
        const livingEnemies = this.enemies.filter(e => e.state === 'GRID' && !e.markedForDeletion);
        if (livingEnemies.length === 0) return;

        const diver = livingEnemies[Math.floor(Math.random() * livingEnemies.length)];
        diver.startDive();
    }
}
