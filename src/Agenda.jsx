import { useEffect, useState } from 'react'
import { Stethoscope, FlaskConical, ChevronLeft, CheckCircle2, Plus } from 'lucide-react'
import { supabase } from './supabase'
import { buscarAgendamentos, futuros, mensagemDeErro } from './agendamentos'
import { proximosDias, fmtHora, fmtDataLonga } from './datas'
import CartaoAtendimento from './CartaoAtendimento'

/* ---------- Fluxo de novo agendamento ---------- */
function NovoAgendamento({ onVoltar, onConcluido }) {
  const dias = proximosDias(14)
  const [tipo, setTipo] = useState(null)
  const [esps, setEsps] = useState([])
  const [esp, setEsp] = useState(null)
  const [dia, setDia] = useState(dias[0]?.iso)
  const [slots, setSlots] = useState(null)
  const [slot, setSlot] = useState(null)
  const [tick, setTick] = useState(0)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [feito, setFeito] = useState(false)

  useEffect(() => {
    supabase.from('especialidades').select('id,nome,tipo').order('nome').then(({ data }) => setEsps(data ?? []))
  }, [])

  useEffect(() => {
    if (!esp) return
    let cancelado = false
    setSlots(null)
    supabase.rpc('horarios_livres', { p_especialidade_id: esp.id, p_dia: dia }).then(({ data, error }) => {
      if (cancelado) return
      if (error) { setErro(mensagemDeErro(error)); setSlots([]) } else setSlots(data)
    })
    return () => { cancelado = true }
  }, [esp, dia, tick])

  const voltar = () => {
    setErro('')
    if (slot) return setSlot(null)
    if (esp) { setSlots(null); return setEsp(null) }
    if (tipo) return setTipo(null)
    onVoltar()
  }

  async function confirmar() {
    setErro(''); setEnviando(true)
    const { error } = await supabase.rpc('agendar', { p_horario_id: slot.horario_id })
    setEnviando(false)
    if (error) { setErro(mensagemDeErro(error)); setSlot(null); setTick((t) => t + 1); return }
    setFeito(true)
  }

  if (feito) {
    return (
      <>
        <div className="sucesso">
          <CheckCircle2 size={44} />
          <h1>Atendimento marcado</h1>
          <p>{esp.nome}<br />{fmtDataLonga(slot.inicio)}, {fmtHora(slot.inicio)}<br />{slot.unidade_nome}</p>
        </div>
        <button className="btn" onClick={onConcluido}>Ver meus atendimentos</button>
      </>
    )
  }

  const grupos = (slots ?? []).reduce((acc, s) => {
    (acc[s.unidade_nome] ||= { endereco: s.unidade_endereco, itens: [] }).itens.push(s)
    return acc
  }, {})

  return (
    <>
      <button className="voltar" onClick={voltar}><ChevronLeft size={18} /> Voltar</button>

      {!tipo && (
        <>
          <h1>O que você precisa?</h1>
          <div className="rapido">
            <button className="card azul" onClick={() => setTipo('consulta')}><Stethoscope size={22} />Consulta médica</button>
            <button className="card verde-claro" onClick={() => setTipo('exame')}><FlaskConical size={22} />Exames</button>
          </div>
        </>
      )}

      {tipo && !esp && (
        <>
          <h1>{tipo === 'consulta' ? 'Qual especialidade?' : 'Qual exame?'}</h1>
          <div className="opcoes">
            {esps.filter((e) => e.tipo === tipo).map((e) => (
              <button key={e.id} className="opcao" onClick={() => setEsp(e)}>{e.nome}</button>
            ))}
          </div>
        </>
      )}

      {esp && !slot && (
        <>
          <h1>{esp.nome}</h1>
          <h2 className="titulo">Escolha o dia</h2>
          <div className="dias" role="group" aria-label="Dia do atendimento">
            {dias.map((d) => (
              <button key={d.iso} className={`dia ${dia === d.iso ? 'ativo' : ''}`} aria-pressed={dia === d.iso} onClick={() => setDia(d.iso)}>
                <small>{d.sem}</small><strong>{d.dia}</strong><small>{d.mes}</small>
              </button>
            ))}
          </div>
          <h2 className="titulo">Horários e unidades</h2>
          {erro && <p className="erro" role="alert">{erro}</p>}
          {slots === null && <p className="vazio">Buscando horários…</p>}
          {slots?.length === 0 && <p className="vazio">Não há horários livres nesse dia. Tente outro dia.</p>}
          {Object.entries(grupos).map(([nome, g]) => (
            <section key={nome} className="unidade">
              <strong>{nome}</strong>
              <small>{g.endereco}</small>
              <div className="horas">
                {g.itens.map((s) => (
                  <button key={s.horario_id} className="hora" onClick={() => setSlot(s)}>{fmtHora(s.inicio)}</button>
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      {slot && (
        <>
          <h1>Confirmar atendimento</h1>
          <section className="atend">
            <strong>{esp.nome}</strong>
            <span className="atend-linha">{fmtDataLonga(slot.inicio)}, {fmtHora(slot.inicio)}</span>
            <span className="atend-linha">{slot.unidade_nome} · {slot.unidade_endereco}</span>
          </section>
          {erro && <p className="erro" role="alert">{erro}</p>}
          <button className="btn" onClick={confirmar} disabled={enviando}>{enviando ? 'Marcando…' : 'Confirmar agendamento'}</button>
        </>
      )}
    </>
  )
}

/* ---------- Tela da aba Agenda ---------- */
export default function Agenda() {
  const [lista, setLista] = useState(null)
  const [novo, setNovo] = useState(false)
  const [cancelando, setCancelando] = useState(null)
  const [erro, setErro] = useState('')

  const carregar = () =>
    buscarAgendamentos()
      .then((d) => setLista(futuros(d)))
      .catch(() => { setErro('Não foi possível carregar seus atendimentos.'); setLista([]) })

  useEffect(() => { carregar() }, [])

  async function cancelar(id) {
    setErro('')
    const { error } = await supabase.rpc('cancelar_agendamento', { p_id: id })
    if (error) setErro(mensagemDeErro(error))
    setCancelando(null)
    carregar()
  }

  if (novo) return <NovoAgendamento onVoltar={() => setNovo(false)} onConcluido={() => { setNovo(false); setLista(null); carregar() }} />

  return (
    <>
      <h1>Agenda</h1>
      <button className="btn" onClick={() => setNovo(true)}><Plus size={18} /> Marcar novo atendimento</button>

      <h2 className="titulo">Próximos atendimentos</h2>
      {erro && <p className="erro" role="alert">{erro}</p>}
      {lista === null && <p className="vazio">Carregando…</p>}
      {lista?.length === 0 && <p className="vazio">Você ainda não tem atendimentos marcados.</p>}
      {lista?.map((a) => (
        <CartaoAtendimento key={a.id} ag={a}>
          {cancelando === a.id ? (
            <div className="confirma-cancel">
              <span>Cancelar este atendimento?</span>
              <button className="mini perigo" onClick={() => cancelar(a.id)}>Sim, cancelar</button>
              <button className="mini" onClick={() => setCancelando(null)}>Manter</button>
            </div>
          ) : (
            <button className="mini perigo" onClick={() => setCancelando(a.id)}>Cancelar</button>
          )}
        </CartaoAtendimento>
      ))}
    </>
  )
}
