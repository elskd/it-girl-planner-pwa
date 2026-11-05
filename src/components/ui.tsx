import { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, useEffect, useId, useRef } from 'react'

export function Button({ children, variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>
}
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) { return <section className={`card ${className}`}>{children}</section> }
export function Input(props: InputHTMLAttributes<HTMLInputElement>) { return <input className={`input ${props.className ?? ''}`} {...props} /> }
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' }) { return <span className={`badge badge-${tone}`}>{children}</span> }
export function Tabs<T extends string>({ items, value, onChange, label }: { items: { value: T; label: string }[]; value: T; onChange: (value: T) => void; label: string }) {
  const id = useId()
  const select = (index: number) => {
    const next = items[(index + items.length) % items.length]
    onChange(next.value)
    document.getElementById(`${id}-${next.value}`)?.focus()
  }
  return <div className="tabs" role="tablist" aria-label={label}>{items.map((item, index) => <button id={`${id}-${item.value}`} key={item.value} role="tab" tabIndex={value === item.value ? 0 : -1} aria-selected={value === item.value} className={`tab ${value === item.value ? 'is-active' : ''}`} onClick={() => onChange(item.value)} onKeyDown={event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); select(index + 1) }
    if (event.key === 'ArrowLeft') { event.preventDefault(); select(index - 1) }
    if (event.key === 'Home') { event.preventDefault(); select(0) }
    if (event.key === 'End') { event.preventDefault(); select(items.length - 1) }
  }}>{item.label}</button>)}</div>
}
export function ProgressBar({ value = 0, label = 'Прогресс' }: { value?: number; label?: string }) {
  const safeValue = Math.max(0, Math.min(100, value))
  return <div className="progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeValue}><span style={{ width: `${safeValue}%` }} /></div>
}
export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon" aria-hidden="true">{icon}</div><h3>{title}</h3><p>{children}</p></div>
}
export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const dialogRef = useRef<HTMLElement | null>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])
  useEffect(() => {
    if (!open) return
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = dialogRef.current
    const focusable = () => dialog?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
    const first = dialog?.querySelector<HTMLElement>('[autofocus]') ?? focusable()?.[0]
    ;(first ?? dialog)?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { onCloseRef.current(); return }
      if (event.key !== 'Tab') return
      const elements = focusable()
      if (!elements?.length) { event.preventDefault(); dialog?.focus(); return }
      const firstElement = elements[0]
      const lastElement = elements[elements.length - 1]
      if (event.shiftKey && document.activeElement === firstElement) { event.preventDefault(); lastElement.focus() }
      else if (!event.shiftKey && document.activeElement === lastElement) { event.preventDefault(); firstElement.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus.current?.focus()
    }
  }, [open])
  if (!open) return null
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}><section ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabIndex={-1}><button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть">×</button><h2 id="modal-title">{title}</h2>{children}</section></div>
}
