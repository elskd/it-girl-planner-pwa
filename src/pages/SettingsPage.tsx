import { CircleHelp, Heart, LockKeyhole, LogOut, Moon, Settings, Sun } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, Card } from '../components/ui'
import { useAuth } from '../lib/auth/AuthContext'
import { PageHeader } from '../components/PageHeader'

export type Theme = 'dark' | 'light'

export default function SettingsPage({ theme, setTheme }: { theme: Theme; setTheme: (theme: Theme) => void }) {
  const { user, signOut } = useAuth()
  const [signOutError, setSignOutError] = useState('')

  const handleSignOut = async () => {
    setSignOutError('')
    const { error } = await signOut()
    if (error) setSignOutError('Не удалось выйти. Проверь подключение и попробуй ещё раз.')
  }

  return <>
    <PageHeader eyebrow="ТВОЁ ПРОСТРАНСТВО" title="Настройки" description="Настрой приложение так, чтобы тебе было комфортно." />
    <div className="settings-layout"><Card className="settings-card"><div className="settings-title"><span className="icon-tile"><Sun size={18} /></span><div><h2>Внешний вид</h2><p>Выбери тему приложения</p></div></div><div className="theme-options"><button className={`theme-option ${theme === 'dark' ? 'selected' : ''}`} onClick={() => setTheme('dark')} aria-pressed={theme === 'dark'}><span className="theme-preview preview-dark"><Moon size={18} /></span><span><strong>Dark Feminine</strong><small>Тёмная тема</small></span><span className="radio-dot" /></button><button className={`theme-option ${theme === 'light' ? 'selected' : ''}`} onClick={() => setTheme('light')} aria-pressed={theme === 'light'}><span className="theme-preview preview-light"><Sun size={18} /></span><span><strong>Light Feminine</strong><small>Светлая тема</small></span><span className="radio-dot" /></button></div></Card><Card className="settings-card future-card"><div className="settings-title"><span className="icon-tile"><Settings size={18} /></span><div><h2>Другие настройки</h2><p>Дополнительные возможности</p></div></div><div className="future-row"><span><CircleHelp size={17} /> Синхронизация данных</span><Badge>СЛЕДУЮЩИЙ ЭТАП</Badge></div><div className="future-row"><span><Heart size={17} /> О приложении</span><Badge>СКОРО</Badge></div></Card></div>
    <Card className="account-card"><div className="account-copy"><div className="settings-title"><span className="icon-tile"><LockKeyhole size={18} /></span><div><h2>Аккаунт</h2><p>Данные приложения привязаны к этому адресу</p></div></div><span className="account-email">{user?.email}</span>{signOutError && <p className="account-error" role="status">{signOutError}</p>}</div><Button variant="secondary" onClick={() => void handleSignOut()}><LogOut size={16} /> Выйти</Button></Card>
    <div className="settings-footer"><span>It Girl Planner</span><span>Версия 0.1 · Основа приложения</span></div>
  </>
}
