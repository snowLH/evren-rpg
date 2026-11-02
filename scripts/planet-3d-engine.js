/**
 * PLANET 3D ENGINE — MOTOR GEOGRÁFICO E CARTOGRÁFICO 3D (THREE.JS)
 * Universo: Evren — Museu Histórico Interativo 3D
 *
 * Hierarquia de Navegação:
 * PLANETA -> CONTINENTE -> PAÍS -> REGIÃO -> CIDADE/LOCAL -> CAMPANHA -> HISTÓRIA
 *
 * Escalas Progressivas (LOD):
 * 1. global       (distância > 245)  : Planeta completo, continentes, oceanos, indicadores de campanhas
 * 2. continental  (180 < dist <= 245): Países, fronteiras, cadeias de montanhas, florestas, desertos, rios
 * 3. regional     (136 < dist <= 180): Regiões geográficas, cidades, vilas, áreas desconhecidas, campanhas
 * 4. local        (dist <= 136)      : Locais históricos específicos, construções, ruínas e exposições locais
 */

class Planet3DEngine {
  constructor(containerId, dataLoader, onSelectionCallback) {
    this.containerId = containerId;
    this.dataLoader = dataLoader;
    this.onSelectionCallback = onSelectionCallback;

    this.container = null;
    this.canvasContainer = null;
    this.markersLayer = null;

    // Three.js core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.globeGroup = null;
    this.planetMesh = null;
    this.cloudMesh = null;
    this.atmosphereMesh = null;
    this.markers3DGroup = null;
    this.selectionRingMesh = null;

    this.globeRadius = 100;

    // Coordenadas esféricas da câmera (em torno do centro do planeta)
    this.cameraState = {
      lat: 12.0,
      lng: -42.0,
      distance: 285,
      targetLat: 12.0,
      targetLng: -42.0,
      targetDistance: 285
    };

    // Limites de escala
    this.minDistance = 114;
    this.maxDistance = 350;
    this.currentScale = 'global'; // 'global' | 'continental' | 'regional' | 'local'

    // Estado de voo cinematográfico
    this.flightAnim = null;

    // Interação de arraste
    this.isDragging = false;
    this.dragMoved = false;
    this.lastPointer = { x: 0, y: 0 };
    this.autoRotate = true;
    this.autoRotateIdleTimer = null;

    // Marcadores sincronizados (3D + projeção DOM interativa)
    this.markerItems = [];
    this.activeFilter = {
      status: 'all', // 'all' | 'completed' | 'ongoing'
      continentId: 'all',
      showFeatures: true
    };

    // Contexto geográfico atualmente focado
    this.focusedContext = {
      continent: null,
      country: null,
      region: null,
      city: null,
      location: null,
      campaign: null
    };

    this._boundAnimate = this.animate.bind(this);
    this._boundResize = this.onWindowResize.bind(this);
  }

  /**
   * Inicializa o motor 3D do Planeta Evren
   */
  init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error(`Container #${this.containerId} não encontrado para Planet3DEngine.`);
      return;
    }

    this.setupDOMStructure();
    this.initThreeScene();
    this.buildAllGeographicMarkers();
    this.bindInputEvents();
    this.updateScaleLevel(true);
    this.animate();

    console.log('✓ Motor Planet3DEngine (Three.js) inicializado com sucesso.');
  }

  setupDOMStructure() {
    this.container.innerHTML = '';
    this.container.classList.add('planet-3d-viewport');

    this.canvasContainer = document.createElement('div');
    this.canvasContainer.className = 'planet-3d-canvas-wrap';
    this.container.appendChild(this.canvasContainer);

    this.markersLayer = document.createElement('div');
    this.markersLayer.id = 'planet-3d-markers-layer';
    this.markersLayer.className = 'planet-3d-markers-layer';
    this.container.appendChild(this.markersLayer);
  }

  initThreeScene() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    if (typeof THREE === 'undefined') {
      console.error('Three.js não carregado!');
      return;
    }

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(42, width / height, 1, 2000);

    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.canvasContainer.appendChild(this.renderer.domElement);
    } catch (err) {
      console.warn('WebGL fallback acionado:', err);
      return;
    }

    // Iluminação física realista de museu planetário
    const ambientLight = new THREE.AmbientLight(0xd8e4f2, 0.78);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e4, 0.92);
    sunLight.position.set(220, 140, 180);
    this.scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x5fa8d3, 0.38);
    rimLight.position.set(-200, -110, -150);
    this.scene.add(rimLight);

    this.globeGroup = new THREE.Group();
    this.scene.add(this.globeGroup);

    // Gera texturas cartográficas de alta resolução (superfície, relevo e especular)
    const textures = this.generatePlanetaryTextures();

    // 1. Esfera física do Planeta Evren com relevo (bumpMap) e oceano especular
    const sphereGeo = new THREE.SphereGeometry(this.globeRadius, 128, 96);
    const sphereMat = new THREE.MeshPhongMaterial({
      map: textures.surfaceTexture,
      bumpMap: textures.bumpTexture,
      bumpScale: 2.35,
      specularMap: textures.specularTexture,
      specular: new THREE.Color(0x2d5a7b),
      shininess: 18
    });

    this.planetMesh = new THREE.Mesh(sphereGeo, sphereMat);
    this.globeGroup.add(this.planetMesh);

    // 2. Grade cartográfica 3D sutil (meridianos e paralelos)
    this.addCartographicGraticule();

    // 3. Camada atmosférica física tênue (sem estrelas ou galáxias)
    const atmosGeo = new THREE.SphereGeometry(this.globeRadius * 1.022, 64, 48);
    const atmosMat = new THREE.MeshLambertMaterial({
      color: 0x62a8d8,
      transparent: true,
      opacity: 0.11,
      side: THREE.BackSide
    });
    this.atmosphereMesh = new THREE.Mesh(atmosGeo, atmosMat);
    this.globeGroup.add(this.atmosphereMesh);

    // 4. Camada meteorológica sutil que se dissipa ao dar zoom regional/local
    const cloudGeo = new THREE.SphereGeometry(this.globeRadius * 1.008, 64, 48);
    const cloudMat = new THREE.MeshLambertMaterial({
      map: textures.cloudTexture,
      transparent: true,
      opacity: 0.24,
      depthWrite: false
    });
    this.cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    this.globeGroup.add(this.cloudMesh);

    // 5. Grupo de marcadores 3D ancorados na superfície
    this.markers3DGroup = new THREE.Group();
    this.globeGroup.add(this.markers3DGroup);

    // 6. Anel 3D de seleção geográfica na superfície
    const ringGeo = new THREE.RingGeometry(1.4, 2.2, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xd4af37,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0
    });
    this.selectionRingMesh = new THREE.Mesh(ringGeo, ringMat);
    this.globeGroup.add(this.selectionRingMesh);

    window.addEventListener('resize', this._boundResize);
  }

  /**
   * Desenha as texturas físicas e cartográficas do planeta usando WORLD_COUNTRIES_GEOJSON,
   * biomas, cadeias de montanhas, florestas, rios, desertos e zonas não documentadas.
   */
  generatePlanetaryTextures() {
    const W = 2048;
    const H = 1024;

    // Canvas 1: Albedo / Superfície Geográfica
    const surfCanvas = document.createElement('canvas');
    surfCanvas.width = W;
    surfCanvas.height = H;
    const ctx = surfCanvas.getContext('2d');

    // Canvas 2: Bump / Elevação Topográfica
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = W;
    bumpCanvas.height = H;
    const bCtx = bumpCanvas.getContext('2d');

    // Canvas 3: Especular (Oceano vs Continente)
    const specCanvas = document.createElement('canvas');
    specCanvas.width = W;
    specCanvas.height = H;
    const sCtx = specCanvas.getContext('2d');

    // 1. Pintura dos Oceanos com batimetria realista
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, H);
    oceanGrad.addColorStop(0.0, '#102538');
    oceanGrad.addColorStop(0.15, '#0d2235');
    oceanGrad.addColorStop(0.5, '#091b2c');
    oceanGrad.addColorStop(0.85, '#0d2235');
    oceanGrad.addColorStop(1.0, '#12283c');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, W, H);

    bCtx.fillStyle = '#141414';
    bCtx.fillRect(0, 0, W, H);

    sCtx.fillStyle = '#909090';
    sCtx.fillRect(0, 0, W, H);

    // Linhas batimétricas sutis no oceano
    ctx.strokeStyle = 'rgba(110, 175, 220, 0.07)';
    ctx.lineWidth = 1;
    for (let lat = -75; lat <= 75; lat += 15) {
      const y = ((90 - lat) / 180) * H;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    for (let lng = -180; lng <= 180; lng += 15) {
      const x = ((lng + 180) / 360) * W;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    // Países com campanhas históricas ativas para destaque sutil de museu
    const activeCountryNames = new Set(['mexico', 'brazil', 'germany', 'greenland']);
    const geojson = this.dataLoader.getWorldGeoJSON();

    const lngLatToXY = (lng, lat) => [
      ((lng + 180) / 360) * W,
      ((90 - lat) / 180) * H
    ];

    const tracePolygonRing = (context, ring) => {
      if (!ring || !ring.length) return;
      context.beginPath();
      ring.forEach((pt, idx) => {
        const [x, y] = lngLatToXY(pt[0], pt[1]);
        if (idx === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.closePath();
    };

    // 2. Renderização dos Continentes e Países a partir do GeoJSON real
    if (geojson && Array.isArray(geojson.features)) {
      geojson.features.forEach((feature) => {
        const propName = (feature.properties?.name || feature.properties?.NAME || '').toLowerCase();
        const isCampaignCountry = activeCountryNames.has(propName);

        // Determina cor física baseada na latitude média e bioma
        let avgLat = 0;
        let sampleCount = 0;
        const geom = feature.geometry;
        if (!geom) return;

        const rings = geom.type === 'Polygon'
          ? [geom.coordinates[0]]
          : geom.type === 'MultiPolygon'
            ? geom.coordinates.map((p) => p[0])
            : [];

        rings.forEach((ring) => {
          ring.forEach((pt) => {
            avgLat += pt[1];
            sampleCount++;
          });
        });
        if (sampleCount > 0) avgLat /= sampleCount;

        let landFill = '#2a392f'; // Temperado continental
        if (Math.abs(avgLat) > 62 || propName === 'greenland' || propName === 'antarctica') {
          landFill = '#cad6df'; // Calota glaciar / tundra ártica
        } else if (Math.abs(avgLat) >= 16 && Math.abs(avgLat) <= 31 && (propName.includes('egypt') || propName.includes('libya') || propName.includes('algeria') || propName.includes('saudi') || propName.includes('australia') || propName.includes('mali') || propName.includes('niger'))) {
          landFill = '#4b412f'; // Árido / desértico
        } else if (Math.abs(avgLat) < 16) {
          landFill = '#233829'; // Floresta equatorial / tropical
        }

        if (isCampaignCountry) {
          // Destaque cartográfico de país com exposição histórica documentada
          landFill = propName === 'greenland' ? '#d4dee6' : '#354739';
        }

        const drawGeometry = (polyCoords) => {
          const outerRing = polyCoords[0];
          if (!outerRing) return;

          // Superfície
          tracePolygonRing(ctx, outerRing);
          ctx.fillStyle = landFill;
          ctx.fill();

          // Fronteira política
          ctx.lineWidth = isCampaignCountry ? 1.8 : 0.9;
          ctx.strokeStyle = isCampaignCountry
            ? 'rgba(212, 175, 55, 0.72)'
            : 'rgba(185, 200, 190, 0.28)';
          ctx.stroke();

          // Elevação base continental no bumpMap
          tracePolygonRing(bCtx, outerRing);
          bCtx.fillStyle = '#787878';
          bCtx.fill();
          bCtx.lineWidth = 1.5;
          bCtx.strokeStyle = '#969696';
          bCtx.stroke();

          // Continentes foscos no specularMap
          tracePolygonRing(sCtx, outerRing);
          sCtx.fillStyle = '#181818';
          sCtx.fill();
        };

        if (geom.type === 'Polygon') {
          drawGeometry(geom.coordinates);
        } else if (geom.type === 'MultiPolygon') {
          geom.coordinates.forEach((poly) => drawGeometry(poly));
        }
      });
    }

    // 3. Pintura de Biomas Físicos do Planeta Evren (Florestas, Desertos, Montanhas, Rios, Terra Incognita)
    const planet = this.dataLoader.getPlanet();

    // Florestas densas
    (planet.forests || []).forEach((forest) => {
      if (!forest.coordinates) return;
      const [x, y] = lngLatToXY(forest.coordinates[1], forest.coordinates[0]);
      const rad = 52;
      const grad = ctx.createRadialGradient(x, y, 4, x, y, rad);
      grad.addColorStop(0, 'rgba(26, 72, 42, 0.65)');
      grad.addColorStop(1, 'rgba(26, 72, 42, 0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    });

    // Regiões desérticas
    (planet.deserts || []).forEach((desert) => {
      if (!desert.coordinates) return;
      const [x, y] = lngLatToXY(desert.coordinates[1], desert.coordinates[0]);
      const rad = 60;
      const grad = ctx.createRadialGradient(x, y, 6, x, y, rad);
      grad.addColorStop(0, 'rgba(138, 112, 68, 0.52)');
      grad.addColorStop(1, 'rgba(138, 112, 68, 0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    });

    // Cadeias de montanhas (albedo + relevo alto no bumpMap) — cordilheira procedural em torno da coordenada registrada
    (planet.mountain_ranges || []).forEach((mt, mtIdx) => {
      if (!mt.coordinates) return;
      const [cx, cy] = lngLatToXY(mt.coordinates[1], mt.coordinates[0]);
      // Semente determinística por cordilheira (sem aleatoriedade entre recarregamentos)
      let seed = 0;
      for (let i = 0; i < mt.id.length; i++) seed = (seed * 31 + mt.id.charCodeAt(i)) % 100000;
      const rand = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
      const angle = rand() * Math.PI;
      const length = 46 + rand() * 30;
      for (let k = 0; k < 26; k++) {
        const t = (k / 25) - 0.5;
        const px = cx + Math.cos(angle) * t * length * 2 + (rand() - 0.5) * 10;
        const py = cy + Math.sin(angle) * t * length * 2 + (rand() - 0.5) * 10;
        const r = 4 + rand() * 7;
        const g1 = ctx.createRadialGradient(px, py, 0, px, py, r);
        g1.addColorStop(0, 'rgba(222, 212, 190, 0.55)');
        g1.addColorStop(1, 'rgba(222, 212, 190, 0)');
        ctx.fillStyle = g1;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();

        const g2 = bCtx.createRadialGradient(px, py, 0, px, py, r * 1.4);
        g2.addColorStop(0, 'rgba(255,255,255,0.95)');
        g2.addColorStop(1, 'rgba(255,255,255,0)');
        bCtx.fillStyle = g2;
        bCtx.beginPath();
        bCtx.arc(px, py, r * 1.4, 0, Math.PI * 2);
        bCtx.fill();
      }
      void mtIdx;
    });

    // Rios e Bacias Hidrográficas (meandro procedural ancorado na coordenada registrada)
    (planet.rivers_lakes || planet.rivers_and_lakes || []).forEach((rv) => {
      if (!rv.coordinates) return;
      const [x0, y0] = lngLatToXY(rv.coordinates[1], rv.coordinates[0]);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x0 - 34, y0 - 10);
      ctx.bezierCurveTo(x0 - 16, y0 + 8, x0 - 6, y0 - 12, x0, y0);
      ctx.bezierCurveTo(x0 + 8, y0 + 10, x0 + 18, y0 - 4, x0 + 30, y0 + 6);
      ctx.strokeStyle = 'rgba(72, 168, 222, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    });

    // Áreas desconhecidas / não documentadas (Terra Incognita)
    (planet.undocumented_zones || []).forEach((zone) => {
      if (!zone.coordinates) return;
      const [x, y] = lngLatToXY(zone.coordinates[1], zone.coordinates[0]);
      const rad = 46;
      const grad = ctx.createRadialGradient(x, y, 4, x, y, rad);
      grad.addColorStop(0, 'rgba(180, 155, 105, 0.28)');
      grad.addColorStop(1, 'rgba(180, 155, 105, 0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y, rad * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Textura de Nuvens Meteorológicas Sutis
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = 1024;
    cloudCanvas.height = 512;
    const cCtx = cloudCanvas.getContext('2d');
    for (let i = 0; i < 140; i++) {
      const cx = (Math.sin(i * 12.9898) * 0.5 + 0.5) * 1024;
      const cy = (Math.cos(i * 78.233) * 0.5 + 0.5) * 512;
      const rx = 25 + (i % 65);
      const ry = 8 + (i % 18);
      const grad = cCtx.createRadialGradient(cx, cy, 2, cx, cy, rx);
      grad.addColorStop(0, 'rgba(240, 246, 255, 0.25)');
      grad.addColorStop(1, 'rgba(240, 246, 255, 0.0)');
      cCtx.fillStyle = grad;
      cCtx.beginPath();
      cCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      cCtx.fill();
    }

    const surfaceTexture = new THREE.CanvasTexture(surfCanvas);
    const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
    const specularTexture = new THREE.CanvasTexture(specCanvas);
    const cloudTexture = new THREE.CanvasTexture(cloudCanvas);

    return {
      surfaceTexture,
      bumpTexture,
      specularTexture,
      cloudTexture
    };
  }

  /**
   * Adiciona anéis de latitude (Equador e Trópicos) como linhas 3D sutis ao redor do globo
   */
  addCartographicGraticule() {
    const latitudes = [0, 23.43, -23.43, 66.56, -66.56];
    latitudes.forEach((lat) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const r = (this.globeRadius + 0.22) * Math.sin(phi);
      const y = (this.globeRadius + 0.22) * Math.cos(phi);

      const points = [];
      for (let i = 0; i <= 96; i++) {
        const theta = (i / 96) * Math.PI * 2;
        points.push(new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta)));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: lat === 0 ? 0xd4af37 : 0x7aa5c4,
        transparent: true,
        opacity: lat === 0 ? 0.22 : 0.1
      });
      const line = new THREE.Line(geo, mat);
      this.globeGroup.add(line);
    });
  }

  /**
   * Converte coordenadas geográficas (lat, lng) em vetor 3D na superfície da esfera
   * Compatível com o mapeamento UV equiretangular do SphereGeometry do Three.js.
   */
  latLngToVector3(lat, lng, radius = this.globeRadius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
  }

  /**
   * Constrói todos os marcadores geográficos e históricos do planeta:
   * - Oceanos, Continentes, Países, Regiões, Cidades, Locais Históricos,
   *   Cadeias de Montanhas, Florestas, Rios, Desertos, Áreas Não Documentadas e Campanhas.
   */
  buildAllGeographicMarkers() {
    if (!this.markersLayer) return;
    this.markersLayer.innerHTML = '';
    this.markerItems = [];

    if (this.markers3DGroup) {
      while (this.markers3DGroup.children.length > 0) {
        this.markers3DGroup.remove(this.markers3DGroup.children[0]);
      }
    }

    const planet = this.dataLoader.getPlanet();
    const continents = this.dataLoader.getContinents();
    const countries = this.dataLoader.getCountries();
    const regions = this.dataLoader.getRegions();
    const cities = this.dataLoader.getCities();
    const locations = this.dataLoader.getLocations();
    const campaigns = this.dataLoader.getCampaigns();

    // 1. Oceanos (Visão Global)
    (planet.oceans || []).forEach((ocean) => {
      if (!ocean.coordinates) return;
      this.registerMarker({
        id: ocean.id,
        kind: 'ocean',
        name: ocean.name,
        subtitle: 'Oceano Planetário',
        lat: ocean.coordinates[0],
        lng: ocean.coordinates[1],
        scales: ['global'],
        data: ocean
      });
    });

    // 2. Continentes (Visão Global e Continental)
    continents.forEach((cont) => {
      if (!cont.coordinates) return;
      const campCount = (cont.campaign_ids || []).length;
      this.registerMarker({
        id: cont.id,
        kind: 'continent',
        name: cont.name,
        subtitle: campCount > 0 ? `${campCount} Exposição(ões) Histórica(s)` : 'Continente',
        lat: cont.coordinates[0],
        lng: cont.coordinates[1],
        scales: ['global', 'continental'],
        hasCampaigns: campCount > 0,
        data: cont
      });
    });

    // 3. Países com histórico documentado (Visão Continental e Regional)
    countries.forEach((country) => {
      if (!country.coordinates) return;
      const campCount = (country.campaign_ids || []).length;
      this.registerMarker({
        id: country.id,
        kind: 'country',
        name: country.name,
        subtitle: `${campCount} Campanha(s) • Território Nacional`,
        lat: country.coordinates[0],
        lng: country.coordinates[1],
        continentId: country.continent_id,
        scales: ['continental', 'regional'],
        hasCampaigns: campCount > 0,
        data: country
      });
    });

    // 4. Feições Geográficas Físicas (Montanhas, Florestas, Rios, Desertos, Terra Incognita)
    (planet.mountain_ranges || []).forEach((mt) => {
      if (!mt.coordinates) return;
      this.registerMarker({
        id: mt.id,
        kind: 'feature_mountain',
        name: mt.name,
        subtitle: `Cadeia Montanhosa • ${mt.elevation_max || ''}`,
        lat: mt.coordinates[0],
        lng: mt.coordinates[1],
        continentId: mt.continent_id,
        scales: ['continental', 'regional'],
        isFeature: true,
        data: mt
      });
    });

    (planet.forests || []).forEach((fr) => {
      if (!fr.coordinates) return;
      this.registerMarker({
        id: fr.id,
        kind: 'feature_forest',
        name: fr.name,
        subtitle: 'Bioma Florestal',
        lat: fr.coordinates[0],
        lng: fr.coordinates[1],
        continentId: fr.continent_id,
        scales: ['continental', 'regional'],
        isFeature: true,
        data: fr
      });
    });

    (planet.rivers_and_lakes || []).forEach((rv) => {
      if (!rv.coordinates) return;
      this.registerMarker({
        id: rv.id,
        kind: 'feature_river',
        name: rv.name,
        subtitle: 'Bacia Hidrográfica',
        lat: rv.coordinates[0],
        lng: rv.coordinates[1],
        continentId: rv.continent_id,
        scales: ['continental', 'regional'],
        isFeature: true,
        data: rv
      });
    });

    (planet.deserts || []).forEach((ds) => {
      if (!ds.coordinates) return;
      this.registerMarker({
        id: ds.id,
        kind: 'feature_desert',
        name: ds.name,
        subtitle: 'Região Desértica',
        lat: ds.coordinates[0],
        lng: ds.coordinates[1],
        continentId: ds.continent_id,
        scales: ['continental'],
        isFeature: true,
        data: ds
      });
    });

    (planet.undocumented_zones || []).forEach((uz) => {
      if (!uz.coordinates) return;
      this.registerMarker({
        id: uz.id,
        kind: 'feature_unknown',
        name: uz.name,
        subtitle: uz.status || 'Área Não Documentada',
        lat: uz.coordinates[0],
        lng: uz.coordinates[1],
        continentId: uz.continent_id,
        scales: ['global', 'continental', 'regional'],
        isFeature: true,
        data: uz
      });
    });

    // 5. Regiões Geográficas (Visão Regional)
    regions.forEach((reg) => {
      if (!reg.coordinates) return;
      this.registerMarker({
        id: reg.id,
        kind: 'region',
        name: reg.name,
        subtitle: `${reg.biome || 'Região Geográfica'}`,
        lat: reg.coordinates[0],
        lng: reg.coordinates[1],
        continentId: reg.continent_id,
        countryId: reg.country_id,
        scales: ['regional'],
        data: reg
      });
    });

    // 6. Cidades e Povoados (Visão Regional e Local)
    cities.forEach((city) => {
      if (!city.coordinates) return;
      this.registerMarker({
        id: city.id,
        kind: 'city',
        name: city.name,
        subtitle: `${city.type || 'Assentamento'}`,
        lat: city.coordinates[0],
        lng: city.coordinates[1],
        continentId: city.continent_id,
        countryId: city.country_id,
        regionId: city.region_id,
        scales: ['regional', 'local'],
        data: city
      });
    });

    // 7. Locais Históricos Específicos (Visão Local e Regional)
    locations.forEach((loc, idx) => {
      if (!loc.coordinates || loc.coordinates.length < 2) return;
      // Pequeno deslocamento angular para locais que compartilham coordenadas idênticas na mesma propriedade
      const sameCoordIndex = locations.slice(0, idx).filter(
        (other) => other.coordinates &&
          Math.abs(other.coordinates[0] - loc.coordinates[0]) < 0.01 &&
          Math.abs(other.coordinates[1] - loc.coordinates[1]) < 0.01
      ).length;
      const offsetLat = sameCoordIndex * 0.42;
      const offsetLng = sameCoordIndex * 0.55;

      this.registerMarker({
        id: loc.id,
        kind: 'location',
        name: loc.name,
        subtitle: `${loc.epoch || 'Marco Histórico'} • ${(loc.related_campaigns || []).length} Campanha(s)`,
        lat: loc.coordinates[0] + offsetLat,
        lng: loc.coordinates[1] + offsetLng,
        trueLat: loc.coordinates[0],
        trueLng: loc.coordinates[1],
        continentId: loc.continent_id,
        countryId: loc.country_id,
        regionId: loc.region_id,
        cityId: loc.city_id,
        scales: ['local'],
        data: loc
      });

      this.add3DPinMesh(loc.coordinates[0] + offsetLat, loc.coordinates[1] + offsetLng, 0x5fa8d3, 0.45);
    });

    // 8. Campanhas / Exposições Históricas (Visíveis em todas as escalas com detalhamento progressivo)
    campaigns.forEach((camp) => {
      if (!camp.coordinates || camp.coordinates.length < 2) return;
      const statusMuseum = camp.status_museum || (camp.category === 'completed' ? 'concluída' : 'em andamento');
      this.registerMarker({
        id: camp.id,
        kind: 'campaign',
        name: camp.name,
        subtitle: `${camp.epoch || ''} • ${camp.region || ''}`,
        statusMuseum,
        category: camp.category || 'ongoing',
        lat: camp.coordinates[0] - 0.35,
        lng: camp.coordinates[1] - 0.45,
        trueLat: camp.coordinates[0],
        trueLng: camp.coordinates[1],
        continentId: camp.continent_id,
        countryId: camp.country_id,
        regionId: camp.region_id,
        cityId: camp.city_id,
        scales: ['global', 'continental', 'regional', 'local'],
        data: camp
      });

      this.add3DPinMesh(camp.coordinates[0], camp.coordinates[1], 0xd4af37, 0.85);
    });
  }

  /**
   * Adiciona um marco físico 3D (pino + anel) diretamente na malha do planeta
   */
  add3DPinMesh(lat, lng, hexColor, scale = 0.7) {
    if (!this.markers3DGroup || typeof THREE === 'undefined') return;
    const pos = this.latLngToVector3(lat, lng, this.globeRadius + 0.3);
    const normal = pos.clone().normalize();

    const pinGroup = new THREE.Group();
    pinGroup.position.copy(pos);
    pinGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

    const stemGeo = new THREE.CylinderGeometry(0.18 * scale, 0.18 * scale, 2.6 * scale, 8);
    const stemMat = new THREE.MeshBasicMaterial({ color: hexColor });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 1.3 * scale;
    pinGroup.add(stem);

    const headGeo = new THREE.SphereGeometry(0.65 * scale, 12, 12);
    const headMat = new THREE.MeshBasicMaterial({ color: hexColor });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.6 * scale;
    pinGroup.add(head);

    this.markers3DGroup.add(pinGroup);
  }

  /**
   * Registra um marcador interativo no DOM sincronizado com coordenadas 3D
   */
  registerMarker(item) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `planet-marker planet-marker--${item.kind}`;
    el.dataset.markerId = item.id;
    el.dataset.markerKind = item.kind;

    let iconHtml = '';
    if (item.kind === 'campaign') {
      const statusClass = item.category === 'completed' ? 'is-completed' : 'is-ongoing';
      el.classList.add(statusClass);
      iconHtml = `<span class="planet-marker__beacon"></span>`;
    } else if (item.kind === 'location') {
      iconHtml = `<span class="planet-marker__dot planet-marker__dot--location"></span>`;
    } else if (item.kind === 'city') {
      iconHtml = `<span class="planet-marker__dot planet-marker__dot--city"></span>`;
    } else if (item.kind === 'country' || item.kind === 'continent' || item.kind === 'region') {
      iconHtml = `<span class="planet-marker__dot planet-marker__dot--geo"></span>`;
    } else if (item.kind.startsWith('feature_')) {
      iconHtml = `<span class="planet-marker__dot planet-marker__dot--feature"></span>`;
    }

    const badgeText = item.kind === 'campaign'
      ? `<span class="planet-marker__status">${item.statusMuseum === 'concluída' ? 'CONCLUÍDA' : 'EM ANDAMENTO'}</span>`
      : '';

    el.innerHTML = `
      ${iconHtml}
      <span class="planet-marker__card">
        ${badgeText}
        <strong class="planet-marker__title">${item.name}</strong>
        <small class="planet-marker__sub">${item.subtitle || ''}</small>
      </span>
    `;

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleMarkerClick(item);
    });

    this.markersLayer.appendChild(el);
    this.markerItems.push({ ...item, el });
  }

  /**
   * Trata o clique em qualquer nível da hierarquia geográfica no globo 3D
   */
  handleMarkerClick(item) {
    const targetLat = item.trueLat !== undefined ? item.trueLat : item.lat;
    const targetLng = item.trueLng !== undefined ? item.trueLng : item.lng;

    this.highlightSurfacePoint(targetLat, targetLng);

    if (item.kind === 'ocean') {
      this.flyToGeo(targetLat, targetLng, 250, () => {
        if (this.onSelectionCallback) this.onSelectionCallback('ocean', item.data, this.focusedContext);
      });
      return;
    }

    if (item.kind === 'continent') {
      this.focusedContext = {
        continent: item.data,
        country: null,
        region: null,
        city: null,
        location: null,
        campaign: null
      };
      this.flyToGeo(targetLat, targetLng, 210, () => {
        if (this.onSelectionCallback) this.onSelectionCallback('continent', item.data, this.focusedContext);
      });
      return;
    }

    if (item.kind === 'country') {
      const cont = this.dataLoader.getContinentById(item.data.continent_id);
      this.focusedContext = {
        continent: cont,
        country: item.data,
        region: null,
        city: null,
        location: null,
        campaign: null
      };
      this.flyToGeo(targetLat, targetLng, 165, () => {
        if (this.onSelectionCallback) this.onSelectionCallback('country', item.data, this.focusedContext);
      });
      return;
    }

    if (item.kind === 'region' || item.kind.startsWith('feature_')) {
      const cont = this.dataLoader.getContinentById(item.data.continent_id);
      const country = this.dataLoader.getCountryById(item.data.country_id);
      this.focusedContext = {
        continent: cont,
        country,
        region: item.kind === 'region' ? item.data : null,
        city: null,
        location: null,
        campaign: null
      };
      this.flyToGeo(targetLat, targetLng, 148, () => {
        if (this.onSelectionCallback) this.onSelectionCallback(item.kind, item.data, this.focusedContext);
      });
      return;
    }

    if (item.kind === 'city') {
      const cont = this.dataLoader.getContinentById(item.data.continent_id);
      const country = this.dataLoader.getCountryById(item.data.country_id);
      const region = this.dataLoader.getRegionById(item.data.region_id);
      this.focusedContext = {
        continent: cont,
        country,
        region,
        city: item.data,
        location: null,
        campaign: null
      };
      this.flyToGeo(targetLat, targetLng, 126, () => {
        if (this.onSelectionCallback) this.onSelectionCallback('city', item.data, this.focusedContext);
      });
      return;
    }

    if (item.kind === 'location') {
      const hierarchy = this.dataLoader.getGeographicHierarchyForLocation(item.data.id);
      this.focusedContext = {
        continent: hierarchy?.continent || null,
        country: hierarchy?.country || null,
        region: hierarchy?.region || null,
        city: hierarchy?.city || null,
        location: item.data,
        campaign: (hierarchy?.campaigns && hierarchy.campaigns[0]) || null
      };
      this.flyToGeo(targetLat, targetLng, 118, () => {
        if (this.onSelectionCallback) this.onSelectionCallback('location', item.data, this.focusedContext);
      });
      return;
    }

    if (item.kind === 'campaign') {
      const hierarchy = this.dataLoader.getGeographicHierarchyForCampaign(item.data.id);
      this.focusedContext = {
        continent: hierarchy?.continent || null,
        country: hierarchy?.country || null,
        region: hierarchy?.region || null,
        city: hierarchy?.city || null,
        location: (hierarchy?.locations && hierarchy.locations[0]) || null,
        campaign: item.data
      };
      // Se já estivermos em escala local/regional próxima, abre ou foca imediatamente; caso contrário, faz zoom progressivo até a região da campanha
      const targetDist = this.cameraState.distance > 140 ? 124 : this.cameraState.distance;
      this.flyToGeo(targetLat, targetLng, targetDist, () => {
        if (this.onSelectionCallback) this.onSelectionCallback('campaign', item.data, this.focusedContext);
      });
    }
  }

  /**
   * Posiciona o anel dourado de seleção sobre a coordenada geográfica clicada
   */
  highlightSurfacePoint(lat, lng) {
    if (!this.selectionRingMesh || typeof THREE === 'undefined') return;
    const pos = this.latLngToVector3(lat, lng, this.globeRadius + 0.38);
    const normal = pos.clone().normalize();
    this.selectionRingMesh.position.copy(pos);
    this.selectionRingMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    this.selectionRingMesh.material.opacity = 0.85;
  }

  /**
   * Realiza um voo cinematográfico suave da câmera 3D até (lat, lng, targetDistance)
   */
  flyToGeo(lat, lng, targetDistance = 140, onComplete = null, durationMs = 1250) {
    this.pauseAutoRotate();

    const startLat = this.cameraState.lat;
    const startLng = this.cameraState.lng;
    const startDist = this.cameraState.distance;

    // Menor caminho angular para longitude
    let deltaLng = lng - startLng;
    while (deltaLng > 180) deltaLng -= 360;
    while (deltaLng < -180) deltaLng += 360;

    const clampedDist = Math.max(this.minDistance, Math.min(this.maxDistance, targetDistance));

    this.flightAnim = {
      startTime: performance.now(),
      duration: durationMs,
      startLat,
      startLng,
      targetLat: Math.max(-82, Math.min(82, lat)),
      deltaLng,
      startDist,
      targetDist: clampedDist,
      onComplete
    };
  }

  /**
   * Altera a escala do planeta programaticamente (Global, Continental, Regional, Local)
   */
  setScaleView(scaleName) {
    const scaleDistances = {
      global: 285,
      continental: 205,
      regional: 155,
      local: 122
    };
    const dist = scaleDistances[scaleName] || 285;
    if (scaleName === 'global') {
      this.focusedContext = {
        continent: null,
        country: null,
        region: null,
        city: null,
        location: null,
        campaign: null
      };
    }
    this.flyToGeo(this.cameraState.lat, this.cameraState.lng, dist, () => {
      if (this.onSelectionCallback) {
        this.onSelectionCallback('scale_change', { scale: scaleName }, this.focusedContext);
      }
    }, 900);
  }

  /**
   * Aplica filtros de visualização nos marcadores do planeta
   */
  setFilter(filterOptions = {}) {
    this.activeFilter = { ...this.activeFilter, ...filterOptions };
  }

  /**
   * Vincula eventos de mouse, scroll e toque para rotação orbital e zoom progressivo
   */
  bindInputEvents() {
    const dom = this.container;
    if (!dom) return;

    dom.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.planet-marker')) return;
      this.isDragging = true;
      this.dragMoved = false;
      this.lastPointer = { x: e.clientX, y: e.clientY };
      this.flightAnim = null;
      this.pauseAutoRotate();
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastPointer.x;
      const dy = e.clientY - this.lastPointer.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) this.dragMoved = true;

      // Sensibilidade proporcional à distância da câmera (mais precisa quando aproximada)
      const zoomFactor = (this.cameraState.distance - 95) / 200;
      const speed = Math.max(0.08, Math.min(0.38, zoomFactor * 0.32));

      this.cameraState.targetLng -= dx * speed;
      this.cameraState.targetLat = Math.max(-82, Math.min(82, this.cameraState.targetLat + dy * speed));
      this.cameraState.lng = this.cameraState.targetLng;
      this.cameraState.lat = this.cameraState.targetLat;

      this.lastPointer = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });

    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.flightAnim = null;
      this.pauseAutoRotate();

      const step = e.deltaY * 0.14;
      this.cameraState.targetDistance = Math.max(
        this.minDistance,
        Math.min(this.maxDistance, this.cameraState.targetDistance + step)
      );
    }, { passive: false });
  }

  pauseAutoRotate() {
    this.autoRotate = false;
    if (this.autoRotateIdleTimer) clearTimeout(this.autoRotateIdleTimer);
    this.autoRotateIdleTimer = setTimeout(() => {
      if (this.currentScale === 'global') {
        this.autoRotate = true;
      }
    }, 14000);
  }

  /**
   * Atualiza o nível de detalhe (LOD) conforme a distância da câmera
   */
  updateScaleLevel(forceNotify = false) {
    const d = this.cameraState.distance;
    let nextScale = 'global';
    if (d <= 136) nextScale = 'local';
    else if (d <= 180) nextScale = 'regional';
    else if (d <= 245) nextScale = 'continental';
    else nextScale = 'global';

    if (nextScale !== this.currentScale || forceNotify) {
      this.currentScale = nextScale;
      if (this.container) {
        this.container.dataset.scale = nextScale;
      }
      if (this.onSelectionCallback) {
        this.onSelectionCallback('scale_change', { scale: nextScale, distance: d }, this.focusedContext);
      }
    }
  }

  /**
   * Loop principal de renderização 3D e projeção de marcadores geográficos
   */
  animate() {
    requestAnimationFrame(this._boundAnimate);

    // 1. Interpolação de voo cinematográfico
    if (this.flightAnim) {
      const now = performance.now();
      const t = Math.min(1, (now - this.flightAnim.startTime) / this.flightAnim.duration);
      // EaseInOutCubic
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      this.cameraState.lat = this.flightAnim.startLat + (this.flightAnim.targetLat - this.flightAnim.startLat) * ease;
      this.cameraState.lng = this.flightAnim.startLng + this.flightAnim.deltaLng * ease;
      this.cameraState.distance = this.flightAnim.startDist + (this.flightAnim.targetDist - this.flightAnim.startDist) * ease;

      this.cameraState.targetLat = this.cameraState.lat;
      this.cameraState.targetLng = this.cameraState.lng;
      this.cameraState.targetDistance = this.cameraState.distance;

      if (t >= 1) {
        const cb = this.flightAnim.onComplete;
        this.flightAnim = null;
        if (typeof cb === 'function') cb();
      }
    } else {
      // Rotação planetária suave quando em observação global ociosa
      if (this.autoRotate && !this.isDragging && this.currentScale === 'global') {
        this.cameraState.targetLng += 0.035;
      }
      // Amortecimento suave de zoom e rotação
      this.cameraState.lat += (this.cameraState.targetLat - this.cameraState.lat) * 0.14;
      this.cameraState.lng += (this.cameraState.targetLng - this.cameraState.lng) * 0.14;
      this.cameraState.distance += (this.cameraState.targetDistance - this.cameraState.distance) * 0.14;
    }

    this.updateScaleLevel(false);

    if (this.camera && this.scene && this.renderer) {
      // Posiciona a câmera na órbita esférica correspondente a (lat, lng, distance)
      const camPos = this.latLngToVector3(
        this.cameraState.lat,
        this.cameraState.lng,
        this.cameraState.distance
      );
      this.camera.position.copy(camPos);
      this.camera.lookAt(0, 0, 0);

      // Leve deriva das nuvens e transparência progressiva ao aproximar
      if (this.cloudMesh) {
        this.cloudMesh.rotation.y += 0.00018;
        const cloudAlpha = Math.max(0.03, Math.min(0.24, (this.cameraState.distance - 125) / 600));
        this.cloudMesh.material.opacity = cloudAlpha;
      }

      this.renderer.render(this.scene, this.camera);
      this.projectMarkersToScreen();
    }
  }

  /**
   * Projeta as coordenadas 3D dos marcadores para coordenadas 2D da tela e oculta o hemisfério traseiro
   */
  projectMarkersToScreen() {
    if (!this.camera || !this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!width || !height) return;

    const camDir = this.camera.position.clone().normalize();

    this.markerItems.forEach((item) => {
      // Verifica visibilidade por escala (LOD) e filtros ativos
      const scaleVisible = item.scales.includes(this.currentScale);
      if (!scaleVisible) {
        item.el.style.display = 'none';
        return;
      }

      if (item.isFeature && !this.activeFilter.showFeatures) {
        item.el.style.display = 'none';
        return;
      }

      if (this.activeFilter.continentId !== 'all' && item.continentId && item.continentId !== this.activeFilter.continentId) {
        item.el.style.display = 'none';
        return;
      }

      if (item.kind === 'campaign' && this.activeFilter.status !== 'all') {
        if (item.category !== this.activeFilter.status) {
          item.el.style.display = 'none';
          return;
        }
      }

      const worldPos = this.latLngToVector3(item.lat, item.lng, this.globeRadius + 1.2);
      const surfaceNormal = worldPos.clone().normalize();

      // Oclusão do hemisfério oculto (dot product entre normal da superfície e direção da câmera)
      const dot = surfaceNormal.dot(camDir);
      if (dot < 0.16) {
        item.el.style.display = 'none';
        return;
      }

      const projected = worldPos.clone().project(this.camera);
      const x = (projected.x * 0.5 + 0.5) * width;
      const y = (-projected.y * 0.5 + 0.5) * height;

      item.el.style.display = 'inline-flex';
      item.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      item.el.style.opacity = Math.min(1, (dot - 0.14) * 3.2).toFixed(2);
      item.el.style.zIndex = item.kind === 'campaign' ? '30' : item.kind === 'location' ? '25' : '15';
    });
  }

  onWindowResize() {
    if (!this.container || !this.camera || !this.renderer) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

window.Planet3DEngine = Planet3DEngine;
