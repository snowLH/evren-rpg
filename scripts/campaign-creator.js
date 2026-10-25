/**
 * CRIADOR DE CAMPANHAS & ZONAS TÁTICAS
 * Universo: Evren — Mesa Interativa
 * Permite que Mestres e Jogadores expandam o mundo adicionando novas campanhas,
 * setores geográficos e locais de anomalia persistidos em localStorage.
 */

class CampaignCreator {
  constructor(dataLoader, mapEngine, uiController) {
    this.dataLoader = dataLoader;
    this.mapEngine = mapEngine;
    this.uiController = uiController;
    this.modalEl = null;
    this.storageKey = 'evren_custom_campaigns_v1';
  }

  init() {
    this.modalEl = document.getElementById('modal-campaign-creator');

    // Botão de abertura no HUD ou gaveta
    const btnOpen = document.getElementById('btn-open-campaign-creator');
    if (btnOpen) {
      btnOpen.addEventListener('click', () => this.openModal());
    }

    const form = document.getElementById('form-create-campaign');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitForm();
      });
    }

    // Carrega campanhas previamente customizadas do localStorage
    this.loadCustomCampaigns();

    console.log('✓ CampaignCreator inicializado com sucesso.');
  }

  openModal() {
    if (!this.modalEl) return;
    this.modalEl.classList.add('open');
    if (window.soundFX) window.soundFX.playTacticalBeep();
  }

  closeModal() {
    if (!this.modalEl) return;
    this.modalEl.classList.remove('open');
  }

  submitForm() {
    const title = document.getElementById('camp-title')?.value.trim() || 'Nova Campanha';
    const theme = document.getElementById('camp-theme')?.value.trim() || 'Sobrevivência Anômala';
    const country = document.getElementById('camp-country')?.value.trim() || 'Setor Neutro';
    const status = document.getElementById('camp-status')?.value || 'Em andamento';
    const lat = parseFloat(document.getElementById('camp-lat')?.value) || 0.0;
    const lng = parseFloat(document.getElementById('camp-lng')?.value) || 0.0;
    const desc = document.getElementById('camp-desc')?.value.trim() || 'Dossiê confidencial da nova anomalia.';

    const campId = `camp_${Date.now()}`;
    const newCamp = {
      id: campId,
      title: title,
      theme: theme,
      status: status,
      country_location: country,
      coordinates: [lat, lng],
      briefing: desc,
      isCustom: true
    };

    // Cria também o local principal da campanha
    const locId = `loc_${Date.now()}`;
    const newLoc = {
      id: locId,
      name: `${title.split(':')[0]} — Marco Zero`,
      zone: `${country} (Evren)`,
      campaign_id: campId,
      coordinates: [lat, lng],
      type: "Zona de Incursão",
      description: desc
    };

    // 1. Registra no DataLoader
    if (this.dataLoader.data) {
      this.dataLoader.data.campaigns.push(newCamp);
      this.dataLoader.data.locations.push(newLoc);
    }

    // 2. Persiste no localStorage
    this.saveCustomCampaign(newCamp, newLoc);

    // 3. Atualiza filtros da UI
    if (this.uiController) {
      this.uiController.populateCampaignFilter();
    }

    // 4. Cria marcador no Mapa Múndi
    if (this.mapEngine) {
      this.mapEngine.renderGlobalCampaignMarkers();
      this.mapEngine.map.flyTo([lat, lng], 5);
    }

    if (window.sessionJournal) {
      window.sessionJournal.logEvent(`🌐 Nova Campanha Registrada: "${title}" [${country} // ${lat.toFixed(2)}, ${lng.toFixed(2)}]`);
    }

    if (window.soundFX) window.soundFX.playCritSpark();

    this.closeModal();
    alert(`✓ Campanha "${title}" ativada no Planisfério de Evren!`);
  }

  saveCustomCampaign(camp, loc) {
    try {
      const raw = localStorage.getItem(this.storageKey);
      const list = raw ? JSON.parse(raw) : [];
      list.push({ camp, loc });
      localStorage.setItem(this.storageKey, JSON.stringify(list));
    } catch (e) {
      console.warn('Erro ao salvar campanha customizada:', e);
    }
  }

  loadCustomCampaigns() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const list = JSON.parse(raw);

      list.forEach(item => {
        if (!this.dataLoader.data.campaigns.some(c => c.id === item.camp.id)) {
          this.dataLoader.data.campaigns.push(item.camp);
          this.dataLoader.data.locations.push(item.loc);
          if (this.mapEngine) {
            this.mapEngine.renderGlobalCampaignMarkers();
          }
        }
      });
      if (list.length > 0) {
        this.uiController?.populateCampaignFilter();
        console.log(`✓ ${list.length} campanhas customizadas restauradas do localStorage.`);
      }
    } catch (e) {
      console.warn('Erro ao carregar campanhas customizadas:', e);
    }
  }
}

window.CampaignCreator = CampaignCreator;
