export class InputHandler {
    constructor() {
        this.keys = new Set();

        window.addEventListener('keydown', (e) => {
            this.keys.add(e.code);
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
        });

        this.setupTouchControls();
    }

    setupTouchControls() {
        const bindButton = (id, code) => {
            const btn = document.getElementById(id);
            if (!btn) return;

            const press = (e) => { e.preventDefault(); this.keys.add(code); };
            const release = (e) => { e.preventDefault(); this.keys.delete(code); };

            btn.addEventListener('mousedown', press);
            btn.addEventListener('mouseup', release);
            btn.addEventListener('touchstart', press, { passive: false });
            btn.addEventListener('touchend', release, { passive: false });
            btn.addEventListener('mouseleave', release); // Safety if sliding finger out
        };

        bindButton('btn-left', 'ArrowLeft');
        bindButton('btn-right', 'ArrowRight');
        bindButton('btn-fire', 'Space');
        bindButton('btn-start', 'Enter');
        bindButton('btn-restart', 'Enter');
        bindButton('btn-victory-restart', 'Enter');
        bindButton('btn-next-level', 'Enter');
    }

    isDown(code) {
        return this.keys.has(code);
    }
}
