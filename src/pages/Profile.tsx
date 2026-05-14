import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MobileContainer from '@/components/layout/MobileContainer';
import BottomNav from '@/components/layout/BottomNav';
import { ChevronLeft, LogOut, Grid3X3, Bookmark, Settings, Star, Instagram, Facebook, MessageCircle, ShoppingBag, Package, Clock, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { useFeedContext, type Post, type Review } from '@/contexts/FeedContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/home/ProductCard';
import { useTour } from '@/contexts/TourContext';

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const { signOut } = useAuth();
  const { posts, savedPostIds, getReviews, getReviewsGiven } = useFeedContext();
  const { startProfileTour } = useTour();
  
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'reviews' | 'purchases'>('posts');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsGiven, setReviewsGiven] = useState<Review[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<{
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
    location?: string;
    bio?: string;
  }>({
    whatsapp: user?.user_metadata?.whatsapp || '',
    instagram: user?.user_metadata?.instagram || '',
    facebook: user?.user_metadata?.facebook || '',
    location: user?.user_metadata?.location || '',
    bio: user?.user_metadata?.bio || '',
  });
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showOrdersDrawer, setShowOrdersDrawer] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [salesCount, setSalesCount] = useState(0);
  const [ordersTab, setOrdersTab] = useState<'pending' | 'confirmed' | 'cancelled'>('pending');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario CampusMarket';
  const role = user?.user_metadata?.role || 'usuario';
  const isUsuario = role === 'usuario';
  const avatarUrl = profileAvatar || user?.user_metadata?.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0UyRThGMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjOTRBM0I4Ii8+PHBhdGggZD0iTTIwIDEwMGEzMCAzMCAwIDAgMSA2MCAwIiBmaWxsPSIjOTRBM0I4Ii8+PC9zdmc+';

  const displayData = {
    whatsapp: profileData.whatsapp || user?.user_metadata?.whatsapp || '',
    instagram: profileData.instagram || user?.user_metadata?.instagram || '',
    facebook: profileData.facebook || user?.user_metadata?.facebook || '',
    location: profileData.location || user?.user_metadata?.location || '',
    bio: profileData.bio || user?.user_metadata?.bio || '',
  };

  useEffect(() => {
    // For users, only reset to 'saved' if the active tab is one that doesn't exist for them (posts/reviews)
    if (isUsuario && (activeTab === 'posts' || activeTab === 'reviews')) {
      setActiveTab('saved');
    }
    if (activeTab === 'purchases' && isUsuario) {
      fetchOrders();
    }
  }, [user, isUsuario, activeTab]);

  useEffect(() => {
    if (!user) return;

    // Pre-fill profile data from user metadata to avoid flicker while DB fetch completes
    setProfileData(prev => ({
      ...prev,
      whatsapp: user.user_metadata?.whatsapp || prev.whatsapp || '',
      instagram: user.user_metadata?.instagram || prev.instagram || '',
      facebook: user.user_metadata?.facebook || prev.facebook || '',
      location: user.user_metadata?.location || prev.location || '',
      bio: user.user_metadata?.bio || prev.bio || '',
    }));
    
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

    // Fetch profile data from profiles table
    const fetchProfileData = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) {
        if (data.avatar_url) setProfileAvatar(data.avatar_url);
        setProfileData({
          whatsapp: data.whatsapp,
          instagram: data.instagram,
          facebook: data.facebook,
          location: data.location,
          bio: data.bio
        });
      }
    };

    const fetchReviews = async () => {
      if (isUsuario) {
        const dataGiven = await getReviewsGiven(user.id);
        setReviewsGiven(dataGiven);
      } else {
        const data = await getReviews(user.id);
        setReviews(data);
      }
    };

    fetchFollows();
    fetchProfileData();
    fetchReviews();
    fetchSalesCount();

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

    // Realtime subscription for orders
    const ordersChannel = supabase
      .channel(`orders:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchSalesCount();
          if (showOrdersDrawer) fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(ordersChannel);
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

  const fetchSalesCount = async () => {
    if (!user) return;
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', user.id);
    if (count !== null) setSalesCount(count);
  };

  const fetchOrders = async () => {
    if (!user) return;
    setOrdersLoading(true);
    try {
      // Emprendedores see orders they received; usuarios see orders they placed
      const column = isUsuario ? 'buyer_id' : 'seller_id';
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq(column, user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleOpenOrders = () => {
    setShowOrdersDrawer(true);
    fetchOrders();
  };

  // Automatically open orders drawer if query param is present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('openOrders') === 'true') {
      handleOpenOrders();
      // Clean up URL to prevent opening on every refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, location.pathname, navigate]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const orderToUpdate = orders.find(o => o.id === orderId);

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      fetchSalesCount();

      // Notify the buyer if the order was confirmed
      if (newStatus === 'confirmed' && orderToUpdate && orderToUpdate.status === 'pending') {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: orderToUpdate.buyer_id,
            actor_id: user?.id,
            actor_name: displayName,
            actor_avatar: avatarUrl,
            type: 'order_confirmed',
            post_id: orderToUpdate.product_id,
            post_image: orderToUpdate.product_image
          });
        
        if (notifError) console.error('Error sending confirmation notification:', notifError);
      }
    } catch (e) {
      console.error('Error updating order:', e);
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

  const currentTabs = isUsuario 
    ? (['saved', 'purchases'] as const)
    : (['posts', 'saved', 'reviews'] as const);
  const activeIndex = currentTabs.indexOf(activeTab as any);

  return (
    <MobileContainer className="bg-white" justifyCenter={false} hideRightSidebar>
      {/* Desktop Main Content Container */}
      <div className="w-full pb-[70px] lg:pb-10">
        <div className="max-w-[700px] mx-auto w-full">
          
          {/* Top Bar - Mobile Only */}
          <div className="flex items-center justify-between px-4 pt-6 pb-4 lg:hidden">
            <div className="flex items-center gap-1">
              <button onClick={handleEditProfile} className="p-2 -ml-2 text-black hover:bg-gray-100 rounded-full transition-colors" title="Configuración">
                <Settings size={26} />
              </button>
              <button onClick={startProfileTour} className="p-2 text-black hover:bg-gray-100 rounded-full transition-colors" title="Ver tutorial de perfil">
                <HelpCircle size={26} />
              </button>
            </div>
            <div className="flex items-center justify-center flex-1 px-2 overflow-hidden">
              <span className="font-roboto font-bold text-[20px] text-black tracking-tight truncate">{displayName}</span>
            </div>
            <button onClick={handleLogout} className="text-red-500 hover:bg-red-50 p-2 -mr-2 rounded-full transition-colors" title="Cerrar sesión">
              <LogOut size={22} className="opacity-90" />
            </button>
          </div>

          {/* Profile Stats Header - Responsive */}
          <div className="flex items-center gap-10 px-6 mt-8 mb-8" data-tour="profile-header">
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
              <div className="hidden lg:flex items-center gap-4">
                <h1 className="text-xl font-roboto font-medium text-black">{displayName}</h1>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={handleEditProfile}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Configuración"
                  >
                    <Settings size={22} className="text-black" />
                  </button>
                  <button 
                    onClick={startProfileTour}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <HelpCircle size={22} className="text-black" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between md:justify-start md:gap-10 items-center">
                {isUsuario ? (
                  <div className="flex flex-col md:flex-row md:gap-1 items-center">
                    <span className="font-roboto font-bold text-[16px] text-black">{reviewsGiven.length}</span>
                    <span className="font-roboto font-light text-[12px] md:text-[14px] text-grayText md:text-black">Reseñas Dadas</span>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row md:gap-1 items-center">
                    <span className="font-roboto font-bold text-[16px] text-black">{myPosts.length}</span>
                    <span className="font-roboto font-light text-[12px] md:text-[14px] text-grayText md:text-black">Publicaciones</span>
                  </div>
                )}
                <div className="flex flex-col md:flex-row md:gap-1 items-center">
                  <span className="font-roboto font-bold text-[16px] text-black">{followersCount}</span>
                  <span className="font-roboto font-light text-[12px] md:text-[14px] text-grayText md:text-black">Seguidores</span>
                </div>
                <div className="flex flex-col md:flex-row md:gap-1 items-center">
                  <span className="font-roboto font-bold text-[16px] text-black">{followingCount}</span>
                  <span className="font-roboto font-light text-[12px] md:text-[14px] text-grayText md:text-black">Seguidos</span>
                </div>
                {!isUsuario && (
                  <div className="flex flex-col md:flex-row md:gap-1 items-center cursor-pointer hover:opacity-70 transition-opacity" onClick={handleOpenOrders}>
                    <span className="font-roboto font-bold text-[16px] text-primary">{salesCount}</span>
                    <span className="font-roboto font-light text-[12px] md:text-[14px] text-grayText md:text-black">Ventas</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* Bio */}
        <div className="px-6 mb-4">
          <h2 className="font-roboto font-bold text-[14px] text-black mb-1">
            {displayName} {role === 'emprendedor' && <span className="opacity-0">✨</span>}
          </h2>
          <p className="font-roboto font-light text-[14px] leading-[18px] text-black">
            {displayData.bio || (role === 'emprendedor' 
              ? 'Emprendimiento universitario enfocado en crecer y conectar con todos los estudiantes. 🚀' 
              : 'Apoyando el talento universitario y descubriendo nuevos productos aquí en la U. 🎓')}
          </p>
          {displayData.location && (
            <p className="font-roboto text-[13px] text-gray-500 mt-1">
              📍 {displayData.location}
            </p>
          )}

          {/* Social Links */}
          {(displayData.whatsapp || displayData.instagram || displayData.facebook) && (
            <div className="flex items-center gap-4 pt-3">
              {displayData.whatsapp && (
                <a 
                  href={`https://api.whatsapp.com/send?phone=57${displayData.whatsapp.replace(/\D/g, '').replace(/^57/, '')}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="p-2 bg-[#25D366]/10 text-[#25D366] rounded-xl hover:bg-[#25D366]/20 transition-colors"
                  title="WhatsApp"
                >
                  <MessageCircle size={22} />
                </a>
              )}
              {displayData.instagram && (
                <a 
                  href={`https://instagram.com/${displayData.instagram}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="p-2 bg-[#E1306C]/10 text-[#E1306C] rounded-xl hover:bg-[#E1306C]/20 transition-colors"
                  title="Instagram"
                >
                  <Instagram size={22} />
                </a>
              )}
              {displayData.facebook && (
                <a 
                  href={`https://facebook.com/${displayData.facebook}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="p-2 bg-[#1877F2]/10 text-[#1877F2] rounded-xl hover:bg-[#1877F2]/20 transition-colors"
                  title="Facebook"
                >
                  <Facebook size={22} />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 px-6 mb-6">
          <button 
            data-tour="edit-profile"
            onClick={handleEditProfile}
            className="flex-1 h-[32px] bg-[#E8E8E8] rounded-md font-roboto font-bold text-[13px] text-black flex items-center justify-center hover:bg-gray-300 transition-colors">
            Editar Perfil
          </button>
          <button 
            onClick={handleShareProfile}
            className="flex-1 h-[32px] bg-[#E8E8E8] rounded-md font-roboto font-bold text-[13px] text-black flex items-center justify-center hover:bg-gray-300 transition-colors">
            Compartir Perfil
          </button>
          <button 
            onClick={handleOpenOrders}
            className="flex-1 h-[32px] bg-[#E8E8E8] rounded-md font-roboto font-bold text-[13px] text-black flex items-center justify-center gap-1.5 hover:bg-gray-300 transition-colors relative">
            <ShoppingBag size={14} />
            {isUsuario ? 'Mis Compras' : 'Pedidos'}
            {!isUsuario && orders.filter(o => o.status === 'pending').length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {orders.filter(o => o.status === 'pending').length}
              </span>
            )}
          </button>
          {role === 'admin' && (
            <button 
              onClick={() => navigate('/admin-dashboard')}
              className="flex-1 h-[32px] bg-black rounded-md font-roboto font-bold text-[13px] text-white flex items-center justify-center gap-1.5 hover:bg-gray-800 transition-colors">
              Panel Admin
            </button>
          )}
        </div>

        {/* Tabs */}
        {!isUsuario && (
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
              data-tour="tab-saved"
              className="flex-1 py-3 flex justify-center items-center relative"
              onClick={() => setActiveTab('saved')}
            >
              <Bookmark size={24} className={cn("transition-colors", activeTab === 'saved' ? "text-black" : "text-gray-400")} strokeWidth={activeTab === 'saved' ? 2 : 1.5} />
              {activeTab === 'saved' && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 w-full h-[2px] bg-black" />
              )}
            </button>
            <button 
              data-tour="tab-reviews"
              className="flex-1 py-3 flex justify-center items-center relative"
              onClick={() => setActiveTab('reviews')}
            >
              <Star size={24} className={cn("transition-colors", activeTab === 'reviews' ? "text-black" : "text-gray-400")} strokeWidth={activeTab === 'reviews' ? 2 : 1.5} />
              {activeTab === 'reviews' && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 w-full h-[2px] bg-black" />
              )}
            </button>
          </div>
        )}
        
        {isUsuario && (
          <div className="flex items-center justify-around w-full border-t border-gray-200">
            <button 
              className="flex-1 py-3 flex justify-center items-center relative"
              onClick={() => setActiveTab('saved')}
            >
              <Bookmark size={24} className={cn("transition-colors", activeTab === 'saved' ? "text-black" : "text-gray-400")} strokeWidth={activeTab === 'saved' ? 2 : 1.5} />
              {activeTab === 'saved' && (
                <motion.div layoutId="tab-indicator-user" className="absolute bottom-0 w-full h-[2px] bg-black" />
              )}
            </button>
            <button 
              className="flex-1 py-3 flex justify-center items-center relative"
              onClick={() => setActiveTab('purchases')}
            >
              <ShoppingBag size={24} className={cn("transition-colors", activeTab === 'purchases' ? "text-black" : "text-gray-400")} strokeWidth={activeTab === 'purchases' ? 2 : 1.5} />
              {activeTab === 'purchases' && (
                <motion.div layoutId="tab-indicator-user" className="absolute bottom-0 w-full h-[2px] bg-black" />
              )}
            </button>
          </div>
        )}

        {/* Grid Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeIndex === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeIndex === 0 ? 20 : -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_: unknown, { offset }: { offset: { x: number } }) => {
              const swipe = offset.x;
              if (swipe < -40 && activeIndex < currentTabs.length - 1) {
                setActiveTab(currentTabs[activeIndex + 1]);
              } else if (swipe > 40 && activeIndex > 0) {
                setActiveTab(currentTabs[activeIndex - 1]);
              }
            }}
            className="w-full min-h-[300px]"
          >
            {activeTab === 'purchases' ? (
              <div className="flex flex-col w-full px-4 py-4 pb-8 space-y-4 bg-gray-50/50 min-h-[300px]">
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ShoppingBag size={48} className="text-gray-200 mb-4" />
                    <p className="font-roboto font-medium text-black">No tienes compras aún</p>
                    <p className="font-roboto text-sm text-gray-500 mt-1">Explora productos en el inicio.</p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden"
                    >
                      <div className="flex items-start gap-3 p-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                          <img 
                            src={order.product_image} 
                            alt="Producto" 
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0UyRThGMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjOTRBM0I4Ii8+PHBhdGggZD0iTTIwIDEwMGEzMCAzMCAwIDAgMSA2MCAwIiBmaWxsPSIjOTRBM0I4Ii8+PC9zdmc+'; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-roboto font-bold text-[13px] text-black truncate">{order.product_name}</p>
                          <p className="font-roboto font-bold text-[15px] text-primary mt-0.5">{order.total_price}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-roboto text-[11px] text-gray-400">
                              {order.quantity > 1 ? `${order.quantity} unidades · ` : ''}
                              {new Date(order.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="px-4 pb-3 pt-1 border-t border-gray-50">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 mt-2 rounded-full text-[11px] font-roboto font-bold",
                          order.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                          order.status === 'confirmed' ? 'bg-green-50 text-green-600' :
                          order.status === 'delivered' ? 'bg-blue-50 text-blue-600' :
                          'bg-red-50 text-red-500'
                        )}>
                          {order.status === 'pending' && <Clock size={12} />}
                          {order.status === 'confirmed' && <CheckCircle2 size={12} />}
                          {order.status === 'delivered' && <Package size={12} />}
                          {order.status === 'cancelled' && <XCircle size={12} />}
                          {order.status === 'pending' ? 'Pendiente' :
                           order.status === 'confirmed' ? 'Confirmado' :
                           order.status === 'delivered' ? 'Entregado' :
                           'Cancelado'}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            ) : activeTab === 'reviews' ? (
              <div className="flex flex-col w-full pb-8">
                {reviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center pt-16 text-gray-500">
                    <Star size={48} strokeWidth={1} className="mb-4 opacity-30" />
                    <p className="font-roboto">No tienes reseñas todavía.</p>
                  </div>
                ) : (
                  <div className="px-4 py-4 space-y-6">
                    {/* General Rating */}
                    <div className="flex flex-col items-center justify-center mb-6">
                      <div className="flex items-center gap-2">
                        <Star size={32} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-4xl font-roboto font-bold text-black">
                          {Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) * 10) / 10}
                        </span>
                      </div>
                      <p className="font-roboto text-sm text-gray-500 mt-1">Calificación general ({reviews.length})</p>
                    </div>

                    {/* Review Cards */}
                    <div className="space-y-4">
                      {reviews.map((review, i) => (
                        <motion.div 
                          key={review.id} 
                          initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          transition={{ delay: Math.min(i * 0.1, 0.4) }}
                          className="w-full bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                              <img src={review.reviewer_avatar} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                               <p className="font-roboto font-medium text-[14px] text-black">{review.reviewer_name}</p>
                               <div className="flex items-center justify-between mt-0.5">
                                 <div className="flex gap-0.5">
                                   {[1, 2, 3, 4, 5].map(s => (
                                      <Star key={s} size={10} className={s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'} />
                                   ))}
                                 </div>
                                 <p className="text-[11px] text-gray-400 font-roboto">{new Date(review.created_at).toLocaleDateString('es-CO')}</p>
                               </div>
                            </div>
                          </div>
                          {review.content && <p className="font-roboto text-[13px] text-gray-600 leading-relaxed mb-3">{review.content}</p>}
                          {review.image_url && <img src={review.image_url} alt="Review attachment" className="w-full h-40 object-cover rounded-xl mb-1" />}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : displayPosts.length === 0 ? (
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

      {/* Orders Drawer */}
      <AnimatePresence>
        {showOrdersDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOrdersDrawer(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300]"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 w-full max-w-[440px] h-full bg-white z-[310] shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 h-16 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={20} className="text-primary" />
                  <h2 className="text-xl font-roboto font-bold text-black">{isUsuario ? 'Mis Compras' : 'Pedidos'}</h2>
                </div>
                <button 
                  onClick={() => setShowOrdersDrawer(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XCircle size={22} className="text-gray-400" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100">
                {([
                  { key: 'pending' as const, label: 'Pendientes', icon: Clock, color: 'text-amber-500' },
                  { key: 'confirmed' as const, label: 'Confirmados', icon: CheckCircle2, color: 'text-green-500' },
                  { key: 'cancelled' as const, label: 'Cancelados', icon: XCircle, color: 'text-red-400' },
                ]).map(tab => {
                  const count = orders.filter(o => o.status === tab.key).length;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setOrdersTab(tab.key)}
                      className={cn(
                        "flex-1 py-3 flex flex-col items-center gap-1 relative transition-colors",
                        ordersTab === tab.key ? "text-black" : "text-gray-400"
                      )}
                    >
                      <div className="flex items-center gap-1">
                        <tab.icon size={14} className={ordersTab === tab.key ? tab.color : 'text-gray-300'} />
                        <span className="font-roboto font-bold text-[12px]">{tab.label}</span>
                      </div>
                      {count > 0 && (
                        <span className={cn(
                          "text-[10px] font-bold",
                          ordersTab === tab.key ? "text-primary" : "text-gray-300"
                        )}>{count}</span>
                      )}
                      {ordersTab === tab.key && (
                        <motion.div layoutId="orders-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Orders List */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-4">
                {ordersLoading ? (
                  <div className="flex flex-col items-center justify-center p-12 space-y-4">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-gray-400 font-roboto">Cargando pedidos...</p>
                  </div>
                ) : orders.filter(o => o.status === ordersTab).length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <Package size={32} className="text-gray-300" />
                    </div>
                    <p className="text-black font-roboto font-bold mb-1">
                      {ordersTab === 'pending' ? 'Sin pedidos pendientes' :
                       ordersTab === 'confirmed' ? 'Sin pedidos confirmados' :
                       'Sin pedidos cancelados'}
                    </p>
                    <p className="text-gray-400 text-sm font-roboto">
                      {ordersTab === 'pending' ? 'Los nuevos pedidos aparecerán aquí.' :
                       ordersTab === 'confirmed' ? 'Los pedidos que confirmes se verán aquí.' :
                       'Los pedidos cancelados aparecerán aquí.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders
                      .filter(o => o.status === ordersTab)
                      .map((order, i) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          transition={{ delay: Math.min(i * 0.08, 0.4) }}
                          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                        >
                          {/* Order Header with Product Preview */}
                          <div className="flex items-start gap-3 p-4">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                              <img 
                                src={order.product_image} 
                                alt="Producto" 
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0UyRThGMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjOTRBM0I4Ii8+PHBhdGggZD0iTTIwIDEwMGEzMCAzMCAwIDAgMSA2MCAwIiBmaWxsPSIjOTRBM0I4Ii8+PC9zdmc+'; }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-roboto font-bold text-[13px] text-black truncate">{order.product_name}</p>
                              <p className="font-roboto font-bold text-[15px] text-primary mt-0.5">{order.total_price}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-roboto text-[11px] text-gray-400">
                                  {order.quantity > 1 ? `${order.quantity} unidades · ` : ''}
                                  {new Date(order.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Buyer Info - only for sellers */}
                          {!isUsuario && (
                          <div className="px-4 pb-3 border-t border-gray-50 pt-3">
                            <p className="text-[11px] font-bold text-gray-400 uppercase mb-2">Comprador</p>
                            <div className="space-y-1">
                              <p className="font-roboto text-[13px] text-black">
                                <span className="font-medium">👤</span> {order.buyer_name}
                              </p>
                              <p className="font-roboto text-[13px] text-gray-600">
                                <span className="font-medium">📧</span> {order.buyer_email}
                              </p>
                              {order.buyer_phone && (
                                <p className="font-roboto text-[13px] text-gray-600">
                                  <span className="font-medium">📞</span> {order.buyer_phone}
                                </p>
                              )}
                            </div>
                          </div>
                          )}

                          {/* Delivery Info */}
                          <div className="px-4 pb-3 border-t border-gray-50 pt-3">
                            <p className="text-[11px] font-bold text-gray-400 uppercase mb-2">Entrega</p>
                            <div className="space-y-1">
                              <p className="font-roboto text-[13px] text-gray-700">
                                📍 {order.delivery_address}
                              </p>
                              {order.meeting_point && (
                                <p className="font-roboto text-[13px] text-gray-600">
                                  🤝 {order.meeting_point}
                                </p>
                              )}
                              <p className="font-roboto text-[13px] text-gray-600">
                                💳 {order.payment_method === 'efectivo' ? 'Efectivo' :
                                     order.payment_method === 'nequi' ? 'Nequi' :
                                     order.payment_method === 'daviplata' ? 'Daviplata' :
                                     order.payment_method === 'bancolombia' ? 'Bancolombia' :
                                     order.payment_method}
                              </p>
                              {order.notes && (
                                <p className="font-roboto text-[12px] text-gray-500 italic mt-1">
                                  📝 "{order.notes}"
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Actions (only for pending + seller only) */}
                          {order.status === 'pending' && !isUsuario && (
                            <div className="flex gap-2 p-4 border-t border-gray-50 bg-gray-50/50">
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                                className="flex-1 h-10 bg-green-500 text-white rounded-xl font-roboto font-bold text-[13px] flex items-center justify-center gap-1.5 hover:bg-green-600 transition-colors"
                              >
                                <CheckCircle2 size={15} />
                                Confirmar
                              </motion.button>
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                className="flex-1 h-10 bg-white text-red-500 border border-red-200 rounded-xl font-roboto font-bold text-[13px] flex items-center justify-center gap-1.5 hover:bg-red-50 transition-colors"
                              >
                                <XCircle size={15} />
                                Cancelar
                              </motion.button>
                            </div>
                          )}

                          {/* Status Badge */}
                          {(order.status !== 'pending' || isUsuario) && (
                            <div className="px-4 pb-3 pt-1">
                              <div className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-roboto font-bold",
                                order.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                order.status === 'confirmed' ? 'bg-green-50 text-green-600' :
                                order.status === 'delivered' ? 'bg-blue-50 text-blue-600' :
                                'bg-red-50 text-red-500'
                              )}>
                                {order.status === 'pending' && <Clock size={12} />}
                                {order.status === 'confirmed' && <CheckCircle2 size={12} />}
                                {order.status === 'delivered' && <Package size={12} />}
                                {order.status === 'cancelled' && <XCircle size={12} />}
                                {order.status === 'pending' ? 'Pendiente' :
                                 order.status === 'confirmed' ? 'Confirmado' :
                                 order.status === 'delivered' ? 'Entregado' :
                                 'Cancelado'}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </MobileContainer>
  );
}
