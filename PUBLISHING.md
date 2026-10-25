# GUIA DE PUBLICAÇÃO & HOSPEDAGEM — UNIVERSO EVREN RPG (VTT)

Este projeto foi construído com arquitetura **Zero-Dependencies (Vanilla HTML5/ES6/CSS3)** e suporte completo a **Progressive Web App (PWA)**. Isso significa que ele pode ser hospedado gratuitamente em qualquer serviço de páginas estáticas e instalado como aplicativo nativo em celulares e computadores.

---

## 🚀 Opção 1: GitHub Pages (100% Gratuito & Recomendado)

O repositório já inclui o workflow de deploy automatizado em `.github/workflows/deploy.yml`.

### Passo a passo:
1. Crie um repositório no seu GitHub (ex: `evren-rpg`).
2. No seu computador, abra a pasta do projeto no terminal e execute:
   ```bash
   git init
   git add .
   git commit -m "Publicação da Mesa Interativa de RPG Evren"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   git push -u origin main
   ```
3. No GitHub, acesse seu repositório:
   - Vá em **Settings** ➔ **Pages** (na barra lateral esquerda).
   - Em **Source**, selecione **GitHub Actions**.
4. O GitHub executará o build e seu site estará no ar em poucos segundos em:
   `https://SEU_USUARIO.github.io/SEU_REPOSITORIO/`

---

## ⚡ Opção 2: Vercel (Deploy Instantâneo com 1 Clique)

O projeto já inclui o arquivo [`vercel.json`](file:///C:/Users/user/.gemini/antigravity/scratch/mesa-rpg-interativa/vercel.json) pré-configurado com headers CORS e suporte PWA.

### Passo a passo:
1. Acesse [vercel.com](https://vercel.com) e conecte com seu GitHub.
2. Clique em **Add New Project** e importe o repositório do Evren RPG.
3. Não altere nenhuma configuração de build (Framework Preset: *Other*).
4. Clique em **Deploy**.
5. Seu VTT estará online com SSL gratuito e CDN global (ex: `https://evren-rpg.vercel.app`).

---

## 🌐 Opção 3: Netlify (Deploy com Drag & Drop ou Git)

O projeto já inclui o [`netlify.toml`](file:///C:/Users/user/.gemini/antigravity/scratch/mesa-rpg-interativa/netlify.toml).

### Passo a passo (Arrastar e Soltar):
1. Acesse [app.netlify.com/drop](https://app.netlify.com/drop).
2. Arraste toda a pasta `mesa-rpg-interativa` para a área indicada no navegador.
3. Pronto! O site será publicado instantaneamente com um link permanente.

---

## 📲 Como Instalar o App no Celular ou Computador (PWA)

O site possui **Manifest Web App** e **Service Worker** ativos.

### No Computador (Chrome / Edge / Opera / Brave):
1. Acesse o site no navegador.
2. Na barra de navegação do site, clique no botão **📲 Instalar App** (ou no ícone de monitor na barra de endereços do navegador).
3. O aplicativo abrirá em uma janela nativa independente, sem abas de navegador.

### No iPhone / iPad (Safari iOS):
1. Abra o site no **Safari**.
2. Toque no botão de **Compartilhar** (ícone de quadrado com seta para cima).
3. Role para baixo e selecione **Adicionar à Tela de Início** (Add to Home Screen).
4. O ícone de Evren RPG aparecerá na tela do seu iPhone funcionando como app nativo em tela cheia!

### No Celular Android (Chrome / Samsung Internet):
1. Abra o site no **Chrome**.
2. Toque no botão **📲 Instalar App** ou nos três pontinhos (⋮) no topo direito.
3. Selecione **Instalar aplicativo** ou **Adicionar à tela inicial**.

---

## 💾 Portabilidade & Backup de Campanhas

Para garantir que mestres e jogadores nunca percam seus personagens e anotações:
1. Na barra superior do app, clique em **💾 Backup**.
2. Clique em **Baixar Arquivo de Backup (.json)**.
3. Em qualquer outro dispositivo (celular, tablet ou PC), abra o site, vá em **Backup** e carregue o arquivo para restaurar todo o progresso da mesa!
