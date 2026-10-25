/**
 * AudioFX - Motor acústico de alta fidelidad para paso de página de libro
 * Calibrado acústicamente para sonido de biblioteca: suave, nítido y sin distorsión.
 * Incorpora limitador de dinámica (DynamicsCompressor) para evitar saturación de altavoces.
 */

// Sonido acústico limpio de paso de página (44.1 kHz, 16-bit PCM, filtrado paso alto a 380Hz, sin DC offset)
const PAGE_FLIP_B64 = "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WAAzABAA+v/0//X/6//k/+b/6P/x/wAACgAGAPv/7//n/9b/zf/T/9D/xf/G/8b/y//k/wAADQAHAAAABAAFAPb/5//p/+f/5f/1/xEAMABHAFYAWQBYAFoAVgBMAEMAPwBEAD4AJQABANz/xf/K/9z/4v/c/+H/9v8JAAcA8P/a/9b/4//s/+f/5P/r//P/+P/1/+v/5f/i/9r/2//u/wAACAAPAA0ACAAPABsAJAAjACYAJQAiACsALQAvADAALwApACgAJwAjABwAEgATABgADwAEAPz/7f/f/97/6P/z/wUAFAASAAwADwAYABYACwD7/+z/3f/T/9D/xP+8/8D/zP/f//T/AAD+/+3/4f/Z/8n/tv+u/7f/uf+6/8b/1f/t//7/CQAXACIANAA5ADgANgAhABUAFwAZACIALwAzACcAEgACAP7/BQASABcAGQAfACcALAA0ADkAMgAkABUA/v/f/8X/uf+4/7D/qv+u/7T/vP/P/9z/4P/n/+3/8P/s/9z/1f/f/+X/6f/r/+j/7P/3/wQADgAXACIAMQA2ADUAPwBPAFMATABAADAAKgAhAAwA9//h/9T/1//a/9//7f/0//j/+/8CAAMA+P/1//r///8FAAgABwAJAAwAEwAZABgAEgACAPr/9//t/+L/4f/x/wIACQAGAP//+P/w/+L/1//Z/+D/3v/W/9H/1f/f/+L/5f/2/woAFQAVABYAHgAoACsAJAAiACYAHgATAAoA+//q/+H/2//Z/97/4//l/+7/+f/2//D/9v8AAP7/AAADAAQABgAJABAAFAAaACUAMAA2AD8AQQBBAEMAOwA2ADkAPQA7ADwAOwAwABkABADz/97/zf/H/8T/wv/O/9//6f/s//P/9P/1//7/AgD///f/9f/9/wYACgAMABYAHQAZAA4A/f/x//X/+P/v/+v/7v/y//n/BwASABUAFwAXABMAEwAZAB4AHAAWABUAFwAZABoAGwAXABAAEQAXAB0AIAAdABkAFwAYABgAFgALAPj/5//f/93/3f/Y/9H/xv/B/8H/v//D/8X/wf+8/7b/tv+9/8H/wf/I/9b/5f/t/+7/8v/3//n//P////7/+f/4//z//P/6//j/9//3//j/9f/0//X/+P/9/wAAAAACAAIABQAJAAgADQASABAADwAPABMAFwAUAA0ABgAHABEAGAAXABUAGAAaABgAGAAcACQAJwAoAC4AMgA1ADsAPAAyACEADAD5/+r/5v/m/+b/6f/w//3/BQAHAAYABgAFAP7/9f/t/+j/7P/2//z/AAABAAAABQALAA8ADQAMABAAEgAQAAcA+//0//r///8BAAAA9//v/+j/5v/l/+L/4f/i/+f/6v/q/+j/5v/l/+T/4f/a/9P/0v/W/9r/5f/w//P/+/8EAAkACQAEAAAABQALABEAFwAcACMAJgAoACgAJAAkACQAIgAgABsAHQAiACIAHwAiACIAHAAWABIAFAAUABEACwAAAPj/8f/u//P/+/8EAA8AFQAWABkAFgANAAcABAD9//P/7//r/+L/2//c/+L/6v/w//X//P8FAAoACgAIAAcABAD///b/6//h/9z/3//n/+//9v/9/wAA///+/wAA///5//H/6f/g/97/5v/t//T//P8AAAUACgAKAAUAAwACAP///P/9/wAABAAGAAgABgAFAAoADQAQABIAFAAXABsAIQAlACMAHgAaABYAFAAUABIAEQAPAAgAAgABAAIAAAD7//f/9f/1//X/7//o/+X/5P/i/+T/6P/o/+T/4P/d/93/3f/b/9j/3P/m/+//8//6/wIACgAOAA0ADQAQABQAEwAPAAkAAgD///3//v8EAAoADgARABQAFQAUABMAEQAOAAgAAgD7//b/9v/2//b/+P/2//b/+v/9/wAAAQAAAP7//f/8//3/AAACAAgACgAIAAMA/v/8//7//////wAABgAOABUAFgAVABQAFAARAA0ACgAIAAcAAwAAAAIABQAKAA4ADgAIAAQAAQD///z/+f/4//n/+//5//f/+P/6//j/9//4//b/9P/y//L/9P/2//j/+//+/wAA//////////8AAAIAAwADAAMABAAGAAkACgAGAAQAAwAAAAEABQAGAAQAAwAGAAkACwAIAAUABwAKAAoACQAHAAEA//////7/+//5//n/+f/7//v/+v/9//3/+//3//L/7//v//D/7v/u//H/9v/5//r/+v/8////AAD//////////wAA/////wAABAAIAAsADwATABQAFAASAA8ADwAPAA4ACgAGAAMA///9//z//v8AAAIAAgABAAIAAgABAAEAAAD8//f/8//y//L/8P/v/+7/7v/w//P/9f/4//n/+f/6//3/AAABAAIAAQABAAEAAAD///3//P/8////AgAHAAoACQAKAAoACQAJAAcABgAFAAYABgAEAAIAAgACAAEAAgAFAAcACQAJAAkACQAJAAkACQAJAAgABgADAAIAAQAAAAEAAgAAAP///f/5//f/9v/3//f/9//5//v//v////3/+v/5//n/9//2//T/8v/y//P/8//1//f/+v/9//3//f/9//7///8AAAMABQAFAAYACAAJAAoACgAKAAkACgAKAAsACwALAAoACQAHAAYABAACAAAA/f/8//r/+f/5//r//P/8//z//v8AAAIAAgABAAAAAAAAAAAAAAD///3/+//5//n/+v/6//r/+v/8////AAAAAAAAAAACAAMABAAEAAMAAQAAAP7//f/+/wAAAAABAAIAAwADAAQABAAEAAMAAgABAAEAAAAAAAAAAAAAAAAA//8AAP///////wAAAAABAAMABQAFAAQAAgABAAAAAAD/////AAD///7//v/+//7///////////8AAAAAAAD///////8AAAEAAQAAAAAAAAAAAAAAAQACAAMAAgACAAEAAQABAAEAAAD///7//v/+//7//v8AAAAAAAAAAAAAAQADAAQABAADAAMAAgABAAEAAQABAAAAAAD///7//f/9//z//P/8//z//P/8//7///8AAAAAAQABAAAAAAD///7//v/+////AAAAAAAAAAAAAAAAAAAAAAAAAQABAAIAAwAEAAQABAADAAMAAwADAAMAAgACAAEAAQABAAEAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAA///+//7//f/9//3//f/9//3//f/9//3//v/+//7//v////////8AAAAAAAAAAAEAAQACAAIAAQABAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//////////8AAAAAAAABAAEAAQABAAEAAQAAAAAAAAAAAAAA//////////8AAAAAAAAAAAEAAQABAAEAAQABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEAAQACAAIAAgACAAIAAQABAAEAAAAAAAAA////////////////AAAAAAAAAAAAAAAAAAD/////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAQABAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
const PAGE_FLIP_DATA_URI = "data:audio/wav;base64," + PAGE_FLIP_B64;

export class AudioFX {
  constructor() {
    this.audioCtx = null;
    this.audioBuffer = null;
    this.masterGain = null;
    this.compressor = null;
    this.isMuted = false;
    this.volume = 0.85; // Nivel calibrado natural
    this.isUnlocked = false;
    this._unlockedOnce = false;
    this._lastPlayTime = 0;

    // 1. ArrayBuffer pre-parseado desde base64
    this._rawWavArrayBuffer = null;
    try {
      const binaryString = atob(PAGE_FLIP_B64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      this._rawWavArrayBuffer = bytes.buffer;
    } catch (e) {
      console.warn("Error al decodificar base64 WAV:", e);
    }

    // 2. Pool HTML5 Audio con volumen calibrado
    this.audioPool = [];
    this.poolSize = 4;
    this.poolIndex = 0;
    try {
      for (let i = 0; i < this.poolSize; i++) {
        const a = new Audio(PAGE_FLIP_DATA_URI);
        a.preload = "auto";
        a.volume = this.volume * 0.70;
        this.audioPool.push(a);
      }
    } catch (e) {}

    // 3. Preferencias de volumen de efectos de página
    try {
      localStorage.removeItem("monflip_muted");
      localStorage.removeItem("lumina_flip_muted");
      const savedVol = localStorage.getItem("monflip_volume");
      if (savedVol !== null) {
        this.volume = Math.max(0.1, Math.min(1.0, parseFloat(savedVol)));
      }
    } catch (e) {}

    // 4. Música de Fondo Ambiental (C418 - Blind Spots de Minecraft)
    this.bgmAudio = null;
    this.bgmVolume = 0.16; // 16%: sutil y ambiental, no invasivo
    this.isBgmPlaying = false;
    this.isBgmMuted = false;
    this._bgmStartedOnce = false;
    this._bgmFadeInterval = null;
    this._initBgm();

    // 5. Pre-instanciar AudioContext, compresor y decodificar AudioBuffer
    this._predecode();
    this._initFetchBackup();
  }

  _initBgm() {
    try {
      this.bgmAudio = new Audio('assets/audio/blind-spots.mp3');
      this.bgmAudio.loop = true;
      this.bgmAudio.preload = 'auto';
      this.bgmAudio.volume = 0; // Inicia en 0 para fade-in sedoso

      const savedBgmVol = localStorage.getItem('monflip_bgm_volume');
      if (savedBgmVol !== null) {
        this.bgmVolume = Math.max(0.02, Math.min(1.0, parseFloat(savedBgmVol)));
      }
      const savedBgmMute = localStorage.getItem('monflip_bgm_muted');
      if (savedBgmMute !== null) {
        this.isBgmMuted = (savedBgmMute === 'true');
      }
    } catch (e) {
      console.warn('No se pudo inicializar música de fondo:', e);
    }
  }

  /**
   * Inicia la música de fondo con un fade-in sutil y envolvente
   */
  startBgm() {
    if (this.isBgmMuted || !this.bgmAudio) return;
    if (this.isBgmPlaying) return;

    this.isBgmPlaying = true;
    this.bgmAudio.volume = 0;
    const playPromise = this.bgmAudio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        this._fadeInBgm(this.bgmVolume, 2500);
      }).catch((err) => {
        // Se desbloqueará en el siguiente gesto del usuario
        this.isBgmPlaying = false;
      });
    }
  }

  _fadeInBgm(targetVol, durationMs = 2500) {
    if (!this.bgmAudio) return;
    clearInterval(this._bgmFadeInterval);
    const steps = 30;
    const stepTime = durationMs / steps;
    const increment = targetVol / steps;
    let current = 0;

    this._bgmFadeInterval = setInterval(() => {
      current = Math.min(targetVol, current + increment);
      if (this.bgmAudio && this.isBgmPlaying) {
        this.bgmAudio.volume = current;
      }
      if (current >= targetVol) {
        clearInterval(this._bgmFadeInterval);
      }
    }, stepTime);
  }

  pauseBgm() {
    if (!this.bgmAudio) return;
    clearInterval(this._bgmFadeInterval);
    this.isBgmPlaying = false;
    this.bgmAudio.pause();
  }

  resumeBgm() {
    if (!this.bgmAudio) return;
    this.isBgmMuted = false;
    try { localStorage.setItem('monflip_bgm_muted', 'false'); } catch (e) {}
    this.startBgm();
  }

  toggleBgm() {
    if (this.isBgmPlaying) {
      this.pauseBgm();
      this.isBgmMuted = true;
      try { localStorage.setItem('monflip_bgm_muted', 'true'); } catch (e) {}
      return false;
    } else {
      this.resumeBgm();
      return true;
    }
  }

  setBgmVolume(val) {
    this.bgmVolume = Math.max(0.01, Math.min(1.0, val));
    if (this.bgmAudio && this.isBgmPlaying) {
      this.bgmAudio.volume = this.bgmVolume;
    }
    try {
      localStorage.setItem('monflip_bgm_volume', this.bgmVolume.toString());
    } catch (e) {}
  }

  _predecode() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass && !this.audioCtx) {
        this.audioCtx = new AudioContextClass();
        this._setupAudioGraph();
      }
      if (this.audioCtx && this._rawWavArrayBuffer && !this.audioBuffer) {
        this.audioCtx.decodeAudioData(
          this._rawWavArrayBuffer.slice(0),
          (decoded) => {
            this.audioBuffer = decoded;
            this.isUnlocked = true;
          },
          () => {}
        );
      }
    } catch (e) {}
  }

  _setupAudioGraph() {
    if (!this.audioCtx) return;
    try {
      // Limitador / Compresor de dinámica: Previene distorsión y saturación en altavoces
      if (!this.compressor) {
        this.compressor = this.audioCtx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-14, this.audioCtx.currentTime);
        this.compressor.knee.setValueAtTime(6, this.audioCtx.currentTime);
        this.compressor.ratio.setValueAtTime(8, this.audioCtx.currentTime);
        this.compressor.attack.setValueAtTime(0.002, this.audioCtx.currentTime);
        this.compressor.release.setValueAtTime(0.12, this.audioCtx.currentTime);
        this.compressor.connect(this.audioCtx.destination);
      }

      // Ganancia Maestra
      if (!this.masterGain) {
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(this._calculateGain(), this.audioCtx.currentTime);
        this.masterGain.connect(this.compressor);
      }
    } catch (e) {
      console.warn("Error configurando audio graph:", e);
    }
  }

  _calculateGain() {
    // Escala suave: A volumen 1.0 reproduce a 0.65 de potencia (sonido acústico limpio, no estridente)
    return Math.max(0.02, Math.min(1.0, this.volume)) * 0.65;
  }

  _initFetchBackup() {
    if (typeof fetch !== "undefined") {
      fetch("assets/audio/page-flip.wav")
        .then(res => res.arrayBuffer())
        .then(ab => {
          this._rawWavArrayBuffer = ab;
          if (this.audioCtx && !this.audioBuffer) {
            this.audioCtx.decodeAudioData(ab.slice(0), buf => {
              this.audioBuffer = buf;
              this.isUnlocked = true;
            }, () => {});
          }
        })
        .catch(() => {});
    }
  }

  /**
   * Desbloquea universalmente el hardware de audio en la primera interacción
   */
  unlock() {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
          this._setupAudioGraph();
        }
      }

      if (this.audioCtx) {
        this._setupAudioGraph();

        if (this.audioCtx.state === "suspended") {
          this.audioCtx.resume().catch(() => {});
        }

        if (!this.audioBuffer && this._rawWavArrayBuffer) {
          this.audioCtx.decodeAudioData(
            this._rawWavArrayBuffer.slice(0),
            (decoded) => {
              this.audioBuffer = decoded;
              this.isUnlocked = true;
            },
            () => {}
          );
        } else if (this.audioBuffer) {
          this.isUnlocked = true;
        }

        if (!this._unlockedOnce) {
          try {
            const silent = this.audioCtx.createBuffer(1, 1, 22050);
            const node = this.audioCtx.createBufferSource();
            node.buffer = silent;
            node.connect(this.audioCtx.destination);
            node.start(0);
            this._unlockedOnce = true;
          } catch (e) {}
        }

        // Iniciar música de fondo al primer gesto si no está muteada
        if (!this._bgmStartedOnce && !this.isBgmMuted) {
          this._bgmStartedOnce = true;
          this.startBgm();
        }
      }
    } catch (e) {
      console.warn("Error en unlock():", e);
    }
  }

  /**
   * Reproduce el sonido de pasar página con cero distorsión acústica
   */
  playPageTurn(options = {}) {
    if (this.isMuted && !options.force) return;
    if (options.force) {
      this.isMuted = false;
    }

    this.unlock();

    const now = Date.now();
    if (!options.force && now - this._lastPlayTime < 130) return;
    this._lastPlayTime = now;

    let played = false;

    // 1. MÉTODO PRINCIPAL: Web Audio API con AudioBuffer físico y compresor anti-saturación
    if (this.audioCtx) {
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume().catch(() => {});
      }

      this._setupAudioGraph();

      if (this.audioBuffer && this.masterGain) {
        try {
          const src = this.audioCtx.createBufferSource();
          src.buffer = this.audioBuffer;
          // Variación tonal suave (+/- 3%) para realismo humano
          src.playbackRate.value = 0.97 + (Math.random() * 0.06);

          // Actualizar ganancia maestra con curva suave
          this.masterGain.gain.setValueAtTime(this._calculateGain(), this.audioCtx.currentTime);

          src.connect(this.masterGain);
          src.start(0);
          played = true;
          return;
        } catch (err) {
          console.warn("Error en reproducción AudioBuffer:", err);
        }
      }

      // 2. MÉTODO SECUNDARIO: Síntesis procedural pura anti-distorsión
      if (!played && this.masterGain) {
        try {
          this._synthesizeProcedural();
          played = true;
          return;
        } catch (e) {
          console.warn("Error en síntesis procedural:", e);
        }
      }
    }

    // 3. MÉTODO TERCIARIO: Pool HTML5 Audio
    if (!played && this.audioPool && this.audioPool.length > 0) {
      try {
        const audio = this.audioPool[this.poolIndex];
        this.poolIndex = (this.poolIndex + 1) % this.audioPool.length;
        audio.volume = Math.max(0.05, Math.min(1.0, this.volume * 0.60));
        audio.currentTime = 0;
        const p = audio.play();
        if (p !== undefined) {
          p.catch(() => {});
        }
      } catch (e) {}
    }
  }

  /**
   * Síntesis acústica procedural suave y limpia (sin bajos que distorsionen)
   */
  _synthesizeProcedural() {
    if (!this.audioCtx || !this.masterGain) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const duration = 0.22;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const out = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      out[i] = (b0 + b1 + b2 + white * 0.5362) * 0.18;
    }

    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;

    // Filtro dinámico suave de fricción
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.setValueAtTime(1500, now);
    bandpass.frequency.exponentialRampToValueAtTime(700, now + duration);
    bandpass.Q.setValueAtTime(1.5, now);

    // Filtro paso alto a 380 Hz para eliminar ruidos sub-graves
    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(380, now);

    const envGain = ctx.createGain();
    envGain.gain.setValueAtTime(0.0001, now);
    envGain.gain.linearRampToValueAtTime(0.55, now + 0.025);
    envGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noiseSrc.connect(bandpass);
    bandpass.connect(highpass);
    highpass.connect(envGain);
    envGain.connect(this.masterGain);

    noiseSrc.start(now);
    noiseSrc.stop(now + duration);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  setVolume(val) {
    this.volume = Math.max(0.05, Math.min(1.0, val));
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this._calculateGain(), this.audioCtx.currentTime);
    }
    for (const a of this.audioPool) {
      a.volume = this.volume * 0.65;
    }
    try {
      localStorage.setItem("monflip_volume", this.volume.toString());
    } catch (e) {}
  }
}
