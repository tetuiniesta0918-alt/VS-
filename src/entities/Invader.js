import { Entity } from './Entity.js';

export class Invader extends Entity {
    static image = null;

    constructor(game, x, y) {
        super(game, x, y, 40, 50, '#ff0055');

        if (!Invader.image) {
            Invader.image = new Image();
            Invader.image.src = '/assets/fellaini.png';
            Invader.image.onload = () => console.log("Invader image loaded successfully");
            Invader.image.onerror = (e) => console.error("Failed to load invader image", e);
        }

        this.state = 'GRID'; // GRID, DIVING, RETURNING (maybe just DIVING for now)
        this.vx = 0;
        this.vy = 0;
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
        if (Invader.image && Invader.image.complete) {
            ctx.drawImage(Invader.image, this.x, this.y, this.width, this.height);
        } else {
            // Fallback while loading
            ctx.fillStyle = '#4a3b2a';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}
