# AGENTS.md

Guia para agentes de IA (e pessoas) que trabalham neste repositório.

## Visão geral

Site em **Next.js (App Router)** que, por enquanto, exibe apenas uma página inicial de
"Site em construção" com efeito de confetes caindo. O conteúdo e a interface são em
**português (pt-BR)**.

## Stack

- **Next.js 15** (App Router, diretório `app/`)
- **React 19**
- **JavaScript** puro (sem TypeScript)
- **canvas-confetti** para o efeito de confetes
- CSS global simples (sem Tailwind ou CSS-in-JS)
- Node.js 24 / npm 11 no ambiente de desenvolvimento (Codespace)

> Observação: o pedido original falava em uma biblioteca Python ("libconfeititt"), que não
> existe e não rodaria no navegador. O efeito é feito com `canvas-confetti` (JavaScript).

## Estrutura

```
app/
  layout.js      # Layout raiz: <html lang="pt-BR">, metadata (título/descrição), importa globals.css
  page.js        # Página inicial (Server Component): cartão "🚧 Site em construção" + <Confetti />
  Confetti.js    # Client Component ("use client"): explosão inicial + confetes caindo continuamente
  globals.css    # Estilos globais: fundo em degradê roxo, cartão translúcido centralizado
package.json     # Scripts: dev, build, start
.gitignore       # node_modules, .next, next-env.d.ts
README.md
```

## Comandos

```bash
npm install      # instalar dependências
npm run dev      # servidor de desenvolvimento em http://localhost:3000
npm run build    # build de produção (use para validar mudanças)
npm run start    # servir o build de produção
```

Não há testes nem linter configurados. Valide alterações com `npm run build`.

## Convenções

- Textos visíveis ao usuário em português (pt-BR).
- Componentes que usam APIs do navegador (`window`, `requestAnimationFrame`, `canvas-confetti`)
  devem ser Client Components com `"use client"` e executar esse código dentro de `useEffect`.
- Manter a página inicial como Server Component; isolar a interatividade em componentes cliente.

## Detalhes do efeito de confetes (`app/Confetti.js`)

- Paleta: `#ff595e`, `#ffca3a`, `#8ac926`, `#1982c4`, `#6a4c93`.
- Ao montar: uma explosão de 150 partículas a partir do centro da tela.
- Depois: a cada ~120 ms, 3 partículas surgem em posição horizontal aleatória acima do topo
  (`startVelocity: 0`, `gravity: 0.6`, `drift` aleatório), simulando confetes caindo.
- Respeita `prefers-reduced-motion: reduce` (nenhum confete nesse caso).
- No cleanup: cancela o `requestAnimationFrame` e chama `confetti.reset()`.

## Git

- Branch principal: `main`.
- Commits só quando solicitado.
