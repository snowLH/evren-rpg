/**
 * BATTLEMAP TOKENS & TACTICAL GRID CONTROLLER
 * Universo: Evren — Mesa Interativa
 * Gerencia tokens arrastáveis de personagens e criaturas, medição tática de movimento (ruler),
 * névoa de guerra e ações de combate no battlemap.
 */

class BattlemapTokens {
  constructor(mapEngine, dataLoader, uiController) {
    this.mapEngine = mapEngine;
    this.dataLoader = dataLoader;
    this.uiController = uiController;

    this.tokensLayerGroup = L.layerGroup();
    this.rulerLayerGroup = L.layerGroup();
    this.activeTokens = new Map(); // id -> { data, marker }
    this.selectedTokenId = null;

    // Estado da Névoa de Guerra (Fog of War)
    this.fogOfWarEnabled = false;
    this.fogCanvas = null;

    // Régua de Medição
    this.activeRulerLine = null;
    this.activeRulerMarker = null;
  }

  init() {
    this.mapEngine.map.addLayer(this.tokensLayerGroup);
    this.mapEngine.map.addLayer(this.rulerLayerGroup);

    // Escuta cliques no mapa para desselecionar tokens
    this.mapEngine.map.on('click', (e) => {
      // Se clicou no mapa vazio, fecha menu de ações
      this.closeTokenPopover();
      this.selectedTokenId = null;
      this.updateSelectionVisuals();
    });

    console.log('✓ BattlemapTokens inicializado com sucesso.');
  }

  /**
   * Carrega e renderiza os tokens configurados para o mapa atual
   */
  loadTokensForMap(mapId) {
    this.clearAllTokens();
    // Modo Guia de Histórias & Atlas Interativo: tokens de combate desativados para foco nas cartas geográficas
  }

  clearAllTokens() {
    this.tokensLayerGroup.clearLayers();
    this.rulerLayerGroup.clearLayers();
    this.activeTokens.clear();
    this.selectedTokenId = null;
    this.closeTokenPopover();
  }

  /**
   * Spawna um token no mapa com suporte completo a arrasto e medição
   */
  spawnToken(tokenData) {
    const latlng = tokenData.initial_coords;
    const tokenClass = this.determineTokenClass(tokenData);

    // Calcula circunferência dos anéis de PD e MDA (raio = 26)
    const radius = 26;
    const circumference = 2 * Math.PI * radius;
    const pdRatio = Math.max(0, Math.min(1, (tokenData.pd || 20) / (tokenData.max_pd || 20)));
    const pdOffset = circumference * (1 - pdRatio);

    const customIcon = L.divIcon({
      className: 'tactical-token-wrapper',
      iconSize: [52, 52],
      iconAnchor: [26, 26],
      html: `
        <div class="tactical-token-container ${tokenClass}" id="token-dom-${tokenData.id}">
          <div class="token-core">
            <span class="token-icon">${tokenData.icon || '👤'}</span>
          </div>

          <svg class="token-meter-svg" viewBox="0 0 56 56">
            <circle class="token-meter-bg" cx="28" cy="28" r="${radius}"/>
            <circle class="token-meter-pd" cx="28" cy="28" r="${radius}" 
              stroke-dasharray="${circumference}" 
              stroke-dashoffset="${pdOffset}"/>
          </svg>

          ${tokenData.conditions && tokenData.conditions.length > 0 ? `
            <div class="token-condition-badge" title="${tokenData.conditions.join(', ')}">!</div>
          ` : ''}

          <div class="token-nameplate">
            <strong>${tokenData.name.split(' ')[0]}</strong>
            <span class="token-nameplate-stats">PD ${tokenData.pd}/${tokenData.max_pd} • ${tokenData.mda}%</span>
          </div>
        </div>
      `
    });

    const marker = L.marker(latlng, {
      icon: customIcon,
      draggable: true,
      zIndexOffset: 1500
    });

    // Eventos de Arrasto e Régua de Movimento Tático
    let dragStartLatLng = null;

    marker.on('dragstart', (e) => {
      dragStartLatLng = marker.getLatLng();
      this.selectedTokenId = tokenData.id;
      this.updateSelectionVisuals();
      this.closeTokenPopover();

      // Cria a linha tracejada da régua
      this.activeRulerLine = L.polyline([dragStartLatLng, dragStartLatLng], {
        color: '#00e5ff',
        weight: 2.5,
        dashArray: '6, 6',
        opacity: 0.9,
        className: 'tactical-range-line'
      }).addTo(this.rulerLayerGroup);

      // Marcador com o badge de distância
      const rulerBadgeIcon = L.divIcon({
        className: 'ruler-badge-wrapper',
        html: `<div class="tactical-range-badge">📏 0.0m (0 sq)</div>`,
        iconAnchor: [40, -10]
      });

      this.activeRulerMarker = L.marker(dragStartLatLng, {
        icon: rulerBadgeIcon,
        interactive: false
      }).addTo(this.rulerLayerGroup);

      if (window.soundFX) window.soundFX.playTacticalBeep();
    });

    marker.on('drag', (e) => {
      if (!dragStartLatLng || !this.activeRulerLine) return;
      const currentLatLng = marker.getLatLng();

      // Distância geodésica convertida para escala tática de RPG (1 grau ≈ 100km, localmente 0.001 ≈ 10m)
      const latDiff = (currentLatLng.lat - dragStartLatLng.lat) * 111000;
      const lngDiff = (currentLatLng.lng - dragStartLatLng.lng) * 111000 * Math.cos(dragStartLatLng.lat * Math.PI / 180);
      const distMeters = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      const tacticalMeters = Math.max(1.5, Math.round(distMeters * 10) / 10);
      const squares = Math.round(tacticalMeters / 1.5);

      this.activeRulerLine.setLatLngs([dragStartLatLng, currentLatLng]);
      this.activeRulerMarker.setLatLng(currentLatLng);

      const badgeEl = this.activeRulerMarker.getElement()?.querySelector('.tactical-range-badge');
      if (badgeEl) {
        badgeEl.textContent = `📏 ${tacticalMeters.toFixed(1)}m (${squares} sq)`;
      }
    });

    marker.on('dragend', (e) => {
      tokenData.initial_coords = [marker.getLatLng().lat, marker.getLatLng().lng];

      // Remove a régua
      this.rulerLayerGroup.clearLayers();
      this.activeRulerLine = null;
      this.activeRulerMarker = null;

      if (window.soundFX) window.soundFX.playRadarPing();
      this.openTokenPopover(tokenData, marker);
    });

    // Clique simples para abrir menu de ações rápidas
    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      this.selectedTokenId = tokenData.id;
      this.updateSelectionVisuals();
      this.openTokenPopover(tokenData, marker);
      if (window.soundFX) window.soundFX.playTacticalBeep();
    });

    this.tokensLayerGroup.addLayer(marker);
    this.activeTokens.set(tokenData.id, { data: tokenData, marker });
    return marker;
  }

  determineTokenClass(tokenData) {
    if (tokenData.character_id === 'char_arquiteto') return 'token-class-primogenito';
    if (tokenData.character_id?.startsWith('creature_')) return 'token-class-criatura';
    if (tokenData.role?.includes('Combatente')) return 'token-class-combatente';
    if (tokenData.role?.includes('Especialista')) return 'token-class-especialista';
    if (tokenData.role?.includes('Ocultista')) return 'token-class-ocultista';
    return 'token-class-sobrevivente';
  }

  updateSelectionVisuals() {
    this.activeTokens.forEach(({ data }) => {
      const el = document.getElementById(`token-dom-${data.id}`);
      if (el) {
        if (data.id === this.selectedTokenId) {
          el.classList.add('token-selected');
        } else {
          el.classList.remove('token-selected');
        }
      }
    });
  }

  /**
   * Abre o Popover de Ações Rápidas do Token
   */
  openTokenPopover(tokenData, marker) {
    this.closeTokenPopover();

    const latlng = marker.getLatLng();
    const isCharacter = tokenData.character_id?.startsWith('char_');
    const isCreature = tokenData.character_id?.startsWith('creature_');

    const popoverContent = `
      <div class="token-action-popover" id="active-token-popover">
        <div class="token-popover-title">${tokenData.name}</div>

        ${isCharacter ? `
          <button class="token-popover-btn" onclick="window.app.uiController.openCharacterSheet('${tokenData.character_id}')">
            👤 Abrir Ficha Completa
          </button>
        ` : ''}

        ${isCreature ? `
          <button class="token-popover-btn" onclick="window.app.uiController.openBestiaryDossier('${tokenData.character_id}')">
            👾 Dossiê da Criatura
          </button>
        ` : ''}

        <button class="token-popover-btn btn-popover-blood" onclick="window.app.combatArena.openArenaWithAttacker('${tokenData.character_id}')">
          ⚔️ Conflito Direto (Atacar)
        </button>

        ${tokenData.character_id === 'char_gabriel' ? `
          <button class="token-popover-btn" onclick="window.battlemapTokens.activateLimiarTeleport('${tokenData.id}')" style="color:#00e5ff;">
            ⚡ Disparo LIMIAR (Teletransporte)
          </button>
        ` : ''}

        <button class="token-popover-btn" onclick="window.battlemapTokens.adjustTokenPD('${tokenData.id}', -5)">
          💔 Dano (-5 PD)
        </button>

        <button class="token-popover-btn" onclick="window.battlemapTokens.adjustTokenPD('${tokenData.id}', 5)">
          💚 Recuperar (+5 PD)
        </button>

        <button class="token-popover-btn" onclick="window.battlemapTokens.closeTokenPopover()" style="color:#a8d5e8;">
          ✕ Fechar Menu
        </button>
      </div>
    `;

    const popoverIcon = L.divIcon({
      className: 'token-popover-wrapper',
      html: popoverContent,
      iconAnchor: [70, 75]
    });

    this.activePopoverMarker = L.marker(latlng, {
      icon: popoverIcon,
      interactive: true,
      zIndexOffset: 3000
    }).addTo(this.mapEngine.map);
  }

  closeTokenPopover() {
    if (this.activePopoverMarker) {
      this.mapEngine.map.removeLayer(this.activePopoverMarker);
      this.activePopoverMarker = null;
    }
  }

  /**
   * Ajusta PD do token em tempo real e atualiza os anéis visuais
   */
  adjustTokenPD(tokenId, delta) {
    const item = this.activeTokens.get(tokenId);
    if (!item) return;

    item.data.pd = Math.max(0, Math.min(item.data.max_pd || 20, (item.data.pd || 20) + delta));

    // Se chegou a 0, dispara o efeito sonoro de Overload
    if (item.data.pd === 0 && window.soundFX) {
      window.soundFX.playOverloadStrobe();
      const vignette = document.getElementById('overload-fracture-vignette');
      if (vignette) {
        vignette.classList.add('active');
        setTimeout(() => vignette.classList.remove('active'), 2500);
      }
    } else if (delta < 0 && window.soundFX) {
      window.soundFX.playArmorSacrifice();
    } else if (window.soundFX) {
      window.soundFX.playTacticalBeep();
    }

    // Re-renderiza o token com novo medidor
    const currentLatLng = item.marker.getLatLng();
    this.tokensLayerGroup.removeLayer(item.marker);
    item.data.initial_coords = [currentLatLng.lat, currentLatLng.lng];
    const newMarker = this.spawnToken(item.data);
    this.openTokenPopover(item.data, newMarker);
  }

  /**
   * Teletransporte com a relíquia LIMIAR: o usuário clica no mapa para reposicionar o token
   */
  activateLimiarTeleport(tokenId) {
    this.closeTokenPopover();
    const item = this.activeTokens.get(tokenId);
    if (!item) return;

    if (window.soundFX) window.soundFX.playPortalWhoosh();

    const banner = document.createElement('div');
    banner.id = 'limiar-teleport-prompt';
    banner.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(4, 12, 24, 0.95);
      border: 2px solid #00e5ff;
      color: #00e5ff;
      font-family: 'Cinzel', serif;
      font-size: 13px;
      font-weight: 700;
      padding: 10px 24px;
      border-radius: 4px;
      box-shadow: 0 0 25px rgba(0, 229, 255, 0.8);
      z-index: 9999;
      pointer-events: none;
      animation: pulse 1s infinite alternate;
    `;
    banner.textContent = '⚡ CLIQUE EM QUALQUER PONTO DO BATTLEMAP PARA O SALTO DO LIMIAR ⚡';
    document.body.appendChild(banner);

    const onMapClickTeleport = (e) => {
      this.mapEngine.map.off('click', onMapClickTeleport);
      banner.remove();

      // Move o token com efeito visual
      item.marker.setLatLng(e.latlng);
      item.data.initial_coords = [e.latlng.lat, e.latlng.lng];
      item.data.pd = Math.max(0, item.data.pd - 4); // Custo de 4 PD

      if (window.soundFX) window.soundFX.playPortalWhoosh();

      // Flash de estática na tela
      const flash = document.getElementById('static-flash');
      if (flash) {
        flash.classList.add('flash');
        setTimeout(() => flash.classList.remove('flash'), 300);
      }

      this.openTokenPopover(item.data, item.marker);
    };

    setTimeout(() => {
      this.mapEngine.map.once('click', onMapClickTeleport);
    }, 100);
  }

  /**
   * Invoca uma criatura diretamente do Bestiário para o Battlemap
   */
  spawnCreatureFromBestiary(creatureId) {
    const creature = this.dataLoader.getCreatureById(creatureId);
    if (!creature) return;

    // Centro do mapa atual com um leve offset aleatório
    const center = this.mapEngine.map.getCenter();
    const lat = center.lat + (Math.random() - 0.5) * 0.02;
    const lng = center.lng + (Math.random() - 0.5) * 0.02;

    const tokenData = {
      id: `tok_dyn_${Date.now()}`,
      character_id: creature.id,
      name: creature.name,
      role: 'Criatura Invocada',
      map_id: this.mapEngine.currentMapId,
      initial_coords: [lat, lng],
      color: '#39ff14',
      icon: '👾',
      pd: 25,
      max_pd: 25,
      mda: parseInt(creature.mda) || 50,
      has_armor: false,
      conditions: ['Invocado Recentemente']
    };

    const marker = this.spawnToken(tokenData);
    this.mapEngine.map.panTo([lat, lng]);
    this.openTokenPopover(tokenData, marker);

    if (window.soundFX) window.soundFX.playRadarPing();
  }

  exportState() {
    const list = [];
    this.activeTokens.forEach((val, id) => {
      const pos = val.marker ? val.marker.getLatLng() : null;
      list.push({
        id,
        data: val.data,
        coords: pos ? [pos.lat, pos.lng] : val.data.initial_coords
      });
    });
    return list;
  }

  importState(tokensList) {
    if (!Array.isArray(tokensList)) return;
    tokensList.forEach(item => {
      const active = this.activeTokens.get(item.id);
      if (active && active.marker && item.coords) {
        active.marker.setLatLng(item.coords);
      }
    });
  }
}

window.BattlemapTokens = BattlemapTokens;
