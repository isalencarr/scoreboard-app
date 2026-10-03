import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import Button from '../ui/Button'

/**
 * Mostra o e-mail da sessão e o botão de sair; sem sessão, mostra "Entrar".
 */
export default function UserMenu() {
  const { user, initializing, signOut } = useAuth()
  const { addToast } = useToast()
  const [busy, setBusy] = useState(false)

  if (initializing) return null

  if (!user) {
    return (
      <Link to="/login">
        <Button variant="secondary">Entrar</Button>
      </Link>
    )
  }

  async function handleSignOut() {
    setBusy(true)
    try {
      await signOut()
    } catch (err) {
      addToast(`Erro ao sair: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span
        className="max-w-40 truncate text-sm text-foreground-muted"
        title={user.email}
      >
        {user.email}
      </span>
      <Button
        variant="ghost"
        onClick={handleSignOut}
        disabled={busy}
        className="gap-1"
        aria-label="Sair da conta"
      >
        <LogOut size={16} />
        Sair
      </Button>
    </div>
  )
}
