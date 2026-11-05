import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { Badge, Card, EmptyState, Tabs } from '../components/ui'
import { PageHeader } from '../components/PageHeader'

export default function PlannerPage() {
  const [period, setPeriod] = useState<'month' | 'week'>('month')
  return <>
    <PageHeader eyebrow="ТВОЁ ВРЕМЯ" title="Планирование" description="Мягко структурируй дни и оставляй место для жизни." />
    <div className="planner-toolbar"><Tabs label="Период планирования" value={period} onChange={setPeriod} items={[{ value: 'month', label: 'Месяц' }, { value: 'week', label: 'Неделя' }]} /><Badge>КАРКАС РАЗДЕЛА</Badge></div>
    <Card className="planner-empty"><div className="planner-decoration" aria-hidden="true"><div /><div /><div /><div /><div /><div /><div /></div><EmptyState icon={<CalendarDays size={24} />} title={period === 'month' ? 'Месяц ждёт твоих планов' : 'Неделя ждёт твоих планов'}>Календарь и задачи появятся на этом месте в следующем этапе.</EmptyState></Card>
  </>
}
