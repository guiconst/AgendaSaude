import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Auth from './Auth'
import NovaSenha from './NovaSenha'
import Termo, { VERSAO_TERMO } from './Termo'
import Shell from './Shell'

export default function App() {
  const [session, setSession] = useState(undefined)
  const [aceito, setAceito] = useState(null)
  const [aviso, setAviso] = useState('')
  const [recuperando, setRecuperando] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((evento, s) => {
      if (evento === 'PASSWORD_RECOVERY') setRecuperando(true)
      setSession(s)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return setAceito(null)
    supabase.from('consentimentos').select('id').eq('versao', VERSAO_TERMO).limit(1)
      .then(({ data }) => setAceito(!!data?.length))
  }, [session])

  const recusar = async () => {
    setAviso('Sem aceitar o termo não é possível usar o app. Precisamos do seu consentimento para tratar seus dados de saúde.')
    await supabase.auth.signOut()
  }

  if (session === undefined || (session && aceito === null)) return <p className="center">Carregando…</p>
  if (!session) return <Auth aviso={aviso} />
  if (recuperando) return <NovaSenha onConcluir={() => setRecuperando(false)} />
  if (!aceito) return <Termo userId={session.user.id} onAceitar={() => setAceito(true)} onRecusar={recusar} />
  return <Shell user={session.user} />
}
