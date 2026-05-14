# Guia para gerar gráficos no estilo SecondBrain

Use este guia para pedir ao ChatGPT gerar gráficos, dashboards, cards analíticos ou imagens visuais alinhadas ao SecondBrain.

## Identidade visual

Marca: `SecondBrain`

Estilo: dark futurista, técnico, premium, com visual de mentoria corporativa e circuitos digitais.

Clima visual:

- fundo preto esverdeado
- brilho cyano/verde água
- linhas de circuito
- bordas finas translúcidas
- cards com vidro escuro
- grid discreto
- alta legibilidade

## Logo

Símbolo: chapéu acadêmico minimalista em traço cyano.

Cor do símbolo:

```text
#43ffd2
```

Fundo do ícone:

```text
#020403
```

Ao pedir gráficos, descreva a logo assim:

```text
adicione uma pequena marca SecondBrain no canto superior esquerdo: ícone de chapéu acadêmico em linha fina cyano (#43ffd2), acompanhado do texto SecondBrain em branco.
```

## Cores principais

```text
Fundo principal: #020403
Fundo secundário: #050807
Painel escuro: rgba(7, 14, 13, 0.76)
Painel elevado: rgba(12, 24, 23, 0.82)
Texto principal: #f3fffc
Texto secundário: #8fa7a1
Texto suave: #c5ddd8
Cyano principal: #43ffd2
Azul-cyano apoio: #36b7ff
Linha/borda fraca: rgba(140, 255, 232, 0.16)
Linha/borda forte: rgba(140, 255, 232, 0.32)
Erro/vermelho: #ff6565
```

## Fonte

Fonte oficial do SaaS:

```text
SF Pro Display
```

Fallback:

```text
SF Pro Text, -apple-system, BlinkMacSystemFont, Inter, system-ui, sans-serif
```

Direção tipográfica:

- títulos grandes e fortes
- texto claro, curto e objetivo
- sem fonte serifada
- sem letras condensadas
- sem estilo infantil

## Fundo

Use fundo preto técnico:

```text
background #020403 com grid fino quase invisível e brilho radial cyano suave.
```

Elementos de fundo:

- grid técnico sutil
- circuit lines
- PCB traces
- linhas angulares finas
- bolinhas/nós nas pontas
- glow cyano fraco

Prompt recomendado:

```text
fundo dark #020403 com grade técnica sutil, linhas de circuito finas em cyano translúcido, pequenos pontos luminosos nas pontas das linhas, glow radial suave em #43ffd2, visual premium e limpo.
```

## Cards e painéis

Painéis devem parecer vidro escuro:

```text
cards com fundo preto esverdeado translúcido, borda fina cyano, raio de 22px, sombra preta profunda e leve brilho interno.
```

Não usar:

- cards brancos
- sombras cinza claras
- bordas grossas
- gradientes roxos
- azul dominante

## Gráficos

### Linhas

Use:

```text
linha principal #43ffd2 com glow leve
linha secundária #36b7ff com opacidade menor
grid do gráfico em rgba(140,255,232,0.12)
labels em #8fa7a1
valores principais em #f3fffc
```

### Barras

Use barras com gradiente:

```text
linear-gradient(180deg, #43ffd2, #36b7ff)
```

Fundo da barra:

```text
rgba(255,255,255,0.05)
```

### Pizza/Donut

Preferir donut chart.

Cores:

```text
#43ffd2
#36b7ff
#7fffe5
#1f8f7a
#ff6565 somente para alerta
```

### Métricas

Cards de KPI:

```text
número grande em #f3fffc
label pequena em #8fa7a1
ícone cyano com glow
borda rgba(140,255,232,0.16)
```

## Layout de dashboard

Estrutura recomendada:

```text
canvas 16:9
fundo #020403
topo com logo SecondBrain
linha de cards KPI no topo
gráfico principal grande no centro
gráficos secundários menores abaixo ou à direita
linhas de circuito no fundo, bem sutis
```

## Prompt base para ChatGPT

```text
Crie um gráfico/dashboard no estilo visual do SecondBrain.

Use fundo #020403, fonte SF Pro Display, cards escuros translúcidos, bordas finas rgba(140,255,232,0.16), brilho cyano #43ffd2, apoio #36b7ff, texto principal #f3fffc e texto secundário #8fa7a1.

Inclua no fundo linhas de circuito finas estilo PCB/circuit traces, com pontos nas extremidades, bem sutis e em cyano translúcido.

Use a marca SecondBrain no canto superior esquerdo com ícone de chapéu acadêmico em linha cyano e texto branco.

O visual deve ser premium, técnico, limpo, dark, sem roxo, sem fundo claro, sem excesso de texto.
```

## Prompt para gráfico de desempenho

```text
Gere um gráfico de desempenho no estilo SecondBrain:
canvas 1920x1080, fundo #020403 com grid sutil, painel central translúcido escuro, linha principal #43ffd2 com glow suave, linha secundária #36b7ff, labels em #8fa7a1, números em #f3fffc, fonte SF Pro Display, bordas finas cyano, circuit lines discretas no fundo.
```

## Prompt para card KPI

```text
Gere um card KPI no estilo SecondBrain:
card escuro translúcido com borda rgba(140,255,232,0.16), raio 22px, número grande em #f3fffc, label pequena em #8fa7a1, ícone linear cyano #43ffd2 com glow, fundo com micro linhas de circuito discretas.
```

## Regras finais

Manter:

- dark premium
- cyano/verde água
- fonte SF Pro Display
- circuit lines sutis
- logo SecondBrain
- cards translúcidos
- dados bem legíveis

Evitar:

- roxo
- azul roxo
- branco dominante
- estilo cartoon
- gráficos coloridos demais
- fonte genérica aparente
- muitos textos explicativos
