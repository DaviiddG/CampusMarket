import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, UserPlus, MessageCircle, Send, BellOff } from 'lucide-react';
import { useNotificationContext, type Notification } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { AnimatedList } from '@/components/ui/animated-list';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsDrawer({ isOpen, onClose }: NotificationsDrawerProps) {
  const { notifications, loading, markAllAsRead, markAsRead } = useNotificationContext();
  
  // Automatically mark all as read when opening the drawer
  useEffect(() => {
    if (isOpen) {
      markAllAsRead();
    }
  }, [isOpen, markAllAsRead]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like': return <Heart size={16} className="text-red-500 fill-red-500" />;
      case 'follow': return <UserPlus size={16} className="text-primary" />;
      case 'comment': return <MessageCircle size={16} className="text-green-500" />;
      case 'share': return <Send size={16} className="text-blue-500" />;
      default: return null;
    }
  };

  const getMessage = (notif: Notification) => {
    switch (notif.type) {
      case 'like': return 'le dio me gusta a tu publicación.';
      case 'follow': return 'comenzó a seguirte.';
      case 'comment': return 'comentó tu publicación.';
      case 'share': return 'compartió tu publicación.';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-full max-w-[400px] h-full bg-white z-[110] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-16 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-xl font-roboto font-bold text-black">Notificaciones</h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} className="text-black" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-12 space-y-4">
                  <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-gray-400 font-roboto">Cargando...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <BellOff size={32} className="text-gray-300" />
                  </div>
                  <p className="text-black font-roboto font-bold mb-1">Aún no hay notificaciones</p>
                  <p className="text-gray-400 text-sm font-roboto">Las acciones que ocurran en tu perfil aparecerán aquí.</p>
                </div>
              ) : (
                <AnimatedList delay={120} className="gap-0">
                  {notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      className={`flex items-start gap-3 px-6 py-4 transition-colors cursor-pointer ${notif.read ? 'bg-white' : 'bg-gray-50'}`}
                      onClick={() => markAsRead(notif.id)}
                    >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 shadow-sm">
                        <img 
                          src={notif.actor_avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
                          alt={notif.actor_name} 
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'; }}
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm">
                        {getIcon(notif.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-roboto leading-snug">
                        <span className="font-bold text-black hover:underline cursor-pointer">{notif.actor_name}</span>{' '}
                        <span className="text-gray-600 font-light">{getMessage(notif)}</span>
                      </p>
                      <p className="text-[11px] text-gray-400 font-roboto mt-0.5">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                    
                    {/* Post Thumbnail (Instagram style) */}
                    {notif.post_image && (
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 ml-1 border border-gray-100">
                        <img src={notif.post_image} className="w-full h-full object-cover" alt="Post" />
                      </div>
                    )}
                    
                    {!notif.read && !notif.post_image && (
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    )}
                    
                    {!notif.read && notif.post_image && (
                      <div className="absolute top-1/2 -translate-y-1/2 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
                    )}
                    </motion.div>
                  ))}
                </AnimatedList>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-4 border-t border-gray-100">
                <button 
                  onClick={markAllAsRead}
                  className="w-full h-11 bg-gray-50 hover:bg-gray-100 text-primary font-roboto font-bold text-sm rounded-xl transition-colors"
                >
                  Marcar todas como leídas
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
