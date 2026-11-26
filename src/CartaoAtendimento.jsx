import { CalendarDays, MapPin } from 'lucide-react'
import { fmtDataLonga, fmtHora } from './datas'

export default function CartaoAtendimento({ ag, children }) {
  const { inicio, especialidades: esp, unidades: uni } = ag.horarios
  return (
    <article className="atend">
      <strong>{esp.nome}</strong>
      <span className="atend-linha"><CalendarDays size={16} /> {fmtDataLonga(inicio)}, {fmtHora(inicio)}</span>
      <span className="atend-linha"><MapPin size={16} /> {uni.nome} · {uni.endereco}</span>
      {children}
    </article>
  )
}
