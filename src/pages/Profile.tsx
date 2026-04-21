import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileContainer from '@/components/layout/MobileContainer';
import BottomNav from '@/components/layout/BottomNav';
import { ChevronLeft, LogOut, Grid3X3, Bookmark, Settings } from 'lucide-react';
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
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario CampusMarket';
  const role = user?.user_metadata?.role || 'usuario';
  const avatarUrl = profileAvatar || user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.id}`;

  useEffect(() => {
    if (!user) return;
    
    const fetchFollows = async () => {
      const { count: followers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);
      
      const { count: following } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      if (followers !== null) setFollowersCount(followers);
      if (following !== null) setFollowingCount(following);
    };

    // Fetch profile avatar from profiles table
    const fetchProfileAvatar = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      if (data?.avatar_url) setProfileAvatar(data.avatar_url);
    };

    fetchFollows();
    fetchProfileAvatar();

    // Realtime subscription for follows
    const channel = supabase
      .channel('public:follows')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'follows' },
        () => {
          // Re-fetch counts when any follow/unfollow happens
          fetchFollows();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      {/* Desktop Main Content Container */}
      <div className="w-full pb-[70px] lg:pb-10">
        <div className="max-w-[700px] mx-auto w-full">
          
          {/* Top Bar - Mobile Only */}
          <div className="flex items-center justify-between px-4 pt-6 pb-4 lg:hidden">
            <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-black hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft size={24} />
            </button>
            <div className="flex items-center gap-2 font-roboto font-bold text-[16px] text-black">
              {displayName}
              <Settings size={18} className="text-black" />
            </div>
            <button onClick={handleLogout} className="text-red-500 hover:bg-red-50 p-2 -mr-2 rounded-full transition-colors" title="Cerrar sesión">
              <LogOut size={20} />
            </button>
          </div>

          {/* Profile Stats Header - Responsive */}
          <div className="flex items-center gap-10 px-6 mt-8 mb-8">
            {/* Avatar */}
            <div className="w-[80px] h-[80px] md:w-[150px] md:h-[150px] rounded-full bg-gray-50 border border-gray-100 overflow-hidden shadow-sm flex-shrink-0">
              <img 
                src={avatarUrl} 
                alt="Profile Avatar" 
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.id || 'guest'}`; }}
              />
            </div>

            {/* Stats & Actions */}
            <div className="flex-1 flex flex-col gap-4">
              <div className="hidden lg:flex items-center gap-6">
                <h1 className="text-xl font-roboto font-medium text-black">{displayName}</h1>
                <button 
                  onClick={handleEditProfile}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Configuración"
                >
                  <Settings size={22} className="text-black" />
                </button>
              </div>

              <div className="flex justify-between md:justify-start md:gap-10 items-center">
                <div className="flex flex-col md:flex-row md:gap-1 items-center">
                  <span className="font-roboto font-bold text-[16px] text-black">{myPosts.length}</span>
                  <span className="font-roboto font-light text-[12px] md:text-[14px] text-grayText md:text-black">Publicaciones</span>
                </div>
                <div className="flex flex-col md:flex-row md:gap-1 items-center">
                  <span className="font-roboto font-bold text-[16px] text-black">{followersCount}</span>
                  <span className="font-roboto font-light text-[12px] md:text-[14px] text-grayText md:text-black">Seguidores</span>
                </div>
                <div className="flex flex-col md:flex-row md:gap-1 items-center">
                  <span className="font-roboto font-bold text-[16px] text-black">{followingCount}</span>
                  <span className="font-roboto font-light text-[12px] md:text-[14px] text-grayText md:text-black">Seguidos</span>
                </div>
              </div>
            </div>
          </div>

        {/* Bio */}
        <div className="px-6 mb-4">
          <h2 className="font-roboto font-bold text-[14px] text-black mb-1">
            {displayName} {role === 'emprendedor' && <span className="opacity-0">✨</span>}
          </h2>
          <p className="font-roboto font-light text-[14px] leading-[18px] text-black">
            {user?.user_metadata?.bio || (role === 'emprendedor' 
              ? 'Emprendimiento universitario enfocado en crecer y conectar con todos los estudiantes. 🚀' 
              : 'Apoyando el talento universitario y descubriendo nuevos productos aquí en la U. 🎓')}
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
                className="aspect-square w-full bg-gray-50 overflow-hidden group cursor-pointer border-[0.5px] border-gray-100"
              >
                <img 
                  src={post.imageUrl} 
                  alt={post.businessName} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        )}

        {/* Persistent Bottom Nav - Mobile Only handled by BottomNav component */}
        <BottomNav activeTab="profile" />
      </div>
    </div>

      {/* Post Detail Overlay */}
      <AnimatePresence>
        {selectedPost && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />
            {/* Panel */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-[210] flex items-center justify-center p-4"
            >
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 flex-shrink-0">
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
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto w-full no-scrollbar">
                  <ProductCard 
                    {...selectedPost} 
                    onDelete={() => setSelectedPost(null)}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </MobileContainer>
  );
}
