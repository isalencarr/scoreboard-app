import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './contexts/AuthProvider'
import { ToastProvider } from './contexts/ToastProvider'
import RequireAuth from './components/auth/RequireAuth'
import AuthCallbackPage from './pages/AuthCallbackPage'
import ControlPage from './pages/ControlPage'
import CreateGamePage from './pages/CreateGamePage'
import HistoryPage from './pages/HistoryPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ScoreboardPage from './pages/ScoreboardPage'

function App() {
  return (
    <ToastProvider>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* Criar jogo exige conta: o jogo passa a ter um dono. */}
            <Route element={<RequireAuth />}>
              <Route path="/scoreboard/new" element={<CreateGamePage />} />
            </Route>

            {/* Placar e controle seguem públicos: a URL/token é o segredo. */}
            <Route path="/scoreboard/:id" element={<ScoreboardPage />} />
            <Route path="/scoreboard/:id/control" element={<ControlPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ToastProvider>
  )
}

export default App
