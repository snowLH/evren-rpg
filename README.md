# 🌍 Universo EVREN — Museu Histórico Interativo 3D & VTT

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Security: Audited](https://img.shields.io/badge/Security-Audited-brightgreen.svg)](SECURITY.md)
[![PWA: Offline Ready](https://img.shields.io/badge/PWA-100%25_Offline-blue.svg)](manifest.json)
[![Three.js: r128](https://img.shields.io/badge/Three.js-r128-black.svg)](scripts/three.min.js)

O **EVREN** é um **Museu Histórico Interativo de um Universo Ficcional Físico** e mesa virtual de RPG (VTT), centralizado em um único planeta físico tridimensional navegável, com continentes, países, relevo, biomas e todas as campanhas de RPG registradas como exposições históricas permanentes.

---

## ⚡ Como Baixar e Executar com Segurança

### 1. Download do Repositório
No topo desta página no GitHub, clique em **Code** ➔ **Download ZIP** e extraia a pasta no seu computador.

### 2. Executando no Windows (1 Clique)
Abra a pasta extraída e dê um duplo clique no arquivo:
```cmd
start.bat
```
- **Com Python instalado:** O script inicializa o servidor local seguro (`server.py`) restrito estritamente a `127.0.0.1:8000` e abre a aplicação no seu navegador padrão.
- **Sem Python (Modo Offline):** A aplicação será aberta diretamente no navegador em modo PWA offline com fallback de dados integrado.

### 3. Executando no Linux / macOS
Abra o terminal na pasta do projeto e execute:
```bash
python3 server.py
```
Em seguida, acesse no navegador: `http://127.0.0.1:8000`

---

## 🛡️ Segurança e Privacidade Garantidas

- **Isolamento Total de Rede:** O servidor local vincula-se apenas a `127.0.0.1`. Nenhuma porta é exposta para sua rede local (LAN) ou para a internet pública.
- **Zero Telemetria:** O Evren RPG não envia nenhum dado, estatística ou telemetria para servidores remotos. Seus personagens e campanhas pertencem exclusivamente a você.
- **Proteção contra Injeção de Código (XSS):** Todo o conteúdo de fichas, notas, histórias e backups JSON passa por sanitização defensiva antes de ser renderizado no DOM.
- **Verificação de Integridade SHA-256:** As bibliotecas minificadas incluídas (`three.min.js`, `leaflet.js`) possuem hashes SHA-256 canônicos documentados em [SECURITY.md](SECURITY.md).
- **Aviso sobre o Windows Defender:** Arquivos `.bat` extraídos de pacotes `.zip` baixados da internet podem receber avisos heurísticos do SmartScreen devido à falta de assinatura comercial de certificados pagos. O arquivo `start.bat` é um script em texto simples de 15 linhas que apenas executa o Python ou abre o `index.html`. Você pode inspecioná-lo livremente em qualquer editor de texto.

Consulte o documento completo em [SECURITY.md](SECURITY.md).

---

## 🏛️ Funcionalidades do Museu Histórico e VTT

### 1. Globo Terrestre 3D do Planeta Evren (Three.js)
- **Hierarquia Geográfica Canônica:** `PLANETA → CONTINENTE → PAÍS → REGIÃO → CIDADE/LOCAL → CAMPANHA → HISTÓRIA`.
- **Relevo e Oceanos:** Textura esférica com relevo (bump map), oceanos escuros com brilho especular e camada de nuvens dinâmicas.
- **Controles Interativos Fluidos:** Arraste livre para rotação nos eixos X/Y com inércia amortecida, zoom por rolagem do scroll (mousewheel/touch pinch), clique de inspeção e duplo clique na superfície com centralização da câmera.
- **HUD Flutuante de Câmera 3D:** Botões de Zoom In (`➕`), Zoom Out (`➖`), Rotação Automática (`🔄`) e Redefinição de Perspectiva Orbital (`🧭`).
- **Barra de Acesso Rápido às Campanhas:** Faixa interativa inferior com pílulas para navegação e foco de câmera imediato em 1 clique para todas as 6 campanhas canônicas.
- **Marcadores Luminosos Pulsantes:** Beacons esféricos 3D com rótulos e badges geográficos projetados na tela, permitindo clicar no marcador diretamente no globo para voar a câmera e abrir a Exposição Histórica.
- **Alternância 2D / 3D:** Botão de alternância instantânea entre o globo 3D e a projeção topográfica plana.

### 2. Campanhas como Exposições Históricas
Cada campanha do universo é uma exposição independente com 6 abas dedicadas:
1. **Identificação & Contexto:** Status histórico, período temporal, gênero, coordenadas e pendências documentais.
2. **História em 8 Capítulos Narrativos:** *Contexto anterior*, *Início*, *Principais acontecimentos*, *Momentos decisivos*, *Conflitos*, *Revelações*, *Consequências* e *Desfecho*.
3. **Linha do Tempo Interativa:** Marcos cronológicos detalhados com impactos históricos inspecionáveis.
4. **Galeria de Personagens:** Cartões biográficos com retratos e status físico (*vivo, morto, desaparecido, em quarentena, desconhecido*).
5. **Locais Históricos:** Cartões geográficos com épocas de atividade e foco orbital 3D imediato.
6. **Acervo & Sessões:** Espécimes do bestiário, relíquias catalogadas e reprodutor de gravações de áudio.

### 3. Biografias & Trajetórias Multi-Campanhas
- Dossiê pessoal completo do personagem, acompanhando sua evolução através de diferentes campanhas e anos.
- Mapa de relacionamentos interpessoais com links navegáveis entre biografias.
- Ficha técnica original (C.R.I.S. / Tática com 28 perícias) recolhida em gaveta expansível para consulta detalhada.

### 4. Arquivo Histórico Global Relacional
- Motor de busca cruzada com filtros por palavra-chave, entidade (campanha, personagem, local, evento, criatura), continente, país e status.
- Botões de consulta rápida (*Campanhas Concluídas*, *Personagens Desaparecidos*, *Campanhas no Brasil*, *Relíquias*).

### 5. Curadoria & Gestão de Conteúdo (IndexedDB v4)
- Painel de administração para cadastrar novas campanhas, personagens e acontecimentos históricos.
- Exportação e importação de backups canônicos JSON (planeta completo ou pacote independente por campanha).
- Snapshots automáticos de restauração persistidos localmente no IndexedDB.

---

## 📚 Bíblia Canônica & Documentação (`docs/`)

O ecossistema canônico do Evren RPG é documentado detalhadamente na pasta `docs/`, dividida em quatro pilares:

### 1. Cosmologia, História & Facções (`docs/lore/`)
- [`docs/lore/biblia-universo.md`](docs/lore/biblia-universo.md): Cosmologia unificada em um único planeta físico, as 3 camadas epistêmicas, ledger de proveniência e diretrizes de integridade.
- [`docs/lore/cronologia.md`](docs/lore/cronologia.md): Linha do tempo desde a Antiguidade e Idade Média (Praga de 1348) até a Era Contemporânea (2026), registrando divergências históricas e variantes.
- [`docs/lore/faccoes-e-glossario.md`](docs/lore/faccoes-e-glossario.md): Dossiês de A.E.G.I.S. (Diretor Kaelen, variantes da sigla), Consórcio Oeht, Ordem de Santo Agostinho, Nova Caronte e glossário com 18 verbetes.

### 2. Sistema de Regras Playtest (`docs/rules/`)
- [`docs/rules/sistema-base.md`](docs/rules/sistema-base.md): Sistema de 5 Atributos (1–5), 28 perícias canônicas (com aliases), resolução por rolagem única `max((Atributo)d20) + bônus`, separação métrica (PV para dano físico vs. PD para esforço/habilidades vs. SAN vs. MDA), expressões anímicas e combate cinético.

### 3. Dossiês Detalhados de Campanhas (`docs/campaigns/`)
- [`docs/campaigns/triangulo.md`](docs/campaigns/triangulo.md): Triângulo das Bermudas / Nova Caronte (navio de 5.000 passageiros, vórtice, os 4 Soberanos e interceptação A.E.G.I.S.).
- [`docs/campaigns/mansao-vilar.md`](docs/campaigns/mansao-vilar.md): Mansão Vilar & Minas Antigas (variantes cronológicas 2021/2024 vs 2023/2026, arma LIMIAR, elenco completo de 5 protagonistas e Lucas vivo na Galeria 7).
- [`docs/campaigns/filantropo-oeht.md`](docs/campaigns/filantropo-oeht.md): A Gala da Meia-Noite / Mansão Belvedere (Oeht, Diretor Kaelen, relógio de dilatação temporal de 6s, gosma roxa e nota explícita de truncamento para a Zona B).

### 4. Bestiário Canônico (`docs/bestiary/`)
- 10 dossiês completos com hipóteses de origem, habitats, periculosidade, biologia, pistas e ganchos narrativos:
  1. [`ecos_subterraneos.md`](docs/bestiary/ecos_subterraneos.md)
  2. [`mimico_genetico.md`](docs/bestiary/mimico_genetico.md)
  3. [`kraken_abissal.md`](docs/bestiary/kraken_abissal.md)
  4. [`sentinela_limiar.md`](docs/bestiary/sentinela_limiar.md)
  5. [`campo_de_rosas.md`](docs/bestiary/campo_de_rosas.md)
  6. [`parasita_glacial.md`](docs/bestiary/parasita_glacial.md)
  7. [`leviata_branco.md`](docs/bestiary/leviata_branco.md)
  8. [`povo_sauriano.md`](docs/bestiary/povo_sauriano.md)
  9. [`primogenito_arquiteto.md`](docs/bestiary/primogenito_arquiteto.md)
  10. [`parasita_redoma_oeht.md`](docs/bestiary/parasita_redoma_oeht.md)

---

## 📊 Estatísticas do Acervo Canônico

| Entidade | Quantidade | Observações |
| :--- | :---: | :--- |
| **Campanhas Históricas** | 6 | Triângulo, Mansão Vilar, Estação Zero, Tapajós, Sombras de Praga, Gala Belvedere (Oeht) |
| **Personagens Registrados** | 20 | Protagonistas, agentes de campo, cientistas e antagonistas com histórico relacional |
| **Locais Cartografados** | 16 | Cidades, minas, estações polares, arquipélagos e sedes corporativas com coordenadas 3D |
| **Espécies no Bestiário** | 10 | 4 Classes ecológicas (Baixa, Média, Alta, Soberanos) com fichas padronizadas |
| **Relíquias e Artefatos** | 12 | Incluindo Arma LIMIAR, Relógio Temporal de 6s, Armadura Hallucigenia |
| **Eventos na Linha do Tempo** | 13 | Desde a Idade Média (Praga de 1348) até incidentes contemporâneos de 2026 |
| **Ledger de Proveniência** | 8 | Registro de variantes, fontes concorrentes e mistérios abertos com notas do curador |
| **Expressões Anímicas (Poderes)** | 4 | Dobra Temporal, Pulso de Contenção LIMIAR, Camuflagem de Mímica, Ressonância de Ecos |
| **Casos Folclóricos e Culturais** | 4 | Incluindo Devil's Bridge (Pontarfynach), Vale dos Sussurros, Mitos do Tapajós |
| **Termos no Glossário** | 18 | Definições canônicas de A.E.G.I.S., MDA, LIMIAR, Fenda Dimensional, etc. |

---

## 🧪 Verificação Automatizada e Testes

Para garantir integridade contínua e ausência de regressões:

```bash
# 1. Teste de servidor seguro e barreiras defensivas
python test_server.py

# 2. Teste de integridade estrutural (344 IDs do DOM em index.html e 41 arquivos CSS/JS)
python test_integrity.py

# 3. Teste unitário de DataLoader, Canon Ledger, Perícias e Bestiário (Node.js)
node test_data_loader.js
```

---

## 📁 Estrutura do Repositório

```
evren-rpg/
├── index.html                  # Interface central do Museu 3D e do VTT (344 IDs)
├── world_data.json             # Acervo histórico canônico do Universo Evren (schema 3.0.0-museum)
├── world_data_legacy_backup.json # Backup imutável da base original
├── server.py                   # Servidor HTTP local seguro (restrito a 127.0.0.1)
├── start.bat                   # Inicializador seguro para Windows
├── manifest.json               # Web App Manifest para instalação PWA
├── sw.js                       # Service Worker com cache para funcionamento 100% offline
├── README.md                   # Documentação do projeto
├── SECURITY.md                 # Política de segurança e verificação de hashes
├── LICENSE                     # Licença MIT e créditos de terceiros
├── AGENTS.md                   # Diretrizes universais para agentes de IA
├── test_server.py              # Suite de testes HTTP defensivos
├── test_integrity.py           # Suite de integridade do DOM (344 IDs) e arquivos
├── test_data_loader.js         # Suite de testes do DataLoader e mecânicas
├── docs/                       # Bíblia canônica e dossiês do Universo EVREN
│   ├── lore/                   # Cosmologia, cronologia unificada e facções
│   ├── rules/                  # Sistema playtest, 28 perícias, combate cinético e MDA
│   ├── campaigns/              # Dossiês das campanhas (Triângulo, Vilar, Gala Oeht)
│   └── bestiary/               # 10 dossiês completos de criaturas e Soberanos
├── styles/                     # 21 folhas de estilo CSS modulares
│   ├── museum.css              # Design system do Museu Histórico (Cinzel, Slate e Ouro)
│   ├── main.css                # Estilização do HUD tático e modais
│   ├── map.css                 # Estilização do mapa topográfico Leaflet
│   └── ...
├── scripts/                    # 20 scripts JavaScript vanilla ES6
│   ├── three.min.js            # Three.js r128 oficial local
│   ├── planet-3d-engine.js     # Motor 3D do globo terrestre, relevo e voo orbital
│   ├── museum-controller.js    # Controlador das exposições, biografias e arquivo global
│   ├── museum-storage.js       # Gerenciador de persistência IndexedDB v4 e snapshots
│   ├── data-loader.js          # Motor relacional de dados e sanitização defensiva
│   ├── combat-arena.js         # Mecânicas de combate cinético e resolução de checks
│   ├── leaflet.js              # Leaflet 1.9.4 oficial local
│   └── ...
└── assets/                     # Ícones PWA, mapas e recursos cartográficos
```

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte [LICENSE](LICENSE) para obter mais informações sobre o projeto e as bibliotecas de terceiros utilizadas.
