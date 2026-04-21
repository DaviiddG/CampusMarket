import { useAuthContext } from '@/contexts/AuthContext';
import { useFeedContext } from '@/contexts/FeedContext';
import { Link } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function RightSidebar() {
  const { user } = useAuthContext();
  const { posts } = useFeedContext();
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const displayName = user?.user_metadata?.full_name || 'Usuario';
  const username = user?.email?.split('@')[0] || 'usuario';

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

  const avatarUrl = profileAvatar || user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.id}`;

  const suggestions = useMemo(() => {
    if (!posts || posts.length === 0) return [];
    
    // Extract unique users from posts
    const usersMap = new Map();
    posts.forEach(post => {
      if (post.user_id !== user?.id && !usersMap.has(post.user_id)) {
        usersMap.set(post.user_id, {
          id: post.user_id,
          name: post.businessName,
          username: post.businessName.toLowerCase().replace(/\s+/g, '_'),
          avatar: post.avatarUrl
        });
      }
    });

    const uniqueUsers = Array.from(usersMap.values());
    
    // Shuffle and pick 5
    return uniqueUsers
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
  }, [posts, user?.id]);

  return (
    <aside className="hidden xl:flex flex-col w-[320px] h-screen py-10 px-4 sticky top-0 flex-shrink-0">
      {/* Current User Header */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/profile" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 shadow-sm transition-transform group-hover:scale-105">
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-black truncate leading-tight">{username}</span>
            <span className="text-sm text-gray-400 truncate leading-tight">{displayName}</span>
          </div>
        </Link>
        <button className="text-[12px] font-bold text-primary hover:text-primary/70 transition-colors">
          Cambiar
        </button>
      </div>

      {/* Suggestions Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-gray-400">Sugerencias para ti</span>
          <button className="text-[12px] font-bold text-black hover:text-gray-500 transition-colors">
            Ver todos
          </button>
        </div>
        
        <div className="space-y-4">
          {suggestions.length > 0 ? (
            suggestions.map((s) => (
              <div key={s.id} className="flex items-center justify-between group">
                <Link to={`/user/${s.id}`} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-50 transition-transform group-hover:scale-105">
                    <img src={s.avatar} alt={s.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-black leading-none">{s.username}</span>
                    <span className="text-[11px] text-gray-400 leading-none mt-1">Nuevo en CampusMarket</span>
                  </div>
                </Link>
                <Link to={`/user/${s.id}`} className="text-[12px] font-bold text-primary hover:text-primary/70 transition-colors">
                  Ver perfil
                </Link>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">No hay sugerencias por ahora</p>
          )}
        </div>
      </div>

    </aside>
  );
}
