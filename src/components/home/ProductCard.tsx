import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFeedContext, type Comment } from '@/contexts/FeedContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

interface ProductCardProps {
  id: string; 
  businessName: string;
  avatarUrl: string;
  imageUrl: string;
  price: string;
  description: string;
  likes: number; 
  user_id: string; 
  onDelete?: () => void;
}

export default function ProductCard({
  id,
  businessName,
  avatarUrl,
  imageUrl,
  price,
  description,
  likes,
  user_id: postOwnerId,
  onDelete
}: ProductCardProps) {
  const { user } = useAuthContext();
  const { likedPostIds, savedPostIds, toggleLike, toggleSave, deletePost, updatePost, addComment, deleteComment, getComments, sharePost } = useFeedContext();
  const isLiked = likedPostIds.includes(id);
  const isSaved = savedPostIds.includes(id);
  
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit state
  const [editPrice, setEditPrice] = useState(price);
  const [editDescription, setEditDescription] = useState(description);

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  const isOwner = user?.id === postOwnerId;

  const handleLike = () => toggleLike(id);
  const handleSave = () => toggleSave(id);

  const handleDoubleClick = () => {
    if (!isLiked) {
      toggleLike(id);
    }
    setShowHeartOverlay(true);
    setTimeout(() => setShowHeartOverlay(false), 800);
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    const success = await updatePost(id, {
      price: editPrice,
      description: editDescription
    });
    if (success) {
      setShowEditModal(false);
    }
    setIsUpdating(false);
  };

  const handleShare = async () => {
    // Try native share or clipboard copy first
    const shareUrl = `${window.location.origin}/post/${id}`;
    let shared = false;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${businessName} en CampusMarket`,
          text: description,
          url: shareUrl
        });
        shared = true;
      } catch {
        // User cancelled or error — don't send notification
        shared = false;
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        shared = true;
      } catch {
        shared = false;
      }
    }

    // Only send notification if sharing actually happened
    if (shared) {
      await sharePost(id);
    }
  };

  // Fetch comments when the section is toggled open
  useEffect(() => {
    if (showComments) {
      fetchCommentsForPost();
    }
  }, [showComments]);

  const fetchCommentsForPost = async () => {
    setLoadingComments(true);
    const data = await getComments(id);
    setComments(data);
    setLoadingComments(false);
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setSendingComment(true);
    const success = await addComment(id, commentText);
    if (success) {
      setCommentText('');
      await fetchCommentsForPost();
    }
    setSendingComment(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    const success = await deleteComment(commentId);
    if (success) {
      setComments(prev => prev.filter(c => c.id !== commentId));
    }
  };

  return (
    <div className="w-full bg-white mb-6">
      <div className="flex items-center px-4 py-3 gap-3">
        <Link 
          to={isOwner ? "/profile" : `/user/${postOwnerId}`}
          className="w-[38px] h-[38px] rounded-full overflow-hidden border border-gray-100 shadow-sm flex-shrink-0"
        >
          <img 
            src={avatarUrl} 
            alt={businessName} 
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'; }}
          />
        </Link>
        <Link 
          to={isOwner ? "/profile" : `/user/${postOwnerId}`}
          className="font-roboto font-medium text-[14px] text-black flex-1 hover:underline underline-offset-2"
        >
          {businessName}
        </Link>
        
        {isOwner && (
          <div className="relative">
            <button 
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreVertical size={20} className="text-gray-500" />
            </button>

            <AnimatePresence>
              {showOptionsMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setShowOptionsMenu(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-40 overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        setShowOptionsMenu(false);
                        setShowEditModal(true);
                      }}
                      className="w-full px-4 py-3 text-left text-gray-700 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50"
                    >
                      <Edit2 size={18} />
                      <span className="font-roboto font-medium text-[14px]">Editar publicación</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowOptionsMenu(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full px-4 py-3 text-left text-red-600 flex items-center gap-3 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={18} />
                      <span className="font-roboto font-medium text-[14px]">Eliminar publicación</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Main Image */}
      <div className="w-full aspect-[4/5] md:aspect-square overflow-hidden bg-gray-50 border-y border-gray-100 relative flex items-center justify-center">
        <img 
          src={imageUrl} 
          alt={description} 
          className="w-full h-full object-cover select-none"
          onDoubleClick={handleDoubleClick}
        />
        {/* Animated Double-tap Heart */}
        <AnimatePresence>
          {showHeartOverlay && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="absolute pointer-events-none"
            >
              <Heart className="w-24 h-24 fill-white text-white drop-shadow-md" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Interactions */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLike} 
            className="transition-transform relative"
          >
            <Heart 
              size={24} 
              className={cn("transition-colors duration-300", isLiked ? "fill-red-500 text-red-500" : "text-black")} 
            />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }} 
            whileTap={{ scale: 0.95 }} 
            className={cn("transition-colors", showComments ? "text-primary" : "text-black")}
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle size={24} strokeWidth={2} />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }} 
            whileTap={{ scale: 0.95 }} 
            className="text-black"
            onClick={handleShare}
          >
            <Send size={24} strokeWidth={2} />
          </motion.button>
        </div>
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSave}
          className="transition-transform relative"
        >
          <Bookmark 
            size={24} 
            className={cn("transition-colors duration-300", isSaved ? "fill-black text-black" : "text-black")} 
          />
        </motion.button>
      </div>

      {/* Info */}
      <div className="px-4 pb-2">
        <p className="font-roboto font-light text-[14px] text-black mb-1">
          {likes > 0 ? (
            <>{likes.toLocaleString('es-CO')} Me gusta</>
          ) : (
            <>Sé el primero en dar me gusta</>
          )}
        </p>
        <div className="font-roboto text-[14px] leading-[18px]">
          <Link 
            to={isOwner ? "/profile" : `/user/${postOwnerId}`}
            className="font-medium mr-1 hover:underline"
          >
            {businessName}
          </Link>
          <span className="font-light">{description}</span>
          <span className="font-bold ml-1 text-primary">{price}</span>
        </div>
      </div>

      {/* View comments link */}
      {!showComments && (
        <button 
          onClick={() => setShowComments(true)}
          className="px-4 pb-3 text-gray-400 text-[13px] font-roboto hover:text-gray-600 transition-colors"
        >
          Ver comentarios...
        </button>
      )}

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-50 px-4 py-3">
              {/* Comments List */}
              {loadingComments ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-gray-400 text-[13px] font-roboto py-2 text-center">
                  No hay comentarios aún. ¡Sé el primero!
                </p>
              ) : (
                <div className="space-y-3 max-h-[200px] overflow-y-auto no-scrollbar mb-3">
                  {comments.map(comment => (
                    <div key={comment.id} className="flex items-start gap-2.5 group">
                      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
                        <img 
                          src={comment.user_avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
                          alt={comment.user_name} 
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-roboto text-[13px] leading-[17px]">
                          <span className="font-medium mr-1">{comment.user_name}</span>
                          <span className="font-light">{comment.content}</span>
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(comment.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      {/* Delete button: visible to post owner or comment author */}
                      {(isOwner || comment.user_id === user?.id) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-full transition-all flex-shrink-0"
                          title="Eliminar comentario"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Comment Input */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
                  <img 
                    src={user?.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
                    alt="My Avatar" 
                    className="w-full h-full object-cover shadow-sm"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'; }}
                  />
                </div>
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="Escribe un comentario..."
                  className="flex-1 bg-transparent text-[13px] font-roboto placeholder:text-gray-300 outline-none"
                  disabled={sendingComment}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || sendingComment}
                  className={cn(
                    "font-roboto font-bold text-[13px] transition-colors",
                    commentText.trim() ? "text-primary" : "text-gray-300"
                  )}
                >
                  {sendingComment ? (
                    <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  ) : (
                    'Publicar'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Deletion Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-white rounded-t-[2.5rem] sm:rounded-[2rem] p-8 pb-10 sm:pb-8 shadow-2xl overflow-hidden"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="text-red-500 w-8 h-8" />
                </div>
                <h3 className="font-roboto font-bold text-xl text-black mb-2">¿Eliminar publicación?</h3>
                <p className="font-roboto font-light text-gray-500 mb-8 px-4">
                  Esta acción no se puede deshacer. Tu publicación se borrará permanentemente de CampusMarket.
                </p>
                <div className="flex flex-col w-full gap-3">
                  <button
                    disabled={isDeleting}
                    onClick={async () => {
                      setIsDeleting(true);
                      const success = await deletePost(id);
                      if (success) {
                        onDelete?.();
                        setShowDeleteConfirm(false);
                      } else {
                        alert('No se pudo eliminar la publicación. Es posible que tengas problemas de conexión o permisos insuficientes.');
                      }
                      setIsDeleting(false);
                    }}
                    className="w-full h-14 bg-red-500 text-white rounded-2xl font-roboto font-bold text-lg shadow-lg shadow-red-200 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
                  >
                    {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                  </button>
                  <button
                    disabled={isDeleting}
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full h-14 bg-transparent text-gray-400 font-roboto font-medium text-lg active:scale-95 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Edit Modal (Instagram Style) */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-[60] flex flex-col bg-[#F9FAFB]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-16 bg-white border-b border-gray-100 sticky top-0 z-10">
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 font-roboto text-[15px] hover:text-black transition-colors"
              >
                Cancelar
              </button>
              <h3 className="font-roboto font-bold text-[17px] text-[#102042]">Editar información</h3>
              <button 
                onClick={handleUpdate}
                disabled={isUpdating}
                className="text-primary font-roboto font-bold text-[15px] disabled:opacity-50 active:scale-95 transition-transform"
              >
                {isUpdating ? 'Guardando...' : 'Listo'}
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
              <div className="max-w-xl mx-auto w-full px-4 pt-6 space-y-6">
                
                {/* Product Card Preview (Premium Look) */}
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center gap-5">
                  <div className="w-[100px] h-[100px] rounded-2xl overflow-hidden shadow-inner flex-shrink-0">
                    <img src={imageUrl} className="w-full h-full object-cover" alt="Preview" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Publicación Actual</p>
                    <div className="relative">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 text-primary font-bold text-lg">$</span>
                      <input 
                        type="text"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-5 text-[22px] font-roboto font-bold focus:outline-none text-primary bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Description Field */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[12px] font-bold text-[#102042] uppercase">Pie de foto / Descripción</label>
                    <span className={cn(
                      "text-[10px] font-medium",
                      editDescription.length > 200 ? "text-red-400" : "text-gray-300"
                    )}>
                      {editDescription.length}/250
                    </span>
                  </div>
                  <textarea 
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Escribe algo increíble sobre tu producto..."
                    rows={8}
                    maxLength={250}
                    className="w-full text-[15px] font-roboto font-light leading-relaxed focus:outline-none resize-none bg-transparent placeholder:text-gray-300"
                  />
                </div>

                <div className="px-6 py-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <p className="text-[12px] text-primary/70 font-roboto leading-tight text-center">
                    Tus cambios se guardarán de forma segura y se verán reflejados inmediatamente en el feed de la comunidad.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
