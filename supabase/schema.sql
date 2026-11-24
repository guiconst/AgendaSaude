-- Rode no SQL Editor do Supabase.
-- Em Authentication > Providers > Email, desative "Confirm email" para o usuário entrar direto após o cadastro.

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  nome text not null,
  cpf text not null unique,
  data_nascimento date not null,
  telefone text not null,
  created_at timestamptz default now()
);

create table public.consentimentos (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  versao text not null,
  aceito_em timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.consentimentos enable row level security;

create policy "ver proprio perfil" on public.profiles for select using (auth.uid() = id);
create policy "ver proprio consentimento" on public.consentimentos for select using (auth.uid() = user_id);
create policy "registrar proprio consentimento" on public.consentimentos for insert with check (auth.uid() = user_id);

-- Cria o perfil a partir dos dados enviados no cadastro
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome, cpf, data_nascimento, telefone)
  values (new.id, new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'cpf',
          (new.raw_user_meta_data->>'data_nascimento')::date, new.raw_user_meta_data->>'telefone');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Permite ao app checar se o CPF já tem conta (sem expor dados)
create function public.cpf_existe(c text) returns boolean
language sql security definer set search_path = public as $$
  select exists (select 1 from public.profiles where cpf = c);
$$;
grant execute on function public.cpf_existe(text) to anon, authenticated;
