import { Game } from './Game.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    
    // Set fixed game resolution, scale with CSS
    canvas.width = 800;
    canvas.height = 600;

    const game = new Game(canvas);
    game.start();
});
