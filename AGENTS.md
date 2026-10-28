# AGENTS.md — Universal AI Agent Guidelines for Evren RPG

This document establishes the operational boundaries, architecture invariants, and verification protocols for any AI coding assistant (Claude Desktop, Cursor, Copilot, Antigravity, Roo Code, Windsurf, etc.) working on the **Evren RPG** codebase.

---

## 1. Source of Truth (Central Knowledge Base)

The canonical documentation ecosystem for this project lives inside the user's Obsidian Central Vault:
- **Base Path:** `C:\Users\user\Documents\Obsidian\cryoProjects\01 - Projetos\EvrenRPG\`
- **Core Reference Documents:**
  - `00 - MEGA_CONTEXTO.md`: The Executive Master Prompt (copy-paste ready).
  - `01 - Visao_e_Objetivos.md`: Product vision, user personas, core UX pillars.
  - `02 - Stack_e_Comandos.md`: Tech stack breakdown, tooling, verification commands.
  - `03 - Arquitetura_e_Pastas.md`: Architectural flow, component responsibilities, folder tree.
  - `04 - Banco_e_Modelos.md`: JSON data schemas, entity relationships, localStorage keys.
  - `05 - Regras_de_Negocio.md`: Canonical rules, C.R.I.S. 28 skills, combat mechanics, invariants.
  - `06 - Roadmap_e_Decisoes.md`: Status, architectural decision records (ADRs), tech debt.

---

## 2. Inviolable System Invariants

### 🚫 Invariant 1: Pure EVREN Lore (No Third-Party IPs)
All narrative content, factions, monsters, relics, and mechanical terms must belong strictly to the **EVREN** universe. Never introduce terms from copyrighted third-party systems (*Ordem Paranormal*, *Tormenta*, *D&D*, *Call of Cthulhu*). Legitimate terms include:
- Organization: `A.E.G.I.S.`
- Technology / Artifact: `Arma de Portais: LIMIAR`, `Armadura Hallucigenia`, `Injetor AEGIS`
- Phenomena: `MDA (Mutagênese Dimensional Anômala)`, `Ecos Subterrâneos`, `Fenda Dimensional`
- Sagas & Locations: `Mansão Vilar`, `Nova Caronte`, `Estação Criogênica Zero`, `Arquiteto do Caos / Diabo do Mar`

### 🚫 Invariant 2: Zero-Build Architecture
- **Do not introduce build tools:** No Webpack, Vite, Parcel, Rollup, or Babel.
- **Do not introduce runtime dependencies:** Do not add a runtime `package.json` that requires `npm install` for the application to function.
- The system must run by double-clicking `start.bat` (Python `server.py`) or opening `index.html` directly in any modern browser.

### 🚫 Invariant 3: Strict DOM ID Integrity (100% PASS Required)
- Every single element accessed via `document.getElementById('...')` across all 19 JavaScript files in `scripts/` MUST exist in `index.html`.
- You MUST run `python test_integrity.py` and ensure `100% PASS (258 HTML IDs)` after modifying any HTML or JS file.

### 🚫 Invariant 4: Dual Data Mode in DataLoader
- `scripts/data-loader.js` fetches `world_data.json` asynchronously, but provides `getEmbeddedFallbackData()` to handle `file:///` executions where CORS blocks local `fetch()`. Keep the fallback data in sync with any core schema additions.

### 🚫 Invariant 5: LocalStorage Persistence Integrity
- Live character sheet adjustments (PV, PE, SAN, life status) are persisted in `localStorage['evren_character_stat_overrides']`. Do not alter or break this storage contract.

---

## 3. Mandatory Verification Checklist

Before reporting completion or committing changes, execute the following commands:

```bash
# 1. Structural DOM and Asset Integrity Test (Python 3):
python test_integrity.py

# 2. DataLoader & Logic Unit Tests (Node.js):
node test_data_loader.js

# 3. JavaScript Syntax Verification:
node -c scripts/ui-controller.js
node -c scripts/map-engine.js
node -c scripts/data-loader.js
node -c scripts/app.js
```

Ensure all exit codes are `0` and all assertions pass.
