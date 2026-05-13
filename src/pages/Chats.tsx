import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MobileContainer from '@/components/layout/MobileContainer';
import BottomNav from '@/components/layout/BottomNav';
import { useChats } from '@/hooks/useChat';
import { ArrowLeft, MessageSquare, Search, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import ChatDetailInner from '@/components/chat/ChatDetailInner';
import { cn } from '@/lib/utils';

export default function Chats() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { chats, loading, deleteChat } = useChats();
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Save last opened chat
  useEffect(() => {
    if (chatId) {
      localStorage.setItem('lastChatId', chatId);
    }
  }, [chatId]);

  // Restore last chat on initial load if we don't have a chatId in URL
  useEffect(() => {
    if (!chatId) {
      const lastChatId = localStorage.getItem('lastChatId');
      if (lastChatId) {
        // Redirect to the last chat, but use replace so back button works correctly
        navigate(`/chat/${lastChatId}`, { replace: true });
      }
    }
  }, []); // Run only on mount

  const filteredChats = chats.filter(chat => 
    chat.other_user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteChat = async () => {
    if (!deletingChatId) return;
    setIsDeleting(true);
    const success = await deleteChat(deletingChatId);
    if (success) {
      // If the deleted chat was the one open, deselect it
      if (chatId === deletingChatId) {
        localStorage.removeItem('lastChatId');
        navigate('/chats');
      }
    }
    setIsDeleting(false);
    setDeletingChatId(null);
  };

  return (
    <MobileContainer fullWidthLayout className="bg-white lg:bg-[#F0F2F5]" hideRightSidebar={true}>
      <div className="w-full flex flex-row h-[100dvh] lg:h-screen lg:pt-0 pb-[61px] lg:pb-0 overflow-hidden">
        
        {/* LEFT COLUMN: CHAT LIST */}
        <div className={cn(
          "flex-col w-full lg:w-[350px] xl:w-[400px] flex-shrink-0 bg-white border-r border-gray-200 h-full",
          chatId ? "hidden lg:flex" : "flex"
        )}>
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white px-4 py-3 flex items-center justify-between shadow-sm lg:shadow-none lg:border-b lg:border-gray-100">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/home')} 
                className="p-2 -ml-2 rounded-full hover:bg-gray-100 lg:hidden"
              >
                <ArrowLeft size={24} className="text-black" />
              </button>
              <h1 className="font-poppins font-bold text-xl text-black">Mensajes</h1>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar mensajes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-xl text-[14px] focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-roboto"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4 text-gray-500">
                <MessageSquare size={48} className="mb-4 text-gray-300" strokeWidth={1.5} />
                <p className="font-roboto font-medium text-black">No tienes mensajes</p>
                <p className="font-roboto text-sm mt-1">
                  {searchQuery ? 'No se encontraron conversaciones.' : 'Envía un mensaje a un negocio para comenzar a chatear.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => navigate(`/chat/${chat.id}`)}
                    className={cn(
                      "group w-full flex items-center gap-3 p-4 transition-colors text-left relative cursor-pointer",
                      chatId === chat.id ? "bg-gray-100" : "hover:bg-gray-50"
                    )}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
                      <img 
                        src={chat.other_user?.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0UyRThGMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjOTRBM0I4Ii8+PHBhdGggZD0iTTIwIDEwMGEzMCAzMCAwIDAgMSA2MCAwIiBmaWxsPSIjOTRBM0I4Ii8+PC9zdmc+'} 
                        alt={chat.other_user?.full_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-poppins font-medium text-[15px] text-black truncate pr-2">
                          {chat.other_user?.full_name || 'Usuario'}
                        </h3>
                        <span className="text-[12px] font-roboto text-gray-400 flex-shrink-0">
                          {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                      <p className="text-[13px] font-roboto text-gray-500 truncate">
                        {chat.last_message || 'Inicia una conversación...'}
                      </p>
                    </div>

                    {/* Hover delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingChatId(chat.id);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                      title="Eliminar Chat"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CHAT DETAIL */}
        <div className={cn(
          "flex-1 flex-col h-full bg-[#EFEAE2] relative",
          !chatId ? "hidden lg:flex" : "flex"
        )}>
          {/* Subtle WhatsApp-like background pattern layer */}
          <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>

          {chatId ? (
            <div className="relative z-10 w-full h-full">
              <ChatDetailInner chatId={chatId} />
            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                <MessageSquare size={40} className="text-gray-400" />
              </div>
              <h2 className="text-2xl font-poppins font-light text-gray-700 mb-2">CampusMarket Web</h2>
              <p className="text-gray-500 font-roboto max-w-sm">Envía y recibe mensajes sin tener que mantener tu teléfono conectado.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Show BottomNav only on mobile and only if we are in the list view (no chat selected) */}
      <div className={cn(
        "lg:hidden",
        chatId ? "hidden" : "block"
      )}>
        <BottomNav />
      </div>

      {/* Confirmation Modal for deleting chat */}
      {deletingChatId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col items-center p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="font-poppins font-bold text-lg text-gray-900 mb-1">¿Eliminar chat?</h3>
            <p className="font-roboto text-sm text-gray-500 mb-6">Esta acción borrará el historial de conversación en tu bandeja de entrada.</p>
            <div className="w-full flex flex-col gap-2">
              <button
                onClick={handleDeleteChat}
                disabled={isDeleting}
                className="w-full py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-xl font-roboto font-bold transition-colors flex justify-center items-center"
              >
                {isDeleting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Eliminar para mí'
                )}
              </button>
              <button
                onClick={() => setDeletingChatId(null)}
                disabled={isDeleting}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-roboto font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileContainer>
  );
}
