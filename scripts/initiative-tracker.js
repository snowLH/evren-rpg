/**
 * RASTREADOR DE INICIATIVA & GERENCIADOR DE TURNOS TÁTICOS
 * Universo: Evren — Mesa Interativa
 * Gerencia a fila de combate, rolagem de iniciativa simultânea,
 * controle de rodadas e spotlight nos tokens do mapa.
 */

class InitiativeTracker {
  constructor(mapEngine, dataLoader, uiController) {
    this.mapEngine = mapEngine;
    this.dataLoader = dataLoader;
    this.uiController = uiController;

    this.round = 1;
    this.currentTurnIndex = 0;
    this.combatants = [];
    this.isActive = false;

    // Elementos DOM
    this.trackerBar = null;
    this.roundNumEl = null;
    this.queueEl = null;
  }

  init() {
    this.trackerBar = document.getElementById('initiative-tracker-bar');
    this.roundNumEl = document.getElementById('init-round-num');
    this.queueEl = document.getElementById('init-queue-container');

    const btnOpen = document.getElementById('btn-open-initiative');
    const btnNext = document.getElementById('btn-init-next');
    const btnPrev = document.getElementById('btn-init-prev');
    const btnRoll = document.getElementById('btn-init-roll-all');
    const btnClose = document.getElementById('btn-init-close');

    if (btnOpen) {
      btnOpen.addEventListener('click', () => this.toggleCombat());
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => this.nextTurn());
    }

    if (btnPrev) {
      btnPrev.addEventListener('click', () => this.prevTurn());
    }

    if (btnRoll) {
      btnRoll.addEventListener('click', () => this.rollAllInitiative());
    }

    if (btnClose) {
      btnClose.addEventListener('click', () => this.endCombat());
    }

    console.log('✓ InitiativeTracker inicializado com sucesso.');
  }

  toggleCombat() {
    if (this.isActive) {
      this.endCombat();
    } else {
      this.startCombat();
    }
  }

  startCombat() {
    this.isActive = true;
    this.round = 1;
    this.currentTurnIndex = 0;
    this.combatants = [];

    // Tenta capturar os tokens ativos no battlemap
    const activeTokens = this.mapEngine.battlemapTokens?.activeTokens;
    if (activeTokens && activeTokens.size > 0) {
      activeTokens.forEach((item) => {
        const d = item.data;
        const agiBonus = 2; // Bônus base de Agilidade
        const roll = Math.floor(Math.random() * 20) + 1;
        this.combatants.push({
          id: d.id,
          name: d.name,
          icon: d.icon || '👤',
          pd: d.pd || 20,
          max_pd: d.max_pd || 20,
          mda: d.mda || 15,
          score: roll + agiBonus,
          coords: d.initial_coords,
          marker: item.marker
        });
      });
    } else {
      // Fallback gracioso com combatentes principais de Evren
      const defaultChars = this.dataLoader.getAllCharacters().slice(0, 3);
      const defaultCreature = this.dataLoader.getAllCreatures()[0];

      defaultChars.forEach(c => {
        const roll = Math.floor(Math.random() * 20) + 1;
        this.combatants.push({
          id: c.id,
          name: c.name,
          icon: '👤',
          pd: 18,
          max_pd: 20,
          mda: parseInt(c.mda) || 15,
          score: roll + 2,
          coords: null,
          marker: null
        });
      });

      if (defaultCreature) {
        const roll = Math.floor(Math.random() * 20) + 1;
        this.combatants.push({
          id: defaultCreature.id,
          name: defaultCreature.name,
          icon: '👾',
          pd: 25,
          max_pd: 25,
          mda: parseInt(defaultCreature.mda) || 60,
          score: roll + 4,
          coords: null,
          marker: null
        });
      }
    }

    // Ordena por iniciativa decrescente
    this.combatants.sort((a, b) => b.score - a.score);

    if (this.trackerBar) {
      this.trackerBar.classList.remove('hidden');
    }

    if (window.soundFX) window.soundFX.playTacticalBeep();
    if (window.sessionJournal) {
      window.sessionJournal.logEvent(`⚔️ Combate tático iniciado! Rodada 1.`);
    }

    this.render();
    this.spotlightCurrent();
  }

  rollAllInitiative() {
    this.combatants.forEach(c => {
      const roll = Math.floor(Math.random() * 20) + 1;
      c.score = roll + 2;
    });
    this.combatants.sort((a, b) => b.score - a.score);
    this.currentTurnIndex = 0;

    if (window.soundFX) window.soundFX.playDiceRoll();
    this.render();
    this.spotlightCurrent();
  }

  nextTurn() {
    if (this.combatants.length === 0) return;

    this.currentTurnIndex++;
    if (this.currentTurnIndex >= this.combatants.length) {
      this.currentTurnIndex = 0;
      this.round++;
      if (window.soundFX) window.soundFX.playRadarPing();
      if (window.sessionJournal) {
        window.sessionJournal.logEvent(`⏳ Avanço de Rodada: Rodada ${this.round}`);
      }
    } else {
      if (window.soundFX) window.soundFX.playTacticalBeep();
    }

    this.render();
    this.spotlightCurrent();
  }

  prevTurn() {
    if (this.combatants.length === 0) return;

    this.currentTurnIndex--;
    if (this.currentTurnIndex < 0) {
      if (this.round > 1) {
        this.round--;
        this.currentTurnIndex = this.combatants.length - 1;
      } else {
        this.currentTurnIndex = 0;
      }
    }

    this.render();
    this.spotlightCurrent();
  }

  endCombat() {
    this.isActive = false;
    if (this.trackerBar) {
      this.trackerBar.classList.add('hidden');
    }
    this.clearSpotlights();
    if (window.sessionJournal) {
      window.sessionJournal.logEvent(`🛑 Combate tático finalizado.`);
    }
  }

  spotlightCurrent() {
    this.clearSpotlights();
    const current = this.combatants[this.currentTurnIndex];
    if (!current) return;

    // Se possui marker associado no mapa, foca a câmera e adiciona spotlight
    if (current.marker) {
      const el = current.marker.getElement();
      if (el) {
        el.classList.add('tactical-turn-spotlight');
      }
      if (current.coords) {
        this.mapEngine.map.panTo(current.coords, { animate: true, duration: 0.6 });
      }
    }
  }

  clearSpotlights() {
    document.querySelectorAll('.tactical-turn-spotlight').forEach(el => {
      el.classList.remove('tactical-turn-spotlight');
    });
  }

  render() {
    if (this.roundNumEl) {
      this.roundNumEl.textContent = this.round;
    }

    if (!this.queueEl) return;
    this.queueEl.innerHTML = '';

    this.combatants.forEach((c, idx) => {
      const isCurrent = idx === this.currentTurnIndex;
      const card = document.createElement('div');
      card.className = `init-card ${isCurrent ? 'active-turn' : ''}`;
      card.innerHTML = `
        <span class="init-card-avatar">${c.icon}</span>
        <div class="init-card-info">
          <span class="init-card-name">${c.name.split(' ')[0]}</span>
          <span class="init-card-stats">PD ${c.pd}/${c.max_pd} • ${c.mda}%</span>
        </div>
        <span class="init-card-score" title="Valor de Iniciativa">${c.score}</span>
      `;

      card.addEventListener('click', () => {
        this.currentTurnIndex = idx;
        this.render();
        this.spotlightCurrent();
      });

      this.queueEl.appendChild(card);
    });
  }
}

window.InitiativeTracker = InitiativeTracker;
