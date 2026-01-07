import { Entity } from './Entity.js';

export class PowerUp extends Entity {
    constructor(game, x, y) {
        super(game, x, y, 20, 20, '#ffcc00');
        this.speed = 0.15; // Fall speed
        this.type = 'doubleShot';
    }

    update(deltaTime) {
        this.y += this.speed * deltaTime;

        // Mark for deletion if off screen
        if (this.y > this.game.height) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        // Draw a glowing star/power-up
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        // Star shape
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const spikes = 5;
        const outerRadius = this.width / 2;
        const innerRadius = this.width / 4;

        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}
