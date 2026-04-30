
import { Home, Search, Compass, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab?: 'home' | 'search' | 'explore' | 'upload' | 'profile';
}

const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0UyRThGMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjOTRBM0I4Ii8+PHBhdGggZD0iTTIwIDEwMGEzMCAzMCAwIDAgMSA2MCAwIiBmaWxsPSIjOTRBM0I4Ii8+PC9zdmc+';

export default function BottomNav({ activeTab }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  const isEmprendedor = user?.user_metadata?.role === 'emprendedor';

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.avatar_url) setProfileAvatar(data.avatar_url);
      });
  }, [user]);

  const userAvatar = profileAvatar || user?.user_metadata?.avatar_url || DEFAULT_AVATAR;

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
      className="fixed bottom-0 left-0 right-0 w-full h-[61px] bg-white border-t border-[#E0E0E0] flex items-center justify-around px-2 lg:hidden z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Inicio */}
      <button
        onClick={() => navigate('/home')}
        className={`p-2 transition-colors ${currentTab === 'home' ? 'text-[#102042]' : 'text-black'}`}
      >
        <Home size={24} strokeWidth={currentTab === 'home' ? 2.5 : 2} />
      </button>

      {/* Buscar (lupa) */}
      <button
        onClick={() => navigate('/search')}
        className={`p-2 transition-colors ${currentTab === 'search' ? 'text-[#102042]' : 'text-black'}`}
      >
        <Search size={24} strokeWidth={currentTab === 'search' ? 2.5 : 2} />
      </button>

      {/* Explorar (brújula) - Para emprendedores se pone al lado de buscar. Para comunes es el centro. */}
      <button
        onClick={() => navigate('/explore')}
        className={`p-2 transition-colors ${currentTab === 'explore' ? 'text-[#102042]' : 'text-black'}`}
      >
        <Compass size={24} strokeWidth={currentTab === 'explore' ? 2.5 : 2} />
      </button>

      {/* Botón + Crear: Solo para emprendedores */}
      {isEmprendedor && (
        <button
          onClick={() => navigate('/upload')}
          className="w-10 h-10 bg-[#102042] rounded-full flex items-center justify-center text-white hover:bg-blue-900 transition-colors shadow-md"
        >
          <Plus size={22} strokeWidth={2} />
        </button>
      )}

      {/* Perfil */}
      <button
        onClick={() => navigate('/profile')}
        className="p-2 transition-all flex items-center justify-center"
      >
        <div
          className={cn(
            'w-7 h-7 rounded-full overflow-hidden border-2 transition-all',
            currentTab === 'profile' ? 'border-[#102042]' : 'border-gray-300'
          )}
        >
          <img
            src={userAvatar}
            alt="Profile"
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
          />
        </div>
      </button>
    </div>
  );
}
