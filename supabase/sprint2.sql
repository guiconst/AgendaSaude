-- Sprint 2 — Agendamento e Histórico
-- Rode no SQL Editor do Supabase DEPOIS do schema.sql (já aplicado no projeto de produção).

-- ========== Catálogos ==========
create table public.especialidades (
  id int generated always as identity primary key,
  nome text not null unique,
  tipo text not null check (tipo in ('consulta','exame'))
);

create table public.unidades (
  id int generated always as identity primary key,
  nome text not null unique,
  endereco text not null
);

-- ========== Horários e agendamentos ==========
create table public.horarios (
  id bigint generated always as identity primary key,
  especialidade_id int not null references public.especialidades on delete cascade,
  unidade_id int not null references public.unidades on delete cascade,
  inicio timestamptz not null,
  unique (especialidade_id, unidade_id, inicio)
);
create index horarios_busca_idx on public.horarios (especialidade_id, inicio);

create table public.agendamentos (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  horario_id bigint not null references public.horarios on delete restrict,
  status text not null default 'confirmado' check (status in ('confirmado','cancelado')),
  criado_em timestamptz not null default now(),
  cancelado_em timestamptz
);
-- Impede double-booking: só um agendamento confirmado por horário
create unique index agendamentos_horario_confirmado_uq
  on public.agendamentos (horario_id) where status = 'confirmado';
create index agendamentos_user_idx on public.agendamentos (user_id);

-- ========== Registros manuais de saúde (vacinas, exames, etc.) ==========
create table public.registros_saude (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  tipo text not null check (tipo in ('vacina','exame','consulta','outro')),
  titulo text not null check (char_length(titulo) between 1 and 120),
  data date not null,
  local text check (char_length(local) <= 120),
  observacao text check (char_length(observacao) <= 500),
  criado_em timestamptz not null default now()
);
create index registros_saude_user_idx on public.registros_saude (user_id, data desc);

-- ========== RLS ==========
alter table public.especialidades enable row level security;
alter table public.unidades enable row level security;
alter table public.horarios enable row level security;
alter table public.agendamentos enable row level security;
alter table public.registros_saude enable row level security;

create policy "logado ve especialidades" on public.especialidades for select to authenticated using (true);
create policy "logado ve unidades" on public.unidades for select to authenticated using (true);
create policy "logado ve horarios" on public.horarios for select to authenticated using (true);

-- agendamentos: só leitura do próprio; criar/cancelar apenas via RPC
create policy "ver proprios agendamentos" on public.agendamentos for select to authenticated using (auth.uid() = user_id);

create policy "ver proprios registros" on public.registros_saude for select to authenticated using (auth.uid() = user_id);
create policy "criar proprios registros" on public.registros_saude for insert to authenticated with check (auth.uid() = user_id);
create policy "editar proprios registros" on public.registros_saude for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "apagar proprios registros" on public.registros_saude for delete to authenticated using (auth.uid() = user_id);

-- ========== Funções ==========
-- Horários livres de uma especialidade em um dia
create function public.horarios_livres(p_especialidade_id int, p_dia date)
returns table (horario_id bigint, unidade_id int, unidade_nome text, unidade_endereco text, inicio timestamptz)
language sql stable security definer set search_path = public as $$
  select h.id, u.id, u.nome, u.endereco, h.inicio
  from public.horarios h
  join public.unidades u on u.id = h.unidade_id
  where h.especialidade_id = p_especialidade_id
    and (h.inicio at time zone 'America/Sao_Paulo')::date = p_dia
    and h.inicio > now()
    and not exists (select 1 from public.agendamentos a where a.horario_id = h.id and a.status = 'confirmado')
  order by u.nome, h.inicio;
$$;

-- Agenda um horário para o usuário logado
create function public.agendar(p_horario_id bigint) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_inicio timestamptz;
  v_id bigint;
begin
  if v_uid is null then raise exception 'nao_autenticado'; end if;
  select inicio into v_inicio from public.horarios where id = p_horario_id;
  if v_inicio is null then raise exception 'horario_inexistente'; end if;
  if v_inicio <= now() then raise exception 'horario_passado'; end if;
  if exists (
    select 1 from public.agendamentos a join public.horarios h on h.id = a.horario_id
    where a.user_id = v_uid and a.status = 'confirmado' and h.inicio = v_inicio
  ) then raise exception 'conflito_usuario'; end if;
  begin
    insert into public.agendamentos (user_id, horario_id) values (v_uid, p_horario_id) returning id into v_id;
  exception when unique_violation then
    raise exception 'horario_indisponivel';
  end;
  return v_id;
end $$;

-- Cancela um agendamento do usuário logado (só se ainda for no futuro)
create function public.cancelar_agendamento(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'nao_autenticado'; end if;
  update public.agendamentos a
     set status = 'cancelado', cancelado_em = now()
   where a.id = p_id and a.user_id = v_uid and a.status = 'confirmado'
     and exists (select 1 from public.horarios h where h.id = a.horario_id and h.inicio > now());
  if not found then raise exception 'nao_pode_cancelar'; end if;
end $$;

-- Gera horários (seg–sex) para os próximos dias. Idempotente. Uso interno.
create function public.gerar_horarios(p_dias int default 21) returns int
language plpgsql security definer set search_path = public as $$
declare v_qtd int;
begin
  insert into public.horarios (especialidade_id, unidade_id, inicio)
  select e.id, u.id, ((hoje + n) + hr) at time zone 'America/Sao_Paulo'
  from (select (now() at time zone 'America/Sao_Paulo')::date as hoje) t
  cross join generate_series(0, p_dias) n
  cross join public.especialidades e
  cross join public.unidades u
  cross join unnest(array['08:00','09:00','10:00','11:00','14:00','15:00','16:00']::time[]) hr
  where extract(isodow from (hoje + n)) < 6
    and (((hoje + n) + hr) at time zone 'America/Sao_Paulo') > now()
  on conflict do nothing;
  get diagnostics v_qtd = row_count;
  return v_qtd;
end $$;

-- Permissões: só usuários logados chamam as RPCs; gerar_horarios fica interna
revoke execute on function public.horarios_livres(int, date) from public, anon;
revoke execute on function public.agendar(bigint) from public, anon;
revoke execute on function public.cancelar_agendamento(bigint) from public, anon;
revoke execute on function public.gerar_horarios(int) from public, anon, authenticated;
grant execute on function public.horarios_livres(int, date) to authenticated;
grant execute on function public.agendar(bigint) to authenticated;
grant execute on function public.cancelar_agendamento(bigint) to authenticated;

-- ========== Dados de exemplo ==========
insert into public.especialidades (nome, tipo) values
  ('Clínico geral','consulta'), ('Pediatria','consulta'), ('Ginecologia','consulta'),
  ('Cardiologia','consulta'), ('Dermatologia','consulta'), ('Ortopedia','consulta'), ('Oftalmologia','consulta'),
  ('Exame de sangue','exame'), ('Raio-X','exame'), ('Ultrassom','exame'), ('Eletrocardiograma','exame');

insert into public.unidades (nome, endereco) values
  ('UBS Centro','Rua das Flores, 120 - Centro'),
  ('UBS Jardim Primavera','Av. dos Ipês, 450 - Jardim Primavera'),
  ('Policlínica Municipal','Rua da Saúde, 800 - Vila Nova');

select public.gerar_horarios(21);

-- Gera horários novos todo dia às 6h (UTC) para a agenda nunca ficar vazia
create extension if not exists pg_cron;
select cron.schedule('gerar-horarios-diario', '0 6 * * *', $$select public.gerar_horarios(21)$$);
