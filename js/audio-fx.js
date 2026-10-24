/**
 * AudioFX - Motor sintetizador procedural de sonido de paso de página
 * Utiliza Web Audio API pura para generar un efecto hiperrealista de fricción
 * y desplazamiento de aire de papel de libro escaneado, sin latencia ni dependencias de red.
 */
export class AudioFX {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.volume = 0.85;
    this.isUnlocked = false;
    this._lastPlayTime = 0;

    // Cargar preferencia persistente (con compatibilidad de claves)
    try {
      const savedMute = localStorage.getItem("monflip_muted") ?? localStorage.getItem("lumina_flip_muted");
      if (savedMute !== null) this.isMuted = (savedMute === "true");
      const savedVol = localStorage.getItem("monflip_volume") ?? localStorage.getItem("lumina_flip_volume");
      if (savedVol !== null) this.volume = parseFloat(savedVol);
    } catch (e) {
      console.warn("LocalStorage no disponible para audio settings", e);
    }
  }

  /**
   * Desbloquea permanentemente el AudioContext bajo cualquier interacción del usuario
   * cumpliendo rigurosamente con las políticas de autoplay de Chrome, Safari e iOS.
   */
  unlock() {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx) {
        if (this.audioCtx.state === "suspended") {
          this.audioCtx.resume().then(() => {
            this.isUnlocked = true;
          }).catch(() => {});
        } else if (this.audioCtx.state === "running") {
          this.isUnlocked = true;
        }
      }
    } catch (e) {
      console.warn("No se pudo desbloquear AudioContext:", e);
    }
  }

  /**
   * Reproduce el sonido de pasar página sintetizado en tiempo real
   * @param {Object} options Parámetros de variación opcionales
   */
  playPageTurn(options = {}) {
    if (this.isMuted) return;

    this.unlock();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;

    // Debounce de seguridad (evita ráfagas repetidas en menos de 180ms)
    const currentTimeMs = Date.now();
    if (currentTimeMs - this._lastPlayTime < 180) {
      return;
    }
    this._lastPlayTime = currentTimeMs;

    if (ctx.state === "suspended") {
      ctx.resume().then(() => {
        this._synthesizePageTurn(ctx, options);
      }).catch(() => {});
      return;
    }

    this._synthesizePageTurn(ctx, options);
  }

  /**
   * Síntesis acústica de fricción de papel y desplazamiento de aire
   */
  _synthesizePageTurn(ctx, options = {}) {
    try {
      const now = ctx.currentTime;
      const duration = 0.22 + Math.random() * 0.08; // 220ms - 300ms

      // Ganancia maestra del efecto con volumen calibrado
      const masterGain = ctx.createGain();
      const currentVol = Math.max(0.01, Math.min(1.0, this.volume));
      masterGain.gain.setValueAtTime(currentVol, now);
      masterGain.connect(ctx.destination);

      // 1. SINTETIZADOR DE FRICCIÓN DE PAPEL (Pink noise filtrado con resonancia)
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        const pink = b0 + b1 + b2 + white * 0.5362;
        output[i] = pink * 0.45;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      // Filtro Paso Banda dinámico (simula el roce deslizante de la hoja)
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      const startFreq = 1800 + (Math.random() * 400 - 200);
      const midFreq = 1100 + (Math.random() * 200 - 100);
      const endFreq = 480 + (Math.random() * 150 - 75);

      bandpass.frequency.setValueAtTime(startFreq, now);
      bandpass.frequency.linearRampToValueAtTime(midFreq, now + duration * 0.45);
      bandpass.frequency.linearRampToValueAtTime(endFreq, now + duration);
      bandpass.Q.setValueAtTime(2.2, now);

      // Filtro Paso Alto para claridad
      const highpass = ctx.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.setValueAtTime(280, now);

      // Envolvente de volumen (ataque ágil y caída natural)
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.linearRampToValueAtTime(0.95, now + 0.025);
      noiseGain.gain.linearRampToValueAtTime(0.001, now + duration);

      noiseSource.connect(bandpass);
      bandpass.connect(highpass);
      highpass.connect(noiseGain);
      noiseGain.connect(masterGain);

      // 2. DESPLAZAMIENTO DE AIRE Y MOVIMIENTO (Whoosh suave)
      const airNoise = ctx.createBufferSource();
      airNoise.buffer = noiseBuffer;

      const airLowpass = ctx.createBiquadFilter();
      airLowpass.type = "lowpass";
      airLowpass.frequency.setValueAtTime(450, now);
      airLowpass.frequency.linearRampToValueAtTime(200, now + duration * 0.8);

      const airGain = ctx.createGain();
      airGain.gain.setValueAtTime(0.001, now);
      airGain.gain.linearRampToValueAtTime(0.45, now + 0.04);
      airGain.gain.linearRampToValueAtTime(0.001, now + duration * 0.85);

      airNoise.connect(airLowpass);
      airLowpass.connect(airGain);
      airGain.connect(masterGain);

      // 3. ASENTAMIENTO SUAVE AL CAER LA HOJA
      const thumpOsc = ctx.createOscillator();
      const thumpGain = ctx.createGain();
      thumpOsc.type = "sine";
      thumpOsc.frequency.setValueAtTime(80, now + duration * 0.5);
      thumpOsc.frequency.linearRampToValueAtTime(40, now + duration);

      thumpGain.gain.setValueAtTime(0.001, now);
      thumpGain.gain.setValueAtTime(0.001, now + duration * 0.5);
      thumpGain.gain.linearRampToValueAtTime(0.35, now + duration * 0.55);
      thumpGain.gain.linearRampToValueAtTime(0.001, now + duration);

      thumpOsc.connect(thumpGain);
      thumpGain.connect(masterGain);

      // Disparar nodos
      noiseSource.start(now);
      noiseSource.stop(now + duration);
      airNoise.start(now);
      airNoise.stop(now + duration * 0.85);
      thumpOsc.start(now + duration * 0.5);
      thumpOsc.stop(now + duration);
    } catch (e) {
      console.warn("Error al sintetizar sonido de página:", e);
    }
  }

  /**
   * Alterna el estado de silenciado
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem("monflip_muted", this.isMuted.toString());
      localStorage.setItem("lumina_flip_muted", this.isMuted.toString());
    } catch (e) {}
    return this.isMuted;
  }

  /**
   * Ajusta el volumen (0.0 a 1.0)
   */
  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    try {
      localStorage.setItem("monflip_volume", this.volume.toString());
      localStorage.setItem("lumina_flip_volume", this.volume.toString());
    } catch (e) {}
  }
}
