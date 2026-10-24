/**
 * AudioFX - Motor sintetizador procedural de sonido de paso de página
 * Utiliza Web Audio API pura para generar un efecto hiperrealista de fricción
 * y desplazamiento de aire de papel de libro escaneado, sin latencia ni dependencias de red.
 */
export class AudioFX {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.volume = 0.75;
    this.initialized = false;

    // Cargar preferencia persistente
    try {
      const savedMute = localStorage.getItem('lumina_flip_muted');
      if (savedMute !== null) this.isMuted = savedMute === 'true';
      const savedVol = localStorage.getItem('lumina_flip_volume');
      if (savedVol !== null) this.volume = parseFloat(savedVol);
    } catch (e) {
      console.warn('LocalStorage no disponible para audio settings', e);
    }
  }

  /**
   * Inicializa el AudioContext bajo interacción del usuario para cumplir
   * con las políticas de autoplay de navegadores modernos.
   */
  initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        this.initialized = true;
      }
    } else if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Reproduce el sonido de pasar página sintetizado en tiempo real
   * @param {Object} options Parámetros de variación (dirección, velocidad)
   */
  playPageTurn(options = {}) {
    if (this.isMuted) return;

    this.initContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    // Ganancia maestra del efecto
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume, now);
    masterGain.connect(ctx.destination);

    // 1. SINTETIZADOR DE FRICCIÓN DE PAPEL (Ruido blanco modulado por filtro pasabanda)
    const duration = 0.18 + Math.random() * 0.08; // 180ms - 260ms
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Llenar con ruido y micro-textura
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Filtro Brown/Pink ligero integrado en la muestra
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 2.8; // Normalización
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Filtro Paso Banda dinámico (simula el roce deslizante del borde de la hoja)
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    const startFreq = 1600 + (Math.random() * 500 - 250);
    const midFreq = 950 + (Math.random() * 200 - 100);
    const endFreq = 480 + (Math.random() * 150 - 75);

    bandpass.frequency.setValueAtTime(startFreq, now);
    bandpass.frequency.exponentialRampToValueAtTime(midFreq, now + duration * 0.4);
    bandpass.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    bandpass.Q.setValueAtTime(1.8 + Math.random() * 0.6, now);

    // Filtro Paso Alto para quitar zumbidos ásperos
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(320, now);

    // Envolvente de volumen (ADSR para el roce)
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    // Ataque ultrarrápido pero suave (12ms)
    noiseGain.gain.exponentialRampToValueAtTime(0.85, now + 0.015);
    // Decaimiento natural de la fricción
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseSource.connect(bandpass);
    bandpass.connect(highpass);
    highpass.connect(noiseGain);
    noiseGain.connect(masterGain);

    // 2. COMPONENTE DE DESPLAZAMIENTO DE AIRE (Sub-bajo suave al caer la página)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';

    const subFreq = 65 + (Math.random() * 20 - 10);
    subOsc.frequency.setValueAtTime(subFreq, now);
    subOsc.frequency.exponentialRampToValueAtTime(35, now + duration * 0.7);

    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.exponentialRampToValueAtTime(0.4, now + 0.03);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.75);

    subOsc.connect(subGain);
    subGain.connect(masterGain);

    // Disparar
    try {
      noiseSource.start(now);
      noiseSource.stop(now + duration);
      subOsc.start(now);
      subOsc.stop(now + duration * 0.75);
    } catch (e) {
      console.warn('Error al disparar sonido de página:', e);
    }
  }

  /**
   * Alterna el estado de silenciado
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('lumina_flip_muted', this.isMuted.toString());
    } catch (e) {}
    return this.isMuted;
  }

  /**
   * Ajusta el volumen (0.0 a 1.0)
   */
  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    try {
      localStorage.setItem('lumina_flip_volume', this.volume.toString());
    } catch (e) {}
  }
}
