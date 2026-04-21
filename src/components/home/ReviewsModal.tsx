import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Check, Star } from 'lucide-react';
import { type Review } from '@/contexts/FeedContext';

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviews: Review[];
  targetName: string;
}

export default function ReviewsModal({ isOpen, onClose, reviews, targetName }: ReviewsModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200); // Wait for exit animation
  };

  if (!isOpen && !isClosing) return null;

  // Calculate overall rating
  const averageRating = reviews.length > 0 
    ? Math.round(reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={handleClose}
      />
      
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: isClosing ? "100%" : 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full h-[90vh] sm:h-auto sm:max-h-[85vh] sm:max-w-xl bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <button 
            onClick={handleClose}
            className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <ChevronLeft size={24} className="text-black" />
          </button>
          <h2 className="font-roboto font-medium text-[16px] text-black tracking-wide">
            Reseñas
          </h2>
          <button 
            onClick={handleClose}
            className="p-2 -mr-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <Check size={24} className="text-black" />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto pb-8">
          
          {/* General Rating Header */}
          <div className="py-8 text-center bg-gray-50/50">
            <h3 className="font-roboto text-[16px] text-gray-500 mb-4">
              Calificación general
            </h3>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star}
                  size={38}
                  className={star <= averageRating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}
                />
              ))}
            </div>
          </div>

          <div className="h-2 w-full bg-gray-50 border-t border-b border-gray-100"></div>

          {/* Reviews List */}
          <div className="pt-6 px-6">
            <h3 className="font-roboto text-[18px] text-[#1e293b] font-medium mb-6">
              Reseñas de clientes
            </h3>

            {reviews.length === 0 ? (
              <p className="text-gray-400 text-center py-10 font-roboto text-sm">
                Aún no hay reseñas para {targetName}.
              </p>
            ) : (
              <div className="space-y-8">
                {reviews.map((review, index) => (
                  <motion.div 
                    key={review.id} 
                    className="flex flex-col"
                    initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ 
                      duration: 0.45, 
                      delay: Math.min(index * 0.09, 0.5),
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        <img 
                          src={review.reviewer_avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0UyRThGMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjOTRBM0I4Ii8+PHBhdGggZD0iTTIwIDEwMGEzMCAzMCAwIDAgMSA2MCAwIiBmaWxsPSIjOTRBM0I4Ii8+PC9zdmc+'}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="font-roboto font-medium text-[15px] text-[#1e293b]">
                        {review.reviewer_name || 'Usuario'}
                      </span>
                    </div>

                    {review.content && (
                      <p className="font-roboto text-[14px] text-gray-600 mb-3 leading-relaxed">
                        {review.content}
                      </p>
                    )}

                    {review.image_url && (
                      <div className="w-auto max-w-[280px] rounded-[24px] overflow-hidden bg-gray-50 border border-gray-100 mb-2">
                        <img src={review.image_url} alt="Review attachment" className="w-full h-auto object-cover" />
                      </div>
                    )}
                    
                    <p className="text-[11px] text-gray-400 font-roboto">
                      {new Date(review.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
