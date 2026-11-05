import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { MobileNavigation, Sidebar } from './components/Navigation'
import GoalsPage from './pages/GoalsPage'
import HomePage from './pages/HomePage'
import MaddyPage from './pages/MaddyPage'
import NotFoundPage from './pages/NotFoundPage'
import PlannerPage from './pages/PlannerPage'
import SettingsPage, { type Theme } from './pages/SettingsPage'

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => localStorage.getItem('it-girl-theme') === 'light' ? 'light' : 'dark')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('it-girl-theme', theme)
  }, [theme])

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
