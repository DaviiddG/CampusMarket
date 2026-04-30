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
  image_url?: string;
  target_name?: string;
  target_avatar?: string;
}

export interface Post {
  id: string;
  user_id: string;
  businessName: string;
  avatarUrl: string;
  imageUrl: string;
  price: string;
  description: string;
  category?: string;
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
  addReview: (targetUserId: string, rating: number, content: string, imageUrl?: string) => Promise<boolean>;
  getReviews: (targetUserId: string) => Promise<Review[]>;
  getReviewsGiven: (reviewerId: string) => Promise<Review[]>;
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
          const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0UyRThGMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjOTRBM0I4Ii8+PHBhdGggZD0iTTIwIDEwMGEzMCAzMCAwIDAgMSA2MCAwIiBmaWxsPSIjOTRBM0I4Ii8+PC9zdmc+';
          const newPost: Post = {
            id: newPostRaw.id,
            user_id: newPostRaw.user_id,
            businessName: newPostRaw.business_name,
            avatarUrl: newPostRaw.avatar_url || DEFAULT_AVATAR,
            imageUrl: newPostRaw.image_url,
            price: newPostRaw.price,
            description: newPostRaw.description,
            category: newPostRaw.category,
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

      const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0UyRThGMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjOTRBM0I4Ii8+PHBhdGggZD0iTTIwIDEwMGEzMCAzMCAwIDAgMSA2MCAwIiBmaWxsPSIjOTRBM0I4Ii8+PC9zdmc+';

      const activePosts: Post[] = (postsData || []).map(p => ({
        id: p.id,
        user_id: p.user_id,
        businessName: p.business_name,
        avatarUrl: p.avatar_url || DEFAULT_AVATAR,
        imageUrl: p.image_url,
        price: p.price,
        description: p.description,
        category: p.category,
        likes: 0
      }));

      // Enrich post avatars from profiles table (fresher source)
      const uniqueUserIds = Array.from(new Set(activePosts.map(p => p.user_id)));
      const profileMap: Record<string, { avatar_url?: string; business_name?: string }> = {};

      if (uniqueUserIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, avatar_url, business_name')
          .in('id', uniqueUserIds);

        if (profileData) {
          profileData.forEach(p => { 
            if (p.id) profileMap[p.id.toLowerCase()] = p; 
          });
        }
      }

      // ALWAYS run enrichment loop to ensure fallbacks and valid local metadata
      activePosts.forEach(post => {
        const normalizedId = post.user_id?.toLowerCase() || '';
        const profile = profileMap[normalizedId];
        
        // Priority 1: Profiles table data (source of truth)
        if (profile) {
          post.avatarUrl = profile.avatar_url || DEFAULT_AVATAR;
          if (profile.business_name) post.businessName = profile.business_name;
        } else if (user && normalizedId === user.id.toLowerCase()) {
          // Fallback to local session only if profiles table data is missing
          const metaAvatar = user.user_metadata?.avatar_url;
          const metaName = user.user_metadata?.full_name || user.email?.split('@')[0];
          post.avatarUrl = metaAvatar || DEFAULT_AVATAR;
          if (metaName) post.businessName = metaName;
        }

        // Priority 3: Maintain fallback for unknown users if DiceBear sneaks in
        if (!post.avatarUrl || post.avatarUrl.includes('dicebear')) {
          post.avatarUrl = DEFAULT_AVATAR;
        }
      });

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
          actor_avatar: user?.user_metadata?.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0UyRThGMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjOTRBM0I4Ii8+PHBhdGggZD0iTTIwIDEwMGEzMCAzMCAwIDAgMSA2MCAwIiBmaWxsPSIjOTRBM0I4Ii8+PC9zdmc+',
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
      // With ON DELETE CASCADE set up in Supabase, we only need to delete the post.
      // The database will automatically clean up likes, comments, notifications, etc.
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Database error deleting post:', error.message, error.details);
        throw error;
      }
      
      setPosts(prev => prev.filter(p => p.id !== postId));
      return true;
    } catch (error) {
      console.error('Error in deletePost flow:', error);
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
        actor_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario',
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

        // Fallback: check posts table for users not found or with empty names in profiles
        const missingIds = userIds.filter(uid => !profileMap[uid]?.business_name || profileMap[uid]?.business_name.trim() === '');
        if (missingIds.length > 0) {
          const { data: postData } = await supabase
            .from('posts')
            .select('user_id, business_name, avatar_url')
            .in('user_id', missingIds);

          (postData || []).forEach(p => {
            if (!profileMap[p.user_id]?.business_name || (profileMap[p.user_id]?.business_name?.trim() ?? '') === '') {
              profileMap[p.user_id] = { business_name: p.business_name, avatar_url: p.avatar_url };
            }
          });
        }

        // Fallback 3: check notifications table (acts as a name history)
        const stillMissing2 = userIds.filter(uid => !profileMap[uid]?.business_name || (profileMap[uid]?.business_name?.trim() ?? '') === '' || profileMap[uid]?.business_name === 'Usuario');
        if (stillMissing2.length > 0) {
          const { data: notifData } = await supabase
            .from('notifications')
            .select('actor_id, actor_name')
            .in('actor_id', stillMissing2)
            .order('created_at', { ascending: false });

          (notifData || []).forEach(n => {
            if (!profileMap[n.actor_id]?.business_name || profileMap[n.actor_id]?.business_name === 'Usuario') {
              profileMap[n.actor_id] = { ...profileMap[n.actor_id], business_name: n.actor_name };
            }
          });
        }

        // Final fallback: use current user's auth metadata if this is the logged-in user
        const stillMissing3 = userIds.filter(uid => !profileMap[uid]?.business_name || (profileMap[uid]?.business_name?.trim() ?? '') === '' || profileMap[uid]?.business_name === 'Usuario');
        if (user && stillMissing3.includes(user.id)) {
          profileMap[user.id] = {
            business_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
            avatar_url: user.user_metadata?.avatar_url || profileMap[user.id]?.avatar_url
          };
        }

        return data.map(c => {
          const name = profileMap[c.user_id]?.business_name?.trim();
          const finalName = name && name !== '' && name !== 'Usuario' ? name : 'Usuario';
          return {
            ...c,
            user_name: finalName,
            user_avatar: profileMap[c.user_id]?.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0UyRThGMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjOTRBM0I4Ii8+PHBhdGggZD0iTTIwIDEwMGEzMCAzMCAwIDAgMSA2MCAwIiBmaWxsPSIjOTRBM0I4Ii8+PC9zdmc+'
          };
        });
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
          actor_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario',
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

  const addReview = async (targetUserId: string, rating: number, content: string, imageUrl?: string) => {
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
        content,
        image_url: imageUrl
      });

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: targetUserId,
        actor_id: user.id,
        actor_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario',
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

        // Fallback to posts table for missing or empty names
        const missingIds = reviewerIds.filter(uid => !profileMap[uid]?.business_name || (profileMap[uid]?.business_name?.trim() ?? '') === '');
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

        // Fallback 3: check notifications table (acts as a name history)
        const stillMissing2 = reviewerIds.filter(uid => !profileMap[uid]?.business_name || (profileMap[uid]?.business_name?.trim() ?? '') === '' || profileMap[uid]?.business_name === 'Usuario');
        if (stillMissing2.length > 0) {
          const { data: notifData } = await supabase
            .from('notifications')
            .select('actor_id, actor_name')
            .in('actor_id', stillMissing2)
            .order('created_at', { ascending: false });

          (notifData || []).forEach(n => {
            if (!profileMap[n.actor_id]?.business_name || profileMap[n.actor_id]?.business_name === 'Usuario') {
              profileMap[n.actor_id] = { ...profileMap[n.actor_id], business_name: n.actor_name };
            }
          });
        }

        // Final fallback: current user's auth metadata
        const stillMissing3 = reviewerIds.filter(uid => !profileMap[uid]?.business_name || (profileMap[uid]?.business_name?.trim() ?? '') === '' || profileMap[uid]?.business_name === 'Usuario');
        if (user && stillMissing3.includes(user.id)) {
          profileMap[user.id] = {
            business_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
            avatar_url: user.user_metadata?.avatar_url || profileMap[user.id]?.avatar_url
          };
        }

        return data.map(r => {
          const name = profileMap[r.reviewer_id]?.business_name?.trim();
          const finalName = name && name !== '' && name !== 'Usuario' ? name : 'Usuario';
          return {
            ...r,
            reviewer_name: finalName,
            reviewer_avatar: profileMap[r.reviewer_id]?.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0UyRThGMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjOTRBM0I4Ii8+PHBhdGggZD0iTTIwIDEwMGEzMCAzMCAwIDAgMSA2MCAwIiBmaWxsPSIjOTRBM0I4Ii8+PC9zdmc+'
          };
        });
      }

      return data || [];
    } catch (e) {
      console.error('Error fetching reviews:', e);
      return [];
    }
  };

  const getReviewsGiven = async (reviewerId: string): Promise<Review[]> => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewer_id', reviewerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch target profiles to get name + avatar of the businesses reviewed
      const targetIds = Array.from(new Set(data.map(r => r.target_user_id)));
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, business_name, avatar_url')
        .in('id', targetIds);

      const profileMap: Record<string, { business_name?: string; avatar_url?: string }> = {};
      (profileData || []).forEach(p => { profileMap[p.id] = p; });

      // Also check posts table as a fallback for target names
      const missingTargets = targetIds.filter(id => !profileMap[id]?.business_name);
      if (missingTargets.length > 0) {
        const { data: postData } = await supabase
          .from('posts')
          .select('user_id, business_name, avatar_url')
          .in('user_id', missingTargets);
        (postData || []).forEach(p => {
          if (!profileMap[p.user_id]) profileMap[p.user_id] = { business_name: p.business_name, avatar_url: p.avatar_url };
        });
      }

      return data.map(r => ({
        ...r,
        target_name: profileMap[r.target_user_id]?.business_name || 'Negocio',
        target_avatar: profileMap[r.target_user_id]?.avatar_url || null,
      }));
    } catch (e) {
      console.error('Error fetching given reviews:', e);
      return [];
    }
  };

  return (
    <FeedContext.Provider value={{ 
      posts, savedPostIds, likedPostIds, addPost, deletePost, updatePost, toggleLike, toggleSave, sharePost, addComment, deleteComment, getComments, addReview, getReviews, getReviewsGiven, loading 
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
