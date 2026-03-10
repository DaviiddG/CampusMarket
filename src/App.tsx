import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Onboarding from './pages/Onboarding'
import AuthPortal from './pages/AuthPortal'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import DevelopmentScreen from './pages/DevelopmentScreen'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/auth-portal" replace />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/auth-portal" element={<AuthPortal />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/register" element={<SignUp />} />
        <Route path="/development" element={<DevelopmentScreen />} />
      </Routes>
    </Router>
  )
}

export default App
