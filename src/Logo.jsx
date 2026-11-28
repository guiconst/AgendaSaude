import logo from './assets/logo.webp'
import icone from './assets/icone.webp'

// Logo horizontal (ícone + "AGENDA SAÚDE"). tamanho: 'grande' (login) | 'pequena' (cabeçalhos)
export default function Logo({ tamanho = 'grande' }) {
  return <img className={`logo-h ${tamanho}`} src={logo} alt="AgendaSaúde" width="720" height="252" />
}

// Tela de carregamento com o ícone pulsando
export function Carregando() {
  return (
    <div className="carregando" role="status" aria-live="polite">
      <img src={icone} alt="" width="384" height="281" />
      <span>Carregando…</span>
    </div>
  )
}
