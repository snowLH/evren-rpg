/**
 * MAP ENGINE MODULE (LEAFLET REAL WORLD GEOGRAPHIC SYSTEM - MULTI-ESCALAS)
 * Universo: Evren
 * Renderiza o Mapa Múndi REAL com todos os 177 países do mundo, o Triângulo das Bermudas
 * no Oceano Atlântico e a Mansão Vilar no México, com mergulho cinematográfico nas nuvens.
 */

class MapEngine {
  constructor(containerId, dataLoader, uiController) {
    this.containerId = containerId;
    this.dataLoader = dataLoader;
    this.uiController = uiController;
    this.map = null;

    // Escala e Estado da Navegação
    this.currentScale = 'global'; // 'global' | 'local'
    this.currentMapId = 'map_world';
    this.currentRpgId = null; // 'camp_001' | 'camp_002'
    this.isTransitioning = false;

    // Camadas de Overlays do Leaflet
    this.countriesGeoJsonLayer = null;
    this.bermudaTriangleLayer = null;
    this.localTacticalOverlay = null;
    this.globalMarkersGroup = null;
    this.localMarkersGroup = null;
    this.zoneLayerGroup = null;
    this.markers = {}; // Cache de marcadores locais para flyTo

    // Coordenadas mundiais canônicas
    this.worldCenter = [38.0, -48.0];
    this.worldZoom = 2.6;

    // Motores Visuais e de Partículas Atmosféricas
    this.atmosphericEngine = null;
    this.cloudWarpEngine = null;
  }

  init() {
    // Inicializa motores visuais
    if (window.AtmosphericEngine) {
      this.atmosphericEngine = new AtmosphericEngine('atmospheric-particles-canvas', this);
    }
    if (window.CloudWarpEngine) {
      this.cloudWarpEngine = new CloudWarpEngine('cloud-warp-canvas');
    }

    // Inicializa o mapa Leaflet com sistema geográfico WGS84 padrão
    this.map = L.map(this.containerId, {
      center: this.worldCenter,
      zoom: this.worldZoom,
      minZoom: 2,
      maxZoom: 18,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      attributionControl: false,
      worldCopyJump: true
    });

    // Grupos de camadas
    this.zoneLayerGroup = L.layerGroup().addTo(this.map);
    this.globalMarkersGroup = L.layerGroup().addTo(this.map);
    this.localMarkersGroup = L.layerGroup().addTo(this.map);

    // 1. Inicia na Visão Global com o Mapa Múndi Real contendo todos os países
    this.renderGlobalWorldView();

    // 2. Configura controles de navegação
    this.setupNavigationControls();

    // 3. Inicializa Battlemap Tokens
    if (window.BattlemapTokens) {
      this.battlemapTokens = new BattlemapTokens(this, this.dataLoader, this.uiController);
      this.battlemapTokens.init();
      window.battlemapTokens = this.battlemapTokens;
    }

    // Expõe funções no escopo global
    window.mergulhoNasNuvens = (rpgId) => this.mergulhoNasNuvens(rpgId);
    window.retornarAoMapaMundi = () => this.retornarAoMapaMundi();

    console.log('✓ MapEngine Geográfico Real inicializado com sucesso.');
  }

  setupNavigationControls() {
    // Botão flutuante "Retornar ao Mapa Múndi"
    const returnBtn = document.getElementById('btn-return-world');
    if (returnBtn) {
      returnBtn.addEventListener('click', () => {
        this.retornarAoMapaMundi();
      });
    }

    // Clique no breadcrumb para retornar ao mundo
    const breadcrumbWorld = document.querySelector('.breadcrumb-world');
    if (breadcrumbWorld) {
      breadcrumbWorld.addEventListener('click', () => {
        if (this.currentScale === 'local') {
          this.retornarAoMapaMundi();
        }
      });
    }
  }

  /* ==========================================================================
     1. RENDERIZAÇÃO DO MAPA MÚNDI REAL COM TODOS OS PAÍSES
     ========================================================================== */
  renderGlobalWorldView() {
    this.currentScale = 'global';
    this.currentMapId = 'map_world';
    this.currentRpgId = null;

    // Remove overlays táticos locais se existirem
    if (this.localTacticalOverlay) {
      this.map.removeLayer(this.localTacticalOverlay);
      this.localTacticalOverlay = null;
    }

    // Renderiza todos os países do mundo via GeoJSON
    this.renderWorldCountries();

    // Renderiza o verdadeiro Triângulo das Bermudas no Oceano Atlântico
    this.renderBermudaTriangle();

    // Plota os Grandes Marcadores no México e no Triângulo
    this.localMarkersGroup.clearLayers();
    if (this.battlemapTokens) {
      this.battlemapTokens.clearAllTokens();
    }
    this.renderGlobalCampaignMarkers();

    // Atualiza breadcrumb e oculta botão de retorno
    this.updateNavigationUI();
  }

  /**
   * Estilização de Biomas Cartográficos de Fantasia (Estilo Edoran)
   */
  getCountryFantasyStyle(feature) {
    const name = feature.properties?.name || '';
    const isMexico = name === 'Mexico';

    if (isMexico) {
      return {
        fillColor: '#1d6e3c', // Jade Místico Mesoamericano
        fillOpacity: 0.95,
        color: '#ffd700',     // Ouro antigo do império
        weight: 3.2,
        opacity: 1,
        dashArray: ''
      };
    }

    // 1. Tundra Ártica e Cordilheiras Nevadas (Norte Gélido de Edoran)
    const tundraCountries = [
      'Greenland', 'Russia', 'Canada', 'Norway', 'Sweden', 'Finland',
      'Iceland', 'Antarctica', 'Estonia', 'Latvia', 'Lithuania'
    ];
    if (tundraCountries.includes(name)) {
      return {
        fillColor: '#8caebf', // Prata gélida e neve
        fillOpacity: 0.88,
        color: '#d4edf9',
        weight: 1.2,
        opacity: 0.95,
        dashArray: ''
      };
    }

    // 2. Florestas Tropicais e Selvas Equatoriais (Verde Esmeralda Denso)
    const tropicalCountries = [
      'Brazil', 'Colombia', 'Peru', 'Ecuador', 'Bolivia', 'Venezuela',
      'Guyana', 'Suriname', 'Democratic Republic of the Congo', 'Republic of the Congo',
      'Gabon', 'Cameroon', 'Central African Republic', 'Indonesia', 'Malaysia',
      'Papua New Guinea', 'Madagascar', 'Costa Rica', 'Panama', 'Philippines',
      'Thailand', 'Vietnam', 'Laos', 'Cambodia', 'Myanmar'
    ];
    if (tropicalCountries.includes(name)) {
      return {
        fillColor: '#255e2e', // Sylvan primordial
        fillOpacity: 0.9,
        color: '#4cb058',
        weight: 1.2,
        opacity: 0.9,
        dashArray: ''
      };
    }

    // 3. Desertos Dourados e Savanas Áridas (Ocre e Areia Antiga de Edoran)
    const desertCountries = [
      'Egypt', 'Libya', 'Algeria', 'Mauritania', 'Mali', 'Niger', 'Chad',
      'Sudan', 'South Sudan', 'Saudi Arabia', 'Yemen', 'Oman', 'United Arab Emirates',
      'Iraq', 'Jordan', 'Iran', 'Namibia', 'Botswana', 'Australia', 'Mongolia',
      'Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Afghanistan', 'Pakistan', 'Syria', 'Somalia'
    ];
    if (desertCountries.includes(name)) {
      return {
        fillColor: '#9e7930', // Ouro e ocre do deserto
        fillOpacity: 0.9,
        color: '#d6a84f',
        weight: 1.2,
        opacity: 0.9,
        dashArray: ''
      };
    }

    // 4. Vales Temperados, Bosques e Reinos Centrais
    return {
      fillColor: '#3c5a2e',
      fillOpacity: 0.88,
      color: '#65914e',
      weight: 1.2,
      opacity: 0.9,
      dashArray: ''
    };
  }

  /**
   * Renderiza todos os 177 países com estética de Cartografia Fantástica (Estilo Edoran)
   * incluindo o halo turquesa de plataforma continental (Reef Shallow Water)
   */
  renderWorldCountries() {
    if (this.countriesShelfLayer) {
      this.map.removeLayer(this.countriesShelfLayer);
      this.countriesShelfLayer = null;
    }
    if (this.countriesGeoJsonLayer) {
      this.map.removeLayer(this.countriesGeoJsonLayer);
      this.countriesGeoJsonLayer = null;
    }

    const geoData = this.dataLoader.getWorldGeoJSON();
    if (!geoData) {
      console.warn('GeoJSON de países não disponível globalmente.');
      return;
    }

    // CAMADA 1: Plataforma Continental Turquesa / Recifes Costeiros (Estilo Edoran)
    this.countriesShelfLayer = L.geoJSON(geoData, {
      style: () => ({
        fillColor: '#1faec4',
        fillOpacity: 0.25,
        color: '#22d3ee',
        weight: 14,
        opacity: 0.45,
        lineCap: 'round',
        lineJoin: 'round'
      }),
      interactive: false
    }).addTo(this.map);

    // CAMADA 2: Polígonos de Biomas Geográficos dos Países
    this.countriesGeoJsonLayer = L.geoJSON(geoData, {
      style: (feature) => this.getCountryFantasyStyle(feature),
      onEachFeature: (feature, layer) => {
        const countryName = feature.properties?.name || '';
        const isMexico = countryName === 'Mexico';

        const tooltipContent = isMexico 
          ? `🇲🇽 <strong>MÉXICO // EPICENTRO ANÔMALO</strong><br><span style="color:#ffd700; font-size:10px;">PROPRIEDADE DA MANSÃO VILAR // CLASSIFICADO</span>`
          : `<strong>${countryName.toUpperCase()}</strong><br><span style="color:#a8d5e8; font-size:9px;">TERRITÓRIO MUNDIAL // ESTABILIDADE 98%</span>`;

        layer.bindTooltip(tooltipContent, {
          sticky: true,
          className: isMexico ? 'country-tactical-tooltip mexico-tactical-tooltip' : 'country-tactical-tooltip'
        });

        layer.on({
          mouseover: (e) => {
            if (this.currentScale !== 'global') return;
            const target = e.target;
            target.setStyle({
              fillColor: isMexico ? '#278b4d' : '#4d7540',
              fillOpacity: 1,
              color: isMexico ? '#ffd700' : '#ffd700',
              weight: isMexico ? 3.5 : 2.2,
              opacity: 1
            });
            target.bringToFront();
          },
          mouseout: (e) => {
            if (this.currentScale !== 'global') return;
            this.countriesGeoJsonLayer.resetStyle(e.target);
          },
          click: () => {
            if (isMexico && this.currentScale === 'global') {
              this.mergulhoNasNuvens('camp_002');
            }
          }
        });
      }
    }).addTo(this.map);

    // Adiciona inscrições caligráficas náuticas nos oceanos
    this.renderOceanCartographyLabels();
  }

  /**
   * Rótulos Náuticos Clássicos de Oceanos e Correntes (Estilo Edoran)
   */
  renderOceanCartographyLabels() {
    if (this.nauticalDecorationsLayer) {
      this.map.removeLayer(this.nauticalDecorationsLayer);
      this.nauticalDecorationsLayer = null;
    }
    this.nauticalDecorationsLayer = L.layerGroup().addTo(this.map);

    const oceanLabels = [
      { text: 'OCEANO ATLÂNTICO SETENTRIONAL', coords: [36.0, -42.0], major: true },
      { text: 'MAR DAS ANTILHAS', coords: [16.5, -74.0], major: false },
      { text: 'CORRENTE DE DERIVA EQUATORIAL', coords: [1.0, -30.0], tidal: true },
      { text: 'OCEANO PACÍFICO ORIENTAL', coords: [12.0, -125.0], major: true },
      { text: 'ABISSO MARINHO AUSTRAL', coords: [-52.0, -30.0], major: false },
      { text: 'CANAL DO NORTE GÉLIDO', coords: [68.0, 10.0], major: false }
    ];

    oceanLabels.forEach(lbl => {
      const className = lbl.major 
        ? 'ocean-fantasy-label major-sea' 
        : (lbl.tidal ? 'ocean-fantasy-label tidal-flow' : 'ocean-fantasy-label');

      const icon = L.divIcon({
        className: 'ocean-label-wrapper',
        iconSize: [300, 30],
        iconAnchor: [150, 15],
        html: `<div class="${className}">${lbl.text}</div>`
      });

      const marker = L.marker(lbl.coords, { icon, interactive: false });
      this.nauticalDecorationsLayer.addLayer(marker);
    });
  }

  /**
   * Renderiza o Triângulo das Bermudas real com o Vórtice Abissal Náutico (Whirlpool)
   */
  renderBermudaTriangle() {
    this.zoneLayerGroup.clearLayers();

    // Vértices Reais do Triângulo das Bermudas
    const bermudaCoords = [
      [32.3078, -64.7505], // Bermuda
      [25.7617, -80.1918], // Miami, Flórida
      [18.4655, -66.1057]  // San Juan, Porto Rico
    ];

    const trianglePoly = L.polygon(bermudaCoords, {
      className: 'bermuda-triangle-polygon',
      color: '#ffd700',
      weight: 2.5,
      opacity: 0.9,
      fillColor: '#8b1e1e',
      fillOpacity: 0.22,
      dashArray: '8, 6'
    });

    trianglePoly.bindTooltip(`
      <div style="text-align: center;">
        <strong style="color: #ff4d4d; letter-spacing: 1.5px;">O TRIÂNGULO DAS BERMUDAS</strong><br>
        <span style="color: #ffd700; font-size: 10px;">ANOMALIA SUPREMA // VÓRTICE ABISSAL ATLÂNTICO</span>
      </div>
    `, { sticky: true, className: 'country-tactical-tooltip' });

    trianglePoly.on('click', () => {
      if (this.currentScale === 'global') {
        this.mergulhoNasNuvens('camp_001');
      }
    });

    this.zoneLayerGroup.addLayer(trianglePoly);

    // Vórtice Maelstrom Ilustrado em SVG no centro do Triângulo (como em Edoran)
    const whirlpoolIcon = L.divIcon({
      className: 'bermuda-maelstrom-container',
      iconSize: [120, 120],
      iconAnchor: [60, 60],
      html: `
        <svg class="bermuda-whirlpool-svg" viewBox="0 0 120 120" width="120" height="120" fill="none">
          <defs>
            <radialGradient id="vortexDeep" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#020812"/>
              <stop offset="60%" stop-color="#0a2a4a"/>
              <stop offset="100%" stop-color="#061c30" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="60" cy="60" r="56" fill="url(#vortexDeep)"/>
          <circle cx="60" cy="60" r="48" stroke="#22d3ee" stroke-width="1.5" stroke-dasharray="14 8" opacity="0.8"/>
          <circle cx="60" cy="60" r="36" stroke="#4bf4ff" stroke-width="1.8" stroke-dasharray="10 6" opacity="0.9"/>
          <circle cx="60" cy="60" r="24" stroke="#ffffff" stroke-width="2" stroke-dasharray="6 4" opacity="0.95"/>
          <circle cx="60" cy="60" r="12" fill="#01050a" stroke="#e74c3c" stroke-width="1.5"/>
          <!-- Tentáculos do Kraken no Abismo -->
          <path d="M 60 60 Q 75 40 85 45" stroke="#e74c3c" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.8"/>
          <path d="M 60 60 Q 40 75 35 85" stroke="#e74c3c" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.8"/>
        </svg>
      `
    });

    const whirlpoolMarker = L.marker([25.50, -71.50], { icon: whirlpoolIcon });
    whirlpoolMarker.on('click', () => {
      if (this.currentScale === 'global') {
        this.mergulhoNasNuvens('camp_001');
      }
    });
    this.zoneLayerGroup.addLayer(whirlpoolMarker);

    // Linha de Fenda Dimensional ligando o México ao Triângulo das Bermudas
    const riftLine = L.polyline([
      [21.85, -102.25], // Mansão Vilar (México)
      [22.50, -90.00],  // Golfo do México
      [25.50, -71.50]   // Triângulo das Bermudas
    ], {
      color: '#ffd700',
      weight: 2.2,
      opacity: 0.85,
      dashArray: '8, 6',
      className: 'dimensional-rift-line'
    });
    this.zoneLayerGroup.addLayer(riftLine);

    // Linha de Fenda Dimensional ligando o Triângulo das Bermudas à Estação Criogênica Zero (Groenlândia)
    const arcticRiftLine = L.polyline([
      [25.50, -71.50],  // Triângulo das Bermudas
      [50.00, -52.00],  // Atlântico Norte
      [72.00, -40.00]   // Estação Zero (Groenlândia)
    ], {
      color: '#00e5ff',
      weight: 2.2,
      opacity: 0.85,
      dashArray: '8, 6',
      className: 'dimensional-rift-line'
    });
    this.zoneLayerGroup.addLayer(arcticRiftLine);
  }

  /**
   * Plota os Grandes Marcadores de RPG no México, Triângulo das Bermudas e Groenlândia
   */
  renderGlobalCampaignMarkers() {
    this.globalMarkersGroup.clearLayers();
    const campaigns = this.dataLoader.getCampaigns();

    campaigns.forEach(camp => {
      const coords = camp.world_coordinates || [20.0, -80.0];
      const isTriangulo = camp.id === 'camp_001';
      const isMexico = camp.id === 'camp_002';
      const isArtico = camp.id === 'camp_003';
      const isBrasil = camp.id === 'camp_004';
      const isAlemanha = camp.id === 'camp_005';

      let markerClass = 'marker-vilar-portal';
      let dangerClass = 'danger-alfa';

      if (isTriangulo) {
        markerClass = 'marker-triangulo-portal';
        dangerClass = 'danger-omega';
      } else if (isArtico) {
        markerClass = 'marker-artico-portal';
        dangerClass = 'danger-beta';
      } else if (isBrasil) {
        markerClass = 'marker-brasil-portal';
        dangerClass = 'danger-omega';
      } else if (isAlemanha) {
        markerClass = 'marker-alemanha-portal';
        dangerClass = 'danger-alfa';
      }

      let iconSvg = '';
      if (isTriangulo) {
        iconSvg = `
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
            <path d="M2 12h20"/>
            <circle cx="12" cy="12" r="4" fill="#e74c3c" fill-opacity="0.3"/>
          </svg>
        `;
      } else if (isArtico) {
        iconSvg = `
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="2" x2="12" y2="22"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            <line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/>
            <circle cx="12" cy="12" r="3" fill="#00e5ff" fill-opacity="0.4"/>
          </svg>
        `;
      } else if (isBrasil) {
        iconSvg = `
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            <circle cx="12" cy="12" r="2" fill="#39ff14"/>
          </svg>
        `;
      } else if (isAlemanha) {
        iconSvg = `
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            <circle cx="12" cy="8" r="2" fill="#c084fc"/>
          </svg>
        `;
      } else {
        iconSvg = `
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>
            <circle cx="12" cy="13" r="3" fill="#00e5ff" fill-opacity="0.3"/>
            <path d="M12 2v3"/>
          </svg>
        `;
      }

      const grandIcon = L.divIcon({
        className: `grand-campaign-marker ${markerClass}`,
        iconSize: [80, 80],
        iconAnchor: [40, 40],
        html: `
          <div class="grand-marker-portal-ring"></div>
          <div class="grand-marker-core">
            <div class="grand-marker-icon">
              ${iconSvg}
            </div>
          </div>
          <div class="grand-marker-card">
            <div class="grand-marker-title">${camp.gateway_name || camp.title}</div>
            <div class="grand-marker-danger ${dangerClass}">${camp.danger_rating || 'ÁREA CLASSIFICADA'}</div>
            <div class="grand-marker-prompt">
              <span>▶ CLIQUE PARA MERGULHAR</span>
            </div>
          </div>
        `
      });

      const marker = L.marker(coords, { icon: grandIcon });

      marker.on('click', () => {
        if (window.soundFX) window.soundFX.playRadarPing();
        this.mergulhoNasNuvens(camp.id);
      });

      this.globalMarkersGroup.addLayer(marker);
    });
  }

  /* ==========================================================================
     2. A ANIMAÇÃO DE "MERGULHO" (CLOUD DIVE / DEEP ZOOM)
     ========================================================================== */
  async mergulhoNasNuvens(rpgId) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.dismissPlanetaryArrivalCard();

    // Normaliza campanha e alvo planetário
    let campaign = null;
    let targetCoords = [21.85, -102.25];
    let targetZoom = 11;
    let targetName = 'LOCAL TÁTICO';
    let targetCountry = 'PLANETA TERRA';
    let targetAtmosphere = 'Estável';
    let targetEra = 'Ano 2026';
    let targetDanger = 'NÍVEL ALFA';
    let targetNarrative = '';
    let targetIcon = '📍';

    if (rpgId === 'camp_001' || rpgId === 'map_triangulo' || rpgId === 'loc_caronte' || rpgId === 'loc_kraken') {
      campaign = this.dataLoader.getCampaignById('camp_001');
      targetCoords = [25.5, -71.5];
      targetZoom = 7;
      targetName = 'O TRIÂNGULO DAS BERMUDAS // NOVA CARONTE';
      targetCountry = 'Oceano Atlântico Norte';
      targetAtmosphere = 'Vórtice Abissal & Fissura Hiper-Evolutiva';
      targetEra = 'Ano 2026 • RPG Em Andamento';
      targetDanger = 'NÍVEL ÔMEGA // 99% MDA';
      targetNarrative = 'Epicentro da fenda dimensional no Atlântico onde sobreviventes de um navio com 5.000 almas enfrentam mutações biológicas forçadas pelo Arquiteto do Caos.';
      targetIcon = '🌊';
    } else if (rpgId === 'camp_002' || rpgId === 'map_vilar' || rpgId?.includes?.('vilar')) {
      campaign = this.dataLoader.getCampaignById('camp_002');
      targetCoords = [21.85, -102.25];
      targetZoom = 11;
      targetName = 'MANSÃO VILAR // MÉXICO';
      targetCountry = 'México (Serra Mineradora)';
      targetAtmosphere = 'Chuva Torrencial & Vapores de Minas Antigas';
      targetEra = 'Ano 2024 • Concluído / Histórico';
      targetDanger = 'NÍVEL ALFA // ECOS & LIMIAR';
      targetNarrative = 'Local do isolamento onde cinco amigos confrontaram o Mascarado do LIMIAR e resgataram Lucas Vilar cego nas profundezas das minas subterrâneas.';
      targetIcon = '🏛️';
    } else if (rpgId === 'camp_003' || rpgId === 'map_artico' || rpgId?.includes?.('estacao') || rpgId?.includes?.('monolito')) {
      campaign = this.dataLoader.getCampaignById('camp_003');
      targetCoords = [72.0, -40.0];
      targetZoom = 8;
      targetName = 'ESTAÇÃO CRIOGÊNICA ZERO // GROENLÂNDIA';
      targetCountry = 'Groenlândia (Calota Polar Ártica)';
      targetAtmosphere = 'Nevasca Glacial (-50°C) & Radiação Criogênica';
      targetEra = 'Ano 2026 • RPG Em Andamento';
      targetDanger = 'NÍVEL BETA // CRIOPARASITAS';
      targetNarrative = 'Complexo científico subterrâneo escavado sob 3km de gelo onde um espécime primordial rompeu a contenção de quarentena.';
      targetIcon = '❄️';
    } else if (rpgId === 'camp_004' || rpgId === 'map_brasil' || rpgId?.includes?.('tapajos') || rpgId?.includes?.('quartzo')) {
      campaign = this.dataLoader.getCampaignById('camp_004');
      targetCoords = [-4.25, -55.98];
      targetZoom = 10;
      targetName = 'BACIA DO TAPAJÓS // BRASIL';
      targetCountry = 'Brasil (Amazônia / Rio Tapajós)';
      targetAtmosphere = 'Umidade Densa de Selva & Esporos Bioelétricos';
      targetEra = 'Ano 2025 • Concluído / Histórico';
      targetDanger = 'NÍVEL ÔMEGA // NÓDULOS DE QUARTZO';
      targetNarrative = 'Local de infiltração do esquadrão Curupira onde o Capitão Santos e a Dra. Camila Neves detonaram a cratera de quartzo negro para deter a infecção vegetal.';
      targetIcon = '🌿';
    } else if (rpgId === 'camp_005' || rpgId === 'map_alemanha' || rpgId?.includes?.('monasterio') || rpgId?.includes?.('cripta')) {
      campaign = this.dataLoader.getCampaignById('camp_005');
      targetCoords = [48.15, 8.20];
      targetZoom = 11;
      targetName = 'MONASTÉRIO DOS SEM-ROSTO // ALEMANHA';
      targetCountry = 'Alemanha (Floresta Negra)';
      targetAtmosphere = 'Névoa Gótica Perpétua & Frequência de Amnésia';
      targetEra = 'Ano 2023 • Concluído / Histórico';
      targetDanger = 'NÍVEL ALFA // RESSONÂNCIA DO ECO';
      targetNarrative = 'Abadia gótica medieval lacrada após Greta Falk e Hans Richter descobrirem que sinos do LIMIAR roubavam vozes e memórias de peregrinos.';
      targetIcon = '🔔';
    } else {
      campaign = this.dataLoader.getCampaignById(rpgId);
      if (!campaign) {
        const loc = this.dataLoader.getLocationById(rpgId);
        if (loc && loc.coordinates) {
          targetCoords = loc.coordinates;
          targetZoom = 11;
          targetName = `${loc.name.toUpperCase()} // ${loc.zone.toUpperCase()}`;
          targetCountry = loc.zone;
          targetNarrative = loc.description;
          targetDanger = 'SETOR CATALOGADO';
          targetEra = 'Arquivo de Memórias';
        } else {
          campaign = this.dataLoader.getCampaigns()[0];
        }
      }
    }

    if (campaign) {
      targetCoords = campaign.world_coordinates || targetCoords;
      targetName = campaign.gateway_name || campaign.title;
      targetCountry = campaign.country_location || targetCountry;
      targetDanger = campaign.danger_rating || targetDanger;
      targetEra = `${campaign.year} • ${campaign.status}`;
      targetNarrative = campaign.synopsis || campaign.description || targetNarrative;
      if (campaign.id === 'camp_001') { targetZoom = 7; targetIcon = '🌊'; }
      else if (campaign.id === 'camp_002') { targetZoom = 11; targetIcon = '🏛️'; }
      else if (campaign.id === 'camp_003') { targetZoom = 8; targetIcon = '❄️'; }
      else if (campaign.id === 'camp_004') { targetZoom = 10; targetIcon = '🌿'; }
      else if (campaign.id === 'camp_005') { targetZoom = 11; targetIcon = '🔔'; }
    }

    // Fecha a gaveta lateral para visão desobstruída
    if (this.uiController) {
      this.uiController.closeDrawer();
      this.uiController.closeSearchDropdown();
    }

    // Inicia som de mergulho nas nuvens
    if (this.uiController?.soundFX?.playCloudDive) {
      this.uiController.soundFX.playCloudDive();
    } else if (window.soundFX?.playPortalWhoosh) {
      window.soundFX.playPortalWhoosh();
    }

    // PASSO A: O mapa inicia flyTo contínuo em direção ao país/coordenadas
    this.map.flyTo(targetCoords, targetZoom, {
      animate: true,
      duration: 2.2,
      easeLinearity: 0.25
    });

    // PASSO B: Ativa overlay cinematográfico de nuvens e telemetria
    const cloudOverlay = document.getElementById('cloud-transition-overlay');
    const cloudTitle = document.getElementById('cloud-dive-title');
    const cloudSub = document.getElementById('cloud-dive-sub');

    if (cloudTitle) cloudTitle.textContent = `// MERGULHO: ${targetName} //`;
    if (cloudSub) cloudSub.textContent = `PENETRANDO ATMOSFERA... [${targetCountry}]`;

    if (this.cloudWarpEngine) {
      this.cloudWarpEngine.startWarp(1, {
        title: targetName,
        coords: targetCoords,
        country: targetCountry
      });
    }

    if (cloudOverlay) {
      cloudOverlay.classList.remove('diving-out');
      cloudOverlay.classList.add('active', 'diving-in');
    }

    // PASSO C: Aguarda penetração profunda na atmosfera e camada de nuvens
    await new Promise(r => setTimeout(r, 1200));

    // PASSO D: Prepara camadas táticas locais por baixo do teto de nuvens
    this.globalMarkersGroup.clearLayers();
    this.zoneLayerGroup.clearLayers();
    if (this.nauticalDecorationsLayer) {
      this.nauticalDecorationsLayer.clearLayers();
    }

    const activeCampId = campaign ? campaign.id : 'camp_001';
    this.renderLocalTacticalOverlay(activeCampId);
    this.renderLocalMarkers(activeCampId);

    // Carrega tokens no battlemap se existirem
    if (this.battlemapTokens && campaign) {
      this.battlemapTokens.loadTokensForMap(campaign.map_id);
    }

    // Ajusta o clima do motor atmosférico
    if (this.atmosphericEngine) {
      if (activeCampId === 'camp_002') this.atmosphericEngine.setMode('vilar');
      else if (activeCampId === 'camp_003') this.atmosphericEngine.setMode('artico');
      else if (activeCampId === 'camp_004') this.atmosphericEngine.setMode('selva');
      else if (activeCampId === 'camp_005') this.atmosphericEngine.setMode('floresta');
      else this.atmosphericEngine.setMode('triangulo');
    }

    // Atualiza estado
    this.currentScale = 'local';
    this.currentRpgId = activeCampId;
    this.currentMapId = campaign ? campaign.map_id : 'map_local';

    this.map.setView(targetCoords, targetZoom);
    this.updateNavigationUI();

    // Sincroniza select de campanhas no HUD
    const select = document.getElementById('campaign-filter');
    if (select && select.value !== activeCampId) {
      select.value = activeCampId;
      if (this.uiController) this.uiController.currentCampaignFilter = activeCampId;
    }

    await new Promise(r => setTimeout(r, 400));

    // PASSO E: ROMPIMENTO DO TETO DE NUVENS (Breakout)
    if (cloudOverlay) {
      cloudOverlay.classList.remove('diving-in');
      cloudOverlay.classList.add('diving-out');

      await new Promise(r => setTimeout(r, 750));
      cloudOverlay.classList.remove('active', 'diving-out');
      if (this.cloudWarpEngine) this.cloudWarpEngine.stopWarp();
      this.isTransitioning = false;
    } else {
      if (this.cloudWarpEngine) this.cloudWarpEngine.stopWarp();
      this.isTransitioning = false;
    }

    if (this.uiController?.soundFX) {
      this.uiController.soundFX.playTacticalBeep();
    }

    // Ativa ambiência procedural correspondente ao local de pouso
    if (window.soundboard) {
      window.soundboard.playCampaignAtmosphere(activeCampId);
    }

    // PASSO F: EXIBE O BANNER HOLOGRÁFICO DE CHEGADA PLANETÁRIA
    this.showPlanetaryArrivalCard({
      locationTitle: targetName,
      campaignTitle: campaign ? campaign.title : targetName,
      campaignId: activeCampId,
      coords: targetCoords,
      atmosphere: targetAtmosphere,
      era: targetEra,
      danger: targetDanger,
      narrative: targetNarrative,
      icon: targetIcon
    });
  }

  /* ==========================================================================
     3. BOTÃO DE RETORNO (VOLTAR AO MAPA MÚNDI REAL)
     ========================================================================== */
  async retornarAoMapaMundi() {
    if (this.isTransitioning || this.currentScale === 'global') return;
    this.isTransitioning = true;
    this.dismissPlanetaryArrivalCard();

    // Fecha gaveta se aberta
    if (this.uiController) {
      this.uiController.closeDrawer();
      this.uiController.closeSearchDropdown();
    }

    // Suaviza e cessa ambiência ao ascender para órbita
    if (window.soundboard) {
      window.soundboard.stopAtmosphere();
    }

    // Som de ascensão
    if (this.uiController?.soundFX?.playCloudRise) {
      this.uiController.soundFX.playCloudRise();
    } else if (window.soundFX?.playPortalWhoosh) {
      window.soundFX.playPortalWhoosh();
    }

    const cloudOverlay = document.getElementById('cloud-transition-overlay');
    const cloudTitle = document.getElementById('cloud-dive-title');
    const cloudSub = document.getElementById('cloud-dive-sub');

    if (cloudTitle) cloudTitle.textContent = '// ASCENSÃO ORBITAL //';
    if (cloudSub) cloudSub.textContent = 'RESTAURANDO VISÃO GLOBAL DO MAPA MÚNDI...';

    if (this.cloudWarpEngine) {
      this.cloudWarpEngine.startWarp(-1, {
        title: 'ÓRBITA PLANETÁRIA',
        coords: this.worldCenter
      });
    }

    if (cloudOverlay) {
      cloudOverlay.classList.remove('diving-out');
      cloudOverlay.classList.add('active', 'diving-in');
    }

    this.map.flyTo(this.worldCenter, this.worldZoom, {
      animate: true,
      duration: 1.8,
      easeLinearity: 0.25
    });

    await new Promise(r => setTimeout(r, 900));

    // Remove overlay local e marcadores locais
    if (this.localTacticalOverlay) {
      this.map.removeLayer(this.localTacticalOverlay);
      this.localTacticalOverlay = null;
    }
    this.localMarkersGroup.clearLayers();
    if (this.battlemapTokens) {
      this.battlemapTokens.clearAllTokens();
    }

    // Restaura Triângulo das Bermudas, Rótulos Oceânicos e Grandes Marcadores
    this.renderBermudaTriangle();
    this.renderOceanCartographyLabels();
    this.renderGlobalCampaignMarkers();

    // Restaura o clima do motor atmosférico para Global
    if (this.atmosphericEngine) {
      this.atmosphericEngine.setMode('global');
    }

    this.currentScale = 'global';
    this.currentRpgId = null;
    this.currentMapId = 'map_world';

    this.updateNavigationUI();

    // Reseta select de campanhas no HUD
    const select = document.getElementById('campaign-filter');
    if (select) {
      select.value = 'all';
      if (this.uiController) this.uiController.currentCampaignFilter = 'all';
    }

    await new Promise(r => setTimeout(r, 300));

    if (cloudOverlay) {
      cloudOverlay.classList.remove('diving-in');
      cloudOverlay.classList.add('diving-out');

      await new Promise(r => setTimeout(r, 700));
      cloudOverlay.classList.remove('active', 'diving-out');
      if (this.cloudWarpEngine) this.cloudWarpEngine.stopWarp();
      this.isTransitioning = false;
    } else {
      if (this.cloudWarpEngine) this.cloudWarpEngine.stopWarp();
      this.isTransitioning = false;
    }

    if (this.uiController?.soundFX) {
      this.uiController.soundFX.playTacticalBeep();
    }
  }

  showPlanetaryArrivalCard(target) {
    const card = document.getElementById('planetary-arrival-card');
    if (!card) return;

    const locationTitleEl = document.getElementById('arrival-location-title');
    const campaignNameEl = document.getElementById('arrival-campaign-name');
    const eraBadgeEl = document.getElementById('arrival-era-badge');
    const coordsEl = document.getElementById('arrival-coordinates');
    const atmosphereEl = document.getElementById('arrival-atmosphere');
    const dangerEl = document.getElementById('arrival-danger');
    const narrativeEl = document.getElementById('arrival-narrative');
    const iconWrap = document.getElementById('arrival-location-icon');

    if (locationTitleEl) locationTitleEl.textContent = target.locationTitle || target.title || 'LOCAL DO RPG';
    if (campaignNameEl) campaignNameEl.textContent = target.campaignTitle || target.title || '';
    if (eraBadgeEl) eraBadgeEl.textContent = target.era || 'HISTÓRIA SALVA NO ARQUIVO';
    if (coordsEl && target.coords) {
      const lat = target.coords[0].toFixed(4);
      const lng = target.coords[1].toFixed(4);
      coordsEl.textContent = `📍 ${lat}°${target.coords[0] >= 0 ? 'N' : 'S'}, ${lng}°${target.coords[1] >= 0 ? 'E' : 'W'}`;
    }
    if (atmosphereEl) atmosphereEl.textContent = `🌩️ Atmosfera: ${target.atmosphere || 'Estável'}`;
    if (dangerEl) dangerEl.textContent = `⚠️ Ameaça: ${target.danger || 'ÁREA CLASSIFICADA'}`;
    if (narrativeEl) narrativeEl.textContent = target.narrative || target.description || 'Memória arquivada deste local.';
    if (iconWrap) iconWrap.textContent = target.icon || '📍';

    this.currentArrivalTarget = target;
    card.classList.add('visible');

    if (this.arrivalCardTimer) clearTimeout(this.arrivalCardTimer);
    this.arrivalCardTimer = setTimeout(() => {
      this.dismissPlanetaryArrivalCard();
    }, 7500);
  }

  dismissPlanetaryArrivalCard() {
    if (this.arrivalCardTimer) {
      clearTimeout(this.arrivalCardTimer);
      this.arrivalCardTimer = null;
    }
    const card = document.getElementById('planetary-arrival-card');
    if (card) {
      card.classList.remove('visible');
    }
  }

  /* ==========================================================================
     4. OVERLAYS TÁTICOS LOCAIS E MARCADORES ESPECÍFICOS
     ========================================================================== */
  renderLocalTacticalOverlay(campaignId) {
    if (this.localTacticalOverlay) {
      this.map.removeLayer(this.localTacticalOverlay);
      this.localTacticalOverlay = null;
    }

    if (campaignId === 'camp_002') {
      // OVERLAY DA MANSÃO VILAR ANCORADO NO MÉXICO [21.70, -102.42] até [21.98, -102.08]
      const bounds = [[21.70, -102.42], [21.98, -102.08]];
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 1600 1000");
      svg.setAttribute("class", "battlemap-interactive-container");

      svg.innerHTML = `
        <defs>
          <!-- Padrão de Tábuas de Madeira Estilo Taverna / Casarão (Imagem 1) -->
          <pattern id="woodPlankPattern" width="60" height="24" patternUnits="userSpaceOnUse">
            <rect width="60" height="24" fill="#5c3818"/>
            <line x1="0" y1="24" x2="60" y2="24" stroke="#3d230d" stroke-width="2"/>
            <line x1="30" y1="0" x2="30" y2="12" stroke="#3d230d" stroke-width="1.5"/>
            <line x1="60" y1="12" x2="60" y2="24" stroke="#3d230d" stroke-width="1.5"/>
            <circle cx="6" cy="6" r="1.2" fill="#291506"/>
            <circle cx="36" cy="18" r="1.2" fill="#291506"/>
          </pattern>

          <!-- Padrão de Pavimento de Pedra das Minas e Pátio -->
          <pattern id="stonePavingPattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="#303531"/>
            <path d="M0 20 h40 M20 0 v40 M0 0 l20 20 M20 20 l20 20" stroke="#1d221e" stroke-width="1.5" fill="none"/>
          </pattern>

          <!-- Grid RPG Tático 5ft -->
          <pattern id="tacticalGridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="none" stroke="rgba(255, 255, 255, 0.07)" stroke-width="1"/>
          </pattern>

          <!-- Gradiente de Iluminação da Lareira (Hearth Fire Glow) -->
          <radialGradient id="hearthLightGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffb74d" stop-opacity="0.85"/>
            <stop offset="35%" stop-color="#ff7043" stop-opacity="0.55"/>
            <stop offset="70%" stop-color="#d84315" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#2d1205" stop-opacity="0"/>
          </radialGradient>

          <!-- Gradiente do Portal LIMIAR de Gabriel Vilar -->
          <radialGradient id="limiarSingularityGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>
            <stop offset="25%" stop-color="#00e5ff" stop-opacity="0.9"/>
            <stop offset="60%" stop-color="#9c27b0" stop-opacity="0.7"/>
            <stop offset="100%" stop-color="#040b17" stop-opacity="0"/>
          </radialGradient>

          <!-- Gradiente do Poço de Água da Cascata (Imagem 2) -->
          <radialGradient id="waterfallPoolGrad" cx="45%" cy="55%" r="60%">
            <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.95"/>
            <stop offset="40%" stop-color="#0891b2" stop-opacity="0.85"/>
            <stop offset="80%" stop-color="#0e4e66" stop-opacity="0.95"/>
            <stop offset="100%" stop-color="#062230" stop-opacity="1"/>
          </radialGradient>
        </defs>

        <!-- 1. Terreno Base da Serra Mineradora Mexicana -->
        <rect width="1600" height="1000" fill="#141a15"/>

        <!-- ====================================================================
             SETOR ESQUERDO: AS MINAS ANTIGAS & CASCATA (ESTILO IMAGEM 2)
             ==================================================================== -->
        <!-- Encostas Rochosas e Paredões de Pedra Escalonados -->
        <polygon points="40,60 480,40 520,380 410,480 320,490 280,380 70,390" fill="#383935" stroke="#252623" stroke-width="4"/>
        <polygon points="60,90 450,70 480,350 380,420 100,430" fill="#4d4e48" stroke="#33342f" stroke-width="2"/>
        <polygon points="50,490 310,490 340,940 30,960" fill="#2d2e2b" stroke="#1d1e1c" stroke-width="4"/>

        <!-- Degraus e Escadarias de Pedra Esculpidas no Penhasco (Imagem 2) -->
        <g stroke="#6e6a5f" stroke-width="3" fill="#45443e">
          <rect x="290" y="370" width="40" height="8" rx="1"/>
          <rect x="290" y="382" width="40" height="8" rx="1"/>
          <rect x="290" y="394" width="40" height="8" rx="1"/>
          <rect x="290" y="406" width="40" height="8" rx="1"/>
          <rect x="290" y="418" width="40" height="8" rx="1"/>
          <rect x="290" y="430" width="40" height="8" rx="1"/>
          <rect x="290" y="442" width="40" height="8" rx="1"/>
        </g>

        <!-- A Garganta do Desfiladeiro e o Rio Turquesa (Imagem 2) -->
        <path d="M 330,40 Q 360,240 340,430 Q 320,530 380,680 Q 420,810 390,980 L 580,980 Q 560,780 500,640 Q 450,500 480,340 Q 490,180 460,40 Z" fill="#0a3344"/>
        
        <!-- Poço Profundo da Cascata com Água Cristalina Turquesa -->
        <ellipse cx="440" cy="740" rx="130" ry="90" fill="url(#waterfallPoolGrad)"/>

        <!-- A Cascata Rugidora com Linhas Animadas de Correnteza -->
        <g stroke="#ffffff" stroke-width="3" opacity="0.85" class="waterfall-stream">
          <line x1="350" y1="360" x2="350" y2="470"/>
          <line x1="365" y1="350" x2="368" y2="480"/>
          <line x1="380" y1="355" x2="385" y2="490"/>
          <line x1="395" y1="350" x2="400" y2="485"/>
          <line x1="410" y1="365" x2="415" y2="475"/>
        </g>
        <ellipse cx="380" cy="485" rx="45" ry="15" fill="#e0f7fa" opacity="0.75"/>

        <!-- Ponte em Arco de Pedra sobre a Garganta (Imagem 2) -->
        <rect x="310" y="525" width="180" height="20" fill="rgba(0, 0, 0, 0.45)"/>
        <path d="M 300,505 L 500,505 L 500,545 L 300,545 Z" fill="#54524c" stroke="#2a2926" stroke-width="3"/>
        <path d="M 350,545 Q 400,515 450,545 Z" fill="#0a3344" stroke="#222" stroke-width="2"/>
        <rect x="300" y="505" width="200" height="40" fill="url(#stonePavingPattern)" opacity="0.65"/>
        <line x1="300" y1="504" x2="500" y2="504" stroke="#7a766c" stroke-width="4"/>
        <line x1="300" y1="545" x2="500" y2="545" stroke="#7a766c" stroke-width="4"/>
        <circle cx="310" cy="504" r="4" fill="#a39f93"/>
        <circle cx="400" cy="504" r="4" fill="#a39f93"/>
        <circle cx="490" cy="504" r="4" fill="#a39f93"/>
        <circle cx="310" cy="545" r="4" fill="#a39f93"/>
        <circle cx="400" cy="545" r="4" fill="#a39f93"/>
        <circle cx="490" cy="545" r="4" fill="#a39f93"/>

        <!-- Doca de Madeira e O Barquinho a Remo Amarrado (Imagem 2) -->
        <rect x="490" y="700" width="70" height="28" fill="#5a371a" stroke="#2d1b0d" stroke-width="2"/>
        <line x1="490" y1="707" x2="560" y2="707" stroke="#331e0e"/>
        <line x1="490" y1="714" x2="560" y2="714" stroke="#331e0e"/>
        <line x1="490" y1="721" x2="560" y2="721" stroke="#331e0e"/>
        <circle cx="495" cy="714" r="3" fill="#1b0f07"/>
        <g transform="translate(485, 745) rotate(18)">
          <line x1="20" y1="-15" x2="10" y2="0" stroke="#c2a649" stroke-width="2"/>
          <path d="M 0,0 Q 25,-12 50,0 Q 42,22 25,22 Q 8,22 0,0 Z" fill="#6d4323" stroke="#361f0e" stroke-width="2.5"/>
          <rect x="12" y="3" width="6" height="14" fill="#9c6338"/>
          <rect x="32" y="3" width="6" height="14" fill="#9c6338"/>
          <line x1="16" y1="-10" x2="28" y2="10" stroke="#d7ccc8" stroke-width="2"/>
          <line x1="16" y1="28" x2="28" y2="10" stroke="#d7ccc8" stroke-width="2"/>
        </g>

        <!-- Entrada das Minas Antigas dos Ecos & Trilhos de Ferrovia -->
        <g transform="translate(100, 680)">
          <path d="M 0,90 Q 0,0 70,0 Q 140,0 140,90 Z" fill="#040608" stroke="#1d1e1c" stroke-width="4"/>
          <rect x="-8" y="-4" width="16" height="96" fill="#4e2c14" stroke="#251307" stroke-width="2"/>
          <rect x="132" y="-4" width="16" height="96" fill="#4e2c14" stroke="#251307" stroke-width="2"/>
          <rect x="-14" y="-8" width="168" height="18" fill="#5d3418" stroke="#251307" stroke-width="2"/>
          <!-- Ecos e Olhos Ocultos na Escuridão da Mina -->
          <circle cx="60" cy="45" r="2.5" fill="#00e5ff" opacity="0.85"/>
          <circle cx="75" cy="45" r="2.5" fill="#00e5ff" opacity="0.85"/>
          <circle cx="95" cy="55" r="2" fill="#e74c3c" opacity="0.8"/>
          <circle cx="106" cy="55" r="2" fill="#e74c3c" opacity="0.8"/>
          <!-- Trilhos de Ferrovia Saindo da Mina -->
          <g stroke="#3a1f0a" stroke-width="5">
            <line x1="30" y1="92" x2="110" y2="92"/>
            <line x1="40" y1="110" x2="120" y2="110"/>
            <line x1="55" y1="130" x2="135" y2="130"/>
            <line x1="75" y1="150" x2="155" y2="150"/>
            <line x1="100" y1="170" x2="180" y2="170"/>
            <line x1="130" y1="185" x2="210" y2="185"/>
            <line x1="165" y1="195" x2="245" y2="195"/>
          </g>
          <path d="M 50,85 Q 90,140 185,190" fill="none" stroke="#90a4ae" stroke-width="3"/>
          <path d="M 90,85 Q 130,140 225,190" fill="none" stroke="#90a4ae" stroke-width="3"/>
        </g>

        <!-- Pinheiros Frondosos e Vegetação Alpina (Estilo 16-bit / Imagem 2) -->
        <g fill="#1b4d27" stroke="#0d2b15" stroke-width="2">
          <path d="M 80,180 L 110,120 L 140,180 L 125,180 L 150,230 L 70,230 L 95,180 Z"/>
          <path d="M 90,140 L 110,100 L 130,140 Z" fill="#2d733d"/>
          <path d="M 140,210 L 170,140 L 200,210 L 185,210 L 210,260 L 130,260 L 155,210 Z"/>
          <path d="M 150,170 L 170,120 L 190,170 Z" fill="#2d733d"/>
          <path d="M 230,140 L 260,80 L 290,140 L 275,140 L 300,190 L 220,190 Z"/>
          <path d="M 245,100 L 260,60 L 275,100 Z" fill="#399650"/>
          <path d="M 250,780 L 280,700 L 310,780 L 295,780 L 325,840 L 235,840 Z"/>
          <path d="M 265,730 L 280,680 L 295,730 Z" fill="#2d733d"/>
          <path d="M 70,890 L 100,810 L 130,890 L 115,890 L 145,950 L 55,950 Z"/>
        </g>

        <!-- Caminho de Pedra Central Ligando a Ponte ao Casarão -->
        <path d="M 500,525 Q 640,515 820,530" fill="none" stroke="#484a44" stroke-width="26" stroke-linecap="round"/>
        <path d="M 500,525 Q 640,515 820,530" fill="none" stroke="#686a62" stroke-width="18" stroke-dasharray="14 8" stroke-linecap="round"/>

        <!-- ====================================================================
             SETOR DIREITO: O CASARÃO VILAR (PLANTA INTERNA - ESTILO IMAGEM 1)
             ==================================================================== -->
        <rect x="820" y="100" width="720" height="830" rx="8" fill="#1b1d19" stroke="#33372f" stroke-width="8"/>
        <rect x="836" y="116" width="688" height="564" fill="url(#woodPlankPattern)"/>

        <!-- Iluminação Quente da Lareira sobre o Piso de Madeira -->
        <circle cx="1180" cy="190" r="280" fill="url(#hearthLightGrad)" opacity="0.8"/>

        <!-- A Grande Lareira de Tijolos & Fogo Ardente (Hearth Fireplace - Imagem 1) -->
        <g transform="translate(1100, 108)">
          <rect x="0" y="0" width="160" height="42" fill="#2d1910" stroke="#5d3a24" stroke-width="4"/>
          <rect x="16" y="10" width="128" height="28" fill="#120803"/>
          <rect x="-10" y="38" width="180" height="12" fill="#422817" stroke="#2a170b" stroke-width="2"/>
          <line x1="30" y1="30" x2="130" y2="30" stroke="#2b1406" stroke-width="8"/>
          <g class="hearth-fire-flame">
            <polygon points="50,30 65,12 80,30" fill="#ff5722"/>
            <polygon points="70,30 85,8 100,30" fill="#ff9800"/>
            <polygon points="90,30 105,14 120,30" fill="#ff5722"/>
            <polygon points="75,28 85,14 95,28" fill="#fff59d"/>
          </g>
          <circle cx="85" cy="24" r="16" fill="#ffeb3b" opacity="0.4"/>
        </g>

        <!-- Mesas Longas de Banquete e Cadeiras (Estilo Taverna - Imagem 1) -->
        <!-- Mesa 1 (Norte) -->
        <g transform="translate(890, 260)">
          <rect x="4" y="6" width="180" height="65" rx="4" fill="rgba(0, 0, 0, 0.4)"/>
          <rect x="0" y="0" width="180" height="65" rx="4" fill="#6d3f1c" stroke="#361f0e" stroke-width="3"/>
          <line x1="0" y1="32" x2="180" y2="32" stroke="#48270f" stroke-width="1.5"/>
          <circle cx="30" cy="18" r="8" fill="#d7ccc8" stroke="#8d6e63"/>
          <circle cx="30" cy="18" r="4" fill="#6d4c41"/>
          <circle cx="80" cy="18" r="7" fill="#d7ccc8" stroke="#8d6e63"/>
          <circle cx="130" cy="18" r="8" fill="#d7ccc8" stroke="#8d6e63"/>
          <circle cx="130" cy="18" r="4" fill="#6d4c41"/>
          <circle cx="48" cy="16" r="4.5" fill="#ffb74d" stroke="#bf360c" stroke-width="1.5"/>
          <circle cx="98" cy="16" r="4.5" fill="#ffb74d" stroke="#bf360c" stroke-width="1.5"/>
          <rect x="10" y="-18" width="160" height="12" rx="2" fill="#522f15" stroke="#261407" stroke-width="2"/>
          <rect x="10" y="70" width="160" height="12" rx="2" fill="#522f15" stroke="#261407" stroke-width="2"/>
        </g>

        <!-- Mesa 2 (Sul) -->
        <g transform="translate(890, 420)">
          <rect x="4" y="6" width="180" height="65" rx="4" fill="rgba(0, 0, 0, 0.4)"/>
          <rect x="0" y="0" width="180" height="65" rx="4" fill="#6d3f1c" stroke="#361f0e" stroke-width="3"/>
          <line x1="0" y1="32" x2="180" y2="32" stroke="#48270f" stroke-width="1.5"/>
          <rect x="25" y="12" width="22" height="30" fill="#fff8e1" stroke="#bcaaa4" transform="rotate(-8 35 25)"/>
          <rect x="65" y="15" width="28" height="20" fill="#efebe9" stroke="#bcaaa4" transform="rotate(12 75 25)"/>
          <circle cx="130" cy="32" r="9" fill="#d7ccc8" stroke="#8d6e63"/>
          <circle cx="148" cy="24" r="5" fill="#ffb74d" stroke="#bf360c" stroke-width="1.5"/>
          <rect x="10" y="-18" width="160" height="12" rx="2" fill="#522f15" stroke="#261407" stroke-width="2"/>
          <rect x="10" y="70" width="160" height="12" rx="2" fill="#522f15" stroke="#261407" stroke-width="2"/>
        </g>

        <!-- Balcão da Taverna / Bar em L com Barris de Carvalho (Imagem 1) -->
        <g transform="translate(1220, 270)">
          <path d="M 0,0 L 160,0 L 160,140 L 120,140 L 120,40 L 0,40 Z" fill="#553014" stroke="#2a1708" stroke-width="4"/>
          <path d="M 4,4 L 156,4 L 156,136 L 124,136 L 124,44 L 4,44 Z" fill="#804921"/>
          <circle cx="20" cy="62" r="11" fill="#42250f" stroke="#1d0f05" stroke-width="2"/>
          <circle cx="60" cy="62" r="11" fill="#42250f" stroke="#1d0f05" stroke-width="2"/>
          <circle cx="100" cy="62" r="11" fill="#42250f" stroke="#1d0f05" stroke-width="2"/>
          <circle cx="142" cy="160" r="11" fill="#42250f" stroke="#1d0f05" stroke-width="2"/>
          <rect x="70" y="10" width="30" height="20" fill="#fff9c4" stroke="#8d6e63"/>
          <line x1="85" y1="10" x2="85" y2="30" stroke="#795548"/>
          <!-- Barris de Madeira Atrás do Balcão -->
          <g transform="translate(20, -50)">
            <ellipse cx="20" cy="20" rx="16" ry="12" fill="#6d421d" stroke="#311c0a" stroke-width="2"/>
            <line x1="8" y1="20" x2="32" y2="20" stroke="#1f1105" stroke-width="2"/>
            <ellipse cx="60" cy="20" rx="16" ry="12" fill="#6d421d" stroke="#311c0a" stroke-width="2"/>
            <line x1="48" y1="20" x2="72" y2="20" stroke="#1f1105" stroke-width="2"/>
            <ellipse cx="100" cy="20" rx="16" ry="12" fill="#6d421d" stroke="#311c0a" stroke-width="2"/>
            <line x1="88" y1="20" x2="112" y2="20" stroke="#1f1105" stroke-width="2"/>
          </g>
        </g>

        <!-- Escadaria de Madeira para o Andar Superior / Minas (Imagem 1) -->
        <g transform="translate(1420, 130)">
          <rect x="0" y="0" width="80" height="110" fill="#38210f" stroke="#1d1107" stroke-width="3"/>
          <line x1="0" y1="18" x2="80" y2="18" stroke="#5d391d" stroke-width="3"/>
          <line x1="0" y1="36" x2="80" y2="36" stroke="#5d391d" stroke-width="3"/>
          <line x1="0" y1="54" x2="80" y2="54" stroke="#5d391d" stroke-width="3"/>
          <line x1="0" y1="72" x2="80" y2="72" stroke="#5d391d" stroke-width="3"/>
          <line x1="0" y1="90" x2="80" y2="90" stroke="#5d391d" stroke-width="3"/>
          <line x1="6" y1="0" x2="6" y2="110" stroke="#8d5b32" stroke-width="4"/>
          <text x="40" y="60" fill="#d7ccc8" font-family="monospace" font-size="10" text-anchor="middle" transform="rotate(90 40 60)">▲ SUBIDA</text>
        </g>

        <!-- Divisória Interna e Portão Blindado para a Ala do LIMIAR -->
        <line x1="820" y1="680" x2="1540" y2="680" stroke="#42473d" stroke-width="12"/>
        <line x1="1140" y1="680" x2="1140" y2="920" stroke="#42473d" stroke-width="12"/>
        <rect x="1100" y="674" width="70" height="12" fill="#ffd700" stroke="#b78103" stroke-width="2"/>

        <!-- ALA SUL: O LABORATÓRIO SECRETO DO LIMIAR DE GABRIEL VILAR -->
        <rect x="1146" y="686" width="378" height="238" fill="#07121e"/>
        <rect x="1146" y="686" width="378" height="238" fill="url(#tacticalGridPattern)"/>

        <!-- Bancadas Tecnológicas e Geradores de Energia Oculta -->
        <rect x="1160" y="700" width="60" height="120" fill="#1b2a3a" stroke="#00e5ff" stroke-width="2"/>
        <line x1="1170" y1="710" x2="1210" y2="710" stroke="#39ff14" stroke-width="2"/>
        <line x1="1170" y1="720" x2="1195" y2="720" stroke="#39ff14" stroke-width="2"/>
        <path d="M 1220,760 Q 1280,780 1320,800" fill="none" stroke="#ffeb3b" stroke-width="3" stroke-dasharray="6 3"/>
        <path d="M 1220,770 Q 1270,800 1310,815" fill="none" stroke="#00e5ff" stroke-width="3"/>

        <!-- O PORTAL DO LIMIAR (A ARMA DE GABRIEL VILAR) -->
        <g transform="translate(1360, 810)">
          <circle cx="0" cy="0" r="100" fill="url(#limiarSingularityGrad)"/>
          <circle cx="0" cy="0" r="64" fill="none" stroke="#00e5ff" stroke-width="3" stroke-dasharray="14 8" class="limiar-portal-ring"/>
          <circle cx="0" cy="0" r="50" fill="none" stroke="#9c27b0" stroke-width="2.5" stroke-dasharray="8 6" style="animation: limiar-rift-spin 6s linear infinite reverse;"/>
          <circle cx="0" cy="0" r="28" fill="#00e5ff" class="limiar-core-pulsing"/>
          <circle cx="0" cy="0" r="12" fill="#ffffff"/>
          <circle cx="-70" cy="0" r="7" fill="#37474f" stroke="#00e5ff" stroke-width="2"/>
          <circle cx="70" cy="0" r="7" fill="#37474f" stroke="#00e5ff" stroke-width="2"/>
          <circle cx="0" cy="-70" r="7" fill="#37474f" stroke="#9c27b0" stroke-width="2"/>
          <circle cx="0" cy="70" r="7" fill="#37474f" stroke="#9c27b0" stroke-width="2"/>
        </g>

        <!-- Ala Médica / Prisão de Confissão (Esquerda da Ala Sul) -->
        <rect x="836" y="686" width="298" height="238" fill="#121816"/>
        <g stroke="#37474f" stroke-width="3" fill="none">
          <line x1="840" y1="780" x2="1130" y2="780"/>
          <line x1="880" y1="780" x2="880" y2="920"/>
          <line x1="930" y1="780" x2="930" y2="920"/>
          <line x1="980" y1="780" x2="980" y2="920"/>
          <line x1="1030" y1="780" x2="1030" y2="920"/>
          <line x1="1080" y1="780" x2="1080" y2="920"/>
        </g>
        <rect x="945" y="825" width="28" height="28" fill="#4e342e" stroke="#271813" stroke-width="2"/>
        <circle cx="959" cy="839" r="6" fill="#e74c3c" opacity="0.8"/>

        <!-- Grid Global Tático Sobreposto para Posicionamento de Tokens -->
        <rect x="820" y="100" width="720" height="830" fill="url(#tacticalGridPattern)" pointer-events="none"/>

        <!-- ====================================================================
             ETIQUETAS CARTOGRÁFICAS & NOMENCLATURA TÁTICA (HUD BATTLEMAP)
             ==================================================================== -->
        <rect x="840" y="125" width="220" height="26" fill="rgba(8, 18, 30, 0.88)" stroke="#ffd700" stroke-width="1.5" rx="3"/>
        <text x="850" y="142" fill="#ffd700" font-family="'Cinzel', Georgia, serif" font-size="11" font-weight="bold" letter-spacing="1">O CASARÃO VILAR // TAVERNA</text>

        <text x="1180" y="85" fill="#ffb74d" font-family="monospace" font-size="11" text-anchor="middle" letter-spacing="1">🔥 LAREIRA DE PEDRA & FOGO ARDENTE</text>

        <rect x="60" y="645" width="210" height="26" fill="rgba(6, 16, 26, 0.9)" stroke="#00e5ff" stroke-width="1.5" rx="3"/>
        <text x="70" y="662" fill="#00e5ff" font-family="'Cinzel', Georgia, serif" font-size="11" font-weight="bold" letter-spacing="1">AS MINAS DOS ECOS & TÚNEIS</text>

        <rect x="360" y="700" width="120" height="22" fill="rgba(8, 20, 32, 0.85)" stroke="#22d3ee" stroke-width="1" rx="2"/>
        <text x="370" y="715" fill="#22d3ee" font-family="monospace" font-size="10">⛵ DOCA & BARCO</text>

        <rect x="1230" y="930" width="260" height="26" fill="rgba(4, 10, 20, 0.92)" stroke="#a855f7" stroke-width="1.5" rx="3"/>
        <text x="1240" y="947" fill="#c084fc" font-family="monospace" font-size="11" font-weight="bold" letter-spacing="1">⚡ DISPOSITIVO DE PORTAIS: LIMIAR</text>
      `;

      this.localTacticalOverlay = L.svgOverlay(svg, bounds, { opacity: 0.96, interactive: false });
      this.localTacticalOverlay.addTo(this.map);
    } else if (campaignId === 'camp_003') {
      // OVERLAY DA ESTAÇÃO CRIOGÊNICA ZERO (CAMP_003) ANCORADO NA GROENLÂNDIA
      const bounds = [[71.0, -42.0], [73.0, -38.0]];
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 1600 1000");
      svg.setAttribute("class", "battlemap-interactive-container");

      svg.innerHTML = `
        <defs>
          <linearGradient id="permafrostGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#040b14"/>
            <stop offset="50%" stop-color="#0a1a2c"/>
            <stop offset="100%" stop-color="#05101c"/>
          </linearGradient>

          <radialGradient id="cryoPodGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#00e5ff" stop-opacity="0.9"/>
            <stop offset="60%" stop-color="#0077b6" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#021020" stop-opacity="0"/>
          </radialGradient>

          <radialGradient id="monolithAbyssGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#b432ff" stop-opacity="0.8"/>
            <stop offset="40%" stop-color="#4a0e4e" stop-opacity="0.5"/>
            <stop offset="85%" stop-color="#02050a" stop-opacity="0.95"/>
            <stop offset="100%" stop-color="#010306" stop-opacity="1"/>
          </radialGradient>

          <pattern id="icePavingPattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="#132130"/>
            <path d="M0 0 L40 40 M40 0 L0 40" stroke="#0b1520" stroke-width="1.5" fill="none"/>
            <circle cx="20" cy="20" r="1.5" fill="#00e5ff" opacity="0.3"/>
          </pattern>
        </defs>

        <!-- Fundo de Gelo Milenar e Permafrost -->
        <rect width="1600" height="1000" fill="url(#permafrostGrad)"/>

        <!-- ====================================================================
             SETOR ESQUERDO: LABORATÓRIO CRIOGÊNICO ZERO (AEGIS)
             ==================================================================== -->
        <!-- Fundação Blindada da Estação Subterrânea -->
        <rect x="80" y="80" width="700" height="840" rx="8" fill="#16222f" stroke="#00e5ff" stroke-width="3"/>
        <rect x="90" y="90" width="680" height="820" fill="url(#icePavingPattern)" opacity="0.8"/>

        <!-- Corredor Central de Descontaminação e Portas Herméticas -->
        <rect x="360" y="80" width="140" height="840" fill="#0c1520" stroke="#22d3ee" stroke-width="2"/>
        <line x1="360" y1="280" x2="500" y2="280" stroke="#ffd700" stroke-width="4" stroke-dasharray="8 4"/>
        <line x1="360" y1="520" x2="500" y2="520" stroke="#ffd700" stroke-width="4" stroke-dasharray="8 4"/>
        <line x1="360" y1="740" x2="500" y2="740" stroke="#ffd700" stroke-width="4" stroke-dasharray="8 4"/>

        <!-- Câmara de Quarentena Nível 4: 4 Cápsulas Criogênicas Cilíndricas -->
        <g transform="translate(140, 160)">
          <!-- Cápsula 1 (Ativa) -->
          <rect x="0" y="0" width="80" height="140" rx="20" fill="#040e1a" stroke="#00e5ff" stroke-width="2.5"/>
          <ellipse cx="40" cy="70" rx="25" ry="50" fill="url(#cryoPodGlow)"/>
          <text x="40" y="130" fill="#00e5ff" font-family="monospace" font-size="10" text-anchor="middle">ESPÉCIME α</text>

          <!-- Cápsula 2 (Ativa) -->
          <rect x="120" y="0" width="80" height="140" rx="20" fill="#040e1a" stroke="#00e5ff" stroke-width="2.5"/>
          <ellipse cx="160" cy="70" rx="25" ry="50" fill="url(#cryoPodGlow)"/>
          <text x="160" y="130" fill="#00e5ff" font-family="monospace" font-size="10" text-anchor="middle">ESPÉCIME β</text>

          <!-- Cápsula 3 (ROMPEU / ESTILHAÇADA) -->
          <rect x="0" y="220" width="80" height="140" rx="20" fill="#040e1a" stroke="#ff2a4b" stroke-width="2.5" stroke-dasharray="6 4"/>
          <!-- Rastro de Sangue Negro Congelado no Chão -->
          <path d="M 40,320 Q 80,380 140,420 Q 200,440 280,430" stroke="#03080e" stroke-width="12" fill="none" opacity="0.9"/>
          <path d="M 40,320 Q 80,380 140,420 Q 200,440 280,430" stroke="#8b0000" stroke-width="4" fill="none" opacity="0.8"/>
          <text x="40" y="350" fill="#ff2a4b" font-family="monospace" font-size="10" text-anchor="middle">BRECHA // FUGIU</text>

          <!-- Cápsula 4 (Estabilizada) -->
          <rect x="120" y="220" width="80" height="140" rx="20" fill="#040e1a" stroke="#00e5ff" stroke-width="2.5"/>
          <ellipse cx="160" cy="290" rx="25" ry="50" fill="url(#cryoPodGlow)"/>
          <text x="160" y="350" fill="#00e5ff" font-family="monospace" font-size="10" text-anchor="middle">ESPÉCIME δ</text>
        </g>

        <!-- Luz de Alarme Estroboscópica da Estação -->
        <circle cx="430" cy="180" r="16" fill="#ff2a4b" opacity="0.85" style="animation: pulseCatastrofe 0.8s infinite alternate;"/>
        <circle cx="430" cy="400" r="16" fill="#ff2a4b" opacity="0.85" style="animation: pulseCatastrofe 0.8s infinite alternate;"/>

        <!-- Sala de Controle com Monitores de Bio-Telemetria -->
        <rect x="140" y="660" width="180" height="180" fill="#081422" stroke="#00e5ff" stroke-width="2" rx="4"/>
        <rect x="160" y="680" width="60" height="40" fill="#020810" stroke="#39ff14" stroke-width="1.5"/>
        <path d="M 165,700 L 175,690 L 185,710 L 195,695 L 215,700" stroke="#39ff14" stroke-width="1.5" fill="none"/>
        <rect x="235" y="680" width="60" height="40" fill="#020810" stroke="#00e5ff" stroke-width="1.5"/>
        <text x="240" y="705" fill="#00e5ff" font-family="monospace" font-size="9">MDA: 88%</text>

        <!-- Rótulo Tático da Estação -->
        <rect x="100" y="100" width="340" height="26" fill="rgba(6, 16, 26, 0.94)" stroke="#00e5ff" stroke-width="1.5" rx="3"/>
        <text x="110" y="117" fill="#00e5ff" font-family="'Cinzel', Georgia, serif" font-size="11" font-weight="bold">ESTAÇÃO CRIOGÊNICA ZERO // QUARENTENA</text>

        <!-- ====================================================================
             SETOR DIREITO: A FENDA DO MONÓLITO DE GELO NEGRO
             ==================================================================== -->
        <!-- A Grande Garganta Glacial (Fissura Subglacial) -->
        <path d="M 880,40 Q 950,300 920,540 Q 900,750 960,960 L 1540,960 Q 1480,720 1520,460 Q 1550,220 1500,40 Z" fill="#02060c" stroke="#00e5ff" stroke-width="2"/>
        
        <!-- Fenda Central com Gradiente Abissal -->
        <ellipse cx="1240" cy="500" rx="240" ry="380" fill="url(#monolithAbyssGrad)"/>

        <!-- O Monólito Espiralado de Gelo Negro (Origem da Mutação) -->
        <g transform="translate(1240, 500)">
          <!-- Estrutura Obelisca com Cristais de Gelo Negro -->
          <polygon points="0,-180 45,-60 60,160 0,220 -60,160 -45,-60" fill="#020508" stroke="#b432ff" stroke-width="3"/>
          <line x1="0" y1="-180" x2="0" y2="220" stroke="#00e5ff" stroke-width="2"/>
          <line x1="-45" y1="-60" x2="45" y2="-60" stroke="#b432ff" stroke-width="1.5"/>
          <line x1="-60" y1="60" x2="60" y2="60" stroke="#00e5ff" stroke-width="1.5"/>
          <!-- Runa e Núcleo Bioluminescente -->
          <circle cx="0" cy="0" r="18" fill="#b432ff" stroke="#00e5ff" stroke-width="2" style="animation: pulseCatastrofe 1.2s infinite alternate;"/>
        </g>

        <!-- Guindaste e Plataforma de Perfuração Industrial da AEGIS -->
        <rect x="860" y="320" width="80" height="30" fill="#37474f" stroke="#263238" stroke-width="2"/>
        <line x1="900" y1="320" x2="1000" y2="240" stroke="#78909c" stroke-width="4"/>
        <line x1="1000" y1="240" x2="1000" y2="380" stroke="#cfd8dc" stroke-width="2" stroke-dasharray="4 2"/>

        <!-- Rótulo Tático do Monólito -->
        <rect x="1080" y="100" width="340" height="26" fill="rgba(10, 4, 18, 0.94)" stroke="#b432ff" stroke-width="1.5" rx="3"/>
        <text x="1090" y="117" fill="#d187ff" font-family="'Cinzel', Georgia, serif" font-size="11" font-weight="bold">O MONÓLITO DE GELO NEGRO // FENDA POLAR</text>
      `;

      this.localTacticalOverlay = L.svgOverlay(svg, bounds, { opacity: 0.96, interactive: false });
      this.localTacticalOverlay.addTo(this.map);
    } else if (campaignId === 'camp_004') {
      // OVERLAY DA BACIA DO TAPAJÓS (CAMP_004) ANCORADO NA AMAZÔNIA BRASILEIRA [-5.5, -57.5] a [-3.0, -54.5]
      const bounds = [[-5.5, -57.5], [-3.0, -54.5]];
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 1600 1000");
      svg.setAttribute("class", "battlemap-interactive-container");

      svg.innerHTML = `
        <defs>
          <radialGradient id="jungleAbyssGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#051f0f" stop-opacity="0.95"/>
            <stop offset="60%" stop-color="#021208" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#010804" stop-opacity="0.8"/>
          </radialGradient>
          <linearGradient id="tapajosRiverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0e3d2f"/>
            <stop offset="50%" stop-color="#144d3b"/>
            <stop offset="100%" stop-color="#0b2e23"/>
          </linearGradient>
        </defs>

        <rect width="1600" height="1000" fill="url(#jungleAbyssGrad)"/>

        <!-- O Rio Tapajós Serpenteante -->
        <path d="M 0,280 Q 320,180 620,380 T 1100,420 T 1600,260" fill="none" stroke="url(#tapajosRiverGrad)" stroke-width="140" stroke-linecap="round"/>
        <path d="M 0,280 Q 320,180 620,380 T 1100,420 T 1600,260" fill="none" stroke="#22d3ee" stroke-width="6" stroke-dasharray="16 12" opacity="0.4"/>

        <!-- Setor 1: Acampamento Base Tático Tapajós -->
        <g transform="translate(240, 520)">
          <rect x="0" y="0" width="380" height="260" rx="8" fill="#081c10" stroke="#39ff14" stroke-width="2"/>
          <polygon points="40,120 100,40 160,120" fill="#1b4324" stroke="#2a6637" stroke-width="2"/>
          <polygon points="180,120 240,40 300,120" fill="#1b4324" stroke="#2a6637" stroke-width="2"/>
          <rect x="60" y="150" width="100" height="70" fill="#102d18" stroke="#39ff14" stroke-width="1.5"/>
          <circle cx="240" cy="180" r="35" fill="#021408" stroke="#39ff14" stroke-width="2"/>
          <text x="240" y="184" fill="#39ff14" font-family="monospace" font-size="10" text-anchor="middle">ANTENA AEGIS</text>
          <rect x="20" y="14" width="320" height="24" fill="rgba(2, 20, 8, 0.9)" stroke="#39ff14" stroke-width="1" rx="3"/>
          <text x="30" y="30" fill="#39ff14" font-family="'Cinzel', Georgia, serif" font-size="11" font-weight="bold">ACAMPAMENTO BASE TAPAJÓS // SETOR CURUPIRA</text>
        </g>

        <!-- Setor 2: A Cratera de Quartzo Negro & Fissura Mutagênica -->
        <g transform="translate(1080, 500)">
          <ellipse cx="0" cy="0" rx="260" ry="200" fill="#030b06" stroke="#39ff14" stroke-width="3" stroke-dasharray="14 8"/>
          <circle cx="0" cy="0" r="140" fill="#08020e" stroke="#c084fc" stroke-width="2"/>
          <polygon points="0,-120 20,-30 80,0 20,30 0,120 -20,30 -80,0 -20,-30" fill="#120422" stroke="#a855f7" stroke-width="2"/>
          <circle cx="0" cy="0" r="22" fill="#39ff14" style="animation: pulseCatastrofe 1s infinite alternate;"/>
          <rect x="-160" y="150" width="320" height="26" fill="rgba(8, 2, 16, 0.94)" stroke="#c084fc" stroke-width="1.5" rx="3"/>
          <text x="-150" y="167" fill="#c084fc" font-family="'Cinzel', Georgia, serif" font-size="11" font-weight="bold">A CRATERA DE QUARTZO NEGRO // FOCO DO ECO</text>
        </g>
      `;

      this.localTacticalOverlay = L.svgOverlay(svg, bounds, { opacity: 0.96, interactive: false });
      this.localTacticalOverlay.addTo(this.map);
    } else if (campaignId === 'camp_005') {
      // OVERLAY DO MONASTÉRIO DOS SEM-ROSTO (CAMP_005) ANCORADO NA FLORESTA NEGRA [[47.8, 7.8], [48.6, 8.6]]
      const bounds = [[47.8, 7.8], [48.6, 8.6]];
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 1600 1000");
      svg.setAttribute("class", "battlemap-interactive-container");

      svg.innerHTML = `
        <defs>
          <radialGradient id="gothicFogGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#180b26" stop-opacity="0.95"/>
            <stop offset="60%" stop-color="#0d0416" stop-opacity="0.92"/>
            <stop offset="100%" stop-color="#050208" stop-opacity="0.85"/>
          </radialGradient>
        </defs>

        <rect width="1600" height="1000" fill="url(#gothicFogGrad)"/>

        <!-- Planta Baixa da Abadia e Claustro Gótico de Friburgo -->
        <g transform="translate(320, 240)">
          <rect x="0" y="0" width="460" height="520" rx="6" fill="#140a20" stroke="#7e57c2" stroke-width="4"/>
          <rect x="180" y="40" width="100" height="440" fill="#231338" stroke="#9575cd" stroke-width="2"/>
          <rect x="60" y="160" width="340" height="90" fill="#231338" stroke="#9575cd" stroke-width="2"/>
          <circle cx="230" cy="90" r="32" fill="#0c0414" stroke="#c084fc" stroke-width="3"/>
          <circle cx="230" cy="90" r="12" fill="#ffd700"/>
          <text x="230" y="145" fill="#c084fc" font-family="monospace" font-size="10" text-anchor="middle">SINO SEM BADALO</text>
          <rect x="20" y="14" width="360" height="24" fill="rgba(12, 4, 22, 0.92)" stroke="#c084fc" stroke-width="1.2" rx="3"/>
          <text x="30" y="30" fill="#c084fc" font-family="'Cinzel', Georgia, serif" font-size="11" font-weight="bold">MONASTÉRIO DE SANTO AGOSTINHO // ABADIA</text>
        </g>

        <!-- A Cripta Subterrânea do Eco Silencioso -->
        <g transform="translate(1050, 480)">
          <rect x="0" y="0" width="380" height="320" rx="8" fill="#0e0618" stroke="#c084fc" stroke-width="3"/>
          <g stroke="#512da8" stroke-width="2" fill="#1d0d33">
            <rect x="40" y="60" width="60" height="90"/>
            <rect x="120" y="60" width="60" height="90"/>
            <rect x="200" y="60" width="60" height="90"/>
            <rect x="280" y="60" width="60" height="90"/>
            <rect x="40" y="180" width="60" height="90"/>
            <rect x="120" y="180" width="60" height="90"/>
            <rect x="200" y="180" width="60" height="90"/>
            <rect x="280" y="180" width="60" height="90"/>
          </g>
          <line x1="20" y1="20" x2="360" y2="300" stroke="#ff2a4b" stroke-width="3" stroke-dasharray="10 6"/>
          <rect x="30" y="270" width="320" height="24" fill="rgba(20, 4, 30, 0.95)" stroke="#ff2a4b" stroke-width="1.5" rx="3"/>
          <text x="40" y="286" fill="#ff6b8b" font-family="monospace" font-size="10" font-weight="bold">CRIPTA DO ECO SILENCIOSO // LACRADA EM CONCRETO</text>
        </g>
      `;

      this.localTacticalOverlay = L.svgOverlay(svg, bounds, { opacity: 0.96, interactive: false });
      this.localTacticalOverlay.addTo(this.map);
    } else {
      // OVERLAY DO TRIÂNGULO DAS BERMUDAS (CAMP_001) ANCORADO NO ATLÂNTICO
      const bounds = [[19.5, -79.5], [29.5, -65.5]];
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 1600 1000");
      svg.setAttribute("class", "battlemap-interactive-container");

      svg.innerHTML = `
        <defs>
          <radialGradient id="trianguloAbyssCenter" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#020813" stop-opacity="0.98"/>
            <stop offset="40%" stop-color="#061c33" stop-opacity="0.9"/>
            <stop offset="75%" stop-color="#0a3258" stop-opacity="0.6"/>
            <stop offset="100%" stop-color="#031122" stop-opacity="0"/>
          </radialGradient>

          <pattern id="nauticalDeckPattern" width="40" height="16" patternUnits="userSpaceOnUse">
            <rect width="40" height="16" fill="#4a3b2c"/>
            <line x1="0" y1="16" x2="40" y2="16" stroke="#2b2117" stroke-width="1.5"/>
            <line x1="20" y1="0" x2="20" y2="16" stroke="#2b2117" stroke-width="1"/>
          </pattern>
        </defs>

        <!-- Fundo Oceânico Profundo -->
        <rect width="1600" height="1000" fill="url(#trianguloAbyssCenter)"/>

        <!-- Espirais Gigantescas do Vórtice Abissal -->
        <g fill="none" stroke="rgba(34, 211, 238, 0.35)" stroke-width="3">
          <ellipse cx="800" cy="500" rx="600" ry="380" stroke-dasharray="16 12" style="animation: maelstrom-spin 25s linear infinite; transform-origin: 800px 500px;"/>
          <ellipse cx="800" cy="500" rx="420" ry="260" stroke-dasharray="12 8" style="animation: maelstrom-spin 16s linear infinite; transform-origin: 800px 500px;"/>
          <ellipse cx="800" cy="500" rx="250" ry="160" stroke-dasharray="8 6" style="animation: maelstrom-spin 9s linear infinite; transform-origin: 800px 500px;"/>
        </g>

        <!-- ====================================================================
             NOVA CARONTE: CIDADELA FLUTUANTE (GALEÕES & SUBMARINO SOVIÉTICO)
             ==================================================================== -->
        <g transform="translate(480, 260)">
          <!-- Casco do Submarino Soviético Classe Victor-III -->
          <path d="M 0,120 Q 140,70 340,90 Q 420,120 400,160 Q 320,190 120,180 Q 20,170 0,120 Z" fill="#20262b" stroke="#101417" stroke-width="4"/>
          <!-- Torre de Comando / Vela do Submarino -->
          <rect x="180" y="90" width="80" height="40" rx="6" fill="#2c343b" stroke="#0e1317" stroke-width="2"/>
          <rect x="220" y="60" width="6" height="30" fill="#78909c"/>
          <polygon points="215,115 220,105 225,115 215,110 225,110" fill="#e74c3c"/>

          <!-- Galeão Espanhol Setecentista Amarrado -->
          <g transform="translate(180, 60) rotate(15)">
            <path d="M 0,60 Q 150,0 280,30 Q 320,80 270,140 Q 130,160 0,110 Z" fill="#5d4037" stroke="#2d1c16" stroke-width="4"/>
            <path d="M 10,60 Q 150,15 270,40 Q 300,80 260,130 Q 130,150 10,105 Z" fill="url(#nauticalDeckPattern)"/>
            <circle cx="80" cy="85" r="7" fill="#8d6e63" stroke="#3e2723" stroke-width="2"/>
            <circle cx="160" cy="85" r="8" fill="#8d6e63" stroke="#3e2723" stroke-width="2"/>
            <circle cx="230" cy="85" r="6" fill="#8d6e63" stroke="#3e2723" stroke-width="2"/>
            <line x1="50" y1="85" x2="250" y2="85" stroke="#efebe9" stroke-width="2" stroke-dasharray="8 6"/>
          </g>

          <!-- Pontes Pênseis Flutuantes e Passadiços de Madeira -->
          <path d="M 120,150 Q 180,210 230,200" fill="none" stroke="#ffb74d" stroke-width="6" stroke-dasharray="6 3"/>
          <path d="M 270,120 Q 340,150 360,110" fill="none" stroke="#ffb74d" stroke-width="6" stroke-dasharray="6 3"/>

          <!-- Rótulo Tático de Nova Caronte -->
          <rect x="60" y="30" width="260" height="26" fill="rgba(4, 12, 22, 0.9)" stroke="#39ff14" stroke-width="1.5" rx="3"/>
          <text x="70" y="47" fill="#39ff14" font-family="'Cinzel', Georgia, serif" font-size="11" font-weight="bold">NOVA CARONTE // CIDADELA FLUTUANTE</text>
        </g>

        <!-- ====================================================================
             O FOSSO DO KRAKEN: VÓRTICE ABISSAL & TENTÁCULOS COLOSSAIS
             ==================================================================== -->
        <g transform="translate(1080, 520)">
          <!-- Abismo Central Negro -->
          <circle cx="0" cy="0" r="110" fill="#010408" stroke="#e74c3c" stroke-width="3" stroke-dasharray="10 6"/>
          
          <!-- Tentáculos do Kraken Erguendo-se do Fundo (Bioluminescentes) -->
          <g class="kraken-tentacle">
            <path d="M -60,40 Q -110,-60 -80,-140 Q -50,-100 -40,30 Z" fill="#8e24aa" stroke="#e91e63" stroke-width="3"/>
            <circle cx="-85" cy="-70" r="4" fill="#ff4081"/>
            <circle cx="-75" cy="-110" r="3.5" fill="#ff4081"/>
          </g>

          <g class="kraken-tentacle" style="animation-delay: -1.8s;">
            <path d="M 50,40 Q 120,-40 90,-160 Q 60,-110 30,30 Z" fill="#8e24aa" stroke="#e91e63" stroke-width="3"/>
            <circle cx="85" cy="-60" r="4" fill="#ff4081"/>
            <circle cx="75" cy="-110" r="3.5" fill="#ff4081"/>
          </g>

          <g class="kraken-tentacle" style="animation-delay: -3.2s;">
            <path d="M 0,60 Q -30,130 -10,180 Q 20,130 15,50 Z" fill="#6a1b9a" stroke="#e91e63" stroke-width="2.5"/>
          </g>

          <!-- Navio Destroçado e Naufragado Engolido pelo Vórtice -->
          <g transform="translate(-20, -10) rotate(-45)">
            <path d="M 0,20 L 70,0 L 50,35 Z" fill="#3e2723" stroke="#1b0000" stroke-width="2"/>
            <line x1="20" y1="10" x2="10" y2="-30" stroke="#795548" stroke-width="3"/>
          </g>

          <!-- Rótulo Tático do Fosso -->
          <rect x="-140" y="125" width="280" height="26" fill="rgba(20, 4, 4, 0.92)" stroke="#ff4d4d" stroke-width="1.5" rx="3"/>
          <text x="-130" y="142" fill="#ff4d4d" font-family="'Cinzel', Georgia, serif" font-size="11" font-weight="bold">O FOSSO DO KRAKEN // COVIL ABISSAL</text>
        </g>
      `;

      this.localTacticalOverlay = L.svgOverlay(svg, bounds, { opacity: 0.96, interactive: false });
      this.localTacticalOverlay.addTo(this.map);
    }
  }

  renderLocalMarkers(campaignId) {
    this.localMarkersGroup.clearLayers();
    this.markers = {};

    const locations = this.dataLoader.getLocations(campaignId);

    locations.forEach(loc => {
      const [lat, lng] = loc.coordinates;
      let markerClass = 'marker-vilar';
      let iconSvg = '';
      let badgeType = 'reality';

      if (loc.id === 'loc_caronte') {
        markerClass = 'marker-caronte';
        badgeType = 'anomaly';
        iconSvg = `
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 20a2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1 2.4 2.4 0 0 1 2-1 2.4 2.4 0 0 1 2 1 2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1 2.4 2.4 0 0 1 2-1 2.4 2.4 0 0 1 2 1 2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1"/>
            <path d="M4 18L3 12h18l-1 6"/>
            <path d="M12 2v10"/>
            <path d="M12 4l6 4h-6"/>
          </svg>
        `;
      } else if (loc.id === 'loc_kraken') {
        markerClass = 'marker-kraken';
        badgeType = 'anomaly';
        iconSvg = `
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v4"/>
            <path d="M12 18v4"/>
            <path d="M4.93 4.93l2.83 2.83"/>
            <path d="M16.24 16.24l2.83 2.83"/>
            <path d="M2 12h4"/>
            <path d="M18 12h4"/>
            <path d="M4.93 19.07l2.83-2.83"/>
            <path d="M16.24 7.76l2.83-2.83"/>
          </svg>
        `;
      } else if (loc.id === 'loc_vilar_minas') {
        markerClass = 'marker-vilar';
        badgeType = 'reality';
        iconSvg = `
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        `;
      } else if (loc.id === 'loc_estacao_zero' || loc.id === 'loc_monolito_gelo') {
        markerClass = 'marker-artico';
        badgeType = 'anomaly';
        iconSvg = loc.id === 'loc_estacao_zero' ? `
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <circle cx="12" cy="14" r="3" fill="#00e5ff" fill-opacity="0.3"/>
          </svg>
        ` : `
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12,2 22,22 2,22"/>
            <circle cx="12" cy="15" r="2" fill="#b432ff"/>
          </svg>
        `;
      } else if (loc.id === 'loc_tapajos' || loc.id === 'loc_quartzo' || loc.campaign_id === 'camp_004') {
        markerClass = 'marker-brasil-portal';
        badgeType = 'biohazard';
        iconSvg = `
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
            <circle cx="12" cy="12" r="2" fill="#39ff14"/>
          </svg>
        `;
      } else if (loc.id === 'loc_monasterio' || loc.id === 'loc_cripta' || loc.campaign_id === 'camp_005') {
        markerClass = 'marker-alemanha-portal';
        badgeType = 'occult';
        iconSvg = `
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            <circle cx="12" cy="8" r="2" fill="#c084fc"/>
          </svg>
        `;
      } else {
        // Mansão Vilar / Casarão no México
        markerClass = 'marker-vilar';
        badgeType = 'reality';
        iconSvg = `
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>
            <path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6"/>
          </svg>
        `;
      }

      const customIcon = L.divIcon({
        className: `custom-map-marker ${markerClass}`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        html: `
          <div class="radar-wave"></div>
          <div class="marker-inner-icon">
            ${iconSvg}
          </div>
          <div class="marker-label">${loc.name}</div>
        `
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Popup Tático Estilizado que aciona a Gaveta Lateral
      const popupHtml = `
        <div class="popup-container">
          <div class="popup-header">
            <div class="popup-title">${loc.name}</div>
            <span class="popup-zone-badge ${badgeType}">${loc.zone}</span>
          </div>
          <div class="popup-body">
            <div class="popup-type">
              <span>TIPO:</span> <strong>${loc.type}</strong>
            </div>
            <div class="popup-coords" style="font-family: var(--font-mono); font-size: 10px; color: var(--color-cyan-dim);">
              COORDENADAS: [LAT: ${lat.toFixed(4)}°, LNG: ${lng.toFixed(4)}°]
            </div>
            <p>${loc.description}</p>
          </div>
          <div class="popup-footer">
            <button class="popup-btn" onclick="window.app.openLocationDossier('${loc.id}')">
              Dossiê & Crônicas ➔
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        offset: [0, -20],
        closeButton: true
      });

      marker.on('click', () => {
        if (window.soundFX) window.soundFX.playRadarPing();
      });

      this.localMarkersGroup.addLayer(marker);
      this.markers[loc.id] = { marker, location: loc };
    });
  }

  /* ==========================================================================
     5. UTILITÁRIOS DE NAVEGAÇÃO E UI
     ========================================================================== */
  updateNavigationUI() {
    const returnBtn = document.getElementById('btn-return-world');
    const breadcrumbLabel = document.getElementById('breadcrumb-label');
    const compassRose = document.getElementById('compass-rose-container');
    const cartouche = document.getElementById('fantasy-cartouche-banner');

    if (this.currentScale === 'local') {
      if (returnBtn) returnBtn.classList.add('visible');
      if (compassRose) compassRose.classList.add('local-mode');

      if (cartouche) {
        const titleEl = cartouche.querySelector('.fantasy-cartouche-title');
        const subEl = cartouche.querySelector('.fantasy-cartouche-sub');
        if (this.currentRpgId === 'camp_002') {
          if (titleEl) titleEl.textContent = 'MÉXICO // PROPRIEDADE VILAR & MINAS ANTIGAS';
          if (subEl) subEl.textContent = '⚔️ BATTLEMAP TÁTICO: CASARÃO INTERIOR & CASCATA DAS MINAS';
        } else if (this.currentRpgId === 'camp_003') {
          if (titleEl) titleEl.textContent = 'GROENLÂNDIA // ESTAÇÃO CRIOGÊNICA ZERO';
          if (subEl) subEl.textContent = '⚔️ BATTLEMAP TÁTICO: LABORATÓRIO SUBGLACIAL & FENDA DO MONÓLITO';
        } else {
          if (titleEl) titleEl.textContent = 'OCEANO ATLÂNTICO // O TRIÂNGULO DAS BERMUDAS';
          if (subEl) subEl.textContent = '⚔️ CARTA TÁTICA: NOVA CARONTE & O FOSSO DO KRAKEN';
        }
      }

      if (breadcrumbLabel) {
        const campaign = this.dataLoader.getCampaignById(this.currentRpgId);
        const sectorName = campaign ? (campaign.country_location || campaign.title.split(':')[0]) : 'SETOR LOCAL';
        breadcrumbLabel.innerHTML = `
          <span class="breadcrumb-world" onclick="window.retornarAoMapaMundi()">🧭 MAPA MÚNDI</span>
          <span class="breadcrumb-sep">➔</span>
          <span class="breadcrumb-sector">[${sectorName}]</span>
        `;
      }
    } else {
      if (returnBtn) returnBtn.classList.remove('visible');
      if (compassRose) compassRose.classList.remove('local-mode');

      if (cartouche) {
        const titleEl = cartouche.querySelector('.fantasy-cartouche-title');
        const subEl = cartouche.querySelector('.fantasy-cartouche-sub');
        if (titleEl) titleEl.textContent = 'PLANISFÉRIO DA TERRA & AS ANOMALIAS';
        if (subEl) subEl.textContent = '// CARTOGRAFIA FANTÁSTICA DE EVREN //';
      }

      if (breadcrumbLabel) {
        breadcrumbLabel.innerHTML = `🧭 MAPA MÚNDI GLOBAL (177 PAÍSES)`;
      }
    }
  }

  flyToLocation(locationId) {
    const loc = this.dataLoader.getLocationById(locationId);
    if (!loc) return;

    if (this.currentScale === 'global') {
      const campId = loc.map_id === 'map_triangulo' ? 'camp_001' : 'camp_002';
      this.mergulhoNasNuvens(campId).then(() => {
        setTimeout(() => this.flyToLocalMarker(locationId), 800);
      });
      return;
    }

    this.flyToLocalMarker(locationId);
  }

  flyToLocalMarker(locationId) {
    const item = this.markers[locationId];
    if (item) {
      const [lat, lng] = item.location.coordinates;
      this.map.flyTo([lat, lng], 13, {
        animate: true,
        duration: 1.0
      });
      setTimeout(() => {
        item.marker.openPopup();
        if (window.soundFX) window.soundFX.playTacticalBeep();
      }, 1050);
    }
  }

  resetView() {
    if (this.currentScale === 'local') {
      this.retornarAoMapaMundi();
    } else {
      this.map.flyTo(this.worldCenter, this.worldZoom, {
        animate: true,
        duration: 1.0
      });
    }
  }
}

window.MapEngine = MapEngine;
