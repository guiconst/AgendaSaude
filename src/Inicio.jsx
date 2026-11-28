import { useEffect, useState } from 'react'
import { Stethoscope, ClipboardCheck, ChevronRight } from 'lucide-react'
import { buscarAgendamentos, futuros } from './agendamentos'
import CartaoAtendimento from './CartaoAtendimento'
import Logo from './Logo'

export default function Inicio({ nome, irPara }) {
  const [proximo, setProximo] = useState(undefined)

  useEffect(() => {
    buscarAgendamentos().then((d) => setProximo(futuros(d)[0] ?? null)).catch(() => setProximo(null))
  }, [])

  return (
    <>
      <Logo tamanho="pequena" />
      <h1>Olá, {nome.split(' ')[0]}</h1>
      <p className="sub">Como você está se sentindo hoje?</p>
      <section className="hero">
        <small>Cuidado seguro</small>
        <h2>Sua saúde<br />no seu tempo.</h2>
        <p>Agende atendimentos e acompanhe tudo em um só lugar.</p>
        <button className="btn verde" onClick={() => irPara('agenda')}>Agendar agora <ChevronRight size={16} /></button>
      </section>
      <h2 className="titulo">Acesso rápido</h2>
      <div className="rapido">
        <button className="card azul" onClick={() => irPara('agenda')}><Stethoscope size={22} />Marcar consulta</button>
        <button className="card verde-claro" onClick={() => irPara('historico')}><ClipboardCheck size={22} />Meus exames</button>
      </div>
      <h2 className="titulo">Próximo atendimento</h2>
      {proximo === undefined && <p className="vazio">Carregando…</p>}
      {proximo === null && <p className="vazio">Você ainda não tem consultas marcadas.</p>}
      {proximo && <CartaoAtendimento ag={proximo} />}
    </>
  )
}
