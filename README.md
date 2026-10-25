# 🎲 Mesa Interativa de RPG — Universo EVREN

> **VTT Tático e Códice de Lore Interativo** ambientado no universo de *Evren* (biopunk, horror cósmico, anomalias dimensionais e thriller psicológico).

---

## ⚡ Como Executar Instantaneamente (Windows)

### Opção 1: Execução com 1 Clique (Recomendado)
Dê um duplo clique no arquivo:
```cmd
start.bat
```
O script iniciará o servidor local otimizado (`server.py`) e abrirá automaticamente seu navegador padrão em `http://localhost:8000`.

### Opção 2: Linha de Comando (Python)
No diretório do projeto, execute:
```bash
python server.py
```

### Opção 3: Modo Offline / Sem Python
Abra diretamente o arquivo `index.html` em qualquer navegador moderno. O sistema possui fallback de dados integrado para funcionar perfeitamente mesmo sem servidor local.

---

## 📁 Estrutura do Projeto

```
mesa-rpg-interativa/
├── world_data.json         # Base canônica com campanhas, locais, personagens, crônicas e regras
├── index.html              # Interface principal (HUD, mapa Leaflet, gaveta retrátil, modais)
├── server.py               # Servidor HTTP local com suporte a CORS, MIME types e auto-open
├── start.bat               # Inicializador rápido para Windows com detecção automática
├── README.md               # Documentação técnica e de regras
├── styles/
│   ├── main.css            # Estética Biopunk/Dark Fantasy, HUD tático, modais e layout
│   ├── map.css             # Estilização Leaflet, marcadores SVG com radar e sigilos glitch
│   ├── drawer.css          # Gaveta retrátil, sistema de abas e cards de crônicas
│   ├── sheets.css          # Fichas biopunk, barra de MDA, medidor de PD, rolagens e combate
│   ├── glitch.css          # Scanlines CRT, vinhetas, flicker e efeitos sonoro-visuais ZZZZT
│   └── leaflet.css         # Folha de estilos local da biblioteca Leaflet
└── scripts/
    ├── data-loader.js      # Carregamento assíncrono do world_data.json com tolerância a falhas
    ├── map-engine.js       # Motor do mapa Leaflet (L.CRS.Simple 2000x2000) e fenda dimensional
    ├── ui-controller.js    # Gerenciador da interface, fichas, mecânicas e sintetizador de áudio
    ├── app.js              # Ponto de entrada e orquestrador de atalhos de teclado
    └── leaflet.js          # Biblioteca local Leaflet 1.9.4 embutida
```

---

## 🎮 Funcionalidades Principais

### 1. Mapa Múndi Geográfico Real (177 Países, México & Triângulo das Bermudas)
- **Todos os Países do Mundo:** Base vetorial canônica contendo todas as nações do planeta (Brasil, México, EUA, Europa, etc.), com estilização *Dark Fantasy* e tooltips táticas interativas em cada país.
- **Mansão Vilar no México:** Localizada na serra histórica de mineração do México (`[21.85°N, -102.25°W]`), com contorno de alerta biohazard esmeralda e mergulho direto sobre o país.
- **O Verdadeiro Triângulo das Bermudas:** Polígono geográfico real traçado no Oceano Atlântico entre Miami (Flórida), Bermudas e San Juan (Porto Rico) em `[25.5°N, -71.5°W]`.
- **Fenda Dimensional Interplanar:** Linha de perturbação dimensional conectando as anomalias do México e do Atlântico.
- **Câmera Dinâmica (`flyTo` & Mergulho nas Nuvens):** Transição cinematográfica de alta velocidade mergulhando no país ou oceano selecionado.

### 2. Dossiê de Personagens & Fichas Biopunk
- **Medidor de MDA (Bio-Mutação):**
  - Variação dinâmica de cores e listras biohazard de acordo com o nível de mutação (ex: 15% para tecnologia oculta controlada de Gabriel Vilar, 99% para o estado *Dominador Supremo* do Diabo do Mar, e mutação caótica para Lucas Vilar).
- **Rastreador Interativo de Pontos de Determinação (PD):**
  - Botões para ajustar PD em tempo real (+/- 1, +/- 5).
  - **Surto de Loucura (PD 0 Overload):** Ao zerar a determinação, o sistema dispara um alarme audiovisual de choque mental, com estática na tela e alerta tático de penalidade (-2d20 em testes de Presença).
- **Rolador de Dados Integrado (Pool de d20):**
  - 5 Atributos canônicos: *Força, Vigor, Agilidade, Presença e Intelecto*.
  - Clique em qualquer atributo para rolar a pool respectiva, calcular o maior valor e destacar críticos (resultado 20).
- **Relíquias Funcionais:**
  - *Arma de Portais: LIMIAR* de Gabriel Vilar com botão interativo para simular dobras espaciais entre o mapa e a anomalia.
- **Mecânicas Especiais de Combate (Terminal Tático In-Game):**
  - *Sacrifício de Armadura:* Ativação do protocolo de destruição de proteção para anulação de dano mortal com alerta de RD = 0.
  - *Desempate Letal:* Resolução instantânea com animação visual de clash d20 vs d20 em modal estilizado sem bloqueio por alerts nativos.

### 3. Registro de Crônicas & Códice Global
- Visualização completa dos eventos:
  - *A Noite da Confissão* (Mansão Vilar)
  - *A Incursão do Navio de 5.000 Almas* (Nova Caronte)
- Botão "Localizar no Mapa" em cada crônica para focar instantaneamente no ponto geográfico.
- Códice Global pesquisável com resumo de campanhas, locais e personagens, com sincronização automática do filtro de campanhas.
- **Busca Global com Dropdown Tático:** Pesquisa categorizada por Locais, Personagens e Crônicas, permitindo navegação direta para múltiplos resultados com 1 clique.

### 4. Áudio Procedural Sem Dependências (Web Audio API)
- Efeitos sonoros gerados puramente via código:
  - *Bip Tático* de seleção
  - *Ping de Radar* para marcadores
  - *Estática Glitch (ZZZZT)* em perturbações paranormais
  - *Dobra Dimensional* do LIMIAR
  - *Alarme de Sobrecarga Psíquica* no esgotamento de PD
- Botão no HUD para ligar/desligar áudio (`🔊 SOM [ON/OFF]`).

### 5. Navegação Multi-Escalas & O "Mergulho nas Nuvens"
- **Visão Global (Mapa Múndi Dark Fantasy):**
  - O estado inicial da mesa exibe o mapa mundi com 177 países, rosa dos ventos ornamental, linhas batimétricas e a *Fenda Dimensional* central.
  - Exibe **Grandes Marcadores de Campanhas** (*O Triângulo das Bermudas* e *Mansão Vilar: Até o Amanhecer*) com auras pulsantes e indicador de perigo.
- **Túnel Hipersônico & Mergulho nas Nuvens (`mergulhoNasNuvens(rpgId)`):**
  - Zoom in acelerado em direção ao portal da campanha selecionada.
  - Túnel estelar/velocidade hipersônica de nuvens renderizado em Canvas 2D (`cloud-warp.js`), simulando queda em alta velocidade através da tempestade.
  - **Telemetria Dinâmica em Tempo Real:** Contador ao vivo de decrescimento de altitude (`12.000m ➔ 350m`) e índice de mutagênese radioativa paranormal (`RAD/MUTAGÊNESE: 0.1 mSv/h ➔ 94.2 mSv/h`).
  - As nuvens se dissipam em expansão radial, revelando os marcadores táticos locais (*Nova Caronte*, *Fosso do Kraken*, *Casarão*, *Minas dos Ecos*).
- **Botão de Retorno ao Mundo (`retornarAoMapaMundi()`):**
  - Botão flutuante estilizado `🧭 Retornar ao Mapa Múndi [ESC]` aparece automaticamente na visão local.
  - Animação reversa de subida gravitacional com telemetria ascendente restaurando a visão global dos países.

### 6. Motores Visuais Avançados & Efeitos de Imersão (Canvas & Web Audio)
- **Motor Atmosférico Contextual (`scripts/particles.js`):**
  - *Mapa Múndi Global:* Esporos cósmicos bioluminescentes flutuando suavemente e arcos de relâmpagos elétricos dimensionais disparados entre o México e o Triângulo das Bermudas.
  - *Mansão Vilar (México):* Tempestade com chuva contínua diagonal e relâmpagos atmosféricos ocasionais com estrondo sônico.
  - *Triângulo das Bermudas:* Vórtice oceânico rotativo em espiral, anéis magnéticos pulsantes e plâncton abissal brilhante.
- **Radar & Sonar Holográfico AEGIS (`scripts/radar-widget.js`):**
  - Sonar CRT no canto inferior esquerdo com feixe rotativo de 360°, círculos de alcance e detecção de anomalias em tempo real (*Triângulo Ômega, Kraken, Mansão Vilar, Ecos*).
  - Pings sonoros quando o feixe cruza os sinais e clique interativo para mergulho direto.
- **Tubo de Ensaio Bio-Vial de MDA (%):**
  - Fichas de personagem agora possuem um bio-vial animado com fluidos coloridos (ciano para humano, esmeralda para mutante e roxo-abissal fervente para Dominador Supremo 99%), com bolhas ascendentes e brilho especular.
- **Fratura Psíquica de Tela Cheia (PD 0 Overload):**
  - Ao atingir 0 PD, os cantos da tela são consumidos por uma vinheta de veias de sangue e fratura mental pulsante com áudio de batimentos cardíacos (lub-dub) contínuos até o PD ser restaurado.
- **Rolador de Dados 3D d20 Clash:**
  - Choque de dados d20 em modal estéreo com rotação física, desaceleração suave, som de dados rolando, explosão de fagulhas em Crítico Extremo (20) e estática rubra em Desastre (1).
- **Trilha Sonora Paranormal Procedural:**
  - Sintetizador de drone binaural grave e ressonante gerado puramente via Web Audio API, alternável pelo botão `[🎵 AMBIÊNCIA ON/OFF]` ou tecla `A`.

---

## ⌨️ Atalhos de Teclado

| Tecla | Ação |
|---|---|
| `ESC` | Fecha modais/gavetas ou **Retorna ao Mapa Múndi Global** (se estiver no mapa local) |
| `Backspace` | Retorna imediatamente ao Mapa Múndi Global (quando na visão local) |
| `/` | Foca diretamente na barra de busca |
| `M` | Redefine a visualização do mapa atual ou retorna ao globo |
| `R` | Abre o compêndio de Regras do Universo Evren |
| `C` | Abre o Códice Global de Lore |
| `D` | Abre ou fecha a Gaveta Lateral de Fichas |
| `K` | Abre a Arena de Conflito Direto |
| `B` | Abre o Bestiário de Criaturas Anômalas |
| `T` | Abre a Cronologia Histórica de Evren |
| `X` | Abre a Bandeja Universal de Dados (d4 a d100) |
| `S` | Abre o Mixer Atmosférico & Soundboard |
| `I` | Abre o Rastreador de Iniciativa e Turnos |
| `O` | Abre o Oráculo de Anomalias Paranormais |
| `J` | Abre o Diário de Bordo do Investigador |
| `F` | Alterna a Névoa de Guerra Tática (Fog of War) |
| `U` | Abre a Matriz Biológica de Mutações (Árvore MDA) |
| `+` / `=` | Abre o Criador & Editor de Agentes Biopunk |
| `Espaço` | Avança o turno atual no combate |
| `A` | Alterna a Ambiência Sonora Paranormal / Drone Ocultista [ON/OFF] |
| `Z` | Minimiza ou expande o Radar Holográfico AEGIS |

---

## 🌐 Publicação Online & PWA (Pronto para o Ar)

Este projeto está 100% pronto para publicação gratuita em servidores estáticos na nuvem:
- **GitHub Pages:** Inclui `.github/workflows/deploy.yml` para deploy automático no push.
- **Vercel:** Inclui `vercel.json` pré-configurado.
- **Netlify:** Inclui `netlify.toml` pré-configurado.
- **PWA (Progressive Web App):** Inclui `manifest.json`, `sw.js` (Service Worker offline) e ícones de alta resolução em `assets/`.
- **Script de 1 Clique:** Execute `deploy.bat` para validar e publicar.

Consulte o guia completo de publicação em [`PUBLISHING.md`](file:///C:/Users/user/.gemini/antigravity/scratch/mesa-rpg-interativa/PUBLISHING.md).

---

## 🔬 Validação e Testes Locais

Para executar a suíte completa de testes automatizados e integridade:

```bash
# 1. Testes de integridade do JSON, IDs do DOM (52 verificações) e arquivos
python test_integrity.py

# 2. Testes unitários do DataLoader no Node.js
node test_data_loader.js

# 3. Verificação do Mapa Múndi Real com todos os 177 países, México e Triângulo
node verify_real_world.js

# 4. Verificação de todas as melhorias visuais, radar, túnel de nuvens, bio-vial e 3D d20
node verify_visual_upgrades.js
```

Acesse `http://localhost:8000` via `start.bat` ou `python server.py` para iniciar a mesa de RPG.
