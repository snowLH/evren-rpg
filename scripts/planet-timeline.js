/**
 * PLANET TIMELINE CONTROLLER — LINHA DO TEMPO PLANETÁRIA INTERATIVA DE EVREN
 * Sincroniza o Globo 3D, os arcos cronológicos e a Teia do Tempo em uma navegação visual única.
 */

class PlanetTimelineController {
  constructor(dataLoader, planetEngine, museumController) {
    this.dataLoader = dataLoader;
    this.planetEngine = planetEngine;
    this.museumController = museumController;
    this.activeEraId = 'all';
    this.spotlightDismissed = false;
    this.tourTimer = null;

    this.stops = [
      {
        id: 'all',
        year: 'Visão Geral',
        shortName: 'Todas as Eras',
        fullTitle: 'Planeta Evren — Linha do Tempo Completa',
        tag: '8 Marcos',
        color: '#e5c158',
        geo: { lat: 18.0, lng: -54.0, distance: 268 },
        locationLabel: 'Atlântico, Américas & Europa',
        statusKind: 'era',
        statusLabel: 'Atlas Planetário',
        summary: 'Navegue cronologicamente pelas eras do universo Evren — das relíquias cambrianas de +5.000 anos até a Queda do Véu em Vera Cruz, a fundação da A.E.G.I.S. e as três grandes vertentes de campanha.',
        quote: 'Toda ferida no Véu deixou cicatrizes geográficas conectadas pela mesma força.'
      },
      {
        id: 'era_primordial',
        year: '+5.000 Anos',
        shortName: 'Gênese Abissal',
        fullTitle: 'Era Primordial & Hallucigenia',
        tag: 'Era Antiga',
        color: '#ff2a85',
        geo: { lat: 30.5, lng: -62.5, distance: 192 },
        locationLabel: 'Abismo Atlântico Primordial',
        statusKind: 'era',
        statusLabel: 'Era Histórica',
        summary: 'Origem abissal da Verdadeira Magia. O Primogênito funde-se à anomalia oceânica ancestral e a bio-relíquia Hallucigenia molda os fundamentos celulares do MDA.',
        quote: 'Uma couraça viva antes do primeiro império humano.'
      },
      {
        id: 'era_mitica',
        year: 'Antig. – Séc. XV',
        shortName: 'Ordem da Cinza',
        fullTitle: 'Era Mítica & Ordem da Cinza',
        tag: 'Europa Velada',
        color: '#a855f7',
        geo: { lat: 48.2, lng: -2.8, distance: 184 },
        locationLabel: 'Europa Ocidental & Rotas Inquisitoriais',
        statusKind: 'era',
        statusLabel: 'Era Histórica',
        summary: 'Projeções do Primogênito originam lendas europeias de Loki e Arthur enquanto a Ordem da Cinza cataloga relíquias proibidas sob sigilo clerical.',
        quote: 'Antes da ciência moderna, o oculto tinha nome de heresia.'
      },
      {
        id: 'era_navegacoes',
        year: '~1500 – Séc. XVII',
        shortName: 'Vera Cruz & Véu',
        fullTitle: 'Queda do Véu & Arquipélago de Vera Cruz',
        tag: '4 Ilhas',
        color: '#fb923c',
        geo: { lat: -17.3, lng: -38.5, distance: 162 },
        locationLabel: 'Bahia / Atlântico Sul (4 Ilhas)',
        statusKind: 'era',
        statusLabel: 'Marco Cataclísmico',
        summary: 'A derrubada de árvores sagradas na 4ª Ilha rasga a membrana entre mundos. As quatro ilhas de Vera Cruz das Almas consolidam a escala de MDA 10% a 90%+.',
        quote: 'Quando a serra sangrou resina negra, o céu nunca mais fechou por completo.'
      },
      {
        id: 'era_moderna',
        year: 'Séc. XX',
        shortName: 'Fundação A.E.G.I.S.',
        fullTitle: 'Vídeos #01/#02 & Complexo A.E.G.I.S.',
        tag: 'Genebra / Dunas',
        color: '#38bdf8',
        geo: { lat: 44.5, lng: 12.4, distance: 184 },
        locationLabel: 'Bunker Genebra & Arquivos Grau-Zero',
        statusKind: 'era',
        statusLabel: 'Sigilo Global',
        summary: 'Os registros visuais #01 (deserto ||O) e #02 (Ciclo de Bedburg) forçam a transição da Ordem da Cinza para a rede internacional de contenção A.E.G.I.S.',
        quote: 'A câmera continuou gravando por sete minutos depois que as sombras dobraram de altura.'
      },
      {
        id: 'vertente_triangulo',
        year: '1998',
        shortName: 'Triângulo',
        fullTitle: 'Triângulo das Bermudas & Nova Caronte',
        tag: 'Futura Campanha',
        color: '#00e5ff',
        geo: { lat: 25.5, lng: -71.5, distance: 158 },
        locationLabel: 'Atlântico Norte • Fosso, Ilha Sauriana & Cidadela de Nácar',
        campaignId: 'camp_001',
        statusKind: 'future',
        statusLabel: '(Futura Campanha)',
        summary: 'Naufrágio de 5.000 almas nos cinco estágios da passagem, o Campo de Rosas do Arquiteto, Nova Caronte e o sacrifício do Guia Temporário no convés.',
        quote: 'Corram pela proa! Eu seguro a escotilha até o nevoeiro engolir o convés.'
      },
      {
        id: 'vertente_vilar',
        year: '2021 – 2024',
        shortName: 'Mansão Vilar',
        fullTitle: 'Até o Amanhecer: O Limiar da Mansão Vilar',
        tag: 'Concluída',
        color: '#e5c158',
        geo: { lat: 21.85, lng: -102.25, distance: 148 },
        locationLabel: 'Aguascalientes / Serra Subterrânea, México',
        campaignId: 'camp_002',
        statusKind: 'completed',
        statusLabel: 'Campanha Concluída',
        summary: 'Cinco amigos marcados pelo 6º bilhete investigam o desaparecimento de Lucas Vilar, confrontam o Projeto LIMIAR ("Davi Reis") e derrotam O Eco nas minas.',
        quote: 'Se os trilhos começarem a sangrar luz azul, fechem a comporta da galeria oeste.'
      },
      {
        id: 'vertente_oeht',
        year: '2026',
        shortName: 'Gala Belvedere',
        fullTitle: 'O Filantropo (Oeht) & Mercado de Relíquias',
        tag: 'Futura Campanha',
        color: '#c084fc',
        geo: { lat: 46.2044, lng: 6.1432, distance: 146 },
        locationLabel: 'Genebra, Suíça • Mansão Belvedere',
        campaignId: 'camp_filantropo_oeht',
        statusKind: 'future',
        statusLabel: '(Futura Campanha)',
        summary: 'Entre 22h e 00h no Salão dos Espelhos, Oeht tenta privatizar relíquias da Ordem da Cinza sob redoma púrpura enquanto loops de 10s anunciam O Anárquico.',
        quote: 'Quem arremata o Véu em leilão não compra poder — compra o próprio colapso.'
      },
      {
        id: 'vertente_colapso',
        year: 'Convergência',
        shortName: 'Segunda Queda',
        fullTitle: 'Horizonte de Convergência Planetária',
        tag: 'Ponto Crítico',
        color: '#ef4444',
        geo: { lat: 16.5, lng: -52.5, distance: 205 },
        locationLabel: 'Eixo Atlântico • Ruptura Global',
        statusKind: 'era',
        statusLabel: 'Ameaça Sistêmica',
        summary: 'Todas as três vertentes convergem sobre o mesmo código-fonte do Véu: caso os selos atlânticos cedam simultaneamente, a Primeira Fenda reabre em escala planetária.',
        quote: 'Não são anomalias isoladas. É a mesma memória tentando reescrever o mundo.'
      }
    ];
  }

  init() {
    this.renderDock();
    this.renderSpotlight();
    this.bindEvents();
    console.log('✓ PlanetTimelineController inicializado.');
  }

  escapeHtml(str) {
    if (window.EvrenSecurity) return window.EvrenSecurity.escapeHtml(str);
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  getActiveStop() {
    return this.stops.find((s) => s.id === this.activeEraId) || this.stops[0];
  }

  renderDock() {
    const dock = document.getElementById('planet-timeline-dock');
    if (!dock) return;

    const current = this.getActiveStop();
    const isPlaying = Boolean(this.tourTimer);

    dock.innerHTML = `
      <div class="tl-dock-top">
        <div class="tl-dock-heading">
          <span class="tl-dock-kicker">Linha do Tempo</span>
          <span class="tl-dock-current-title" id="tl-current-title">${this.escapeHtml(current.fullTitle)}</span>
        </div>
        <div class="tl-dock-controls">
          <button type="button" class="tl-nav-btn" id="btn-tl-prev" title="Era Anterior">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="15 18 9 12 15 6"/></svg>
            <span>Anterior</span>
          </button>
          <button type="button" class="tl-nav-btn ${isPlaying ? 'is-playing' : ''}" id="btn-tl-tour" title="Passeio Automático pelas Eras">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">${isPlaying ? '<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>' : '<polygon points="6 4 20 12 6 20 6 4"/>'}</svg>
            <span>${isPlaying ? 'Pausar' : 'Passeio'}</span>
          </button>
          <button type="button" class="tl-nav-btn" id="btn-tl-next" title="Próxima Era">
            <span>Próxima</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
      <div class="tl-track-scroll" role="tablist" aria-label="Eras da Linha do Tempo de Evren">
        ${this.stops.map((stop) => `
          <button
            type="button"
            role="tab"
            aria-selected="${stop.id === this.activeEraId}"
            class="tl-era-stop ${stop.id === this.activeEraId ? 'active' : ''}"
            data-era-id="${this.escapeHtml(stop.id)}"
            style="--era-color: ${stop.color};"
          >
            <span class="tl-era-year">${this.escapeHtml(stop.year)}</span>
            <span class="tl-era-name">${this.escapeHtml(stop.shortName)}</span>
            <span class="tl-era-tag">${this.escapeHtml(stop.tag)}</span>
          </button>
        `).join('')}
      </div>
    `;

    this.bindDockControls();
  }

  bindDockControls() {
    document.querySelectorAll('#planet-timeline-dock .tl-era-stop').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.stopTour();
        this.spotlightDismissed = false;
        this.selectEra(btn.dataset.eraId);
      });
    });

    document.getElementById('btn-tl-prev')?.addEventListener('click', () => {
      this.stopTour();
      this.spotlightDismissed = false;
      this.stepEra(-1);
    });

    document.getElementById('btn-tl-next')?.addEventListener('click', () => {
      this.stopTour();
      this.spotlightDismissed = false;
      this.stepEra(1);
    });

    document.getElementById('btn-tl-tour')?.addEventListener('click', () => {
      if (this.tourTimer) {
        this.stopTour();
      } else {
        this.startTour();
      }
      this.renderDock();
    });
  }

  bindEvents() {
    document.getElementById('btn-reopen-spotlight')?.addEventListener('click', () => {
      this.spotlightDismissed = false;
      this.renderSpotlight();
    });
  }

  stepEra(delta) {
    const idx = this.stops.findIndex((s) => s.id === this.activeEraId);
    const nextIdx = (idx + delta + this.stops.length) % this.stops.length;
    this.selectEra(this.stops[nextIdx].id);
  }

  startTour() {
    this.stopTour();
    this.spotlightDismissed = false;
    if (this.activeEraId === 'all') {
      this.selectEra(this.stops[1].id);
    }
    this.tourTimer = setInterval(() => {
      const idx = this.stops.findIndex((s) => s.id === this.activeEraId);
      const nextIdx = idx >= this.stops.length - 1 ? 1 : idx + 1;
      this.selectEra(this.stops[nextIdx].id);
    }, 4800);
  }

  stopTour() {
    if (this.tourTimer) {
      clearInterval(this.tourTimer);
      this.tourTimer = null;
    }
  }

  selectEra(eraId, opts = {}) {
    const stop = this.stops.find((s) => s.id === eraId) || this.stops[0];
    this.activeEraId = stop.id;

    // Atualiza Dock & Spotlight
    this.renderDock();
    this.renderSpotlight();

    // Sincroniza Globo 3D
    if (!opts.skipFly && this.planetEngine) {
      if (this.museumController) {
        this.museumController.switchTo3DView();
      }
      this.planetEngine.setTimelineEra(stop.id, stop.geo);
    }

    if (window.uiController?.soundFX && !opts.silent) {
      window.uiController.soundFX.playTacticalBeep();
    }
  }

  renderSpotlight() {
    const card = document.getElementById('planet-era-spotlight');
    const reopenBtn = document.getElementById('btn-reopen-spotlight');
    if (!card) return;

    if (this.spotlightDismissed) {
      card.classList.add('is-hidden');
      if (reopenBtn) reopenBtn.classList.add('is-visible');
      return;
    }

    card.classList.remove('is-hidden');
    if (reopenBtn) reopenBtn.classList.remove('is-visible');

    const stop = this.getActiveStop();
    const statusClass = stop.statusKind === 'completed' ? 'is-completed' : stop.statusKind === 'future' ? 'is-future' : 'is-era';

    const teiaRaw = this.dataLoader.getTeiaDoTempo() || { nodes: [] };
    const eraNodes = stop.id === 'all'
      ? []
      : (teiaRaw.nodes || []).filter((n) => (n.era_id || n.era) === stop.id);

    card.style.borderColor = `${stop.color}55`;

    card.innerHTML = `
      <div class="spotlight-head">
        <div class="spotlight-badges">
          <span class="spotlight-year-pill" style="border-color:${stop.color}66; color:${stop.color};">${this.escapeHtml(stop.year)}</span>
          <span class="spotlight-status-pill ${statusClass}">${this.escapeHtml(stop.statusLabel)}</span>
        </div>
        <button type="button" class="spotlight-close-btn" id="btn-close-spotlight" title="Recolher Cartão">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <h3 class="spotlight-title">${this.escapeHtml(stop.fullTitle)}</h3>

      <div class="spotlight-geo">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span>${this.escapeHtml(stop.locationLabel)}</span>
      </div>

      <p class="spotlight-summary">${this.escapeHtml(stop.summary)}</p>

      ${stop.quote ? `<blockquote class="spotlight-quote">“${this.escapeHtml(stop.quote)}”</blockquote>` : ''}

      ${eraNodes.length > 0 ? `
        <div class="spotlight-nodes-list">
          <span class="spotlight-nodes-label">Marcos desta Era (${eraNodes.length})</span>
          ${eraNodes.map((n) => `
            <button type="button" class="spotlight-node-btn" data-node-id="${this.escapeHtml(n.id)}">
              <span>${this.escapeHtml(n.title || n.label || n.id)}</span>
              <span class="spotlight-node-year">${this.escapeHtml(n.year_display || n.year || '')}</span>
            </button>
          `).join('')}
        </div>
      ` : ''}

      <div class="spotlight-actions">
        ${stop.campaignId ? `
          <button type="button" class="spotlight-cta-primary" id="btn-spotlight-dossier" data-camp-id="${this.escapeHtml(stop.campaignId)}">
            Abrir Dossiê Completo
          </button>
        ` : `
          <button type="button" class="spotlight-cta-primary" id="btn-spotlight-teia" data-era-id="${this.escapeHtml(stop.id)}">
            Explorar na Teia do Tempo
          </button>
        `}
        ${stop.campaignId ? `
          <button type="button" class="spotlight-cta-secondary" id="btn-spotlight-teia" data-era-id="${this.escapeHtml(stop.id)}">
            Ver na Teia
          </button>
        ` : `
          <button type="button" class="spotlight-cta-secondary" id="btn-spotlight-next">
            Próxima Era
          </button>
        `}
      </div>
    `;

    document.getElementById('btn-close-spotlight')?.addEventListener('click', () => {
      this.spotlightDismissed = true;
      this.renderSpotlight();
    });

    card.querySelectorAll('.spotlight-node-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nodeId = btn.dataset.nodeId;
        if (window.teiaController) {
          window.teiaController.openModal();
          if (nodeId) window.teiaController.inspectNode(nodeId);
        }
      });
    });

    document.getElementById('btn-spotlight-dossier')?.addEventListener('click', (e) => {
      const campId = e.currentTarget.dataset.campId;
      if (window.uiController && campId) {
        window.uiController.openCampaignStory(campId);
      } else if (this.museumController && campId) {
        this.museumController.openExhibitionModal(campId);
      }
    });

    document.getElementById('btn-spotlight-teia')?.addEventListener('click', (e) => {
      const targetEra = e.currentTarget.dataset.eraId;
      if (window.teiaController) {
        window.teiaController.openModal();
        if (targetEra && targetEra !== 'all') {
          window.teiaController.currentEraFilter = targetEra;
          document.querySelectorAll('.teia-era-chip').forEach((ch) => {
            ch.classList.toggle('active', ch.dataset.era === targetEra);
          });
          window.teiaController.applyFilters();
        }
      }
    });

    document.getElementById('btn-spotlight-next')?.addEventListener('click', () => {
      this.stopTour();
      this.stepEra(1);
    });
  }
}

window.PlanetTimelineController = PlanetTimelineController;
