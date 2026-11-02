/**
 * MUSEUM STORAGE & ARCHIVAL PERSISTENCE ENGINE
 * Universo: Evren — Museu Histórico Interativo 3D
 *
 * Responsabilidades:
 * 1. Banco de dados local estruturado via IndexedDB (EvrenHistoricalMuseumDB v3)
 *    capaz de armazenar grandes volumes de campanhas, centenas de personagens,
 *    acontecimentos, regiões, imagens (base64/blobs) e documentos históricos.
 * 2. Sincronização automática com localStorage e DataLoader em memória.
 * 3. Exportação e Importação completa do Universo (Backup Versionado v3.0.0-museum).
 * 4. Exportação e Importação de Campanhas Individuais (Pacote de Exposição Isolada).
 * 5. Snapshots automáticos de segurança antes de qualquer restauração.
 */

class MuseumStorageManager {
  constructor(dataLoader) {
    this.dataLoader = dataLoader;
    this.dbName = 'EvrenHistoricalMuseumDB';
    this.dbVersion = 4;
    this.schemaVersion = '3.0.0-museum';
    this.db = null;
    this.isReady = false;
    this.MERGEABLE_COLLECTIONS = [
      'continents', 'countries', 'regions', 'cities', 'campaigns', 'locations',
      'characters', 'historical_events', 'chronicles', 'timeline', 'relics',
      'bestiary', 'organizations', 'maps'
    ];
  }

  /**
   * Inicializa o IndexedDB com stores dedicados para cada entidade histórica
   */
  async init() {
    if (typeof indexedDB === 'undefined') {
      console.warn('IndexedDB indisponível neste ambiente; operando via localStorage estruturado.');
      this.isReady = true;
      return false;
    }

    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(this.dbName, this.dbVersion);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          const stores = [
            'universe_state',
            'universe_snapshots',
            'campaigns',
            'characters',
            'locations',
            'historical_events',
            'regions',
            'cities',
            'media_gallery',
            'documents'
          ];
          stores.forEach((storeName) => {
            if (!db.objectStoreNames.contains(storeName)) {
              db.createObjectStore(storeName, { keyPath: 'id' });
            }
          });
        };

        request.onsuccess = async (event) => {
          this.db = event.target.result;
          this.isReady = true;
          await this.hydrateDataLoaderFromIndexedDB();
          resolve(true);
        };

        request.onerror = (err) => {
          console.warn('Aviso ao abrir IndexedDB do Museu:', err);
          this.isReady = true;
          resolve(false);
        };
      } catch (e) {
        console.warn('Exceção ao inicializar IndexedDB:', e);
        this.isReady = true;
        resolve(false);
      }
    });
  }

  /**
   * Lê registros persistidos no IndexedDB e os mescla ao DataLoader ativo sem sobrescrever dados base
   */
  async hydrateDataLoaderFromIndexedDB() {
    if (!this.db || !this.dataLoader || !this.dataLoader.data) return;

    try {
      // 1. Estado ativo completo do universo (inclui coleções importadas de backups)
      const states = await this.getAllFromStore('universe_state');
      const active = states.find((s) => s.id === 'active');
      if (active && active.data) {
        this.MERGEABLE_COLLECTIONS.forEach((col) => {
          if (!Array.isArray(active.data[col])) return;
          if (!Array.isArray(this.dataLoader.data[col])) this.dataLoader.data[col] = [];
          active.data[col].forEach((item) => this.upsertInArray(this.dataLoader.data[col], item));
        });
      }

      // 2. Registros individuais salvos pela curadoria
      const customCampaigns = await this.getAllFromStore('campaigns');
      customCampaigns.forEach((camp) => this.upsertInArray(this.dataLoader.data.campaigns, camp));

      const customCharacters = await this.getAllFromStore('characters');
      customCharacters.forEach((ch) => this.upsertInArray(this.dataLoader.data.characters, ch));

      const customLocations = await this.getAllFromStore('locations');
      customLocations.forEach((loc) => this.upsertInArray(this.dataLoader.data.locations, loc));

      const customEvents = await this.getAllFromStore('historical_events');
      if (!this.dataLoader.data.historical_events) this.dataLoader.data.historical_events = [];
      customEvents.forEach((evt) => this.upsertInArray(this.dataLoader.data.historical_events, evt));

      const customRegions = await this.getAllFromStore('regions');
      if (!this.dataLoader.data.regions) this.dataLoader.data.regions = [];
      customRegions.forEach((reg) => this.upsertInArray(this.dataLoader.data.regions, reg));

      const customCities = await this.getAllFromStore('cities');
      if (!this.dataLoader.data.cities) this.dataLoader.data.cities = [];
      customCities.forEach((city) => this.upsertInArray(this.dataLoader.data.cities, city));
    } catch (e) {
      console.warn('Aviso ao hidratar dados do IndexedDB:', e);
    }
  }

  /**
   * Grava o estado completo e atual do universo no IndexedDB (prevenção contra perda de dados)
   */
  async persistActiveUniverse() {
    const raw = this.dataLoader?.getRawData();
    if (!raw) return false;
    const payload = {};
    this.MERGEABLE_COLLECTIONS.forEach((col) => {
      if (Array.isArray(raw[col])) payload[col] = raw[col];
    });
    return this.putInStore('universe_state', {
      id: 'active',
      saved_at: new Date().toISOString(),
      data: JSON.parse(JSON.stringify(payload))
    });
  }

  /**
   * Cria um ponto de restauração manual/automático (mantém os 12 mais recentes)
   */
  async createSnapshot(label = 'Ponto de restauração') {
    const raw = this.dataLoader?.getRawData();
    if (!raw) return null;
    const snap = {
      id: `snap_${Date.now()}`,
      label,
      created_at: new Date().toISOString(),
      data: JSON.parse(JSON.stringify(raw))
    };
    await this.putInStore('universe_snapshots', snap);
    const all = (await this.getAllFromStore('universe_snapshots')).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    for (const old of all.slice(12)) await this.deleteFromStore('universe_snapshots', old.id);
    return snap;
  }

  async listSnapshots() {
    const all = await this.getAllFromStore('universe_snapshots');
    return all
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .map((s) => ({ id: s.id, label: s.label || 'Snapshot', created_at: s.created_at }));
  }

  async restoreSnapshot(snapshotId) {
    const all = await this.getAllFromStore('universe_snapshots');
    const snap = all.find((s) => s.id === snapshotId);
    if (!snap || !snap.data) throw new Error('Ponto de restauração não encontrado.');
    await this.createSnapshot('Antes de restaurar ' + (snap.label || snap.id));
    this.MERGEABLE_COLLECTIONS.forEach((col) => {
      if (Array.isArray(snap.data[col])) this.dataLoader.data[col] = JSON.parse(JSON.stringify(snap.data[col]));
    });
    await this.persistActiveUniverse();
    return snap;
  }

  /**
   * Armazena uma imagem/documento (dataURL) no acervo de mídia organizado
   */
  async saveMedia({ name, dataUrl, kind = 'image', linkedType = null, linkedId = null }) {
    if (!dataUrl) return null;
    const record = {
      id: `media_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name || 'arquivo',
      kind,
      linked_type: linkedType,
      linked_id: linkedId,
      data_url: dataUrl,
      size_bytes: Math.round((dataUrl.length * 3) / 4),
      created_at: new Date().toISOString()
    };
    await this.putInStore('media_gallery', record);
    return record;
  }

  async listMedia() {
    return this.getAllFromStore('media_gallery');
  }

  deleteFromStore(storeName, id) {
    return new Promise((resolve) => {
      if (!this.db || !this.db.objectStoreNames.contains(storeName)) return resolve(false);
      try {
        const tx = this.db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).delete(id);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  }

  upsertInArray(targetArray, item) {
    if (!Array.isArray(targetArray) || !item || !item.id) return;
    const idx = targetArray.findIndex((x) => x.id === item.id);
    if (idx >= 0) {
      targetArray[idx] = { ...targetArray[idx], ...item };
    } else {
      targetArray.push(item);
    }
  }

  getAllFromStore(storeName) {
    return new Promise((resolve) => {
      if (!this.db || !this.db.objectStoreNames.contains(storeName)) {
        return resolve([]);
      }
      try {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  }

  putInStore(storeName, record) {
    return new Promise((resolve) => {
      if (!this.db || !this.db.objectStoreNames.contains(storeName) || !record || !record.id) {
        return resolve(false);
      }
      try {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.put({
          ...record,
          _updated_at: new Date().toISOString(),
          _schema_version: this.schemaVersion
        });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  }

  /**
   * Salva ou atualiza uma Campanha Histórica (Exposição)
   */
  async saveCampaign(campaignData) {
    if (!campaignData || !campaignData.id) return null;
    const d = this.dataLoader.data;
    this.upsertInArray(d.campaigns, campaignData);
    await this.putInStore('campaigns', campaignData);
    this.mirrorToLocalStorage('evren_custom_campaigns', campaignData);
    await this.persistActiveUniverse();
    return campaignData;
  }

  /**
   * Salva ou atualiza um Personagem Histórico
   */
  async saveCharacter(characterData) {
    if (!characterData || !characterData.id) return null;
    const d = this.dataLoader.data;
    this.upsertInArray(d.characters, characterData);
    await this.putInStore('characters', characterData);
    this.mirrorToLocalStorage('evren_custom_characters_v1', characterData);
    await this.persistActiveUniverse();
    return characterData;
  }

  /**
   * Salva ou atualiza um Local Histórico
   */
  async saveLocation(locationData) {
    if (!locationData || !locationData.id) return null;
    const d = this.dataLoader.data;
    this.upsertInArray(d.locations, locationData);
    await this.putInStore('locations', locationData);
    this.mirrorToLocalStorage('evren_custom_locations_v1', locationData);
    await this.persistActiveUniverse();
    return locationData;
  }

  /**
   * Salva ou atualiza um Acontecimento Histórico / Registro de Sessão
   */
  async saveHistoricalEvent(eventData) {
    if (!eventData || !eventData.id) return null;
    const d = this.dataLoader.data;
    if (!d.historical_events) d.historical_events = [];
    this.upsertInArray(d.historical_events, eventData);

    // Sincroniza também na timeline e nas crônicas se apropriado
    if (eventData.type === 'session_chronicle') {
      this.upsertInArray(d.chronicles, {
        id: eventData.id,
        title: eventData.title,
        campaign_id: eventData.campaign_id,
        location_id: eventData.location_id,
        session: eventData.date || 'Registro Histórico',
        author: eventData.author || 'Curadoria do Museu',
        participants: eventData.participants || [],
        summary: eventData.description,
        consequences: eventData.consequences,
        audio_duration: eventData.audio_duration || '05:00'
      });
      this.mirrorToLocalStorage('evren_custom_chronicles', eventData);
    }

    await this.putInStore('historical_events', eventData);
    this.mirrorToLocalStorage('evren_custom_historical_events', eventData);
    await this.persistActiveUniverse();
    return eventData;
  }

  mirrorToLocalStorage(key, record) {
    if (typeof localStorage === 'undefined' || !record || !record.id) return;
    try {
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      this.upsertInArray(list, record);
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {
      console.warn(`Aviso ao sincronizar ${key} no localStorage:`, e);
    }
  }

  /**
   * Gera um pacote completo e versionado de todo o Universo EVREN para backup externo
   */
  exportFullUniverseBackup() {
    const raw = this.dataLoader.getRawData();
    const payload = {
      backup_type: 'EVREN_FULL_UNIVERSE_MUSEUM_BACKUP',
      schema_version: this.schemaVersion,
      exported_at: new Date().toISOString(),
      planet_name: raw?.planet?.name || 'Evren',
      statistics: {
        continents: (raw?.continents || []).length,
        countries: (raw?.countries || []).length,
        regions: (raw?.regions || []).length,
        cities: (raw?.cities || []).length,
        campaigns: (raw?.campaigns || []).length,
        locations: (raw?.locations || []).length,
        characters: (raw?.characters || []).length,
        historical_events: (raw?.historical_events || []).length,
        chronicles: (raw?.chronicles || []).length,
        relics: (raw?.relics || []).length,
        bestiary: (raw?.bestiary || []).length
      },
      universe_data: raw
    };
    return payload;
  }

  /**
   * Exporta uma única campanha (Exposição Histórica) com todos os seus personagens,
   * locais, acontecimentos, crônicas e relíquias vinculadas.
   */
  exportSingleCampaignPackage(campaignId) {
    const camp = this.dataLoader.getCampaignById(campaignId);
    if (!camp) return null;

    const hierarchy = this.dataLoader.getGeographicHierarchyForCampaign(campaignId);
    const characters = this.dataLoader.getCharacters(campaignId);
    const locations = this.dataLoader.getLocations(campaignId);
    const events = this.dataLoader.getHistoricalEvents(campaignId);
    const chronicles = this.dataLoader.getChronicles(campaignId);
    const charNames = characters.map((c) => (c.name || '').toLowerCase());
    const relics = this.dataLoader.getRelics().filter((r) =>
      r.campaign_id === campaignId ||
      characters.some((c) => (c.relics || []).includes(r.name)) ||
      charNames.some((n) => n && (r.owner || '').toLowerCase().includes(n.split(' ')[0]))
    );

    return {
      backup_type: 'EVREN_SINGLE_CAMPAIGN_EXHIBITION_PACKAGE',
      schema_version: this.schemaVersion,
      exported_at: new Date().toISOString(),
      campaign: camp,
      geographic_hierarchy: {
        continent: hierarchy?.continent || null,
        country: hierarchy?.country || null,
        region: hierarchy?.region || null,
        city: hierarchy?.city || null
      },
      characters,
      locations,
      historical_events: events,
      chronicles,
      relics
    };
  }

  /**
   * Restaura um backup completo do universo ou importa um pacote de campanha individual,
   * preservando registros existentes e criando snapshot de segurança antes.
   */
  async importMuseumPackage(jsonObject, options = { merge: true }) {
    if (!jsonObject || typeof jsonObject !== 'object') {
      throw new Error('Arquivo JSON inválido ou corrompido.');
    }

    // 1. Cria snapshot de segurança antes da importação
    await this.createSnapshot('Antes de importar ' + (jsonObject.backup_type || 'pacote JSON'));

    // Caso 1: Pacote de Campanha Individual
    if (jsonObject.backup_type === 'EVREN_SINGLE_CAMPAIGN_EXHIBITION_PACKAGE' && jsonObject.campaign) {
      await this.saveCampaign(jsonObject.campaign);
      for (const ch of (jsonObject.characters || [])) {
        await this.saveCharacter(ch);
      }
      for (const loc of (jsonObject.locations || [])) {
        await this.saveLocation(loc);
      }
      for (const evt of (jsonObject.historical_events || [])) {
        await this.saveHistoricalEvent(evt);
      }
      for (const cr of (jsonObject.chronicles || [])) {
        this.upsertInArray(this.dataLoader.data.chronicles, cr);
        this.mirrorToLocalStorage('evren_custom_chronicles', cr);
      }
      await this.persistActiveUniverse();
      return {
        mode: 'single_campaign',
        campaignName: jsonObject.campaign.name,
        importedCharacters: (jsonObject.characters || []).length,
        importedLocations: (jsonObject.locations || []).length,
        importedEvents: (jsonObject.historical_events || []).length
      };
    }

    // Caso 2: Backup Completo do Universo (ou world_data.json direto)
    const sourceData = jsonObject.universe_data || jsonObject;
    if (!sourceData.campaigns && !sourceData.characters && !sourceData.locations) {
      throw new Error('O pacote JSON não contém coleções históricas reconhecidas do Universo Evren.');
    }

    const current = this.dataLoader.data;
    const arrayCollections = [
      'continents',
      'countries',
      'regions',
      'cities',
      'campaigns',
      'locations',
      'characters',
      'historical_events',
      'chronicles',
      'timeline',
      'relics',
      'bestiary',
      'organizations',
      'maps'
    ];

    arrayCollections.forEach((col) => {
      if (Array.isArray(sourceData[col])) {
        if (!Array.isArray(current[col]) || !options.merge) {
          current[col] = [...sourceData[col]];
        } else {
          sourceData[col].forEach((item) => this.upsertInArray(current[col], item));
        }
      }
    });

    // Persiste nos stores do IndexedDB
    for (const camp of (sourceData.campaigns || [])) await this.putInStore('campaigns', camp);
    for (const ch of (sourceData.characters || [])) await this.putInStore('characters', ch);
    for (const loc of (sourceData.locations || [])) await this.putInStore('locations', loc);
    for (const evt of (sourceData.historical_events || [])) await this.putInStore('historical_events', evt);

    await this.persistActiveUniverse();
    return {
      mode: 'full_universe',
      importedCampaigns: (sourceData.campaigns || []).length,
      importedCharacters: (sourceData.characters || []).length,
      importedLocations: (sourceData.locations || []).length,
      importedEvents: (sourceData.historical_events || []).length
    };
  }

  /**
   * Dispara o download de um objeto JSON formatado no navegador
   */
  downloadJSON(dataObject, filename) {
    const jsonStr = JSON.stringify(dataObject, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }
}

window.MuseumStorageManager = MuseumStorageManager;
