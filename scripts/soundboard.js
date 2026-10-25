/**
 * SOUNDBOARD & JUKEBOX OCULTISTA — UNIVERSO EVREN
 * Sintetizador procedural Web Audio com disparos rápidos de efeitos paranormais
 * e paisagens sonoras atmosféricas generativas contínuas para cada campanha.
 */

class SoundboardController {
  constructor(uiController) {
    this.uiController = uiController;
    this.audioCtx = null;
    this.currentPreset = null;
    this.presetOscillators = [];
    this.presetGain = null;

    // Estado da Paisagem Sonora Contínua (Ambiência Generativa)
    this.activeAtmosphere = null; // { type, label, gain, nodes, intervals }
    this.ambientVolume = 0.35;
    this.isMuted = false;
  }

  getSoundFX() {
    return this.uiController?.soundFX || window.soundFX;
  }

  getContext() {
    const sfx = this.getSoundFX();
    if (sfx) {
      sfx.init();
      return sfx.ctx;
    }
    return null;
  }

  init() {
    // Wires dos botões de disparo rápido do Soundboard
    document.querySelectorAll('.btn-sound-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        const soundType = btn.getAttribute('data-sound');
        this.playSound(soundType);
      });
    });

    // Wires dos Presets de Ambiência no modal do mixer
    document.querySelectorAll('.btn-sound-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-preset');
        this.togglePreset(preset, btn);
      });
    });

    // Wire do botão flutuante de ambiência no HUD
    const btnToggleAmbient = document.getElementById('btn-toggle-ambient');
    if (btnToggleAmbient) {
      btnToggleAmbient.addEventListener('click', () => {
        this.toggleAmbientFromHUD();
      });
    }

    console.log('✓ SoundboardController com Ambiências Procedurais inicializado.');
  }

  /* ==========================================================================
     1. PAISAGENS SONORAS PROCEDURAIS POR CAMPANHA (Web Audio Synthesis)
     ========================================================================== */

  /**
   * Toca a atmosfera correspondente à campanha fornecida
   */
  playCampaignAtmosphere(campaignId) {
    const map = {
      'camp_001': { type: 'bermuda', label: 'Triângulo: Abissal' },
      'camp_002': { type: 'vilar', label: 'Mansão Vilar: Tempestade' },
      'camp_003': { type: 'polar', label: 'Estação Zero: Nevasca' },
      'camp_004': { type: 'selva', label: 'Protocolo Selva: Amazônia' },
      'camp_005': { type: 'monasterio', label: 'Floresta Negra: Órgão Sombrio' }
    };

    const target = map[campaignId] || { type: 'vilar', label: 'Ambiência Evren' };
    this.startAtmosphere(target.type, target.label);
  }

  /**
   * Inicia gerador sonoro procedural contínuo
   */
  startAtmosphere(type, label = 'Atmosfera') {
    const ctx = this.getContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Se já estiver tocando esta mesma atmosfera, não reinicia
    if (this.activeAtmosphere && this.activeAtmosphere.type === type) {
      return;
    }

    this.stopAtmosphere();

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(this.ambientVolume, now + 1.2);
    masterGain.connect(ctx.destination);

    const nodes = [];
    const intervals = [];

    try {
      if (type === 'bermuda' || type === 'triangulo') {
        // === 1. TRIÂNGULO DAS BERMUDAS: SUB-BASS ABISSAL & PULSO DE SONAR ===
        // Sub-drone 44Hz + 55Hz
        const sub1 = ctx.createOscillator();
        const sub2 = ctx.createOscillator();
        sub1.type = 'sine';
        sub1.frequency.setValueAtTime(44, now);
        sub2.type = 'triangle';
        sub2.frequency.setValueAtTime(55, now);

        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.28, now);
        sub1.connect(subGain);
        sub2.connect(subGain);
        subGain.connect(masterGain);
        sub1.start(now);
        sub2.start(now);
        nodes.push(sub1, sub2, subGain);

        // Ruído filtrado simulando pressão oceânica profunda
        const oceanNoise = this.createNoiseBuffer(ctx, 4.0);
        if (oceanNoise) {
          const noiseSrc = ctx.createBufferSource();
          noiseSrc.buffer = oceanNoise;
          noiseSrc.loop = true;
          const lowpass = ctx.createBiquadFilter();
          lowpass.type = 'lowpass';
          lowpass.frequency.setValueAtTime(140, now);
          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime(0.22, now);
          noiseSrc.connect(lowpass);
          lowpass.connect(noiseGain);
          noiseGain.connect(masterGain);
          noiseSrc.start(now);
          nodes.push(noiseSrc, lowpass, noiseGain);
        }

        // Pings de Sonar Submarino a cada 7 segundos
        const pingInt = setInterval(() => {
          if (!this.activeAtmosphere) return;
          try {
            const pCtx = this.getContext();
            if (!pCtx) return;
            const pNow = pCtx.currentTime;
            const pOsc = pCtx.createOscillator();
            const pGain = pCtx.createGain();
            pOsc.type = 'sine';
            pOsc.frequency.setValueAtTime(1240, pNow);
            pOsc.frequency.exponentialRampToValueAtTime(1080, pNow + 0.4);
            pGain.gain.setValueAtTime(0.08, pNow);
            pGain.gain.exponentialRampToValueAtTime(0.0001, pNow + 1.8);
            pOsc.connect(pGain);
            pGain.connect(masterGain);
            pOsc.start(pNow);
            pOsc.stop(pNow + 1.8);
          } catch(e){}
        }, 7500);
        intervals.push(pingInt);

      } else if (type === 'vilar') {
        // === 2. MANSÃO VILAR: CHUVA CONTÍNUA + PÊNDULO DO RELÓGIO + TROVÕES ===
        // Chuva constante
        const rainBuf = this.createNoiseBuffer(ctx, 3.5);
        if (rainBuf) {
          const rainSrc = ctx.createBufferSource();
          rainSrc.buffer = rainBuf;
          rainSrc.loop = true;
          const rainFilter = ctx.createBiquadFilter();
          rainFilter.type = 'bandpass';
          rainFilter.frequency.setValueAtTime(1200, now);
          rainFilter.Q.setValueAtTime(0.7, now);
          const rainGain = ctx.createGain();
          rainGain.gain.setValueAtTime(0.18, now);
          rainSrc.connect(rainFilter);
          rainFilter.connect(rainGain);
          rainGain.connect(masterGain);
          rainSrc.start(now);
          nodes.push(rainSrc, rainFilter, rainGain);
        }

        // Drone grave de suspense
        const vilarDrone = ctx.createOscillator();
        vilarDrone.type = 'sine';
        vilarDrone.frequency.setValueAtTime(65, now);
        const vilarDroneGain = ctx.createGain();
        vilarDroneGain.gain.setValueAtTime(0.12, now);
        vilarDrone.connect(vilarDroneGain);
        vilarDroneGain.connect(masterGain);
        vilarDrone.start(now);
        nodes.push(vilarDrone, vilarDroneGain);

        // Tique-taque ritmado do relógio da mansão a cada 1.2 segundos
        let tickState = false;
        const tickInt = setInterval(() => {
          if (!this.activeAtmosphere) return;
          try {
            const tCtx = this.getContext();
            if (!tCtx) return;
            const tNow = tCtx.currentTime;
            const tOsc = tCtx.createOscillator();
            const tGain = tCtx.createGain();
            tOsc.type = 'sine';
            tOsc.frequency.setValueAtTime(tickState ? 480 : 420, tNow);
            tickState = !tickState;
            tGain.gain.setValueAtTime(0.04, tNow);
            tGain.gain.exponentialRampToValueAtTime(0.0001, tNow + 0.05);
            tOsc.connect(tGain);
            tGain.connect(masterGain);
            tOsc.start(tNow);
            tOsc.stop(tNow + 0.05);
          } catch(e){}
        }, 1200);
        intervals.push(tickInt);

      } else if (type === 'polar') {
        // === 3. ESTAÇÃO ZERO: NEVASCA CRIOGÊNICA & RESSONÂNCIA DE CRISTAL ===
        const windBuf = this.createNoiseBuffer(ctx, 4.0);
        if (windBuf) {
          const windSrc = ctx.createBufferSource();
          windSrc.buffer = windBuf;
          windSrc.loop = true;
          const bandpass = ctx.createBiquadFilter();
          bandpass.type = 'bandpass';
          bandpass.frequency.setValueAtTime(450, now);
          bandpass.Q.setValueAtTime(3.0, now);

          // LFO que modula a rajada de vento
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.type = 'sine';
          lfo.frequency.setValueAtTime(0.2, now);
          lfoGain.gain.setValueAtTime(320, now);
          lfo.connect(bandpass.frequency);
          lfo.start(now);

          const windGain = ctx.createGain();
          windGain.gain.setValueAtTime(0.25, now);
          windSrc.connect(bandpass);
          bandpass.connect(windGain);
          windGain.connect(masterGain);
          windSrc.start(now);
          nodes.push(windSrc, bandpass, lfo, lfoGain, windGain);
        }

        // Harmônico cristalino de gelo
        const ice = ctx.createOscillator();
        ice.type = 'sine';
        ice.frequency.setValueAtTime(1760, now);
        const iceGain = ctx.createGain();
        iceGain.gain.setValueAtTime(0.02, now);
        ice.connect(iceGain);
        iceGain.connect(masterGain);
        ice.start(now);
        nodes.push(ice, iceGain);

      } else if (type === 'selva') {
        // === 4. PROTOCOLO SELVA: COPAS TROPICAIS & RESSONÂNCIA BIOLUMINESCENTE ===
        const jungleDrone = ctx.createOscillator();
        jungleDrone.type = 'triangle';
        jungleDrone.frequency.setValueAtTime(110, now);
        const jDroneGain = ctx.createGain();
        jDroneGain.gain.setValueAtTime(0.15, now);
        jungleDrone.connect(jDroneGain);
        jDroneGain.connect(masterGain);
        jungleDrone.start(now);
        nodes.push(jungleDrone, jDroneGain);

        // Ruído de brisa na folhagem
        const breezeBuf = this.createNoiseBuffer(ctx, 3.0);
        if (breezeBuf) {
          const bSrc = ctx.createBufferSource();
          bSrc.buffer = breezeBuf;
          bSrc.loop = true;
          const bFilter = ctx.createBiquadFilter();
          bFilter.type = 'lowpass';
          bFilter.frequency.setValueAtTime(380, now);
          const bGain = ctx.createGain();
          bGain.gain.setValueAtTime(0.14, now);
          bSrc.connect(bFilter);
          bFilter.connect(bGain);
          bGain.connect(masterGain);
          bSrc.start(now);
          nodes.push(bSrc, bFilter, bGain);
        }

        // Chilreios e pulsos bioluminescentes a cada 3.5 segundos
        const insectInt = setInterval(() => {
          if (!this.activeAtmosphere) return;
          try {
            const iCtx = this.getContext();
            if (!iCtx) return;
            const iNow = iCtx.currentTime;
            const iOsc = iCtx.createOscillator();
            const iGain = iCtx.createGain();
            iOsc.type = 'sine';
            iOsc.frequency.setValueAtTime(3200 + Math.random() * 800, iNow);
            iGain.gain.setValueAtTime(0.03, iNow);
            iGain.gain.exponentialRampToValueAtTime(0.0001, iNow + 0.15);
            iOsc.connect(iGain);
            iGain.connect(masterGain);
            iOsc.start(iNow);
            iOsc.stop(iNow + 0.15);
          } catch(e){}
        }, 3500);
        intervals.push(insectInt);

      } else if (type === 'monasterio') {
        // === 5. FLORESTA NEGRA: ÓRGÃO GÓTICO & SINO DA CRIPTA ===
        // Tríade gótica (A2 110Hz, E3 165Hz, A3 220Hz)
        const notes = [110, 164.8, 220];
        notes.forEach(freq => {
          const organOsc = ctx.createOscillator();
          organOsc.type = 'sawtooth';
          organOsc.frequency.setValueAtTime(freq, now);

          const organFilter = ctx.createBiquadFilter();
          organFilter.type = 'lowpass';
          organFilter.frequency.setValueAtTime(340, now);

          const organGain = ctx.createGain();
          organGain.gain.setValueAtTime(0.06, now);

          organOsc.connect(organFilter);
          organFilter.connect(organGain);
          organGain.connect(masterGain);
          organOsc.start(now);
          nodes.push(organOsc, organFilter, organGain);
        });

        // Sino da Abadia a cada 11 segundos
        const bellInt = setInterval(() => {
          if (!this.activeAtmosphere) return;
          try {
            const bCtx = this.getContext();
            if (!bCtx) return;
            const bNow = bCtx.currentTime;
            const bOsc = bCtx.createOscillator();
            const bGain = bCtx.createGain();
            bOsc.type = 'triangle';
            bOsc.frequency.setValueAtTime(218, bNow);
            bOsc.frequency.exponentialRampToValueAtTime(145, bNow + 2.5);
            bGain.gain.setValueAtTime(0.12, bNow);
            bGain.gain.exponentialRampToValueAtTime(0.0001, bNow + 3.0);
            bOsc.connect(bGain);
            bGain.connect(masterGain);
            bOsc.start(bNow);
            bOsc.stop(bNow + 3.0);
          } catch(e){}
        }, 11000);
        intervals.push(bellInt);
      }

      this.activeAtmosphere = {
        type,
        label,
        gain: masterGain,
        nodes,
        intervals
      };

      this.updateHUDAtmosphereState(true, label);

    } catch(err) {
      console.warn('Erro ao sintetizar atmosfera procedural:', err);
    }
  }

  /**
   * Encerra a atmosfera ativa suavemente
   */
  stopAtmosphere() {
    if (!this.activeAtmosphere) return;

    const ctx = this.getContext();
    const { gain, nodes, intervals } = this.activeAtmosphere;

    // Cancela temporizadores
    intervals.forEach(id => clearInterval(id));

    if (ctx && gain) {
      try {
        const now = ctx.currentTime;
        gain.gain.linearRampToValueAtTime(0.0001, now + 0.6);
        setTimeout(() => {
          nodes.forEach(n => {
            try { if (n.stop) n.stop(); } catch(e){}
            try { n.disconnect(); } catch(e){}
          });
          try { gain.disconnect(); } catch(e){}
        }, 700);
      } catch(e){}
    } else {
      nodes.forEach(n => {
        try { if (n.stop) n.stop(); } catch(e){}
      });
    }

    this.activeAtmosphere = null;
    this.updateHUDAtmosphereState(false, null);
  }

  /**
   * Helper para criar buffer de ruído branco / rosa
   */
  createNoiseBuffer(ctx, duration = 3.0) {
    try {
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      return buffer;
    } catch(e) {
      return null;
    }
  }

  /**
   * Atualiza botão de ambiência no HUD
   */
  updateHUDAtmosphereState(isPlaying, label) {
    const btn = document.getElementById('btn-toggle-ambient');
    const labelEl = document.getElementById('ambient-btn-text');
    if (!btn || !labelEl) return;

    if (isPlaying && label) {
      btn.classList.add('active');
      labelEl.textContent = `AMBIÊNCIA: [${label}]`;
    } else {
      btn.classList.remove('active');
      labelEl.textContent = 'AMBIÊNCIA [OFF]';
    }

    // Sincroniza classes nos botões de preset do modal
    document.querySelectorAll('.btn-sound-preset').forEach(b => {
      const preset = b.getAttribute('data-preset');
      if (isPlaying && this.activeAtmosphere && (this.activeAtmosphere.type === preset || (preset === 'triangulo' && this.activeAtmosphere.type === 'bermuda'))) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  /**
   * Disparo pelo botão de ambiência no HUD (alterna on/off)
   */
  toggleAmbientFromHUD() {
    if (this.activeAtmosphere) {
      this.stopAtmosphere();
      if (window.soundFX) window.soundFX.playTacticalBeep();
    } else {
      // Usa a campanha atualmente ativa no mapEngine
      const campId = window.mapEngine?.currentRpgId || 'camp_002';
      this.playCampaignAtmosphere(campId);
      if (window.soundFX) window.soundFX.playTacticalBeep();
    }
  }

  /**
   * Wires de presets no modal do mixer
   */
  togglePreset(preset, btn) {
    if (this.activeAtmosphere && (this.activeAtmosphere.type === preset || (preset === 'triangulo' && this.activeAtmosphere.type === 'bermuda'))) {
      this.stopAtmosphere();
      return;
    }

    const labels = {
      'vilar': 'Mansão Vilar',
      'triangulo': 'Triângulo das Bermudas',
      'polar': 'Estação Zero',
      'selva': 'Protocolo Selva',
      'monasterio': 'Floresta Negra',
      'combate': 'Conflito Direto'
    };

    this.startAtmosphere(preset === 'triangulo' ? 'bermuda' : preset, labels[preset] || preset);
  }

  /* ==========================================================================
     2. SOUNDBOARD DE DISPARO RÁPIDO (EFEITOS INSTANTÂNEOS)
     ========================================================================== */

  playSound(type) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      switch(type) {
        case 'kraken':
          // Rugido Subaquático Abissal (Sub-Bass + Distorção)
          const oscKraken = ctx.createOscillator();
          const gainKraken = ctx.createGain();
          const filterKraken = ctx.createBiquadFilter();

          oscKraken.type = 'sawtooth';
          oscKraken.frequency.setValueAtTime(80, now);
          oscKraken.frequency.exponentialRampToValueAtTime(32, now + 1.2);

          filterKraken.type = 'lowpass';
          filterKraken.frequency.setValueAtTime(220, now);

          gainKraken.gain.setValueAtTime(0.01, now);
          gainKraken.gain.linearRampToValueAtTime(0.35, now + 0.3);
          gainKraken.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

          oscKraken.connect(filterKraken);
          filterKraken.connect(gainKraken);
          gainKraken.connect(ctx.destination);
          oscKraken.start(now);
          oscKraken.stop(now + 1.5);
          break;

        case 'limiar':
          // Fissura Espaço-Temporal do LIMIAR
          const oscLimiar = ctx.createOscillator();
          const gainLimiar = ctx.createGain();
          oscLimiar.type = 'sawtooth';
          oscLimiar.frequency.setValueAtTime(350, now);
          oscLimiar.frequency.exponentialRampToValueAtTime(1400, now + 0.25);
          oscLimiar.frequency.exponentialRampToValueAtTime(220, now + 0.7);

          gainLimiar.gain.setValueAtTime(0.2, now);
          gainLimiar.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

          oscLimiar.connect(gainLimiar);
          gainLimiar.connect(ctx.destination);
          oscLimiar.start(now);
          oscLimiar.stop(now + 0.75);
          break;

        case 'ecos':
          // Grito Quiróptero Dissonante dos Ecos
          const o1 = ctx.createOscillator();
          const o2 = ctx.createOscillator();
          const gEco = ctx.createGain();

          o1.type = 'sine';
          o2.type = 'sine';
          o1.frequency.setValueAtTime(620, now);
          o2.frequency.setValueAtTime(658, now); // Dissonância de semitom

          gEco.gain.setValueAtTime(0.18, now);
          gEco.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

          o1.connect(gEco);
          o2.connect(gEco);
          gEco.connect(ctx.destination);
          o1.start(now);
          o2.start(now);
          o1.stop(now + 0.6);
          o2.stop(now + 0.6);
          break;

        case 'overload':
          // Alarme Estridente de Colapso Mental
          for (let i = 0; i < 2; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(950, now + i * 0.15);
            gain.gain.setValueAtTime(0.15, now + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.1);
          }
          break;

        case 'polar':
          // Vento Criogênico Subglacial
          const bufferSize = Math.floor(ctx.sampleRate * 1.2);
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          const bandpass = ctx.createBiquadFilter();
          bandpass.type = 'bandpass';
          bandpass.frequency.setValueAtTime(380, now);
          bandpass.frequency.linearRampToValueAtTime(800, now + 0.6);
          bandpass.frequency.linearRampToValueAtTime(250, now + 1.2);

          const gainPolar = ctx.createGain();
          gainPolar.gain.setValueAtTime(0.01, now);
          gainPolar.gain.linearRampToValueAtTime(0.3, now + 0.5);
          gainPolar.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

          noise.connect(bandpass);
          bandpass.connect(gainPolar);
          gainPolar.connect(ctx.destination);
          noise.start(now);
          break;

        case 'critico':
          if (window.soundFX) window.soundFX.playCritSpark();
          break;

        case 'armadura':
          // Sacrifício de Armadura: Impacto Seco de Chapa de Aço Partida
          const oscArm = ctx.createOscillator();
          const gainArm = ctx.createGain();
          oscArm.type = 'triangle';
          oscArm.frequency.setValueAtTime(180, now);
          oscArm.frequency.exponentialRampToValueAtTime(45, now + 0.35);

          gainArm.gain.setValueAtTime(0.4, now);
          gainArm.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

          oscArm.connect(gainArm);
          gainArm.connect(ctx.destination);
          oscArm.start(now);
          oscArm.stop(now + 0.4);
          break;

        case 'sonar':
          if (window.soundFX) window.soundFX.playRadarPing();
          break;
      }
    } catch(e) {
      console.warn('Erro ao reproduzir efeito do soundboard:', e);
    }
  }

  stopCurrentPreset() {
    this.stopAtmosphere();
  }
}

window.SoundboardController = SoundboardController;
