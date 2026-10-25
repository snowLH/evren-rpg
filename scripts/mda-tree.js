/**
 * ÁRVORE BIOLÓGICA DE MUTAÇÕES CELULARES (MDA EVOLUTION MATRIX)
 * Universo: Evren — Mesa Interativa
 * Renderiza o mapa de mutações genéticas com 4 tiers evolutivos,
 * verificando o MDA (%) do personagem em tempo real.
 */

class MDATreeController {
  constructor(dataLoader, uiController) {
    this.dataLoader = dataLoader;
    this.uiController = uiController;

    this.modalEl = null;
    this.charSelectEl = null;
    this.gaugeEl = null;
    this.tiersContainerEl = null;
    this.selectedCharId = 'char_lucas';

    this.tiersData = [
      {
        tier: 1,
        name: 'Nível I: Despertar Genético',
        reqRange: '5% - 25% MDA',
        minMda: 5,
        maxMda: 25,
        nodes: [
          {
            id: 'mda_spec_vision',
            name: 'Visão Espectral',
            icon: '👁️',
            branch: 'Neural',
            desc: 'As retinas se adaptam para enxergar fótons ultravioleta e desvios de frequência dimensional.',
            effect: '+2 em Percepção; ignora penalidades de penumbra e escuridão leve.'
          },
          {
            id: 'mda_adren_surge',
            name: 'Adrenalina Biopunk',
            icon: '⚡',
            branch: 'Físico',
            desc: 'Glândulas suprarrenais modificadas produzem noradrenalina enriquecida com íons.',
            effect: '+2 em Esquiva e Iniciativa durante a primeira rodada de qualquer combate.'
          },
          {
            id: 'mda_cell_homeo',
            name: 'Homeostase Acelerada',
            icon: '🧬',
            branch: 'Primordial',
            desc: 'As mitocôndrias consomem toxinas para restabelecer a estabilidade da membrana celular.',
            effect: 'Recupera +2 PD adicionais ao final de uma cena de investigação ou repouso.'
          }
        ]
      },
      {
        tier: 2,
        name: 'Nível II: Instabilidade Quimérica',
        reqRange: '26% - 50% MDA',
        minMda: 26,
        maxMda: 50,
        nodes: [
          {
            id: 'mda_chitin_armor',
            name: 'Quitinização Dérmica',
            icon: '🛡️',
            branch: 'Físico',
            desc: 'Placas ósseas microscópicas fundem-se sob a epiderme formando uma carapaça flexível.',
            effect: 'Reduz todo dano físico direto recebido em 2 pontos (acumulável com Sacrifício de Armadura).'
          },
          {
            id: 'mda_osmotic_claws',
            name: 'Garras Osmóticas',
            icon: '🩸',
            branch: 'Primordial',
            desc: 'As unhas endurecem em queratina reforçada capaz de canalizar enzimas líticas.',
            effect: 'Ataques desarmados causam 1d8+Força e causam sangramento celular de 2 PD por turno.'
          },
          {
            id: 'mda_sonar_ears',
            name: 'Ecolocalização Quiróptera',
            icon: '🦇',
            branch: 'Neural',
            desc: 'O canal auditivo hipertrofia, captando o retorno acústico dos menores movimentos (estilo Lucas Vilar).',
            effect: 'Imune a ataques surpresa e condições de cegueira total.'
          }
        ]
      },
      {
        tier: 3,
        name: 'Nível III: Metamorfose Anômala',
        reqRange: '51% - 75% MDA',
        minMda: 51,
        maxMda: 75,
        nodes: [
          {
            id: 'mda_tendril_reach',
            name: 'Tentáculos Parasitários',
            icon: '🐙',
            branch: 'Físico',
            desc: 'Fibras musculares extras emergem das escápulas, permitindo agarrar alvos à distância.',
            effect: 'Alcance tático estendido para 4,5 metros (3 quadrados); vantagem em testes de Agarre.'
          },
          {
            id: 'mda_bio_emp',
            name: 'Pulso Bioelétrico',
            icon: '💥',
            branch: 'Neural',
            desc: 'Acúmulo de bio-estática nas sinapses capaz de ser liberado em arco elétrico.',
            effect: 'Gasta 4 PD para causar 3d10 de dano elétrico em cone frontal de 6 metros.'
          },
          {
            id: 'mda_regen_burst',
            name: 'Regeneração Celular Violenta',
            icon: '🧪',
            branch: 'Primordial',
            desc: 'Células-tronco aberrantes reescrevem lesões internas a custo de estabilidade mental.',
            effect: 'Cura 10 PD instantaneamente uma vez por dia, mas eleva o MDA em +5% no processo.'
          }
        ]
      },
      {
        tier: 4,
        name: 'Nível IV: Dominação da Realidade (Primogênito)',
        reqRange: '76% - 99% MDA',
        minMda: 76,
        maxMda: 99,
        nodes: [
          {
            id: 'mda_rose_field',
            name: 'Campo Ilusório de Rosas',
            icon: '🌹',
            branch: 'Primordial',
            desc: 'A mente do Dominador sobrepõe a realidade local com uma alucinação de rosas rubras.',
            effect: 'Inimigos no raio falham automaticamente em testes de concentração e atacam ilusões.'
          },
          {
            id: 'mda_cryo_aura',
            name: 'Aura Criogênica do Caos',
            icon: '❄️',
            branch: 'Neural',
            desc: 'A temperatura celular cai a zero absoluto, congelando o ar ao redor do corpo.',
            effect: 'Atacantes corpo a corpo sofrem 2d6 de dano de frio e perdem metade do deslocamento.'
          },
          {
            id: 'mda_reality_hack',
            name: 'Hack da Realidade (Reescrita)',
            icon: '🌌',
            branch: 'Primordial',
            desc: 'A habilidade de reescrever a linha de causa e efeito instantaneamente.',
            effect: 'Uma vez por combate, anula completamente um Desempate Letal (Hitkill) que causaria morte.'
          }
        ]
      }
    ];
  }

  init() {
    this.modalEl = document.getElementById('modal-mda-tree');
    this.charSelectEl = document.getElementById('mda-tree-char-select');
    this.gaugeEl = document.getElementById('mda-tree-gauge-text');
    this.tiersContainerEl = document.getElementById('mda-tiers-mount');

    const btnOpen = document.getElementById('btn-open-mda-tree');
    if (btnOpen) {
      btnOpen.addEventListener('click', () => this.openModal());
    }

    if (this.charSelectEl) {
      this.charSelectEl.addEventListener('change', (e) => {
        this.selectedCharId = e.target.value;
        this.render();
        if (window.soundFX) window.soundFX.playTacticalBeep();
      });
    }

    console.log('✓ MDATreeController inicializado com sucesso.');
  }

  openModal() {
    if (!this.modalEl) return;
    this.populateCharactersSelect();
    this.render();
    this.modalEl.classList.add('open');
    if (window.soundFX) window.soundFX.playTacticalBeep();
  }

  closeModal() {
    if (!this.modalEl) return;
    this.modalEl.classList.remove('open');
  }

  populateCharactersSelect() {
    if (!this.charSelectEl) return;
    this.charSelectEl.innerHTML = '';
    const chars = this.dataLoader.getAllCharacters ? this.dataLoader.getAllCharacters() : (this.dataLoader.getCharacters() || []);

    chars.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      const mda = this.uiController ? (this.uiController.mdaState[c.id] || parseInt(c.mda) || 10) : 10;
      opt.textContent = `${c.name} (${mda}% MDA)`;
      if (c.id === this.selectedCharId) opt.selected = true;
      this.charSelectEl.appendChild(opt);
    });
  }

  render() {
    const chars = this.dataLoader.getAllCharacters ? this.dataLoader.getAllCharacters() : (this.dataLoader.getCharacters() || []);
    const char = this.dataLoader.getCharacterById(this.selectedCharId) || chars[0];
    if (!char) return;

    const currentMda = this.uiController?.mdaState[char.id] ?? (parseInt(char.mda) || 15);

    if (this.gaugeEl) {
      this.gaugeEl.textContent = `MDA ATUAL: ${currentMda}% • STATUS: ${this.getMdaStatusLabel(currentMda)}`;
      this.gaugeEl.style.color = currentMda >= 76 ? '#b432ff' : (currentMda >= 51 ? '#ff5e78' : (currentMda >= 26 ? '#ffd700' : '#39ff14'));
    }

    if (!this.tiersContainerEl) return;
    this.tiersContainerEl.innerHTML = '';

    this.tiersData.forEach(tier => {
      const isUnlocked = currentMda >= tier.minMda;
      const tierDiv = document.createElement('div');
      tierDiv.className = `mda-tier-block ${isUnlocked ? 'unlocked' : 'locked'}`;

      let nodesHtml = '';
      tier.nodes.forEach(node => {
        nodesHtml += `
          <div class="mda-node-card ${isUnlocked ? 'active-node' : ''}" title="Clique para detalhes da mutação">
            <div class="mda-node-title">
              <span>${node.icon}</span>
              <span>${node.name}</span>
            </div>
            <div class="mda-node-desc">${node.desc}</div>
            <div class="mda-node-effect">${node.effect}</div>
          </div>
        `;
      });

      tierDiv.innerHTML = `
        <div class="mda-tier-header">
          <div class="mda-tier-name">
            <span>${isUnlocked ? '🔓' : '🔒'}</span>
            <span>${tier.name}</span>
          </div>
          <span class="mda-tier-req" style="color: ${isUnlocked ? '#39ff14' : '#8da4be'};">
            REQUISITO: ${tier.reqRange}
          </span>
        </div>
        <div class="mda-nodes-grid">
          ${nodesHtml}
        </div>
      `;

      this.tiersContainerEl.appendChild(tierDiv);
    });
  }

  getMdaStatusLabel(mda) {
    if (mda >= 90) return 'Dominador da Realidade (Colapso Iminente)';
    if (mda >= 76) return 'Hipertrofia Primordial Suprema';
    if (mda >= 51) return 'Metamorfose Anômala Avançada';
    if (mda >= 26) return 'Instabilidade Celular Quimérica';
    if (mda >= 10) return 'Mutação Celular Latente';
    return 'Humano Estável';
  }
}

window.MDATreeController = MDATreeController;
