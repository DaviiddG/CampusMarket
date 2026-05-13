import { useState, useEffect, useRef } from 'react';
import { Home, PlusSquare, Bell, LogOut, Compass, Search, Menu, Send, Receipt, HelpCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import logoIconUrl from '@/assets/logo.png';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { useTour } from '@/contexts/TourContext';

const DEFAULT_AVATAR =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0UyRThGMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjOTRBM0I4Ii8+PHBhdGggZD0iTTIwIDEwMGEzMCAzMCAwIDAgMSA2MCAwIiBmaWxsPSIjOTRBM0I4Ii8+PC9zdmc+';

/* ── Tooltip ──────────────────────────────────────────────────── */
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: -8, scale: 0.93 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -8, scale: 0.93 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="absolute left-[56px] z-[9999] pointer-events-none"
            style={{ whiteSpace: 'nowrap' }}
          >
            <div className="relative bg-gray-900 text-white text-[13px] font-roboto font-medium px-3 py-1.5 rounded-lg shadow-2xl">
              {label}
              <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── NavItem ──────────────────────────────────────────────────── */
interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  href: string;
  badge?: number;
  onClick?: (e: React.MouseEvent) => void;
  tourId?: string;
}

function NavItem({ label, icon, isActive, href, badge, onClick, tourId }: NavItemProps) {
  return (
    <Tooltip label={label}>
      <Link
        to={href}
        onClick={onClick}
        data-tour={tourId}
        className={cn(
          'relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200',
          isActive ? 'bg-gray-100 text-black' : 'text-black/70 hover:bg-gray-100 hover:text-black'
        )}
      >
        <div className="relative">
          <div style={{ display: 'contents', strokeWidth: isActive ? 2.5 : 2 }}>
            {icon}
          </div>
          {badge !== undefined && badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white leading-none">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </div>
      </Link>
    </Tooltip>
  );
}

/* ── Sidebar ──────────────────────────────────────────────────── */
export default function Sidebar() {
  const location = useLocation();
  const { unreadCount, markAllAsRead } = useNotificationContext();
  const { user } = useAuthContext();
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { startTour } = useTour();
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const isEmprendedor = user?.user_metadata?.role === 'emprendedor';

  useEffect(() => {
    if (!showMoreMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreMenu]);

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

  const navItems = [
    { label: 'Inicio',   icon: <Home size={24} />,       path: '/home',    tourId: 'nav-home'    },
    { label: 'Buscar',   icon: <Search size={24} />,     path: '/search',  tourId: 'nav-search'  },
    { label: 'Explorar', icon: <Compass size={24} />,    path: '/explore', tourId: 'nav-explore' },
    { label: 'Mensajes', icon: <Send size={24} />,       path: '/chats',  tourId: 'nav-chats' },
    ...(isEmprendedor
      ? [{ label: 'Crear', icon: <PlusSquare size={24} />, path: '/upload', tourId: 'nav-upload' }]
      : []),
    {
      label: 'Notificaciones',
      icon: <Bell size={24} />,
      path: '#',
      badge: unreadCount,
      tourId: 'notifications',
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('toggleNotifications'));
        markAllAsRead();
      },
    },
    { 
      label: isEmprendedor ? 'Pedidos' : 'Mis Compras', 
      icon: <Receipt size={24} />, 
      path: '/profile?openOrders=true' 
    },
  ];

  const handleLogout = async () => supabase.auth.signOut();

  const isActive = (path: string) => {
    if (path === '/chats') {
      return location.pathname.startsWith('/chat');
    }
    if (path === '/profile') {
      return location.pathname === '/profile' && !location.search.includes('openOrders=true');
    }
    if (path.includes('openOrders=true')) {
      return location.pathname === '/profile' && location.search.includes('openOrders=true');
    }
    return location.pathname === path;
  };

  return (
    <aside
      className="hidden lg:flex flex-col w-[72px] h-screen border-r border-gray-100 bg-white px-3 fixed top-0 left-0 z-50"
      style={{ overflow: 'visible', paddingTop: 'clamp(12px, 2vh, 32px)', paddingBottom: 'clamp(12px, 2vh, 32px)' }}
    >
      {/* ── Logo (top) ─────────────────────────────────────── */}
      <Tooltip label="CampusMarket">
        <Link
          to="/home"
          className="flex items-center justify-center w-11 h-11 rounded-xl hover:bg-gray-100 transition-colors mx-auto"
          style={{ marginBottom: 'clamp(8px, 2vh, 24px)' }}
        >
          <img src={logoIconUrl} alt="CampusMarket" className="w-8 h-8 object-contain" />
        </Link>
      </Tooltip>

      {/* ── Nav Items (vertically centered, compressible) ─── */}
      <nav
        className="flex-1 flex flex-col items-center justify-center"
        style={{ gap: 'clamp(2px, 1.2vh, 8px)', overflow: 'visible' }}
      >
        {navItems.map((item) => (
          <NavItem
            key={item.label}
            label={item.label}
            href={item.path}
            icon={item.icon}
            isActive={isActive(item.path)}
            badge={item.badge}
            onClick={item.onClick}
            tourId={(item as any).tourId}
          />
        ))}

        {/* Profile */}
        <Tooltip label="Perfil">
          <Link
            to="/profile"
            data-tour="nav-profile"
            className={cn(
              'flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200',
              isActive('/profile') ? 'bg-gray-100' : 'hover:bg-gray-100'
            )}
          >
            <div
              className={cn(
                'w-7 h-7 rounded-full overflow-hidden border-2 transition-all',
                isActive('/profile') ? 'border-black' : 'border-gray-300'
              )}
            >
              <img
                src={userAvatar}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
              />
            </div>
          </Link>
        </Tooltip>
      </nav>

      {/* ── More & Logout (bottom) ────────────────────────── */}
      <div
        ref={moreMenuRef}
        className="flex flex-col items-center gap-2 pt-4 border-t border-gray-100 w-full relative"
        style={{ overflow: 'visible' }}
      >
        {/* Animated Glassmorphism Dropdown for More menu */}
        <AnimatePresence>
          {showMoreMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -10 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              className="absolute bottom-[60px] left-[50px] bg-white border border-slate-100 shadow-[0_10px_40px_-6px_rgba(0,0,0,0.12)] rounded-xl p-1.5 w-48 z-[100] flex flex-col backdrop-blur-md bg-white/95"
            >
              <button
                onClick={() => {
                  startTour();
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 rounded-lg text-[13px] font-poppins font-medium text-slate-700 transition-colors w-full text-left"
              >
                <HelpCircle size={16} className="text-slate-500" />
                <span>Ver tutorial</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* More Button */}
        <Tooltip label="Más">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={cn(
              "flex items-center justify-center w-11 h-11 rounded-xl text-black/70 hover:bg-gray-100 hover:text-black transition-all duration-200",
              showMoreMenu && "bg-gray-100 text-black"
            )}
          >
            <Menu size={24} strokeWidth={2} />
          </button>
        </Tooltip>

        {/* Logout */}
        <Tooltip label="Cerrar sesión">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-11 h-11 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={22} />
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}
