import { Entity } from './Entity.js';

export class Invader extends Entity {
    static image = null;

    constructor(game, x, y, hp = 1) {
        super(game, x, y, 40, 50, '#ff0055');
        this.hp = hp; // HP for tough enemies
        this.maxHp = hp;

        if (!Invader.image) {
            Invader.image = new Image();
            Invader.image.src = '/assets/fellaini.png';
            Invader.image.onload = () => console.log("Invader image loaded successfully");
            Invader.image.onerror = (e) => console.error("Failed to load invader image", e);
        }

        this.state = 'GRID'; // GRID, DIVING, RETURNING
        this.vx = 0;
        this.vy = 0;
    }

    takeDamage() {
        this.hp--;
        if (this.hp <= 0) {
            this.markedForDeletion = true;
            return true; // Enemy killed
        }
        return false; // Enemy still alive
    }

    startDive() {
        this.state = 'DIVING';
        this.vy = 0.2;
        // Aim broadly at player? Or just weird curve?
        // Let's do simple sine wave dive
        this.diveXAmount = (Math.random() - 0.5) * 4;
    }

    update(deltaTime) {
        if (this.state === 'DIVING') {
            this.y += this.vy * deltaTime;
            this.x += Math.sin(this.y * 0.05) * 2; // Wavy movement

            // If goes off bottom, wrap to top or delete? 
            // Classic behavior: wrap to top and rejoin? Too complex for now.
            // Let's just let them fall off and respawn at top loosely, or just die?
            // Let's re-enter from top.
            if (this.y > this.game.height) {
                this.y = -50;
                this.state = 'GRID'; // Rejoin grid logic will catch it
                // Actually grid logic overrides position. We need it to snap back to grid slot?
                // For simplicity, DIVING invaders just keep falling until they hit bottom, then reappear at their original grid slot (if we tracked it).
                // Let's just have them wrap to top and re-enter grid state immediately to be picked up by grid logic.
                // But grid logic uses relative movement.
                // Let's just set y = 0 and back to GRID. It might look jumpy but "good enough" for MVP.
                // Better: simple diving attacks that just kill the invader if they miss? No that makes wave unfinishable.
                // Let's return to grid state.
                this.y = 0;
                this.state = 'GRID';
            }
        }
    }

    draw(ctx) {
        ctx.save();

        // 2HP enemies have a red glow and shield overlay
        if (this.maxHp >= 2) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.hp === 2 ? '#ff0000' : '#ff6600';
        }

        if (Invader.image && Invader.image.complete) {
            ctx.drawImage(Invader.image, this.x, this.y, this.width, this.height);

            // Shield indicator for 2HP enemies
            if (this.maxHp >= 2 && this.hp === 2) {
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 3;
                ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);

                // HP indicator
                ctx.fillStyle = '#ff0000';
                ctx.font = 'bold 12px Arial';
                ctx.fillText('×2', this.x + this.width - 15, this.y + 12);
            }
        } else {
            // Fallback while loading
            ctx.fillStyle = this.maxHp >= 2 ? '#8b0000' : '#4a3b2a';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        ctx.restore();
    }
}
