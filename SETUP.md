# SETUP — Chá de Panela do Davi e Deborah

Guia passo a passo para colocar o site no ar: criar a conta e o banco no **Supabase**, e publicar o frontend na **Vercel**.

> **Stack final:** React + Vite (frontend) na Vercel · Supabase (Postgres + API automática) como banco.
> Sem backend próprio, sem Docker, sem VPS.

---

## Visão geral da arquitetura

```
  Convidado (celular)                 Você (admin)
        │                                  │
        ▼                                  ▼
 ┌───────────────────────────────────────────────┐
 │           Site React na Vercel                 │
 │   /         → lista de itens (sem nomes)        │
 │   /admin    → senha → ver tudo + baixar Excel   │
 └───────────────────────────────────────────────┘
        │ chama a API automática
        ▼
 ┌───────────────────────────────────────────────┐
 │                   SUPABASE                      │
 │   Tabela  itens          (dados completos)      │
 │   View    itens_publicos (sem o nome de quem    │
 │                           pegou)                │
 │   Função  reservar_item  (reserva atômica)      │
 └───────────────────────────────────────────────┘
```

**Por que a reserva precisa do banco:** o requisito "o item some pra todos quando alguém pega" é estado compartilhado entre pessoas diferentes. Isso só funciona com persistência central — por isso o Supabase, e não só o navegador.

---

## PARTE 1 — Criar conta e projeto no Supabase

1. Acesse **https://supabase.com** e clique em **Start your project** / **Sign in**.
2. Faça login com o **GitHub** (mais simples, já que o deploy também usa GitHub).
3. Crie uma organização quando for pedido (nome livre, ex: "Pessoal", plano **Free**).
4. Clique em **New project** e preencha:
   - **Name:** `cha-davi-deborah`
   - **Database Password:** gere uma senha forte e **guarde num gerenciador de senhas**. Você quase não vai usar, mas se perder não dá pra recuperar — só resetar.
   - **Region:** escolha **South America (São Paulo)** — é a mais perto, fica mais rápido.
   - **Plan:** Free.
5. Clique em **Create new project** e espere ~2 minutos enquanto ele provisiona.

---

## PARTE 2 — Montar o banco (SQL Editor)

No menu lateral, abra **SQL Editor** → **New query**. Cole cada bloco abaixo e clique em **Run** (pode rodar tudo de uma vez, na ordem).

### 2.1 — Tabela principal

```sql
create table public.itens (
  id            bigint generated always as identity primary key,
  nome          text not null,
  categoria     text not null,
  reservado_por text,          -- NULL = item disponível
  quantidade    integer,       -- quantidade que o convidado vai levar
  reservado_em  timestamptz,   -- quando foi reservado
  criado_em     timestamptz not null default now()
);
```

### 2.2 — View pública (esconde o nome de quem pegou)

Os convidados leem **desta view**, que não expõe o campo `reservado_por`. Eles só sabem se o item está livre ou não.

```sql
create view public.itens_publicos
with (security_invoker = on)
as
select
  id,
  nome,
  categoria,
  (reservado_por is not null) as reservado
from public.itens;

grant select on public.itens_publicos to anon;
```

### 2.3 — Segurança (RLS): ninguém escreve direto na tabela

Ligamos o Row Level Security. Liberamos **só leitura** para o público; escrever só é possível pela função do passo 2.4 (que valida se o item está livre).

```sql
alter table public.itens enable row level security;

-- Leitura liberada (necessária para a lista e para o /admin no modo frontend-only)
create policy "leitura_publica" on public.itens
  for select
  to anon
  using (true);

-- NÃO criamos policy de insert/update/delete:
-- assim o convidado não consegue alterar a tabela diretamente pela API.
```

### 2.4 — Função de reserva atômica (resolve a corrida por item)

Esta é a peça-chave. O `where reservado_por is null` garante que, se dois convidados clicarem no mesmo item quase ao mesmo tempo, **só o primeiro ganha**; o segundo recebe o erro `ITEM_INDISPONIVEL` e o site mostra "alguém acabou de pegar esse item".

```sql
create or replace function public.reservar_item(
  p_item_id    bigint,
  p_nome       text,
  p_quantidade integer default 1
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_afetados int;
begin
  if coalesce(trim(p_nome), '') = '' then
    raise exception 'NOME_OBRIGATORIO';
  end if;

  update public.itens
     set reservado_por = trim(p_nome),
         quantidade    = greatest(coalesce(p_quantidade, 1), 1),
         reservado_em  = now()
   where id = p_item_id
     and reservado_por is null;   -- só reserva se ainda estiver livre

  get diagnostics v_afetados = row_count;

  if v_afetados = 0 then
    raise exception 'ITEM_INDISPONIVEL';
  end if;

  return true;
end;
$$;

grant execute on function public.reservar_item(bigint, text, integer) to anon;
```

### 2.5 — Carregar os 50 itens (seed)

```sql
insert into public.itens (nome, categoria) values
-- Grãos e Cereais
('Arroz', 'Grãos e Cereais'),
('Feijão carioca', 'Grãos e Cereais'),
('Feijão preto', 'Grãos e Cereais'),
('Aveia', 'Grãos e Cereais'),
('Fubá', 'Grãos e Cereais'),
('Milho de pipoca', 'Grãos e Cereais'),
-- Massas e Farinhas
('Macarrão espaguete', 'Massas e Farinhas'),
('Macarrão parafuso', 'Massas e Farinhas'),
('Farinha de trigo', 'Massas e Farinhas'),
('Farinha de rosca', 'Massas e Farinhas'),
('Fermento em pó', 'Massas e Farinhas'),
-- Enlatados e Conservas
('Milho verde', 'Enlatados e Conservas'),
('Ervilha', 'Enlatados e Conservas'),
('Batata palha', 'Enlatados e Conservas'),
('Molho de tomate', 'Enlatados e Conservas'),
('Creme de leite', 'Enlatados e Conservas'),
('Leite condensado', 'Enlatados e Conservas'),
('Doce em calda (pêssego)', 'Enlatados e Conservas'),
-- Temperos e Óleos
('Açúcar', 'Temperos e Óleos'),
('Sal', 'Temperos e Óleos'),
('Óleo de soja', 'Temperos e Óleos'),
('Azeite', 'Temperos e Óleos'),
('Mostarda', 'Temperos e Óleos'),
('Ketchup', 'Temperos e Óleos'),
('Maionese', 'Temperos e Óleos'),
-- Matinais e Lanches
('Café', 'Matinais e Lanches'),
('Café solúvel', 'Matinais e Lanches'),
('Leite em pó', 'Matinais e Lanches'),
('Chá', 'Matinais e Lanches'),
('Filtro de café', 'Matinais e Lanches'),
('Biscoito doce', 'Matinais e Lanches'),
('Biscoito salgado', 'Matinais e Lanches'),
-- Limpeza
('Saco de lixo', 'Limpeza'),
('Detergente', 'Limpeza'),
('Vinagre de álcool', 'Limpeza'),
('Perfex / pano de limpeza', 'Limpeza'),
('Esponja de limpeza', 'Limpeza'),
('Bombril', 'Limpeza'),
-- Higiene Pessoal
('Papel higiênico', 'Higiene Pessoal'),
('Sabonete', 'Higiene Pessoal'),
('Sabonete líquido', 'Higiene Pessoal'),
('Creme dental', 'Higiene Pessoal'),
('Escovas de dentes', 'Higiene Pessoal'),
('Fio dental', 'Higiene Pessoal'),
-- Descartáveis e Utilidades
('Papel toalha', 'Descartáveis e Utilidades'),
('Guardanapo', 'Descartáveis e Utilidades'),
('Filme plástico', 'Descartáveis e Utilidades'),
('Papel alumínio', 'Descartáveis e Utilidades'),
('Fósforo', 'Descartáveis e Utilidades'),
('Eco bag (sacola de supermercado)', 'Descartáveis e Utilidades');
```

Confira em **Table Editor → itens**: devem aparecer 50 linhas.

### 2.6 — (Opcional) Realtime: itens "apagam" ao vivo

Sem isso o site funciona (atualiza quando o convidado abre/recarrega). Com isso, o item escurece na tela de todo mundo na hora, sem refresh.

```sql
alter publication supabase_realtime add table public.itens;
```

> No app, a gente vai escutar mudanças na tabela e **re-buscar a view** `itens_publicos` — assim o nome de quem pegou nunca chega na tela do convidado, mesmo via Realtime.

---

## PARTE 3 — Pegar a URL e a chave do projeto

1. No menu, vá em **Settings → API Keys**.
2. Na aba **API Keys**, copie o valor de **Publishable key** (formato `sb_publishable_...`).
   - Se o seu projeto for antigo e só tiver a aba **Legacy API Keys**, copie a **anon / public** key no lugar — funciona igual.
3. Vá em **Settings → Data API** (ou **Project Settings → API**) e copie a **Project URL** (`https://xxxxxxxx.supabase.co`).

Guarde os dois — vamos usar nas variáveis de ambiente.

> A publishable key **é feita para ficar no navegador** e é segura *desde que o RLS esteja ligado* — que é exatamente o que fizemos no passo 2.3.

---

## PARTE 4 — Variáveis de ambiente

No projeto React (na sua máquina), crie um arquivo **`.env.local`** na raiz:

```bash
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxx
VITE_ADMIN_PASSWORD=escolha-uma-senha-aqui
```

> O nome `VITE_SUPABASE_ANON_KEY` é só convenção — o valor dentro dele é a **publishable key** que você copiou.

**Importante:** `.env.local` **não vai pro Git**. Confirme que o `.gitignore` tem a linha `.env.local` (o template do Vite já inclui).

---

## PARTE 5 — Publicar na Vercel

> Pré-requisito: o código do projeto precisa estar num repositório no **GitHub**. Crie o repo, faça `git push`, e siga abaixo.

1. Acesse **https://vercel.com** e faça login com o GitHub.
2. **Add New… → Project**.
3. **Import** o repositório do chá de panela.
4. Na tela de configuração:
   - **Framework Preset:** `Vite` (a Vercel detecta sozinha).
   - **Build Command:** `npm run build` (padrão, não precisa mexer).
   - **Output Directory:** `dist` (padrão).
5. Abra **Environment Variables** e adicione as **três** variáveis (mesmos nomes e valores do `.env.local`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_PASSWORD`
6. Clique em **Deploy** e espere ~1 minuto.
7. Pronto — você recebe uma URL tipo `https://cha-davi-deborah.vercel.app`.

### Lembretes da Vercel
- **Mudou variável de ambiente?** Precisa **Redeploy** (Deployments → ⋯ → Redeploy). Variáveis do Vite são "assadas" no build.
- **Domínio próprio (opcional):** Project → **Settings → Domains** → Add.
- **Cada `git push` na branch principal** dispara um deploy novo automático.

---

## PARTE 6 — Exportar quem está levando o quê (Excel)

**Modo principal — pela página `/admin` do site:**
Acesse `https://...vercel.app/admin`, digite a senha (`VITE_ADMIN_PASSWORD`) e clique em **Baixar Excel**. Sai um `.xlsx` com item, categoria, quem vai levar, quantidade e horário.

**Plano B — direto no Supabase (zero código), se precisar:**
**Table Editor → itens →** botão **Export** → **CSV**. O CSV abre no Excel. Como só você tem a senha do Supabase, esse caminho é o "admin de verdade" protegido.

---

## PARTE 7 — Comandos SQL úteis (cole no SQL Editor quando precisar)

**Liberar um item** (convidado mudou de ideia e te avisou):
```sql
update public.itens
   set reservado_por = null, quantidade = null, reservado_em = null
 where nome = 'Macarrão espaguete';
```

**Ver tudo que já foi reservado:**
```sql
select nome, categoria, reservado_por, quantidade, reservado_em
  from public.itens
 where reservado_por is not null
 order by reservado_em desc;
```

**Zerar tudo** (use só pra testes, antes de divulgar o link!):
```sql
update public.itens
   set reservado_por = null, quantidade = null, reservado_em = null;
```

---

## ⚠️ Segurança — leia uma vez e siga em paz

Este é um projeto de evento, então a gente trocou robustez por simplicidade **de propósito**. O que isso significa na prática:

- **A senha do `/admin` é fraca.** Como o site é só frontend, qualquer pessoa que abra o código no navegador consegue ver a senha. O que protege de verdade é o **link do `/admin` ser secreto** (não divulgue) e a senha do **Supabase ser só sua**.
- **Sem login para convidados** é uma escolha consciente: alguém poderia marcar item com nome falso. Para um chá entre conhecidos, tudo bem.
- **Os nomes ficam escondidos na tela** (convidado lê a view `itens_publicos`, sem nomes) e a publishable key esconde o schema da API. Não é cofre, mas para o contexto está ótimo.
- **Nunca** use a *secret key* (`sb_secret_...`) no frontend — ela ignora todas as proteções. Só a publishable key vai pro navegador.

---

## Checklist final

- [ ] Projeto criado no Supabase (região São Paulo)
- [ ] Blocos SQL 2.1 a 2.5 rodados sem erro
- [ ] 50 itens aparecem no Table Editor
- [ ] (Opcional) Realtime ligado (2.6)
- [ ] URL + publishable key copiadas
- [ ] `.env.local` preenchido e fora do Git
- [ ] Repositório no GitHub
- [ ] Deploy na Vercel com as 3 variáveis de ambiente
- [ ] `/admin` abre, pede senha e baixa o Excel
- [ ] Teste de reserva feito e tabela zerada antes de divulgar
