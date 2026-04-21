import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MobileContainer from '@/components/layout/MobileContainer';
import { X, Star as StarIcon, ImagePlus, Trash2, AlertCircle } from 'lucide-react';
import { useFeedContext } from '@/contexts/FeedContext';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';

export default function LeaveReview() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { addReview } = useFeedContext();
  const { user } = useAuthContext();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Image states
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const starsContainerRef = useRef<HTMLDivElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!starsContainerRef.current) return;
    const rect = starsContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const rawRating = (x / width) * 5;
    
    // Round to nearest 0.5
    const roundedRating = Math.ceil(rawRating * 2) / 2;
    setHoverRating(Math.max(0.5, Math.min(5, roundedRating)));
  };

  const handlePointerLeave = () => {
    setHoverRating(0);
  };

  const handlePointerClick = () => {
    if (hoverRating > 0) {
      setRating(hoverRating);
    }
  };

  const handleSubmit = async () => {
    if (!userId || rating === 0) {
      alert('Por favor selecciona una calificación.');
      return;
    }

    setIsSubmitting(true);
    let imageUrl = '';

    try {
      // 1. Upload image if exists
      if (image && user) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}/${Math.random()}.${fileExt}`;
        const filePath = `review-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
      }

      // 2. Add review
      const success = await addReview(userId, rating, reviewText, imageUrl);
      if (success) {
        navigate(-1);
      } else {
        alert('Error al enviar la reseña. Es posible que ya hayas dejado una reseña para este usuario.');
      }
    } catch (e: any) {
      console.error('Error in review submission:', e);
      alert('Hubo un error al procesar tu reseña: ' + (e.message || 'Error desconocido'));
    } finally {
      setIsSubmitting(false);
    }
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
          <h1 className="font-roboto font-bold text-[18px] text-[#102042]">
            Deja tu reseña
          </h1>
          <div className="w-[18px]" />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col px-5 overflow-y-auto no-scrollbar pb-10">
          
          {/* Experience Question */}
          <div className="py-8">
            <h2 className="font-roboto font-bold text-[22px] text-[#102042] text-center mb-2">
              ¿Cómo fue tu experiencia?
            </h2>
            <p className="text-gray-400 text-sm text-center">Tu opinión ayuda a la comunidad</p>
          </div>

          {/* Rating Section - Premium Interaction */}
          <div className="py-8 bg-gray-50/50 rounded-3xl border border-gray-100 mb-8">
            <p className="font-roboto font-medium text-[14px] text-gray-500 text-center mb-6 uppercase tracking-wider">
              Tu calificación general
            </p>
            
            <div 
              ref={starsContainerRef}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              onClick={handlePointerClick}
              className="flex items-center justify-center gap-3 touch-none select-none relative"
            >
              {[1, 2, 3, 4, 5].map((index) => {
                const isFull = displayRating >= index;
                const isHalf = displayRating > (index - 1) && displayRating < index;
                
                return (
                  <motion.div
                    key={index}
                    animate={displayRating >= index ? { scale: [1, 1.1, 1] } : {}}
                    className="relative cursor-pointer"
                  >
                    {/* Background Star (Gray) */}
                    <StarIcon 
                      size={36} 
                      className="text-gray-200 fill-gray-200" 
                      strokeWidth={1.5}
                    />
                    
                    {/* Filling Star (Yellow) */}
                    <div 
                      className="absolute top-0 left-0 overflow-hidden transition-all duration-75"
                      style={{ 
                        width: isFull ? '100%' : isHalf ? '50%' : '0%',
                        pointerEvents: 'none'
                      }}
                    >
                      <StarIcon 
                        size={36} 
                        className="text-[#FACC05] fill-[#FACC05]" 
                        strokeWidth={1.5}
                      />
                    </div>
                  </motion.div>
                );
              })}
              
              {/* Floating Value Indicator */}
              <AnimatePresence>
                {displayRating > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute -bottom-10 bg-[#102042] text-white px-3 py-1 rounded-full text-xs font-bold"
                  >
                    {displayRating.toFixed(1)} / 5.0
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Review Detail */}
          <div className="mb-8">
            <h3 className="font-roboto font-bold text-[16px] text-[#102042] mb-3 ml-1">
              Detalle de la reseña
            </h3>
            
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Cuéntanos más detalles sobre tu experiencia..."
              rows={4}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 font-roboto text-[16px] text-[#102042] placeholder:text-gray-400 resize-none outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
            />
          </div>

          {/* Image Upload Area */}
          <div className="mb-10">
            <h3 className="font-roboto font-bold text-[16px] text-[#102042] mb-3 ml-1">
              Añadir fotos
            </h3>
            
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageChange}
            />

            {imagePreview ? (
              <div className="relative w-full aspect-video rounded-3xl overflow-hidden group shadow-lg">
                <img src={imagePreview} alt="Review" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white text-black px-4 py-2 rounded-xl text-sm font-bold shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    Cambiar
                  </button>
                  <button 
                    onClick={removeImage}
                    className="bg-red-500 text-white p-2 rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-[120px] bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-2 group hover:border-primary hover:bg-primary/[0.02] transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <ImagePlus size={24} className="text-gray-400 group-hover:text-primary transition-colors" />
                </div>
                <span className="text-sm font-bold text-gray-400 group-hover:text-primary transition-colors">Añadir una foto</span>
              </button>
            )}
          </div>

          {/* Action Buttons - Side by Side */}
          <div className="flex gap-4 mt-auto mb-10">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(-1)}
              className="flex-1 h-14 bg-gray-100 rounded-2xl font-roboto font-bold text-gray-600 hover:bg-gray-200 transition-all"
            >
              Cancelar
            </motion.button>
            <div className="flex-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0}
                className="w-full h-14 bg-[#102042] rounded-2xl font-roboto font-bold text-white shadow-xl shadow-blue-900/10 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2 overflow-hidden relative group"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Publicando...</span>
                  </>
                ) : (
                  <span>Publicar reseña</span>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </MobileContainer>
  );
}
