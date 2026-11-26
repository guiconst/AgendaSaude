const TZ = 'America/Sao_Paulo'

// Data de hoje (YYYY-MM-DD) no fuso de Brasília
export const hoje = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ })

// Próximos dias úteis para o seletor de dia
export function proximosDias(qtd = 14) {
  const base = new Date(`${hoje()}T12:00:00Z`)
  const dias = []
  for (let i = 0; dias.length < qtd && i < 40; i++) {
    const d = new Date(base)
    d.setUTCDate(base.getUTCDate() + i)
    const w = d.getUTCDay()
    if (w === 0 || w === 6) continue
    dias.push({
      iso: d.toISOString().slice(0, 10),
      sem: d.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' }).replace('.', ''),
      dia: d.toLocaleDateString('pt-BR', { day: '2-digit', timeZone: 'UTC' }),
      mes: d.toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', ''),
    })
  }
  return dias
}

// Data (YYYY-MM-DD) vinda de um campo "date" -> instante ao meio-dia de Brasília
export const dataParaInstante = (d) => `${d}T12:00:00-03:00`

export const fmtHora = (iso) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ })

export const fmtDataLonga = (iso) =>
  new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ })

export const fmtDataCurta = (iso) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: TZ }).replace('.', '')

export const fmtMesAno = (iso) =>
  new Date(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: TZ })
