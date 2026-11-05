import { useCallback, useEffect, useMemo, useState, type DragEvent, type FormEvent } from 'react'
import { CalendarDays, Check, ChevronLeft, ChevronRight, Circle, Clock3, Link2, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button, Card, EmptyState, Input, Modal, Tabs } from '../components/ui'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../lib/auth/AuthContext'
import { createPlannerTask, deletePlannerTask, fetchPlannerPreferences, fetchPlannerTasks, setPlannerTaskCompleted, updatePlannerTask, type PlannerTaskDraft } from '../lib/data/planner'
import { addDays, dateTimeInTimezoneToIso, formatCalendarDate, formatTaskTime, getCalendarDays, partsInTimezone, shiftMonth, todayInTimezone, weekdayLabels } from '../lib/data/planner-dates'
import { fetchGoals } from '../lib/data/goals'
import type { Goal, PlannerTask } from '../lib/supabase/database.types'

type Period = 'month' | 'week'
type TaskForm = { title: string; description: string; date: string; startTime: string; endTime: string; goalId: string }
const blankForm = (date: string): TaskForm => ({ title: '', description: '', date, startTime: '', endTime: '', goalId: '' })

function errorMessage(error: unknown) {
  const message = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
    ? error.message.toLowerCase()
    : ''
  if (message.includes('network') || message.includes('fetch')) return 'Нет связи с сервером. Проверь интернет и попробуй ещё раз.'
  if (message.includes('row-level security') || message.includes('permission')) return 'Не удалось сохранить задачу в аккаунт. Войди в приложение и повтори действие.'
  if (message.includes('foreign key') || message.includes('planner_tasks_goal_owner_fkey')) return 'Не удалось привязать цель. Обнови список и попробуй ещё раз.'
  if (message.includes('не существует из-за перехода часов')) return 'Это местное время не существует из-за перехода часов. Выбери другое время.'
  return 'Не удалось сохранить изменения. Попробуй ещё раз.'
}

function dateDifference(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)
}

function shiftZonedDateTime(value: string | null, days: number, timezone: string) {
  if (!value) return null
  const parts = partsInTimezone(value, timezone)
  return dateTimeInTimezoneToIso(addDays(parts.date, days), parts.time, timezone)
}

export default function PlannerPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<PlannerTask[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [timezone, setTimezone] = useState('Europe/Moscow')
  const [weekStartsOn, setWeekStartsOn] = useState(1)
  const [locale, setLocale] = useState('ru-RU')
  const [period, setPeriod] = useState<Period>('month')
  const [anchorDate, setAnchorDate] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null)
  const [form, setForm] = useState<TaskForm>(blankForm(''))
  const [formError, setFormError] = useState('')
  const [pendingDelete, setPendingDelete] = useState<PlannerTask | null>(null)
  const [draggedTaskId, setDraggedTaskId] = useState('')
  const [dropDate, setDropDate] = useState('')

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setLoadError('')
    try {
      const [nextTasks, nextGoals, preferences] = await Promise.all([
        fetchPlannerTasks(), fetchGoals(), fetchPlannerPreferences(user.id),
      ])
      setTasks(nextTasks)
      setGoals(nextGoals)
      setTimezone(preferences.timezone)
      setWeekStartsOn(preferences.weekStartsOn)
      setLocale(preferences.locale)
    } catch (error) {
      setLoadError(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { void load() }, [load])

  const today = todayInTimezone(timezone)
  const calendarAnchor = anchorDate || today
  const activeDate = selectedDate || calendarAnchor
  const days = useMemo(() => getCalendarDays(calendarAnchor, weekStartsOn, period), [calendarAnchor, period, weekStartsOn])
  const weekdays = useMemo(() => weekdayLabels(locale, weekStartsOn), [locale, weekStartsOn])
  const tasksByDate = useMemo(() => {
    const result = new Map<string, PlannerTask[]>()
    for (const task of tasks) result.set(task.due_date, [...(result.get(task.due_date) ?? []), task])
    return result
  }, [tasks])
  const selectedTasks = tasksByDate.get(activeDate) ?? []
  const conflictingTaskIds = useMemo(() => {
    const conflicts = new Set<string>()
    const scheduled = selectedTasks.filter(task => !task.completed_at && task.start_at && task.end_at)
    for (let left = 0; left < scheduled.length; left += 1) {
      for (let right = left + 1; right < scheduled.length; right += 1) {
        const a = scheduled[left]
        const b = scheduled[right]
        if (Date.parse(a.start_at!) < Date.parse(b.end_at!) && Date.parse(b.start_at!) < Date.parse(a.end_at!)) {
          conflicts.add(a.id)
          conflicts.add(b.id)
        }
      }
    }
    return conflicts
  }, [selectedTasks])
  const activeGoals = goals.filter(goal => goal.status === 'active' || goal.id === form.goalId)
  const monthLabel = formatCalendarDate(calendarAnchor, locale, { month: 'long', year: 'numeric' })
  const selectedLabel = formatCalendarDate(activeDate, locale, { weekday: 'long', day: 'numeric', month: 'long' })
  const completedCount = selectedTasks.filter(task => task.completed_at).length

  const openCreate = (date = activeDate) => {
    setEditingTask(null)
    setForm(blankForm(date))
    setFormError('')
    setActionError('')
    setFormOpen(true)
  }

  const openEdit = (task: PlannerTask) => {
    const start = task.start_at ? partsInTimezone(task.start_at, timezone) : null
    const end = task.end_at ? partsInTimezone(task.end_at, timezone) : null
    setEditingTask(task)
    setForm({
      title: task.title,
      description: task.description ?? '',
      date: task.due_date,
      startTime: start?.time ?? '',
      endTime: end?.time ?? '',
      goalId: task.goal_id ?? '',
    })
    setFormError('')
    setActionError('')
    setFormOpen(true)
  }

  const closeForm = () => { if (!saving) setFormOpen(false) }

  const saveTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return
    setFormError('')
    let startAt: string | null = null
    let endAt: string | null = null
    try {
      if (form.startTime) startAt = dateTimeInTimezoneToIso(form.date, form.startTime, timezone)
      if (form.endTime) endAt = dateTimeInTimezoneToIso(form.date, form.endTime, timezone)
      if (startAt && endAt && Date.parse(endAt) <= Date.parse(startAt)) {
        setFormError('Время окончания должно быть позже времени начала.')
        return
      }
    } catch (error) {
      setFormError(errorMessage(error))
      return
    }

    const draft: PlannerTaskDraft = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      due_date: form.date,
      start_at: startAt,
      end_at: endAt,
      goal_id: form.goalId || null,
    }
    setSaving(true)
    try {
      const updated = editingTask
        ? await updatePlannerTask(editingTask.id, draft)
        : await createPlannerTask(user.id, draft)
      setTasks(current => editingTask
        ? current.map(task => task.id === updated.id ? updated : task).sort(compareTasks)
        : [...current, updated].sort(compareTasks))
      setSelectedDate(updated.due_date)
      setAnchorDate(updated.due_date)
      setFormOpen(false)
    } catch (error) {
      setFormError(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const toggleCompleted = async (task: PlannerTask) => {
    setActionError('')
    try {
      const updated = await setPlannerTaskCompleted(task.id, !task.completed_at)
      setTasks(current => current.map(item => item.id === updated.id ? updated : item))
    } catch (error) {
      setActionError(errorMessage(error))
    }
  }

  const deleteTask = async () => {
    if (!pendingDelete) return
    setSaving(true)
    setActionError('')
    try {
      await deletePlannerTask(pendingDelete.id)
      setTasks(current => current.filter(task => task.id !== pendingDelete.id))
      setPendingDelete(null)
    } catch (error) {
      setActionError(errorMessage(error))
      setPendingDelete(null)
    } finally {
      setSaving(false)
    }
  }

  const moveTask = async (taskId: string, destination: string) => {
    const task = tasks.find(item => item.id === taskId)
    if (!task || task.due_date === destination) return
    setActionError('')
    const daysToMove = dateDifference(task.due_date, destination)
    try {
      const updated = await updatePlannerTask(task.id, {
        title: task.title,
        description: task.description,
        goal_id: task.goal_id,
        due_date: destination,
        start_at: shiftZonedDateTime(task.start_at, daysToMove, timezone),
        end_at: shiftZonedDateTime(task.end_at, daysToMove, timezone),
      })
      setTasks(current => current.map(item => item.id === updated.id ? updated : item).sort(compareTasks))
      setSelectedDate(destination)
      setAnchorDate(destination)
    } catch (error) {
      setActionError(errorMessage(error))
    }
  }

  const handleDrop = (event: DragEvent<HTMLButtonElement>, date: string) => {
    event.preventDefault()
    const taskId = event.dataTransfer.getData('text/planner-task') || draggedTaskId
    setDropDate('')
    setDraggedTaskId('')
    if (taskId) void moveTask(taskId, date)
  }

  const navigate = (direction: -1 | 1) => {
    const next = period === 'month'
      ? shiftMonth(calendarAnchor, direction)
      : addDays(calendarAnchor, direction * 7)
    setAnchorDate(next)
    setSelectedDate(next)
  }

  const goToday = () => { setAnchorDate(today); setSelectedDate(today) }

  return <>
    <PageHeader eyebrow="ТВОЁ ВРЕМЯ" title="Планирование" description="Планируй задачи на день, переноси их по календарю и связывай с целями." action={<Button onClick={() => openCreate()}><Plus size={17} /> Новая задача</Button>} />

    <Card className="planner-toolbar">
      <Tabs label="Период планирования" value={period} onChange={setPeriod} items={[{ value: 'month', label: 'Месяц' }, { value: 'week', label: 'Неделя' }]} />
      <div className="planner-date-nav">
        <Button variant="secondary" onClick={() => navigate(-1)} aria-label={period === 'month' ? 'Предыдущий месяц' : 'Предыдущая неделя'}><ChevronLeft size={16} /></Button>
        <strong>{period === 'month' ? monthLabel : `${formatCalendarDate(days[0], locale, { day: 'numeric', month: 'short' })} — ${formatCalendarDate(days[6], locale, { day: 'numeric', month: 'short' })}`}</strong>
        <Button variant="secondary" onClick={() => navigate(1)} aria-label={period === 'month' ? 'Следующий месяц' : 'Следующая неделя'}><ChevronRight size={16} /></Button>
        <Button variant="ghost" onClick={goToday}>Сегодня</Button>
      </div>
      <div className="planner-count"><CalendarDays size={15} /><span>{tasks.length} {pluralize(tasks.length, 'задача', 'задачи', 'задач')}</span></div>
    </Card>

    {actionError && <div className="planner-error" role="alert">{actionError}</div>}
    {loading ? <Card className="planner-state"><p role="status">Загружаю планы…</p></Card> : loadError ? <Card className="planner-state"><EmptyState icon={<CalendarDays size={24} />} title="Не получилось загрузить календарь">{loadError}</EmptyState><Button variant="secondary" onClick={() => void load()}>Попробовать снова</Button></Card> : <>
      <Card className="planner-calendar" aria-label={period === 'month' ? `Календарь: ${monthLabel}` : 'Календарь недели'}>
        <div className="calendar-weekdays" aria-hidden="true">{weekdays.map((weekday, index) => <span key={`${weekday}-${index}`}>{weekday}</span>)}</div>
        <div className={`calendar-grid ${period === 'week' ? 'calendar-grid-week' : ''}`}>
          {days.map(date => {
            const dayTasks = tasksByDate.get(date) ?? []
            const outsideMonth = date.slice(0, 7) !== calendarAnchor.slice(0, 7)
            const isSelected = date === activeDate
            const classes = ['calendar-day', date === today && 'is-today', isSelected && 'is-selected', outsideMonth && period === 'month' && 'is-outside', dropDate === date && 'is-drop-target'].filter(Boolean).join(' ')
            return <button
              className={classes}
              type="button"
              key={date}
              onClick={() => { setSelectedDate(date); setAnchorDate(date) }}
              onDragOver={event => { event.preventDefault(); setDropDate(date) }}
              onDragLeave={() => setDropDate(current => current === date ? '' : current)}
              onDrop={event => handleDrop(event, date)}
              aria-label={`${formatCalendarDate(date, locale, { weekday: 'long', day: 'numeric', month: 'long' })}, ${dayTasks.length} ${pluralize(dayTasks.length, 'задача', 'задачи', 'задач')}`}
              aria-pressed={isSelected}
            >
              <span className="calendar-day-number">{Number(date.slice(-2))}</span>
              {dayTasks.length > 0 && <span className="calendar-day-tasks"><span className="calendar-task-dots">{dayTasks.slice(0, 3).map(task => <i key={task.id} className={task.completed_at ? 'is-done' : ''} />)}</span><span className="calendar-task-count">{dayTasks.length}</span></span>}
            </button>
          })}
        </div>
      </Card>

      <section className="planner-day-section" aria-labelledby="planner-day-heading">
        <div className="planner-day-heading">
          <div><span className="planner-day-kicker">ВЫБРАННЫЙ ДЕНЬ</span><h2 id="planner-day-heading">{selectedLabel}</h2></div>
          <div className="planner-day-summary">{selectedTasks.length > 0 ? <><strong>{completedCount}/{selectedTasks.length}</strong><span> выполнено</span></> : <span>Пока свободно</span>}</div>
        </div>
        {selectedTasks.length === 0 ? <Card className="planner-empty-day"><EmptyState icon={<CalendarDays size={22} />} title="На этот день планов нет">Добавь задачу или выбери другой день в календаре.</EmptyState><Button onClick={() => openCreate(activeDate)}><Plus size={15} /> Добавить задачу</Button></Card> : <div className="planner-task-list">
          {selectedTasks.map(task => <PlannerTaskCard
            key={task.id}
            task={task}
            goal={goals.find(goal => goal.id === task.goal_id) ?? null}
            timezone={timezone}
            locale={locale}
            overdue={!task.completed_at && task.due_date < today}
            conflicting={conflictingTaskIds.has(task.id)}
            onToggle={() => void toggleCompleted(task)}
            onEdit={() => openEdit(task)}
            onDelete={() => setPendingDelete(task)}
            onDragStart={event => { setDraggedTaskId(task.id); event.dataTransfer.setData('text/planner-task', task.id); event.dataTransfer.effectAllowed = 'move' }}
            onDragEnd={() => { setDraggedTaskId(''); setDropDate('') }}
          />)}
        </div>}
      </section>
      <p className="planner-hint">Перенеси задачу перетаскиванием на другой день или измени дату через редактирование.</p>
    </>}

    <Modal open={formOpen} title={editingTask ? 'Редактировать задачу' : 'Новая задача'} onClose={closeForm}>
      <form className="planner-form" onSubmit={event => void saveTask(event)}>
        <label className="planner-field"><span>Название <b aria-hidden="true">*</b></span><Input autoFocus required maxLength={160} value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="Что нужно сделать?" /></label>
        <label className="planner-field"><span>Описание</span><textarea className="input planner-textarea" maxLength={2000} rows={3} value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} placeholder="Детали, материалы или заметки" /></label>
        <label className="planner-field"><span>День</span><Input type="date" required value={form.date} onChange={event => setForm(current => ({ ...current, date: event.target.value }))} /></label>
        <div className="planner-time-fields">
          <label className="planner-field"><span>Начало · необязательно</span><Input type="time" value={form.startTime} onChange={event => setForm(current => ({ ...current, startTime: event.target.value }))} /></label>
          <label className="planner-field"><span>Окончание · необязательно</span><Input type="time" value={form.endTime} onChange={event => setForm(current => ({ ...current, endTime: event.target.value }))} /></label>
        </div>
        <label className="planner-field"><span>Связать с активной целью</span><select className="input" value={form.goalId} onChange={event => setForm(current => ({ ...current, goalId: event.target.value }))}><option value="">Без привязки</option>{activeGoals.map(goal => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select></label>
        {formError && <div className="planner-error" role="alert">{formError}</div>}
        <div className="planner-form-actions"><Button type="button" variant="secondary" disabled={saving} onClick={closeForm}>Отмена</Button><Button type="submit" disabled={saving}>{saving ? 'Сохраняю…' : editingTask ? 'Сохранить' : 'Добавить задачу'}</Button></div>
      </form>
    </Modal>

    <Modal open={Boolean(pendingDelete)} title="Удалить задачу?" onClose={() => { if (!saving) setPendingDelete(null) }}>
      <div className="planner-delete-copy"><p>«{pendingDelete?.title}» будет удалена из календаря. Это действие нельзя отменить.</p>{actionError && <div className="planner-error" role="alert">{actionError}</div>}<div className="planner-form-actions"><Button variant="secondary" disabled={saving} onClick={() => setPendingDelete(null)}>Оставить</Button><Button className="button-danger" disabled={saving} onClick={() => void deleteTask()}>{saving ? 'Удаляю…' : 'Удалить задачу'}</Button></div></div>
    </Modal>
  </>
}

function PlannerTaskCard({ task, goal, timezone, locale, overdue, conflicting, onToggle, onEdit, onDelete, onDragStart, onDragEnd }: {
  task: PlannerTask
  goal: Goal | null
  timezone: string
  locale: string
  overdue: boolean
  conflicting: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onDragStart: (event: DragEvent<HTMLElement>) => void
  onDragEnd: () => void
}) {
  const done = Boolean(task.completed_at)
  const time = formatTaskTime(task.start_at, task.end_at, timezone, locale)
  return <div className="planner-task-drag" draggable onDragStart={onDragStart} onDragEnd={onDragEnd}>
  <Card className={`planner-task-card ${done ? 'is-completed' : ''}`}>
    <button className="planner-task-check" type="button" onClick={onToggle} aria-label={done ? `Вернуть задачу «${task.title}»` : `Отметить задачу «${task.title}» выполненной`}>{done ? <Check size={17} /> : <Circle size={17} />}</button>
    <div className="planner-task-copy"><div className="planner-task-title-row"><h3>{task.title}</h3>{time && <span className="planner-task-time"><Clock3 size={13} />{time}</span>}</div>{(overdue || conflicting) && <div className="planner-task-flags">{overdue && <span className="planner-flag is-overdue">Просрочена</span>}{conflicting && <span className="planner-flag is-conflict">Пересечение по времени</span>}</div>}{task.description && <p>{task.description}</p>}{goal && <span className="planner-task-goal"><Link2 size={12} />{goal.title}</span>}</div>
    <div className="planner-task-actions"><Button variant="ghost" onClick={onEdit} aria-label={`Изменить задачу «${task.title}»`}><Pencil size={15} /></Button><Button variant="ghost" className="goal-delete-button" onClick={onDelete} aria-label={`Удалить задачу «${task.title}»`}><Trash2 size={15} /></Button></div>
  </Card>
  </div>
}

function compareTasks(a: PlannerTask, b: PlannerTask) {
  return a.due_date.localeCompare(b.due_date) || (a.start_at ?? '').localeCompare(b.start_at ?? '') || a.sort_order - b.sort_order
}

function pluralize(count: number, one: string, few: string, many: string) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}
