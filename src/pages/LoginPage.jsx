import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'

const DEFAULT_REDIRECT = '/'

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const { session, initializing, signInWithEmail, verifyEmailCode } = useAuth()
  const { addToast } = useToast()

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [showCodeForm, setShowCodeForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const next = searchParams.get('next') || DEFAULT_REDIRECT

  if (initializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground-muted">
        Carregando...
      </div>
    )
  }

  if (session) {
    return <Navigate to={next} replace />
  }

  async function handleSendLink(event) {
    event.preventDefault()
    setLoading(true)

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      await signInWithEmail(email, redirectTo)
      setSent(true)
    } catch (err) {
      addToast(`Erro ao enviar o link: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(event) {
    event.preventDefault()
    setLoading(true)

    try {
      await verifyEmailCode(email, code)
      // A sessão chega via onAuthStateChange e o <Navigate> acima redireciona.
    } catch (err) {
      addToast(`Código inválido ou expirado: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground">Entrar</h1>
        <p className="mt-3 text-sm text-foreground-muted">
          Informe seu e-mail para receber um link de acesso. Sem senha.
        </p>
      </div>

      {!sent && (
        <form onSubmit={handleSendLink} className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm text-foreground-muted"
            >
              E-mail
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={loading || !email}>
            {loading ? 'Enviando...' : 'Enviar link de acesso'}
          </Button>

          <Link
            to="/"
            className="text-center text-sm text-foreground-subtle hover:text-foreground-muted"
          >
            Voltar para o início
          </Link>
        </form>
      )}

      {sent && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-6 text-center">
            <MailCheck className="text-accent" size={32} />
            <p className="font-semibold text-foreground">
              Verifique seu e-mail
            </p>
            <p className="text-sm text-foreground-muted">
              Enviamos um link de acesso para{' '}
              <span className="text-foreground">{email}</span>. Abra o link
              neste mesmo dispositivo.
            </p>
          </div>

          {!showCodeForm && (
            <button
              type="button"
              onClick={() => setShowCodeForm(true)}
              className="text-sm text-accent hover:text-accent-hover"
            >
              Recebi um código de 6 dígitos
            </button>
          )}

          {showCodeForm && (
            <form onSubmit={handleVerifyCode} className="flex flex-col gap-3">
              <label
                htmlFor="code"
                className="block text-sm text-foreground-muted"
              >
                Código do e-mail
              </label>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
              />
              <Button type="submit" disabled={loading || code.length < 6}>
                {loading ? 'Verificando...' : 'Confirmar código'}
              </Button>
            </form>
          )}

          <button
            type="button"
            onClick={() => {
              setSent(false)
              setShowCodeForm(false)
              setCode('')
            }}
            className="text-sm text-foreground-subtle hover:text-foreground-muted"
          >
            Usar outro e-mail
          </button>
        </div>
      )}
    </div>
  )
}
