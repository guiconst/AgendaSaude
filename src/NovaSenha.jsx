import { useState } from 'react'
import { supabase } from './supabase'

export default function NovaSenha({ onConcluir }) {
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    if (senha.length < 8) return setErro('A senha precisa ter pelo menos 8 caracteres.')
    if (senha !== confirma) return setErro('As senhas não são iguais.')
    setCarregando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setCarregando(false)
    if (error) return setErro('Não foi possível salvar a nova senha. Peça um novo link e tente de novo.')
    onConcluir()
  }

  return (
    <main className="tela auth">
      <p className="eyebrow">AgendaSaúde</p>
      <h1>Criar nova senha</h1>
      <p className="sub">Escolha uma senha nova para a sua conta.</p>
      <form onSubmit={enviar}>
        <label className="campo">
          Nova senha
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" required />
        </label>
        <label className="campo">
          Repita a nova senha
          <input type="password" value={confirma} onChange={(e) => setConfirma(e.target.value)} autoComplete="new-password" required />
        </label>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <button className="btn" disabled={carregando}>Salvar nova senha</button>
      </form>
    </main>
  )
}
