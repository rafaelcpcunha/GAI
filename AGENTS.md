# AGENTS.md

Guia para agentes de IA (e pessoas) que trabalham neste repositório.

## Visão geral

**Estrada Neon** é um jogo de corrida arcade pseudo-3D para o navegador, com visual synthwave
dos anos 80 (pôr do sol listrado, palmeiras, grade neon). Ele é inspirado no gênero dos jogos
de corrida de arcade, mas não copia nenhum jogo específico: nome, arte e pista são originais.
Todo o conteúdo e a interface são em **português (pt-BR)**.

## Stack

- **Next.js 15** (App Router, diretório `app/`)
- **React 19**
- **JavaScript** puro (sem TypeScript)
- **Canvas 2D** para o jogo e **Web Audio** para os sons (sem bibliotecas de jogo)
- Fonte **Press Start 2P** via `next/font/google`
- CSS global simples (sem Tailwind ou CSS-in-JS)
- Node.js 24 / npm 11 no ambiente de desenvolvimento (Codespace)

## Estrutura

```
app/
  layout.js        # Layout raiz: <html lang="pt-BR">, metadata, fonte pixel no <body>
  page.js          # Página inicial (Server Component): renderiza <Game />
  fonts.js         # Press Start 2P (usada no CSS e no HUD do canvas)
  icon.svg         # Favicon
  globals.css      # Tela cheia, overlays (menu/pausa/fim), botões de toque
  game/
    Game.js        # Client Component: canvas, overlays React e controles de toque
    engine.js      # Motor: pista, física, tráfego, checkpoints, renderização e HUD
    sprites.js     # Sprites gerados em canvas (carros, palmeiras, postes, placas, fundo)
    audio.js       # Motor, bipes e batida sintetizados com Web Audio
```

## Comandos

```bash
npm install      # instalar dependências
npm run dev      # servidor de desenvolvimento em http://localhost:3000
npm run build    # build de produção (use para validar mudanças)
npm run start    # servir o build de produção
```

Não há testes nem linter configurados. Valide alterações com `npm run build` e jogando no navegador.

## Convenções

- Textos visíveis ao usuário em português (pt-BR).
- A página inicial continua sendo Server Component; toda a interatividade fica em `app/game/Game.js`
  (`"use client"`), que cria o motor dentro de `useEffect` e chama `destroy()` no cleanup.
- `engine.js`, `sprites.js` e `audio.js` não dependem de React e só acessam `window`/`document`
  quando `createGame()` é chamado (nunca no topo do módulo, por causa do SSR).
- O motor avisa a UI pelo callback `onChange({ state, score, best, newBest, muted, lap })` apenas em
  mudanças de estado. O HUD de cada quadro é desenhado no próprio canvas.
- A fonte Press Start 2P não tem setas nem emojis: use texto nos rótulos da interface.

## Como o motor funciona (`app/game/engine.js`)

- Estrada por segmentos (`SEG_LEN = 200`) projetados em perspectiva, com curvas e morros
  montados por `addRoad(enter, hold, leave, curve, height)`. A pista fecha um circuito.
- Canvas interno com 480 px de altura; a largura acompanha a proporção da tela (300–1280 px).
- Simulação com passo fixo de 1/60 s; a renderização usa `requestAnimationFrame`.
- Estados: `menu` (demonstração com a câmera andando sozinha), `countdown`, `playing`, `paused`, `gameover`.
- Tempo inicial de 50 s. Checkpoints na largada e na metade da pista dão tempo extra
  (32 s, diminuindo 2 s a cada checkpoint, mínimo de 18 s) e +500 pontos.
- Fora da pista o carro perde velocidade; bater em palmeiras, postes, placas ou carros reduz a velocidade.
- O recorde e a preferência de som ficam no `localStorage` (sempre dentro de try/catch).
- O jogo pausa sozinho quando a aba fica oculta.

## Git

- Branch principal: `main`.
- Commits só quando solicitado.
