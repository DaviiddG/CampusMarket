import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatMessages, useChats } from '@/hooks/useChat';
import { useAuthContext } from '@/contexts/AuthContext';
import { ArrowLeft, Send, ChevronDown, Trash2, X, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface ChatDetailInnerProps {
  chatId: string;
}

export default function ChatDetailInner({ chatId }: ChatDetailInnerProps) {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { messages, loading, sendMessage, deleteMessages } = useChatMessages(chatId);
  const { chats } = useChats();
  
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [menuMsgId, setMenuMsgId] = useState<string | null>(null);
  const [isDeletingMessages, setIsDeletingMessages] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [localOtherUser, setLocalOtherUser] = useState<{ id: string; full_name: string; avatar_url: string } | null>(null);

  // Find the current chat details from the chats hook
  const currentChat = chats.find(c => c.id === chatId);
  const otherUser = currentChat?.other_user || localOtherUser;

  // Fallback fetch if chat is new and not in the `chats` list yet (e.g. no messages sent yet)
  useEffect(() => {
    if (!currentChat && chatId && user) {
      const fetchChatDetails = async () => {
        const { data: chatData } = await supabase
          .from('chats')
          .select('participant1_id, participant2_id')
          .eq('id', chatId)
          .single();
          
        if (chatData) {
          const otherId = chatData.participant1_id === user.id ? chatData.participant2_id : chatData.participant1_id;
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', otherId)
            .single();
            
          if (profileData) {
            setLocalOtherUser(profileData);
          }
        }
      };
      fetchChatDetails();
    }
  }, [chatId, currentChat, user]);

  const scrollToBottom = () => {
    if (selectedMessageIds.length === 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleSelect = (msgId: string) => {
    setSelectedMessageIds(prev => 
      prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId]
    );
    setMenuMsgId(null);
  };

  const isSelectMode = selectedMessageIds.length > 0;

  const allSelectedSentByMe = selectedMessageIds.every(id => {
    const msg = messages.find(m => m.id === id);
    return msg?.sender_id === user?.id;
  });

  const handleBulkDelete = async (type: 'FOR_ME' | 'FOR_EVERYONE') => {
    if (isDeletingMessages) return;
    setIsDeletingMessages(true);
    const success = await deleteMessages(selectedMessageIds, type);
    if (success) {
      setSelectedMessageIds([]);
    }
    setIsDeletingMessages(false);
    setShowDeleteConfirm(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
    }
    setIsSending(false);
  };

  return (
    <div className="flex flex-col h-[100dvh] lg:h-full w-full bg-white lg:bg-transparent relative">
      {/* Header */}
      <div className={cn(
        "sticky top-0 z-30 px-4 py-3 flex items-center gap-3 shadow-sm transition-colors",
        isSelectMode ? "bg-primary text-white" : "bg-white border-b border-gray-100 lg:bg-[#F0F2F5]"
      )}>
        {isSelectMode ? (
          // SELECTION MODE HEADER
          <div className="flex items-center justify-between w-full h-10">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedMessageIds([])} 
                className="p-2 hover:bg-white/20 rounded-full"
              >
                <X size={20} />
              </button>
              <span className="font-poppins font-bold text-[16px]">
                {selectedMessageIds.length} seleccionados
              </span>
            </div>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 hover:bg-white/20 rounded-full flex items-center gap-2 transition-colors"
              title="Eliminar seleccionados"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ) : (
          // STANDARD HEADER
          <>
            <button 
              onClick={() => navigate('/chats')} 
              className="p-2 -ml-2 rounded-full hover:bg-gray-200 lg:hidden"
            >
              <ArrowLeft size={24} className="text-black" />
            </button>
            {otherUser ? (
              <div 
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => navigate(`/user/${otherUser.id}`)}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
                  <img 
                    src={otherUser.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0UyRThGMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjOTRBM0I4Ii8+PHBhdGggZD0iTTIwIDEwMGEzMCAzMCAwIDAgMSA2MCAwIiBmaWxsPSIjOTRBM0I4Ii8+PC9zdmc+'} 
                    alt={otherUser.full_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-poppins font-bold text-[15px] text-black truncate">
                    {otherUser.full_name}
                  </h2>
                  <p className="text-[12px] font-roboto text-gray-500 truncate lg:hidden">
                    Toca para ver el perfil
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <h2 className="font-poppins font-bold text-[15px] text-black">Cargando...</h2>
              </div>
            )}
          </>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
        {loading && messages.length === 0 ? (
          <div className="flex justify-center items-center flex-1">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center flex-1">
            <div className="bg-yellow-50 text-yellow-800 text-[13px] font-roboto py-2 px-4 rounded-xl text-center shadow-sm max-w-sm">
              <p>Este es el comienzo de tu conversación.</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isMe = message.sender_id === user?.id;
            const showTime = index === 0 || 
              new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 1000 * 60 * 5; 

            return (
              <div key={message.id} className="flex flex-col">
                {showTime && (
                  <span className="bg-white/50 backdrop-blur-sm self-center text-[11px] font-roboto text-gray-500 py-1 px-3 rounded-full text-center my-2 uppercase tracking-wider shadow-sm">
                    {format(new Date(message.created_at), 'h:mm a')}
                  </span>
                )}
                
                <div 
                  className={cn(
                    "flex items-center gap-3 w-full group/row relative py-0.5",
                    isSelectMode && "cursor-pointer px-2 rounded-lg hover:bg-primary/5 transition-colors",
                    selectedMessageIds.includes(message.id) && "bg-primary/10"
                  )}
                  onClick={() => {
                    if (isSelectMode) {
                      toggleSelect(message.id);
                    }
                  }}
                >
                  {/* Multi-select checkbox */}
                  {isSelectMode && (
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                      <input 
                        type="checkbox"
                        checked={selectedMessageIds.includes(message.id)}
                        readOnly
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                      />
                    </div>
                  )}

                  <div className={cn(
                    "flex flex-col flex-1",
                    isMe ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2.5 break-words relative shadow-sm group/bubble transition-all duration-200",
                      isMe 
                        ? "bg-[#D9FDD3] text-black rounded-tr-sm" 
                        : "bg-white text-black rounded-tl-sm",
                      message.is_deleted_for_everyone && "bg-gray-100 text-gray-400 italic shadow-none border border-gray-200 bg-opacity-50 rounded-tl-sm rounded-tr-sm !self-start"
                    )}>
                      {/* Dropdown Trigger Icon */}
                      {!message.is_deleted_for_everyone && !isSelectMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuMsgId(menuMsgId === message.id ? null : message.id);
                          }}
                          className="opacity-0 group-hover/bubble:opacity-100 transition-opacity absolute right-1.5 top-1.5 text-gray-400 hover:text-gray-600 p-0.5 rounded-full bg-white/80 z-10"
                        >
                          <ChevronDown size={16} />
                        </button>
                      )}

                      {/* Dropdown Menu */}
                      {menuMsgId === message.id && (
                        <div className={cn(
                          "absolute top-7 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20 font-roboto text-xs text-gray-700 overflow-hidden",
                          isMe ? "right-1" : "left-1"
                        )}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelect(message.id);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                          >
                            Seleccionar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMessageIds([message.id]);
                              setShowDeleteConfirm(true);
                              setMenuMsgId(null);
                            }}
                            className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors font-bold"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}

                      {message.is_deleted_for_everyone ? (
                        <div className="flex items-center gap-1.5">
                          <Ban size={14} />
                          <span className="font-roboto text-[14px] leading-relaxed">
                            Este mensaje fue eliminado
                          </span>
                        </div>
                      ) : (
                        <p className="font-roboto text-[14px] leading-relaxed">
                          {message.content}
                        </p>
                      )}

                      <span className="text-[10px] text-gray-400 float-right mt-1 ml-3 relative top-0.5 select-none">
                        {format(new Date(message.created_at), 'HH:mm')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Area */}
      <div className="bg-[#F0F2F5] border-t border-gray-200 p-3 flex items-end gap-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
        <form onSubmit={handleSend} className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="w-full bg-white border-transparent rounded-2xl pl-4 pr-12 py-3 text-[14px] font-roboto resize-none focus:ring-0 focus:outline-none transition-all max-h-[120px] min-h-[44px] shadow-sm"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="w-11 h-11 flex items-center justify-center bg-transparent text-primary rounded-full flex-shrink-0 disabled:opacity-50 transition-colors hover:bg-gray-200"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <Send size={22} className="ml-1" />
            )}
          </button>
        </form>
      </div>

      {/* BackDrop click handler for closing dropdown menus */}
      {menuMsgId && (
        <div 
          className="fixed inset-0 z-10 bg-transparent"
          onClick={() => setMenuMsgId(null)}
        />
      )}

      {/* DELETE MESSAGES MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden p-6">
            <h3 className="font-poppins font-bold text-[17px] text-gray-800 mb-2">
              ¿Deseas eliminar el mensaje?
            </h3>
            <p className="font-roboto text-[13px] text-gray-500 mb-5">
              {selectedMessageIds.length > 1 
                ? `Estás por eliminar ${selectedMessageIds.length} mensajes seleccionados.` 
                : 'Este mensaje se ocultará o se eliminará para todos los participantes.'
              }
            </p>

            <div className="flex flex-col gap-2 text-[14px] font-roboto font-semibold">
              {allSelectedSentByMe && (
                <button
                  onClick={() => handleBulkDelete('FOR_EVERYONE')}
                  disabled={isDeletingMessages}
                  className="w-full py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl border border-red-200 flex justify-center items-center"
                >
                  {isDeletingMessages ? (
                    <div className="w-5 h-5 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
                  ) : (
                    'Eliminar para todos'
                  )}
                </button>
              )}
              
              <button
                onClick={() => handleBulkDelete('FOR_ME')}
                disabled={isDeletingMessages}
                className="w-full py-3 text-red-600 bg-white hover:bg-gray-50 rounded-xl flex justify-center items-center"
              >
                Eliminar para mí
              </button>

              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedMessageIds([]); // Clear selection on cancel
                }}
                disabled={isDeletingMessages}
                className="w-full py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
