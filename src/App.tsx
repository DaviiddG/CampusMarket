import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthContext } from '@/contexts/AuthContext'
import Onboarding from './pages/Onboarding'
import AuthPortal from './pages/AuthPortal'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import DevelopmentScreen from './pages/DevelopmentScreen'

function AppRoutes() {
  const { session, loading } = useAuthContext();

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"></div>;
  }

  return (
    <Routes>
      <Route path="/" element={session ? <Navigate to="/development" replace /> : <Navigate to="/auth-portal" replace />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/auth-portal" element={session ? <Navigate to="/development" replace /> : <AuthPortal />} />
      <Route path="/login" element={<SignIn />} />
      <Route path="/register" element={<SignUp />} />
      <Route path="/development" element={session ? <DevelopmentScreen /> : <Navigate to="/auth-portal" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}

export default App
