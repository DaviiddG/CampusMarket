import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MobileContainer from '@/components/layout/MobileContainer';
import { X, Star, ImagePlus } from 'lucide-react';
import { useFeedContext } from '@/contexts/FeedContext';
import { motion } from 'motion/react';

export default function LeaveReview() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { addReview } = useFeedContext();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!userId || rating === 0) {
      alert('Por favor selecciona una calificación.');
      return;
    }

    setIsSubmitting(true);
    const success = await addReview(userId, rating, reviewText);
    if (success) {
      navigate(-1);
    } else {
      alert('Error al enviar la reseña. Es posible que ya hayas dejado una reseña para este usuario.');
    }
    setIsSubmitting(false);
  };

  const displayRating = hoverRating || rating;

  return (
    <MobileContainer className="bg-white" justifyCenter={false}>
      <div className="w-full min-h-screen lg:min-h-0 flex flex-col">
        
        {/* Header */}
        <div className="w-full flex items-center justify-between px-5 pt-12 lg:pt-6 pb-4 border-b border-[#E0E0E0]">
          <button 
            onClick={() => navigate(-1)} 
            className="p-1 text-black hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-[18px] h-[18px]" strokeWidth={2} />
          </button>
          <h1 className="font-inter font-normal text-[16px] leading-[19px] text-black">
            Dejar una reseña
          </h1>
          <div className="w-[18px]" /> {/* Spacer */}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col px-5">
          
          {/* Experience Question */}
          <div className="py-6 border-b border-[#E0E0E0]">
            <h2 className="font-inter font-normal text-[17px] leading-[21px] text-[#102042] text-center">
              ¿Cómo fue tu experiencia?
            </h2>
          </div>

          {/* Rating Section */}
          <div className="py-6 border-b border-[#E0E0E0]">
            <p className="font-inter font-normal text-[17px] leading-[21px] text-[#848484] text-center mb-6">
              Tu calificación general
            </p>
            
            {/* Stars */}
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <motion.button
                  key={star}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="w-[44px] h-[56px] rounded-[3px] flex items-center justify-center transition-colors"
                  style={{ 
                    backgroundColor: star <= displayRating ? '#FACC05' : '#D9D9D9' 
                  }}
                >
                  <Star 
                    size={24} 
                    className={star <= displayRating ? 'fill-white text-white' : 'fill-white/50 text-white/50'} 
                  />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Review Detail */}
          <div className="py-6">
            <h3 className="font-inter font-normal text-[17px] leading-[21px] text-[#102042] mb-4">
              Detalle de la reseña
            </h3>
            
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Escribe aquí"
              rows={6}
              className="w-full bg-[#D9D9D9] rounded-[20px] p-5 font-inter font-normal text-[17px] leading-[21px] text-[#102042] placeholder:text-white resize-none outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>

          {/* Add Image Section */}
          <div className="flex items-center gap-3 mb-8">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ImagePlus size={24} className="text-black" />
            </button>
            <span className="font-inter font-normal text-[17px] leading-[21px] text-[#848484]">
              Agregar imagen
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row gap-3 mt-auto pb-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(-1)}
              className="flex-1 h-[40px] bg-[#DFDFDF] rounded-[4px] font-inter font-normal text-[12px] text-[#102042] flex items-center justify-center transition-all"
            >
              Cancelar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
              className="flex-1 h-[40px] bg-[#9AD7F3] rounded-[4px] font-inter font-normal text-[12px] text-[#102042] flex items-center justify-center disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar'}
            </motion.button>
          </div>

          {/* Submit (Full Width) */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="w-full h-[40px] bg-[#102042] rounded-[4px] font-inter font-normal text-[12px] text-white flex items-center justify-center disabled:opacity-50 mb-20 transition-all"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Publicando reseña...</span>
              </div>
            ) : (
              'Publicar reseña'
            )}
          </motion.button>
        </div>
      </div>
    </MobileContainer>
  );
}
