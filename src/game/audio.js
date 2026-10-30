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
    gain.gain.linearRampToValueAtTime(0.45, this.ctx.currentTime + 4); // maxed up from 0.18

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

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.65);
  }

  scheduleRandomCreaks() {
    if (!this.ctx) return;
    const scheduleNext = () => {
      const delay = 3000 + Math.random() * 5000; // every 3-8s (was 8-22s)
      this.ambientTimer = setTimeout(() => {
        this.playCreak();
        scheduleNext();
      }, delay);
    };
    // First creak after 2s
    this.ambientTimer = setTimeout(() => { this.playCreak(); scheduleNext(); }, 2000);
  }

  playWhisper() {
    if (!this.ctx) return;
    // 5 layered noise bursts, louder
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const bufSize = this.ctx.sampleRate * 0.22;
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let j = 0; j < bufSize; j++) d[j] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filt = this.ctx.createBiquadFilter();
        filt.type = 'bandpass';
        filt.frequency.value = 1600 + Math.random() * 800;
        filt.Q.value = 5;
        const g = this.ctx.createGain();
        const t = this.ctx.currentTime;
        g.gain.setValueAtTime(0.22, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        src.connect(filt); filt.connect(g); g.connect(this.ctx.destination);
        src.start(t);
      }, i * 80);
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
    gain.gain.setValueAtTime(1.4, t);
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

        gain.gain.setValueAtTime(2.0, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.18);
        this.playNoise(0.18, 0.02, 300);
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

    gain.gain.setValueAtTime(2.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(t + 0.5);
    this.playNoise(0.6, 0.1, 400);
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

    screechGain.gain.setValueAtTime(1.0, t);
    screechGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    screech.connect(screechGain);
    screechGain.connect(this.ctx.destination);
    screech.start();
    screech.stop(t + 0.9);

    // Violent metal crunch noise
    this.playNoise(1.2, 0.05, 1200);

    // Blaring distorted car horn
    const horn1 = this.ctx.createOscillator();
    const horn2 = this.ctx.createOscillator();
    const hornGain = this.ctx.createGain();

    horn1.frequency.setValueAtTime(340, t + 0.15);
    horn2.frequency.setValueAtTime(415, t + 0.15);

    hornGain.gain.setValueAtTime(1.4, t + 0.15);
    hornGain.gain.setValueAtTime(1.4, t + 0.65);
    hornGain.gain.linearRampToValueAtTime(0.001, t + 0.85);

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
    const dur = 7.5; // Sustained horror sound that keeps going!

    // 1. Heavy Impact Sub-Bass Drone that holds and rumbles
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(130, t);
    sub.frequency.exponentialRampToValueAtTime(38, t + 0.5);
    sub.frequency.setValueAtTime(38, t + 0.5);
    sub.frequency.linearRampToValueAtTime(30, t + dur);

    const subFilter = this.ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(260, t);
    subFilter.frequency.exponentialRampToValueAtTime(90, t + dur);

    subGain.gain.setValueAtTime(3.2, t);
    subGain.gain.exponentialRampToValueAtTime(1.5, t + 0.8);
    subGain.gain.setValueAtTime(1.5, t + 4.0);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    sub.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(t);
    sub.stop(t + dur);

    // 2. Screaming Dissonant Cluster with Pitch LFO Tremolo
    const freqs = [550, 620, 780, 830, 1140, 1320, 1550];
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(9.5, t); // rapid terrifying vibrato
    lfoGain.gain.setValueAtTime(24, t);
    lfo.connect(lfoGain);
    lfo.start(t);
    lfo.stop(t + dur);

    freqs.forEach((f, idx) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = idx % 2 === 0 ? 'sawtooth' : 'square';
      o.frequency.setValueAtTime(f, t);
      lfoGain.connect(o.frequency);

      // Holds sustained loud volume for 4s, then ramps down to 7.5s
      g.gain.setValueAtTime(0.4, t);
      g.gain.linearRampToValueAtTime(0.45, t + 0.2);
      g.gain.setValueAtTime(0.4, t + 4.0);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);

      o.connect(g);
      g.connect(this.ctx.destination);
      o.start(t);
      o.stop(t + dur);
    });

    // 3. Sustained Noise Burst / Roaring Static
    const bufferSize = Math.floor(this.ctx.sampleRate * 4.8);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.45;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1900, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(750, t + 4.8);
    noiseFilter.Q.value = 2.2;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.9, t);
    noiseGain.gain.setValueAtTime(0.7, t + 3.2);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 4.8);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(t);
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
      osc.frequency.exponentialRampToValueAtTime(28, t + 0.15);
      gain.gain.setValueAtTime(1.8, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(t + 0.15);
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

  playFootstep() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // Hollow thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55 + Math.random() * 15, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 0.08);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
    // Subtle echo (hallway reverb feel)
    setTimeout(() => {
      if (!this.ctx) return;
      const t2 = this.ctx.currentTime;
      const o2 = this.ctx.createOscillator();
      const g2 = this.ctx.createGain();
      o2.type = 'sine';
      o2.frequency.value = 42;
      g2.gain.setValueAtTime(0.08, t2);
      g2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.1);
      o2.connect(g2); g2.connect(this.ctx.destination);
      o2.start(t2); o2.stop(t2 + 0.1);
    }, 110);
  }

  startBreathing(intervalMs = 3000) {
    this.stopBreathing();
    const breathe = () => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      // Inhale: rising filtered noise
      const bufSize = this.ctx.sampleRate * 0.6;
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filt = this.ctx.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.value = 900;
      filt.Q.value = 4;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.07, t + 0.3);
      g.gain.linearRampToValueAtTime(0, t + 0.6);
      src.connect(filt); filt.connect(g); g.connect(this.ctx.destination);
      src.start(t);
    };
    breathe();
    this.breatheTimer = setInterval(breathe, intervalMs);
  }

  stopBreathing() {
    if (this.breatheTimer) { clearInterval(this.breatheTimer); this.breatheTimer = null; }
  }

  playGhostRevealSting() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // High dissonant shriek
    [660, 700, 1050].forEach((f, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, t);
      o.frequency.linearRampToValueAtTime(f * 0.3, t + 0.7);
      g.gain.setValueAtTime(0.25, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(t); o.stop(t + 0.7);
    });
    this.playNoise(0.4, 0.03, 3000);
  }
}
