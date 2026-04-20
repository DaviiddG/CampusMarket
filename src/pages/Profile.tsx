import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileContainer from '@/components/layout/MobileContainer';
import BottomNav from '@/components/layout/BottomNav';
import { ChevronLeft, LogOut, Grid3X3, Bookmark, X } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { useFeedContext, type Post } from '@/contexts/FeedContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/home/ProductCard';

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { signOut } = useAuth();
  const { posts, savedPostIds } = useFeedContext();
  
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario CampusMarket';
  const role = user?.user_metadata?.role || 'usuario';

  useEffect(() => {
    if (!user) return;
    const fetchFollows = async () => {
      // Followers
      const { count: followers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);
      
      // Following
      const { count: following } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      if (followers !== null) setFollowersCount(followers);
      if (following !== null) setFollowingCount(following);
    };
    fetchFollows();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const handleEditProfile = () => {
    navigate('/complete-profile');
  };

  const handleShareProfile = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Perfil de ${displayName}`,
          text: '¡Mira mi perfil en CampusMarket!',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error compartiendo:', err);
      }
    } else {
      alert('Tu dispositivo no soporta compartir nativamente.');
    }
  };

  const myPosts = posts.filter(p => p.businessName === displayName);
  const mySavedPosts = posts.filter(p => savedPostIds.includes(p.id));

  // Determine which list to show based on the active tab
  const displayPosts = activeTab === 'posts' ? myPosts : mySavedPosts;

  return (
    <MobileContainer className="bg-white" justifyCenter={false}>
      {/* Scrollable Content Wrapper */}
      <div className="flex-1 w-full overflow-y-auto pb-[70px]">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 pt-10 pb-4">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-black hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="font-roboto font-bold text-[16px] text-black">
            {displayName}
          </div>
          <button onClick={handleLogout} className="text-red-500 hover:bg-red-50 p-2 -mr-2 rounded-full transition-colors" title="Cerrar sesión">
            <LogOut size={20} />
          </button>
        </div>

        {/* Profile Stats Header */}
        <div className="flex items-center justify-between px-6 mb-4">
          {/* Avatar */}
          <div className="w-[80px] h-[80px] rounded-full bg-gray-300 border border-gray-100 overflow-hidden shadow-sm flex-shrink-0">
            <img 
              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${displayName}`} 
              alt="Profile Avatar" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Stats */}
          <div className="flex flex-1 justify-around items-center pl-6">
            <div className="flex flex-col items-center">
              <span className="font-roboto font-bold text-[16px] text-black">{myPosts.length}</span>
              <span className="font-roboto font-light text-[12px] text-grayText">Publicaciones</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-roboto font-bold text-[16px] text-black">{followersCount}</span>
              <span className="font-roboto font-light text-[12px] text-grayText">Seguidores</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-roboto font-bold text-[16px] text-black">{followingCount}</span>
              <span className="font-roboto font-light text-[12px] text-grayText">Seguidos</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="px-6 mb-4">
          <h2 className="font-roboto font-bold text-[14px] text-black mb-1">
            {displayName} {role === 'emprendedor' && <span className="opacity-0">✨</span>}
          </h2>
          <p className="font-roboto font-light text-[14px] leading-[18px] text-black">
            {role === 'emprendedor' 
              ? 'Emprendimiento universitario enfocado en crecer y conectar con todos los estudiantes. 🚀' 
              : 'Apoyando el talento universitario y descubriendo nuevos productos aquí en la U. 🎓'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 px-6 mb-6">
          <button 
            onClick={handleEditProfile}
            className="flex-1 h-[32px] bg-[#E8E8E8] rounded-md font-roboto font-bold text-[13px] text-black flex items-center justify-center hover:bg-gray-300 transition-colors">
            Editar Perfil
          </button>
          <button 
            onClick={handleShareProfile}
            className="flex-1 h-[32px] bg-[#E8E8E8] rounded-md font-roboto font-bold text-[13px] text-black flex items-center justify-center hover:bg-gray-300 transition-colors">
            Compartir Perfil
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-around w-full border-t border-gray-200">
          <button 
            className="flex-1 py-3 flex justify-center items-center relative"
            onClick={() => setActiveTab('posts')}
          >
            <Grid3X3 size={24} className={cn("transition-colors", activeTab === 'posts' ? "text-black" : "text-gray-400")} strokeWidth={activeTab === 'posts' ? 2 : 1.5} />
            {activeTab === 'posts' && (
              <motion.div layoutId="tab-indicator" className="absolute bottom-0 w-full h-[2px] bg-black" />
            )}
          </button>
          <button 
            className="flex-1 py-3 flex justify-center items-center relative"
            onClick={() => setActiveTab('saved')}
          >
            <Bookmark size={24} className={cn("transition-colors", activeTab === 'saved' ? "text-black" : "text-gray-400")} strokeWidth={activeTab === 'saved' ? 2 : 1.5} />
            {activeTab === 'saved' && (
              <motion.div layoutId="tab-indicator" className="absolute bottom-0 w-full h-[2px] bg-black" />
            )}
          </button>
        </div>

        {/* Grid Content */}
        {displayPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 text-gray-500">
            {activeTab === 'posts' ? (
              <>
                <Grid3X3 size={48} strokeWidth={1} className="mb-4 opacity-30" />
                <p className="font-roboto">No has publicado nada aún.</p>
              </>
            ) : (
              <>
                <Bookmark size={48} strokeWidth={1} className="mb-4 opacity-30" />
                <p className="font-roboto">Aún no has guardado publicaciones.</p>
              </>
            )}
            
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-[2px] mt-[2px] w-full">
            {displayPosts.map(post => (
              <div 
                key={post.id} 
                onClick={() => setSelectedPost(post)}
                className="aspect-square w-full bg-gray-100 overflow-hidden group cursor-pointer"
              >
                <img 
                  src={post.imageUrl} 
                  alt={post.businessName} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Persistent Bottom Nav */}
      <div className="absolute bottom-0 left-0 w-full z-20">
        <BottomNav activeTab="profile" />
      </div>

      {/* Post Detail Overlay */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-0 bg-white z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-10 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedPost(null)}
                  className="p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} className="text-black" />
                </button>
                <div className="flex flex-col">
                  <span className="font-roboto font-light text-[12px] text-grayText uppercase">Publicaciones</span>
                  <span className="font-roboto font-bold text-[14px] text-black">{selectedPost.businessName}</span>
                </div>
              </div>
            </div>
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto w-full no-scrollbar pb-[40px]">
              <ProductCard 
                {...selectedPost} 
                onDelete={() => setSelectedPost(null)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </MobileContainer>
  );
}
