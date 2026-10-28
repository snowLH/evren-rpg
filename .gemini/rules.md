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
   - Qualquer elemento acessado via `document.getElementById('...')` nos 19 scripts JS DEVE existir fisicamente em `index.html`.
   - O comando `python test_integrity.py` DEVE rodar com **100% PASS (258 IDs)**. Jamais renomeie ou remova IDs existentes sem atualizar todos os arquivos relacionados.

4. **Resiliência do DataLoader (Dual-Mode):**
   - O arquivo `scripts/data-loader.js` carrega dados assincronamente via `fetch('world_data.json')` com fallback automático e imediato para `getEmbeddedFallbackData()`.
   - Se novas campanhas ou personagens canônicos forem adicionados ao `world_data.json`, mantenha paridade no fallback embutido.

5. **Persistência em localStorage:**
   - Modificações de PV, PE, SAN e status vital das fichas devem persistir na chave `evren_character_stat_overrides`.
   - Não quebre os canais de persistência do `BackupManager`.

6. **Interatividade Desobstruída:**
   - Mantenha os 177 países interativos com tooltips e cliques funcionais.
   - Abertura de fichas C.R.I.S. na gaveta lateral deve ser **imediata**, sem forçar mergulhos de câmera desnecessários de 2,5 segundos.

---

## 🧪 Bateria de Comandos de Verificação

Antes de concluir qualquer tarefa ou enviar alterações para o Git, execute:

```bash
# 1. Validação de IDs do DOM e arquivos CSS/JS:
python test_integrity.py

# 2. Testes unitários do DataLoader (Node.js):
node test_data_loader.js

# 3. Verificação de sintaxe dos scripts modificados:
node -c scripts/ui-controller.js
node -c scripts/map-engine.js
```
