/**
 * DATA LOADER & HISTORICAL ARCHIVE ENGINE
 * Universo: Evren — Museu Histórico Interativo 3D
 * Carrega e provê acesso estruturado ao world_data.json com hierarquia geográfica completa:
 * PLANETA -> CONTINENTE -> PAÍS -> REGIÃO -> CIDADE/LOCAL -> CAMPANHA -> HISTÓRIA
 */

/**
 * Módulo de Segurança e Sanitização Defensiva do Universo Evren
 * Previne injeção de script (XSS), valida URLs de mídia e sanitiza entradas.
 */
const EvrenSecurity = {
  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  safeUrl(url, fallback = 'assets/icon-192.png') {
    if (!url || typeof url !== 'string') return fallback;
    const trimmed = url.trim();
    const lower = trimmed.toLowerCase();
    if (
      lower.startsWith('javascript:') ||
      lower.startsWith('vbscript:') ||
      lower.startsWith('data:text/') ||
      lower.startsWith('data:application/')
    ) {
      return fallback;
    }
    if (
      trimmed.startsWith('assets/') ||
      trimmed.startsWith('./') ||
      trimmed.startsWith('/') ||
      lower.startsWith('http://') ||
      lower.startsWith('https://') ||
      lower.startsWith('data:image/')
    ) {
      return this.escapeHtml(trimmed);
    }
    return fallback;
  },

  sanitizeText(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  }
};

if (typeof window !== 'undefined') {
  window.EvrenSecurity = EvrenSecurity;
  window.escapeHtml = EvrenSecurity.escapeHtml.bind(EvrenSecurity);
  window.safeUrl = EvrenSecurity.safeUrl.bind(EvrenSecurity);
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports.EvrenSecurity = EvrenSecurity;
}

class DataLoader {
  constructor() {
    this.data = null;
    this.isLoaded = false;
  }

  /**
   * Carrega o arquivo world_data.json via fetch com fallback estruturado idêntico
   * e mescla registros salvos no banco local (IndexedDB / localStorage).
   */
  async loadData() {
    try {
      const response = await fetch('world_data.json', { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.data = await response.json();
      this.isLoaded = true;
      console.log('✓ Acervo Histórico world_data.json carregado com sucesso.');
    } catch (err) {
      console.warn('! Aviso ao carregar world_data.json via fetch (protocolo file://). Usando acervo embarcado.', err);
      this.data = this.getEmbeddedFallbackData();
      this.isLoaded = true;
    }

    this.mergeCustomMuseumRecords();
    return this.data;
  }

  /**
   * Mescla campanhas, personagens, locais e acontecimentos adicionados via Administração do Museu
   */
  mergeCustomMuseumRecords() {
    if (typeof localStorage === 'undefined' || !this.data) return;
    try {
      const customCamps = JSON.parse(localStorage.getItem('evren_custom_campaigns') || '[]');
      customCamps.forEach(c => {
        const idx = this.data.campaigns.findIndex(existing => existing.id === c.id);
        if (idx >= 0) this.data.campaigns[idx] = { ...this.data.campaigns[idx], ...c };
        else this.data.campaigns.push(c);
      });

      const customChars = [
        ...JSON.parse(localStorage.getItem('evren_custom_characters_v1') || '[]'),
        ...JSON.parse(localStorage.getItem('evren_custom_characters') || '[]')
      ];
      customChars.forEach(ch => {
        const idx = this.data.characters.findIndex(existing => existing.id === ch.id);
        if (idx >= 0) this.data.characters[idx] = { ...this.data.characters[idx], ...ch };
        else this.data.characters.push(ch);
      });

      const customLocs = [
        ...JSON.parse(localStorage.getItem('evren_custom_locations') || '[]'),
        ...JSON.parse(localStorage.getItem('evren_custom_locations_v1') || '[]')
      ];
      customLocs.forEach(loc => {
        const idx = this.data.locations.findIndex(existing => existing.id === loc.id);
        if (idx >= 0) this.data.locations[idx] = { ...this.data.locations[idx], ...loc };
        else this.data.locations.push(loc);
      });

      const customEvents = JSON.parse(localStorage.getItem('evren_custom_historical_events') || '[]');
      if (!this.data.historical_events) this.data.historical_events = [];
      customEvents.forEach(evt => {
        const idx = this.data.historical_events.findIndex(existing => existing.id === evt.id);
        if (idx >= 0) this.data.historical_events[idx] = { ...this.data.historical_events[idx], ...evt };
        else this.data.historical_events.push(evt);
      });

      const customChrons = JSON.parse(localStorage.getItem('evren_custom_chronicles') || '[]');
      customChrons.forEach(cr => {
        const idx = this.data.chronicles.findIndex(existing => existing.id === cr.id);
        if (idx >= 0) this.data.chronicles[idx] = { ...this.data.chronicles[idx], ...cr };
        else this.data.chronicles.push(cr);
      });
    } catch (e) {
      console.warn('Aviso ao mesclar registros customizados do museu:', e);
    }
  }

  getRawData() {
    return this.data;
  }

  getUniverseRules() {
    return this.data?.universe_rules || {
      system: "Evren",
      universe: "Evren",
      attributes: ["Força", "Vigor", "Agilidade", "Presença", "Intelecto"],
      mechanics: ["MDA", "Pontos de Determinação (PD)", "Sacrifício de Armadura", "Desempate Letal"]
    };
  }

  getWorldGeoJSON() {
    if (typeof window !== 'undefined' && window.WORLD_COUNTRIES_GEOJSON) {
      return window.WORLD_COUNTRIES_GEOJSON;
    }
    return null;
  }

  /* ==========================================================================
     HIERARQUIA GEOGRÁFICA DO PLANETA EVREN
     PLANETA -> CONTINENTE -> PAÍS -> REGIÃO -> CIDADE -> LOCAL -> CAMPANHA
     ========================================================================== */

  getPlanet() {
    return this.data?.planet || {};
  }

  getContinents() {
    return this.data?.continents || [];
  }

  getContinentById(id) {
    return (this.data?.continents || []).find(c => c.id === id) || null;
  }

  getCountries(continentId = null) {
    const list = this.data?.countries || [];
    if (!continentId || continentId === 'all') return list;
    return list.filter(c => c.continent_id === continentId);
  }

  getCountryById(idOrGeoName) {
    if (!idOrGeoName) return null;
    const q = idOrGeoName.toLowerCase();
    return (this.data?.countries || []).find(c =>
      c.id.toLowerCase() === q ||
      c.name.toLowerCase() === q ||
      (c.geojson_name && c.geojson_name.toLowerCase() === q)
    ) || null;
  }

  getRegions(countryId = null) {
    const list = this.data?.regions || [];
    if (!countryId || countryId === 'all') return list;
    return list.filter(r => r.country_id === countryId || r.continent_id === countryId);
  }

  getRegionById(id) {
    return (this.data?.regions || []).find(r => r.id === id) || null;
  }

  getCities(regionId = null) {
    const list = this.data?.cities || [];
    if (!regionId || regionId === 'all') return list;
    return list.filter(c => c.region_id === regionId || c.country_id === regionId);
  }

  getCityById(id) {
    return (this.data?.cities || []).find(c => c.id === id) || null;
  }

  getGeographicHierarchyForCampaign(campaignId) {
    const camp = this.getCampaignById(campaignId);
    if (!camp) return null;
    const continent = this.getContinentById(camp.continent_id);
    const country = this.getCountryById(camp.country_id);
    const region = this.getRegionById(camp.region_id);
    const city = this.getCityById(camp.city_id);
    const locations = this.getLocations(camp.id);
    return {
      planet: this.getPlanet(),
      continent,
      country,
      region,
      city,
      locations,
      campaign: camp
    };
  }

  getGeographicHierarchyForLocation(locationId) {
    const loc = this.getLocationById(locationId);
    if (!loc) return null;
    return {
      planet: this.getPlanet(),
      continent: this.getContinentById(loc.continent_id),
      country: this.getCountryById(loc.country_id),
      region: this.getRegionById(loc.region_id),
      city: this.getCityById(loc.city_id),
      location: loc,
      campaigns: (loc.related_campaigns || []).map(cid => this.getCampaignById(cid)).filter(Boolean)
    };
  }

  /* ==========================================================================
     CAMPANHAS, LOCAIS, PERSONAGENS E ACONTECIMENTOS HISTÓRICOS
     ========================================================================== */

  getMaps() {
    return this.data?.maps || [];
  }

  getMapById(id) {
    return this.data?.maps?.find(m => m.id === id) || null;
  }

  getCampaigns(statusFilter = null) {
    const camps = this.data?.campaigns || [];
    if (!statusFilter || statusFilter === 'all') return camps;
    const sf = statusFilter.toLowerCase();
    return camps.filter(c => {
      const st = (c.status_museum || c.status || c.category || '').toLowerCase();
      if (sf === 'completed' || sf === 'concluída' || sf === 'concluida') {
        return c.category === 'completed' || st.includes('conclu') || st.includes('finaliz');
      }
      if (sf === 'ongoing' || sf === 'em andamento') {
        return c.category === 'ongoing' || st.includes('andamento') || st.includes('ativa');
      }
      if (sf === 'interrupted' || sf === 'interrompida') {
        return c.category === 'interrupted' || st.includes('interromp');
      }
      return true;
    });
  }

  getCampaignById(id) {
    return this.data?.campaigns?.find(c => c.id === id) || null;
  }

  getLocations(campaignFilter = null, mapId = null) {
    let locs = this.data?.locations || [];

    if (mapId) {
      locs = locs.filter(loc => loc.map_id === mapId);
    }

    if (!campaignFilter || campaignFilter === 'all') return locs;

    const camp = this.getCampaignById(campaignFilter);
    const campaignChronicles = this.getChronicles(campaignFilter).map(c => c.id);
    return locs.filter(loc => {
      if (loc.related_campaigns && loc.related_campaigns.includes(campaignFilter)) return true;
      if (loc.campaign_ids && loc.campaign_ids.includes(campaignFilter)) return true;
      if (loc.campaign_id === campaignFilter) return true;
      if (camp && camp.locations_list && camp.locations_list.includes(loc.id)) return true;
      if (camp && camp.map_id && loc.map_id === camp.map_id) return true;
      if (loc.chronicles && loc.chronicles.some(cId => campaignChronicles.includes(cId))) {
        return true;
      }
      if (campaignFilter === 'camp_001' && ((loc.zone && loc.zone.includes('Triângulo')) || loc.map_id === 'map_triangulo')) return true;
      if (campaignFilter === 'camp_002' && ((loc.zone && loc.zone.includes('Terra')) || loc.map_id === 'map_vilar')) return true;
      if (campaignFilter === 'camp_filantropo_oeht' && ((loc.zone && loc.zone.includes('Suíça')) || loc.map_id === 'map_belvedere' || loc.id === 'loc_mansao_belvedere')) return true;
      return false;
    });
  }

  getAllCharacters() {
    return this.data?.characters || [];
  }

  getCharacters(campaignFilter = null) {
    const chars = this.data?.characters || [];
    if (!campaignFilter || campaignFilter === 'all') return chars;

    const camp = this.getCampaignById(campaignFilter);
    const campaignChronicles = this.getChronicles(campaignFilter);
    const chronicleTexts = campaignChronicles.map(c => (c.lore + ' ' + c.title).toLowerCase());

    return chars.filter(char => {
      if (char.campaign_participations && char.campaign_participations.some(cp => cp.campaign_id === campaignFilter)) return true;
      if (char.campaign_ids && char.campaign_ids.includes(campaignFilter)) return true;
      if (char.campaign_id === campaignFilter) return true;
      if (camp && camp.participants && camp.participants.includes(char.id)) return true;

      const firstName = char.name.split(' ')[0].toLowerCase();
      if (chronicleTexts.some(text => text.includes(firstName) || text.includes(char.name.toLowerCase()))) {
        return true;
      }

      if (campaignFilter === 'camp_002' && ['char_lucas', 'char_gabriel', 'char_rafael', 'char_julia', 'char_helena', 'char_diego', 'char_bia', 'char_arthur'].includes(char.id)) {
        return true;
      }
      if (campaignFilter === 'camp_001' && (char.id === 'char_arquiteto' || (char.status && char.status.includes('Triângulo')))) {
        return true;
      }
      if (campaignFilter === 'camp_filantropo_oeht' && ['char_oeht', 'char_kaelen'].includes(char.id)) {
        return true;
      }
      return false;
    });
  }

  getChronicles(campaignFilter = null) {
    const chrons = this.data?.chronicles || [];
    if (!campaignFilter || campaignFilter === 'all') return chrons;
    return chrons.filter(c => c.campaign_id === campaignFilter);
  }

  getHistoricalEvents(campaignFilter = null) {
    const evts = this.data?.historical_events || [];
    const sorted = [...evts].sort((a, b) => (a.year_numeric || 0) - (b.year_numeric || 0));
    if (!campaignFilter || campaignFilter === 'all') return sorted;
    return sorted.filter(e => e.campaign_id === campaignFilter);
  }

  getHistoricalEventById(id) {
    return (this.data?.historical_events || []).find(e => e.id === id) ||
           (this.data?.timeline || []).find(t => t.id === id) ||
           (this.data?.chronicles || []).find(c => c.id === id) || null;
  }

  getOrganizations() {
    return this.data?.organizations || [];
  }

  getOrganizationById(id) {
    return (this.data?.organizations || []).find(o => o.id === id) || null;
  }

  getMuseumCollections() {
    return this.data?.museum_collections || {
      artifacts: this.getRelics(),
      biological_specimens: this.getBestiary(),
      session_records: this.getChronicles()
    };
  }

  /**
   * Trajetória histórica completa de um personagem através do universo EVREN
   */
  getCharacterFullTrajectory(charId) {
    const char = this.getCharacterById(charId);
    if (!char) return null;

    const campaigns = this.getCampaigns().filter(c =>
      (c.participants && c.participants.includes(charId)) ||
      char.campaign_id === c.id ||
      (char.campaign_ids && char.campaign_ids.includes(c.id)) ||
      (char.campaign_participations && char.campaign_participations.some(cp => cp.campaign_id === c.id))
    );

    const events = this.getHistoricalEvents().filter(e =>
      (e.characters_involved && e.characters_involved.includes(charId)) ||
      (char.important_events && char.important_events.includes(e.id))
    );

    const locations = this.getLocations().filter(l =>
      (l.characters_present && l.characters_present.includes(charId)) ||
      (char.visited_locations && char.visited_locations.includes(l.id))
    );

    const organizations = this.getOrganizations().filter(o =>
      o.members && o.members.includes(charId)
    );

    return {
      character: char,
      campaigns,
      events,
      locations,
      organizations,
      relationships: char.relationships || []
    };
  }

  /**
   * História completa de uma região ou localidade ao longo dos anos
   */
  getRegionHistoricalTimeline(regionOrLocationId) {
    const region = this.getRegionById(regionOrLocationId);
    const location = this.getLocationById(regionOrLocationId);
    const country = this.getCountryById(regionOrLocationId);

    const events = this.getHistoricalEvents().filter(e =>
      e.region_id === regionOrLocationId ||
      e.location_id === regionOrLocationId ||
      e.country_id === regionOrLocationId ||
      (region && e.region_id === region.id) ||
      (location && e.location_id === location.id) ||
      (country && e.country_id === country.id)
    );

    const campaigns = this.getCampaigns().filter(c =>
      c.region_id === regionOrLocationId ||
      c.country_id === regionOrLocationId ||
      (c.locations_list && c.locations_list.includes(regionOrLocationId))
    );

    return {
      entity: region || location || country,
      campaigns,
      events
    };
  }

  /**
   * Normaliza o status histórico de um personagem para o vocabulário do museu
   * (vivo, morto, desaparecido, em quarentena, desconhecido).
   */
  getCharacterHistoricalStatus(ch) {
    if (!ch) return 'desconhecido';
    const raw = (ch.historical_status || '').toLowerCase().trim();
    if (raw) return raw;
    const life = (ch.life_status || '').toLowerCase();
    const map = { alive: 'vivo', dead: 'morto', deceased: 'morto', missing: 'desaparecido', quarantine: 'em quarentena', unknown: 'desconhecido' };
    if (map[life]) return map[life];
    const st = (ch.status || '').toLowerCase();
    if (st.includes('morto') || st.includes('falecid')) return 'morto';
    if (st.includes('desaparec')) return 'desaparecido';
    if (st.includes('quarentena')) return 'em quarentena';
    if (st.includes('vivo')) return 'vivo';
    return 'desconhecido';
  }

  /**
   * Retorna todos os anos (numéricos) em que um personagem esteve historicamente ativo
   */
  getCharacterActiveYears(ch) {
    const years = new Set();
    (ch?.campaign_participations || []).forEach(cp => {
      String(cp.period || '').replace(/\d{4}/g, (y) => { years.add(Number(y)); return y; });
      const range = String(cp.period || '').match(/(\d{4})\s*[–-]\s*(\d{4})/);
      if (range) {
        for (let y = Number(range[1]); y <= Number(range[2]); y++) years.add(y);
      }
    });
    this.getHistoricalEvents().forEach(e => {
      if (e.characters_involved && e.characters_involved.includes(ch?.id) && e.year_numeric) years.add(e.year_numeric);
    });
    return [...years].sort((a, b) => a - b);
  }

  /**
   * Motor de Consulta Relacional Conectada do Arquivo Histórico Global (Seção 7)
   * Os filtros cruzam entidades por suas relações (não apenas por texto):
   * personagem -> campanhas/locais/acontecimentos, cidade -> locais -> acontecimentos, etc.
   */
  queryHistoricalArchive(filters = {}) {
    const {
      query = '',
      entityType = 'all',
      countryId = 'all',
      continentId = 'all',
      regionId = 'all',
      cityId = 'all',
      year = 'all',
      yearFrom = null,
      yearTo = null,
      characterStatus = 'all',
      campaignStatus = 'all',
      characterId = 'all',
      locationId = 'all',
      campaignId = 'all'
    } = filters;

    const q = (query || '').toLowerCase().trim();
    const txt = (v) => String(v || '').toLowerCase();
    const inRange = (y) => {
      if (y === null || y === undefined || y === '') return yearFrom === null && yearTo === null;
      const n = Number(y);
      if (yearFrom !== null && yearFrom !== '' && n < Number(yearFrom)) return false;
      if (yearTo !== null && yearTo !== '' && n > Number(yearTo)) return false;
      return true;
    };
    const hasRange = (yearFrom !== null && yearFrom !== '') || (yearTo !== null && yearTo !== '');

    // Locais pertencentes à cidade / região selecionada
    const cityLocIds = cityId !== 'all' ? this.getLocations().filter(l => l.city_id === cityId).map(l => l.id) : null;
    const regionLocIds = regionId !== 'all' ? this.getLocations().filter(l => l.region_id === regionId).map(l => l.id) : null;

    // 1. Campanhas
    let campaigns = this.getCampaigns(campaignStatus !== 'all' ? campaignStatus : null);
    if (campaignId !== 'all') campaigns = campaigns.filter(c => c.id === campaignId);
    if (continentId !== 'all') campaigns = campaigns.filter(c => c.continent_id === continentId);
    if (countryId !== 'all') campaigns = campaigns.filter(c => c.country_id === countryId);
    if (regionId !== 'all') campaigns = campaigns.filter(c => c.region_id === regionId);
    if (cityId !== 'all') campaigns = campaigns.filter(c => c.city_id === cityId || (c.locations_list || []).some(id => cityLocIds.includes(id)));
    if (year !== 'all') campaigns = campaigns.filter(c => String(c.period_numeric) === String(year) || txt(c.year).includes(String(year)));
    if (hasRange) campaigns = campaigns.filter(c => inRange(c.period_numeric));
    if (characterId !== 'all') {
      const campIds = (this.getCharacterFullTrajectory(characterId)?.campaigns || []).map(c => c.id);
      campaigns = campaigns.filter(c => campIds.includes(c.id));
    }
    if (locationId !== 'all') {
      const loc = this.getLocationById(locationId);
      campaigns = campaigns.filter(c => (c.locations_list || []).includes(locationId) || (loc?.related_campaigns || []).includes(c.id));
    }
    if (q) {
      campaigns = campaigns.filter(c =>
        txt(c.title || c.name).includes(q) || txt(c.synopsis).includes(q) ||
        txt(c.country_location).includes(q) || txt(c.theme).includes(q) || txt(c.historical_context).includes(q)
      );
    }

    // 2. Personagens Históricos
    let characters = this.getAllCharacters();
    if (characterStatus !== 'all') {
      const wanted = characterStatus.toLowerCase();
      characters = characters.filter(ch => this.getCharacterHistoricalStatus(ch).includes(wanted));
    }
    if (year !== 'all') characters = characters.filter(ch => this.getCharacterActiveYears(ch).includes(Number(year)));
    if (hasRange) characters = characters.filter(ch => this.getCharacterActiveYears(ch).some(y => inRange(y)));
    const campIdsBy = (pred) => this.getCampaigns().filter(pred).map(c => c.id);
    const charInCampaigns = (ch, ids) =>
      (ch.campaign_participations || []).some(cp => ids.includes(cp.campaign_id)) ||
      (ch.campaign_ids || []).some(id => ids.includes(id)) || ids.includes(ch.campaign_id);
    if (campaignId !== 'all') characters = characters.filter(ch => charInCampaigns(ch, [campaignId]));
    if (continentId !== 'all') characters = characters.filter(ch => charInCampaigns(ch, campIdsBy(c => c.continent_id === continentId)));
    if (countryId !== 'all') characters = characters.filter(ch => charInCampaigns(ch, campIdsBy(c => c.country_id === countryId)));
    if (regionId !== 'all') characters = characters.filter(ch => (ch.visited_locations || []).some(id => regionLocIds.includes(id)) || charInCampaigns(ch, campIdsBy(c => c.region_id === regionId)));
    if (cityId !== 'all') characters = characters.filter(ch => (ch.visited_locations || []).some(id => cityLocIds.includes(id)));
    if (locationId !== 'all') {
      const loc = this.getLocationById(locationId);
      characters = characters.filter(ch => (ch.visited_locations || []).includes(locationId) || (loc?.characters_present || []).includes(ch.id));
    }
    if (characterId !== 'all') characters = characters.filter(ch => ch.id === characterId);
    if (q) {
      characters = characters.filter(ch =>
        txt(ch.name).includes(q) || txt(ch.codename).includes(q) || txt(ch.historical_title).includes(q) ||
        txt(ch.personal_history).includes(q) || txt(ch.known_fate).includes(q) || txt(ch.summary).includes(q)
      );
    }

    // 3. Locais Históricos
    let locations = this.getLocations();
    if (campaignId !== 'all') locations = this.getLocations(campaignId);
    if (continentId !== 'all') locations = locations.filter(l => l.continent_id === continentId);
    if (countryId !== 'all') locations = locations.filter(l => l.country_id === countryId);
    if (regionId !== 'all') locations = locations.filter(l => l.region_id === regionId);
    if (cityId !== 'all') locations = locations.filter(l => l.city_id === cityId);
    if (characterId !== 'all') {
      const ch = this.getCharacterById(characterId);
      locations = locations.filter(l => (l.characters_present || []).includes(characterId) || (ch?.visited_locations || []).includes(l.id));
    }
    if (locationId !== 'all') locations = locations.filter(l => l.id === locationId);
    if (year !== 'all') locations = locations.filter(l => (l.epochs_active || []).some(ep => String(ep).includes(String(year))) || this.getHistoricalEvents().some(e => e.location_id === l.id && String(e.year_numeric) === String(year)));
    if (q) {
      locations = locations.filter(l =>
        txt(l.name).includes(q) || txt(l.zone).includes(q) || txt(l.description).includes(q) ||
        txt(l.historical_importance).includes(q) || txt(l.historical_type || l.type).includes(q)
      );
    }

    // 4. Acontecimentos Históricos
    let events = this.getHistoricalEvents();
    if (campaignId !== 'all') events = events.filter(e => e.campaign_id === campaignId);
    if (continentId !== 'all') events = events.filter(e => e.continent_id === continentId);
    if (countryId !== 'all') events = events.filter(e => e.country_id === countryId);
    if (regionId !== 'all') events = events.filter(e => e.region_id === regionId || regionLocIds.includes(e.location_id));
    if (cityId !== 'all') events = events.filter(e => cityLocIds.includes(e.location_id));
    if (year !== 'all') events = events.filter(e => String(e.year_numeric) === String(year) || txt(e.date).includes(String(year)));
    if (hasRange) events = events.filter(e => inRange(e.year_numeric));
    if (characterId !== 'all') events = events.filter(e => (e.characters_involved || []).includes(characterId));
    if (locationId !== 'all') events = events.filter(e => e.location_id === locationId);
    if (q) events = events.filter(e => txt(e.title).includes(q) || txt(e.description).includes(q) || txt(e.consequences).includes(q));

    // 5. Registros de Sessão (crônicas)
    let sessions = this.getChronicles();
    if (campaignId !== 'all') sessions = sessions.filter(s => s.campaign_id === campaignId);
    if (locationId !== 'all') sessions = sessions.filter(s => s.location_id === locationId);
    if (cityId !== 'all') sessions = sessions.filter(s => cityLocIds.includes(s.location_id));
    if (regionId !== 'all') sessions = sessions.filter(s => regionLocIds.includes(s.location_id));
    if (countryId !== 'all') sessions = sessions.filter(s => this.getLocationById(s.location_id)?.country_id === countryId);
    if (continentId !== 'all') sessions = sessions.filter(s => this.getLocationById(s.location_id)?.continent_id === continentId);
    if (characterId !== 'all') {
      const ch = this.getCharacterById(characterId);
      const first = txt(ch?.name).split(' ')[0];
      sessions = sessions.filter(s => (s.participants || []).includes(characterId) || (first && txt(s.lore + ' ' + s.summary).includes(first)));
    }
    if (q) sessions = sessions.filter(s => txt(s.title).includes(q) || txt(s.lore).includes(q) || txt(s.summary).includes(q));

    // 6. Documentos, Artefatos e Organizações
    let artifacts = this.getRelics();
    if (characterId !== 'all') {
      const ch = this.getCharacterById(characterId);
      artifacts = artifacts.filter(r => (ch?.relics || []).includes(r.name) || txt(r.owner).includes(txt(ch?.name).split(' ')[0]));
    }
    if (q) artifacts = artifacts.filter(r => txt(r.name).includes(q) || txt(r.description).includes(q) || txt(r.ability).includes(q));

    let organizations = this.getOrganizations();
    if (characterId !== 'all') organizations = organizations.filter(o => (o.members || []).includes(characterId));
    if (campaignId !== 'all') organizations = organizations.filter(o => (o.related_campaigns || []).includes(campaignId));
    if (q) organizations = organizations.filter(o => txt(o.name).includes(q) || txt(o.description).includes(q));

    // 7. Bestiário Canônico (10 Espécimes)
    let bestiary = this.getBestiary();
    if (q) bestiary = bestiary.filter(b => txt(b.name).includes(q) || txt(b.scientific_name).includes(q) || txt(b.behavior).includes(q) || txt(b.threat_level).includes(q) || txt(b.ecological_role).includes(q));

    // 8. Ledger Canônico (Gestão de Cânone & Hipóteses)
    let ledger = this.getCanonLedger();
    if (q) ledger = ledger.filter(item => txt(item.topic).includes(q) || txt(item.claim).includes(q) || txt(item.curator_notes).includes(q) || (item.sources || []).some(s => txt(s).includes(q)));

    // 9. Expressões Anímicas
    let powers = this.getPowers();
    if (q) powers = powers.filter(p => txt(p.name).includes(q) || txt(p.observable_effect).includes(q) || txt(p.belief_conflict).includes(q) || txt(p.category).includes(q));

    // 10. Casos de Folclore e Tradição Oral
    let folklore = this.getFolkloreCases();
    if (q) folklore = folklore.filter(f => txt(f.name).includes(q) || txt(f.real_location).includes(q) || txt(f.folklore_variations).includes(q) || txt(f.aegis_interpretation).includes(q));

    const want = (t) => entityType === 'all' || entityType === t;
    return {
      campaigns: want('campaigns') ? campaigns : [],
      characters: want('characters') ? characters : [],
      locations: want('locations') ? locations : [],
      events: want('events') ? events : [],
      sessions: want('sessions') ? sessions : [],
      artifacts: want('artifacts') ? artifacts : [],
      organizations: want('organizations') ? organizations : [],
      bestiary: want('bestiary') ? bestiary : [],
      ledger: want('ledger') ? ledger : [],
      powers: want('powers') ? powers : [],
      folklore: want('folklore') ? folklore : []
    };
  }

  getLocationById(id) {
    return this.data?.locations?.find(l => l.id === id) || null;
  }

  getCharacterById(id) {
    return this.data?.characters?.find(c => c.id === id) || null;
  }

  getChronicleById(id) {
    return this.data?.chronicles?.find(c => c.id === id) || null;
  }

  getBestiary() {
    return this.data?.bestiary || [];
  }

  getCreatureById(id) {
    return this.data?.bestiary?.find(c => c.id === id) || null;
  }

  getRelics() {
    return this.data?.relics || [];
  }

  getRelicById(id) {
    return this.data?.relics?.find(r => r.id === id) || null;
  }

    getTeiaDoTempo() {
    return this.data?.teia_do_tempo || { eras: [], nodes: [], links: [] };
  }

  getVirtuesSystem() {
    return this.data?.universe_rules?.virtues_system || null;
  }

  getRelationsGraph() {
    return this.data?.relations_graph || { nodes: [], links: [] };
  }

  getTimeline() {
    return this.data?.timeline || [];
  }

  getBattlemapTokens(mapId = null) {
    const tokens = this.data?.battlemap_tokens || [];
    if (!mapId) return tokens;
    return tokens.filter(t => t.map_id === mapId);
  }

  /**
   * Busca global por termo em locais, personagens, crônicas, criaturas, relíquias, campanhas e eventos
   */
  search(query) {
    if (!query || query.trim() === '') {
      return { locations: [], characters: [], chronicles: [], creatures: [], relics: [], campaigns: [], events: [] };
    }
    const q = query.toLowerCase().trim();

    const campaigns = (this.data?.campaigns || []).filter(c =>
      (c.title || c.name || '').toLowerCase().includes(q) ||
      (c.synopsis || '').toLowerCase().includes(q) ||
      (c.country_location || '').toLowerCase().includes(q)
    );

    const locations = (this.data?.locations || []).filter(l => 
      l.name.toLowerCase().includes(q) ||
      (l.zone || '').toLowerCase().includes(q) ||
      (l.description || '').toLowerCase().includes(q)
    );

    const characters = (this.data?.characters || []).filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.player || '').toLowerCase().includes(q) ||
      (c.summary || '').toLowerCase().includes(q) ||
      (c.personal_history || '').toLowerCase().includes(q) ||
      (c.relics && c.relics.some(r => r.toLowerCase().includes(q)))
    );

    const chronicles = (this.data?.chronicles || []).filter(cr =>
      (cr.title || '').toLowerCase().includes(q) ||
      (cr.lore || cr.summary || '').toLowerCase().includes(q)
    );

    const events = (this.data?.historical_events || []).filter(ev =>
      (ev.title || '').toLowerCase().includes(q) ||
      (ev.description || '').toLowerCase().includes(q)
    );

    const creatures = (this.data?.bestiary || []).filter(creature =>
      creature.name.toLowerCase().includes(q) ||
      (creature.zone || '').toLowerCase().includes(q) ||
      (creature.behavior || '').toLowerCase().includes(q) ||
      (creature.description || '').toLowerCase().includes(q)
    );

    const relics = (this.data?.relics || []).filter(relic =>
      relic.name.toLowerCase().includes(q) ||
      (relic.ability || '').toLowerCase().includes(q) ||
      (relic.description || '').toLowerCase().includes(q)
    );

    return { locations, characters, chronicles, creatures, relics, campaigns, events };
  }

  /**
   * Cópia fiel idêntica ao world_data.json para resiliência offline máxima
   */
    /* ==========================================================================
     MÉTODOS CANÔNICOS: LEDGER, PODERES, FOLCLORE, GLOSSÁRIO E REGRAS UNIFICADAS
     ========================================================================== */

  getCanonLedger(statusOrCategory = null) {
    const list = this.data?.canon_ledger || [];
    if (!statusOrCategory || statusOrCategory === 'all') return list;
    return list.filter(item => item.status === statusOrCategory || item.category === statusOrCategory);
  }

  getCanonLedgerItem(id) {
    return (this.data?.canon_ledger || []).find(item => item.id === id) || null;
  }

  getPowers() {
    return this.data?.powers || [];
  }

  getPowerById(id) {
    return (this.data?.powers || []).find(p => p.id === id) || null;
  }

  getFolkloreCases() {
    return this.data?.folklore_cases || [];
  }

  getFolkloreCaseById(id) {
    return (this.data?.folklore_cases || []).find(f => f.id === id) || null;
  }

  getGlossary() {
    return this.data?.glossary || [];
  }

  getGlossaryTerm(term) {
    if (!term) return null;
    const q = term.toLowerCase().trim();
    return (this.data?.glossary || []).find(g => g.term.toLowerCase().trim() === q) || null;
  }

  getCanonicalSkills() {
    return this.data?.universe_rules?.canonical_skills || [];
  }

  /**
   * Serviço unificado de resolução de testes (Proposta Canônica Evren)
   * Atributo = pool de d20 (manter maior) + modificador de treinamento
   */
  resolveCheck(attributeScore = 1, trainingTier = 'Destreinado', difficulty = 14) {
    const tierBonuses = { 'Destreinado': 0, 'Treinado': 1, 'Veterano': 2, 'Expert': 3 };
    const bonus = typeof trainingTier === 'number' ? trainingTier : (tierBonuses[trainingTier] ?? 0);
    const pool = Math.max(1, Math.min(5, Math.floor(attributeScore)));
    const rolls = [];
    for (let i = 0; i < pool; i++) {
      rolls.push(Math.floor(Math.random() * 20) + 1);
    }
    const highest = Math.max(...rolls);
    const total = highest + bonus;
    const success = total >= difficulty;
    const margin = total - difficulty;
    return {
      pool,
      rolls,
      highest,
      bonus,
      total,
      difficulty,
      success,
      margin,
      isNatural20: highest === 20
    };
  }

    /* ==========================================================================
     MÉTODOS CANÔNICOS: LEDGER, PODERES, FOLCLORE, GLOSSÁRIO E REGRAS UNIFICADAS
     ========================================================================== */

  getCanonLedger(statusOrCategory = null) {
    const list = this.data?.canon_ledger || [];
    if (!statusOrCategory || statusOrCategory === 'all') return list;
    return list.filter(item => item.status === statusOrCategory || item.category === statusOrCategory);
  }

  getCanonLedgerItem(id) {
    return (this.data?.canon_ledger || []).find(item => item.id === id) || null;
  }

  getPowers() {
    return this.data?.powers || [];
  }

  getPowerById(id) {
    return (this.data?.powers || []).find(p => p.id === id) || null;
  }

  getFolkloreCases() {
    return this.data?.folklore_cases || [];
  }

  getFolkloreCaseById(id) {
    return (this.data?.folklore_cases || []).find(f => f.id === id) || null;
  }

  getGlossary() {
    return this.data?.glossary || [];
  }

  getGlossaryTerm(term) {
    if (!term) return null;
    const q = term.toLowerCase().trim();
    return (this.data?.glossary || []).find(g => g.term.toLowerCase().trim() === q) || null;
  }

  getCanonicalSkills() {
    return this.data?.universe_rules?.canonical_skills || [];
  }

  /**
   * Serviço unificado de resolução de testes (Proposta Canônica Evren)
   * Atributo = pool de d20 (manter maior) + modificador de treinamento
   */
  resolveCheck(attributeScore = 1, trainingTier = 'Destreinado', difficulty = 14) {
    const tierBonuses = { 'Destreinado': 0, 'Treinado': 1, 'Veterano': 2, 'Expert': 3 };
    const bonus = typeof trainingTier === 'number' ? trainingTier : (tierBonuses[trainingTier] ?? 0);
    const pool = Math.max(1, Math.min(5, Math.floor(attributeScore)));
    const rolls = [];
    for (let i = 0; i < pool; i++) {
      rolls.push(Math.floor(Math.random() * 20) + 1);
    }
    const highest = Math.max(...rolls);
    const total = highest + bonus;
    const success = total >= difficulty;
    const margin = total - difficulty;
    return {
      pool,
      rolls,
      highest,
      bonus,
      total,
      difficulty,
      success,
      margin,
      isNatural20: highest === 20
    };
  }

  getEmbeddedFallbackData() {
    return {
  "universe_rules": {
    "system": "Evren",
    "universe": "Evren",
    "edition": "Evren Core Rules (3.5 Canonical Playtest Proposal)",
    "attributes": [
      {
        "name": "Força",
        "abbr": "FOR",
        "min": 1,
        "max": 5,
        "desc": "Potência muscular, atletismo, capacidade de carga e impacto corpo a corpo."
      },
      {
        "name": "Vigor",
        "abbr": "VIG",
        "min": 1,
        "max": 5,
        "desc": "Constituição física, resistência a toxinas, absorção de trauma e estabilidade fisiológica."
      },
      {
        "name": "Agilidade",
        "abbr": "AGI",
        "min": 1,
        "max": 5,
        "desc": "Coordenação motora, velocidade de reação, reflexos, destreza e furtividade."
      },
      {
        "name": "Presença",
        "abbr": "PRE",
        "min": 1,
        "max": 5,
        "desc": "Força de personalidade, empatia, influência social, coragem e percepção intuitiva."
      },
      {
        "name": "Intelecto",
        "abbr": "INT",
        "min": 1,
        "max": 5,
        "desc": "Capacidade analítica, erudição, raciocínio lógico, investigação e conhecimentos técnicos."
      }
    ],
    "resolution_mechanics": {
      "rule": "Pool de d20 por Atributo (manter maior resultado) + Grau de Treinamento",
      "training_tiers": [
        {
          "tier": "Destreinado",
          "bonus": 0,
          "legacy_bonus": 0,
          "desc": "Uso intuitivo sem formação prévia."
        },
        {
          "tier": "Treinado",
          "bonus": 1,
          "legacy_bonus": 5,
          "desc": "Instrução formal ou prática recorrente."
        },
        {
          "tier": "Veterano",
          "bonus": 2,
          "legacy_bonus": 10,
          "desc": "Anos de experiência sob estresse operacional."
        },
        {
          "tier": "Expert",
          "bonus": 3,
          "legacy_bonus": 15,
          "desc": "Autoridade técnica ou mestre de campo no assunto."
        }
      ],
      "difficulties": [
        {
          "dt": 10,
          "label": "Simples",
          "context": "Tarefa rotineira realizada sob leve pressão de tempo."
        },
        {
          "dt": 14,
          "label": "Arriscada",
          "context": "Situação perigosa, ambiente hostil ou oposição moderada."
        },
        {
          "dt": 18,
          "label": "Difícil",
          "context": "Desafio extremo, anomalia ativa ou recursos escassos."
        },
        {
          "dt": 22,
          "label": "Extrema",
          "context": "Proeza limítrofe entre sobrevivência e colapso anômalo."
        }
      ],
      "conflict_resolution": "Conflito Direto Resistido: maior total vence. Em caso de empate exato, o empate favorece quem já defendia a posição."
    },
    "canonical_skills": [
      {
        "name": "Acrobacia",
        "attr": "AGI",
        "category": "Físicas",
        "aliases": [
          "Acrobacias"
        ]
      },
      {
        "name": "Adestramento",
        "attr": "PRE",
        "category": "Sociais",
        "aliases": [
          "Trato de Animais"
        ]
      },
      {
        "name": "Artes",
        "attr": "PRE",
        "category": "Sociais",
        "aliases": [
          "Expressão Artística"
        ]
      },
      {
        "name": "Atletismo",
        "attr": "FOR",
        "category": "Físicas",
        "aliases": [
          "Condicionamento Físico"
        ]
      },
      {
        "name": "Atualidades",
        "attr": "INT",
        "category": "Mente",
        "aliases": [
          "Geopolítica",
          "Notícias"
        ]
      },
      {
        "name": "Ciências",
        "attr": "INT",
        "category": "Mente",
        "aliases": [
          "Ciência",
          "Química",
          "Biologia"
        ]
      },
      {
        "name": "Crime",
        "attr": "AGI",
        "category": "Físicas",
        "aliases": [
          "Ladinagem",
          "Gazuas"
        ]
      },
      {
        "name": "Diplomacia",
        "attr": "PRE",
        "category": "Sociais",
        "aliases": [
          "Negociação",
          "Persuasão"
        ]
      },
      {
        "name": "Enganação",
        "attr": "PRE",
        "category": "Sociais",
        "aliases": [
          "Blefe",
          "Disfarce"
        ]
      },
      {
        "name": "Fortitude",
        "attr": "VIG",
        "category": "Físicas",
        "aliases": [
          "Resistência Física"
        ]
      },
      {
        "name": "Furtividade",
        "attr": "AGI",
        "category": "Físicas",
        "aliases": [
          "Infiltração",
          "Silêncio"
        ]
      },
      {
        "name": "Iniciativa",
        "attr": "AGI",
        "category": "Físicas",
        "aliases": [
          "Prontidão"
        ]
      },
      {
        "name": "Intimidação",
        "attr": "PRE",
        "category": "Sociais",
        "aliases": [
          "Coerção",
          "Pressão Moral"
        ]
      },
      {
        "name": "Intuição",
        "attr": "PRE",
        "category": "Sociais",
        "aliases": [
          "Sentido de Perigo"
        ]
      },
      {
        "name": "Investigação",
        "attr": "INT",
        "category": "Mente",
        "aliases": [
          "Perícia de Campo",
          "Forense"
        ]
      },
      {
        "name": "Luta",
        "attr": "FOR",
        "category": "Físicas",
        "aliases": [
          "Combate Desarmado",
          "Armas Brancas"
        ]
      },
      {
        "name": "Medicina",
        "attr": "INT",
        "category": "Mente",
        "aliases": [
          "Primeiros Socorros",
          "Cirurgia"
        ]
      },
      {
        "name": "Ocultismo",
        "attr": "INT",
        "category": "Mente",
        "aliases": [
          "Misticismo",
          "Fenomenologia"
        ]
      },
      {
        "name": "Percepção",
        "attr": "PRE",
        "category": "Sociais",
        "aliases": [
          "Vigilância",
          "Atenção"
        ]
      },
      {
        "name": "Pilotagem",
        "attr": "AGI",
        "category": "Físicas",
        "aliases": [
          "Condução",
          "Navegação Aérea/Marítima"
        ]
      },
      {
        "name": "Pontaria",
        "attr": "AGI",
        "category": "Físicas",
        "aliases": [
          "Disparo",
          "Armas de Fogo"
        ]
      },
      {
        "name": "Profissão",
        "attr": "INT",
        "category": "Mente",
        "aliases": [
          "Ofício",
          "Conhecimento Prático"
        ]
      },
      {
        "name": "Reflexos",
        "attr": "AGI",
        "category": "Físicas",
        "aliases": [
          "Evasão Rápida"
        ]
      },
      {
        "name": "Religião",
        "attr": "PRE",
        "category": "Sociais",
        "aliases": [
          "Teologia",
          "Ritos"
        ]
      },
      {
        "name": "Sobrevivência",
        "attr": "INT",
        "category": "Mente",
        "aliases": [
          "Rastreamento",
          "Orientação Selvagem"
        ]
      },
      {
        "name": "Tática",
        "attr": "INT",
        "category": "Mente",
        "aliases": [
          "Estratégia Militar",
          "Posicionamento"
        ]
      },
      {
        "name": "Tecnologia",
        "attr": "INT",
        "category": "Mente",
        "aliases": [
          "Computação",
          "Hardware"
        ]
      },
      {
        "name": "Vontade",
        "attr": "PRE",
        "category": "Sociais",
        "aliases": [
          "Resistência Psíquica",
          "Foco Moral"
        ]
      }
    ],
    "metrics_separation": {
      "pv": "Pontos de Vida: Integridade física e biológica. Dano sofrido reduz PV. Em 0 PV, ocorre colapso físico imediato / protocolo de óbito.",
      "pd": "Pontos de Determinação: Esforço, foco e determinação tática. Gasto para manobras especiais, foco anímico e poderes. Em 0 PD, ocorre exaustão mental e sobrecarga psíquica, sem dano corporal direto.",
      "san": "Sanidade: Estabilidade subjetiva diante do horror paranormal e alienígena. Tratada como recurso dramático com segurança de mesa, sem estigmatização clínica e sem perda permanente irrevogável de personagem.",
      "mda": "Mutagênese Dimensional Anômala: Escala de exposição celular e reescrita biológica (0% a 99%)."
    },
    "mda_progression_thresholds": [
      {
        "percent": 5,
        "label": "Exposição Latente",
        "effect": "Sensibilidade periférica aumentada; estática leve na audição."
      },
      {
        "percent": 10,
        "label": "Ressonância Folicular",
        "effect": "Alteração de pigmentação e reflexo ocular anômalo sob luz violeta."
      },
      {
        "percent": 20,
        "label": "Hipertrofia Adaptativa",
        "effect": "Resistência aumentada a dor; temperatura corporal oscilante."
      },
      {
        "percent": 40,
        "label": "Divergência Celular",
        "effect": "Aceleração regenerativa; rejeição a medicamentos convencionais."
      },
      {
        "percent": 60,
        "label": "Biomorfose Parcial",
        "effect": "Tecido epidérmico rígido ou condutor; consumo dobrado de calorias."
      },
      {
        "percent": 80,
        "label": "Instabilidade Morfogenética",
        "effect": "Emissão de pulso biótico espontâneo; risco de transição involuntária."
      },
      {
        "percent": 99,
        "label": "Transcendência Limítrofe",
        "effect": "Fusão irreversível com as leis físicas locais da anomalia."
      }
    ],
    "animic_expression_framework": {
      "definition": "Expressão Anímica: Capacidade singular da alma, memória ou convicção de um indivíduo manifestar efeitos delimitados no ambiente. Rejeita fórmulas mágicas genéricas ou arquétipos de sistemas externos.",
      "required_fields": [
        "belief_conflict",
        "observable_effect",
        "trigger",
        "range_duration_targets",
        "cost_pd",
        "risk_mda",
        "sensory_sign",
        "limits",
        "counterplay",
        "consequences"
      ]
    },
    "investigation_principles": [
      "Regra dos 3 Caminhos: Nenhuma pista essencial para a sobrevivência ou desvendamento de um arco depende de uma única rolagem de dados.",
      "Falha com Custo Narrativo: Falhar em um teste de investigação nunca paralisa a história; gera custo em tempo, barulho, exposição a anomalias ou perda de recursos.",
      "Separação Epistêmica: O que o pesquisador sabe, o que a A.E.G.I.S. arquiva e a realidade objetiva são camadas independentes."
    ],
    "kinetic_combat_rules": {
      "stances": [
        {
          "id": "esquiva",
          "name": "Esquiva Cinética",
          "roll": "Agilidade + Reflexos",
          "on_win": "Evita todo o dano do ataque e ganha Vantagem Tática."
        },
        {
          "id": "bloqueio",
          "name": "Bloqueio de Ferro",
          "roll": "Vigor + Fortitude ou Força + Luta",
          "on_win": "Reduz dano pela armadura/absorção."
        },
        {
          "id": "contra_ataque",
          "name": "Contra-Ataque Desesperado",
          "roll": "Ataque Simultâneo",
          "on_win": "Ambos os combatentes rolam dano."
        },
        {
          "id": "foco_animico",
          "name": "Foco Anímico",
          "roll": "Presença + Vontade",
          "on_win": "Resiste a agressões dimensionais, mentais e gravitacionais."
        }
      ],
      "armor_sacrifice": "Sacrifício Único de Armadura: Em golpes letais (hitkill), o defensor pode estilhaçar completamente sua couraça para anular o dano mortal."
    },
    "virtues_system": {
      "version": "v2.0 Integrada",
      "title": "As Onze Virtudes Oficiais de Alma & Metafísica Anímica",
      "triad_of_identity": {
        "title": "A Tríade da Identidade",
        "pillars": [
          {
            "name": "Personalidade (A Superfície Ativa)",
            "desc": "Comportamentos e postura visível; molda maneirismos e estilo de combate."
          },
          {
            "name": "Experiências (A Memória Esculpida)",
            "desc": "Traumas, perdas e cicatrizes; esculpe a anatomia visual e técnicas da Alma."
          },
          {
            "name": "Essência (O Núcleo Imutável)",
            "desc": "A verdade irredutível do ego; determina qual das 11 Virtudes se manifesta."
          }
        ]
      },
      "metaphysical_triad": {
        "title": "A Tríade Metafísica: Corpo, Alma e Verdadeira Magia",
        "spheres": [
          {
            "name": "Mutação Biológica Extrema (O Corpo)",
            "rule": "Lei da Alucinação. Reescrita de DNA por fendas e estresse letal."
          },
          {
            "name": "Virtudes de Alma (A Identidade)",
            "rule": "Densidade espiritual anímica em Projeção, Sintonia ou Convergência."
          },
          {
            "name": "A Verdadeira Magia (A Regra)",
            "rule": "Exclusiva do Primogênito: reescrita direta das leis da realidade."
          }
        ]
      },
      "conceptual_groups": [
        {
          "group": "Virtudes Construtivas",
          "philosophy": "Edificação, preservação, coesão e discernimento.",
          "virtues": [
            "Coragem",
            "Compaixão",
            "Disciplina",
            "Sabedoria"
          ]
        },
        {
          "group": "Virtudes Transformadoras",
          "philosophy": "Alteração ativa do estado das coisas: superação, leis proporcionais, fluidez e conquista.",
          "virtues": [
            "Esperança",
            "Justiça",
            "Liberdade",
            "Ambição"
          ]
        },
        {
          "group": "Virtudes Instintivas",
          "philosophy": "Forças viscerais: autoridade soberana, explosão de ódio e domínio do terror primordial.",
          "virtues": [
            "Orgulho",
            "Fúria",
            "Medo"
          ]
        }
      ],
      "manifestation_modes": [
        {
          "mode": "Projeção (Avatar Exterior)",
          "cost": "2 EA (1 se primária)",
          "effect": "Avatar tangível à distância; dano sofrido reverbera no usuário (Elo Vital)."
        },
        {
          "mode": "Sintonia (Revestimento)",
          "cost": "2 EA (1 se primária)",
          "effect": "Corpo revestido por energia anímica; +2 em atributo e punhos capazes de ferir entidades."
        },
        {
          "mode": "Convergência (Fusão Total)",
          "cost": "10 EA + 6 PD no ato; 3 EA + 2 EST por rodada",
          "effect": "Fusão absoluta com a Alma. Exige MDA 40%+. +2 em todos atributos, +6 RD."
        }
      ],
      "gauges": {
        "pv": "Vitalidade (Corpo): 20 + (Vigor * 5) + Bônus MDA.",
        "pd": "Determinação (Esforço Humano): 15 a 70 PD para Arquétipos e Relíquias.",
        "ea": "Energia de Alma: Bônus Base MDA + (Presença * 3) para Manifestações e Técnicas.",
        "est": "Estabilidade: 10 + Presença + Intelecto (a 0 EST ocorre Teste de Ruptura 1d6)."
      }
    }
  },
  "maps": [
    {
      "id": "map_world",
      "name": "Mapa Múndi Real (Todos os Países & Anomalias)",
      "type": "global",
      "theme": "Dark Fantasy Cartographic",
      "center": [
        22,
        -50
      ],
      "default_zoom": 3,
      "description": "Visão global com as fronteiras de todos os países do mundo, destacando as anomalias no Triângulo das Bermudas e no México."
    },
    {
      "id": "map_triangulo",
      "name": "Setor Abissal: O Triângulo das Bermudas",
      "type": "local",
      "campaign_id": "camp_001",
      "center": [
        25,
        -71.5
      ],
      "default_zoom": 7,
      "bounds": [
        [
          18,
          -82
        ],
        [
          33,
          -64
        ]
      ],
      "description": "Carta náutica tática no Oceano Atlântico, no exato Triângulo das Bermudas entre Miami, Bermudas e Porto Rico."
    },
    {
      "id": "map_vilar",
      "name": "Propriedade Vilar & Minas Subterrâneas (México)",
      "type": "local",
      "campaign_id": "camp_002",
      "center": [
        21.85,
        -102.25
      ],
      "default_zoom": 11,
      "bounds": [
        [
          21.7,
          -102.45
        ],
        [
          22,
          -102.1
        ]
      ],
      "description": "Planta arquitetônica da propriedade isolada na serra mineradora do México e do complexo subterrâneo dos Ecos."
    },
    {
      "id": "map_artico",
      "name": "Estação Criogênica Zero & Fenda Glacial (Groenlândia)",
      "type": "local",
      "campaign_id": "camp_003",
      "center": [
        72,
        -40
      ],
      "default_zoom": 9,
      "bounds": [
        [
          71,
          -42
        ],
        [
          73,
          -38
        ]
      ],
      "description": "Base científica subterrânea escavada sob 3km de calota de gelo, onde o primeiro espécime com DNA Primordial foi preservado antes do colapso do Triângulo."
    },
    {
      "id": "map_brasil",
      "name": "Setor Selva: Bacia do Rio Tapajós & Cratera de Quartzo Negro (Brasil)",
      "type": "local",
      "campaign_id": "camp_004",
      "center": [
        -4.25,
        -55.98
      ],
      "default_zoom": 10,
      "bounds": [
        [
          -5.5,
          -57.5
        ],
        [
          -3,
          -54.5
        ]
      ],
      "description": "Setor florestal isolado no Pará, Brasil, onde formações subterrâneas de quartzo negro entraram em ressonância com a mente biológica do Arquiteto do Caos."
    },
    {
      "id": "map_alemanha",
      "name": "Setor Floresta Negra: Monastério dos Sem-Rosto (Alemanha)",
      "type": "local",
      "campaign_id": "camp_005",
      "center": [
        48.15,
        8.2
      ],
      "default_zoom": 11,
      "bounds": [
        [
          47.8,
          7.8
        ],
        [
          48.6,
          8.6
        ]
      ],
      "description": "Ruínas góticas e criptas subterrâneas do século XIV erguidas em Baden-Württemberg, Alemanha, sobre a Fenda Acústica do LIMIAR."
    }
  ],
  "campaigns": [
    {
      "id": "camp_001",
      "title": "A Incursão: O Purgatório Genético",
      "status": "futura campanha",
      "category": "future",
      "theme": "Survival Horror Biológico",
      "map_id": "map_triangulo",
      "world_coordinates": [
        25.5,
        -71.5
      ],
      "gateway_name": "O Triângulo das Bermudas / A Incursão",
      "danger_rating": "NÍVEL ÔMEGA // LEI DA ALUCINAÇÃO",
      "country_location": "Triângulo das Bermudas (Oceano Atlântico Norte)",
      "year": "1998 // Registro Histórico Inicial",
      "description": "No coração do verdadeiro Triângulo das Bermudas, um buraco de minhoca no Atlântico engole navios. Lá, a magia não existe: apenas mutação biológica violenta sob a mente do Arquiteto do Caos.",
      "synopsis": "Um grupo de sobreviventes é tragado pelo Triângulo das Bermudas, atravessando cinco estágios dimensionais brutais (borda infinita, repetição em loop, redemoinhos gravitacionais, dor craniana e êxtase de adaptação). Na Sessão 1, a manifestação da Verdadeira Magia do Primogênito — O Diabo do Mar congela as águas em azul-escuro e corrói metais em ferrugem brilhante; diante do letal Campo de Rosas, o Guia Temporário sacrifica a própria vida para salvar os recém-chegados. Na Sessão 2, o grupo explora o arquipélago hostil e descobre a Ilha Canibal, onde há 400 anos um humano náufrago ensinou práticas de canibalismo aos dinossauros nativos. A jornada por entre as carcaças de Nova Caronte, a opulência escravista da Cidadela de Nácar, os pulsos eletromagnéticos do Fosso do Kraken e o sonar destrutivo do Leviatã Branco culmina na quebra do bloqueio dimensional e no recrutamento dos sobreviventes pelo Diretor Kaelen da A.E.G.I.S.",
      "participants": [
        "char_arquiteto",
        "char_guia_temporario",
        "char_marcos_valente",
        "char_iris_vento_solto",
        "char_valerius",
        "char_mateus_alencar",
        "char_raissa_carnica"
      ],
      "locations_list": [
        "loc_caronte",
        "loc_kraken"
      ],
      "continent_id": "cont_atlantico",
      "country_id": "country_atlantico_bermudas",
      "region_id": "reg_fossa_caronte",
      "city_id": "city_porto_caronte",
      "period_numeric": 2026,
      "status_museum": "futura campanha",
      "historical_context": "Em 2025, distúrbios magnéticos e biológicos severos começaram a ser registrados no corredor marítimo entre Miami, Bermudas e Porto Rico. O desaparecimento de uma embarcação de grande porte com milhares de passageiros deu início à formação do reduto isolado de Nova Caronte.",
      "exhibition_narrative": {
        "prior_context": "Durante anos, relatórios navais da Fundação A.E.G.I.S. apontavam anomalias hidrográficas e desaparecimentos de embarcações na Fossa de Porto Rico e no Triângulo das Bermudas. Experimentos genéticos clandestinos conduzidos na década anterior prepararam o terreno para a emergência da entidade conhecida como Cobaia Zero.",
        "campaign_beginning": "A história tem início quando um navio transportando cerca de 5.000 almas é engolido por uma violenta tempestade elétrica no Atlântico Norte e arremessado às costas rochosas de Nova Caronte.",
        "main_events": "Os sobreviventes do naufrágio precisaram estabelecer um perímetro costeiro em meio a recursos escassos, enquanto enfrentavam organismos marinhos com mutagênese acelerada (MDA) e infiltração de mímicos biológicos entre a própria tripulação.",
        "turning_points": "A descoberta de que as leis biológicas locais estavam sendo ativamente manipuladas pelo 'Arquiteto do Caos' (também documentado nos registros marítimos como Diabo do Mar) mudou o objetivo da expedição de simples resgate para sobrevivência e envio de sinal à A.E.G.I.S.",
        "conflicts": "Confrontos diretos nas docas destroçadas de Nova Caronte e no Fosso do Kraken contra o Soberano Abissal e os organismos de guarda do Arquiteto.",
        "revelations": "Revelou-se que Nova Caronte funciona como um laboratório evolutivo fechado, onde a pressão extrema desperta adaptações celulares agressivas nos sobreviventes.",
        "consequences": "Isolamento total do perímetro marítimo do Atlântico Norte pela A.E.G.I.S. e mobilização de frotas de observação oceânica.",
        "outcome": "Futura Campanha — As expedições a Nova Caronte aguardam o desenrolar das próximas sessões de jogo."
      },
      "pending_documentation": [
        "Nomes completos e biografias individuais dos demais tripulantes jogadores do navio de 5.000 almas (pendente de envio pelo curador).",
        "Desfecho definitivo da campanha (atualmente em andamento)."
      ],
      "historical_identification": {
        "name": "A Incursão: O Purgatório Genético",
        "year": "Ano 2026 // Presente",
        "period_numeric": 2026,
        "status": "(Futura Campanha)",
        "continent_id": "cont_atlantico",
        "country_id": "country_atlantico_bermudas",
        "region_id": "reg_fossa_caronte",
        "city_id": "city_porto_caronte",
        "geographic_location": "Oceano Atlântico Norte (Triângulo das Bermudas)",
        "coordinates": [
          25.5,
          -71.5
        ],
        "genre_theme": "Survival Horror Biológico",
        "synopsis": "Um navio com centenas de sobreviventes foi tragado pelo vórtice dimensional no Atlântico. Ao cruzarem a fenda para Nova Caronte, descobriram que leis biológicas foram distorcidas. O Arquiteto do Caos manipula mentes e corpos enquanto a A.E.G.I.S. tenta conter o colapso.",
        "historical_context": "Em 2025, distúrbios magnéticos e biológicos severos começaram a ser registrados no corredor marítimo entre Miami, Bermudas e Porto Rico. O desaparecimento de uma embarcação de grande porte com milhares de passageiros deu início à formação do reduto isolado de Nova Caronte."
      },
      "canon_status": "in_world_report",
      "sources": [
        "Manuscrito da Incursão (Autor)",
        "Arquivo Marítimo Nova Caronte",
        "Dossiê A.E.G.I.S. Atlântico Norte"
      ],
      "curator_notes": "Registra a incursão massiva no Triângulo das Bermudas. Contém variantes de 5.000 passageiros no navio tragado, a hierarquia de classes ecológicas e a presença dos Soberanos territoriais.",
      "variants": {
        "ship_passengers": "5.000 pessoas (manuscrito principal) vs. 'centenas' (resumos de campo)",
        "anomaly_origin": "Prisão natural milenar em colapso vs. Fissura acelerada por experimentos modernos",
        "classes": [
          "Classe Baixa (recém-chegados, comunidades frágeis)",
          "Classe Média (rotas de troca)",
          "Classe Alta (Cidadela de Nácar)",
          "Soberanos (Kraken, Leviatã Branco, Povo Sauriano, Arquiteto)"
        ]
      },
      "coordinates": [
        25.5,
        -71.5
      ],
      "name": "A Incursão: O Purgatório Genético",
      "is_future": true,
      "outcome": "Campanha planejada / Não iniciada — Os acontecimentos e o desfecho aguardam a realização das sessões."
    },
    {
      "id": "camp_002",
      "title": "Até o Amanhecer: O Limiar da Mansão Vilar",
      "status": "concluída",
      "category": "completed",
      "theme": "Thriller Psicológico Investigativo",
      "map_id": "map_vilar",
      "world_coordinates": [
        21.85,
        -102.25
      ],
      "gateway_name": "Mansão Vilar: Até o Amanhecer (México)",
      "danger_rating": "NÍVEL ALFA // ECOS SUBTERRÂNEOS & LIMIAR",
      "country_location": "México (Sierra Madre / Sonora)",
      "year": "Ano 2024 // Finalizada",
      "description": "Na região montanhosa e mineradora do México, cinco amigos retornam à isolada Mansão Vilar, onde foram manipulados psicologicamente por uma figura mascarada armada com o LIMIAR.",
      "synopsis": "Três anos após o desaparecimento de Lucas Vilar nas minas, cinco amigos (Rafael, Helena, Diego, Bia e Arthur) são atraídos para a isolada Estação e Mansão Vilar a bordo de um trem com um misterioso sexto bilhete validado para Lucas. Na propriedade, uma figura mascarada munida do Projeto LIMIAR — dispositivo de portais de curto alcance com cheiro de ozônio e som elétrico ZZZZT — aterroriza o grupo para forçar a confissão de seus segredos. Desmascarado como Gabriel Vilar, o irmão mais velho descobre que os amigos não mataram Lucas, e a busca move-se para as minas abandonadas. Enfrentando o horror biológico do predador cego O Eco (que atrai vítimas imitando vozes humanas perfeitamente), o grupo encontra Lucas Vilar vivo nas profundezas, adaptado à escuridão com a perna quebrada. A fuga culmina na explosão das galerias e na reconciliação da família.",
      "outcome": "✓ Lucas Vilar foi resgatado com vida (cego e marcado pelas profundezas).\n✓ Gabriel Vilar foi desmascarado e desapareceu através de uma dobra do LIMIAR.\n✓ A Mansão Vilar e as entradas das minas foram detonadas com cargas explosivas para conter os Ecos.",
      "participants": [
        "char_lucas",
        "char_gabriel",
        "char_rafael",
        "char_julia"
      ],
      "locations_list": [
        "loc_vilar",
        "loc_vilar_casarao",
        "loc_vilar_minas"
      ],
      "continent_id": "cont_america_norte",
      "country_id": "country_mexico",
      "region_id": "reg_serra_mineradora",
      "city_id": "city_san_lorenzo_vilar",
      "period_numeric": 2024,
      "status_museum": "concluída",
      "historical_context": "Situada nas serras históricas de mineração de prata do México em 2024, esta campanha documenta o retorno de um grupo de amigos à isolada Mansão Vilar, exatamente três anos após o trágico desaparecimento de Lucas Vilar nas galerias subterrâneas da propriedade.",
      "exhibition_narrative": {
        "prior_context": "Três anos antes dos acontecimentos principais (em 2021), uma falha trágica durante uma exploração juvenil nas minas abaixo da Mansão Vilar resultou na queda e desaparecimento de Lucas Vilar. O grupo de amigos fragmentou-se sob o peso do segredo e da culpa.",
        "campaign_beginning": "Em 2024, convocados para retornar à propriedade isolada durante uma tempestade severa na serra mexicana, Rafael Moreira, Júlia Drummond e seus companheiros veem-se trancados no perímetro da mansão com as vias de acesso bloqueadas.",
        "main_events": "Ao longo de uma única madrugada ('Até o Amanhecer'), os visitantes foram submetidos a testes psicológicos, gravações de fita cassete e emboscadas conduzidas por uma figura mascarada que conhecia cada detalhe do passado do grupo.",
        "turning_points": "A descoberta do laboratório clandestino no Casarão Principal e a revelação de que o Mascarado utilizava um protótipo tecnológico de deslocamento espacial denominado LIMIAR.",
        "conflicts": "Perseguições tensas pelos corredores da Mansão Vilar e a descida decisiva às Minas Antigas, onde o grupo precisou conter os 'Ecos Subterrâneos' — predadores cegos que imitam vozes humanas na escuridão.",
        "revelations": "O Mascarado foi desmascarado como Gabriel Vilar (atuando sob a identidade de Davi Reis), irmão de Lucas, que orquestrou a noite de confissão para punir os responsáveis pelo abandono do irmão. Mais surpreendente ainda foi encontrar Lucas Vilar vivo nas profundezas das minas, cego porém dotado de audição absoluta.",
        "consequences": "A Mansão Vilar e os acessos principais às minas foram detonados com cargas explosivas para sepultar os Ecos Subterrâneos. Gabriel Vilar desapareceu ao ativar uma dobra instável do protótipo LIMIAR, deixando registros que mais tarde seriam estudados pela A.E.G.I.S.",
        "outcome": "Campanha concluída com sucesso histórico: Lucas Vilar foi resgatado com vida ao amanhecer por Rafael Moreira e Júlia Drummond; o complexo minerador foi demolido e interditado."
      },
      "pending_documentation": [
        "Registros biográficos detalhados dos outros dois amigos mencionados nos relatos da Mansão Vilar (pendente de envio pelo curador)."
      ],
      "historical_identification": {
        "name": "Até o Amanhecer: O Limiar da Mansão Vilar",
        "year": "Ano 2024 // Finalizada",
        "period_numeric": 2024,
        "status": "Concluída",
        "continent_id": "cont_america_norte",
        "country_id": "country_mexico",
        "region_id": "reg_serra_mineradora",
        "city_id": "city_san_lorenzo_vilar",
        "geographic_location": "México (Serra Mineradora)",
        "coordinates": [
          21.85,
          -102.25
        ],
        "genre_theme": "Thriller Psicológico Investigativo",
        "synopsis": "Três anos após o desaparecimento trágico de Lucas Vilar nas minas mexicanas, o grupo de amigos reuniu-se na propriedade isolada. Gabriel Vilar assumiu o manto de 'O Mascarado', usando a arma de portais LIMIAR para encenar um jogo de terror psicológico para expor a culpa de cada um. No clímax subterrâneo, o grupo enfrentou os Ecos e explodiu o complexo.",
        "historical_context": "Situada nas serras históricas de mineração de prata do México em 2024, esta campanha documenta o retorno de um grupo de amigos à isolada Mansão Vilar, exatamente três anos após o trágico desaparecimento de Lucas Vilar nas galerias subterrâneas da propriedade."
      },
      "canon_status": "confirmed",
      "sources": [
        "Roteiro de Até o Amanhecer (Autor)",
        "Dossiê San Lorenzo A.E.G.I.S.",
        "Depoimentos de Gabriel e Lucas Vilar"
      ],
      "curator_notes": "Relato da tragédia e resgate na Mansão Vilar. O elenco completo de sobreviventes adolescentes é composto por Rafael, Helena, Diego, Bia e Arthur, com Gabriel disfarçado de Davi Reis. Júlia Drummond é mantida como investigadora legada de arquivo.",
      "variants": {
        "dates": "Desaparecimento em 2021 e Clímax em 2024 (relatório principal) vs. 2023 (-3) e 2026 (cronologia estendida)",
        "cast_protagonists": [
          "Rafael",
          "Helena",
          "Diego",
          "Bia",
          "Arthur"
        ],
        "cast_npcs": [
          "Gabriel Vilar (Davi Reis)",
          "Camila Torres",
          "Mauro Azevedo",
          "Elias Rocha",
          "Júlia Drummond (Arquivo)"
        ]
      },
      "coordinates": [
        21.85,
        -102.25
      ],
      "name": "Até o Amanhecer: O Limiar da Mansão Vilar",
      "is_future": false
    },
    {
      "id": "camp_filantropo_oeht",
      "title": "A Gala da Meia-Noite: A Falsa Filantropia de Oeht",
      "status": "futura campanha",
      "category": "future",
      "theme": "Horror Institucional & Conspiração Corporativa",
      "map_id": "map_belvedere",
      "world_coordinates": [
        46.2044,
        6.1432
      ],
      "gateway_name": "Mansão Belvedere: Gala Oculta de Oeht",
      "danger_rating": "NÍVEL ÉPSILON // REDOMA E O ANÁRQUICO",
      "country_location": "Suíça (Alpes de Genebra / Mansão Belvedere)",
      "year": "Ano 2026 // Operação Belvedere",
      "description": "Oeht, aclamado publicamente como magnata filantropo e mecenas das artes, reuniu a elite global na suntuosa Mansão Belvedere para uma gala de aniversário secreta. Sob o pretexto de celebrar sua data natalícia, prepara o anúncio de uma megacorporação privada rival destinada a mercantilizar o paranormal e quebrar o monopólio de contenção da A.E.G.I.S. Porém, um lodo roxo escorre do cofre de seu gabinete privado e relâmpagos violetas silenciosos cortam o céu: a relíquia protegida por uma redoma blindada não é uma máquina de controle, mas um parasita extradimensional prestes a devorar todos à meia-noite.",
      "synopsis": "Infiltração de agentes da A.E.G.I.S. sob comando do Diretor Kaelen. O relógio de dobra temporal de 6 segundos, o discurso arrogante das 23h, a desconfiança da elite em testes de DT 15 e o dilema de desativar a redoma antes que o colossal bolo de aniversário se converta em uma monstruosidade canibal.",
      "outcome": "Desfecho com quarentena em vigor. A transcrição de campo foi corrompida no início da Zona B (Mesa de Poker VIP).",
      "participants": [
        "char_oeht",
        "char_kaelen"
      ],
      "locations_list": [
        "loc_mansao_belvedere",
        "loc_aegis_genebra"
      ],
      "continent_id": "cont_europa",
      "country_id": "country_suica",
      "region_id": "reg_alpes_centrais",
      "city_id": "city_genebra_distrito",
      "period_numeric": 2026,
      "status_museum": "futura campanha",
      "canon_status": "in_world_report",
      "sources": [
        "Transcrição Recuperada de Operação de Infiltração A.E.G.I.S.",
        "Briefing de Missão do Diretor Kaelen"
      ],
      "curator_notes": "Aviso de Curadoria: O registro desta campanha provém de uma fonte conversacional desclassificada parcialmente. As cenas a partir do início da Zona B (A Mesa de Poker VIP: O Jogo de Memórias) permanecem truncadas e aguardam documentação adicional sem preenchimento artificial. A Mansão Belvedere não deve ser confundida com a Mansão Vilar.",
      "historical_context": "A disputa geopolítica e financeira entre a A.E.G.I.S. e bilionários do setor privado que tentam transformar o Outro Lado em produto de consumo de luxo.",
      "exhibition_narrative": {
        "prior_context": "Oeht, figura pública ovacionada por doações filantrópicas astronômicas, descobriu a existência secreta da A.E.G.I.S. e da fenda do Outro Lado. Movido por vaidade desmedida e sede de poder absoluto, adquiriu no mercado clandestino uma caixa anômala ancestral e arquitetou a criação de uma corporação privada que comercializaria o paranormal para magnatas descontentes com a fiscalização estatal.",
        "campaign_beginning": "A operação de campo é autorizada em uma sala de comando subterrânea da A.E.G.I.S. O Diretor Kaelen informa que sensores de baixa frequência captaram tempestade eletromagnética silenciosa sobre a Mansão Belvedere, com raios roxos intermitentes. A janela de intervenção se encerra às 23h59. Um dos agentes infiltrados recebe um relógio mecânico capaz de curvar o fluxo temporal ao redor de si por 6 segundos.",
        "main_events": "Os agentes cruzam os salões de mármore e ouro da gala fingindo serem investidores internacionais. Convidados influentes colocam os novatos à prova com perguntas capciosas sobre quem representam (DT 15 Enganação/Diplomacia). Às 23h, Oeht sobe ao palanque central e profere um discurso inflamatório, denunciando a A.E.G.I.S. como 'Agência de Segurança Metafísica' e carcereira do progresso, prometendo que à meia-noite a caixa na redoma reescreverá a realidade nacional.",
        "turning_points": "No escritório privativo do anfitrião, os agentes descobrem um rastro viscoso de lodo roxo escorrendo pelas fendas do cofre reforçado. Kaelen confirma via rádio que o artefato é um parasita com fome celular galopante; a promessa de 'controle' não passa de indução hipnótica do parasita sobre a mente de Oeht.",
        "conflicts": "Dilema tático crucial: alertar Oeht sobre a armadilha ou tentar invasão armada direta. Caso convencido com evidências do lodo, Oeht entra em pânico ao perceber o engano e cede sua chave de acesso pessoal para abortar a tranca. Se os agentes falharem ou optarem pelo confronto, o bolo de aniversário monumental se transmuta em uma criatura horripilante armada de velas violetas e talheres flutuantes que explode violentamente.",
        "revelations": "O Outro Lado não respeita contratos de confidencialidade nem investimentos de risco; o artefato manipulou o bilionário para reunir dezenas de alvos de alto valor em um único cômodo isolado.",
        "consequences": "A Mansão Belvedere entrou em estado de isolamento tático sob cerco da A.E.G.I.S. O destino da fortuna de Oeht e das testemunhas de elite foi colocado sob sigilo federal nível 5.",
        "outcome": "[CONTEÚDO TRUNCADO NA FONTE] A transmissão do registro de campo é interrompida no início da 'Zona B: A Mesa de Poker VIP (O Jogo de Memórias)'. Cenas posteriores permanecem sob sigilo documental até novas ordens do curador."
      },
      "pending_documentation": "Desfecho da Mesa de Poker VIP, identidade dos demais patrocinadores no cofre e confirmação de sobrevivência de Oeht.",
      "historical_identification": "Operação Belvedere // A.E.G.I.S. Protocolo Filantropia Clandestina",
      "coordinates": [
        46.2044,
        6.1432
      ],
      "name": "A Gala da Meia-Noite: A Falsa Filantropia de Oeht",
      "is_future": true
    }
  ],
  "locations": [
    {
      "id": "loc_caronte",
      "name": "Nova Caronte & A Goela do Cachalote",
      "zone": "O Triângulo das Bermudas (Anomalia Atlântica)",
      "type": "Cidadela Flutuante",
      "map_id": "map_triangulo",
      "scope": "local",
      "coordinates": [
        25.5,
        -73.2
      ],
      "description": "Cidade flutuante erguida sobre carcaças de galeões e submarinos. Abriga o bar 'A Goela do Cachalote' em ossada colossal.",
      "chronicles": [
        "cron_inc_01"
      ],
      "continent_id": "cont_atlantico",
      "country_id": "country_atlantico_bermudas",
      "region_id": "reg_fossa_caronte",
      "city_id": "city_porto_caronte",
      "historical_type": "Assentamento Insular & Laboratório Genético",
      "illustration": "assets/ref_fantasy_world_map.jpg",
      "historical_importance": "Epicentro da campanha 'A Incursão', para onde convergiram os sobreviventes do navio de 5.000 almas e onde o Arquiteto do Caos estabeleceu seu domínio biológico.",
      "related_campaigns": [
        "camp_001"
      ],
      "characters_present": [
        "char_arquiteto"
      ],
      "historical_events": [
        "cron_inc_01",
        "time_03",
        "time_05"
      ],
      "epochs_active": [
        "2025",
        "2026 (Presente)"
      ],
      "campaign_id": "camp_001",
      "country": "Triângulo das Bermudas"
    },
    {
      "id": "loc_kraken",
      "name": "O Fosso do Kraken",
      "zone": "Fosso Abissal (Triângulo das Bermudas)",
      "type": "Covil Abissal",
      "map_id": "map_triangulo",
      "scope": "local",
      "coordinates": [
        23.8,
        -69.5
      ],
      "description": "Domínio do Soberano Abissal na Fossa de Porto Rico / Triângulo das Bermudas, uma lula colossal fundida com rochas vulcânicas capaz de gerar pulsos eletromagnéticos.",
      "continent_id": "cont_atlantico",
      "country_id": "country_atlantico_bermudas",
      "region_id": "reg_fossa_caronte",
      "city_id": "city_porto_caronte",
      "historical_type": "Fossa Oceânica & Zona de Naufrágios",
      "illustration": "assets/ref_outdoor_waterfall.jpg",
      "historical_importance": "Fenda submarina abissal ao sul de Nova Caronte onde embarcações históricas foram destroçadas pelo Soberano Abissal.",
      "related_campaigns": [
        "camp_001"
      ],
      "characters_present": [
        "char_arquiteto"
      ],
      "historical_events": [
        "cron_inc_01",
        "time_05"
      ],
      "epochs_active": [
        "2025",
        "2026 (Presente)"
      ]
    },
    {
      "id": "loc_vilar",
      "name": "Mansão Vilar & Minas Antigas",
      "zone": "México (Serra de Minas / Realidade)",
      "type": "Mansão Isolada",
      "map_id": "map_vilar",
      "scope": "local",
      "coordinates": [
        21.85,
        -102.25
      ],
      "description": "Casarão aristocrático e minas profundas onde Gabriel instalou o Projeto LIMIAR e onde viveu Lucas com o predador O Eco.",
      "chronicles": [
        "cron_vil_01"
      ],
      "continent_id": "cont_america_norte",
      "country_id": "country_mexico",
      "region_id": "reg_serra_mineradora",
      "city_id": "city_san_lorenzo_vilar",
      "historical_type": "Mansão Histórica & Propriedade Familiar",
      "illustration": "assets/ref_interior_tavern.jpg",
      "historical_importance": "Sede histórica da família Vilar no México. Palco central do reencontro de 2024, do experimento psicológico de Gabriel Vilar e do resgate de Lucas Vilar antes da demolição com explosivos.",
      "related_campaigns": [
        "camp_002"
      ],
      "characters_present": [
        "char_lucas",
        "char_gabriel",
        "char_rafael",
        "char_julia"
      ],
      "historical_events": [
        "cron_vil_01",
        "time_01",
        "time_02",
        "time_04"
      ],
      "epochs_active": [
        "2021 (Desaparecimento)",
        "2024 (A Noite da Confissão)"
      ],
      "campaign_id": "camp_002",
      "country": "México (Sonora)"
    },
    {
      "id": "loc_vilar_casarao",
      "name": "O Casarão & Laboratório do LIMIAR",
      "zone": "México (Propriedade Vilar)",
      "type": "Casarão Vitoriano",
      "map_id": "map_vilar",
      "scope": "local",
      "coordinates": [
        21.88,
        -102.2
      ],
      "description": "O casarão principal no México onde Gabriel Vilar aperfeiçoou a arma de portais LIMIAR e montou os aparatos de confissão.",
      "chronicles": [
        "cron_vil_01"
      ],
      "continent_id": "cont_america_norte",
      "country_id": "country_mexico",
      "region_id": "reg_serra_mineradora",
      "city_id": "city_san_lorenzo_vilar",
      "historical_type": "Laboratório Clandestino & Ala Residencial",
      "illustration": "assets/ref_interior_tavern.jpg",
      "historical_importance": "Edifício principal onde Gabriel Vilar desenvolveu em segredo o protótipo do dispositivo LIMIAR e onde as gravações de fita cassete foram encontradas pelo grupo.",
      "related_campaigns": [
        "camp_002"
      ],
      "characters_present": [
        "char_gabriel",
        "char_rafael",
        "char_julia"
      ],
      "historical_events": [
        "time_02",
        "cron_vil_01"
      ],
      "epochs_active": [
        "2022–2024"
      ]
    },
    {
      "id": "loc_vilar_minas",
      "name": "As Minas Antigas dos Ecos",
      "zone": "México (Subsolo da Serra)",
      "type": "Túneis Subterrâneos",
      "map_id": "map_vilar",
      "scope": "local",
      "coordinates": [
        21.82,
        -102.3
      ],
      "description": "Antigas galerias subterrâneas de mineração no México onde Lucas sobreviveu cego por 3 anos, caçado por criaturas que roubam vozes.",
      "chronicles": [
        "cron_vil_01"
      ],
      "continent_id": "cont_america_norte",
      "country_id": "country_mexico",
      "region_id": "reg_serra_mineradora",
      "city_id": "city_san_lorenzo_vilar",
      "historical_type": "Complexo de Minas Subterrâneas & Ruínas",
      "illustration": "assets/ref_outdoor_waterfall.jpg",
      "historical_importance": "Labirinto subterrâneo onde Lucas Vilar sobreviveu cego por três anos (2021–2024) desenvolvendo ecolocalização para escapar dos Ecos, até ser selado por cargas de dinamite.",
      "related_campaigns": [
        "camp_002"
      ],
      "characters_present": [
        "char_lucas",
        "char_gabriel",
        "char_rafael",
        "char_julia"
      ],
      "historical_events": [
        "time_01",
        "time_04",
        "cron_vil_01"
      ],
      "epochs_active": [
        "Século XIX (Escavação)",
        "2021–2024 (Incidente Vilar)"
      ]
    },
    {
      "id": "loc_mansao_belvedere",
      "name": "Mansão Belvedere & Salão dos Espelhos",
      "type": "Palacete Aristocrático / Zona Sob Cerco",
      "zone": "Europa Central / Distrito Reservado",
      "danger": "MÉDIO-ALTO // LODO ROXO & RELÂMPAGOS VIOLETAS",
      "coordinates": [
        46.2044,
        6.1432
      ],
      "continent_id": "cont_europa",
      "country_id": "country_suica",
      "region_id": "reg_alpes_centrais",
      "city_id": "city_genebra_distrito",
      "campaign_id": "camp_filantropo_oeht",
      "related_campaigns": [
        "camp_filantropo_oeht"
      ],
      "illustration": "assets/ref_interior_tavern.jpg",
      "description": "Palácio nos Alpes suíços onde ocorreu a gala, o poker VIP, o vazamento do lodo roxo e o despertar do Anárquico sob a redoma.",
      "features": [
        "Salão Nobre da Gala com candelabros de cristal e convidados da alta finança.",
        "Escritório de Oeht com cofre reforçado vazando secreção viscosa violeta.",
        "Palanque Central onde o bolo colossal de aniversário foi posicionado.",
        "Porão e dutos de ventilação por onde os agentes infiltraram equipamentos."
      ],
      "canon_status": "in_world_report",
      "sources": [
        "Transcrição da Gala de Infiltração A.E.G.I.S."
      ],
      "country": "Suíça (Genebra)"
    },
    {
      "id": "loc_ilha_sauriana",
      "name": "Ilha dos Répteis Primordiais (Arquipélago dos Ossos)",
      "type": "Ilha Isolada no Triângulo / Território Soberano",
      "zone": "Oceano Atlântico Norte / Interior da Anomalia",
      "danger": "EXTREMO // CANIBALISMO SAURIANO & EMBOSCADAS",
      "coordinates": [
        24.8,
        -72.2
      ],
      "continent_id": "cont_america_norte",
      "country_id": "country_bahamas",
      "region_id": "reg_triangulo_profundo",
      "city_id": "city_nova_caronte",
      "campaign_id": "camp_001",
      "related_campaigns": [
        "camp_001"
      ],
      "illustration": "assets/ref_rainforest_canopy.jpg",
      "description": "Ilha densa dominada por uma sociedade de répteis humanoides e dinossauros hiper-evoluídos. Segundo crônicas antigas, um náufrago humano chegou à ilha há cerca de 400 anos e introduziu a prática ritual de canibalismo. Não se trata de monstros irracionais, mas de uma sociedade guerreira com língua própria, tabus e templos de basalto.",
      "features": [
        "Monólitos de osso e basalto talhados com ferramentas pré-históricas.",
        "Redes de armadilhas camufladas nas copas das árvores.",
        "Altares circulares de oferendas e negociação de fronteiras."
      ],
      "canon_status": "in_world_report",
      "sources": [
        "Diários de Navegadores do Século XVI",
        "Manuscrito da Incursão"
      ]
    },
    {
      "id": "loc_cidadela_nacar",
      "name": "Cidadela de Nácar (Bastião da Alta Classe)",
      "type": "Fortaleza Flutuante de Luxo",
      "zone": "Oceano Atlântico Norte / Triângulo das Bermudas",
      "danger": "MÉDIO-ALTO // ELITE ANÔMALA & LEILÃO DE RECURSOS",
      "coordinates": [
        25.9,
        -70.8
      ],
      "continent_id": "cont_america_norte",
      "country_id": "country_bahamas",
      "region_id": "reg_triangulo_profundo",
      "city_id": "city_nova_caronte",
      "campaign_id": "camp_001",
      "related_campaigns": [
        "camp_001"
      ],
      "illustration": "assets/ref_interior_tavern.jpg",
      "description": "Setor fortificado de embarcações de grande porte soldadas entre si, revestidas por madrepérola e placas poliméricas. Abriga os clãs mais influentes da Classe Alta do Triângulo, que leiloam mantimentos, água potável e os próprios náufragos recém-chegados.",
      "features": [
        "Palco do Leilão Central com grades de quarentena de recém-chegados.",
        "Casarões flutuantes com geradores solares e destiladores de água salgada.",
        "Doca blindada com lanchas de patrulha armadas com arpões elétricos."
      ],
      "canon_status": "in_world_report",
      "sources": [
        "Registros Comerciais de Nova Caronte",
        "Manuscrito da Incursão"
      ]
    },
    {
      "id": "loc_campo_rosas",
      "name": "O Campo de Rosas (Mar das Pétalas Negras)",
      "type": "Fenômeno Marítimo de Distorção / Cemitério Náutico",
      "zone": "Oceano Atlântico Norte / Entrada do Vórtice",
      "danger": "MÉDIO-ALTO // NÉVOA NARCÓTICA & TORPOR MENTAL",
      "coordinates": [
        26.2,
        -73
      ],
      "continent_id": "cont_america_norte",
      "country_id": "country_bahamas",
      "region_id": "reg_triangulo_profundo",
      "city_id": "city_nova_caronte",
      "campaign_id": "camp_001",
      "related_campaigns": [
        "camp_001"
      ],
      "illustration": "assets/ref_rainforest_canopy.jpg",
      "description": "Trecho do mar onde a água se torna densa e azul-marinho escura, salpicada por filamentos cristalinos que flutuam assemelhando-se a botões de rosas. Foi neste local que o guia inicial da primeira expedição perdeu a vida em circunstâncias propositadamente ambíguas.",
      "features": [
        "Água imóvel sem ondulação natural, emanando cheiro adocicado de decomposição fria.",
        "Névoa rasa que absorve frequências de rádio e distorce a bússola náutica.",
        "Restos do bote do guia com marcas de geada azul e unhas cravadas no leme."
      ],
      "canon_status": "confirmed",
      "sources": [
        "Sessão 1 da Incursão",
        "Depoimentos de Marinheiros Náufragos"
      ]
    },
    {
      "id": "loc_aegis_genebra",
      "name": "Complexo Subterrâneo A.E.G.I.S. (Bunker Genebra)",
      "type": "Quartel-General Global de Inteligência",
      "zone": "Distrito Internacional de Genebra, Suíça",
      "danger": "SEGURO // NÍVEL DE CONTENÇÃO MÁXIMO",
      "coordinates": [
        46.2237,
        6.1389
      ],
      "continent_id": "cont_europa",
      "country_id": "country_suica",
      "region_id": "reg_alpes_centrais",
      "city_id": "city_genebra_distrito",
      "campaign_id": "camp_filantropo_oeht",
      "related_campaigns": [
        "camp_filantropo_oeht",
        "camp_003",
        "camp_004"
      ],
      "illustration": "assets/ref_interior_tavern.jpg",
      "description": "Sede central de comando, arquivos históricos de anomalias e gabinetes dos diretores de contenção da Fundação A.E.G.I.S. Construído a 40 metros de profundidade sob rocha granítica dos Alpes.",
      "features": [
        "Sala Tática com painéis holográficos de satélite e sismógrafos anômalos.",
        "Arquivo Físico C.R.I.S. com relatórios em microfilme desde 1968.",
        "Câmaras criogênicas herméticas para espécimes sob quarentena absoluta."
      ],
      "canon_status": "confirmed",
      "sources": [
        "Registro Notarial de Genebra 1968",
        "Arquivos de Comando Kaelen"
      ]
    }
  ],
  "characters": [
    {
      "id": "char_lucas",
      "name": "Lucas Vilar",
      "codename": "O Sobrevivente Cego",
      "player": "NPC / Sobrevivente",
      "origin": "Vítima",
      "class": "Sobrevivente",
      "track": "Ecolocalizador",
      "nex": "45%",
      "mda": "35%",
      "status": "Resgatado (Marcado)",
      "life_status": "alive",
      "campaign_ids": [
        "camp_002"
      ],
      "attributes": {
        "Agilidade": 3,
        "Força": 2,
        "Intelecto": 3,
        "Presença": 2,
        "Vigor": 3
      },
      "stats": {
        "pv_current": 26,
        "pv_max": 26,
        "pe_current": 14,
        "pe_max": 14,
        "san_current": 18,
        "san_max": 30,
        "defesa": 15,
        "protecao": "Roupas Rasgadas das Minas (RD 1)"
      },
      "skills": {
        "Acrobacia": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 3
        },
        "Adestramento": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 2
        },
        "Artes": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 2
        },
        "Atletismo": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "FOR",
          "total": 2
        },
        "Atualidades": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 3
        },
        "Ciências": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 3
        },
        "Crime": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 3
        },
        "Diplomacia": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 2
        },
        "Enganação": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 2
        },
        "Fortitude": {
          "grau": "Treinado",
          "bonus": 5,
          "attr": "VIG",
          "total": 8
        },
        "Furtividade": {
          "grau": "Veterano",
          "bonus": 10,
          "attr": "AGI",
          "total": 13
        },
        "Iniciativa": {
          "grau": "Treinado",
          "bonus": 5,
          "attr": "AGI",
          "total": 8
        },
        "Intimidação": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 2
        },
        "Intuição": {
          "grau": "Treinado",
          "bonus": 5,
          "attr": "PRE",
          "total": 7
        },
        "Investigação": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 3
        },
        "Luta": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "FOR",
          "total": 2
        },
        "Medicina": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 3
        },
        "Ocultismo": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 3
        },
        "Percepção": {
          "grau": "Expert",
          "bonus": 15,
          "attr": "PRE",
          "total": 17
        },
        "Pilotagem": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 3
        },
        "Pontaria": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 3
        },
        "Profissão": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 3
        },
        "Reflexos": {
          "grau": "Treinado",
          "bonus": 5,
          "attr": "AGI",
          "total": 8
        },
        "Religião": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 2
        },
        "Sobrevivência": {
          "grau": "Veterano",
          "bonus": 10,
          "attr": "INT",
          "total": 13
        },
        "Tática": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 3
        },
        "Tecnologia": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 3
        },
        "Vontade": {
          "grau": "Veterano",
          "bonus": 10,
          "attr": "PRE",
          "total": 12
        }
      },
      "abilities": [
        "Ouvido Absoluto das Minas: Consegue identificar posições, passos e ameaças com precisão milimétrica mesmo na escuridão absoluta.",
        "Furtividade em Cavernas: Bônus ao ocultar a respiração e movimentar-se sem eco em ambientes rochosos.",
        "Cicatrizes da Solidão: Resiste a choques psicológicos primários graças aos 3 anos isolado."
      ],
      "inventory": [
        "Lanterna Quebrada com Vidro Fendido",
        "Apito de Alta Frequência Metálico",
        "Fragmento de Quartzo e Minério de Prata",
        "Bandagens Improvisadas"
      ],
      "relics": [],
      "quote": "Eu não preciso de olhos para saber onde eles estão... o som da respiração deles bate na pedra e me diz exatamente onde vão pisar.",
      "summary": "Sobreviveu 3 anos escondido nas minas mexicanas, cego e caçado por Ecos. Desenvolveu hipersensibilidade auditiva extrema e foi resgatado no amanhecer após a destruição da Mansão.",
      "portrait": "assets/icon-192.png",
      "historical_title": "O Sobrevivente das Minas Vilar",
      "historical_status": "vivo",
      "birth_place": "México",
      "biography_summary": "Sobreviveu 3 anos escondido nas minas mexicanas, cego e caçado por Ecos. Desenvolveu hipersensibilidade auditiva extrema e foi resgatado no amanhecer após a destruição da Mansão.",
      "personal_history": "Jovem herdeiro da família Vilar cuja vida mudou drasticamente em 2021, quando um acidente durante uma exploração com amigos o deixou preso nas galerias profundas das Minas Antigas no México. Dado como morto por três anos, Lucas sobreviveu na escuridão absoluta bebendo água de infiltrações e desenvolvendo uma capacidade extraordinária de ecolocalização para evitar os predadores subterrâneos.",
      "campaign_participations": [
        {
          "campaign_id": "camp_002",
          "campaign_title": "Até o Amanhecer: O Limiar da Mansão Vilar",
          "period": "2021–2024",
          "role": "Sobrevivente Central & Figura-Chave do Resgate",
          "summary": "Permaneceu três anos isolado nas minas até ser localizado e resgatado com vida por Rafael Moreira e Júlia Drummond na madrugada da destruição da Mansão Vilar."
        }
      ],
      "relationships": [
        {
          "character_id": "char_gabriel",
          "character_name": "Gabriel Vilar (Davi Reis)",
          "relation_type": "Irmão",
          "description": "Irmão de Lucas; a dor pelo desaparecimento de Lucas levou Gabriel a criar o LIMIAR e assumir a identidade do Mascarado."
        },
        {
          "character_id": "char_rafael",
          "character_name": "Rafael Moreira",
          "relation_type": "Amigo & Resgatador",
          "description": "Amigo de infância que desceu às minas em 2024 para resgatá-lo."
        },
        {
          "character_id": "char_julia",
          "character_name": "Júlia Drummond",
          "relation_type": "Amiga & Investigadora",
          "description": "Desvendou as pistas deixadas na mansão que provavam que Lucas ainda estava vivo no subsolo."
        }
      ],
      "important_events": [
        "time_01",
        "cron_vil_01",
        "time_04"
      ],
      "visited_locations": [
        "loc_vilar",
        "loc_vilar_minas"
      ],
      "known_fate": "Resgatado com vida em 2024; vive sob proteção médica e acompanhamento psicológico, mantendo sua audição hiper-aguçada e cegueira permanente causada pelos anos na escuridão.",
      "archival_technical_record": {
        "origin": "Vítima",
        "class": "Sobrevivente",
        "track": "Ecolocalizador",
        "nex": "45%",
        "mda": "35%",
        "attributes": {
          "Agilidade": 3,
          "Força": 2,
          "Intelecto": 3,
          "Presença": 2,
          "Vigor": 3
        },
        "stats": {
          "pv_current": 26,
          "pv_max": 26,
          "pe_current": 14,
          "pe_max": 14,
          "san_current": 18,
          "san_max": 30,
          "defesa": 15,
          "protecao": "Roupas Rasgadas das Minas (RD 1)"
        },
        "skills": {
          "Acrobacia": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 3
          },
          "Adestramento": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 2
          },
          "Artes": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 2
          },
          "Atletismo": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "FOR",
            "total": 2
          },
          "Atualidades": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 3
          },
          "Ciências": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 3
          },
          "Crime": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 3
          },
          "Diplomacia": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 2
          },
          "Enganação": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 2
          },
          "Fortitude": {
            "grau": "Treinado",
            "bonus": 5,
            "attr": "VIG",
            "total": 8
          },
          "Furtividade": {
            "grau": "Veterano",
            "bonus": 10,
            "attr": "AGI",
            "total": 13
          },
          "Iniciativa": {
            "grau": "Treinado",
            "bonus": 5,
            "attr": "AGI",
            "total": 8
          },
          "Intimidação": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 2
          },
          "Intuição": {
            "grau": "Treinado",
            "bonus": 5,
            "attr": "PRE",
            "total": 7
          },
          "Investigação": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 3
          },
          "Luta": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "FOR",
            "total": 2
          },
          "Medicina": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 3
          },
          "Ocultismo": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 3
          },
          "Percepção": {
            "grau": "Expert",
            "bonus": 15,
            "attr": "PRE",
            "total": 17
          },
          "Pilotagem": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 3
          },
          "Pontaria": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 3
          },
          "Profissão": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 3
          },
          "Reflexos": {
            "grau": "Treinado",
            "bonus": 5,
            "attr": "AGI",
            "total": 8
          },
          "Religião": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 2
          },
          "Sobrevivência": {
            "grau": "Veterano",
            "bonus": 10,
            "attr": "INT",
            "total": 13
          },
          "Tática": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 3
          },
          "Tecnologia": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 3
          },
          "Vontade": {
            "grau": "Veterano",
            "bonus": 10,
            "attr": "PRE",
            "total": 12
          }
        },
        "abilities": [
          "Ouvido Absoluto das Minas: Consegue identificar posições, passos e ameaças com precisão milimétrica mesmo na escuridão absoluta.",
          "Furtividade em Cavernas: Bônus ao ocultar a respiração e movimentar-se sem eco em ambientes rochosos.",
          "Cicatrizes da Solidão: Resiste a choques psicológicos primários graças aos 3 anos isolado."
        ],
        "inventory": [
          "Lanterna Quebrada com Vidro Fendido",
          "Apito de Alta Frequência Metálico",
          "Fragmento de Quartzo e Minério de Prata",
          "Bandagens Improvisadas"
        ],
        "relics": []
      }
    },
    {
      "id": "char_gabriel",
      "name": "Gabriel Vilar (Davi Reis)",
      "codename": "O Mascarado do LIMIAR",
      "player": "Vilão Trágico / NPC",
      "origin": "Engenheiro Ocultista",
      "class": "Especialista",
      "track": "Técnico em Dobras Dimensionais",
      "nex": "55%",
      "mda": "15%",
      "status": "Vivo (Desaparecido no LIMIAR)",
      "life_status": "missing",
      "campaign_ids": [
        "camp_002"
      ],
      "attributes": {
        "Agilidade": 3,
        "Força": 1,
        "Intelecto": 5,
        "Presença": 2,
        "Vigor": 2
      },
      "stats": {
        "pv_current": 28,
        "pv_max": 28,
        "pe_current": 25,
        "pe_max": 25,
        "san_current": 22,
        "san_max": 45,
        "defesa": 16,
        "protecao": "Traje Balístico Reforçado (RD 3)"
      },
      "skills": {
        "Acrobacia": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 3
        },
        "Adestramento": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 2
        },
        "Artes": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 2
        },
        "Atletismo": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "FOR",
          "total": 1
        },
        "Atualidades": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 5
        },
        "Ciências": {
          "grau": "Veterano",
          "bonus": 10,
          "attr": "INT",
          "total": 15
        },
        "Crime": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 3
        },
        "Diplomacia": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 2
        },
        "Enganação": {
          "grau": "Treinado",
          "bonus": 5,
          "attr": "PRE",
          "total": 7
        },
        "Fortitude": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "VIG",
          "total": 2
        },
        "Furtividade": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 3
        },
        "Iniciativa": {
          "grau": "Treinado",
          "bonus": 5,
          "attr": "AGI",
          "total": 8
        },
        "Intimidação": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 2
        },
        "Intuição": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 2
        },
        "Investigação": {
          "grau": "Expert",
          "bonus": 15,
          "attr": "INT",
          "total": 20
        },
        "Luta": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "FOR",
          "total": 1
        },
        "Medicina": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 5
        },
        "Ocultismo": {
          "grau": "Veterano",
          "bonus": 10,
          "attr": "INT",
          "total": 15
        },
        "Percepção": {
          "grau": "Veterano",
          "bonus": 10,
          "attr": "PRE",
          "total": 12
        },
        "Pilotagem": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 3
        },
        "Pontaria": {
          "grau": "Treinado",
          "bonus": 5,
          "attr": "AGI",
          "total": 8
        },
        "Profissão": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 5
        },
        "Reflexos": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 3
        },
        "Religião": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 2
        },
        "Sobrevivência": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 5
        },
        "Tática": {
          "grau": "Treinado",
          "bonus": 5,
          "attr": "INT",
          "total": 10
        },
        "Tecnologia": {
          "grau": "Expert",
          "bonus": 15,
          "attr": "INT",
          "total": 20
        },
        "Vontade": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 2
        }
      },
      "abilities": [
        "Dobra Espacial com LIMIAR: Abre micro-fendas para teletransporte tático instantâneo e reposicionamento.",
        "Arquiteto de Armadilhas: Constrói aparatos eletromecânicos de contenção psicológica.",
        "Mestre do Blefe: Mantém identidade sob pseudônimos com controle absoluto de telemetria."
      ],
      "inventory": [
        "Arma de Portais: LIMIAR",
        "Máscara de Porcelana Pintada",
        "Gravador de Fita Cassete com Confissões",
        "Painel Portátil de Controle Remoto"
      ],
      "relics": [
        "Arma de Portais: LIMIAR"
      ],
      "quote": "Eu nunca quis assassinar ninguém. Eu só precisei que eles sentissem o mesmo pavor que meu irmão sentiu antes de contarem a verdade.",
      "summary": "Irmão mais velho de Lucas. Passou 3 anos desenvolvendo a arma de portais LIMIAR para encenar um teatro macabro na mansão. Desapareceu em uma fenda no clímax.",
      "portrait": "assets/icon-192.png",
      "historical_title": "Engenheiro do Projeto LIMIAR ('O Mascarado')",
      "historical_status": "desaparecido",
      "birth_place": "México",
      "biography_summary": "Irmão mais velho de Lucas. Passou 3 anos desenvolvendo a arma de portais LIMIAR para encenar um teatro macabro na mansão. Desapareceu em uma fenda no clímax.",
      "personal_history": "Brilhante engenheiro e pesquisador da família Vilar. Devastado pelo desaparecimento de seu irmão Lucas nas minas em 2021 e revoltado com o silêncio dos amigos presentes no acidente, Gabriel adotou o pseudônimo 'Davi Reis' e dedicou anos no laboratório clandestino do Casarão para construir a tecnologia de dobra espacial LIMIAR.",
      "campaign_participations": [
        {
          "campaign_id": "camp_002",
          "campaign_title": "Até o Amanhecer: O Limiar da Mansão Vilar",
          "period": "2022–2024",
          "role": "Antagonista Trágico & Criador do LIMIAR",
          "summary": "Orquestrou a Noite da Confissão na Mansão Vilar como 'O Mascarado' para forçar a verdade à tona, desaparecendo em uma dobra espacial ao final do confronto."
        },
        {
          "campaign_id": "camp_001",
          "campaign_title": "A Incursão: O Purgatório Genético",
          "period": "2025–2026",
          "role": "Conexão Indireta / Tecnologia Precursora",
          "summary": "Os relatórios da A.E.G.I.S. apontam que os pulsos de fenda registrados pelo protótipo LIMIAR de Gabriel no México antecederam a instabilidade monitorada no Atlântico Norte."
        }
      ],
      "relationships": [
        {
          "character_id": "char_lucas",
          "character_name": "Lucas Vilar",
          "relation_type": "Irmão",
          "description": "Motivação central de toda a trajetória de Gabriel."
        },
        {
          "character_id": "char_rafael",
          "character_name": "Rafael Moreira",
          "relation_type": "Ex-Amigo & Alvo do Julgamento",
          "description": "Confrontou Gabriel diretamente durante a noite na Mansão Vilar."
        },
        {
          "character_id": "char_julia",
          "character_name": "Júlia Drummond",
          "relation_type": "Investigadora Oponente",
          "description": "Júlia descobriu a verdadeira identidade de Gabriel por trás de Davi Reis e do Mascarado."
        }
      ],
      "important_events": [
        "time_01",
        "time_02",
        "cron_vil_01",
        "time_04"
      ],
      "visited_locations": [
        "loc_vilar",
        "loc_vilar_casarao",
        "loc_vilar_minas"
      ],
      "known_fate": "Desaparecido desde a madrugada de 2024 após acionar uma descarga de emergência da arma de portais LIMIAR antes da explosão da mansão. Seu paradeiro atual no planeta é desconhecido.",
      "archival_technical_record": {
        "origin": "Engenheiro Ocultista",
        "class": "Especialista",
        "track": "Técnico em Dobras Dimensionais",
        "nex": "55%",
        "mda": "15%",
        "attributes": {
          "Agilidade": 3,
          "Força": 1,
          "Intelecto": 5,
          "Presença": 2,
          "Vigor": 2
        },
        "stats": {
          "pv_current": 28,
          "pv_max": 28,
          "pe_current": 25,
          "pe_max": 25,
          "san_current": 22,
          "san_max": 45,
          "defesa": 16,
          "protecao": "Traje Balístico Reforçado (RD 3)"
        },
        "skills": {
          "Acrobacia": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 3
          },
          "Adestramento": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 2
          },
          "Artes": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 2
          },
          "Atletismo": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "FOR",
            "total": 1
          },
          "Atualidades": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 5
          },
          "Ciências": {
            "grau": "Veterano",
            "bonus": 10,
            "attr": "INT",
            "total": 15
          },
          "Crime": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 3
          },
          "Diplomacia": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 2
          },
          "Enganação": {
            "grau": "Treinado",
            "bonus": 5,
            "attr": "PRE",
            "total": 7
          },
          "Fortitude": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "VIG",
            "total": 2
          },
          "Furtividade": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 3
          },
          "Iniciativa": {
            "grau": "Treinado",
            "bonus": 5,
            "attr": "AGI",
            "total": 8
          },
          "Intimidação": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 2
          },
          "Intuição": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 2
          },
          "Investigação": {
            "grau": "Expert",
            "bonus": 15,
            "attr": "INT",
            "total": 20
          },
          "Luta": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "FOR",
            "total": 1
          },
          "Medicina": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 5
          },
          "Ocultismo": {
            "grau": "Veterano",
            "bonus": 10,
            "attr": "INT",
            "total": 15
          },
          "Percepção": {
            "grau": "Veterano",
            "bonus": 10,
            "attr": "PRE",
            "total": 12
          },
          "Pilotagem": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 3
          },
          "Pontaria": {
            "grau": "Treinado",
            "bonus": 5,
            "attr": "AGI",
            "total": 8
          },
          "Profissão": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 5
          },
          "Reflexos": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 3
          },
          "Religião": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 2
          },
          "Sobrevivência": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 5
          },
          "Tática": {
            "grau": "Treinado",
            "bonus": 5,
            "attr": "INT",
            "total": 10
          },
          "Tecnologia": {
            "grau": "Expert",
            "bonus": 15,
            "attr": "INT",
            "total": 20
          },
          "Vontade": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 2
          }
        },
        "abilities": [
          "Dobra Espacial com LIMIAR: Abre micro-fendas para teletransporte tático instantâneo e reposicionamento.",
          "Arquiteto de Armadilhas: Constrói aparatos eletromecânicos de contenção psicológica.",
          "Mestre do Blefe: Mantém identidade sob pseudônimos com controle absoluto de telemetria."
        ],
        "inventory": [
          "Arma de Portais: LIMIAR",
          "Máscara de Porcelana Pintada",
          "Gravador de Fita Cassete com Confissões",
          "Painel Portátil de Controle Remoto"
        ],
        "relics": [
          "Arma de Portais: LIMIAR"
        ]
      }
    },
    {
      "id": "char_rafael",
      "name": "Rafael Moreira",
      "codename": "O Combatente Líder",
      "player": "Jogador 1",
      "origin": "Atleta",
      "class": "Combatente",
      "track": "Guerreiro",
      "nex": "30%",
      "mda": "5%",
      "status": "Veterano (Vivo)",
      "life_status": "alive",
      "campaign_ids": [
        "camp_002"
      ],
      "attributes": {
        "Agilidade": 3,
        "Força": 4,
        "Intelecto": 1,
        "Presença": 2,
        "Vigor": 3
      },
      "stats": {
        "pv_current": 38,
        "pv_max": 38,
        "pe_current": 12,
        "pe_max": 12,
        "san_current": 20,
        "san_max": 28,
        "defesa": 17,
        "protecao": "Colete Tático Reforçado (RD 2)"
      },
      "skills": {
        "Acrobacia": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 3
        },
        "Adestramento": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 2
        },
        "Artes": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 2
        },
        "Atletismo": {
          "grau": "Veterano",
          "bonus": 10,
          "attr": "FOR",
          "total": 14
        },
        "Atualidades": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 1
        },
        "Ciências": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 1
        },
        "Crime": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 3
        },
        "Diplomacia": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 2
        },
        "Enganação": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 2
        },
        "Fortitude": {
          "grau": "Veterano",
          "bonus": 10,
          "attr": "VIG",
          "total": 13
        },
        "Furtividade": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 3
        },
        "Iniciativa": {
          "grau": "Treinado",
          "bonus": 5,
          "attr": "AGI",
          "total": 8
        },
        "Intimidação": {
          "grau": "Treinado",
          "bonus": 5,
          "attr": "PRE",
          "total": 7
        },
        "Intuição": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 2
        },
        "Investigação": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 1
        },
        "Luta": {
          "grau": "Veterano",
          "bonus": 10,
          "attr": "FOR",
          "total": 14
        },
        "Medicina": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 1
        },
        "Ocultismo": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 1
        },
        "Percepção": {
          "grau": "Treinado",
          "bonus": 5,
          "attr": "PRE",
          "total": 7
        },
        "Pilotagem": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 3
        },
        "Pontaria": {
          "grau": "Treinado",
          "bonus": 5,
          "attr": "AGI",
          "total": 8
        },
        "Profissão": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 1
        },
        "Reflexos": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 3
        },
        "Religião": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 2
        },
        "Sobrevivência": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 1
        },
        "Tática": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 1
        },
        "Tecnologia": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 1
        },
        "Vontade": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 2
        }
      },
      "abilities": [
        "Ataque Especial: Concede bônus concentrado em dano físico corpo a corpo.",
        "Golpe Pesado: Aumenta o impacto de armas cortantes e de impacto.",
        "Revidar: Quando atacado corpo a corpo, executa contra-ataque defensivo imediato."
      ],
      "inventory": [
        "Espingarda Calibre 12 com Coronha de Madeira",
        "Faca de Caça Tática de Aço Forjado",
        "Isqueiro de Metal Gravado",
        "Mochila Resistente com Rações"
      ],
      "relics": [],
      "quote": "Era pra ser uma brincadeira idiota de faculdade... eu nunca imaginei que aquela noite ia custar três anos de pesadelo e a visão dele.",
      "summary": "Líder impulsivo do grupo de amigos. Escondeu o remorso por trás de bravura física, liderando a descida às minas para resgatar Lucas e confrontar o Mascarado.",
      "portrait": "assets/icon-192.png",
      "historical_title": "Vanguarda do Resgate na Serra Mexicana",
      "historical_status": "vivo",
      "birth_place": "México / Brasil",
      "biography_summary": "Líder impulsivo do grupo de amigos. Escondeu o remorso por trás de bravura física, liderando a descida às minas para resgatar Lucas e confrontar o Mascarado.",
      "personal_history": "Atleta de alto rendimento que fazia parte do círculo íntimo dos irmãos Vilar. Carregou por três anos o trauma do acidente nas minas até retornar à Mansão Vilar em 2024, onde assumiu a linha de frente física para proteger o grupo contra as armadilhas do Mascarado e contra os Ecos Subterrâneos.",
      "campaign_participations": [
        {
          "campaign_id": "camp_002",
          "campaign_title": "Até o Amanhecer: O Limiar da Mansão Vilar",
          "period": "2024",
          "role": "Protagonista & Combatente de Resgate",
          "summary": "Liderou a descida física às minas, conteve o avanço dos Ecos nos túneis e carregou Lucas Vilar até a superfície antes da detonação."
        }
      ],
      "relationships": [
        {
          "character_id": "char_lucas",
          "character_name": "Lucas Vilar",
          "relation_type": "Amigo Resgatado",
          "description": "Redimiu-se do passado ao arriscar a própria vida para tirar Lucas das minas."
        },
        {
          "character_id": "char_julia",
          "character_name": "Júlia Drummond",
          "relation_type": "Parceira de Sobrevivência",
          "description": "Atuaram juntos durante toda a madrugada na Mansão Vilar."
        },
        {
          "character_id": "char_gabriel",
          "character_name": "Gabriel Vilar",
          "relation_type": "Antigo Amigo / Antagonista",
          "description": "Enfrentou os jogos psicológicos de Gabriel até o desmascaramento final."
        }
      ],
      "important_events": [
        "cron_vil_01",
        "time_04"
      ],
      "visited_locations": [
        "loc_vilar",
        "loc_vilar_casarao",
        "loc_vilar_minas"
      ],
      "known_fate": "Sobreviveu ao incidente da Mansão Vilar em 2024 e colaborou com os depoimentos arquivados sobre o projeto LIMIAR.",
      "archival_technical_record": {
        "origin": "Atleta",
        "class": "Combatente",
        "track": "Guerreiro",
        "nex": "30%",
        "mda": "5%",
        "attributes": {
          "Agilidade": 3,
          "Força": 4,
          "Intelecto": 1,
          "Presença": 2,
          "Vigor": 3
        },
        "stats": {
          "pv_current": 38,
          "pv_max": 38,
          "pe_current": 12,
          "pe_max": 12,
          "san_current": 20,
          "san_max": 28,
          "defesa": 17,
          "protecao": "Colete Tático Reforçado (RD 2)"
        },
        "skills": {
          "Acrobacia": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 3
          },
          "Adestramento": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 2
          },
          "Artes": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 2
          },
          "Atletismo": {
            "grau": "Veterano",
            "bonus": 10,
            "attr": "FOR",
            "total": 14
          },
          "Atualidades": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 1
          },
          "Ciências": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 1
          },
          "Crime": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 3
          },
          "Diplomacia": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 2
          },
          "Enganação": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 2
          },
          "Fortitude": {
            "grau": "Veterano",
            "bonus": 10,
            "attr": "VIG",
            "total": 13
          },
          "Furtividade": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 3
          },
          "Iniciativa": {
            "grau": "Treinado",
            "bonus": 5,
            "attr": "AGI",
            "total": 8
          },
          "Intimidação": {
            "grau": "Treinado",
            "bonus": 5,
            "attr": "PRE",
            "total": 7
          },
          "Intuição": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 2
          },
          "Investigação": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 1
          },
          "Luta": {
            "grau": "Veterano",
            "bonus": 10,
            "attr": "FOR",
            "total": 14
          },
          "Medicina": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 1
          },
          "Ocultismo": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 1
          },
          "Percepção": {
            "grau": "Treinado",
            "bonus": 5,
            "attr": "PRE",
            "total": 7
          },
          "Pilotagem": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 3
          },
          "Pontaria": {
            "grau": "Treinado",
            "bonus": 5,
            "attr": "AGI",
            "total": 8
          },
          "Profissão": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 1
          },
          "Reflexos": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 3
          },
          "Religião": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 2
          },
          "Sobrevivência": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 1
          },
          "Tática": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 1
          },
          "Tecnologia": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 1
          },
          "Vontade": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 2
          }
        },
        "abilities": [
          "Ataque Especial: Concede bônus concentrado em dano físico corpo a corpo.",
          "Golpe Pesado: Aumenta o impacto de armas cortantes e de impacto.",
          "Revidar: Quando atacado corpo a corpo, executa contra-ataque defensivo imediato."
        ],
        "inventory": [
          "Espingarda Calibre 12 com Coronha de Madeira",
          "Faca de Caça Tática de Aço Forjado",
          "Isqueiro de Metal Gravado",
          "Mochila Resistente com Rações"
        ],
        "relics": []
      }
    },
    {
      "id": "char_julia",
      "name": "Júlia Drummond",
      "codename": "A Chave da Mansão",
      "player": "Jogador 6",
      "origin": "Investigadora",
      "class": "Especialista",
      "track": "Infiltradora",
      "nex": "35%",
      "mda": "8%",
      "status": "Veterana (Viva)",
      "life_status": "alive",
      "campaign_ids": [
        "camp_002"
      ],
      "attributes": {
        "Agilidade": 4,
        "Força": 1,
        "Intelecto": 3,
        "Presença": 3,
        "Vigor": 2
      },
      "stats": {
        "pv_current": 26,
        "pv_max": 26,
        "pe_current": 20,
        "pe_max": 20,
        "san_current": 30,
        "san_max": 38,
        "defesa": 18,
        "protecao": "Jaqueta de Couro Reforçada (RD 1)"
      },
      "skills": {
        "Acrobacia": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 4
        },
        "Adestramento": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 3
        },
        "Artes": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 3
        },
        "Atletismo": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "FOR",
          "total": 1
        },
        "Atualidades": {
          "grau": "Treinado",
          "bonus": 5,
          "attr": "INT",
          "total": 8
        },
        "Ciências": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 3
        },
        "Crime": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 4
        },
        "Diplomacia": {
          "grau": "Treinado",
          "bonus": 5,
          "attr": "PRE",
          "total": 8
        },
        "Enganação": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 3
        },
        "Fortitude": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "VIG",
          "total": 2
        },
        "Furtividade": {
          "grau": "Veterano",
          "bonus": 10,
          "attr": "AGI",
          "total": 14
        },
        "Iniciativa": {
          "grau": "Treinado",
          "bonus": 5,
          "attr": "AGI",
          "total": 9
        },
        "Intimidação": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 3
        },
        "Intuição": {
          "grau": "Veterano",
          "bonus": 10,
          "attr": "PRE",
          "total": 13
        },
        "Investigação": {
          "grau": "Expert",
          "bonus": 15,
          "attr": "INT",
          "total": 18
        },
        "Luta": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "FOR",
          "total": 1
        },
        "Medicina": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 3
        },
        "Ocultismo": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 3
        },
        "Percepção": {
          "grau": "Veterano",
          "bonus": 10,
          "attr": "PRE",
          "total": 13
        },
        "Pilotagem": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 4
        },
        "Pontaria": {
          "grau": "Treinado",
          "bonus": 5,
          "attr": "AGI",
          "total": 9
        },
        "Profissão": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 3
        },
        "Reflexos": {
          "grau": "Treinado",
          "bonus": 5,
          "attr": "AGI",
          "total": 9
        },
        "Religião": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 3
        },
        "Sobrevivência": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 3
        },
        "Tática": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 3
        },
        "Tecnologia": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 3
        },
        "Vontade": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 3
        }
      },
      "abilities": [
        "Perito em Pistas: Encontra conexões e pistas que outros investigadores deixam passar.",
        "Gatuno Silencioso: Movimentação sem emissão de ruído auditivo.",
        "Ataque Furtivo: Dano crítico quando a criatura ou alvo não percebe sua presença."
      ],
      "inventory": [
        "Pistola 9mm com Silenciador",
        "Kit de Gazua e Chaves Mestras",
        "Caderno com Notas e Diagramas da Mansão",
        "Gravador de Voz Digital"
      ],
      "relics": [],
      "quote": "Gabriel calculou a reação de todos os que estavam no lago há 3 anos... mas ele não me conhecia. E essa foi a única falha no plano perfeito dele.",
      "summary": "A mente analítica da Mansão Vilar. Por não fazer parte do núcleo original do incidente das minas, foi a única imune aos jogos mentais de Gabriel, desvendando os mecanismos da casa.",
      "portrait": "assets/icon-192.png",
      "historical_title": "Investigadora da Noite da Confissão",
      "historical_status": "vivo",
      "birth_place": "México / Brasil",
      "biography_summary": "A mente analítica da Mansão Vilar. Por não fazer parte do núcleo original do incidente das minas, foi a única imune aos jogos mentais de Gabriel, desvendando os mecanismos da casa.",
      "personal_history": "Investigadora meticulosa e analítica. Após o incidente de 2021 nas minas, dedicou-se a compreender o que havia acontecido na propriedade Vilar. Em 2024, sua capacidade dedutiva foi decisiva para decifrar os diários de Gabriel, localizar o laboratório do Casarão e planejar a detonação das galerias.",
      "campaign_participations": [
        {
          "campaign_id": "camp_002",
          "campaign_title": "Até o Amanhecer: O Limiar da Mansão Vilar",
          "period": "2024",
          "role": "Protagonista & Estrategista da Fuga",
          "summary": "Reuniu as provas sobre a identidade do Mascarado, recuperou as fitas do Projeto LIMIAR e coordenou o uso de explosivos para selar as minas."
        }
      ],
      "relationships": [
        {
          "character_id": "char_rafael",
          "character_name": "Rafael Moreira",
          "relation_type": "Aliado na Mansão Vilar",
          "description": "Combinou investigação e força tática com Rafael para garantir a sobrevivência do grupo."
        },
        {
          "character_id": "char_lucas",
          "character_name": "Lucas Vilar",
          "relation_type": "Amigo Resgatado",
          "description": "Seguiu os sinais acústicos que levaram ao paradeiro de Lucas."
        },
        {
          "character_id": "char_gabriel",
          "character_name": "Gabriel Vilar",
          "relation_type": "Alvo de Investigação",
          "description": "Desmascarou a farsa de Davi Reis através dos documentos do laboratório."
        }
      ],
      "important_events": [
        "cron_vil_01",
        "time_04"
      ],
      "visited_locations": [
        "loc_vilar",
        "loc_vilar_casarao",
        "loc_vilar_minas"
      ],
      "known_fate": "Viva; preservou cópias das gravações e documentos da Mansão Vilar que hoje integram o acervo do Museu EVREN.",
      "archival_technical_record": {
        "origin": "Investigadora",
        "class": "Especialista",
        "track": "Infiltradora",
        "nex": "35%",
        "mda": "8%",
        "attributes": {
          "Agilidade": 4,
          "Força": 1,
          "Intelecto": 3,
          "Presença": 3,
          "Vigor": 2
        },
        "stats": {
          "pv_current": 26,
          "pv_max": 26,
          "pe_current": 20,
          "pe_max": 20,
          "san_current": 30,
          "san_max": 38,
          "defesa": 18,
          "protecao": "Jaqueta de Couro Reforçada (RD 1)"
        },
        "skills": {
          "Acrobacia": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 4
          },
          "Adestramento": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 3
          },
          "Artes": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 3
          },
          "Atletismo": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "FOR",
            "total": 1
          },
          "Atualidades": {
            "grau": "Treinado",
            "bonus": 5,
            "attr": "INT",
            "total": 8
          },
          "Ciências": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 3
          },
          "Crime": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 4
          },
          "Diplomacia": {
            "grau": "Treinado",
            "bonus": 5,
            "attr": "PRE",
            "total": 8
          },
          "Enganação": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 3
          },
          "Fortitude": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "VIG",
            "total": 2
          },
          "Furtividade": {
            "grau": "Veterano",
            "bonus": 10,
            "attr": "AGI",
            "total": 14
          },
          "Iniciativa": {
            "grau": "Treinado",
            "bonus": 5,
            "attr": "AGI",
            "total": 9
          },
          "Intimidação": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 3
          },
          "Intuição": {
            "grau": "Veterano",
            "bonus": 10,
            "attr": "PRE",
            "total": 13
          },
          "Investigação": {
            "grau": "Expert",
            "bonus": 15,
            "attr": "INT",
            "total": 18
          },
          "Luta": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "FOR",
            "total": 1
          },
          "Medicina": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 3
          },
          "Ocultismo": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 3
          },
          "Percepção": {
            "grau": "Veterano",
            "bonus": 10,
            "attr": "PRE",
            "total": 13
          },
          "Pilotagem": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 4
          },
          "Pontaria": {
            "grau": "Treinado",
            "bonus": 5,
            "attr": "AGI",
            "total": 9
          },
          "Profissão": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 3
          },
          "Reflexos": {
            "grau": "Treinado",
            "bonus": 5,
            "attr": "AGI",
            "total": 9
          },
          "Religião": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 3
          },
          "Sobrevivência": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 3
          },
          "Tática": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 3
          },
          "Tecnologia": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 3
          },
          "Vontade": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 3
          }
        },
        "abilities": [
          "Perito em Pistas: Encontra conexões e pistas que outros investigadores deixam passar.",
          "Gatuno Silencioso: Movimentação sem emissão de ruído auditivo.",
          "Ataque Furtivo: Dano crítico quando a criatura ou alvo não percebe sua presença."
        ],
        "inventory": [
          "Pistola 9mm com Silenciador",
          "Kit de Gazua e Chaves Mestras",
          "Caderno com Notas e Diagramas da Mansão",
          "Gravador de Voz Digital"
        ],
        "relics": []
      }
    },
    {
      "id": "char_arquiteto",
      "name": "O Arquiteto do Caos (Diabo do Mar)",
      "codename": "O Primogênito",
      "player": "Entidade / Ameaça Suprema",
      "origin": "Cobaia Zero (Experimento Proibido)",
      "class": "Ocultista Supremo",
      "track": "Hack da Realidade",
      "nex": "99%",
      "mda": "99% Dominador",
      "status": "Ativo no Triângulo",
      "life_status": "active",
      "campaign_ids": [
        "camp_001"
      ],
      "attributes": {
        "Agilidade": 1,
        "Força": 1,
        "Intelecto": 5,
        "Presença": 5,
        "Vigor": 1
      },
      "stats": {
        "pv_current": 120,
        "pv_max": 120,
        "pe_current": 99,
        "pe_max": 99,
        "san_current": 0,
        "san_max": 0,
        "defesa": 22,
        "protecao": "Campo de Força Entrópico (RD 15)"
      },
      "skills": {
        "Acrobacia": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 1
        },
        "Adestramento": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 5
        },
        "Artes": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 5
        },
        "Atletismo": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "FOR",
          "total": 1
        },
        "Atualidades": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 5
        },
        "Ciências": {
          "grau": "Veterano",
          "bonus": 15,
          "attr": "INT",
          "total": 20
        },
        "Crime": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 1
        },
        "Diplomacia": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 5
        },
        "Enganação": {
          "grau": "Veterano",
          "bonus": 15,
          "attr": "PRE",
          "total": 20
        },
        "Fortitude": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "VIG",
          "total": 1
        },
        "Furtividade": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 1
        },
        "Iniciativa": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 1
        },
        "Intimidação": {
          "grau": "Expert",
          "bonus": 20,
          "attr": "PRE",
          "total": 25
        },
        "Intuição": {
          "grau": "Veterano",
          "bonus": 10,
          "attr": "PRE",
          "total": 15
        },
        "Investigação": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 5
        },
        "Luta": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "FOR",
          "total": 1
        },
        "Medicina": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 5
        },
        "Ocultismo": {
          "grau": "Expert",
          "bonus": 20,
          "attr": "INT",
          "total": 25
        },
        "Percepção": {
          "grau": "Veterano",
          "bonus": 10,
          "attr": "PRE",
          "total": 15
        },
        "Pilotagem": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 1
        },
        "Pontaria": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 1
        },
        "Profissão": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 5
        },
        "Reflexos": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 1
        },
        "Religião": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 5
        },
        "Sobrevivência": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 5
        },
        "Tática": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 5
        },
        "Tecnologia": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 5
        },
        "Vontade": {
          "grau": "Expert",
          "bonus": 20,
          "attr": "PRE",
          "total": 25
        }
      },
      "abilities": [
        "Campo Ilusório de Rosas: Projeta uma ilusão hipnótica que mascara ferimentos mortais e corrompe a visão dos investigadores.",
        "Aura Criogênica do Caos: Reduz a temperatura ao redor em 40 graus com presença biológica pura.",
        "Reescrita Celular: Mutação forçada de tecidos vivos tocados pela substância azulada."
      ],
      "inventory": [
        "Núcleo Biológico Primordial",
        "Espécimes de Tecido Mimetizado"
      ],
      "relics": [],
      "quote": "A carne humana é uma prisão de carbono. No Triângulo, nós ensinamos as células a se libertarem da anatomia.",
      "summary": "O primeiro humano a hackear as leis da biologia molecular através da anomalia do Atlântico. Seu corpo físico atrofia enquanto sua mente reina soberana sobre Nova Caronte.",
      "portrait": "assets/icon-192.png",
      "historical_title": "Cobaia Zero // O Arquiteto do Caos (Diabo do Mar)",
      "historical_status": "vivo",
      "birth_place": "Atlântico Norte (Origem exata classificada)",
      "biography_summary": "O primeiro humano a hackear as leis da biologia molecular através da anomalia do Atlântico. Seu corpo físico atrofia enquanto sua mente reina soberana sobre Nova Caronte.",
      "personal_history": "Originalmente registrado nos arquivos confidenciais como 'Cobaia Zero' de um experimento proibido de hiper-evolução genética. Após o colapso do complexo marítimo no Triângulo das Bermudas, emergiu como 'O Arquiteto do Caos' (temido pelos navegadores como Diabo do Mar), capaz de remodelar organismos vivos em Nova Caronte.",
      "campaign_participations": [
        {
          "campaign_id": "camp_001",
          "campaign_title": "A Incursão: O Purgatório Genético",
          "period": "2025–2026 (Presente)",
          "role": "Figura Central & Força Dominante de Nova Caronte",
          "summary": "Governa o ecossistema mutagênico de Nova Caronte e submete os sobreviventes do navio de 5.000 almas a pressões seletivas extremas."
        }
      ],
      "relationships": [
        {
          "character_id": "char_evelyn",
          "character_name": "Dra. Evelyn Shaw",
          "relation_type": "Pesquisadora de Fenômeno Correlato",
          "description": "As pesquisas de Evelyn na Groenlândia buscam decifrar a origem genética primária da Cobaia Zero."
        }
      ],
      "important_events": [
        "time_03",
        "cron_inc_01",
        "time_05"
      ],
      "visited_locations": [
        "loc_caronte",
        "loc_kraken"
      ],
      "known_fate": "Ativo em Nova Caronte (Triângulo das Bermudas), classificado pela Fundação A.E.G.I.S. como ameaça biológica de nível máximo.",
      "archival_technical_record": {
        "origin": "Cobaia Zero (Experimento Proibido)",
        "class": "Ocultista Supremo",
        "track": "Hack da Realidade",
        "nex": "99%",
        "mda": "99% Dominador",
        "attributes": {
          "Agilidade": 1,
          "Força": 1,
          "Intelecto": 5,
          "Presença": 5,
          "Vigor": 1
        },
        "stats": {
          "pv_current": 120,
          "pv_max": 120,
          "pe_current": 99,
          "pe_max": 99,
          "san_current": 0,
          "san_max": 0,
          "defesa": 22,
          "protecao": "Campo de Força Entrópico (RD 15)"
        },
        "skills": {
          "Acrobacia": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 1
          },
          "Adestramento": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 5
          },
          "Artes": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 5
          },
          "Atletismo": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "FOR",
            "total": 1
          },
          "Atualidades": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 5
          },
          "Ciências": {
            "grau": "Veterano",
            "bonus": 15,
            "attr": "INT",
            "total": 20
          },
          "Crime": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 1
          },
          "Diplomacia": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 5
          },
          "Enganação": {
            "grau": "Veterano",
            "bonus": 15,
            "attr": "PRE",
            "total": 20
          },
          "Fortitude": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "VIG",
            "total": 1
          },
          "Furtividade": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 1
          },
          "Iniciativa": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 1
          },
          "Intimidação": {
            "grau": "Expert",
            "bonus": 20,
            "attr": "PRE",
            "total": 25
          },
          "Intuição": {
            "grau": "Veterano",
            "bonus": 10,
            "attr": "PRE",
            "total": 15
          },
          "Investigação": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 5
          },
          "Luta": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "FOR",
            "total": 1
          },
          "Medicina": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 5
          },
          "Ocultismo": {
            "grau": "Expert",
            "bonus": 20,
            "attr": "INT",
            "total": 25
          },
          "Percepção": {
            "grau": "Veterano",
            "bonus": 10,
            "attr": "PRE",
            "total": 15
          },
          "Pilotagem": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 1
          },
          "Pontaria": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 1
          },
          "Profissão": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 5
          },
          "Reflexos": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 1
          },
          "Religião": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 5
          },
          "Sobrevivência": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 5
          },
          "Tática": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 5
          },
          "Tecnologia": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 5
          },
          "Vontade": {
            "grau": "Expert",
            "bonus": 20,
            "attr": "PRE",
            "total": 25
          }
        },
        "abilities": [
          "Campo Ilusório de Rosas: Projeta uma ilusão hipnótica que mascara ferimentos mortais e corrompe a visão dos investigadores.",
          "Aura Criogênica do Caos: Reduz a temperatura ao redor em 40 graus com presença biológica pura.",
          "Reescrita Celular: Mutação forçada de tecidos vivos tocados pela substância azulada."
        ],
        "inventory": [
          "Núcleo Biológico Primordial",
          "Espécimes de Tecido Mimetizado"
        ],
        "relics": []
      }
    },
    {
      "id": "char_helena",
      "name": "Helena Castro",
      "codename": "A Investigadora Racional",
      "player": "Jogadora: Fernanda",
      "origin": "Estudante Universitária de Ciências Sociais",
      "class": "Especialista",
      "track": "Dedução Forense",
      "nex": "25%",
      "mda": "8%",
      "status": "Sobrevivente Traumatizada",
      "life_status": "alive",
      "campaign_id": "camp_002",
      "campaign_ids": [
        "camp_002"
      ],
      "attributes": {
        "agi": 2,
        "for": 1,
        "int": 4,
        "pre": 3,
        "vig": 2
      },
      "stats": {
        "pv": {
          "current": 22,
          "max": 22
        },
        "pe": {
          "current": 18,
          "max": 18
        },
        "san": {
          "current": 20,
          "max": 35
        },
        "defesa": 12,
        "bloqueio": 2,
        "esquiva": 12,
        "protecao": 1
      },
      "canon_status": "confirmed",
      "sources": [
        "Roteiro Canônico de Até o Amanhecer",
        "Depoimentos de Sobreviventes de San Lorenzo"
      ],
      "historical_title": "Sobrevivente da Mansão Vilar",
      "portrait": "assets/icon-192.png",
      "relics": [
        "Gravador de Áudio Analógico de Campo"
      ],
      "skills": [
        {
          "name": "Investigação",
          "value": 10,
          "attr": "INT",
          "category": "Mente",
          "training": "Veterano"
        },
        {
          "name": "Percepção",
          "value": 5,
          "attr": "PRE",
          "category": "Mente",
          "training": "Treinado"
        },
        {
          "name": "Intuição",
          "value": 5,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Treinado"
        },
        {
          "name": "Vontade",
          "value": 5,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Treinado"
        }
      ]
    },
    {
      "id": "char_diego",
      "name": "Diego Ramos",
      "codename": "O Atleta Protetor",
      "player": "Jogador: Bruno",
      "origin": "Atleta e Praticante de Trilha",
      "class": "Combatente",
      "track": "Guarda-Costas de Campo",
      "nex": "25%",
      "mda": "12%",
      "status": "Sobrevivente com Fratura",
      "life_status": "alive",
      "campaign_id": "camp_002",
      "campaign_ids": [
        "camp_002"
      ],
      "attributes": {
        "agi": 3,
        "for": 4,
        "int": 1,
        "pre": 2,
        "vig": 3
      },
      "stats": {
        "pv": {
          "current": 28,
          "max": 28
        },
        "pe": {
          "current": 12,
          "max": 12
        },
        "san": {
          "current": 18,
          "max": 30
        },
        "defesa": 15,
        "bloqueio": 4,
        "esquiva": 13,
        "protecao": 2
      },
      "canon_status": "confirmed",
      "sources": [
        "Roteiro Canônico de Até o Amanhecer"
      ],
      "historical_title": "Sobrevivente da Mansão Vilar",
      "portrait": "assets/icon-192.png",
      "relics": [],
      "skills": [
        {
          "name": "Atletismo",
          "value": 10,
          "attr": "FOR",
          "category": "Físicas",
          "training": "Veterano"
        },
        {
          "name": "Luta",
          "value": 5,
          "attr": "FOR",
          "category": "Físicas",
          "training": "Treinado"
        },
        {
          "name": "Fortitude",
          "value": 5,
          "attr": "VIG",
          "category": "Físicas",
          "training": "Treinado"
        }
      ]
    },
    {
      "id": "char_bia",
      "name": "Beatriz 'Bia' Albuquerque",
      "codename": "A Diplomata Ágil",
      "player": "Jogadora: Larissa",
      "origin": "Estudante de Comunicação e Multimídia",
      "class": "Suporte",
      "track": "Negociação Sob Tensão",
      "nex": "20%",
      "mda": "6%",
      "status": "Sobrevivente em Recuperação",
      "life_status": "alive",
      "campaign_id": "camp_002",
      "campaign_ids": [
        "camp_002"
      ],
      "attributes": {
        "agi": 3,
        "for": 1,
        "int": 2,
        "pre": 4,
        "vig": 2
      },
      "stats": {
        "pv": {
          "current": 20,
          "max": 20
        },
        "pe": {
          "current": 16,
          "max": 16
        },
        "san": {
          "current": 22,
          "max": 35
        },
        "defesa": 13,
        "bloqueio": 2,
        "esquiva": 13,
        "protecao": 1
      },
      "canon_status": "confirmed",
      "sources": [
        "Roteiro Canônico de Até o Amanhecer"
      ],
      "historical_title": "Sobrevivente da Mansão Vilar",
      "portrait": "assets/icon-192.png",
      "relics": [],
      "skills": [
        {
          "name": "Diplomacia",
          "value": 10,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Veterano"
        },
        {
          "name": "Enganação",
          "value": 5,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Treinado"
        },
        {
          "name": "Reflexos",
          "value": 5,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Treinado"
        }
      ]
    },
    {
      "id": "char_arthur",
      "name": "Arthur Valente",
      "codename": "O Técnico Nervoso",
      "player": "Jogador: Felipe",
      "origin": "Técnico em Eletromecânica e Rádio amador",
      "class": "Especialista",
      "track": "Engenharia de Sobrevivência",
      "nex": "25%",
      "mda": "10%",
      "status": "Sobrevivente com Trauma Acústico",
      "life_status": "alive",
      "campaign_id": "camp_002",
      "campaign_ids": [
        "camp_002"
      ],
      "attributes": {
        "agi": 2,
        "for": 2,
        "int": 4,
        "pre": 2,
        "vig": 2
      },
      "stats": {
        "pv": {
          "current": 22,
          "max": 22
        },
        "pe": {
          "current": 15,
          "max": 15
        },
        "san": {
          "current": 16,
          "max": 30
        },
        "defesa": 12,
        "bloqueio": 2,
        "esquiva": 12,
        "protecao": 1
      },
      "canon_status": "confirmed",
      "sources": [
        "Roteiro Canônico de Até o Amanhecer"
      ],
      "historical_title": "Sobrevivente da Mansão Vilar",
      "portrait": "assets/icon-192.png",
      "relics": [
        "Transmissor de Ondas Curtas Modificado"
      ],
      "skills": [
        {
          "name": "Tecnologia",
          "value": 10,
          "attr": "INT",
          "category": "Mente",
          "training": "Veterano"
        },
        {
          "name": "Ciências",
          "value": 5,
          "attr": "INT",
          "category": "Mente",
          "training": "Treinado"
        },
        {
          "name": "Profissão",
          "value": 5,
          "attr": "INT",
          "category": "Mente",
          "training": "Treinado"
        }
      ]
    },
    {
      "id": "char_camila_torres",
      "name": "Camila Torres",
      "codename": "A Testemunha Oculta",
      "player": "NPC de Roteiro",
      "origin": "Moradora da Serra Mineradora de San Lorenzo",
      "class": "Civil / Informante",
      "track": "Conhecimento Local",
      "nex": "10%",
      "mda": "4%",
      "status": "Viva / Sob Proteção",
      "life_status": "alive",
      "campaign_id": "camp_002",
      "campaign_ids": [
        "camp_002"
      ],
      "attributes": {
        "agi": 2,
        "for": 1,
        "int": 3,
        "pre": 3,
        "vig": 2
      },
      "stats": {
        "pv": {
          "current": 18,
          "max": 18
        },
        "pe": {
          "current": 10,
          "max": 10
        },
        "san": {
          "current": 20,
          "max": 30
        },
        "defesa": 12,
        "bloqueio": 1,
        "esquiva": 12,
        "protecao": 0
      },
      "canon_status": "confirmed",
      "sources": [
        "Roteiro Canônico de Até o Amanhecer (NPC)"
      ],
      "historical_title": "Testemunha da Tragédia Vilar",
      "portrait": "assets/icon-192.png",
      "relics": []
    },
    {
      "id": "char_mauro_azevedo",
      "name": "Mauro Azevedo",
      "codename": "O Vigia da Mineradora",
      "player": "NPC de Roteiro",
      "origin": "Ex-Supervisor de Poço das Minas Vilar",
      "class": "Civil / Guia",
      "track": "Segurança Industrial",
      "nex": "15%",
      "mda": "7%",
      "status": "Falecido em Confronto",
      "life_status": "dead",
      "campaign_id": "camp_002",
      "campaign_ids": [
        "camp_002"
      ],
      "attributes": {
        "agi": 2,
        "for": 3,
        "int": 2,
        "pre": 2,
        "vig": 3
      },
      "stats": {
        "pv": {
          "current": 0,
          "max": 24
        },
        "pe": {
          "current": 0,
          "max": 10
        },
        "san": {
          "current": 0,
          "max": 25
        },
        "defesa": 13,
        "bloqueio": 3,
        "esquiva": 12,
        "protecao": 1
      },
      "canon_status": "confirmed",
      "sources": [
        "Roteiro Canônico de Até o Amanhecer (NPC)"
      ],
      "historical_title": "Vigia das Galerias Vilar",
      "portrait": "assets/icon-192.png",
      "relics": []
    },
    {
      "id": "char_elias_rocha",
      "name": "Elias Rocha",
      "codename": "O Historiador da Serra",
      "player": "NPC de Roteiro",
      "origin": "Arquivista do Cartório Histórico de San Lorenzo",
      "class": "Erudito",
      "track": "Pesquisa Histórica",
      "nex": "15%",
      "mda": "5%",
      "status": "Vivo / Sob Custódia A.E.G.I.S.",
      "life_status": "alive",
      "campaign_id": "camp_002",
      "campaign_ids": [
        "camp_002"
      ],
      "attributes": {
        "agi": 1,
        "for": 1,
        "int": 5,
        "pre": 3,
        "vig": 2
      },
      "stats": {
        "pv": {
          "current": 16,
          "max": 16
        },
        "pe": {
          "current": 14,
          "max": 14
        },
        "san": {
          "current": 22,
          "max": 35
        },
        "defesa": 11,
        "bloqueio": 1,
        "esquiva": 11,
        "protecao": 0
      },
      "canon_status": "confirmed",
      "sources": [
        "Roteiro Canônico de Até o Amanhecer (NPC)"
      ],
      "historical_title": "Arquivista Municipal de San Lorenzo",
      "portrait": "assets/icon-192.png",
      "relics": [
        "Chave Antiga da Galeria 4 das Minas"
      ]
    },
    {
      "id": "char_oeht",
      "name": "Theo 'Oeht' Vanderberg",
      "codename": "O Falso Benfeitor / Magnata Oculto",
      "player": "Antagonista de Incursão (NPC)",
      "origin": "Herdeiro de Conglomerado Financeiro & Mecenas",
      "class": "Líder Corporativo Antagônico",
      "track": "Comercialização do Paranormal",
      "nex": "65%",
      "mda": "24%",
      "status": "Sob Quarentena Tática // Status Incerto",
      "life_status": "quarantine",
      "campaign_id": "camp_filantropo_oeht",
      "campaign_ids": [
        "camp_filantropo_oeht"
      ],
      "attributes": {
        "agi": 2,
        "for": 2,
        "int": 5,
        "pre": 5,
        "vig": 3
      },
      "stats": {
        "pv": {
          "current": 35,
          "max": 35
        },
        "pe": {
          "current": 30,
          "max": 30
        },
        "san": {
          "current": 15,
          "max": 40
        },
        "defesa": 15,
        "bloqueio": 3,
        "esquiva": 12,
        "protecao": 2
      },
      "canon_status": "in_world_report",
      "sources": [
        "Dossiê A.E.G.I.S. Operação Belvedere",
        "Transcrição de Infiltração da Gala de Meia-Noite"
      ],
      "historical_title": "Bilionário e Mecenas da Falsa Filantropia",
      "portrait": "assets/icon-192.png",
      "relics": [
        "A Chave Mestra do Cofre Belvedere",
        "Anel de Selo em Platina e Quartzo Negro"
      ],
      "skills": [
        {
          "name": "Enganação",
          "value": 15,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Expert"
        },
        {
          "name": "Diplomacia",
          "value": 15,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Expert"
        },
        {
          "name": "Atualidades",
          "value": 10,
          "attr": "INT",
          "category": "Mente",
          "training": "Veterano"
        },
        {
          "name": "Intimidação",
          "value": 10,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Veterano"
        }
      ],
      "curator_notes": "Arrogante, persuasivo e convencido de sua superioridade intelectual. Acreditava piamente ser capaz de controlar a caixa parasita comprada no mercado oculto."
    },
    {
      "id": "char_kaelen",
      "name": "Diretor Kaelen Vance",
      "codename": "Sentinela de Genebra // Diretor de Contenção",
      "player": "Oficial Superior A.E.G.I.S. (NPC)",
      "origin": "Veterano de Operações de Contenção Metafísica",
      "class": "Comandante Estrategista",
      "track": "Operações Especiais de Quarentena",
      "nex": "70%",
      "mda": "15%",
      "status": "Ativo // Comando Central Genebra",
      "life_status": "alive",
      "campaign_id": "camp_filantropo_oeht",
      "campaign_ids": [
        "camp_filantropo_oeht",
        "camp_003",
        "camp_001"
      ],
      "attributes": {
        "agi": 3,
        "for": 3,
        "int": 5,
        "pre": 4,
        "vig": 4
      },
      "stats": {
        "pv": {
          "current": 40,
          "max": 40
        },
        "pe": {
          "current": 35,
          "max": 35
        },
        "san": {
          "current": 30,
          "max": 45
        },
        "defesa": 17,
        "bloqueio": 5,
        "esquiva": 14,
        "protecao": 4
      },
      "canon_status": "confirmed",
      "sources": [
        "Arquivo Central A.E.G.I.S. Genebra",
        "Briefing Operacional Belvedere"
      ],
      "historical_title": "Diretor Tático da A.E.G.I.S.",
      "portrait": "assets/icon-192.png",
      "relics": [
        "Comunicador Tático Criptografado de Subfrequência",
        "Injetor Quádruplo A.E.G.I.S."
      ],
      "skills": [
        {
          "name": "Tática",
          "value": 15,
          "attr": "INT",
          "category": "Mente",
          "training": "Expert"
        },
        {
          "name": "Investigação",
          "value": 10,
          "attr": "INT",
          "category": "Mente",
          "training": "Veterano"
        },
        {
          "name": "Luta",
          "value": 10,
          "attr": "FOR",
          "category": "Físicas",
          "training": "Veterano"
        },
        {
          "name": "Vontade",
          "value": 15,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Expert"
        }
      ],
      "curator_notes": "Voz firme, pragmática e inflexível. Coordena equipes de contenção através de canais criptografados."
    },
    {
      "id": "char_marcos_valente",
      "name": "Marcos 'Quebra-Mar' Valente",
      "codename": "O Farol de Ferro",
      "player": "Herói Conceitual • Virtude da Coragem",
      "class": "Combatente",
      "origin": "Ex-Mergulhador de Resgate",
      "virtue_name": "Coragem",
      "virtue_group": "Construtiva",
      "primary_mode": "Projeção",
      "mda_level": 20,
      "mda_stage": "2º Estágio: Manifestação",
      "perception_condition": "Desperto",
      "campaign": "camp_001",
      "hp": {
        "current": 45,
        "max": 45
      },
      "pd": {
        "current": 25,
        "max": 30
      },
      "ea": {
        "current": 14,
        "max": 14
      },
      "stability": {
        "current": 15,
        "max": 15
      },
      "armor": {
        "type": "Pesada",
        "rd": 6
      },
      "attributes": {
        "for": 4,
        "vig": 4,
        "agi": 2,
        "pre": 3,
        "int": 2
      },
      "skills": {
        "Luta": 10,
        "Fortitude": 10,
        "Atletismo": 5,
        "Sobrevivência": 5,
        "Vontade": 5
      },
      "soul_manifestation": {
        "name": "Farol de São Telmo",
        "appearance": "Escafandrista colossal de latão oxidado e vidro espesso com chama azul incandescente no visor.",
        "temperament": "Protetor e inabalável",
        "techniques": [
          {
            "name": "Ancorar o Abismo",
            "cost_ea": 4,
            "desc": "+5 ao Bloqueio e imunidade a empurrões."
          },
          {
            "name": "Golpe de Descompressão",
            "cost_ea": 5,
            "desc": "Soco pressurizado com +2d6 de dano concussivo."
          }
        ]
      },
      "biography": "Ex-mergulhador de resgate cujo navio foi tragado para o Triângulo das Bermudas. Perdeu metade da tripulação para tentáculos no Fosso do Kraken, mas permaneceu no convés atirando sinalizadores para salvar os botes."
    },
    {
      "id": "char_clara_mendes",
      "name": "Dra. Clara Mendes",
      "codename": "Mãos da Misericórdia",
      "player": "Heroína Conceitual • Virtude da Compaixão",
      "class": "Conjuradora",
      "origin": "Médica Legista da A.E.G.I.S.",
      "virtue_name": "Compaixão",
      "virtue_group": "Construtiva",
      "primary_mode": "Projeção",
      "mda_level": 20,
      "mda_stage": "2º Estágio: Manifestação",
      "perception_condition": "Desperto",
      "campaign": "camp_filantropo_oeht",
      "hp": {
        "current": 35,
        "max": 35
      },
      "pd": {
        "current": 25,
        "max": 30
      },
      "ea": {
        "current": 15,
        "max": 15
      },
      "stability": {
        "current": 14,
        "max": 16
      },
      "armor": {
        "type": "Leve",
        "rd": 2
      },
      "attributes": {
        "for": 1,
        "vig": 2,
        "agi": 2,
        "pre": 4,
        "int": 4
      },
      "skills": {
        "Medicina": 15,
        "Ocultismo": 10,
        "Intuição": 10,
        "Diplomacia": 5,
        "Vontade": 5
      },
      "soul_manifestation": {
        "name": "Pietà de Porcelana",
        "appearance": "Figura feminina flutuante sem olhos, feita de porcelana branca rachada com fios carmesins que estancam ferimentos.",
        "temperament": "Silencioso e compassivo",
        "techniques": [
          {
            "name": "Transfusão Anímica",
            "cost_ea": 3,
            "desc": "Restaura 2d8 PV de aliado conectado pelos fios a até 12m."
          },
          {
            "name": "Mártir Voluntário",
            "cost_ea": 4,
            "desc": "Reação que absorve 100% do dano de um aliado com RD 4 espiritual."
          }
        ]
      },
      "biography": "Médica legista recrutada pela A.E.G.I.S. após sobreviver a um ataque de Mímico Genético em um hospital, onde recusou abandonar pacientes infectados."
    },
    {
      "id": "char_kenji_sato",
      "name": "Agente Sênior Kenji Sato",
      "codename": "O Cronômetro de Sangue",
      "player": "Herói Conceitual • Virtude da Disciplina",
      "class": "Combatente",
      "origin": "Veterano Tático da A.E.G.I.S.",
      "virtue_name": "Disciplina",
      "virtue_group": "Construtiva",
      "primary_mode": "Sintonia",
      "mda_level": 40,
      "mda_stage": "3º Estágio: Sintonia Plena",
      "perception_condition": "Desperto",
      "campaign": "camp_filantropo_oeht",
      "hp": {
        "current": 50,
        "max": 50
      },
      "pd": {
        "current": 35,
        "max": 40
      },
      "ea": {
        "current": 20,
        "max": 22
      },
      "stability": {
        "current": 16,
        "max": 18
      },
      "armor": {
        "type": "Pesada",
        "rd": 6
      },
      "attributes": {
        "for": 3,
        "vig": 4,
        "agi": 4,
        "pre": 3,
        "int": 3
      },
      "skills": {
        "Luta": 15,
        "Reflexos": 15,
        "Fortitude": 10,
        "Tática": 10,
        "Vontade": 10
      },
      "soul_manifestation": {
        "name": "Zero Absoluto",
        "appearance": "Samurai esguio composto por lâminas de aço cirúrgico e réguas flutuantes em ângulos de 90 graus perfeitos.",
        "temperament": "Frio e matemático",
        "techniques": [
          {
            "name": "Guarda dos Oito Ângulos",
            "cost_ea": 3,
            "desc": "+4 em Bloqueio ou Esquiva contra ataques múltiplos enquanto plantado."
          },
          {
            "name": "Bisseção Perfeita",
            "cost_ea": 6,
            "desc": "Golpe cirúrgico que ignora totalmente armaduras ou carapaças."
          }
        ]
      },
      "biography": "Operador veterano da A.E.G.I.S. sob comando direto do Diretor Kaelen. Sobreviveu a um loop temporal de 48 horas mantendo a sanidade contando mentalmente cada segundo."
    },
    {
      "id": "char_veronica_dias",
      "name": "Verônica 'Coruja' Dias",
      "codename": "O Olho Que Tudo Grava",
      "player": "Heroína Conceitual • Virtude da Sabedoria",
      "class": "Especialista",
      "origin": "Criptógrafa Independente",
      "virtue_name": "Sabedoria",
      "virtue_group": "Construtiva",
      "primary_mode": "Projeção",
      "mda_level": 20,
      "mda_stage": "2º Estágio: Manifestação",
      "perception_condition": "Desperto",
      "campaign": "camp_002",
      "hp": {
        "current": 30,
        "max": 30
      },
      "pd": {
        "current": 28,
        "max": 30
      },
      "ea": {
        "current": 16,
        "max": 16
      },
      "stability": {
        "current": 15,
        "max": 17
      },
      "armor": {
        "type": "Leve",
        "rd": 2
      },
      "attributes": {
        "for": 1,
        "vig": 2,
        "agi": 2,
        "pre": 3,
        "int": 5
      },
      "skills": {
        "Investigação": 15,
        "Tecnologia": 15,
        "Ocultismo": 10,
        "Percepção": 10,
        "Intuição": 10
      },
      "soul_manifestation": {
        "name": "Lanterna de Diógenes",
        "appearance": "Esfera armilar flutuante de bronze antigo contendo um olho prismático que projeta luz ultravioleta espiritual.",
        "temperament": "Inquisitivo e vigilante",
        "techniques": [
          {
            "name": "Raio-X da Verdade",
            "cost_ea": 3,
            "desc": "Ilumina área de 6m revelando invisibilidade, portais LIMIAR ou disfarces de Mímicos."
          },
          {
            "name": "Leitura de Padrão",
            "cost_ea": 4,
            "desc": "+3 no ataque e defesa de um aliado contra o alvo analisado."
          }
        ]
      },
      "biography": "Criptógrafa e investigadora independente que ajudou a decifrar arquivos ocultos sobre as minas da região de Vilar. Despertou sua Alma ao encarar um espelho anômalo sem enlouquecer."
    },
    {
      "id": "char_mateus_alencar",
      "name": "Padre Mateus Alencar",
      "codename": "O Guardião da Esperança",
      "player": "Herói Conceitual • Virtude da Esperança",
      "class": "Conjurador",
      "origin": "Capelão Naval",
      "virtue_name": "Esperança",
      "virtue_group": "Transformadora",
      "primary_mode": "Projeção",
      "mda_level": 20,
      "mda_stage": "2º Estágio: Manifestação",
      "perception_condition": "Desperto",
      "campaign": "camp_001",
      "hp": {
        "current": 35,
        "max": 35
      },
      "pd": {
        "current": 25,
        "max": 30
      },
      "ea": {
        "current": 17,
        "max": 17
      },
      "stability": {
        "current": 16,
        "max": 18
      },
      "armor": {
        "type": "Leve",
        "rd": 2
      },
      "attributes": {
        "for": 1,
        "vig": 2,
        "agi": 2,
        "pre": 5,
        "int": 3
      },
      "skills": {
        "Religião": 15,
        "Diplomacia": 10,
        "Vontade": 10,
        "Intuição": 5,
        "Medicina": 5
      },
      "soul_manifestation": {
        "name": "Estrela d'Alva",
        "appearance": "Anjo sem rosto esculpido em coral branco bioluminescente e chamas douradas suaves.",
        "temperament": "Radiante e protetor",
        "techniques": [
          {
            "name": "Cântico contra o Abismo",
            "cost_ea": 4,
            "desc": "Anula sussurros de Névoas Traumáticas e recupera 2 EST dos aliados em 9m."
          },
          {
            "name": "Vigília Inextinguível",
            "cost_ea": 6,
            "desc": "Impede que aliados na área caiam a 0 PV por 2 rodadas."
          }
        ]
      },
      "biography": "Capelão naval cujo navio foi tragado para o Triângulo das Bermudas. Em Nova Caronte, fundou um abrigo na carcaça de um barco pesqueiro para acolher recém-chegados."
    },
    {
      "id": "char_helena_vargas",
      "name": "Inspetora Helena Vargas",
      "codename": "A Balança de Chumbo",
      "player": "Heroína Conceitual • Virtude da Justiça",
      "class": "Especialista",
      "origin": "Corregedora da A.E.G.I.S.",
      "virtue_name": "Justiça",
      "virtue_group": "Transformadora",
      "primary_mode": "Projeção e Sintonia",
      "mda_level": 40,
      "mda_stage": "3º Estágio: Sintonia Plena",
      "perception_condition": "Desperto",
      "campaign": "camp_filantropo_oeht",
      "hp": {
        "current": 45,
        "max": 45
      },
      "pd": {
        "current": 35,
        "max": 40
      },
      "ea": {
        "current": 21,
        "max": 21
      },
      "stability": {
        "current": 17,
        "max": 19
      },
      "armor": {
        "type": "Média",
        "rd": 4
      },
      "attributes": {
        "for": 2,
        "vig": 3,
        "agi": 3,
        "pre": 4,
        "int": 4
      },
      "skills": {
        "Investigação": 15,
        "Intimidação": 15,
        "Vontade": 10,
        "Pontaria": 10,
        "Luta": 5
      },
      "soul_manifestation": {
        "name": "Lex Talionis",
        "appearance": "Juiz-carrasco de 2,2 metros com toga de chumbo, balança de ferro e cutelo espectral.",
        "temperament": "Severo e legalista",
        "techniques": [
          {
            "name": "Auto de Acusação",
            "cost_ea": 3,
            "desc": "Marca quem feriu inocente; ataques ganham +3 de acerto e +1d8 de dano."
          },
          {
            "name": "Algemas do Veredito",
            "cost_ea": 6,
            "desc": "Correntes reduzem deslocamento do assassino a zero."
          }
        ]
      },
      "biography": "Ex-promotora criminal que descobriu redes de tráfico humano voltadas a rituais da elite financeira. Ingressou na corregedoria interna da A.E.G.I.S."
    },
    {
      "id": "char_iris_vento_solto",
      "name": "Capitã Íris 'Vento Solto'",
      "codename": "A Corsária das Fendas",
      "player": "Heroína Conceitual • Virtude da Liberdade",
      "class": "Combatente",
      "origin": "Ex-Escrava de Nácar / Corsária",
      "virtue_name": "Liberdade",
      "virtue_group": "Transformadora",
      "primary_mode": "Sintonia",
      "mda_level": 40,
      "mda_stage": "3º Estágio: Sintonia Plena",
      "perception_condition": "Desperto",
      "campaign": "camp_001",
      "hp": {
        "current": 45,
        "max": 45
      },
      "pd": {
        "current": 35,
        "max": 40
      },
      "ea": {
        "current": 18,
        "max": 18
      },
      "stability": {
        "current": 14,
        "max": 16
      },
      "armor": {
        "type": "Leve",
        "rd": 2
      },
      "attributes": {
        "for": 3,
        "vig": 3,
        "agi": 5,
        "pre": 3,
        "int": 2
      },
      "skills": {
        "Acrobacia": 15,
        "Luta": 15,
        "Pilotagem": 10,
        "Reflexos": 10,
        "Atletismo": 10
      },
      "soul_manifestation": {
        "name": "Zéfiro Rebelde",
        "appearance": "Espírito acrobático de velas de navio rasgadas, ventos cortantes e grilhões abertos nos pulsos.",
        "temperament": "Inquieto e indomável",
        "techniques": [
          {
            "name": "Dança sobre as Espumas",
            "cost_ea": 3,
            "desc": "Permite correr sobre a água, triplicar salto e ignorar agarrões."
          },
          {
            "name": "Lâmina de Barlavento",
            "cost_ea": 5,
            "desc": "Dispara lâminas de ar comprimido com o sabre a até 9m com 1d10+4 de dano."
          }
        ]
      },
      "biography": "Ex-escrava capturada para os leilões de Nácar que liderou um motim vitorioso, quebrou as próprias algemas e roubou uma lancha rápida para navegar livre no Triângulo."
    },
    {
      "id": "char_lorenzo_vane",
      "name": "Lorenzo Vane",
      "codename": "O Cobrador do Submundo",
      "player": "Herói Conceitual • Virtude da Ambição",
      "class": "Conjurador / Negociador",
      "origin": "Ex-Mercador de Relíquias",
      "virtue_name": "Ambição",
      "virtue_group": "Transformadora",
      "primary_mode": "Projeção",
      "mda_level": 40,
      "mda_stage": "3º Estágio: Sintonia Plena",
      "perception_condition": "Desperto",
      "campaign": "camp_filantropo_oeht",
      "hp": {
        "current": 40,
        "max": 40
      },
      "pd": {
        "current": 30,
        "max": 40
      },
      "ea": {
        "current": 22,
        "max": 22
      },
      "stability": {
        "current": 13,
        "max": 17
      },
      "armor": {
        "type": "Média",
        "rd": 4
      },
      "attributes": {
        "for": 2,
        "vig": 3,
        "agi": 2,
        "pre": 4,
        "int": 4
      },
      "skills": {
        "Enganação": 15,
        "Ocultismo": 15,
        "Diplomacia": 10,
        "Crime": 10,
        "Intuição": 5
      },
      "soul_manifestation": {
        "name": "Banco de Midas",
        "appearance": "Nobre esguio em terno escuro com tronco em forma de cofre dourado entreaberto e bocas nas palmas das mãos.",
        "temperament": "Cobiçoso e calculista",
        "techniques": [
          {
            "name": "Execução de Dívida",
            "cost_ea": 4,
            "desc": "Toque drena 1d6 PD/EA e converte em escudo de PV."
          },
          {
            "name": "Juros Compostos",
            "cost_ea": 6,
            "desc": "Armazena até 15 pontos de dano bloqueado para desferir no próximo ataque."
          }
        ]
      },
      "biography": "Ex-sócio menor de Victor Kael no mercado negro de relíquias. Após ser traído e deixado para morrer em uma fenda, despertou sua Alma devorando a energia de um artefato quebrado."
    },
    {
      "id": "char_valerius",
      "name": "Comandante Valerius",
      "codename": "O Soberano de Ferro",
      "player": "Herói Conceitual • Virtude do Orgulho",
      "class": "Combatente",
      "origin": "Oficial Naval de Época",
      "virtue_name": "Orgulho",
      "virtue_group": "Instintiva",
      "primary_mode": "Projeção e Convergência",
      "mda_level": 60,
      "mda_stage": "3º Estágio Avançado (Abençoado)",
      "perception_condition": "Desperto",
      "campaign": "camp_001",
      "hp": {
        "current": 65,
        "max": 65
      },
      "pd": {
        "current": 45,
        "max": 50
      },
      "ea": {
        "current": 28,
        "max": 28
      },
      "stability": {
        "current": 16,
        "max": 18
      },
      "armor": {
        "type": "Pesada",
        "rd": 6
      },
      "attributes": {
        "for": 5,
        "vig": 5,
        "agi": 2,
        "pre": 4,
        "int": 2
      },
      "skills": {
        "Luta": 15,
        "Intimidação": 15,
        "Fortitude": 15,
        "Tática": 10,
        "Vontade": 10
      },
      "soul_manifestation": {
        "name": "Sol Invictus",
        "appearance": "Colosso imperial de 2,5m revestido de ouro branco e luz ofuscante empunhando uma alabarda solar.",
        "temperament": "Imperial e severo",
        "techniques": [
          {
            "name": "Genuflexão Obrigatória",
            "cost_ea": 5,
            "desc": "Pressão gravitacional em 6m que derruba inimigos de joelhos."
          },
          {
            "name": "Fulgor do Monarca",
            "cost_ea": 8,
            "desc": "Golpe vertical de alabarda que projeta feixe térmico com 1d12+8 de dano."
          }
        ]
      },
      "biography": "Oficial de uma embarcação histórica absorvida pelo Triângulo. Recusou-se a ajoelhar diante dos Soberanos de Nácar e esculpiu um domínio independente."
    },
    {
      "id": "char_raissa_carnica",
      "name": "Raíssa 'Carniça'",
      "codename": "A Fera do Cretáceo",
      "player": "Heroína Conceitual • Virtude da Fúria",
      "class": "Combatente",
      "origin": "Sobrevivente da Ilha Canibal",
      "virtue_name": "Fúria",
      "virtue_group": "Instintiva",
      "primary_mode": "Sintonia e Convergência",
      "mda_level": 20,
      "mda_stage": "2º Estágio: Manifestação",
      "perception_condition": "Desperto",
      "campaign": "camp_001",
      "hp": {
        "current": 40,
        "max": 40
      },
      "pd": {
        "current": 25,
        "max": 30
      },
      "ea": {
        "current": 15,
        "max": 15
      },
      "stability": {
        "current": 12,
        "max": 14
      },
      "armor": {
        "type": "Média",
        "rd": 4
      },
      "attributes": {
        "for": 4,
        "vig": 4,
        "agi": 3,
        "pre": 3,
        "int": 1
      },
      "skills": {
        "Luta": 15,
        "Atletismo": 10,
        "Fortitude": 10,
        "Sobrevivência": 10,
        "Intimidação": 5
      },
      "soul_manifestation": {
        "name": "Mandíbula do Cretáceo",
        "appearance": "Fera humanoide revestida de placas ósseas avermelhadas e vapor fervente, com braços que terminam em crânios de répteis de energia.",
        "temperament": "Feroz e sanguinário",
        "techniques": [
          {
            "name": "Combustão de Adrenalina",
            "cost_ea": 3,
            "desc": "+1d8 de dano extra no próximo golpe ao contra-atacar sob ferimento."
          },
          {
            "name": "Mordida Sísmica",
            "cost_ea": 6,
            "desc": "Reduz a RD do inimigo em -2 permanentemente e causa 1d12+5 de dano."
          }
        ]
      },
      "biography": "Única sobrevivente de uma expedição dizimada nos templos da Ilha Canibal. Passou duas semanas caçando os sequestradores de sua irmã e despertou sua Alma no altar de sacrifício."
    },
    {
      "id": "char_jonas_silveira",
      "name": "Jonas 'Vulto' Silveira",
      "codename": "O Espectro da Ferrovia",
      "player": "Herói Conceitual • Virtude do Medo",
      "class": "Especialista / Infiltrador",
      "origin": "Ex-Ferroviário da Linha Vilar",
      "virtue_name": "Medo",
      "virtue_group": "Instintiva",
      "primary_mode": "Projeção",
      "mda_level": 20,
      "mda_stage": "2º Estágio: Manifestação",
      "perception_condition": "Desperto",
      "campaign": "camp_002",
      "hp": {
        "current": 30,
        "max": 30
      },
      "pd": {
        "current": 28,
        "max": 30
      },
      "ea": {
        "current": 15,
        "max": 15
      },
      "stability": {
        "current": 13,
        "max": 15
      },
      "armor": {
        "type": "Leve",
        "rd": 2
      },
      "attributes": {
        "for": 1,
        "vig": 2,
        "agi": 4,
        "pre": 3,
        "int": 3
      },
      "skills": {
        "Furtividade": 15,
        "Crime": 10,
        "Percepção": 10,
        "Intuição": 5,
        "Tecnologia": 5
      },
      "soul_manifestation": {
        "name": "O Vigia do Túnel",
        "appearance": "Figura curvada de 3m feita de fuligem negra e fiação partida, com lanterna de trem apagada que absorve a luz.",
        "temperament": "Paciente e assustador",
        "techniques": [
          {
            "name": "Apagar as Luzes",
            "cost_ea": 3,
            "desc": "Extingue lâmpadas comuns e mergulha área de 6m em penumbra densa."
          },
          {
            "name": "Alucinação da Fobia",
            "cost_ea": 5,
            "desc": "Materializa o pior trauma do alvo forçando teste de Vontade contra pânico."
          }
        ]
      },
      "biography": "Ex-funcionário ferroviário que ficou quatro dias preso em um túnel desabado perto da Estação Vilar ouvindo as imitações do Eco. Tornou o terror sua arma defensiva."
    },
    {
      "id": "char_victor_kael",
      "name": "Victor Kael",
      "codename": "O Leiloeiro do Oculto",
      "player": "NPC Antagonista Ocultista",
      "class": "Conjurador / Sabotador",
      "origin": "Mercador de Relíquias Negras",
      "virtue_name": "Orgulho",
      "virtue_group": "Instintiva",
      "primary_mode": "Sintonia",
      "mda_level": 40,
      "mda_stage": "3º Estágio: Sintonia Plena",
      "perception_condition": "Desperto",
      "campaign": "camp_filantropo_oeht",
      "hp": {
        "current": 45,
        "max": 45
      },
      "pd": {
        "current": 30,
        "max": 40
      },
      "ea": {
        "current": 20,
        "max": 22
      },
      "stability": {
        "current": 14,
        "max": 16
      },
      "armor": {
        "type": "Leve",
        "rd": 2
      },
      "attributes": {
        "for": 2,
        "vig": 2,
        "agi": 3,
        "pre": 4,
        "int": 4
      },
      "skills": {
        "Ocultismo": 15,
        "Crime": 10,
        "Enganação": 10,
        "Furtividade": 10
      },
      "biography": "Homem de terno vinho infiltrado na gala de Oeht. Sabotador ativo contra a A.E.G.I.S., trabalha para que o ritual da redoma e do Anárquico se concretize."
    },
    {
      "id": "char_guia_temporario",
      "name": "O Guia Temporário",
      "codename": "O Alerta de Ferro",
      "player": "NPC Mártir Canônico",
      "class": "Combatente / Sobrevivente",
      "origin": "Navegador do Atlântico",
      "virtue_name": "Coragem",
      "virtue_group": "Construtiva",
      "primary_mode": "Projeção",
      "mda_level": 30,
      "mda_stage": "2º Estágio: Manifestação",
      "perception_condition": "Desperto",
      "campaign": "camp_001",
      "hp": {
        "current": 0,
        "max": 40
      },
      "pd": {
        "current": 0,
        "max": 30
      },
      "ea": {
        "current": 0,
        "max": 14
      },
      "stability": {
        "current": 0,
        "max": 15
      },
      "armor": {
        "type": "Média",
        "rd": 4
      },
      "attributes": {
        "for": 3,
        "vig": 3,
        "agi": 3,
        "pre": 3,
        "int": 2
      },
      "skills": {
        "Pilotagem": 15,
        "Sobrevivência": 10,
        "Luta": 10,
        "Vontade": 10
      },
      "biography": "Primeiro aliado dos sobreviventes na Sessão 1 do Triângulo. Reconheceu a chegada do Primogênito ao ver a água congelar azul. Alvo do Campo de Rosas, sacrificou a própria vida para alertar os outros."
    }
  ],
  "chronicles": [
    {
      "id": "cron_vil_01",
      "campaign_id": "camp_002",
      "location_id": "loc_vilar",
      "title": "A Noite da Confissão",
      "lore": "Cinco amigos retornaram à Mansão Vilar no México três anos após o desaparecimento de Lucas. Lá, foram caçados e manipulados psicologicamente por uma figura mascarada capaz de se teletransportar usando uma arma chamada LIMIAR (criada por Gabriel Vilar). Ao final, enfrentaram os 'Ecos', criaturas cegas que roubam vozes nas minas subterrâneas, explodindo a mansão para conter a ameaça e resgatando Lucas com vida."
    },
    {
      "id": "cron_inc_01",
      "campaign_id": "camp_001",
      "location_id": "loc_caronte",
      "title": "A Incursão do Navio de 5.000 Almas",
      "lore": "Após o colapso do mundo exterior, um navio foi sugado para o buraco de minhoca no verdadeiro Triângulo das Bermudas. Sobrevivendo à dor lancinante da travessia e às manipulações do Mímico Genético a bordo, a tripulação despertou em Nova Caronte. Lá, a magia não existe: apenas mutação biológica violenta. Os recém-chegados precisam entender as leis da hiper-evolução e sobreviver aos ataques do Diabo do Mar para chamar a atenção da A.E.G.I.S."
    },
    {
      "id": "cron_bel_01",
      "title": "A Infiltração da Meia-Noite",
      "location_id": "loc_mansao_belvedere",
      "date": "2026",
      "author": "Equipe Tática A.E.G.I.S.",
      "text": "Briefing de infiltração na Mansão Belvedere durante a gala do magnata Oeht. Monitoramento da relíquia da redoma e detecção de anomalias espaciais.",
      "campaign_id": "camp_filantropo_oeht"
    }
  ],
  "bestiary": [
    {
      "id": "creature_primogenito_arquiteto",
      "name": "O Primogênito — O Diabo do Mar",
      "classification": "Dominador / Detentor da Verdadeira Magia",
      "mda_level": "MDA 99%",
      "danger_tier": "CATASTRÓFICO // REALIDADE ALTERADA",
      "origin": "Campanha I: O Triângulo das Bermudas (Sessão 1)",
      "appearance": "Forma física verdadeira atrofiada e debilitada. Projeção flutuante sob um manto que absorve toda a luz, envolto em aura azul-escura e máscara de madeira e osso com sorriso cínico (relíquia ancestral associada ao mito de Loki).",
      "behavior": "Reescrita das leis físicas, temporais e genéticas da realidade (Verdadeira Magia). Sua presença é anunciada por água congelada em azul-escuro, ferrugem reluzente e névoa azulada.",
      "signature_ability": "Campo de Rosas (Mar de Rosas): Ilusão neurológica suprema que invade diretamente o córtex cerebral, desligando as funções vitais ao ser presenciada. Provocou a morte heróica do Guia na Sessão 1.",
      "weakness": "Almas no estágio de Sintonia Plena ou Transcendência ancoram a identidade mortal e oferecem resistência crucial contra a desintegração mental.",
      "lore_notes": "Primeiro humano a encontrar a anomalia dimensional há milênios. Moldou os mitos de Loki, as lendas sobre Merlin e os rituais de sacrifício da magia humana."
    },
    {
      "id": "creature_kraken",
      "name": "O Kraken do Fosso",
      "classification": "Soberano Biológico — Classe Alta",
      "mda_level": "MDA 80%–99%",
      "danger_tier": "TITÂNICO / TERRITORIAL",
      "origin": "Campanha I: O Triângulo das Bermudas",
      "appearance": "Cefalópode colossal cujo manto e epiderme fundiram-se simbioticamente com rocha vulcânica abissal e crostas de magma resfriado.",
      "behavior": "Guardião do Fosso. Não usa magia, operando por bioeletrogênese levada ao ápice evolutivo pela Lei da Alucinação.",
      "signature_ability": "Pulsos Eletromagnéticos (PEM): Seus tentáculos disparam ondas de alta voltagem que apagam sistemas elétricos, inutilizam maquinários navais e fritam os tecidos nervosos da tripulação.",
      "weakness": "Aberturas sensoriais nas junções entre as placas de basalto de sua couraça.",
      "lore_notes": "Soberano territorial que inspirou as lendas marítimas sobre devoradores de frotas e monstros abissais."
    },
    {
      "id": "creature_leviata_branco",
      "name": "Moby Dick — O Leviatã Branco",
      "classification": "Soberano Biológico — Classe Alta",
      "mda_level": "MDA 80%–99%",
      "danger_tier": "TITÂNICO / ANCESTRAL",
      "origin": "Campanha I: O Triângulo das Bermudas",
      "appearance": "Cachalote pré-histórico colossal revestido por uma armadura natural impenetrável de tumores calcificados acumulados ao longo de milênios.",
      "behavior": "Predador ancestral de mar aberto que inspirou a lenda de Melville. Patrulha águas profundas destruindo cascos que vibram em frequências hostis.",
      "signature_ability": "Sonar Destrutivo: Clique bioacústico de pressão extrema capaz de estilhaçar cascos de madeira maciça instantaneamente e infligir danos neurológicos agudos e hemorragias.",
      "weakness": "Abertura respiratória dorsal durante a emersão para oxigenação.",
      "lore_notes": "A lendária baleia branca de Melville existe e patrulha as águas abertas da anomalia marítima."
    },
    {
      "id": "creature_parasita_redoma_oeht",
      "name": "O Anárquico",
      "classification": "Entidade de Ritual",
      "mda_level": "MDA 80%",
      "danger_tier": "GRAVE / COLAPSO URBANO",
      "origin": "Campanha III: A Gala da Meia-Noite de Oeht",
      "canon_status": "in_world_report",
      "appearance": "Monstruosidade colossal despertada à meia-noite a partir da transmutação do bolo gigante de aniversário de Oeht, alimentada pelo artefato do cofre e pelo lodo roxo.",
      "behavior": "Manifesta-se sob a redoma hermética de Belvedere, convertendo servos e garçons em Zumbis de Sangue e fazendo reflexos saírem dos espelhos.",
      "signature_ability": "Vínculo Acústico de Invulnerabilidade: Defesa e resistência física colossais enquanto a caixa de música estiver ativa no palco; desativar a caixa reduz drasticamente sua proteção.",
      "weakness": "Destruir ou interromper o mecanismo da caixa de música retira seu escudo ritual.",
      "lore_notes": "Entidade concebida para coroar a privatização do paranormal proclamada no discurso das 23h00 do bilionário Theo Vanderberg."
    },
    {
      "id": "creature_mimico",
      "name": "Mímico Genético",
      "classification": "Predador Furtivo Metamórfico",
      "mda_level": "MDA 20%–40%",
      "danger_tier": "INFILTRAÇÃO / LETAL",
      "origin": "Campanha I: O Triângulo das Bermudas",
      "appearance": "Massa celular adaptativa capaz de mimetizar qualquer corpo humano recém-morto com fidelidade absoluta de voz e maneirismos.",
      "behavior": "Infiltra-se entre tripulantes e sobreviventes absorvendo o DNA de cadáveres para caçar por dentro e alimentar paranoia constante.",
      "signature_ability": "Mimetismo Genético de Cadáveres: Copia DNA, cicatrizes e memórias superficiais da vítima.",
      "weakness": "Jamais consegue replicar a Virtude de Alma de um Desperto — sendo essa a metodologia mais infalível usada pela A.E.G.I.S. para desmascará-los.",
      "lore_notes": "Origem real das lendas urbanas de 'pessoas trocadas por sósias' nas grandes cidades."
    },
    {
      "id": "creature_eco",
      "name": "O Eco",
      "classification": "Predador Cavernoso Subterrâneo",
      "mda_level": "MDA 25%–35%",
      "danger_tier": "SUBTERRÂNEO / EMBOSCADA",
      "origin": "Campanha II: O Mistério da Mansão Vilar",
      "appearance": "Humanoide esguio, pálido por séculos sem luz solar, quase totalmente cego, com audição sobre-humana e garras escavadoras.",
      "behavior": "Caça no escuro das minas da família Vilar. Grava com fidelidade absoluta vozes de humanos e as reproduz para atrair vítimas para emboscadas.",
      "signature_ability": "Mimetismo Fonador Perfeito: Reproduz vozes de familiares (como a esposa de Elias Rocha ou gritos de socorro dos cinco amigos).",
      "weakness": "Sensibilidade extrema a frequências sonoras agudas e descargas elétricas de portais LIMIAR.",
      "lore_notes": "A criatura que assombrava as minas de Vilar e que caçou os cinco amigos durante o resgate de Lucas."
    },
    {
      "id": "creature_povo_sauriano",
      "name": "Dinossauros e Tribais da Ilha Canibal",
      "classification": "Ecossistema Simbiótico Mutante",
      "mda_level": "MDA 15%–60%",
      "danger_tier": "SELVA MORTAL / HIERARQUIA",
      "origin": "Campanha I: O Triângulo das Bermudas (Sessão 2)",
      "appearance": "Répteis pré-históricos e humanos mutantes em simbiose com placas dérmicas e pinturas rituais de sangue.",
      "behavior": "Sociedade predatória iniciada há 400 anos quando um náufrago solitário ensinou canibalismo às feras da ilha. Dividida em Classe Baixa, Média e Governantes.",
      "signature_ability": "Ataque Sincronizado de Emboscada em Templos de Pedra.",
      "weakness": "Desorganização rápida na ausência dos líderes de casta média.",
      "lore_notes": "Estudo canônico de como a Lei da Alucinação funde faunas extintas a ritos de sangue humanos."
    },
    {
      "id": "creature_sentinela",
      "name": "Sentinela do LIMIAR",
      "classification": "Constructo Mecânico-Espacial",
      "mda_level": "MDA 10%",
      "danger_tier": "DEFESA / PORTAIS",
      "origin": "Campanha II: O Mistério da Mansão Vilar",
      "appearance": "Autômato de bronze e cobre construído por Gabriel Vilar acoplado às âncoras espaciais das paredes da mansão.",
      "behavior": "Guarda automatizada ativada por sensores de movimento quando os portais LIMIAR são disparados.",
      "signature_ability": "Estabilização de Fenda e Disparo de Choque em ZZZZT.",
      "weakness": "Esgotamento da bateria após 3 ciclos de salto dimensional.",
      "lore_notes": "Mecanismo patenteado por Gabriel para patrulhar os corredores da Mansão Vilar."
    },
    {
      "id": "creature_mao_rosas",
      "name": "Mão de Rosas (Manifestação do Campo de Rosas)",
      "classification": "Projeção da Verdadeira Magia",
      "mda_level": "MDA 99%",
      "danger_tier": "MENTAL / ILUSÃO",
      "origin": "Campanha I: O Triângulo das Bermudas",
      "appearance": "Mãos etéreas azuladas envoltas em pétalas de gelo negro e ferrugem cintilante que brotam da água.",
      "behavior": "Extensão direta da vontade do Primogênito para sufocar sinapses cerebrais à distância.",
      "signature_ability": "Toque Sináptico de Paralisia Cerebral.",
      "weakness": "Interrupção pelo choque de morte heroica voluntária (como o tiro do Guia).",
      "lore_notes": "A emanação direta que precedeu o sacrifício do Guia na Sessão 1."
    },
    {
      "id": "creature_leviathan",
      "name": "Parasita Glacial Primordial",
      "classification": "Bio-Anomalia Criogênica",
      "mda_level": "MDA 50%",
      "danger_tier": "CRIOGÊNICO / ABISSAL",
      "origin": "Arquivos Árticos A.E.G.I.S.",
      "appearance": "Organismo filamentoso de gelo negro e silício vivo preservado no permafrost.",
      "behavior": "Infesta sistemas nervosos de criaturas expostas ao frio profundo.",
      "signature_ability": "Criostase Nervosa Instantânea.",
      "weakness": "Calor extremo e técnicas anímicas da Virtude da Coragem (Brasa da Última Trincheira).",
      "lore_notes": "Registrado nos dossiês de contenção do Diretor Kaelen."
    }
  ],
  "relics": [
    {
      "id": "relic_limiar",
      "name": "Arma de Portais: LIMIAR",
      "owner": "Gabriel Vilar",
      "type": "Relíquia Tecnológica Oculta",
      "rarity": "Única / Grau Ômega",
      "pd_cost": 4,
      "ability": "Salto de Fenda Dimensional",
      "effect": "Permite ao portador ou ao alvo escolhido teleportar-se instantaneamente até 15 metros para qualquer ponto visível no battlemap, ignorando obstáculos sólidos e ataques de oportunidade.",
      "description": "Um aparato portátil com câmara de contenção de plasma de fenda e bobinas de tungstênio. Gabriel gastou três anos nas oficinas das minas para criar o único dispositivo capaz de furar as barreiras do espaço no universo Evren."
    },
    {
      "id": "relic_hallucigenia",
      "name": "Armadura Hallucigenia",
      "owner": "Lucas Vilar (Descoberta)",
      "type": "Bioproteção Fóssil Mutagênica",
      "rarity": "Relíquia Antiga",
      "pd_cost": 0,
      "ability": "Sacrifício de Armadura Supremo",
      "effect": "Quando o usuário for sofrer um ataque fatal ou Hitkill, a armadura se estilhaça em espinhos calcários, anulando 100% do dano mortal e concedendo +5m de fuga imediata. A peça fica inoperante até restauração biológica.",
      "description": "Peitoral orgânico petrificado forjado a partir de carapaças fósseis encontradas nas galerias mais profundas das minas mexicanas. Os espinhos dorsais absorvem a força cinética de impactos mortais."
    },
    {
      "id": "relic_patitre",
      "name": "Lança Patitre",
      "owner": "Guerreiros de Nova Caronte",
      "type": "Arma Orgânica Simbiótica",
      "rarity": "Grau Alfa",
      "pd_cost": 2,
      "ability": "Drenagem Medular",
      "effect": "Causa 3d8+6 de perfuração biológica e rouba 5 PD do alvo atingido, canalizando-os para o portador. Em contrapartida, cada ativação aumenta o MDA do usuário em +3%.",
      "description": "Lança esculpida com o espigão dorsal de um parasita das fossas oceânicas. A empunhadura tem veias vivas que se conectam aos tendões da mão de quem a empunha."
    },
    {
      "id": "relic_gravador",
      "name": "Gravador de Fita: Projeto Limiar",
      "owner": "Gabriel Vilar / Júlia",
      "type": "Dispositivo Investigativo",
      "rarity": "Grau Tático",
      "pd_cost": 1,
      "ability": "Frequência Anti-Eco",
      "effect": "Emite ondas ultrassônicas ressonantes em um raio de 12 metros, desorientando criaturas com audição aguçada (como os Ecos) e cancelando ataques furtivos por 2 rodadas.",
      "description": "Um gravador de bobina analógico modificado com transistores de alta frequência. Contém as gravações das fitas secretas das sessões de interrogatório e o som original do eco que aprisionou Lucas."
    },
    {
      "id": "relic_retrovirus",
      "name": "Injetor de Retrovírus AEGIS",
      "owner": "Divisão de Contenção",
      "type": "Bio-Consumível Médico",
      "rarity": "Suprimento Raro",
      "pd_cost": 0,
      "ability": "Estabilização Celular",
      "effect": "Restaura imediatamente +15 Pontos de Determinação (PD) e reduz temporariamente o MDA do personagem em -10%, evitando colapsos de Overload.",
      "description": "Seringa pneumática de titânio contendo um soro sintético azul-cobalto desenvolvido pela agência para reverter os primeiros estágios da anomalia genética."
    },
    {
      "id": "relic_bussola_fenda",
      "name": "Bússola de Fenda Dimensional",
      "owner": "Capitães do Triângulo",
      "type": "Artefato Náutico Cartográfico",
      "rarity": "Grau Veterano",
      "pd_cost": 0,
      "ability": "Navegação Anômala",
      "effect": "Aponta consistentemente para o epicentro das fendas e vórtices gravitacionais, permitindo navegar em meio a neblinas densas e tempestades sem perder a orientação.",
      "description": "Uma bússola esférica de latão cujo ponteiro é uma agulha de meteorito negro suspensa em fluido amniótico bioluminescente."
    },
    {
      "id": "relic_criostase",
      "name": "Injetor de Criostase Inversa",
      "owner": "Dra. Evelyn Shaw",
      "type": "Bio-Estabilizador Térmico",
      "rarity": "Grau Científico AEGIS",
      "pd_cost": 3,
      "ability": "Retardamento Metabólico",
      "effect": "Reduz o MDA em -10% temporariamente e neutraliza condições de queimadura, sangramento ou choque térmico por 3 rodadas.",
      "description": "Dispositivo cilíndrico de titânio preenchido com nitrogênio líquido ionizado capaz de retardar mutações celulares caóticas."
    },
    {
      "id": "relic_gelo_negro",
      "name": "Lâmina de Gelo Negro",
      "owner": "Comandante Miller",
      "type": "Arma Biomecânica",
      "rarity": "Grau Primordial",
      "pd_cost": 4,
      "ability": "Corte Criogênico",
      "effect": "Ataques ignoram Sacrifício de Armadura convencional; causa 2d10 de dano frio e reduz a Agilidade do alvo em -2.",
      "description": "Fragmento cortante do monólito ártico que nunca derrete, emanando uma fumaça gélida que absorve a luz ao redor."
    },
    {
      "id": "relic_quartzo_negro",
      "name": "Nódulo de Quartzo Mutagênico",
      "owner": "Dra. Camila Neves",
      "type": "Relíquia Mineral Biológica",
      "rarity": "Rara / Grau Alfa",
      "pd_cost": 3,
      "ability": "Pulso de Adaptação Celular",
      "effect": "Cura 2d8 PV de um aliado orgânico instantaneamente ao acelerar o metabolismo, concedendo +2 em testes de Fortitude por 2 rodadas.",
      "description": "Um fragmento cristalino negro extraído da caverna do Tapajós. Quando exposto a calor corpóreo, emite um brilho verde esmeralda e acelera a regeneração de tecidos vivos."
    },
    {
      "id": "relic_diapasao_eco",
      "name": "Diapasão de Prata Sem-Rosto",
      "owner": "Hans Richter",
      "type": "Relíquia Acústica Oculta",
      "rarity": "Rara / Grau Alfa",
      "pd_cost": 2,
      "ability": "Onda de Silenciamento Dimensional",
      "effect": "Cria uma zona de 6 metros de silêncio absoluto onde nenhuma habilidade mística oral ou efeito sonoro hostil pode ser executado.",
      "description": "Um diapasão forjado pelos monges da Floresta Negra com prata esterlina e inscrições heréticas. Vibra em uma frequência inaudível aos ouvidos humanos que desarma vórtices acústicos do LIMIAR."
    },
    {
      "id": "relic_relogio_temporal",
      "name": "Relógio de Dobra Temporal de 6 Segundos",
      "origin": "Laboratório de Pesquisa Metafísica A.E.G.I.S.",
      "effect": "Acelera o fluxo temporal subjetivo do portador por 6 segundos de tempo local, permitindo ações sem reação imediata do ambiente.",
      "mda_risk": "Baixo (1% de MDA por uso excessivo)",
      "description": "Relógio de bolso em latão e cristal fosco com engrenagens que giram no sentido anti-horário ao puxar o pino superior. Entregue ao agente infiltrado na Mansão Belvedere.",
      "canon_status": "in_world_report",
      "sources": [
        "Briefing Diretor Kaelen",
        "Laboratório Metafísico A.E.G.I.S."
      ]
    },
    {
      "id": "relic_parasita_redoma",
      "name": "A Relíquia Parasita da Redoma Belvedere",
      "origin": "Origem Extradimensional // Adquirida no Mercado Oculto por Oeht",
      "effect": "Promete reescrever leis locais à meia-noite, mas consome a matéria biológica de todos em raio de 100 metros ao despertar.",
      "mda_risk": "Extremo // 99% de MDA em caso de contato com o lodo roxo",
      "description": "Caixa metálica hexagonal escura com filigranas que vertem secreção violeta luminescente constante.",
      "canon_status": "in_world_report",
      "sources": [
        "Dossiê Operação Belvedere A.E.G.I.S."
      ]
    }
  ],
  "timeline": [
    {
      "id": "time_antiguidade",
      "year": "Antiguidade Remota",
      "chronological_year": 0,
      "era_badge": "Gênese Primordial",
      "title": "O Primeiro Cruzamento da Fenda // Gênese do Primogênito",
      "location": "Oceano Atlântico Norte / Fenda Temporal",
      "category": "Gênese Dimensional",
      "campaign_id": "camp_001",
      "threat_stars": 5,
      "threat_level": "Nível 5 - Cataclísmico",
      "status": "(Futura Campanha)",
      "canon_status": "open_mystery",
      "sources": [
        "Manuscrito da Incursão (Autor)"
      ],
      "description": "Segundo manuscritos do Triângulo, o primeiro ser humano adentra a anomalia marítima e aprende a moldar leis físicas locais. A data e a identidade objetiva permanecem sem confirmação científica.",
      "is_future": true
    },
    {
      "id": "time_sec_xvi",
      "year": "Século XVI (~1542-1620)",
      "chronological_year": 1542,
      "era_badge": "Era dos Navegadores",
      "title": "Náufrago Humano e a Sociedade Sauriana // O Mar das Rosas",
      "location": "Oceano Atlântico Norte (Triângulo das Bermudas)",
      "category": "Contato Antropológico Anômalo",
      "campaign_id": "camp_001",
      "threat_stars": 4,
      "threat_level": "Nível 4 - Crítico",
      "status": "(Futura Campanha)",
      "canon_status": "in_world_report",
      "sources": [
        "Diários de Bordo Espanhóis e Portugueses"
      ],
      "description": "Diários de caravelas relatam manchas de mar azul escuro com rosas flutuantes no Atlântico e a chegada de um humano que ensinou ritos canibais à sociedade reptiliana do Arquipélago dos Ossos.",
      "is_future": true
    },
    {
      "id": "time_1892_vilar",
      "year": "Ano 1892",
      "chronological_year": 1892,
      "era_badge": "Revolução Mineral",
      "title": "Fundação do Consórcio Mineral Vilar",
      "location": "San Lorenzo (México)",
      "category": "Fundação Histórica",
      "campaign_id": "camp_002",
      "threat_stars": 3,
      "threat_level": "Nível 3 - Severo",
      "status": "Documento Cartorial",
      "canon_status": "confirmed",
      "sources": [
        "Cartório de San Lorenzo",
        "Ministério da Mineração"
      ],
      "description": "A família Vilar inicia a perfuração de minas profundas de prata em San Lorenzo, perfurando acidentalmente galerias onde Ecos Subterrâneos repousavam dormentes."
    },
    {
      "id": "time_1968_aegis",
      "year": "Ano 1968",
      "chronological_year": 1968,
      "era_badge": "Pós-Guerra Fria",
      "title": "Fundação Notarial da A.E.G.I.S. em Genebra",
      "location": "Genebra (Suíça)",
      "category": "Institucional",
      "campaign_id": "camp_filantropo_oeht",
      "threat_stars": 2,
      "threat_level": "Nível 2 - Moderado",
      "status": "Institucional",
      "canon_status": "confirmed",
      "sources": [
        "Registro Notarial de Genebra 1968"
      ],
      "description": "Registrada formalmente na Suíça a Fundação A.E.G.I.S. / C.R.I.S. para monitorar vazamentos anômalos da Guerra Fria e catalogar incursões pelo planeta."
    },
    {
      "id": "time_01",
      "year": "Ano 2023 (-3) [Variante Out/2021]",
      "chronological_year": 2023.5,
      "era_badge": "Incidente das Minas (2021/2023)",
      "title": "O Desaparecimento nas Minas",
      "location": "Mansão Vilar & Minas (México)",
      "category": "Incidente Inicial",
      "campaign_id": "camp_002",
      "threat_level": "Nível 3 - Severo",
      "threat_stars": 3,
      "status": "Investigação Suspensa",
      "survivors": "Lucas Vilar (Isolado no subterrâneo)",
      "casualties": "Nenhuma confirmada (Desaparecimento arquivado)",
      "characters": [
        "char_lucas",
        "char_gabriel",
        "char_rafael",
        "char_helena",
        "char_diego",
        "char_bia",
        "char_arthur"
      ],
      "canon_status": "disputed",
      "sources": [
        "Dossiê Até o Amanhecer (2021) vs. Linha Tática (-3 anos de 2026)"
      ],
      "description": "Durante uma expedição juvenil de amigos nas proximidades da Mansão Vilar no México, Lucas Vilar entra nos túneis abandonados da ferrovia e desaparece na escuridão. O grupo esconde segredos da noite."
    },
    {
      "id": "time_02",
      "year": "Ano 2024 (-2)",
      "chronological_year": 2024,
      "era_badge": "Engenharia Dimensional (2024)",
      "title": "Nascimento do Projeto LIMIAR",
      "location": "O Casarão Vilar (México)",
      "category": "Investigação & Engenharia Oculta",
      "campaign_id": "camp_002",
      "threat_level": "Nível 3 - Severo",
      "threat_stars": 3,
      "status": "Concluído",
      "survivors": "Gabriel Vilar",
      "casualties": "Nenhuma direta",
      "characters": [
        "char_gabriel"
      ],
      "canon_status": "confirmed",
      "sources": [
        "Esquemas Técnicos Gabriel Vilar"
      ],
      "description": "Recusando-se a aceitar a perda do irmão, Gabriel Vilar tranca-se no casarão. Ele descobre fontes de energia anômala nas rochas da serra e inicia a construção da arma de portais dimensionais: o LIMIAR."
    },
    {
      "id": "time_03",
      "year": "Ano 2025 (-1)",
      "chronological_year": 2025,
      "era_badge": "Ruptura Abissal (2025)",
      "title": "A Ruptura do Triângulo das Bermudas",
      "location": "Oceano Atlântico Norte",
      "category": "Cataclismo Anômalo",
      "campaign_id": "camp_001",
      "threat_level": "Nível 5 - Cataclísmico",
      "threat_stars": 5,
      "status": "(Futura Campanha)",
      "survivors": "Arquiteto do Caos (Transcendido 99% MDA)",
      "casualties": "Flotilha costeira e tripulações civis",
      "characters": [
        "char_arquiteto"
      ],
      "canon_status": "confirmed",
      "sources": [
        "Manuscrito da Incursão",
        "Dossiê A.E.G.I.S."
      ],
      "description": "No Oceano Atlântico, experimentos com bio-ressonância culminam na ascensão do Arquiteto do Caos (99% MDA). Um buraco de minhoca abre-se no mar, engolindo flotilhas, aviões e submarinos, criando a anomalia permanente do Triângulo.",
      "is_future": true
    },
    {
      "id": "time_04",
      "year": "Ano 2026 (Ano 0) [Variante Out/2024]",
      "chronological_year": 2026,
      "era_badge": "Clímax da Mansão Vilar (2024/2026)",
      "title": "A Noite da Confissão & O Resgate",
      "location": "Mansão Vilar & Minas (México)",
      "category": "Clímax de Campanha",
      "campaign_id": "camp_002",
      "threat_level": "Nível 4 - Crítico",
      "threat_stars": 4,
      "status": "Concluído com Sobreviventes",
      "survivors": "Lucas Vilar, Gabriel Vilar, Rafael Montes, Helena Castro, Diego Ramos, Bia Albuquerque, Arthur Valente, Júlia Drummond",
      "casualties": "Criaturas das Minas exterminadas",
      "characters": [
        "char_lucas",
        "char_gabriel",
        "char_rafael",
        "char_helena",
        "char_diego",
        "char_bia",
        "char_arthur",
        "char_julia"
      ],
      "canon_status": "confirmed",
      "sources": [
        "Roteiro de Até o Amanhecer",
        "Relatório San Lorenzo A.E.G.I.S."
      ],
      "description": "Gabriel atrai os antigos amigos de volta com bilhetes de trem anônimos. Sob a máscara de Davi Reis e empunhando o LIMIAR, força as confissões. No subsolo, enfrentam os Ecos e resgatam Lucas com vida após anos de sobrevivência."
    },
    {
      "id": "time_05",
      "year": "Ano 2026 (Presente)",
      "chronological_year": 2026.3,
      "era_badge": "Guerra do Triângulo (Presente)",
      "title": "A Incursão de Nova Caronte",
      "location": "Cidadela Flutuante (Triângulo das Bermudas)",
      "category": "Campanha Ativa",
      "campaign_id": "camp_001",
      "threat_level": "Nível 5 - Cataclísmico",
      "threat_stars": 5,
      "status": "(Futura Campanha)",
      "survivors": "Sargento Miller, Dra. Evelyn Reed, civis de Nova Caronte",
      "casualties": "Baixas contínuas na carcaça do cargueiro",
      "characters": [
        "char_miller",
        "char_evelyn",
        "char_arquiteto"
      ],
      "canon_status": "confirmed",
      "sources": [
        "Manuscrito da Incursão (Autor)"
      ],
      "description": "O navio de 5.000 almas é tragado pela fenda no Atlântico. Os sobreviventes fundam a cidadela caótica de Nova Caronte, onde precisam lidar com mutações forçadas, os ataques do Mímico e as profecias do Arquiteto do Caos.",
      "is_future": true
    },
    {
      "id": "time_oeht_belvedere",
      "year": "Ano 2026 [Data Reservada]",
      "chronological_year": 2026.7,
      "era_badge": "Conspiração Corporativa (2026)",
      "title": "A Gala da Meia-Noite // Operação Belvedere",
      "location": "Mansão Belvedere (Europa Central)",
      "category": "Infiltração Tática A.E.G.I.S.",
      "campaign_id": "camp_filantropo_oeht",
      "threat_stars": 4,
      "threat_level": "Nível 4 - Crítico",
      "status": "Sob Quarentena Tática // Registro Parcial",
      "canon_status": "in_world_report",
      "sources": [
        "Briefing Kaelen",
        "Transcrição de Infiltração A.E.G.I.S."
      ],
      "characters": [
        "char_oeht",
        "char_kaelen"
      ],
      "description": "Operação de infiltração da A.E.G.I.S. sob direção de Kaelen para conter a ativação da relíquia parasita durante a gala de magnatas organizada pelo bilionário Oeht."
    },
    {
      "id": "time_bel_01",
      "year": "2026",
      "date": "Ano 2026",
      "title": "Operação Belvedere // A Gala de Oeht",
      "location": "Genebra, Suíça",
      "description": "A.E.G.I.S. intercepta planos de Oeht para mercantilização do paranormal na Mansão Belvedere.",
      "threat_stars": 4,
      "status": "(Futura Campanha)",
      "campaign_id": "camp_filantropo_oeht",
      "is_future": true
    }
  ],
  "battlemap_tokens": [
    {
      "id": "tok_lucas",
      "character_id": "char_lucas",
      "name": "Lucas Vilar",
      "role": "Sobrevivente Marcado",
      "map_id": "map_vilar",
      "initial_coords": [
        21.84,
        -102.26
      ],
      "svg_x": 720,
      "svg_y": 510,
      "color": "#00e5ff",
      "icon": "👤",
      "pd": 12,
      "max_pd": 20,
      "mda": 25,
      "has_armor": false,
      "vision_radius": 60,
      "conditions": [
        "Hipersensibilidade Auditiva",
        "Cego"
      ]
    },
    {
      "id": "tok_gabriel",
      "character_id": "char_gabriel",
      "name": "Gabriel Vilar (Mascarado)",
      "role": "Especialista Oculto",
      "map_id": "map_vilar",
      "initial_coords": [
        21.88,
        -102.19
      ],
      "svg_x": 1360,
      "svg_y": 810,
      "color": "#ffd700",
      "icon": "🎭",
      "pd": 24,
      "max_pd": 24,
      "mda": 15,
      "has_armor": true,
      "vision_radius": 80,
      "conditions": [
        "Portador do LIMIAR",
        "Determinado"
      ]
    },
    {
      "id": "tok_rafael",
      "character_id": "char_rafael",
      "name": "Rafael Moreira",
      "role": "Combatente Líder",
      "map_id": "map_vilar",
      "initial_coords": [
        21.87,
        -102.21
      ],
      "svg_x": 980,
      "svg_y": 320,
      "color": "#e74c3c",
      "icon": "⚔️",
      "pd": 28,
      "max_pd": 30,
      "mda": 8,
      "has_armor": true,
      "vision_radius": 75,
      "conditions": [
        "Postura Ofensiva"
      ]
    },
    {
      "id": "tok_julia",
      "character_id": "char_julia",
      "name": "Júlia",
      "role": "Investigadora Ocultista",
      "map_id": "map_vilar",
      "initial_coords": [
        21.85,
        -102.24
      ],
      "svg_x": 840,
      "svg_y": 480,
      "color": "#9c27b0",
      "icon": "🔮",
      "pd": 22,
      "max_pd": 22,
      "mda": 10,
      "has_armor": false,
      "vision_radius": 70,
      "conditions": [
        "Variável Imprevista"
      ]
    },
    {
      "id": "tok_eco",
      "character_id": "creature_eco",
      "name": "Eco Alfa",
      "role": "Criatura das Minas",
      "map_id": "map_vilar",
      "initial_coords": [
        21.82,
        -102.29
      ],
      "svg_x": 220,
      "svg_y": 720,
      "color": "#39ff14",
      "icon": "👾",
      "pd": 18,
      "max_pd": 18,
      "mda": 45,
      "has_armor": false,
      "vision_radius": 45,
      "conditions": [
        "Ecolocalização Ativa"
      ]
    },
    {
      "id": "tok_arquiteto",
      "character_id": "char_arquiteto",
      "name": "O Arquiteto do Caos",
      "role": "Primogênito",
      "map_id": "map_triangulo",
      "initial_coords": [
        25.2,
        -72
      ],
      "svg_x": 780,
      "svg_y": 420,
      "color": "#00e5ff",
      "icon": "👁️",
      "pd": 100,
      "max_pd": 100,
      "mda": 99,
      "has_armor": false,
      "vision_radius": 120,
      "conditions": [
        "Hackeando a Realidade",
        "Aura Congelante"
      ]
    },
    {
      "id": "tok_kraken",
      "character_id": "creature_kraken",
      "name": "Tentáculo Colossal",
      "role": "Colosso Abissal",
      "map_id": "map_triangulo",
      "initial_coords": [
        23.8,
        -69.5
      ],
      "svg_x": 1080,
      "svg_y": 520,
      "color": "#e91e63",
      "icon": "🐙",
      "pd": 80,
      "max_pd": 80,
      "mda": 95,
      "has_armor": true,
      "vision_radius": 90,
      "conditions": [
        "Couraça Basáltica"
      ]
    },
    {
      "id": "tok_evelyn",
      "character_id": "char_evelyn",
      "name": "Dra. Evelyn Shaw",
      "role": "Especialista em Genética",
      "map_id": "map_artico",
      "initial_coords": [
        72.16,
        -40.18
      ],
      "svg_x": 480,
      "svg_y": 320,
      "color": "#00e5ff",
      "icon": "🧬",
      "pd": 16,
      "max_pd": 20,
      "mda": 22,
      "has_armor": false,
      "vision_radius": 60,
      "conditions": [
        "Quarentena Nível 4"
      ]
    },
    {
      "id": "tok_miller",
      "character_id": "char_miller",
      "name": "Comandante Miller",
      "role": "Combatente Tático",
      "map_id": "map_artico",
      "initial_coords": [
        72.14,
        -40.22
      ],
      "svg_x": 620,
      "svg_y": 420,
      "color": "#ff2a4b",
      "icon": "🛡️",
      "pd": 22,
      "max_pd": 22,
      "mda": 12,
      "has_armor": true,
      "vision_radius": 75,
      "conditions": [
        "Exoesqueleto Ativo"
      ]
    },
    {
      "id": "tok_parasita",
      "character_id": "creature_leviathan",
      "name": "Parasita Glacial Primordial",
      "role": "Aberração Criogênica",
      "map_id": "map_artico",
      "initial_coords": [
        71.86,
        -39.82
      ],
      "svg_x": 1050,
      "svg_y": 550,
      "color": "#b432ff",
      "icon": "❄️",
      "pd": 38,
      "max_pd": 38,
      "mda": 88,
      "has_armor": true,
      "vision_radius": 95,
      "conditions": [
        "Criogênico",
        "Espinhos de Gelo"
      ]
    }
  ],
  "relations_graph": {
    "nodes": [
      {
        "id": "camp_001",
        "label": "A Incursão (Bermudas)",
        "type": "campaign",
        "color": "#00e5ff",
        "radius": 26
      },
      {
        "id": "camp_002",
        "label": "Mansão Vilar (México)",
        "type": "campaign",
        "color": "#ffd700",
        "radius": 26
      },
      {
        "id": "char_lucas",
        "label": "Lucas Vilar",
        "type": "character",
        "campaign_id": "camp_002",
        "color": "#ffd700",
        "radius": 18
      },
      {
        "id": "char_gabriel",
        "label": "Gabriel Vilar",
        "type": "character",
        "campaign_id": "camp_002",
        "color": "#ffd700",
        "radius": 18
      },
      {
        "id": "char_rafael",
        "label": "Rafael Montes",
        "type": "character",
        "campaign_id": "camp_002",
        "color": "#ffd700",
        "radius": 16
      },
      {
        "id": "char_julia",
        "label": "Júlia Prado",
        "type": "character",
        "campaign_id": "camp_002",
        "color": "#ffd700",
        "radius": 16
      },
      {
        "id": "char_arquiteto",
        "label": "O Arquiteto",
        "type": "character",
        "campaign_id": "camp_001",
        "color": "#e74c3c",
        "radius": 20
      },
      {
        "id": "rel_limiar",
        "label": "O LIMIAR",
        "type": "relic",
        "color": "#f39c12",
        "radius": 15
      },
      {
        "id": "rel_nucleo_abismo",
        "label": "Núcleo do Abismo",
        "type": "relic",
        "color": "#e74c3c",
        "radius": 15
      },
      {
        "id": "rel_esporo_dourado",
        "label": "Quartzo Negro",
        "type": "relic",
        "color": "#27ae60",
        "radius": 15
      },
      {
        "id": "rel_manuscrito_friburgo",
        "label": "Códice Sem-Rosto",
        "type": "relic",
        "color": "#8e44ad",
        "radius": 15
      },
      {
        "id": "rel_lanterna_criogenica",
        "label": "Lanterna de Éter",
        "type": "relic",
        "color": "#3498db",
        "radius": 15
      },
      {
        "id": "cri_ecos",
        "label": "Ecos das Minas",
        "type": "threat",
        "color": "#ff4444",
        "radius": 15
      },
      {
        "id": "cri_mimico",
        "label": "O Mímico",
        "type": "threat",
        "color": "#ff4444",
        "radius": 15
      },
      {
        "id": "cri_polimorfo",
        "label": "Polimorfo Glacial",
        "type": "threat",
        "color": "#ff4444",
        "radius": 15
      },
      {
        "id": "cri_esporos",
        "label": "Parasita Floral",
        "type": "threat",
        "color": "#ff4444",
        "radius": 15
      },
      {
        "id": "cri_sem_rosto",
        "label": "Culto Sem-Rosto",
        "type": "threat",
        "color": "#ff4444",
        "radius": 15
      },
      {
        "id": "camp_filantropo_oeht",
        "label": "Gala Belvedere (Suíça)",
        "type": "campaign",
        "color": "#a855f7",
        "radius": 26
      },
      {
        "id": "char_oeht",
        "label": "Theo Oeht",
        "type": "character",
        "campaign_id": "camp_filantropo_oeht",
        "color": "#a855f7",
        "radius": 18
      },
      {
        "id": "char_kaelen",
        "label": "Diretor Kaelen",
        "type": "character",
        "campaign_id": "camp_filantropo_oeht",
        "color": "#00e5ff",
        "radius": 18
      }
    ],
    "links": [
      {
        "source": "camp_002",
        "target": "char_lucas",
        "label": "Protagonista Sobrevivente"
      },
      {
        "source": "camp_002",
        "target": "char_gabriel",
        "label": "Engenheiro Ocultista"
      },
      {
        "source": "camp_002",
        "target": "char_rafael",
        "label": "Investigador"
      },
      {
        "source": "camp_002",
        "target": "char_julia",
        "label": "Investigadora"
      },
      {
        "source": "char_gabriel",
        "target": "char_lucas",
        "label": "Irmãos / Obsessão de Resgate"
      },
      {
        "source": "char_gabriel",
        "target": "rel_limiar",
        "label": "Criador & Disparador"
      },
      {
        "source": "char_lucas",
        "target": "cri_ecos",
        "label": "Sobreviveu 3 Anos Cego"
      },
      {
        "source": "char_rafael",
        "target": "char_lucas",
        "label": "Culpa do Desaparecimento"
      },
      {
        "source": "char_julia",
        "target": "char_gabriel",
        "label": "Desmascarou o Justiceiro"
      },
      {
        "source": "camp_001",
        "target": "char_arquiteto",
        "label": "Entidade Primordial"
      },
      {
        "source": "char_arquiteto",
        "target": "rel_nucleo_abismo",
        "label": "Canalizador da Fenda"
      },
      {
        "source": "camp_001",
        "target": "cri_mimico",
        "label": "Ameaça Infiltrada"
      },
      {
        "source": "camp_filantropo_oeht",
        "target": "char_oeht",
        "label": "Anfitrião da Gala"
      },
      {
        "source": "camp_filantropo_oeht",
        "target": "char_kaelen",
        "label": "Diretor de Infiltração"
      },
      {
        "source": "char_kaelen",
        "target": "char_oeht",
        "label": "Investigação Tática A.E.G.I.S."
      },
      {
        "source": "char_kaelen",
        "target": "camp_001",
        "label": "Monitoramento de Contenção"
      },
      {
        "source": "char_kaelen",
        "target": "camp_002",
        "label": "Relatório San Lorenzo"
      },
      {
        "source": "camp_001",
        "target": "cri_ecos",
        "label": "Ressonância Biológica"
      },
      {
        "source": "char_lucas",
        "target": "rel_limiar",
        "label": "Resgatado pela Fenda"
      },
      {
        "source": "char_rafael",
        "target": "char_gabriel",
        "label": "Confronto na Mansão"
      },
      {
        "source": "char_oeht",
        "target": "rel_nucleo_abismo",
        "label": "Tentativa de Compra Clandestina"
      }
    ]
  },
  "schema_version": "3.0.0-museum",
  "last_updated": "2026-11-01",
  "planet": {
    "id": "planet_evren",
    "name": "Planeta Evren",
    "subtitle": "Museu Histórico e Atlas Geográfico Planetário",
    "classification": "Planeta Físico Terrestre Único",
    "description": "Um planeta físico coerente, dotado de continentes, oceanos profundos, cadeias montanhosas, bacias fluviais, florestas densas, desertos e regiões ainda não documentadas. Cada coordenada preserva a memória das campanhas históricas que moldaram o destino de suas regiões.",
    "oceans": [
      {
        "id": "ocean_atlantico_norte",
        "name": "Oceano Atlântico Setentrional",
        "coordinates": [
          28,
          -45
        ],
        "depth_max": "8.486m (Fosso Abissal)",
        "description": "Bacia oceânica que banha a América do Norte, Europa e o Arquipélago das Bermudas, palco da expedição de Nova Caronte."
      },
      {
        "id": "ocean_atlantico_sul",
        "name": "Oceano Atlântico Meridional",
        "coordinates": [
          -22,
          -25
        ],
        "depth_max": "7.235m",
        "description": "Águas austrais que conectam a costa sul-americana ao continente africano."
      },
      {
        "id": "ocean_pacifico",
        "name": "Grande Oceano Pacífico",
        "coordinates": [
          4,
          -135
        ],
        "depth_max": "10.911m",
        "description": "A maior extensão marítima do planeta, margeando a costa ocidental das Américas."
      },
      {
        "id": "ocean_artico",
        "name": "Mar Glacial Ártico",
        "coordinates": [
          78,
          -20
        ],
        "depth_max": "5.450m",
        "description": "Oceano coberto por banquisas permanentes que cerca a Calota Polar da Groenlândia."
      },
      {
        "id": "ocean_indico",
        "name": "Oceano Índico",
        "coordinates": [
          -20,
          75
        ],
        "depth_max": "7.258m",
        "description": "Massa oceânica meridional entre a África, Ásia e Austrália."
      }
    ],
    "mountain_ranges": [
      {
        "id": "mtn_sierra_madre",
        "name": "Serra Madre & Cordilheira Mineradora",
        "continent_id": "cont_america_norte",
        "country_id": "country_mexico",
        "coordinates": [
          21.85,
          -102.25
        ],
        "elevation": "3.120m",
        "description": "Cadeia montanhosa rica em veios de prata e quartzo onde foi erguida a Mansão Vilar."
      },
      {
        "id": "mtn_alpes_schwarzwald",
        "name": "Maciço da Floresta Negra (Schwarzwald)",
        "continent_id": "cont_europa",
        "country_id": "country_alemanha",
        "coordinates": [
          48.15,
          8.2
        ],
        "elevation": "1.493m",
        "description": "Formação montanhosa densamente arborizada no sudoeste da Alemanha, sede do Monastério de Santo Agostinho."
      },
      {
        "id": "mtn_inuit_glacial",
        "name": "Cordilheira Glacial Inlandsis",
        "continent_id": "cont_artico",
        "country_id": "country_groenlandia",
        "coordinates": [
          72,
          -40
        ],
        "elevation": "3.230m",
        "description": "Espinha dorsal de gelo milenar e rocha basáltica no coração da Groenlândia."
      },
      {
        "id": "mtn_andes",
        "name": "Cordilheira dos Andes",
        "continent_id": "cont_america_sul",
        "country_id": null,
        "coordinates": [
          -16,
          -68
        ],
        "elevation": "6.961m",
        "description": "Extensa cadeia montanhosa ocidental da América do Sul, cujas vertentes alimentam a Bacia Amazônica."
      },
      {
        "id": "mtn_himalaia",
        "name": "Cordilheira do Himalaia",
        "continent_id": "cont_africa_asia_oceania",
        "country_id": null,
        "coordinates": [
          28.5,
          84
        ],
        "elevation": "8.848m",
        "description": "Cadeia montanhosa asiática (Região ainda não documentada com campanhas no acervo)."
      }
    ],
    "forests": [
      {
        "id": "for_amazonia",
        "name": "Floresta Amazônica & Vale do Tapajós",
        "continent_id": "cont_america_sul",
        "country_id": "country_brasil",
        "coordinates": [
          -4.25,
          -55.98
        ],
        "area_km2": "5.500.000 km²",
        "description": "A maior floresta tropical pluvial do planeta, cenário da operação histórica Protocolo Selva."
      },
      {
        "id": "for_floresta_negra",
        "name": "Floresta Negra (Schwarzwald)",
        "continent_id": "cont_europa",
        "country_id": "country_alemanha",
        "coordinates": [
          48.15,
          8.2
        ],
        "area_km2": "6.009 km²",
        "description": "Floresta fechada de coníferas escuras e neblina perene onde ocorreu o incidente do Monastério dos Sem-Rosto."
      },
      {
        "id": "for_serra_pinheiros",
        "name": "Bosque Nebuloso da Serra Mexicana",
        "continent_id": "cont_america_norte",
        "country_id": "country_mexico",
        "coordinates": [
          21.88,
          -102.22
        ],
        "area_km2": "1.450 km²",
        "description": "Cinturão de pinheiros e carvalhos de altitude que isola a propriedade da família Vilar."
      }
    ],
    "rivers_lakes": [
      {
        "id": "riv_tapajos",
        "name": "Rio Tapajós & Afluentes Amazônicos",
        "continent_id": "cont_america_sul",
        "country_id": "country_brasil",
        "coordinates": [
          -4.22,
          -55.95
        ],
        "description": "Importante via hidrográfica de águas escuras que serviu de eixo para a expedição científica de 2025."
      },
      {
        "id": "riv_reno_schwarzwald",
        "name": "Vale Superior do Rio Reno",
        "continent_id": "cont_europa",
        "country_id": "country_alemanha",
        "coordinates": [
          48.1,
          7.95
        ],
        "description": "Bacia fluvial que contorna as encostas ocidentais da Floresta Negra."
      },
      {
        "id": "riv_aquifero_vilar",
        "name": "Aquífero Subterrâneo das Minas Vilar",
        "continent_id": "cont_america_norte",
        "country_id": "country_mexico",
        "coordinates": [
          21.82,
          -102.3
        ],
        "description": "Rede de galerias inundadas abaixo da Serra Mineradora do México."
      }
    ],
    "deserts": [
      {
        "id": "des_planalto_norte",
        "name": "Deserto Árido do Planalto Norte",
        "continent_id": "cont_america_norte",
        "country_id": "country_mexico",
        "coordinates": [
          25.5,
          -103.5
        ],
        "description": "Extensão semiárida ao norte da Serra Mineradora mexicana."
      },
      {
        "id": "des_saara",
        "name": "Grande Deserto do Saara",
        "continent_id": "cont_africa_asia_oceania",
        "country_id": null,
        "coordinates": [
          23,
          13
        ],
        "description": "Região desértica norte-africana (Área geográfica mapeada, ainda não documentada com campanhas)."
      }
    ],
    "undocumented_zones": [
      {
        "id": "undoc_siberia",
        "name": "Planalto Boreal Siberiano",
        "coordinates": [
          63,
          102
        ],
        "status": "Não Documentada",
        "note": "Território físico mapeado, sem expedições ou campanhas registradas até o momento."
      },
      {
        "id": "undoc_interior_africano",
        "name": "Bacia Interior Equatorial",
        "coordinates": [
          2,
          22
        ],
        "status": "Não Documentada",
        "note": "Território físico mapeado, aguardando registros históricos futuros."
      },
      {
        "id": "undoc_outback",
        "name": "Deserto Australiano Central",
        "coordinates": [
          -24,
          134
        ],
        "status": "Não Documentada",
        "note": "Território físico mapeado, sem registros históricos catalogados."
      }
    ]
  },
  "continents": [
    {
      "id": "cont_america_norte",
      "name": "América do Norte & Central",
      "coordinates": [
        23.5,
        -101
      ],
      "zoom_level": 2,
      "countries": [
        "country_mexico"
      ],
      "campaigns": [
        "camp_002"
      ],
      "summary": "Continente marcado pelas serras mineradoras históricas do México, onde se desenrolou a tragédia e o resgate na Mansão Vilar em 2024."
    },
    {
      "id": "cont_america_sul",
      "name": "América do Sul",
      "coordinates": [
        -10,
        -56
      ],
      "zoom_level": 2,
      "countries": [
        "country_brasil"
      ],
      "campaigns": [
        "camp_004"
      ],
      "summary": "Continente dominado pela Bacia Amazônica e pelo Rio Tapajós, cenário da expedição científica e militar 'Protocolo Selva' em 2025."
    },
    {
      "id": "cont_europa",
      "name": "Europa",
      "coordinates": [
        48.5,
        9
      ],
      "zoom_level": 2,
      "countries": [
        "country_alemanha"
      ],
      "campaigns": [
        "camp_005"
      ],
      "summary": "Berço de antigas fundações monásticas e arquivos históricos, onde ocorreu a investigação de 2023 na Floresta Negra (Baden-Württemberg)."
    },
    {
      "id": "cont_artico",
      "name": "Região Polar Ártica",
      "coordinates": [
        72,
        -40
      ],
      "zoom_level": 2,
      "countries": [
        "country_groenlandia"
      ],
      "campaigns": [
        "camp_003"
      ],
      "summary": "Fronteira extrema de gelo perpétuo na Groenlândia, onde a Fundação A.E.G.I.S. mantém a Estação Criogênica Zero desde 2026."
    },
    {
      "id": "cont_atlantico",
      "name": "Bacia do Atlântico Norte",
      "coordinates": [
        25.5,
        -71.5
      ],
      "zoom_level": 2,
      "countries": [
        "country_atlantico_bermudas"
      ],
      "campaigns": [
        "camp_001"
      ],
      "summary": "Região oceânica e arquipélago isolado entre a Flórida, Bermudas e Porto Rico, onde naufrágios históricos convergiram para Nova Caronte."
    },
    {
      "id": "cont_africa_asia_oceania",
      "name": "África, Ásia & Oceania (Territórios Não Documentados)",
      "coordinates": [
        20,
        65
      ],
      "zoom_level": 2,
      "countries": [],
      "campaigns": [],
      "summary": "Continentes físicos presentes na cartografia planetária de Evren cujos arquivos de campanhas ainda não foram abertos ou permanecem pendentes de documentação."
    }
  ],
  "countries": [
    {
      "id": "country_mexico",
      "name": "México",
      "geojson_name": "Mexico",
      "continent_id": "cont_america_norte",
      "coordinates": [
        21.85,
        -102.25
      ],
      "regions": [
        "reg_serra_mineradora"
      ],
      "campaigns": [
        "camp_002"
      ],
      "historical_summary": "País norte-americano cuja região serrana abrigou o complexo minerador da família Vilar e os acontecimentos de 'Até o Amanhecer' (2021–2024)."
    },
    {
      "id": "country_brasil",
      "name": "Brasil",
      "geojson_name": "Brazil",
      "continent_id": "cont_america_sul",
      "coordinates": [
        -4.25,
        -55.98
      ],
      "regions": [
        "reg_bacia_tapajos"
      ],
      "campaigns": [
        "camp_004"
      ],
      "historical_summary": "Nação sul-americana onde uma expedição conjunta investigou o garimpo abandonado e a Cratera de Quartzo Negro no Rio Tapajós em 2025."
    },
    {
      "id": "country_alemanha",
      "name": "Alemanha",
      "geojson_name": "Germany",
      "continent_id": "cont_europa",
      "coordinates": [
        48.15,
        8.2
      ],
      "regions": [
        "reg_floresta_negra"
      ],
      "campaigns": [
        "camp_005"
      ],
      "historical_summary": "País europeu onde investigadores registraram um dos primeiros casos modernos documentados do arquivo em 2023, no Monastério de Santo Agostinho."
    },
    {
      "id": "country_groenlandia",
      "name": "Groenlândia",
      "geojson_name": "Greenland",
      "continent_id": "cont_artico",
      "coordinates": [
        72,
        -40
      ],
      "regions": [
        "reg_calota_artica"
      ],
      "campaigns": [
        "camp_003"
      ],
      "historical_summary": "Território ártico autónomo coberto pela calota polar, sede das escavações profundas da Estação Criogênica Zero em 2026."
    },
    {
      "id": "country_atlantico_bermudas",
      "name": "Região Marítima do Triângulo das Bermudas",
      "geojson_name": "Bermuda Triangle",
      "continent_id": "cont_atlantico",
      "coordinates": [
        25.5,
        -71.5
      ],
      "regions": [
        "reg_fossa_caronte"
      ],
      "campaigns": [
        "camp_001"
      ],
      "historical_summary": "Zona marítima internacional e formação insular isolada no Atlântico Norte, palco da campanha em andamento 'A Incursão: O Purgatório Genético'."
    }
  ],
  "regions": [
    {
      "id": "reg_serra_mineradora",
      "name": "Serra Mineradora Central",
      "country_id": "country_mexico",
      "continent_id": "cont_america_norte",
      "coordinates": [
        21.85,
        -102.25
      ],
      "biome": "Montanhas Rochosas & Bosque Nebuloso de Altitude",
      "cities": [
        "city_san_lorenzo_vilar"
      ],
      "locations": [
        "loc_vilar",
        "loc_vilar_casarao",
        "loc_vilar_minas"
      ],
      "campaigns": [
        "camp_002"
      ],
      "description": "Região montanhosa de difícil acesso no interior do México, historicamente explorada pela extração de prata e quartzo profundo."
    },
    {
      "id": "reg_bacia_tapajos",
      "name": "Bacia do Rio Tapajós (Amazônia)",
      "country_id": "country_brasil",
      "continent_id": "cont_america_sul",
      "coordinates": [
        -4.25,
        -55.98
      ],
      "biome": "Floresta Tropical Pluvial Densa & Várzea Fluvial",
      "cities": [
        "city_itaituba_tapajos"
      ],
      "locations": [
        "loc_tapajos",
        "loc_quartzo"
      ],
      "campaigns": [
        "camp_004"
      ],
      "description": "Região hidrográfica amazônica cercada por selva primária fechada, onde afloramentos geológicos anômalos contaminaram o subsolo."
    },
    {
      "id": "reg_floresta_negra",
      "name": "Floresta Negra (Baden-Württemberg)",
      "country_id": "country_alemanha",
      "continent_id": "cont_europa",
      "coordinates": [
        48.15,
        8.2
      ],
      "biome": "Floresta Temperada Densa de Coníferas & Vales Alpinos",
      "cities": [
        "city_friburgo_agostinho"
      ],
      "locations": [
        "loc_monasterio",
        "loc_cripta"
      ],
      "campaigns": [
        "camp_005"
      ],
      "description": "Cordilheira florestal histórica no sudoeste alemão, conhecida por seus vales profundos, nevoeiros constantes e arquitetura monástica medieval."
    },
    {
      "id": "reg_calota_artica",
      "name": "Calota Polar Ártica (Setor Inlandsis)",
      "country_id": "country_groenlandia",
      "continent_id": "cont_artico",
      "coordinates": [
        72,
        -40
      ],
      "biome": "Deserto Polar de Gelo Perpétuo & Fendas Glaciais",
      "cities": [
        "city_outpost_zero"
      ],
      "locations": [
        "loc_estacao_zero",
        "loc_monolito_gelo"
      ],
      "campaigns": [
        "camp_003"
      ],
      "description": "Planalto congelado a mais de 2.500 metros de altitude sobre o nível do mar, onde o degelo revelou formações geológicas e biológicas pré-históricas."
    },
    {
      "id": "reg_fossa_caronte",
      "name": "Arquipélago & Fosso de Nova Caronte",
      "country_id": "country_atlantico_bermudas",
      "continent_id": "cont_atlantico",
      "coordinates": [
        25.5,
        -71.5
      ],
      "biome": "Recifes Abissais, Ilhas Rochosas & Fossa Oceânica",
      "cities": [
        "city_porto_caronte"
      ],
      "locations": [
        "loc_caronte",
        "loc_kraken"
      ],
      "campaigns": [
        "camp_001"
      ],
      "description": "Região marítima isolada no coração do Triângulo das Bermudas, caracterizada por tempestades elétricas severas e fossas abissais."
    }
  ],
  "cities": [
    {
      "id": "city_san_lorenzo_vilar",
      "name": "Distrito da Serra & Propriedade Vilar",
      "region_id": "reg_serra_mineradora",
      "country_id": "country_mexico",
      "continent_id": "cont_america_norte",
      "coordinates": [
        21.85,
        -102.25
      ],
      "population_status": "Desabitado após as detonações de 2024",
      "locations": [
        "loc_vilar",
        "loc_vilar_casarao",
        "loc_vilar_minas"
      ],
      "description": "Antigo núcleo residencial e complexo de mineração erguido pela família Vilar nas encostas da serra mexicana."
    },
    {
      "id": "city_itaituba_tapajos",
      "name": "Entreposto Fluvial do Alto Tapajós",
      "region_id": "reg_bacia_tapajos",
      "country_id": "country_brasil",
      "continent_id": "cont_america_sul",
      "coordinates": [
        -4.22,
        -55.95
      ],
      "population_status": "Sob interdição sanitária e ambiental desde 2025",
      "locations": [
        "loc_tapajos",
        "loc_quartzo"
      ],
      "description": "Assentamento ribeirinho e posto de apoio logístico utilizado por garimpeiros e posteriormente pela força-tarefa científica brasileira."
    },
    {
      "id": "city_friburgo_agostinho",
      "name": "Vale de Santo Agostinho (Arredores de Friburgo)",
      "region_id": "reg_floresta_negra",
      "country_id": "country_alemanha",
      "continent_id": "cont_europa",
      "coordinates": [
        48.15,
        8.2
      ],
      "population_status": "Restrito ao patrimônio histórico sob custódia",
      "locations": [
        "loc_monasterio",
        "loc_cripta"
      ],
      "description": "Vilarejo histórico e complexo abacial do século XIV encravado nas montanhas da Floresta Negra."
    },
    {
      "id": "city_outpost_zero",
      "name": "Perímetro Científico Estação Zero",
      "region_id": "reg_calota_artica",
      "country_id": "country_groenlandia",
      "continent_id": "cont_artico",
      "coordinates": [
        72.15,
        -40.2
      ],
      "population_status": "Guarnição científica e militar em alerta (32 residentes)",
      "locations": [
        "loc_estacao_zero",
        "loc_monolito_gelo"
      ],
      "description": "Base modular pressurizada construída sobre a geleira central da Groenlândia para perfuração criogênica."
    },
    {
      "id": "city_porto_caronte",
      "name": "Colônia de Sobreviventes de Nova Caronte",
      "region_id": "reg_fossa_caronte",
      "country_id": "country_atlantico_bermudas",
      "continent_id": "cont_atlantico",
      "coordinates": [
        25.5,
        -73.2
      ],
      "population_status": "Assentamento de sobreviventes em conflito (Em andamento)",
      "locations": [
        "loc_caronte",
        "loc_kraken"
      ],
      "description": "Reduto costeiro formado por carcaças de embarcações e estruturas de contenção genética no Atlântico Norte."
    }
  ],
  "historical_events": [
    {
      "id": "evt_1348_abadia",
      "date": "Ano 1348 (Século XIV)",
      "year_numeric": 1348,
      "title": "Isolamento Medieval do Monastério de Santo Agostinho",
      "description": "Durante a Peste Negra na Europa, monges beneditinos na Floresta Negra selam a cripta inferior após registrarem o primeiro fenômeno acústico do Sino Sem-Rosto.",
      "campaign_id": "camp_005",
      "continent_id": "cont_europa",
      "country_id": "country_alemanha",
      "region_id": "reg_floresta_negra",
      "location_id": "loc_monasterio",
      "characters_involved": [],
      "consequences": "Os manuscritos originais permanecem ocultos por quase sete séculos na biblioteca abacial.",
      "images": [
        "assets/ref_interior_tavern.jpg"
      ]
    },
    {
      "id": "time_01",
      "date": "Outubro de 2021",
      "year_numeric": 2021,
      "title": "O Desaparecimento de Lucas Vilar nas Minas Mexicanas",
      "description": "Durante uma incursão noturna nas galerias desativadas sob a Mansão Vilar, no México, um desmoronamento separa Lucas Vilar do restante do grupo. Dado como morto, Lucas permanece preso no subsolo.",
      "campaign_id": "camp_002",
      "continent_id": "cont_america_norte",
      "country_id": "country_mexico",
      "region_id": "reg_serra_mineradora",
      "location_id": "loc_vilar_minas",
      "characters_involved": [
        "char_lucas",
        "char_gabriel",
        "char_rafael",
        "char_julia"
      ],
      "consequences": "Fratura emocional no grupo de amigos; início da obsessão científica de Gabriel Vilar.",
      "images": [
        "assets/ref_outdoor_waterfall.jpg"
      ]
    },
    {
      "id": "time_ale_01",
      "date": "Novembro de 2023",
      "year_numeric": 2023,
      "title": "Investigação e Selamento da Abadia de Friburgo (Floresta Negra)",
      "description": "A inspetora Greta Falk e o arquivista Hans Richter adentram o Monastério de Santo Agostinho na Alemanha, decifram os códices de 1348 e destroem o Sino Sem-Rosto na cripta subterrânea.",
      "campaign_id": "camp_005",
      "continent_id": "cont_europa",
      "country_id": "country_alemanha",
      "region_id": "reg_floresta_negra",
      "location_id": "loc_cripta",
      "characters_involved": [
        "char_greta",
        "char_hans"
      ],
      "consequences": "Encerramento da ameaça acústica na Floresta Negra; integração de Hans Richter ao Arquivo Histórico.",
      "images": [
        "assets/ref_interior_tavern.jpg"
      ]
    },
    {
      "id": "time_02",
      "date": "Fevereiro de 2024",
      "year_numeric": 2024,
      "title": "Conclusão do Protótipo LIMIAR no Casarão Vilar",
      "description": "No laboratório oculto da Mansão Vilar, Gabriel Vilar finaliza a montagem da arma de dobras espaciais LIMIAR e grava as fitas cassete do Projeto Limiar.",
      "campaign_id": "camp_002",
      "continent_id": "cont_america_norte",
      "country_id": "country_mexico",
      "region_id": "reg_serra_mineradora",
      "location_id": "loc_vilar_casarao",
      "characters_involved": [
        "char_gabriel"
      ],
      "consequences": "Primeiras distorções espaciais localizadas registradas na Serra Mineradora do México.",
      "images": [
        "assets/ref_interior_tavern.jpg"
      ]
    },
    {
      "id": "time_04",
      "date": "Outubro de 2024",
      "year_numeric": 2024,
      "title": "A Noite da Confissão & O Resgate de Lucas Vilar",
      "description": "Cinco amigos retornam à Mansão Vilar no México. Após sobreviverem aos jogos psicológicos do Mascarado (Gabriel Vilar) e aos Ecos nas minas, Rafael Moreira e Júlia Drummond resgatam Lucas Vilar com vida e detonam o complexo.",
      "campaign_id": "camp_002",
      "continent_id": "cont_america_norte",
      "country_id": "country_mexico",
      "region_id": "reg_serra_mineradora",
      "location_id": "loc_vilar",
      "characters_involved": [
        "char_lucas",
        "char_gabriel",
        "char_rafael",
        "char_julia"
      ],
      "consequences": "Demolição da Mansão Vilar; resgate de Lucas Vilar; desaparecimento de Gabriel Vilar através do LIMIAR.",
      "images": [
        "assets/ref_interior_tavern.jpg"
      ]
    },
    {
      "id": "time_bra_01",
      "date": "Julho de 2025",
      "year_numeric": 2025,
      "title": "Operação Protocolo Selva na Bacia do Rio Tapajós",
      "description": "O Capitão Thiago Santos e a Dra. Camila Neves lideram a expedição na Amazônia brasileira, contendo a propagação do Ouro Negro e cauterizando a Cratera de Quartzo Negro antes que o Rio Tapajós fosse contaminado.",
      "campaign_id": "camp_004",
      "continent_id": "cont_america_sul",
      "country_id": "country_brasil",
      "region_id": "reg_bacia_tapajos",
      "location_id": "loc_quartzo",
      "characters_involved": [
        "char_thiago",
        "char_camila"
      ],
      "consequences": "Preservação da bacia hidrográfica amazônica; quarentena médica da Dra. Camila Neves.",
      "images": [
        "assets/ref_outdoor_waterfall.jpg"
      ]
    },
    {
      "id": "time_03",
      "date": "Dezembro de 2025",
      "year_numeric": 2025,
      "title": "A Tempestade Atlântica & Naufrágio rumo a Nova Caronte",
      "description": "Um navio com milhares de passageiros é tragado por uma perturbação severa no Triângulo das Bermudas, aportando nas costas isoladas de Nova Caronte.",
      "campaign_id": "camp_001",
      "continent_id": "cont_atlantico",
      "country_id": "country_atlantico_bermudas",
      "region_id": "reg_fossa_caronte",
      "location_id": "loc_caronte",
      "characters_involved": [
        "char_arquiteto"
      ],
      "consequences": "Estabelecimento da colônia de sobreviventes em Nova Caronte sob vigilância do Arquiteto do Caos.",
      "images": [
        "assets/ref_fantasy_world_map.jpg"
      ]
    },
    {
      "id": "time_05",
      "date": "Março de 2026",
      "year_numeric": 2026,
      "title": "Confrontos Biológicos em Nova Caronte & Fosso do Kraken",
      "description": "Os sobreviventes do navio enfrentam a mutagênese acelerada (MDA) e as investidas do Soberano Abissal no Fosso do Kraken enquanto buscam estabelecer contato com a A.E.G.I.S.",
      "campaign_id": "camp_001",
      "continent_id": "cont_atlantico",
      "country_id": "country_atlantico_bermudas",
      "region_id": "reg_fossa_caronte",
      "location_id": "loc_kraken",
      "characters_involved": [
        "char_arquiteto"
      ],
      "consequences": "Campanha em andamento no Atlântico Norte.",
      "images": [
        "assets/ref_outdoor_waterfall.jpg"
      ]
    },
    {
      "id": "time_06",
      "date": "Agosto de 2026",
      "year_numeric": 2026,
      "title": "Descida à Fenda do Monólito na Estação Criogênica Zero",
      "description": "Na Calota Polar da Groenlândia, a Dra. Evelyn Shaw e o Comandante Marcus Miller investigam o despertar do parasita glacial junto ao fóssil do Leviatã a 800 metros sob o gelo.",
      "campaign_id": "camp_003",
      "continent_id": "cont_artico",
      "country_id": "country_groenlandia",
      "region_id": "reg_calota_artica",
      "location_id": "loc_estacao_zero",
      "characters_involved": [
        "char_evelyn",
        "char_miller",
        "char_hans"
      ],
      "consequences": "Quarentena polar decretada na Estação Zero; expedição em andamento.",
      "images": [
        "assets/ref_fantasy_world_map.jpg"
      ]
    }
  ],
  "organizations": [
    {
      "id": "org_aegis",
      "name": "Fundação A.E.G.I.S. / C.R.I.S.",
      "type": "Organização Internacional de Pesquisa, Contenção e Registro Histórico",
      "founded": "1968",
      "headquarters": "Genebra / Bases Operacionais Globais",
      "related_campaigns": [
        "camp_001",
        "camp_002",
        "camp_003",
        "camp_004",
        "camp_005"
      ],
      "members": [
        "char_miller",
        "char_evelyn",
        "char_thiago",
        "char_camila",
        "char_hans",
        "char_greta"
      ],
      "description": "Instituição responsável pelo monitoramento de anomalias biológicas e físicas no planeta Evren, bem como pela manutenção do Arquivo Histórico Global.",
      "name_variants": [
        "Fundação A.E.G.I.S. / C.R.I.S. (Registro de Fachada Genebra 1968)",
        "Agência de Exploração e Gerenciamento de Incursões Secretas (Designação Operacional Triângulo)",
        "Agência de Segurança Metafísica (Denominação Pública de Oeht na Gala Belvedere)"
      ],
      "canon_status": "confirmed",
      "curator_notes": "A organização opera sob sigilo e compartimentação de células; os nomes refletem o nível de acesso e o teatro de operações."
    },
    {
      "id": "org_familia_vilar",
      "name": "Família & Consórcio Minerador Vilar",
      "type": "Dinastia Familiar & Mineradora Histórica",
      "founded": "1892",
      "headquarters": "Serra Mineradora, México",
      "related_campaigns": [
        "camp_002"
      ],
      "members": [
        "char_lucas",
        "char_gabriel"
      ],
      "description": "Tradicional família proprietária das minas de prata e da Mansão Vilar nas montanhas do México."
    },
    {
      "id": "org_ordem_agostinho",
      "name": "Ordem Monástica de Santo Agostinho da Floresta Negra",
      "type": "Ordem Religiosa e Arquivística Medieval",
      "founded": "1320",
      "headquarters": "Baden-Württemberg, Alemanha",
      "related_campaigns": [
        "camp_005"
      ],
      "members": [],
      "description": "Comunidade monástica que custodiou a Cripta do Eco Silencioso por sete séculos nas montanhas alemãs."
    },
    {
      "id": "org_oeht_corp",
      "name": "Consórcio Oculto de Oeht // Iniciativa Belvedere",
      "type": "Megacorporação Privada Paranormal Clandestina",
      "headquarters": "Genebra / Zurique / Mansão Belvedere",
      "founded": "2025 // Em fundação clandestina",
      "status": "Sob Cerco e Desmantelamento Tático",
      "scope": "Global / Comercialização do Paranormal e Venda de Relíquias a Bilionários",
      "description": "Cartel clandestino de investidores de alto escalão, CEOs de tecnologia e magnatas do submundo financeiro, liderados por Theo 'Oeht' Vanderberg, que buscavam privatizar o Outro Lado e invalidar as ordens de quarentena da A.E.G.I.S.",
      "canon_status": "in_world_report",
      "sources": [
        "Documentos Apreendidos no Cofre de Oeht",
        "Briefing de Kaelen"
      ]
    },
    {
      "id": "org_sauriana",
      "name": "Sociedade Sauriana do Arquipélago dos Ossos",
      "type": "Sociedade Tribal Anômala com Agência e Costumes Próprios",
      "headquarters": "Ilha dos Répteis Primordiais (Triângulo das Bermudas)",
      "founded": "Aproximadamente 1620 (Introdução do canibalismo por marinheiro humano)",
      "status": "Ativa // Soberania Territorial",
      "scope": "Regional (Triângulo das Bermudas)",
      "description": "Comunidade de répteis humanoides com inteligência tática, domínio de armas de pedra e ferro recuperadas de naufrágios, e língua de cliques acústicos. Possui tabus invioláveis, ritos funerários e capacidade de negociação diplomática quando honrados seus limites territoriais.",
      "canon_status": "in_world_report",
      "sources": [
        "Diários de Bordo de 1542 e 1620",
        "Relatos de Náufragos de Nova Caronte"
      ]
    }
  ],
  "museum_collections": {
    "artifacts": [
      {
        "id": "relic_limiar",
        "name": "Arma de Portais: LIMIAR",
        "owner": "Gabriel Vilar",
        "type": "Relíquia Tecnológica Oculta",
        "rarity": "Única / Grau Ômega",
        "pd_cost": 4,
        "ability": "Salto de Fenda Dimensional",
        "effect": "Permite ao portador ou ao alvo escolhido teleportar-se instantaneamente até 15 metros para qualquer ponto visível no battlemap, ignorando obstáculos sólidos e ataques de oportunidade.",
        "description": "Um aparato portátil com câmara de contenção de plasma de fenda e bobinas de tungstênio. Gabriel gastou três anos nas oficinas das minas para criar o único dispositivo capaz de furar as barreiras do espaço no universo Evren.",
        "collection_category": "Objeto Histórico / Artefato Catalogado",
        "provenance_campaign": "camp_002"
      },
      {
        "id": "relic_hallucigenia",
        "name": "Armadura Hallucigenia",
        "owner": "Lucas Vilar (Descoberta)",
        "type": "Bioproteção Fóssil Mutagênica",
        "rarity": "Relíquia Antiga",
        "pd_cost": 0,
        "ability": "Sacrifício de Armadura Supremo",
        "effect": "Quando o usuário for sofrer um ataque fatal ou Hitkill, a armadura se estilhaça em espinhos calcários, anulando 100% do dano mortal e concedendo +5m de fuga imediata. A peça fica inoperante até restauração biológica.",
        "description": "Peitoral orgânico petrificado forjado a partir de carapaças fósseis encontradas nas galerias mais profundas das minas mexicanas. Os espinhos dorsais absorvem a força cinética de impactos mortais.",
        "collection_category": "Objeto Histórico / Artefato Catalogado",
        "provenance_campaign": "camp_001"
      },
      {
        "id": "relic_patitre",
        "name": "Lança Patitre",
        "owner": "Guerreiros de Nova Caronte",
        "type": "Arma Orgânica Simbiótica",
        "rarity": "Grau Alfa",
        "pd_cost": 2,
        "ability": "Drenagem Medular",
        "effect": "Causa 3d8+6 de perfuração biológica e rouba 5 PD do alvo atingido, canalizando-os para o portador. Em contrapartida, cada ativação aumenta o MDA do usuário em +3%.",
        "description": "Lança esculpida com o espigão dorsal de um parasita das fossas oceânicas. A empunhadura tem veias vivas que se conectam aos tendões da mão de quem a empunha.",
        "collection_category": "Objeto Histórico / Artefato Catalogado",
        "provenance_campaign": "camp_001"
      },
      {
        "id": "relic_gravador",
        "name": "Gravador de Fita: Projeto Limiar",
        "owner": "Gabriel Vilar / Júlia",
        "type": "Dispositivo Investigativo",
        "rarity": "Grau Tático",
        "pd_cost": 1,
        "ability": "Frequência Anti-Eco",
        "effect": "Emite ondas ultrassônicas ressonantes em um raio de 12 metros, desorientando criaturas com audição aguçada (como os Ecos) e cancelando ataques furtivos por 2 rodadas.",
        "description": "Um gravador de bobina analógico modificado com transistores de alta frequência. Contém as gravações das fitas secretas das sessões de interrogatório e o som original do eco que aprisionou Lucas.",
        "collection_category": "Objeto Histórico / Artefato Catalogado",
        "provenance_campaign": "camp_002"
      },
      {
        "id": "relic_retrovirus",
        "name": "Injetor de Retrovírus AEGIS",
        "owner": "Divisão de Contenção",
        "type": "Bio-Consumível Médico",
        "rarity": "Suprimento Raro",
        "pd_cost": 0,
        "ability": "Estabilização Celular",
        "effect": "Restaura imediatamente +15 Pontos de Determinação (PD) e reduz temporariamente o MDA do personagem em -10%, evitando colapsos de Overload.",
        "description": "Seringa pneumática de titânio contendo um soro sintético azul-cobalto desenvolvido pela agência para reverter os primeiros estágios da anomalia genética.",
        "collection_category": "Objeto Histórico / Artefato Catalogado",
        "provenance_campaign": "camp_001"
      },
      {
        "id": "relic_bussola_fenda",
        "name": "Bússola de Fenda Dimensional",
        "owner": "Capitães do Triângulo",
        "type": "Artefato Náutico Cartográfico",
        "rarity": "Grau Veterano",
        "pd_cost": 0,
        "ability": "Navegação Anômala",
        "effect": "Aponta consistentemente para o epicentro das fendas e vórtices gravitacionais, permitindo navegar em meio a neblinas densas e tempestades sem perder a orientação.",
        "description": "Uma bússola esférica de latão cujo ponteiro é uma agulha de meteorito negro suspensa em fluido amniótico bioluminescente.",
        "collection_category": "Objeto Histórico / Artefato Catalogado",
        "provenance_campaign": "camp_001"
      },
      {
        "id": "relic_criostase",
        "name": "Injetor de Criostase Inversa",
        "owner": "Dra. Evelyn Shaw",
        "type": "Bio-Estabilizador Térmico",
        "rarity": "Grau Científico AEGIS",
        "pd_cost": 3,
        "ability": "Retardamento Metabólico",
        "effect": "Reduz o MDA em -10% temporariamente e neutraliza condições de queimadura, sangramento ou choque térmico por 3 rodadas.",
        "description": "Dispositivo cilíndrico de titânio preenchido com nitrogênio líquido ionizado capaz de retardar mutações celulares caóticas.",
        "collection_category": "Objeto Histórico / Artefato Catalogado",
        "provenance_campaign": "camp_003"
      },
      {
        "id": "relic_gelo_negro",
        "name": "Lâmina de Gelo Negro",
        "owner": "Comandante Miller",
        "type": "Arma Biomecânica",
        "rarity": "Grau Primordial",
        "pd_cost": 4,
        "ability": "Corte Criogênico",
        "effect": "Ataques ignoram Sacrifício de Armadura convencional; causa 2d10 de dano frio e reduz a Agilidade do alvo em -2.",
        "description": "Fragmento cortante do monólito ártico que nunca derrete, emanando uma fumaça gélida que absorve a luz ao redor.",
        "collection_category": "Objeto Histórico / Artefato Catalogado",
        "provenance_campaign": "camp_003"
      },
      {
        "id": "relic_quartzo_negro",
        "name": "Nódulo de Quartzo Mutagênico",
        "owner": "Dra. Camila Neves",
        "type": "Relíquia Mineral Biológica",
        "rarity": "Rara / Grau Alfa",
        "pd_cost": 3,
        "ability": "Pulso de Adaptação Celular",
        "effect": "Cura 2d8 PV de um aliado orgânico instantaneamente ao acelerar o metabolismo, concedendo +2 em testes de Fortitude por 2 rodadas.",
        "description": "Um fragmento cristalino negro extraído da caverna do Tapajós. Quando exposto a calor corpóreo, emite um brilho verde esmeralda e acelera a regeneração de tecidos vivos.",
        "collection_category": "Objeto Histórico / Artefato Catalogado",
        "provenance_campaign": "camp_004"
      },
      {
        "id": "relic_diapasao_eco",
        "name": "Diapasão de Prata Sem-Rosto",
        "owner": "Hans Richter",
        "type": "Relíquia Acústica Oculta",
        "rarity": "Rara / Grau Alfa",
        "pd_cost": 2,
        "ability": "Onda de Silenciamento Dimensional",
        "effect": "Cria uma zona de 6 metros de silêncio absoluto onde nenhuma habilidade mística oral ou efeito sonoro hostil pode ser executado.",
        "description": "Um diapasão forjado pelos monges da Floresta Negra com prata esterlina e inscrições heréticas. Vibra em uma frequência inaudível aos ouvidos humanos que desarma vórtices acústicos do LIMIAR.",
        "collection_category": "Objeto Histórico / Artefato Catalogado",
        "provenance_campaign": "camp_005"
      }
    ],
    "biological_specimens": [
      {
        "id": "creature_eco",
        "name": "Os Ecos Subterrâneos",
        "zone": "México (As Minas Antigas)",
        "threat_level": "Ameaça Média (VD 60)",
        "mda": "45%",
        "behavior": "Predador Auditivo Furtivo",
        "attacks": [
          {
            "name": "Garras Quéricas",
            "damage": "2d8+4 Perfuração",
            "effect": "Causa hemorragia e enfraquecimento muscular"
          },
          {
            "name": "Voz Roubada (Eco Paralisante)",
            "damage": "1d10 Mental",
            "effect": "Exige teste de Presença; falha causa Paralisia por Terror de 1 turno"
          }
        ],
        "traits": [
          "Cegueira Completa: Orienta-se unicamente por ecolocalização",
          "Mimetismo Vocal: Imita perfeitamente vozes de entes queridos já devorados",
          "Fraqueza: Frequências ressonantes de alta potência causam atordoamento"
        ],
        "description": "Criaturas humanoides deformadas pela permanência prolongada nas minas de prata mexicana. Seus rostos não possuem olhos, apenas orifícios auditivos hipertrofiados e uma mandíbula cartilaginosa que repete sussurros roubados.",
        "collection_category": "Registro Biológico / Ameaça Histórica Documentada"
      },
      {
        "id": "creature_mimico",
        "name": "Mímico Genético",
        "zone": "O Triângulo das Bermudas / Nova Caronte",
        "threat_level": "Ameaça Alta (VD 120)",
        "mda": "70%",
        "behavior": "Infiltrador Celular",
        "attacks": [
          {
            "name": "Chicote de Medula Óssea",
            "damage": "3d6+6 Cortante",
            "effect": "Alcance 6 metros; agarra e drena 3 PD do alvo"
          },
          {
            "name": "Asfixia Celular",
            "damage": "2d12 Químico",
            "effect": "Corrói armaduras mundanas instantaneamente"
          }
        ],
        "traits": [
          "Metamorfose Instantânea: Copia altura, voz e impressões digitais após 3 segundos de contato",
          "Regeneração Biológica: Recupera 5 PD no início de cada rodada enquanto houver umidade",
          "Fraqueza: Fogo direto e cauterização interrompem a duplicação molecular"
        ],
        "description": "Uma massa amórfica de células totipotentes mutantes capaz de absorver tecidos humanos e replicar a fisiologia completa da vítima em segundos. Responsável pelo massacre do convés inferior do navio durante a travessia.",
        "collection_category": "Registro Biológico / Ameaça Histórica Documentada"
      },
      {
        "id": "creature_kraken",
        "name": "O Soberano Abissal (Kraken)",
        "zone": "Fosso Abissal (Triângulo das Bermudas)",
        "threat_level": "Ameaça Ômega (VD 300+)",
        "mda": "95%",
        "behavior": "Colosso Submarino Territorial",
        "attacks": [
          {
            "name": "Constrição de Tentáculo Titânico",
            "damage": "4d10+12 Esmagamento",
            "effect": "Quebra cascos navais; exige teste de Força CD 22 para escapar"
          },
          {
            "name": "Pulso Bio-Vulcânico EMP",
            "damage": "3d8 Elétrico + 2d8 Fogo",
            "effect": "Desativa relíquias tecnológicas e radar por 3 turnos"
          }
        ],
        "traits": [
          "Couraça de Basalto Vulcânico: Redução de Dano 15 contra projéteis mundanos",
          "Vórtice Atrator: Puxa embarcações a até 100m de distância em direção ao abismo",
          "Fraqueza: O respiradouro termal central vulnerável a cargas explosivas concentradas"
        ],
        "description": "Um cefalópode de proporções cósmicas fundido organicamente com rochas magmáticas das profundezas da Fossa de Porto Rico. Seus tentáculos produzem bioeletricidade azulada capaz de apagar redes inteiras de energia.",
        "collection_category": "Registro Biológico / Ameaça Histórica Documentada"
      },
      {
        "id": "creature_sentinela",
        "name": "Sentinela Autômato do LIMIAR",
        "zone": "México (Complexo Vilar)",
        "threat_level": "Ameaça Tática (VD 80)",
        "mda": "20% (Bio-mecatrônica)",
        "behavior": "Patrulha Mecânica Vigilante",
        "attacks": [
          {
            "name": "Descarga de Partículas Fendidas",
            "damage": "2d10+5 Energia",
            "effect": "Ignora 50% de resistências físicas"
          },
          {
            "name": "Lâmina Eletrostática",
            "damage": "2d6+4 Cortante",
            "effect": "Causa choque de 1d6 contínuo"
          }
        ],
        "traits": [
          "Micro-Salto Dimensional: Teletransporta-se 6 metros como ação livre 1x por rodada",
          "Sensor Térmico e Paranormal: Imune a camuflagens ópticas e invisibilidade",
          "Fraqueza: Vulnerabilidade a pulsos eletromagnéticos e sobrecarga em seus capacitores traseiros"
        ],
        "description": "Unidades mecânicas prototípicas projetadas por Gabriel Vilar utilizando peças de antigas locomotivas mineradoras e chips acoplados ao núcleo do LIMIAR para patrulhar a ferrovia e capturar invasores.",
        "collection_category": "Registro Biológico / Ameaça Histórica Documentada"
      },
      {
        "id": "creature_mao_rosas",
        "name": "A Mão de Rosas (Manifestação do Arquiteto)",
        "zone": "O Triângulo das Bermudas",
        "threat_level": "Ameaça Suprema (VD 250)",
        "mda": "99% Dominador",
        "behavior": "Manifestação Psíquica Territorial",
        "attacks": [
          {
            "name": "Espinhos de Gelo Carmesim",
            "damage": "3d8 Frio + 2d8 Psíquico",
            "effect": "Gera hipotermia e alucinações visuais"
          },
          {
            "name": "Grito da Realidade Hackeada",
            "damage": "4d6 Psíquico em cone",
            "effect": "Causa Overload imediato em alvos com PD abaixo de 10"
          }
        ],
        "traits": [
          "Corpo Eclético: Ataques físicos atravessam sua forma etérea sem causar impacto pleno",
          "Campo de Rosas Geladas: A temperatura ambiente despenca para -20°C a 30 metros de distância",
          "Fraqueza: Golpes carregados com pura Determinação (PD) causam dano real irredutível"
        ],
        "description": "Uma projeção ectoplasmática gélida conjurada à distância pela mente do Arquiteto do Caos. Tem o formato de mãos colossais cobertas por roseiras de espinhos carmesins e névoa congelante.",
        "collection_category": "Registro Biológico / Ameaça Histórica Documentada"
      },
      {
        "id": "creature_leviathan",
        "name": "Parasita Glacial Primordial",
        "category": "Aberração Criogênica",
        "threat": "Ameaça Ômega",
        "zone": "Estação Criogênica Zero (Groenlândia)",
        "mda": "88%",
        "pd": 38,
        "armor": "Quitina de Gelo Negro (Absorção 4)",
        "behavior": "Precursor biológico dormente que absorve calor corporal instantaneamente.",
        "description": "Organismo anterior à história humana, preservado na calota ártica. Quando atinge calor biológico, replica células hospedeiras e as transmuta em condutores de estática paranormal.",
        "attacks": [
          "Espinho Criogênico (Dano 2d8 + Congelamento)",
          "Névoa de Hipotermia Celular (DT 16 Vigor)",
          "Flagelo de Biomassa Fóssil (Dano 3d6)"
        ],
        "collection_category": "Registro Biológico / Ameaça Histórica Documentada"
      }
    ],
    "session_records": [
      {
        "id": "cron_vil_01",
        "campaign_id": "camp_002",
        "location_id": "loc_vilar",
        "title": "A Noite da Confissão",
        "lore": "Cinco amigos retornaram à Mansão Vilar no México três anos após o desaparecimento de Lucas. Lá, foram caçados e manipulados psicologicamente por uma figura mascarada capaz de se teletransportar usando uma arma chamada LIMIAR (criada por Gabriel Vilar). Ao final, enfrentaram os 'Ecos', criaturas cegas que roubam vozes nas minas subterrâneas, explodindo a mansão para conter a ameaça e resgatando Lucas com vida."
      },
      {
        "id": "cron_inc_01",
        "campaign_id": "camp_001",
        "location_id": "loc_caronte",
        "title": "A Incursão do Navio de 5.000 Almas",
        "lore": "Após o colapso do mundo exterior, um navio foi sugado para o buraco de minhoca no verdadeiro Triângulo das Bermudas. Sobrevivendo à dor lancinante da travessia e às manipulações do Mímico Genético a bordo, a tripulação despertou em Nova Caronte. Lá, a magia não existe: apenas mutação biológica violenta. Os recém-chegados precisam entender as leis da hiper-evolução e sobreviver aos ataques do Diabo do Mar para chamar a atenção da A.E.G.I.S."
      },
      {
        "id": "cron_arc_01",
        "campaign_id": "camp_003",
        "location_id": "loc_estacao_zero",
        "title": "O Descongelamento do Primeiro Espécime",
        "lore": "Durante uma perfuração a 3.200 metros na calota da Groenlândia, a equipe da Dra. Evelyn Shaw extraiu um cilindro de gelo negro contendo biomassa viva pulsante. Ao romper a câmara criogênica, o organismo se fundiu aos sistemas de ventilação, liberando esporos de hiper-mutação que transformaram o esquadrão de segurança em sentinelas simbióticas cegas."
      },
      {
        "id": "cron_bra_01",
        "campaign_id": "camp_004",
        "location_id": "loc_tapajos",
        "title": "A Invasão das Raízes Mutagênicas",
        "lore": "Em outubro de 2025, o esquadrão Curupira descobriu que a cratera de quartzo negro no Tapajós não era uma formação mineral, mas um nodo de sinapse geológica conectado à fenda do Atlântico. Ao detonarem as cargas de contenção, o Capitão Santos e a Dra. Camila Neves conseguiram salvar os registros de biometria antes do colapso completo da caverna."
      },
      {
        "id": "cron_ale_01",
        "campaign_id": "camp_005",
        "location_id": "loc_monasterio",
        "title": "O Silêncio dos Monges de Friburgo",
        "lore": "Nas profundezas da Floresta Negra alemã, as ruínas da abadia guardavam um sino sem badalo forjado com ligas de meteorito. Quando Greta Falk tocou a campana durante a invasão, a frequência mística devorou a voz física de todos os presentes, silenciando o culto dos Sem-Rosto e permitindo que Hans Richter selasse os portões com concreto de chumbo."
      }
    ]
  },
  "canon_ledger": [
    {
      "id": "ledger_aegis_variants",
      "topic": "Nomenclatura e Natureza da A.E.G.I.S.",
      "claim": "A A.E.G.I.S. opera sob múltiplas designações de cobertura conforme a jurisdição e o interlocutor.",
      "status": "disputed",
      "sources": [
        "world_data.json: 'Fundação A.E.G.I.S. / C.R.I.S.' (Sede Genebra 1968)",
        "Manuscrito do Triângulo: 'Agência de Exploração e Gerenciamento de Incursões Secretas'",
        "Discurso de Oeht na Gala Belvedere: 'Agência de Segurança Metafísica'"
      ],
      "contradictions": [
        "Fundação civil-científica vs. Agência militar-estatal sombria vs. Força reguladora metafísica."
      ],
      "confidence": "Média (Variantes de Fachada Concorrentes)",
      "curator_notes": "A A.E.G.I.S. utiliza compartimentação rigorosa. As três formulações são válidas no universo como fachadas jurídicas e percepções de agentes externos. A sigla C.R.I.S. permanece sem expansão confirmada."
    },
    {
      "id": "ledger_vilar_dates",
      "topic": "Cronologia dos Eventos da Mansão Vilar",
      "claim": "O desaparecimento de Lucas e o clímax do casarão apresentam registros de datas discordantes entre os arquivos de campo.",
      "status": "disputed",
      "sources": [
        "Relatório de Campo A.E.G.I.S. (Evento 002): Desaparecimento em Out/2021, resgate em Out/2024.",
        "Linha do Tempo Tática (time_mex_01): Incidente registrado no Ano 2023 (-3), clímax projetado para 2026."
      ],
      "contradictions": [
        "Janela temporal de 2021-2024 vs. 2023-2026."
      ],
      "confidence": "Aberta (Registros Conflitantes de Época)",
      "curator_notes": "Ambas as cronologias foram mantidas no banco de dados. O autor decidirá oportunamente se trata-se de dilatação temporal anômala provocada pelo dispositivo LIMIAR ou erro cadastral de relatórios de campo."
    },
    {
      "id": "ledger_vilar_cast",
      "topic": "Elenco de Sobreviventes da Mansão Vilar",
      "claim": "A expedição adolescente de Até o Amanhecer contou com 5 protagonistas e 4 coadjuvantes centrais, além de registros legados de arquivo.",
      "status": "confirmed",
      "sources": [
        "Roteiro de Até o Amanhecer: Rafael, Helena, Diego, Bia e Arthur (protagonistas); Gabriel/Davi Reis, Camila Torres, Mauro Azevedo e Elias Rocha (NPCs).",
        "Arquivo Legado world_data.json: Júlia Drummond (pesquisadora de arquivo associada ao caso)."
      ],
      "contradictions": [
        "Júlia Drummond não constava no roteiro de campo inicial dos jovens da serra."
      ],
      "confidence": "Alta (Elenco do Roteiro + Variante de Arquivo)",
      "curator_notes": "Júlia Drummond é mantida como perita investigadora externa que arquivou os depoimentos do caso, preservando compatibilidade com versões anteriores da base."
    },
    {
      "id": "ledger_triangulo_origin",
      "topic": "Gênese do Triângulo das Bermudas",
      "claim": "O Triângulo das Bermudas é uma anomalia natural imemorial usada como prisão dimensional, cuja barreira sofreu fissuras por testes nucleares e experimentos modernos.",
      "status": "open_mystery",
      "sources": [
        "Manuscrito do Autor: Anomalia natural primordial anterior à história humana, servindo de cárcere para entidades.",
        "Base de Dados A.E.G.I.S.: Fenda aberta ou acelerada por experimentos secretos submarinos durante a Guerra Fria."
      ],
      "contradictions": [
        "Anomalia geológica milenar vs. Rompimento causado por ação antrópica recente."
      ],
      "confidence": "Média (Hipóteses Complementares Não Homologadas)",
      "curator_notes": "A teoria de síntese sugere que a anomalia sempre existiu, mas experimentos modernos enfraqueceram o tecido do espaço-tempo marítimo, permitindo o colapso acelerado observado em 2026."
    },
    {
      "id": "ledger_triangulo_passengers",
      "topic": "Capacidade e Vítimas do Navio Tragado no Triângulo",
      "claim": "A embarcação de cruzeiro tragada para o interior da fenda transportava cerca de 5.000 passageiros e tripulantes.",
      "status": "confirmed",
      "sources": [
        "Manuscrito Canônico da Incursão: 5.000 pessoas a bordo; aviso de emergência de TV cortado na transmissão.",
        "Resumos Rápidos Legados: Menção imprecisa a 'centenas de sobreviventes'."
      ],
      "contradictions": [
        "5.000 ocupantes totais vs. 'centenas' de sobreviventes organizados nos barcos de Nova Caronte."
      ],
      "confidence": "Alta (5.000 embarcados, sobreviventes fracionados)",
      "curator_notes": "5.000 é o número canônico total de passageiros tragados pelo evento marítimo. As 'centenas' referem-se àqueles que conseguiram se agrupar nos destroços de Nova Caronte."
    },
    {
      "id": "ledger_primogenito_identity",
      "topic": "Identidade do Primogênito / Arquiteto do Caos / Diabo do Mar",
      "claim": "A entidade central do Triângulo é apontada ora como o primeiro ser humano a atravessar a fenda há milênios, ora como a Cobaia Zero de um projeto moderno de reescrita biológica.",
      "status": "disputed",
      "sources": [
        "Manuscrito do Autor: Primeiro humano a entrar na anomalia na antiguidade, reescreveu leis físicas locais.",
        "Base A.E.G.I.S. (world_data.json): Cobaia Zero de experimento genético proibido que assumiu a alcunha do Diabo do Mar."
      ],
      "contradictions": [
        "Entidade milenar mitológica vs. Vítima e arquiteto de experimento humano moderno."
      ],
      "confidence": "Aberta (Mito Concorrente)",
      "curator_notes": "As duas hipóteses coexistem nos arquivos. O manto que absorve a luz e a máscara de osso impedem confirmação biológica independente da idade celular."
    },
    {
      "id": "ledger_oeht_belvedere",
      "topic": "Operação Gala Belvedere & Bilionário Oeht",
      "claim": "A Mansão Belvedere sediou a gala secreta de aniversário de Oeht para privatizar o paranormal; a operação de infiltração A.E.G.I.S. foi coordenada por Kaelen.",
      "status": "in_world_report",
      "sources": [
        "Briefing de Kaelen / Transcrição de Infiltração: Gala de investidores, redoma com relíquia parasita, lodo roxo no cofre, relógio de dobra temporal de 6s, discurso das 23h.",
        "Registro de Corte: Cenas posteriores ao início da Zona B (Mesa de Poker VIP) estão truncadas."
      ],
      "contradictions": [
        "Mansão Belvedere é uma propriedade distinta da Mansão Vilar no México."
      ],
      "confidence": "Média (Fonte Documental Parcial Recuperada)",
      "curator_notes": "Os fatos até o confronto do bolo colossal são canônicos segundo a transcrição; os desdobramentos da Zona B e desfecho definitivo aguardam recuperação documental integral."
    },
    {
      "id": "ledger_magic_doctrine",
      "topic": "Doutrina de Magia vs. Biologia Hiper-Adaptativa em Evren",
      "claim": "No universo de Evren não há magia genérica ou sobrenatural clássico; anomalias operam por leis da MDA e distorções dimensionais, embora o Primogênito afirme 'reescrever a realidade'.",
      "status": "proposal",
      "sources": [
        "Manuscrito do Autor: Criaturas explicadas pela biologia acelerada e MDA; ausência de feitiçaria.",
        "Doutrina A.E.G.I.S.: Fenômenos anômicos observáveis através de física e genética não-euclidiana."
      ],
      "contradictions": [
        "Afirmações do Arquiteto de reescrever leis como magia vs. Paradigma biopunk materialista."
      ],
      "confidence": "Alta (Fundamento Filosófico de Evren)",
      "curator_notes": "A tensão entre a explicação biopunk científica e a percepção subjetiva de horror místico é parte intencional do universo de Evren."
    }
  ],
  "powers": [
    {
      "id": "power_dobra_temporal",
      "name": "Dobra Temporal de Emergência",
      "category": "Manipulação Crono-Anômala",
      "origin_type": "Tecnologia / Foco Metafísico A.E.G.I.S.",
      "belief_conflict": "A recusa em aceitar que o tempo é uma prisão imutável.",
      "observable_effect": "Desloca o fluxo temporal em um raio de 2 metros ao redor do usuário, acelerando suas ações em 6 segundos de tempo subjetivo.",
      "trigger": "Ativação mecânica no pino de um relógio analógico sincronizado.",
      "range_duration_targets": "Pessoal / 6 segundos / 1 alvo (usuário)",
      "cost_pd": 3,
      "risk_mda": 2,
      "sensory_sign": "O ambiente congela em um matiz azulado monocromático; o som de ponteiros de relógio ecoa metálico nos tímpanos.",
      "limits": "Não permite interagir com objetos sob tranca física pesada nem transportar terceiros sem partilha de custo.",
      "counterplay": "Campos de pulso eletromagnético (EMP) ou ressonância vulcânica desestabilizam o escapamento cronológico.",
      "consequences": "Tontura, perda de percepção de segundos no tempo real e fadiga nas articulações.",
      "canon_status": "in_world_report",
      "sources": [
        "Relatório de Infiltração Mansão Belvedere",
        "Laboratório Metafísico A.E.G.I.S."
      ]
    },
    {
      "id": "power_eco_ressonante",
      "name": "Ressonância Acústica Anti-Eco",
      "category": "Expressão Sonora Anímica",
      "origin_type": "Sobrevivência às Minas Vilar",
      "belief_conflict": "O apego obsessivo a uma voz real gravada que impede o mimetismo dos predadores.",
      "observable_effect": "Emite uma frequência harmônica pura através das cordas vocais ou diapasão de campo, repelindo Ecos Subterrâneos por 1 rodada.",
      "trigger": "Cantarolar ou vocalizar a nota fundamental de 432 Hz sob respiração controlada.",
      "range_duration_targets": "Raio de 9 metros / 1 rodada / Todas as criaturas auditivas na área",
      "cost_pd": 2,
      "risk_mda": 1,
      "sensory_sign": "Pequenas pedras e poeira mineral levitam milímetros do chão com o zumbido harmônico.",
      "limits": "Inútil contra criaturas desprovidas de ecolocalização ou imunes a vibração acústica.",
      "counterplay": "Ruídos industriais altos, colapso de rochas e motores a combustão abafam a frequência.",
      "consequences": "Dor de garganta aguda, sangramento nasal leve e perda temporária de audição após uso repetido.",
      "canon_status": "confirmed",
      "sources": [
        "Notas de Campo de Gabriel Vilar",
        "Diário de Sobrevivência de Lucas Vilar"
      ]
    },
    {
      "id": "power_ancoragem_limiar",
      "name": "Estabilização de Âncoras do LIMIAR",
      "category": "Projeção Espacial",
      "origin_type": "Engenharia de Dobra Espacial (Gabriel Vilar)",
      "belief_conflict": "A certeza matemática de que dois pontos distantes no espaço podem ser fundidos pela dor da perda.",
      "observable_effect": "Fixa uma micro-âncora quântica em uma superfície visível, permitindo que o dispositivo LIMIAR abra uma dobra de travessia estável.",
      "trigger": "Disparo guiado a laser acoplado ao capacitor traseiro da arma portátil.",
      "range_duration_targets": "15 metros / 2 rodadas de abertura / Até 3 pessoas por travessia",
      "cost_pd": 4,
      "risk_mda": 4,
      "sensory_sign": "Odor penetrante de ozônio queimado e faiscamento azul-cobalto nas bordas do portal.",
      "limits": "Requer linha de visão desobstruída e solo sólido como receptor. Não atravessa paredes com blindagem de chumbo ou quartzo negro.",
      "counterplay": "Sobrecarga de bateria e quebra da âncora receptora por impacto físico.",
      "consequences": "Microqueimaduras nas mãos do operador e distorção na memória de curto prazo.",
      "canon_status": "confirmed",
      "sources": [
        "Patente Clandestina Gabriel Vilar",
        "Arquivos Técnicos A.E.G.I.S. LIMIAR-01"
      ]
    },
    {
      "id": "power_foco_animico_defensivo",
      "name": "Foco Anímico Resistido",
      "category": "Resistência Anímica Fundamental",
      "origin_type": "Doutrina de Campo de Agentes",
      "belief_conflict": "A recusa moral em ceder ao pânico cósmico diante da incompreensão da anomalia.",
      "observable_effect": "Ergue uma barreira de determinação pura contra ataques de pavor, ilusões miméticas ou distorção gravitacional.",
      "trigger": "Afirmação firme da própria identidade ou apego a um objeto de ancoragem pessoal.",
      "range_duration_targets": "Pessoal / Instantâneo / 1 alvo (usuário ou aliado adjacente tocado)",
      "cost_pd": 2,
      "risk_mda": 0,
      "sensory_sign": "Pulso térmico que aquece a palma da mão e dissipa névoa gelada ao redor.",
      "limits": "Não absorve dano puramente cinético de projéteis ou garras físicas.",
      "counterplay": "Ataques físicos rápidos e colapso de oxigênio no ambiente.",
      "consequences": "Esgotamento de determinação mental; exige descanso tático após conflito.",
      "canon_status": "proposal",
      "sources": [
        "Manual Tático de Agentes A.E.G.I.S.",
        "Compêndio de Regras de Evren"
      ]
    }
  ],
  "folklore_cases": [
    {
      "id": "folk_devils_bridge_pontarfynach",
      "name": "Devil's Bridge (Pontarfynach, País de Gales)",
      "real_location": "Ceredigion, País de Gales (Reino Unido)",
      "origin_culture": "Folclore Tradicional Galês (Três Pontes Sobrepostas sobre o Rio Mynach)",
      "bibliographic_source": "Visit Wales Archives & Mid Wales Historical Documentation (Lenda da Mulher que enganou o Diabo com um cão).",
      "folklore_variations": "A lenda afirma que o Diabo ofereceu construir uma ponte sobre a ravina impossível em troca da primeira alma que a cruzasse; uma anciã astuta atirou um pedaço de pão, fazendo com que seu cão cruzasse primeiro.",
      "evren_evidence": "Investigações da A.E.G.I.S. detectaram vestígios de corrosão mineral anômala na rocha de base da ponte inferior, idêntica aos padrões de ferrugem azul observados na fenda do Atlântico Norte.",
      "aegis_interpretation": "A anomalia do Primogênito/Arquiteto projeta manifestações históricas em gargantas e travessias geográficas difíceis. A lenda popular é uma codificação mitopoiética de um contato real com dobras dimensionais.",
      "confirmation_level": "open_mystery",
      "cultural_note": "Trata-se de patrimônio folclórico documentado do povo galês; a narrativa de Evren a utiliza como inspiração temática, sem desrespeitar o significado cultural e histórico da comunidade local."
    },
    {
      "id": "folk_sinos_floresta_negra",
      "name": "Os Sinos Submersos da Floresta Negra (Alemanha)",
      "real_location": "Schwarzwald, Baden-Württemberg, Alemanha",
      "origin_culture": "Tradição Monástica Medieval e Lendas Germânicas do Século XIV",
      "bibliographic_source": "Crônicas da Abadia de Santo Agostinho (1348) & Registros de Epidemias da Peste Negra.",
      "folklore_variations": "Camponeses relatavam ouvir o badalar de sinos de bronze vindos de lagos e ravinas em noites sem vento, prenunciando figuras encapuzadas que roubavam as vozes de aldeões isolados.",
      "evren_evidence": "A cripta selada da abadia contém condutos acústicos de calcário e restos fossilizados de espécimes preliminares de Ecos Subterrâneos.",
      "aegis_interpretation": "Precedente histórico europeu de infecção anômala auditiva. O 'Sem-Rosto' medieval era uma manifestação embrionária de Ecos em ambiente cárstico.",
      "confirmation_level": "in_world_report",
      "cultural_note": "Registrado nos anais medievais germânicos como sinal da peste; preservada a separação entre registro religioso histórico e análise biopunk contemporânea."
    },
    {
      "id": "folk_minas_san_lorenzo",
      "name": "O Poço dos Sussurros de San Lorenzo (México)",
      "real_location": "Serra de Aguascalientes / Zacatecas, México",
      "origin_culture": "Tradição Mineira Mexicana do Século XIX (Mina de Santa Rita / Consórcio Vilar)",
      "bibliographic_source": "Boletins do Ministério da Mineração do México (1898) & Depoimentos de Famílias Mineiras.",
      "folklore_variations": "Diz-se que os mineiros que desciam além do nível 4 ouviam parentes falecidos chamando por socorro nas rochas de prata; aqueles que respondiam perdiam o rumo e desapareciam nos desmoronamentos.",
      "evren_evidence": "Galerias seladas em 1920 apresentavam marcas de garras e tecidos de pele sintética compatíveis com Ecos Subterrâneos.",
      "aegis_interpretation": "Infestação profunda de predadores sonoros adormecidos que despertaram após perfurações do Consórcio Vilar em busca de prata e quartzo.",
      "confirmation_level": "confirmed",
      "cultural_note": "Relacionado à memória histórica de trabalhadores das minas mexicanas; mantido com respeito à classe trabalhadora da serra."
    },
    {
      "id": "folk_campo_rosas_atlantico",
      "name": "O Mar das Rosas Negras das Bermudas",
      "real_location": "Mar dos Sargaços / Triângulo das Bermudas",
      "origin_culture": "Tradição de Navegadores Portugueses, Espanhóis e Ingleses (Século XVI em diante)",
      "bibliographic_source": "Diários de Bordo de Caravelas Espanholas (1542) & Cartas Náuticas de Navios Negreiros e Mercantes.",
      "folklore_variations": "Marinheiros descreviam manchas calmas no oceano onde a água assumia tom azul escuro sobrenatural e flores semelhantes a rosas brotavam da superfície salina antes de tempestades sem vento.",
      "evren_evidence": "Coletas no Campo de Rosas de Nova Caronte revelaram que as 'pétalas' são filamentos orgânicos de MDA cristalizado com temperatura de congelamento anormal.",
      "aegis_interpretation": "Marcador territorial direto do Primogênito / Arquiteto do Caos. Atua como anestésico neurológico que induz euforia e apatia nas tripulações prestes a serem engolidas.",
      "confirmation_level": "in_world_report",
      "cultural_note": "Inspirado em lendas náuticas do Atlântico e nos mistérios cartográficos do Mar dos Sargaços."
    }
  ],
  "glossary": [
    {
      "term": "EVREN",
      "category": "Cosmologia",
      "definition": "Universo compartilhado físico e coerente de horror investigativo e biopunk, contido em um único planeta navegável, onde a realidade é marcada por regiões estáveis e áreas sujeitas a anomalias dimensionais e biológicas."
    },
    {
      "term": "A.E.G.I.S.",
      "category": "Organizações",
      "definition": "Organização central de contenção e monitoramento anômalo. Conhecida sob as fachadas 'Fundação A.E.G.I.S. / C.R.I.S.', 'Agência de Exploração e Gerenciamento de Incursões Secretas' e 'Agência de Segurança Metafísica'."
    },
    {
      "term": "C.R.I.S.",
      "category": "Padronização Tática",
      "definition": "Padrão tático e protocolo de codificação de fichas operacionais de campo, agentes e relatórios confidenciais da A.E.G.I.S. (expansão da sigla não homologada)."
    },
    {
      "term": "MDA",
      "category": "Fisiologia Anômala",
      "definition": "Mutagênese Dimensional Anômala. Processo celular de exposição e hiper-adaptação genética induzido por fendas dimensionais, que acelera mutações e reescreve tecidos biológicos sem recurso a feitiçaria."
    },
    {
      "term": "PD",
      "category": "Mecânicas",
      "definition": "Pontos de Determinação. Reserva mental, esforço extremo e coragem tática de um personagem para realizar proezas ou canalizar expressões anímicas. Não representa integridade corporal física."
    },
    {
      "term": "SAN",
      "category": "Mecânicas",
      "definition": "Sanidade. Estabilidade subjetiva do personagem perante a revelação do horror cósmico e anômalo. Tratada com respeito à agência do jogador e ferramentas de consentimento e pausa dramática."
    },
    {
      "term": "PV",
      "category": "Mecânicas",
      "definition": "Pontos de Vida. Medida quantitativa de integridade biológica e corporal de um agente ou criatura. Dano cinético ou térmico sempre reduz PV."
    },
    {
      "term": "LIMIAR",
      "category": "Tecnologia / Relíquias",
      "definition": "Arma de Portais e estabilização de dobras dimensionais projetada por Gabriel Vilar, utilizando âncoras quânticas e pesadas baterias eletroquímicas para abrir fendas de travessia."
    },
    {
      "term": "Ecos Subterrâneos",
      "category": "Bestiário",
      "definition": "Predadores humanoides cegos habitantes de galerias profundas que caçam por ecolocalização e atraem vítimas imitando com precisão as vozes de entes queridos já devorados."
    },
    {
      "term": "Nova Caronte",
      "category": "Geografia Anômala",
      "definition": "Cidade flutuante no coração da anomalia do Triângulo das Bermudas, construída sobre os cascos encadeados de embarcações de diversas épocas históricas."
    },
    {
      "term": "Triângulo Verdadeiro",
      "category": "Geografia Anômala",
      "definition": "A fenda dimensional marítima no Atlântico Norte, interpretada como uma prisão natural milenar cuja barreira protetora está se desfazendo aceleradamente."
    },
    {
      "term": "Primogênito",
      "category": "Entidades",
      "definition": "Denominação atribuída pelo manuscrito ao ser que atravessou a anomalia há milênios e aprendeu a manipular a matéria. Disputado com a teoria de Cobaia Zero."
    },
    {
      "term": "Arquiteto do Caos / Diabo do Mar",
      "category": "Entidades",
      "definition": "Títulos lendários e temidos da figura encapuzada de máscara de madeira/osso e aura azul que domina as correntes e mentes no Triângulo das Bermudas."
    },
    {
      "term": "Expressão Anímica",
      "category": "Paranormal / Alma",
      "definition": "Habilidade singular manifestada a partir da convicção, memória ou alma de um indivíduo, gerando efeitos empíricos delimitados sem recorrer a magias clássicas de fantasia."
    },
    {
      "term": "Campo de Rosas",
      "category": "Fenômenos",
      "definition": "Área marítima de águas geladas com flores negras flutuantes e aura azul escura atribuída ao Arquiteto do Caos, onde a razão humana se esvai em torpor euforizante."
    },
    {
      "term": "Incursão",
      "category": "Fenômenos",
      "definition": "Vazamento ou transbordamento de matéria, criaturas e leis anômalas de uma fenda para regiões geográficas estáveis do planeta."
    },
    {
      "term": "Outro Lado",
      "category": "Cosmologia",
      "definition": "Termo de gíria tática utilizado por diretores da A.E.G.I.S. (como Kaelen) e contrabandistas para designar a realidade extradimensional de onde emanam os artefatos e parasitas."
    },
    {
      "term": "Relíquia Parasita",
      "category": "Relíquias",
      "definition": "Objeto contido na redoma da Mansão Belvedere, comercializado no mercado oculto como fonte de poder, mas diagnosticado pela A.E.G.I.S. como organismo devorador biológico."
    }
  ],
  "teia_do_tempo": {
    "title": "Teia do Tempo: Tapeçaria Cósmica de Evren",
    "subtitle": "História Oculta, Vertentes Temporais Conectadas & Apocalipse Dimensional",
    "description": "Módulo interativo que mapeia todas as conexões causais, lendas históricas e linhas do tempo paralelas do universo EVREN.",
    "eras": [
      {
        "id": "era_primordial",
        "name": "Era Primordial (+5.000 Anos)",
        "badge": "🌌 ERA PRIMORDIAL",
        "color": "#38bdf8",
        "summary": "A biotecnologia Cambriana esquecida e o despertar da Verdadeira Magia pelo Primogênito na aurora dos tempos."
      },
      {
        "id": "era_mitica",
        "name": "Era Mítica & Folclórica",
        "badge": "⚔️ ERA MÍTICA",
        "color": "#eab308",
        "summary": "O Diabo do Mar caminhando entre os homens: as origens do mito de Loki, o ciclo arturiano e as primeiras ordens de sacrifício."
      },
      {
        "id": "era_navegacoes",
        "name": "Grandes Navegações (~400 Anos)",
        "badge": "⚓ GRANDES NAVEGAÇÕES",
        "color": "#10b981",
        "summary": "Galeões tragados para o Triângulo, a origem da sociedade canibal e os primeiros avistamentos do Kraken e Leviatã Branco."
      },
      {
        "id": "era_moderna",
        "name": "Século XX & Lendas Urbanas",
        "badge": "🏭 SÉCULO XX // GUERRAS",
        "color": "#f97316",
        "summary": "A Guerra Fria, submarinos em Nova Caronte, o surgimento dos Mímicos e a fundação clandestina da A.E.G.I.S."
      },
      {
        "id": "vertente_triangulo",
        "name": "Vertente 1: O Triângulo (1998)",
        "badge": "⚡ VERTENTE I",
        "color": "#c084fc",
        "status_label": "(Futura Campanha)",
        "summary": "A travessia dos cinco estágios, o Campo de Rosas, a Ilha Canibal e a rota de fuga rumo à A.E.G.I.S."
      },
      {
        "id": "vertente_vilar",
        "name": "Vertente 2: Mansão Vilar (2024)",
        "badge": "🏰 VERTENTE II",
        "color": "#22c55e",
        "status_label": "Concluída",
        "summary": "O Expresso, o sexto bilhete, os portais LIMIAR, a teia de mentiras, O Eco e o resgate de Lucas vivo."
      },
      {
        "id": "vertente_oeht",
        "name": "Vertente 3: Gala Belvedere (2026)",
        "badge": "🎭 VERTENTE III",
        "color": "#a855f7",
        "status_label": "(Futura Campanha)",
        "summary": "A conspiração de Oeht, o leilão de Victor Kael, o lodo roxo e o despertar do Anárquico sob a redoma à meia-noite."
      },
      {
        "id": "vertente_colapso",
        "name": "O Colapso da Realidade Exterior",
        "badge": "💥 HORIZONTE CRÍTICO",
        "color": "#ef4444",
        "status_label": "Ponto de Convergência",
        "summary": "A fenda global aberta: 5.000 pessoas desaparecidas em transmissão ao vivo e a fusão dimensional sob a Lei da Alucinação."
      }
    ],
    "nodes": [
      {
        "id": "node_hallucigenia",
        "title": "Biotecnologia Cambriana & Armadura Hallucigenia",
        "era_id": "era_primordial",
        "vertente_id": "era_primordial",
        "year_display": "+5.000 Anos Atrás",
        "importance": "Fundacional",
        "summary": "Civilizações ancestrais desenvolvem tecnologia orgânica consciente fundida à medula espinhal, rompendo a barreira entre biologia e engenharia.",
        "quote": "Sua existência prova que a fronteira entre tecnologia avançada e simbiose biológica já havia sido rompida na pré-história.",
        "characters": [
          "char_iris_vento_solto",
          "char_mateus_alencar"
        ],
        "relics": [
          "relic_hallucigenia"
        ],
        "caused_by": [],
        "leads_to": [
          "node_primogenito_fenda"
        ]
      },
      {
        "id": "node_primogenito_fenda",
        "title": "Gênese do Primogênito // Despertar da Verdadeira Magia",
        "era_id": "era_primordial",
        "vertente_id": "era_primordial",
        "year_display": "Aurora da Humanidade",
        "importance": "Cataclísmico",
        "summary": "O primeiro humano encontra a fenda primordial no oceano. Em vez de ser destruído, expande sua mente além dos limites mortais e compreende o código-fonte da realidade.",
        "quote": "Ele sobreviveu, compreendeu o código-fonte do cosmos e despertou a Verdadeira Magia, tornando-se O Primogênito — O Diabo do Mar.",
        "characters": [
          "char_arquiteto",
          "char_guia_temporario"
        ],
        "bestiary": [
          "creature_primogenito_arquiteto"
        ],
        "relics": [
          "relic_loki_mask"
        ],
        "caused_by": [
          "node_hallucigenia"
        ],
        "leads_to": [
          "node_loki_mito",
          "node_merlin_excalibur",
          "node_campo_de_rosas"
        ]
      },
      {
        "id": "node_loki_mito",
        "title": "A Sombra Nórdica: O Mito de Loki",
        "era_id": "era_mitica",
        "vertente_id": "era_mitica",
        "year_display": "Século IX // Era Viking",
        "importance": "Folclore Explicado",
        "summary": "Avistamentos do Primogênito usando sua máscara de osso e madeira, manipulando percepções e cinismo, são registrados pelos escaldos nórdicos como os feitos do deus da trapaça.",
        "quote": "A própria máscara de madeira e osso utilizada pelo Primogênito é a relíquia ancestral que deu origem aos mitos escandinavos sobre Loki.",
        "characters": [
          "char_arquiteto"
        ],
        "bestiary": [
          "creature_primogenito_arquiteto"
        ],
        "relics": [
          "relic_loki_mask"
        ],
        "caused_by": [
          "node_primogenito_fenda"
        ],
        "leads_to": [
          "node_folclore_maritimo"
        ]
      },
      {
        "id": "node_merlin_excalibur",
        "title": "O Ciclo Arturiano & As Lâminas da Bretanha",
        "era_id": "era_mitica",
        "vertente_id": "era_mitica",
        "year_display": "Século V-VI // Bretanha",
        "importance": "Folclore Explicado",
        "summary": "O Primogênito caminha entre cortes medievais sob o disfarce do conselheiro Merlin, entregando relíquias de corte anômalo como Excalibur para testar a soberania dos reis mortais.",
        "quote": "A lâmina e os prodígios atribuídos a Merlin são vestígios diretos da manipulação histórica do Primogênito.",
        "characters": [
          "char_valerius"
        ],
        "relics": [
          "relic_excalibur"
        ],
        "caused_by": [
          "node_primogenito_fenda"
        ],
        "leads_to": [
          "node_ordens_sacrificio"
        ]
      },
      {
        "id": "node_ordens_sacrificio",
        "title": "Nascimento das Ordens Ocultistas Humanas",
        "era_id": "era_mitica",
        "vertente_id": "era_mitica",
        "year_display": "Idade Média Tardia",
        "importance": "Metafísica Oculta",
        "summary": "Conjuradores mortais aprendem que o sacrifício de memórias e sangue força brechas nas regras físicas do mundo, criando a base para rituais humanos.",
        "quote": "Conjuradores aprenderam que o sacrifício de coisas genuinamente valiosas cria uma ressonância espiritual capaz de dobrar a matéria.",
        "characters": [
          "char_victor_kael",
          "char_clara_mendes"
        ],
        "caused_by": [
          "node_merlin_excalibur"
        ],
        "leads_to": [
          "node_gala_oeht_plano"
        ]
      },
      {
        "id": "node_ilha_canibal_origem",
        "title": "Origem da Sociedade da Ilha Canibal",
        "era_id": "era_navegacoes",
        "vertente_id": "era_navegacoes",
        "year_display": "Século XVI (~1542 / Há 400 Anos)",
        "importance": "Horror Evolutivo",
        "summary": "Um humano náufrago solitário atinge uma ilha habitada por dinossauros preservados no Triângulo e ensina canibalismo às feras pré-históricas, criando uma cultura tribal de 400 anos.",
        "quote": "Em vez de ser devorado, esse indivíduo ensinou práticas de canibalismo às próprias feras, evoluindo para templos e rituais de sangue.",
        "characters": [
          "char_raissa_carnica"
        ],
        "bestiary": [
          "creature_povo_sauriano"
        ],
        "caused_by": [
          "node_primogenito_fenda"
        ],
        "leads_to": [
          "node_sessao_2_triangulo"
        ]
      },
      {
        "id": "node_folclore_maritimo",
        "title": "Vazamento da Barreira & Lendas do Kraken e Leviatã",
        "era_id": "era_navegacoes",
        "vertente_id": "era_navegacoes",
        "year_display": "Século XVII-XVIII",
        "importance": "Lendas Históricas",
        "summary": "Navegadores que escaparam das bordas da anomalia levam para a Europa relatos apavorantes sobre lulas de rocha com descargas elétricas e baleias gigantes encouraçadas.",
        "quote": "Marinheiros que sobreviveram às bordas da anomalia trouxeram para os portos europeus os relatos do Kraken e de Moby Dick.",
        "characters": [
          "char_marcos_valente",
          "char_iris_vento_solto"
        ],
        "bestiary": [
          "creature_kraken",
          "creature_leviata_branco"
        ],
        "relics": [
          "relic_patitre"
        ],
        "caused_by": [
          "node_primogenito_fenda"
        ],
        "leads_to": [
          "node_nova_caronte_fundacao"
        ]
      },
      {
        "id": "node_nova_caronte_fundacao",
        "title": "Expansão de Nova Caronte & A Goela do Cachalote",
        "era_id": "era_moderna",
        "vertente_id": "era_moderna",
        "year_display": "Século XX // Guerra Fria",
        "importance": "Geografia Anômala",
        "summary": "Submarinos soviéticos e navios cargueiros desaparecidos no Atlântico fundem-se em Nova Caronte. A Goela do Cachalote vira o epicentro de comércio de relíquias.",
        "quote": "Cidade flutuante erguida sobre o emaranhado de carcaças navais de várias eras: galeões espanhóis e submarinos soviéticos.",
        "characters": [
          "char_iris_vento_solto",
          "char_mateus_alencar"
        ],
        "caused_by": [
          "node_folclore_maritimo"
        ],
        "leads_to": [
          "node_cinco_estagios"
        ]
      },
      {
        "id": "node_lendas_urbanas_mimetismo",
        "title": "Microfendas Terrestres: Mímicos e O Eco",
        "era_id": "era_moderna",
        "vertente_id": "era_moderna",
        "year_display": "Décadas de 1970-1990",
        "importance": "Transição para o Continente",
        "summary": "Com a barreira enfraquecida, anomalias biológicas infiltram-se no continente: Mímicos Genéticos substituem pessoas e criaturas como O Eco aninham-se em minas profundas.",
        "quote": "Relatos de pessoas substituídas por impostores e vozes de parentes falecidos chamando em túneis nasceram de vazamentos reais.",
        "characters": [
          "char_elias_rocha"
        ],
        "bestiary": [
          "creature_mimico",
          "creature_eco"
        ],
        "caused_by": [
          "node_folclore_maritimo"
        ],
        "leads_to": [
          "node_fundacao_aegis",
          "node_sumico_lucas"
        ]
      },
      {
        "id": "node_fundacao_aegis",
        "title": "Fundação da A.E.G.I.S. & Doutrina Kaelen",
        "era_id": "era_moderna",
        "vertente_id": "era_moderna",
        "year_display": "1968 // Notariado em Genebra",
        "importance": "Ordem Tática Global",
        "summary": "A Agência de Exploração e Gerenciamento de Incursões Secretas é fundada sob o Diretor Kaelen, combinando Sensitivos forenses e Agentes Despertos armados.",
        "quote": "Câmeras comuns gravam apenas móveis voando; apenas lentes tratadas com cristais anômalos da A.E.G.I.S. registram o contorno de uma Alma.",
        "characters": [
          "char_kaelen",
          "char_kenji_sato",
          "char_helena_vargas"
        ],
        "relics": [
          "relic_retrovirus"
        ],
        "caused_by": [
          "node_lendas_urbanas_mimetismo"
        ],
        "leads_to": [
          "node_resgate_triangulo_aegis",
          "node_gala_oeht_plano"
        ]
      },
      {
        "id": "node_cinco_estagios",
        "title": "A Travessia dos Cinco Estágios Sensoriais",
        "era_id": "vertente_triangulo",
        "vertente_id": "vertente_triangulo",
        "year_display": "1998 // Início da Campanha I",
        "importance": "Ruptura Dimensional",
        "summary": "A embarcação cruza o horizonte: borda infinita, repetição em loop, redemoinhos gravitacionais, dor craniana pela Lei da Alucinação e o êxtase final.",
        "quote": "No instante exato da passagem, a dor cessa abruptamente e dá lugar a uma euforia sobrenatural.",
        "characters": [
          "char_guia_temporario"
        ],
        "caused_by": [
          "node_nova_caronte_fundacao"
        ],
        "leads_to": [
          "node_campo_de_rosas"
        ]
      },
      {
        "id": "node_campo_de_rosas",
        "title": "Sessão 1: O Campo de Rosas & O Sacrifício do Guia",
        "era_id": "vertente_triangulo",
        "vertente_id": "vertente_triangulo",
        "year_display": "1998 // Sessão 1",
        "importance": "Clímax de Horror",
        "summary": "O mar congela azul e surge o Diabo do Mar. Diante do colapso neurológico iminente pelo Campo de Rosas, o Guia dispara para o alto e se sacrifica para que os sobreviventes fujam.",
        "quote": "O impacto traumático desse sacrifício estabelece o Diabo do Mar como o predador supremo da realidade.",
        "characters": [
          "char_guia_temporario",
          "char_arquiteto"
        ],
        "bestiary": [
          "creature_primogenito_arquiteto"
        ],
        "caused_by": [
          "node_cinco_estagios",
          "node_primogenito_fenda"
        ],
        "leads_to": [
          "node_sessao_2_triangulo"
        ]
      },
      {
        "id": "node_sessao_2_triangulo",
        "title": "Sessão 2: Travessia do Arquipélago & A Ilha Canibal",
        "era_id": "vertente_triangulo",
        "vertente_id": "vertente_triangulo",
        "year_display": "1998 // Sessão 2",
        "importance": "Sobrevivência Selvagem",
        "summary": "Sem guia, o grupo navega entre postos de contrabandistas até aportar na Ilha Canibal, enfrentando castas baixas armadas de osso e feras de 400 anos.",
        "quote": "O próprio ambiente mutagênico força os sobreviventes a desenvolverem pequenas adaptações biológicas para não perecerem.",
        "characters": [
          "char_raissa_carnica"
        ],
        "bestiary": [
          "creature_povo_sauriano"
        ],
        "caused_by": [
          "node_campo_de_rosas",
          "node_ilha_canibal_origem"
        ],
        "leads_to": [
          "node_cidadela_nacar_conflito"
        ]
      },
      {
        "id": "node_cidadela_nacar_conflito",
        "title": "Os Leilões da Cidadela de Nácar & O Fosso",
        "era_id": "vertente_triangulo",
        "vertente_id": "vertente_triangulo",
        "year_display": "1998 // Sessão 3",
        "importance": "Rebelião & Fuga",
        "summary": "O grupo evita a captura escravista em Nácar, sobrevive aos pulsos de PEM no Fosso do Kraken e escapa das ondas acústicas do Leviatã Branco.",
        "quote": "Sociedade rigidamente estratificada notória por organizar leilões de recém-chegados capturados nas águas externas.",
        "characters": [
          "char_iris_vento_solto",
          "char_valerius"
        ],
        "bestiary": [
          "creature_kraken",
          "creature_leviata_branco"
        ],
        "caused_by": [
          "node_sessao_2_triangulo"
        ],
        "leads_to": [
          "node_resgate_triangulo_aegis"
        ]
      },
      {
        "id": "node_resgate_triangulo_aegis",
        "title": "Rompimento do Bloqueio & Recrutamento A.E.G.I.S.",
        "era_id": "vertente_triangulo",
        "vertente_id": "vertente_triangulo",
        "year_display": "1998 // Desfecho",
        "importance": "Integração Canônica",
        "summary": "Os sobreviventes abrem brecha dimensional e são interceptados pela frota da A.E.G.I.S. O Diretor Kaelen recruta o grupo devido ao alto MDA e resistência mental.",
        "quote": "Estabelecendo a ponte direta entre o horror marítimo da Campanha I e as operações de contenção urbana das campanhas seguintes.",
        "characters": [
          "char_kaelen",
          "char_marcos_valente"
        ],
        "caused_by": [
          "node_cidadela_nacar_conflito",
          "node_fundacao_aegis"
        ],
        "leads_to": [
          "node_colapso_iminente"
        ]
      },
      {
        "id": "node_sumico_lucas",
        "title": "A Noite da Farsa & O Desaparecimento de Lucas",
        "era_id": "vertente_vilar",
        "vertente_id": "vertente_vilar",
        "year_display": "2021 (-3 Anos) // Incidente Inicial",
        "importance": "Gênese do Conflito",
        "summary": "Uma brincadeira humilhante orquestrada por Rafael e uma briga com Arthur fazem Lucas fugir na mata, cair nas galerias da mina e quebrar a perna no escuro.",
        "quote": "Nenhum dos cinco amigos assassinou Lucas, mas cada um deles carrega uma fração direta de culpa pelo desaparecimento.",
        "characters": [
          "char_lucas",
          "char_rafael",
          "char_arthur",
          "char_bia",
          "char_helena",
          "char_diego"
        ],
        "caused_by": [
          "node_lendas_urbanas_mimetismo"
        ],
        "leads_to": [
          "node_criacao_limiar"
        ]
      },
      {
        "id": "node_criacao_limiar",
        "title": "O Luto de Gabriel & Criação do Projeto LIMIAR",
        "era_id": "vertente_vilar",
        "vertente_id": "vertente_vilar",
        "year_display": "2022-2023 // Projeto Secreto",
        "importance": "Tecnologia Experimental",
        "summary": "Gabriel Vilar, convencido de que o irmão caçula foi assassinado pelos amigos, desenvolve portais de curta distância com som ZZZZT e âncoras na mansão.",
        "quote": "Diferente da magia, o Projeto LIMIAR opera sob limitações de física: exige âncoras espaciais prévias e tem bateria restrita.",
        "characters": [
          "char_gabriel"
        ],
        "relics": [
          "relic_limiar"
        ],
        "caused_by": [
          "node_sumico_lucas"
        ],
        "leads_to": [
          "node_expresso_vilar"
        ]
      },
      {
        "id": "node_expresso_vilar",
        "title": "Atos I-II: O Expresso, o Sexto Bilhete & Davi Reis",
        "era_id": "vertente_vilar",
        "vertente_id": "vertente_vilar",
        "year_display": "2024 // Atos I-II",
        "importance": "Início do Thriller",
        "summary": "Os 5 amigos voltam à serra; o fiscal valida 6 bilhetes; a gravação promete julgamento. Na mansão isolada, encontram os NPCs e o suposto eletricista Davi Reis.",
        "quote": "'Três anos. Cinco mentirosos. Hoje nós vamos descobrir o que vocês fizeram com Lucas.'",
        "characters": [
          "char_rafael",
          "char_gabriel",
          "char_camila_torres",
          "char_mauro_azevedo",
          "char_elias_rocha"
        ],
        "caused_by": [
          "node_criacao_limiar"
        ],
        "leads_to": [
          "node_limiar_ataques"
        ]
      },
      {
        "id": "node_limiar_ataques",
        "title": "Atos III-V: Ataques do Mascarado & A Queda da Máscara",
        "era_id": "vertente_vilar",
        "vertente_id": "vertente_vilar",
        "year_display": "2024 // Atos III-V",
        "importance": "Revelação Psicológica",
        "summary": "Ataques com portais de ozônio forçam os cinco a revelarem suas culpas. Gabriel é desmascarado; ao saber que não houve homicídio, a busca volta-se às minas.",
        "quote": "A revelação dos segredos dos cinco amigos prova que ninguém matou Lucas, redirecionando a investigação para as minas.",
        "characters": [
          "char_gabriel",
          "char_helena",
          "char_diego",
          "char_bia"
        ],
        "relics": [
          "relic_limiar"
        ],
        "caused_by": [
          "node_expresso_vilar"
        ],
        "leads_to": [
          "node_minas_eco_resgate"
        ]
      },
      {
        "id": "node_minas_eco_resgate",
        "title": "Atos VI-VIII: A Caçada do Eco, Lucas Vivo & Explosão",
        "era_id": "vertente_vilar",
        "vertente_id": "vertente_vilar",
        "year_display": "2024 // Desfecho Concluído",
        "importance": "Resolução Heróica",
        "summary": "Descida às galerias sob perseguição do Eco; encontro de Lucas vivo adaptado às trevas; fuga tensa e detonação das minas, encerrando o trauma familiar.",
        "quote": "Lucas sobreviveu no escuro por três anos. Apesar das mutações de sobrevivência, ele ainda é Lucas.",
        "characters": [
          "char_lucas",
          "char_gabriel",
          "char_arthur"
        ],
        "bestiary": [
          "creature_eco"
        ],
        "caused_by": [
          "node_limiar_ataques"
        ],
        "leads_to": [
          "node_colapso_iminente"
        ]
      },
      {
        "id": "node_gala_oeht_plano",
        "title": "A Conspiração Corporativa de Theo Vanderberg",
        "era_id": "vertente_oeht",
        "vertente_id": "vertente_oeht",
        "year_display": "2026 // Fase Tática 1",
        "importance": "Privatização Paranormal",
        "summary": "Oeht desafia a A.E.G.I.S. ao montar um mercado clandestino de relíquias anômalas para a elite mundial em Genebra, guardando lodo ácido no cofre.",
        "quote": "Empresário visionário e arrogante que declarou guerra à A.E.G.I.S. para privatizar o controle do paranormal.",
        "characters": [
          "char_oeht",
          "char_kaelen",
          "char_victor_kael"
        ],
        "caused_by": [
          "node_fundacao_aegis",
          "node_ordens_sacrificio"
        ],
        "leads_to": [
          "node_infiltracao_belvedere"
        ]
      },
      {
        "id": "node_infiltracao_belvedere",
        "title": "Infiltração em Belvedere & A Mesa de Poker VIP",
        "era_id": "vertente_oeht",
        "vertente_id": "vertente_oeht",
        "year_display": "2026 // Fase Tática 2",
        "importance": "Espionagem Oculta",
        "summary": "Agentes Despertos infiltram-se no baile nos Alpes. Victor Kael sabota a contenção; o vazamento de lodo roxo é detectado antes do discurso das 23h00.",
        "quote": "Homem de terno vinho infiltrado na gala de Oeht. Sabotador ativo da missão da A.E.G.I.S.",
        "characters": [
          "char_kenji_sato",
          "char_victor_kael",
          "char_lorenzo_vane"
        ],
        "caused_by": [
          "node_gala_oeht_plano"
        ],
        "leads_to": [
          "node_meia_noite_anarquico"
        ]
      },
      {
        "id": "node_meia_noite_anarquico",
        "title": "Meia-Noite: A Redoma Hermética & O Anárquico",
        "era_id": "vertente_oeht",
        "vertente_id": "vertente_oeht",
        "year_display": "2026 // Clímax da Campanha III",
        "importance": "Ameaça Cataclísmica",
        "summary": "À 00h00, a redoma sela a mansão; o bolo gigante transmuta-se no Anárquico; a caixa de música toca no palco e garçons tornam-se Zumbis de Sangue.",
        "quote": "Criatura colossal despertada à meia-noite a partir da transmutação do bolo de Oeht, invulnerável enquanto a caixa de música tocar.",
        "characters": [
          "char_oeht",
          "char_clara_mendes",
          "char_helena_vargas"
        ],
        "bestiary": [
          "creature_parasita_redoma_oeht",
          "mob_blood_zombies",
          "mob_gallery_reflections"
        ],
        "caused_by": [
          "node_infiltracao_belvedere"
        ],
        "leads_to": [
          "node_colapso_iminente"
        ]
      },
      {
        "id": "node_colapso_iminente",
        "title": "O Colapso da Realidade Exterior & O Apocalipse Genético",
        "era_id": "vertente_colapso",
        "vertente_id": "vertente_colapso",
        "year_display": "Horizonte Futuro Crítico",
        "importance": "Ponto de Convergência Universal",
        "summary": "A barreira do Triângulo cede em escala planetária. Um navio com 5.000 passageiros desaparece em transmissão ao vivo. A Terra caminha para a fusão com a Lei da Alucinação.",
        "quote": "'Incursão acontecendo, é o fim do...' — Última transmissão antes da perda total de sinal no desaparecimento de 5.000 pessoas.",
        "characters": [
          "char_kaelen",
          "char_oeht",
          "char_lucas"
        ],
        "bestiary": [
          "creature_primogenito_arquiteto",
          "creature_kraken"
        ],
        "caused_by": [
          "node_resgate_triangulo_aegis",
          "node_minas_eco_resgate",
          "node_meia_noite_anarquico"
        ],
        "leads_to": []
      }
    ],
    "links": [
      {
        "from": "node_hallucigenia",
        "to": "node_primogenito_fenda",
        "type": "ancestry",
        "label": "Origem Biológica"
      },
      {
        "from": "node_primogenito_fenda",
        "to": "node_loki_mito",
        "type": "myth",
        "label": "Mito Escandinavo"
      },
      {
        "from": "node_primogenito_fenda",
        "to": "node_merlin_excalibur",
        "type": "myth",
        "label": "Ciclo Arturiano"
      },
      {
        "from": "node_merlin_excalibur",
        "to": "node_ordens_sacrificio",
        "type": "esoteric",
        "label": "Ocultismo Humano"
      },
      {
        "from": "node_primogenito_fenda",
        "to": "node_ilha_canibal_origem",
        "type": "evolution",
        "label": "Vazamento Biológico"
      },
      {
        "from": "node_primogenito_fenda",
        "to": "node_folclore_maritimo",
        "type": "folklore",
        "label": "Monstros nos Mares"
      },
      {
        "from": "node_folclore_maritimo",
        "to": "node_nova_caronte_fundacao",
        "type": "expansion",
        "label": "Cidade de Carcaças"
      },
      {
        "from": "node_folclore_maritimo",
        "to": "node_lendas_urbanas_mimetismo",
        "type": "leakage",
        "label": "Fendas Terrestres"
      },
      {
        "from": "node_lendas_urbanas_mimetismo",
        "to": "node_fundacao_aegis",
        "type": "response",
        "label": "Doutrina de Contenção"
      },
      {
        "from": "node_lendas_urbanas_mimetismo",
        "to": "node_sumico_lucas",
        "type": "tragedy",
        "label": "O Eco nas Minas"
      },
      {
        "from": "node_nova_caronte_fundacao",
        "to": "node_cinco_estagios",
        "type": "campaign_1",
        "label": "Horizonte Atemporal"
      },
      {
        "from": "node_cinco_estagios",
        "to": "node_campo_de_rosas",
        "type": "campaign_1",
        "label": "Sessão 1: Mar de Rosas"
      },
      {
        "from": "node_campo_de_rosas",
        "to": "node_sessao_2_triangulo",
        "type": "campaign_1",
        "label": "Sessão 2: Arquipélago"
      },
      {
        "from": "node_ilha_canibal_origem",
        "to": "node_sessao_2_triangulo",
        "type": "lore_link",
        "label": "Encontro Canibal"
      },
      {
        "from": "node_sessao_2_triangulo",
        "to": "node_cidadela_nacar_conflito",
        "type": "campaign_1",
        "label": "Leilões e Abismos"
      },
      {
        "from": "node_cidadela_nacar_conflito",
        "to": "node_resgate_triangulo_aegis",
        "type": "campaign_1",
        "label": "Fuga & Extração"
      },
      {
        "from": "node_fundacao_aegis",
        "to": "node_resgate_triangulo_aegis",
        "type": "tactical",
        "label": "Recrutamento Kaelen"
      },
      {
        "from": "node_sumico_lucas",
        "to": "node_criacao_limiar",
        "type": "campaign_2",
        "label": "Vendeta de Gabriel"
      },
      {
        "from": "node_criacao_limiar",
        "to": "node_expresso_vilar",
        "type": "campaign_2",
        "label": "O Sexto Bilhete"
      },
      {
        "from": "node_expresso_vilar",
        "to": "node_limiar_ataques",
        "type": "campaign_2",
        "label": "Portais na Mansão"
      },
      {
        "from": "node_limiar_ataques",
        "to": "node_minas_eco_resgate",
        "type": "campaign_2",
        "label": "Descida & Resgate"
      },
      {
        "from": "node_ordens_sacrificio",
        "to": "node_gala_oeht_plano",
        "type": "ritual",
        "label": "Leilão de Artefatos"
      },
      {
        "from": "node_fundacao_aegis",
        "to": "node_gala_oeht_plano",
        "type": "tactical",
        "label": "Alerta em Genebra"
      },
      {
        "from": "node_gala_oeht_plano",
        "to": "node_infiltracao_belvedere",
        "type": "campaign_3",
        "label": "Infiltração Tática"
      },
      {
        "from": "node_infiltracao_belvedere",
        "to": "node_meia_noite_anarquico",
        "type": "campaign_3",
        "label": "A Meia-Noite"
      },
      {
        "from": "node_resgate_triangulo_aegis",
        "to": "node_colapso_iminente",
        "type": "critical",
        "label": "Barreira Cedendo"
      },
      {
        "from": "node_minas_eco_resgate",
        "to": "node_colapso_iminente",
        "type": "critical",
        "label": "Fendas Continentais"
      },
      {
        "from": "node_meia_noite_anarquico",
        "to": "node_colapso_iminente",
        "type": "critical",
        "label": "Ruptura de Redoma"
      }
    ]
  }
};
  }
}

// Instância global
window.DataLoader = DataLoader;
