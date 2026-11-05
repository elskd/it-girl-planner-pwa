import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Check, Circle, Clock3, Goal as GoalIcon, Pencil, Plus, Search, Trash2, Undo2 } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Input, Modal, Tabs } from '../components/ui'
import { PageHeader } from '../components/PageHeader'
import { createGoal, deleteGoal, fetchGoals, setGoalStatus, updateGoal, type GoalDraft } from '../lib/data/goals'
import type { Goal, GoalStatus } from '../lib/supabase/database.types'
import { useAuth } from '../lib/auth/AuthContext'

type StatusFilter = 'all' | GoalStatus
type GoalFormState = { title: string; description: string; category: string; startDate: string; dueDate: string }

const emptyForm: GoalFormState = { title: '', description: '', category: '', startDate: '', dueDate: '' }

function formFromGoal(goal: Goal): GoalFormState {
  return {
    title: goal.title,
    description: goal.description ?? '',
    category: goal.category ?? '',
    startDate: goal.start_date ?? '',
    dueDate: goal.due_date ?? '',
  }
}

function toDraft(form: GoalFormState): GoalDraft {
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    category: form.category.trim() || null,
    start_date: form.startDate || null,
    due_date: form.dueDate || null,
  }
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(`${date}T12:00:00`))
}

function errorMessage(error: unknown) {
  const message = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
    ? error.message.toLowerCase()
    : ''
  if (message.includes('network') || message.includes('fetch')) return 'Нет связи с сервером. Проверь интернет и попробуй ещё раз.'
  if (message.includes('row-level security') || message.includes('permission')) return 'Не удалось сохранить цель в аккаунт. Войди в приложение и повтори действие.'
  if (message.includes('due_date') || message.includes('goals_due_date_after_start_date')) return 'Дата завершения не может быть раньше даты начала.'
  return 'Не удалось сохранить изменения. Попробуй ещё раз.'
}

export default function GoalsPage() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [form, setForm] = useState<GoalFormState>(emptyForm)
  const [formError, setFormError] = useState('')
  const [pendingDelete, setPendingDelete] = useState<Goal | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      setGoals(await fetchGoals())
    } catch (error) {
      setLoadError(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const categories = useMemo(
    () => [...new Set(goals.map(goal => goal.category).filter((category): category is string => Boolean(category)))].sort((a, b) => a.localeCompare(b, 'ru')),
    [goals],
  )

  const visibleGoals = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ru')
    return goals.filter(goal => {
      const matchesStatus = statusFilter === 'all' || goal.status === statusFilter
      const matchesCategory = categoryFilter === 'all' || goal.category === categoryFilter
      const matchesSearch = !query || [goal.title, goal.description, goal.category]
        .some(value => value?.toLocaleLowerCase('ru').includes(query))
      return matchesStatus && matchesCategory && matchesSearch
    })
  }, [categoryFilter, goals, search, statusFilter])

  const openCreate = () => {
    setEditingGoal(null)
    setForm(emptyForm)
    setFormError('')
    setActionError('')
    setFormOpen(true)
  }

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setForm(formFromGoal(goal))
    setFormError('')
    setActionError('')
    setFormOpen(true)
  }

  const closeForm = useCallback(() => {
    if (!saving) setFormOpen(false)
  }, [saving])

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) {
      setFormError('Войди в аккаунт, чтобы сохранить цель.')
      return
    }
    if (form.startDate && form.dueDate && form.dueDate < form.startDate) {
      setFormError('Дата завершения не может быть раньше даты начала.')
      return
    }

    setSaving(true)
    setFormError('')
    setActionError('')
    try {
      const draft = toDraft(form)
      if (editingGoal) {
        const updated = await updateGoal(editingGoal.id, { ...draft, status: editingGoal.status })
        setGoals(current => current.map(goal => goal.id === updated.id ? updated : goal))
      } else {
        const created = await createGoal(user.id, draft)
        setGoals(current => [created, ...current])
      }
      setFormOpen(false)
    } catch (error) {
      setFormError(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleStatus = async (goal: Goal) => {
    setActionError('')
    try {
      const updated = await setGoalStatus(goal.id, goal.status === 'active' ? 'completed' : 'active')
      setGoals(current => current.map(item => item.id === updated.id ? updated : item))
    } catch (error) {
      setActionError(errorMessage(error))
    }
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    setSaving(true)
    setActionError('')
    try {
      await deleteGoal(pendingDelete.id)
      setGoals(current => current.filter(goal => goal.id !== pendingDelete.id))
      setPendingDelete(null)
    } catch (error) {
      setActionError(errorMessage(error))
      setPendingDelete(null)
    } finally {
      setSaving(false)
    }
  }

  return <>
    <PageHeader
      eyebrow="ТВОИ НАМЕРЕНИЯ"
      title="Цели"
      description="Собери то, к чему хочешь прийти, в одном месте."
      action={<Button onClick={openCreate}><Plus size={17} /> Новая цель</Button>}
    />

    <Card className="goals-toolbar">
      <div className="goals-filter-row">
        <Tabs
          label="Фильтр по статусу целей"
          value={statusFilter}
          onChange={setStatusFilter}
          items={[
            { value: 'all', label: 'Все' },
            { value: 'active', label: 'Активные' },
            { value: 'completed', label: 'Выполненные' },
          ]}
        />
        <label className="goals-category-filter">
          <span>Категория</span>
          <select className="input" value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}>
            <option value="all">Все категории</option>
            {categories.map(category => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
      </div>
      <label className="goals-search">
        <Search size={17} aria-hidden="true" />
        <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Найти цель" aria-label="Найти цель" />
      </label>
    </Card>

    {actionError && <div className="goals-error" role="alert">{actionError}</div>}
    {loading ? <Card className="goals-empty"><p role="status">Загружаю цели…</p></Card> : loadError ? <Card className="goals-empty">
      <EmptyState icon={<GoalIcon size={24} />} title="Не получилось загрузить цели">{loadError}</EmptyState>
      <Button variant="secondary" onClick={() => void load()}>Попробовать снова</Button>
    </Card> : visibleGoals.length === 0 ? <Card className="goals-empty">
      <EmptyState icon={<GoalIcon size={24} />} title={goals.length === 0 ? 'Начни с одной важной цели' : 'Ничего не найдено'}>
        {goals.length === 0
          ? 'Добавь то, к чему хочешь прийти. Цель сохранится в твоём аккаунте.'
          : 'Измени запрос или фильтры, чтобы увидеть другие цели.'}
      </EmptyState>
      {goals.length === 0 && <Button onClick={openCreate}><Plus size={16} /> Добавить цель</Button>}
    </Card> : <div className="goal-list" aria-live="polite">
      {visibleGoals.map(goal => <GoalCard key={goal.id} goal={goal} onEdit={() => openEdit(goal)} onDelete={() => setPendingDelete(goal)} onToggleStatus={() => void handleStatus(goal)} />)}
    </div>}

    <Modal open={formOpen} title={editingGoal ? 'Редактировать цель' : 'Новая цель'} onClose={closeForm}>
      <form className="goal-form" onSubmit={event => void handleSave(event)}>
        <label className="goal-field"><span>Название <b aria-hidden="true">*</b></span><Input autoFocus maxLength={160} required value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="К чему ты хочешь прийти?" /></label>
        <label className="goal-field"><span>Описание</span><textarea className="input goal-textarea" maxLength={2000} value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} placeholder="Почему это важно и что поможет двигаться вперёд?" rows={3} /></label>
        <label className="goal-field"><span>Категория</span><Input maxLength={60} value={form.category} onChange={event => setForm(current => ({ ...current, category: event.target.value }))} placeholder="Например, здоровье или работа" /></label>
        <div className="goal-date-fields">
          <label className="goal-field"><span>Дата начала</span><Input type="date" value={form.startDate} onChange={event => setForm(current => ({ ...current, startDate: event.target.value }))} /></label>
          <label className="goal-field"><span>Срок</span><Input type="date" min={form.startDate || undefined} value={form.dueDate} onChange={event => setForm(current => ({ ...current, dueDate: event.target.value }))} /></label>
        </div>
        {formError && <div className="goals-error" role="alert">{formError}</div>}
        <div className="goal-form-actions"><Button type="button" variant="secondary" disabled={saving} onClick={closeForm}>Отмена</Button><Button type="submit" disabled={saving}>{saving ? 'Сохраняю…' : editingGoal ? 'Сохранить' : 'Создать цель'}</Button></div>
      </form>
    </Modal>

    <Modal open={Boolean(pendingDelete)} title="Удалить цель?" onClose={() => { if (!saving) setPendingDelete(null) }}>
      <div className="goal-delete-copy">
        <p>Цель «{pendingDelete?.title}» будет удалена навсегда. Это действие нельзя отменить.</p>
        {actionError && <div className="goals-error" role="alert">{actionError}</div>}
        <div className="goal-form-actions"><Button variant="secondary" disabled={saving} onClick={() => setPendingDelete(null)}>Оставить</Button><Button className="button-danger" disabled={saving} onClick={() => void handleDelete()}>{saving ? 'Удаляю…' : 'Удалить цель'}</Button></div>
      </div>
    </Modal>
  </>
}

function GoalCard({ goal, onEdit, onDelete, onToggleStatus }: { goal: Goal; onEdit: () => void; onDelete: () => void; onToggleStatus: () => void }) {
  const completed = goal.status === 'completed'
  return <Card className={`goal-card ${completed ? 'goal-card-completed' : ''}`}>
    <div className="goal-card-main">
      <div className="goal-card-heading">
        <span className="goal-status-icon" aria-hidden="true">{completed ? <Check size={17} /> : <Circle size={17} />}</span>
        <h2>{goal.title}</h2>
      </div>
      <div className="goal-card-badges">
        <Badge tone={completed ? 'neutral' : 'accent'}>{completed ? 'ВЫПОЛНЕНА' : 'АКТИВНА'}</Badge>
        {goal.category && <Badge>{goal.category}</Badge>}
      </div>
      {goal.description && <p className="goal-description">{goal.description}</p>}
      {(goal.start_date || goal.due_date) && <div className="goal-dates">
        <Clock3 size={14} aria-hidden="true" />
        <span>{goal.start_date && `С ${dateLabel(goal.start_date)}`}{goal.start_date && goal.due_date && ' · '}{goal.due_date && `Срок ${dateLabel(goal.due_date)}`}</span>
      </div>}
    </div>
    <div className="goal-actions">
      <Button variant="ghost" onClick={onToggleStatus} aria-label={completed ? `Вернуть цель «${goal.title}» в активные` : `Отметить цель «${goal.title}» выполненной`} title={completed ? 'Вернуть в активные' : 'Отметить выполненной'}>{completed ? <Undo2 size={16} /> : <Check size={16} />}<span>{completed ? 'Вернуть' : 'Выполнена'}</span></Button>
      <Button variant="ghost" onClick={onEdit} aria-label={`Редактировать цель «${goal.title}»`} title="Редактировать"><Pencil size={16} /><span>Изменить</span></Button>
      <Button variant="ghost" className="goal-delete-button" onClick={onDelete} aria-label={`Удалить цель «${goal.title}»`} title="Удалить"><Trash2 size={16} /><span>Удалить</span></Button>
    </div>
  </Card>
}
