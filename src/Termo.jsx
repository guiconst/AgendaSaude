import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { supabase } from './supabase'

export const VERSAO_TERMO = '1.0'

export default function Termo({ userId, onAceitar, onRecusar }) {
  const [lido, setLido] = useState(false)
  const [erro, setErro] = useState('')

  async function aceitar() {
    const { error } = await supabase.from('consentimentos').insert({ user_id: userId, versao: VERSAO_TERMO })
    if (error) return setErro('Não foi possível registrar o aceite. Tente de novo.')
    onAceitar()
  }

  return (
    <main className="tela">
      <p className="eyebrow">Seus dados, sua escolha</p>
      <h1>Termo de consentimento</h1>
      <div className="aviso-verde"><ShieldCheck size={18} /> Dados de saúde são sensíveis pela LGPD.</div>

      <section className="termo">
        <h2>Quais dados usamos</h2>
        <p>Nome, CPF, data de nascimento, telefone, e-mail e informações dos seus atendimentos, exames e vacinas.</p>
        <h2>Para que usamos</h2>
        <p>Somente para agendar consultas, mostrar seu histórico e enviar lembretes. Não vendemos nem compartilhamos seus dados.</p>
        <h2>Seus direitos</h2>
        <p>Você pode consultar, corrigir ou pedir a exclusão dos seus dados e retirar este consentimento quando quiser.</p>
      </section>

      <label className="check">
        <input type="checkbox" checked={lido} onChange={(e) => setLido(e.target.checked)} />
        Li e aceito o termo de uso dos meus dados.
      </label>
      {erro && <p className="erro" role="alert">{erro}</p>}

      <button className="btn" disabled={!lido} onClick={aceitar}>Aceitar e continuar</button>
      <button className="link" onClick={onRecusar}>Não aceito</button>
    </main>
  )
}
