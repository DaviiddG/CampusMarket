import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';

export interface Post {
  id: string;
  user_id: string;
  businessName: string;
  avatarUrl: string;
  imageUrl: string;
  price: string;
  description: string;
  likes: number;     // This will be computed from the `likes` table
}

interface FeedContextType {
  posts: Post[];
  savedPostIds: string[];
  likedPostIds: string[];
  addPost: (post: Post) => void;
  deletePost: (postId: string) => Promise<boolean>;
  updatePost: (postId: string, data: { price: string; description: string }) => Promise<boolean>;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  sharePost: (postId: string) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<void>;
  loading: boolean;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

export const FeedProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthContext();
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial Fetch logic
  useEffect(() => {
    fetchPostsAndInteractions();

    // 4. Realtime Subscription
    const channel = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          const newPostRaw = payload.new;
          const newPost: Post = {
            id: newPostRaw.id,
            user_id: newPostRaw.user_id,
            businessName: newPostRaw.business_name,
            avatarUrl: newPostRaw.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${newPostRaw.business_name}`,
            imageUrl: newPostRaw.image_url,
            price: newPostRaw.price,
            description: newPostRaw.description,
            likes: 0
          };
          setPosts(prev => {
            if (prev.some(p => p.id === newPost.id)) return prev;
            return [newPost, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          const updatedPost = payload.new;
          setPosts(prev => prev.map(p => p.id === updatedPost.id ? { 
            ...p, 
            price: updatedPost.price, 
            description: updatedPost.description,
            businessName: updatedPost.business_name,
            avatarUrl: updatedPost.avatar_url || p.avatarUrl,
            imageUrl: updatedPost.image_url || p.imageUrl
          } : p));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload) => {
          const removedId = payload.old.id;
          setPosts(prev => prev.filter(p => p.id !== removedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchPostsAndInteractions = async () => {
    setLoading(true);
    try {
      // 1. Fetch Posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Ensure mapping from DB schema to frontend interface
      const activePosts: Post[] = (postsData || []).map(p => ({
        id: p.id,
        user_id: p.user_id,
        businessName: p.business_name,
        avatarUrl: p.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${p.business_name}`,
        imageUrl: p.image_url,
        price: p.price,
        description: p.description,
        likes: 0 // Will apply counting next
      }));

      // 2. Compute Likes for all posts (if likes table is populated)
      const { data: allLikes } = await supabase.from('likes').select('post_id, user_id');
      
      const likesCountMap: Record<string, number> = {};
      const userLikedSet = new Set<string>();

      allLikes?.forEach(like => {
        likesCountMap[like.post_id] = (likesCountMap[like.post_id] || 0) + 1;
        if (user && like.user_id === user.id) {
          userLikedSet.add(like.post_id);
        }
      });

      // Assign counts
      activePosts.forEach(post => {
        post.likes = likesCountMap[post.id] || 0;
      });

      // 3. Saved Posts for the current user
      const userSavedSet = new Set<string>();
      if (user) {
        const { data: savedData } = await supabase
          .from('saved_posts')
          .select('post_id')
          .eq('user_id', user.id);
          
        savedData?.forEach(saved => userSavedSet.add(saved.post_id));
      }

      setPosts(activePosts);
      setLikedPostIds(Array.from(userLikedSet));
      setSavedPostIds(Array.from(userSavedSet));
    } catch (e) {
      console.error('Error fetching feed data from Supabase. Check if tables (posts, likes, saved_posts) exist:', e);
    } finally {
      setLoading(false);
    }
  };

  const addPost = (post: Post) => {
    // When a post is added directly from the UI, we place it smoothly without re-rendering everything.
    setPosts(prev => [post, ...prev]);
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const isLiked = likedPostIds.includes(postId);

    // Optimistic UI update
    setLikedPostIds(prev => isLiked ? prev.filter(id => id !== postId) : [...prev, postId]);
    setPosts(currentPosts => currentPosts.map(p => p.id === postId ? { ...p, likes: isLiked ? Math.max(0, p.likes - 1) : p.likes + 1 } : p));

    // Backend update
    if (isLiked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
      
      // TRIGGER NOTIFICATION
      const post = posts.find(p => p.id === postId);
      console.log('--- DEBUG NOTIFICATIONS ---');
      console.log('Publicación:', postId);
      console.log('Dueño del Post (Target):', post?.user_id);
      console.log('Usuario actual (Actor):', user.id);
      
      try {
        if (post && post.user_id !== user.id) {
          console.log('Enviando notificación...');
          const { error: notifError } = await supabase.from('notifications').insert({
            user_id: post.user_id,
            actor_id: user.id,
            actor_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Un usuario',
            actor_avatar: user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.id}`,
            type: 'like',
            post_id: postId,
            post_image: post.imageUrl
          });

          if (notifError) {
            console.error('Error de Supabase al insertar:', notifError);
            alert('Error al enviar notificación: ' + notifError.message);
          } else {
            console.log('✅ Notificación enviada con éxito');
          }
        } else if (post && post.user_id === user.id) {
          console.log('ℹ️ Self-like: El usuario es el dueño del post, no se envía notificación.');
        } else {
          console.log('⚠️ No se encontró el post o el usuario.');
        }
      } catch (err) {
        console.error('Crash inesperado en notificaciones:', err);
      }
      console.log('---------------------------');
    }
  };

  const toggleSave = async (postId: string) => {
    if (!user) return;
    const isSaved = savedPostIds.includes(postId);

    // Optimistic UI update
    setSavedPostIds(prev => isSaved ? prev.filter(id => id !== postId) : [...prev, postId]);

    // Backend update
    if (isSaved) {
      await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      await supabase.from('saved_posts').insert({ post_id: postId, user_id: user.id });
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) return false;
    
    try {
      // 1. Delete from Supabase
      const { data: deletedRows, error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id)
        .select();

      if (error) throw error;

      // Verify if anything was actually deleted
      if (!deletedRows || deletedRows.length === 0) {
        console.warn(`No rows deleted for ID ${postId}. User ID: ${user.id}`);
        alert('No se pudo borrar: No eres el dueño o no tienes permisos (RLS). Ejecuta el script SQL robusto.');
        return false;
      }

      console.log('Post deleted successfully from DB:', deletedRows[0]);

      // 2. Optimistic UI update: remove from local state
      setPosts(prev => prev.filter(p => p.id !== postId));
      return true;
    } catch (error: any) {
      console.error('Error deleting post:', error);
      alert(`No se pudo eliminar la publicación: ${error.message || 'Error de permisos (RLS)'}. Verifica que seas el dueño y hayas ejecutado el script SQL.`);
      return false;
    }
  };

  const updatePost = async (postId: string, data: { price: string; description: string }) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('posts')
        .update({
          price: data.price,
          description: data.description
        })
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Optimistic UI update
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...data } : p));
      return true;
    } catch (error) {
      console.error('Error updating post:', error);
      return false;
    }
  };

  const sharePost = async (postId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (post && post.user_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: post.user_id,
        actor_id: user.id,
        actor_name: user?.user_metadata?.full_name || 'Alguien',
        actor_avatar: user?.user_metadata?.avatar_url,
        type: 'share',
        post_id: postId,
        post_image: post.imageUrl
      });
    }
  };

  const addComment = async (postId: string, _text: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (post && post.user_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: post.user_id,
        actor_id: user.id,
        actor_name: user?.user_metadata?.full_name || 'Alguien',
        actor_avatar: user?.user_metadata?.avatar_url,
        type: 'comment',
        post_id: postId,
        post_image: post.imageUrl
      });
    }
  };

  return (
    <FeedContext.Provider value={{ 
      posts, 
      savedPostIds, 
      likedPostIds, 
      addPost, 
      deletePost, 
      updatePost, 
      toggleLike, 
      toggleSave, 
      sharePost,
      addComment,
      loading 
    }}>
      {children}
    </FeedContext.Provider>
  );
};

export const useFeedContext = () => {
  const context = useContext(FeedContext);
  if (context === undefined) {
    throw new Error('useFeedContext must be used within a FeedProvider');
  }
  return context;
};
