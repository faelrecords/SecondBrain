# SecondBrain - dados visuais

## Identidade

Nome: `SecondBrain`

Tipo: plataforma interna de cursos, mentoria e aulas corporativas.

Visual base: escuro, técnico, premium, com brilho cyano/verde água.

Referência visual: landing futurista dark com cards translúcidos, bordas finas, glow e grid discreto.

## Paleta

```css
--bg: #020403;
--bg-2: #050807;
--panel: rgba(7, 14, 13, .76);
--panel-2: rgba(12, 24, 23, .82);
--line: rgba(140, 255, 232, .16);
--line-strong: rgba(140, 255, 232, .32);
--text: #f3fffc;
--muted: #8fa7a1;
--soft: #c5ddd8;
--accent: #43ffd2;
--accent-2: #36b7ff;
--accent-rgb: 67, 255, 210;
--danger: #ff6565;
--shadow: 0 28px 90px rgba(0, 0, 0, .52);
```

## Fundo

Fundo principal preto/esverdeado.

Grid sutil:

```css
linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)
linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px)
background-size: 92px 92px
```

Glows:

```css
radial-gradient(circle at 52% 14%, rgba(67,255,210,.18), transparent 30rem)
radial-gradient(circle at 86% 36%, rgba(54,183,255,.10), transparent 22rem)
```

## Tipografia

Fonte oficial:

```css
"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif
```

H1:

```css
font-size: clamp(38px, 6vw, 82px);
line-height: .95;
font-weight: 820;
letter-spacing: 0;
```

H2:

```css
font-size: 25px;
letter-spacing: 0;
```

Texto secundário:

```css
color: #8fa7a1;
line-height: 1.55;
```

## Layout

App shell:

```css
display: grid;
grid-template-columns: 260px 1fr;
```

Sidebar fixa:

```css
position: sticky;
top: 0;
height: 100vh;
background: rgba(1, 3, 3, .72);
backdrop-filter: blur(20px);
border-right: 1px solid var(--line);
```

Conteúdo:

```css
padding: 28px;
```

## Componentes

### Cards e painéis

```css
background: rgba(7, 14, 13, .76);
border: 1px solid rgba(140, 255, 232, .16);
border-radius: 22px;
box-shadow: 0 20px 70px rgba(0,0,0,.24), inset 0 1px 0 rgba(255,255,255,.05);
```

### Botão primário

```css
background: linear-gradient(135deg, #43ffd2, #36b7ff);
color: #020403;
font-weight: 850;
box-shadow: 0 0 26px rgba(67,255,210,.33), inset 0 1px 0 rgba(255,255,255,.42);
border: 0;
border-radius: 12px;
```

### Botão normal

```css
border: 1px solid var(--line);
background: rgba(255,255,255,.045);
color: var(--text);
border-radius: 12px;
```

Hover:

```css
border-color: var(--line-strong);
background: rgba(67,255,210,.10);
box-shadow: 0 0 24px rgba(67,255,210,.13);
```

### Inputs

```css
background: rgba(0,0,0,.36);
color: var(--text);
border: 1px solid var(--line);
border-radius: 12px;
padding: 12px 13px;
```

### Upload de imagem

Botão customizado:

```css
display: inline-flex;
align-items: center;
gap: 9px;
padding: 12px 15px;
border: 1px solid var(--line-strong);
border-radius: 14px;
color: var(--accent);
background: rgba(67,255,210,.08);
box-shadow: 0 0 22px rgba(67,255,210,.08);
```

Input nativo escondido.

## Telas

### Login

Card central.

Dimensão:

```css
width: min(460px, 100%);
padding: 40px;
border-radius: 28px;
```

Fundo:

```css
linear-gradient(180deg, rgba(15,28,27,.86), rgba(3,6,6,.88))
```

### Home do usuário

Estrutura:

1. Slider 1920x1080 configurável.
2. Botão `Continuar de onde parou`.
3. Seção `Cursos disponíveis`.
4. Cards verticais 1080x1920.

### Curso

Mostra módulos do curso.

Cards verticais 1080x1920.

### Módulo/aula

Layout:

```css
grid-template-columns: minmax(0, 1fr) 320px;
```

Painel esquerdo: vídeo e avaliação.

Painel direito: lista de aulas.

## Imagens

Slides:

```text
1920x1080
```

Capas de cursos:

```text
1080x1920
```

Capas de módulos:

```text
1080x1920
```

## Favicon

Arquivo:

```text
frontend/public/favicon.svg
```

Símbolo: chapéu acadêmico em traço cyano.

Cores:

```text
fundo #020403
traço #43ffd2
```

## Ícones

Biblioteca: `lucide-react`.

Ícones usados:

```text
GraduationCap
BookOpen
LayoutDashboard
Lightbulb
Users
Star
Play
Save
Trash2
Image
LogOut
Plus
```

Tratamento:

```css
color: var(--accent);
filter: drop-shadow(0 0 14px rgba(67,255,210,.65));
```

## Estados

Status de sugestões:

```text
open      -> em análise
planned   -> implementando
done      -> implementada
rejected  -> rejeitada
```

## Responsivo

Até `1180px`:

```css
.learn-grid { grid-template-columns: 1fr; }
.poster-grid { repeat(auto-fit, minmax(230px, 1fr)); }
```

Até `760px`:

```css
.app { grid-template-columns: 1fr; }
aside { position: static; height: auto; }
nav { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.main { padding: 14px; }
```

## Direção visual

Evitar:

- roxo
- azul dominante
- branco puro como fundo
- botões nativos do browser
- textos explicativos desnecessários
- cards claros

Manter:

- tema escuro
- cyano/verde água
- grid sutil
- glow técnico
- cards translúcidos
- bordas finas
- imagens verticais para cursos/módulos
- slider visual na entrada
