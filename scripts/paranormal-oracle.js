/**
 * ORÁCULO DE ANOMALIAS & DISTORÇÕES DA REALIDADE
 * Universo: Evren — Mesa Interativa
 * Gera eventos paranormais e distorções aleatórias para o Mestre
 * com descrições narrativas, impactos mecânicos e efeitos sonoros.
 */

class ParanormalOracle {
  constructor(dataLoader, uiController) {
    this.dataLoader = dataLoader;
    this.uiController = uiController;

    this.anomalies = [
      {
        id: 'anom_01',
        title: 'Fissura Dimensional do LIMIAR',
        category: 'Distorção Espaço-Temporal',
        severity: 'critica',
        quote: '"O ar estalou como vidro fino se partindo, revelando uma sala vazia a trezentos metros abaixo da terra..."',
        mechanicTest: 'Teste de Agilidade DT 15',
        mechanicEffect: 'Falha: teletransportado forçadamente 6 metros em direção aleatória e perde 3 PD.',
        gmAdvice: 'Use para separar combatentes ou criar um atalho súbito através de uma parede reforçada.'
      },
      {
        id: 'anom_02',
        title: 'Surto de Hiper-Mutação Celular',
        category: 'Ruptura Biológica',
        severity: 'moderada',
        quote: '"As veias sob a pele brilharam em tom carmesim pulsante; os ossos do antebraço rangeram se alongando."',
        mechanicTest: 'Teste de Vigor DT 14',
        mechanicEffect: 'Todos os presentes no raio recebem +5% de MDA temporário. Sucesso concede +2 em Força por 2 rodadas.',
        gmAdvice: 'Desperta a fome e a instabilidade biológica nos personagens com MDA acima de 40%.'
      },
      {
        id: 'anom_03',
        title: 'Onda Criogênica do Arquiteto',
        category: 'Horror Psicológico',
        severity: 'catastrofica',
        quote: '"A temperatura despencou quarenta graus em um piscar de olhos. A geada azul cobriu os cílios dos presentes."',
        mechanicTest: 'Teste de Presença DT 18',
        mechanicEffect: 'Perde 4 PD por choque térmico mental. Ilusão de um campo infinito de rosas vermelhas florescendo no gelo.',
        gmAdvice: 'Sinaliza a aproximação ou a influência psíquica direta do Arquiteto do Caos.'
      },
      {
        id: 'anom_04',
        title: 'Ecos Quirópteros das Minas',
        category: 'Manifestação Sonora',
        severity: 'baixa',
        quote: '"Vozes sussurradas de familiares distantes ecoaram nos dutos de ventilação, repetindo segredos esquecidos."',
        mechanicTest: 'Teste de Intelecto DT 13',
        mechanicEffect: 'Falha: condição Assustado (desvantagem em testes de Percepção e Iniciativa por 1 rodada).',
        gmAdvice: 'Indica que há Ecos Subterrâneos à espreita, atraídos pelo som de disparos ou passos pesados.'
      },
      {
        id: 'anom_05',
        title: 'Pulso Eletromagnético Abissal',
        category: 'Interferência Tecnológica',
        severity: 'moderada',
        quote: '"Lâmpadas explodiram em fagulhas verdes; lanternas e comunicadores passaram a emitir apenas estática ensurdecedora."',
        mechanicTest: 'Teste de Tecnologia DT 15',
        mechanicEffect: 'Dispositivos eletrônicos e armas de choque desligam por 1d4 rodadas. Lanternas piscam.',
        gmAdvice: 'Muda a iluminação para escuridão total, forçando uso de tochas ou percepção às cegas.'
      },
      {
        id: 'anom_06',
        title: 'Campo Gravitacional Nulo',
        category: 'Anomalia Física',
        severity: 'moderada',
        quote: '"Poeira, cartuchos de munição e os próprios combatentes começaram a flutuar a dois palmos do piso."',
        mechanicTest: 'Teste de Agilidade DT 16',
        mechanicEffect: 'Deslocamento reduzido à metade a menos que o combatente se empurre contra paredes ou superfícies.',
        gmAdvice: 'Excelente para duelos aéreos ou manobras táticas tridimensionais.'
      },
      {
        id: 'anom_07',
        title: 'Emanação de Biomassa Sulfurosa',
        category: 'Contaminação Ambiental',
        severity: 'baixa',
        quote: '"Um miasma espesso com odor de salmoura e peixe podre inundou a câmara, corroendo o tecido dos uniformes."',
        mechanicTest: 'Teste de Vigor DT 12',
        mechanicEffect: 'Falha: náusea severa (-2 em testes de ataque físico na próxima rodada).',
        gmAdvice: 'Comum nas bordas de Nova Caronte e próximas à carcaça de aberrações abissais.'
      },
      {
        id: 'anom_08',
        title: 'Voz da Relíquia: Ressonância da Patitre',
        category: 'Eco Ocultista',
        severity: 'critica',
        quote: '"A lança cravada na pedra vibrou numa frequência que fez os dentes de todos os combatentes doerem."',
        mechanicTest: 'Teste de Presença DT 16',
        mechanicEffect: 'Conjuradores recuperam 3 PD, mas personagens puramente humanos sofrem 2 pontos de estresse mental.',
        gmAdvice: 'Atrai entidades que se alimentam de ressonância anômala.'
      },
      {
        id: 'anom_09',
        title: 'Sangramento da Realidade (Micro-Overload)',
        category: 'Colapso de Malha',
        severity: 'catastrofica',
        quote: '"As cores da sala inverteram; o sangue no chão começou a escorrer para cima em gotas lentas."',
        mechanicTest: 'Teste de Vigor DT 17',
        mechanicEffect: 'Sacrifício de Armadura ativado involuntariamente ou perda direta de 5 PD.',
        gmAdvice: 'Ponto culminante de uma batalha. A realidade ameaça entrar em colapso se o combate não for resolvido.'
      },
      {
        id: 'anom_10',
        title: 'Mimetismo Espelhado',
        category: 'Engano Biológico',
        severity: 'critica',
        quote: '"A sombra do combatente na parede não repetiu seus movimentos — em vez disso, sorriu e apontou para trás."',
        mechanicTest: 'Teste de Intelecto DT 15',
        mechanicEffect: 'Um Mímico Genético ganha uma ação bônus de emboscada ou o combatente ataca um aliado por engano.',
        gmAdvice: 'Gera paranoia imediata entre os jogadores.'
      }
    ];

    this.currentAnomaly = null;
    this.modalEl = null;
    this.displayEl = null;
  }

  init() {
    this.modalEl = document.getElementById('modal-paranormal-oracle');
    this.displayEl = document.getElementById('oracle-mount');

    const btnOpen = document.getElementById('btn-open-oracle');
    const btnRoll = document.getElementById('btn-oracle-roll');
    const btnInject = document.getElementById('btn-oracle-inject');

    if (btnOpen) {
      btnOpen.addEventListener('click', () => this.openModal());
    }

    if (btnRoll) {
      btnRoll.addEventListener('click', () => this.rollAnomaly());
    }

    if (btnInject) {
      btnInject.addEventListener('click', () => this.injectIntoJournal());
    }

    // Gera uma inicial
    this.currentAnomaly = this.anomalies[0];
    this.render();

    console.log('✓ ParanormalOracle inicializado com sucesso.');
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

  rollAnomaly() {
    const d100 = Math.floor(Math.random() * 100) + 1;
    const index = Math.floor(Math.random() * this.anomalies.length);
    this.currentAnomaly = { ...this.anomalies[index], roll: d100 };

    if (window.soundFX) {
      window.soundFX.playDiceRoll();
      setTimeout(() => window.soundFX.playWhisperSound(), 350);
    }

    this.render();
  }

  injectIntoJournal() {
    if (!this.currentAnomaly || !window.sessionJournal) return;
    const anom = this.currentAnomaly;
    const logText = `🔮 [ORÁCULO] Anomalia Revelada: ${anom.title} (Severidade: ${anom.severity.toUpperCase()}). Efeito: ${anom.mechanicEffect}`;
    window.sessionJournal.logEvent(logText);
    window.sessionJournal.appendNotes(`\n[EVENTO ANÔMALO: ${anom.title}]\n- Severidade: ${anom.severity.toUpperCase()}\n- Citação: ${anom.quote}\n- Desafio: ${anom.mechanicTest}\n- Efeito: ${anom.mechanicEffect}\n`);

    const btn = document.getElementById('btn-oracle-inject');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = '✓ Injetado no Diário!';
      setTimeout(() => btn.textContent = orig, 1800);
    }
  }

  render() {
    if (!this.displayEl || !this.currentAnomaly) return;
    const a = this.currentAnomaly;
    const rollDisplay = a.roll ? `d100: [${a.roll}]` : 'd100: [68]';

    this.displayEl.innerHTML = `
      <div class="oracle-card-display">
        <div class="oracle-anomaly-badge-row">
          <span class="oracle-severity-badge sev-${a.severity}">
            ● SEVERIDADE ${a.severity.toUpperCase()}
          </span>
          <span class="oracle-d100-roll">${rollDisplay} • ${a.category}</span>
        </div>

        <h3 class="oracle-title">${a.title}</h3>
        <p class="oracle-narrative-quote">${a.quote}</p>

        <div class="oracle-mechanics-grid">
          <div class="oracle-mechanic-box">
            <span class="oracle-mech-label">Desafio / Resistência</span>
            <span class="oracle-mech-value">${a.mechanicTest}</span>
          </div>
          <div class="oracle-mechanic-box">
            <span class="oracle-mech-label">Impacto Imediato</span>
            <span class="oracle-mech-value">${a.mechanicEffect}</span>
          </div>
        </div>

        <div style="margin-top: 14px; font-size: 0.8rem; color: #8da4be;">
          <strong style="color: #ffd700;">Conselho ao Mestre:</strong> ${a.gmAdvice}
        </div>
      </div>
    `;
  }
}

window.ParanormalOracle = ParanormalOracle;
