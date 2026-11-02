/**
 * MUSEUM CONTROLLER — GERENCIADOR DA EXPERIÊNCIA DO MUSEU HISTÓRICO INTERATIVO 3D
 * Universo: Evren
 *
 * Responsabilidades:
 * 1. Coordena a navegação hierárquica:
 *    PLANETA -> CONTINENTE -> PAÍS -> REGIÃO -> CIDADE/LOCAL -> CAMPANHA -> HISTÓRIA
 * 2. Atualiza os componentes HUD (Breadcrumbs, Seletor de Escalas, Gaveta de Contexto).
 * 3. Renderiza e gerencia a Exposição Histórica Completa da Campanha (6 abas).
 * 4. Renderiza e gerencia a Biografia & Trajetória Multi-Campanha de Personagens.
 * 5. Renderiza e gerencia o Dossiê Histórico de Locais.
 * 6. Opera o Arquivo Histórico Global com buscas relacionais cruzadas e consultas rápidas.
 * 7. Opera a Suíte de Administração e Curadoria do Museu com persistência no IndexedDB.
 */

class MuseumController {
  constructor(dataLoader, storageManager, planetEngine) {
    this.dataLoader = dataLoader;
    this.storageManager = storageManager;
    this.planetEngine = planetEngine;

    this.activeExhibitionCampaignId = null;
    this.activeExhibitionTab = 'identificacao';

    this.activeArchiveTab = 'all';
    this.activeArchiveFilters = {
      query: '',
      entityType: 'all',
      continentId: 'all',
      countryId: 'all',
      regionId: 'all',
      cityId: 'all',
      year: 'all',
      characterStatus: 'all',
      campaignStatus: 'all',
      characterId: 'all',
      locationId: 'all',
      campaignId: 'all'
    };
  }

  /**
   * Inicializa o controlador do museu e vincula os eventos da interface
   */
  init() {
    this.bindHeaderNavEvents();
    this.bindBreadcrumbEvents();
    this.bindScaleSelectorEvents();
    this.bindModalCloseEvents();
    this.bindArchiveFilterEvents();
    this.bindAdminEvents();
    this.updateBreadcrumbs({ planet: this.dataLoader.getPlanet() });

    console.log('✓ MuseumController inicializado com sucesso.');
  }

  /* ==========================================================================
     NAVEGAÇÃO DO CABEÇALHO & ATALHOS
     ========================================================================== */
  bindHeaderNavEvents() {
    const btnPlanet = document.getElementById('btn-nav-planet');
    if (btnPlanet) {
      btnPlanet.addEventListener('click', () => {
        this.switchTo3DView();
        if (this.planetEngine) this.planetEngine.setScaleView('global');
      });
    }

    const btnArchive = document.getElementById('btn-nav-archive');
    if (btnArchive) {
      btnArchive.addEventListener('click', () => {
        this.openGlobalArchiveModal();
      });
    }

    const btnExhibitions = document.getElementById('btn-nav-exhibitions');
    if (btnExhibitions) {
      btnExhibitions.addEventListener('click', () => {
        this.openExhibitionsListModal();
      });
    }

    const btnCharacters = document.getElementById('btn-nav-characters');
    if (btnCharacters) {
      btnCharacters.addEventListener('click', () => {
        this.openCharactersGalleryModal();
      });
    }

    const btnAdmin = document.getElementById('btn-nav-admin');
    if (btnAdmin) {
      btnAdmin.addEventListener('click', () => {
        this.openAdminModal();
      });
    }

    const btnToggle2D = document.getElementById('btn-museum-toggle-2d');
    if (btnToggle2D) {
      btnToggle2D.addEventListener('click', () => {
        this.toggle2D3DView();
      });
    }
  }

  /**
   * Alterna suavemente entre o Globo 3D e o Mapa Topográfico Local 2D (Leaflet)
   */
  toggle2D3DView() {
    const planetEl = document.getElementById('planet-3d-container');
    const mapEl = document.getElementById('map');
    const btnToggle = document.getElementById('btn-museum-toggle-2d');

    const isPlanetVisible = !planetEl.classList.contains('is-hidden');
    if (isPlanetVisible) {
      planetEl.classList.add('is-hidden');
      planetEl.style.display = 'none';
      mapEl.style.display = 'block';
      if (btnToggle) btnToggle.innerHTML = '🪐 Retornar ao Planeta 3D';
      if (window.app?.mapEngine?.map) {
        window.app.mapEngine.map.invalidateSize();
      }
    } else {
      planetEl.classList.remove('is-hidden');
      planetEl.style.display = 'block';
      mapEl.style.display = 'none';
      if (btnToggle) btnToggle.innerHTML = '🗺️ Mapa Topográfico Local';
      if (this.planetEngine) {
        this.planetEngine.onWindowResize();
      }
    }
  }

  switchTo3DView() {
    const planetEl = document.getElementById('planet-3d-container');
    const mapEl = document.getElementById('map');
    const btnToggle = document.getElementById('btn-museum-toggle-2d');

    planetEl.classList.remove('is-hidden');
    planetEl.style.display = 'block';
    mapEl.style.display = 'none';
    if (btnToggle) btnToggle.innerHTML = '🗺️ Mapa Topográfico Local';
    if (this.planetEngine) {
      this.planetEngine.onWindowResize();
    }
  }

  /* ==========================================================================
     HIERARQUIA GEOGRÁFICA (BREADCRUMBS) & ESCALAS HUD
     ========================================================================== */
  bindBreadcrumbEvents() {
    const breadcrumbEl = document.getElementById('museum-breadcrumb-bar');
    if (!breadcrumbEl) return;

    breadcrumbEl.addEventListener('click', (e) => {
      const item = e.target.closest('.museum-breadcrumb__item');
      if (!item) return;

      const level = item.dataset.level;
      const targetId = item.dataset.targetId;

      if (level === 'planet') {
        if (this.planetEngine) this.planetEngine.setScaleView('global');
        this.updateBreadcrumbs({ planet: this.dataLoader.getPlanet() });
      } else if (level === 'continent') {
        const cont = this.dataLoader.getContinentById(targetId);
        if (cont && this.planetEngine) {
          this.planetEngine.handleMarkerClick({ kind: 'continent', data: cont, trueLat: cont.coordinates[0], trueLng: cont.coordinates[1] });
        }
      } else if (level === 'country') {
        const c = this.dataLoader.getCountryById(targetId);
        if (c && this.planetEngine) {
          this.planetEngine.handleMarkerClick({ kind: 'country', data: c, trueLat: c.coordinates[0], trueLng: c.coordinates[1] });
        }
      } else if (level === 'region') {
        const r = this.dataLoader.getRegionById(targetId);
        if (r && this.planetEngine) {
          this.planetEngine.handleMarkerClick({ kind: 'region', data: r, trueLat: r.coordinates[0], trueLng: r.coordinates[1] });
        }
      } else if (level === 'city') {
        const ct = this.dataLoader.getCityById(targetId);
        if (ct && this.planetEngine) {
          this.planetEngine.handleMarkerClick({ kind: 'city', data: ct, trueLat: ct.coordinates[0], trueLng: ct.coordinates[1] });
        }
      } else if (level === 'location') {
        const loc = this.dataLoader.getLocationById(targetId);
        if (loc) this.openLocationDossier(targetId);
      } else if (level === 'campaign') {
        this.openExhibitionModal(targetId);
      }
    });
  }

  bindScaleSelectorEvents() {
    const scaleBtns = document.querySelectorAll('.museum-scale-btn');
    scaleBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const scale = btn.dataset.scale;
        scaleBtns.forEach((b) => b.classList.remove('museum-scale-btn--active'));
        btn.classList.add('museum-scale-btn--active');
        if (this.planetEngine) this.planetEngine.setScaleView(scale);
      });
    });
  }

  updateBreadcrumbs(context = {}) {
    const bar = document.getElementById('museum-breadcrumb-bar');
    if (!bar) return;

    const parts = [
      `<button class="museum-breadcrumb__item ${!context.continent ? 'museum-breadcrumb__item--active' : ''}" data-level="planet">PLANETA EVREN</button>`
    ];

    if (context.continent) {
      parts.push(`<span class="museum-breadcrumb__sep">›</span>`);
      parts.push(`<button class="museum-breadcrumb__item ${!context.country ? 'museum-breadcrumb__item--active' : ''}" data-level="continent" data-target-id="${context.continent.id}">${context.continent.name}</button>`);
    }

    if (context.country) {
      parts.push(`<span class="museum-breadcrumb__sep">›</span>`);
      parts.push(`<button class="museum-breadcrumb__item ${!context.region ? 'museum-breadcrumb__item--active' : ''}" data-level="country" data-target-id="${context.country.id}">${context.country.name}</button>`);
    }

    if (context.region) {
      parts.push(`<span class="museum-breadcrumb__sep">›</span>`);
      parts.push(`<button class="museum-breadcrumb__item ${!context.city ? 'museum-breadcrumb__item--active' : ''}" data-level="region" data-target-id="${context.region.id}">${context.region.name}</button>`);
    }

    if (context.city) {
      parts.push(`<span class="museum-breadcrumb__sep">›</span>`);
      parts.push(`<button class="museum-breadcrumb__item ${!context.location && !context.campaign ? 'museum-breadcrumb__item--active' : ''}" data-level="city" data-target-id="${context.city.id}">${context.city.name}</button>`);
    }

    if (context.location) {
      parts.push(`<span class="museum-breadcrumb__sep">›</span>`);
      parts.push(`<button class="museum-breadcrumb__item ${!context.campaign ? 'museum-breadcrumb__item--active' : ''}" data-level="location" data-target-id="${context.location.id}">${context.location.name}</button>`);
    }

    if (context.campaign) {
      parts.push(`<span class="museum-breadcrumb__sep">›</span>`);
      parts.push(`<button class="museum-breadcrumb__item museum-breadcrumb__item--active" data-level="campaign" data-target-id="${context.campaign.id}">EXPOSIÇÃO: ${context.campaign.title || context.campaign.name}</button>`);
    }

    bar.innerHTML = parts.join('');
  }

  /**
   * Callback invocado pelo Planet3DEngine ao clicar em elementos ou transicionar de escala
   */
  handlePlanetSelection(kind, data, context) {
    this.updateBreadcrumbs(context);

    // Atualiza botão de escala ativo no HUD
    if (kind === 'scale_change') {
      const activeBtn = document.querySelector(`.museum-scale-btn[data-scale="${data.scale}"]`);
      if (activeBtn) {
        document.querySelectorAll('.museum-scale-btn').forEach((b) => b.classList.remove('museum-scale-btn--active'));
        activeBtn.classList.add('museum-scale-btn--active');
      }
      return;
    }

    // Exibe ou atualiza gaveta de contexto da região/feição
    const panel = document.getElementById('museum-context-panel');
    if (panel) {
      if (kind === 'continent' || kind === 'country' || kind === 'region' || kind === 'city' || kind.startsWith('feature_')) {
        panel.classList.remove('is-hidden');
        document.getElementById('context-panel-tag').textContent = this.formatKindTag(kind);
        document.getElementById('context-panel-title').textContent = data.name;
        document.getElementById('context-panel-desc').textContent = data.description || data.historical_summary || data.summary || data.note || '';

        const actionBtn = document.getElementById('context-panel-btn');
        const campCount = (data.campaigns || data.campaign_ids || []).length;
        if (actionBtn) {
          actionBtn.style.display = campCount > 0 ? 'block' : 'none';
          actionBtn.textContent = `Explorar Campanhas (${campCount})`;
          actionBtn.onclick = () => {
            this.openGlobalArchiveModal({ countryId: data.country_id || data.id, continentId: data.continent_id || data.id });
          };
        }
      } else if (kind === 'location') {
        this.openLocationDossier(data.id);
      } else if (kind === 'campaign') {
        this.openExhibitionModal(data.id);
      }
    }
  }

  formatKindTag(kind) {
    const map = {
      continent: 'Continente',
      country: 'Território Nacional',
      region: 'Região Geográfica',
      city: 'Assentamento Urbano',
      feature_mountain: 'Cadeia de Montanhas',
      feature_forest: 'Bioma Florestal',
      feature_river: 'Bacia Hidrográfica',
      feature_desert: 'Região Desértica',
      feature_unknown: 'Área Não Documentada (Terra Incognita)',
      ocean: 'Oceano Planetário'
    };
    return map[kind] || 'Feição Geográfica';
  }

  /* ==========================================================================
     MODAL DE EXPOSIÇÃO HISTÓRICA DA CAMPANHA (SEÇÃO 4)
     ========================================================================== */
  openExhibitionModal(campaignId) {
    const camp = this.dataLoader.getCampaignById(campaignId);
    if (!camp) return;

    this.activeExhibitionCampaignId = campaignId;
    const hierarchy = this.dataLoader.getGeographicHierarchyForCampaign(campaignId);
    this.updateBreadcrumbs({ ...hierarchy, campaign: camp });

    const modal = document.getElementById('museum-exhibition-modal');
    if (!modal) return;

    document.getElementById('exhibition-modal-badge').textContent = `EXPOSIÇÃO HISTÓRICA // ${camp.category === 'completed' ? 'CONCLUÍDA' : 'EM ANDAMENTO'}`;
    document.getElementById('exhibition-modal-title').textContent = camp.title || camp.name;

    this.renderExhibitionTabIdentificacao(camp, hierarchy);
    this.renderExhibitionTabNarrativa(camp);
    this.renderExhibitionTabLinhaDoTempo(camp);
    this.renderExhibitionTabPersonagens(camp);
    this.renderExhibitionTabLocais(camp);
    this.renderExhibitionTabAcervo(camp);

    this.switchExhibitionTab('identificacao');
    modal.classList.add('is-open');
  }

  closeExhibitionModal() {
    const modal = document.getElementById('museum-exhibition-modal');
    if (modal) modal.classList.remove('is-open');
  }

  switchExhibitionTab(tabName) {
    this.activeExhibitionTab = tabName;
    const btns = document.querySelectorAll('#museum-exhibition-modal .museum-tab-btn');
    btns.forEach((b) => b.classList.toggle('museum-tab-btn--active', b.dataset.tab === tabName));

    const sections = document.querySelectorAll('#museum-exhibition-modal .exhibition-section');
    sections.forEach((sec) => sec.classList.toggle('is-active', sec.id === `exhibition-sec-${tabName}`));
  }

  renderExhibitionTabIdentificacao(camp, hierarchy) {
    const hi = camp.historical_identification || {};
    const container = document.getElementById('exhibition-sec-identificacao');
    if (!container) return;

    const geoPlace = hi.geographic_location || camp.country_location || `${hierarchy?.country?.name || ''} (${hierarchy?.region?.name || ''})`;
    const statusText = hi.status || camp.status_museum || (camp.category === 'completed' ? 'Concluída' : 'Em andamento');

    const pendingHtml = (camp.pending_documentation && camp.pending_documentation.length > 0)
      ? `
        <div style="background: rgba(230, 126, 34, 0.12); border-left: 3px solid #e67e22; padding: 12px; margin-top: 14px; border-radius: 0 4px 4px 0;">
          <strong style="color: #f39c12; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">Aviso de Curadoria // Dados Pendentes:</strong>
          <ul style="margin: 6px 0 0 16px; font-size: 12px; color: var(--museum-text-muted);">
            ${camp.pending_documentation.map((p) => `<li>${p}</li>`).join('')}
          </ul>
        </div>
      `
      : '';

    container.innerHTML = `
      <div class="exhibition-id-grid">
        <div>
          <div class="exhibition-card">
            <h4 class="exhibition-card__label">Sinopse Histórica Oficial</h4>
            <p class="exhibition-card__text">${hi.synopsis || camp.synopsis || camp.description}</p>
          </div>
          <div class="exhibition-card">
            <h4 class="exhibition-card__label">Contexto Histórico & Geopolítico Anterior</h4>
            <p class="exhibition-card__text">${hi.historical_context || camp.historical_context || camp.exhibition_narrative?.prior_context || 'Registro em fase de documentação.'}</p>
          </div>
          ${pendingHtml}
        </div>
        <div>
          <div class="exhibition-card">
            <h4 class="exhibition-card__label">Ficha Cartográfica do Acervo</h4>
            <ul class="exhibition-stat-list">
              <li class="exhibition-stat-item"><strong>Período Histórico:</strong> <span>${hi.year || camp.year}</span></li>
              <li class="exhibition-stat-item"><strong>Status no Planeta:</strong> <span style="color: ${statusText.toLowerCase().includes('concl') ? '#2ecc71' : 'var(--museum-gold-bright)'}; font-weight: 600;">${statusText}</span></li>
              <li class="exhibition-stat-item"><strong>Gênero & Temática:</strong> <span>${hi.genre_theme || camp.theme}</span></li>
              <li class="exhibition-stat-item"><strong>Localização Planetária:</strong> <span>${geoPlace}</span></li>
              <li class="exhibition-stat-item"><strong>Continente:</strong> <span>${hierarchy?.continent?.name || 'Setor Oceânico'}</span></li>
              <li class="exhibition-stat-item"><strong>País / Território:</strong> <span>${hierarchy?.country?.name || 'Águas Internacionais'}</span></li>
              <li class="exhibition-stat-item"><strong>Região:</strong> <span>${hierarchy?.region?.name || 'Não classificada'}</span></li>
              <li class="exhibition-stat-item"><strong>Cidade / Distrito:</strong> <span>${hierarchy?.city?.name || 'Não classificado'}</span></li>
              <li class="exhibition-stat-item"><strong>Classificação de Ameaça:</strong> <span>${camp.danger_rating || 'Nível Padrão'}</span></li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  renderExhibitionTabNarrativa(camp) {
    const container = document.getElementById('exhibition-sec-narrativa');
    if (!container) return;

    const nar = camp.exhibition_narrative || {};
    const chapters = [
      { key: 'prior_context', num: 'Capítulo I', title: 'Contexto Anterior aos Acontecimentos' },
      { key: 'campaign_beginning', num: 'Capítulo II', title: 'Início da Campanha & Convocação' },
      { key: 'main_events', num: 'Capítulo III', title: 'Principais Acontecimentos Documentados' },
      { key: 'turning_points', num: 'Capítulo IV', title: 'Momentos Decisivos & Pontos de Virada' },
      { key: 'conflicts', num: 'Capítulo V', title: 'Conflitos & Rupturas' },
      { key: 'revelations', num: 'Capítulo VI', title: 'Revelações & Descobertas Históricas' },
      { key: 'consequences', num: 'Capítulo VII', title: 'Consequências Planetárias & Regionais' },
      { key: 'outcome', num: 'Capítulo VIII', title: 'Desfecho & Estado Atual da Região' }
    ];

    container.innerHTML = `
      <div class="exhibition-narrative-timeline">
        ${chapters.map((ch) => `
          <div class="narrative-chapter">
            <span class="narrative-chapter__num">${ch.num}</span>
            <h4 class="narrative-chapter__title">${ch.title}</h4>
            <p class="narrative-chapter__p">${nar[ch.key] || 'Conteúdo em catalogação pela curadoria.'}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderExhibitionTabLinhaDoTempo(camp) {
    const container = document.getElementById('exhibition-sec-linha-do-tempo');
    if (!container) return;

    const events = this.dataLoader.getHistoricalEvents(camp.id);
    if (!events.length) {
      container.innerHTML = `<p style="color: var(--museum-text-muted); font-style: italic;">Nenhum acontecimento específico catalogado para esta exposição.</p>`;
      return;
    }

    container.innerHTML = `
      <div class="exhibition-timeline-list">
        ${events.map((evt) => `
          <div class="timeline-event-card" data-event-id="${evt.id}">
            <div class="timeline-event-card__header">
              <span class="timeline-event-card__date">${evt.date}</span>
              ${evt.era_badge ? `<span style="font-size: 10px; color: var(--museum-text-muted);">${evt.era_badge}</span>` : ''}
            </div>
            <h4 class="timeline-event-card__title">${evt.title}</h4>
            <p class="timeline-event-card__desc">${evt.description}</p>
            ${evt.consequences ? `<div class="timeline-event-card__consequences"><strong>Consequências:</strong> ${evt.consequences}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  renderExhibitionTabPersonagens(camp) {
    const container = document.getElementById('exhibition-sec-personagens');
    if (!container) return;

    const chars = this.dataLoader.getCharacters(camp.id);
    if (!chars.length) {
      container.innerHTML = `<p style="color: var(--museum-text-muted); font-style: italic;">Nenhum personagem registrado diretamente nesta exposição.</p>`;
      return;
    }

    container.innerHTML = `
      <div class="exhibition-character-grid">
        ${chars.map((ch) => {
          const st = this.dataLoader.getCharacterHistoricalStatus(ch);
          const stClass = `character-status-pill--${st.replace(/\s+/g, '-')}`;
          return `
            <div class="character-history-card" data-character-id="${ch.id}">
              <img src="${ch.portrait || 'assets/icon-192.png'}" alt="${ch.name}" class="character-history-card__portrait" onerror="this.src='assets/icon-192.png'">
              <div class="character-history-card__info">
                <h4 class="character-history-card__name">${ch.name}</h4>
                <span class="character-history-card__title">${ch.historical_title || ch.codename || ch.class || 'Figura Histórica'}</span>
                <span class="character-status-pill ${stClass}">${st.toUpperCase()}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.querySelectorAll('.character-history-card').forEach((card) => {
      card.addEventListener('click', () => {
        this.openCharacterBiographyModal(card.dataset.characterId);
      });
    });
  }

  renderExhibitionTabLocais(camp) {
    const container = document.getElementById('exhibition-sec-locais');
    if (!container) return;

    const locs = this.dataLoader.getLocations(camp.id);
    if (!locs.length) {
      container.innerHTML = `<p style="color: var(--museum-text-muted); font-style: italic;">Nenhum local catalogado para esta exposição.</p>`;
      return;
    }

    container.innerHTML = `
      <div class="exhibition-location-grid">
        ${locs.map((loc) => `
          <div class="location-history-card" data-location-id="${loc.id}">
            <img src="${loc.illustration || 'assets/ref_interior_tavern.jpg'}" alt="${loc.name}" class="location-history-card__thumb" onerror="this.src='assets/ref_interior_tavern.jpg'">
            <div class="location-history-card__body">
              <h4 class="location-history-card__name">${loc.name}</h4>
              <span class="location-history-card__geo">${loc.zone || 'Localização Registrada'}</span>
              <p class="location-history-card__desc">${loc.description || loc.historical_importance || ''}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.location-history-card').forEach((card) => {
      card.addEventListener('click', () => {
        this.openLocationDossier(card.dataset.locationId);
      });
    });
  }

  renderExhibitionTabAcervo(camp) {
    const container = document.getElementById('exhibition-sec-acervo');
    if (!container) return;

    const chronicles = this.dataLoader.getChronicles(camp.id);
    const relics = this.dataLoader.getRelics().filter((r) => r.campaign_id === camp.id || (camp.participants || []).some((pId) => {
      const ch = this.dataLoader.getCharacterById(pId);
      return ch && ch.relics && ch.relics.includes(r.name);
    }));

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <div>
          <h4 class="exhibition-card__label">Relíquias & Objetos Históricos Vinculados</h4>
          ${relics.length ? relics.map((r) => `
            <div class="exhibition-card" style="margin-bottom: 12px;">
              <strong style="color: var(--museum-gold-bright); font-size: 13.5px;">${r.name}</strong>
              <div style="font-size: 11px; color: var(--museum-text-muted); margin: 3px 0 6px;">Portador: ${r.owner || 'Não documentado'} • Raridade: ${r.rarity || 'Desconhecida'}</div>
              <p style="font-size: 12px; color: var(--museum-text-muted);">${r.description || r.effect || ''}</p>
            </div>
          `).join('') : '<p style="color: var(--museum-text-muted); font-size: 12px;">Nenhuma relíquia associada catalogada.</p>'}
        </div>
        <div>
          <h4 class="exhibition-card__label">Gravações & Crônicas de Sessões Históricas</h4>
          ${chronicles.length ? chronicles.map((cr) => `
            <div class="exhibition-card" style="margin-bottom: 12px;">
              <strong style="color: var(--museum-text-main); font-size: 13.5px;">📻 ${cr.title}</strong>
              <div style="font-size: 11px; color: var(--museum-gold); margin: 3px 0 6px;">Sessão: ${cr.session || 'Arquivo Histórico'}</div>
              <p style="font-size: 12px; color: var(--museum-text-muted); line-height: 1.5;">${cr.lore || cr.summary || ''}</p>
            </div>
          `).join('') : '<p style="color: var(--museum-text-muted); font-size: 12px;">Nenhum registro de sessão catalogado.</p>'}
        </div>
      </div>
    `;
  }

  /* ==========================================================================
     MODAL DE BIOGRAFIA E TRAJETÓRIA HISTÓRICA DO PERSONAGEM (SEÇÃO 4.D & 8)
     ========================================================================== */
  openCharacterBiographyModal(characterId) {
    const trajectory = this.dataLoader.getCharacterFullTrajectory(characterId);
    if (!trajectory || !trajectory.character) return;

    const ch = trajectory.character;
    const modal = document.getElementById('museum-biography-modal');
    if (!modal) return;

    const st = this.dataLoader.getCharacterHistoricalStatus(ch);
    const stClass = `character-status-pill--${st.replace(/\s+/g, '-')}`;

    document.getElementById('bio-portrait').src = ch.portrait || 'assets/icon-192.png';
    document.getElementById('bio-name').textContent = ch.name;
    document.getElementById('bio-title').textContent = ch.historical_title || ch.codename || ch.class || 'Figura Histórica';
    document.getElementById('bio-status').textContent = st.toUpperCase();
    document.getElementById('bio-status').className = `character-status-pill ${stClass}`;

    const container = document.getElementById('bio-modal-body');
    if (container) {
      container.innerHTML = `
        <div class="biography-grid">
          <div>
            <h4 class="biography-section-title">História Pessoal & Origens</h4>
            <p class="biography-text">${ch.personal_history || ch.biography_summary || ch.summary || 'Registro biográfico em catalogação.'}</p>

            ${ch.known_fate ? `
              <h4 class="biography-section-title">Destino Conhecido</h4>
              <div class="biography-fate-box">
                ${ch.known_fate}
              </div>
            ` : ''}

            <h4 class="biography-section-title">Trajetória Através das Campanhas</h4>
            <div class="biography-trajectory-list">
              ${(ch.campaign_participations && ch.campaign_participations.length > 0)
                ? ch.campaign_participations.map((cp) => `
                  <div class="trajectory-item">
                    <strong>${cp.campaign_title || cp.campaign_id}</strong> (${cp.period || 'Período Registrado'})<br>
                    <span style="color: var(--museum-text-muted); font-size: 11.5px;">Papel: ${cp.role || 'Participante'} • ${cp.summary || ''}</span>
                  </div>
                `).join('')
                : trajectory.campaigns.map((c) => `
                  <div class="trajectory-item">
                    <strong>${c.title || c.name}</strong> (${c.year})<br>
                    <span style="color: var(--museum-text-muted); font-size: 11.5px;">Participação registrada na expedição.</span>
                  </div>
                `).join('')
              }
            </div>

            <details class="archival-sheet-details">
              <summary>Ficha Arquivística Original (C.R.I.S. / Tática)</summary>
              <div style="margin-top: 10px; font-size: 12px; color: var(--museum-text-muted);">
                Origem: ${ch.origin || 'Civil'} • Classe: ${ch.class || 'Especialista'} • NEX: ${ch.nex || '0%'} • MDA: ${ch.mda || '0%'}<br>
                Força: ${ch.attributes?.Força ?? 1} | Vigor: ${ch.attributes?.Vigor ?? 1} | Agilidade: ${ch.attributes?.Agilidade ?? 1} | Presença: ${ch.attributes?.Presença ?? 1} | Intelecto: ${ch.attributes?.Intelecto ?? 1}<br>
                Citação: "${ch.quote || ''}"
              </div>
            </details>
          </div>

          <div>
            <h4 class="biography-section-title">Relações Históricas</h4>
            <div class="biography-relations-list">
              ${(trajectory.relationships && trajectory.relationships.length > 0)
                ? trajectory.relationships.map((rel) => `
                  <div class="relation-item" data-target-char-id="${rel.character_id}">
                    <strong style="color: var(--museum-gold-bright);">${rel.character_name}</strong> (${rel.relation_type})<br>
                    <span style="color: var(--museum-text-muted); font-size: 11px;">${rel.description || ''}</span>
                  </div>
                `).join('')
                : '<p style="color: var(--museum-text-muted); font-size: 12px;">Nenhum vínculo histórico registrado.</p>'
              }
            </div>

            <h4 class="biography-section-title" style="margin-top: 20px;">Locais Históricos Visitados</h4>
            <div class="biography-relations-list">
              ${(trajectory.locations && trajectory.locations.length > 0)
                ? trajectory.locations.map((loc) => `
                  <div class="relation-item" data-target-loc-id="${loc.id}">
                    <strong style="color: #5fa8d3;">${loc.name}</strong><br>
                    <span style="color: var(--museum-text-muted); font-size: 11px;">${loc.zone || ''}</span>
                  </div>
                `).join('')
                : '<p style="color: var(--museum-text-muted); font-size: 12px;">Nenhum local específico catalogado.</p>'
              }
            </div>
          </div>
        </div>
      `;

      // Eventos de clique nas relações cruzadas
      container.querySelectorAll('.relation-item[data-target-char-id]').forEach((item) => {
        item.addEventListener('click', () => {
          this.openCharacterBiographyModal(item.dataset.targetCharId);
        });
      });

      // Eventos de clique nos locais visitados
      container.querySelectorAll('.relation-item[data-target-loc-id]').forEach((item) => {
        item.addEventListener('click', () => {
          this.openLocationDossier(item.dataset.targetLocId);
        });
      });
    }

    modal.classList.add('is-open');
  }

  closeCharacterBiographyModal() {
    const modal = document.getElementById('museum-biography-modal');
    if (modal) modal.classList.remove('is-open');
  }

  /* ==========================================================================
     MODAL DE DOSSIÊ HISTÓRICO DE LOCAL (SEÇÃO 4.E)
     ========================================================================== */
  openLocationDossier(locationId) {
    const hierarchy = this.dataLoader.getGeographicHierarchyForLocation(locationId);
    if (!hierarchy || !hierarchy.location) return;

    const loc = hierarchy.location;
    const modal = document.getElementById('museum-location-modal');
    if (!modal) return;

    document.getElementById('loc-modal-title').textContent = loc.name;
    document.getElementById('loc-modal-geo').textContent = `${hierarchy.planet?.name || 'Planeta Evren'} › ${hierarchy.continent?.name || ''} › ${hierarchy.country?.name || ''} › ${hierarchy.region?.name || ''} › ${hierarchy.city?.name || ''}`;
    document.getElementById('loc-modal-thumb').src = loc.illustration || 'assets/ref_interior_tavern.jpg';
    document.getElementById('loc-modal-desc').textContent = loc.description || '';
    document.getElementById('loc-modal-importance').textContent = loc.historical_importance || 'Marco geográfico histórico registrado no acervo.';

    const epochsEl = document.getElementById('loc-modal-epochs');
    if (epochsEl) {
      epochsEl.innerHTML = (loc.epochs_active || ['Época Moderna']).map((ep) => `<span class="filter-chip">${ep}</span>`).join(' ');
    }

    const campsEl = document.getElementById('loc-modal-campaigns');
    if (campsEl) {
      campsEl.innerHTML = (hierarchy.campaigns || []).map((c) => `
        <div class="trajectory-item" style="cursor: pointer;" data-campaign-id="${c.id}">
          <strong style="color: var(--museum-gold-bright);">${c.title || c.name}</strong> (${c.year})<br>
          <span style="font-size: 11px; color: var(--museum-text-muted);">${c.theme}</span>
        </div>
      `).join('') || '<p style="color: var(--museum-text-muted); font-size: 12px;">Nenhuma campanha vinculada.</p>';

      campsEl.querySelectorAll('[data-campaign-id]').forEach((item) => {
        item.addEventListener('click', () => {
          this.closeLocationDossier();
          this.openExhibitionModal(item.dataset.campaignId);
        });
      });
    }

    const btnInspectGlobe = document.getElementById('btn-loc-inspect-globe');
    if (btnInspectGlobe && loc.coordinates) {
      btnInspectGlobe.onclick = () => {
        this.closeLocationDossier();
        this.switchTo3DView();
        if (this.planetEngine) {
          this.planetEngine.flyToGeo(loc.coordinates[0], loc.coordinates[1], 120);
        }
      };
    }

    modal.classList.add('is-open');
  }

  closeLocationDossier() {
    const modal = document.getElementById('museum-location-modal');
    if (modal) modal.classList.remove('is-open');
  }

  /* ==========================================================================
     ARQUIVO HISTÓRICO GLOBAL (SEÇÃO 7)
     ========================================================================== */
  openGlobalArchiveModal(presetFilters = null) {
    const modal = document.getElementById('museum-archive-modal');
    if (!modal) return;

    if (presetFilters) {
      this.activeArchiveFilters = { ...this.activeArchiveFilters, ...presetFilters };
    }

    this.populateArchiveFilterDropdowns();
    this.runGlobalArchiveQuery();
    modal.classList.add('is-open');
  }

  closeGlobalArchiveModal() {
    const modal = document.getElementById('museum-archive-modal');
    if (modal) modal.classList.remove('is-open');
  }

  populateArchiveFilterDropdowns() {
    const contSelect = document.getElementById('archive-filter-continent');
    if (contSelect && contSelect.options.length <= 1) {
      this.dataLoader.getContinents().forEach((cont) => {
        const opt = document.createElement('option');
        opt.value = cont.id;
        opt.textContent = cont.name;
        contSelect.appendChild(opt);
      });
    }

    const countrySelect = document.getElementById('archive-filter-country');
    if (countrySelect && countrySelect.options.length <= 1) {
      this.dataLoader.getCountries().forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        countrySelect.appendChild(opt);
      });
    }
  }

  bindArchiveFilterEvents() {
    const searchInput = document.getElementById('archive-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.activeArchiveFilters.query = e.target.value;
        this.runGlobalArchiveQuery();
      });
    }

    const typeSelect = document.getElementById('archive-filter-type');
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        this.activeArchiveFilters.entityType = e.target.value;
        this.runGlobalArchiveQuery();
      });
    }

    const contSelect = document.getElementById('archive-filter-continent');
    if (contSelect) {
      contSelect.addEventListener('change', (e) => {
        this.activeArchiveFilters.continentId = e.target.value;
        this.runGlobalArchiveQuery();
      });
    }

    const countrySelect = document.getElementById('archive-filter-country');
    if (countrySelect) {
      countrySelect.addEventListener('change', (e) => {
        this.activeArchiveFilters.countryId = e.target.value;
        this.runGlobalArchiveQuery();
      });
    }

    const statusSelect = document.getElementById('archive-filter-status');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.activeArchiveFilters.characterStatus = e.target.value;
        this.runGlobalArchiveQuery();
      });
    }

    // Chips de consultas rápidas predefinidas
    const chips = document.querySelectorAll('.filter-chip[data-preset]');
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const preset = chip.dataset.preset;
        this.applyArchivePreset(preset);
      });
    });
  }

  applyArchivePreset(preset) {
    if (preset === 'missing') {
      this.activeArchiveFilters = { ...this.activeArchiveFilters, characterStatus: 'desaparecido', entityType: 'characters' };
    } else if (preset === 'brazil') {
      this.activeArchiveFilters = { ...this.activeArchiveFilters, countryId: 'country_brasil', entityType: 'all' };
    } else if (preset === 'mexico') {
      this.activeArchiveFilters = { ...this.activeArchiveFilters, countryId: 'country_mexico', entityType: 'all' };
    } else if (preset === '2024') {
      this.activeArchiveFilters = { ...this.activeArchiveFilters, year: '2024', entityType: 'all' };
    } else if (preset === 'gabriel') {
      this.activeArchiveFilters = { ...this.activeArchiveFilters, characterId: 'char_gabriel', entityType: 'all' };
    } else if (preset === 'vilar_city') {
      this.activeArchiveFilters = { ...this.activeArchiveFilters, cityId: 'city_san_lorenzo_vilar', entityType: 'all' };
    } else if (preset === 'reset') {
      this.activeArchiveFilters = {
        query: '',
        entityType: 'all',
        continentId: 'all',
        countryId: 'all',
        regionId: 'all',
        cityId: 'all',
        year: 'all',
        characterStatus: 'all',
        campaignStatus: 'all',
        characterId: 'all',
        locationId: 'all',
        campaignId: 'all'
      };
      const searchInp = document.getElementById('archive-search-input');
      if (searchInp) searchInp.value = '';
    }

    this.runGlobalArchiveQuery();
  }

  runGlobalArchiveQuery() {
    const results = this.dataLoader.queryHistoricalArchive(this.activeArchiveFilters);
    const container = document.getElementById('archive-results-container');
    const counterEl = document.getElementById('archive-results-counter');
    if (!container) return;

    const total = (results.campaigns?.length || 0) +
      (results.characters?.length || 0) +
      (results.locations?.length || 0) +
      (results.events?.length || 0) +
      (results.sessions?.length || 0) +
      (results.artifacts?.length || 0) +
      (results.organizations?.length || 0);

    if (counterEl) {
      counterEl.textContent = `${total} registro(s) histórico(s) conectado(s) encontrado(s)`;
    }

    let html = '';

    // 1. Campanhas Encontradas
    if (results.campaigns && results.campaigns.length > 0) {
      html += `
        <h4 class="exhibition-card__label" style="margin-top: 10px;">Exposições de Campanhas (${results.campaigns.length})</h4>
        <div class="exhibition-character-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); margin-bottom: 20px;">
          ${results.campaigns.map((c) => `
            <div class="exhibition-card" style="cursor: pointer;" data-open-campaign-id="${c.id}">
              <strong style="color: var(--museum-gold-bright); font-size: 14px;">${c.title || c.name}</strong><br>
              <span style="font-size: 11px; color: var(--museum-text-muted);">${c.year} • ${c.country_location || ''}</span>
              <p style="font-size: 12px; color: var(--museum-text-muted); margin-top: 6px;">${(c.synopsis || c.description || '').slice(0, 140)}...</p>
            </div>
          `).join('')}
        </div>
      `;
    }

    // 2. Personagens Encontrados
    if (results.characters && results.characters.length > 0) {
      html += `
        <h4 class="exhibition-card__label">Figuras Históricas (${results.characters.length})</h4>
        <div class="exhibition-character-grid" style="margin-bottom: 20px;">
          ${results.characters.map((ch) => {
            const st = this.dataLoader.getCharacterHistoricalStatus(ch);
            return `
              <div class="character-history-card" data-open-char-id="${ch.id}">
                <img src="${ch.portrait || 'assets/icon-192.png'}" alt="${ch.name}" class="character-history-card__portrait" onerror="this.src='assets/icon-192.png'">
                <div class="character-history-card__info">
                  <h4 class="character-history-card__name">${ch.name}</h4>
                  <span class="character-history-card__title">${ch.historical_title || ch.codename || 'Figura Histórica'}</span>
                  <span class="character-status-pill character-status-pill--${st.replace(/\s+/g, '-')}">${st.toUpperCase()}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // 3. Locais Encontrados
    if (results.locations && results.locations.length > 0) {
      html += `
        <h4 class="exhibition-card__label">Locais Históricos (${results.locations.length})</h4>
        <div class="exhibition-location-grid" style="margin-bottom: 20px;">
          ${results.locations.map((loc) => `
            <div class="location-history-card" data-open-loc-id="${loc.id}">
              <img src="${loc.illustration || 'assets/ref_interior_tavern.jpg'}" alt="${loc.name}" class="location-history-card__thumb" onerror="this.src='assets/ref_interior_tavern.jpg'">
              <div class="location-history-card__body">
                <h4 class="location-history-card__name">${loc.name}</h4>
                <span class="location-history-card__geo">${loc.zone || ''}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // 4. Acontecimentos Encontrados
    if (results.events && results.events.length > 0) {
      html += `
        <h4 class="exhibition-card__label">Acontecimentos Cronológicos (${results.events.length})</h4>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
          ${results.events.map((evt) => `
            <div class="exhibition-card">
              <span style="font-size: 11px; font-weight: 700; color: var(--museum-gold);">${evt.date}</span>
              <strong style="color: var(--museum-text-main); font-size: 13.5px; display: block; margin: 2px 0 4px;">${evt.title}</strong>
              <p style="font-size: 12px; color: var(--museum-text-muted);">${evt.description}</p>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (total === 0) {
      html = `
        <div style="text-align: center; padding: 48px; color: var(--museum-text-muted);">
          <div style="font-size: 32px; margin-bottom: 12px;">🔍</div>
          <strong style="font-size: 14px; color: var(--museum-text-main);">Nenhum registro histórico atende aos filtros atuais.</strong>
          <p style="font-size: 12px; margin-top: 6px;">Tente limpar filtros específicos ou clicar em "Ver Todos os Registros".</p>
        </div>
      `;
    }

    container.innerHTML = html;

    // Vincula eventos nos cartões de resultados
    container.querySelectorAll('[data-open-campaign-id]').forEach((c) => {
      c.addEventListener('click', () => {
        this.closeGlobalArchiveModal();
        this.openExhibitionModal(c.dataset.openCampaignId);
      });
    });

    container.querySelectorAll('[data-open-char-id]').forEach((ch) => {
      ch.addEventListener('click', () => {
        this.openCharacterBiographyModal(ch.dataset.openCharId);
      });
    });

    container.querySelectorAll('[data-open-loc-id]').forEach((l) => {
      l.addEventListener('click', () => {
        this.openLocationDossier(l.dataset.openLocId);
      });
    });
  }

  /* ==========================================================================
     MODAL DE LISTAGEM RÁPIDA DE EXPOSIÇÕES & GALERIA DE PERSONAGENS
     ========================================================================== */
  openExhibitionsListModal() {
    this.openGlobalArchiveModal({ entityType: 'campaigns' });
  }

  openCharactersGalleryModal() {
    this.openGlobalArchiveModal({ entityType: 'characters' });
  }

  /* ==========================================================================
     ADMINISTRAÇÃO DO MUSEU & CURADORIA (SEÇÃO 11 & 10)
     ========================================================================== */
  openAdminModal() {
    const modal = document.getElementById('museum-admin-modal');
    if (!modal) return;
    this.populateAdminSelects();
    this.refreshSnapshotsList();
    modal.classList.add('is-open');
  }

  closeAdminModal() {
    const modal = document.getElementById('museum-admin-modal');
    if (modal) modal.classList.remove('is-open');
  }

  populateAdminSelects() {
    const contSel = document.getElementById('admin-camp-continent');
    if (contSel && contSel.options.length <= 1) {
      this.dataLoader.getContinents().forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        contSel.appendChild(opt);
      });
    }

    const countrySel = document.getElementById('admin-camp-country');
    if (countrySel && countrySel.options.length <= 1) {
      this.dataLoader.getCountries().forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        countrySel.appendChild(opt);
      });
    }

    const campSel = document.getElementById('admin-export-camp-select');
    if (campSel) {
      campSel.innerHTML = '<option value="">-- Selecione uma Exposição --</option>';
      this.dataLoader.getCampaigns().forEach((camp) => {
        const opt = document.createElement('option');
        opt.value = camp.id;
        opt.textContent = `${camp.title || camp.name} (${camp.year})`;
        campSel.appendChild(opt);
      });
    }
  }

  async refreshSnapshotsList() {
    const container = document.getElementById('admin-snapshots-list');
    if (!container || !this.storageManager) return;

    const list = await this.storageManager.listSnapshots();
    if (!list.length) {
      container.innerHTML = `<span style="font-size: 11.5px; color: var(--museum-text-muted);">Nenhum ponto de restauração registrado até o momento.</span>`;
      return;
    }

    container.innerHTML = list.map((s) => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 12px;">
        <span><strong>${s.label}</strong> <small style="color: var(--museum-text-muted);">(${new Date(s.created_at).toLocaleString('pt-BR')})</small></span>
        <button type="button" class="admin-submit-btn" style="padding: 3px 8px; font-size: 10px;" data-restore-snap-id="${s.id}">Restaurar</button>
      </div>
    `).join('');

    container.querySelectorAll('[data-restore-snap-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (confirm('Deseja restaurar este ponto de restauração? Um snapshot do estado atual será criado antes.')) {
          await this.storageManager.restoreSnapshot(btn.dataset.restoreSnapId);
          alert('✓ Estado histórico restaurado com sucesso!');
          if (this.planetEngine) this.planetEngine.buildAllGeographicMarkers();
          this.refreshSnapshotsList();
        }
      });
    });
  }

  bindAdminEvents() {
    // 1. Exportar Universo Completo
    const btnExportUniverse = document.getElementById('btn-admin-export-universe');
    if (btnExportUniverse) {
      btnExportUniverse.addEventListener('click', () => {
        const pkg = this.storageManager.exportFullUniverseBackup();
        this.storageManager.downloadJSON(pkg, `evren_universe_museum_backup_${Date.now()}.json`);
      });
    }

    // 2. Exportar Campanha Individual
    const btnExportCampaign = document.getElementById('btn-admin-export-campaign');
    if (btnExportCampaign) {
      btnExportCampaign.addEventListener('click', () => {
        const campId = document.getElementById('admin-export-camp-select')?.value;
        if (!campId) {
          alert('Selecione uma campanha para exportar o pacote de exposição.');
          return;
        }
        const pkg = this.storageManager.exportSingleCampaignPackage(campId);
        if (pkg) {
          this.storageManager.downloadJSON(pkg, `evren_exhibition_${campId}_${Date.now()}.json`);
        }
      });
    }

    // 3. Importar Pacote JSON (Universo ou Campanha)
    const fileInput = document.getElementById('admin-import-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
          try {
            const json = JSON.parse(evt.target.result);
            const res = await this.storageManager.importMuseumPackage(json);
            alert(`✓ Pacote histórico importado com sucesso!\nModo: ${res.mode}\nPersonagens: ${res.importedCharacters}\nLocais: ${res.importedLocations}\nAcontecimentos: ${res.importedEvents}`);
            if (this.planetEngine) this.planetEngine.buildAllGeographicMarkers();
            this.refreshSnapshotsList();
          } catch (err) {
            alert(`! Falha ao importar arquivo: ${err.message}`);
          }
        };
        reader.readAsText(file);
      });
    }

    // 4. Salvar Nova Campanha (Exposição)
    const formCamp = document.getElementById('admin-form-new-campaign');
    if (formCamp) {
      formCamp.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('new-camp-title')?.value.trim();
        const year = document.getElementById('new-camp-year')?.value.trim();
        const periodNum = parseInt(document.getElementById('new-camp-year-num')?.value) || 2026;
        const status = document.getElementById('new-camp-status')?.value || 'em andamento';
        const continentId = document.getElementById('admin-camp-continent')?.value || 'cont_america_sul';
        const countryId = document.getElementById('admin-camp-country')?.value || 'country_brasil';
        const lat = parseFloat(document.getElementById('new-camp-lat')?.value) || 0;
        const lng = parseFloat(document.getElementById('new-camp-lng')?.value) || 0;
        const theme = document.getElementById('new-camp-theme')?.value.trim();
        const synopsis = document.getElementById('new-camp-synopsis')?.value.trim();

        if (!title) return;

        const id = `camp_${Date.now()}`;
        const newCamp = {
          id,
          title,
          name: title,
          year,
          period_numeric: periodNum,
          status_museum: status,
          category: status.includes('concl') ? 'completed' : 'ongoing',
          continent_id: continentId,
          country_id: countryId,
          region_id: 'reg_geral',
          city_id: 'city_geral',
          coordinates: [lat, lng],
          world_coordinates: [lat, lng],
          theme,
          synopsis,
          historical_context: synopsis,
          historical_identification: {
            name: title,
            year,
            period_numeric: periodNum,
            status,
            continent_id: continentId,
            country_id: countryId,
            coordinates: [lat, lng],
            genre_theme: theme,
            synopsis,
            historical_context: synopsis
          },
          exhibition_narrative: {
            prior_context: 'Contexto anterior em catalogação.',
            campaign_beginning: 'Início da expedição.',
            main_events: synopsis,
            turning_points: 'Acontecimentos decisivos.',
            conflicts: 'Confrontos históricos.',
            revelations: 'Descobertas.',
            consequences: 'Impactos no território.',
            outcome: status
          }
        };

        await this.storageManager.saveCampaign(newCamp);
        alert('✓ Nova Exposição Histórica registrada e persistida com sucesso!');
        formCamp.reset();
        if (this.planetEngine) this.planetEngine.buildAllGeographicMarkers();
        this.populateAdminSelects();
      });
    }

    // 5. Salvar Novo Personagem Histórico
    const formChar = document.getElementById('admin-form-new-char');
    if (formChar) {
      formChar.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('new-char-name')?.value.trim();
        const title = document.getElementById('new-char-title')?.value.trim();
        const status = document.getElementById('new-char-status')?.value || 'vivo';
        const bio = document.getElementById('new-char-bio')?.value.trim();
        const fate = document.getElementById('new-char-fate')?.value.trim();

        if (!name) return;

        const newChar = {
          id: `char_${Date.now()}`,
          name,
          historical_title: title,
          historical_status: status,
          life_status: status === 'vivo' ? 'alive' : status === 'morto' ? 'dead' : status,
          personal_history: bio,
          known_fate: fate,
          campaign_participations: [],
          relationships: [],
          visited_locations: [],
          portrait: 'assets/icon-192.png'
        };

        await this.storageManager.saveCharacter(newChar);
        alert('✓ Figura histórica cadastrada com sucesso!');
        formChar.reset();
      });
    }

    // 6. Salvar Novo Acontecimento Histórico
    const formEvent = document.getElementById('admin-form-new-event');
    if (formEvent) {
      formEvent.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('new-event-title')?.value.trim();
        const date = document.getElementById('new-event-date')?.value.trim();
        const year = parseInt(document.getElementById('new-event-year')?.value) || 2026;
        const desc = document.getElementById('new-event-desc')?.value.trim();
        const consequences = document.getElementById('new-event-consequences')?.value.trim();

        if (!title) return;

        const newEvent = {
          id: `evt_${Date.now()}`,
          title,
          date,
          year_numeric: year,
          description: desc,
          consequences
        };

        await this.storageManager.saveHistoricalEvent(newEvent);
        alert('✓ Acontecimento histórico registrado com sucesso!');
        formEvent.reset();
      });
    }
  }

  bindModalCloseEvents() {
    document.querySelectorAll('.museum-modal-close').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.museum-exhibition-modal, .museum-biography-modal, .museum-archive-modal, .museum-admin-modal, .museum-location-modal');
        if (modal) modal.classList.remove('is-open');
      });
    });

    // Abas da Exposição
    document.querySelectorAll('#museum-exhibition-modal .museum-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.switchExhibitionTab(btn.dataset.tab);
      });
    });
  }
}

window.MuseumController = MuseumController;
