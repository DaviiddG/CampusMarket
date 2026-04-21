import { useState, useEffect, useRef } from 'react';
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
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario CampusMarket';
  const role = user?.user_metadata?.role || 'usuario';
  const avatarUrl = profileAvatar || user?.user_metadata?.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0UyRThGMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjOTRBM0I4Ii8+PHBhdGggZD0iTTIwIDEwMGEzMCAzMCAwIDAgMSA2MCAwIiBmaWxsPSIjOTRBM0I4Ii8+PC9zdmc+';

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    setShowPhotoMenu(false);
    try {
      // 1. Upload to storage
      const fileName = `avatars/${user.id}-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
      
      const newAvatarUrl = publicData.publicUrl;

      // 2. Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 3. Update Auth metadata for instant global refresh
      const { error: authError } = await supabase.auth.updateUser({
        data: { avatar_url: newAvatarUrl }
      });

      if (authError) throw authError;

      // 4. Update local state
      setProfileAvatar(newAvatarUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error al subir la foto de perfil.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    
    setShowPhotoMenu(false);
    setIsRemovingAvatar(true);
    try {
      // 1. Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Update Auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { avatar_url: null }
      });

      if (authError) throw authError;

      // 3. Clear local state
      setProfileAvatar(null);
    } catch (error) {
      console.error('Error removing avatar:', error);
      alert('Error al eliminar la foto de perfil.');
    } finally {
      setIsRemovingAvatar(false);
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
            <button onClick={handleEditProfile} className="p-1 -ml-1 text-black hover:bg-gray-100 rounded-full transition-colors" title="Configuración">
              <Settings size={28} className="text-black" />
            </button>
            <div className="flex items-center justify-center flex-1 px-4 overflow-hidden">
              <span className="font-roboto font-bold text-[22px] text-black tracking-tight truncate">{displayName}</span>
            </div>
            <button onClick={handleLogout} className="text-red-500 hover:bg-red-50 p-2 -mr-2 rounded-full transition-colors" title="Cerrar sesión">
              <LogOut size={22} className="opacity-90" />
            </button>
          </div>

          {/* Profile Stats Header - Responsive */}
          <div className="flex items-center gap-10 px-6 mt-8 mb-8">
            {/* Avatar & Cloud Menu Container */}
            <div className="relative flex-shrink-0">
              <div 
                onClick={() => setShowPhotoMenu(!showPhotoMenu)}
                className={cn(
                  "relative w-[80px] h-[80px] md:w-[150px] md:h-[150px] rounded-full bg-gray-50 border border-gray-100 overflow-hidden shadow-sm cursor-pointer",
                  (isRemovingAvatar || isUploading) && "opacity-50 pointer-events-none"
                )}
              >
                <img 
                  src={avatarUrl} 
                  alt="Profile Avatar" 
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0UyRThGMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjOTRBM0I4Ii8+PHBhdGggZD0iTTIwIDEwMGEzMCAzMCAwIDAgMSA2MCAwIiBmaWxsPSIjOTRBM0I4Ii8+PC9zdmc+'; }}
                />
                {(isRemovingAvatar || isUploading) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/20">
                    <div className="w-5 h-5 md:w-8 md:h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Cloud Menu Tooltip */}
              <AnimatePresence>
                {showPhotoMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-[300] bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-100 w-48 overflow-hidden"
                  >
                    {/* Top pointing arrow */}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t border-l border-gray-100 rotate-45" />
                    
                    <div className="relative bg-white z-10 flex flex-col py-1">
                      <button
                        onClick={() => {
                          setShowPhotoMenu(false);
                          fileInputRef.current?.click();
                        }}
                        className="px-4 py-3 text-left text-[14px] font-roboto font-bold text-[#0095f6] hover:bg-gray-50 transition-colors"
                      >
                        Nueva foto de perfil
                      </button>

                      {avatarUrl && !avatarUrl.includes('gravatar.com') && (
                        <button
                          onClick={handleRemoveAvatar}
                          className="px-4 py-3 text-left text-[14px] font-roboto font-bold text-[#ed4956] hover:bg-gray-50 transition-colors border-t border-gray-50"
                        >
                          Eliminar foto actual
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Backdrop for mobile closing */}
              {showPhotoMenu && (
                <div 
                  className="fixed inset-0 z-[290]" 
                  onClick={() => setShowPhotoMenu(false)}
                />
              )}
            </div>

            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

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
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === 'posts' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === 'posts' ? 20 : -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, { offset }) => {
              const swipe = offset.x;
              if (swipe < -40) {
                setActiveTab('saved');
              } else if (swipe > 40) {
                setActiveTab('posts');
              }
            }}
            className="w-full min-h-[300px]"
          >
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
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                    />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

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
              onClick={() => setSelectedPost(null)}
              className="fixed inset-0 z-[210] flex items-center justify-center p-4"
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden"
              >
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
