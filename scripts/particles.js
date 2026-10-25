/**
 * ATMOSPHERIC & PARTICLE ENGINE (CANVAS 2D)
 * Universo: Evren — Mesa Interativa
 * Renderiza efeitos atmosféricos contextuais em tempo real:
 * - Visão Global: Esporos bioluminescentes, arcos elétricos dimensionais entre México e Bermuda.
 * - Mansão Vilar (México): Chuva torrencial, relâmpagos ocasionais e névoa rastejante.
 * - Triângulo das Bermudas: Vórtice oceânico abissal, anéis de fluxo magnético e plâncton abissal.
 */

class AtmosphericEngine {
  constructor(canvasId, mapEngine) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = canvasId;
      this.canvas.className = 'atmospheric-particles-canvas';
      const viewport = document.getElementById('app-viewport');
      if (viewport) {
        viewport.insertBefore(this.canvas, viewport.firstChild);
      }
    }
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.mapEngine = mapEngine;

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.animationId = null;
    this.isRunning = false;

    // Estado e partículas
    this.currentMode = 'global'; // 'global' | 'vilar' | 'triangulo'
    this.particles = [];
    this.spores = [];
    this.rainDrops = [];
    this.snowFlakes = [];
    this.vortexParticles = [];
    this.magneticRings = [];

    // Relâmpagos e Arcos Dimensionais
    this.lightningAlpha = 0;
    this.lastLightningTime = Date.now();
    this.nextLightningInterval = 5000 + Math.random() * 8000;

    this.dimensionalArcs = [];
    this.lastArcTime = Date.now();

    this.init();
  }

  init() {
    if (!this.canvas || !this.ctx) return;
    this.resize();

    window.addEventListener('resize', () => this.resize());

    // Se o Leaflet disparar zoom ou move, recalibra coordenadas quando necessário
    if (this.mapEngine && this.mapEngine.map) {
      this.mapEngine.map.on('move', () => this.onMapMove());
      this.mapEngine.map.on('zoom', () => this.onMapZoom());
    }

    this.seedParticles();
    this.start();
    console.log('✓ AtmosphericEngine inicializado com sucesso.');
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    if (this.canvas) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }
  }

  setMode(mode) {
    if (this.currentMode === mode) return;
    this.currentMode = mode;
    this.seedParticles();
  }

  seedParticles() {
    this.particles = [];
    this.spores = [];
    this.rainDrops = [];
    this.vortexParticles = [];
    this.magneticRings = [];

    if (this.currentMode === 'global') {
      // 1. Esporos cósmicos e poeira paranormal
      const count = Math.min(80, Math.floor(this.width * 0.05));
      for (let i = 0; i < count; i++) {
        this.spores.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.2 - Math.random() * 0.4,
          radius: 1 + Math.random() * 2.2,
          alpha: 0.1 + Math.random() * 0.6,
          hue: Math.random() > 0.4 ? 186 : 140, // Ciano ou Verde Biopunk
          pulseSpeed: 0.02 + Math.random() * 0.03
        });
      }
    } else if (this.currentMode === 'vilar') {
      // 2. Chuva torrencial e névoa das minas do México
      const rainCount = Math.min(180, Math.floor(this.width * 0.12));
      for (let i = 0; i < rainCount; i++) {
        this.rainDrops.push({
          x: Math.random() * (this.width + 200) - 100,
          y: Math.random() * this.height,
          length: 12 + Math.random() * 18,
          speed: 16 + Math.random() * 12,
          alpha: 0.2 + Math.random() * 0.4
        });
      }
    } else if (this.currentMode === 'triangulo') {
      // 3. Vórtice oceânico e anéis magnéticos de Nova Caronte / Kraken
      const vortexCount = 90;
      for (let i = 0; i < vortexCount; i++) {
        this.vortexParticles.push({
          angle: Math.random() * Math.PI * 2,
          distance: 40 + Math.random() * 320,
          speed: 0.008 + Math.random() * 0.018,
          radius: 1.2 + Math.random() * 2.5,
          alpha: 0.2 + Math.random() * 0.7,
          color: Math.random() > 0.5 ? '#00e5ff' : '#e74c3c'
        });
      }
      this.magneticRings = [
        { radius: 60, maxRadius: 360, speed: 1.2, alpha: 0.7 },
        { radius: 180, maxRadius: 360, speed: 1.2, alpha: 0.4 },
        { radius: 300, maxRadius: 360, speed: 1.2, alpha: 0.15 }
      ];
    } else if (this.currentMode === 'artico') {
      // 4. Nevasca polar, cristais de gelo e ventania subglacial da Groenlândia
      const snowCount = Math.min(180, Math.floor(this.width * 0.12));
      for (let i = 0; i < snowCount; i++) {
        this.snowFlakes.push({
          x: Math.random() * (this.width + 400) - 200,
          y: Math.random() * this.height,
          vx: 3.0 + Math.random() * 5.0,
          vy: 1.8 + Math.random() * 3.5,
          size: 1.2 + Math.random() * 3.8,
          alpha: 0.25 + Math.random() * 0.7,
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 0.04 + Math.random() * 0.06
        });
      }
    } else if (this.currentMode === 'selva') {
      // 5. Chuva tropical ácida & esporos bioelétricos da Amazônia (Brasil)
      const sporeCount = Math.min(100, Math.floor(this.width * 0.08));
      for (let i = 0; i < sporeCount; i++) {
        this.spores.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -0.3 - Math.random() * 0.6,
          radius: 1.5 + Math.random() * 3,
          alpha: 0.2 + Math.random() * 0.7,
          hue: Math.random() > 0.3 ? 120 : 160,
          pulseSpeed: 0.03 + Math.random() * 0.04
        });
      }
      const rainCount = Math.min(90, Math.floor(this.width * 0.06));
      for (let i = 0; i < rainCount; i++) {
        this.rainDrops.push({
          x: Math.random() * (this.width + 100) - 50,
          y: Math.random() * this.height,
          length: 10 + Math.random() * 14,
          speed: 14 + Math.random() * 10,
          alpha: 0.15 + Math.random() * 0.35
        });
      }
    } else if (this.currentMode === 'floresta') {
      // 6. Névoa gótica e esporos do Monastério da Floresta Negra (Alemanha)
      const sporeCount = Math.min(110, Math.floor(this.width * 0.09));
      for (let i = 0; i < sporeCount; i++) {
        this.spores.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -0.1 - Math.random() * 0.3,
          radius: 2 + Math.random() * 3.5,
          alpha: 0.15 + Math.random() * 0.55,
          hue: Math.random() > 0.4 ? 270 : 220,
          pulseSpeed: 0.02 + Math.random() * 0.02
        });
      }
    }
  }

  onMapMove() {
    // Pode sincronizar posições projetadas se necessário
  }

  onMapZoom() {
    // Recalibra
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    const loop = () => {
      if (!this.isRunning) return;
      this.render();
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  render() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.currentMode === 'global') {
      this.renderGlobalEffects();
    } else if (this.currentMode === 'vilar') {
      this.renderVilarEffects();
    } else if (this.currentMode === 'triangulo') {
      this.renderTrianguloEffects();
    } else if (this.currentMode === 'artico') {
      this.renderArticoEffects();
    }
  }

  /* ==========================================================================
     A. EFEITOS GLOBAIS (MAPA MÚNDI REAL)
     ========================================================================== */
  renderGlobalEffects() {
    const ctx = this.ctx;

    // 1. Esporos e poeira sobrenatural
    for (let i = 0; i < this.spores.length; i++) {
      const p = this.spores[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha += Math.sin(Date.now() * p.pulseSpeed) * 0.01;

      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      const curAlpha = Math.max(0.05, Math.min(0.8, p.alpha));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${curAlpha})`;
      ctx.shadowColor = `hsl(${p.hue}, 100%, 65%)`;
      ctx.shadowBlur = 8;
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // 2. Fenda Dimensional: Arcos Elétricos entre México e Bermudas
    if (this.mapEngine && this.mapEngine.map) {
      try {
        const mexicoPt = this.mapEngine.map.latLngToContainerPoint([21.85, -102.25]);
        const bermudaPt = this.mapEngine.map.latLngToContainerPoint([25.50, -71.50]);

        // Gera novo arco elétrico periodicamente
        const now = Date.now();
        if (now - this.lastArcTime > 1400) {
          this.lastArcTime = now;
          this.dimensionalArcs.push({
            born: now,
            duration: 250,
            segments: this.generateLightningPath(mexicoPt, bermudaPt, 10, 22)
          });
        }

        // Renderiza arcos ativos
        for (let a = this.dimensionalArcs.length - 1; a >= 0; a--) {
          const arc = this.dimensionalArcs[a];
          const age = now - arc.born;
          if (age > arc.duration) {
            this.dimensionalArcs.splice(a, 1);
            continue;
          }

          const arcAlpha = (1 - age / arc.duration) * 0.65;
          ctx.beginPath();
          ctx.moveTo(arc.segments[0].x, arc.segments[0].y);
          for (let s = 1; s < arc.segments.length; s++) {
            ctx.lineTo(arc.segments[s].x, arc.segments[s].y);
          }
          ctx.strokeStyle = `rgba(0, 229, 255, ${arcAlpha})`;
          ctx.lineWidth = 1.8;
          ctx.shadowColor = '#00e5ff';
          ctx.shadowBlur = 12;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      } catch (e) {
        // Ignora erros de projeção de coordenadas durante flyTo
      }
    }
  }

  generateLightningPath(start, end, steps, roughness) {
    const points = [start];
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const lx = start.x + (end.x - start.x) * t;
      const ly = start.y + (end.y - start.y) * t;
      const offset = (Math.random() - 0.5) * roughness * 2;
      points.push({ x: lx + offset, y: ly + offset });
    }
    points.push(end);
    return points;
  }

  /* ==========================================================================
     B. EFEITOS LOCAIS: MANSÃO VILAR (MÉXICO)
     ========================================================================== */
  renderVilarEffects() {
    const ctx = this.ctx;
    const now = Date.now();

    // 1. Relâmpago na Tempestade da Mansão
    if (now - this.lastLightningTime > this.nextLightningInterval) {
      this.lastLightningTime = now;
      this.nextLightningInterval = 4000 + Math.random() * 9000;
      this.lightningAlpha = 0.55;
      if (window.soundFX && window.soundFX.playThunder) {
        window.soundFX.playThunder();
      }
    }

    if (this.lightningAlpha > 0.01) {
      ctx.fillStyle = `rgba(180, 220, 255, ${this.lightningAlpha})`;
      ctx.fillRect(0, 0, this.width, this.height);
      this.lightningAlpha *= 0.88;
    }

    // 2. Chuva torrencial inclinada
    ctx.strokeStyle = 'rgba(160, 210, 255, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < this.rainDrops.length; i++) {
      const drop = this.rainDrops[i];
      drop.y += drop.speed;
      drop.x -= drop.speed * 0.22; // Vento da montanha

      if (drop.y > this.height) {
        drop.y = -drop.length;
        drop.x = Math.random() * (this.width + 200) - 100;
      }

      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - drop.length * 0.22, drop.y + drop.length);
    }
    ctx.stroke();

    // 3. Névoa rastejante no fundo
    const fogGradient = ctx.createLinearGradient(0, this.height - 180, 0, this.height);
    fogGradient.addColorStop(0, 'rgba(4, 18, 12, 0)');
    fogGradient.addColorStop(1, 'rgba(10, 35, 20, 0.45)');
    ctx.fillStyle = fogGradient;
    ctx.fillRect(0, this.height - 180, this.width, 180);
  }

  /* ==========================================================================
     C. EFEITOS LOCAIS: TRIÂNGULO DAS BERMUDAS (ANOMALIA)
     ========================================================================== */
  renderTrianguloEffects() {
    const ctx = this.ctx;
    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;

    // 1. Anéis Magnéticos Pulsantes
    for (let r = 0; r < this.magneticRings.length; r++) {
      const ring = this.magneticRings[r];
      ring.radius += ring.speed;
      if (ring.radius > ring.maxRadius) {
        ring.radius = 40;
      }
      const ringProgress = (ring.radius - 40) / (ring.maxRadius - 40);
      const ringAlpha = (1 - ringProgress) * 0.35;

      ctx.beginPath();
      ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 229, 255, ${ringAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2. Vórtice Abissal Rotativo
    for (let i = 0; i < this.vortexParticles.length; i++) {
      const vp = this.vortexParticles[i];
      vp.angle += vp.speed;
      vp.distance -= 0.15; // Espirala para dentro

      if (vp.distance < 30) {
        vp.distance = 280 + Math.random() * 80;
      }

      const px = centerX + Math.cos(vp.angle) * vp.distance;
      const py = centerY + Math.sin(vp.angle) * (vp.distance * 0.65); // Perspectiva elíptica

      ctx.beginPath();
      ctx.arc(px, py, vp.radius, 0, Math.PI * 2);
      ctx.fillStyle = vp.color === '#e74c3c' 
        ? `rgba(231, 76, 60, ${vp.alpha})` 
        : `rgba(0, 229, 255, ${vp.alpha})`;
      ctx.shadowColor = vp.color;
      ctx.shadowBlur = 6;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  /* ==========================================================================
     D. EFEITOS POLARES DA ESTAÇÃO ZERO (GROENLÂNDIA)
     ========================================================================== */
  renderArticoEffects() {
    const ctx = this.ctx;

    // Flocos de neve e cristais com ventania polar
    for (let i = 0; i < this.snowFlakes.length; i++) {
      const s = this.snowFlakes[i];
      s.x += s.vx;
      s.y += s.vy;
      s.sway += s.swaySpeed;

      const swayOffset = Math.sin(s.sway) * 1.5;

      if (s.y > this.height || s.x > this.width + 100) {
        s.y = -10;
        s.x = Math.random() * (this.width + 200) - 100;
      }

      ctx.beginPath();
      ctx.arc(s.x + swayOffset, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(224, 247, 255, ${s.alpha})`;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = s.size > 2.5 ? 8 : 2;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
}

// Expõe globalmente
window.AtmosphericEngine = AtmosphericEngine;
