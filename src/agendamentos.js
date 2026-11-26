import { supabase } from './supabase'

// Todos os agendamentos do usuário (a RLS já filtra pelo dono), com horário, especialidade e unidade
export async function buscarAgendamentos() {
  const { data, error } = await supabase
    .from('agendamentos')
    .select('id,status,horarios!inner(inicio,especialidades(nome,tipo),unidades(nome,endereco))')
  if (error) throw error
  return data
}

export const futuros = (lista) =>
  lista
    .filter((a) => a.status === 'confirmado' && new Date(a.horarios.inicio) > new Date())
    .sort((a, b) => new Date(a.horarios.inicio) - new Date(b.horarios.inicio))

const MENSAGENS = {
  horario_indisponivel: 'Esse horário acabou de ser reservado por outra pessoa. Escolha outro.',
  conflito_usuario: 'Você já tem um atendimento marcado nesse mesmo horário.',
  horario_passado: 'Esse horário já passou. Escolha outro.',
  nao_pode_cancelar: 'Não foi possível cancelar. O atendimento pode já ter acontecido ou sido cancelado.',
  nao_autenticado: 'Sua sessão expirou. Entre de novo.',
}

export const mensagemDeErro = (error) => {
  const chave = Object.keys(MENSAGENS).find((k) => error?.message?.includes(k))
  return chave ? MENSAGENS[chave] : 'Algo deu errado. Tente de novo.'
}
