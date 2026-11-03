# Diretrizes de Segurança — Universo Evren RPG

Este documento estabelece o modelo de segurança, os princípios defensivos e os procedimentos de verificação de integridade do projeto **Evren RPG (Museu Histórico Interativo 3D & VTT)**.

---

## 1. Modelo de Segurança da Aplicação

O **Evren RPG** foi arquitetado como uma aplicação web moderna, desacoplada e focada em privacidade total para mestres e jogadores:

- **Execução 100% Local e Estática:** A aplicação roda diretamente no navegador do usuário ou através do servidor local embutido em Python (`server.py`).
- **Isolamento de Rede (Loopback 127.0.0.1):** O servidor local vincula-se exclusivamente à interface `127.0.0.1`. Nenhuma porta é exposta para a rede local (LAN) ou para a internet pública, prevenindo acessos indesejados.
- **Zero Telemetria ou Comunicações Ocultas:** O sistema não envia dados, estatísticas, logs ou perfis para servidores externos. Todos os dados permanecem no seu computador.
- **Armazenamento Seguro Local:** O progresso das campanhas, fichas e relatórios é salvo no IndexedDB local do navegador (`EvrenHistoricalMuseumDB`) e espelhado no `localStorage`.
- **Proteção Ativa contra XSS:** Todas as entradas do usuário, fichas C.R.I.S., notas de sessão e pacotes de backup importados passam por sanitização rigorosa via `EvrenSecurity.escapeHtml` e `safeUrl` antes de serem renderizadas no DOM.

---

## 2. Esclarecimento sobre Alertas do Windows Defender / SmartScreen

Ao baixar arquivos compactados (`.zip`) diretamente da internet através do navegador, o Windows aplica o atributo **Mark-of-the-Web** (Zone.Identifier = 3). 

Caso o Windows Defender SmartScreen exiba um aviso de *"Aplicativo desconhecido"* ao extrair o ZIP e executar o arquivo `start.bat`, isto decorre de regras heurísticas padrão do Windows para arquivos de lote (`.bat`) baixados da web sem assinatura digital corporativa, e **não** de comportamento malicioso.

### Nossas Garantias de Segurança:
- O arquivo `start.bat` contém apenas comandos padrão para verificar a presença do Python no PATH e abrir o navegador em `http://127.0.0.1:8000` (ou abrir o arquivo `index.html` diretamente).
- Nenhum script realiza downloads ocultos de arquivos externos (`curl`, `bitsadmin`, `powershell IWR`).
- Nenhuma alteração é efetuada no Registro do Windows (`reg.exe`) ou nas configurações de inicialização do sistema operacional.
- O código-fonte é 100% aberto e legível. Você pode clicar com o botão direito em `start.bat` ou `server.py` e inspecioná-los em qualquer editor de texto antes de executá-los.

---

## 3. Verificação de Integridade dos Arquivos (SHA-256)

Para garantir que os arquivos baixados correspondem com exatidão às versões oficiais do repositório, você pode verificar o hash criptográfico SHA-256:

### Hashes Oficiais das Bibliotecas Incluídas:
| Arquivo | Versão | Licença | Hash SHA-256 |
| :--- | :--- | :--- | :--- |
| `scripts/three.min.js` | r128 (Oficial) | MIT | `9274BBCEC8D96168626C732B5D31C775AA8CFB7EAA0599BEC0C175908A2C1CE2` |
| `scripts/leaflet.js` | 1.9.4 (Oficial) | BSD-2-Clause | `DB49D009C841F5CA34A888C96511AE936FD9F5533E90D8B2C4D57596F4E5641A` |

### Como Verificar no Windows (PowerShell):
```powershell
Get-FileHash scripts/three.min.js, scripts/leaflet.js -Algorithm SHA256
```

### Como Verificar no Linux / macOS:
```bash
sha256sum scripts/three.min.js scripts/leaflet.js
```

---

## 4. Política de Importação de Backups JSON

O sistema de importação de arquivos de backup (`.json`) possui as seguintes travas de segurança:
- **Limite Máximo de Tamanho:** Arquivos maiores que 25 MB são rejeitados imediatamente.
- **Sanitização de Protocolos de URL:** Imagens de personagens e locais são validadas para aceitar somente caminhos locais seguros (`assets/...`), URLs HTTP/HTTPS ou `data:image/`. Protocolos perigosos (`javascript:`, `vbscript:`, `data:text/html`) são automaticamente neutralizados.
- **Snapshots de Recuperação:** Antes de qualquer restauração de pacote, um snapshot automático de segurança é criado no IndexedDB para permitir reversão instantânea em caso de erro.

---

## 5. Como Reportar Vulnerabilidades

Caso identifique qualquer falha de segurança ou comportamento vulnerável neste projeto, solicitamos que nos notifique de forma responsável criando uma *Issue* no repositório com o marcador `[Segurança]` ou contatando os mantenedores.
