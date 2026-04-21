import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MobileContainer from '@/components/layout/MobileContainer';
import BottomNav from '@/components/layout/BottomNav';
import { ChevronLeft, MoreVertical, MessageCircle, Instagram, Facebook, Star, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFeedContext, type Review } from '@/contexts/FeedContext';
import { cn } from '@/lib/utils';
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
            actor_avatar: currentUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${currentUser.id}`,
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
                src={targetUser?.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${targetUser?.businessName}`} 
                alt={targetUser?.businessName} 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info Content */}
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
                <div key={post.id} className="aspect-square bg-gray-50 overflow-hidden cursor-pointer">
                  <img src={post.imageUrl} className="w-full h-full object-cover" alt="Product" />
                </div>
              ))}
            </div>
            {userPosts.length === 0 && <p className="text-gray-400 text-sm italic px-6">No hay productos.</p>}
          </section>

          {/* Ofertas (now shows Popular content) */}
          <section>
            <div className="flex items-center justify-between px-6 mb-3">
              <h3 className="font-roboto font-bold text-lg text-black">Populares</h3>
              <button className="text-gray-400"><ChevronRight size={20} /></button>
            </div>
            <div className="grid grid-cols-3 gap-1 px-1">
              {popular.map((post) => (
                <div key={post.id + '_popular'} className="aspect-square bg-gray-50 overflow-hidden cursor-pointer">
                  <img src={post.imageUrl} className="w-full h-full object-cover" alt="Popular" />
                </div>
              ))}
            </div>
            {popular.length === 0 && <p className="text-gray-400 text-sm italic px-6">No hay contenido popular.</p>}
          </section>

          {/* Reseñas with Marquee */}
          <section>
            <div className="flex items-center justify-between px-6 mb-3">
              <h3 className="font-roboto font-bold text-lg text-black">Reseñas</h3>
              <span className="text-[13px] text-gray-400 font-roboto">{reviews.length} reseñas</span>
            </div>
            {reviews.length > 1 ? (
              <Marquee pauseOnHover className="[--duration:25s] [--gap:1rem]">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="w-[260px] flex-shrink-0 bg-gray-50 rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        <img
                          src={review.reviewer_avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${review.reviewer_name}`}
                          alt={review.reviewer_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-roboto font-medium text-[13px] text-black truncate">{review.reviewer_name}</p>
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
            ) : reviews.length === 1 ? (
              <div className="px-6">
                <div className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      <img
                        src={reviews[0].reviewer_avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${reviews[0].reviewer_name}`}
                        alt={reviews[0].reviewer_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-roboto font-medium text-[13px] text-black truncate">{reviews[0].reviewer_name}</p>
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
              <div className="px-6 py-8 text-center">
                <Star size={32} className="mx-auto mb-2 text-gray-200" />
                <p className="text-gray-400 text-sm font-roboto">Aún no hay reseñas para este negocio.</p>
                <button
                  onClick={() => navigate(`/review/${userId}`)}
                  className="mt-3 text-primary text-sm font-roboto font-bold hover:underline"
                >
                  ¡Sé el primero en dejar una!
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      <BottomNav />
    </MobileContainer>
  );
}
