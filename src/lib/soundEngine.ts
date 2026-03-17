// ─── Web Audio API — synteza dźwięków w stylu militarnym / retro-elektronicznym ────

let _ctx: AudioContext | null = null;

// Inicjalizuj kontekst po interakcji użytkownika (polityka autoplay przeglądarek)
function ctx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') void _ctx.resume();
  return _ctx;
}

// ─── Ładowanie plików audio z cache'em ────────────────────────────────────────

const _audioCache = new Map<string, AudioBuffer>();

async function loadAudio(url: string): Promise<AudioBuffer> {
  const cached = _audioCache.get(url);
  if (cached) return cached;
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx().decodeAudioData(arrayBuffer);
  _audioCache.set(url, audioBuffer);
  return audioBuffer;
}

function playBuffer(buffer: AudioBuffer, vol = 1): void {
  const c = ctx();
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = masterGain(vol);
  src.connect(g);
  src.start(c.currentTime);
}

// Wstępne załadowanie plików bojowych (wywołaj po pierwszej interakcji)
export function preloadBattleSounds(): void {
  void loadAudio('/sounds/cannon_fire.ogg');
  void loadAudio('/sounds/cannon_hit.ogg');
  void loadAudio('/sounds/cannon_miss.ogg');
  void loadAudio('/sounds/ship_destroyed_short.ogg');
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

// ─── Efekty ───────────────────────────────────────────────────────────────────

// Kliknięcie UI — krótki elektroniczny beep
export function playClick(): void {
  preloadBattleSounds(); // Wstępne załadowanie plików przy pierwszej interakcji
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

// Strzał — cannon_fire.ogg
export function playFire(): void {
  if (_muted) return;
  void loadAudio('/sounds/cannon_fire.ogg').then(buf => playBuffer(buf, 0.9));
}

// Trafienie w statek — cannon_hit.ogg
export function playHit(): void {
  if (_muted) return;
  void loadAudio('/sounds/cannon_hit.ogg').then(buf => playBuffer(buf, 1.0));
}

// Strzał przeciwnika w moją planszę — cannon_hit.ogg (ciszej)
export function playIncomingHit(): void {
  if (_muted) return;
  void loadAudio('/sounds/cannon_hit.ogg').then(buf => playBuffer(buf, 0.6));
}

// Chybienie — cannon_miss.ogg
export function playMiss(): void {
  if (_muted) return;
  void loadAudio('/sounds/cannon_miss.ogg').then(buf => playBuffer(buf, 0.85));
}

// Zatopiony statek — ship_destroyed_short.ogg
export function playSunk(): void {
  if (_muted) return;
  void loadAudio('/sounds/ship_destroyed_short.ogg').then(buf => playBuffer(buf, 1.0));
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
