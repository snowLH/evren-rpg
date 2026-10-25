/**
 * COMBAT ARENA MODULE — CONFLITO DIRETO & DESEMPATE LETAL
 * Universo: Evren — Mesa Interativa
 * Simula o sistema de combate sem CA passiva, com disputas diretas (Acerto vs Esquiva/Bloqueio),
 * sacrifício de armadura e hitkills por desempate letal.
 */

class CombatArena {
  constructor(dataLoader, uiController) {
    this.dataLoader = dataLoader;
    this.uiController = uiController;

    this.attackerId = 'char_gabriel';
    this.defenderId = 'creature_eco';

    this.attackerStance = 'attack_agilidade'; // attack_forca | attack_agilidade | relic_strike
    this.defenderStance = 'defense_esquiva';  // defense_esquiva | defense_bloqueio | counter_attack
    this.sacrificeArmor = false;

    this.combatLog = [];
    this.isRolling = false;
  }

  init() {
    this.setupEventListeners();
    console.log('✓ CombatArena inicializada com sucesso.');
  }

  setupEventListeners() {
    // Botão no HUD para abrir a Arena
    const btnCombat = document.getElementById('btn-open-combat');
    if (btnCombat) {
      btnCombat.addEventListener('click', () => {
        this.openArenaModal();
      });
    }

    // Tecla de atalho [K] para combate
    window.addEventListener('keydown', (e) => {
      if ((e.key === 'k' || e.key === 'K') && !e.target.matches('input, textarea, select')) {
        this.openArenaModal();
      }
    });
  }

  openArenaWithAttacker(attackerId) {
    this.attackerId = attackerId;
    this.openArenaModal();
  }

  openArenaWithDefender(defenderId) {
    this.defenderId = defenderId;
    this.openArenaModal();
  }

  openArenaWithFighters(attackerId, defenderId) {
    this.attackerId = attackerId;
    this.defenderId = defenderId;
    this.openArenaModal();
  }

  openArenaModal() {
    const modal = document.getElementById('modal-combat-arena');
    if (!modal) return;

    this.renderArenaInterface();
    modal.classList.add('open', 'active');
    if (window.soundFX) window.soundFX.playTacticalBeep();
  }

  closeArenaModal() {
    const modal = document.getElementById('modal-combat-arena');
    if (modal) modal.classList.remove('open', 'active');
  }

  /**
   * Obtém a lista combinada de combatentes (Personagens + Criaturas do Bestiário)
   */
  getAllFighters() {
    const chars = this.dataLoader.getCharacters().map(c => ({
      id: c.id,
      name: c.name,
      type: 'personagem',
      badge: c.class || 'Personagem',
      has_armor: c.relics?.some(r => r.includes('Armadura')) || c.id === 'char_rafael' || c.id === 'char_gabriel'
    }));

    const creatures = this.dataLoader.getBestiary().map(cr => ({
      id: cr.id,
      name: cr.name,
      type: 'criatura',
      badge: cr.threat_level?.split(' ')[0] || 'Criatura',
      has_armor: cr.id === 'creature_kraken'
    }));

    return [...chars, ...creatures];
  }

  getFighterById(id) {
    const fighters = this.getAllFighters();
    return fighters.find(f => f.id === id) || fighters[0];
  }

  renderArenaInterface() {
    const container = document.getElementById('combat-arena-mount');
    if (!container) return;

    const fighters = this.getAllFighters();
    const attacker = this.getFighterById(this.attackerId);
    const defender = this.getFighterById(this.defenderId);

    container.innerHTML = `
      <div class="combat-arena-wrapper">
        <!-- Seleção e Posturas dos Combatentes -->
        <div class="combat-arena-fighters">
          <!-- Combatente 1: Atacante -->
          <div class="fighter-card attacker-card">
            <div class="fighter-card-title">
              <span>⚔️ ATACANTE (INICIATIVA)</span>
              <span class="badge-tag danger">${attacker.badge}</span>
            </div>

            <select id="arena-select-attacker" class="fighter-select" onchange="window.app.combatArena.changeAttacker(this.value)">
              ${fighters.map(f => `
                <option value="${f.id}" ${f.id === this.attackerId ? 'selected' : ''}>
                  ${f.name} [${f.type.toUpperCase()}]
                </option>
              `).join('')}
            </select>

            <div style="font-size: 10px; color: #a8d5e8; font-family: monospace;">POSTURA DE ATAQUE:</div>
            <div class="fighter-stances-row">
              <button class="stance-btn stance-blood ${this.attackerStance === 'attack_forca' ? 'active' : ''}" 
                onclick="window.app.combatArena.setAttackerStance('attack_forca')">
                💪 Golpe Poderoso (Força)
              </button>
              <button class="stance-btn stance-blood ${this.attackerStance === 'attack_agilidade' ? 'active' : ''}" 
                onclick="window.app.combatArena.setAttackerStance('attack_agilidade')">
                ⚡ Ataque Ágil (Agilidade)
              </button>
              <button class="stance-btn stance-blood ${this.attackerStance === 'relic_strike' ? 'active' : ''}" 
                onclick="window.app.combatArena.setAttackerStance('relic_strike')">
                🏺 Disparo de Relíquia
              </button>
            </div>
          </div>

          <!-- Divisor VS Central -->
          <div class="combat-vs-divider">
            <div class="vs-badge">VS</div>
            <span style="font-family: monospace; font-size: 9px; color: #ffd700;">CONFLITO DIRETO</span>
          </div>

          <!-- Combatente 2: Defensor -->
          <div class="fighter-card defender-card">
            <div class="fighter-card-title">
              <span>🛡️ DEFENSOR (REAÇÃO)</span>
              <span class="badge-tag status">${defender.badge}</span>
            </div>

            <select id="arena-select-defender" class="fighter-select" onchange="window.app.combatArena.changeDefender(this.value)">
              ${fighters.map(f => `
                <option value="${f.id}" ${f.id === this.defenderId ? 'selected' : ''}>
                  ${f.name} [${f.type.toUpperCase()}]
                </option>
              `).join('')}
            </select>

            <div style="font-size: 10px; color: #a8d5e8; font-family: monospace;">REAÇÃO DEFENSIVA:</div>
            <div class="fighter-stances-row">
              <button class="stance-btn ${this.defenderStance === 'defense_esquiva' ? 'active' : ''}" 
                onclick="window.app.combatArena.setDefenderStance('defense_esquiva')">
                💨 Esquiva Reflexa (Agilidade)
              </button>
              <button class="stance-btn ${this.defenderStance === 'defense_bloqueio' ? 'active' : ''}" 
                onclick="window.app.combatArena.setDefenderStance('defense_bloqueio')">
                🛡️ Bloqueio Resistente (Vigor)
              </button>
              <button class="stance-btn ${this.defenderStance === 'counter_attack' ? 'active' : ''}" 
                onclick="window.app.combatArena.setDefenderStance('counter_attack')">
                ⚔️ Contra-Ataque Desesperado
              </button>
            </div>

            <!-- Opção de Sacrifício de Armadura -->
            <label style="display: flex; align-items: center; gap: 8px; font-family: monospace; font-size: 10px; color: #ffd700; cursor: pointer; margin-top: 4px;">
              <input type="checkbox" id="arena-sacrifice-armor-chk" ${this.sacrificeArmor ? 'checked' : ''} 
                onchange="window.app.combatArena.setSacrificeArmor(this.checked)">
              <span>🛡️ Sacrifício de Armadura (Anula Dano Letal)</span>
            </label>
          </div>
        </div>

        <!-- Área de Dados 3D de Duelo -->
        <div class="combat-dice-clash-zone">
          <div class="dice-clash-fighter">
            <span style="font-family: 'Cinzel', serif; font-size: 11px; color: #ff6b6b;">DADO DO ATACANTE</span>
            <div class="duel-d20-box attacker-d20" id="arena-d20-attacker">--</div>
            <span id="arena-mod-attacker" style="font-family: monospace; font-size: 10px; color: #728a9c;">Bônus: +3</span>
          </div>

          <div class="dice-clash-fighter">
            <span style="font-family: 'Cinzel', serif; font-size: 11px; color: #00e5ff;">DADO DO DEFENSOR</span>
            <div class="duel-d20-box" id="arena-d20-defender">--</div>
            <span id="arena-mod-defender" style="font-family: monospace; font-size: 10px; color: #728a9c;">Bônus: +2</span>
          </div>
        </div>

        <!-- Botão de Ação Primária -->
        <button class="btn-trigger-duel" id="btn-resolve-duel" onclick="window.app.combatArena.resolveDuelClash()">
          ⚔️ ROLAR CONFLITO DIRETO & DESEMPATE LETAL [ESPAÇO]
        </button>

        <!-- Banner de Resultado & Histórico -->
        <div class="duel-result-banner" id="arena-result-banner">
          Selecione os combatentes e clique para iniciar o Conflito Direto. Sem CA passiva: o combate é decidido no choque das rolagens!
        </div>
      </div>
    `;
  }

  changeAttacker(id) {
    this.attackerId = id;
    this.renderArenaInterface();
  }

  changeDefender(id) {
    this.defenderId = id;
    this.renderArenaInterface();
  }

  setAttackerStance(stance) {
    this.attackerStance = stance;
    this.renderArenaInterface();
  }

  setDefenderStance(stance) {
    this.defenderStance = stance;
    this.renderArenaInterface();
  }

  setSacrificeArmor(checked) {
    this.sacrificeArmor = checked;
  }

  /**
   * Executa a rolagem simultânea de dados e resolve a mecânica de combate
   */
  async resolveDuelClash() {
    if (this.isRolling) return;
    this.isRolling = true;

    const attackerBox = document.getElementById('arena-d20-attacker');
    const defenderBox = document.getElementById('arena-d20-defender');
    const banner = document.getElementById('arena-result-banner');
    const btn = document.getElementById('btn-resolve-duel');

    if (btn) btn.disabled = true;
    if (banner) {
      banner.className = 'duel-result-banner';
      banner.innerHTML = '⚡ <em>CHOCANDO DADOS EM CONFLITO DIRETO...</em>';
    }

    if (attackerBox) attackerBox.classList.add('rolling-clash');
    if (defenderBox) defenderBox.classList.add('rolling-clash');

    // Som de rolagem
    if (window.soundFX) window.soundFX.playDiceRoll();

    // Rola durante 900ms
    const startTime = Date.now();
    await new Promise(resolve => {
      const interval = setInterval(() => {
        if (attackerBox) attackerBox.textContent = Math.floor(Math.random() * 20) + 1;
        if (defenderBox) defenderBox.textContent = Math.floor(Math.random() * 20) + 1;

        if (Date.now() - startTime > 900) {
          clearInterval(interval);
          resolve();
        }
      }, 70);
    });

    if (attackerBox) attackerBox.classList.remove('rolling-clash');
    if (defenderBox) defenderBox.classList.remove('rolling-clash');

    // Resultados Finais
    const d20Atk = Math.floor(Math.random() * 20) + 1;
    const d20Def = Math.floor(Math.random() * 20) + 1;

    // Modificadores baseados na postura
    const modAtk = this.attackerStance === 'attack_forca' ? 4 : (this.attackerStance === 'attack_agilidade' ? 3 : 5);
    const modDef = this.defenderStance === 'defense_esquiva' ? 3 : (this.defenderStance === 'defense_bloqueio' ? 4 : 2);

    const totalAtk = d20Atk + modAtk;
    const totalDef = d20Def + modDef;

    if (attackerBox) attackerBox.textContent = d20Atk;
    if (defenderBox) defenderBox.textContent = d20Def;

    const attacker = this.getFighterById(this.attackerId);
    const defender = this.getFighterById(this.defenderId);

    const diff = totalAtk - totalDef;
    let resultText = '';

    if (d20Atk === 20 || diff >= 10) {
      // HITKILL // DESEMPATE LETAL CRÍTICO
      if (this.sacrificeArmor) {
        resultText = `
          <strong style="color: #ffd700; font-size: 14px;">🛡️ SACRIFÍCIO DE ARMADURA REALIZADO!</strong><br>
          O ataque de ${attacker.name} [Total ${totalAtk}] foi devastador, mas ${defender.name} sacrificou sua couraça!<br>
          <span style="color:#00e5ff;">A armadura quebrou em pedaços e anulou 100% do dano mortal!</span>
        `;
        if (window.soundFX) window.soundFX.playArmorSacrifice();
      } else {
        resultText = `
          <strong style="color: #ff4d4d; font-size: 15px;">💀 DESEMPATE LETAL // HITKILL CONFIRMADO!</strong><br>
          ${attacker.name} superou ${defender.name} com margem crítica de ${diff} pontos (D20 Natural: ${d20Atk})!<br>
          <span style="color:#fff;">O golpe perfurou órgãos vitais, causando colapso imediato no alvo!</span>
        `;
        banner?.classList.add('hitkill-active');
        if (window.soundFX) window.soundFX.playOverloadStrobe();

        // Flash de sangue na tela
        const flash = document.getElementById('static-flash');
        if (flash) {
          flash.classList.add('flash');
          setTimeout(() => flash.classList.remove('flash'), 350);
        }
      }
    } else if (diff > 0) {
      // ACERTO NORMAL
      const damage = Math.floor(Math.random() * 8) + 4 + Math.round(diff / 2);
      resultText = `
        <strong style="color: #ff6b6b;">⚔️ GOLPE CONECTADO!</strong><br>
        ${attacker.name} venceu a disputa [${totalAtk} vs ${totalDef}].<br>
        Dano infligido: <strong>-${damage} PD</strong> na integridade de ${defender.name}.
      `;
      if (window.soundFX) window.soundFX.playArmorSacrifice();
    } else if (diff < 0) {
      // DEFENSOR VENCEU
      if (this.defenderStance === 'defense_esquiva') {
        resultText = `
          <strong style="color: #00e5ff;">💨 ESQUIVA PERFEITA!</strong><br>
          ${defender.name} previu o golpe [${totalDef} vs ${totalAtk}] e deslizou pelas sombras!<br>
          <em>${defender.name} ganha Vantagem Tática (+2 no próximo ataque).</em>
        `;
      } else {
        resultText = `
          <strong style="color: #39ff14;">🛡️ BLOQUEIO DE FERRO!</strong><br>
          ${defender.name} absorveu o impacto nos escudos/músculos [${totalDef} vs ${totalAtk}]. Dano nulo!
        `;
      }
      if (window.soundFX) window.soundFX.playTacticalBeep();
    } else {
      // EMPATE EXATO -> DESEMPATE LETAL IMEDIATO!
      resultText = `
        <strong style="color: #ffd700; font-size: 14px;">⚡ EMPATE EXATO EM CONFLITO DIRETO [${totalAtk} x ${totalDef}]!</strong><br>
        Sem recuo! A regra de Desempate Letal entra em vigor imediato. Golpe simultâneo de sobrevivência!
      `;
      if (window.soundFX) window.soundFX.playRadarPing();
    }

    if (banner) banner.innerHTML = resultText;
    if (btn) btn.disabled = false;
    this.isRolling = false;
  }
}

window.CombatArena = CombatArena;
