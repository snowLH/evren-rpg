/**
 * DIÁRIO DE BORDO & BLOCO DE NOTAS DO INVESTIGADOR
 * Universo: Evren — Mesa Interativa
 * Permite ao Mestre e Jogadores registrar pistas, notas da sessão,
 * histórico de combates e distorções da campanha com persistência local.
 */

class SessionJournal {
  constructor() {
    this.modalEl = null;
    this.notesTextarea = null;
    this.logStreamEl = null;
    this.saveStatusEl = null;
    this.activeTab = 'notes'; // 'notes' | 'log'
    this.logs = [];
    this.storageKey = 'evren_session_notes_v1';
  }

  init() {
    this.modalEl = document.getElementById('modal-session-journal');
    this.notesTextarea = document.getElementById('journal-textarea');
    this.logStreamEl = document.getElementById('journal-log-stream');
    this.saveStatusEl = document.getElementById('journal-save-status');

    const btnOpen = document.getElementById('btn-open-journal');
    const tabNotes = document.getElementById('tab-journal-notes');
    const tabLog = document.getElementById('tab-journal-log');
    const btnExport = document.getElementById('btn-journal-export');
    const btnClear = document.getElementById('btn-journal-clear');

    if (btnOpen) {
      btnOpen.addEventListener('click', () => this.openModal());
    }

    if (tabNotes && tabLog) {
      tabNotes.addEventListener('click', () => this.switchTab('notes'));
      tabLog.addEventListener('click', () => this.switchTab('log'));
    }

    if (this.notesTextarea) {
      this.loadNotes();
      this.notesTextarea.addEventListener('input', () => this.saveNotes());
    }

    if (btnExport) {
      btnExport.addEventListener('click', () => this.exportNotes());
    }

    if (btnClear) {
      btnClear.addEventListener('click', () => this.clearNotes());
    }

    // Inicializa tags rápidas
    document.querySelectorAll('.journal-quick-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.getAttribute('data-tag');
        this.insertTag(tag);
      });
    });

    // Registra entrada inicial
    this.logEvent('🛰️ Terminal do Universo Evren inicializado. Registro de sessão ativo.');

    console.log('✓ SessionJournal inicializado com sucesso.');
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

  switchTab(tab) {
    this.activeTab = tab;
    const tabNotes = document.getElementById('tab-journal-notes');
    const tabLog = document.getElementById('tab-journal-log');
    const wrapNotes = document.getElementById('journal-wrap-notes');
    const wrapLog = document.getElementById('journal-wrap-log');

    if (tab === 'notes') {
      tabNotes?.classList.add('active');
      tabLog?.classList.remove('active');
      if (wrapNotes) wrapNotes.style.display = 'flex';
      if (wrapLog) wrapLog.style.display = 'none';
    } else {
      tabNotes?.classList.remove('active');
      tabLog?.classList.add('active');
      if (wrapNotes) wrapNotes.style.display = 'none';
      if (wrapLog) wrapLog.style.display = 'flex';
      this.renderLogs();
    }
  }

  insertTag(tag) {
    if (!this.notesTextarea) return;
    let snippet = '';
    const now = new Date().toLocaleTimeString();

    switch(tag) {
      case 'PISTA':
        snippet = `\n🔍 [PISTA ENCONTRADA - ${now}]: `;
        break;
      case 'AMEACA':
        snippet = `\n⚠️ [AMEAÇA DETECTADA - ${now}]: `;
        break;
      case 'RELIQUIA':
        snippet = `\n🏺 [RELÍQUIA CATALOGADA - ${now}]: `;
        break;
      case 'MUTACAO':
        snippet = `\n🧬 [SURTO DE MDA - ${now}]: `;
        break;
      case 'HORA':
        snippet = `\n⏱️ [CARIMBO DE SESSÃO: ${new Date().toLocaleString()}]\n`;
        break;
      default:
        snippet = ` [${tag}] `;
    }

    const start = this.notesTextarea.selectionStart;
    const end = this.notesTextarea.selectionEnd;
    const val = this.notesTextarea.value;
    this.notesTextarea.value = val.substring(0, start) + snippet + val.substring(end);
    this.notesTextarea.focus();
    this.notesTextarea.selectionStart = this.notesTextarea.selectionEnd = start + snippet.length;
    this.saveNotes();
  }

  appendNotes(text) {
    if (!this.notesTextarea) return;
    this.notesTextarea.value += text;
    this.saveNotes();
  }

  saveNotes() {
    if (!this.notesTextarea) return;
    try {
      localStorage.setItem(this.storageKey, this.notesTextarea.value);
      if (this.saveStatusEl) {
        this.saveStatusEl.textContent = '✓ Notas Salvas';
        this.saveStatusEl.style.color = '#39ff14';
      }
    } catch (e) {
      console.warn('Erro ao salvar no localStorage:', e);
    }
  }

  loadNotes() {
    if (!this.notesTextarea) return;
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.notesTextarea.value = saved;
      } else {
        this.notesTextarea.value = 
`// DIÁRIO DE BORDO DO INVESTIGADOR — UNIVERSO EVREN
// Sessão Iniciada. Registre aqui deduções, segredos e relatórios.

[REGISTRO INICIAL]: A equipe ingressou no setor da Mansão Vilar.
Lucas Vilar desapareceu nas minas há três anos. 
Gabriel Vilar desenvolveu o protótipo LIMIAR. Cuidado com estática nas frequências de rádio.
`;
      }
    } catch (e) {
      console.warn('Erro ao carregar do localStorage:', e);
    }
  }

  clearNotes() {
    if (!confirm('Deseja realmente limpar as anotações do diário de bordo?')) return;
    if (this.notesTextarea) {
      this.notesTextarea.value = '';
      this.saveNotes();
    }
  }

  exportNotes() {
    const text = this.notesTextarea ? this.notesTextarea.value : '';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diario_sessao_evren_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  logEvent(text) {
    const time = new Date().toLocaleTimeString();
    this.logs.unshift({ time, text });
    if (this.logs.length > 100) this.logs.pop();
    if (this.activeTab === 'log') {
      this.renderLogs();
    }
  }

  renderLogs() {
    if (!this.logStreamEl) return;
    this.logStreamEl.innerHTML = '';
    this.logs.forEach(l => {
      const entry = document.createElement('div');
      entry.className = 'journal-log-entry';
      entry.innerHTML = `
        <span class="journal-log-time">[${l.time}]</span>
        <span class="journal-log-text">${l.text}</span>
      `;
      this.logStreamEl.appendChild(entry);
    });
  }
}

window.SessionJournal = SessionJournal;
