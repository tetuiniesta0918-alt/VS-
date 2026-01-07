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
}
