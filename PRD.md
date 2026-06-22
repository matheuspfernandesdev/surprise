# PRD — Chá de Panela (interno: "Lista de Presentes")

> Documento de requisitos para implementação assistida por IA (Claude Code).
> Leia junto com `DESIGN-GUIDELINES.md` (aparência) e `SETUP.md` (infra Supabase/Vercel).

---

## 1. Visão geral

Site para gerenciar um **chá de panela surpresa** do casal **Davi & Deborah**. Cada convidado escolhe um item da lista de compras da casa nova e marca que vai levar; ao confirmar, o item fica **indisponível para os demais**. O organizador acompanha tudo e exporta um Excel.

**Objetivo:** evitar itens duplicados, dar visibilidade do que ainda falta, de forma simples, bonita e mobile-first.

**Não-objetivo:** não é um e-commerce, não tem pagamento, não tem conta de usuário.

### Stack (fixa)
- **Frontend:** React + Vite + TypeScript, **shadcn/ui** sobre Tailwind.
- **Roteamento:** `react-router-dom`.
- **Banco/API:** **Supabase** (Postgres + API REST automática + Realtime), client `@supabase/supabase-js`.
- **Export Excel:** SheetJS (`xlsx`).
- **Deploy:** Vercel (frontend-only). Sem backend próprio.

### Restrição de SURPRESA (crítica)
- O **título da aba** (`document.title`) e qualquer **meta tag / preview de link (OG/Twitter)** devem dizer apenas **"Lista de Presentes"**. A palavra "SURPRESA" **não pode** aparecer aí.
- O nome festivo completo **"Chá de Panela SURPRESA do Davi e Deborah"** só aparece **dentro** da página (H1 do conteúdo).

---

## 2. Personas

| Persona | Contexto | Necessidade principal |
|---|---|---|
| **Convidado** (primário) | No celular, sem conta, talvez no busão | Achar e reservar um item em poucos toques |
| **Organizador / Admin** (você) | Acompanhando os preparativos | Ver quem vai levar o quê e exportar Excel |
| **O casal** (não-usuário) | Não pode estragar a surpresa | Não descobrir o evento por aba/preview de link |

---

## 3. Rotas e acesso a dados

| Rota | Quem | Lê de | Escreve |
|---|---|---|---|
| `/` | Convidado | view `itens_publicos` (sem nomes) | função RPC `reservar_item` |
| `/admin` | Organizador | tabela `itens` (dados completos) | — (somente leitura + export) |

**Variáveis de ambiente (Vite):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (valor = publishable key), `VITE_ADMIN_PASSWORD`.

---

## 4. User Stories

**Convidado**
- Como convidado, quero ver a lista **agrupada por categoria** para achar rápido o que levar.
- Como convidado, quero ver **por padrão só os itens disponíveis**, para não perder tempo com o que já foi pego.
- Como convidado, quero poder **mostrar também os já reservados** se eu quiser (desligando o filtro).
- Como convidado, quero **filtrar por categoria**.
- Como convidado, quero escolher um item, **informar meu nome e a quantidade (padrão 1)** e confirmar, para reservar.
- Como convidado, quero que **itens reservados apareçam indisponíveis e sem o nome** de quem pegou.
- Como convidado, se eu tentar pegar um item que **acabou de ser reservado**, quero um **aviso claro** em vez de erro.

**Organizador**
- Como organizador, quero entrar em `/admin` com **senha**.
- Como organizador, quero ver **todos os itens, quem vai levar, quantidade e horário**.
- Como organizador, quero um **resumo** (quantos reservados / quantos faltam).
- Como organizador, quero **baixar um Excel** com tudo num clique.

---

## 5. Requisitos funcionais

### F1 — Lista pública (`/`)
- F1.1 Exibir cabeçalho com a **foto do casal** e o título **"Chá de Panela SURPRESA do Davi e Deborah"**.
- F1.2 Carregar todos os itens da view `itens_publicos` (campos: `id`, `nome`, `categoria`, `reservado`).
- F1.3 Agrupar visualmente por **categoria** (ordem fixa abaixo). Mostrar o nome da categoria como seção.
- F1.4 Cada item é um **card** com nome, categoria (sutil) e ação.
- F1.5 Estado de **loading** (skeletons) enquanto busca; **empty state** se o filtro não retornar nada.

**Ordem fixa das categorias:**
`Grãos e Cereais` → `Massas e Farinhas` → `Enlatados e Conservas` → `Temperos e Óleos` → `Matinais e Lanches` → `Limpeza` → `Higiene Pessoal` → `Descartáveis e Utilidades`

### F2 — Filtros (`/`)
- F2.1 **Filtro "Mostrar só disponíveis"** (Switch). **Ligado por padrão** — itens já reservados ficam ocultos. O convidado pode **desligar** para ver todos.
- F2.2 **Filtro por categoria**: chips/toggles horizontais (scrolláveis no mobile) com opção "Todas" (default). Selecionar uma categoria mostra só ela.
- F2.3 Os dois filtros funcionam **combinados**.
- F2.4 Mostrar um **contador**: "X de Y itens ainda disponíveis".

### F3 — Reserva (`/`)
- F3.1 Item disponível tem botão **"Vou levar"**. Clicar abre um **Dialog** (modal).
- F3.2 O Dialog tem: campo **Nome** (texto, obrigatório) e **Quantidade** (stepper +/−, **padrão 1, mínimo 1**).
- F3.3 Antes de confirmar, o convidado pode mudar nome/quantidade à vontade.
- F3.4 Botão **"Confirmar"** chama `supabase.rpc('reservar_item', { p_item_id, p_nome, p_quantidade })`.
- F3.5 **Sucesso:** fechar modal, item vira indisponível na hora, toast de confirmação ("Reservado! Obrigado 💛").
- F3.6 **Erro `ITEM_INDISPONIVEL`:** toast amigável — "Poxa, alguém acabou de pegar esse item." e atualizar a lista.
- F3.7 **Erro `NOME_OBRIGATORIO` / nome vazio:** validar antes; bloquear o botão e destacar o campo.
- F3.8 **Erro de rede/genérico:** toast de erro neutro; não travar a tela.
- F3.9 Botão "Confirmar" em estado **loading** durante a chamada (evita duplo clique).

### F4 — Indisponibilidade (`/`)
- F4.1 Item reservado aparece **apagado/desabilitado** (opacidade reduzida, sem botão de ação) com um **badge "Reservado"**.
- F4.2 **Nunca exibir o nome** de quem reservou na tela pública (garantido pela view, mas o app também não deve solicitá-lo).

### F5 — Atualização ao vivo (`/`)
- F5.1 Assinar mudanças na tabela `itens` via **Realtime**.
- F5.2 Em qualquer evento, **re-buscar a view** `itens_publicos` (não confiar no payload, para nunca trazer nomes).
- F5.3 Se o Realtime falhar/indisponível, o app continua funcionando (re-busca ao focar a aba / após cada reserva).

### F6 — Acesso admin (`/admin`)
- F6.1 Tela de **senha** (Input + botão). Comparar com `VITE_ADMIN_PASSWORD`.
- F6.2 Senha correta libera o painel **na sessão** (estado em memória; pode reaparecer ao recarregar — aceitável).
- F6.3 Senha errada: mensagem de erro, sem travar.

### F7 — Painel admin (`/admin`)
- F7.1 Carregar **todos** os itens da tabela `itens` (com `reservado_por`, `quantidade`, `reservado_em`).
- F7.2 Exibir em **tabela**: Item · Categoria · Quem vai levar · Qtd · Reservado em.
- F7.3 Mostrar **resumo** no topo: total, reservados, faltando.
- F7.4 (Opcional) ordenar/filtrar por categoria e por "só reservados".

### F8 — Export Excel (`/admin`)
- F8.1 Botão **"Baixar Excel"** gera um `.xlsx` com SheetJS, no navegador.
- F8.2 Colunas: `Item`, `Categoria`, `Quem vai levar`, `Quantidade`, `Reservado em` (data/hora formatada PT-BR).
- F8.3 Nome do arquivo: `cha-davi-deborah-AAAA-MM-DD.xlsx`.
- F8.4 Incluir **todos** os itens (reservados e não), para ver também o que falta.

### F9 — Surpresa / metadados
- F9.1 `document.title` = **"Lista de Presentes"** em todas as rotas.
- F9.2 `<meta name="description">`, OpenGraph e Twitter cards neutros ("Lista de Presentes"). **Sem** "SURPRESA", "Davi", "Deborah" nos metadados/preview.
- F9.3 `favicon` neutro (um presente/coração genérico serve).

---

## 6. Requisitos não-funcionais

- **Mobile-first:** maioria abrirá no celular. Alvos de toque ≥ 44px; layout fluido até ~360px.
- **Performance:** lista de ~50 itens; carregamento inicial < 2s em 4G. Sem libs pesadas desnecessárias.
- **Acessibilidade:** contraste adequado (ver paleta no design doc), labels em inputs, foco visível, Dialog acessível (shadcn já cobre).
- **Idioma:** todo o texto em **Português do Brasil**.
- **Segurança (consciente):**
  - RLS ligado; convidado só lê a view e só escreve via RPC (não altera a tabela direto).
  - Senha de admin é client-side (fraca por natureza) — proteção real é link secreto + senha do Supabase. Não tratar como cofre.
  - **Nunca** usar a *secret key* do Supabase no frontend.
- **Resiliência:** toda chamada ao Supabase em `try/catch` com feedback; falhas não quebram a UI.

---

## 7. Modelo de dados (resumo — detalhe completo no `SETUP.md`)

**Tabela `itens`**
`id` (bigint), `nome` (text), `categoria` (text), `reservado_por` (text, null=livre), `quantidade` (int), `reservado_em` (timestamptz), `criado_em` (timestamptz).

**View `itens_publicos`** (consumida pelo convidado — **sem nomes**)
`id`, `nome`, `categoria`, `reservado` (bool).

**Função RPC `reservar_item(p_item_id bigint, p_nome text, p_quantidade int)`**
Reserva **atômica**: só efetiva se o item ainda estiver livre (`where reservado_por is null`). Lança `ITEM_INDISPONIVEL` se já foi pego e `NOME_OBRIGATORIO` se o nome vier vazio. É o mecanismo que resolve duas pessoas clicando no mesmo item ao mesmo tempo.

---

## 8. Edge cases (precisam ser tratados)

1. **Dois convidados, mesmo item, quase simultâneo** → a função RPC garante 1 vencedor; o outro recebe `ITEM_INDISPONIVEL` → toast amigável + refresh.
2. **Item reservado entre abrir o modal e confirmar** → mesma `ITEM_INDISPONIVEL` no confirm.
3. **Recarregar a página** → todo o estado vem do banco (nada em localStorage).
4. **Nome vazio ou só espaços** → bloquear confirmação.
5. **Quantidade inválida** (0, negativa, vazia, não numérica) → forçar mínimo 1.
6. **Filtro resulta em lista vazia** → empty state ("Nenhum item por aqui com esse filtro 🙂").
7. **Sem internet / Supabase fora** → toasts de erro; UI não trava; permitir retry.
8. **Realtime indisponível** → cair para re-busca (ao focar aba / após reserva).
9. **Senha de admin errada** → erro inline, sem vazar a senha.
10. **Lista toda reservada** → contador "0 disponíveis" + estado vazio simpático na visão "só disponíveis".

---

## 9. Critérios de aceitação (checklist)

- [ ] `/` mostra foto + título festivo e a lista agrupada nas 8 categorias na ordem definida.
- [ ] "Mostrar só disponíveis" vem **ligado**; desligar revela os reservados (apagados, sem nome).
- [ ] Filtro de categoria funciona e combina com o de disponibilidade; contador correto.
- [ ] Reservar pede nome + quantidade (default 1), confirma via RPC e some pra todos.
- [ ] Tentar pegar item já reservado mostra aviso amigável (não erro cru).
- [ ] Nenhum nome de convidado aparece na tela pública.
- [ ] Atualização ao vivo: item reservado por outra pessoa escurece sem refresh manual.
- [ ] `/admin` exige senha; com a senha certa mostra a tabela completa + resumo.
- [ ] "Baixar Excel" gera `.xlsx` com todas as colunas e todos os itens.
- [ ] Aba do navegador e preview de link mostram só "Lista de Presentes".
- [ ] Tudo legível e usável num celular de ~360px de largura.

---

## 10. Fora de escopo (MVP)

Login/cadastro de convidado · convidado desmarcar a própria reserva (organizador libera via SQL — ver `SETUP.md`) · notificações/e-mails · edição de itens pela UI · multi-idioma · analytics · página de agradecimento pós-evento.
