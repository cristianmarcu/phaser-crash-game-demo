export default class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.enabled) return;

    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  beep(freq = 440, duration = 0.08, type = "sine", volume = 0.04) {
    if (!this.enabled) return;

    this.init();

    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      this.ctx.currentTime + duration,
    );

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  click() {
    this.beep(700, 0.04, "square", 0.035);
  }

  tick() {
    this.beep(260, 0.025, "sine", 0.018);
  }

  cashOut() {
    [520, 720, 960].forEach((note, i) => {
      setTimeout(() => this.beep(note, 0.09, "triangle", 0.06), i * 90);
    });
  }

  crash() {
    [220, 160, 95].forEach((note, i) => {
      setTimeout(() => this.beep(note, 0.14, "sawtooth", 0.055), i * 120);
    });
  }
}
