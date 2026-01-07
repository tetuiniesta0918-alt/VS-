import { Entity } from './Entity.js';

export class Projectile extends Entity {
    constructor(game, x, y, direction) { // direction: -1 for up, 1 for down
        super(game, x, y, 4, 15, direction === -1 ? '#00ff9d' : '#ff0055');
        this.direction = direction;
        this.speed = 0.8;
    }

    update(deltaTime) {
        this.y += this.speed * deltaTime * this.direction;

        if (this.y > this.game.height || this.y < -this.height) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();

        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        if (this.direction === -1) {
            // Player projectile - fancy laser
            const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.3, this.color);
            gradient.addColorStop(1, 'rgba(0, 255, 157, 0.3)');
            ctx.fillStyle = gradient;

            // Main beam
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Core (brighter center)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x + 1, this.y, 2, this.height * 0.6);
        } else {
            // Enemy projectile - red beam
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        ctx.restore();
    }
}

