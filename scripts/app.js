/**
 * APP ENTRYPOINT MODULE
 * Universo: Evren - Mesa Interativa
 * Conecta DataLoader, MapEngine e UIController com atalhos de teclado e listeners globais.
 */

class InteractiveTabletopApp {
  constructor() {
    this.dataLoader = new DataLoader();
    this.uiController = new UIController(this.dataLoader);
    this.mapEngine = null;
  }

  async start() {
    try {
      console.log('Iniciando Mesa Interativa do Universo Evren...');
      
      // 1. Carrega dados estruturados
      await this.dataLoader.loadData();
      window.dataLoader = this.dataLoader;

      // 1.1 Inicializa Gerenciador de Armazenamento e Persistência do Museu (IndexedDB)
      if (window.MuseumStorageManager) {
        this.storageManager = new MuseumStorageManager(this.dataLoader);
        await this.storageManager.init();
        window.storageManager = this.storageManager;
      }

      // 1.2 Inicializa Motor Geográfico 3D do Planeta Evren (Three.js)
      if (window.Planet3DEngine) {
        this.planetEngine = new Planet3DEngine('planet-3d-container', this.dataLoader, (kind, data, context) => {
          if (this.museumController) {
            this.museumController.handlePlanetSelection(kind, data, context);
          }
        });
        this.planetEngine.init();
        window.planetEngine = this.planetEngine;
      }

      // 1.3 Inicializa Controlador do Museu Histórico (Exposições, Linha do Tempo, Arquivo, Admin)
      if (window.MuseumController) {
        this.museumController = new MuseumController(this.dataLoader, this.storageManager, this.planetEngine);
        this.museumController.init();
        window.museumController = this.museumController;
        if (this.planetEngine) {
          this.planetEngine.onSelectionCallback = (kind, data, context) => {
            this.museumController.handlePlanetSelection(kind, data, context);
          };
        }
      }

      // 2. Inicializa UI
      this.uiController.init();

      // 3. Inicializa Motor do Mapa Leaflet
      this.mapEngine = new MapEngine('map', this.dataLoader, this.uiController);
      this.mapEngine.init();

      // 4. Inicializa Widget de Radar Ocultista AEGIS
      if (window.OccultRadarWidget) {
        window.occultRadar = new OccultRadarWidget('occult-radar-container', this.mapEngine, this.uiController);
      }

      // 5. Inicializa Arena de Conflito Direto
      if (window.CombatArena) {
        this.combatArena = new CombatArena(this.dataLoader, this.uiController);
        this.combatArena.init();
        window.combatArena = this.combatArena;
      }

      // 6. Inicializa Diário de Bordo do Investigador
      if (window.SessionJournal) {
        this.sessionJournal = new SessionJournal();
        this.sessionJournal.init();
        window.sessionJournal = this.sessionJournal;
      }

      // 7. Inicializa Rastreador de Iniciativa e Turnos
      if (window.InitiativeTracker) {
        this.initiativeTracker = new InitiativeTracker(this.mapEngine, this.dataLoader, this.uiController);
        this.initiativeTracker.init();
        window.initiativeTracker = this.initiativeTracker;
      }

      // 8. Inicializa Oráculo de Anomalias Paranormais
      if (window.ParanormalOracle) {
        this.paranormalOracle = new ParanormalOracle(this.dataLoader, this.uiController);
        this.paranormalOracle.init();
        window.paranormalOracle = this.paranormalOracle;
      }

      // 9. Inicializa Névoa de Guerra Tática (Fog of War)
      if (window.FogOfWar) {
        this.fogOfWar = new FogOfWar(this.mapEngine);
        this.fogOfWar.init();
        window.fogOfWar = this.fogOfWar;
      }

      // 10. Inicializa Matriz Biológica de Mutações (MDA Evolution Matrix)
      if (window.MDATreeController) {
        this.mdaTree = new MDATreeController(this.dataLoader, this.uiController);
        this.mdaTree.init();
        window.mdaTree = this.mdaTree;
      }

      // 11. Inicializa Criador & Editor de Agentes Biopunk
      if (window.CharacterCreator) {
        this.characterCreator = new CharacterCreator(this.dataLoader, this.uiController);
        this.characterCreator.init();
        window.characterCreator = this.characterCreator;
      }

      // 12. Inicializa Soundboard Ocultista & Jukebox
      if (window.SoundboardController) {
        this.soundboard = new SoundboardController(this.uiController);
        this.soundboard.init();
        window.soundboard = this.soundboard;
      }

      // 13. Inicializa Gerenciador de Backup e PWA
      if (window.BackupManager) {
        this.backupManager = new BackupManager(this.dataLoader, this.uiController);
        this.backupManager.init();
        window.backupManager = this.backupManager;
      }

      // 14. Inicializa Criador de Campanhas e Zonas
      if (window.CampaignCreator) {
        this.campaignCreator = new CampaignCreator(this.dataLoader, this.mapEngine, this.uiController);
        this.campaignCreator.init();
        window.campaignCreator = this.campaignCreator;
      }

      // 15. Desbloqueio de Áudio Web para navegadores móveis (iOS Safari / Android)
      const unlockAudio = () => {
        if (window.soundFX?.ctx && window.soundFX.ctx.state === 'suspended') {
          window.soundFX.ctx.resume().then(() => {
            console.log('✓ Web Audio Context ativado com sucesso.');
          });
        }
      };
      window.addEventListener('pointerdown', unlockAudio, { once: true });
      window.addEventListener('touchstart', unlockAudio, { once: true });
      window.addEventListener('keydown', unlockAudio, { once: true });

      // 16. Registra Service Worker para PWA e suporte offline em produção
      if ('serviceWorker' in navigator && (window.location.protocol.startsWith('http') || window.location.protocol.startsWith('https'))) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('./sw.js')
            .then((reg) => console.log('✓ [PWA] Service Worker registrado com escopo:', reg.scope))
            .catch((err) => console.warn('! [PWA] Falha ao registrar Service Worker:', err));
        });
      }

      // 17. Configura Atalhos de Teclado
      this.setupKeyboardShortcuts();

      // 7. Remove estado de loading
      const loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        loadingOverlay.style.pointerEvents = 'none';
        setTimeout(() => {
          loadingOverlay.remove();
        }, 300);
      }

      console.log('✓ Mesa Interativa pronta para operações táticas.');
    } catch (err) {
      console.error('Erro fatal ao inicializar aplicação:', err);
    }
  }

  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Ignora se estiver digitando em inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        if (e.key === 'Escape') {
          e.target.blur();
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          if (this.mapEngine) {
            this.mapEngine.dismissPlanetaryArrivalCard();
          }
          const openMuseumModals = document.querySelectorAll('.museum-exhibition-modal.is-open, .museum-biography-modal.is-open, .museum-archive-modal.is-open, .museum-admin-modal.is-open');
          if (openMuseumModals.length > 0) {
            openMuseumModals.forEach(m => m.classList.remove('is-open'));
            break;
          }
          const activeModals = document.querySelectorAll('.modal-backdrop.open, .modal-backdrop.active');
          if (activeModals.length > 0) {
            activeModals.forEach(m => m.classList.remove('open', 'active'));
          } else if (document.getElementById('side-drawer')?.classList.contains('open')) {
            this.uiController.closeDrawer();
          } else if (document.getElementById('search-results-dropdown')?.classList.contains('open')) {
            this.uiController.closeSearchDropdown();
          } else if (this.mapEngine?.currentScale === 'local') {
            this.mapEngine.retornarAoMapaMundi();
          }
          break;

        case '?':
        case 'h':
        case 'H':
          this.uiController.openModal('modal-shortcuts');
          break;

        case 'Backspace':
          if (this.mapEngine?.currentScale === 'local') {
            e.preventDefault();
            this.mapEngine.retornarAoMapaMundi();
          }
          break;

        case ' ':
          if (window.initiativeTracker?.isActive) {
            e.preventDefault();
            window.initiativeTracker.nextTurn();
          }
          break;

        case '/':
          e.preventDefault();
          const searchInput = document.getElementById('search-input');
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
          break;

        case 'm':
        case 'M':
          this.mapEngine?.resetView();
          break;

        case 'r':
        case 'R':
          this.uiController.openModal('modal-rules');
          break;

        case 'c':
        case 'C':
          this.uiController.renderCodexGrid();
          this.uiController.openModal('modal-codex');
          break;

        case 'd':
        case 'D':
          const drawer = document.getElementById('side-drawer');
          if (drawer?.classList.contains('open')) {
            this.uiController.closeDrawer();
          } else {
            this.uiController.openDrawer('characters');
          }
          break;

        case 'k':
        case 'K':
          this.uiController.openModal('modal-cassette-player');
          break;

        case 'g':
        case 'G':
          this.uiController.setupLoreGraph();
          this.uiController.openModal('modal-lore-graph');
          break;

        case 'p':
        case 'P':
          this.uiController.openModal('modal-memorial');
          break;

        case 'n':
        case 'N':
          this.uiController.openModal('modal-session-creator');
          break;

        case 'b':
        case 'B':
          this.uiController.openDrawer('bestiary');
          break;

        case 't':
        case 'T':
          this.uiController.renderTimeline();
          this.uiController.openModal('modal-timeline');
          break;

        case 'x':
        case 'X':
          this.uiController.renderUniversalDiceTray();
          this.uiController.openModal('modal-universal-dice');
          break;

        case 's':
        case 'S':
          this.uiController.renderSoundMixer();
          this.uiController.openModal('modal-sound-mixer');
          break;

        case 'i':
        case 'I':
          if (window.initiativeTracker) window.initiativeTracker.toggleCombat();
          break;

        case 'o':
        case 'O':
          if (window.paranormalOracle) window.paranormalOracle.openModal();
          break;

        case 'j':
        case 'J':
          if (window.sessionJournal) window.sessionJournal.openModal();
          break;

        case 'f':
        case 'F':
          if (window.fogOfWar) window.fogOfWar.toggle();
          break;

        case 'a':
        case 'A':
          const ambientBtn = document.getElementById('btn-toggle-ambient');
          if (ambientBtn) ambientBtn.click();
          break;

        case 'u':
        case 'U':
          if (window.mdaTree) window.mdaTree.openModal();
          break;

        case '+':
        case '=':
          if (window.characterCreator) window.characterCreator.openModal();
          break;
      }
    });
  }

  /* Atalhos expostos para o escopo global */
  mergulhoNasNuvens(rpgId) {
    return this.mapEngine?.mergulhoNasNuvens(rpgId);
  }

  retornarAoMapaMundi() {
    return this.mapEngine?.retornarAoMapaMundi();
  }

  /* Atalhos expostos para o escopo global */
  openLocationDossier(locationId) {
    this.uiController.openLocationDossier(locationId);
  }

  locateOnMap(locationId) {
    this.mapEngine?.flyToLocation(locationId);
  }

  selectSearchResult(type, id) {
    this.uiController.selectSearchResult(type, id);
  }

  activateRelic(relicName) {
    this.uiController.activateRelic(relicName);
  }

  adjustPD(charId, delta) {
    this.uiController.adjustPD(charId, delta);
  }

  adjustMDA(charId, delta) {
    this.uiController.adjustMDA(charId, delta);
  }

  testPDOverload(charId) {
    this.uiController.testPDOverload(charId);
  }

  rollAttribute(charName, attrName, val) {
    this.uiController.rollAttribute(charName, attrName, val);
  }

  triggerSacrificeArmor(charName) {
    this.uiController.triggerSacrificeArmor(charName);
  }

  triggerLethalTiebreak(charName) {
    this.uiController.triggerLethalTiebreak(charName);
  }
}

// Inicializa no carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
  window.app = new InteractiveTabletopApp();
  window.app.start();
});
