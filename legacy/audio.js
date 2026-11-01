// ============================================================================
// AUDIO ENGINE: Romantic Garden Piano + Atmos Pad Synth & Custom MP3 Player
// ============================================================================

// Jika Anda punya file MP3 sendiri (misal './lagu-pernikahan.mp3'), isi di sini:
export const DEFAULT_MP3_URL = '';

export class GardenAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.reverbNode = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.loopTimer = null;
    this.stepIndex = 0;

    // External HTML5 Audio for custom MP3
    this.audioElement = new Audio();
    this.audioElement.loop = true;
    this.audioElement.preload = 'auto';
    this.useCustomMp3 = false;

    if (DEFAULT_MP3_URL) {
      this.audioElement.src = DEFAULT_MP3_URL;
      this.useCustomMp3 = true;
    }

    // Canon-inspired Romantic Progression in D Major (warm piano + pad notes in Hz)
    this.progression = [
      { bass: 146.83, chord: [293.66, 369.99, 440.00, 587.33] }, // D major
      { bass: 110.00, chord: [220.00, 277.18, 329.63, 440.00] }, // A major
      { bass: 123.47, chord: [246.94, 293.66, 369.99, 493.88] }, // Bm7
      { bass: 92.50,  chord: [185.00, 277.18, 369.99, 440.00] }, // F#m7
      { bass: 98.00,  chord: [196.00, 246.94, 293.66, 392.00] }, // G major
      { bass: 146.83, chord: [220.00, 293.66, 369.99, 440.00] }, // D/F#
      { bass: 98.00,  chord: [196.00, 246.94, 293.66, 440.00] }, // Gmaj9
      { bass: 110.00, chord: [220.00, 277.18, 329.63, 392.00] }  // A7sus4
    ];
  }

  initContext() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.55;

    // Create lush stereo algorithmic impulse reverb for dreamy Atmos feel
    this.reverbNode = this.createGardenReverb(2.8, 2.2);
    const wetGain = this.ctx.createGain();
    wetGain.gain.value = 0.45;

    this.masterGain.connect(this.ctx.destination);
    this.masterGain.connect(this.reverbNode);
    this.reverbNode.connect(wetGain);
    wetGain.connect(this.ctx.destination);
  }

  createGardenReverb(duration, decay) {
    const rate = this.ctx.sampleRate;
    const length = rate * duration;
    const impulse = this.ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    const convolver = this.ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  }

  async start() {
    this.initContext();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.isPlaying = true;
    this.isMuted = false;

    if (this.useCustomMp3) {
      this.audioElement.volume = 0.75;
      this.audioElement.play().catch(() => {});
      return;
    }

    this.playOpeningSparkle();
    this.startGenerativeLoop();
  }

  startGenerativeLoop() {
    if (this.loopTimer) clearInterval(this.loopTimer);

    const playBar = () => {
      if (!this.isPlaying || this.isMuted || this.useCustomMp3) return;
      const bar = this.progression[this.stepIndex % this.progression.length];
      this.stepIndex++;

      // 1. Warm Atmos Pad Swell
      this.playWarmPad(bar.bass, 2.7);
      this.playWarmPad(bar.chord[0], 2.7, 0.045);

      // 2. Delicate Romantic Arpeggio Notes
      bar.chord.forEach((freq, idx) => {
        setTimeout(() => {
          if (this.isPlaying && !this.isMuted && !this.useCustomMp3) {
            this.playPianoNote(freq, 1.8, 0.085);
          }
        }, idx * 340);
      });

      // Occasional high music-box sparkle note
      setTimeout(() => {
        if (this.isPlaying && !this.isMuted && !this.useCustomMp3) {
          const topFreq = bar.chord[bar.chord.length - 1] * 2;
          this.playPianoNote(topFreq, 1.5, 0.035);
        }
      }, 1150);
    };

    playBar();
    this.loopTimer = setInterval(playBar, 2600);
  }

  playPianoNote(freq, duration = 1.6, peakGain = 0.08) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 2, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 3.5, now);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.2, now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.05);
    osc2.stop(now + duration + 0.05);
  }

  playWarmPad(freq, duration = 2.8, peakGain = 0.065) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(360, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.1);
  }

  // Triggered when gate opens or user passes a 3D milestone
  playOpeningSparkle() {
    if (!this.ctx || this.isMuted) return;
    const chimeNotes = [587.33, 739.99, 880.0, 1174.66, 1479.98];
    chimeNotes.forEach((f, i) => {
      setTimeout(() => this.playPianoNote(f, 1.4, 0.045), i * 110);
    });
  }

  // Load user-selected MP3 file from disk
  loadCustomFile(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    this.useCustomMp3 = true;
    if (this.loopTimer) clearInterval(this.loopTimer);

    this.audioElement.src = url;
    this.audioElement.muted = this.isMuted;
    if (this.isPlaying && !this.isMuted) {
      this.audioElement.play().catch(() => {});
    }
  }

  toggleMute() {
    if (!this.isPlaying) {
      this.start();
      return true;
    }

    this.isMuted = !this.isMuted;
    if (this.useCustomMp3) {
      this.audioElement.muted = this.isMuted;
      if (!this.isMuted) this.audioElement.play().catch(() => {});
    } else if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0.0001 : 0.55, now, 0.15);
    }
    return !this.isMuted;
  }
}
