import { LogOut } from 'lucide-react'
import { supabase } from './supabase'

export default function Perfil({ user, nome }) {
  return (
    <>
      <h1>Meu perfil</h1>
      <section className="perfil">
        <span className="avatar">{nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}</span>
        <div><strong>{nome}</strong><br /><small>{user.email}</small></div>
      </section>
      <button className="btn sair" onClick={() => supabase.auth.signOut()}><LogOut size={16} /> Sair da conta</button>
    </>
  )
}
