import { type ReactNode } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthContext } from '@/contexts/AuthContext'
import Onboarding from './pages/Onboarding'
import AuthPortal from './pages/AuthPortal'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Home from './pages/Home'
import DevelopmentScreen from './pages/DevelopmentScreen'
import Personalization from './pages/Personalization'
import Profile from './pages/Profile'
import CompleteProfile from './pages/CompleteProfile'
import UploadProduct from './pages/UploadProduct'
import UserProfile from './pages/UserProfile'
import LeaveReview from './pages/LeaveReview'

function AppRoutes() {
  const { session, loading } = useAuthContext();

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"></div>;
  }

  const userMetadata = session?.user?.user_metadata || {};
  const hasSeenOnboarding = userMetadata.has_seen_onboarding || localStorage.getItem('hasSeenOnboarding');
  const hasPersonalized = userMetadata.has_personalized || localStorage.getItem('hasPersonalized');

  const RequireOnboarding = ({ children }: { children: ReactNode }) => {
    if (!session) return <Navigate to="/auth-portal" replace />;
    if (!hasSeenOnboarding) return <Navigate to="/onboarding" replace />;
    if (!hasPersonalized) return <Navigate to="/personalization" replace />;
    return children;
  };

  return (
    <Routes>
      <Route path="/" element={session ? <Navigate to="/home" replace /> : <Navigate to="/auth-portal" replace />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/auth-portal" element={session ? <Navigate to="/home" replace /> : <AuthPortal />} />
      <Route path="/login" element={<SignIn />} />
      <Route path="/register" element={<SignUp />} />
      
      {/* App Routes requiring full onboarding */}
      <Route path="/home" element={<RequireOnboarding><Home /></RequireOnboarding>} />
      <Route path="/profile" element={<RequireOnboarding><Profile /></RequireOnboarding>} />
      <Route path="/user/:userId" element={<RequireOnboarding><UserProfile /></RequireOnboarding>} />
      <Route path="/upload" element={<RequireOnboarding><UploadProduct /></RequireOnboarding>} />
      <Route path="/review/:userId" element={<RequireOnboarding><LeaveReview /></RequireOnboarding>} />
      
      {/* Interstitial routes that require session but not full onboarding */}
      <Route path="/personalization" element={session ? <Personalization /> : <Navigate to="/auth-portal" replace />} />
      <Route path="/complete-profile" element={session ? <CompleteProfile /> : <Navigate to="/auth-portal" replace />} />
      <Route path="/development" element={session ? <DevelopmentScreen /> : <Navigate to="/auth-portal" replace />} />
    </Routes>
  );
}

import { FeedProvider } from '@/contexts/FeedContext'
import { NotificationProvider } from '@/contexts/NotificationContext'

function App() {
  return (
    <Router>
      <NotificationProvider>
        <FeedProvider>
          <AppRoutes />
        </FeedProvider>
      </NotificationProvider>
    </Router>
  )
}

export default App