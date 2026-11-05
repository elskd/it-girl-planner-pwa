import { Goal, Plus } from 'lucide-react'
import { Badge, Button, Card, EmptyState } from '../components/ui'
import { PageHeader } from '../components/PageHeader'

export default function GoalsPage() {
  return <>
    <PageHeader eyebrow="ТВОИ НАМЕРЕНИЯ" title="Цели" description="Собери то, к чему хочешь прийти, в одном месте." action={<Button disabled title="Создание целей появится в следующем этапе"><Plus size={17} /> Новая цель</Button>} />
    <Card className="filter-card"><div className="filter-label">ФИЛЬТРЫ</div><div className="filter-placeholder"><span>Фильтры целей появятся здесь</span><Badge>СКОРО</Badge></div></Card>
    <Card className="large-empty"><EmptyState icon={<Goal size={24} />} title="Здесь пока нет целей">Инструменты для создания целей появятся в следующем этапе.</EmptyState><Button variant="secondary" disabled><Plus size={16} /> Добавление целей — скоро</Button></Card>
  </>
}
