/**
 * NÉVOA DE GUERRA TÁTICA (FOG OF WAR CONTROLLER)
 * Universo: Evren — Mesa Interativa
 * Permite ao Mestre ocultar segredos do mapa com uma névoa dinâmica
 * e revelá-la com pincel manual ou baseada na visão dos tokens.
 */

class FogOfWar {
  constructor(mapEngine) {
    this.mapEngine = mapEngine;
    this.canvas = null;
    this.ctx = null;
    this.isEnabled = false;
    this.currentMode = 'reveal'; // 'reveal' | 'hide'
    this.brushRadius = 75; // Raio em pixels
    this.isDrawing = false;
    this.controlsEl = null;
  }

  init() {
    this.controlsEl = document.getElementById('fog-controls-hud');
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Cria o elemento Canvas sobre o container do mapa
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'fog-of-war-canvas';
    this.canvas.style.display = 'none';
    mapContainer.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Wires dos controles
    const btnToggle = document.getElementById('btn-toggle-fog');
    const btnRevealTool = document.getElementById('btn-fog-reveal-tool');
    const btnHideTool = document.getElementById('btn-fog-hide-tool');
    const btnTokensSight = document.getElementById('btn-fog-reveal-tokens');
    const btnReset = document.getElementById('btn-fog-reset');

    if (btnToggle) {
      btnToggle.addEventListener('click', () => this.toggle());
    }

    if (btnRevealTool && btnHideTool) {
      btnRevealTool.addEventListener('click', () => {
        this.currentMode = 'reveal';
        btnRevealTool.classList.add('active');
        btnHideTool.classList.remove('active');
      });

      btnHideTool.addEventListener('click', () => {
        this.currentMode = 'hide';
        btnHideTool.classList.add('active');
        btnRevealTool.classList.remove('active');
      });
    }

    if (btnTokensSight) {
      btnTokensSight.addEventListener('click', () => this.revealAroundTokens());
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => this.coverAll());
    }

    // Interações de mouse no canvas quando interativo
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDrawing = true;
      this.applyBrushAt(e);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isDrawing) {
        this.applyBrushAt(e);
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDrawing = false;
    });

    console.log('✓ FogOfWar inicializado com sucesso.');
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    if (this.isEnabled) {
      this.coverAll();
    }
  }

  toggle() {
    this.isEnabled = !this.isEnabled;
    const btnToggle = document.getElementById('btn-toggle-fog');

    if (this.isEnabled) {
      this.canvas.style.display = 'block';
      this.canvas.classList.add('fog-interactive');
      if (this.controlsEl) this.controlsEl.classList.remove('hidden');
      if (btnToggle) btnToggle.classList.add('active');
      this.coverAll();
      this.revealAroundTokens();
      if (window.soundFX) window.soundFX.playTacticalBeep();
      if (window.sessionJournal) {
        window.sessionJournal.logEvent('🌫️ Névoa de Guerra tática ativada pelo Mestre.');
      }
    } else {
      this.canvas.style.display = 'none';
      this.canvas.classList.remove('fog-interactive');
      if (this.controlsEl) this.controlsEl.classList.add('hidden');
      if (btnToggle) btnToggle.classList.remove('active');
      if (window.soundFX) window.soundFX.playTacticalBeep();
    }
  }

  coverAll() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = 'rgba(3, 7, 14, 0.94)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  applyBrushAt(e) {
    if (!this.ctx || !this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.currentMode === 'reveal') {
      // Borracha com degradê suave
      this.ctx.globalCompositeOperation = 'destination-out';
      const radGrad = this.ctx.createRadialGradient(x, y, this.brushRadius * 0.4, x, y, this.brushRadius);
      radGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
      radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.ctx.fillStyle = radGrad;
      this.ctx.beginPath();
      this.ctx.arc(x, y, this.brushRadius, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      // Repõe névoa
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.fillStyle = 'rgba(3, 7, 14, 0.94)';
      this.ctx.beginPath();
      this.ctx.arc(x, y, this.brushRadius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  revealAroundTokens() {
    if (!this.ctx || !this.mapEngine || !this.mapEngine.battlemapTokens) return;
    const activeTokens = this.mapEngine.battlemapTokens.activeTokens;
    if (!activeTokens || activeTokens.size === 0) return;

    this.ctx.globalCompositeOperation = 'destination-out';

    activeTokens.forEach(item => {
      if (item.marker) {
        const latlng = item.marker.getLatLng();
        const pt = this.mapEngine.map.latLngToContainerPoint(latlng);
        const radius = 110; // Raio de visão tática

        const radGrad = this.ctx.createRadialGradient(pt.x, pt.y, radius * 0.5, pt.x, pt.y, radius);
        radGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = radGrad;
        this.ctx.beginPath();
        this.ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

    if (window.soundFX) window.soundFX.playRadarPing();
  }
}

window.FogOfWar = FogOfWar;
