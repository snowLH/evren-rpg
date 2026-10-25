/**
 * OCCULT RADAR & 3D HOLOGRAPHIC PLANETARY GLOBE WIDGET
 * Universo: Evren — Mesa Interativa
 * Renderiza um sonar CRT holográfico e um mini-globo 3D rotativo da Terra,
 * exibindo as anomalias planetárias e sincronizando com as coordenadas da câmera.
 */

class OccultRadarWidget {
  constructor(containerId, mapEngine, uiController) {
    this.container = document.getElementById(containerId);
    this.mapEngine = mapEngine;
    this.uiController = uiController;

    this.canvas = null;
    this.ctx = null;
    this.sweepAngle = 0;
    this.isMinimized = false;
    this.animationId = null;
    this.mode = 'globe'; // 'globe' (Mini-Globo 3D) ou 'sonar' (Sonar CRT)
    this.globeAngleY = 0;
    this.targetAngleY = 0;
    this.globeAngleX = 0.25; // Leve inclinação axial da Terra (23.5°)

    // 5 Anomalias planetárias canônicas de Evren
    this.blips = [
      {
        id: 'blip_bermuda',
        name: 'Triângulo das Bermudas',
        threat: 'ÔMEGA (99% MDA)',
        campaignId: 'camp_001',
        coords: [25.5, -71.5],
        color: '#ff3366',
        icon: '🌊',
        country: 'Oceano Atlântico'
      },
      {
        id: 'blip_vilar',
        name: 'Mansão Vilar',
        threat: 'ALFA (LIMIAR)',
        campaignId: 'camp_002',
        coords: [21.85, -102.25],
        color: '#00e5ff',
        icon: '🏛️',
        country: 'México'
      },
      {
        id: 'blip_artico',
        name: 'Estação Zero',
        threat: 'BETA (CRIOPARASITAS)',
        campaignId: 'camp_003',
        coords: [72.0, -40.0],
        color: '#22d3ee',
        icon: '❄️',
        country: 'Groenlândia'
      },
      {
        id: 'blip_selva',
        name: 'Bacia do Tapajós',
        threat: 'ÔMEGA (QUARTZO)',
        campaignId: 'camp_004',
        coords: [-4.25, -55.98],
        color: '#39ff14',
        icon: '🌿',
        country: 'Brasil'
      },
      {
        id: 'blip_floresta',
        name: 'Monastério Sem-Rosto',
        threat: 'ALFA (ECO AMNÉSICO)',
        campaignId: 'camp_005',
        coords: [48.15, 8.20],
        color: '#c084fc',
        icon: '🔔',
        country: 'Alemanha'
      }
    ];

    this.init();
  }

  init() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="radar-card" id="radar-card">
        <div class="radar-header">
          <div class="radar-title-wrap">
            <span class="radar-indicator-led"></span>
            <span id="radar-title-label" class="radar-title">GLOBO 3D // EVREN</span>
          </div>
          <div class="radar-controls">
            <button class="radar-btn-mode" id="btn-toggle-radar-mode" title="Alternar Sonar / Globo 3D">
              🌐
            </button>
            <button class="radar-btn-toggle" id="btn-toggle-radar" title="Minimizar / Expandir [Z]">
              _
            </button>
          </div>
        </div>
        <div class="radar-display-wrap" id="radar-display-wrap">
          <canvas id="radar-screen-canvas" width="168" height="168"></canvas>
          <div class="radar-scanlines"></div>
          <div class="radar-telemetry-badge" id="radar-threat-badge">ÓRBITA ATIVA</div>
        </div>
        <div class="radar-blip-list" id="radar-blip-list">
          <!-- Lista compacta de anomalias -->
        </div>
      </div>
    `;

    this.canvas = document.getElementById('radar-screen-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }

    const toggleBtn = document.getElementById('btn-toggle-radar');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleMinimize());
    }

    const modeBtn = document.getElementById('btn-toggle-radar-mode');
    if (modeBtn) {
      modeBtn.addEventListener('click', () => this.toggleMode());
    }

    // Interação de Arrasto e Clique no Mini-Globo 3D
    let isDraggingGlobe = false;
    let startMouseX = 0, startMouseY = 0;
    let dragDistance = 0;

    if (this.canvas) {
      this.canvas.style.cursor = 'grab';
      this.canvas.addEventListener('mousedown', (e) => {
        isDraggingGlobe = true;
        startMouseX = e.clientX;
        startMouseY = e.clientY;
        dragDistance = 0;
        this.canvas.style.cursor = 'grabbing';
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDraggingGlobe) return;
        const dx = e.clientX - startMouseX;
        const dy = e.clientY - startMouseY;
        dragDistance += Math.abs(dx) + Math.abs(dy);
        startMouseX = e.clientX;
        startMouseY = e.clientY;
        this.globeAngleY += dx * 0.02;
        this.globeAngleX = Math.max(-0.8, Math.min(0.8, this.globeAngleX + dy * 0.02));
      });

      window.addEventListener('mouseup', () => {
        if (isDraggingGlobe) {
          isDraggingGlobe = false;
          if (this.canvas) this.canvas.style.cursor = 'grab';
        }
      });

      this.canvas.addEventListener('click', (e) => {
        if (dragDistance > 6) return;
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        this.checkGlobeBeaconClick(mx, my);
      });
    }

    // Tecla Z de atalho para minimizar
    window.addEventListener('keydown', (e) => {
      if (e.key === 'z' || e.key === 'Z') {
        const activeTag = document.activeElement ? document.activeElement.tagName : '';
        if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
          this.toggleMinimize();
        }
      }
    });

    this.renderBlipList();
    this.startLoop();

    // Expõe globalmente
    window.occultRadar = this;
    console.log('✓ OccultRadarWidget (Sonar & Globo 3D) inicializado com sucesso.');
  }

  toggleMode() {
    this.mode = this.mode === 'globe' ? 'sonar' : 'globe';
    const label = document.getElementById('radar-title-label');
    const badge = document.getElementById('radar-threat-badge');
    if (label) {
      label.textContent = this.mode === 'globe' ? 'GLOBO 3D // EVREN' : 'SONAR CRT // AEGIS';
    }
    if (badge) {
      badge.textContent = this.mode === 'globe' ? 'ÓRBITA ATIVA' : 'VARREDURA 360°';
    }
    if (this.uiController?.soundFX) {
      this.uiController.soundFX.playTacticalBeep();
    }
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    const card = document.getElementById('radar-card');
    const wrap = document.getElementById('radar-display-wrap');
    const list = document.getElementById('radar-blip-list');
    const toggleBtn = document.getElementById('btn-toggle-radar');

    if (card) {
      card.classList.toggle('radar-minimized', this.isMinimized);
    }
    if (wrap) wrap.style.display = this.isMinimized ? 'none' : 'block';
    if (list) list.style.display = this.isMinimized ? 'none' : 'block';
    if (toggleBtn) toggleBtn.textContent = this.isMinimized ? '□' : '_';

    if (this.uiController?.soundFX) {
      this.uiController.soundFX.playTacticalBeep();
    }
  }

  renderBlipList() {
    const list = document.getElementById('radar-blip-list');
    if (!list) return;

    list.innerHTML = this.blips.map(b => `
      <div class="radar-blip-item" onclick="window.occultRadar.onBlipClick('${b.campaignId}')" title="Mergulhar nas nuvens em direção a ${b.name} (${b.country})">
        <span class="blip-dot" style="background: ${b.color}; box-shadow: 0 0 8px ${b.color};"></span>
        <span class="blip-name">${b.icon} ${b.name}</span>
        <span class="blip-threat">${b.threat}</span>
      </div>
    `).join('');
  }

  onBlipClick(campaignId) {
    if (this.mapEngine) {
      this.mapEngine.mergulhoNasNuvens(campaignId);
    }
  }

  checkGlobeBeaconClick(mx, my) {
    if (this.mode !== 'globe') return;
    for (const b of this.blips) {
      if (b._screenVisible) {
        const dist = Math.hypot(mx - b._screenX, my - b._screenY);
        if (dist <= 18) {
          if (this.uiController?.soundFX) this.uiController.soundFX.playRadarPing();
          this.onBlipClick(b.campaignId);
          break;
        }
      }
    }
  }

  startLoop() {
    const render = () => {
      if (!this.isMinimized && this.ctx) {
        if (this.mode === 'globe') {
          this.draw3DGlobe();
        } else {
          this.drawRadar();
        }
      }
      this.animationId = requestAnimationFrame(render);
    };
    this.animationId = requestAnimationFrame(render);
  }

  /* ==========================================================================
     RENDERIZADOR 3D: MINI-GLOBO HOLOGRÁFICO DA TERRA COM COORDENADAS REAIS
     ========================================================================== */
  draw3DGlobe() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const R = w * 0.40;

    // Fundo espacial profundo com vinheta
    ctx.fillStyle = 'rgba(2, 6, 14, 0.35)';
    ctx.fillRect(0, 0, w, h);

    // Rotação suave contínua
    this.globeAngleY += 0.008;

    // Se houver um centro ativo no mapa, orienta suavemente para lá
    if (this.mapEngine?.map && this.mapEngine.currentScale === 'local') {
      const center = this.mapEngine.map.getCenter();
      if (center) {
        const targetRad = -(center.lng * Math.PI / 180);
        // Interpolação suave em direção ao alvo
        this.targetAngleY = targetRad;
      }
    }

    // Aura atmosférica esférica
    const auraGrad = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 1.15);
    auraGrad.addColorStop(0, 'rgba(0, 229, 255, 0)');
    auraGrad.addColorStop(0.85, 'rgba(0, 229, 255, 0.18)');
    auraGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.15, 0, Math.PI * 2);
    ctx.fill();

    // Contorno da esfera terrestre
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();

    // Sombra de oclusão do lado noturno da esfera
    const sphereShade = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
    sphereShade.addColorStop(0, 'rgba(10, 30, 55, 0.35)');
    sphereShade.addColorStop(0.7, 'rgba(3, 12, 24, 0.7)');
    sphereShade.addColorStop(1, 'rgba(1, 4, 10, 0.95)');
    ctx.fillStyle = sphereShade;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // Projeção 3D de Paralelos (Linhas de Latitude)
    const parallels = [-60, -30, 0, 30, 60];
    parallels.forEach(lat => {
      const phi = lat * Math.PI / 180;
      const rLat = R * Math.cos(phi);
      const yLat = cy - R * Math.sin(phi) * Math.cos(this.globeAngleX);

      ctx.strokeStyle = lat === 0 ? 'rgba(0, 229, 255, 0.45)' : 'rgba(0, 229, 255, 0.15)';
      ctx.lineWidth = lat === 0 ? 1.2 : 0.8;
      ctx.beginPath();
      ctx.ellipse(cx, yLat, rLat, rLat * Math.sin(this.globeAngleX), 0, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Projeção 3D de Meridianos (Linhas de Longitude)
    for (let i = 0; i < 8; i++) {
      const theta = this.globeAngleY + (i * Math.PI / 4);
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      ctx.strokeStyle = cosT > 0 ? 'rgba(0, 229, 255, 0.22)' : 'rgba(0, 229, 255, 0.08)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * Math.abs(sinT), R, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Plota as 5 anomalias planetárias canônicas na superfície esférica 3D
    this.blips.forEach(b => {
      const [lat, lng] = b.coords;
      const latRad = lat * Math.PI / 180;
      const lngRad = (lng * Math.PI / 180) + this.globeAngleY;

      // Coordenadas cartesianas 3D na esfera unitária
      const x3d = Math.cos(latRad) * Math.sin(lngRad);
      const y3d = -Math.sin(latRad);
      const z3d = Math.cos(latRad) * Math.cos(lngRad);

      // Rotação axial (inclinação da Terra)
      const rotY = y3d * Math.cos(this.globeAngleX) - z3d * Math.sin(this.globeAngleX);
      const rotZ = y3d * Math.sin(this.globeAngleX) + z3d * Math.cos(this.globeAngleX);

      // Projeção na tela 2D
      const px = cx + x3d * R;
      const py = cy + rotY * R;

      b._screenX = px;
      b._screenY = py;
      b._screenVisible = rotZ > -0.15;

      // Somente visível se estiver na face frontal do globo (rotZ > -0.1)
      if (rotZ > -0.15) {
        const alpha = Math.max(0.2, (rotZ + 0.15) / 1.15);

        // Pulso do beacon
        const pulse = 3 + Math.sin(Date.now() * 0.006) * 1.5;

        // Ponto central
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py, pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Halo holográfico
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, pulse + 3, 0, Math.PI * 2);
        ctx.stroke();

        // Rótulo se estiver bem na face frontal
        if (rotZ > 0.4) {
          ctx.font = '8px monospace';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(b.name, px + 7, py - 4);
        }
      }
    });

    // Retículo central de orientação
    ctx.strokeStyle = 'rgba(57, 255, 20, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy);
    ctx.lineTo(cx + 5, cy);
    ctx.moveTo(cx, cy - 5);
    ctx.lineTo(cx, cy + 5);
    ctx.stroke();
  }

  /* ==========================================================================
     RENDERIZADOR 2D: SONAR CRT CLÁSSICO COM VARREDURA 360°
     ========================================================================== */
  drawRadar() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const maxRadius = w * 0.44;

    // Fundo CRT
    ctx.fillStyle = 'rgba(3, 10, 18, 0.25)';
    ctx.fillRect(0, 0, w, h);

    // Círculos concêntricos
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let r = 0.25; r <= 1.0; r += 0.25) {
      ctx.beginPath();
      ctx.arc(cx, cy, maxRadius * r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Eixos da mira
    ctx.beginPath();
    ctx.moveTo(cx, cy - maxRadius);
    ctx.lineTo(cx, cy + maxRadius);
    ctx.moveTo(cx - maxRadius, cy);
    ctx.lineTo(cx + maxRadius, cy);
    ctx.stroke();

    // Linha de Varredura Sweep
    this.sweepAngle += 0.038;
    if (this.sweepAngle > Math.PI * 2) {
      this.sweepAngle -= Math.PI * 2;
    }

    const sweepX = cx + Math.cos(this.sweepAngle) * maxRadius;
    const sweepY = cy + Math.sin(this.sweepAngle) * maxRadius;

    // Gradiente da cauda da varredura
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, maxRadius, this.sweepAngle - 0.45, this.sweepAngle);
    ctx.closePath();
    const sweepGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, maxRadius);
    sweepGrad.addColorStop(0, 'rgba(0, 229, 255, 0.05)');
    sweepGrad.addColorStop(1, 'rgba(0, 229, 255, 0.35)');
    ctx.fillStyle = sweepGrad;
    ctx.fill();
    ctx.restore();

    // Raio primário
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(sweepX, sweepY);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Plota os blips no radar planar
    this.blips.forEach((b, idx) => {
      const angle = (idx * (Math.PI * 2 / 5)) + 0.3;
      const dist = 0.45 + (idx * 0.1);
      const bx = cx + Math.cos(angle) * (maxRadius * dist);
      const by = cy + Math.sin(angle) * (maxRadius * dist);

      // Checa se o feixe de varredura acabou de passar por ele
      let diff = this.sweepAngle - angle;
      if (diff < 0) diff += Math.PI * 2;

      let alpha = 0.25;
      if (diff < 0.6) {
        alpha = 1.0 - (diff / 0.6) * 0.75;
      }

      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = alpha > 0.6 ? 10 : 2;
      ctx.beginPath();
      ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }
}

// Expõe globalmente
window.OccultRadarWidget = OccultRadarWidget;
