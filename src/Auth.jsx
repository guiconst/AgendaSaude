import { useState } from 'react'
import { supabase } from './supabase'
import Logo from './Logo'

const soDigitos = (v) => v.replace(/\D/g, '')
const mascaraCpf = (v) =>
  soDigitos(v).slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')

function cpfValido(v) {
  const c = soDigitos(v)
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false
  for (let t = 9; t < 11; t++) {
    let s = 0
    for (let i = 0; i < t; i++) s += Number(c[i]) * (t + 1 - i)
    if (((s * 10) % 11) % 10 !== Number(c[t])) return false
  }
  return true
}

export default function Auth({ aviso }) {
  const [modo, setModo] = useState('login') // login | cadastro | recuperar
  const [f, setF] = useState({ nome: '', cpf: '', nascimento: '', telefone: '', email: '', senha: '' })
  const [erro, setErro] = useState(aviso || '')
  const [info, setInfo] = useState('')
  const [jaExiste, setJaExiste] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const set = (k) => (e) => setF({ ...f, [k]: k === 'cpf' ? mascaraCpf(e.target.value) : e.target.value })
  const trocar = (m) => { setModo(m); setErro(''); setInfo(''); setJaExiste(false) }

  async function enviar(e) {
    e.preventDefault()
    setErro(''); setInfo(''); setJaExiste(false); setCarregando(true)
    try {
      if (modo === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.senha })
        if (error) setErro('E-mail ou senha incorretos.')
      } else if (modo === 'recuperar') {
        await supabase.auth.resetPasswordForEmail(f.email, { redirectTo: window.location.origin })
        setInfo('Se houver uma conta com esse e-mail, enviamos o link para criar uma nova senha.')
      } else {
        if (!cpfValido(f.cpf)) return setErro('CPF inválido. Confira os números.')
        if (f.senha.length < 8) return setErro('A senha precisa ter pelo menos 8 caracteres.')
        const { data: existe } = await supabase.rpc('cpf_existe', { c: soDigitos(f.cpf) })
        if (existe) { setJaExiste(true); return setErro('Já existe uma conta com esse CPF.') }
        const { error } = await supabase.auth.signUp({
          email: f.email,
          password: f.senha,
          options: { data: { nome: f.nome, cpf: soDigitos(f.cpf), data_nascimento: f.nascimento, telefone: f.telefone } },
        })
        if (error) setErro('Não foi possível criar a conta. Confira os dados e tente de novo.')
      }
    } finally {
      setCarregando(false)
    }
  }

  const campo = (k, rotulo, props = {}) => (
    <label className="campo">
      {rotulo}
      <input value={f[k]} onChange={set(k)} required {...props} />
    </label>
  )

  return (
    <main className="tela auth">
      <Logo />
      <h1>{modo === 'login' ? 'Entrar' : modo === 'cadastro' ? 'Criar conta' : 'Recuperar senha'}</h1>
      <p className="sub">
        {modo === 'login' && 'Acesse seus atendimentos com segurança.'}
        {modo === 'cadastro' && 'Preencha seus dados para começar.'}
        {modo === 'recuperar' && 'Informe o e-mail da sua conta.'}
      </p>

      <form onSubmit={enviar}>
        {modo === 'cadastro' && (
          <>
            {campo('nome', 'Nome completo', { autoComplete: 'name' })}
            {campo('cpf', 'CPF', { inputMode: 'numeric', placeholder: '000.000.000-00' })}
            {campo('nascimento', 'Data de nascimento', { type: 'date' })}
            {campo('telefone', 'Telefone', { type: 'tel', placeholder: '(11) 90000-0000' })}
          </>
        )}
        {campo('email', 'E-mail', { type: 'email', autoComplete: 'email' })}
        {modo !== 'recuperar' && campo('senha', 'Senha', { type: 'password', autoComplete: modo === 'login' ? 'current-password' : 'new-password' })}

        {erro && <p className="erro" role="alert">{erro}</p>}
        {jaExiste && <button type="button" className="link" onClick={() => trocar('recuperar')}>Recuperar minha senha</button>}
        {info && <p className="ok">{info}</p>}

        <button className="btn" disabled={carregando}>
          {modo === 'login' ? 'Entrar' : modo === 'cadastro' ? 'Criar conta' : 'Enviar link'}
        </button>
      </form>

      <div className="trocas">
        {modo !== 'login' && <button className="link" onClick={() => trocar('login')}>Já tenho conta</button>}
        {modo === 'login' && <button className="link" onClick={() => trocar('cadastro')}>Criar conta</button>}
        {modo === 'login' && <button className="link" onClick={() => trocar('recuperar')}>Esqueci minha senha</button>}
      </div>
    </main>
  )
}
