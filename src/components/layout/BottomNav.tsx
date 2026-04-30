
import { Home, Search, Compass, Plus, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

interface BottomNavProps {
  activeTab?: 'home' | 'search' | 'explore' | 'upload' | 'profile';
}

export default function BottomNav({ activeTab }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();

  const isEmprendedor = user?.user_metadata?.role === 'emprendedor';

  const currentTab = activeTab || (
    location.pathname === '/home' ? 'home'
    : location.pathname === '/profile' ? 'profile'
    : location.pathname === '/search' ? 'search'
    : location.pathname === '/explore' ? 'explore'
    : location.pathname === '/upload' ? 'upload'
    : ''
  );

  return (
    <div
      className="fixed bottom-0 left-0 right-0 w-full h-[61px] bg-white dark:bg-black border-t border-[#E0E0E0] dark:border-white/10 flex items-center justify-around px-2 lg:hidden z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Inicio */}
      <button
        onClick={() => navigate('/home')}
        className={`p-2 transition-colors ${currentTab === 'home' ? 'text-[#102042] dark:text-[#9AD7F3]' : 'text-black dark:text-white'}`}
      >
        <Home size={24} strokeWidth={currentTab === 'home' ? 2.5 : 2} />
      </button>

      {/* Buscar (lupa) */}
      <button
        onClick={() => navigate('/search')}
        className={`p-2 transition-colors ${currentTab === 'search' ? 'text-[#102042] dark:text-[#9AD7F3]' : 'text-black dark:text-white'}`}
      >
        <Search size={24} strokeWidth={currentTab === 'search' ? 2.5 : 2} />
      </button>

      {/* Centro: + si es emprendedor, Explorar (compass) si es usuario común */}
      {isEmprendedor ? (
        <button
          onClick={() => navigate('/upload')}
          className="w-10 h-10 bg-[#102042] dark:bg-[#9AD7F3] rounded-full flex items-center justify-center text-white dark:text-black hover:bg-blue-900 dark:hover:bg-blue-300 transition-colors shadow-md"
        >
          <Plus size={22} strokeWidth={2} />
        </button>
      ) : (
        <button
          onClick={() => navigate('/explore')}
          className={`p-2 transition-colors ${currentTab === 'explore' ? 'text-[#102042] dark:text-[#9AD7F3]' : 'text-black dark:text-white'}`}
        >
          <Compass size={24} strokeWidth={currentTab === 'explore' ? 2.5 : 2} />
        </button>
      )}

      {/* Perfil */}
      <button
        onClick={() => navigate('/profile')}
        className={`p-2 transition-colors ${currentTab === 'profile' ? 'text-[#102042] dark:text-[#9AD7F3]' : 'text-black dark:text-white'}`}
      >
        <User size={24} strokeWidth={currentTab === 'profile' ? 2.5 : 2} />
      </button>
    </div>
  );
}
