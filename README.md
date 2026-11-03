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
- **5 Escalas Progressivas (LOD):** Visão Global, Continental, Regional, Local e Campanha com zoom cinemático contínuo.
- **Marcadores Luminosos:** Pontos luminosos 3D indicando campanhas concluídas, expedições em andamento, capitais e áreas não documentadas (*Terra Incognita*).
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

## 📁 Estrutura do Repositório

```
evren-rpg/
├── index.html                  # Interface central do Museu 3D e do VTT
├── world_data.json             # Acervo histórico canônico do Universo Evren (schema 3.0.0-museum)
├── world_data_legacy_backup.json # Backup imutável da base original
├── server.py                   # Servidor HTTP local seguro (restrito a 127.0.0.1)
├── start.bat                   # Inicializador seguro para Windows
├── manifest.json               # Web App Manifest para instalação PWA
├── sw.js                       # Service Worker com cache para funcionamento 100% offline
├── README.md                   # Documentação do projeto
├── SECURITY.md                 # Política de segurança e verificação de hashes
├── LICENSE                     # Licença MIT e créditos de terceiros
├── styles/
│   ├── museum.css              # Design system do Museu Histórico (Cinzel, Slate e Ouro)
│   ├── main.css                # Estilização do HUD tático e modais
│   ├── map.css                 # Estilização do mapa topográfico Leaflet
│   └── ...
├── scripts/
│   ├── three.min.js            # Three.js r128 oficial local
│   ├── planet-3d-engine.js     # Motor 3D do globo terrestre, relevo e voo orbital
│   ├── museum-controller.js    # Controlador das exposições, biografias e arquivo global
│   ├── museum-storage.js       # Gerenciador de persistência IndexedDB v4 e snapshots
│   ├── data-loader.js          # Motor relacional de dados e sanitização defensiva
│   ├── leaflet.js              # Leaflet 1.9.4 oficial local
│   └── ...
└── assets/                     # Ícones PWA, mapas e recursos cartográficos
```

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte [LICENSE](LICENSE) para obter mais informações sobre o projeto e as bibliotecas de terceiros utilizadas.
