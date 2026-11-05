import { NavLink } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function NotFoundPage() {
  return <div className="not-found"><span className="eyebrow">404</span><h1>Такой страницы пока нет</h1><p>Возможно, ссылка устарела или была введена с ошибкой.</p><NavLink to="/" className="text-link">На главную <ArrowRight size={16} /></NavLink></div>
}
