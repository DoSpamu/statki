// ─── Web Audio API — synteza dźwięków w stylu militarnym / retro-elektronicznym ────

let _ctx: AudioContext | null = null;

// Inicjalizuj kontekst po interakcji użytkownika (polityka autoplay przeglądarek)
function ctx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') void _ctx.resume();
  return _ctx;
}

// ─── Ustawienia globalne ──────────────────────────────────────────────────────

let _muted  = localStorage.getItem('bf_muted')  === 'true';
let _volume = parseFloat(localStorage.getItem('bf_volume') ?? '0.65');

export function isMuted(): boolean { return _muted; }
export function setMuted(v: boolean): void {
  _muted = v;
  localStorage.setItem('bf_muted', String(v));
}
export function getVolume(): number { return _volume; }
export function setVolume(v: number): void {
  _volume = Math.max(0, Math.min(1, v));
  localStorage.setItem('bf_volume', String(_volume));
}

// ─── Pomocnicze ───────────────────────────────────────────────────────────────

// Wyjście z kompresorem dynamiki (zapobiega przesterowaniu)
let _compressor: DynamicsCompressorNode | null = null;
function dest(): AudioNode {
  const c = ctx();
  if (!_compressor) {
    _compressor = c.createDynamicsCompressor();
    _compressor.threshold.value = -12;
    _compressor.knee.value = 6;
    _compressor.ratio.value = 4;
    _compressor.connect(c.destination);
  }
  return _compressor;
}

// Master gain z aktualną głośnością
function masterGain(vol = 1): GainNode {
  const c = ctx();
  const g = c.createGain();
  g.gain.value = _volume * vol;
  g.connect(dest());
  return g;
}

// Bufor białego szumu o podanej długości
function noiseBuffer(duration: number): AudioBufferSourceNode {
  const c = ctx();
  const size = Math.ceil(c.sampleRate * duration);
  const buf = c.createBuffer(1, size, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  return src;
}

// ─── Efekty ───────────────────────────────────────────────────────────────────

// Kliknięcie UI — krótki elektroniczny beep
export function playClick(): void {
  if (_muted) return;
  const c = ctx(); const t = c.currentTime;
  const o = c.createOscillator(); const g = masterGain(0.4);
  o.type = 'square';
  o.frequency.setValueAtTime(900, t);
  o.frequency.exponentialRampToValueAtTime(550, t + 0.05);
  g.gain.setValueAtTime(_volume * 0.07, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  o.connect(g); o.start(t); o.stop(t + 0.06);
}

// Postawienie statku — mechaniczny "klik + thunk"
export function playPlaceShip(): void {
  if (_muted) return;
  const c = ctx(); const t = c.currentTime;

  // Wysokie kliknięcie
  const o1 = c.createOscillator(); const g1 = masterGain(0.8);
  o1.type = 'sawtooth';
  o1.frequency.setValueAtTime(480, t);
  o1.frequency.exponentialRampToValueAtTime(180, t + 0.07);
  g1.gain.setValueAtTime(_volume * 0.18, t);
  g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  o1.connect(g1); o1.start(t); o1.stop(t + 0.09);

  // Głuchy "thunk" (potwierdza osadzenie)
  const o2 = c.createOscillator(); const g2 = masterGain(0.7);
  o2.type = 'sine';
  o2.frequency.setValueAtTime(130, t + 0.03);
  o2.frequency.exponentialRampToValueAtTime(55, t + 0.15);
  g2.gain.setValueAtTime(_volume * 0.28, t + 0.03);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o2.connect(g2); o2.start(t + 0.03); o2.stop(t + 0.18);
}

// Losowe rozmieszczenie — mechaniczny sweep
export function playRandomize(): void {
  if (_muted) return;
  const c = ctx(); const t = c.currentTime;
  // Szybkie serie kliknięć (symulacja wielu statków naraz)
  for (let i = 0; i < 5; i++) {
    const delay = i * 0.055;
    const o = c.createOscillator(); const g = masterGain(0.4);
    o.type = 'square';
    o.frequency.setValueAtTime(300 + i * 80, t + delay);
    o.frequency.exponentialRampToValueAtTime(100 + i * 30, t + delay + 0.05);
    g.gain.setValueAtTime(_volume * 0.1, t + delay);
    g.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.06);
    o.connect(g); o.start(t + delay); o.stop(t + delay + 0.06);
  }
}

// Potwierdzenie gotowości — dwa rosnące beepy
export function playReady(): void {
  if (_muted) return;
  const c = ctx(); const t = c.currentTime;
  [660, 990].forEach((freq, i) => {
    const o = c.createOscillator(); const g = masterGain(0.6);
    o.type = 'square';
    o.frequency.value = freq;
    g.gain.setValueAtTime(_volume * 0.12, t + i * 0.19);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.19 + 0.15);
    o.connect(g); o.start(t + i * 0.19); o.stop(t + i * 0.19 + 0.15);
  });
}

// Strzał — krótki "bang" przed wynikiem
export function playFire(): void {
  if (_muted) return;
  const c = ctx(); const t = c.currentTime;

  // Opadający oscylator (huk)
  const o = c.createOscillator(); const g = masterGain(0.9);
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(340, t);
  o.frequency.exponentialRampToValueAtTime(70, t + 0.13);
  g.gain.setValueAtTime(_volume * 0.32, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  o.connect(g); o.start(t); o.stop(t + 0.16);

  // Krótki wybuch szumu
  const noise = noiseBuffer(0.1);
  const nf = c.createBiquadFilter(); nf.type = 'bandpass';
  nf.frequency.value = 2200; nf.Q.value = 0.7;
  const ng = masterGain(0.6);
  ng.gain.setValueAtTime(_volume * 0.22, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
  noise.connect(nf); nf.connect(ng); noise.start(t);
}

// Trafienie w statek — eksplozja
export function playHit(): void {
  if (_muted) return;
  const c = ctx(); const t = c.currentTime;

  // Niskie "boom"
  const o = c.createOscillator(); const g = masterGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(200, t);
  o.frequency.exponentialRampToValueAtTime(38, t + 0.42);
  g.gain.setValueAtTime(_volume * 0.65, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.48);
  o.connect(g); o.start(t); o.stop(t + 0.48);

  // Szum eksplozji z filtrem
  const noise = noiseBuffer(0.38);
  const nf = c.createBiquadFilter(); nf.type = 'lowpass';
  nf.frequency.setValueAtTime(3500, t);
  nf.frequency.exponentialRampToValueAtTime(280, t + 0.35);
  const ng = masterGain(0.85);
  ng.gain.setValueAtTime(_volume * 0.55, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
  noise.connect(nf); nf.connect(ng); noise.start(t);

  // Ostry "crack" na początku
  const o2 = c.createOscillator(); const g2 = masterGain(0.8);
  o2.type = 'sawtooth';
  o2.frequency.setValueAtTime(1100, t);
  o2.frequency.exponentialRampToValueAtTime(240, t + 0.055);
  g2.gain.setValueAtTime(_volume * 0.42, t);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.065);
  o2.connect(g2); o2.start(t); o2.stop(t + 0.065);
}

// Strzał przeciwnika w moją planszę — mniejszy dźwięk trafienia
export function playIncomingHit(): void {
  if (_muted) return;
  const c = ctx(); const t = c.currentTime;

  const o = c.createOscillator(); const g = masterGain(0.7);
  o.type = 'sine';
  o.frequency.setValueAtTime(160, t);
  o.frequency.exponentialRampToValueAtTime(30, t + 0.35);
  g.gain.setValueAtTime(_volume * 0.5, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
  o.connect(g); o.start(t); o.stop(t + 0.38);

  const noise = noiseBuffer(0.28);
  const nf = c.createBiquadFilter(); nf.type = 'lowpass';
  nf.frequency.value = 2000;
  const ng = masterGain(0.65);
  ng.gain.setValueAtTime(_volume * 0.4, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  noise.connect(nf); nf.connect(ng); noise.start(t);
}

// Chybienie — plusk wody / ping sonaru
export function playMiss(): void {
  if (_muted) return;
  const c = ctx(); const t = c.currentTime;

  // Ping sonaru — opadający ton
  const o = c.createOscillator(); const g = masterGain(0.65);
  o.type = 'sine';
  o.frequency.setValueAtTime(1300, t);
  o.frequency.exponentialRampToValueAtTime(380, t + 0.3);
  g.gain.setValueAtTime(_volume * 0.18, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
  o.connect(g); o.start(t); o.stop(t + 0.32);

  // Plusk wody — szum pasmowy
  const noise = noiseBuffer(0.22);
  const nf = c.createBiquadFilter(); nf.type = 'bandpass';
  nf.frequency.setValueAtTime(1600, t + 0.04);
  nf.Q.value = 2.5;
  const ng = masterGain(0.5);
  ng.gain.setValueAtTime(_volume * 0.14, t + 0.04);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
  noise.connect(nf); nf.connect(ng); noise.start(t + 0.04);
}

// Zatopiony statek — potężna eksplozja + metaliczny zgrzyt
export function playSunk(): void {
  if (_muted) return;
  const c = ctx(); const t = c.currentTime;

  // Głęboki boom (niższy i dłuższy niż hit)
  const o = c.createOscillator(); const g = masterGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(130, t);
  o.frequency.exponentialRampToValueAtTime(22, t + 0.85);
  g.gain.setValueAtTime(_volume * 0.85, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
  o.connect(g); o.start(t); o.stop(t + 0.9);

  // Rozległy szum eksplozji
  const noise = noiseBuffer(0.7);
  const nf = c.createBiquadFilter(); nf.type = 'lowpass';
  nf.frequency.setValueAtTime(4500, t);
  nf.frequency.exponentialRampToValueAtTime(180, t + 0.65);
  const ng = masterGain(0.9);
  ng.gain.setValueAtTime(_volume * 0.75, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  noise.connect(nf); nf.connect(ng); noise.start(t);

  // Metaliczny zgrzyt (statek tonie)
  const o2 = c.createOscillator(); const g2 = masterGain(0.5);
  o2.type = 'sawtooth';
  o2.frequency.setValueAtTime(450, t + 0.12);
  o2.frequency.exponentialRampToValueAtTime(90, t + 0.65);
  g2.gain.setValueAtTime(_volume * 0.28, t + 0.12);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.68);
  o2.connect(g2); o2.start(t + 0.12); o2.stop(t + 0.68);

  // Drugi huk (echo)
  const o3 = c.createOscillator(); const g3 = masterGain(0.4);
  o3.type = 'sine';
  o3.frequency.setValueAtTime(90, t + 0.25);
  o3.frequency.exponentialRampToValueAtTime(18, t + 0.75);
  g3.gain.setValueAtTime(_volume * 0.4, t + 0.25);
  g3.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
  o3.connect(g3); o3.start(t + 0.25); o3.stop(t + 0.8);
}

// Fanfara zwycięstwa — militarne arpegio dur C-E-G-C
export function playVictory(): void {
  if (_muted) return;
  const c = ctx(); const t = c.currentTime;

  const notes = [
    { f: 523, d: 0.18, vol: 0.14 },  // C5
    { f: 659, d: 0.18, vol: 0.14 },  // E5
    { f: 784, d: 0.18, vol: 0.14 },  // G5
    { f: 1047, d: 0.55, vol: 0.22 }, // C6 (finał)
  ];
  let off = 0;
  notes.forEach(({ f, d, vol }) => {
    // Kwadratowe (militarne brzmienie)
    const o = c.createOscillator(); const g = masterGain(0.7);
    o.type = 'square';
    o.frequency.value = f;
    g.gain.setValueAtTime(_volume * vol, t + off);
    g.gain.exponentialRampToValueAtTime(0.0001, t + off + d);
    o.connect(g); o.start(t + off); o.stop(t + off + d);

    // Subton dla głębi (tylko na ostatniej nucie)
    if (f === 1047) {
      const os = c.createOscillator(); const gs = masterGain(0.5);
      os.type = 'sine'; os.frequency.value = f / 2;
      gs.gain.setValueAtTime(_volume * 0.18, t + off);
      gs.gain.exponentialRampToValueAtTime(0.0001, t + off + 0.65);
      os.connect(gs); os.start(t + off); os.stop(t + off + 0.65);
    }
    off += off < 0.36 ? 0.21 : 0;
  });
}

// Porażka — opadający motyw w minorowości G-Eb-C-A
export function playDefeat(): void {
  if (_muted) return;
  const c = ctx(); const t = c.currentTime;

  const notes = [
    { f: 392, d: 0.22 }, // G4
    { f: 311, d: 0.22 }, // Eb4 (minor!)
    { f: 262, d: 0.22 }, // C4
    { f: 196, d: 0.8  }, // G3 (finał — niskie)
  ];
  let off = 0;
  notes.forEach(({ f, d }) => {
    const o = c.createOscillator(); const g = masterGain(0.65);
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(_volume * 0.16, t + off);
    g.gain.exponentialRampToValueAtTime(0.0001, t + off + d);
    o.connect(g); o.start(t + off); o.stop(t + off + d);
    off += 0.26;
  });
}
