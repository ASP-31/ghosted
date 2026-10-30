export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.heartbeatTimer = null;
    this.droneNode = null;
    this.ambientTimer = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.startAmbientDrone();
    this.scheduleRandomCreaks();
  }

  startAmbientDrone() {
    if (!this.ctx || this.droneNode) return;
    // Low ominous sub-bass drone
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.value = 38;
    osc2.type = 'sine';
    osc2.frequency.value = 41.5; // slight detuning creates unsettling beating

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 4); // slow fade in

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);
    osc1.start();
    osc2.start();
    this.droneNode = { osc1, osc2, gain };
  }

  stopAmbientDrone() {
    if (!this.droneNode || !this.ctx) return;
    const { osc1, osc2, gain } = this.droneNode;
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);
    setTimeout(() => { try { osc1.stop(); osc2.stop(); } catch(_){} }, 1600);
    this.droneNode = null;
  }

  playCreak() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 320 + Math.random() * 180;
    filter.Q.value = 8;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180 + Math.random() * 60, t);
    osc.frequency.linearRampToValueAtTime(120 + Math.random() * 40, t + 0.5);

    gain.gain.setValueAtTime(0.04, t);
    gain.gain.linearRampToValueAtTime(0.09, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.55);
  }

  scheduleRandomCreaks() {
    if (!this.ctx) return;
    const scheduleNext = () => {
      const delay = 8000 + Math.random() * 14000; // every 8-22 seconds
      this.ambientTimer = setTimeout(() => {
        this.playCreak();
        scheduleNext();
      }, delay);
    };
    // First creak after ~6 seconds
    this.ambientTimer = setTimeout(() => { this.playCreak(); scheduleNext(); }, 6000);
  }

  playWhisper() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // Layered noise bursts to simulate a distant whisper
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.playNoise(0.18, 0.03, 1800 + Math.random() * 600);
      }, i * 90);
    }
  }

  playNoise(duration, decay = 0.05, filterFreq = 800) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;

    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  playStaticGlitch() {
    this.init();
    if (!this.ctx) return;
    this.playNoise(0.25, 0.05, 3000);
  }

  playDoorKnock() {
    this.init();
    if (!this.ctx) return;
    [0, 220, 440].forEach((delay) => {
      setTimeout(() => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);

        gain.gain.setValueAtTime(1.0, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.15);
        this.playNoise(0.12, 0.02, 300);
      }, delay);
    });
  }

  playDoorSlam() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.4);

    gain.gain.setValueAtTime(1.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(t + 0.4);
    this.playNoise(0.4, 0.1, 400);
  }

  playCrashSound() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Screeching tires
    const screech = this.ctx.createOscillator();
    const screechGain = this.ctx.createGain();
    screech.type = 'sawtooth';
    screech.frequency.setValueAtTime(1200, t);
    screech.frequency.linearRampToValueAtTime(2400, t + 0.25);
    screech.frequency.exponentialRampToValueAtTime(400, t + 0.7);

    screechGain.gain.setValueAtTime(0.4, t);
    screechGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    screech.connect(screechGain);
    screechGain.connect(this.ctx.destination);
    screech.start();
    screech.stop(t + 0.7);

    // Violent metal crunch noise
    this.playNoise(0.8, 0.05, 1200);

    // Blaring distorted car horn cutting abruptly
    const horn1 = this.ctx.createOscillator();
    const horn2 = this.ctx.createOscillator();
    const hornGain = this.ctx.createGain();

    horn1.frequency.setValueAtTime(340, t + 0.15);
    horn2.frequency.setValueAtTime(415, t + 0.15);

    hornGain.gain.setValueAtTime(0.6, t + 0.15);
    hornGain.gain.setValueAtTime(0.6, t + 0.65);
    hornGain.gain.linearRampToValueAtTime(0.001, t + 0.75);

    horn1.connect(hornGain);
    horn2.connect(hornGain);
    hornGain.connect(this.ctx.destination);

    horn1.start(t + 0.15);
    horn2.start(t + 0.15);
    horn1.stop(t + 0.75);
    horn2.stop(t + 0.75);
  }

  playJumpscareStinger() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Low boom
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.frequency.setValueAtTime(90, t);
    sub.frequency.exponentialRampToValueAtTime(25, t + 1.2);
    subGain.gain.setValueAtTime(1.5, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start();
    sub.stop(t + 1.2);

    // Dissonant screech
    [780, 820, 1150].forEach((f) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start();
      o.stop(t + 0.9);
    });

    this.playNoise(0.5, 0.05, 2500);
  }

  startHeartbeat(intervalMs = 800) {
    this.init();
    this.stopHeartbeat();
    const beat = () => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.12);
      gain.gain.setValueAtTime(0.8, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(t + 0.12);
    };
    beat();
    this.heartbeatTimer = setInterval(beat, intervalMs);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}
