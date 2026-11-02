/**
 * DATA LOADER & HISTORICAL ARCHIVE ENGINE
 * Universo: Evren — Museu Histórico Interativo 3D
 * Carrega e provê acesso estruturado ao world_data.json com hierarquia geográfica completa:
 * PLANETA -> CONTINENTE -> PAÍS -> REGIÃO -> CIDADE/LOCAL -> CAMPANHA -> HISTÓRIA
 */

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
      if (campaignFilter === 'camp_003' && (loc.map_id === 'map_artico' || (loc.zone && loc.zone.includes('Groenlândia')))) return true;
      if (campaignFilter === 'camp_004' && (loc.map_id === 'map_brasil' || (loc.zone && loc.zone.includes('Brasil')))) return true;
      if (campaignFilter === 'camp_005' && (loc.map_id === 'map_alemanha' || (loc.zone && loc.zone.includes('Alemanha')))) return true;
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

      if (campaignFilter === 'camp_002' && ['char_lucas', 'char_gabriel', 'char_rafael', 'char_julia'].includes(char.id)) {
        return true;
      }
      if (campaignFilter === 'camp_001' && (char.id === 'char_arquiteto' || (char.status && char.status.includes('Triângulo')))) {
        return true;
      }
      if (campaignFilter === 'camp_003' && ['char_evelyn', 'char_miller'].includes(char.id)) {
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

    const want = (t) => entityType === 'all' || entityType === t;
    return {
      campaigns: want('campaigns') ? campaigns : [],
      characters: want('characters') ? characters : [],
      locations: want('locations') ? locations : [],
      events: want('events') ? events : [],
      sessions: want('sessions') ? sessions : [],
      artifacts: want('artifacts') ? artifacts : [],
      organizations: want('organizations') ? organizations : []
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
  getEmbeddedFallbackData() {
    return {
  "universe_rules": {
    "system": "Evren",
    "universe": "Evren",
    "attributes": [
      "Força",
      "Vigor",
      "Agilidade",
      "Presença",
      "Intelecto"
    ],
    "mechanics": [
      "MDA",
      "Pontos de Determinação (PD)",
      "Sacrifício de Armadura",
      "Desempate Letal"
    ]
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
      "status": "Em andamento",
      "category": "ongoing",
      "theme": "Survival Horror Biológico",
      "map_id": "map_triangulo",
      "world_coordinates": [
        25.5,
        -71.5
      ],
      "gateway_name": "O Triângulo das Bermudas / A Incursão",
      "danger_rating": "NÍVEL ÔMEGA // 99% MDA",
      "country_location": "Oceano Atlântico Norte (Triângulo das Bermudas)",
      "year": "Ano 2026 // Presente",
      "description": "No coração do verdadeiro Triângulo das Bermudas, um buraco de minhoca no Atlântico engole navios. Lá, a magia não existe: apenas mutação biológica violenta sob a mente do Arquiteto do Caos.",
      "synopsis": "Um navio com centenas de sobreviventes foi tragado pelo vórtice dimensional no Atlântico. Ao cruzarem a fenda para Nova Caronte, descobriram que leis biológicas foram distorcidas. O Arquiteto do Caos manipula mentes e corpos enquanto a A.E.G.I.S. tenta conter o colapso.",
      "participants": [
        "char_arquiteto"
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
      "status_museum": "em andamento",
      "historical_context": "Em 2025, distúrbios magnéticos e biológicos severos começaram a ser registrados no corredor marítimo entre Miami, Bermudas e Porto Rico. O desaparecimento de uma embarcação de grande porte com milhares de passageiros deu início à formação do reduto isolado de Nova Caronte.",
      "exhibition_narrative": {
        "prior_context": "Durante anos, relatórios navais da Fundação A.E.G.I.S. apontavam anomalias hidrográficas e desaparecimentos de embarcações na Fossa de Porto Rico e no Triângulo das Bermudas. Experimentos genéticos clandestinos conduzidos na década anterior prepararam o terreno para a emergência da entidade conhecida como Cobaia Zero.",
        "campaign_beginning": "A história tem início quando um navio transportando cerca de 5.000 almas é engolido por uma violenta tempestade elétrica no Atlântico Norte e arremessado às costas rochosas de Nova Caronte.",
        "main_events": "Os sobreviventes do naufrágio precisaram estabelecer um perímetro costeiro em meio a recursos escassos, enquanto enfrentavam organismos marinhos com mutagênese acelerada (MDA) e infiltração de mímicos biológicos entre a própria tripulação.",
        "turning_points": "A descoberta de que as leis biológicas locais estavam sendo ativamente manipuladas pelo 'Arquiteto do Caos' (também documentado nos registros marítimos como Diabo do Mar) mudou o objetivo da expedição de simples resgate para sobrevivência e envio de sinal à A.E.G.I.S.",
        "conflicts": "Confrontos diretos nas docas destroçadas de Nova Caronte e no Fosso do Kraken contra o Soberano Abissal e os organismos de guarda do Arquiteto.",
        "revelations": "Revelou-se que Nova Caronte funciona como um laboratório evolutivo fechado, onde a pressão extrema desperta adaptações celulares agressivas nos sobreviventes.",
        "consequences": "Isolamento total do perímetro marítimo do Atlântico Norte pela A.E.G.I.S. e mobilização de frotas de observação oceânica.",
        "outcome": "Exposição em andamento — Os acontecimentos finais de Nova Caronte seguem em curso e aguardam novos registros históricos das próximas sessões."
      },
      "pending_documentation": [
        "Nomes completos e biografias individuais dos demais tripulantes jogadores do navio de 5.000 almas (pendente de envio pelo curador).",
        "Desfecho definitivo da campanha (atualmente em andamento)."
      ],
      "historical_identification": {
        "name": "A Incursão: O Purgatório Genético",
        "year": "Ano 2026 // Presente",
        "period_numeric": 2026,
        "status": "em andamento",
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
      }
    },
    {
      "id": "camp_002",
      "title": "Até o Amanhecer: O Limiar da Mansão Vilar",
      "status": "Concluída / Histórica",
      "category": "completed",
      "theme": "Thriller Psicológico Investigativo",
      "map_id": "map_vilar",
      "world_coordinates": [
        21.85,
        -102.25
      ],
      "gateway_name": "Mansão Vilar: Até o Amanhecer (México)",
      "danger_rating": "NÍVEL ALFA // ECOS & LIMIAR",
      "country_location": "México (Serra Mineradora)",
      "year": "Ano 2024 // Finalizada",
      "description": "Na região montanhosa e mineradora do México, cinco amigos retornam à isolada Mansão Vilar, onde foram manipulados psicologicamente por uma figura mascarada armada com o LIMIAR.",
      "synopsis": "Três anos após o desaparecimento trágico de Lucas Vilar nas minas mexicanas, o grupo de amigos reuniu-se na propriedade isolada. Gabriel Vilar assumiu o manto de 'O Mascarado', usando a arma de portais LIMIAR para encenar um jogo de terror psicológico para expor a culpa de cada um. No clímax subterrâneo, o grupo enfrentou os Ecos e explodiu o complexo.",
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
        "status": "concluída",
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
      }
    },
    {
      "id": "camp_003",
      "title": "O Túmulo do Leviatã: Estação Criogênica Zero",
      "status": "Em andamento",
      "category": "ongoing",
      "theme": "Terror Sci-Fi & Claustrofobia Polar",
      "map_id": "map_artico",
      "world_coordinates": [
        72,
        -40
      ],
      "gateway_name": "Estação Criogênica Zero (Groenlândia)",
      "danger_rating": "NÍVEL BETA // CRIOPARASITAS",
      "country_location": "Groenlândia (Calota Polar Ártica)",
      "year": "Ano 2026 // Presente",
      "description": "Nas profundezas do manto de gelo da Groenlândia, a estação de biopesquisa Zero da A.E.G.I.S. cessou transmissões após perfurar uma caverna subglacial contendo o tecido fossilizado de um Leviatã Primordial.",
      "synopsis": "Uma expedição de biopesquisa da A.E.G.I.S. na Groenlândia extraiu amostras celulares de um monólito de gelo negro ligado à fenda do Triângulo das Bermudas. Quando o espécime rompeu a quarentena, o Comandante Miller e a Dra. Evelyn Shaw entraram em isolamento de emergência.",
      "participants": [
        "char_evelyn",
        "char_miller"
      ],
      "locations_list": [
        "loc_estacao_zero",
        "loc_monolito_gelo"
      ],
      "continent_id": "cont_artico",
      "country_id": "country_groenlandia",
      "region_id": "reg_calota_artica",
      "city_id": "city_outpost_zero",
      "period_numeric": 2026,
      "status_museum": "em andamento",
      "historical_context": "Expedição científica e militar de alta prioridade instalada na Calota Polar da Groenlândia em 2026, após radares de penetração no gelo identificarem uma estrutura monolítica e um organismo colossal preservado a 800 metros de profundidade.",
      "exhibition_narrative": {
        "prior_context": "O aquecimento de correntes subterrâneas sob a geleira central da Groenlândia provocou fissuras no gelo milenar. A Fundação A.E.G.I.S. ergueu a Estação Criogênica Zero para investigar a anomalia antes que o degelo atingisse o oceano.",
        "campaign_beginning": "O corte abrupto de comunicações da equipe científica liderada pela Dra. Evelyn Shaw levou ao envio de um destacamento tático sob comando de Marcus Miller, com consultoria arquivística de Hans Richter.",
        "main_events": "A chegada à Estação Zero sob nevasca extrema revelou laboratórios em quarentena biológica, cilindros de criostase rompidos e sinais de infecção por um parasita glacial dormente há milênios.",
        "turning_points": "A descida pela Fenda do Monólito de Gelo Negro, onde os expedicionários avistaram a silhueta congelada do 'Leviatã' e compreenderam que o próprio gelo escuro funcionava como uma prisão biológica.",
        "conflicts": "Defesa dos módulos térmicos da Estação Zero contra hospedeiros tomados pelo parasita glacial e luta contra a hipotermia extrema nos túneis de gelo.",
        "revelations": "As análises forenses da Dra. Evelyn Shaw demonstraram que o organismo polar compartilha marcadores mutagênicos ancestrais com as amostras recolhidas no Atlântico Norte e na Amazônia.",
        "consequences": "Decretação de Quarentena Polar Nível Beta e isolamento da Dra. Evelyn Shaw em ala médica pressurizada para conter o avanço da infecção.",
        "outcome": "Exposição em andamento — A contenção definitiva da Fenda do Monólito continua aberta nos registros atuais do planeta."
      },
      "pending_documentation": [
        "Relatório final de encerramento da expedição ártica (campanha em andamento)."
      ],
      "historical_identification": {
        "name": "O Túmulo do Leviatã: Estação Criogênica Zero",
        "year": "Ano 2026 // Presente",
        "period_numeric": 2026,
        "status": "em andamento",
        "continent_id": "cont_artico",
        "country_id": "country_groenlandia",
        "region_id": "reg_calota_artica",
        "city_id": "city_outpost_zero",
        "geographic_location": "Groenlândia (Calota Polar Ártica)",
        "coordinates": [
          72,
          -40
        ],
        "genre_theme": "Terror Sci-Fi & Claustrofobia Polar",
        "synopsis": "Uma expedição de biopesquisa da A.E.G.I.S. na Groenlândia extraiu amostras celulares de um monólito de gelo negro ligado à fenda do Triângulo das Bermudas. Quando o espécime rompeu a quarentena, o Comandante Miller e a Dra. Evelyn Shaw entraram em isolamento de emergência.",
        "historical_context": "Expedição científica e militar de alta prioridade instalada na Calota Polar da Groenlândia em 2026, após radares de penetração no gelo identificarem uma estrutura monolítica e um organismo colossal preservado a 800 metros de profundidade."
      }
    },
    {
      "id": "camp_004",
      "title": "Protocolo Selva: Os Ecos do Ouro Negro",
      "status": "Concluída / Histórica",
      "category": "completed",
      "theme": "Horror Cósmico & Sobrevivência Tática",
      "map_id": "map_brasil",
      "world_coordinates": [
        -4.25,
        -55.98
      ],
      "gateway_name": "Protocolo Selva: Ouro Negro (Brasil)",
      "danger_rating": "NÍVEL ÔMEGA // ESPOROS BIOELÉTRICOS",
      "country_location": "Brasil (Amazônia / Rio Tapajós)",
      "year": "Ano 2025 // Finalizada",
      "description": "No coração da floresta amazônica brasileira, uma fenda subterrânea de quartzo negro assimilou memórias e corpos de geólogos.",
      "synopsis": "Uma expedição secreta do esquadrão Curupira penetrou a selva após o sumiço de geólogos. O Capitão Thiago Santos e a Dra. Camila Neves descobriram que as raízes da floresta canalizavam frequências do Arquiteto do Caos. Após uma fuga desesperada, a caverna de quartzo foi detonada para evitar a proliferação dos esporos.",
      "outcome": "✓ O núcleo de dados da expedição geológica foi recuperado intacto.\n✓ A caverna subterrânea foi implodida com cargas táticas de fósforo branco.\n✓ Capitão Santos e Dra. Neves sobreviveram, embora a bióloga permaneça em observação por alterações sinápticas.",
      "participants": [
        "char_thiago",
        "char_camila"
      ],
      "locations_list": [
        "loc_tapajos",
        "loc_quartzo"
      ],
      "continent_id": "cont_america_sul",
      "country_id": "country_brasil",
      "region_id": "reg_bacia_tapajos",
      "city_id": "city_itaituba_tapajos",
      "period_numeric": 2025,
      "status_museum": "concluída",
      "historical_context": "Operação de investigação ambiental, científica e militar realizada em 2025 no coração da Floresta Amazônica brasileira, ao longo da bacia do Rio Tapajós, após o desaparecimento de operários em um garimpo clandestino.",
      "exhibition_narrative": {
        "prior_context": "No início de 2025, escavadeiras de um garimpo ilegal próximo a um afluente do Rio Tapajós atingiram um bolsão geológico subterrâneo contendo um fluido viscoso denominado 'Ouro Negro' e cristais de quartzo escuro.",
        "campaign_beginning": "O Capitão Thiago Santos e a pesquisadora Dra. Camila Neves foram enviados à Amazônia para instalar o Acampamento Base Tapajós e averiguar o silêncio total das comunidades e trabalhadores locais.",
        "main_events": "A incursão pela selva fechada revelou que a flora e a fauna ao redor do garimpo haviam sofrido um crescimento radicular agressivo e que a água do afluente apresentava contaminação mutagênica.",
        "turning_points": "A localização da Cratera de Quartzo Negro no subsolo da floresta e a recuperação do diário do engenheiro-chefe do garimpo, provando que o lençol freático estava prestes a levar o patógeno até o curso principal do Rio Tapajós.",
        "conflicts": "Resistência armada no perímetro do acampamento contra a vegetação hostil e organismos silvestres alterados enquanto as cargas incendiárias eram posicionadas na cratera.",
        "revelations": "A Dra. Camila Neves identificou que o Nódulo de Quartzo Mutagênico emitia frequência idêntica aos registros catalogados na Europa dois anos antes.",
        "consequences": "A Cratera de Quartzo Negro foi cauterizada com sucesso pelo Capitão Thiago Santos por meio de queimada controlada. A Dra. Camila Neves contraiu contaminação residual durante a coleta de amostras e permaneceu sob quarentena médica.",
        "outcome": "Campanha concluída — O Rio Tapajós foi salvo da contaminação em larga escala e a zona da cratera permanece interditada."
      },
      "pending_documentation": [],
      "historical_identification": {
        "name": "Protocolo Selva: Os Ecos do Ouro Negro",
        "year": "Ano 2025 // Finalizada",
        "period_numeric": 2025,
        "status": "concluída",
        "continent_id": "cont_america_sul",
        "country_id": "country_brasil",
        "region_id": "reg_bacia_tapajos",
        "city_id": "city_itaituba_tapajos",
        "geographic_location": "Brasil (Amazônia / Rio Tapajós)",
        "coordinates": [
          -4.25,
          -55.98
        ],
        "genre_theme": "Horror Cósmico & Sobrevivência Tática",
        "synopsis": "Uma expedição secreta do esquadrão Curupira penetrou a selva após o sumiço de geólogos. O Capitão Thiago Santos e a Dra. Camila Neves descobriram que as raízes da floresta canalizavam frequências do Arquiteto do Caos. Após uma fuga desesperada, a caverna de quartzo foi detonada para evitar a proliferação dos esporos.",
        "historical_context": "Operação de investigação ambiental, científica e militar realizada em 2025 no coração da Floresta Amazônica brasileira, ao longo da bacia do Rio Tapajós, após o desaparecimento de operários em um garimpo clandestino."
      }
    },
    {
      "id": "camp_005",
      "title": "O Sussurro da Floresta Negra: O Monastério dos Sem-Rosto",
      "status": "Concluída / Histórica",
      "category": "completed",
      "theme": "Mistério Gótico & Amnésia Psicológica",
      "map_id": "map_alemanha",
      "world_coordinates": [
        48.15,
        8.2
      ],
      "gateway_name": "Monastério dos Sem-Rosto (Alemanha)",
      "danger_rating": "NÍVEL ALFA // FREQUÊNCIA DE AMNÉSIA",
      "country_location": "Alemanha (Floresta Negra / Baden-Württemberg)",
      "year": "Ano 2023 // Finalizada",
      "description": "Monastério medieval isolado nas brumas da Floresta Negra, onde monges heréticos entalharam sinos que deformavam a mente e roubavam identidades.",
      "synopsis": "Em 2023, o historiador Hans Richter e a investigadora forense Greta Falk foram contratados para investigar peregrinos que retornavam da floresta sem memória ou fisionomia identificável. No interior da cripta gótica, encontraram o altar do 'Eco Silencioso' ressonando com artefatos do LIMIAR.",
      "outcome": "✓ Os sinos de bronze da abadia foram quebrados e o complexo selado em concreto hidrofóbico.\n✓ Greta Falk recuperou os arquivos das vítimas, mas perdeu permanentemente a capacidade de fala vocal.\n✓ O arquivo secreto do monastério foi integrado à biblioteca confidencial da A.E.G.I.S.",
      "participants": [
        "char_greta",
        "char_hans"
      ],
      "locations_list": [
        "loc_monasterio",
        "loc_cripta"
      ],
      "continent_id": "cont_europa",
      "country_id": "country_alemanha",
      "region_id": "reg_floresta_negra",
      "city_id": "city_friburgo_agostinho",
      "period_numeric": 2023,
      "status_museum": "concluída",
      "historical_context": "Registrada em 2023 nas montanhas da Floresta Negra (Baden-Württemberg, Alemanha), esta é a exposição cronologicamente mais antiga das cinco grandes campanhas modernas do acervo, documentando o caso do Monastério de Santo Agostinho.",
      "exhibition_narrative": {
        "prior_context": "Fundado no século XIV e isolado desde a Peste Negra de 1348, o Monastério de Santo Agostinho guardava manuscritos acústicos e relíquias litúrgicas nas montanhas perto de Friburgo.",
        "campaign_beginning": "Em 2023, após relatos policiais de que moradores e monges da região haviam perdido inexplicavelmente a voz e a identidade facial, a inspetora criminal Greta Falk e o arquivista ocultista Hans Richter adentraram a Floresta Negra.",
        "main_events": "A investigação percorreu o claustro medieval sob neblina densa, decifrando inscrições latinas rasuradas e diários monásticos que descreviam o 'Sussurro dos Sem-Rosto'.",
        "turning_points": "A descoberta da passagem secreta atrás do altar-mor que conduzia à Cripta do Eco Silencioso, utilizando o Diapasão de Prata para anular as zonas de silêncio absoluto.",
        "conflicts": "Confronto nas catacumbas escuras contra a ressonância hipnótica do Sino de Bronze Sem-Rosto e os guardiões silenciosos da cripta.",
        "revelations": "Hans Richter comprovou que o fenômeno não era sobrenatural místico, mas uma anomalia acústico-cognitiva antiga capaz de apagar memórias e identidades através de frequências sonoras.",
        "consequences": "O Sino de Bronze foi rachado e neutralizado; Greta Falk sobreviveu com cicatrizes auditivas permanentes e Hans Richter passou a integrar o conselho consultivo internacional do C.R.I.S. / A.E.G.I.S.",
        "outcome": "Campanha concluída — As catacumbas de Santo Agostinho foram seladas com concreto acústico e os manuscritos transferidos para o Arquivo Histórico."
      },
      "pending_documentation": [],
      "historical_identification": {
        "name": "O Sussurro da Floresta Negra: O Monastério dos Sem-Rosto",
        "year": "Ano 2023 // Finalizada",
        "period_numeric": 2023,
        "status": "concluída",
        "continent_id": "cont_europa",
        "country_id": "country_alemanha",
        "region_id": "reg_floresta_negra",
        "city_id": "city_friburgo_agostinho",
        "geographic_location": "Alemanha (Floresta Negra / Baden-Württemberg)",
        "coordinates": [
          48.15,
          8.2
        ],
        "genre_theme": "Mistério Gótico & Amnésia Psicológica",
        "synopsis": "Em 2023, o historiador Hans Richter e a investigadora forense Greta Falk foram contratados para investigar peregrinos que retornavam da floresta sem memória ou fisionomia identificável. No interior da cripta gótica, encontraram o altar do 'Eco Silencioso' ressonando com artefatos do LIMIAR.",
        "historical_context": "Registrada em 2023 nas montanhas da Floresta Negra (Baden-Württemberg, Alemanha), esta é a exposição cronologicamente mais antiga das cinco grandes campanhas modernas do acervo, documentando o caso do Monastério de Santo Agostinho."
      }
    }
  ],
  "locations": [
    {
      "id": "loc_caronte",
      "name": "Nova Caronte",
      "zone": "O Triângulo das Bermudas (Anomalia Atlântica)",
      "type": "Cidadela Flutuante",
      "map_id": "map_triangulo",
      "scope": "local",
      "coordinates": [
        25.5,
        -73.2
      ],
      "description": "Um aglomerado caótico de galeões espanhóis, submarinos soviéticos e navios piratas no epicentro do Triângulo das Bermudas. Cheira a peixe podre e desespero.",
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
      ]
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
      "description": "Uma mansão cercada por floresta e tempestade nas serras do México. No porão, a entrada para as minas esquecidas assombradas pelos Ecos.",
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
      ]
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
      "id": "loc_estacao_zero",
      "name": "Laboratório Criogênico Zero",
      "zone": "Groenlândia (Calota Polar)",
      "type": "Instalação Científica Subterrânea",
      "map_id": "map_artico",
      "scope": "local",
      "coordinates": [
        72.15,
        -40.2
      ],
      "description": "Um labirinto hermético de concreto e titânio cercado por gelo a -50°C. Câmaras de quarentena quebradas, sangue negro congelado e alarmes de radiação biológica.",
      "chronicles": [
        "cron_arc_01"
      ],
      "continent_id": "cont_artico",
      "country_id": "country_groenlandia",
      "region_id": "reg_calota_artica",
      "city_id": "city_outpost_zero",
      "historical_type": "Complexo Científico & Laboratório Polar",
      "illustration": "assets/ref_fantasy_world_map.jpg",
      "historical_importance": "Instalação de contenção e pesquisa criogênica na Groenlândia liderada pela Dra. Evelyn Shaw e protegida pelo Comandante Marcus Miller.",
      "related_campaigns": [
        "camp_003"
      ],
      "characters_present": [
        "char_evelyn",
        "char_miller",
        "char_hans"
      ],
      "historical_events": [
        "cron_arc_01",
        "time_06"
      ],
      "epochs_active": [
        "2026–2027 (Em andamento)"
      ]
    },
    {
      "id": "loc_monolito_gelo",
      "name": "A Fenda do Monólito de Gelo Negro",
      "zone": "Groenlândia (Calota Polar)",
      "type": "Fissura Glacial Primordial",
      "map_id": "map_artico",
      "scope": "local",
      "coordinates": [
        71.85,
        -39.8
      ],
      "description": "Uma garganta sem fundo aberta no permafrost. No centro, uma estrutura orgânica espiralada de gelo negro que pulsa na frequência exata do Triângulo das Bermudas.",
      "continent_id": "cont_artico",
      "country_id": "country_groenlandia",
      "region_id": "reg_calota_artica",
      "city_id": "city_outpost_zero",
      "historical_type": "Sítio Geológico & Escavação Glacial",
      "illustration": "assets/ref_outdoor_waterfall.jpg",
      "historical_importance": "Fenda abissal a 800 metros sob a geleira onde foi descoberto o fóssil colossal do Leviatã e o Gelo Negro.",
      "related_campaigns": [
        "camp_003"
      ],
      "characters_present": [
        "char_evelyn",
        "char_miller"
      ],
      "historical_events": [
        "cron_arc_01",
        "time_06"
      ],
      "epochs_active": [
        "Era Pré-Glacial",
        "2026 (Descoberta)"
      ]
    },
    {
      "id": "loc_tapajos",
      "name": "Acampamento Base Tapajós",
      "zone": "Brasil (Amazônia / Rio Tapajós)",
      "type": "Base Tática de Selva",
      "map_id": "map_brasil",
      "campaign_id": "camp_004",
      "scope": "local",
      "coordinates": [
        -4.22,
        -55.95
      ],
      "description": "Base avançada camuflada sob a copa densa das árvores no Pará. Contém contêineres de biologia de campo e geradores silenciosos protegidos contra pulsos eletromagnéticos.",
      "chronicles": [
        "cron_bra_01"
      ],
      "continent_id": "cont_america_sul",
      "country_id": "country_brasil",
      "region_id": "reg_bacia_tapajos",
      "city_id": "city_itaituba_tapajos",
      "historical_type": "Acampamento Científico & Militar na Floresta",
      "illustration": "assets/ref_outdoor_waterfall.jpg",
      "historical_importance": "Base de operações às margens do Rio Tapajós de onde o Capitão Thiago Santos e a Dra. Camila Neves coordenaram o isolamento da região em 2025.",
      "related_campaigns": [
        "camp_004"
      ],
      "characters_present": [
        "char_thiago",
        "char_camila"
      ],
      "historical_events": [
        "cron_bra_01",
        "time_bra_01"
      ],
      "epochs_active": [
        "2025"
      ]
    },
    {
      "id": "loc_quartzo",
      "name": "A Cratera de Quartzo Negro",
      "zone": "Brasil (Subsolo da Selva)",
      "type": "Mina Clandestina & Cavidade Geológica",
      "map_id": "map_brasil",
      "campaign_id": "camp_004",
      "scope": "local",
      "coordinates": [
        -4.28,
        -56.02
      ],
      "description": "Uma fratura profunda na rocha basáltica onde veios gigantes de quartzo negro crescem como espinhos orgânicos emitindo um zumbido constante de baixa frequência.",
      "chronicles": [
        "cron_bra_01"
      ],
      "continent_id": "cont_america_sul",
      "country_id": "country_brasil",
      "region_id": "reg_bacia_tapajos",
      "city_id": "city_itaituba_tapajos",
      "historical_type": "Cratera Geológica & Ruína de Garimpo",
      "illustration": "assets/ref_outdoor_waterfall.jpg",
      "historical_importance": "epicentro da contaminação por 'Ouro Negro' na Amazônia, neutralizado por queimada controlada de napalm ao final da expedição de 2025.",
      "related_campaigns": [
        "camp_004"
      ],
      "characters_present": [
        "char_thiago",
        "char_camila"
      ],
      "historical_events": [
        "cron_bra_01",
        "time_bra_01"
      ],
      "epochs_active": [
        "2024–2025"
      ]
    },
    {
      "id": "loc_monasterio",
      "name": "Monastério de Santo Agostinho",
      "zone": "Alemanha (Floresta Negra)",
      "type": "Abadia Gótica Medieval",
      "map_id": "map_alemanha",
      "campaign_id": "camp_005",
      "scope": "local",
      "coordinates": [
        48.16,
        8.22
      ],
      "description": "Ruínas góticas do século XIV isoladas pelas névoas perpétuas da Floresta Negra. Suas paredes de pedra guardam inscrições herméticas que confundem a percepção espacial de quem as lê.",
      "chronicles": [
        "cron_ale_01"
      ],
      "continent_id": "cont_europa",
      "country_id": "country_alemanha",
      "region_id": "reg_floresta_negra",
      "city_id": "city_friburgo_agostinho",
      "historical_type": "Monastério Histórico & Arquivo Medieval",
      "illustration": "assets/ref_interior_tavern.jpg",
      "historical_importance": "Abadia gótica do século XIV na Floresta Negra onde Greta Falk e Hans Richter investigaram o desaparecimento acústico dos monges em 2023.",
      "related_campaigns": [
        "camp_005"
      ],
      "characters_present": [
        "char_greta",
        "char_hans"
      ],
      "historical_events": [
        "cron_ale_01",
        "time_ale_01"
      ],
      "epochs_active": [
        "Século XIV (Fundação)",
        "2023 (Investigação e Selamento)"
      ]
    },
    {
      "id": "loc_cripta",
      "name": "A Cripta do Eco Silencioso",
      "zone": "Alemanha (Catacumbas da Floresta Negra)",
      "type": "Cripta Subterrânea Lacrada",
      "map_id": "map_alemanha",
      "campaign_id": "camp_005",
      "scope": "local",
      "coordinates": [
        48.14,
        8.18
      ],
      "description": "Catacumbas subterrâneas sob a abadia onde os monges heréticos instalaram sinos de bronze sem badalo, ativados por ressonância paranormal do LIMIAR.",
      "continent_id": "cont_europa",
      "country_id": "country_alemanha",
      "region_id": "reg_floresta_negra",
      "city_id": "city_friburgo_agostinho",
      "historical_type": "Cripta Subterrânea & Câmara Acústica",
      "illustration": "assets/ref_interior_tavern.jpg",
      "historical_importance": "Subsolo abobadado sob o Monastério de Santo Agostinho onde o Sino de Bronze Sem-Rosto foi destruído para encerrar o fenômeno acústico.",
      "related_campaigns": [
        "camp_005"
      ],
      "characters_present": [
        "char_greta",
        "char_hans"
      ],
      "historical_events": [
        "cron_ale_01",
        "time_ale_01"
      ],
      "epochs_active": [
        "1348",
        "2023"
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
      "id": "char_evelyn",
      "name": "Dra. Evelyn Shaw",
      "codename": "A Geneticista do Gelo",
      "player": "NPC / Cientista Líder",
      "origin": "Cientista Forense",
      "class": "Especialista",
      "track": "Médica de Campo & Geneticista",
      "nex": "40%",
      "mda": "22%",
      "status": "Em Quarentena Polar",
      "life_status": "quarantine",
      "campaign_ids": [
        "camp_003"
      ],
      "attributes": {
        "Agilidade": 2,
        "Força": 1,
        "Intelecto": 5,
        "Presença": 3,
        "Vigor": 2
      },
      "stats": {
        "pv_current": 25,
        "pv_max": 25,
        "pe_current": 24,
        "pe_max": 24,
        "san_current": 26,
        "san_max": 42,
        "defesa": 15,
        "protecao": "Traje Criogênico Térmico (RD 2)"
      },
      "skills": {
        "Acrobacia": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 2
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
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 5
        },
        "Ciências": {
          "grau": "Expert",
          "bonus": 15,
          "attr": "INT",
          "total": 20
        },
        "Crime": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 2
        },
        "Diplomacia": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 3
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
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 2
        },
        "Iniciativa": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 2
        },
        "Intimidação": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 3
        },
        "Intuição": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 3
        },
        "Investigação": {
          "grau": "Veterano",
          "bonus": 10,
          "attr": "INT",
          "total": 15
        },
        "Luta": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "FOR",
          "total": 1
        },
        "Medicina": {
          "grau": "Expert",
          "bonus": 15,
          "attr": "INT",
          "total": 20
        },
        "Ocultismo": {
          "grau": "Veterano",
          "bonus": 10,
          "attr": "INT",
          "total": 15
        },
        "Percepção": {
          "grau": "Treinado",
          "bonus": 5,
          "attr": "PRE",
          "total": 8
        },
        "Pilotagem": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 2
        },
        "Pontaria": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 2
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
          "total": 2
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
          "total": 5
        },
        "Tática": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 5
        },
        "Tecnologia": {
          "grau": "Treinado",
          "bonus": 5,
          "attr": "INT",
          "total": 10
        },
        "Vontade": {
          "grau": "Treinado",
          "bonus": 5,
          "attr": "PRE",
          "total": 8
        }
      },
      "abilities": [
        "Cirurgia de Emergência: Trata traumas graves em campo com estabilizadores biológicos.",
        "Sequenciamento Imediato: Identifica anomalias em amostras genéticas sob microscópio de campo.",
        "Adaptação Criogênica: Resiste a ambientes com temperaturas extremas e ar contaminado."
      ],
      "inventory": [
        "Injetor de Criostase Inversa",
        "Micrótomo Laser Portátil",
        "Frascos de Solução Estabilizadora",
        "Tablet Blindado com Banco de Dados da AEGIS"
      ],
      "relics": [
        "Injetor de Criostase Inversa"
      ],
      "quote": "O organismo não estava petrificado... ele estava esperando que alguém gerasse calor suficiente para acordar.",
      "summary": "Diretora científica da Estação Zero na Groenlândia. Descobriu que o Leviatã congelado possui a mesma sequência telomérica do Arquiteto do Caos.",
      "portrait": "assets/icon-192.png",
      "historical_title": "Cientista-Chefe da Estação Criogênica Zero",
      "historical_status": "em quarentena",
      "birth_place": "Reino Unido / Groenlândia",
      "biography_summary": "Diretora científica da Estação Zero na Groenlândia. Descobriu que o Leviatã congelado possui a mesma sequência telomérica do Arquiteto do Caos.",
      "personal_history": "Doutora em paleobiologia e criogenia forense. Liderou a primeira equipe científica a perfurar a Fenda do Monólito de Gelo Negro na Groenlândia em 2026, documentando a existência do Leviatã glacial antes que o surto parasitário atingisse a estação.",
      "campaign_participations": [
        {
          "campaign_id": "camp_003",
          "campaign_title": "O Túmulo do Leviatã: Estação Criogênica Zero",
          "period": "2026 (Presente)",
          "role": "Líder Científica da Expedição Ártica",
          "summary": "Isolou as primeiras amostras do Gelo Negro e emitiu o chamado de socorro antes de entrar em quarentena médica."
        }
      ],
      "relationships": [
        {
          "character_id": "char_miller",
          "character_name": "Comandante Marcus Miller",
          "relation_type": "Comandante de Resgate",
          "description": "Miller lidera a defesa da Estação Zero para proteger o laboratório onde Evelyn está isolada."
        },
        {
          "character_id": "char_camila",
          "character_name": "Dra. Camila Neves",
          "relation_type": "Colega de Pesquisa",
          "description": "Compartilhou dados comparativos entre o parasita ártico e as amostras amazônicas do Rio Tapajós."
        }
      ],
      "important_events": [
        "cron_arc_01",
        "time_06"
      ],
      "visited_locations": [
        "loc_estacao_zero",
        "loc_monolito_gelo"
      ],
      "known_fate": "Viva, porém mantida em câmara de quarentena criogênica na Estação Zero (Groenlândia) enquanto a campanha permanece em andamento.",
      "archival_technical_record": {
        "origin": "Cientista Forense",
        "class": "Especialista",
        "track": "Médica de Campo & Geneticista",
        "nex": "40%",
        "mda": "22%",
        "attributes": {
          "Agilidade": 2,
          "Força": 1,
          "Intelecto": 5,
          "Presença": 3,
          "Vigor": 2
        },
        "stats": {
          "pv_current": 25,
          "pv_max": 25,
          "pe_current": 24,
          "pe_max": 24,
          "san_current": 26,
          "san_max": 42,
          "defesa": 15,
          "protecao": "Traje Criogênico Térmico (RD 2)"
        },
        "skills": {
          "Acrobacia": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 2
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
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 5
          },
          "Ciências": {
            "grau": "Expert",
            "bonus": 15,
            "attr": "INT",
            "total": 20
          },
          "Crime": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 2
          },
          "Diplomacia": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 3
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
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 2
          },
          "Iniciativa": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 2
          },
          "Intimidação": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 3
          },
          "Intuição": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 3
          },
          "Investigação": {
            "grau": "Veterano",
            "bonus": 10,
            "attr": "INT",
            "total": 15
          },
          "Luta": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "FOR",
            "total": 1
          },
          "Medicina": {
            "grau": "Expert",
            "bonus": 15,
            "attr": "INT",
            "total": 20
          },
          "Ocultismo": {
            "grau": "Veterano",
            "bonus": 10,
            "attr": "INT",
            "total": 15
          },
          "Percepção": {
            "grau": "Treinado",
            "bonus": 5,
            "attr": "PRE",
            "total": 8
          },
          "Pilotagem": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 2
          },
          "Pontaria": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 2
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
            "total": 2
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
            "total": 5
          },
          "Tática": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 5
          },
          "Tecnologia": {
            "grau": "Treinado",
            "bonus": 5,
            "attr": "INT",
            "total": 10
          },
          "Vontade": {
            "grau": "Treinado",
            "bonus": 5,
            "attr": "PRE",
            "total": 8
          }
        },
        "abilities": [
          "Cirurgia de Emergência: Trata traumas graves em campo com estabilizadores biológicos.",
          "Sequenciamento Imediato: Identifica anomalias em amostras genéticas sob microscópio de campo.",
          "Adaptação Criogênica: Resiste a ambientes com temperaturas extremas e ar contaminado."
        ],
        "inventory": [
          "Injetor de Criostase Inversa",
          "Micrótomo Laser Portátil",
          "Frascos de Solução Estabilizadora",
          "Tablet Blindado com Banco de Dados da AEGIS"
        ],
        "relics": [
          "Injetor de Criostase Inversa"
        ]
      }
    },
    {
      "id": "char_miller",
      "name": "Comandante Marcus Miller",
      "codename": "Muralha Ártica",
      "player": "Jogador 7",
      "origin": "Militar Operacional",
      "class": "Combatente",
      "track": "Comandante Tático",
      "nex": "45%",
      "mda": "12%",
      "status": "Ativo na Estação Zero",
      "life_status": "alive",
      "campaign_ids": [
        "camp_003"
      ],
      "attributes": {
        "Agilidade": 3,
        "Força": 3,
        "Intelecto": 2,
        "Presença": 2,
        "Vigor": 3
      },
      "stats": {
        "pv_current": 42,
        "pv_max": 42,
        "pe_current": 16,
        "pe_max": 16,
        "san_current": 22,
        "san_max": 32,
        "defesa": 19,
        "protecao": "Exoesqueleto Hidráulico Polar (RD 5)"
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
          "total": 3
        },
        "Atualidades": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 2
        },
        "Ciências": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 2
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
          "total": 2
        },
        "Luta": {
          "grau": "Veterano",
          "bonus": 10,
          "attr": "FOR",
          "total": 13
        },
        "Medicina": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 2
        },
        "Ocultismo": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 2
        },
        "Percepção": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 2
        },
        "Pilotagem": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "AGI",
          "total": 3
        },
        "Pontaria": {
          "grau": "Veterano",
          "bonus": 10,
          "attr": "AGI",
          "total": 13
        },
        "Profissão": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 2
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
          "grau": "Treinado",
          "bonus": 5,
          "attr": "INT",
          "total": 7
        },
        "Tática": {
          "grau": "Veterano",
          "bonus": 10,
          "attr": "INT",
          "total": 12
        },
        "Tecnologia": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "INT",
          "total": 2
        },
        "Vontade": {
          "grau": "Destreinado",
          "bonus": 0,
          "attr": "PRE",
          "total": 2
        }
      },
      "abilities": [
        "Liderança Operacional: Concede bônus táticos aos aliados sob fogo cerrado.",
        "Blindagem Servo-Assistida: Reduz o impacto de ataques mecânicos e garras alienígenas.",
        "Tiro Supressivo: Mantém alvos contidos em corredores estreitos."
      ],
      "inventory": [
        "Rifle de Assalto Criogênico A.E.G.I.S.",
        "Lâmina de Gelo Negro Forjada",
        "Rádio Transmissor de Longo Alcance",
        "Sinalizadores de Magnésio Térmico"
      ],
      "relics": [
        "Lâmina de Gelo Negro"
      ],
      "quote": "A cinquenta graus abaixo de zero, você não tem tempo pra hesitar. Se a criatura se mover, dispare.",
      "summary": "Veterano de incursões da A.E.G.I.S. destacou-se ao proteger a área de contenção da Estação Zero após o rompimento da câmara criogênica principal.",
      "portrait": "assets/icon-192.png",
      "historical_title": "Comandante Tático da Expedição Polar",
      "historical_status": "vivo",
      "birth_place": "América do Norte",
      "biography_summary": "Veterano de incursões da A.E.G.I.S. destacou-se ao proteger a área de contenção da Estação Zero após o rompimento da câmara criogênica principal.",
      "personal_history": "Oficial veterano de operações em ambientes extremos da Fundação A.E.G.I.S. Designado em 2026 para comandar a missão de socorro e contenção na Calota Polar da Groenlândia após a perda de contato com a Estação Criogênica Zero.",
      "campaign_participations": [
        {
          "campaign_id": "camp_003",
          "campaign_title": "O Túmulo do Leviatã: Estação Criogênica Zero",
          "period": "2026 (Presente)",
          "role": "Protagonista & Comandante Operacional",
          "summary": "Mantém o perímetro defensivo da Estação Zero e lidera as incursões à Fenda do Monólito."
        }
      ],
      "relationships": [
        {
          "character_id": "char_evelyn",
          "character_name": "Dra. Evelyn Shaw",
          "relation_type": "Cientista Sob Proteção",
          "description": "Trabalha em conjunto com Evelyn para impedir que o organismo polar alcance o oceano."
        },
        {
          "character_id": "char_thiago",
          "character_name": "Capitão Thiago Santos",
          "relation_type": "Oficial Aliado",
          "description": "Utilizou os protocolos de contenção térmica estabelecidos por Thiago na Amazônia."
        }
      ],
      "important_events": [
        "cron_arc_01",
        "time_06"
      ],
      "visited_locations": [
        "loc_estacao_zero",
        "loc_monolito_gelo"
      ],
      "known_fate": "Em atividade operacional na Groenlândia (campanha em andamento).",
      "archival_technical_record": {
        "origin": "Militar Operacional",
        "class": "Combatente",
        "track": "Comandante Tático",
        "nex": "45%",
        "mda": "12%",
        "attributes": {
          "Agilidade": 3,
          "Força": 3,
          "Intelecto": 2,
          "Presença": 2,
          "Vigor": 3
        },
        "stats": {
          "pv_current": 42,
          "pv_max": 42,
          "pe_current": 16,
          "pe_max": 16,
          "san_current": 22,
          "san_max": 32,
          "defesa": 19,
          "protecao": "Exoesqueleto Hidráulico Polar (RD 5)"
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
            "total": 3
          },
          "Atualidades": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 2
          },
          "Ciências": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 2
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
            "total": 2
          },
          "Luta": {
            "grau": "Veterano",
            "bonus": 10,
            "attr": "FOR",
            "total": 13
          },
          "Medicina": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 2
          },
          "Ocultismo": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 2
          },
          "Percepção": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 2
          },
          "Pilotagem": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "AGI",
            "total": 3
          },
          "Pontaria": {
            "grau": "Veterano",
            "bonus": 10,
            "attr": "AGI",
            "total": 13
          },
          "Profissão": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 2
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
            "grau": "Treinado",
            "bonus": 5,
            "attr": "INT",
            "total": 7
          },
          "Tática": {
            "grau": "Veterano",
            "bonus": 10,
            "attr": "INT",
            "total": 12
          },
          "Tecnologia": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "INT",
            "total": 2
          },
          "Vontade": {
            "grau": "Destreinado",
            "bonus": 0,
            "attr": "PRE",
            "total": 2
          }
        },
        "abilities": [
          "Liderança Operacional: Concede bônus táticos aos aliados sob fogo cerrado.",
          "Blindagem Servo-Assistida: Reduz o impacto de ataques mecânicos e garras alienígenas.",
          "Tiro Supressivo: Mantém alvos contidos em corredores estreitos."
        ],
        "inventory": [
          "Rifle de Assalto Criogênico A.E.G.I.S.",
          "Lâmina de Gelo Negro Forjada",
          "Rádio Transmissor de Longo Alcance",
          "Sinalizadores de Magnésio Térmico"
        ],
        "relics": [
          "Lâmina de Gelo Negro"
        ]
      }
    },
    {
      "id": "char_thiago",
      "name": "Capitão Thiago Santos",
      "codename": "Guardião da Selva",
      "player": "Jogador: Bruno",
      "origin": "Militar Operacional",
      "class": "Combatente",
      "track": "Comando de Selva & Sobrevivência",
      "nex": "50%",
      "mda": "18%",
      "status": "Ativo // Veterano",
      "life_status": "alive",
      "campaign_id": "camp_004",
      "attributes": {
        "agi": 2,
        "for": 3,
        "int": 1,
        "pre": 2,
        "vig": 3
      },
      "stats": {
        "pv": {
          "current": 38,
          "max": 38
        },
        "pe": {
          "current": 12,
          "max": 12
        },
        "san": {
          "current": 24,
          "max": 24
        },
        "defesa": 17,
        "bloqueio": 8,
        "esquiva": 14,
        "protecao": 5
      },
      "skills": [
        {
          "name": "Acrobacia",
          "value": 0,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Adestramento",
          "value": 0,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Destreinado"
        },
        {
          "name": "Artes",
          "value": 0,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Destreinado"
        },
        {
          "name": "Atletismo",
          "value": 5,
          "attr": "FOR",
          "category": "Físicas",
          "training": "Treinado"
        },
        {
          "name": "Atualidades",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Ciência",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Crime",
          "value": 0,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Diplomacia",
          "value": 0,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Destreinado"
        },
        {
          "name": "Enganação",
          "value": 0,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Destreinado"
        },
        {
          "name": "Fortitude",
          "value": 10,
          "attr": "VIG",
          "category": "Físicas",
          "training": "Veterano"
        },
        {
          "name": "Furtividade",
          "value": 0,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "História",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Iniciativa",
          "value": 5,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Treinado"
        },
        {
          "name": "Intimidação",
          "value": 0,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Destreinado"
        },
        {
          "name": "Intuição",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Investigação",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Luta",
          "value": 10,
          "attr": "FOR",
          "category": "Físicas",
          "training": "Veterano"
        },
        {
          "name": "Medicina",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Ocultismo",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Percepção",
          "value": 5,
          "attr": "PRE",
          "category": "Mente",
          "training": "Treinado"
        },
        {
          "name": "Pilotagem",
          "value": 0,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Pontaria",
          "value": 15,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Expert"
        },
        {
          "name": "Profissão",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Reflexos",
          "value": 0,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Religião",
          "value": 0,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Destreinado"
        },
        {
          "name": "Sobrevivência",
          "value": 15,
          "attr": "INT",
          "category": "Mente",
          "training": "Expert"
        },
        {
          "name": "Tática",
          "value": 10,
          "attr": "INT",
          "category": "Mente",
          "training": "Veterano"
        },
        {
          "name": "Vontade",
          "value": 0,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Destreinado"
        }
      ],
      "abilities": [
        {
          "name": "Tiro de Cobertura",
          "type": "Tática",
          "cost": "2 PE",
          "desc": "Força o alvo a buscar abrigo ou sofrer penalidade em ataques por 1 rodada."
        },
        {
          "name": "Sentido de Selva",
          "type": "Passiva",
          "cost": "-",
          "desc": "Imunidade a terrenos difíceis naturais e bônus passivo para detectar emboscadas biológicas."
        },
        {
          "name": "Ataque Pesado",
          "type": "Combate",
          "cost": "2 PE",
          "desc": "Adiciona dano extra ao atingir alvos orgânicos com armas de fogo ou lâminas."
        }
      ],
      "inventory": [
        {
          "name": "Rifle de Assalto Tático A.E.G.I.S.",
          "space": 2,
          "desc": "Calibre 5.56mm com mira holográfica e silenciador militar."
        },
        {
          "name": "Colete Balístico Reforçado",
          "space": 2,
          "desc": "Proteção balística nível III-A com bolsos modulares."
        },
        {
          "name": "Machete Tático de Aço Carbono",
          "space": 1,
          "desc": "Lâmina pesada para abrir trilhas e combate corpo-a-corpo."
        },
        {
          "name": "Kit Médico de Trauma",
          "space": 1,
          "desc": "Torniquetes e hemostáticos para estancar hemorragias rápidas."
        }
      ],
      "relics": [],
      "quote": "A selva não mente: o que quer que estivesse enterrado naquele quartzo negro aprendeu a respirar.",
      "summary": "Líder militar do destacamento de resgate na Amazônia. Sobreviveu à emboscada das raízes mutantes e coordenou a implosão tática da cratera de quartzo negro.",
      "portrait": "assets/icon-192.png",
      "historical_title": "Comandante da Operação Protocolo Selva",
      "historical_status": "vivo",
      "birth_place": "Brasil",
      "biography_summary": "Líder militar do destacamento de resgate na Amazônia. Sobreviveu à emboscada das raízes mutantes e coordenou a implosão tática da cratera de quartzo negro.",
      "personal_history": "Capitão especialista em operações de selva e contenção de riscos biológicos. Em 2025, liderou a força-tarefa enviada à Bacia do Rio Tapajós, na Amazônia, tomando a decisão estratégica de incinerar a Cratera de Quartzo Negro para salvar a bacia hidrográfica.",
      "campaign_participations": [
        {
          "campaign_id": "camp_004",
          "campaign_title": "Protocolo Selva: Os Ecos do Ouro Negro",
          "period": "2025",
          "role": "Protagonista & Líder Militar (Jogador: Bruno)",
          "summary": "Conduziu a defesa do Acampamento Tapajós, resgatou a equipe científica e executou a cauterização da cratera."
        }
      ],
      "relationships": [
        {
          "character_id": "char_camila",
          "character_name": "Dra. Camila Neves",
          "relation_type": "Parceira de Expedição",
          "description": "Protegeu a Dra. Camila durante a coleta das amostras críticas na Cratera de Quartzo Negro."
        },
        {
          "character_id": "char_miller",
          "character_name": "Comandante Marcus Miller",
          "relation_type": "Companheiro de Comando",
          "description": "Repassou os relatórios táticos da Amazônia para a divisão polar."
        }
      ],
      "important_events": [
        "cron_bra_01",
        "time_bra_01"
      ],
      "visited_locations": [
        "loc_tapajos",
        "loc_quartzo"
      ],
      "known_fate": "Vivo e condecorado após o encerramento da operação no Rio Tapajós em 2025.",
      "archival_technical_record": {
        "origin": "Militar Operacional",
        "class": "Combatente",
        "track": "Comando de Selva & Sobrevivência",
        "nex": "50%",
        "mda": "18%",
        "attributes": {
          "agi": 2,
          "for": 3,
          "int": 1,
          "pre": 2,
          "vig": 3
        },
        "stats": {
          "pv": {
            "current": 38,
            "max": 38
          },
          "pe": {
            "current": 12,
            "max": 12
          },
          "san": {
            "current": 24,
            "max": 24
          },
          "defesa": 17,
          "bloqueio": 8,
          "esquiva": 14,
          "protecao": 5
        },
        "skills": [
          {
            "name": "Acrobacia",
            "value": 0,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Adestramento",
            "value": 0,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Destreinado"
          },
          {
            "name": "Artes",
            "value": 0,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Destreinado"
          },
          {
            "name": "Atletismo",
            "value": 5,
            "attr": "FOR",
            "category": "Físicas",
            "training": "Treinado"
          },
          {
            "name": "Atualidades",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Ciência",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Crime",
            "value": 0,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Diplomacia",
            "value": 0,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Destreinado"
          },
          {
            "name": "Enganação",
            "value": 0,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Destreinado"
          },
          {
            "name": "Fortitude",
            "value": 10,
            "attr": "VIG",
            "category": "Físicas",
            "training": "Veterano"
          },
          {
            "name": "Furtividade",
            "value": 0,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "História",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Iniciativa",
            "value": 5,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Treinado"
          },
          {
            "name": "Intimidação",
            "value": 0,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Destreinado"
          },
          {
            "name": "Intuição",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Investigação",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Luta",
            "value": 10,
            "attr": "FOR",
            "category": "Físicas",
            "training": "Veterano"
          },
          {
            "name": "Medicina",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Ocultismo",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Percepção",
            "value": 5,
            "attr": "PRE",
            "category": "Mente",
            "training": "Treinado"
          },
          {
            "name": "Pilotagem",
            "value": 0,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Pontaria",
            "value": 15,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Expert"
          },
          {
            "name": "Profissão",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Reflexos",
            "value": 0,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Religião",
            "value": 0,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Destreinado"
          },
          {
            "name": "Sobrevivência",
            "value": 15,
            "attr": "INT",
            "category": "Mente",
            "training": "Expert"
          },
          {
            "name": "Tática",
            "value": 10,
            "attr": "INT",
            "category": "Mente",
            "training": "Veterano"
          },
          {
            "name": "Vontade",
            "value": 0,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Destreinado"
          }
        ],
        "abilities": [
          {
            "name": "Tiro de Cobertura",
            "type": "Tática",
            "cost": "2 PE",
            "desc": "Força o alvo a buscar abrigo ou sofrer penalidade em ataques por 1 rodada."
          },
          {
            "name": "Sentido de Selva",
            "type": "Passiva",
            "cost": "-",
            "desc": "Imunidade a terrenos difíceis naturais e bônus passivo para detectar emboscadas biológicas."
          },
          {
            "name": "Ataque Pesado",
            "type": "Combate",
            "cost": "2 PE",
            "desc": "Adiciona dano extra ao atingir alvos orgânicos com armas de fogo ou lâminas."
          }
        ],
        "inventory": [
          {
            "name": "Rifle de Assalto Tático A.E.G.I.S.",
            "space": 2,
            "desc": "Calibre 5.56mm com mira holográfica e silenciador militar."
          },
          {
            "name": "Colete Balístico Reforçado",
            "space": 2,
            "desc": "Proteção balística nível III-A com bolsos modulares."
          },
          {
            "name": "Machete Tático de Aço Carbono",
            "space": 1,
            "desc": "Lâmina pesada para abrir trilhas e combate corpo-a-corpo."
          },
          {
            "name": "Kit Médico de Trauma",
            "space": 1,
            "desc": "Torniquetes e hemostáticos para estancar hemorragias rápidas."
          }
        ],
        "relics": []
      }
    },
    {
      "id": "char_camila",
      "name": "Dra. Camila Neves",
      "codename": "Bióloga Molecular",
      "player": "Jogadora: Marina",
      "origin": "Acadêmica / Pesquisadora",
      "class": "Especialista",
      "track": "Médica de Campo & Bioquímica",
      "nex": "45%",
      "mda": "28%",
      "status": "Em Quarentena Psicológica",
      "life_status": "quarantine",
      "campaign_id": "camp_004",
      "attributes": {
        "agi": 2,
        "for": 1,
        "int": 4,
        "pre": 2,
        "vig": 2
      },
      "stats": {
        "pv": {
          "current": 24,
          "max": 24
        },
        "pe": {
          "current": 20,
          "max": 20
        },
        "san": {
          "current": 18,
          "max": 35
        },
        "defesa": 14,
        "bloqueio": 4,
        "esquiva": 12,
        "protecao": 2
      },
      "skills": [
        {
          "name": "Acrobacia",
          "value": 0,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Adestramento",
          "value": 0,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Destreinado"
        },
        {
          "name": "Artes",
          "value": 0,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Destreinado"
        },
        {
          "name": "Atletismo",
          "value": 0,
          "attr": "FOR",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Atualidades",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Ciência",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Crime",
          "value": 0,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Diplomacia",
          "value": 0,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Destreinado"
        },
        {
          "name": "Enganação",
          "value": 0,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Destreinado"
        },
        {
          "name": "Fortitude",
          "value": 0,
          "attr": "VIG",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Furtividade",
          "value": 0,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "História",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Iniciativa",
          "value": 0,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Intimidação",
          "value": 0,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Destreinado"
        },
        {
          "name": "Intuição",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
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
          "value": 0,
          "attr": "FOR",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Medicina",
          "value": 15,
          "attr": "INT",
          "category": "Mente",
          "training": "Expert"
        },
        {
          "name": "Ocultismo",
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
          "name": "Pilotagem",
          "value": 0,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Pontaria",
          "value": 0,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Profissão",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Reflexos",
          "value": 0,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Religião",
          "value": 0,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Destreinado"
        },
        {
          "name": "Sobrevivência",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Tática",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Vontade",
          "value": 5,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Treinado"
        }
      ],
      "abilities": [
        {
          "name": "Primeiros Socorros Avançados",
          "type": "Suporte",
          "cost": "2 PE",
          "desc": "Estabiliza aliados em estado crítico restaurando PV e removendo sangramento."
        },
        {
          "name": "Análise de Espécimes Vivos",
          "type": "Investigação",
          "cost": "1 PE",
          "desc": "Identifica fraquezas biológicas e imunidades de anomalias mutantes."
        },
        {
          "name": "Diagnóstico Sob Fogo",
          "type": "Passiva",
          "cost": "-",
          "desc": "Pode executar perícias de Medicina mesmo sob ameaça iminente de combate."
        }
      ],
      "inventory": [
        {
          "name": "Maleta de Biópsia Hermética",
          "space": 2,
          "desc": "Recipientes criogênicos esterilizados para coleta de esporos vivos."
        },
        {
          "name": "Injetores de Adrenalina Sintética",
          "space": 1,
          "desc": "Doses de reanimação rápida para combate a choque hipovolêmico."
        },
        {
          "name": "Tablet Tático Criptografado",
          "space": 1,
          "desc": "Banco de dados genômico e relatórios confidenciais da A.E.G.I.S."
        }
      ],
      "relics": [
        "Nódulo de Quartzo Mutagênico"
      ],
      "quote": "Não eram fungos nem plantas comuns. As células tinham memória genética de pessoas vivas.",
      "summary": "Cientista líder da expedição no Tapajós. Coletou fragmentos do quartzo negro e decodificou a ressonância celular antes de entrar em quarentena.",
      "portrait": "assets/icon-192.png",
      "historical_title": "Pesquisadora-Chefe da Bacia do Tapajós",
      "historical_status": "em quarentena",
      "birth_place": "Brasil",
      "biography_summary": "Cientista líder da expedição no Tapajós. Coletou fragmentos do quartzo negro e decodificou a ressonância celular antes de entrar em quarentena.",
      "personal_history": "Bióloga e pesquisadora acadêmica brasileira. Em 2025, integrou a expedição Protocolo Selva no Rio Tapajós, sendo responsável por identificar a natureza mutagênica do 'Ouro Negro' e evitar que o composto atingisse as cidades ribeirinhas.",
      "campaign_participations": [
        {
          "campaign_id": "camp_004",
          "campaign_title": "Protocolo Selva: Os Ecos do Ouro Negro",
          "period": "2025",
          "role": "Protagonista & Cientista de Campo (Jogadora: Marina)",
          "summary": "Analisou o Nódulo de Quartzo Negro in loco e garantiu as provas científicas da anomalia amazônica."
        }
      ],
      "relationships": [
        {
          "character_id": "char_thiago",
          "character_name": "Capitão Thiago Santos",
          "relation_type": "Comandante de Escolta",
          "description": "Atuou ao lado do Capitão Thiago durante toda a operação na selva."
        },
        {
          "character_id": "char_evelyn",
          "character_name": "Dra. Evelyn Shaw",
          "relation_type": "Correspondente Científica",
          "description": "Seus relatórios da Amazônia auxiliaram a equipe da Estação Zero em 2026."
        }
      ],
      "important_events": [
        "cron_bra_01",
        "time_bra_01"
      ],
      "visited_locations": [
        "loc_tapajos",
        "loc_quartzo"
      ],
      "known_fate": "Sobreviveu à operação de 2025 no Brasil; permanece em observação e quarentena médica devido à exposição prolongada na Cratera de Quartzo Negro.",
      "archival_technical_record": {
        "origin": "Acadêmica / Pesquisadora",
        "class": "Especialista",
        "track": "Médica de Campo & Bioquímica",
        "nex": "45%",
        "mda": "28%",
        "attributes": {
          "agi": 2,
          "for": 1,
          "int": 4,
          "pre": 2,
          "vig": 2
        },
        "stats": {
          "pv": {
            "current": 24,
            "max": 24
          },
          "pe": {
            "current": 20,
            "max": 20
          },
          "san": {
            "current": 18,
            "max": 35
          },
          "defesa": 14,
          "bloqueio": 4,
          "esquiva": 12,
          "protecao": 2
        },
        "skills": [
          {
            "name": "Acrobacia",
            "value": 0,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Adestramento",
            "value": 0,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Destreinado"
          },
          {
            "name": "Artes",
            "value": 0,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Destreinado"
          },
          {
            "name": "Atletismo",
            "value": 0,
            "attr": "FOR",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Atualidades",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Ciência",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Crime",
            "value": 0,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Diplomacia",
            "value": 0,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Destreinado"
          },
          {
            "name": "Enganação",
            "value": 0,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Destreinado"
          },
          {
            "name": "Fortitude",
            "value": 0,
            "attr": "VIG",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Furtividade",
            "value": 0,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "História",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Iniciativa",
            "value": 0,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Intimidação",
            "value": 0,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Destreinado"
          },
          {
            "name": "Intuição",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
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
            "value": 0,
            "attr": "FOR",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Medicina",
            "value": 15,
            "attr": "INT",
            "category": "Mente",
            "training": "Expert"
          },
          {
            "name": "Ocultismo",
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
            "name": "Pilotagem",
            "value": 0,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Pontaria",
            "value": 0,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Profissão",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Reflexos",
            "value": 0,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Religião",
            "value": 0,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Destreinado"
          },
          {
            "name": "Sobrevivência",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Tática",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Vontade",
            "value": 5,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Treinado"
          }
        ],
        "abilities": [
          {
            "name": "Primeiros Socorros Avançados",
            "type": "Suporte",
            "cost": "2 PE",
            "desc": "Estabiliza aliados em estado crítico restaurando PV e removendo sangramento."
          },
          {
            "name": "Análise de Espécimes Vivos",
            "type": "Investigação",
            "cost": "1 PE",
            "desc": "Identifica fraquezas biológicas e imunidades de anomalias mutantes."
          },
          {
            "name": "Diagnóstico Sob Fogo",
            "type": "Passiva",
            "cost": "-",
            "desc": "Pode executar perícias de Medicina mesmo sob ameaça iminente de combate."
          }
        ],
        "inventory": [
          {
            "name": "Maleta de Biópsia Hermética",
            "space": 2,
            "desc": "Recipientes criogênicos esterilizados para coleta de esporos vivos."
          },
          {
            "name": "Injetores de Adrenalina Sintética",
            "space": 1,
            "desc": "Doses de reanimação rápida para combate a choque hipovolêmico."
          },
          {
            "name": "Tablet Tático Criptografado",
            "space": 1,
            "desc": "Banco de dados genômico e relatórios confidenciais da A.E.G.I.S."
          }
        ],
        "relics": [
          "Nódulo de Quartzo Mutagênico"
        ]
      }
    },
    {
      "id": "char_greta",
      "name": "Greta Falk",
      "codename": "O Olho Silencioso",
      "player": "Jogadora: Helena",
      "origin": "Policial / Investigadora Criminal",
      "class": "Especialista",
      "track": "Detetive Forense",
      "nex": "40%",
      "mda": "12%",
      "status": "Ativa // Marcada pelo Eco",
      "life_status": "alive",
      "campaign_id": "camp_005",
      "attributes": {
        "agi": 3,
        "for": 1,
        "int": 3,
        "pre": 2,
        "vig": 2
      },
      "stats": {
        "pv": {
          "current": 26,
          "max": 26
        },
        "pe": {
          "current": 18,
          "max": 18
        },
        "san": {
          "current": 22,
          "max": 32
        },
        "defesa": 16,
        "bloqueio": 4,
        "esquiva": 16,
        "protecao": 2
      },
      "skills": [
        {
          "name": "Acrobacia",
          "value": 0,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Adestramento",
          "value": 0,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Destreinado"
        },
        {
          "name": "Artes",
          "value": 0,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Destreinado"
        },
        {
          "name": "Atletismo",
          "value": 0,
          "attr": "FOR",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Atualidades",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Ciência",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Crime",
          "value": 10,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Veterano"
        },
        {
          "name": "Diplomacia",
          "value": 0,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Destreinado"
        },
        {
          "name": "Enganação",
          "value": 0,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Destreinado"
        },
        {
          "name": "Fortitude",
          "value": 0,
          "attr": "VIG",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Furtividade",
          "value": 10,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Veterano"
        },
        {
          "name": "História",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Iniciativa",
          "value": 0,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Intimidação",
          "value": 0,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Destreinado"
        },
        {
          "name": "Intuição",
          "value": 10,
          "attr": "INT",
          "category": "Mente",
          "training": "Veterano"
        },
        {
          "name": "Investigação",
          "value": 15,
          "attr": "INT",
          "category": "Mente",
          "training": "Expert"
        },
        {
          "name": "Luta",
          "value": 0,
          "attr": "FOR",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Medicina",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Ocultismo",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Percepção",
          "value": 15,
          "attr": "PRE",
          "category": "Mente",
          "training": "Expert"
        },
        {
          "name": "Pilotagem",
          "value": 0,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Pontaria",
          "value": 10,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Veterano"
        },
        {
          "name": "Profissão",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Reflexos",
          "value": 0,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Religião",
          "value": 0,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Destreinado"
        },
        {
          "name": "Sobrevivência",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Tática",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Vontade",
          "value": 10,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Veterano"
        }
      ],
      "abilities": [
        {
          "name": "Percepção Forense Aguçada",
          "type": "Investigação",
          "cost": "1 PE",
          "desc": "Localiza pistas microscópicas, marcas ocultas e anomalias de fisionomia."
        },
        {
          "name": "Tiro Preciso",
          "type": "Combate",
          "cost": "2 PE",
          "desc": "Disparo mirado que ignora cobertura parcial do alvo."
        },
        {
          "name": "Silêncio Imutável",
          "type": "Passiva",
          "cost": "-",
          "desc": "Imunidade total a ataques ou truques mentais baseados em voz ou comandos orais."
        }
      ],
      "inventory": [
        {
          "name": "Pistola Sig Sauer P226",
          "space": 1,
          "desc": "Arma semi-automática calibre 9mm com munição perfurante."
        },
        {
          "name": "Lanterna UV Forense",
          "space": 1,
          "desc": "Revela fluidos, fibras e inscrições invisíveis a olho nu."
        },
        {
          "name": "Caderno Moleskine com Anotações",
          "space": 1,
          "desc": "Anotações e diagramas da cripta usados para se comunicar sem a voz."
        }
      ],
      "relics": [],
      "quote": "Quando o sino tocou, minha voz sumiu na pedra. Mas meus olhos registraram cada mentira.",
      "summary": "Detetive alemã que investigou o desaparecimento de memórias na Floresta Negra. Teve suas cordas vocais paralisadas pelo altar do Eco, mas decifrou a cripta.",
      "portrait": "assets/icon-192.png",
      "historical_title": "Inspetora do Caso de Santo Agostinho",
      "historical_status": "vivo",
      "birth_place": "Alemanha (Baden-Württemberg)",
      "biography_summary": "Detetive alemã que investigou o desaparecimento de memórias na Floresta Negra. Teve suas cordas vocais paralisadas pelo altar do Eco, mas decifrou a cripta.",
      "personal_history": "Investigadora criminal da polícia alemã destacada em 2023 para apurar o desaparecimento de monges e moradores nos arredores de Friburgo, na Floresta Negra. Sua coragem física nas catacumbas permitiu a destruição do Sino Sem-Rosto.",
      "campaign_participations": [
        {
          "campaign_id": "camp_005",
          "campaign_title": "O Sussurro da Floresta Negra: O Monastério dos Sem-Rosto",
          "period": "2023",
          "role": "Protagonista & Investigadora Policial (Jogadora: Helena)",
          "summary": "Liderou a incursão tática ao Monastério de Santo Agostinho e desferiu o golpe que rachou o artefato acústico na cripta."
        }
      ],
      "relationships": [
        {
          "character_id": "char_hans",
          "character_name": "Hans Richter",
          "relation_type": "Parceiro de Investigação",
          "description": "Trabalhou lado a lado com Hans Richter para decifrar o mistério medieval da Floresta Negra."
        }
      ],
      "important_events": [
        "cron_ale_01",
        "time_ale_01"
      ],
      "visited_locations": [
        "loc_monasterio",
        "loc_cripta"
      ],
      "known_fate": "Viva; aposentou-se do serviço policial comum após 2023 devido às sequelas auditivas do incidente na cripta, atuando como informante histórica na Europa.",
      "archival_technical_record": {
        "origin": "Policial / Investigadora Criminal",
        "class": "Especialista",
        "track": "Detetive Forense",
        "nex": "40%",
        "mda": "12%",
        "attributes": {
          "agi": 3,
          "for": 1,
          "int": 3,
          "pre": 2,
          "vig": 2
        },
        "stats": {
          "pv": {
            "current": 26,
            "max": 26
          },
          "pe": {
            "current": 18,
            "max": 18
          },
          "san": {
            "current": 22,
            "max": 32
          },
          "defesa": 16,
          "bloqueio": 4,
          "esquiva": 16,
          "protecao": 2
        },
        "skills": [
          {
            "name": "Acrobacia",
            "value": 0,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Adestramento",
            "value": 0,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Destreinado"
          },
          {
            "name": "Artes",
            "value": 0,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Destreinado"
          },
          {
            "name": "Atletismo",
            "value": 0,
            "attr": "FOR",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Atualidades",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Ciência",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Crime",
            "value": 10,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Veterano"
          },
          {
            "name": "Diplomacia",
            "value": 0,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Destreinado"
          },
          {
            "name": "Enganação",
            "value": 0,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Destreinado"
          },
          {
            "name": "Fortitude",
            "value": 0,
            "attr": "VIG",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Furtividade",
            "value": 10,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Veterano"
          },
          {
            "name": "História",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Iniciativa",
            "value": 0,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Intimidação",
            "value": 0,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Destreinado"
          },
          {
            "name": "Intuição",
            "value": 10,
            "attr": "INT",
            "category": "Mente",
            "training": "Veterano"
          },
          {
            "name": "Investigação",
            "value": 15,
            "attr": "INT",
            "category": "Mente",
            "training": "Expert"
          },
          {
            "name": "Luta",
            "value": 0,
            "attr": "FOR",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Medicina",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Ocultismo",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Percepção",
            "value": 15,
            "attr": "PRE",
            "category": "Mente",
            "training": "Expert"
          },
          {
            "name": "Pilotagem",
            "value": 0,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Pontaria",
            "value": 10,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Veterano"
          },
          {
            "name": "Profissão",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Reflexos",
            "value": 0,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Religião",
            "value": 0,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Destreinado"
          },
          {
            "name": "Sobrevivência",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Tática",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Vontade",
            "value": 10,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Veterano"
          }
        ],
        "abilities": [
          {
            "name": "Percepção Forense Aguçada",
            "type": "Investigação",
            "cost": "1 PE",
            "desc": "Localiza pistas microscópicas, marcas ocultas e anomalias de fisionomia."
          },
          {
            "name": "Tiro Preciso",
            "type": "Combate",
            "cost": "2 PE",
            "desc": "Disparo mirado que ignora cobertura parcial do alvo."
          },
          {
            "name": "Silêncio Imutável",
            "type": "Passiva",
            "cost": "-",
            "desc": "Imunidade total a ataques ou truques mentais baseados em voz ou comandos orais."
          }
        ],
        "inventory": [
          {
            "name": "Pistola Sig Sauer P226",
            "space": 1,
            "desc": "Arma semi-automática calibre 9mm com munição perfurante."
          },
          {
            "name": "Lanterna UV Forense",
            "space": 1,
            "desc": "Revela fluidos, fibras e inscrições invisíveis a olho nu."
          },
          {
            "name": "Caderno Moleskine com Anotações",
            "space": 1,
            "desc": "Anotações e diagramas da cripta usados para se comunicar sem a voz."
          }
        ],
        "relics": []
      }
    },
    {
      "id": "char_hans",
      "name": "Hans Richter",
      "codename": "O Guardião dos Códices",
      "player": "Jogador: Fernando",
      "origin": "Ocultista Teórico / Arquivista",
      "class": "Ocultista",
      "track": "Graduado em Códices Proibidos",
      "nex": "55%",
      "mda": "20%",
      "status": "Consultor Ativo C.R.I.S.",
      "life_status": "alive",
      "campaign_id": "camp_005",
      "attributes": {
        "agi": 1,
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
          "current": 24,
          "max": 24
        },
        "san": {
          "current": 28,
          "max": 40
        },
        "defesa": 13,
        "bloqueio": 3,
        "esquiva": 11,
        "protecao": 0
      },
      "skills": [
        {
          "name": "Acrobacia",
          "value": 0,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Adestramento",
          "value": 0,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Destreinado"
        },
        {
          "name": "Artes",
          "value": 0,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Destreinado"
        },
        {
          "name": "Atletismo",
          "value": 0,
          "attr": "FOR",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Atualidades",
          "value": 10,
          "attr": "INT",
          "category": "Mente",
          "training": "Veterano"
        },
        {
          "name": "Ciência",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Crime",
          "value": 0,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Diplomacia",
          "value": 10,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Veterano"
        },
        {
          "name": "Enganação",
          "value": 0,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Destreinado"
        },
        {
          "name": "Fortitude",
          "value": 0,
          "attr": "VIG",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Furtividade",
          "value": 0,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "História",
          "value": 15,
          "attr": "INT",
          "category": "Mente",
          "training": "Expert"
        },
        {
          "name": "Iniciativa",
          "value": 0,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Intimidação",
          "value": 0,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Destreinado"
        },
        {
          "name": "Intuição",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
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
          "value": 0,
          "attr": "FOR",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Medicina",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Ocultismo",
          "value": 15,
          "attr": "INT",
          "category": "Mente",
          "training": "Expert"
        },
        {
          "name": "Percepção",
          "value": 0,
          "attr": "PRE",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Pilotagem",
          "value": 0,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Pontaria",
          "value": 0,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Profissão",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Reflexos",
          "value": 0,
          "attr": "AGI",
          "category": "Físicas",
          "training": "Destreinado"
        },
        {
          "name": "Religião",
          "value": 15,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Expert"
        },
        {
          "name": "Sobrevivência",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Tática",
          "value": 0,
          "attr": "INT",
          "category": "Mente",
          "training": "Destreinado"
        },
        {
          "name": "Vontade",
          "value": 10,
          "attr": "PRE",
          "category": "Sociais",
          "training": "Veterano"
        }
      ],
      "abilities": [
        {
          "name": "Decodificação Hermética",
          "type": "Ocultismo",
          "cost": "2 PE",
          "desc": "Traduz inscrições pré-diluvianas e desativa selos místicos sem disparar armadilhas."
        },
        {
          "name": "Dissipar Ressonância",
          "type": "Defesa",
          "cost": "3 PE",
          "desc": "Gera um contra-campo acústico que anula frequências paranormais hostis por 1 turno."
        },
        {
          "name": "Memória Eidética",
          "type": "Passiva",
          "cost": "-",
          "desc": "Lembra com perfeição qualquer mapa, fórmula ou testemunho lido no passado."
        }
      ],
      "inventory": [
        {
          "name": "Códice de Santo Agostinho (Cópia Fac-símile)",
          "space": 1,
          "desc": "Manuscrito em latim com desenhos anatômicos da mente sem-rosto."
        },
        {
          "name": "Diapasão de Prata Sem-Rosto",
          "space": 1,
          "desc": "Instrumento afinado na frequência de cancelamento acústico do LIMIAR."
        },
        {
          "name": "Lente de Aumento com Filtro Espectral",
          "space": 1,
          "desc": "Lente especial para decifrar filigranas em metais antigos."
        }
      ],
      "relics": [
        "Diapasão de Prata Sem-Rosto"
      ],
      "quote": "Os monges de Friburgo não adoravam santos. Eles construíram um espelho acústico para dialogar com o LIMIAR.",
      "summary": "Historiador e professor emérito de Friburgo. Catalogou o acervo herético do monastério e serviu como consultor para a contenção definitiva do sítio histórico.",
      "portrait": "assets/icon-192.png",
      "historical_title": "Arquivista Sênior & Historiador do Acervo",
      "historical_status": "vivo",
      "birth_place": "Alemanha",
      "biography_summary": "Historiador e professor emérito de Friburgo. Catalogou o acervo herético do monastério e serviu como consultor para a contenção definitiva do sítio histórico.",
      "personal_history": "Historiador, filólogo e arquivista especializado em manuscritos medievais e fenômenos acústicos. Após sobreviver ao caso do Monastério de Santo Agostinho na Alemanha em 2023, tornou-se um dos principais organizadores do Arquivo Histórico Planetário de Evren, prestando consultoria também para a expedição na Groenlândia.",
      "campaign_participations": [
        {
          "campaign_id": "camp_005",
          "campaign_title": "O Sussurro da Floresta Negra: O Monastério dos Sem-Rosto",
          "period": "2023",
          "role": "Protagonista & Arquivista (Jogador: Fernando)",
          "summary": "Traduziu os códices de 1348 e utilizou o Diapasão de Prata para guiar a chegada até a Cripta do Eco Silencioso."
        },
        {
          "campaign_id": "camp_003",
          "campaign_title": "O Túmulo do Leviatã: Estação Criogênica Zero",
          "period": "2026",
          "role": "Consultor Histórico Remoto",
          "summary": "Catalogou as correlações históricas entre os manuscritos europeus e as inscrições geológicas encontradas sob o gelo da Groenlândia."
        }
      ],
      "relationships": [
        {
          "character_id": "char_greta",
          "character_name": "Greta Falk",
          "relation_type": "Parceira de Campo",
          "description": "Sobreviveram juntos ao selamento do Monastério de Santo Agostinho em 2023."
        },
        {
          "character_id": "char_evelyn",
          "character_name": "Dra. Evelyn Shaw",
          "relation_type": "Consultoria Científica",
          "description": "Auxiliou a equipe da Estação Zero com arquivos históricos."
        }
      ],
      "important_events": [
        "cron_ale_01",
        "time_ale_01",
        "time_06"
      ],
      "visited_locations": [
        "loc_monasterio",
        "loc_cripta",
        "loc_estacao_zero"
      ],
      "known_fate": "Vivo; atua como Curador e Consultor Sênior do Arquivo Histórico de Evren.",
      "archival_technical_record": {
        "origin": "Ocultista Teórico / Arquivista",
        "class": "Ocultista",
        "track": "Graduado em Códices Proibidos",
        "nex": "55%",
        "mda": "20%",
        "attributes": {
          "agi": 1,
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
            "current": 24,
            "max": 24
          },
          "san": {
            "current": 28,
            "max": 40
          },
          "defesa": 13,
          "bloqueio": 3,
          "esquiva": 11,
          "protecao": 0
        },
        "skills": [
          {
            "name": "Acrobacia",
            "value": 0,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Adestramento",
            "value": 0,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Destreinado"
          },
          {
            "name": "Artes",
            "value": 0,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Destreinado"
          },
          {
            "name": "Atletismo",
            "value": 0,
            "attr": "FOR",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Atualidades",
            "value": 10,
            "attr": "INT",
            "category": "Mente",
            "training": "Veterano"
          },
          {
            "name": "Ciência",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Crime",
            "value": 0,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Diplomacia",
            "value": 10,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Veterano"
          },
          {
            "name": "Enganação",
            "value": 0,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Destreinado"
          },
          {
            "name": "Fortitude",
            "value": 0,
            "attr": "VIG",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Furtividade",
            "value": 0,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "História",
            "value": 15,
            "attr": "INT",
            "category": "Mente",
            "training": "Expert"
          },
          {
            "name": "Iniciativa",
            "value": 0,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Intimidação",
            "value": 0,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Destreinado"
          },
          {
            "name": "Intuição",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
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
            "value": 0,
            "attr": "FOR",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Medicina",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Ocultismo",
            "value": 15,
            "attr": "INT",
            "category": "Mente",
            "training": "Expert"
          },
          {
            "name": "Percepção",
            "value": 0,
            "attr": "PRE",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Pilotagem",
            "value": 0,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Pontaria",
            "value": 0,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Profissão",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Reflexos",
            "value": 0,
            "attr": "AGI",
            "category": "Físicas",
            "training": "Destreinado"
          },
          {
            "name": "Religião",
            "value": 15,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Expert"
          },
          {
            "name": "Sobrevivência",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Tática",
            "value": 0,
            "attr": "INT",
            "category": "Mente",
            "training": "Destreinado"
          },
          {
            "name": "Vontade",
            "value": 10,
            "attr": "PRE",
            "category": "Sociais",
            "training": "Veterano"
          }
        ],
        "abilities": [
          {
            "name": "Decodificação Hermética",
            "type": "Ocultismo",
            "cost": "2 PE",
            "desc": "Traduz inscrições pré-diluvianas e desativa selos místicos sem disparar armadilhas."
          },
          {
            "name": "Dissipar Ressonância",
            "type": "Defesa",
            "cost": "3 PE",
            "desc": "Gera um contra-campo acústico que anula frequências paranormais hostis por 1 turno."
          },
          {
            "name": "Memória Eidética",
            "type": "Passiva",
            "cost": "-",
            "desc": "Lembra com perfeição qualquer mapa, fórmula ou testemunho lido no passado."
          }
        ],
        "inventory": [
          {
            "name": "Códice de Santo Agostinho (Cópia Fac-símile)",
            "space": 1,
            "desc": "Manuscrito em latim com desenhos anatômicos da mente sem-rosto."
          },
          {
            "name": "Diapasão de Prata Sem-Rosto",
            "space": 1,
            "desc": "Instrumento afinado na frequência de cancelamento acústico do LIMIAR."
          },
          {
            "name": "Lente de Aumento com Filtro Espectral",
            "space": 1,
            "desc": "Lente especial para decifrar filigranas em metais antigos."
          }
        ],
        "relics": [
          "Diapasão de Prata Sem-Rosto"
        ]
      }
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
  ],
  "bestiary": [
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
      "description": "Criaturas humanoides deformadas pela permanência prolongada nas minas de prata mexicana. Seus rostos não possuem olhos, apenas orifícios auditivos hipertrofiados e uma mandíbula cartilaginosa que repete sussurros roubados."
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
      "description": "Uma massa amórfica de células totipotentes mutantes capaz de absorver tecidos humanos e replicar a fisiologia completa da vítima em segundos. Responsável pelo massacre do convés inferior do navio durante a travessia."
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
      "description": "Um cefalópode de proporções cósmicas fundido organicamente com rochas magmáticas das profundezas da Fossa de Porto Rico. Seus tentáculos produzem bioeletricidade azulada capaz de apagar redes inteiras de energia."
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
      "description": "Unidades mecânicas prototípicas projetadas por Gabriel Vilar utilizando peças de antigas locomotivas mineradoras e chips acoplados ao núcleo do LIMIAR para patrulhar a ferrovia e capturar invasores."
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
      "description": "Uma projeção ectoplasmática gélida conjurada à distância pela mente do Arquiteto do Caos. Tem o formato de mãos colossais cobertas por roseiras de espinhos carmesins e névoa congelante."
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
      ]
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
    }
  ],
  "timeline": [
    {
      "id": "time_ale_01",
      "year": "Ano 2023",
      "chronological_year": 2023,
      "era_badge": "Gênese do Oculto (2023)",
      "title": "O Selamento da Abadia de Friburgo",
      "location": "Floresta Negra (Alemanha)",
      "category": "Investigação Ocultista & Selamento",
      "campaign_id": "camp_005",
      "threat_level": "Nível 4 - Crítico",
      "threat_stars": 4,
      "status": "Concluído (Selado)",
      "survivors": "Greta Falk (Sem voz), Hans Richter",
      "casualties": "4 monges da congregação herética",
      "characters": [
        "char_greta",
        "char_hans"
      ],
      "description": "Greta Falk e Hans Richter desmantelam o culto dos Sem-Rosto na Floresta Negra e selam a cripta com concreto hidrofóbico após a perda definitiva da voz de Greta diante das presenças dimensionais."
    },
    {
      "id": "time_01",
      "year": "Ano 2023 (-3)",
      "chronological_year": 2023.5,
      "era_badge": "Incidente das Minas (2023)",
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
        "char_gabriel"
      ],
      "description": "Durante uma brincadeira entre seis amigos nas proximidades da Mansão Vilar no México, Lucas Vilar entra nos túneis abandonados da ferrovia e desaparece na escuridão. O caso é arquivado pela polícia como fuga, mas uma culpa profunda consome o grupo."
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
      "description": "Recusando-se a aceitar a morte do irmão, Gabriel Vilar tranca-se no casarão. Ele descobre fontes de energia anômala nas rochas da serra e inicia a construção da arma de portais dimensionais: o LIMIAR."
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
      "status": "Ativo / Expansão Contínua",
      "survivors": "Arquiteto do Caos (Transcendido 99% MDA)",
      "casualties": "Flotilha costeira e tripulações civis",
      "characters": [
        "char_arquiteto"
      ],
      "description": "No Oceano Atlântico, experimentos com bio-ressonância culminam na ascensão do Arquiteto do Caos (99% MDA). Um buraco de minhoca abre-se no mar, engolindo flotilhas, aviões e submarinos, criando a anomalia permanente do Triângulo."
    },
    {
      "id": "time_bra_01",
      "year": "Ano 2025",
      "chronological_year": 2025.5,
      "era_badge": "Contenção Amazônica (2025)",
      "title": "Incidente da Bacia do Tapajós",
      "location": "Floresta Amazônica (Brasil)",
      "category": "Operação Tática de Contenção",
      "campaign_id": "camp_004",
      "threat_level": "Nível 4 - Crítico",
      "threat_stars": 4,
      "status": "Contido / Quarentena Militar",
      "survivors": "Capitão Thiago Santos, Dra. Camila Neves",
      "casualties": "2 soldados da patrulha de reconhecimento",
      "characters": [
        "char_thiago",
        "char_camila"
      ],
      "description": "O esquadrão Curupira liderado pelo Capitão Thiago Santos penetra a cratera de quartzo negro no Brasil, enfrentando mutações biológicas vegetais e resgatando a Dra. Camila Neves antes da floração letal."
    },
    {
      "id": "time_04",
      "year": "Ano 2026 (Ano 0)",
      "chronological_year": 2026,
      "era_badge": "Clímax da Mansão Vilar (2026)",
      "title": "A Noite da Confissão & O Resgate",
      "location": "Mansão Vilar & Minas (México)",
      "category": "Clímax de Campanha",
      "campaign_id": "camp_002",
      "threat_level": "Nível 4 - Crítico",
      "threat_stars": 4,
      "status": "Concluído com Sobreviventes",
      "survivors": "Lucas Vilar, Gabriel Vilar, Rafael Montes, Júlia Prado",
      "casualties": "Criaturas das Minas exterminadas",
      "characters": [
        "char_lucas",
        "char_gabriel",
        "char_rafael",
        "char_julia"
      ],
      "description": "Gabriel atrai os antigos amigos de volta ao México com bilhetes de trem anônimos. Usando a máscara de Davi Reis e o LIMIAR, força as confissões. No subsolo, enfrentam os Ecos e resgatam Lucas com vida após 3 anos de isolamento e sobrevivência."
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
      "status": "Em Andamento (Conflito Aberto)",
      "survivors": "Sargento Miller, Dra. Evelyn Reed, civis de Nova Caronte",
      "casualties": "Baixas contínuas na carcaça do cargueiro",
      "characters": [
        "char_miller",
        "char_evelyn",
        "char_arquiteto"
      ],
      "description": "O navio de 5.000 almas é tragado pela fenda no Atlântico. Os sobreviventes fundam a cidadela caótica de Nova Caronte, onde precisam lidar com mutações forçadas, os ataques do Mímico e as profecias do Arquiteto do Caos."
    },
    {
      "id": "time_06",
      "year": "Ano 2027 (Horizonte)",
      "chronological_year": 2027,
      "era_badge": "Crise Glacial (Horizonte)",
      "title": "Alerta Vermelho na Estação Zero",
      "location": "Estação Criogênica Zero (Groenlândia)",
      "category": "Incursão Polar",
      "campaign_id": "camp_003",
      "threat_level": "Nível 5 - Emergência Máxima",
      "threat_stars": 5,
      "status": "Alerta Vermelho (Comunicações Silenciadas)",
      "survivors": "Dra. Evelyn Reed (Equipe de Resgate)",
      "casualties": "12 cientistas criogênicos desaparecidos no gelo",
      "characters": [
        "char_evelyn"
      ],
      "description": "A estação de pesquisa cessa todas as transmissões de rádio após relatar a quebra da câmara criogênica primária e manifestações do Polimorfo. Uma equipe tática da A.E.G.I.S. é despachada em meio a uma tempestade ártica nível 5."
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
        "id": "camp_003",
        "label": "Estação Zero (Groenlândia)",
        "type": "campaign",
        "color": "#00f0ff",
        "radius": 26
      },
      {
        "id": "camp_004",
        "label": "Protocolo Selva (Brasil)",
        "type": "campaign",
        "color": "#2ecc71",
        "radius": 26
      },
      {
        "id": "camp_005",
        "label": "Floresta Negra (Alemanha)",
        "type": "campaign",
        "color": "#9b59b6",
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
        "id": "char_miller",
        "label": "Sgt. Miller",
        "type": "character",
        "campaign_id": "camp_001",
        "color": "#00e5ff",
        "radius": 18
      },
      {
        "id": "char_evelyn",
        "label": "Dra. Evelyn",
        "type": "character",
        "campaign_id": "camp_001",
        "color": "#00e5ff",
        "radius": 18
      },
      {
        "id": "char_thiago",
        "label": "Cap. Thiago",
        "type": "character",
        "campaign_id": "camp_004",
        "color": "#2ecc71",
        "radius": 18
      },
      {
        "id": "char_camila",
        "label": "Dra. Camila",
        "type": "character",
        "campaign_id": "camp_004",
        "color": "#2ecc71",
        "radius": 18
      },
      {
        "id": "char_greta",
        "label": "Greta Falk",
        "type": "character",
        "campaign_id": "camp_005",
        "color": "#9b59b6",
        "radius": 18
      },
      {
        "id": "char_hans",
        "label": "Hans Richter",
        "type": "character",
        "campaign_id": "camp_005",
        "color": "#9b59b6",
        "radius": 18
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
        "target": "char_miller",
        "label": "Comandante Militar"
      },
      {
        "source": "camp_001",
        "target": "char_evelyn",
        "label": "Líder Científica"
      },
      {
        "source": "camp_001",
        "target": "char_arquiteto",
        "label": "Entidade Primordial"
      },
      {
        "source": "char_miller",
        "target": "char_evelyn",
        "label": "Escolta e Aliança"
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
        "source": "camp_003",
        "target": "char_evelyn",
        "label": "Equipe de Investigação"
      },
      {
        "source": "camp_003",
        "target": "rel_lanterna_criogenica",
        "label": "Instrumento Polar"
      },
      {
        "source": "camp_003",
        "target": "cri_polimorfo",
        "label": "Organismo Crio-mutante"
      },
      {
        "source": "camp_004",
        "target": "char_thiago",
        "label": "Líder Esquadrão Curupira"
      },
      {
        "source": "camp_004",
        "target": "char_camila",
        "label": "Bioquímica Resgatada"
      },
      {
        "source": "char_thiago",
        "target": "char_camila",
        "label": "Proteção & Extração"
      },
      {
        "source": "char_camila",
        "target": "rel_esporo_dourado",
        "label": "Pesquisa do Cristal"
      },
      {
        "source": "camp_004",
        "target": "cri_esporos",
        "label": "Bio-parasita Vegetal"
      },
      {
        "source": "camp_005",
        "target": "char_greta",
        "label": "Ocultista Marcada"
      },
      {
        "source": "camp_005",
        "target": "char_hans",
        "label": "Guardião Veterano"
      },
      {
        "source": "char_greta",
        "target": "char_hans",
        "label": "Parceiros / Voto de Silêncio"
      },
      {
        "source": "char_hans",
        "target": "rel_manuscrito_friburgo",
        "label": "Tradutor das Runas"
      },
      {
        "source": "camp_005",
        "target": "cri_sem_rosto",
        "label": "Hereges Criptografados"
      },
      {
        "source": "char_gabriel",
        "target": "char_evelyn",
        "label": "Correspondência Teórica (A.E.G.I.S.)"
      },
      {
        "source": "char_thiago",
        "target": "char_miller",
        "label": "Ex-companheiros de Operações Especiais"
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
      "description": "Instituição responsável pelo monitoramento de anomalias biológicas e físicas no planeta Evren, bem como pela manutenção do Arquivo Histórico Global."
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
  }
};
  }
}

// Instância global
if (typeof window !== 'undefined') {
  window.DataLoader = DataLoader;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataLoader;
}
