import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { HashRouter } from 'react-router-dom'
import App from './App'

afterEach(() => { cleanup(); localStorage.clear() })
function renderApp() { return render(<HashRouter><App /></HashRouter>) }

describe('It Girl Planner foundation', () => {
  it('renders the dashboard and primary navigation', () => {
    renderApp()
    expect(screen.getByRole('heading', { name: 'Твоё пространство' })).toBeInTheDocument()
    expect(screen.getAllByRole('navigation', { name: 'Основная навигация' })).toHaveLength(2)
    expect(screen.getByText('Твой фокус')).toBeInTheDocument()
  })
  it('switches and persists the theme', () => {
    renderApp()
    fireEvent.click(screen.getAllByRole('link', { name: 'Настройки' })[0])
    fireEvent.click(screen.getByRole('button', { name: /Light Feminine/ }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    expect(localStorage.getItem('it-girl-theme')).toBe('light')
  })
})
