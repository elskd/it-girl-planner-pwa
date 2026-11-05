import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { MobileNavigation, Sidebar } from './components/Navigation'
import { AuthProvider, useAuth } from './lib/auth/AuthContext'
import GoalsPage from './pages/GoalsPage'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import MaddyPage from './pages/MaddyPage'
import NotFoundPage from './pages/NotFoundPage'
import PlannerPage from './pages/PlannerPage'
import SettingsPage, { type Theme } from './pages/SettingsPage'

function AppContent() {
  const { user, loading, clientReady } = useAuth()
  const location = useLocation()
  const [theme, setTheme] = useState<Theme>(() => localStorage.getItem('it-girl-theme') === 'light' ? 'light' : 'dark')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('it-girl-theme', theme)
  }, [theme])

  if (!clientReady) return <AuthPage mode="setup" />
  if (loading) return <main className="auth-screen"><div className="auth-loading" role="status">Загружаю твоё пространство…</div></main>

  if (!user) {
    if (location.pathname === '/auth/recover') return <AuthPage mode="recover" />
    if (location.pathname === '/auth/reset-password') return <AuthPage mode="expired" />
    if (location.pathname === '/auth') {
      const mode = new URLSearchParams(location.search).get('mode') === 'sign-up' ? 'sign-up' : 'sign-in'
      return <AuthPage mode={mode} />
    }
    return <Navigate to="/auth" replace />
  }

  if (location.pathname === '/auth/reset-password') return <AuthPage mode="reset" />
  if (location.pathname.startsWith('/auth')) return <Navigate to="/" replace />

  return <div className="app-shell min-h-screen">
    <Sidebar />
    <main className="main-area"><div className="page-container">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/maddy" element={<MaddyPage />} />
        <Route path="/settings" element={<SettingsPage theme={theme} setTheme={setTheme} />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <footer className="desktop-footer"><span>IT GIRL PLANNER</span><span>Твой ритм — твои правила</span></footer>
    </div></main>
    <MobileNavigation />
  </div>
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>
}
