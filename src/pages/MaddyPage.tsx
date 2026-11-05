import { Sparkles, UserRound } from 'lucide-react'
import { Badge, Card } from '../components/ui'
import { PageHeader } from '../components/PageHeader'

export default function MaddyPage() {
  return <>
    <PageHeader eyebrow="ТВОЙ ПУТЬ" title="Maddy" description="Персонаж будет расти вместе с тобой." />
    <Card className="maddy-profile"><div className="maddy-profile-top"><div className="avatar avatar-large"><UserRound size={34} strokeWidth={1.4} /></div><div className="maddy-heading"><Badge tone="accent">ПЕРСОНАЖ</Badge><h2>Maddy</h2><p>Твой персональный профиль</p></div></div><div className="maddy-stats"><div className="stat"><span>УРОВЕНЬ</span><strong>—</strong><small>Появится позже</small></div><div className="stat"><span>ОПЫТ</span><strong>—</strong><small>Появится позже</small></div><div className="stat"><span>ХАРАКТЕРИСТИКИ</span><strong>—</strong><small>Появятся позже</small></div></div><div className="maddy-footnote"><Sparkles size={16} /><span>Система развития персонажа появится в следующих этапах.</span></div></Card>
  </>
}
