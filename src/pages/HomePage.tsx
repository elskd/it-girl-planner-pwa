import { NavLink } from 'react-router-dom'
import { ArrowRight, CalendarDays, ChevronRight, Goal, Heart, Sparkles } from 'lucide-react'
import { Badge, Card, EmptyState } from '../components/ui'
import { PageHeader } from '../components/PageHeader'

export default function HomePage() {
  const today = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  return <>
    <PageHeader eyebrow={today} title="Твоё пространство" description="Планируй в своём ритме и возвращайся к тому, что важно." />
    <Card className="welcome-card"><div className="welcome-content"><Badge tone="accent">ТВОЙ ПЛАНЕР</Badge><h2>Большие перемены<br /><em>начинаются с малого.</em></h2><p>Здесь будет собираться твой путь — цели, планы и заметки о том, что важно именно тебе.</p><NavLink to="/goals" className="text-link">Перейти к целям <ArrowRight size={16} /></NavLink></div><div className="welcome-orbit" aria-hidden="true"><span className="orbit-ring" /><span className="orbit-dot dot-one" /><span className="orbit-dot dot-two" /><Sparkles className="orbit-spark" size={25} /></div></Card>
    <div className="section-heading"><div><div className="eyebrow">ОБЗОР</div><h2>Твой фокус</h2></div><span className="section-note">Появится, когда ты добавишь данные</span></div>
    <div className="overview-grid">
      <Card className="overview-card"><div className="card-top"><span className="icon-tile"><Goal size={18} /></span><ChevronRight size={17} className="muted-icon" /></div><h3>Цели</h3><EmptyState icon={<Goal size={20} />} title="Пока пусто">Здесь появятся твои цели и ключевые направления.</EmptyState><NavLink to="/goals" className="card-link">Открыть раздел <ArrowRight size={14} /></NavLink></Card>
      <Card className="overview-card"><div className="card-top"><span className="icon-tile"><CalendarDays size={18} /></span><ChevronRight size={17} className="muted-icon" /></div><h3>Эта неделя</h3><EmptyState icon={<CalendarDays size={20} />} title="Неделя свободна">Добавь планы, чтобы увидеть их здесь.</EmptyState><NavLink to="/planner" className="card-link">Открыть планер <ArrowRight size={14} /></NavLink></Card>
      <Card className="overview-card maddy-mini"><div className="card-top"><span className="icon-tile"><Heart size={18} /></span><Badge>ПРОФИЛЬ</Badge></div><div className="maddy-mini-row"><div className="avatar avatar-small">M</div><div><h3>Maddy</h3><p>Твой путь начинается здесь</p></div></div><div className="mini-separator" /><p className="muted-copy">Профиль и прогресс будут отображаться здесь.</p><NavLink to="/maddy" className="card-link">Открыть профиль <ArrowRight size={14} /></NavLink></Card>
    </div>
    <div className="bottom-note"><Sparkles size={15} /><span>Это пространство принадлежит тебе. Наполняй его постепенно.</span></div>
  </>
}
