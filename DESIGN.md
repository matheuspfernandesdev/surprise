# DESIGN — Chá de Panela do Davi e Deborah

> Diretrizes visuais para implementação (Claude Code). Pareie com `PRD.md`.
> **Tema:** romântico delicado, terroso + verde-sálvia, inspirado num pôr do sol na praia. **Tema claro** (NÃO usar dark mode aqui — isso sobrepõe o default escuro do design system).

---

## 1. Direção visual

Aconchegante, elegante e leve. Cores quentes de areia e pôr do sol, equilibradas por um verde-sálvia sereno. Bordas suaves, bastante respiro, tipografia com toque romântico nos títulos e limpa no corpo. Nada de gradientes berrantes ou sombras pesadas — a sensação é de papel artesanal e luz dourada de fim de tarde.

Referências de paleta/clima: paletas de casamento **terracota + sage green + dourado**; estética "warm minimal / earthy".

---

## 2. Paleta de cores

Cole estes tokens como CSS variables e mapeie para os tokens do shadcn (tabela em 2.2). **Hex é a fonte da verdade.**

```css
:root {
  /* superfícies */
  --bg:            #FAF5EE; /* fundo creme/linho */
  --surface:       #FFFDF9; /* cards (branco quente) */
  --surface-soft:  #F3EADD; /* seções/realce sutil */
  --border:        #E7DCCB; /* bordas bege */

  /* texto */
  --text:          #3B342B; /* marrom profundo */
  --text-muted:    #8A7E70; /* marrom acinzentado (secundário) */

  /* marca */
  --primary:       #B96B4A; /* terracota */
  --primary-hover: #A2583B;
  --primary-fg:    #FFF8F2; /* texto sobre terracota */
  --sage:          #7E8C6B; /* verde-sálvia */
  --sage-hover:    #6B7958;
  --gold:          #DDA869; /* dourado do pôr do sol (detalhes) */

  /* estados */
  --success:       #6E8B5A;
  --destructive:   #B04A3F;
  --reserved-bg:   #EFE7DA; /* fundo de item reservado */
  --reserved-fg:   #B3A899; /* texto apagado */

  /* foco */
  --ring:          #B96B4A;
}
```

**Uso:**
- **Terracota (`--primary`)** = ações principais ("Vou levar", "Confirmar", "Baixar Excel") e o título.
- **Sálvia (`--sage`)** = acentos, badge de categoria, detalhes botânicos, ícones.
- **Dourado (`--gold`)** = toques finos (linha sob títulos de seção, divisores, brilho), com parcimônia.
- **Reservado** = card com fundo `--reserved-bg`, texto `--reserved-fg`, opacidade ~0.65, sem botão.

**Contraste:** texto principal sempre `--text` sobre superfícies claras (alto contraste). Use `--text-muted` só para informação secundária. Botões terracota/sálvia usam **texto claro e peso bold** para legibilidade.

### 2.2 Mapeamento para tokens shadcn/ui

| Token shadcn | Valor (hex) |
|---|---|
| `--background` | `#FAF5EE` |
| `--foreground` | `#3B342B` |
| `--card` | `#FFFDF9` |
| `--card-foreground` | `#3B342B` |
| `--popover` | `#FFFDF9` |
| `--primary` | `#B96B4A` |
| `--primary-foreground` | `#FFF8F2` |
| `--secondary` | `#7E8C6B` |
| `--secondary-foreground` | `#FFF8F2` |
| `--muted` | `#F3EADD` |
| `--muted-foreground` | `#8A7E70` |
| `--accent` | `#F3EADD` |
| `--accent-foreground` | `#3B342B` |
| `--destructive` | `#B04A3F` |
| `--border` / `--input` | `#E7DCCB` |
| `--ring` | `#B96B4A` |

---

## 3. Tipografia

Carregar via Google Fonts.

- **Títulos / display:** **Cormorant Garamond** — pesos 500 e 600. Usar no título festivo e nos nomes das categorias. Romântico, com serifa fina.
- **Corpo / UI:** **Inter** — pesos 400/500/600. Botões, cards, labels, tabela.
- **Acento opcional (só os nomes "Davi & Deborah"):** **Dancing Script** 600 — usar **com muita parcimônia**, só no destaque dos nomes. Se ficar carregado, descartar.

**Escala (mobile-first):**
| Uso | Fonte | Tamanho | Peso |
|---|---|---|---|
| Título festivo (H1) | Cormorant | 32–40px | 600 |
| Nomes do casal (acento) | Dancing Script | 36–48px | 600 |
| Título de seção/categoria | Cormorant | 22–26px | 600 |
| Nome do item | Inter | 16px | 600 |
| Texto secundário/categoria | Inter | 13px | 500 |
| Botão | Inter | 15px | 600 |
| Corpo geral | Inter | 15–16px | 400 |

Entrelinha confortável (1.4–1.6 no corpo). Títulos com `letter-spacing` levemente negativo.

---

## 4. Espaçamento, raio e sombra

**Espaçamento — base 4px:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
Padding generoso nas seções (24–32px verticais). Gap entre cards 12–16px.

**Border radius (cantos suaves):**
- Base do tema (`--radius`): **14px** (`0.875rem`).
- Cards de item: **16px** (`rounded-2xl`).
- Botões: **12px**.
- Chips/badges de filtro: **pill** (full).
- Frame da foto: **24px** (`rounded-3xl`).

**Sombras (suaves, tom quente):**
```css
--shadow-sm:   0 1px 2px rgba(59,52,43,0.05);
--shadow-card: 0 1px 3px rgba(59,52,43,0.06), 0 10px 30px -12px rgba(59,52,43,0.12);
--shadow-modal:0 20px 50px -20px rgba(59,52,43,0.35);
```
Use sombra de card discreta; nada de sombras duras ou escuras.

---

## 5. Tratamento da foto do casal

- Arquivo em `public/casal.jpg` (ideal converter para `.webp` por performance — opcional). É **vertical (proporção ~3:4)**.
- Exibir num **frame arredondado** (`rounded-3xl`) com **anel/borda creme** de ~5px (`--surface`) e `--shadow-card`. `object-fit: cover`.
- **Largura:** no mobile ~78% da tela, centralizada; no desktop **limitar a ~360–400px** e centralizar — **não esticar** como banner largo (a foto é retrato).
- Título festivo **abaixo** da foto (não precisa de overlay). Se algum dia colocar texto sobre a foto, usar gradiente quente translúcido na base.
- **Toque decorativo opcional:** um raminho de folhas sálvia (SVG) discreto atrás/ao lado do frame, ou uma linha dourada fina sob o título. Sutil — se pesar, remover.

---

## 6. Layout

- **Container central:** largura máxima ~**640px**, centralizado (fica elegante mesmo no desktop, e o foco é mobile).
- **Header (`/`):**
  1. Foto do casal (frame arredondado).
  2. H1 **"Chá de Panela SURPRESA do Davi e Deborah"** (Cormorant). Os nomes podem ganhar o acento Dancing Script.
  3. Subtítulo curto/instrução: *"Escolha um item que você vai levar 💛"* (Inter, muted).
- **Barra de filtros (sticky, logo abaixo do header):**
  - Switch **"Mostrar só disponíveis"** (ligado por padrão).
  - Chips de categoria scrolláveis na horizontal (ToggleGroup), com "Todas" default.
  - Contador: *"23 de 50 itens disponíveis"* (muted).
- **Lista por categoria:**
  - Cada categoria abre com um **título de seção** (Cormorant) + uma fininha **linha dourada** decorativa.
  - Cards: **1 coluna no mobile**, **2 colunas a partir de ~640px** (`sm:grid-cols-2`), gap 12–16px.
- **Footer:** discreto — *"Feito com 💛 para Davi & Deborah"*.

**Card de item:**
```
┌───────────────────────────────┐
│  Macarrão espaguete           │  ← Inter 600
│  Massas e Farinhas            │  ← badge sálvia / muted
│                   [ Vou levar ]│  ← botão terracota
└───────────────────────────────┘
```
Reservado: mesmo card, fundo `--reserved-bg`, texto apagado, **badge "Reservado"** (sálvia suave), sem botão.

**Modal de reserva (Dialog):** título "Vou levar: {item}", campo **Nome**, **stepper de quantidade** (− 1 +), botões "Cancelar" (ghost) e "Confirmar" (terracota, com loading).

**`/admin`:** mesma paleta, porém mais sóbrio e funcional. Topo com 3 mini-cards de resumo (Total · Reservados · Faltam), botão **"Baixar Excel"** (terracota) e uma **Table** limpa (linhas zebradas com `--surface-soft`).

---

## 7. Componentes shadcn/ui a usar

| Parte da tela | Componente |
|---|---|
| Card de item / mini-cards de resumo | `card` |
| Botões ("Vou levar", "Confirmar", "Baixar Excel") | `button` |
| Modal de reserva | `dialog` |
| Campo de nome | `input` + `label` |
| Quantidade | stepper custom com 2 `button` + `input` (ou só os botões) |
| Filtro "só disponíveis" | `switch` |
| Filtro de categoria | `toggle-group` (chips) — `scroll-area` se precisar rolar |
| Badge "Reservado" / categoria | `badge` |
| Tabela do admin | `table` |
| Feedbacks (sucesso/erro) | `sonner` (toast) |
| Loading da lista | `skeleton` |
| Divisores | `separator` |

> Instalar só esses componentes. Manter consistência com os tokens da seção 2.

---

## 8. Microinterações e detalhes

- Hover de botão: escurecer levemente (`--primary-hover` / `--sage-hover`) + leve `translateY(-1px)`.
- Item reservando (em voo): botão em loading, desabilitado.
- Item que acabou de escurecer (via Realtime): transição suave de opacidade (~200ms), sem "pulo".
- Foco visível em tudo (anel terracota translúcido) — acessibilidade.
- Emojis com parcimônia (💛 combina com o tom); não exagerar.
- Animações sutis e curtas (150–250ms). Nada chamativo.

---

## 9. Lembrete de surpresa (vale repetir aqui)

`document.title` e qualquer preview de link = **"Lista de Presentes"**. **Nada** de "SURPRESA", "Davi" ou "Deborah" em `<title>`, metadados ou OpenGraph. O clima festivo todo vive **dentro** da página.
