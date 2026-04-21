
import { Home, Search, User, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface BottomNavProps {
  activeTab?: 'home' | 'search' | 'upload' | 'profile';
}

export default function BottomNav({ activeTab }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const currentTab = activeTab || (location.pathname === '/home' ? 'home' : location.pathname === '/profile' ? 'profile' : '');


  return (
    <div className="w-full h-[61px] bg-white border-t border-[#E0E0E0] md:border-none flex items-center justify-between px-6 lg:hidden">
      <button 
        onClick={() => navigate('/home')}
        className={`p-2 transition-colors ${currentTab === 'home' ? 'text-blue-600' : 'text-black'}`}
      >
        <Home size={24} strokeWidth={2} />
      </button>
      <button className="p-2 text-black hover:text-gray-600 transition-colors">
        <Search size={24} strokeWidth={2} />
      </button>
      <button 
        onClick={() => navigate('/upload')}
        className="w-10 h-10 bg-[#102042] rounded-full flex items-center justify-center text-white hover:bg-blue-900 transition-colors shadow-md"
      >
        <Plus size={24} strokeWidth={2} />
      </button>
      <button 
        onClick={() => navigate('/profile')}
        className={`p-2 transition-colors ${currentTab === 'profile' ? 'text-blue-600' : 'text-black'}`}
      >
        <User size={24} strokeWidth={2} />
      </button>
    </div>
  );
}
