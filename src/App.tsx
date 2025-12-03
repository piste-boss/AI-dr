import { Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import './App.css'
import AdminPage from './pages/AdminPage'
import LandingPage from './pages/LandingPage'
import ModePage from './pages/ModePage'
import type { ModeType } from './types'

const AppHeader = () => {
  const { pathname } = useLocation()
  const isModePage = pathname.startsWith('/mode')

  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-icon">Δ</span>
        <div>
          <div className="brand-title">AI Advisor</div>
          <div className="brand-subtitle">Medical & Fitness</div>
        </div>
      </div>
      <nav>
        <Link to="/" className={pathname === '/' ? 'active' : ''}>
          ホーム
        </Link>
        <Link to="/admin" className={pathname === '/admin' ? 'active' : ''}>
          管理画面
        </Link>
        {isModePage && <span className="breadcrumb">解析ページ</span>}
      </nav>
    </header>
  )
}

function App() {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/mode/:mode" element={<ModeRoute />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function ModeRoute() {
  const params = useParams()
  const mode = params.mode as ModeType

  if (mode !== 'medical' && mode !== 'fitness') {
    return <Navigate to="/" replace />
  }
  return <ModePage mode={mode} />
}

export default App
