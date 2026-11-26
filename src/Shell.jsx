import { useEffect, useState } from 'react'
import { Home, CalendarDays, Clock, User } from 'lucide-react'
import { supabase } from './supabase'
import Inicio from './Inicio'
import Agenda from './Agenda'
import Historico from './Historico'
import Perfil from './Perfil'

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

  return (
    <>
      <main className="tela com-nav">
        {aba === 'inicio' && <Inicio nome={nome} irPara={setAba} />}
        {aba === 'agenda' && <Agenda />}
        {aba === 'historico' && <Historico />}
        {aba === 'perfil' && <Perfil user={user} nome={nome} />}
      </main>

      <nav className="nav">
        {abas.map(({ id, nome, Icone }) => (
          <button key={id} className={aba === id ? 'ativa' : ''} aria-current={aba === id ? 'page' : undefined} onClick={() => setAba(id)}>
            <Icone size={22} />{nome}
          </button>
        ))}
      </nav>
    </>
  )
}
