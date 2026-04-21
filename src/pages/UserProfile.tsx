import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MobileContainer from '@/components/layout/MobileContainer';
import BottomNav from '@/components/layout/BottomNav';
import { ChevronLeft, MoreVertical, MessageCircle, Instagram, Facebook, Star, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFeedContext, type Review } from '@/contexts/FeedContext';
import { cn } from '@/lib/utils';
import ReviewsModal from '@/components/home/ReviewsModal';
import { AnimatePresence, motion } from 'motion/react';
import ProductCard from '@/components/home/ProductCard';
import { Marquee } from '@/components/ui/Marquee';

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthContext();
  const { posts, getReviews } = useFeedContext();

  const [targetUser, setTargetUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  
  const userPosts = posts.filter(p => p.user_id === userId);
  const popular = userPosts.slice().reverse().slice(0, 4);

  // Compute real average rating from reviews
  const rating = reviews.length > 0 
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10 
    : 0;

  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      setLoading(true);
      try {
        // 1. Try to get profile from the 'profiles' table first
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        // 2. Fallback to getting basic info from posts if no profile row exists
        const post = posts.find(p => p.user_id === userId);

        if (profileData) {
          setTargetUser({
            id: userId,
            businessName: profileData.business_name || post?.businessName || 'Usuario',
            avatarUrl: profileData.avatar_url || post?.avatarUrl,
            bio: profileData.bio || null,
            location: profileData.location || null,
            whatsapp: profileData.whatsapp || null,
            instagram: profileData.instagram || null,
            facebook: profileData.facebook || null,
          });
        } else if (post) {
          // No profiles row yet — show basic info from post
          setTargetUser({
            id: userId,
            businessName: post.businessName,
            avatarUrl: post.avatarUrl,
            bio: null,
            location: null,
            whatsapp: null,
            instagram: null,
            facebook: null,
          });
        }

        // 3. Fetch follow status
        if (currentUser) {
          const { data: followData } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', currentUser.id)
            .eq('following_id', userId)
            .single();
          
          setIsFollowing(!!followData);
        }

        // 4. Fetch followers count
        const { count } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId);
        
        setFollowersCount(count || 0);

      } catch (err) {
        console.error('Error fetching user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, posts, currentUser]);

  // Fetch reviews separately
  useEffect(() => {
    if (!userId) return;
    getReviews(userId).then(setReviews);
  }, [userId]);

  const handleFollow = async () => {
    if (!currentUser || !userId) return;

    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', userId);
      setIsFollowing(false);
      setFollowersCount(prev => Math.max(0, prev - 1));
    } else {
      await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: userId });
      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
      
      // TRIGGER NOTIFICATION
      console.log('--- DEBUG FOLLOW ---');
      console.log('Usuario a seguir (Target):', userId);
      console.log('Usuario actual (Actor):', currentUser.id);

      try {
        if (userId !== currentUser.id) {
          const { error: notifError } = await supabase.from('notifications').insert({
            user_id: userId,
            actor_id: currentUser.id,
            actor_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Un usuario',
            actor_avatar: currentUser.user_metadata?.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0UyRThGMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjOTRBM0I4Ii8+PHBhdGggZD0iTTIwIDEwMGEzMCAzMCAwIDAgMSA2MCAwIiBmaWxsPSIjOTRBM0I4Ii8+PC9zdmc+',
            type: 'follow'
          });

          if (notifError) {
            console.error('Error al insertar notificación de follow:', notifError);
          } else {
            console.log('✅ Notificación de follow enviada con éxito');
          }
        } else {
          console.log('ℹ️ Self-follow: No se envía notificación a uno mismo.');
        }
      } catch (err) {
        console.error('Error inesperado en follow notif:', err);
      }
      console.log('--------------------');
    }
  };

  if (loading && !targetUser) {
    return (
      <MobileContainer className="bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </MobileContainer>
    );
  }

  return (
    <MobileContainer className="bg-white" justifyCenter={false}>
      {/* Main Content Area */}
      <div className="w-full pb-[80px] lg:pb-10">
        <div className="max-w-[800px] mx-auto w-full">
          
          {/* Header Mobile Only */}
          <div className="flex lg:hidden items-center justify-between px-4 pt-10 pb-4 flex-shrink-0">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-black hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h1 className="font-roboto font-bold text-[18px]">Perfil</h1>
            <button className="p-2 -mr-2 text-black hover:bg-gray-100 rounded-full transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>

          {/* Profile Info - Responsive Header */}
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-14 px-6 mt-6 lg:mt-12">
            {/* Avatar */}
            <div className="w-24 h-24 lg:w-40 lg:h-40 rounded-full overflow-hidden border-[3px] border-primary/10 shadow-lg flex-shrink-0">
              <img 
                src={targetUser?.avatarUrl || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0UyRThGMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjOTRBM0I4Ii8+PHBhdGggZD0iTTIwIDEwMGEzMCAzMCAwIDAgMSA2MCAwIiBmaWxsPSIjOTRBM0I4Ii8+PC9zdmc+'} 
                alt="Profile Avatar" 
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0UyRThGMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjOTRBM0I4Ii8+PHBhdGggZD0iTTIwIDEwMGEzMCAzMCAwIDAgMSA2MCAwIiBmaWxsPSIjOTRBM0I4Ii8+PC9zdmc+'; }}
              />
            </div>
            <div className="flex-1 flex flex-col items-center lg:items-start">
              <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6 mb-6">
                <h2 className="text-xl lg:text-2xl font-roboto font-bold text-black">{targetUser?.businessName}</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={handleFollow}
                    className={cn(
                      "px-6 py-1.5 rounded-xl font-roboto font-bold text-sm transition-all shadow-sm",
                      isFollowing 
                        ? "bg-gray-100 text-black border border-gray-200" 
                        : "bg-primary text-white shadow-lg shadow-primary/20"
                    )}
                  >
                    {isFollowing ? 'Siguiendo' : 'Seguir'}
                  </button>
                  <button 
                    onClick={() => navigate(`/review/${userId}`)}
                    className="px-6 py-1.5 bg-gray-100 hover:bg-gray-200 text-black font-roboto font-bold text-sm rounded-xl border border-gray-200 transition-all"
                  >
                    Reseñar
                  </button>
                </div>
              </div>

              {/* Stats & Bio */}
              <div className="flex flex-col items-center lg:items-start space-y-4">
                <div className="flex gap-10">
                  <div className="text-center lg:text-left">
                    <p className="font-roboto font-bold text-lg text-black">{userPosts.length}</p>
                    <p className="text-[12px] text-gray-400">Productos</p>
                  </div>
                  <div className="text-center lg:text-left">
                    <p className="font-roboto font-bold text-lg text-black">{followersCount}</p>
                    <p className="text-[12px] text-gray-400">Seguidores</p>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="fill-yellow-400 text-yellow-400" />
                      <p className="font-roboto font-bold text-lg text-black">{rating}</p>
                    </div>
                    <p className="text-[12px] text-gray-400">Calificación</p>
                  </div>
                </div>

                <div className="max-w-md text-center lg:text-left">
                  <p className="text-sm lg:text-[15px] text-gray-700 font-roboto leading-relaxed mb-1">{targetUser?.bio}</p>
                  <p className="text-[12px] text-primary font-medium flex items-center justify-center lg:justify-start gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    {targetUser?.location}
                  </p>
                </div>

                {/* Social Links - Only show if user has them set */}
                {(targetUser?.whatsapp || targetUser?.instagram || targetUser?.facebook) && (
                  <div className="flex items-center gap-4 pt-2">
                    {targetUser?.whatsapp && (
                      <a 
                        href={`https://wa.me/${targetUser.whatsapp}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-2 bg-[#25D366]/10 text-[#25D366] rounded-xl hover:bg-[#25D366]/20 transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle size={22} />
                      </a>
                    )}
                    {targetUser?.instagram && (
                      <a 
                        href={`https://instagram.com/${targetUser.instagram}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-2 bg-[#E1306C]/10 text-[#E1306C] rounded-xl hover:bg-[#E1306C]/20 transition-colors"
                        title="Instagram"
                      >
                        <Instagram size={22} />
                      </a>
                    )}
                    {targetUser?.facebook && (
                      <a 
                        href={`https://facebook.com/${targetUser.facebook}`} 
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
            </div>
          </div>
          
          {/* Sections */}
          <div className="mt-8 space-y-10">
            {/* Products */}
            <section>
              <div className="flex items-center justify-between px-6 mb-3">
                <h3 className="font-roboto font-bold text-lg text-black">Productos</h3>
                <button className="text-gray-400"><ChevronRight size={20} /></button>
              </div>
              <div className="grid grid-cols-3 gap-1 px-1">
                {userPosts.map((post) => (
                  <div key={post.id} onClick={() => setSelectedPost(post)} className="aspect-square bg-gray-50 overflow-hidden cursor-pointer">
                    <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Product" />
                  </div>
                ))}
              </div>
              {userPosts.length === 0 && <p className="text-gray-400 text-sm italic px-6">No hay productos.</p>}
            </section>

            {/* Populares */}
            <section>
              <div className="flex items-center justify-between px-6 mb-3">
                <h3 className="font-roboto font-bold text-lg text-black">Populares</h3>
                <button className="text-gray-400"><ChevronRight size={20} /></button>
              </div>
              <div className="grid grid-cols-3 gap-1 px-1">
                {popular.map((post) => (
                  <div key={post.id + '_popular'} onClick={() => setSelectedPost(post)} className="aspect-square bg-gray-50 overflow-hidden cursor-pointer">
                    <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Popular" />
                  </div>
                ))}
              </div>
              {popular.length === 0 && <p className="text-gray-400 text-sm italic px-6">No hay contenido popular.</p>}
            </section>

            {/* Reseñas */}
            <section className="mb-10">
              <button 
                onClick={() => {
                  if (reviews.length > 0) setShowReviewsModal(true);
                }}
                className="w-full flex items-center justify-between px-6 mb-3 text-left group"
              >
                <h3 className="font-roboto font-bold text-lg text-black group-hover:underline">Reseñas</h3>
                <span className="text-[13px] text-gray-400 font-roboto">{reviews.length} reseñas</span>
              </button>
              
              {reviews.length > 1 ? (
                <div onClick={() => setShowReviewsModal(true)} className="cursor-pointer">
                  <Marquee pauseOnHover className="[--duration:25s] [--gap:1rem]">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        onClick={(e) => { e.stopPropagation(); setShowReviewsModal(true); }}
                        className="w-[260px] flex-shrink-0 bg-gray-50 rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                            <img
                              src={review.reviewer_avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0UyRThGMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjOTRBM0I4Ii8+PHBhdGggZD0iTTIwIDEwMGEzMCAzMCAwIDAgMSA2MCAwIiBmaWxsPSIjOTRBM0I4Ii8+PC9zdmc+'}
                              alt={review.reviewer_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-roboto font-medium text-[13px] text-black truncate">{review.reviewer_name || 'Usuario'}</p>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star
                                  key={s}
                                  size={12}
                                  className={s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        {review.content && (
                          <p className="font-roboto font-light text-[12px] text-gray-600 leading-relaxed line-clamp-3">
                            {review.content}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-300 mt-2 font-roboto">
                          {new Date(review.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    ))}
                  </Marquee>
                </div>
              ) : reviews.length === 1 ? (
                <div 
                  className="px-6 cursor-pointer"
                  onClick={() => setShowReviewsModal(true)}
                >
                  <div className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100 shadow-sm hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        <img
                          src={reviews[0].reviewer_avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0UyRThGMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjOTRBM0I4Ii8+PHBhdGggZD0iTTIwIDEwMGEzMCAzMCAwIDAgMSA2MCAwIiBmaWxsPSIjOTRBM0I4Ii8+PC9zdmc+'}
                          alt={reviews[0].reviewer_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-roboto font-medium text-[13px] text-black truncate">{reviews[0].reviewer_name || 'Usuario'}</p>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star
                              key={s}
                              size={12}
                              className={s <= reviews[0].rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {reviews[0].content && (
                      <p className="font-roboto font-light text-[13px] text-gray-600 leading-relaxed">
                        {reviews[0].content}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-300 mt-2 font-roboto">
                      {new Date(reviews[0].created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-8 text-center bg-gray-50/50 mx-6 rounded-2xl border border-gray-100 border-dashed">
                  <Star size={24} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-400 text-sm font-roboto mb-4">Aún no hay reseñas para este negocio.</p>
                  <button
                    onClick={() => navigate(`/review/${userId}`)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-full font-roboto font-medium text-sm hover:bg-blue-600 transition-colors"
                  >
                    Dejar la primera reseña
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
      
      {/* Nav */}
      <BottomNav activeTab="profile" />

      {/* Reviews Modal Integration */}
      <AnimatePresence>
        {showReviewsModal && (
          <ReviewsModal
            isOpen={showReviewsModal}
            onClose={() => setShowReviewsModal(false)}
            reviews={reviews}
            targetName={targetUser?.businessName || 'Usuario'}
          />
        )}
      </AnimatePresence>

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
