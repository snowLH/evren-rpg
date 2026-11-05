# 🌌 Diretrizes de Contexto para Agentes Gemini & Antigravity

> **Projeto:** Evren RPG (Mesa Interativa de RPG & VTT / Compêndio de Lore)  
> **Repositório GitHub:** `https://github.com/snowLH/evren-rpg.git`  
> **Fonte da Verdade no Obsidian:** `C:\Users\user\Documents\Obsidian\cryoProjects\01 - Projetos\EvrenRPG\`

---

## 📖 Fonte Central da Verdade (Obsidian Vault)

Antes de propor ou executar qualquer alteração estrutural, arquitetural ou mecânica neste projeto, você **DEVE consultar** as notas canônicas no cofre do Obsidian:

1. **Master Prompt Executivo:** `00 - MEGA_CONTEXTO.md`
2. **Visão de Produto e Personas:** `01 - Visao_e_Objetivos.md`
3. **Stack e Comandos de Execução:** `02 - Stack_e_Comandos.md`
4. **Arquitetura e Pastas:** `03 - Arquitetura_e_Pastas.md`
5. **Modelagem de Dados e Schemas:** `04 - Banco_e_Modelos.md`
6. **Regras de Negócio e Validações:** `05 - Regras_de_Negocio.md`
7. **Roadmap e Decisões de Arquitetura (ADRs):** `06 - Roadmap_e_Decisoes.md`

---

## ⚠️ Regras Invioláveis de Desenvolvimento

1. **Lore Estritamente Autoral de Evren:**
   - O projeto pertence exclusivamente ao universo ficcional de **EVREN**.
   - É expressamente proibido inserir termos ou mecânicas patenteadas de sistemas externos (como *Ordem Paranormal*, *Tormenta*, *D&D* ou *Call of Cthulhu*).
   - Termos canônicos legítimos: *A.E.G.I.S.*, *LIMIAR*, *Ecos Subterrâneos*, *MDA (Mutagênese Dimensional Anômala)*, *Nova Caronte*, *Mansão Vilar*, *Arquiteto do Caos*.

2. **Arquitetura Zero-Build:**
   - **NÃO adicione** `package.json` com scripts obrigatórios de compilação, Webpack, Vite ou bundlers.
   - O projeto deve sempre funcionar com um duplo clique no `start.bat` (via Python `server.py`) ou abrindo diretamente o `index.html`.
   - Utilize apenas **HTML5 puro, CSS3 modular e JavaScript ES6 nativo**.

3. **Integridade de IDs do DOM (100% Obrigatório):**
   - Qualquer elemento acessado via `document.getElementById('...')` nos scripts JS DEVE existir fisicamente em `index.html`.
   - O comando `python test_integrity.py` DEVE rodar com **100% PASS (335 IDs)**. Jamais renomeie ou remova IDs existentes sem atualizar todos os arquivos relacionados.

4. **Resiliência do DataLoader (Dual-Mode) e Integridade Canônica:**
   - O arquivo `scripts/data-loader.js` carrega dados assincronamente via `fetch('world_data.json')` com fallback automático e imediato para `getEmbeddedFallbackData()`.
   - Se novas campanhas, criaturas ou personagens canônicos forem adicionados, mantenha paridade exata no fallback embutido.
   - Respeite os estados epistêmicos do `canon_ledger` (`confirmed`, `in_world_report`, `disputed`, `open_mystery`, `proposal`, `superseded`). Não resolva artificialmente contradições históricas (e.g. datas da Mansão Vilar 2021/2024 vs 2023/2026; navio de 5.000 passageiros vs centenas; expansões da sigla A.E.G.I.S.).
   - Aplique as mecânicas canônicas: 5 Atributos, 28 perícias canônicas com aliases (`Ciências`/`Ciência`, `Ocultismo`/`Misticismo`), resolução por rolagem única `max((Atributo)d20) + bônus`, e separação métrica: PV (saúde física), PD (esforço/habilidades), SAN (estabilidade mental) e MDA (mutagênese).

5. **Persistência em localStorage e IndexedDB:**
   - Modificações de PV, PE, SAN e status vital das fichas devem persistir na chave `evren_character_stat_overrides`.
   - As coleções `canon_ledger`, `powers`, `folklore_cases` e `glossary` estão registradas no `scripts/museum-storage.js` para mesclagem limpa no IndexedDB.

6. **Interatividade Desobstruída:**
   - Mantenha os 177 países interativos com tooltips e cliques funcionais.
   - Abertura de fichas C.R.I.S. na gaveta lateral deve ser **imediata**, sem forçar mergulhos de câmera desnecessários de 2,5 segundos.

---

## 🧪 Bateria de Comandos de Verificação

Antes de concluir qualquer tarefa ou enviar alterações para o Git, execute:

```bash
# 1. Teste do servidor HTTP e políticas de segurança:
python test_server.py

# 2. Validação de integridade de IDs do DOM (335 IDs) e arquivos CSS/JS:
python test_integrity.py

# 3. Testes unitários do DataLoader, Canon Ledger e Bestiário (Node.js):
node test_data_loader.js

# 4. Verificação de sintaxe dos scripts modificados:
node -c scripts/data-loader.js
node -c scripts/museum-controller.js
node -c scripts/combat-arena.js
node -c scripts/museum-storage.js
node -c scripts/app.js
```
