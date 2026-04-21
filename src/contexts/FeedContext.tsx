import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

export interface Review {
  id: string;
  target_user_id: string;
  reviewer_id: string;
  rating: number;
  content: string;
  created_at: string;
  reviewer_name?: string;
  reviewer_avatar?: string;
}

export interface Post {
  id: string;
  user_id: string;
  businessName: string;
  avatarUrl: string;
  imageUrl: string;
  price: string;
  description: string;
  likes: number;
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
  sharePost: (postId: string) => Promise<boolean>;
  addComment: (postId: string, text: string) => Promise<boolean>;
  deleteComment: (commentId: string) => Promise<boolean>;
  getComments: (postId: string) => Promise<Comment[]>;
  addReview: (targetUserId: string, rating: number, content: string) => Promise<boolean>;
  getReviews: (targetUserId: string) => Promise<Review[]>;
  loading: boolean;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

export const FeedProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthContext();
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPostsAndInteractions();

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
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      const activePosts: Post[] = (postsData || []).map(p => ({
        id: p.id,
        user_id: p.user_id,
        businessName: p.business_name,
        avatarUrl: p.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${p.business_name}`,
        imageUrl: p.image_url,
        price: p.price,
        description: p.description,
        likes: 0
      }));

      // Enrich post avatars from profiles table (fresher source)
      const uniqueUserIds = Array.from(new Set(activePosts.map(p => p.user_id)));
      if (uniqueUserIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, avatar_url, business_name')
          .in('id', uniqueUserIds);

        if (profileData && profileData.length > 0) {
          const profileMap: Record<string, { avatar_url?: string; business_name?: string }> = {};
          profileData.forEach(p => { profileMap[p.id] = p; });

          activePosts.forEach(post => {
            const profile = profileMap[post.user_id];
            if (profile) {
              if (profile.avatar_url) post.avatarUrl = profile.avatar_url;
              if (profile.business_name) post.businessName = profile.business_name;
            }
          });
        }
      }

      const { data: allLikes } = await supabase.from('likes').select('post_id, user_id');
      
      const likesCountMap: Record<string, number> = {};
      const userLikedSet = new Set<string>();

      allLikes?.forEach(like => {
        likesCountMap[like.post_id] = (likesCountMap[like.post_id] || 0) + 1;
        if (user && like.user_id === user.id) {
          userLikedSet.add(like.post_id);
        }
      });

      activePosts.forEach(post => {
        post.likes = likesCountMap[post.id] || 0;
      });

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
      console.error('Error fetching feed data:', e);
    } finally {
      setLoading(false);
    }
  };

  const addPost = (post: Post) => {
    setPosts(prev => [post, ...prev]);
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const isLiked = likedPostIds.includes(postId);

    setLikedPostIds(prev => isLiked ? prev.filter(id => id !== postId) : [...prev, postId]);
    setPosts(currentPosts => currentPosts.map(p => p.id === postId ? { ...p, likes: isLiked ? Math.max(0, p.likes - 1) : p.likes + 1 } : p));

    if (isLiked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
      
      const post = posts.find(p => p.id === postId);
      if (post && post.user_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: post.user_id,
          actor_id: user.id,
          actor_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Un usuario',
          actor_avatar: user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.id}`,
          type: 'like',
          post_id: postId,
          post_image: post.imageUrl
        });
      }
    }
  };

  const toggleSave = async (postId: string) => {
    if (!user) return;
    const isSaved = savedPostIds.includes(postId);
    setSavedPostIds(prev => isSaved ? prev.filter(id => id !== postId) : [...prev, postId]);

    if (isSaved) {
      await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      await supabase.from('saved_posts').insert({ post_id: postId, user_id: user.id });
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) return false;
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId).eq('user_id', user.id);
      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== postId));
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  };

  const updatePost = async (postId: string, data: { price: string; description: string }) => {
    if (!user) return false;
    try {
      const { error } = await supabase.from('posts').update({ price: data.price, description: data.description }).eq('id', postId).eq('user_id', user.id);
      if (error) throw error;
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...data } : p));
      return true;
    } catch (error) {
      console.error('Error updating post:', error);
      return false;
    }
  };

  const sharePost = async (postId: string) => {
    if (!user) return false;
    const post = posts.find(p => p.id === postId);
    if (!post) return false;

    // Trigger Notification for sharing
    if (post.user_id !== user.id) {
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
    return true;
  };

  const getComments = async (postId: string): Promise<Comment[]> => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = Array.from(new Set(data.map(c => c.user_id)));

        // Check profiles table first
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, business_name, avatar_url')
          .in('id', userIds);

        const profileMap: Record<string, { business_name?: string; avatar_url?: string }> = {};
        (profileData || []).forEach(p => { profileMap[p.id] = p; });

        // Fallback: check posts table for users not found in profiles
        const missingIds = userIds.filter(uid => !profileMap[uid]?.business_name);
        if (missingIds.length > 0) {
          const { data: postData } = await supabase
            .from('posts')
            .select('user_id, business_name, avatar_url')
            .in('user_id', missingIds);

          (postData || []).forEach(p => {
            if (!profileMap[p.user_id]?.business_name) {
              profileMap[p.user_id] = { business_name: p.business_name, avatar_url: p.avatar_url };
            }
          });
        }

        // Final fallback: use current user's auth metadata if this is the logged-in user
        const stillMissing = userIds.filter(uid => !profileMap[uid]?.business_name);
        if (user && stillMissing.includes(user.id)) {
          profileMap[user.id] = {
            business_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Alguien',
            avatar_url: user.user_metadata?.avatar_url || profileMap[user.id]?.avatar_url
          };
        }

        return data.map(c => ({
          ...c,
          user_name: profileMap[c.user_id]?.business_name || 'Alguien',
          user_avatar: profileMap[c.user_id]?.avatar_url
        }));
      }

      return data || [];
    } catch (e) {
      console.error('Error fetching comments:', e);
      return [];
    }
  };

  const addComment = async (postId: string, text: string) => {
    if (!user || !text.trim()) return false;
    
    try {
      const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';
      const userAvatar = user.user_metadata?.avatar_url;

      // Ensure this user has a profiles row so their name is discoverable
      await supabase.from('profiles').upsert({
        id: user.id,
        business_name: userName,
        avatar_url: userAvatar || null
      }, { onConflict: 'id', ignoreDuplicates: false });

      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: user.id,
        content: text.trim()
      });

      if (error) throw error;

      // After successful comment, send notification
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
      return true;
    } catch (e) {
      console.error('Error adding comment:', e);
      return false;
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return false;
    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error deleting comment:', e);
      return false;
    }
  };

  const addReview = async (targetUserId: string, rating: number, content: string) => {
    if (!user) return false;
    try {
      const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';
      const userAvatar = user.user_metadata?.avatar_url;

      // Ensure reviewer has a profiles row
      await supabase.from('profiles').upsert({
        id: user.id,
        business_name: userName,
        avatar_url: userAvatar || null
      }, { onConflict: 'id', ignoreDuplicates: false });

      const { error } = await supabase.from('reviews').insert({
        target_user_id: targetUserId,
        reviewer_id: user.id,
        rating,
        content
      });

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: targetUserId,
        actor_id: user.id,
        actor_name: user?.user_metadata?.full_name || 'Alguien',
        actor_avatar: user?.user_metadata?.avatar_url,
        type: 'follow',
      });

      return true;
    } catch (e) {
      console.error('Error adding review:', e);
      return false;
    }
  };

  const getReviews = async (targetUserId: string): Promise<Review[]> => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('target_user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const reviewerIds = Array.from(new Set(data.map(r => r.reviewer_id)));

        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, business_name, avatar_url')
          .in('id', reviewerIds);

        const profileMap: Record<string, { business_name?: string; avatar_url?: string }> = {};
        (profileData || []).forEach(p => { profileMap[p.id] = p; });

        // Fallback to posts table
        const missingIds = reviewerIds.filter(uid => !profileMap[uid]?.business_name);
        if (missingIds.length > 0) {
          const { data: postData } = await supabase
            .from('posts')
            .select('user_id, business_name, avatar_url')
            .in('user_id', missingIds);
          (postData || []).forEach(p => {
            if (!profileMap[p.user_id]?.business_name) {
              profileMap[p.user_id] = { business_name: p.business_name, avatar_url: p.avatar_url };
            }
          });
        }

        // Final fallback: current user's auth metadata
        const stillMissing2 = reviewerIds.filter(uid => !profileMap[uid]?.business_name);
        if (user && stillMissing2.includes(user.id)) {
          profileMap[user.id] = {
            business_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Alguien',
            avatar_url: user.user_metadata?.avatar_url || profileMap[user.id]?.avatar_url
          };
        }

        return data.map(r => ({
          ...r,
          reviewer_name: profileMap[r.reviewer_id]?.business_name || 'Alguien',
          reviewer_avatar: profileMap[r.reviewer_id]?.avatar_url
        }));
      }

      return data || [];
    } catch (e) {
      console.error('Error fetching reviews:', e);
      return [];
    }
  };

  return (
    <FeedContext.Provider value={{ 
      posts, savedPostIds, likedPostIds, addPost, deletePost, updatePost, toggleLike, toggleSave, sharePost, addComment, deleteComment, getComments, addReview, getReviews, loading 
    }}>
      {children}
    </FeedContext.Provider>
  );
};

export const useFeedContext = () => {
  const context = useContext(FeedContext);
  if (context === undefined) throw new Error('useFeedContext must be used within a FeedProvider');
  return context;
};
