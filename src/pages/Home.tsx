
import MobileContainer from '@/components/layout/MobileContainer';
import ProductCard from '@/components/home/ProductCard';
import BottomNav from '@/components/layout/BottomNav';
import NotificationsDrawer from '@/components/home/NotificationsDrawer';
import { Bell, Search } from 'lucide-react';
import logoUrl from '@/assets/logo.png';
import { useState } from 'react';
import { motion } from 'motion/react';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { useFeedContext } from '@/contexts/FeedContext';

export default function Home() {
  const { posts } = useFeedContext();
  const { unreadCount } = useNotificationContext();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <MobileContainer className="bg-white" justifyCenter={false}>
      {/* Top Header Section - Mobile Only */}
      <div className="w-full flex lg:hidden flex-col items-center pt-4 px-4">
        {/* Header Bar */}
        <div className="w-full h-[120px] flex items-center justify-between relative mb-4">
          <div className="w-10 flex justify-start">
            {/* Empty space to balance the header since Inbox moved to Sidebar/BottomNav */}
          </div>
          <div className="w-[120px] h-full">
            <img src={logoUrl} alt="CampusMarket" className="w-full h-full object-contain" />
          </div>
          <div className="w-10 flex justify-end">
            <button 
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <motion.div
                animate={unreadCount > 0 ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
                transition={{ repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 2, duration: 0.5 }}
              >
                <Bell size={24} className="text-black" />
              </motion.div>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>



      {/* Notifications Drawer Overlay - Mobile only (desktop handled by MobileContainer) */}
      <div className="lg:hidden">
        <NotificationsDrawer 
          isOpen={isNotificationsOpen} 
          onClose={() => setIsNotificationsOpen(false)} 
        />
      </div>

      {/* Feed Area */}
      <div className="w-full pb-[70px] lg:pb-10">
        <div className="max-w-[600px] mx-auto w-full">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 h-[60%]">
              <Search size={40} className="mb-4 opacity-50" />
              <p className="font-roboto mb-2">No hay publicaciones aún.</p>
              <p className="font-poppins font-bold text-sm">¡Sé el primero en publicar el tuyo!</p>
            </div>
          ) : (
            posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ 
                  duration: 0.45, 
                  delay: Math.min(index * 0.09, 0.5),
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
              >
                <ProductCard {...post} />
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Persistent Bottom Nav */}
      <BottomNav activeTab="home" />
    </MobileContainer>
  );
}
