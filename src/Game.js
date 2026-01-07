import { InputHandler } from './systems/InputHandler.js';
import { Player } from './entities/Player.js';
import { Invader } from './entities/Invader.js';
import { Particle } from './entities/Particle.js';
import { Projectile } from './entities/Projectile.js';
import { PowerUp } from './entities/PowerUp.js';
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
        this.powerUps = [];
        this.enemyDirection = 1; // 1 = right, -1 = left
        this.enemyStepDown = false;

        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('spaceInvadersHighScore')) || 0;
        this.gameState = 'WAITING'; // WAITING, PLAYING, GAMEOVER, VICTORY, LEVEL_CLEAR
        this.level = 1;
        this.maxLevel = 5;

        // Enemy Shooting (will scale with level)
        this.enemyShootTimer = 0;
        this.baseEnemyShootInterval = 1500;
        this.enemyShootInterval = this.baseEnemyShootInterval;

        // Diving (will scale with level)
        this.diveTimer = 0;
        this.baseDiveInterval = 3000;
        this.diveInterval = this.baseDiveInterval;

        // Enemy Speed (will scale with level)
        this.baseEnemySpeed = 0.08;
        this.enemySpeed = this.baseEnemySpeed;

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

        // Level 1: all 1HP, Level 2: top 1 row 2HP, Level 3: top 2 rows, Level 4: top 3, Level 5: all 2HP
        const toughRows = Math.min(this.level - 1, rows);

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const hp = (y < toughRows) ? 2 : 1;
                this.enemies.push(new Invader(this, 100 + x * 60, 50 + y * 50, hp));
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
        } else if (this.gameState === 'VICTORY') {
            if (this.input.isDown('Enter')) {
                this.startGame();
            }
        } else if (this.gameState === 'LEVEL_CLEAR') {
            // Wait for player to click Next Level button
            if (this.input.isDown('Enter')) {
                this.proceedToNextLevel();
            }
        }
    }

    startGame() {
        this.gameState = 'PLAYING';
        this.score = 0;
        this.level = 1;
        this.highScore = parseInt(localStorage.getItem('spaceInvadersHighScore')) || 0;
        this.projectiles = [];
        this.particles = [];
        this.powerUps = [];
        this.powerUpDropCount = 0; // Track drops per stage (max 3)
        this.player = new Player(this);
        this.enemyDirection = 1;
        this.enemyStepDown = false;
        this.applyLevelDifficulty();
        this.initEnemies();

        this.sound.startBGM();

        document.getElementById('score').innerText = this.score;
        this.updateLevelUI();
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        const victoryScreen = document.getElementById('victory-screen');
        if (victoryScreen) victoryScreen.classList.add('hidden');
        const clearScreen = document.getElementById('level-clear-screen');
        if (clearScreen) clearScreen.classList.add('hidden');
        document.getElementById('ui-layer').style.pointerEvents = 'none';
    }

    applyLevelDifficulty() {
        // Increase difficulty with each level
        const difficultyMultiplier = 1 + (this.level - 1) * 0.15;
        this.enemySpeed = this.baseEnemySpeed * difficultyMultiplier;
        this.enemyShootInterval = this.baseEnemyShootInterval / difficultyMultiplier;
        this.diveInterval = this.baseDiveInterval / difficultyMultiplier;
    }

    updateLevelUI() {
        const el = document.getElementById('level');
        if (el) el.innerText = this.level;
    }

    nextLevel() {
        if (this.level >= this.maxLevel) {
            this.triggerVictory();
            return;
        }
        // Show level clear screen
        this.gameState = 'LEVEL_CLEAR';
        this.sound.stopBGM();
        document.getElementById('level-clear-screen').classList.remove('hidden');
        document.getElementById('clear-level').innerText = this.level;
        document.getElementById('clear-score').innerText = this.score;
        document.getElementById('ui-layer').style.pointerEvents = 'auto';
    }

    proceedToNextLevel() {
        this.level++;
        this.gameState = 'PLAYING';
        this.powerUpDropCount = 0; // Reset for new stage
        document.getElementById('level-clear-screen').classList.add('hidden');
        document.getElementById('ui-layer').style.pointerEvents = 'none';
        this.applyLevelDifficulty();
        this.initEnemies();
        this.updateLevelUI();
        this.sound.startBGM();
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
                enemy.x += this.enemySpeed * deltaTime * this.enemyDirection;
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
                        projectile.markedForDeletion = true;
                        const killed = enemy.takeDamage();

                        if (killed) {
                            this.score += 100;
                            document.getElementById('score').innerText = this.score;
                            this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff0055');
                            this.sound.playExplosion();

                            // Drop power-up (max 3 per stage)
                            if (this.powerUpDropCount < 3 && Math.random() < 0.15) {
                                this.powerUps.push(new PowerUp(this, enemy.x + enemy.width / 2 - 10, enemy.y));
                                this.powerUpDropCount++;
                            }
                        }
                    }
                });
            }
        });

        this.enemies = this.enemies.filter(e => !e.markedForDeletion);

        if (this.enemies.length === 0) {
            this.nextLevel(); // Advance to next level
        }

        // Game Over Condition (Enemies reach bottom)
        if (this.enemies.some(e => e.y + e.height > this.player.y)) {
            this.triggerGameOver();
        }

        // Update Power-ups
        this.powerUps.forEach(p => p.update(deltaTime));
        this.powerUps = this.powerUps.filter(p => !p.markedForDeletion);

        // Power-up collision with player
        this.powerUps.forEach(powerUp => {
            if (checkCollision(powerUp, this.player)) {
                powerUp.markedForDeletion = true;
                this.player.activateDoubleShot();
            }
        });
    }

    draw(ctx) {
        if (this.gameState === 'PLAYING' || this.gameState === 'GAMEOVER' || this.gameState === 'VICTORY' || this.gameState === 'LEVEL_CLEAR') {
            this.player.draw(ctx);
            this.projectiles.forEach(p => p.draw(ctx));
            this.enemies.forEach(e => e.draw(ctx));
            this.particles.forEach(p => p.draw(ctx));
            this.powerUps.forEach(p => p.draw(ctx));
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

    triggerVictory() {
        this.gameState = 'VICTORY';
        this.sound.stopBGM();

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('spaceInvadersHighScore', this.highScore);
            this.updateHighScoreUI();
        }

        document.getElementById('victory-screen').classList.remove('hidden');
        document.getElementById('victory-score').innerText = this.score;
        document.getElementById('ui-layer').style.pointerEvents = 'auto';
    }
}
