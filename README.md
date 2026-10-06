# Bola de Neve

Calculadora de juros compostos com dois modos:

- **Quanto vou ter?** — valor final, total investido, juros, gráfico, "ponto de virada" e tabela mês a mês/ano a ano (com CSV).
- **Quanto preciso guardar?** — aporte mensal necessário para chegar numa meta, com cenários "E se...?".

Feito com React, Vite, Tailwind CSS 4, Framer Motion e Recharts.

## Rodando

```bash
npm install
npm run dev
```

Abra http://localhost:5173.

## Outros comandos

- `npm test` — testes das fórmulas (`src/lib/finance.test.ts`)
- `npm run build` — gera o site final em `dist/` (pode ser publicado na Vercel, Netlify etc.)

## Fórmulas

- Taxa anual → mensal por equivalência: `i = (1 + a)^(1/12) − 1`
- Aporte no fim de cada mês: `juros = total_anterior × i`, `total = total_anterior + juros + aporte`
- Aporte para a meta: `PMT = (FV − PV·(1+i)^n) · i / ((1+i)^n − 1)`, arredondado para cima nos centavos
