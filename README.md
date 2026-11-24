# AgendaSaúde

App público de saúde para agendar consultas, acompanhar o histórico médico e apoiar a prevenção, com foco em acessibilidade e proteção de dados (LGPD). TCC – Desenvolvimento de Sistemas, SENAI. Squad Bando de Loucos.

## Tecnologias
- Front-end: React + Vite
- Back-end e banco: Supabase (Auth + Postgres com RLS)
- Deploy: Vercel

## Como rodar
1. `npm install`
2. Crie um projeto no [Supabase](https://supabase.com) e rode `supabase/schema.sql` no SQL Editor.
3. Em Authentication > Providers > Email, desative **Confirm email**.
4. Copie `.env.example` para `.env` e preencha a URL e a chave anon. **Nunca suba o `.env` para o GitHub.**
5. `npm run dev`

## Funcionalidades (Sprint 1)
- Cadastro (nome, CPF, nascimento, telefone, e-mail, senha) e login
- Aviso de CPF já cadastrado, com recuperação de senha
- Termo de consentimento LGPD, com aceite registrado no banco
- Estrutura de telas: Início, Agenda, Histórico e Perfil
