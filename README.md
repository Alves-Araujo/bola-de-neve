<p align="center">
  <img src="./assets/banner.svg" width="100%" alt="Bola de Neve" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-0D1117?style=for-the-badge&logo=typescript&logoColor=3178C6" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-0D1117?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-0D1117?style=for-the-badge&logo=vite&logoColor=646CFF" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-0D1117?style=for-the-badge&logo=tailwindcss&logoColor=06B6D4" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Framer_Motion-0D1117?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" />
  <img src="https://img.shields.io/badge/Vitest-0D1117?style=for-the-badge&logo=vitest&logoColor=6E9F18" alt="Vitest" />
</p>

<p align="center">
  <a href="#como-rodar">
    <img src="https://img.shields.io/badge/%E2%86%92_Como_rodar-ff3ee0?style=for-the-badge&labelColor=0D1117" alt="Como rodar" />
  </a>
</p>

> **Veja seu dinheiro virar uma bola de neve.**

Calculadora de **juros compostos** com dois caminhos: simular quanto o seu dinheiro
vai render, ou descobrir quanto você precisa guardar por mês para chegar numa meta.
O resultado sai na hora, com gráficos, tabela mês a mês e o momento em que os juros
passam a render mais que o seu aporte.

Sem back-end, sem cadastro e sem login: tudo é calculado no navegador. Interface em
português do Brasil.

## O que ele faz

| Recurso | O que faz |
| --- | --- |
| **📈&nbsp;Quanto&nbsp;vou&nbsp;ter?** | Valor inicial, aporte mensal, taxa e prazo viram o valor final, o total investido e o total em juros. A bola de neve do resultado cresce junto com o valor. |
| **🎯&nbsp;Quanto&nbsp;preciso&nbsp;guardar?** | Informe a meta, o prazo e quanto já tem: o site devolve o aporte mensal necessário e mostra quanto da meta vem do seu bolso e quanto vem dos juros. |
| **❄️&nbsp;Ponto&nbsp;de&nbsp;virada** | Mostra o mês em que os juros do mês passam o seu aporte, quando a bola de neve "começa a andar sozinha". Aparece no texto, no gráfico e na tabela. |
| **🔀&nbsp;E&nbsp;se...?** | No modo meta, botões de ±1 ano e ±1% de taxa mostram o novo aporte antes de aplicar, com seta indicando se fica mais barato ou mais caro. |
| **📊&nbsp;Gráficos** | Evolução de investido × juros, rosca com a proporção dos juros e curva até a meta, que solta flocos de neve quando a meta é atingida. |
| **🧾&nbsp;Tabela** | Visão mês a mês ou ano a ano, paginada, com exportação em **CSV** (abre direto no Excel). |
| **🔗&nbsp;Link&nbsp;da&nbsp;simulação** | Copia uma URL com todos os valores preenchidos, para mandar a simulação para alguém. |
| **📚&nbsp;Como&nbsp;funciona** | Juros compostos explicados em 3 passos, o gráfico simples × compostos (R$ 10 mil a 1% ao mês por 20 anos: R$ 34 mil contra R$ 109 mil) e perguntas frequentes. |

### Detalhes de interface

- **Taxa ao ano ou ao mês**: dá para alternar entre a.a. e a.m. sem mudar o resultado; a conversão é feita por taxa equivalente, não dividindo por 12.
- Cada campo tem **digitação e controle deslizante**, com validação (prazo de 1 mês a 100 anos, taxa dentro de um limite razoável).
- **Tema escuro e claro**, lembrado entre visitas.
- Fundo com **aurora boreal e neve caindo** em canvas, rastro no cursor e uma bola de neve que desce a colina crescendo na abertura.
- Os números do resultado **contam até o valor final** e os cartões entram em cascata.
- Com `prefers-reduced-motion` ligado, as animações param e a bola de neve fica parada no meio da colina.

## Como rodar

Precisa do **Node.js 20.19+**.

```bash
npm install
npm run dev
```

E acessar <http://localhost:5173>.

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm test` | Testes das fórmulas |
| `npm run build` | Checagem de tipos + site final em `dist/` |
| `npm run preview` | Abre o build localmente |

O `dist/` é um site estático: pode ser publicado na Vercel, Netlify ou GitHub Pages.

## As contas

| O quê | Fórmula |
| --- | --- |
| Taxa anual → mensal | `i = (1 + a)^(1/12) − 1` |
| Cada mês (aporte no fim do mês) | `juros = total_anterior × i` · `total = total_anterior + juros + aporte` |
| Aporte para a meta | `PMT = (FV − PV·(1+i)^n) · i / ((1+i)^n − 1)`, arredondado para cima nos centavos |

Com taxa zero, o aporte vira divisão simples; se o que você já tem chega na meta
sozinho, o site avisa que não é preciso aportar.

Os **8 testes** em `src/lib/finance.test.ts` conferem a conversão de taxa, os
cenários de exemplo (R$ 1.000 + R$ 500/mês a 10% a.a. por 10 anos, metas de R$ 50 mil
e R$ 100 mil), a taxa zero e a meta já atingida.

## Estrutura

```
.
├── index.html               página base, fontes e tema salvo
├── assets/banner.svg        banner deste README
├── public/favicon.svg
└── src/
    ├── App.tsx              monta a página
    ├── index.css            tokens de cor dos dois temas, vidro, campos e botões
    ├── components/
    │   ├── Hero.tsx         abertura com a bola de neve descendo a colina
    │   ├── Calculator.tsx   os dois modos, campos e link da simulação
    │   ├── GrowthResults.tsx  resultado do "Quanto vou ter?"
    │   ├── GoalResults.tsx    resultado do "Quanto preciso guardar?" e cenários
    │   ├── charts.tsx       gráficos (Recharts)
    │   ├── DataTable.tsx    tabela mês a mês / ano a ano e CSV
    │   ├── HowItWorks.tsx   como funciona, comparação e FAQ
    │   └── Background.tsx   aurora, neve e rastro do cursor
    └── lib/
        ├── finance.ts       as fórmulas
        ├── finance.test.ts  testes das fórmulas
        ├── state.ts         valores padrão, validação e link compartilhável
        └── format.ts        moeda, porcentagem e prazos em pt-BR
```

## Aviso

As simulações consideram uma taxa constante, sem impostos, taxas ou inflação. São
estimativas para planejar e **não constituem recomendação de investimento**.
