/**
 * CLOUD WARP & PLANETARY DESCENT ENGINE
 * Universo: Evren — Mesa Interativa
 * Simula a descida orbital hipersônica através das camadas atmosféricas
 * e a penetração volumétrica de nuvens até a chegada nas coordenadas do planeta.
 */

class CloudWarpEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = canvasId;
      this.canvas.className = 'cloud-warp-canvas';
      const overlay = document.getElementById('cloud-transition-overlay');
      if (overlay) {
        overlay.insertBefore(this.canvas, overlay.firstChild);
      }
    }
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.stars = [];
    this.clouds = [];
    this.isActive = false;
    this.direction = 1; // 1 = descida planetária, -1 = ascensão orbital
    this.animationId = null;

    this.altitudeTimer = null;
    this.currentAltitude = 85000;
    this.currentSpeed = 48;

    this.init();
  }

  init() {
    if (!this.canvas || !this.ctx) return;
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Cria partículas de velocidade hipersônica
    const starCount = 280;
    for (let i = 0; i < starCount; i++) {
      this.stars.push(this.createStar());
    }

    // Cria bancos de nuvens volumétricas no canvas
    const cloudCount = 35;
    for (let i = 0; i < cloudCount; i++) {
      this.clouds.push(this.createCloudPuff());
    }
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    if (this.canvas) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }
  }

  createStar() {
    return {
      x: (Math.random() - 0.5) * this.width * 2.2,
      y: (Math.random() - 0.5) * this.height * 2.2,
      z: Math.random() * this.width,
      pz: 0,
      size: Math.random() * 2 + 1,
      type: Math.random() > 0.8 ? 'plasma' : (Math.random() > 0.6 ? 'amber' : 'streak')
    };
  }

  createCloudPuff() {
    return {
      x: (Math.random() - 0.5) * this.width * 1.8,
      y: (Math.random() - 0.5) * this.height * 1.8,
      z: Math.random() * this.width + 100,
      radius: Math.random() * 90 + 40,
      alpha: Math.random() * 0.4 + 0.1
    };
  }

  startWarp(direction = 1, targetInfo = {}) {
    this.isActive = true;
    this.direction = direction;
    this.resize();

    const targetName = typeof targetInfo === 'string' ? targetInfo : (targetInfo.title || targetInfo.name || 'LOCAL TÁTICO');
    const coords = targetInfo.coords || targetInfo.coordinates || null;

    // Reseta partículas e nuvens
    for (let s of this.stars) {
      s.z = Math.random() * this.width;
      s.pz = s.z;
    }
    for (let c of this.clouds) {
      c.z = Math.random() * this.width + 100;
    }

    // Inicia telemetria dinâmica multi-estágio
    this.startAltitudeTelemetry(direction, targetName, coords);

    // Ativa câmera tremendo durante a reentrada
    if (direction === 1) {
      document.body.classList.add('camera-shudder');
    }

    if (!this.animationId) {
      const loop = () => {
        if (!this.isActive) return;
        this.render();
        this.animationId = requestAnimationFrame(loop);
      };
      this.animationId = requestAnimationFrame(loop);
    }
  }

  stopWarp() {
    this.isActive = false;
    document.body.classList.remove('camera-shudder');
    const overlay = document.getElementById('cloud-transition-overlay');
    if (overlay) {
      overlay.classList.remove('in-cloud-deck');
    }

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.altitudeTimer) {
      clearInterval(this.altitudeTimer);
      this.altitudeTimer = null;
    }
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
  }

  startAltitudeTelemetry(direction, locationName, coords) {
    if (this.altitudeTimer) clearInterval(this.altitudeTimer);

    const titleEl = document.getElementById('cloud-dive-title');
    const subEl = document.getElementById('cloud-dive-sub');
    const layerEl = document.getElementById('cloud-dive-layer');
    const altitudeEl = document.getElementById('cloud-telemetry-altitude');
    const velocityEl = document.getElementById('cloud-telemetry-velocity');
    const coordsEl = document.getElementById('cloud-telemetry-coordinates');
    const radiationEl = document.getElementById('cloud-telemetry-radiation');
    const reticleLabel = document.getElementById('reticle-target-label');
    const overlay = document.getElementById('cloud-transition-overlay');

    let alt = direction === 1 ? 85000 : 350;
    const targetAlt = direction === 1 ? 350 : 85000;
    const totalSteps = 42;
    let stepCount = 0;

    let coordStr = 'COORD: VARREDURA ATIVA';
    if (coords && Array.isArray(coords)) {
      const lat = coords[0].toFixed(2);
      const lng = coords[1].toFixed(2);
      coordStr = `COORD: ${lat}°${coords[0] >= 0 ? 'N' : 'S'}, ${lng}°${coords[1] >= 0 ? 'E' : 'W'}`;
    }

    if (coordsEl) coordsEl.textContent = coordStr;
    if (reticleLabel) {
      reticleLabel.textContent = direction === 1 ? `ALVO: [${locationName.toUpperCase()}]` : 'DESTINO: [ÓRBITA PLANETÁRIA]';
    }

    this.altitudeTimer = setInterval(() => {
      stepCount++;
      const progress = Math.min(1, stepCount / totalSteps);

      if (direction === 1) {
        // Curva de desaceleração suave (ease-out exponencial)
        alt = 85000 - Math.pow(progress, 0.75) * (85000 - targetAlt);
      } else {
        alt = 350 + Math.pow(progress, 1.4) * (85000 - 350);
      }

      // Velocidade proporcional
      let mach = 1;
      let speedText = 'VELOCIDADE: MACH 7.4';
      if (alt > 45000) {
        mach = 7.4 - (85000 - alt) / 40000 * 2.2;
        speedText = `VELOCIDADE: MACH ${mach.toFixed(1)}`;
      } else if (alt > 15000) {
        mach = 5.2 - (45000 - alt) / 30000 * 2.4;
        speedText = `VELOCIDADE: MACH ${mach.toFixed(1)}`;
      } else if (alt > 3000) {
        mach = 2.8 - (15000 - alt) / 12000 * 1.8;
        speedText = `VELOCIDADE: MACH ${mach.toFixed(1)}`;
      } else {
        const kmh = Math.round(920 - (3000 - alt) / 2700 * 640);
        speedText = `VELOCIDADE: ${Math.max(280, kmh)} km/h`;
      }

      // Camadas Atmosféricas
      let layerName = 'CAMADA: EXOSFERA (ÓRBITA)';
      if (alt > 50000) {
        layerName = 'CAMADA: EXOSFERA (REENTRADA)';
      } else if (alt > 20000) {
        layerName = 'CAMADA: MESOSFERA (FRICÇÃO)';
      } else if (alt > 6000) {
        layerName = 'CAMADA: ESTRATOSFERA (ALTA)';
      } else if (alt > 1200) {
        layerName = 'CAMADA: CUMULONIMBUS DENSO (ROMPE-NUVENS)';
        if (overlay) overlay.classList.add('in-cloud-deck');
      } else {
        layerName = 'ATMOSFERA LOCAL // CHEGADA TÁTICA';
        document.body.classList.remove('camera-shudder');
      }

      // Radiação / Ressonância
      const rad = direction === 1 ? (0.05 + progress * 88.4) : (88.4 - progress * 88.35);

      if (altitudeEl) {
        altitudeEl.textContent = `ALTITUDE: ${Math.max(100, Math.round(alt)).toLocaleString()}m`;
      }
      if (velocityEl) {
        velocityEl.textContent = speedText;
      }
      if (layerEl) {
        layerEl.textContent = layerName;
      }
      if (radiationEl) {
        radiationEl.textContent = `RESSONÂNCIA: ${Math.max(0.1, rad).toFixed(1)} mSv/h`;
      }

      if (progress >= 1) {
        clearInterval(this.altitudeTimer);
        this.altitudeTimer = null;
        if (altitudeEl) altitudeEl.textContent = `ALTITUDE: ${Math.round(targetAlt)}m`;
        document.body.classList.remove('camera-shudder');
      }
    }, 45);
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const cx = this.width / 2;
    const cy = this.height / 2;

    // Rastro escuro suave para motion blur
    ctx.fillStyle = 'rgba(2, 6, 12, 0.32)';
    ctx.fillRect(0, 0, this.width, this.height);

    const speed = this.direction === 1 ? 40 : -40;

    // Renderiza nuvens volumétricas no canvas se estiver nas nuvens
    const overlay = document.getElementById('cloud-transition-overlay');
    const inClouds = overlay && overlay.classList.contains('in-cloud-deck');

    if (inClouds) {
      for (let i = 0; i < this.clouds.length; i++) {
        const c = this.clouds[i];
        c.z -= speed * 1.4;
        if (c.z <= 0) c.z = this.width + 100;
        else if (c.z > this.width + 100) c.z = 10;

        const k = 220 / c.z;
        const px = c.x * k + cx;
        const py = c.y * k + cy;
        const rad = c.radius * k;

        if (px >= -rad && px <= this.width + rad && py >= -rad && py <= this.height + rad) {
          const alpha = Math.min(0.35, (1 - c.z / (this.width + 100)) * c.alpha * 1.5);
          const grad = ctx.createRadialGradient(px, py, 0, px, py, rad);
          grad.addColorStop(0, `rgba(220, 240, 255, ${alpha})`);
          grad.addColorStop(0.5, `rgba(180, 210, 235, ${alpha * 0.6})`);
          grad.addColorStop(1, 'rgba(150, 180, 210, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(px, py, rad, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Renderiza partículas de velocidade hipersônica
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      s.pz = s.z;
      s.z -= speed;

      if (s.z <= 0) {
        s.z = this.width;
        s.pz = s.z;
        s.x = (Math.random() - 0.5) * this.width * 2.2;
        s.y = (Math.random() - 0.5) * this.height * 2.2;
      } else if (s.z > this.width) {
        s.z = 1;
        s.pz = s.z;
        s.x = (Math.random() - 0.5) * this.width * 2.2;
        s.y = (Math.random() - 0.5) * this.height * 2.2;
      }

      const k = 250 / s.z;
      const px = s.x * k + cx;
      const py = s.y * k + cy;

      const pk = 250 / s.pz;
      const prevX = s.x * pk + cx;
      const prevY = s.y * pk + cy;

      if (px >= 0 && px <= this.width && py >= 0 && py <= this.height) {
        const alpha = Math.min(1, (1 - s.z / this.width) * 1.4);
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(px, py);

        if (s.type === 'plasma') {
          ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
        } else if (s.type === 'amber') {
          ctx.strokeStyle = `rgba(255, 140, 0, ${alpha * 0.9})`;
        } else {
          ctx.strokeStyle = i % 5 === 0 
            ? `rgba(57, 255, 20, ${alpha * 0.95})` 
            : `rgba(235, 245, 255, ${alpha * 0.75})`;
        }

        ctx.lineWidth = Math.max(1, (1 - s.z / this.width) * 3.8);
        ctx.stroke();
      }
    }
  }
}

// Expõe globalmente
window.CloudWarpEngine = CloudWarpEngine;
