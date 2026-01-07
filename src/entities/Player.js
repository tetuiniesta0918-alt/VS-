
import { Entity } from './Entity.js';

import { Projectile } from './Projectile.js';

export class Player extends Entity {
    constructor(game) {
        const width = 50;
        const height = 30;
        const x = game.width / 2 - width / 2;
        const y = game.height - height - 20;
        super(game, x, y, width, height, '#00ff9d');

        this.speed = 0.5; // pixels per ms
        this.shootTimer = 0;
        this.shootInterval = 300; // ms
    }

    update(deltaTime) {
        // Movement
        if (this.game.input.isDown('ArrowLeft') || this.game.input.isDown('KeyA')) {
            this.x -= this.speed * deltaTime;
        }
        if (this.game.input.isDown('ArrowRight') || this.game.input.isDown('KeyD')) {
            this.x += this.speed * deltaTime;
        }

        // Shooting
        if (this.shootTimer > 0) this.shootTimer -= deltaTime;
        if ((this.game.input.isDown('Space') || this.game.input.isDown('Enter')) && this.shootTimer <= 0) {
            this.shoot();
        }

        // Clamp to screen
        if (this.x < 0) this.x = 0;
        if (this.x > this.game.width - this.width) this.x = this.game.width - this.width;
    }

    shoot() {
        // Shoot from center
        const projectileX = this.x + this.width / 2 - 2;
        this.game.projectiles.push(new Projectile(this.game, projectileX, this.y, -1));
        this.shootTimer = this.shootInterval;

        this.game.sound.playShoot();
    }

    draw(ctx) {
        // Draw a simple ship shape instead of a box
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height - 10);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // Engine glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}
