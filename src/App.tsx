import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Onboarding from './pages/Onboarding'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/onboarding" replace />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/register" element={<SignUp />} />
      </Routes>
    </Router>
  )
}

export default App
