import { useEffect, useState } from 'react'
import { Home, CalendarDays, Clock, User, Stethoscope, ClipboardCheck, ChevronRight, ShieldCheck, LogOut } from 'lucide-react'
import { supabase } from './supabase'

const abas = [
  { id: 'inicio', nome: 'Início', Icone: Home },
  { id: 'agenda', nome: 'Agenda', Icone: CalendarDays },
  { id: 'historico', nome: 'Histórico', Icone: Clock },
  { id: 'perfil', nome: 'Perfil', Icone: User },
]

export default function Shell({ user }) {
  const [aba, setAba] = useState('inicio')
  const [nome, setNome] = useState('')

  useEffect(() => {
    supabase.from('profiles').select('nome').eq('id', user.id).single().then(({ data }) => setNome(data?.nome ?? ''))
  }, [user.id])

  const primeiro = nome.split(' ')[0]

  return (
    <>
      <main className="tela com-nav">
        {aba === 'inicio' && (
          <>
            <p className="eyebrow">AgendaSaúde</p>
            <h1>Olá, {primeiro}</h1>
            <p className="sub">Como você está se sentindo hoje?</p>
            <section className="hero">
              <small>Cuidado seguro</small>
              <h2>Sua saúde<br />no seu tempo.</h2>
              <p>Agende atendimentos e acompanhe tudo em um só lugar.</p>
              <button className="btn verde" onClick={() => setAba('agenda')}>Agendar agora <ChevronRight size={16} /></button>
            </section>
            <h2 className="titulo">Acesso rápido</h2>
            <div className="rapido">
              <button className="card azul" onClick={() => setAba('agenda')}><Stethoscope size={22} />Marcar consulta</button>
              <button className="card verde-claro" onClick={() => setAba('historico')}><ClipboardCheck size={22} />Meus exames</button>
            </div>
            <h2 className="titulo">Próximo atendimento</h2>
            <p className="vazio">Você ainda não tem consultas marcadas.</p>
          </>
        )}

        {aba === 'agenda' && (
          <>
            <h1>Agende seu atendimento</h1>
            <p className="vazio">Em breve: escolha de especialidade, dia e horário (Sprint 2).</p>
          </>
        )}

        {aba === 'historico' && (
          <>
            <h1>Histórico de saúde</h1>
            <div className="aviso-verde"><ShieldCheck size={18} /> Seus dados são protegidos e visíveis apenas para você.</div>
            <p className="vazio">Ainda não há registros por aqui. Quando você tiver consultas e exames, eles aparecem neste lugar.</p>
          </>
        )}

        {aba === 'perfil' && (
          <>
            <h1>Meu perfil</h1>
            <section className="perfil">
              <span className="avatar">{nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}</span>
              <div><strong>{nome}</strong><br /><small>{user.email}</small></div>
            </section>
            <button className="btn sair" onClick={() => supabase.auth.signOut()}><LogOut size={16} /> Sair da conta</button>
          </>
        )}
      </main>

      <nav className="nav">
        {abas.map(({ id, nome, Icone }) => (
          <button key={id} className={aba === id ? 'ativa' : ''} onClick={() => setAba(id)}>
            <Icone size={22} />{nome}
          </button>
        ))}
      </nav>
    </>
  )
}
