/**
 * BACKUP & STATE MANAGER — UNIVERSO EVREN
 * Gerencia exportação, importação e persistência do estado completo da mesa de RPG.
 * Permite portabilidade total entre computadores, celulares e navegadores na nuvem.
 */

class BackupManager {
  constructor(dataLoader, uiController) {
    this.dataLoader = dataLoader;
    this.uiController = uiController;
    this.modalEl = null;
  }

  init() {
    this.modalEl = document.getElementById('modal-backup-manager');

    // Botão de abertura no HUD
    const btnOpen = document.getElementById('btn-open-backup');
    if (btnOpen) {
      btnOpen.addEventListener('click', () => this.openModal());
    }

    // Botão de Exportar Estado Completo
    const btnExport = document.getElementById('btn-backup-export');
    if (btnExport) {
      btnExport.addEventListener('click', () => this.exportFullGameState());
    }

    // Input de Importar Arquivo
    const fileInput = document.getElementById('backup-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) this.importFromFile(file);
      });
    }

    // Botão de Importar via Texto/JSON
    const btnImportText = document.getElementById('btn-backup-import-text');
    if (btnImportText) {
      btnImportText.addEventListener('click', () => this.importFromTextarea());
    }

    // Botão de Resetar para Lore de Fábrica
    const btnReset = document.getElementById('btn-backup-reset-factory');
    if (btnReset) {
      btnReset.addEventListener('click', () => this.resetToFactoryDefaults());
    }

    // PWA Install Prompt Listener
    this.setupPwaInstallPrompt();

    console.log('✓ BackupManager inicializado com sucesso.');
  }

  openModal() {
    if (!this.modalEl) return;
    this.updateStatsDisplay();
    this.modalEl.classList.add('open');
    if (window.soundFX) window.soundFX.playTacticalBeep();
  }

  closeModal() {
    if (!this.modalEl) return;
    this.modalEl.classList.remove('open');
  }

  updateStatsDisplay() {
    const charsCount = this.dataLoader.getAllCharacters ? this.dataLoader.getAllCharacters().length : 0;
    const notesLength = localStorage.getItem('evren_investigator_notes')?.length || 0;
    const logsCount = (JSON.parse(localStorage.getItem('evren_session_logs') || '[]')).length;
    const customCharsCount = (JSON.parse(localStorage.getItem('evren_custom_characters_v1') || '[]')).length;

    const statsEl = document.getElementById('backup-stats-summary');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="backup-stat-chip"><strong>${charsCount}</strong> Agentes Registrados</div>
        <div class="backup-stat-chip"><strong>${customCharsCount}</strong> Agentes Customizados</div>
        <div class="backup-stat-chip"><strong>${logsCount}</strong> Entradas no Diário</div>
        <div class="backup-stat-chip"><strong>${Math.round(notesLength / 1024 * 10) / 10} KB</strong> de Notas</div>
      `;
    }
  }

  exportFullGameState() {
    try {
      const state = {
        meta: {
          app: "Mesa Interativa de RPG — Universo EVREN",
          version: "2.0.0",
          exportedAt: new Date().toISOString(),
          universe: "Evren"
        },
        characters: {
          custom: JSON.parse(localStorage.getItem('evren_custom_characters_v1') || '[]'),
          cris: JSON.parse(localStorage.getItem('evren_custom_characters') || '[]'),
          statOverrides: JSON.parse(localStorage.getItem('evren_character_stat_overrides') || '{}'),
          pdStates: this.uiController ? this.uiController.pdState : {},
          mdaStates: this.uiController ? this.uiController.mdaState : {},
          attributes: this.uiController ? this.uiController.charAttributes : {}
        },
        chronicles: JSON.parse(localStorage.getItem('evren_custom_chronicles') || '[]'),
        campaigns: JSON.parse(localStorage.getItem('evren_custom_campaigns') || '[]'),
        locations: JSON.parse(localStorage.getItem('evren_custom_locations') || '[]'),
        memorialFlames: JSON.parse(localStorage.getItem('evren_memorial_flames') || '[]'),
        journal: {
          notes: localStorage.getItem('evren_investigator_notes') || '',
          logs: JSON.parse(localStorage.getItem('evren_session_logs') || '[]')
        },
        fogOfWar: {
          revealed: window.fogOfWar ? Array.from(window.fogOfWar.revealedCells || []) : []
        },
        tokens: window.battlemapTokens ? window.battlemapTokens.exportState() : null,
        soundSettings: {
          masterVolume: window.soundFX ? window.soundFX.masterVolume : 1,
          fxVolume: window.soundFX ? window.soundFX.fxVolume : 1,
          ambientVolume: window.soundFX ? window.soundFX.ambientVolume : 0.5
        }
      };

      const jsonStr = JSON.stringify(state, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `evren_rpg_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (window.sessionJournal) {
        window.sessionJournal.logEvent('💾 Backup completo da mesa exportado com sucesso.');
      }
      if (window.soundFX) window.soundFX.playTacticalBeep();

      alert('✓ Arquivo de backup (.json) gerado com sucesso! Guarde-o para restaurar sua campanha em qualquer dispositivo.');
    } catch (err) {
      console.error('Erro ao exportar backup:', err);
      alert('Erro ao exportar backup: ' + err.message);
    }
  }

  importFromFile(file) {
    if (!file) return;

    // Limite máximo de segurança: 25 MB
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert('Arquivo de backup excede o tamanho máximo de segurança permitido (25 MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        if (text.length > MAX_SIZE) {
          throw new Error('Conteúdo textual excede o limite de segurança.');
        }
        const data = JSON.parse(text);
        this.applyImportedState(data);
      } catch (err) {
        alert('Erro ao ler arquivo JSON de backup: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  importFromTextarea() {
    const textarea = document.getElementById('backup-import-textarea');
    if (!textarea || !textarea.value.trim()) {
      alert('Por favor, cole o conteúdo JSON do backup no campo de texto.');
      return;
    }

    const MAX_SIZE = 25 * 1024 * 1024;
    if (textarea.value.length > MAX_SIZE) {
      alert('O texto colado excede o limite de segurança de 25 MB.');
      return;
    }

    try {
      const data = JSON.parse(textarea.value.trim());
      this.applyImportedState(data);
      textarea.value = '';
    } catch (err) {
      alert('Conteúdo JSON inválido: ' + err.message);
    }
  }

  sanitizeString(val) {
    if (typeof val !== 'string') return '';
    return val
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .trim();
  }

  sanitizeMediaUrl(url, fallback = 'assets/icon-192.png') {
    if (window.safeUrl) return window.safeUrl(url, fallback);
    if (!url || typeof url !== 'string') return fallback;
    const lower = url.trim().toLowerCase();
    if (lower.startsWith('javascript:') || lower.startsWith('vbscript:') || lower.startsWith('data:text/')) {
      return fallback;
    }
    return url.trim();
  }

  applyImportedState(state) {
    if (!state || typeof state !== 'object' || Array.isArray(state)) {
      alert('Arquivo de backup inválido ou incompatível.');
      return;
    }

    if (!state.characters && !state.journal && !state.campaigns && !state.locations) {
      alert('Arquivo de backup não contém coleções do Universo Evren.');
      return;
    }

    const confirmRestore = confirm('Tem certeza que deseja restaurar este estado de jogo? Os dados atuais da sessão serão atualizados com as informações do backup.');
    if (!confirmRestore) return;

    try {
      // 1. Restaura Personagens Customizados & Fichas CRIS com sanitização
      if (Array.isArray(state.characters?.custom)) {
        const safeCustom = state.characters.custom.slice(0, 500).map((c) => ({
          ...c,
          name: this.sanitizeString(c.name || 'Agente'),
          codename: this.sanitizeString(c.codename || ''),
          origin: this.sanitizeString(c.origin || ''),
          class: this.sanitizeString(c.class || ''),
          summary: this.sanitizeString(c.summary || ''),
          quote: this.sanitizeString(c.quote || ''),
          portrait: this.sanitizeMediaUrl(c.portrait, 'assets/icon-192.png')
        }));
        localStorage.setItem('evren_custom_characters_v1', JSON.stringify(safeCustom));
        if (window.characterCreator) {
          window.characterCreator.loadCustomCharactersFromStorage();
        }
      }

      if (Array.isArray(state.characters?.cris)) {
        const safeCris = state.characters.cris.slice(0, 500).map((item) => {
          const charObj = item.char || item;
          if (charObj && typeof charObj === 'object') {
            return {
              ...charObj,
              name: this.sanitizeString(charObj.name || 'Agente CRIS'),
              portrait: this.sanitizeMediaUrl(charObj.portrait, 'assets/icon-192.png'),
              summary: this.sanitizeString(charObj.summary || '')
            };
          }
          return item;
        });
        localStorage.setItem('evren_custom_characters', JSON.stringify(safeCris));
        safeCris.forEach((charObj) => {
          if (charObj && charObj.id && !this.dataLoader.data.characters.some((c) => c.id === charObj.id)) {
            this.dataLoader.data.characters.push(charObj);
          }
        });
      }

      if (state.characters?.statOverrides && typeof state.characters.statOverrides === 'object') {
        localStorage.setItem('evren_character_stat_overrides', JSON.stringify(state.characters.statOverrides));
        if (this.uiController?.loadCharacterStatOverridesFromStorage) {
          this.uiController.loadCharacterStatOverridesFromStorage();
        }
      }

      // Restaura Crônicas e Sessões
      if (Array.isArray(state.chronicles)) {
        const safeChronicles = state.chronicles.slice(0, 500).map((cr) => ({
          ...cr,
          title: this.sanitizeString(cr.title || 'Crônica'),
          author: this.sanitizeString(cr.author || ''),
          lore: this.sanitizeString(cr.lore || cr.summary || ''),
          summary: this.sanitizeString(cr.summary || ''),
          quote: this.sanitizeString(cr.quote || '')
        }));
        localStorage.setItem('evren_custom_chronicles', JSON.stringify(safeChronicles));
        if (!this.dataLoader.data.chronicles) this.dataLoader.data.chronicles = [];
        safeChronicles.forEach((cr) => {
          if (!this.dataLoader.data.chronicles.some((c) => c.id === cr.id)) {
            this.dataLoader.data.chronicles.unshift(cr);
          }
        });
        if (this.uiController) this.uiController.renderChroniclesList();
      }

      // Restaura Campanhas e Locais Customizados
      if (Array.isArray(state.campaigns)) {
        const safeCampaigns = state.campaigns.slice(0, 200).map((camp) => ({
          ...camp,
          title: this.sanitizeString(camp.title || camp.name || 'Campanha'),
          synopsis: this.sanitizeString(camp.synopsis || camp.description || ''),
          theme: this.sanitizeString(camp.theme || '')
        }));
        localStorage.setItem('evren_custom_campaigns', JSON.stringify(safeCampaigns));
        safeCampaigns.forEach((camp) => {
          if (!this.dataLoader.data.campaigns.some((c) => c.id === camp.id)) {
            this.dataLoader.data.campaigns.push(camp);
          }
        });
      }

      if (Array.isArray(state.locations)) {
        const safeLocations = state.locations.slice(0, 500).map((loc) => ({
          ...loc,
          name: this.sanitizeString(loc.name || 'Local'),
          description: this.sanitizeString(loc.description || ''),
          historical_importance: this.sanitizeString(loc.historical_importance || ''),
          illustration: this.sanitizeMediaUrl(loc.illustration, 'assets/ref_interior_tavern.jpg')
        }));
        localStorage.setItem('evren_custom_locations', JSON.stringify(safeLocations));
        safeLocations.forEach((loc) => {
          if (!this.dataLoader.data.locations.some((l) => l.id === loc.id)) {
            this.dataLoader.data.locations.push(loc);
          }
        });
      }

      if (Array.isArray(state.memorialFlames)) {
        localStorage.setItem('evren_memorial_flames', JSON.stringify(state.memorialFlames.slice(0, 200)));
        if (this.uiController) this.uiController.renderMemorial();
      }

      // 2. Restaura Estados de PD e MDA
      if (this.uiController) {
        if (state.characters?.pdStates && typeof state.characters.pdStates === 'object') {
          Object.assign(this.uiController.pdState, state.characters.pdStates);
        }
        if (state.characters?.mdaStates && typeof state.characters.mdaStates === 'object') {
          Object.assign(this.uiController.mdaState, state.characters.mdaStates);
        }
        if (state.characters?.attributes && typeof state.characters.attributes === 'object') {
          Object.assign(this.uiController.charAttributes, state.characters.attributes);
        }
        this.uiController.renderActiveCharacterSheet();
        this.uiController.renderCharactersList();
      }

      // 3. Restaura Diário e Logs com sanitização
      if (state.journal && typeof state.journal === 'object') {
        if (typeof state.journal.notes === 'string') {
          const safeNotes = this.sanitizeString(state.journal.notes);
          localStorage.setItem('evren_investigator_notes', safeNotes);
          const ta = document.getElementById('journal-textarea');
          if (ta) ta.value = safeNotes;
        }
        if (Array.isArray(state.journal.logs)) {
          const safeLogs = state.journal.logs.slice(0, 1000).map((l) => ({
            time: this.sanitizeString(l.time || ''),
            text: this.sanitizeString(l.text || '')
          }));
          localStorage.setItem('evren_session_logs', JSON.stringify(safeLogs));
          if (window.sessionJournal) {
            window.sessionJournal.logs = safeLogs;
            window.sessionJournal.renderLogsStream();
          }
        }
      }

      // 4. Restaura Névoa de Guerra
      if (Array.isArray(state.fogOfWar?.revealed) && window.fogOfWar) {
        window.fogOfWar.revealedCells = new Set(state.fogOfWar.revealed.slice(0, 2000));
        window.fogOfWar.redrawFog();
      }

      // 5. Restaura Tokens
      if (state.tokens && typeof state.tokens === 'object' && window.battlemapTokens) {
        window.battlemapTokens.importState(state.tokens);
      }

      this.updateStatsDisplay();
      if (window.soundFX) window.soundFX.playCritSpark();
      alert('✓ Estado do Universo Evren restaurado com sucesso!');
      this.closeModal();
    } catch (err) {
      console.error('Erro ao aplicar estado importado:', err);
      alert('Erro ao aplicar estado importado: ' + err.message);
    }
  }

  resetToFactoryDefaults() {
    const confirmReset = confirm('⚠️ ATENÇÃO: Deseja restaurar a mesa para a configuração original de fábrica? Todas as fichas customizadas e registros locais serão excluídos.');
    if (!confirmReset) return;

    localStorage.removeItem('evren_custom_characters_v1');
    localStorage.removeItem('evren_investigator_notes');
    localStorage.removeItem('evren_session_logs');
    localStorage.removeItem('evren_fog_of_war');
    localStorage.removeItem('evren_battlemap_tokens');

    alert('✓ Dados resetados com sucesso. Recarregando a mesa...');
    window.location.reload();
  }

  setupPwaInstallPrompt() {
    let deferredPrompt = null;
    const btnInstall = document.getElementById('btn-pwa-install');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (btnInstall) {
        btnInstall.classList.remove('hidden');
        btnInstall.style.display = 'inline-flex';
      }
    });

    if (btnInstall) {
      btnInstall.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`PWA install choice: ${outcome}`);
          deferredPrompt = null;
          btnInstall.style.display = 'none';
        } else {
          alert('Para instalar o Evren RPG:\n\n• No Chrome/Edge: Clique no ícone de computador/instalar na barra de endereços (ou menu ⋮ ➔ "Instalar aplicativo").\n• No iOS (Safari): Toque em Compartilhar ➔ "Adicionar à Tela de Início".\n• No Android: Toque em ⋮ ➔ "Adicionar à tela inicial".');
        }
      });
    }

    window.addEventListener('appinstalled', () => {
      console.log('✓ Evren RPG instalado com sucesso como PWA.');
      if (btnInstall) btnInstall.style.display = 'none';
    });
  }
}

window.BackupManager = BackupManager;
