import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';

export interface Chat {
  id: string;
  participant1_id: string;
  participant2_id: string;
  created_at: string;
  updated_at: string;
  last_message: string;
  deleted_by_participant1?: boolean;
  deleted_by_participant2?: boolean;
  other_user?: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
  deleted_by_sender?: boolean;
  deleted_by_receiver?: boolean;
  is_deleted_for_everyone?: boolean;
}

export function useChats() {
  const { user } = useAuthContext();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch chats where the user is either participant 1 or 2 AND a message has been sent
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .not('last_message', 'is', null)
        .order('updated_at', { ascending: false });

      if (chatsError) throw chatsError;

      if (!chatsData || chatsData.length === 0) {
        setChats([]);
        return;
      }

      // Filter out chats that are deleted by the current user
      const activeChats = chatsData.filter(chat => {
        const isParticipant1 = chat.participant1_id === user.id;
        return isParticipant1 ? !chat.deleted_by_participant1 : !chat.deleted_by_participant2;
      });

      if (activeChats.length === 0) {
        setChats([]);
        return;
      }

      // Fetch other participant's profile
      const otherUserIds = activeChats.map(c => 
        c.participant1_id === user.id ? c.participant2_id : c.participant1_id
      );

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', otherUserIds);

      const enrichedChats = activeChats.map(chat => {
        const otherUserId = chat.participant1_id === user.id ? chat.participant2_id : chat.participant1_id;
        return {
          ...chat,
          other_user: profilesData?.find(p => p.id === otherUserId) || {
            id: otherUserId,
            full_name: 'Usuario',
            avatar_url: ''
          }
        };
      });

      setChats(enrichedChats);
    } catch (e) {
      console.error('Error fetching chats:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchChats();

    if (!user) return;

    // Realtime subscription for chats update
    const channel = supabase.channel(`public:chats:user_${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chats',
        filter: `participant1_id=eq.${user.id}`
      }, () => {
        fetchChats();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chats',
        filter: `participant2_id=eq.${user.id}`
      }, () => {
        fetchChats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchChats]);

  const deleteChat = async (chatId: string) => {
    if (!user) return false;
    try {
      const { data: chatData } = await supabase
        .from('chats')
        .select('participant1_id')
        .eq('id', chatId)
        .single();
      
      if (!chatData) return false;
      
      const isParticipant1 = chatData.participant1_id === user.id;
      const updateObj = isParticipant1 
        ? { deleted_by_participant1: true } 
        : { deleted_by_participant2: true };
        
      const { error } = await supabase
        .from('chats')
        .update(updateObj)
        .eq('id', chatId);
        
      if (error) throw error;
      
      // Also mask existing messages as deleted FOR ME
      await supabase
        .from('messages')
        .update({ deleted_by_sender: true })
        .eq('chat_id', chatId)
        .eq('sender_id', user.id);
        
      await supabase
        .from('messages')
        .update({ deleted_by_receiver: true })
        .eq('chat_id', chatId)
        .neq('sender_id', user.id);
        
      fetchChats();
      return true;
    } catch (e) {
      console.error('Error deleting chat:', e);
      return false;
    }
  };

  return { chats, loading, fetchChats, deleteChat };
}

export function useStartChat() {
  const { user } = useAuthContext();
  const [starting, setStarting] = useState(false);

  // Create or get chat with another user
  const getOrCreateChat = async (otherUserId: string) => {
    if (!user) return null;
    
    setStarting(true);
    try {
      // Check if chat exists
      const { data: existingChats, error: searchError } = await supabase
        .from('chats')
        .select('id')
        .or(`and(participant1_id.eq.${user.id},participant2_id.eq.${otherUserId}),and(participant1_id.eq.${otherUserId},participant2_id.eq.${user.id})`);

      if (searchError) throw searchError;

      if (existingChats && existingChats.length > 0) {
        return existingChats[0].id;
      }

      // Create new chat
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert({
          participant1_id: user.id,
          participant2_id: otherUserId
        })
        .select('id')
        .single();

      if (createError) throw createError;
      return newChat.id;
    } catch (e) {
      console.error('Error finding or creating chat:', e);
      return null;
    } finally {
      setStarting(false);
    }
  };

  return { getOrCreateChat, starting };
}

export function useChatMessages(chatId: string | undefined) {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId || !user) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        // Filter out messages deleted by the current user
        const filteredMessages = (data || []).filter((m: Message) => {
          const isMe = m.sender_id === user.id;
          return isMe ? !m.deleted_by_sender : !m.deleted_by_receiver;
        });

        setMessages(filteredMessages);
        
        // Mark as read (optimistic)
        const unreadMessages = filteredMessages.filter(m => m.sender_id !== user.id && !m.read);
        if (unreadMessages.length > 0) {
          supabase
            .from('messages')
            .update({ read: true })
            .in('id', unreadMessages.map(m => m.id))
            .then();
        }

      } catch (e) {
        console.error('Error fetching messages:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase.channel(`public:messages:${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        const newMessage = payload.new as Message;
        setMessages(prev => [...prev, newMessage]);
        
        // If someone else sent it, mark it as read when we receive it (since we are on the page)
        if (newMessage.sender_id !== user.id) {
          supabase
            .from('messages')
            .update({ read: true })
            .eq('id', newMessage.id)
            .then();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, user]);

  const sendMessage = async (content: string) => {
    if (!chatId || !user || !content.trim()) return false;
    
    // Optimistic UI update could be added here, but we'll let realtime handle it
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: content.trim()
        });
        
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error sending message:', e);
      return false;
    }
  };

  const deleteMessages = async (messageIds: string[], type: 'FOR_ME' | 'FOR_EVERYONE') => {
    if (!chatId || !user || messageIds.length === 0) return false;
    
    try {
      if (type === 'FOR_EVERYONE') {
        const { error } = await supabase
          .from('messages')
          .update({ is_deleted_for_everyone: true })
          .in('id', messageIds)
          .eq('sender_id', user.id);
          
        if (error) throw error;
      } else {
        // For messages I sent
        await supabase
          .from('messages')
          .update({ deleted_by_sender: true })
          .in('id', messageIds)
          .eq('sender_id', user.id);
          
        // For messages they sent
        await supabase
          .from('messages')
          .update({ deleted_by_receiver: true })
          .in('id', messageIds)
          .neq('sender_id', user.id);
      }

      // Optimistically update UI
      setMessages(prev => {
        if (type === 'FOR_EVERYONE') {
          return prev.map(m => 
            messageIds.includes(m.id) && m.sender_id === user.id
              ? { ...m, is_deleted_for_everyone: true }
              : m
          );
        } else {
          return prev.filter(m => !messageIds.includes(m.id));
        }
      });
      
      return true;
    } catch (e) {
      console.error('Error deleting messages:', e);
      return false;
    }
  };

  return { messages, loading, sendMessage, deleteMessages };
}
