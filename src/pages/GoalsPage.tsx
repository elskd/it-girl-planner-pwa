import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Check, ChevronDown, ChevronUp, Circle, Clock3, Goal as GoalIcon, History, Pencil, Plus, Search, Target, Trash2, Undo2 } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Input, Modal, Tabs } from '../components/ui'
import { PageHeader } from '../components/PageHeader'
import { addKeyResultUpdate, createGoal, createKeyResult, deleteGoal, deleteKeyResult, fetchGoals, fetchKeyResultUpdates, fetchKeyResults, setGoalStatus, updateGoal, updateKeyResult, type GoalDraft, type KeyResultDraft } from '../lib/data/goals'
import type { Goal, GoalStatus, KeyResult, KeyResultUpdate } from '../lib/supabase/database.types'
import { useAuth } from '../lib/auth/AuthContext'

type StatusFilter = 'all' | GoalStatus
type GoalFormState = { title: string; description: string; category: string; startDate: string; dueDate: string }
type ResultFormState = { title: string; metricType: KeyResult['metric_type']; direction: 'increase' | 'decrease'; startValue: string; targetValue: string; unit: string; weight: string }
type UpdateFormState = { numericValue: string; booleanValue: boolean; note: string }

const emptyForm: GoalFormState = { title: '', description: '', category: '', startDate: '', dueDate: '' }
const emptyResultForm: ResultFormState = { title: '', metricType: 'numeric', direction: 'increase', startValue: '0', targetValue: '1', unit: '', weight: '1' }

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
  const [keyResults, setKeyResults] = useState<KeyResult[]>([])
  const [keyResultUpdates, setKeyResultUpdates] = useState<KeyResultUpdate[]>([])
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
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [editingResult, setEditingResult] = useState<KeyResult | null>(null)
  const [resultFormOpen, setResultFormOpen] = useState(false)
  const [resultForm, setResultForm] = useState<ResultFormState>(emptyResultForm)
  const [resultFormError, setResultFormError] = useState('')
  const [pendingDeleteResult, setPendingDeleteResult] = useState<KeyResult | null>(null)
  const [updatingResult, setUpdatingResult] = useState<KeyResult | null>(null)
  const [updateForm, setUpdateForm] = useState<UpdateFormState>({ numericValue: '', booleanValue: false, note: '' })
  const [updateFormError, setUpdateFormError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [nextGoals, nextResults, nextUpdates] = await Promise.all([fetchGoals(), fetchKeyResults(), fetchKeyResultUpdates()])
      setGoals(nextGoals)
      setKeyResults(nextResults)
      setKeyResultUpdates(nextUpdates)
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

  const openCreateResult = (goal: Goal) => {
    setSelectedGoal(goal)
    setEditingResult(null)
    setResultForm(emptyResultForm)
    setResultFormError('')
    setActionError('')
    setResultFormOpen(true)
  }

  const openEditResult = (goal: Goal, result: KeyResult) => {
    setSelectedGoal(goal)
    setEditingResult(result)
    setResultForm({
      title: result.title,
      metricType: result.metric_type,
      direction: result.direction ?? 'increase',
      startValue: result.start_value?.toString() ?? '0',
      targetValue: result.target_value?.toString() ?? '1',
      unit: result.unit ?? '',
      weight: result.weight.toString(),
    })
    setResultFormError('')
    setResultFormOpen(true)
  }

  const saveResult = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user || !selectedGoal) return
    const startValue = Number(resultForm.startValue)
    const targetValue = Number(resultForm.targetValue)
    const weight = Number(resultForm.weight)
    if (resultForm.metricType === 'numeric' && (!Number.isFinite(startValue) || !Number.isFinite(targetValue) || startValue === targetValue)) {
      setResultFormError('Начальное и целевое значения должны быть числами и отличаться друг от друга.')
      return
    }
    if (!Number.isFinite(weight) || weight <= 0 || weight > 1000) {
      setResultFormError('Вес должен быть больше 0 и не более 1000.')
      return
    }
    const draft: KeyResultDraft = {
      title: resultForm.title.trim(),
      metric_type: resultForm.metricType,
      direction: resultForm.metricType === 'numeric' ? resultForm.direction : null,
      start_value: resultForm.metricType === 'numeric' ? startValue : null,
      target_value: resultForm.metricType === 'numeric' ? targetValue : null,
      unit: resultForm.metricType === 'numeric' ? resultForm.unit.trim() || null : null,
      weight,
    }
    setSaving(true)
    setResultFormError('')
    try {
      const result = editingResult
        ? await updateKeyResult(editingResult.id, draft)
        : await createKeyResult(user.id, selectedGoal.id, draft)
      setKeyResults(current => editingResult
        ? current.map(item => item.id === result.id ? result : item)
        : [...current, result])
      setResultFormOpen(false)
    } catch (error) {
      setResultFormError(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteResult = async () => {
    if (!pendingDeleteResult) return
    setSaving(true)
    setActionError('')
    try {
      await deleteKeyResult(pendingDeleteResult.id)
      setKeyResults(current => current.filter(item => item.id !== pendingDeleteResult.id))
      setKeyResultUpdates(current => current.filter(item => item.key_result_id !== pendingDeleteResult.id))
      setPendingDeleteResult(null)
    } catch (error) {
      setActionError(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const openUpdate = (result: KeyResult) => {
    const latest = keyResultUpdates.find(update => update.key_result_id === result.id)
    setUpdatingResult(result)
    setUpdateForm({
      numericValue: (latest?.numeric_value ?? result.start_value ?? 0).toString(),
      booleanValue: latest?.boolean_value ?? false,
      note: '',
    })
    setUpdateFormError('')
  }

  const saveUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user || !updatingResult) return
    const numericValue = Number(updateForm.numericValue)
    if (updatingResult.metric_type === 'numeric' && !Number.isFinite(numericValue)) {
      setUpdateFormError('Введи корректное число.')
      return
    }
    setSaving(true)
    setUpdateFormError('')
    try {
      const update = await addKeyResultUpdate(user.id, updatingResult.id, {
        numeric_value: updatingResult.metric_type === 'numeric' ? numericValue : null,
        boolean_value: updatingResult.metric_type === 'boolean' ? updateForm.booleanValue : null,
        note: updateForm.note.trim() || null,
      })
      setKeyResultUpdates(current => [update, ...current])
      setUpdatingResult(null)
    } catch (error) {
      setUpdateFormError(errorMessage(error))
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
      {visibleGoals.map(goal => <GoalCard
        key={goal.id}
        goal={goal}
        results={keyResults.filter(result => result.goal_id === goal.id)}
        updates={keyResultUpdates}
        onEdit={() => openEdit(goal)}
        onDelete={() => setPendingDelete(goal)}
        onToggleStatus={() => void handleStatus(goal)}
        onAddResult={() => openCreateResult(goal)}
        onEditResult={result => openEditResult(goal, result)}
        onDeleteResult={setPendingDeleteResult}
        onAddUpdate={openUpdate}
      />)}
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

    <Modal open={resultFormOpen} title={editingResult ? 'Редактировать результат' : 'Новый Key Result'} onClose={() => { if (!saving) setResultFormOpen(false) }}>
      <form className="goal-form" onSubmit={event => void saveResult(event)}>
        <label className="goal-field"><span>Название результата <b aria-hidden="true">*</b></span><Input autoFocus maxLength={160} required value={resultForm.title} onChange={event => setResultForm(current => ({ ...current, title: event.target.value }))} placeholder="Как поймёшь, что продвинулась?" /></label>
        <label className="goal-field"><span>Тип результата</span><select className="input" value={resultForm.metricType} onChange={event => setResultForm(current => ({ ...current, metricType: event.target.value as KeyResult['metric_type'] }))}><option value="numeric">Измеримый результат</option><option value="boolean">Да / нет</option></select></label>
        {resultForm.metricType === 'numeric' && <>
          <label className="goal-field"><span>Направление</span><select className="input" value={resultForm.direction} onChange={event => setResultForm(current => ({ ...current, direction: event.target.value as ResultFormState['direction'] }))}><option value="increase">Увеличить</option><option value="decrease">Уменьшить</option></select></label>
          <div className="goal-date-fields"><label className="goal-field"><span>Сейчас</span><Input type="number" step="any" required value={resultForm.startValue} onChange={event => setResultForm(current => ({ ...current, startValue: event.target.value }))} /></label><label className="goal-field"><span>Цель</span><Input type="number" step="any" required value={resultForm.targetValue} onChange={event => setResultForm(current => ({ ...current, targetValue: event.target.value }))} /></label></div>
          <label className="goal-field"><span>Единица измерения</span><Input maxLength={30} value={resultForm.unit} onChange={event => setResultForm(current => ({ ...current, unit: event.target.value }))} placeholder="кг, страниц, ₽, часов" /></label>
        </>}
        <label className="goal-field"><span>Вес в прогрессе цели</span><Input type="number" min="0.01" max="1000" step="any" required value={resultForm.weight} onChange={event => setResultForm(current => ({ ...current, weight: event.target.value }))} /><small>Чем выше вес, тем сильнее этот результат влияет на общий процент.</small></label>
        {resultFormError && <div className="goals-error" role="alert">{resultFormError}</div>}
        <div className="goal-form-actions"><Button type="button" variant="secondary" disabled={saving} onClick={() => setResultFormOpen(false)}>Отмена</Button><Button type="submit" disabled={saving}>{saving ? 'Сохраняю…' : 'Сохранить результат'}</Button></div>
      </form>
    </Modal>

    <Modal open={Boolean(updatingResult)} title="Отметить прогресс" onClose={() => { if (!saving) setUpdatingResult(null) }}>
      <form className="goal-form" onSubmit={event => void saveUpdate(event)}>
        <p className="result-update-title">{updatingResult?.title}</p>
        {updatingResult?.metric_type === 'numeric'
          ? <label className="goal-field"><span>Текущее значение{updatingResult.unit && ` (${updatingResult.unit})`}</span><Input autoFocus type="number" step="any" required value={updateForm.numericValue} onChange={event => setUpdateForm(current => ({ ...current, numericValue: event.target.value }))} /></label>
          : <label className="result-check-field"><input type="checkbox" checked={updateForm.booleanValue} onChange={event => setUpdateForm(current => ({ ...current, booleanValue: event.target.checked }))} /><span>Результат выполнен</span></label>}
        <label className="goal-field"><span>Заметка</span><textarea className="input goal-textarea" maxLength={1000} rows={3} value={updateForm.note} onChange={event => setUpdateForm(current => ({ ...current, note: event.target.value }))} placeholder="Что изменилось?" /></label>
        {updateFormError && <div className="goals-error" role="alert">{updateFormError}</div>}
        <div className="goal-form-actions"><Button type="button" variant="secondary" disabled={saving} onClick={() => setUpdatingResult(null)}>Отмена</Button><Button type="submit" disabled={saving}>{saving ? 'Сохраняю…' : 'Добавить отметку'}</Button></div>
      </form>
    </Modal>

    <Modal open={Boolean(pendingDeleteResult)} title="Удалить Key Result?" onClose={() => { if (!saving) setPendingDeleteResult(null) }}>
      <div className="goal-delete-copy"><p>«{pendingDeleteResult?.title}» и его история отметок будут удалены. Общий прогресс цели пересчитается.</p>{actionError && <div className="goals-error" role="alert">{actionError}</div>}<div className="goal-form-actions"><Button variant="secondary" disabled={saving} onClick={() => setPendingDeleteResult(null)}>Оставить</Button><Button className="button-danger" disabled={saving} onClick={() => void handleDeleteResult()}>{saving ? 'Удаляю…' : 'Удалить результат'}</Button></div></div>
    </Modal>
  </>
}

function GoalCard({ goal, results, updates, onEdit, onDelete, onToggleStatus, onAddResult, onEditResult, onDeleteResult, onAddUpdate }: {
  goal: Goal
  results: KeyResult[]
  updates: KeyResultUpdate[]
  onEdit: () => void
  onDelete: () => void
  onToggleStatus: () => void
  onAddResult: () => void
  onEditResult: (result: KeyResult) => void
  onDeleteResult: (result: KeyResult) => void
  onAddUpdate: (result: KeyResult) => void
}) {
  const completed = goal.status === 'completed'
  const progress = getGoalProgress(results, updates)
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
      <div className="goal-progress-summary">
        <div><span>Прогресс цели</span><strong>{progress}%</strong></div>
        <div className="goal-progress-track"><span style={{ width: `${progress}%` }} /></div>
        <small>{results.length ? `${results.length} ${pluralize(results.length, 'результат', 'результата', 'результатов')}, расчёт по весам` : 'Добавь Key Results, чтобы считать прогресс'}</small>
      </div>
      <section className="key-results-section" aria-label={`Результаты цели ${goal.title}`}>
        <div className="key-results-heading"><h3><Target size={16} /> Key Results</h3><Button variant="secondary" onClick={onAddResult}><Plus size={15} /> Добавить</Button></div>
        {results.length === 0 ? <p className="key-results-empty">Разбей цель на измеримые шаги или добавь результат «да / нет».</p> : <div className="key-results-list">{results.map(result => <KeyResultCard key={result.id} result={result} updates={updates.filter(item => item.key_result_id === result.id)} onEdit={() => onEditResult(result)} onDelete={() => onDeleteResult(result)} onAddUpdate={() => onAddUpdate(result)} />)}</div>}
      </section>
    </div>
    <div className="goal-actions">
      <Button variant="ghost" onClick={onToggleStatus} aria-label={completed ? `Вернуть цель «${goal.title}» в активные` : `Отметить цель «${goal.title}» выполненной`} title={completed ? 'Вернуть в активные' : 'Отметить выполненной'}>{completed ? <Undo2 size={16} /> : <Check size={16} />}<span>{completed ? 'Вернуть' : 'Выполнена'}</span></Button>
      <Button variant="ghost" onClick={onEdit} aria-label={`Редактировать цель «${goal.title}»`} title="Редактировать"><Pencil size={16} /><span>Изменить</span></Button>
      <Button variant="ghost" className="goal-delete-button" onClick={onDelete} aria-label={`Удалить цель «${goal.title}»`} title="Удалить"><Trash2 size={16} /><span>Удалить</span></Button>
    </div>
  </Card>
}

function KeyResultCard({ result, updates, onEdit, onDelete, onAddUpdate }: { result: KeyResult; updates: KeyResultUpdate[]; onEdit: () => void; onDelete: () => void; onAddUpdate: () => void }) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const latest = updates[0]
  const currentNumeric = latest?.numeric_value ?? result.start_value ?? 0
  const currentBoolean = latest?.boolean_value ?? false
  const progress = getKeyResultProgress(result, latest)
  const progressLabel = result.metric_type === 'numeric'
    ? `${formatNumber(currentNumeric)}${result.unit ? ` ${result.unit}` : ''} из ${formatNumber(result.target_value ?? 0)}${result.unit ? ` ${result.unit}` : ''}`
    : currentBoolean ? 'Выполнено' : 'Не выполнено'
  return <article className="key-result-card">
    <div className="key-result-top"><div><h4>{result.title}</h4><span className="key-result-value">{progressLabel}</span></div><Badge>{`Вес ${formatNumber(result.weight)}`}</Badge></div>
    <div className="goal-progress-track key-result-progress-track"><span style={{ width: `${progress}%` }} /></div>
    <div className="key-result-meta"><span>{result.metric_type === 'boolean' ? 'Да / нет' : result.direction === 'decrease' ? 'Цель — уменьшить' : 'Цель — увеличить'}</span><strong>{progress}%</strong></div>
    <div className="key-result-actions"><Button variant="ghost" onClick={onAddUpdate}><Plus size={14} /> Отметить</Button><Button variant="ghost" onClick={() => setHistoryOpen(open => !open)} aria-expanded={historyOpen}>{historyOpen ? <ChevronUp size={14} /> : <History size={14} />} История {historyOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</Button><Button variant="ghost" onClick={onEdit} aria-label={`Изменить ${result.title}`}><Pencil size={14} /> Изменить</Button><Button variant="ghost" className="goal-delete-button" onClick={onDelete} aria-label={`Удалить ${result.title}`}><Trash2 size={14} /> Удалить</Button></div>
    {historyOpen && <div className="key-result-history"><h5>История отметок</h5>{updates.length === 0 ? <p>Отметок пока нет.</p> : updates.slice(0, 5).map(update => <div className="key-result-history-row" key={update.id}><time>{new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(update.recorded_at))}</time><span>{update.numeric_value !== null ? `${formatNumber(update.numeric_value)}${result.unit ? ` ${result.unit}` : ''}` : update.boolean_value ? 'Выполнено' : 'Не выполнено'}</span>{update.note && <small>{update.note}</small>}</div>)}</div>}
  </article>
}

function getKeyResultProgress(result: KeyResult, latest?: KeyResultUpdate) {
  if (result.metric_type === 'boolean') return latest?.boolean_value ? 100 : 0
  const start = result.start_value ?? 0
  const target = result.target_value ?? 0
  const current = latest?.numeric_value ?? start
  const fraction = result.direction === 'decrease'
    ? (start - current) / (start - target)
    : (current - start) / (target - start)
  return Math.round(Math.max(0, Math.min(1, fraction)) * 100)
}

function getGoalProgress(results: KeyResult[], updates: KeyResultUpdate[]) {
  if (!results.length) return 0
  const totalWeight = results.reduce((sum, result) => sum + result.weight, 0)
  if (!totalWeight) return 0
  const weighted = results.reduce((sum, result) => {
    const latest = updates.find(update => update.key_result_id === result.id)
    return sum + getKeyResultProgress(result, latest) * result.weight
  }, 0)
  return Math.round(weighted / totalWeight)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value)
}

function pluralize(count: number, one: string, few: string, many: string) {
  const mod10 = count % 10
  const mod100 = count % 100
  return mod10 === 1 && mod100 !== 11 ? one : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? few : many
}
