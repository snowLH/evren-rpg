/**
 * CRIADOR & EDITOR INTERATIVO DE AGENTES (FICHA BIOPUNK)
 * Universo: Evren — Mesa Interativa
 * Permite criar e customizar fichas de personagens com distribuição de atributos,
 * seleção de classe, cálculo de MDA e persistência em localStorage.
 */

class CharacterCreator {
  constructor(dataLoader, uiController) {
    this.dataLoader = dataLoader;
    this.uiController = uiController;

    this.modalEl = null;
    this.attributes = {
      Força: 2,
      Vigor: 2,
      Agilidade: 2,
      Presença: 2,
      Intelecto: 2
    };
    this.maxPoints = 12; // Total de pontos a distribuir
    this.basePoints = 10; // 5 atributos x 2 = 10 gastos inicialmente
    this.storageKey = 'evren_custom_characters_v1';
  }

  init() {
    this.modalEl = document.getElementById('modal-character-creator');

    // Wires de abertura
    const btnOpen = document.getElementById('btn-open-creator');
    const btnDrawerCreate = document.getElementById('btn-drawer-create-char');

    if (btnOpen) {
      btnOpen.addEventListener('click', () => this.openModal());
    }

    if (btnDrawerCreate) {
      btnDrawerCreate.addEventListener('click', () => this.openModal());
    }

    // Wires do formulário
    const mdaSlider = document.getElementById('creator-mda-slider');
    const mdaBadge = document.getElementById('creator-mda-val');
    if (mdaSlider && mdaBadge) {
      mdaSlider.addEventListener('input', (e) => {
        mdaBadge.textContent = `${e.target.value}%`;
      });
    }

    const btnRandom = document.getElementById('btn-creator-random-attrs');
    if (btnRandom) {
      btnRandom.addEventListener('click', () => this.randomizeAttributes());
    }

    const form = document.getElementById('creator-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitForm();
      });
    }

    this.setupAttributeSteppers();
    this.loadCustomCharactersFromStorage();

    console.log('✓ CharacterCreator inicializado com sucesso.');
  }

  openModal() {
    if (!this.modalEl) return;
    this.modalEl.classList.add('open');
    if (window.soundFX) window.soundFX.playTacticalBeep();
  }

  closeModal() {
    if (!this.modalEl) return;
    this.modalEl.classList.remove('open');
  }

  setupAttributeSteppers() {
    ['Força', 'Vigor', 'Agilidade', 'Presença', 'Intelecto'].forEach(attr => {
      const box = document.getElementById(`attr-box-${attr}`);
      if (!box) return;

      const btnPlus = box.querySelector('.btn-attr-plus');
      const btnMinus = box.querySelector('.btn-attr-minus');
      const valEl = box.querySelector('.attr-stepper-val');

      if (btnPlus) {
        btnPlus.addEventListener('click', () => {
          const currentTotal = Object.values(this.attributes).reduce((a, b) => a + b, 0);
          if (currentTotal < this.maxPoints && this.attributes[attr] < 5) {
            this.attributes[attr]++;
            if (valEl) valEl.textContent = this.attributes[attr];
            this.updatePointsRemaining();
            if (window.soundFX) window.soundFX.playTacticalBeep();
          }
        });
      }

      if (btnMinus) {
        btnMinus.addEventListener('click', () => {
          if (this.attributes[attr] > 1) {
            this.attributes[attr]--;
            if (valEl) valEl.textContent = this.attributes[attr];
            this.updatePointsRemaining();
            if (window.soundFX) window.soundFX.playTacticalBeep();
          }
        });
      }
    });

    this.updatePointsRemaining();
  }

  updatePointsRemaining() {
    const currentTotal = Object.values(this.attributes).reduce((a, b) => a + b, 0);
    const remaining = this.maxPoints - currentTotal;
    const ptsEl = document.getElementById('creator-points-left');
    if (ptsEl) {
      ptsEl.textContent = `${remaining} pontos restantes`;
      ptsEl.style.color = remaining === 0 ? '#39ff14' : (remaining > 0 ? '#ffd700' : '#ff5e78');
    }
  }

  randomizeAttributes() {
    const attrs = ['Força', 'Vigor', 'Agilidade', 'Presença', 'Intelecto'];
    attrs.forEach(a => this.attributes[a] = 1);
    let points = this.maxPoints - 5;

    while (points > 0) {
      const randomAttr = attrs[Math.floor(Math.random() * attrs.length)];
      if (this.attributes[randomAttr] < 5) {
        this.attributes[randomAttr]++;
        points--;
      }
    }

    attrs.forEach(attr => {
      const box = document.getElementById(`attr-box-${attr}`);
      const valEl = box?.querySelector('.attr-stepper-val');
      if (valEl) valEl.textContent = this.attributes[attr];
    });

    this.updatePointsRemaining();
    if (window.soundFX) window.soundFX.playDiceRoll();
  }

  submitForm() {
    const nameInput = document.getElementById('creator-name');
    const codenameInput = document.getElementById('creator-codename');
    const roleInput = document.getElementById('creator-role');
    const classInput = document.getElementById('creator-class');
    const campInput = document.getElementById('creator-campaign');
    const mdaSlider = document.getElementById('creator-mda-slider');
    const relicInput = document.getElementById('creator-relic');
    const loreInput = document.getElementById('creator-lore');

    const name = nameInput?.value.trim() || 'Agente Sem Nome';
    const codename = codenameInput?.value.trim();
    const fullName = codename ? `${name} (${codename})` : name;
    const charId = `char_custom_${Date.now()}`;
    const mdaVal = parseInt(mdaSlider?.value) || 15;
    const charClass = classInput?.value || 'Especialista';
    const campId = campInput?.value || 'camp_001';
    const relic = relicInput?.value.trim() || 'Nenhuma Relíquia Registrada';
    const summary = loreInput?.value.trim() || 'Agente de campo treinado para contenção de anomalias.';

    // Gera conjunto canônico de perícias CRIS com base na classe e atributos
    const allSkillsList = [
      ["Acrobacia", "AGI"], ["Adestramento", "PRE"], ["Artes", "PRE"], ["Atletismo", "FOR"],
      ["Atualidades", "INT"], ["Ciências", "INT"], ["Crime", "AGI"], ["Diplomacia", "PRE"],
      ["Enganação", "PRE"], ["Fortitude", "VIG"], ["Furtividade", "AGI"], ["Iniciativa", "AGI"],
      ["Intimidação", "PRE"], ["Intuição", "PRE"], ["Investigação", "INT"], ["Luta", "FOR"],
      ["Medicina", "INT"], ["Ocultismo", "INT"], ["Percepção", "PRE"], ["Pilotagem", "AGI"],
      ["Pontaria", "AGI"], ["Profissão", "INT"], ["Reflexos", "AGI"], ["Religião", "PRE"],
      ["Sobrevivência", "INT"], ["Tática", "INT"], ["Tecnologia", "INT"], ["Vontade", "PRE"]
    ];

    const classTrained = {
      'Combatente': ['Luta', 'Pontaria', 'Fortitude', 'Atletismo', 'Iniciativa'],
      'Especialista': ['Investigação', 'Tecnologia', 'Percepção', 'Furtividade', 'Atualidades'],
      'Conjurador': ['Ocultismo', 'Vontade', 'Intuição', 'Ciências', 'Percepção']
    }[charClass] || ['Investigação', 'Percepção'];

    const generatedSkills = {};
    allSkillsList.forEach(([sName, sAttr]) => {
      const isTr = classTrained.includes(sName);
      const attrKey = sAttr === 'AGI' ? 'Agilidade' : (sAttr === 'FOR' ? 'Força' : (sAttr === 'INT' ? 'Intelecto' : (sAttr === 'PRE' ? 'Presença' : 'Vigor')));
      const attrScore = this.attributes[attrKey] || 1;
      const bonus = isTr ? 5 : 0;
      generatedSkills[sName] = {
        grau: isTr ? 'Treinado' : 'Destreinado',
        bonus: bonus,
        attr: sAttr,
        total: attrScore + bonus
      };
    });

    const newChar = {
      id: charId,
      name: fullName,
      codename: codename || '',
      player: roleInput?.value || 'Jogador',
      origin: 'Sobrevivente',
      class: charClass,
      track: `${charClass} de Campo`,
      nex: `${mdaVal}%`,
      mda: `${mdaVal}%`,
      status: 'Ativo',
      life_status: 'alive',
      attributes: { ...this.attributes },
      stats: {
        pv_current: 20 + (this.attributes.Vigor * 3),
        pv_max: 20 + (this.attributes.Vigor * 3),
        pe_current: 10 + (this.attributes.Presença * 2),
        pe_max: 10 + (this.attributes.Presença * 2),
        san_current: 25,
        san_max: 30,
        defesa: 10 + (this.attributes.Agilidade || 2),
        protecao: "Colete Leve (RD 1)"
      },
      skills: generatedSkills,
      abilities: [
        `Treinamento Operacional (${charClass})`,
        "Resiliência sob Estresse Paranormal"
      ],
      inventory: [
        relic,
        "Kit Básico de Investigação de Campo",
        "Lanterna Tática e Rádio Portátil"
      ],
      relics: relic !== 'Nenhuma Relíquia Registrada' ? [relic] : [],
      quote: `A história de ${fullName} começou quando o mundo desabou.`,
      summary: summary,
      campaign_ids: [campId],
      isCustom: true
    };

    // 1. Registra no DataLoader
    if (this.dataLoader.data) {
      this.dataLoader.data.characters.push(newChar);
    }

    // 2. Registra estados no UIController
    if (this.uiController) {
      this.uiController.pdState[charId] = { current: 20, max: 20 };
      this.uiController.mdaState[charId] = mdaVal;
      this.uiController.charAttributes[charId] = { ...this.attributes };

      // Renderiza novamente a lista de fichas
      this.uiController.renderCharactersList();
      this.uiController.selectCharacter(charId);
      this.uiController.openDrawer('characters');
    }

    // 3. Salva em localStorage
    this.saveCustomCharacterToStorage(newChar);

    // 4. Registra no Diário
    if (window.sessionJournal) {
      window.sessionJournal.logEvent(`👤 Novo Agente Criado: ${fullName} [${charClass} • MDA ${mdaVal}%]`);
    }

    if (window.soundFX) window.soundFX.playCritSpark();

    this.closeModal();
    alert(`✓ Ficha de ${fullName} registrada com sucesso na base de dados de Evren!`);
  }

  saveCustomCharacterToStorage(char) {
    try {
      const raw = localStorage.getItem(this.storageKey);
      const list = raw ? JSON.parse(raw) : [];
      list.push({
        char,
        attributes: this.attributes,
        pd: { current: 20, max: 20 },
        mda: parseInt(char.mda) || 15
      });
      localStorage.setItem(this.storageKey, JSON.stringify(list));
    } catch(e) {
      console.warn('Erro ao salvar ficha customizada:', e);
    }
  }

  loadCustomCharactersFromStorage() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const list = JSON.parse(raw);

      list.forEach(item => {
        if (!this.dataLoader.data.characters.some(c => c.id === item.char.id)) {
          this.dataLoader.data.characters.push(item.char);
          if (this.uiController) {
            this.uiController.pdState[item.char.id] = item.pd;
            this.uiController.mdaState[item.char.id] = item.mda;
            this.uiController.charAttributes[item.char.id] = item.attributes;
          }
        }
      });
      if (list.length > 0) {
        this.uiController?.renderCharactersList();
        console.log(`✓ ${list.length} fichas customizadas restauradas do localStorage.`);
      }
    } catch(e) {
      console.warn('Erro ao carregar fichas customizadas:', e);
    }
  }
}

window.CharacterCreator = CharacterCreator;
