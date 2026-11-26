import { useEffect, useState } from 'react'
import { ShieldCheck, Stethoscope, FlaskConical, Syringe, FileText, Plus, Trash2 } from 'lucide-react'
import { supabase } from './supabase'
import { buscarAgendamentos } from './agendamentos'
import { hoje, dataParaInstante, fmtDataCurta, fmtHora, fmtMesAno } from './datas'

const ICONES = { consulta: Stethoscope, exame: FlaskConical, vacina: Syringe, outro: FileText }
const FILTROS = [
  ['todos', 'Tudo'], ['consulta', 'Consultas'], ['exame', 'Exames'], ['vacina', 'Vacinas'], ['outro', 'Outros'],
]
const VAZIO = { tipo: 'vacina', titulo: '', data: '', local: '', observacao: '' }

export default function Historico() {
  const [itens, setItens] = useState(null)
  const [filtro, setFiltro] = useState('todos')
  const [adicionando, setAdicionando] = useState(false)
  const [f, setF] = useState(VAZIO)
  const [erro, setErro] = useState('')
  const [apagando, setApagando] = useState(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function carregar() {
    try {
      const [ags, regs] = await Promise.all([
        buscarAgendamentos(),
        supabase.from('registros_saude').select('*').then(({ data, error }) => { if (error) throw error; return data }),
      ])
      const agora = new Date()
      const deAgenda = ags
        .filter((a) => a.status === 'cancelado' || new Date(a.horarios.inicio) <= agora)
        .map((a) => ({
          chave: `a${a.id}`, origem: 'agenda', tipo: a.horarios.especialidades.tipo,
          titulo: a.horarios.especialidades.nome, instante: a.horarios.inicio,
          detalhe: `${fmtHora(a.horarios.inicio)} · ${a.horarios.unidades.nome}`,
          cancelado: a.status === 'cancelado',
        }))
      const manuais = regs.map((r) => ({
        chave: `r${r.id}`, id: r.id, origem: 'manual', tipo: r.tipo, titulo: r.titulo,
        instante: dataParaInstante(r.data),
        detalhe: [r.local, r.observacao].filter(Boolean).join(' · '),
      }))
      setItens([...deAgenda, ...manuais].sort((a, b) => new Date(b.instante) - new Date(a.instante)))
    } catch {
      setErro('Não foi possível carregar o histórico.')
      setItens([])
    }
  }
  useEffect(() => { carregar() }, [])

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    const { error } = await supabase.from('registros_saude').insert({
      tipo: f.tipo, titulo: f.titulo.trim(), data: f.data,
      local: f.local.trim() || null, observacao: f.observacao.trim() || null,
    })
    if (error) return setErro('Não foi possível salvar o registro. Confira os campos.')
    setF(VAZIO); setAdicionando(false); carregar()
  }

  async function apagar(id) {
    const { error } = await supabase.from('registros_saude').delete().eq('id', id)
    if (error) setErro('Não foi possível apagar o registro.')
    setApagando(null); carregar()
  }

  const visiveis = (itens ?? []).filter((i) => filtro === 'todos' || i.tipo === filtro)
  const meses = visiveis.reduce((acc, i) => {
    const m = fmtMesAno(i.instante)
    ;(acc[m] ||= []).push(i)
    return acc
  }, {})

  return (
    <>
      <h1>Histórico de saúde</h1>
      <div className="aviso-verde"><ShieldCheck size={18} /> Seus dados são protegidos e visíveis apenas para você.</div>

      {!adicionando && (
        <button className="btn" onClick={() => setAdicionando(true)}><Plus size={18} /> Adicionar registro</button>
      )}

      {adicionando && (
        <form className="form-registro" onSubmit={salvar}>
          <label className="campo">Tipo
            <select value={f.tipo} onChange={set('tipo')}>
              <option value="vacina">Vacina</option>
              <option value="exame">Exame</option>
              <option value="consulta">Consulta</option>
              <option value="outro">Outro</option>
            </select>
          </label>
          <label className="campo">Nome
            <input value={f.titulo} onChange={set('titulo')} maxLength={120} placeholder="Ex.: Vacina da gripe" required />
          </label>
          <label className="campo">Data
            <input type="date" value={f.data} onChange={set('data')} max={hoje()} required />
          </label>
          <label className="campo">Local (opcional)
            <input value={f.local} onChange={set('local')} maxLength={120} />
          </label>
          <label className="campo">Observação (opcional)
            <textarea value={f.observacao} onChange={set('observacao')} maxLength={500} rows={3} />
          </label>
          {erro && <p className="erro" role="alert">{erro}</p>}
          <button className="btn">Salvar registro</button>
          <button type="button" className="link" onClick={() => { setAdicionando(false); setErro('') }}>Cancelar</button>
        </form>
      )}

      {!adicionando && erro && <p className="erro" role="alert">{erro}</p>}

      <div className="filtros" role="group" aria-label="Filtrar por tipo">
        {FILTROS.map(([id, nome]) => (
          <button key={id} className={`chip ${filtro === id ? 'ativo' : ''}`} aria-pressed={filtro === id} onClick={() => setFiltro(id)}>{nome}</button>
        ))}
      </div>

      {itens === null && <p className="vazio">Carregando…</p>}
      {itens?.length === 0 && (
        <p className="vazio">Ainda não há registros por aqui. Consultas e exames que você agendar aparecem neste lugar depois da data, e você também pode adicionar vacinas e exames que já fez.</p>
      )}
      {itens?.length > 0 && visiveis.length === 0 && <p className="vazio">Nenhum registro desse tipo.</p>}

      {Object.entries(meses).map(([mes, lista]) => (
        <section key={mes}>
          <h2 className="titulo mes">{mes}</h2>
          {lista.map((i) => {
            const Icone = ICONES[i.tipo] ?? FileText
            return (
              <article key={i.chave} className={`registro ${i.cancelado ? 'cancelado' : ''}`}>
                <span className={`registro-icone ${i.tipo}`}><Icone size={20} /></span>
                <div className="registro-texto">
                  <strong>{i.titulo}{i.cancelado && <span className="selo"> Cancelado</span>}</strong>
                  <small>{fmtDataCurta(i.instante)}{i.detalhe ? ` · ${i.detalhe}` : ''}</small>
                </div>
                {i.origem === 'manual' && (apagando === i.id ? (
                  <span className="confirma-cancel">
                    <button className="mini perigo" onClick={() => apagar(i.id)}>Apagar</button>
                    <button className="mini" onClick={() => setApagando(null)}>Manter</button>
                  </span>
                ) : (
                  <button className="icone-btn" aria-label={`Apagar registro ${i.titulo}`} onClick={() => setApagando(i.id)}><Trash2 size={18} /></button>
                ))}
              </article>
            )
          })}
        </section>
      ))}
    </>
  )
}
