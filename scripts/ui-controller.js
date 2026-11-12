/**
 * UI CONTROLLER & SOUND SYNTHESIZER MODULE
 * Universo: Evren - Mesa Interativa
 * Gerencia a gaveta lateral, fichas de personagens, modais de regras, códice e efeitos sonoros.
 */

class SoundSynthesizer {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterVolume = 1.0;
    this.fxVolume = 1.0;
    this.ambientVolume = 0.5;
    this.whispersVolume = 0.5;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
  }

  setFxVolume(val) {
    this.fxVolume = Math.max(0, Math.min(1, val));
  }

  setAmbientVolume(val) {
    this.ambientVolume = Math.max(0, Math.min(1, val));
    if (this.ambientGain && this.ctx) {
      try {
        this.ambientGain.gain.setValueAtTime(0.04 * this.ambientVolume * this.masterVolume, this.ctx.currentTime);
      } catch(e) {}
    }
  }

  setWhispersVolume(val) {
    this.whispersVolume = Math.max(0, Math.min(1, val));
  }

  playWhispers() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(160, now + 0.3);
      osc.frequency.linearRampToValueAtTime(310, now + 0.8);
      osc.frequency.linearRampToValueAtTime(110, now + 1.2);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, now);
      filter.Q.setValueAtTime(8, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08 * this.fxVolume * this.masterVolume, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch(e) {}
  }

  toggleSound() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  playTacticalBeep() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  playRadarPing() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  playGlitchBurst() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, this.ctx.currentTime);
    filter.Q.setValueAtTime(4, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start();
  }

  playPortalWhoosh() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.3);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.7);

    gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.75);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.75);
  }

  playCloudDive() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Ruído de vento hipersônico e fricção atmosférica
      const bufferSize = Math.floor(this.ctx.sampleRate * 2.2);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + 0.8);
      filter.frequency.exponentialRampToValueAtTime(900, now + 1.6);
      filter.frequency.exponentialRampToValueAtTime(180, now + 2.2);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.28 * this.fxVolume * this.masterVolume, now + 0.6);
      gain.gain.linearRampToValueAtTime(0.20 * this.fxVolume * this.masterVolume, now + 1.6);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);

      // 2. Sub-bass de reentrada planetária (45Hz -> 80Hz -> 30Hz)
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(45, now);
      osc.frequency.exponentialRampToValueAtTime(85, now + 0.7);
      osc.frequency.exponentialRampToValueAtTime(32, now + 1.8);

      const oscFilter = this.ctx.createBiquadFilter();
      oscFilter.type = 'lowpass';
      oscFilter.frequency.setValueAtTime(120, now);

      oscGain.gain.setValueAtTime(0.01, now);
      oscGain.gain.linearRampToValueAtTime(0.25 * this.fxVolume * this.masterVolume, now + 0.5);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

      osc.connect(oscFilter);
      oscFilter.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 2.0);

      // 3. Sino harmônico de rompimento do teto de nuvens (Breakout Chime) em now + 1.8s
      setTimeout(() => {
        if (!this.ctx) return;
        const chimeNow = this.ctx.currentTime;
        const chimeOsc = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();
        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(880, chimeNow);
        chimeOsc.frequency.exponentialRampToValueAtTime(1760, chimeNow + 0.25);

        chimeGain.gain.setValueAtTime(0.12 * this.fxVolume * this.masterVolume, chimeNow);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, chimeNow + 0.4);

        chimeOsc.connect(chimeGain);
        chimeGain.connect(this.ctx.destination);
        chimeOsc.start(chimeNow);
        chimeOsc.stop(chimeNow + 0.4);
      }, 1800);

    } catch (e) {
      console.warn('Erro ao sintetizar playCloudDive:', e);
    }
  }

  playCloudRise() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 1.0);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.22 * this.fxVolume * this.masterVolume, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 1.5);
    } catch (e) {
      console.warn('Erro ao sintetizar playCloudRise:', e);
    }
  }

  playOverloadAlarm() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, now + i * 0.14);
      osc.frequency.linearRampToValueAtTime(450, now + i * 0.14 + 0.1);

      gain.gain.setValueAtTime(0.15, now + i * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.13);
    }
  }

  toggleAmbient() {
    this.ambientActive = !this.ambientActive;
    if (this.ambientActive) {
      this.playAmbientDrone();
    } else {
      this.stopAmbientDrone();
    }
    return this.ambientActive;
  }

  playAmbientDrone() {
    this.init();
    if (!this.ctx) return;
    this.stopAmbientDrone();

    try {
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.ambientGain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 1.5);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, this.ctx.currentTime);

      this.ambientOsc1 = this.ctx.createOscillator();
      this.ambientOsc1.type = 'sawtooth';
      this.ambientOsc1.frequency.setValueAtTime(55, this.ctx.currentTime);

      this.ambientOsc2 = this.ctx.createOscillator();
      this.ambientOsc2.type = 'sine';
      this.ambientOsc2.frequency.setValueAtTime(110.5, this.ctx.currentTime);

      this.ambientOsc1.connect(filter);
      this.ambientOsc2.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);

      this.ambientOsc1.start();
      this.ambientOsc2.start();
      this.ambientActive = true;
    } catch (e) {
      console.warn('Erro ao iniciar ambiência:', e);
    }
  }

  stopAmbientDrone() {
    if (this.ambientGain && this.ctx) {
      try {
        this.ambientGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
        setTimeout(() => {
          if (this.ambientOsc1) { try { this.ambientOsc1.stop(); } catch(e){} this.ambientOsc1 = null; }
          if (this.ambientOsc2) { try { this.ambientOsc2.stop(); } catch(e){} this.ambientOsc2 = null; }
          this.ambientGain = null;
        }, 850);
      } catch (e) {}
    }
    this.ambientActive = false;
  }

  playThunder() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 1.5);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.5));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(100, this.ctx.currentTime);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    } catch(e) {}
  }

  playDiceRoll() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400 + Math.random() * 600, now + i * 0.08);
      gain.gain.setValueAtTime(0.08, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.04);
    }
  }

  playCritSpark() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    const now = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.12, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.29);
    });
  }

  startHeartbeat() {
    if (this.heartbeatTimer) return;
    this.heartbeatTimer = setInterval(() => {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      [0, 0.16].forEach(delay => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(70, now + delay);
        osc.frequency.exponentialRampToValueAtTime(35, now + delay + 0.12);
        gain.gain.setValueAtTime(0.22, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.15);
      });
    }, 1100);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

class UIController {
  constructor(dataLoader) {
    this.dataLoader = dataLoader;
    this.soundFX = new SoundSynthesizer();
    window.soundFX = this.soundFX;

    this.currentCampaignFilter = 'all';
    this.currentCharacterId = 'char_lucas';
    this.currentLocationId = 'loc_vilar';

    // Estado dinâmico de PD dos personagens
    this.pdState = {
      'char_lucas': { current: 15, max: 20 },
      'char_gabriel': { current: 18, max: 20 },
      'char_rafael': { current: 20, max: 20 },
      'char_julia': { current: 16, max: 20 },
      'char_arquiteto': { current: 99, max: 99 }
    };

    // Atributos customizados balanceados por personagem
    this.charAttributes = {
      'char_lucas': { Força: 2, Vigor: 3, Agilidade: 2, Presença: 1, Intelecto: 3 },
      'char_gabriel': { Força: 1, Vigor: 2, Agilidade: 3, Presença: 2, Intelecto: 5 },
      'char_rafael': { Força: 4, Vigor: 3, Agilidade: 3, Presença: 2, Intelecto: 1 },
      'char_julia': { Força: 1, Vigor: 2, Agilidade: 4, Presença: 3, Intelecto: 3 },
      'char_arquiteto': { Força: 1, Vigor: 1, Agilidade: 1, Presença: 5, Intelecto: 5 }
    };

    // Estado dinâmico de MDA
    this.mdaState = {
      'char_lucas': 35,
      'char_gabriel': 15,
      'char_rafael': 5,
      'char_julia': 8,
      'char_arquiteto': 99
    };

    // Estado da Linha do Tempo
    this.selectedTimelineIndex = 0;

    // Estado da Bandeja de Dados Universal
    this.diceSelection = { type: 20, count: 1, modifier: 0 };
    this.diceHistory = [];
  }

  init() {
    window.uiController = this;
    window.openCampaignStory = (campaignId) => this.openCampaignStory(campaignId);
    this.loadCustomCrisCharactersFromStorage();
    this.loadCustomChroniclesFromStorage();
    this.loadCharacterStatOverridesFromStorage();
    this.setupEventListeners();
    this.populateCampaignFilter();
    this.renderCharactersList();
    this.renderChroniclesList();
    this.renderActiveCharacterSheet();
    this.renderBestiaryList();
    this.setupBestiaryV4();
    this.renderRulesV3Modal('quaternario');
    this.renderRelicsList();
    this.renderTimeline();
    this.renderUniversalDiceTray();
    this.renderSoundMixer();
    this.setupCrisImporter();
    this.setupLoreGraph();
    this.setupMemorial();
    this.setupCassettePlayer();
    this.setupSessionCreator();
  }

  setupEventListeners() {
    // Dropdowns do HUD Superior (Cadastrar e Arquivo & Mais)
    ['btn-hud-create', 'btn-hud-tools'].forEach(btnId => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const parentWrap = btn.closest('.hud-dropdown-wrap');
          const wasOpen = parentWrap?.classList.contains('open');
          document.querySelectorAll('.hud-dropdown-wrap.open').forEach(w => w.classList.remove('open'));
          if (!wasOpen) parentWrap?.classList.add('open');
          this.soundFX.playTacticalBeep();
        });
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.hud-dropdown-wrap')) {
        document.querySelectorAll('.hud-dropdown-wrap.open').forEach(w => w.classList.remove('open'));
      }
    });

    document.querySelectorAll('.hud-dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.hud-dropdown-wrap.open').forEach(w => w.classList.remove('open'));
      });
    });

    // Botão de fechar gaveta
    document.getElementById('btn-close-drawer')?.addEventListener('click', () => {
      this.closeDrawer();
    });

    // Abas da gaveta
    document.querySelectorAll('.drawer-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabKey = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tabKey);
        this.soundFX.playTacticalBeep();
      });
    });

    // Filtro de Campanhas
    const campaignSelect = document.getElementById('campaign-filter');
    if (campaignSelect) {
      campaignSelect.addEventListener('change', (e) => {
        this.currentCampaignFilter = e.target.value;
        this.onCampaignFilterChange();
        this.soundFX.playTacticalBeep();
      });
    }

    // Botões do Banner de Chegada Planetária (#planetary-arrival-card)
    document.getElementById('btn-close-arrival')?.addEventListener('click', () => {
      window.app?.mapEngine?.dismissPlanetaryArrivalCard();
      this.soundFX.playTacticalBeep();
    });

    document.getElementById('btn-arrival-dismiss')?.addEventListener('click', () => {
      window.app?.mapEngine?.dismissPlanetaryArrivalCard();
      this.soundFX.playTacticalBeep();
    });

    document.getElementById('btn-arrival-view-campaign')?.addEventListener('click', () => {
      window.app?.mapEngine?.dismissPlanetaryArrivalCard();
      this.renderCampaignsHub();
      this.openModal('modal-campaigns-hub');
      this.soundFX.playTacticalBeep();
    });

    document.getElementById('btn-arrival-view-chars')?.addEventListener('click', () => {
      window.app?.mapEngine?.dismissPlanetaryArrivalCard();
      const targetCampId = window.app?.mapEngine?.currentRpgId || 'camp_001';
      this.openDrawer('characters');
      this.renderCharactersList(targetCampId);
      this.soundFX.playTacticalBeep();
    });

    // Botões do HUD
    document.getElementById('btn-open-campaigns-hub')?.addEventListener('click', () => {
      this.renderCampaignsHub();
      this.openModal('modal-campaigns-hub');
      this.soundFX.playTacticalBeep();
    });

    document.getElementById('btn-open-locations')?.addEventListener('click', () => {
      this.renderLocationsAtlas();
      this.openModal('modal-locations-atlas');
      this.soundFX.playTacticalBeep();
    });

    document.getElementById('btn-atlas-new-location')?.addEventListener('click', () => {
      this.closeModal('modal-locations-atlas');
      this.openModal('modal-location-creator');
      this.soundFX.playTacticalBeep();
    });

    document.getElementById('btn-hub-new-campaign')?.addEventListener('click', () => {
      this.closeModal('modal-campaigns-hub');
      this.openModal('modal-campaign-creator');
      this.soundFX.playTacticalBeep();
    });

    ['all', 'ongoing', 'completed'].forEach(f => {
      document.getElementById(`hub-tab-${f}`)?.addEventListener('click', (e) => {
        document.querySelectorAll('.hub-tab-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.renderCampaignsHub(f);
        this.soundFX.playTacticalBeep();
      });
    });

    const formLoc = document.getElementById('form-create-location');
    if (formLoc) {
      formLoc.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCreateLocation();
      });
    }

    ['btn-open-rules', 'btn-open-rules-menu'].forEach(btnId => {
      document.getElementById(btnId)?.addEventListener('click', () => {
        this.renderRulesV3Modal(this.activeRulesTab || 'quaternario');
        this.openModal('modal-rules');
        this.soundFX.playTacticalBeep();
      });
    });

    document.querySelectorAll('.rules-v3-tab-btn[data-rules-tab]').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        this.renderRulesV3Modal(tabBtn.dataset.rulesTab || 'quaternario');
        this.soundFX.playTacticalBeep();
      });
    });

    document.getElementById('btn-open-codex')?.addEventListener('click', () => {
      this.renderCodexGrid();
      this.openModal('modal-codex');
      this.soundFX.playTacticalBeep();
    });

    document.getElementById('btn-open-characters')?.addEventListener('click', () => {
      this.openDrawer('characters');
      this.soundFX.playTacticalBeep();
    });

    document.getElementById('btn-open-chronicles')?.addEventListener('click', () => {
      this.openDrawer('chronicles');
      this.soundFX.playTacticalBeep();
    });

    document.getElementById('btn-open-combat')?.addEventListener('click', () => {
      if (window.combatArena) {
        window.combatArena.openArenaModal();
      } else {
        this.openModal('modal-combat-arena');
      }
      this.soundFX.playTacticalBeep();
    });

    ['btn-nav-tomo4', 'btn-open-bestiary'].forEach(btnId => {
      document.getElementById(btnId)?.addEventListener('click', () => {
        this.openBestiaryModal();
        this.soundFX.playTacticalBeep();
      });
    });

    document.getElementById('btn-open-relics')?.addEventListener('click', () => {
      this.renderRelicsList();
      this.openModal('modal-relics-codex');
      this.soundFX.playTacticalBeep();
    });

    document.getElementById('btn-open-timeline')?.addEventListener('click', () => {
      this.renderTimeline();
      this.openModal('modal-timeline');
      this.soundFX.playTacticalBeep();
    });

    document.getElementById('btn-open-cris-importer')?.addEventListener('click', () => {
      this.openModal('modal-cris-importer');
      this.soundFX.playTacticalBeep();
    });

    document.getElementById('btn-drawer-import-cris')?.addEventListener('click', () => {
      this.openModal('modal-cris-importer');
      this.soundFX.playTacticalBeep();
    });

    document.getElementById('btn-open-lore-graph')?.addEventListener('click', () => {
      this.openModal('modal-lore-graph');
      this.soundFX.playTacticalBeep();
      if (this.startLoreGraph) this.startLoreGraph();
    });

    document.getElementById('btn-open-memorial')?.addEventListener('click', () => {
      this.renderMemorial();
      this.openModal('modal-memorial');
      this.soundFX.playTacticalBeep();
    });

    document.getElementById('btn-open-cassette')?.addEventListener('click', () => {
      this.openModal('modal-cassette-player');
      this.soundFX.playTacticalBeep();
    });

    document.getElementById('btn-add-session-log')?.addEventListener('click', () => {
      this.openModal('modal-session-creator');
      this.soundFX.playTacticalBeep();
    });

    document.getElementById('btn-open-shortcuts')?.addEventListener('click', () => {
      this.openModal('modal-shortcuts');
      this.soundFX.playTacticalBeep();
    });

    document.getElementById('btn-open-dice')?.addEventListener('click', () => {
      this.renderUniversalDiceTray();
      this.openModal('modal-universal-dice');
      this.soundFX.playTacticalBeep();
    });

    document.getElementById('btn-open-mixer')?.addEventListener('click', () => {
      this.renderSoundMixer();
      this.openModal('modal-sound-mixer');
      this.soundFX.playTacticalBeep();
    });

    // Botão de Áudio HUD
    const soundToggle = document.getElementById('btn-toggle-sound');
    const soundText = document.getElementById('sound-btn-text');
    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        const enabled = this.soundFX.toggleSound();
        if (soundText) {
          soundText.textContent = enabled ? 'SOM [ON]' : 'SOM [OFF]';
        } else {
          soundToggle.textContent = enabled ? '🔊 SOM [ON]' : '🔇 SOM [OFF]';
        }
        soundToggle.classList.toggle('active', enabled);
        if (enabled) this.soundFX.playTacticalBeep();
      });
    }

    // Botão de Ambiência Paranormal HUD
    const ambientToggle = document.getElementById('btn-toggle-ambient');
    const ambientText = document.getElementById('ambient-btn-text');
    if (ambientToggle) {
      ambientToggle.addEventListener('click', () => {
        const active = this.soundFX.toggleAmbient();
        if (ambientText) {
          ambientText.textContent = active ? 'AMBIÊNCIA [ON]' : 'AMBIÊNCIA [OFF]';
        }
        ambientToggle.classList.toggle('active', active);
        if (active) this.soundFX.playTacticalBeep();
      });
    }

    // Botão de fechar modal do rolador de dados
    document.getElementById('btn-close-dice-modal')?.addEventListener('click', () => {
      this.closeModal('modal-dice-roll');
    });

    // Gerenciador global de cliques (Fechar modais com data-close e fechar dropdown de busca)
    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('.btn-close-modal');
      if (closeBtn) {
        const modalId = closeBtn.getAttribute('data-close');
        if (modalId) this.closeModal(modalId);
      }

      const searchWrap = document.querySelector('.hud-search-wrap');
      if (searchWrap && !searchWrap.contains(e.target)) {
        this.closeSearchDropdown();
      }
    });

    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('open');
        }
      });
    });

    // Barra de Busca
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
      searchInput.addEventListener('focus', () => {
        this.soundFX.init();
        if (searchInput.value.trim().length >= 2) {
          this.handleSearch(searchInput.value);
        }
      });
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeSearchDropdown();
          searchInput.blur();
        }
      });
    }
  }

  populateCampaignFilter() {
    const select = document.getElementById('campaign-filter');
    if (!select) return;

    select.innerHTML = '<option value="all">Todas as Campanhas</option>';
    const campaigns = this.dataLoader.getCampaigns();
    campaigns.forEach(camp => {
      const opt = document.createElement('option');
      opt.value = camp.id;
      opt.textContent = `${camp.title} (${camp.status})`;
      select.appendChild(opt);
    });
  }

  onCampaignFilterChange() {
    const filter = this.currentCampaignFilter;

    // Se o usuário selecionou 'Todas as Campanhas' e está no mapa local, retorna ao mapa múndi
    if (filter === 'all') {
      if (window.planetEngine) {
        window.planetEngine.setFilter({ status: 'all' });
        window.planetEngine.setScaleView('global');
      }
      if (window.app?.mapEngine && window.app.mapEngine.currentScale === 'local') {
        window.retornarAoMapaMundi();
      }
    } else {
      // Se selecionou uma campanha específica no Planeta 3D, foca a campanha
      if (window.planetEngine) {
        window.planetEngine.focusCampaign(filter);
        if (window.museumController) {
          setTimeout(() => {
            window.museumController.openExhibitionModal(filter);
          }, 900);
        }
      } else if (window.app?.mapEngine && (window.app.mapEngine.currentScale === 'global' || window.app.mapEngine.currentRpgId !== filter)) {
        window.mergulhoNasNuvens(filter);
      }
    }

    // Atualiza listas da gaveta
    this.renderCharactersList();
    this.renderChroniclesList();

    // Seleciona o primeiro personagem válido da campanha
    const chars = this.dataLoader.getCharacters(this.currentCampaignFilter);
    if (chars.length > 0) {
      this.currentCharacterId = chars[0].id;
      this.renderActiveCharacterSheet();
    }
  }

  /* --- GAVETA LATERAL --- */
  openDrawer(tabKey = 'characters', forceDive = false) {
    if (forceDive && window.app?.mapEngine && window.app.mapEngine.currentScale === 'global') {
      const targetCamp = this.currentCampaignFilter !== 'all' ? this.currentCampaignFilter : 'camp_002';
      window.mergulhoNasNuvens(targetCamp).then(() => {
        const drawer = document.getElementById('side-drawer');
        if (drawer) {
          drawer.classList.add('open');
          this.switchTab(tabKey);
          if (window.app?.mapEngine?.map) {
            setTimeout(() => window.app.mapEngine.map.invalidateSize(), 320);
          }
        }
      });
      return;
    }

    const drawer = document.getElementById('side-drawer');
    if (drawer) {
      drawer.classList.add('open');
      this.switchTab(tabKey);
      if (window.app?.mapEngine?.map) {
        setTimeout(() => window.app.mapEngine.map.invalidateSize(), 320);
      }
    }
  }

  closeDrawer() {
    const drawer = document.getElementById('side-drawer');
    if (drawer) {
      drawer.classList.remove('open');
      if (window.app?.mapEngine?.map) {
        setTimeout(() => window.app.mapEngine.map.invalidateSize(), 320);
      }
    }
  }

  switchTab(tabKey) {
    document.querySelectorAll('.drawer-tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-tab') === tabKey);
    });

    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tabKey}`);
    });

    if (tabKey === 'bestiary') {
      this.renderBestiaryList();
    } else if (tabKey === 'relics') {
      this.renderRelicsList();
    }
  }

  /* --- FICHAS DE PERSONAGEM --- */
  renderCharactersList() {
    const container = document.getElementById('character-selector-row');
    if (!container) return;

    const characters = this.dataLoader.getCharacters(this.currentCampaignFilter);
    container.innerHTML = '';

    characters.forEach(char => {
      const pill = document.createElement('button');
      pill.className = `entity-pill ${char.id === this.currentCharacterId ? 'active' : ''}`;
      pill.textContent = char.name;
      pill.addEventListener('click', () => {
        this.currentCharacterId = char.id;
        document.querySelectorAll('#character-selector-row .entity-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.renderActiveCharacterSheet();
        this.soundFX.playTacticalBeep();
      });
      container.appendChild(pill);
    });
  }

  selectCharacter(charId) {
    this.currentCharacterId = charId;
    this.renderCharactersList();
    this.renderActiveCharacterSheet();
  }

  renderActiveCharacterSheet() {
    const container = document.getElementById('character-sheet-container');
    if (!container) return;

    const char = this.dataLoader.getCharacterById(this.currentCharacterId);
    if (!char) {
      container.innerHTML = '<div style="color: var(--color-text-muted); padding: 20px;">Personagem não encontrado.</div>';
      return;
    }

    // Status de Vida Canônico CRIS
    const lifeStatus = char.life_status || (char.status?.toLowerCase().includes('resgatado') ? 'alive' : (char.status?.toLowerCase().includes('ativo') ? 'alive' : 'alive'));
    let lifeStatusBadge = '🟢 VIVO';
    let lifeStatusClass = 'alive';
    if (lifeStatus === 'dead' || char.status?.toLowerCase().includes('morto')) {
      lifeStatusBadge = '💀 FALECIDO';
      lifeStatusClass = 'dead';
    } else if (lifeStatus === 'missing' || char.status?.toLowerCase().includes('desaparecido')) {
      lifeStatusBadge = '🌀 DESAPARECIDO';
      lifeStatusClass = 'missing';
    } else if (lifeStatus === 'quarantine' || char.status?.toLowerCase().includes('quarentena')) {
      lifeStatusBadge = '🏥 EM QUARENTENA';
      lifeStatusClass = 'quarantine';
    }

    // Estatísticas CRIS (PV, PE, SAN, Defesa, Proteção)
    const stats = char.stats || {};
    const pvCur = stats.pv_current ?? stats.pv?.current ?? 25;
    const pvMax = stats.pv_max ?? stats.pv?.max ?? 25;
    const peCur = stats.pe_current ?? stats.pe?.current ?? 15;
    const peMax = stats.pe_max ?? stats.pe?.max ?? 15;
    const sanCur = stats.san_current ?? stats.san?.current ?? 20;
    const sanMax = stats.san_max ?? stats.san?.max ?? 30;
    const defesa = stats.defesa ?? 10;
    const protecao = typeof stats.protecao === 'object' ? `RD ${stats.protecao.rd || stats.protecao || 0}` : (stats.protecao || "Nenhuma");

    const pvRatio = Math.max(0, Math.min(100, (pvCur / (pvMax || 1)) * 100));
    const peRatio = Math.max(0, Math.min(100, (peCur / (peMax || 1)) * 100));
    const sanRatio = Math.max(0, Math.min(100, (sanCur / (sanMax || 1)) * 100));

    // Atributos Canônicos CRIS (AGI, FOR, INT, PRE, VIG)
    const attrs = char.attributes || {};
    const agi = attrs.Agilidade ?? attrs.agi ?? 1;
    const forca = attrs.Força ?? attrs.for ?? 1;
    const int = attrs.Intelecto ?? attrs.int ?? 1;
    const pre = attrs.Presença ?? attrs.pre ?? 1;
    const vig = attrs.Vigor ?? attrs.vig ?? 1;

    // Perícias CRIS (28 canônicas)
    const rawSkills = char.skills || {};
    let normalizedSkills = {};
    if (Array.isArray(rawSkills)) {
      rawSkills.forEach(item => {
        const sName = item.name || 'Perícia';
        const sAttr = item.attr || 'INT';
        const sBonus = item.value || 0;
        const attrVal = sAttr === 'AGI' ? agi : (sAttr === 'FOR' ? forca : (sAttr === 'INT' ? int : (sAttr === 'PRE' ? pre : vig)));
        normalizedSkills[sName] = {
          grau: item.training || (sBonus >= 15 ? 'Expert' : (sBonus >= 10 ? 'Veterano' : (sBonus >= 5 ? 'Treinado' : 'Destreinado'))),
          bonus: sBonus,
          attr: sAttr,
          total: attrVal + sBonus
        };
      });
    } else {
      normalizedSkills = rawSkills;
    }

    const skillCategories = {
      mente: ['Atualidades', 'Ciências', 'Ciência', 'Investigação', 'Medicina', 'Ocultismo', 'Profissão', 'Sobrevivência', 'Tática', 'Tecnologia'],
      fisica: ['Acrobacia', 'Atletismo', 'Crime', 'Fortitude', 'Furtividade', 'Iniciativa', 'Luta', 'Pontaria', 'Reflexos'],
      social: ['Adestramento', 'Artes', 'Diplomacia', 'Enganação', 'Intimidação', 'Intuição', 'Percepção', 'Religião', 'Vontade']
    };

    const skillsHtml = Object.entries(normalizedSkills).map(([name, s]) => {
      let cat = 'social';
      if (skillCategories.mente.includes(name)) cat = 'mente';
      else if (skillCategories.fisica.includes(name)) cat = 'fisica';

      const grauClass = (s.grau || 'destreinado').toLowerCase();
      const isTrained = grauClass !== 'destreinado';
      const bonusFormatted = s.bonus > 0 ? `+${s.bonus}` : '+0';
      const totalFormatted = s.total >= 0 ? `+${s.total}` : `${s.total}`;

      return `
        <div class="cris-skill-item ${isTrained ? 'trained' : ''} ${grauClass}" data-skill="${this.escapeHtml(name)}" data-cat="${cat}" data-trained="${isTrained}">
          <div class="cris-skill-left">
            <span class="cris-skill-name">${this.escapeHtml(name)}</span>
            <span class="cris-skill-attr">[${s.attr || 'INT'}]</span>
          </div>
          <div class="cris-skill-right">
            <span class="cris-grau-badge ${grauClass}">${this.escapeHtml(s.grau || 'Destreinado')}</span>
            <span class="cris-skill-total" title="Bônus ${bonusFormatted} + Atributo">${totalFormatted}</span>
          </div>
        </div>
      `;
    }).join('');

    // Habilidades
    const abilitiesHtml = (char.abilities && char.abilities.length > 0)
      ? char.abilities.map(ab => {
          if (typeof ab === 'object' && ab) {
            const abName = this.escapeHtml(ab.name || 'Habilidade');
            const abType = this.escapeHtml(ab.type || 'Habilidade');
            const abCost = ab.cost ? ` [${this.escapeHtml(ab.cost)}]` : '';
            const abDesc = ab.desc ? `: ${this.escapeHtml(ab.desc)}` : '';
            return `<div class="cris-ability-pill">⚡ <strong>${abName}</strong> (${abType})${abCost}${abDesc}</div>`;
          }
          return `<div class="cris-ability-pill">⚡ ${this.escapeHtml(ab)}</div>`;
        }).join('')
      : '<div style="font-size: 0.75rem; color: #728a9c;">Nenhuma habilidade adicional registrada.</div>';

    // Inventário
    const inventoryHtml = (char.inventory && char.inventory.length > 0)
      ? char.inventory.map(item => {
          const itemText = typeof item === 'object' ? `${item.name}${item.desc ? ` - ${item.desc}` : ''}` : item;
          return `<div class="cris-item-pill">📦 ${this.escapeHtml(itemText)}</div>`;
        }).join('')
      : '<div style="font-size: 0.75rem; color: #728a9c;">Sem itens catalogados.</div>';

    // Relíquias
    let relicsHtml = '';
    if (char.relics && char.relics.length > 0) {
      relicsHtml = `
        <div class="cris-abilities-section" style="border-left-color: #ffd700;">
          <div class="section-label" style="color: #ffd700;">🏺 ARTEFATOS & RELÍQUIAS EMPUNHADAS</div>
          ${char.relics.map(r => `<div class="cris-item-pill" style="border-left-color: #ffd700; color: #ffe680;">⚡ <strong>${this.escapeHtml(r)}</strong></div>`).join('')}
        </div>
      `;
    }

    container.innerHTML = `
      <div class="character-sheet-card">
        <!-- CABEÇALHO DA FICHA CRIS -->
        <div class="cris-header-wrap">
          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 8px;">
            <button class="btn-secondary" style="font-size: 0.72rem; padding: 3px 8px; border-color: #ffd700; color: #ffd700;" onclick="window.uiController.exportActiveCharacterCris()" title="Exportar Ficha em Formato C.R.I.S. (JSON)">
              📤 Exportar C.R.I.S. (JSON)
            </button>
            <button class="btn-secondary" style="font-size: 0.72rem; padding: 3px 8px; border-color: #00e5ff; color: #00e5ff;" onclick="window.uiController.copyActiveCharacterJson()" title="Copiar JSON da Ficha">
              📋 Copiar JSON
            </button>
          </div>
          
          ${(() => {
            const charCampaign = this.dataLoader.getCampaignById(char.campaign_id) || this.dataLoader.getCampaigns().find(c => (c.participants && c.participants.includes(char.id)));
            return charCampaign ? `
              <div style="margin-bottom: 8px;">
                <button class="btn-campaign-pill-link" onclick="window.uiController.closeDrawer('characters'); window.uiController.openCampaignStory('${charCampaign.id}');" title="Ver Dossiê e História de ${this.escapeHtml(charCampaign.title)}">
                  📜 Campanha: <strong>${this.escapeHtml(charCampaign.title)}</strong> ➔
                </button>
              </div>
            ` : '';
          })()}
          <div class="cris-identity-row">
            <div>
              <h3 class="cris-name">${this.escapeHtml(char.name)}</h3>
              <div class="cris-codename">${this.escapeHtml(char.codename || '// AGENTE REGISTRADO //')}</div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
              <span class="cris-status-badge ${lifeStatusClass}">${lifeStatusBadge}</span>
              <div class="cris-status-select-wrap">
                <select class="cris-status-select" onchange="window.uiController.updateActiveLifeStatus(this.value)" title="Alterar Status Vital em Tempo Real">
                  <option value="alive" ${lifeStatus === 'alive' ? 'selected' : ''}>🟢 Vivo</option>
                  <option value="quarantine" ${lifeStatus === 'quarantine' ? 'selected' : ''}>🏥 Quarentena</option>
                  <option value="missing" ${lifeStatus === 'missing' ? 'selected' : ''}>🌀 Desaparecido</option>
                  <option value="dead" ${lifeStatus === 'dead' ? 'selected' : ''}>💀 Falecido</option>
                </select>
              </div>
              <span class="badge-tag player">${this.escapeHtml(char.player || 'Agente')}</span>
            </div>
          </div>

          <div class="cris-meta-grid">
            <div class="cris-meta-cell">
              <span class="cris-meta-label">CLASSE</span>
              <span class="cris-meta-val">${this.escapeHtml(char.class || 'Não informada')}</span>
            </div>
            <div class="cris-meta-cell">
              <span class="cris-meta-label">ORIGEM</span>
              <span class="cris-meta-val">${this.escapeHtml(char.origin || 'Sobrevivente')}</span>
            </div>
            <div class="cris-meta-cell">
              <span class="cris-meta-label">TRILHA</span>
              <span class="cris-meta-val">${this.escapeHtml(char.track || 'Geral')}</span>
            </div>
            <div class="cris-meta-cell">
              <span class="cris-meta-label">NEX / MDA</span>
              <span class="cris-meta-val" style="color: #00e5ff;">${this.escapeHtml(char.nex || char.mda || '0%')}</span>
            </div>
          </div>
          ${(char.race || char.virtue || char.element || char.modality || char.pact) ? `
            <div class="cris-meta-grid" style="margin-top: 6px;">
              ${char.race ? `<div class="cris-meta-cell"><span class="cris-meta-label">RAÇA / LINHAGEM</span><span class="cris-meta-val">${this.escapeHtml(char.race)}</span></div>` : ''}
              ${char.virtue ? `<div class="cris-meta-cell"><span class="cris-meta-label">VIRTUDE DE ALMA</span><span class="cris-meta-val" style="color:#ffd700;">${this.escapeHtml(char.virtue)}${char.modality ? ` (${this.escapeHtml(char.modality)})` : ''}</span></div>` : ''}
              ${char.element ? `<div class="cris-meta-cell"><span class="cris-meta-label">ELEMENTO</span><span class="cris-meta-val">${this.escapeHtml(char.element)}</span></div>` : ''}
              ${(char.pact && char.pact !== 'Nenhum') ? `<div class="cris-meta-cell"><span class="cris-meta-label">PACTO DA LENDA</span><span class="cris-meta-val" style="color:#c084fc;">${this.escapeHtml(char.pact)}</span></div>` : ''}
            </div>
          ` : ''}
        </div>

        <!-- BARRAS DE ESTATÍSTICAS CRIS (PV, PE, SAN, DEFESA) COM AJUSTES EM TEMPO REAL -->
        <div class="cris-stats-row">
          <div class="cris-stat-box">
            <div class="cris-stat-header">
              <span style="color: #ff5e78; font-weight: 700;">PV</span>
              <div class="cris-stat-adjust-group">
                <button class="cris-stat-btn btn-pv" onclick="window.uiController.adjustActiveStat('pv', -5)" title="-5 Pontos de Vida">-5</button>
                <button class="cris-stat-btn btn-pv" onclick="window.uiController.adjustActiveStat('pv', -1)" title="-1 Ponto de Vida">-1</button>
                <span style="color: #fff; font-weight: 700; min-width: 44px; text-align: center;">${pvCur} / ${pvMax}</span>
                <button class="cris-stat-btn btn-pv" onclick="window.uiController.adjustActiveStat('pv', 1)" title="+1 Ponto de Vida">+1</button>
                <button class="cris-stat-btn btn-pv" onclick="window.uiController.adjustActiveStat('pv', 5)" title="+5 Pontos de Vida">+5</button>
              </div>
            </div>
            <div class="cris-stat-track">
              <div class="cris-stat-fill-pv" style="width: ${pvRatio}%;"></div>
            </div>
          </div>

          <div class="cris-stat-box">
            <div class="cris-stat-header">
              <span style="color: #ffa726; font-weight: 700;">PE</span>
              <div class="cris-stat-adjust-group">
                <button class="cris-stat-btn btn-pe" onclick="window.uiController.adjustActiveStat('pe', -1)" title="-1 Ponto de Esforço">-1</button>
                <span style="color: #fff; font-weight: 700; min-width: 44px; text-align: center;">${peCur} / ${peMax}</span>
                <button class="cris-stat-btn btn-pe" onclick="window.uiController.adjustActiveStat('pe', 1)" title="+1 Ponto de Esforço">+1</button>
              </div>
            </div>
            <div class="cris-stat-track">
              <div class="cris-stat-fill-pe" style="width: ${peRatio}%;"></div>
            </div>
          </div>

          <div class="cris-stat-box">
            <div class="cris-stat-header">
              <span style="color: #00e5ff; font-weight: 700;">SAN</span>
              <div class="cris-stat-adjust-group">
                <button class="cris-stat-btn btn-san" onclick="window.uiController.adjustActiveStat('san', -5)" title="-5 Sanidade">-5</button>
                <button class="cris-stat-btn btn-san" onclick="window.uiController.adjustActiveStat('san', -1)" title="-1 Sanidade">-1</button>
                <span style="color: #fff; font-weight: 700; min-width: 44px; text-align: center;">${sanCur} / ${sanMax}</span>
                <button class="cris-stat-btn btn-san" onclick="window.uiController.adjustActiveStat('san', 1)" title="+1 Sanidade">+1</button>
                <button class="cris-stat-btn btn-san" onclick="window.uiController.adjustActiveStat('san', 5)" title="+5 Sanidade">+5</button>
              </div>
            </div>
            <div class="cris-stat-track">
              <div class="cris-stat-fill-san" style="width: ${sanRatio}%;"></div>
            </div>
          </div>

          <div class="cris-defense-card" title="Proteção: ${this.escapeHtml(protecao)}">
            <span style="font-family: monospace; font-size: 9px; color: #ffd700;">DEFESA</span>
            <span class="cris-defense-num">${defesa}</span>
          </div>
        </div>

        <!-- 5 ATRIBUTOS MONUMENTAIS (AGI, FOR, INT, PRE, VIG) -->
        <div class="cris-attributes-container">
          <div class="section-label">📊 ATRIBUTOS CANÔNICOS (CRIS)</div>
          <div class="cris-attrs-grid">
            <div class="cris-attr-monument">
              <span class="cris-attr-tag">AGI</span>
              <span class="cris-attr-num">${agi}</span>
            </div>
            <div class="cris-attr-monument">
              <span class="cris-attr-tag">FOR</span>
              <span class="cris-attr-num">${forca}</span>
            </div>
            <div class="cris-attr-monument">
              <span class="cris-attr-tag">INT</span>
              <span class="cris-attr-num">${int}</span>
            </div>
            <div class="cris-attr-monument">
              <span class="cris-attr-tag">PRE</span>
              <span class="cris-attr-num">${pre}</span>
            </div>
            <div class="cris-attr-monument">
              <span class="cris-attr-tag">VIG</span>
              <span class="cris-attr-num">${vig}</span>
            </div>
          </div>
        </div>

        <!-- TABELA DE PERÍCIAS CANÔNICAS CRIS -->
        <div class="cris-skills-section">
          <div class="cris-skills-toolbar">
            <div class="section-label">🎯 PERÍCIAS DO AGENTE (${Object.keys(normalizedSkills).length || 28})</div>
            <div class="cris-skills-pills">
              <button class="cris-skill-filter-btn active" onclick="window.uiController.filterSkills('all', this)">Todas</button>
              <button class="cris-skill-filter-btn" onclick="window.uiController.filterSkills('trained', this)">Treinadas</button>
              <button class="cris-skill-filter-btn" onclick="window.uiController.filterSkills('mente', this)">Mente</button>
              <button class="cris-skill-filter-btn" onclick="window.uiController.filterSkills('fisica', this)">Físicas</button>
              <button class="cris-skill-filter-btn" onclick="window.uiController.filterSkills('social', this)">Sociais</button>
            </div>
          </div>
          <div class="cris-skills-grid" id="cris-skills-grid">
            ${skillsHtml}
          </div>
        </div>

        <!-- HABILIDADES & TRILHA -->
        <div class="cris-abilities-section">
          <div class="section-label">⚡ HABILIDADES & PODERES</div>
          ${abilitiesHtml}
        </div>

        <!-- INVENTÁRIO & ARMAS -->
        <div class="cris-inventory-section">
          <div class="section-label">🎒 INVENTÁRIO & EQUIPAMENTO</div>
          ${inventoryHtml}
        </div>

        <!-- RELÍQUIAS -->
        ${relicsHtml}

        <!-- CITAÇÃO MARCANTE -->
        ${char.quote ? `
          <div class="cris-quote-box">
            <div class="cris-quote-text">"${this.escapeHtml(char.quote)}"</div>
          </div>
        ` : ''}

        <!-- MEMORIAL & DOSSIÊ HISTÓRICO -->
        <div class="sheet-summary-section">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
            <div class="section-label" style="margin-bottom:0;">📜 MEMORIAL & DOSSIÊ CONFIDENCIAL</div>
            <div style="display: flex; gap: 6px;">
              <button class="btn-secondary" id="btn-copy-summary" style="font-size:0.7rem; padding: 2px 8px; border-color: rgba(255, 215, 0, 0.4); color: #ffd700;" onclick="window.uiController.copyCharacterSummary('${char.id}')">📋 Copiar Resumo</button>
              <button class="btn-secondary" style="font-size:0.7rem; padding: 2px 8px; border-color: rgba(0, 229, 255, 0.4); color: #00e5ff;" onclick="window.uiController.exportCharacterSheet('${char.id}')">💾 Exportar (.md)</button>
            </div>
          </div>
          <p class="summary-content" style="white-space: pre-line;">${this.escapeHtml(char.summary || 'Sem registro biográfico arquivado.')}</p>
        </div>
      </div>
    `;
  }

  /* --- MÉTODOS DE CONTROLE & AJUSTES EM TEMPO REAL CRIS --- */
  adjustActiveStat(statName, delta) {
    const char = this.dataLoader.getCharacterById(this.currentCharacterId);
    if (!char) return;

    if (!char.stats) char.stats = {};

    let curKey, maxKey, statLabel;
    if (statName === 'pv') {
      curKey = 'pv_current';
      maxKey = 'pv_max';
      statLabel = 'Pontos de Vida (PV)';
    } else if (statName === 'pe') {
      curKey = 'pe_current';
      maxKey = 'pe_max';
      statLabel = 'Pontos de Esforço (PE)';
    } else if (statName === 'san') {
      curKey = 'san_current';
      maxKey = 'san_max';
      statLabel = 'Sanidade (SAN)';
    } else {
      return;
    }

    const maxVal = char.stats[maxKey] ?? char.stats[statName]?.max ?? 25;
    const oldVal = char.stats[curKey] ?? char.stats[statName]?.current ?? maxVal;
    const newVal = Math.max(0, Math.min(maxVal, oldVal + delta));

    char.stats[curKey] = newVal;
    if (char.stats[statName] && typeof char.stats[statName] === 'object') {
      char.stats[statName].current = newVal;
    }

    // Auto-save override
    this.saveCharacterStatOverride(char.id, { [curKey]: newVal });

    // Feedback sonoro e registro no Diário
    if (delta > 0) {
      if (this.soundFX) this.soundFX.playTacticalBeep();
    } else {
      if (this.soundFX) this.soundFX.playGlitchBurst();
    }

    if (window.sessionJournal) {
      const sign = delta > 0 ? `+${delta}` : `${delta}`;
      window.sessionJournal.logEvent(`🩸 ${char.name} [${statLabel}]: ${oldVal} ➔ ${newVal} (${sign})`);
    }

    // Alerta se PV zerou
    if (statName === 'pv' && newVal <= 0 && oldVal > 0) {
      if (confirm(`⚠️ O agente ${char.name} caiu a 0 PV! Deseja marcar seu status como 'FALECIDO' no Memorial de Evren?`)) {
        this.updateActiveLifeStatus('dead');
        return;
      }
    }

    this.renderActiveCharacterSheet();
  }

  updateActiveLifeStatus(newStatus) {
    const char = this.dataLoader.getCharacterById(this.currentCharacterId);
    if (!char) return;

    char.life_status = newStatus;
    this.saveCharacterStatOverride(char.id, { life_status: newStatus });

    const labels = {
      alive: '🟢 VIVO',
      quarantine: '🏥 EM QUARENTENA',
      missing: '🌀 DESAPARECIDO',
      dead: '💀 FALECIDO'
    };

    if (window.sessionJournal) {
      window.sessionJournal.logEvent(`🏷️ Status vital de ${char.name} alterado para: ${labels[newStatus] || newStatus}`);
    }

    if (this.soundFX) this.soundFX.playTacticalBeep();

    this.renderActiveCharacterSheet();
    this.renderCharactersList();
  }

  saveCharacterStatOverride(charId, update) {
    try {
      const raw = localStorage.getItem('evren_character_stat_overrides');
      const overrides = raw ? JSON.parse(raw) : {};
      if (!overrides[charId]) overrides[charId] = {};
      Object.assign(overrides[charId], update);
      localStorage.setItem('evren_character_stat_overrides', JSON.stringify(overrides));
    } catch(e) {
      console.warn('Erro ao salvar override de status:', e);
    }
  }

  loadCharacterStatOverridesFromStorage() {
    try {
      const stored = localStorage.getItem('evren_character_stat_overrides');
      if (!stored) return;
      const overrides = JSON.parse(stored);
      if (typeof overrides !== 'object') return;

      Object.entries(overrides).forEach(([charId, diff]) => {
        const char = this.dataLoader?.getCharacterById ? this.dataLoader.getCharacterById(charId) : null;
        if (char) {
          if (!char.stats) char.stats = {};
          if (diff.pv_current !== undefined) {
            char.stats.pv_current = diff.pv_current;
            if (char.stats.pv && typeof char.stats.pv === 'object') char.stats.pv.current = diff.pv_current;
          }
          if (diff.pe_current !== undefined) {
            char.stats.pe_current = diff.pe_current;
            if (char.stats.pe && typeof char.stats.pe === 'object') char.stats.pe.current = diff.pe_current;
          }
          if (diff.san_current !== undefined) {
            char.stats.san_current = diff.san_current;
            if (char.stats.san && typeof char.stats.san === 'object') char.stats.san.current = diff.san_current;
          }
          if (diff.life_status) char.life_status = diff.life_status;
        }
      });
    } catch(e) {
      console.warn('Erro ao restaurar overrides de status:', e);
    }
  }

  loadCustomCrisCharactersFromStorage() {
    try {
      const stored = localStorage.getItem('evren_custom_characters');
      if (!stored) return;
      const list = JSON.parse(stored);
      if (!Array.isArray(list)) return;

      if (!this.dataLoader.data.characters) this.dataLoader.data.characters = [];

      list.forEach(item => {
        const char = item.char || item;
        if (char && char.id && !this.dataLoader.data.characters.some(c => c.id === char.id)) {
          this.dataLoader.data.characters.push(char);
          if (item.attributes) this.charAttributes[char.id] = item.attributes;
          if (item.pd) this.pdState[char.id] = item.pd;
          if (item.mda) this.mdaState[char.id] = item.mda;
        }
      });
    } catch(e) {
      console.warn('Erro ao restaurar fichas CRIS do localStorage:', e);
    }
  }

  loadCustomChroniclesFromStorage() {
    try {
      const stored = localStorage.getItem('evren_custom_chronicles');
      if (!stored) return;
      const list = JSON.parse(stored);
      if (!Array.isArray(list)) return;

      if (!this.dataLoader.data.chronicles) this.dataLoader.data.chronicles = [];

      list.forEach(c => {
        if (c && c.id && !this.dataLoader.data.chronicles.some(orig => orig.id === c.id)) {
          this.dataLoader.data.chronicles.unshift(c);
        }
      });
    } catch(e) {
      console.warn('Erro ao restaurar crônicas do localStorage:', e);
    }
  }

  getLocationNote(locId) {
    try {
      return localStorage.getItem('evren_loc_note_' + locId) || '';
    } catch(e) {
      return '';
    }
  }

  saveLocationNote(locId, text) {
    try {
      localStorage.setItem('evren_loc_note_' + locId, text);
    } catch(e){}
  }

  filterSkills(category, btnEl) {
    if (btnEl) {
      document.querySelectorAll('.cris-skill-filter-btn').forEach(b => b.classList.remove('active'));
      btnEl.classList.add('active');
    }

    const items = document.querySelectorAll('#cris-skills-grid .cris-skill-item');
    items.forEach(item => {
      const cat = item.getAttribute('data-cat');
      const isTrained = item.getAttribute('data-trained') === 'true';

      if (category === 'all') {
        item.style.display = 'flex';
      } else if (category === 'trained') {
        item.style.display = isTrained ? 'flex' : 'none';
      } else {
        item.style.display = (cat === category) ? 'flex' : 'none';
      }
    });

    if (this.soundFX) this.soundFX.playTacticalBeep();
  }

  copyCharacterSummary(charId) {
    const char = this.dataLoader.getCharacterById(charId);
    if (!char) return;

    const attrs = char.attributes || { Agilidade: 2, Força: 2, Intelecto: 2, Presença: 2, Vigor: 2 };
    const stats = char.stats || { pv_current: 25, pv_max: 25, pe_current: 15, pe_max: 15, san_current: 20, san_max: 30, defesa: 15 };

    const text = `=== FICHA DE AGENTE: ${char.name.toUpperCase()} ===
Codinome: ${char.codename || 'N/A'} | Status: ${char.status || 'Ativo'}
Origem: ${char.origin || 'Sobrevivente'} | Classe: ${char.class || 'N/A'} (${char.track || 'Trilha Base'})
NEX/MDA: ${char.nex || char.mda || '0%'}
PV: ${stats.pv_current}/${stats.pv_max} | PE: ${stats.pe_current}/${stats.pe_max} | SAN: ${stats.san_current}/${stats.san_max} | DEFESA: ${stats.defesa}
Atributos: AGI ${attrs.Agilidade} | FOR ${attrs.Força} | INT ${attrs.Intelecto} | PRE ${attrs.Presença} | VIG ${attrs.Vigor}
Citação: "${char.quote || ''}"
Dossiê: ${char.summary || ''}
(Salvo via Mesa Interativa Universo Evren)`;

    navigator.clipboard?.writeText(text).then(() => {
      const btn = document.getElementById('btn-copy-summary');
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = '✓ Copiado!';
        setTimeout(() => { btn.textContent = orig; }, 2000);
      }
      if (this.soundFX) this.soundFX.playTacticalBeep();
    });
  }

  exportCharacterSheet(charId) {
    const char = this.dataLoader.getCharacterById(charId);
    if (!char) return;
    const attrs = char.attributes || { Agilidade: 2, Força: 2, Intelecto: 2, Presença: 2, Vigor: 2 };
    const stats = char.stats || { pv_current: 25, pv_max: 25, pe_current: 15, pe_max: 15, san_current: 20, san_max: 30, defesa: 15, protecao: 'Nenhuma' };

    const skillsMd = Object.entries(char.skills || {}).map(([name, s]) => {
      return `| **${name}** | ${s.attr} | ${s.grau} | ${s.bonus >= 0 ? '+' + s.bonus : s.bonus} | **${s.total >= 0 ? '+' + s.total : s.total}** |`;
    }).join('\n');

    const abilitiesMd = (char.abilities || []).map(a => `- ${a}`).join('\n') || '- Nenhuma';
    const inventoryMd = (char.inventory || []).map(i => `- ${i}`).join('\n') || '- Nenhum';
    const relicsMd = (char.relics || []).map(r => `- ⚡ **${r}**`).join('\n') || '- Nenhuma relíquia empunhada';

    const mdContent = `# FICHA DE AGENTE (CRIS) — UNIVERSO EVREN
# ${char.name} ${char.codename ? `("${char.codename}")` : ''}

- **Jogador / Mestre:** ${char.player}
- **Status de Vida:** ${char.status || 'Ativo'}
- **Origem:** ${char.origin || 'Sobrevivente'}
- **Classe & Trilha:** ${char.class || 'Combatente'} (${char.track || 'Base'})
- **NEX / Nível de Exposição:** ${char.nex || char.mda || '0%'}

---

## 📊 Atributos Canônicos
| AGI (Agilidade) | FOR (Força) | INT (Intelecto) | PRE (Presença) | VIG (Vigor) |
|:---:|:---:|:---:|:---:|:---:|
| **${attrs.Agilidade}** | **${attrs.Força}** | **${attrs.Intelecto}** | **${attrs.Presença}** | **${attrs.Vigor}** |

---

## 🩸 Estatísticas Vitais
- **Pontos de Vida (PV):** ${stats.pv_current} / ${stats.pv_max}
- **Pontos de Esforço (PE):** ${stats.pe_current} / ${stats.pe_max}
- **Sanidade (SAN):** ${stats.san_current} / ${stats.san_max}
- **Defesa Passiva:** ${stats.defesa}
- **Proteção / Armadura:** ${stats.protecao || 'Nenhuma'}

---

## 🎯 Perícias Canônicas (CRIS)
| Perícia | Attr | Treinamento | Bônus | Total |
|---|:---:|:---:|:---:|:---:|
${skillsMd}

---

## ⚡ Habilidades & Poderes de Trilha
${abilitiesMd}

## 🎒 Inventário & Armas
${inventoryMd}

## 🏺 Artefatos & Relíquias
${relicsMd}

---

## 📜 Citação Marcante
> "${char.quote || '...'}"

## 🗂️ Memorial & Dossiê Histórico
${char.summary || 'Sem registro adicional.'}

---
*Compêndio de RPG — Universo EVREN (Guia & Memorial de Histórias)*
`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ficha_cris_${char.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (this.soundFX) this.soundFX.playTacticalBeep();
  }

  /* ==========================================================================
     CENTRAL DE HISTÓRIAS & SAGAS (HUB DE CAMPANHAS)
     ========================================================================== */
  renderCampaignsHub(filter = 'all') {
    const grid = document.getElementById('hub-campaigns-grid');
    if (!grid) return;

    let campaigns = this.dataLoader.getCampaigns();
    if (filter === 'ongoing') {
      campaigns = campaigns.filter(c => (c.category === 'ongoing' || c.status?.toLowerCase().includes('andamento') || c.status?.toLowerCase().includes('ativa')));
    } else if (filter === 'completed') {
      campaigns = campaigns.filter(c => (c.category === 'completed' || c.status?.toLowerCase().includes('finalizada') || c.status?.toLowerCase().includes('concluída')));
    }

    if (campaigns.length === 0) {
      grid.innerHTML = '<div style="color: #728a9c; padding: 30px; text-align: center; grid-column: 1/-1;">Nenhuma campanha encontrada nesta categoria.</div>';
      return;
    }

    grid.innerHTML = campaigns.map(c => {
      const isFuture = (c.status && c.status.toLowerCase().includes('futur')) || c.id !== 'camp_002';
      const isCompleted = !isFuture && (c.category === 'completed' || c.status?.toLowerCase().includes('finalizada') || c.status?.toLowerCase().includes('concluída'));
      const statusBadge = isFuture ? '🔮 (FUTURA CAMPANHA)' : (isCompleted ? '📜 CONCLUÍDA / HISTÓRICA' : '🟢 EM ANDAMENTO');
      const statusClass = isFuture ? 'future' : (isCompleted ? 'completed' : 'ongoing');

      // Agentes participantes
      const participantIds = c.participants || [];
      const participantsHtml = participantIds.map(pId => {
        const pChar = this.dataLoader.getCharacterById(pId);
        if (!pChar) return '';
        const shortLabel = this.formatShortCharLabel(pChar.name);
        return `
          <button class="campaign-participant-tag" onclick="window.uiController.selectCharacter('${pChar.id}'); window.uiController.closeModal('modal-campaigns-hub'); window.uiController.openDrawer('characters');" title="Ver Ficha CRIS de ${this.escapeHtml(pChar.name)}">
            👤 ${this.escapeHtml(shortLabel)}
          </button>
        `;
      }).join('');

      return `
        <div class="campaign-card ${statusClass}">
          <div class="campaign-card-header">
            <div>
              <h3 class="campaign-card-title clickable" onclick="window.uiController.closeModal('modal-campaigns-hub'); window.uiController.openCampaignStory('${c.id}');" title="Clique para abrir o Dossiê Completo da História">${this.escapeHtml(c.title)}</h3>
              <div class="campaign-meta-row" style="margin-top: 4px;">
                <span class="campaign-meta-item">📍 ${this.escapeHtml(c.country_location || 'Mundo')}</span>
                <span class="campaign-meta-item">⏳ ${this.escapeHtml(c.year || 'Era Atual')}</span>
                <span class="campaign-meta-item">🎭 ${this.escapeHtml(c.theme || 'Horror')}</span>
              </div>
            </div>
            <span class="campaign-status-badge ${statusClass}">${statusBadge}</span>
          </div>

          <div class="campaign-synopsis">
            ${this.escapeHtml(c.synopsis || c.description || '')}
          </div>

          ${c.outcome ? `
            <div class="campaign-outcome-box">
              <strong>DESFECHO HISTÓRICO:</strong><br>
              ${this.escapeHtml(c.outcome)}
            </div>
          ` : ''}

          ${participantsHtml ? `
            <div class="campaign-participants-row">
              <span style="font-family: monospace; font-size: 0.72rem; color: #8da4be;">AGENTES ENVOLVIDOS:</span>
              ${participantsHtml}
            </div>
          ` : ''}

          <div class="campaign-card-actions">
            <button class="btn-campaign-story-open" onclick="window.uiController.closeModal('modal-campaigns-hub'); window.uiController.openCampaignStory('${c.id}');">
              📖 Dossiê Completo
            </button>
            <button class="btn-secondary" style="border-color: #ffd700; color: #ffd700; font-size: 0.78rem; padding: 6px 12px;" onclick="window.uiController.closeModal('modal-campaigns-hub'); if (window.museumController) window.museumController.switchTo3DView(); if (window.planetEngine) window.planetEngine.focusCampaign('${c.id}');">
              🪐 Focar no Planeta 3D
            </button>
            <button class="btn-campaign-dive" onclick="window.uiController.closeModal('modal-campaigns-hub'); window.mergulhoNasNuvens('${c.id}');">
              📍 Mapa Tático 2D
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ==========================================================================
     ATLAS DE LOCAIS & MARCOS DAS HISTÓRIAS
     ========================================================================== */
  
  /* ==========================================================================
     DOSSIÊ INTERATIVO DE HISTÓRIA DO RPG (#modal-campaign-story)
     ========================================================================== */
  openCampaignStory(campaignId) {
    let camp = this.dataLoader.getCampaignById(campaignId);
    if (!camp) {
      const allCamps = this.dataLoader.getCampaigns();
      camp = allCamps.find(c => c.id === campaignId || c.title?.toLowerCase().includes(campaignId.toLowerCase()));
      if (!camp && allCamps.length > 0) camp = allCamps[0];
    }
    if (!camp) return;

    if (window.museumController) {
      window.museumController.openExhibitionModal(camp.id);
      return;
    }

    // Atualiza título do modal
    const titleEl = document.getElementById('story-modal-title-text');
    if (titleEl) {
      titleEl.textContent = `${camp.title.toUpperCase()} // DOSSIÊ COMPLETO`;
    }

    const modalBody = document.getElementById('campaign-story-content');
    if (!modalBody) return;

    const isFuture = (camp.status && camp.status.toLowerCase().includes('futur')) || camp.id !== 'camp_002';
    const isCompleted = !isFuture && (camp.category === 'completed' || camp.status?.toLowerCase().includes('finalizada') || camp.status?.toLowerCase().includes('concluída'));
    const statusBadge = isFuture ? '🔮 (FUTURA CAMPANHA)' : (isCompleted ? '📜 CONCLUÍDA / ARQUIVADA' : '🟢 EM ANDAMENTO / ATIVA');
    const statusClass = isFuture ? 'future' : (isCompleted ? 'completed' : 'ongoing');

    // Personagens vinculados a esta campanha
    const characters = this.getCampaignCharacters(camp.id);
    const locations = this.getCampaignLocations(camp.id);
    const chronicles = this.dataLoader.getChronicles(camp.id);

    // Renderiza personagens em cartões interativos
    const charactersHtml = characters.length > 0 ? characters.map(ch => {
      const lifeStatus = ch.life_status || (ch.status?.toLowerCase().includes('resgatado') ? 'alive' : (ch.status?.toLowerCase().includes('ativo') ? 'alive' : 'alive'));
      let badgeText = '🟢 VIVO';
      let badgeClass = 'alive';
      if (lifeStatus === 'dead' || ch.status?.toLowerCase().includes('morto')) {
        badgeText = '💀 FALECIDO';
        badgeClass = 'dead';
      } else if (lifeStatus === 'missing' || ch.status?.toLowerCase().includes('desaparecido')) {
        badgeText = '🌀 DESAPARECIDO';
        badgeClass = 'missing';
      } else if (lifeStatus === 'quarantine' || ch.status?.toLowerCase().includes('quarentena')) {
        badgeText = '🏥 QUARENTENA';
        badgeClass = 'quarantine';
      }

      const attrs = ch.attributes || {};
      const statsSummary = `FOR ${attrs.Força || attrs.for || 1} • AGI ${attrs.Agilidade || attrs.agi || 1} • INT ${attrs.Intelecto || attrs.int || 1} • PRE ${attrs.Presença || attrs.pre || 1} • VIG ${attrs.Vigor || attrs.vig || 1}`;

      return `
        <div class="story-character-card">
          <div class="story-char-header">
            <div>
              <div class="story-char-name">${this.escapeHtml(ch.name)}</div>
              <div class="story-char-player">${this.escapeHtml(ch.player || 'Jogador')} • ${this.escapeHtml(ch.origin || 'Sobrevivente')}</div>
            </div>
            <span class="story-char-status ${badgeClass}">${badgeText}</span>
          </div>
          <div class="story-char-summary">
            <strong>Classe:</strong> ${this.escapeHtml(ch.class || 'Não informada')} | <strong>NEX:</strong> ${this.escapeHtml(ch.nex || ch.mda || '0%')}<br>
            <span style="font-size: 0.72rem; color: #8da4be;">${statsSummary}</span>
          </div>
          <div class="story-char-actions">
            <button class="btn-story-char-action" onclick="window.uiController.closeModal('modal-campaign-story'); window.uiController.selectCharacter('${ch.id}'); window.uiController.openDrawer('characters');" title="Abrir Ficha C.R.I.S. com 28 perícias e inventário">
              👁️ Ver Ficha C.R.I.S.
            </button>
          </div>
        </div>
      `;
    }).join('') : '<div style="color: #728a9c; font-size: 0.85rem; padding: 12px; grid-column: 1/-1;">Nenhum personagem registrado diretamente nesta história.</div>';

    // Renderiza locais da campanha
    const locationsHtml = locations.length > 0 ? locations.map(loc => {
      return `
        <div class="story-location-card">
          <div class="story-loc-header">
            <div class="story-loc-name">📍 ${this.escapeHtml(loc.name)}</div>
            <span class="story-loc-badge">${this.escapeHtml(loc.type || 'Setor')}</span>
          </div>
          <div class="story-loc-desc">${this.escapeHtml(loc.description || 'Ponto tático chave da narrativa.')}</div>
          <div class="story-loc-actions">
            <button class="btn-story-loc-action" onclick="window.uiController.closeModal('modal-campaign-story'); window.uiController.openLocationDossier('${loc.id}'); if(window.app?.mapEngine) window.app.mapEngine.flyToLocation('${loc.id}');" title="Ver Dossiê e Focar no Mapa">
              🎯 Focar & Ver Dossiê
            </button>
          </div>
        </div>
      `;
    }).join('') : '<div style="color: #728a9c; font-size: 0.85rem; padding: 12px; grid-column: 1/-1;">Nenhum marco geográfico específico arquivado.</div>';

    // Renderiza crônicas / episódios
    const chroniclesHtml = chronicles.length > 0 ? chronicles.map((cr, idx) => {
      return `
        <div class="story-chronicle-item">
          <div class="story-chron-header">
            <h4 style="margin: 0; color: #ffd700; font-size: 0.95rem;">
              📖 Sessão ${idx + 1}: ${this.escapeHtml(cr.title)}
            </h4>
            <span style="font-family: monospace; font-size: 0.72rem; color: #8da4be;">
              ${this.escapeHtml(cr.date || camp.year || '')}
            </span>
          </div>
          <div class="story-chron-lore" style="margin-top: 6px;">
            ${this.escapeHtml(cr.lore || cr.summary || '')}
          </div>
          ${cr.quote ? `
            <div class="story-chron-quote">"${this.escapeHtml(cr.quote)}"</div>
          ` : ''}
        </div>
      `;
    }).join('') : '<div style="color: #728a9c; font-size: 0.85rem; padding: 12px;">Nenhuma crônica registrada para esta campanha ainda.</div>';

    // Monta o template completo
    modalBody.innerHTML = `
      <div class="story-dossier-wrapper">
        <!-- Banner e Metadados Principais -->
        <div class="story-hero-banner">
          <div>
            <h1 class="story-hero-title">${this.escapeHtml(camp.title)}</h1>
            <div class="story-hero-meta">
              <span class="story-meta-pill">📍 ${this.escapeHtml(camp.country_location || 'Planeta Terra')}</span>
              <span class="story-meta-pill">⏳ ${this.escapeHtml(camp.year || 'Era Atual')}</span>
              <span class="story-meta-pill">🎭 ${this.escapeHtml(camp.theme || 'Sobrevivência')}</span>
              <span class="story-meta-pill" style="border-color: #ffd700; color: #ffe680;">⚠️ ${this.escapeHtml(camp.danger_rating || 'NÍVEL REGISTRADO')}</span>
            </div>
          </div>
          <span class="story-status-pill ${statusClass}">${statusBadge}</span>
        </div>

        <!-- Sinopse da Campanha -->
        <div class="story-section-card">
          <div class="story-section-heading">📜 SINOPSE DA NARRATIVA</div>
          <div class="story-narrative-box">
            ${this.escapeHtml(camp.synopsis || camp.description || 'Sem sinopse cadastrada.')}
          </div>
        </div>

        <!-- Desfecho Histórico se concluída -->
        ${camp.outcome ? `
          <div class="story-outcome-card">
            <div class="story-section-heading" style="color: #ffd700;">🏆 DESFECHO HISTÓRICO & CONSEQUÊNCIAS</div>
            <div class="story-outcome-text">
              ${this.escapeHtml(camp.outcome).replace(/\n/g, '<br>')}
            </div>
          </div>
        ` : ''}

        <!-- Seção de Personagens Interativos -->
        <div class="story-section-card">
          <div class="story-section-heading" style="display: flex; justify-content: space-between; align-items: center;">
            <span>👤 PERSONAGENS & PROTAGONISTAS (${characters.length})</span>
            <span style="font-size: 0.72rem; color: #8da4be; font-weight: normal;">Clique em qualquer ficha para ver as 28 perícias C.R.I.S.</span>
          </div>
          <div class="story-characters-grid">
            ${charactersHtml}
          </div>
        </div>

        <!-- Seção de Locais e Marcos Geográficos -->
        <div class="story-section-card">
          <div class="story-section-heading" style="display: flex; justify-content: space-between; align-items: center;">
            <span>📍 LOCAIS & MARCOS TÁTICOS (${locations.length})</span>
            <span style="font-size: 0.72rem; color: #8da4be; font-weight: normal;">Clique para focar o mapa ou ver notas</span>
          </div>
          <div class="story-locations-grid">
            ${locationsHtml}
          </div>
        </div>

        <!-- Seção de Crônicas / Sessões -->
        <div class="story-section-card">
          <div class="story-section-heading" style="display: flex; justify-content: space-between; align-items: center;">
            <span>📖 CRÔNICAS & SESSÕES JOGADAS (${chronicles.length})</span>
            <button class="btn-secondary" style="font-size: 0.72rem; padding: 3px 8px; border-color: #00e5ff; color: #00e5ff;" onclick="window.uiController.closeModal('modal-campaign-story'); window.uiController.openModal('modal-session-creator');">
              ➕ Nova Sessão
            </button>
          </div>
          <div class="story-chronicles-list">
            ${chroniclesHtml}
          </div>
        </div>

        <!-- Barra de Ações Rápidas -->
        <div class="story-actions-footer">
          <button class="btn-dive-primary" onclick="window.uiController.closeModal('modal-campaign-story'); window.mergulhoNasNuvens('${camp.id}');" title="Executar animação de mergulho nas nuvens até o mapa tático">
            🚀 Mergulhar no Local da Ação
          </button>
          <button class="btn-secondary" onclick="window.uiController.closeModal('modal-campaign-story'); window.uiController.renderCampaignsHub(); window.uiController.openModal('modal-campaigns-hub');">
            📋 Voltar ao Hub de Campanhas
          </button>
        </div>
      </div>
    `;

    this.openModal('modal-campaign-story');
    if (this.soundFX) this.soundFX.playTacticalBeep();
  }

  getCampaignCharacters(campaignId) {
    const camp = this.dataLoader.getCampaignById(campaignId);
    const allChars = this.dataLoader.getAllCharacters();
    const direct = this.dataLoader.getCharacters(campaignId);
    const participantIds = camp?.participants || [];
    const combined = [...direct];
    participantIds.forEach(pId => {
      const ch = allChars.find(c => c.id === pId);
      if (ch && !combined.some(c => c.id === ch.id)) {
        combined.push(ch);
      }
    });
    return combined;
  }

  getCampaignLocations(campaignId) {
    const camp = this.dataLoader.getCampaignById(campaignId);
    const allLocs = this.dataLoader.getLocations();
    const direct = this.dataLoader.getLocations(campaignId);
    const locIds = camp?.locations_list || [];
    const combined = [...direct];
    locIds.forEach(lId => {
      const loc = allLocs.find(l => l.id === lId);
      if (loc && !combined.some(l => l.id === loc.id)) {
        combined.push(loc);
      }
    });
    return combined;
  }

  renderLocationsAtlas(zoneFilter = 'all') {
    const grid = document.getElementById('locations-atlas-grid');
    if (!grid) return;

    let locations = this.dataLoader.getLocations();
    if (zoneFilter && zoneFilter !== 'all') {
      locations = locations.filter(l => (l.zone && l.zone.includes(zoneFilter)) || (l.name && l.name.includes(zoneFilter)));
    }

    grid.innerHTML = locations.map(loc => {
      return `
        <div class="location-atlas-card">
          <div class="location-atlas-title-row">
            <h4 class="location-atlas-name">${this.escapeHtml(loc.name)}</h4>
            <span class="location-atlas-type">${this.escapeHtml(loc.type || 'Ponto de Interesse')}</span>
          </div>
          <div class="location-atlas-zone">📍 ${this.escapeHtml(loc.zone || 'Setor')}</div>
          <div class="location-atlas-desc">${this.escapeHtml(loc.description || 'Sem registro histórico.')}</div>
          <button class="btn-location-fly" onclick="window.uiController.flyToLocation('${loc.id}')">
            📍 Voar para o Local
          </button>
        </div>
      `;
    }).join('');

    // Listener de filtros de zona
    document.querySelectorAll('#locations-filter-pills .loc-filter-pill').forEach(pill => {
      pill.onclick = (e) => {
        document.querySelectorAll('#locations-filter-pills .loc-filter-pill').forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const zone = e.currentTarget.getAttribute('data-zone');
        this.renderLocationsAtlas(zone);
        if (this.soundFX) this.soundFX.playTacticalBeep();
      };
    });
  }

  flyToLocation(locId) {
    const loc = this.dataLoader.getLocationById(locId);
    if (!loc) return;

    this.closeModal('modal-locations-atlas');

    if (loc.coordinates) {
      if (window.app?.mapEngine) {
        if (window.app.mapEngine.currentScale === 'global') {
          window.app.mapEngine.mergulhoNasNuvens(loc.campaign_id || loc.id).then(() => {
            if (window.app?.mapEngine?.map) {
              window.app.mapEngine.map.flyTo(loc.coordinates, 12, { duration: 1.5 });
            }
            this.openDrawer('location');
            this.renderLocationDossier(loc);
          });
          return;
        }
      }
      if (window.app?.mapEngine?.map) {
        window.app.mapEngine.map.flyTo(loc.coordinates, 12, { duration: 1.5 });
        this.openDrawer('location');
        this.renderLocationDossier(loc);
      }
    }
  }

  handleCreateLocation() {
    const name = document.getElementById('loc-new-name')?.value.trim() || 'Novo Local';
    const country = document.getElementById('loc-new-country')?.value.trim() || 'Setor Desconhecido';
    const type = document.getElementById('loc-new-type')?.value.trim() || 'Ponto de Interesse';
    const lat = parseFloat(document.getElementById('loc-new-lat')?.value) || 0.0;
    const lng = parseFloat(document.getElementById('loc-new-lng')?.value) || 0.0;
    const campaignId = document.getElementById('loc-new-campaign')?.value || 'camp_002';
    const desc = document.getElementById('loc-new-desc')?.value.trim() || 'História e acontecimentos do local.';

    const newLoc = {
      id: `loc_${Date.now()}`,
      name: name,
      zone: `${country} (Evren)`,
      type: type,
      campaign_id: campaignId,
      coordinates: [lat, lng],
      description: desc,
      isCustom: true
    };

    if (this.dataLoader.data) {
      this.dataLoader.data.locations.push(newLoc);
    }

    try {
      const stored = JSON.parse(localStorage.getItem('evren_custom_locations_v1') || '[]');
      stored.push(newLoc);
      localStorage.setItem('evren_custom_locations_v1', JSON.stringify(stored));
    } catch(e) {}

    this.closeModal('modal-location-creator');
    this.renderLocationsAtlas();
    this.openModal('modal-locations-atlas');

    if (this.soundFX) this.soundFX.playTacticalBeep();
  }

  adjustPD(charId, delta) {
    if (!this.pdState[charId]) {
      this.pdState[charId] = { current: 15, max: 20 };
    }
    const pd = this.pdState[charId];
    pd.current = Math.max(0, Math.min(pd.max, pd.current + delta));

    if (pd.current === 0) {
      this.triggerOverloadFX();
      document.getElementById('overload-fracture-vignette')?.classList.add('active');
      this.soundFX.startHeartbeat();
    } else {
      document.getElementById('overload-fracture-vignette')?.classList.remove('active');
      this.soundFX.stopHeartbeat();
      this.soundFX.playTacticalBeep();
    }

    this.renderActiveCharacterSheet();
  }

  testPDOverload(charId) {
    if (!this.pdState[charId]) {
      this.pdState[charId] = { current: 15, max: 20 };
    }
    this.pdState[charId].current = 0;
    this.triggerOverloadFX();
    document.getElementById('overload-fracture-vignette')?.classList.add('active');
    this.soundFX.startHeartbeat();
    this.renderActiveCharacterSheet();
  }

  triggerOverloadFX() {
    this.soundFX.playOverloadAlarm();
    this.soundFX.playGlitchBurst();

    // Pulso visual na tela
    const flash = document.getElementById('static-flash');
    if (flash) {
      flash.classList.add('active');
      setTimeout(() => flash.classList.remove('active'), 400);
    }

    document.body.classList.add('violent-glitch-active');
    setTimeout(() => {
      document.body.classList.remove('violent-glitch-active');
    }, 450);
  }

  rollAttribute(charIdentifier, attrName, dicePool) {
    const char = this.dataLoader.getCharacterById(charIdentifier) || { name: charIdentifier };
    const charName = char.name;

    const rolls = [];
    for (let i = 0; i < dicePool; i++) {
      rolls.push(Math.floor(Math.random() * 20) + 1);
    }
    const maxVal = Math.max(...rolls);
    const isCrit = rolls.includes(20);

    const banner = document.getElementById(`dice-banner-${this.currentCharacterId}`);
    const bannerText = document.getElementById(`dice-text-${this.currentCharacterId}`);

    if (banner && bannerText) {
      banner.classList.add('active');
      bannerText.innerHTML = `
        <strong>${attrName} (${dicePool}d20):</strong> [${rolls.join(', ')}] 
        ➔ <strong>RESULTADO: ${maxVal}</strong> ${isCrit ? '<span style="color: #00e5ff; font-weight:800;">[CRÍTICO EXTREMO! 20]</span>' : ''}
      `;
    }

    // Aciona animação 3D de rolagem e choque de dados
    this.showDiceRollAnimation(attrName, dicePool, rolls, maxVal, isCrit);

    if (window.sessionJournal) {
      window.sessionJournal.logEvent(`🎲 Teste de ${attrName} (${dicePool}d20) por ${charName}: [${rolls.join(', ')}] ➔ Maior: ${maxVal}${isCrit ? ' [CRÍTICO!]' : ''}`);
    }
  }

  showDiceRollAnimation(title, dicePool, rolls, resultVal, isCrit) {
    const modal = document.getElementById('modal-dice-roll');
    const titleEl = document.getElementById('dice-roll-title');
    const badge = document.getElementById('dice-poly-badge');
    const summary = document.getElementById('dice-roll-summary');

    if (!modal || !badge || !summary) return;

    if (titleEl) titleEl.textContent = `// TESTE: ${title.toUpperCase()} //`;
    badge.className = 'd20-poly-badge rolling';
    badge.textContent = Math.floor(Math.random() * 20) + 1;
    summary.innerHTML = `<span style="color:#00e5ff;">Rolando pool de ${dicePool}d20...</span>`;

    modal.classList.add('open');
    this.soundFX.playDiceRoll();

    let count = 0;
    const interval = setInterval(() => {
      count++;
      badge.textContent = Math.floor(Math.random() * 20) + 1;
      if (count > 7) {
        clearInterval(interval);
        badge.classList.remove('rolling');
        badge.textContent = resultVal;

        if (resultVal === 20 || isCrit) {
          badge.classList.add('crit-20');
          this.soundFX.playCritSpark();
          summary.innerHTML = `
            <strong style="color: #ffe600; font-size:16px;">CRÍTICO EXTREMO! [20]</strong><br>
            <span style="font-size:11px; color:#d8ecf8;">Pool rolada: [${rolls.join(', ')}]</span>
          `;
        } else if (resultVal === 1) {
          badge.classList.add('fail-1');
          this.soundFX.playGlitchBurst();
          summary.innerHTML = `
            <strong style="color: #ff3366; font-size:16px;">DESASTRE PARANORMAL! [1]</strong><br>
            <span style="font-size:11px; color:#d8ecf8;">Pool rolada: [${rolls.join(', ')}]</span>
          `;
        } else {
          this.soundFX.playTacticalBeep();
          summary.innerHTML = `
            <strong>RESULTADO MAIOR: ${resultVal}</strong><br>
            <span style="font-size:11px; color:#a4c4d8;">Pool rolada: [${rolls.join(', ')}]</span>
          `;
        }
      }
    }, 55);
  }

  triggerSacrificeArmor(charIdentifier) {
    this.soundFX.playGlitchBurst();

    const char = this.dataLoader.getCharacterById(charIdentifier) || { name: charIdentifier };
    const charName = char.name;

    this.showCombatModal(
      '🛡️ SACRIFÍCIO DE ARMADURA',
      `
        <div class="combat-result-card combat-card-sacrifice">
          <div class="combat-card-badge status">PROTOCOLO DE EMERGÊNCIA</div>
          <h3 class="combat-hero-title">${this.escapeHtml(charName)} estraçalhou sua armadura!</h3>
          <p class="combat-lore-text">
            Em resposta a um ataque mortal, <strong>${this.escapeHtml(charName)}</strong> canalizou toda a energia cinética contra as placas e ligas de sua proteção corporal.
          </p>
          <div class="combat-stat-boxes">
            <div class="combat-stat-box green">
              <span class="stat-lbl">DANO ANULADO</span>
              <span class="stat-val">100% FATAL</span>
            </div>
            <div class="combat-stat-box red">
              <span class="stat-lbl">INTEGRIDADE ARMADURA</span>
              <span class="stat-val">0 (DESTRUÍDA)</span>
            </div>
          </div>
          <div class="combat-alert-box">
            ⚠️ <strong>ATENÇÃO:</strong> Redução de Dano (RD) cai para <strong>0</strong> irreversivelmente até que novas placas balísticas sejam forjadas nos ateliês de <em>Nova Caronte</em>.
          </div>
        </div>
      `
    );

    if (window.sessionJournal) {
      window.sessionJournal.logEvent(`🛡️ Sacrifício de Armadura ativado por ${charName}! Armadura destruída, dano fatal anulado.`);
    }
  }

  triggerLethalTiebreak(charIdentifier) {
    this.soundFX.playTacticalBeep();

    const char = this.dataLoader.getCharacterById(charIdentifier) || { name: charIdentifier };
    const charName = char.name;

    const rollSelf = Math.floor(Math.random() * 20) + 1;
    const rollOpponent = Math.floor(Math.random() * 20) + 1;

    let outcomeClass = 'tie';
    let outcomeTitle = 'EMPATE SANGRENTO!';
    let outcomeDesc = `Ambos os combatentes colidiram na mesma fração de segundo! <strong>${this.escapeHtml(charName)}</strong> e o adversário se perfuram simultaneamente com dano crítico total.`;

    if (rollSelf > rollOpponent) {
      outcomeClass = 'victory';
      outcomeTitle = 'VITÓRIA DECISIVA!';
      outcomeDesc = `<strong>${this.escapeHtml(charName)}</strong> encontrou a fresta na guarda do alvo milissegundos antes da reação! Golpe crítico desferido primeiro.`;
    } else if (rollSelf < rollOpponent) {
      outcomeClass = 'defeat';
      outcomeTitle = 'DERROTA CRÍTICA!';
      outcomeDesc = `O adversário foi brutalmente mais rápido no clash de letalidade! <strong>${this.escapeHtml(charName)}</strong> sofre o impacto mortal direto.`;
    }

    if (window.sessionJournal) {
      window.sessionJournal.logEvent(`💀 Desempate Letal por ${charName}: ${rollSelf} vs ${rollOpponent} ➔ ${outcomeTitle}`);
    }

    this.showCombatModal(
      '💀 DESEMPATE LETAL — CLASH INSTANTÂNEO',
      `
        <div class="combat-result-card combat-card-clash ${outcomeClass}">
          <div class="combat-clash-display">
            <div class="clash-combatant player">
              <div class="clash-name">${this.escapeHtml(charName)}</div>
              <div class="clash-die-value">${rollSelf}</div>
              <div class="clash-die-hint">1d20 TÁTICO</div>
            </div>
            <div class="clash-vs-badge">VS</div>
            <div class="clash-combatant enemy">
              <div class="clash-name">Ameaça Oposta</div>
              <div class="clash-die-value">${rollOpponent}</div>
              <div class="clash-die-hint">1d20 ADVERSÁRIO</div>
            </div>
          </div>
          <div class="clash-outcome-banner ${outcomeClass}">
            <h4 class="clash-outcome-title">${outcomeTitle}</h4>
            <p class="clash-outcome-desc">${outcomeDesc}</p>
          </div>
        </div>
      `
    );
  }

  showCombatModal(title, contentHtml) {
    const titleEl = document.getElementById('combat-modal-title-text');
    const contentEl = document.getElementById('combat-modal-content');
    if (titleEl) titleEl.textContent = title;
    if (contentEl) contentEl.innerHTML = contentHtml;
    this.openModal('modal-combat-log');
  }

  activateRelic(relicName) {
    this.soundFX.playPortalWhoosh();
    this.soundFX.playGlitchBurst();

    const flash = document.getElementById('static-flash');
    if (flash) {
      flash.classList.add('active');
      setTimeout(() => flash.classList.remove('active'), 600);
    }

    document.body.classList.add('violent-glitch-active');
    setTimeout(() => {
      document.body.classList.remove('violent-glitch-active');
    }, 500);

    // Efeito de salto de câmera para anomalia ou realidade
    if (window.app && window.app.mapEngine) {
      const targetLoc = Math.random() > 0.5 ? 'loc_caronte' : 'loc_vilar';
      window.app.mapEngine.flyToLocation(targetLoc);
    }
  }

  /* --- CRÔNICAS & ARQUIVOS --- */
  renderChroniclesList() {
    const container = document.getElementById('chronicles-list-container');
    if (!container) return;

    const chronicles = this.dataLoader.getChronicles(this.currentCampaignFilter);
    container.innerHTML = '';

    chronicles.forEach(cron => {
      const card = document.createElement('div');
      card.className = 'chronicle-card';

      const loc = this.dataLoader.getLocationById(cron.location_id);
      const locName = loc ? loc.name : 'Desconhecido';

      card.innerHTML = `
        <div class="chronicle-header">
          <div class="chronicle-title">${cron.title}</div>
          <span class="badge-tag player">${cron.campaign_id}</span>
        </div>
        <div class="chronicle-body">
          ${cron.lore}
        </div>
        <div class="chronicle-meta">
          <span>LOCAL: <strong>${locName}</strong></span>
          <button class="btn-locate-map" onclick="window.app.locateOnMap('${cron.location_id}')">
            📍 Localizar no Mapa
          </button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  /* --- DOSSIÊ DO LOCAL NA GAVETA --- */
  openLocationDossier(locationId) {
    this.currentLocationId = locationId;
    const loc = this.dataLoader.getLocationById(locationId);
    if (!loc) return;

    const container = document.getElementById('location-dossier-container');
    if (container) {
      const chronicles = this.dataLoader.getChronicles().filter(c => c.location_id === locationId);
      const isAnomaly = loc.zone?.includes('Triângulo') || loc.zone?.includes('Anomalia') || loc.zone?.includes('Zero') || loc.type?.includes('Subterrâneo');
      const threatLevel = isAnomaly ? 'Nível Ômega // Anomalia Ativa' : 'Classificação Alfa // Território Mapeado';
      const threatColor = isAnomaly ? '#ff5e78' : '#00e5ff';
      const savedNote = this.getLocationNote(loc.id);

      // Agentes que já operaram nesta campanha/local
      const allChars = this.dataLoader.getCharacters() || [];
      const relatedChars = allChars.filter(c => c.campaign_id === loc.campaign_id || (loc.id === 'loc_triangulo_alpha' && c.campaign_id === 'camp_001'));

      container.innerHTML = `
        <div class="character-sheet-card">
          <div class="sheet-header">
            <div class="sheet-title-row">
              <h3 class="sheet-name">${this.escapeHtml(loc.name)}</h3>
              <span class="popup-zone-badge ${isAnomaly ? 'anomaly' : 'reality'}">${this.escapeHtml(loc.zone || 'Zona Terrestre')}</span>
            </div>
            <div class="sheet-subinfo">
              <span>TIPO: <strong>${this.escapeHtml(loc.type)}</strong></span>
              <span>COORDENADAS: [${loc.coordinates ? loc.coordinates.join(', ') : '0, 0'}]</span>
            </div>
            <div style="font-family: var(--font-mono); font-size: 10px; color: ${threatColor}; margin-top: 4px;">
              ⚠️ CLASSIFICAÇÃO: ${threatLevel}
            </div>
          </div>
          <div class="sheet-summary-section">
            <div class="section-label">ANÁLISE DE CAMPO & HISTÓRICO</div>
            <p class="summary-content">"${this.escapeHtml(loc.description)}"</p>
          </div>

          <!-- Bloco de Notas de Campo do Mestre/Jogador -->
          <div class="location-field-notes-box">
            <div class="section-label">📓 ANOTAÇÕES TÁTICAS DE CAMPO (PERSISTIDAS)</div>
            <textarea id="location-field-notes-text" class="location-field-notes-textarea" rows="3" placeholder="Insira pistas descobertas, segredos ou notas de sessão sobre este local..." oninput="window.uiController.saveLocationNote('${loc.id}', this.value)">${this.escapeHtml(savedNote)}</textarea>
            <div style="font-size: 10px; color: #728a9c; text-align: right;">💾 Salvamento automático em tempo real</div>
          </div>

          <!-- Crônicas Registradas neste Local -->
          <div class="sheet-combat-actions">
            <div class="section-label">📜 CRÔNICAS VINCULADAS (${chronicles.length})</div>
            ${chronicles.length > 0 ? chronicles.map(c => `
              <div style="background: rgba(0, 229, 255, 0.08); border-left: 3px solid var(--color-cyan); padding: 8px 12px; margin-bottom: 8px; border-radius: 0 4px 4px 0;">
                <div style="font-weight: 700; color: #fff; margin-bottom: 4px;">${this.escapeHtml(c.title)}</div>
                <div style="font-size: 12px; color: var(--color-parchment); line-height: 1.4;">${this.escapeHtml(c.lore || c.summary)}</div>
              </div>
            `).join('') : '<div style="font-size: 12px; color: var(--color-text-muted);">Nenhuma crônica registrada diretamente neste setor.</div>'}
          </div>

          <!-- Agentes Destacados para este Setor -->
          ${relatedChars.length > 0 ? `
            <div style="padding: 12px 20px; background: rgba(6, 16, 26, 0.8); border-top: 1px solid rgba(0, 229, 255, 0.15);">
              <div class="section-label" style="margin-bottom: 8px;">👤 AGENTES RELACIONADOS AO SETOR</div>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                ${relatedChars.map(rc => `
                  <button class="btn-secondary" style="font-size: 10px; padding: 3px 8px;" onclick="window.uiController.selectCharacter('${rc.id}'); window.uiController.openDrawer('characters');" title="Ver ficha C.R.I.S.">
                    📄 ${this.escapeHtml(rc.name)}
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div style="padding: 16px 20px;">
            <button class="btn-hud" style="width: 100%; justify-content: center;" onclick="window.app.mapEngine.flyToLocation('${loc.id}')">
              🎯 FOCAR CÂMERA DO MAPA
            </button>
          </div>
        </div>
      `;
    }

    this.openDrawer('location');
  }

  formatShortCharLabel(name) {
    if (!name) return 'Agente';
    const cleaned = String(name)
      .replace(/^(?:O|A|Os|As|Dr\.?|Dra\.?|Dom|Comandante|Capit[ãa]o|Capit[ãa]|Inspetora?|Padre|Irm[ãa]o)\s+/i, '')
      .trim();
    return cleaned.split(/\s+/)[0] || String(name).split(/\s+/)[0];
  }

  /* --- MODAIS (REGRAS E CÓDICE) --- */
  openModal(modalId) {
    const primaryModals = new Set([
      'modal-rules', 'modal-codex', 'modal-bestiary', 'modal-campaigns-hub',
      'modal-campaign-story', 'modal-locations-atlas', 'modal-teia-do-tempo',
      'modal-timeline', 'modal-character-creator', 'modal-shortcuts',
      'modal-museum-admin', 'modal-combat-arena', 'modal-relics-codex'
    ]);
    if (primaryModals.has(modalId)) {
      primaryModals.forEach(id => {
        if (id !== modalId) {
          document.getElementById(id)?.classList.remove('open', 'active');
        }
      });
      if (modalId !== 'modal-campaign-story') {
        window.museumController?.closeExhibitionModal?.();
      }
    }
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('open', 'active');
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('open', 'active');
    }
    if (modalId === 'modal-campaign-story') {
      window.museumController?.closeExhibitionModal?.();
    }
  }

  rollEscolhidoInline(btnEl) {
    const roll = Math.floor(Math.random() * 1000) + 1;
    const out = btnEl?.closest('.v3-card')?.querySelector('.chosen-roll-out');
    if (out) {
      if (roll === 1) {
        out.innerHTML = '<strong style="color:#ffd700;">🎲 1d1000 = 1 — ESCOLHIDO DE NASCENÇA (0,1%)! Segunda Árvore de Pacto desperta desde o berço!</strong>';
      } else {
        out.textContent = `🎲 1d1000 = ${roll} — Mortal comum no nascimento (Pacto apenas por Ritual de Subjugação na Lua Nova).`;
        out.style.color = '#c084fc';
      }
    }
    if (this.soundFX) this.soundFX.playDiceRoll();
  }

  renderRulesV3Modal(activeTab = 'quaternario') {
    this.activeRulesTab = activeTab;
    document.querySelectorAll('.rules-v3-tab-btn[data-rules-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.rulesTab === activeTab);
    });

    const mount = document.getElementById('rules-v3-mount');
    if (!mount) return;

    const e = (v) => this.escapeHtml(v ?? '');
    const fmtArr = (val) => Array.isArray(val) ? val.map(x => e(x)).join(', ') : e(val || '');

    if (activeTab === 'quaternario') {
      const spheres = this.dataLoader.getQuaternario() || [];
      const mdaRows = this.dataLoader.getMdaTable() || [];
      mount.innerHTML = `
        <div class="rules-v3-panel active">
          <div class="v3-card" style="border-left: 3px solid #ffd700;">
            <div class="v3-card-title">⚖️ O Quaternário Metafísico de Evren (Tomo III V3.0)</div>
            <div class="v3-card-body">Quatro esferas regem a existência sob o Véu. Atributos base: 5 (FOR, VIG, AGI, PRE, INT). Pontos iniciais de criação: 12 pts. Quaternário de recursos: <strong>PV = 20 + VIG×3</strong> • <strong>PD = Escala MDA</strong> • <strong>EA = Bônus MDA + PRE×3</strong> • <strong>EST = 6 + VIG + INT (+5 Humanos Despertos)</strong>.</div>
          </div>
          <div class="v3-grid-2">
            ${spheres.map(s => `
              <div class="v3-card">
                <div class="v3-card-meta">ESFERA ${e(s.number)}</div>
                <div class="v3-card-title">${e(s.name)}</div>
                <div class="v3-card-body"><strong>Origem:</strong> ${e(s.origin)}<br><br><strong>Relação:</strong> ${e(s.relation)}</div>
              </div>
            `).join('')}
          </div>
          <div class="v3-card">
            <div class="v3-card-title">🧬 Tabela Oficial de Progressão MDA, PD, EA &amp; Estágios</div>
            <div style="overflow-x:auto;">
              <table class="v3-table">
                <thead>
                  <tr><th>MDA</th><th>Classificação</th><th>PD</th><th>Atr.</th><th>Bônus EA</th><th>Estágio Anímico</th></tr>
                </thead>
                <tbody>
                  ${mdaRows.map(r => `
                    <tr>
                      <td style="color:#00e5ff; font-weight:700;">${e(r.mda)}</td>
                      <td>${e(r.classif)}</td>
                      <td>${e(r.pd)}</td>
                      <td>${e(r.attr_pts)} pts</td>
                      <td style="color:#ffd700;">${e(r.ea_bonus)}</td>
                      <td>${e(r.stage)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
      return;
    }

    if (activeTab === 'virtudes') {
      const virtues = this.dataLoader.getOfficialVirtues() || [];
      mount.innerHTML = `
        <div class="rules-v3-panel active">
          <div class="v3-card" style="border-left: 3px solid #ffd700;">
            <div class="v3-card-title">✨ As 11 Virtudes Oficiais &amp; Seus 11 Exemplares</div>
            <div class="v3-card-body">Modalidades: <strong>Projeção</strong> (forma espiritual externa), <strong>Sintonia</strong> (vestimenta/arma sobre o corpo) e <strong>Convergência</strong> (MDA 40%+, manifestação absoluta). Clique em qualquer ficha do C.R.I.S. ou Criador V3.0 para atribuir uma Virtude.</div>
          </div>
          <div class="v3-grid-2">
            ${virtues.map(v => `
              <div class="v3-card">
                <div class="v3-card-meta">${e((v.group || '').toUpperCase())} • ${e(v.epithet || '')}</div>
                <div class="v3-card-title">${e(v.name)}</div>
                <div class="v3-card-body">
                  <div><strong>Princípio:</strong> ${e(v.principle)}</div>
                  ${v.sintonia_effect ? `<div style="margin-top:4px;"><strong>Sintonia:</strong> ${e(v.sintonia_effect)}</div>` : ''}
                  ${Array.isArray(v.techniques) && v.techniques.length ? `
                    <div style="margin-top:6px; border-top:1px solid rgba(255,255,255,0.08); padding-top:6px;">
                      ${v.techniques.map(t => `<div style="font-size:12px; margin-bottom:4px;"><strong style="color:#00e5ff;">${e(t.name)}</strong> (${e(t.cost)}): ${e(t.desc)}</div>`).join('')}
                    </div>
                  ` : ''}
                  ${v.limitations ? `<div style="margin-top:4px; color:#ff9eb0; font-size:12px;"><strong>Restrição:</strong> ${e(v.limitations)}</div>` : ''}
                  ${v.exemplary ? `
                    <div style="margin-top:8px; padding:7px 9px; background:rgba(212,175,55,0.1); border-left:2px solid #ffd700; border-radius:4px; font-size:12px;">
                      <strong style="color:#ffd700;">Exemplar: ${e(v.exemplary.name)}</strong> (${e(v.exemplary.role)})<br>
                      <em>Alma: ${e(v.exemplary.alma)}</em> — ${e(v.exemplary.lore)}
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      return;
    }

    if (activeTab === 'racas') {
      const races = this.dataLoader.getRaces() || [];
      const elements = this.dataLoader.getElements() || [];
      mount.innerHTML = `
        <div class="rules-v3-panel active">
          <div class="v3-card-title" style="padding:2px 0;">🧬 As 7 Raças &amp; Linhagens Jogáveis</div>
          <div class="v3-grid-2">
            ${races.map(r => `
              <div class="v3-card">
                <div class="v3-card-meta">LINHAGEM #${e(r.number)} • ${e(r.origin)}</div>
                <div class="v3-card-title">${e(r.name)}</div>
                <div class="v3-card-body">
                  <div><strong>Biologia:</strong> ${e(r.biology)}</div>
                  <div style="margin-top:5px; color:#00e5ff;"><strong>Traços:</strong> ${e(r.traits)}</div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="v3-card-title" style="padding:8px 0 2px;">⚡ Os 10 Elementos Primordiais</div>
          <div class="v3-grid-2">
            ${elements.map(el => `
              <div class="v3-card">
                <div class="v3-card-meta">ELEMENTO #${e(el.number)} • Virtudes: ${fmtArr(el.virtues)}</div>
                <div class="v3-card-title">${e(el.name)}</div>
                <div class="v3-card-body">
                  <div>${e(el.visual)}</div>
                  <div style="margin-top:5px; color:#ffd700;"><strong>Efeito Mecânico:</strong> ${e(el.effect)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      return;
    }

    if (activeTab === 'pactos') {
      const pacts = this.dataLoader.getPacts() || [];
      mount.innerHTML = `
        <div class="rules-v3-panel active">
          <div class="v3-card" style="border-left: 3px solid #c084fc;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
              <div class="v3-card-title" style="color:#c084fc;">🌒 Escolhido de Nascença vs Ritual da Lua Nova</div>
              <button type="button" class="btn-secondary" style="border-color:#ffd700; color:#ffd700; padding:6px 12px;" onclick="window.uiController.rollEscolhidoInline(this)">🎲 Rolar 1d1000 Escolhido</button>
            </div>
            <div class="v3-card-body">
              Apenas <strong>0,05% a 0,1%</strong> (1d1000 = 1) nascem vinculados a uma Lenda Folclórica. Os demais precisam subjugar ou negociar com a Lenda sob a Lua Nova — arriscando caçada pela Ordem da Cinza.
              <div class="chosen-roll-out" style="margin-top:8px; font-family:monospace; font-size:12.5px; color:#d8ecf8;">Clique no botão acima para testar sua sorte de nascimento (1d1000).</div>
            </div>
          </div>
          <div class="v3-grid-2">
            ${pacts.map(p => `
              <div class="v3-card">
                <div class="v3-card-meta">PACTO PROIBIDO • ${e(p.theme)}</div>
                <div class="v3-card-title" style="color:#c084fc;">${e(p.name)}</div>
                <div class="v3-card-body">
                  <div><strong>Estigma Físico:</strong> ${e(p.stigma)}</div>
                  <div style="margin-top:6px; color:#ffd700;"><strong>Poder Concedido:</strong> ${e(p.power)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      return;
    }

    // Tab: combate
    const kinetic = this.dataLoader.getUniverseRules()?.kinetic_combat_rules || {};
    const stances = kinetic.stances || [];
    const pavorRows = this.dataLoader.getPavorRuptureTable() || [];
    const arsenal = this.dataLoader.getColonialArsenal() || [];
    mount.innerHTML = `
      <div class="rules-v3-panel active">
        <div class="v3-card" style="border-left: 3px solid #ff5e78;">
          <div class="v3-card-title" style="color:#ff5e78;">⚔️ Combate Ativo (Sem CA Passiva)</div>
          <div class="v3-card-body">Todo ataque envolve choque de rolagens em tempo real. ${e(kinetic.armor_sacrifice || '')}</div>
        </div>
        <div class="v3-grid-2">
          ${stances.map(st => `
            <div class="v3-card">
              <div class="v3-card-meta">ROLAGEM: ${e(st.roll)}</div>
              <div class="v3-card-title">${e(st.name)}</div>
              <div class="v3-card-body">${e(st.on_win)}</div>
            </div>
          `).join('')}
        </div>
        <div class="v3-card" style="border-left: 3px solid #c084fc;">
          <div class="v3-card-title" style="color:#c084fc;">🧠 Tabela de Pavor &amp; Ruptura de Alma (1d6 ao zerar EST)</div>
          <div class="v3-card-body">
            ${pavorRows.map(row => `<div style="padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.08);">• ${e(row)}</div>`).join('')}
          </div>
        </div>
        <div class="v3-card">
          <div class="v3-card-title">🗡️ Arsenal Colonial, Prata &amp; Ferramentas de Contenção</div>
          <div style="overflow-x:auto;">
            <table class="v3-table">
              <thead><tr><th>Equipamento</th><th>Categoria</th><th>Uso Tático</th></tr></thead>
              <tbody>
                ${arsenal.map(it => `
                  <tr>
                    <td style="color:#ffd700; font-weight:600;">${e(it.name)}</td>
                    <td style="color:#00e5ff;">${e(it.cat)}</td>
                    <td>${e(it.tactical)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  setupBestiaryV4() {
    this.tomo4Category = 'all';
    this.tomo4Search = '';
    document.querySelectorAll('#bestiary-v4-filters .tomo4-filter-btn[data-t4-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.tomo4Category = btn.dataset.t4Cat || 'all';
        document.querySelectorAll('#bestiary-v4-filters .tomo4-filter-btn').forEach(b => {
          b.classList.toggle('active', b === btn);
        });
        this.renderBestiaryV4();
        this.soundFX.playTacticalBeep();
      });
    });

    const searchInput = document.getElementById('bestiary-v4-search');
    if (searchInput) {
      searchInput.addEventListener('input', (ev) => {
        this.tomo4Search = (ev.target.value || '').trim().toLowerCase();
        this.renderBestiaryV4();
      });
    }
  }

  openBestiaryModal(category = 'all', highlightEntityId = null) {
    this.tomo4Category = category || 'all';
    document.querySelectorAll('#bestiary-v4-filters .tomo4-filter-btn').forEach(b => {
      b.classList.toggle('active', (b.dataset.t4Cat || 'all') === this.tomo4Category);
    });
    this.renderBestiaryV4();
    if (highlightEntityId) {
      this.showTomo4Detail(highlightEntityId);
    } else {
      const detail = document.getElementById('bestiary-v4-detail');
      if (detail) detail.style.display = 'none';
    }
    this.openModal('modal-bestiary');
  }

  renderBestiaryV4() {
    const grid = document.getElementById('bestiary-v4-grid');
    const countEl = document.getElementById('bestiary-v4-count');
    if (!grid) return;

    const all = this.dataLoader.getTomo4Entities() || [];
    const q = this.tomo4Search || '';
    const filtered = all.filter(item => {
      if (this.tomo4Category !== 'all' && item.category !== this.tomo4Category) return false;
      if (!q) return true;
      const hay = [
        item.name, item.title, item.category_label, item.type, item.origin,
        item.territory, item.virtue, item.element, item.description,
        item.abilities, item.weakness, item.offense
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });

    if (countEl) {
      countEl.textContent = `${filtered.length} de ${all.length} Fichas`;
    }

    const e = (v) => this.escapeHtml(v ?? '');
    if (!filtered.length) {
      grid.innerHTML = '<div class="v3-card" style="grid-column:1/-1; text-align:center;">Nenhuma ficha do Tomo IV corresponde ao filtro atual.</div>';
      return;
    }

    grid.innerHTML = filtered.map(item => {
      const st = item.stats || {};
      const mdaClean = item.mda ? String(item.mda).replace(/^MDA\s*/i, '') : '—';
      return `
        <div class="tomo4-card" onclick="window.uiController.showTomo4Detail('${e(item.id)}')">
          <div class="tomo4-card-head">
            <div>
              <div class="tomo4-card-num">FICHA #${e(item.num)} • ${e(item.category_label || item.category)}</div>
              <div class="tomo4-card-name">${e(item.name)}</div>
            </div>
            ${item.nd ? `<span class="bestiary-threat-badge">ND ${e(item.nd)}</span>` : ''}
          </div>
          ${item.title ? `<div style="font-size:12px; color:#ffd700; font-style:italic;">${e(item.title)}</div>` : ''}
          <div style="font-size:12px; color:#a8d5e8;">
            ${e(item.type || 'Entidade')} • MDA ${e(mdaClean)}${item.virtue ? ` • ${e(item.virtue)}` : ''}
          </div>
          <div class="tomo4-card-stats">
            <span class="tomo4-stat-chip">PV ${e(st.pv || '—')}</span>
            <span class="tomo4-stat-chip">PD ${e(st.pd || '—')}</span>
            <span class="tomo4-stat-chip">EA ${e(st.ea || '—')}</span>
            <span class="tomo4-stat-chip">EST ${e(st.est || '—')}</span>
          </div>
          <div style="font-size:12px; color:#dce8f5; line-height:1.45;">
            ${e((item.description || '').slice(0, 165))}${(item.description || '').length > 165 ? '...' : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  showTomo4Detail(entityId) {
    const detail = document.getElementById('bestiary-v4-detail');
    if (!detail) return;
    const item = this.dataLoader.getTomo4EntityById(entityId);
    if (!item) return;

    const e = (v) => this.escapeHtml(v ?? '');
    const st = item.stats || {};
    const at = st.attributes || {};
    const mdaClean = item.mda ? String(item.mda).replace(/^MDA\s*/i, '') : '—';
    const quoteClean = item.quote ? String(item.quote).replace(/^["“”'\s]+|["“”'\s]+$/g, '') : '';
    detail.style.display = 'flex';
    detail.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap;">
        <div>
          <div style="font-family:monospace; font-size:12px; color:#00e5ff;">FICHA CANÔNICA #${e(item.num)} • ${e(item.category_label)} • MDA ${e(mdaClean)}${item.nd ? ` • ND ${e(item.nd)}` : ''}</div>
          <h3 style="margin:4px 0 2px; font-family:var(--font-display); font-size:20px; color:#ffd700;">${e(item.name)}${item.title ? ` — ${e(item.title)}` : ''}</h3>
          <div style="font-size:12.5px; color:#b8cfe5;"><strong>Tipo:</strong> ${e(item.type)} | <strong>Origem:</strong> ${e(item.origin)} | <strong>Território:</strong> ${e(item.territory)}</div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button type="button" class="btn-secondary" style="border-color:#ff5e78; color:#ff9eb0; padding:6px 12px;" onclick="window.uiController.closeModal('modal-bestiary'); window.combatArena?.openArenaWithDefender('${e(item.id)}')">⚔️ Enviar p/ Arena</button>
          <button type="button" class="btn-secondary" style="border-color:#39ff14; color:#39ff14; padding:6px 12px;" onclick="window.battlemapTokens?.spawnCreatureFromBestiary('${e(item.id)}')">👾 Invocar no Mapa 2D</button>
          <button type="button" class="btn-secondary" style="padding:6px 12px;" onclick="document.getElementById('bestiary-v4-detail').style.display='none'">✕ Ocultar</button>
        </div>
      </div>
      ${quoteClean ? `<blockquote style="margin:2px 0; padding:8px 12px; border-left:3px solid #ffd700; background:rgba(212,175,55,0.08); font-style:italic; font-size:13px; color:#ffe680;">"${e(quoteClean)}"</blockquote>` : ''}
      <div style="font-size:13.5px; line-height:1.55; color:#eef6fc;">${e(item.description)}</div>
      <div class="tomo4-card-stats">
        <span class="tomo4-stat-chip"><strong>PV:</strong> ${e(st.pv || '—')}</span>
        <span class="tomo4-stat-chip"><strong>PD:</strong> ${e(st.pd || '—')}</span>
        <span class="tomo4-stat-chip"><strong>EA:</strong> ${e(st.ea || '—')}</span>
        <span class="tomo4-stat-chip"><strong>EST:</strong> ${e(st.est || '—')}</span>
        <span class="tomo4-stat-chip"><strong>RD:</strong> ${e(st.rd || '—')}</span>
        <span class="tomo4-stat-chip" style="border-color:#ffd700; color:#ffd700;">FOR ${e(at.FOR ?? '—')} | VIG ${e(at.VIG ?? '—')} | AGI ${e(at.AGI ?? '—')} | PRE ${e(at.PRE ?? '—')} | INT ${e(at.INT ?? '—')}</span>
      </div>
      <div class="v3-grid-2">
        <div class="v3-card">
          <div class="v3-card-title" style="font-size:13px;">🛡️ Defesas, Reações &amp; Fraquezas</div>
          <div class="v3-card-body">
            ${item.virtue ? `<div><strong>Virtude / Pacto:</strong> ${e(item.virtue)}</div>` : ''}
            ${item.element ? `<div><strong>Elemento:</strong> ${e(item.element)}</div>` : ''}
            ${st.reactions ? `<div><strong>Reações Ativas:</strong> ${e(st.reactions)}</div>` : ''}
            ${item.immunities ? `<div><strong>Imunidades:</strong> ${e(item.immunities)}</div>` : ''}
            ${item.weakness ? `<div style="color:#ff9eb0;"><strong>Ponto Fraco:</strong> ${e(item.weakness)}</div>` : ''}
          </div>
        </div>
        <div class="v3-card">
          <div class="v3-card-title" style="font-size:13px;">⚔️ Ofensiva, Habilidades &amp; Tática</div>
          <div class="v3-card-body">
            ${item.offense ? `<div><strong>Ataques &amp; Desloc.:</strong> ${e(item.offense)}</div>` : ''}
            ${item.abilities ? `<div style="margin-top:4px;"><strong>Habilidades:</strong> ${e(item.abilities)}</div>` : ''}
            ${item.skills ? `<div style="margin-top:4px;"><strong>Perícias:</strong> ${e(item.skills)}</div>` : ''}
            ${item.tactics ? `<div style="margin-top:4px;"><strong>Tática:</strong> ${e(item.tactics)}</div>` : ''}
          </div>
        </div>
      </div>
    `;
    detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  renderCodexGrid() {
    const container = document.getElementById('codex-grid-container');
    if (!container) return;

    container.innerHTML = '';
    const rawData = this.dataLoader.getRawData();

    // Campanhas
    (rawData.campaigns || []).forEach(c => {
      const item = document.createElement('div');
      item.className = 'codex-item';
      item.innerHTML = `
        <div class="codex-item-type">CAMPANHA // ${c.status}</div>
        <div class="codex-item-title">${c.title}</div>
        <div class="codex-item-desc">Tema: ${c.theme}</div>
      `;
      container.appendChild(item);
    });

    // Locais
    (rawData.locations || []).forEach(l => {
      const item = document.createElement('div');
      item.className = 'codex-item';
      item.innerHTML = `
        <div class="codex-item-type">LOCAL // ${this.escapeHtml(l.zone)}</div>
        <div class="codex-item-title">${this.escapeHtml(l.name)}</div>
        <div class="codex-item-desc">${this.escapeHtml(l.description)}</div>
      `;
      item.addEventListener('click', () => {
        this.closeModal('modal-codex');
        const availableLocs = this.dataLoader.getLocations(this.currentCampaignFilter);
        if (!availableLocs.some(loc => loc.id === l.id)) {
          this.setCampaignFilter('all');
        }
        this.openLocationDossier(l.id);
        if (window.app && window.app.mapEngine) {
          window.app.mapEngine.flyToLocation(l.id);
        }
      });
      container.appendChild(item);
    });

    // Personagens
    (rawData.characters || []).forEach(ch => {
      const item = document.createElement('div');
      item.className = 'codex-item';
      item.innerHTML = `
        <div class="codex-item-type">PERSONAGEM // ${this.escapeHtml(ch.player)}</div>
        <div class="codex-item-title">${this.escapeHtml(ch.name)}</div>
        <div class="codex-item-desc">${this.escapeHtml(ch.summary)}</div>
      `;
      item.addEventListener('click', () => {
        this.closeModal('modal-codex');
        const availableChars = this.dataLoader.getCharacters(this.currentCampaignFilter);
        if (!availableChars.some(c => c.id === ch.id)) {
          this.setCampaignFilter('all');
        }
        this.currentCharacterId = ch.id;
        this.openDrawer('characters');
        this.renderCharactersList();
        this.renderActiveCharacterSheet();
      });
      container.appendChild(item);
    });

    // Crônicas
    (rawData.chronicles || []).forEach(cr => {
      const item = document.createElement('div');
      item.className = 'codex-item';
      item.innerHTML = `
        <div class="codex-item-type">CRÔNICA // ${this.escapeHtml(cr.id)}</div>
        <div class="codex-item-title">${this.escapeHtml(cr.title)}</div>
        <div class="codex-item-desc">${this.escapeHtml(cr.lore)}</div>
      `;
      item.addEventListener('click', () => {
        this.closeModal('modal-codex');
        if (this.currentCampaignFilter !== 'all' && this.currentCampaignFilter !== cr.campaign_id) {
          this.setCampaignFilter('all');
        }
        this.openDrawer('chronicles');
        this.renderChroniclesList();
        if (cr.location_id && window.app && window.app.mapEngine) {
          window.app.mapEngine.flyToLocation(cr.location_id);
        }
      });
      container.appendChild(item);
    });
  }

  /* --- BUSCA GLOBAL COM DROPDOWN MULTI-RESULTADOS --- */
  handleSearch(query) {
    const dropdown = document.getElementById('search-results-dropdown');
    if (!dropdown) return;

    if (!query || query.trim().length < 2) {
      this.closeSearchDropdown();
      return;
    }

    const results = this.dataLoader.search(query);
    const hasResults = results.locations.length > 0 || results.characters.length > 0 || results.chronicles.length > 0;

    if (!hasResults) {
      dropdown.innerHTML = `
        <div class="search-empty-state">
          Nenhum registro paranormal para "<strong>${this.escapeHtml(query.trim())}</strong>".
        </div>
      `;
      dropdown.classList.add('open');
      return;
    }

    let html = '';

    if (results.locations.length > 0) {
      html += `
        <div class="search-section-header">📍 LOCAIS TÁTICOS (${results.locations.length})</div>
        ${results.locations.map(loc => `
          <div class="search-result-item" onclick="window.app.selectSearchResult('location', '${loc.id}')">
            <div class="search-item-title">${this.escapeHtml(loc.name)}</div>
            <div class="search-item-meta">${this.escapeHtml(loc.zone)} • ${this.escapeHtml(loc.type)}</div>
          </div>
        `).join('')}
      `;
    }

    if (results.characters.length > 0) {
      html += `
        <div class="search-section-header">👤 PERSONAGENS (${results.characters.length})</div>
        ${results.characters.map(ch => `
          <div class="search-result-item" onclick="window.app.selectSearchResult('character', '${ch.id}')">
            <div class="search-item-title">${this.escapeHtml(ch.name)}</div>
            <div class="search-item-meta">${this.escapeHtml(ch.player)} • ${this.escapeHtml(ch.status || 'Ativo')}</div>
          </div>
        `).join('')}
      `;
    }

    if (results.chronicles.length > 0) {
      html += `
        <div class="search-section-header">📖 CRÔNICAS (${results.chronicles.length})</div>
        ${results.chronicles.map(cr => `
          <div class="search-result-item" onclick="window.app.selectSearchResult('chronicle', '${cr.id}')">
            <div class="search-item-title">${this.escapeHtml(cr.title)}</div>
            <div class="search-item-meta">Campanha: ${this.escapeHtml(cr.campaign_id)}</div>
          </div>
        `).join('')}
      `;
    }

    if (results.creatures && results.creatures.length > 0) {
      html += `
        <div class="search-section-header">👾 BESTIÁRIO (${results.creatures.length})</div>
        ${results.creatures.map(cr => `
          <div class="search-result-item" onclick="window.app.selectSearchResult('creature', '${cr.id}')">
            <div class="search-item-title">${this.escapeHtml(cr.name)}</div>
            <div class="search-item-meta">${this.escapeHtml(cr.threat_level || 'Ameaça')} • MDA ${this.escapeHtml(cr.mda || '')}</div>
          </div>
        `).join('')}
      `;
    }

    if (results.relics && results.relics.length > 0) {
      html += `
        <div class="search-section-header">🏺 RELÍQUIAS (${results.relics.length})</div>
        ${results.relics.map(r => `
          <div class="search-result-item" onclick="window.app.selectSearchResult('relic', '${r.id}')">
            <div class="search-item-title">${this.escapeHtml(r.name)}</div>
            <div class="search-item-meta">${this.escapeHtml(r.type || 'Artefato')} • ${this.escapeHtml(r.cost || '')}</div>
          </div>
        `).join('')}
      `;
    }

    dropdown.innerHTML = html;
    dropdown.classList.add('open');
  }

  closeSearchDropdown() {
    const dropdown = document.getElementById('search-results-dropdown');
    if (dropdown) {
      dropdown.classList.remove('open');
    }
  }

  selectSearchResult(type, id) {
    this.closeSearchDropdown();
    this.soundFX.playTacticalBeep();

    if (type === 'location') {
      const loc = this.dataLoader.getLocationById(id);
      if (loc) {
        const availableLocs = this.dataLoader.getLocations(this.currentCampaignFilter);
        if (!availableLocs.some(l => l.id === id)) {
          this.setCampaignFilter('all');
        }
        if (window.app && window.app.mapEngine) {
          window.app.mapEngine.flyToLocation(id);
        }
        this.openLocationDossier(id);
      }
    } else if (type === 'character') {
      const char = this.dataLoader.getCharacterById(id);
      if (char) {
        const availableChars = this.dataLoader.getCharacters(this.currentCampaignFilter);
        if (!availableChars.some(c => c.id === id)) {
          this.setCampaignFilter('all');
        }
        this.currentCharacterId = id;
        this.openDrawer('characters');
        this.renderCharactersList();
        this.renderActiveCharacterSheet();
      }
    } else if (type === 'chronicle') {
      const cron = this.dataLoader.getChronicleById(id);
      if (cron) {
        if (this.currentCampaignFilter !== 'all' && this.currentCampaignFilter !== cron.campaign_id) {
          this.setCampaignFilter('all');
        }
        this.openDrawer('chronicles');
        this.renderChroniclesList();
        if (cron.location_id && window.app && window.app.mapEngine) {
          window.app.mapEngine.flyToLocation(cron.location_id);
        }
      }
    } else if (type === 'creature') {
      this.openDrawer('bestiary');
      this.renderBestiaryList();
    } else if (type === 'relic') {
      this.renderRelicsList();
      this.openModal('modal-relics-codex');
    }
  }

  setCampaignFilter(filterId) {
    this.currentCampaignFilter = filterId;
    const select = document.getElementById('campaign-filter');
    if (select) select.value = filterId;
    this.onCampaignFilterChange();
  }

  /* --- MUTAÇÃO CELULAR (MDA) --- */
  adjustMDA(charId, delta) {
    if (this.mdaState[charId] === undefined) {
      const char = this.dataLoader.getCharacterById(charId);
      let initMda = 15;
      if (char?.mda) {
        const parsed = parseInt(char.mda);
        if (!isNaN(parsed)) initMda = parsed;
      }
      this.mdaState[charId] = initMda;
    }

    this.mdaState[charId] = Math.max(0, Math.min(100, this.mdaState[charId] + delta));
    this.soundFX.playTacticalBeep();

    if (this.currentCharacterId === charId) {
      this.renderActiveCharacterSheet();
    }
  }

  /* --- BESTIÁRIO DE EVREN --- */
  renderBestiaryList() {
    const container = document.getElementById('bestiary-list-container');
    if (!container) return;

    const creatures = this.dataLoader.getBestiary();
    const totalT4 = (this.dataLoader.getTomo4Entities() || []).length;
    container.innerHTML = `
      <div style="margin-bottom: 10px;">
        <button type="button" class="btn-activate-relic" style="width: 100%; padding: 9px 12px; font-weight: 700; border-color: #ffd700; color: #ffd700; background: rgba(212,175,55,0.14);" onclick="window.uiController.openBestiaryModal()">
          📖 Abrir Compêndio Tomo IV Completo (${totalT4} Fichas Oficiais)
        </button>
      </div>
    ` + creatures.map(cr => `
      <div class="bestiary-card">
        <div class="bestiary-header">
          <div>
            <div class="bestiary-name">${this.escapeHtml(cr.name)}</div>
            <div style="font-size: 10px; color: #a8d5e8; font-family: monospace;">${this.escapeHtml(cr.biotype || 'Biológico')} • MDA ${this.escapeHtml(cr.mda || '50%')}</div>
          </div>
          <span class="bestiary-threat-badge">${this.escapeHtml(cr.threat_level || 'Ameaça')}</span>
        </div>
        <p style="font-size: 11px; color: #d8ecf8; margin: 4px 0; line-height: 1.4;">${this.escapeHtml(cr.description || '')}</p>
        <div class="bestiary-attacks-list">
          <div style="font-size: 10px; color: #ffd700; font-family: monospace; font-weight: 700;">ATAQUES & HABILIDADES:</div>
          ${(cr.attacks || []).map(atk => `
            <div class="bestiary-attack-item">
              <strong>${this.escapeHtml(atk.name)}:</strong> ${this.escapeHtml(atk.desc || atk.type || '')} (${this.escapeHtml(atk.damage || atk.dice || '')})
            </div>
          `).join('')}
        </div>
        <div style="display: flex; gap: 8px; margin-top: 6px;">
          <button class="btn-spawn-creature" style="flex: 1;" onclick="window.battlemapTokens?.spawnCreatureFromBestiary('${cr.id}')">
            👾 Invocar no Mapa
          </button>
          <button class="btn-activate-relic" style="flex: 1; background: rgba(231,76,60,0.3); border-color: #e74c3c;" onclick="window.combatArena?.openArenaWithDefender('${cr.id}')">
            ⚔️ Conflito Direto
          </button>
        </div>
      </div>
    `).join('');
  }

  /* --- ARSENAL DE RELÍQUIAS --- */
  renderRelicsList() {
    const containers = [
      document.getElementById('relics-list-container'),
      document.getElementById('relics-codex-mount')
    ].filter(Boolean);

    if (containers.length === 0) return;

    const relics = this.dataLoader.getRelics();
    const html = relics.map(r => `
      <div class="relic-card">
        <div class="relic-header">
          <div>
            <div class="relic-name">${this.escapeHtml(r.name)}</div>
            <div style="font-size: 10px; color: #c084fc; font-family: monospace;">${this.escapeHtml(r.type || 'Artefato')} • ${this.escapeHtml(r.origin || 'Desconhecida')}</div>
          </div>
          <span class="relic-cost-badge">Custo: ${this.escapeHtml(r.cost || '4 PD')}</span>
        </div>
        <p style="font-size: 11px; color: #d8ecf8; margin: 4px 0; line-height: 1.4;">${this.escapeHtml(r.lore || r.description || '')}</p>
        <div style="background: rgba(0,0,0,0.3); border-left: 2px solid #a855f7; padding: 6px; font-size: 10px; color: #f3e8ff;">
          <strong>EFEITO:</strong> ${this.escapeHtml(r.abilities?.active || r.effect || 'Dobra temporal')}
        </div>
        <button class="btn-activate-relic" style="margin-top: 6px;" onclick="window.app.activateRelic('${this.escapeHtml(r.name)}')">
          ⚡ Sintonizar & Ativar Relíquia
        </button>
      </div>
    `).join('');

    containers.forEach(c => { c.innerHTML = html; });
  }

  /* --- CRONOLOGIA HISTÓRICA DE EVREN (SAGA TREE OVERHAUL) --- */
  renderTimeline(filterCampaignId = 'all') {
    const container = document.getElementById('timeline-mount');
    if (!container) return;

    this.currentTimelineFilter = filterCampaignId;
    let milestones = this.dataLoader.getTimeline() || [];

    // Ordenação estrita cronológica (-5000 a.C. -> 900 -> 1500 -> 1975 -> 2026)
    const getSortYear = (m) => (m.year_numeric ?? m.chronological_year ?? 0);
    milestones = [...milestones].sort((a, b) => getSortYear(a) - getSortYear(b));

    // Filtragem por campanha se solicitada
    if (filterCampaignId !== 'all') {
      milestones = milestones.filter(m => m.campaign_id === filterCampaignId);
    }

    const campaignsList = [
      { id: 'all', label: 'Todas as Eras (-5000 -> 2026)' },
      { id: 'camp_001', label: 'Triângulo & Vera Cruz (Futura)' },
      { id: 'camp_002', label: 'Mansão Vilar (Concluída)' },
      { id: 'camp_filantropo_oeht', label: 'Gala Belvedere / Oeht (Futura)' }
    ];

    container.innerHTML = `
      <div class="saga-timeline-wrapper">
        <!-- Barra de Filtros por Campanha -->
        <div class="saga-timeline-filter-bar">
          <span style="font-family: monospace; font-size: 0.72rem; color: #ffd700; margin-right: 6px;">FILTRAR SAGA:</span>
          ${campaignsList.map(c => `
            <button class="saga-filter-btn ${this.currentTimelineFilter === c.id ? 'active' : ''}" onclick="window.uiController.renderTimeline('${c.id}')">
              ${c.label}
            </button>
          `).join('')}
        </div>

        <!-- Fluxo Cronológico de Incidentes e Sagas -->
        <div class="saga-timeline-flow">
          ${milestones.map((m, idx) => {
            const stars = '★'.repeat(m.threat_stars || 3) + '☆'.repeat(5 - (m.threat_stars || 3));
            const yearLabel = m.era_badge || m.year || (m.year_numeric !== undefined ? String(m.year_numeric) : 'Era Atual');
            return `
              <div class="saga-node-card" id="timeline-card-${this.escapeHtml(m.id)}">
                <div class="saga-node-bullet">${idx + 1}</div>
                <div class="saga-node-header">
                  <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                    <span class="saga-badge-era">${this.escapeHtml(yearLabel)}</span>
                    <span class="saga-threat-badge" title="Nível de Ameaça">${stars} ${this.escapeHtml(m.threat_level || 'Severo')}</span>
                    <span class="badge-tag status" style="font-size: 0.72rem;">${this.escapeHtml(m.status || 'Canônico')}</span>
                  </div>
                  <span class="badge-tag location" style="font-size: 0.75rem;">📍 ${this.escapeHtml(m.location || 'Evren')}</span>
                </div>

                <h3 class="saga-node-title">${this.escapeHtml(m.title)}</h3>
                <p class="saga-node-desc">${this.escapeHtml(m.description)}</p>

                <div class="saga-node-meta-grid">
                  <div class="saga-meta-item">
                    <strong>🛡️ Sobreviventes:</strong>
                    <span>${this.escapeHtml(m.survivors || 'Em apuração')}</span>
                  </div>
                  <div class="saga-meta-item">
                    <strong>⚠️ Baixas / Perdas:</strong>
                    <span>${this.escapeHtml(m.casualties || 'Nenhuma confirmada')}</span>
                  </div>
                </div>

                <div class="saga-node-actions">
                  ${m.campaign_id ? `
                    <button class="btn-secondary" style="font-size: 0.74rem; padding: 4px 10px;" onclick="window.uiController.closeModal('modal-timeline'); window.uiController.openDrawer('characters'); window.uiController.setCampaignFilter('${m.campaign_id}');" title="Ver Agentes dessa Saga">
                      👤 Ver Agentes da Saga
                    </button>
                    <button class="btn-saga-dive" onclick="window.uiController.closeModal('modal-timeline'); window.mergulhoNasNuvens('${m.campaign_id}');" title="Mergulhar nas Nuvens até o Local deste Incidente">
                      🚀 Mergulhar no Local [Mergulho nas Nuvens]
                    </button>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  /* --- BANDEJA UNIVERSAL DE DADOS --- */
  renderUniversalDiceTray() {
    const container = document.getElementById('universal-dice-mount');
    if (!container) return;

    const diceTypes = [4, 6, 8, 10, 12, 20, 100];

    container.innerHTML = `
      <div class="dice-tray-panel">
        <div class="dice-tray-selector">
          ${diceTypes.map(d => `
            <button class="btn-dice-type ${this.diceSelection.type === d ? 'active' : ''}" onclick="window.uiController.selectDiceType(${d})">
              d${d}
            </button>
          `).join('')}
        </div>

        <div style="display: flex; justify-content: center; gap: 20px; align-items: center; font-family: monospace;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #a8d5e8; font-size: 11px;">QUANTIDADE:</span>
            <button class="pd-btn" onclick="window.uiController.adjustDiceCount(-1)">-</button>
            <span style="color: #00e5ff; font-weight: 700; font-size: 14px; min-width: 20px; text-align: center;">${this.diceSelection.count}</span>
            <button class="pd-btn" onclick="window.uiController.adjustDiceCount(1)">+</button>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #a8d5e8; font-size: 11px;">MODIFICADOR:</span>
            <button class="pd-btn" onclick="window.uiController.adjustDiceModifier(-1)">-</button>
            <span style="color: #ffd700; font-weight: 700; font-size: 14px; min-width: 28px; text-align: center;">${this.diceSelection.modifier >= 0 ? '+' : ''}${this.diceSelection.modifier}</span>
            <button class="pd-btn" onclick="window.uiController.adjustDiceModifier(1)">+</button>
          </div>
        </div>

        <div style="text-align: center; margin: 10px 0;">
          <button id="btn-trigger-dice-roll" class="btn-trigger-duel" style="padding: 10px 24px; font-size: 13px;" onclick="window.uiController.rollUniversalDice()">
            🎲 ROLAR ${this.diceSelection.count}d${this.diceSelection.type} ${this.diceSelection.modifier !== 0 ? (this.diceSelection.modifier > 0 ? '+' + this.diceSelection.modifier : this.diceSelection.modifier) : ''}
          </button>
        </div>

        <div id="universal-dice-stage" style="min-height: 50px; text-align: center;">
          <div id="universal-dice-result-banner" class="duel-result-banner" style="display: none;"></div>
        </div>

        <div>
          <div style="font-family: monospace; font-size: 10px; color: #728a9c; margin-bottom: 4px;">HISTÓRICO DE ROLAGENS:</div>
          <div id="universal-dice-history" class="dice-tray-log">
            ${this.diceHistory.length === 0 ? '<div style="color: #728a9c;">Nenhuma rolagem recente.</div>' : this.diceHistory.map(h => `<div>${h}</div>`).join('')}
          </div>
        </div>
      </div>
    `;
  }

  selectDiceType(sides) {
    this.diceSelection.type = sides;
    this.renderUniversalDiceTray();
    this.soundFX.playTacticalBeep();
  }

  adjustDiceCount(delta) {
    this.diceSelection.count = Math.max(1, Math.min(10, this.diceSelection.count + delta));
    this.renderUniversalDiceTray();
  }

  adjustDiceModifier(delta) {
    this.diceSelection.modifier = Math.max(-20, Math.min(20, this.diceSelection.modifier + delta));
    this.renderUniversalDiceTray();
  }

  rollUniversalDice() {
    const { type, count, modifier } = this.diceSelection;
    this.soundFX.playDiceRoll();

    const banner = document.getElementById('universal-dice-result-banner');
    const stage = document.getElementById('universal-dice-stage');
    if (!stage) return;

    const rolls = [];
    let sum = 0;
    for (let i = 0; i < count; i++) {
      const val = Math.floor(Math.random() * type) + 1;
      rolls.push(val);
      sum += val;
    }
    const finalTotal = sum + modifier;
    const isCritMax = type === 20 && rolls.includes(20);
    const isFumble = type === 20 && rolls.includes(1);

    if (banner) {
      banner.style.display = 'block';
      banner.className = 'duel-result-banner';
      if (isCritMax) {
        banner.classList.add('hitkill-active');
        this.soundFX.playCritSpark();
      } else if (isFumble) {
        this.soundFX.playGlitchBurst();
      }

      banner.innerHTML = `
        <div style="font-size: 16px; font-weight: 900; color: #ffd700;">
          TOTAL: ${finalTotal} ${modifier !== 0 ? `(${sum} ${modifier >= 0 ? '+' : ''}${modifier})` : ''}
        </div>
        <div style="font-size: 11px; color: #a8d5e8; margin-top: 4px;">
          Dados [d${type}]: [${rolls.join(', ')}] ${isCritMax ? '• ⭐ CRÍTICO EXTREMO!' : ''} ${isFumble ? '• ⚠️ DESASTRE!' : ''}
        </div>
      `;
    }

    const logEntry = `[${new Date().toLocaleTimeString()}] Rolagem ${count}d${type}${modifier !== 0 ? (modifier >= 0 ? '+' + modifier : modifier) : ''} ➔ <strong>${finalTotal}</strong> (Dados: [${rolls.join(', ')}])`;
    this.diceHistory.unshift(logEntry);
    if (this.diceHistory.length > 15) this.diceHistory.pop();

    const historyEl = document.getElementById('universal-dice-history');
    if (historyEl) {
      historyEl.innerHTML = this.diceHistory.map(h => `<div>${h}</div>`).join('');
    }
  }

  /* --- MIXER ATMOSFÉRICO --- */
  renderSoundMixer() {
    const container = document.getElementById('sound-mixer-mount');
    if (!container) return;

    container.innerHTML = `
      <div class="sound-mixer-panel">
        <div class="mixer-channel">
          <span class="mixer-channel-label">🔊 MASTER VOLUME</span>
          <input type="range" class="mixer-slider" min="0" max="100" value="${Math.round(this.soundFX.masterVolume * 100)}" oninput="window.uiController.setMixerVolume('master', this.value)">
          <span style="font-family: monospace; font-size: 11px; color: #00e5ff; width: 36px; text-align: right;" id="mixer-val-master">${Math.round(this.soundFX.masterVolume * 100)}%</span>
        </div>

        <div class="mixer-channel">
          <span class="mixer-channel-label">💥 EFEITOS (FX)</span>
          <input type="range" class="mixer-slider" min="0" max="100" value="${Math.round(this.soundFX.fxVolume * 100)}" oninput="window.uiController.setMixerVolume('fx', this.value)">
          <span style="font-family: monospace; font-size: 11px; color: #00e5ff; width: 36px; text-align: right;" id="mixer-val-fx">${Math.round(this.soundFX.fxVolume * 100)}%</span>
        </div>

        <div class="mixer-channel">
          <span class="mixer-channel-label">🎵 AMBIÊNCIA DRONE</span>
          <input type="range" class="mixer-slider" min="0" max="100" value="${Math.round(this.soundFX.ambientVolume * 100)}" oninput="window.uiController.setMixerVolume('ambient', this.value)">
          <span style="font-family: monospace; font-size: 11px; color: #00e5ff; width: 36px; text-align: right;" id="mixer-val-ambient">${Math.round(this.soundFX.ambientVolume * 100)}%</span>
        </div>

        <div class="mixer-channel">
          <span class="mixer-channel-label">👻 SUSSURROS ANÔMALOS</span>
          <input type="range" class="mixer-slider" min="0" max="100" value="${Math.round(this.soundFX.whispersVolume * 100)}" oninput="window.uiController.setMixerVolume('whispers', this.value)">
          <span style="font-family: monospace; font-size: 11px; color: #00e5ff; width: 36px; text-align: right;" id="mixer-val-whispers">${Math.round(this.soundFX.whispersVolume * 100)}%</span>
        </div>

        <div style="display: flex; gap: 8px; justify-content: center; margin-top: 10px; flex-wrap: wrap;">
          <button class="pd-btn" onclick="window.soundFX.playTacticalBeep()">Testar Beep</button>
          <button class="pd-btn" onclick="window.soundFX.playRadarPing()">Testar Ping</button>
          <button class="pd-btn" onclick="window.soundFX.playPortalWhoosh()">Testar Portal</button>
          <button class="pd-btn" onclick="window.soundFX.playThunder()">Testar Trovão</button>
          <button class="pd-btn" onclick="window.soundFX.playGlitchBurst()">Testar Glitch</button>
          <button class="pd-btn" onclick="window.soundFX.playWhispers()">Testar Sussurros</button>
        </div>
      </div>
    `;
  }

  setMixerVolume(channel, val) {
    const numeric = parseFloat(val) / 100;
    const label = document.getElementById(`mixer-val-${channel}`);
    if (label) label.textContent = `${Math.round(numeric * 100)}%`;

    if (channel === 'master') this.soundFX.setMasterVolume(numeric);
    else if (channel === 'fx') this.soundFX.setFxVolume(numeric);
    else if (channel === 'ambient') this.soundFX.setAmbientVolume(numeric);
    else if (channel === 'whispers') this.soundFX.setWhispersVolume(numeric);
  }

  /* ==========================================================================
     EXPORTAÇÃO & IMPORTAÇÃO DE FICHAS C.R.I.S.
     ========================================================================== */

  exportActiveCharacterCris() {
    const char = this.dataLoader.getCharacterById(this.currentCharacterId);
    if (!char) return;

    const exportObj = this.buildCrisExportJson(char);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `${(char.name || 'agente').replace(/[^a-zA-Z0-9_-]/g, '_')}_CRIS_Ficha.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();

    if (this.soundFX) this.soundFX.playCritSpark();
  }

  copyActiveCharacterJson() {
    const char = this.dataLoader.getCharacterById(this.currentCharacterId);
    if (!char) return;

    const exportObj = this.buildCrisExportJson(char);
    const jsonStr = JSON.stringify(exportObj, null, 2);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(jsonStr).then(() => {
        alert(`✓ Ficha C.R.I.S. de ${char.name} copiada para a área de transferência!`);
      }).catch(() => {
        prompt("Copie o JSON abaixo:", jsonStr);
      });
    } else {
      prompt("Copie o JSON abaixo:", jsonStr);
    }

    if (this.soundFX) this.soundFX.playTacticalBeep();
  }

  buildCrisExportJson(char) {
    return {
      sistema: "CRIS / Evren RPG",
      versao: "2.5",
      exportado_em: new Date().toISOString(),
      id: char.id,
      nome: char.name,
      codinome: char.codename || '',
      classe: char.class || 'Especialista',
      origem: char.origin || 'Sobrevivente',
      trilha: char.track || '',
      nex: char.nex || '15%',
      patente: char.rank || 'Operador',
      afinidade: char.affinity || 'Energia',
      status_vida: char.life_status || 'alive',
      campanha_id: char.campaign_ids?.[0] || 'camp_002',
      atributos: char.attributes || { Força: 2, Agilidade: 2, Intelecto: 2, Presença: 2, Vigor: 2 },
      status: char.stats || {
        pv_current: 25, pv_max: 25,
        pe_current: 15, pe_max: 15,
        san_current: 20, san_max: 25,
        defesa: 14, protecao: "Nenhuma"
      },
      pericias: char.skills || {},
      habilidades: char.abilities || [],
      inventario: char.inventory || [],
      reliquias: char.relics || [],
      historico: char.description || ''
    };
  }

  setupCrisImporter() {
    const btnOpen = document.getElementById('btn-open-cris-importer');
    const btnDrawer = document.getElementById('btn-drawer-import-cris');
    const fileInput = document.getElementById('cris-file-input');
    const btnExample = document.getElementById('btn-cris-load-example');
    const btnClear = document.getElementById('btn-cris-clear');
    const jsonInput = document.getElementById('cris-json-input');
    const btnConfirm = document.getElementById('btn-cris-confirm-import');

    const openImporter = () => {
      this.openModal('modal-cris-importer');
      if (this.soundFX) this.soundFX.playTacticalBeep();
    };

    if (btnOpen) btnOpen.addEventListener('click', openImporter);
    if (btnDrawer) btnDrawer.addEventListener('click', openImporter);

    // Upload de arquivo JSON
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (jsonInput) {
            jsonInput.value = evt.target.result;
            this.updateCrisPreview();
          }
        };
        reader.readAsText(file);
      });
    }

    // Carregar Modelo de Exemplo C.R.I.S.
    if (btnExample) {
      btnExample.addEventListener('click', () => {
        const sampleCris = {
          nome: "Dante Alighieri (Exemplo)",
          codinome: "Ocultista do Abismo",
          classe: "Ocultista",
          origem: "Acólito",
          trilha: "Graduado",
          nex: "35%",
          patente: "Agente Especial",
          idade: 28,
          afinidade: "Conhecimento",
          atributos: {
            forca: 1,
            agilidade: 2,
            intelecto: 4,
            presenca: 3,
            vigor: 2
          },
          status: {
            pv_atual: 32,
            pv_maximo: 32,
            pe_atual: 24,
            pe_maximo: 24,
            san_atual: 28,
            san_maximo: 45,
            defesa: 12,
            protecao: "Jaqueta de Couro (RD 2)"
          },
          pericias: {
            "Ocultismo": { grau: "Veterano", bonus: 10, attr: "INT", total: 14 },
            "Investigação": { grau: "Treinado", bonus: 5, attr: "INT", total: 9 },
            "Vontade": { grau: "Veterano", bonus: 10, attr: "PRE", total: 13 },
            "Percepção": { grau: "Treinado", bonus: 5, attr: "PRE", total: 8 },
            "Iniciativa": { grau: "Treinado", bonus: 5, attr: "AGI", total: 7 },
            "Furtividade": { grau: "Treinado", bonus: 5, attr: "AGI", total: 7 },
            "Medicina": { grau: "Treinado", bonus: 5, attr: "INT", total: 9 },
            "Ciência": { grau: "Treinado", bonus: 5, attr: "INT", total: 9 }
          },
          habilidades: [
            "Escolhido pelo Outro Lado: +1 PE por rodada de foco",
            "Grimório Hermético: Rituais de 1º e 2º Círculo acelerados",
            "Conhecimento Aplicado: Usa Intelecto no teste de Vontade"
          ],
          inventario: [
            "Grimório Encadernado em Couro Negro",
            "Adaga Cerimonial de Prata",
            "Componentes Ritualísticos de Conhecimento",
            "Gravador de Fita Cassete com Ecos"
          ],
          historico: "Sobrevivente da incursão da Biblioteca Proibida. Dedicou a vida ao estudo das anomalias do universo Evren."
        };

        if (jsonInput) {
          jsonInput.value = JSON.stringify(sampleCris, null, 2);
          this.updateCrisPreview();
        }
      });
    }

    if (btnClear) {
      btnClear.addEventListener('click', () => {
        if (jsonInput) jsonInput.value = '';
        const preview = document.getElementById('cris-preview-card');
        if (preview) {
          preview.style.display = 'none';
          preview.innerHTML = '';
        }
      });
    }

    if (jsonInput) {
      jsonInput.addEventListener('input', () => {
        this.updateCrisPreview();
      });
    }

    if (btnConfirm) {
      btnConfirm.addEventListener('click', () => {
        this.confirmCrisImport();
      });
    }
  }

  updateCrisPreview() {
    const jsonInput = document.getElementById('cris-json-input');
    const preview = document.getElementById('cris-preview-card');
    if (!jsonInput || !preview) return;

    const raw = jsonInput.value.trim();
    if (!raw) {
      preview.style.display = 'none';
      return;
    }

    try {
      const data = JSON.parse(raw);
      const name = data.nome || data.name || 'Agente Sem Nome';
      const cls = data.classe || data.class || 'Classe Não Informada';
      const nex = data.nex || data.mda || '15%';
      const attrs = data.atributos || data.attributes || {};
      const agi = attrs.agilidade ?? attrs.agi ?? attrs.Agilidade ?? 1;
      const forca = attrs.forca ?? attrs.for ?? attrs.Força ?? 1;
      const int = attrs.intelecto ?? attrs.int ?? attrs.Intelecto ?? 1;
      const pre = attrs.presenca ?? attrs.pre ?? attrs.Presença ?? 1;
      const vig = attrs.vigor ?? attrs.vig ?? attrs.Vigor ?? 1;

      const stats = data.status || data.stats || {};
      const pv = stats.pv_maximo || stats.pv_max || stats.pv?.max || stats.pv_atual || 25;
      const pe = stats.pe_maximo || stats.pe_max || stats.pe?.max || stats.pe_atual || 15;
      const san = stats.san_maximo || stats.san_max || stats.san?.max || stats.san_atual || 30;

      const pericias = data.pericias || data.skills || {};
      const skillCount = Array.isArray(pericias) ? pericias.length : Object.keys(pericias).length;

      preview.style.display = 'block';
      preview.innerHTML = `
        <div class="cris-preview-header">
          <div>
            <div class="cris-preview-name">${this.escapeHtml(name)}</div>
            <div style="font-family: monospace; font-size: 0.72rem; color: #8da4be;">${this.escapeHtml(cls)} • NEX ${this.escapeHtml(nex)}</div>
          </div>
          <span class="badge-tag status" style="font-size: 0.75rem;">✓ Formato C.R.I.S. Válido</span>
        </div>

        <div class="cris-preview-stats-grid">
          <div class="cris-preview-stat-card"><div class="cris-preview-stat-label">FOR</div><div class="cris-preview-stat-val">${forca}</div></div>
          <div class="cris-preview-stat-card"><div class="cris-preview-stat-label">AGI</div><div class="cris-preview-stat-val">${agi}</div></div>
          <div class="cris-preview-stat-card"><div class="cris-preview-stat-label">INT</div><div class="cris-preview-stat-val">${int}</div></div>
          <div class="cris-preview-stat-card"><div class="cris-preview-stat-label">PRE</div><div class="cris-preview-stat-val">${pre}</div></div>
          <div class="cris-preview-stat-card"><div class="cris-preview-stat-label">VIG</div><div class="cris-preview-stat-val">${vig}</div></div>
          <div class="cris-preview-stat-card"><div class="cris-preview-stat-label">PV MÁX</div><div class="cris-preview-stat-val" style="color: #ff5e78;">${pv}</div></div>
          <div class="cris-preview-stat-card"><div class="cris-preview-stat-label">PE MÁX</div><div class="cris-preview-stat-val" style="color: #ffa726;">${pe}</div></div>
          <div class="cris-preview-stat-card"><div class="cris-preview-stat-label">SAN MÁX</div><div class="cris-preview-stat-val" style="color: #ab47bc;">${san}</div></div>
        </div>

        <div class="cris-preview-skills-summary">
          <strong>📊 Perícias Detectadas:</strong> ${skillCount} perícias prontas para catálogo.
          ${data.historico || data.history || data.description ? `<br><strong>📖 Lore / Histórico:</strong> ${this.escapeHtml(String(data.historico || data.history || data.description).slice(0, 160))}...` : ''}
        </div>
      `;
    } catch(err) {
      preview.style.display = 'block';
      preview.innerHTML = `
        <div style="color: #ff6b6b; font-family: monospace; font-size: 0.75rem; background: rgba(231,76,60,0.15); padding: 8px; border-radius: 4px; border: 1px solid rgba(231,76,60,0.3);">
          ⚠️ JSON inválido: certifique-se de que colou o JSON completo exportado do CRIS.
        </div>
      `;
    }
  }

  confirmCrisImport() {
    const jsonInput = document.getElementById('cris-json-input');
    const campSelect = document.getElementById('cris-campaign-select');
    if (!jsonInput) return;

    const raw = jsonInput.value.trim();
    if (!raw) {
      alert("Cole o JSON da ficha do C.R.I.S. antes de importar!");
      return;
    }

    try {
      const data = JSON.parse(raw);
      const name = data.nome || data.name || 'Agente Importado';
      const charId = 'char_cris_' + Date.now().toString(36);
      const targetCamp = campSelect ? campSelect.value : 'camp_002';

      const attrs = data.atributos || data.attributes || {};
      const agi = attrs.agilidade ?? attrs.agi ?? attrs.Agilidade ?? 1;
      const forca = attrs.forca ?? attrs.for ?? attrs.Força ?? 1;
      const int = attrs.intelecto ?? attrs.int ?? attrs.Intelecto ?? 1;
      const pre = attrs.presenca ?? attrs.pre ?? attrs.Presença ?? 1;
      const vig = attrs.vigor ?? attrs.vig ?? attrs.Vigor ?? 1;

      const stats = data.status || data.stats || {};
      const pv = stats.pv_atual || stats.pv_maximo || stats.pv_max || stats.pv?.current || 25;
      const pvMax = stats.pv_maximo || stats.pv_max || stats.pv?.max || pv;
      const pe = stats.pe_atual || stats.pe_maximo || stats.pe_max || stats.pe?.current || 15;
      const peMax = stats.pe_maximo || stats.pe_max || stats.pe?.max || pe;
      const san = stats.san_atual || stats.san_maximo || stats.san_max || stats.san?.current || 30;
      const sanMax = stats.san_maximo || stats.san_max || stats.san?.max || san;
      const def = stats.defesa ?? stats.defense ?? 10;
      const prot = stats.protecao || stats.protection || "Nenhuma";

      const normalizedChar = {
        id: charId,
        name: name,
        codename: data.codinome || `// AGENTE CRIS //`,
        player: data.jogador || data.player || "Jogador",
        class: data.classe || data.class || "Especialista",
        origin: data.origem || data.origin || "Sobrevivente",
        track: data.trilha || data.track || "Geral",
        nex: data.nex || "15%",
        rank: data.patente || data.rank || "Operador",
        life_status: data.status_vida || "alive",
        campaign_ids: targetCamp !== 'none' ? [targetCamp] : ['camp_002'],
        attributes: {
          Força: forca,
          Agilidade: agi,
          Intelecto: int,
          Presença: pre,
          Vigor: vig
        },
        stats: {
          pv_current: pv,
          pv_max: pvMax,
          pe_current: pe,
          pe_max: peMax,
          san_current: san,
          san_max: sanMax,
          defesa: def,
          protecao: prot
        },
        skills: data.pericias || data.skills || {},
        abilities: data.habilidades || data.abilities || [],
        inventory: data.inventario || data.inventory || [],
        relics: data.reliquias || data.relics || [],
        description: data.historico || data.history || data.description || "Ficha importada do sistema C.R.I.S. para preservação histórica no universo EVREN."
      };

      // Adiciona ao dataLoader
      this.dataLoader.data.characters.push(normalizedChar);

      // Persiste no localStorage
      try {
        const stored = localStorage.getItem('evren_custom_characters');
        const list = stored ? JSON.parse(stored) : [];
        list.push({
          char: normalizedChar,
          attributes: normalizedChar.attributes,
          pd: { current: pv, max: pvMax },
          mda: parseInt(normalizedChar.nex) || 15
        });
        localStorage.setItem('evren_custom_characters', JSON.stringify(list));
      } catch(e){}

      // Registra no Diário
      if (window.sessionJournal) {
        window.sessionJournal.logEvent(`📥 Ficha C.R.I.S. Importada: ${name} [${normalizedChar.class} • NEX ${normalizedChar.nex}]`);
      }

      if (this.soundFX) this.soundFX.playCritSpark();

      // Fecha modal do importador
      this.closeModal('modal-cris-importer');

      // Abre a gaveta e seleciona a ficha recém-importada
      this.currentCharacterId = charId;
      this.openDrawer('characters');
      this.renderCharactersList();
      this.renderActiveCharacterSheet();

      alert(`✓ Ficha C.R.I.S. de ${name} importada com sucesso e arquivada em Evren!`);

    } catch(err) {
      alert("Erro ao importar ficha C.R.I.S.: Verifique a formatação do JSON.");
    }
  }

  /* ==========================================================================
     TEIA DE HISTÓRIAS & RELAÇÕES (GRAFO CANVAS 2D)
     ========================================================================== */

  setupLoreGraph() {
    this.loreGraphData = null;
    this.loreGraphState = {
      canvas: null,
      ctx: null,
      nodes: [],
      links: [],
      animId: null,
      draggedNode: null,
      hoveredNode: null,
      selectedNode: null,
      physicsActive: true,
      currentFilter: 'all',
      transform: { x: 0, y: 0, k: 1 }
    };

    // Wires dos botões do modal
    const btnReset = document.getElementById('btn-graph-reset');
    const btnPhysics = document.getElementById('btn-graph-physics-toggle');

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.resetLoreGraphView();
      });
    }

    if (btnPhysics) {
      btnPhysics.addEventListener('click', () => {
        this.loreGraphState.physicsActive = !this.loreGraphState.physicsActive;
        btnPhysics.textContent = this.loreGraphState.physicsActive ? '⏸ Física' : '▶ Física';
      });
    }

    // Filter Chips
    document.querySelectorAll('.graph-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        document.querySelectorAll('.graph-chip').forEach(c => c.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const filter = e.currentTarget.getAttribute('data-filter') || 'all';
        this.filterLoreGraph(filter);
      });
    });
  }

  startLoreGraph() {
    const canvas = document.getElementById('lore-graph-canvas');
    if (!canvas) return;

    this.loreGraphState.canvas = canvas;
    this.loreGraphState.ctx = canvas.getContext('2d');

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = (rect.width || 800) * dpr;
    canvas.height = (rect.height || 600) * dpr;
    this.loreGraphState.ctx.scale(dpr, dpr);

    const graphData = this.dataLoader.getRelationsGraph();
    if (!graphData || !graphData.nodes) return;

    // Inicializa posições dos nós
    const centerX = (rect.width || 800) / 2;
    const centerY = (rect.height || 600) / 2;
    const count = graphData.nodes.length;

    this.loreGraphState.nodes = graphData.nodes.map((n, i) => {
      const angle = (i / count) * 2 * Math.PI;
      const dist = n.type === 'campaign' ? 140 : (n.type === 'character' ? 240 : 320);
      return {
        ...n,
        x: centerX + Math.cos(angle) * dist + (Math.random() - 0.5) * 40,
        y: centerY + Math.sin(angle) * dist + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
        radius: n.radius || 18,
        color: n.color || '#00e5ff'
      };
    });

    this.loreGraphState.links = graphData.links.map(l => ({ ...l }));
    this.setupLoreGraphInteractions();

    if (this.loreGraphState.animId) cancelAnimationFrame(this.loreGraphState.animId);
    this.runLoreGraphLoop();
  }

  setupLoreGraphInteractions() {
    const canvas = this.loreGraphState.canvas;
    if (!canvas || canvas._hasLoreEvents) return;
    canvas._hasLoreEvents = true;

    let isMouseDown = false;
    let startX = 0, startY = 0;

    const getNodeAt = (mx, my) => {
      const { x, y, k } = this.loreGraphState.transform;
      const worldX = (mx - x) / k;
      const worldY = (my - y) / k;
      for (let i = this.loreGraphState.nodes.length - 1; i >= 0; i--) {
        const n = this.loreGraphState.nodes[i];
        if (this.loreGraphState.currentFilter !== 'all' && n.type !== this.loreGraphState.currentFilter) continue;
        const dx = n.x - worldX;
        const dy = n.y - worldY;
        if (Math.sqrt(dx * dx + dy * dy) <= n.radius + 6) {
          return n;
        }
      }
      return null;
    };

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const node = getNodeAt(mx, my);

      if (node) {
        this.loreGraphState.draggedNode = node;
        this.inspectLoreGraphNode(node);
      } else {
        isMouseDown = true;
        startX = mx - this.loreGraphState.transform.x;
        startY = my - this.loreGraphState.transform.y;
        this.closeLoreGraphDetails();
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (this.loreGraphState.draggedNode) {
        const { x, y, k } = this.loreGraphState.transform;
        this.loreGraphState.draggedNode.x = (mx - x) / k;
        this.loreGraphState.draggedNode.y = (my - y) / k;
        this.loreGraphState.draggedNode.vx = 0;
        this.loreGraphState.draggedNode.vy = 0;
      } else if (isMouseDown) {
        this.loreGraphState.transform.x = mx - startX;
        this.loreGraphState.transform.y = my - startY;
      } else {
        const node = getNodeAt(mx, my);
        this.loreGraphState.hoveredNode = node;
        canvas.style.cursor = node ? 'pointer' : 'grab';
      }
    });

    window.addEventListener('mouseup', () => {
      isMouseDown = false;
      this.loreGraphState.draggedNode = null;
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      this.loreGraphState.transform.k = Math.max(0.4, Math.min(2.5, this.loreGraphState.transform.k * zoomFactor));
    }, { passive: false });
  }

  resetLoreGraphView() {
    this.loreGraphState.transform = { x: 0, y: 0, k: 1 };
  }

  filterLoreGraph(category) {
    this.loreGraphState.currentFilter = category;
  }

  inspectLoreGraphNode(node) {
    this.loreGraphState.selectedNode = node;
    const details = document.getElementById('lore-graph-details');
    if (!details) return;

    const connectedLinks = this.loreGraphState.links.filter(l => l.source === node.id || l.target === node.id);

    const typeIcons = {
      campaign: '🌐 Campanha',
      character: '👤 Agente',
      relic: '🏺 Relíquia',
      threat: '👾 Ameaça'
    };

    let actionBtnHtml = '';
    if (node.type === 'character') {
      actionBtnHtml = `
        <button class="btn-blood" style="width: 100%; margin-top: 12px; font-size: 0.75rem; padding: 6px;" onclick="window.uiController.closeModal('modal-lore-graph'); window.uiController.selectCharacter('${node.id}'); window.uiController.openDrawer('characters');">
          👤 Abrir Ficha C.R.I.S.
        </button>
      `;
    } else if (node.type === 'campaign') {
      actionBtnHtml = `
        <button class="btn-saga-dive" style="width: 100%; margin-top: 12px; font-size: 0.75rem; padding: 6px; justify-content: center;" onclick="window.uiController.closeModal('modal-lore-graph'); window.mergulhoNasNuvens('${node.id}');">
          🚀 Mergulhar no Local [Mergulho nas Nuvens]
        </button>
      `;
    } else if (node.type === 'relic') {
      actionBtnHtml = `
        <button class="btn-secondary" style="width: 100%; margin-top: 12px; font-size: 0.75rem; padding: 6px; border-color: #ffd700; color: #ffd700;" onclick="window.uiController.closeModal('modal-lore-graph'); window.uiController.openModal('modal-relics-codex');">
          🏺 Ver no Códice de Relíquias
        </button>
      `;
    }

    details.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
        <span class="badge-system" style="font-size: 0.65rem;">${typeIcons[node.type] || node.type}</span>
        <button class="btn-close-modal" style="font-size: 0.8rem; padding: 0 4px;" onclick="window.uiController.closeLoreGraphDetails()">✕</button>
      </div>
      <h3 style="color: ${node.color || '#fff'}; font-family: 'Cinzel', serif; font-size: 1.05rem; margin: 4px 0 8px 0;">${this.escapeHtml(node.label)}</h3>

      <div style="font-size: 0.72rem; color: #a8d5e8; font-family: monospace; margin-bottom: 10px;">
        CONEXÕES ATIVAS (${connectedLinks.length}):
      </div>
      <div style="max-height: 140px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
        ${connectedLinks.map(l => {
          const isSource = l.source === node.id;
          const otherId = isSource ? l.target : l.source;
          const otherNode = this.loreGraphState.nodes.find(n => n.id === otherId);
          return `
            <div style="background: rgba(0,0,0,0.4); padding: 5px 8px; border-radius: 4px; font-size: 0.72rem; border-left: 2px solid ${otherNode?.color || '#00e5ff'};">
              <span style="color: #ffd700; font-weight: 700;">${this.escapeHtml(l.label)}</span>:
              <span style="color: #fff;"> ${this.escapeHtml(otherNode?.label || otherId)}</span>
            </div>
          `;
        }).join('')}
      </div>

      ${actionBtnHtml}
    `;

    details.classList.remove('hidden');
    if (this.soundFX) this.soundFX.playTacticalBeep();
  }

  closeLoreGraphDetails() {
    const details = document.getElementById('lore-graph-details');
    if (details) details.classList.add('hidden');
    this.loreGraphState.selectedNode = null;
  }

  runLoreGraphLoop() {
    const { ctx, canvas, nodes, links, physicsActive, transform, currentFilter, hoveredNode, selectedNode } = this.loreGraphState;
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Física (Forças de atração nas molas e repulsão Coulombiana)
    if (physicsActive) {
      // Repulsão entre nós
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distSq = dx * dx + dy * dy + 1;
          const dist = Math.sqrt(distSq);
          if (dist < 320) {
            const force = 480 / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            if (a !== this.loreGraphState.draggedNode) { a.vx -= fx; a.vy -= fy; }
            if (b !== this.loreGraphState.draggedNode) { b.vx += fx; b.vy += fy; }
          }
        }
      }

      // Atração das arestas
      const nodeMap = new Map();
      nodes.forEach(n => nodeMap.set(n.id, n));

      links.forEach(l => {
        const src = nodeMap.get(l.source);
        const tgt = nodeMap.get(l.target);
        if (src && tgt) {
          const dx = tgt.x - src.x;
          const dy = tgt.y - src.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = src.type === 'campaign' || tgt.type === 'campaign' ? 120 : 90;
          const force = (dist - targetDist) * 0.015;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          if (src !== this.loreGraphState.draggedNode) { src.vx += fx; src.vy += fy; }
          if (tgt !== this.loreGraphState.draggedNode) { tgt.vx -= fx; tgt.vy -= fy; }
        }
      });

      // Gravidade em direção ao centro e amortecimento
      const centerX = width / 2;
      const centerY = height / 2;
      nodes.forEach(n => {
        if (n !== this.loreGraphState.draggedNode) {
          n.vx += (centerX - n.x) * 0.0006;
          n.vy += (centerY - n.y) * 0.0006;
          n.vx *= 0.86;
          n.vy *= 0.86;
          n.x += n.vx;
          n.y += n.vy;
        }
      });
    }

    // Desenha
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    const nodeMap = new Map();
    nodes.forEach(n => nodeMap.set(n.id, n));

    // Desenha Links
    links.forEach(l => {
      const src = nodeMap.get(l.source);
      const tgt = nodeMap.get(l.target);
      if (!src || !tgt) return;

      const isConnectedToFocus = (hoveredNode && (hoveredNode.id === src.id || hoveredNode.id === tgt.id)) ||
                                (selectedNode && (selectedNode.id === src.id || selectedNode.id === tgt.id));

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);

      if (isConnectedToFocus) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2.4;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 8;
      } else {
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
        ctx.lineWidth = 1.0;
        ctx.shadowBlur = 0;
      }
      ctx.stroke();

      // Rótulo da aresta em hover
      if (isConnectedToFocus) {
        const midX = (src.x + tgt.x) / 2;
        const midY = (src.y + tgt.y) / 2;
        ctx.fillStyle = '#ffd700';
        ctx.font = '9px monospace';
        ctx.fillText(l.label || '', midX + 4, midY - 4);
      }
    });

    // Desenha Nós
    nodes.forEach(n => {
      const matchesFilter = currentFilter === 'all' || n.type === currentFilter;
      const isHovered = hoveredNode === n;
      const isSelected = selectedNode === n;

      ctx.save();
      ctx.globalAlpha = matchesFilter ? 1.0 : 0.25;

      // Halo brilhante
      if (isHovered || isSelected || n.type === 'campaign') {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + 6, 0, 2 * Math.PI);
        ctx.fillStyle = n.color || '#00e5ff';
        ctx.globalAlpha = isHovered || isSelected ? 0.35 : 0.15;
        ctx.fill();
        ctx.globalAlpha = matchesFilter ? 1.0 : 0.25;
      }

      // Círculo principal do nó
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#06101c';
      ctx.fill();
      ctx.lineWidth = isHovered || isSelected ? 3.0 : 2.0;
      ctx.strokeStyle = isSelected ? '#ffd700' : (n.color || '#00e5ff');
      ctx.stroke();

      // Ícone ou inicial central
      ctx.fillStyle = isSelected ? '#ffd700' : (n.color || '#fff');
      ctx.font = `bold ${Math.round(n.radius * 0.9)}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const icon = n.type === 'campaign' ? '🌐' : (n.type === 'character' ? '👤' : (n.type === 'relic' ? '🏺' : '👾'));
      ctx.fillText(icon, n.x, n.y);

      // Rótulo textual abaixo
      ctx.fillStyle = isHovered || isSelected ? '#ffd700' : '#e0eaf4';
      ctx.font = `${isHovered ? 'bold ' : ''}10px system-ui`;
      ctx.fillText(n.label, n.x, n.y + n.radius + 12);

      ctx.restore();
    });

    ctx.restore();

    this.loreGraphState.animId = requestAnimationFrame(() => this.runLoreGraphLoop());
  }

  /* ==========================================================================
     MEMORIAL DOS CAÍDOS // HALL DOS HERÓIS DE EVREN
     ========================================================================== */

  setupMemorial() {
    this.canonicalFallen = [
      {
        id: 'fallen_davi',
        name: 'Davi Reis (Identidade Civil Perdida)',
        codename: 'O Desaparecido das Minas',
        class: 'Sobrevivente da Família Vilar',
        campaign_id: 'camp_002',
        campaign_title: 'Mansão Vilar (Concluída)',
        date_of_death: 'Ano 2021 // Queda das Minas',
        cause: 'Dado como morto após o colapso subterrâneo até o Projeto LIMIAR resgatá-lo sob o nome de Gabriel Vilar.',
        quote: 'Se os trilhos começarem a sangrar luz azul, fechem a comporta da galeria oeste.',
        flame_lit: false
      },
      {
        id: 'fallen_guia',
        name: 'Guia Temporário do Triângulo',
        codename: 'O Timoneiro do Naufrágio',
        class: 'Sobrevivente Civis • MDA 5%',
        campaign_id: 'camp_001',
        campaign_title: 'Triângulo & Vera Cruz (Futura)',
        date_of_death: 'Ano 1998 // Naufrágio das 5.000 Almas',
        cause: 'Abriu passagem contra a horda oceânica no convés superior para que quatro refugiados atravessassem o portal do Fosso.',
        quote: 'Corram pela proa! Eu seguro a escotilha até o nevoeiro engolir o convés.',
        flame_lit: false
      },
      {
        id: 'fallen_finch',
        name: 'Dr. Alistair Finch',
        codename: 'Cartógrafo de Caronte',
        class: 'Erudito do Véu',
        campaign_id: 'camp_001',
        campaign_title: 'Triângulo & Vera Cruz (Futura)',
        date_of_death: 'Expedição à Cidadela de Nácar',
        cause: 'Assimilado pela biomassa do Mímico Genético ao mapear os recifes bioluminescentes fora dos muros de Nova Caronte.',
        quote: 'Ele imitava a voz exata do meu contramestre... só notei tarde demais que não piscava.',
        flame_lit: false
      },
      {
        id: 'fallen_video01',
        name: 'Observadores dos Vídeos #01 & #02',
        codename: 'Registros 19.53.28 & 19.53.26',
        class: 'Testemunhas Anômalas (Tomo IV)',
        campaign_id: 'camp_001',
        campaign_title: 'Arquivos Selados A.E.G.I.S.',
        date_of_death: '1975 // Registros Visuais',
        cause: 'Transformados durante o ritual da Coroa Branca nas dunas e o Ciclo Lupino de Bedburg antes da quarentena da A.E.G.I.S.',
        quote: 'A câmera continuou gravando por sete minutos depois que as sombras dobraram de altura.',
        flame_lit: false
      }
    ];
  }

  renderMemorial(filterCamp = 'all') {
    const container = document.getElementById('memorial-mount');
    if (!container) return;

    const seenIds = new Set(this.canonicalFallen.map(f => f.id));
    // Combina caídos canônicos com qualquer personagem salvo no app com status 'dead'
    const customFallen = (this.dataLoader.data.characters || [])
      .filter(c => (c.life_status === 'dead' || c.status?.toLowerCase().includes('morto')) && !seenIds.has(c.id))
      .map(c => ({
        id: c.id,
        name: c.name,
        codename: c.codename || 'Agente de Evren',
        class: c.class || 'Especialista',
        campaign_id: c.campaign_ids?.[0] || 'camp_002',
        campaign_title: (this.dataLoader.getCampaignById(c.campaign_ids?.[0])?.title) || 'Mansão Vilar',
        date_of_death: 'Registrado em Crônica',
        cause: c.description ? c.description.slice(0, 120) : 'Tombou heroicamente sob o Véu.',
        quote: c.quote || 'Um agente nunca é esquecido enquanto sua história for contada.',
        flame_lit: Boolean(c.flame_lit)
      }));

    let allFallen = [...this.canonicalFallen, ...customFallen];
    if (filterCamp !== 'all') {
      allFallen = allFallen.filter(f => f.campaign_id === filterCamp);
    }

    container.innerHTML = `
      <div class="memorial-grid">
        ${allFallen.map(f => `
          <div class="memorial-card ${f.flame_lit ? 'candle-lit' : ''}" id="card-${this.escapeHtml(f.id)}">
            <div class="memorial-header">
              <span class="memorial-badge-fallen">💀 TOMBOU EM COMBATE</span>
              <span class="badge-tag location" style="font-size: 0.68rem;">${this.escapeHtml(f.campaign_title)}</span>
            </div>

            <h3 class="memorial-name">${this.escapeHtml(f.name)}</h3>
            <div class="memorial-meta">${this.escapeHtml(f.codename)} • ${this.escapeHtml(f.class)}</div>

            <div class="memorial-cause">
              <strong>CAUSA DO ÓBITO:</strong> ${this.escapeHtml(f.cause)}
            </div>

            <div class="memorial-quote">
              "${this.escapeHtml(f.quote)}"
            </div>

            <div class="memorial-actions">
              <span style="font-family: monospace; font-size: 0.68rem; color: #8da4be;">🗓️ ${this.escapeHtml(f.date_of_death)}</span>
              <button class="btn-memorial-flame" onclick="window.uiController.toggleMemorialFlame('${this.escapeHtml(f.id)}')">
                <span class="${f.flame_lit ? 'memorial-candle-flicker' : ''}">🕯️</span>
                <span>${f.flame_lit ? 'Chama Acesa' : 'Acender Chama'}</span>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  toggleMemorialFlame(fallenId) {
    const fallen = this.canonicalFallen.find(f => f.id === fallenId);
    if (fallen) {
      fallen.flame_lit = !fallen.flame_lit;
      if (fallen.flame_lit && this.soundFX) {
        this.soundFX.playCritSpark();
        if (window.sessionJournal) {
          window.sessionJournal.logEvent(`🕯️ Chama memorial acesa em honra de ${fallen.name}.`);
        }
      }
      this.renderMemorial();
    }
  }

  /* ==========================================================================
     GRAVADOR TÁTICO DE FITAS CASSETE // ARQUIVO A.E.G.I.S.
     ========================================================================== */

  setupCassettePlayer() {
    this.cassetteTapes = [
      {
        id: 'tape_01',
        title: 'FITA #01: O LIMIAR NAS MINAS',
        author: 'Gabriel Vilar',
        sector: 'Mansão Vilar & Minas Coloniais (Crônica II)',
        date: 'Ano 2024 // Crônica II',
        transcript: 'Aqui é Gabriel Vilar. Se você está ouvindo isso, o Projeto LIMIAR foi disparado. Lucas ainda respira lá embaixo... o Expresso do Sexto Bilhete trouxe os cinco amigos de volta à porta da Mansão.',
        frequency: 440
      },
      {
        id: 'tape_02',
        title: 'FITA #02: S.O.S. DE NOVA CARONTE',
        author: 'Vigias da Muralha',
        sector: 'Vera Cruz das Almas // Triângulo (Crônica I)',
        date: 'Era das Muralhas',
        transcript: 'Relatório do Porto de Nova Caronte: o farol apagou durante a névoa de sal abissal. Um Mímico Genético passou pela guarita sul imitando o capelão. Mantenham prata e ferro frio engatilhados.',
        frequency: 380
      },
      {
        id: 'tape_03',
        title: 'FITA #03: REGISTRO VISUAL #19.53.28',
        author: 'Arquivo Selado A.E.G.I.S.',
        sector: 'Teocracia Térmica // Coroa Branca (Tomo IV)',
        date: 'Registro #01 (Vídeo)',
        transcript: 'Transcrição do Vídeo #01: A Montanha Oca pulsa em baixa frequência. Quando o Receptáculo ergueu a Coroa Branca nas dunas, cada sombra ao redor do festival ganhou três pupilas de luz fria.',
        frequency: 520
      },
      {
        id: 'tape_04',
        title: 'FITA #04: GRAVAÇÃO #19.53.26 (LUPINO)',
        author: 'Câmara de Evidências A.E.G.I.S.',
        sector: 'Cadeia de Custódia Stumpp (Tomo IV)',
        date: 'Registro #02 (Vídeo)',
        transcript: 'Alerta de contenção sobre o Ciclo Lupino: o hospedeiro cadavérico permanece inerte sob luz solar, mas sua massa óssea se recompõe em sete segundos ao cair da noite de Bedburg.',
        frequency: 330
      },
      {
        id: 'tape_05',
        title: 'FITA #05: INTERCEPTAÇÃO GALA BELVEDERE',
        author: 'Inspetora Helena Vargas / Ordem da Cinza',
        sector: 'Mansão Belvedere — Genebra (Crônica III)',
        date: 'Relógio 23:40 // 3 Travas',
        transcript: 'Oeht liberou o acesso ao cofre do subsolo antes da meia-noite. Duas das Três Travas ainda seguram o Véu no Salão Dourado. Se o Anárquico romper a Redoma antes da evacuação, disparem o Protocolo Eclipse.',
        frequency: 290
      }
    ];

    this.activeTapeIndex = 0;
    this.isTapePlaying = false;
    this.speechUtterance = null;

    // Renderiza lista de fitas
    const trackList = document.getElementById('cassette-track-list');
    if (trackList) {
      trackList.innerHTML = this.cassetteTapes.map((t, idx) => `
        <div class="cassette-track-item ${idx === 0 ? 'active' : ''}" onclick="window.uiController.selectCassetteTape(${idx})">
          <div class="cassette-track-title">📼 ${this.escapeHtml(t.title)}</div>
          <div class="cassette-track-meta">${this.escapeHtml(t.author)} // ${this.escapeHtml(t.sector)} (${this.escapeHtml(t.date)})</div>
        </div>
      `).join('');
    }

    // Wires dos botões do deck
    document.getElementById('btn-cassette-play')?.addEventListener('click', () => this.playCassette());
    document.getElementById('btn-cassette-pause')?.addEventListener('click', () => this.pauseCassette());
    document.getElementById('btn-cassette-stop')?.addEventListener('click', () => this.stopCassette());
  }

  selectCassetteTape(idx) {
    this.stopCassette();
    this.activeTapeIndex = idx;
    const tape = this.cassetteTapes[idx];

    document.querySelectorAll('.cassette-track-item').forEach((item, i) => {
      item.classList.toggle('active', i === idx);
    });

    const titleEl = document.getElementById('cassette-title-display');
    const textEl = document.getElementById('cassette-transcript-display');
    if (titleEl) titleEl.textContent = tape.title;
    if (textEl) textEl.textContent = tape.transcript;

    if (this.soundFX) this.soundFX.playTacticalBeep();
  }

  playCassette() {
    const tape = this.cassetteTapes[this.activeTapeIndex];
    if (!tape) return;

    this.isTapePlaying = true;

    // Animação dos carretéis e agulhas
    document.getElementById('cassette-reel-left')?.classList.add('spinning');
    document.getElementById('cassette-reel-right')?.classList.add('spinning');
    document.getElementById('vu-meter-needle-left')?.classList.add('active');
    document.getElementById('vu-meter-needle-right')?.classList.add('active');

    // Reprodução de áudio vocal com SpeechSynthesis se disponível
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(tape.transcript);
      utt.lang = 'pt-BR';
      utt.rate = 0.95;
      utt.pitch = 0.85;

      utt.onend = () => {
        this.stopCassette();
      };

      utt.onerror = (e) => {
        console.warn('SpeechSynthesis indisponível ou em modo headless:', e);
      };

      this.speechUtterance = utt;
      try {
        window.speechSynthesis.speak(utt);
      } catch(e){}
    }

    if (this.soundFX) this.soundFX.playTacticalBeep();
  }

  pauseCassette() {
    this.isTapePlaying = false;
    document.getElementById('cassette-reel-left')?.classList.remove('spinning');
    document.getElementById('cassette-reel-right')?.classList.remove('spinning');
    document.getElementById('vu-meter-needle-left')?.classList.remove('active');
    document.getElementById('vu-meter-needle-right')?.classList.remove('active');

    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  }

  stopCassette() {
    this.isTapePlaying = false;
    document.getElementById('cassette-reel-left')?.classList.remove('spinning');
    document.getElementById('cassette-reel-right')?.classList.remove('spinning');
    document.getElementById('vu-meter-needle-left')?.classList.remove('active');
    document.getElementById('vu-meter-needle-right')?.classList.remove('active');

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /* ==========================================================================
     CADASTRAR NOVA SESSÃO / EPISÓDIO DE RPG
     ========================================================================== */

  setupSessionCreator() {
    const form = document.getElementById('form-create-session');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const title = document.getElementById('session-episode-title')?.value.trim();
      const campId = document.getElementById('session-camp-select')?.value;
      const date = document.getElementById('session-date')?.value.trim();
      const players = document.getElementById('session-players')?.value.trim();
      const summary = document.getElementById('session-summary')?.value.trim();
      const quote = document.getElementById('session-highlight-quote')?.value.trim();

      if (!title || !summary) return;

      const newChronicle = {
        id: 'chron_sess_' + Date.now().toString(36),
        title: title,
        campaign_id: campId,
        date: date || 'Ano 2026',
        players: players || 'Agentes',
        lore: summary,
        highlight_quote: quote || ''
      };

      if (!this.dataLoader.data.chronicles) this.dataLoader.data.chronicles = [];
      this.dataLoader.data.chronicles.unshift(newChronicle);

      // Persiste no localStorage
      try {
        const stored = localStorage.getItem('evren_custom_chronicles');
        const list = stored ? JSON.parse(stored) : [];
        list.unshift(newChronicle);
        localStorage.setItem('evren_custom_chronicles', JSON.stringify(list));
      } catch(e){}

      // Notifica e atualiza interface
      if (window.sessionJournal) {
        window.sessionJournal.logEvent(`📝 Nova Sessão Registrada: ${title} (${date})`);
      }

      if (this.soundFX) this.soundFX.playCritSpark();

      this.closeModal('modal-session-creator');
      form.reset();

      // Renderiza na gaveta
      this.renderChroniclesList();
      this.openDrawer('chronicles');

      alert(`✓ Sessão "${title}" gravada no memorial de Evren com sucesso!`);
    });
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

window.openCampaignStory = (id) => window.uiController?.openCampaignStory(id);
window.UIController = UIController;
