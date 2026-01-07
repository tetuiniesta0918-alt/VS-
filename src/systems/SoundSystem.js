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

        this.bgmNodes = [];
        const tempo = 170; // High tempo for intense battle
        const self = this;

        // Simple sequencer function
        const lookahead = 25.0; // How frequently to call scheduling function (in milliseconds)
        const scheduleAheadTime = 0.1; // How far ahead to schedule audio (sec)
        let nextNoteTime = this.ctx.currentTime;
        let noteIndex = 0;

        // "Champion" style intro/loop pattern (Simplified representation)
        // D minorish, driving
        const bassLine = [
            38, 38, 41, 41, 43, 43, 41, 41, // D, F, G, F
            38, 38, 41, 41, 43, 43, 45, 45  // D, F, G, A
        ];

        const melodyLine = [
            // Fast arpeggios simulation (E, G, B, E...)
            74, 0, 77, 0, 79, 0, 81, 0,
            74, 0, 77, 0, 79, 0, 77, 0
        ];

        function scheduler() {
            while (nextNoteTime < self.ctx.currentTime + scheduleAheadTime) {
                scheduleNote(noteIndex, nextNoteTime);
                nextNote();
            }
            if (self.bgmTimeout) clearTimeout(self.bgmTimeout);
            self.bgmTimeout = setTimeout(scheduler, lookahead);
        }

        function nextNote() {
            const secondsPerBeat = 60.0 / tempo;
            nextNoteTime += 0.25 * secondsPerBeat; // 16th notes
            noteIndex++;
            if (noteIndex >= 16) noteIndex = 0;
        }

        function scheduleNote(beatNumber, time) {
            // Bass
            const bassOsc = self.ctx.createOscillator();
            const bassGain = self.ctx.createGain();
            bassOsc.type = 'sawtooth';
            const bassNote = bassLine[beatNumber % 16];
            if (bassNote) {
                bassOsc.frequency.value = 440 * Math.pow(2, (bassNote - 69) / 12);

                // Filter for "acid" bass sound
                const filter = self.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.Q.value = 5;
                filter.frequency.setValueAtTime(400, time);
                filter.frequency.exponentialRampToValueAtTime(3000, time + 0.1);

                bassOsc.connect(filter);
                filter.connect(bassGain);
                bassGain.connect(self.ctx.destination);

                bassGain.gain.setValueAtTime(0.15, time);
                bassGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

                bassOsc.start(time);
                bassOsc.stop(time + 0.15);
            }

            // Piano/Synth Lead (High arpeggios)
            const melodyOsc = self.ctx.createOscillator();
            const melodyGain = self.ctx.createGain();
            melodyOsc.type = 'triangle'; // Closer to piano/bell
            const melodyNote = melodyLine[beatNumber % 16];

            if (melodyNote > 0) {
                melodyOsc.frequency.value = 440 * Math.pow(2, (melodyNote - 69) / 12);
                melodyOsc.connect(melodyGain);
                melodyGain.connect(self.ctx.destination);

                melodyGain.gain.setValueAtTime(0.0, time);
                melodyGain.gain.linearRampToValueAtTime(0.1, time + 0.01);
                melodyGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

                melodyOsc.start(time);
                melodyOsc.stop(time + 0.2);
            }

            // Drum (Hi-hat click) every note to keep rhythm
            const noiseOsc = self.ctx.createOscillator(); // Using high sine for simple hat for now to save CPU
            // Actually buffer noise is better but let's stick to osc
            const drumGain = self.ctx.createGain();
            noiseOsc.type = 'square';
            noiseOsc.frequency.value = 8000;
            noiseOsc.connect(drumGain);
            drumGain.connect(self.ctx.destination);
            drumGain.gain.setValueAtTime(0.02, time);
            drumGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
            noiseOsc.start(time);
            noiseOsc.stop(time + 0.05);
        }

        this.bgmTimeout = setTimeout(scheduler, lookahead);
        this.isPlaying = true;
    }

    stopBGM() {
        if (this.bgmTimeout) {
            clearTimeout(this.bgmTimeout);
            this.bgmTimeout = null;
        }
        this.isPlaying = false;
        // Nodes are created per note and stop automatically, so just stopping scheduler is enough
    }
}
