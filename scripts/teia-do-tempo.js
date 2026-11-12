/**
 * TEIA DO TEMPO — CONTROLADOR DA TAPEÇARIA CÓSMICA & LINHAS TEMPORAIS DE EVREN
 * Universo: EVREN RPG
 *
 * Funcionalidades:
 * 1. Visualização em Grafo Cósmico (Canvas 2D interativo com nós, conexões de bezier e pulsos anímicos).
 * 2. Visualização em Vertentes Paralelas (Trilhas das 3 Campanhas e Histórico Ancestral lado a lado).
 * 3. Visualização em Linha Causa-Efeito (Árvore de antecedentes e consequências imediatas).
 * 4. Dossiê Lateral Interativo: Citações canônicas, personagens (link para C.R.I.S.), locais (foco no Planeta 3D).
 * 5. Filtros dinâmicos por Eras e Vertentes + Busca Rápida.
 */

class TeiaDoTempoController {
  constructor(dataLoader) {
    this.dataLoader = dataLoader;
    this.currentView = 'canvas'; // 'canvas' | 'strands' | 'causal'
    this.currentEraFilter = 'all';
    this.currentVertenteFilter = 'all';
    this.searchQuery = '';
    this.selectedNodeId = null;

    // Estado do Canvas 2D
    this.canvas = null;
    this.ctx = null;
    this.animationFrameId = null;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.pan = { x: 0, y: 0 };
    this.zoom = 1;
    this.hoveredNodeId = null;
    this.draggedNode = null;

    // Coordenadas calculadas dos nós
    this.nodePositions = new Map();
    this.particles = [];
  }

  escapeHtml(str) {
    if (window.EvrenSecurity) return window.EvrenSecurity.escapeHtml(str);
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  init() {
    this.bindEvents();
    this.initCanvas();
    console.log('✓ TeiaDoTempoController inicializado com sucesso.');
  }

  bindEvents() {
    // Botão de navegação no HUD principal
    const btnNavTeia = document.getElementById('btn-nav-teia-do-tempo');
    if (btnNavTeia) {
      btnNavTeia.addEventListener('click', () => {
        this.openModal();
      });
    }

    // Botão no menu dropdown Arquivo & Mais
    const btnOpenTeia = document.getElementById('btn-open-teia-do-tempo');
    if (btnOpenTeia) {
      btnOpenTeia.addEventListener('click', () => {
        this.openModal();
      });
    }

    // Botão de fechar modal
    const btnClose = document.getElementById('btn-close-teia-do-tempo');
    if (btnClose) {
      btnClose.addEventListener('click', () => {
        this.closeModal();
      });
    }

    // Switcher de visualização
    document.querySelectorAll('.teia-view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.switchView(view);
      });
    });

    // Filtros de Era
    document.querySelectorAll('.teia-era-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        document.querySelectorAll('.teia-era-chip').forEach(c => c.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentEraFilter = e.currentTarget.dataset.era;
        this.applyFilters();
      });
    });

    // Filtros de Vertente
    document.querySelectorAll('.teia-vertente-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        document.querySelectorAll('.teia-vertente-chip').forEach(c => c.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentVertenteFilter = e.currentTarget.dataset.vertente;
        this.applyFilters();
      });
    });

    // Busca rápida
    const searchInput = document.getElementById('teia-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.applyFilters();
      });
    }

    // Controles de Canvas
    document.getElementById('btn-teia-zoom-in')?.addEventListener('click', () => {
      this.zoom = Math.min(2.5, this.zoom + 0.2);
    });
    document.getElementById('btn-teia-zoom-out')?.addEventListener('click', () => {
      this.zoom = Math.max(0.4, this.zoom - 0.2);
    });
    document.getElementById('btn-teia-reset')?.addEventListener('click', () => {
      this.resetCamera();
    });

    // Fechar dossiê lateral
    document.getElementById('btn-close-teia-inspector')?.addEventListener('click', () => {
      this.closeInspector();
    });

    // Atalho de teclado [W] para Teia do Tempo
    window.addEventListener('keydown', (e) => {
      if ((e.key === 'w' || e.key === 'W') && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        if (!e.ctrlKey && !e.altKey && !e.metaKey) {
          e.preventDefault();
          this.toggleModal();
        }
      }
    });
  }

  toggleModal() {
    const modal = document.getElementById('modal-teia-do-tempo');
    if (!modal) return;
    if (modal.classList.contains('active')) {
      this.closeModal();
    } else {
      this.openModal();
    }
  }

  open() {
    this.openModal();
  }

  openModal() {
    const modal = document.getElementById('modal-teia-do-tempo');
    if (!modal) return;
    document.querySelectorAll('.modal-backdrop.open, .modal-backdrop.active').forEach(m => {
      if (m !== modal) m.classList.remove('open', 'active');
    });
    window.museumController?.closeExhibitionModal?.();
    modal.classList.add('open', 'active');

    // Reproduz efeito tático
    if (window.soundFX) window.soundFX.playTacticalBeep?.();

    // Renderiza a visualização atual
    this.renderCurrentView();

    // Inicia loop de renderização do canvas se estiver no modo canvas
    if (this.currentView === 'canvas') {
      this.resizeCanvas();
      this.startCanvasLoop();
    }
  }

  closeModal() {
    const modal = document.getElementById('modal-teia-do-tempo');
    if (!modal) return;
    modal.classList.remove('open', 'active');
    this.stopCanvasLoop();
  }

  switchView(viewName) {
    this.currentView = viewName;
    document.querySelectorAll('.teia-view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    const canvasView = document.getElementById('teia-canvas-container');
    const strandsView = document.getElementById('teia-strands-view');
    const causalView = document.getElementById('teia-causal-view');

    if (canvasView) canvasView.style.display = viewName === 'canvas' ? 'block' : 'none';
    if (strandsView) strandsView.style.display = viewName === 'strands' ? 'block' : 'none';
    if (causalView) causalView.style.display = viewName === 'causal' ? 'block' : 'none';

    if (viewName === 'canvas') {
      this.resizeCanvas();
      this.startCanvasLoop();
    } else {
      this.stopCanvasLoop();
    }

    this.renderCurrentView();
  }

  renderCurrentView() {
    if (this.currentView === 'strands') {
      this.renderStrandsView();
    } else if (this.currentView === 'causal') {
      this.renderCausalView();
    } else {
      this.recalculateNodePositions();
    }
  }

  applyFilters() {
    if (this.currentView === 'canvas') {
      this.drawCanvas();
    } else if (this.currentView === 'strands') {
      this.renderStrandsView();
    } else if (this.currentView === 'causal') {
      this.renderCausalView();
    }
  }

  getTeiaData() {
    const raw = this.dataLoader.getTeiaDoTempo() || { eras: [], nodes: [], links: [] };
    const campaignToVertente = {
      camp_001: 'vertente_triangulo',
      camp_002: 'vertente_vilar',
      camp_filantropo_oeht: 'vertente_oeht'
    };
    const defaultEraSummaries = {
      era_primordial: 'Origem abissal da Verdadeira Magia e artefatos cambrianos anteriores à história escrita.',
      era_mitica: 'Projeções míticas na Europa, surgimento do Campo de Rosas e fundação inquisitorial da Ordem da Cinza.',
      era_navegacoes: 'Despedaçamento da membrana em Vera Cruz das Almas (1500) e consolidação da Ilha Canibal & Cidadela de Nácar.',
      era_moderna: 'Arquivos visuais grau-zero (#01/#02) e transição da Ordem da Cinza para a rede global A.E.G.I.S.',
      vertente_triangulo: 'Incursão dos 5.000 no Triângulo das Bermudas, ilhas de Vera Cruz e sacrifício do Guia Temporário.',
      vertente_vilar: 'Sumiço de Lucas Vilar (2021), Projeto LIMIAR com portais ZZZZT e resgate final nas minas mexicanas.',
      vertente_oeht: 'Leilão ilícito da Gala Belvedere (22h–00h), redoma púrpura, loops de 10s e despertar d’O Anárquico.',
      vertente_colapso: 'Convergência das feridas atlânticas e ameaça da Segunda Queda do Véu sobre toda a Terra.'
    };
    const links = (raw.links || []).map(l => ({
      ...l,
      from: l.from || l.source,
      to: l.to || l.target,
      label: l.label || '',
      type: l.type || ((l.to || l.target) === 'teia_colapso_global' ? 'critical' : 'normal')
    }));
    const eras = (raw.eras || []).map(e => ({
      ...e,
      badge: e.badge || e.years || e.id.toUpperCase(),
      summary: e.summary || defaultEraSummaries[e.id] || '',
      status_label: e.status_label || (
        e.id === 'vertente_vilar' ? 'CONCLUÍDA' :
        (e.id === 'vertente_triangulo' || e.id === 'vertente_oeht') ? 'FUTURA CAMPANHA' : ''
      )
    }));
    const nodes = (raw.nodes || []).map(n => {
      const eraKey = n.era_id || n.era || 'era_primordial';
      const vertKey = n.vertente_id || (eraKey.startsWith('vertente_') ? eraKey : campaignToVertente[n.linked_campaign]) || '';
      return {
        ...n,
        era_id: eraKey,
        vertente_id: vertKey,
        title: n.title || n.label || n.id,
        year_display: n.year_display || n.year || '',
        importance: n.importance || (
          eraKey === 'vertente_colapso' ? 'Ponto de Convergência Universal' :
          (n.id === 'teia_primogenito_genese' || n.id === 'teia_queda_veu') ? 'Cataclísmico' : 'Marco Canônico'
        ),
        caused_by: n.caused_by || links.filter(l => l.to === n.id).map(l => l.from),
        leads_to: n.leads_to || links.filter(l => l.from === n.id).map(l => l.to),
        characters: n.characters || (n.linked_character ? [n.linked_character] : [])
      };
    });
    return { eras, nodes, links };
  }

  getFilteredNodes() {
    const data = this.getTeiaData();
    let nodes = data.nodes || [];

    if (this.currentEraFilter !== 'all') {
      nodes = nodes.filter(n => n.era_id === this.currentEraFilter);
    }

    if (this.currentVertenteFilter !== 'all') {
      nodes = nodes.filter(n => n.vertente_id === this.currentVertenteFilter || n.era_id === this.currentVertenteFilter);
    }

    if (this.searchQuery) {
      const q = this.searchQuery;
      nodes = nodes.filter(n =>
        (n.title || '').toLowerCase().includes(q) ||
        (n.summary || '').toLowerCase().includes(q) ||
        (n.impact || '').toLowerCase().includes(q) ||
        (n.quote || '').toLowerCase().includes(q)
      );
    }

    return nodes;
  }

  /* ==========================================================================
     VISUALIZAÇÃO 2: VERTENTES PARALELAS (TIMELINE STRANDS)
     ========================================================================== */
  renderStrandsView() {
    const container = document.getElementById('teia-strands-view');
    if (!container) return;

    const teia = this.getTeiaData();
    const eras = teia.eras || [];
    const allFilteredNodes = this.getFilteredNodes();

    // Agrupa por era/vertente
    let html = '';

    eras.forEach(era => {
      const eraNodes = allFilteredNodes.filter(n => n.era_id === era.id || n.vertente_id === era.id);
      if (eraNodes.length === 0 && (this.currentEraFilter !== 'all' || this.currentVertenteFilter !== 'all' || this.searchQuery)) {
        return; // omite faixa vazia em busca
      }

      html += `
        <div class="teia-strand-lane" style="border-left: 4px solid ${era.color};">
          <div class="teia-strand-header">
            <div class="teia-strand-title">
              <span>${this.escapeHtml(era.name)}</span>
              ${era.status_label ? `<span class="badge-tag status" style="font-size: 0.7rem;">${this.escapeHtml(era.status_label)}</span>` : ''}
            </div>
            <span class="teia-strand-badge" style="background: ${era.color}22; color: ${era.color}; border: 1px solid ${era.color}55;">
              ${this.escapeHtml(era.badge)}
            </span>
          </div>
          <div style="font-size: 0.75rem; color: #8da4be; margin-bottom: 14px; font-style: italic;">
            ${this.escapeHtml(era.summary)}
          </div>
          <div class="teia-nodes-grid">
            ${eraNodes.map(node => `
              <div class="teia-node-card" data-node-id="${node.id}" style="border-left-color: ${era.color};" onclick="window.teiaController.inspectNode('${node.id}')">
                <div class="teia-node-card-header">
                  <span class="teia-node-card-title">${this.escapeHtml(node.title)}</span>
                  <span class="teia-node-card-year">${this.escapeHtml(node.year_display)}</span>
                </div>
                <div class="teia-node-card-summary">${this.escapeHtml(node.summary)}</div>
                ${node.quote ? `<div style="font-size: 0.72rem; color: #38bdf8; font-style: italic; border-left: 2px solid #38bdf8; padding-left: 6px;">"${this.escapeHtml(node.quote)}"</div>` : ''}
                <div class="teia-node-card-footer">
                  <span class="teia-node-tag">${this.escapeHtml(node.importance)}</span>
                  ${node.characters?.length ? `<span class="teia-node-tag">👥 ${node.characters.length}</span>` : ''}
                  ${node.bestiary?.length ? `<span class="teia-node-tag">👾 ${node.bestiary.length}</span>` : ''}
                  ${node.relics?.length ? `<span class="teia-node-tag">🏺 ${node.relics.length}</span>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  /* ==========================================================================
     VISUALIZAÇÃO 3: CRÔNICA CAUSAL (LINHA CAUSA-EFEITO)
     ========================================================================== */
  renderCausalView() {
    const container = document.getElementById('teia-causal-view');
    if (!container) return;

    const teia = this.getTeiaData();
    const nodes = this.getFilteredNodes();

    let html = `
      <div class="teia-causal-chain">
        <div style="font-family: var(--font-mono); font-size: 0.78rem; color: #ffd700; margin-bottom: 8px;">
          // SEQUÊNCIA GENEALÓGICA & CONEXÕES CAUSAIS DE EVREN //
        </div>
    `;

    nodes.forEach((node, idx) => {
      const era = teia.eras.find(e => e.id === node.era_id || e.id === node.vertente_id);
      const color = era ? era.color : '#00e5ff';

      html += `
        <div class="teia-causal-step" onclick="window.teiaController.inspectNode('${node.id}')" style="cursor: pointer;">
          <div class="teia-causal-step-num" style="border-color: ${color}; color: ${color};">
            ${idx + 1}
          </div>
          <div class="teia-causal-content" style="border-left: 3px solid ${color};">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <span style="font-family: 'Cinzel', serif; font-weight: 700; font-size: 0.95rem; color: #fff;">
                ${this.escapeHtml(node.title)}
              </span>
              <span style="font-family: monospace; font-size: 0.72rem; color: #ffd700;">
                ${this.escapeHtml(node.year_display)}
              </span>
            </div>
            <div style="font-size: 0.78rem; color: #9ab1c7;">
              ${this.escapeHtml(node.summary)}
            </div>
            ${node.quote ? `
              <div style="font-size: 0.74rem; color: #38bdf8; font-style: italic; background: rgba(56, 189, 248, 0.08); padding: 6px 10px; border-radius: 4px;">
                "${this.escapeHtml(node.quote)}"
              </div>
            ` : ''}
            <div style="display: flex; gap: 8px; font-family: monospace; font-size: 0.68rem; color: #728a9c; margin-top: 4px;">
              <span>ERA: <strong style="color: ${color};">${this.escapeHtml(era ? era.name : 'Ancestral')}</strong></span>
              ${node.leads_to?.length ? `<span>➔ DESENCADEIA: ${node.leads_to.length} EVENTO(S)</span>` : '<span style="color: #ef4444;">💥 HORIZONTE DE CONVERGÊNCIA</span>'}
            </div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  /* ==========================================================================
     VISUALIZAÇÃO 1: GRAFO CÓSMICO (CANVAS 2D INTERATIVO)
     ========================================================================== */
  initCanvas() {
    this.canvas = document.getElementById('teia-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', () => this.onMouseUp());
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
    this.canvas.addEventListener('click', (e) => this.onClick(e));
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const width = parent.clientWidth || 1200;
    const height = parent.clientHeight || 640;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.recalculateNodePositions();
    if (this.pan.x === 0 && this.pan.y === 0) {
      this.resetCamera();
    }
  }

  recalculateNodePositions() {
    const teia = this.getTeiaData();
    const nodes = teia.nodes || [];
    if (nodes.length === 0) return;

    this.nodePositions.clear();

    const parent = this.canvas ? this.canvas.parentElement : null;
    const width = (parent && parent.clientWidth > 100) ? parent.clientWidth : 1280;
    const height = (parent && parent.clientHeight > 100) ? parent.clientHeight : 640;
    const centerX = width / 2;
    const centerY = height / 2;

    const eraAngles = {
      era_primordial: { x: -450, y: -220 },
      era_mitica: { x: -350, y: -80 },
      era_navegacoes: { x: -350, y: 150 },
      era_moderna: { x: -100, y: 0 },
      vertente_triangulo: { x: 180, y: -220 },
      vertente_vilar: { x: 180, y: 20 },
      vertente_oeht: { x: 180, y: 240 },
      vertente_colapso: { x: 500, y: 20 }
    };

    const counters = {};

    nodes.forEach(node => {
      let px, py;
      if (typeof node.x_hint === 'number' && typeof node.y_hint === 'number') {
        px = Math.round(width * (0.04 + node.x_hint * 0.90));
        py = Math.round(height * (0.12 + node.y_hint * 0.72));
      } else {
        const vert = node.vertente_id || node.era_id;
        const base = eraAngles[vert] || { x: 0, y: 0 };
        counters[vert] = (counters[vert] || 0) + 1;

        const offsetIdx = counters[vert] - 1;
        const col = offsetIdx % 3;
        const row = Math.floor(offsetIdx / 3);

        px = centerX + base.x + (col * 90 - 45);
        py = centerY + base.y + (row * 80 - 40);
      }

      this.nodePositions.set(node.id, {
        x: px,
        y: py,
        vx: 0,
        vy: 0,
        radius: node.importance === 'Cataclísmico' || node.importance === 'Ponto de Convergência Universal' ? 21 : 16,
        color: this.getNodeColor(node)
      });
    });

    // Inicia partículas de energia
    this.initParticles();
  }

  getNodeColor(node) {
    const teia = this.getTeiaData();
    const era = teia.eras?.find(e => e.id === node.era_id || e.id === node.vertente_id);
    return era ? era.color : '#00e5ff';
  }

  initParticles() {
    this.particles = [];
    const teia = this.getTeiaData();
    const links = teia.links || [];

    links.forEach(link => {
      for (let i = 0; i < 2; i++) {
        this.particles.push({
          from: link.from,
          to: link.to,
          progress: Math.random(),
          speed: 0.004 + Math.random() * 0.005,
          color: link.type === 'critical' ? '#ef4444' : '#00e5ff'
        });
      }
    });
  }

  startCanvasLoop() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    const loop = () => {
      this.drawCanvas();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  stopCanvasLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  resetCamera() {
    this.pan = { x: 0, y: 0 };
    this.zoom = 1;
  }

  onMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - this.pan.x) / this.zoom;
    const mouseY = (e.clientY - rect.top - this.pan.y) / this.zoom;

    // Checa se clicou em um nó para arrastar
    for (const [id, pos] of this.nodePositions.entries()) {
      const dx = mouseX - pos.x;
      const dy = mouseY - pos.y;
      if (Math.hypot(dx, dy) <= pos.radius + 6) {
        this.draggedNode = id;
        return;
      }
    }

    this.isDragging = true;
    this.dragStart = { x: e.clientX - this.pan.x, y: e.clientY - this.pan.y };
  }

  onMouseMove(e) {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - this.pan.x) / this.zoom;
    const mouseY = (e.clientY - rect.top - this.pan.y) / this.zoom;

    if (this.draggedNode) {
      const pos = this.nodePositions.get(this.draggedNode);
      if (pos) {
        pos.x = mouseX;
        pos.y = mouseY;
      }
      return;
    }

    if (this.isDragging) {
      this.pan.x = e.clientX - this.dragStart.x;
      this.pan.y = e.clientY - this.dragStart.y;
      return;
    }

    // Checa hover
    let found = null;
    for (const [id, pos] of this.nodePositions.entries()) {
      const dx = mouseX - pos.x;
      const dy = mouseY - pos.y;
      if (Math.hypot(dx, dy) <= pos.radius + 4) {
        found = id;
        break;
      }
    }
    this.hoveredNodeId = found;
    this.canvas.style.cursor = found ? 'pointer' : (this.isDragging ? 'grabbing' : 'grab');
  }

  onMouseUp() {
    this.isDragging = false;
    this.draggedNode = null;
  }

  onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    this.zoom = Math.max(0.4, Math.min(2.5, this.zoom + delta));
  }

  onClick(e) {
    if (!this.hoveredNodeId) return;
    this.inspectNode(this.hoveredNodeId);
  }

  drawCanvas() {
    if (!this.ctx || !this.canvas) return;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    this.ctx.save();
    this.ctx.clearRect(0, 0, width, height);

    // Aplica Transformações de Câmera
    this.ctx.translate(this.pan.x, this.pan.y);
    this.ctx.scale(this.zoom, this.zoom);

    const teia = this.getTeiaData();
    const nodes = teia.nodes || [];
    const links = teia.links || [];
    const activeIds = new Set(this.getFilteredNodes().map(n => n.id));
    const hasFilter = this.currentEraFilter !== 'all' || this.currentVertenteFilter !== 'all' || !!this.searchQuery;

    // 1. Desenha Linhas Conectoras (Curvas de Bezier)
    links.forEach(link => {
      const p1 = this.nodePositions.get(link.from);
      const p2 = this.nodePositions.get(link.to);
      if (!p1 || !p2) return;

      const isConnectedToHover = this.hoveredNodeId === link.from || this.hoveredNodeId === link.to;
      const isSelected = this.selectedNodeId === link.from || this.selectedNodeId === link.to;
      const bothVisible = !hasFilter || (activeIds.has(link.from) || activeIds.has(link.to));

      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);

      const dx = p2.x - p1.x;
      const cx1 = p1.x + dx * 0.5;
      const cy1 = p1.y;
      const cx2 = p1.x + dx * 0.5;
      const cy2 = p2.y;

      this.ctx.bezierCurveTo(cx1, cy1, cx2, cy2, p2.x, p2.y);

      if (isConnectedToHover || isSelected) {
        this.ctx.strokeStyle = '#00e5ff';
        this.ctx.lineWidth = 2.5;
        this.ctx.shadowColor = '#00e5ff';
        this.ctx.shadowBlur = 10;
      } else {
        this.ctx.strokeStyle = link.type === 'critical'
          ? `rgba(239, 68, 68, ${bothVisible ? 0.45 : 0.08})`
          : `rgba(0, 229, 255, ${bothVisible ? 0.28 : 0.06})`;
        this.ctx.lineWidth = bothVisible ? 1.4 : 0.8;
        this.ctx.shadowBlur = 0;
      }
      this.ctx.stroke();

      if ((isConnectedToHover || isSelected) && link.label) {
        const mx = (p1.x + p2.x) * 0.5;
        const my = (p1.y + p2.y) * 0.5 - 6;
        this.ctx.shadowBlur = 0;
        this.ctx.font = '10px monospace';
        this.ctx.fillStyle = '#00e5ff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(link.label, mx, my);
      }
    });

    // 2. Partículas Anímicas em Fluxo
    this.particles.forEach(p => {
      const p1 = this.nodePositions.get(p.from);
      const p2 = this.nodePositions.get(p.to);
      if (!p1 || !p2) return;
      if (hasFilter && !activeIds.has(p.from) && !activeIds.has(p.to)) return;

      p.progress += p.speed;
      if (p.progress >= 1) p.progress = 0;

      const dx = p2.x - p1.x;
      const cx1 = p1.x + dx * 0.5;
      const cy1 = p1.y;
      const cx2 = p1.x + dx * 0.5;
      const cy2 = p2.y;

      const t = p.progress;
      const x = Math.pow(1 - t, 3) * p1.x + 3 * Math.pow(1 - t, 2) * t * cx1 + 3 * (1 - t) * Math.pow(t, 2) * cx2 + Math.pow(t, 3) * p2.x;
      const y = Math.pow(1 - t, 3) * p1.y + 3 * Math.pow(1 - t, 2) * t * cy1 + 3 * (1 - t) * Math.pow(t, 2) * cy2 + Math.pow(t, 3) * p2.y;

      this.ctx.beginPath();
      this.ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 6;
      this.ctx.fill();
    });

    // 3. Desenha Nós
    nodes.forEach(node => {
      const pos = this.nodePositions.get(node.id);
      if (!pos) return;

      const isActive = !hasFilter || activeIds.has(node.id);
      const isHovered = this.hoveredNodeId === node.id;
      const isSelected = this.selectedNodeId === node.id;
      const radius = pos.radius + (isHovered ? 4 : 0);

      this.ctx.globalAlpha = isActive ? 1 : 0.2;

      // Aura externa
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, radius + 8, 0, Math.PI * 2);
      this.ctx.fillStyle = isHovered || isSelected ? `${pos.color}33` : `${pos.color}18`;
      this.ctx.fill();

      // Círculo base
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#06101d';
      this.ctx.fill();

      // Borda com cor da era
      this.ctx.lineWidth = isHovered || isSelected ? 3 : 2;
      this.ctx.strokeStyle = pos.color;
      this.ctx.shadowColor = pos.color;
      this.ctx.shadowBlur = isHovered || isSelected ? 16 : 8;
      this.ctx.stroke();

      // Ícone central ou ponto
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, radius * 0.35, 0, Math.PI * 2);
      this.ctx.fillStyle = pos.color;
      this.ctx.fill();

      // Rótulo do Nó
      this.ctx.shadowBlur = 0;
      this.ctx.font = 'bold 10.5px monospace';
      this.ctx.fillStyle = isHovered || isSelected ? '#ffffff' : '#d2e2f0';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(node.year_display || '', pos.x, pos.y - radius - 10);

      this.ctx.font = isHovered || isSelected ? 'bold 12px Cinzel, serif' : '600 11.5px Cinzel, serif';
      this.ctx.fillStyle = isHovered || isSelected ? '#ffd700' : '#b7cbe0';
      this.ctx.fillText(this.truncateText(node.title, 26), pos.x, pos.y + radius + 16);
      this.ctx.globalAlpha = 1;
    });

    this.ctx.restore();
  }

  truncateText(str, maxLen) {
    if (!str) return '';
    return str.length > maxLen ? str.substring(0, maxLen - 1) + '…' : str;
  }

  /* ==========================================================================
     DOSSIÊ LATERAL DE INSPEÇÃO DE NÓ TEMPORAL
     ========================================================================== */
  inspectNode(nodeId) {
    this.selectedNodeId = nodeId;
    const teia = this.getTeiaData();
    const node = teia.nodes?.find(n => n.id === nodeId);
    if (!node) return;

    const era = teia.eras?.find(e => e.id === node.era_id || e.id === node.vertente_id);
    const color = era ? era.color : '#00e5ff';

    const inspector = document.getElementById('teia-inspector');
    if (!inspector) return;

    let charactersHtml = '';
    if (node.characters && node.characters.length > 0) {
      charactersHtml = `
        <div class="teia-dossier-section">
          <div class="teia-dossier-section-title">👥 Personagens Envolvidos</div>
          <div class="teia-pill-list">
            ${node.characters.map(charId => {
              const char = this.dataLoader.getCharacterById(charId);
              const name = char ? char.name : charId;
              return `<button class="teia-action-pill" onclick="window.teiaController.openCharacterSheet('${charId}')">👤 ${this.escapeHtml(name)}</button>`;
            }).join('')}
          </div>
        </div>
      `;
    }

    let relicsHtml = '';
    if (node.relics && node.relics.length > 0) {
      relicsHtml = `
        <div class="teia-dossier-section">
          <div class="teia-dossier-section-title">🏺 Relíquias e Tecnologias</div>
          <div class="teia-pill-list">
            ${node.relics.map(relId => {
              const rel = this.dataLoader.getRelicById(relId);
              const name = rel ? rel.name : relId;
              return `<span class="teia-action-pill" style="cursor: default;">⚡ ${this.escapeHtml(name)}</span>`;
            }).join('')}
          </div>
        </div>
      `;
    }

    let bestiaryHtml = '';
    if (node.bestiary && node.bestiary.length > 0) {
      bestiaryHtml = `
        <div class="teia-dossier-section">
          <div class="teia-dossier-section-title">👾 Ameaças e Bestiário</div>
          <div class="teia-pill-list">
            ${node.bestiary.map(mobId => {
              const mob = this.dataLoader.getCreatureById(mobId);
              const name = mob ? mob.name : mobId;
              return `<span class="teia-action-pill" style="border-color: #ef4444; color: #fca5a5; cursor: default;">💀 ${this.escapeHtml(name)}</span>`;
            }).join('')}
          </div>
        </div>
      `;
    }

    let causedByHtml = '';
    if (node.caused_by && node.caused_by.length > 0) {
      causedByHtml = `
        <div class="teia-dossier-section">
          <div class="teia-dossier-section-title">⬅️ Origem & Antecedentes</div>
          <div class="teia-conn-list">
            ${node.caused_by.map(fromId => {
              const prev = teia.nodes.find(n => n.id === fromId);
              if (!prev) return '';
              return `<div class="teia-conn-link" onclick="window.teiaController.inspectNode('${fromId}')">▲ ${this.escapeHtml(prev.title)} (${this.escapeHtml(prev.year_display)})</div>`;
            }).join('')}
          </div>
        </div>
      `;
    }

    let leadsToHtml = '';
    if (node.leads_to && node.leads_to.length > 0) {
      leadsToHtml = `
        <div class="teia-dossier-section">
          <div class="teia-dossier-section-title">➡️ Consequências & Vertentes Desencadeadas</div>
          <div class="teia-conn-list">
            ${node.leads_to.map(toId => {
              const nxt = teia.nodes.find(n => n.id === toId);
              if (!nxt) return '';
              return `<div class="teia-conn-link" onclick="window.teiaController.inspectNode('${toId}')">▼ ${this.escapeHtml(nxt.title)} (${this.escapeHtml(nxt.year_display)})</div>`;
            }).join('')}
          </div>
        </div>
      `;
    }

    const linksHtml = (node.linked_campaign || node.linked_location) ? `
      <div class="teia-dossier-section">
        <div class="teia-dossier-section-title">🔗 Conexões Diretas no Museu</div>
        <div class="teia-pill-list">
          ${node.linked_campaign ? `<button class="teia-action-pill" onclick="window.teiaController.openCampaign('${this.escapeHtml(node.linked_campaign)}')">📜 Abrir Dossiê da Campanha</button>` : ''}
          ${node.linked_location ? `<button class="teia-action-pill" onclick="window.teiaController.focusLocation('${this.escapeHtml(node.linked_location)}')">🌐 Focar no Planeta 3D</button>` : ''}
        </div>
      </div>
    ` : '';

    const contentEl = document.getElementById('teia-inspector-content');
    if (contentEl) {
      contentEl.innerHTML = `
        <div class="teia-dossier-tag" style="color: ${color};">
          ${this.escapeHtml(era ? (era.badge || era.name) : 'EVENTO CANÔNICO')} // ${this.escapeHtml(node.year_display)}
        </div>
        <h3 class="teia-dossier-title">${this.escapeHtml(node.title)}</h3>
        ${node.quote ? `<div class="teia-dossier-quote">"${this.escapeHtml(node.quote)}"</div>` : ''}
        <div class="teia-dossier-body">${this.escapeHtml(node.summary)}</div>
        ${node.impact ? `<div style="margin-top:8px;padding:8px 10px;border-left:2px solid #ffd700;background:rgba(212,175,55,0.08);font-size:0.78rem;color:#f5d57a;"><strong>Impacto:</strong> ${this.escapeHtml(node.impact)}</div>` : ''}
        ${linksHtml}
        ${charactersHtml}
        ${relicsHtml}
        ${bestiaryHtml}
        ${causedByHtml}
        ${leadsToHtml}
      `;
    }

    inspector.style.display = 'flex';
  }

  closeInspector() {
    const inspector = document.getElementById('teia-inspector');
    if (inspector) inspector.style.display = 'none';
    this.selectedNodeId = null;
  }

  openCampaign(campId) {
    this.closeModal();
    if (window.uiController) {
      window.uiController.openCampaignStory(campId);
    }
  }

  focusLocation(locId) {
    this.closeModal();
    if (window.planetEngine?.flyToLocationId) {
      window.planetEngine.flyToLocationId(locId);
    } else if (window.museumController?.focusLocationById) {
      window.museumController.focusLocationById(locId);
    }
  }

  openCharacterSheet(charId) {
    this.closeModal();
    if (window.uiController) {
      window.uiController.openCharacterSheet(charId);
    }
  }
}

// Instância global
window.TeiaDoTempoController = TeiaDoTempoController;
