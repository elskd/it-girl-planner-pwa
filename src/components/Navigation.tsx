import { NavLink } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight, CircleUserRound, Goal, House, Settings } from 'lucide-react'
import { useState } from 'react'

const links = [
  { to: '/', label: 'Главная', icon: House },
  { to: '/goals', label: 'Цели', icon: Goal },
  { to: '/planner', label: 'Планирование', icon: CalendarDays },
  { to: '/maddy', label: 'Maddy', icon: CircleUserRound },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  return <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}><NavLink to="/" className="brand" aria-label="It Girl Planner — главная"><span className="brand-mark">i</span>{!collapsed && <span className="brand-name">it girl<span>planner</span></span>}</NavLink><div className="nav-caption">МЕНЮ</div><nav className="side-links" aria-label="Основная навигация">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} title={collapsed ? label : undefined} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={19} strokeWidth={1.8} /><span>{label}</span></NavLink>)}</nav><div className="sidebar-bottom"><NavLink to="/settings" title={collapsed ? 'Настройки' : undefined} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Settings size={19} strokeWidth={1.8} /><span>Настройки</span></NavLink><button className="collapse-button" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}>{collapsed ? <ChevronRight size={17} /> : <><ChevronLeft size={17} /><span>Свернуть меню</span></>}</button></div></aside>
}
export function MobileNavigation() { return <nav className="mobile-nav" aria-label="Основная навигация">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`}><Icon size={20} strokeWidth={1.8} /><span>{label}</span></NavLink>)}</nav> }
export function MobileSettings() { return <NavLink to="/settings" className="mobile-settings" aria-label="Настройки"><Settings size={19} /></NavLink> }
