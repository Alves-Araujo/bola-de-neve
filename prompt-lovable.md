Crie um web app chamado **Bola de Neve**: uma calculadora de juros compostos em português do Brasil, com visual de produto premium (nível Apple, Stripe, Linear) e animações fluidas em todos os elementos. Conceito da marca: dinheiro investido é como uma bola de neve rolando montanha abaixo. Começa pequena e cresce cada vez mais rápido.

## Stack
React + TypeScript + Tailwind + shadcn/ui, Framer Motion para animações, Recharts para gráficos, Lucide para ícones. Fontes do Google: "Sora" nos títulos e "Inter" no texto, com `tabular-nums` em todos os números. Sem backend, tudo roda no navegador.

## Identidade visual: "noite de inverno com aurora boreal"
- Fundo: gradiente azul-noite profundo, de #070B1A até #0F1A3A.
- Aurora: 3 ou 4 blobs grandes, desfocados (blur 120px) e animados, que se movem devagar pelo fundo, nas cores ciano #22D3EE, azul-gelo #60A5FA, violeta #A78BFA e menta #34D399.
- CTA e destaques: gradiente ciano → violeta, com brilho (glow) colorido.
- Texto: branco-neve #F8FAFC, com o secundário em #94A3B8.
- Nos gráficos e resultados, "valor investido" usa azul-gelo #60A5FA e "juros" usa menta #34D399.
- Cards em glassmorphism (bg white/5, backdrop-blur-xl, borda white/10, cantos de 24px) com um brilho na borda que acompanha o cursor do mouse (spotlight).
- Modo claro opcional ("amanhecer de inverno": branco-gelo, azul-claro, lilás) e um toggle sol/lua animado no header. O padrão é o modo escuro.

## Estrutura da página

### 1. Header
Fixo e translúcido (blur). Logo com uma bolinha de neve brilhante e o texto "Bola de Neve". Links âncora: Calculadora, Minha Meta, Como funciona. Toggle de tema. Ao rolar a página, o header encolhe suavemente.

### 2. Hero
- Título grande: "Veja seu dinheiro virar uma **bola de neve**." As palavras aparecem uma a uma (stagger) e "bola de neve" tem gradiente animado.
- Subtítulo curto e botão "Começar a calcular", que rola suavemente até a calculadora.
- Ilustração: uma bola de neve em SVG/CSS com gradientes e brilho, rolando por uma colina e crescendo em loop, deixando um rastro.
- Flocos de neve caindo no fundo do site inteiro (canvas leve, no máximo ~80 partículas, com leve parallax ao mover o mouse).

### 3. Calculadora com dois modos
Um segmented control com indicador deslizante animado (Framer Motion `layoutId`) alterna entre:
- **"Quanto vou ter?"**: a calculadora clássica.
- **"Quanto preciso guardar?"**: a calculadora de meta, com um badge "Novo" pulsando.

A troca de modo usa transição suave (fade + slide).

#### Modo 1: Quanto vou ter?
Campos:
- Valor inicial (R$)
- Valor mensal (R$)
- Taxa de juros (%), com seletor **anual / mensal**
- Período, com seletor **anos / meses**

Botões: **Calcular** e **Limpar**. Os resultados também se atualizam automaticamente enquanto o usuário digita (debounce de 300ms).

Todo campo numérico tem máscara de moeda BRL (R$ 1.234,56) e um slider estilizado logo abaixo, sincronizado com o input. Validação com mensagens amigáveis e um leve "shake" quando o valor é inválido.

Resultados:
- **3 cards**: Valor total final (o maior, com glow), Valor total investido e Total em juros. Os números contam de 0 até o valor final (count-up de ~1,2s com easing).
- **Gráfico de área empilhada** com investido × juros ao longo do tempo. Ele se desenha da esquerda para a direita e tem tooltip em glassmorphism.
- **Gráfico de rosca** com a proporção investido × juros e animação de preenchimento.
- **"Ponto de virada"**: destacar no gráfico, com um marcador pulsante, o mês em que os juros do mês passam a ser maiores que o aporte mensal. Texto: "No mês X sua bola de neve começa a andar sozinha ❄️".
- **Tabela mês a mês** com as colunas Mês, Juros do mês, Total investido, Total em juros e Total acumulado. Opção de ver por mês ou agrupado por ano, com paginação. As linhas entram em cascata (fade + slide).
- Uma bola de neve visual ao lado do resultado, com tamanho proporcional ao total final, que cresce animada quando o valor muda.

#### Modo 2: Quanto preciso guardar? (função nova)
Campos:
- Quanto quero ter (meta em R$)
- Em quanto tempo, com seletor **anos / meses**
- Taxa de juros (%), com seletor **anual / mensal**
- Quanto já tenho hoje (valor inicial, opcional)

Resultado:
- Frase em destaque gigante, com count-up: **"Você precisa investir R$ X por mês"**.
- Cards de apoio: total que você vai aportar, quanto virá de juros e "% da sua meta que vem dos juros".
- Barra de progresso animada até a meta.
- Gráfico de evolução com a **linha da meta pontilhada**. A curva sobe e, quando toca a meta, dispara uma explosão de flocos de neve/confete.
- Chips "E se...?" (−1 ano, +1 ano, +1% de taxa, −1% de taxa) que recalculam o aporte em tempo real com animação.
- Botão "Ver simulação completa", que leva os valores para o Modo 1 (já com o aporte calculado) e mostra a tabela mês a mês.
- Casos especiais: se o valor inicial sozinho já atingir a meta, mostrar "Boa notícia: você nem precisa aportar, só deixar render! 🎉". Se a taxa for 0, usar divisão simples. Validar valores vazios ou negativos.

## Fórmulas (seguir exatamente)
- `n` = número de meses. Se o período estiver em anos, n = anos × 12.
- `i` = taxa mensal em decimal. Se a taxa for **anual**, converter por equivalência: `i = (1 + a)^(1/12) − 1` (NÃO dividir por 12).
- Evolução mês a mês (aporte no fim de cada mês): no mês 0, total = valor inicial. Em cada mês k, `juros = total_anterior × i` e `total = total_anterior + juros + aporte_mensal`.
- Valor final: `FV = PV·(1+i)^n + PMT·[((1+i)^n − 1) / i]`
- Aporte necessário para a meta: `PMT = (FV − PV·(1+i)^n) · i / ((1+i)^n − 1)`. Se i = 0, `PMT = (FV − PV) / n`. Arredondar o resultado para cima, nos centavos.
- Formatar tudo com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.

## Animações e microinterações (caprichar muito)
- Scroll reveal em todas as seções (fade + blur → nítido + leve subida).
- Botões "magnéticos", que seguem levemente o cursor, com ripple no clique e gradiente que se move no hover.
- Cards com tilt 3D sutil no hover.
- Inputs com label flutuante, borda com gradiente animado no foco e glow.
- Ao clicar em Calcular: um flash de neve sobe do botão e os resultados entram em sequência (stagger).
- Count-up em todos os valores monetários.
- Skeleton shimmer enquanto os resultados recalculam.
- Cursor com um pequeno rastro de brilho no desktop (desativado no mobile).
- Transições com spring (Framer Motion) em tudo. Nada de transições lineares duras.
- Respeitar `prefers-reduced-motion`: desligar as partículas e reduzir as animações.
- Manter 60fps: usar transform/opacity e limitar as partículas.

## Seção "Como funciona"
- 3 cards ilustrados com mini animações: (1) "Você planta" (aporte), (2) "Os juros rendem sobre os juros", (3) "A bola de neve cresce sozinha". Cada card tem um ícone animado.
- Uma comparação visual animada entre juros simples e compostos (duas linhas se separando).
- FAQ em accordion com as perguntas: O que são juros compostos? Taxa anual ou mensal? Isso é recomendação de investimento?

## Extras
- Botão "Copiar link da simulação", que salva os valores em query params, para o usuário compartilhar. Toast animado de confirmação.
- Botão "Exportar tabela (CSV)".
- Mobile-first e totalmente responsivo. No celular, os resultados aparecem abaixo do formulário com scroll suave até eles.
- Acessibilidade: contraste AA, labels em todos os inputs, foco visível, navegação por teclado.
- Footer minimalista com o aviso: "As simulações são estimativas e não constituem recomendação de investimento."
- SEO: title "Bola de Neve — Calculadora de Juros Compostos", meta description e favicon de floco/bola de neve.

O resultado precisa parecer um produto de fintech de ponta: muito espaço em branco (respiro), hierarquia tipográfica forte, cores vibrantes sobre fundo escuro e movimento em cada interação, sem ficar poluído.
