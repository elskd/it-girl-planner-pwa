import { useState, type FormEvent } from 'react'
import { ArrowLeft, Heart, LockKeyhole, Mail, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card } from '../components/ui'
import { useAuth } from '../lib/auth/AuthContext'
import { supabase } from '../lib/supabase/client'

type AuthMode = 'sign-in' | 'sign-up' | 'recover' | 'reset' | 'expired' | 'setup'
type Notice = { type: 'success' | 'error'; text: string }

function redirectUrl(route: string) {
  const url = new URL(window.location.pathname, window.location.origin)
  url.hash = `/${route.replace(/^\/+/, '')}`
  return url.toString()
}

function humanizeError(message: string) {
  const text = message.toLowerCase()
  if (text.includes('invalid login credentials')) return 'Проверь адрес почты и пароль.'
  if (text.includes('email not confirmed')) return 'Сначала подтверди адрес почты по ссылке из письма.'
  if (text.includes('already registered') || text.includes('already been registered')) return 'Аккаунт с этой почтой уже есть. Попробуй войти.'
  if (text.includes('password should be at least')) return 'Пароль должен содержать не менее 8 символов.'
  if (text.includes('rate limit') || text.includes('too many requests')) return 'Слишком много попыток. Подожди немного и попробуй ещё раз.'
  if (text.includes('network') || text.includes('fetch')) return 'Не удалось связаться с сервером. Проверь подключение к интернету.'
  return message
}

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate()
  const { clientReady } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) return
    setBusy(true)
    setNotice(null)

    try {
      if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
        navigate('/', { replace: true })
      } else if (mode === 'sign-up') {
        if (password !== confirmPassword) {
          setNotice({ type: 'error', text: 'Пароли не совпадают.' })
          return
        }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: redirectUrl('auth') },
        })
        if (error) throw error
        if (data.session) navigate('/', { replace: true })
        else setNotice({ type: 'success', text: 'Проверь почту и перейди по ссылке для подтверждения аккаунта.' })
      } else if (mode === 'recover') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: redirectUrl('auth/reset-password'),
        })
        if (error) throw error
        setNotice({ type: 'success', text: 'Если аккаунт с таким адресом существует, письмо для сброса пароля уже отправлено.' })
      } else if (mode === 'reset') {
        if (password !== confirmPassword) {
          setNotice({ type: 'error', text: 'Пароли не совпадают.' })
          return
        }
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        setNotice({ type: 'success', text: 'Пароль обновлён. Теперь можно продолжить.' })
        window.setTimeout(() => navigate('/', { replace: true }), 900)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Попробуй ещё раз чуть позже.'
      setNotice({ type: 'error', text: humanizeError(message) })
    } finally {
      setBusy(false)
    }
  }

  const title = mode === 'sign-up' ? 'Создай аккаунт' : mode === 'recover' ? 'Вернём доступ' : mode === 'reset' ? 'Новый пароль' : mode === 'expired' ? 'Ссылка недействительна' : 'С возвращением'
  const description = mode === 'sign-up' ? 'Твоё личное пространство для целей и планов.' : mode === 'recover' ? 'Отправим письмо со ссылкой для сброса пароля.' : mode === 'reset' ? 'Придумай новый пароль для аккаунта.' : mode === 'expired' ? 'Ссылка сброса пароля истекла или уже была использована. Запроси новую.' : 'Войди, чтобы открыть свой планер.'

  if (!clientReady || mode === 'setup') {
    return <main className="auth-screen"><Card className="auth-card"><Brand /><div className="auth-copy"><Badge tone="accent">НАСТРОЙКА АККАУНТА</Badge><h1>Подключаем пространство</h1><p>Для входа ещё нужно добавить URL и публичный ключ проекта Supabase в окружение приложения.</p></div><div className="auth-notice auth-notice-error" role="status">Секретный ключ базы данных не нужен и не должен попадать в приложение.</div></Card></main>
  }

  if (mode === 'expired') {
    return <main className="auth-screen"><Card className="auth-card"><Brand /><div className="auth-copy"><Badge tone="accent">ВОССТАНОВЛЕНИЕ</Badge><h1>{title}</h1><p>{description}</p></div><Button variant="secondary" onClick={() => navigate('/auth/recover')}><Mail size={16} /> Запросить новую ссылку</Button></Card></main>
  }

  const needsPassword = mode === 'sign-in' || mode === 'sign-up' || mode === 'reset'
  const showConfirm = mode === 'sign-up' || mode === 'reset'
  const submitLabel = mode === 'sign-in' ? 'Войти' : mode === 'sign-up' ? 'Создать аккаунт' : mode === 'recover' ? 'Отправить ссылку' : 'Сохранить пароль'

  return <main className="auth-screen"><Card className="auth-card">
    <Brand />
    <div className="auth-copy"><Badge tone="accent">ТВОЁ ЛИЧНОЕ ПРОСТРАНСТВО</Badge><h1>{title}</h1><p>{description}</p></div>
    <form className="auth-form" onSubmit={submit}>
      {mode !== 'reset' && <label className="auth-field"><span>Электронная почта</span><span className="auth-input-wrap"><Mail size={16} aria-hidden="true" /><input className="input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></span></label>}
      {needsPassword && <label className="auth-field"><span>{mode === 'reset' ? 'Новый пароль' : 'Пароль'}</span><span className="auth-input-wrap"><LockKeyhole size={16} aria-hidden="true" /><input className="input" type="password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Не менее 8 символов" required /></span></label>}
      {showConfirm && <label className="auth-field"><span>Повтори пароль</span><span className="auth-input-wrap"><LockKeyhole size={16} aria-hidden="true" /><input className="input" type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Ещё раз" required /></span></label>}
      {notice && <div className={`auth-notice auth-notice-${notice.type}`} role="status" aria-live="polite">{notice.text}</div>}
      <Button type="submit" disabled={busy} className="auth-submit">{busy ? 'Подожди…' : submitLabel}</Button>
    </form>
    <div className="auth-links">
      {mode === 'sign-in' && <><button type="button" onClick={() => navigate('/auth/recover')}>Забыла пароль?</button><p>Впервые здесь? <button type="button" onClick={() => navigate('/auth?mode=sign-up')}>Создать аккаунт</button></p></>}
      {mode === 'sign-up' && <p>Уже есть аккаунт? <button type="button" onClick={() => navigate('/auth')}>Войти</button></p>}
      {(mode === 'recover' || mode === 'reset') && <button type="button" onClick={() => navigate('/auth')}><ArrowLeft size={14} /> Назад ко входу</button>}
    </div>
    <div className="auth-footnote"><Sparkles size={14} /><span>Твой ритм — твои правила</span><Heart size={13} /></div>
  </Card></main>
}

function Brand() {
  return <div className="auth-brand"><span className="brand-mark">I</span><span className="brand-name">It Girl Planner<span>ТВОЁ ПРОСТРАНСТВО</span></span></div>
}

