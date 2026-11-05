import { CircleHelp, Heart, Moon, Settings, Sun } from 'lucide-react'
import { Badge, Card } from '../components/ui'
import { PageHeader } from '../components/PageHeader'

export type Theme = 'dark' | 'light'

export default function SettingsPage({ theme, setTheme }: { theme: Theme; setTheme: (theme: Theme) => void }) {
  return <>
    <PageHeader eyebrow="ТВОЁ ПРОСТРАНСТВО" title="Настройки" description="Настрой приложение так, чтобы тебе было комфортно." />
    <div className="settings-layout"><Card className="settings-card"><div className="settings-title"><span className="icon-tile"><Sun size={18} /></span><div><h2>Внешний вид</h2><p>Выбери тему приложения</p></div></div><div className="theme-options"><button className={`theme-option ${theme === 'dark' ? 'selected' : ''}`} onClick={() => setTheme('dark')} aria-pressed={theme === 'dark'}><span className="theme-preview preview-dark"><Moon size={18} /></span><span><strong>Dark Feminine</strong><small>Тёмная тема</small></span><span className="radio-dot" /></button><button className={`theme-option ${theme === 'light' ? 'selected' : ''}`} onClick={() => setTheme('light')} aria-pressed={theme === 'light'}><span className="theme-preview preview-light"><Sun size={18} /></span><span><strong>Light Feminine</strong><small>Светлая тема</small></span><span className="radio-dot" /></button></div></Card><Card className="settings-card future-card"><div className="settings-title"><span className="icon-tile"><Settings size={18} /></span><div><h2>Другие настройки</h2><p>Дополнительные возможности</p></div></div><div className="future-row"><span><CircleHelp size={17} /> Аккаунт и синхронизация</span><Badge>СКОРО</Badge></div><div className="future-row"><span><Heart size={17} /> О приложении</span><Badge>СКОРО</Badge></div></Card></div>
    <div className="settings-footer"><span>It Girl Planner</span><span>Версия 0.1 · Основа приложения</span></div>
  </>
}
