import type { ReactNode } from 'react'
import { MobileSettings } from './Navigation'

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="page-header"><div className="header-copy">{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div><div className="header-actions">{action}<MobileSettings /></div></header>
}
