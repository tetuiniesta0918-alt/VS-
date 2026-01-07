export class SoundSystem {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playTone(frequency, type, duration) {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playShoot() {
        this.playTone(600, 'square', 0.1);
        // Add a secondary slide down effect for "pew"
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playExplosion() {
        if (this.ctx.state === 'suspended') this.ctx.resume();

        // Simple noise approximation using many oscillators or a low frequency rumble
        const duration = 0.3;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + duration);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    startBGM() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.stopBGM();

        // Cynthia-style BGM with bass + arpeggio melody (mobile-friendly)
        // Using continuous oscillators with frequency modulation instead of sequencer

        // Bass oscillator
        this.bassOsc = this.ctx.createOscillator();
        this.bassGain = this.ctx.createGain();
        this.bassOsc.type = 'sawtooth';
        this.bassOsc.frequency.value = 73.42; // D2

        // Bass LFO for rhythm
        const bassLfo = this.ctx.createOscillator();
        bassLfo.type = 'square';
        bassLfo.frequency.value = 6; // Fast 6Hz pulse for intensity
        const bassLfoGain = this.ctx.createGain();
        bassLfoGain.gain.value = 30;
        bassLfo.connect(bassLfoGain);
        bassLfoGain.connect(this.bassOsc.frequency);

        // Bass filter
        const bassFilter = this.ctx.createBiquadFilter();
        bassFilter.type = 'lowpass';
        bassFilter.frequency.value = 400;
        bassFilter.Q.value = 3;

        this.bassOsc.connect(bassFilter);
        bassFilter.connect(this.bassGain);
        this.bassGain.connect(this.ctx.destination);
        this.bassGain.gain.value = 0.12;

        // Melody oscillator (high arpeggio feel)
        this.melodyOsc = this.ctx.createOscillator();
        this.melodyGain = this.ctx.createGain();
        this.melodyOsc.type = 'triangle';
        this.melodyOsc.frequency.value = 587.33; // D5

        // Melody LFO for arpeggio sweep
        const melodyLfo = this.ctx.createOscillator();
        melodyLfo.type = 'sine';
        melodyLfo.frequency.value = 8; // 8Hz for fast arpeggio feeling
        const melodyLfoGain = this.ctx.createGain();
        melodyLfoGain.gain.value = 200; // Wide sweep
        melodyLfo.connect(melodyLfoGain);
        melodyLfoGain.connect(this.melodyOsc.frequency);

        this.melodyOsc.connect(this.melodyGain);
        this.melodyGain.connect(this.ctx.destination);
        this.melodyGain.gain.value = 0.06;

        // Start all
        this.bassOsc.start();
        bassLfo.start();
        this.melodyOsc.start();
        melodyLfo.start();

        this.bgmNodes = [this.bassOsc, bassLfo, this.melodyOsc, melodyLfo, bassLfoGain, melodyLfoGain, bassFilter, this.bassGain, this.melodyGain];
    }

    stopBGM() {
        if (this.bgmNodes) {
            this.bgmNodes.forEach(node => {
                try { node.stop(); } catch (e) { }
                try { node.disconnect(); } catch (e) { }
            });
            this.bgmNodes = null;
        }
    }
}
