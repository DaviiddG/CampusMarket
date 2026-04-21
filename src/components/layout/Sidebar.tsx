import { useState, useEffect } from 'react';
import { Home, PlusSquare, Bell, LogOut, Compass } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import logoUrl from '@/assets/logo.png';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function Sidebar() {
  const location = useLocation();
  const { unreadCount, markAllAsRead } = useNotificationContext();
  const { user } = useAuthContext();
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

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

  const navItems = [
    { label: 'Inicio', icon: Home, path: '/home' },
    { label: 'Explorar', icon: Compass, path: '/development' },
    { label: 'Crear', icon: PlusSquare, path: '/upload' },
    { 
      label: 'Notificaciones', 
      icon: Bell, 
      path: '#', 
      badge: unreadCount,
      onClick: () => {
        window.dispatchEvent(new CustomEvent('toggleNotifications'));
        markAllAsRead();
      }
    },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const userAvatar = profileAvatar || user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.id}`;

  return (
    <aside className="hidden lg:flex flex-col w-[245px] h-screen border-r border-gray-100 bg-white px-3 py-8 sticky top-0 flex-shrink-0 z-50">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <Link to="/home" className="px-3 mb-12 flex items-center justify-start transition-transform active:scale-95">
          <img src={logoUrl} alt="CampusMarket" className="h-[52px] w-auto object-contain" />
        </Link>

        {/* Nav Items - Spaced out for vertical balance */}
        <nav className="flex-1 space-y-5 flex flex-col justify-center">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={item.onClick}
              className={cn(
                "flex items-center gap-4 px-3 py-3 rounded-xl transition-all group",
                isActive 
                  ? "text-black" 
                  : "text-black/80 hover:bg-gray-50 hover:text-black"
              )}
            >
              <div className="relative">
                <Icon 
                  size={26} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn("transition-transform group-hover:scale-105")} 
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[16px] font-roboto hidden xl:block",
                isActive ? "font-bold" : "font-normal"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Profile Item inside Nav List (near bottom) */}
        <div className="pt-2">
          <Link
            to="/profile"
            className={cn(
              "flex items-center gap-4 px-3 py-3 rounded-xl transition-all group",
              location.pathname === '/profile'
                ? "text-black"
                : "text-black/80 hover:bg-gray-50 hover:text-black"
            )}
          >
            <div className={cn(
              "relative w-7 h-7 rounded-full overflow-hidden border transition-all group-hover:scale-105",
              location.pathname === '/profile' ? "border-black border-2" : "border-gray-200"
            )}>
              <img 
                src={userAvatar} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className={cn(
              "text-[16px] font-roboto hidden xl:block",
              location.pathname === '/profile' ? "font-bold" : "font-normal"
            )}>
              Perfil
            </span>
          </Link>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto space-y-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 px-3 py-3 w-full rounded-xl text-red-500 hover:bg-red-50 transition-colors group"
        >
          <LogOut size={26} className="group-hover:translate-x-1 transition-transform" />
          <span className="text-[16px] font-medium hidden xl:block">Cerrar sesión</span>
        </button>
      </div>
    </div>
  </aside>
);
}
