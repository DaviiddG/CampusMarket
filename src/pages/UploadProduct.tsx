import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileContainer from '@/components/layout/MobileContainer';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFeedContext } from '@/contexts/FeedContext';
import { X, Check, ImagePlus } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';

export default function UploadProduct() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fallback to name or placeholder
  const displayName = user?.user_metadata?.full_name || 'Emprendedor';

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const { addPost } = useFeedContext();

  const handleUpload = async () => {
    // Basic validation
    if (!description || !category || !type || !imageFile || !price) {
      alert('Por favor completa todos los campos (incluyendo el precio) y sube una imagen.');
      return;
    }
    
    setIsUploading(true);

    try {
      // 1. Upload to Supabase Storage
      const fileName = `${Date.now()}-${imageFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: publicData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
        
      const publicUrl = publicData.publicUrl;

      // 3. Save to Supabase 'posts' table
      const { data: insertedPost, error: insertError } = await supabase
        .from('posts')
        .insert({
          user_id: user?.id,
          business_name: displayName,
          avatar_url: `https://api.dicebear.com/7.x/notionists/svg?seed=${displayName}`,
          image_url: publicUrl,
          category,
          type,
          price: price.startsWith('$') ? price : '$' + price,
          description
        })
        .select()
        .single();
        
      if (insertError) throw insertError;

      // 4. Send to global context so UI updates immediately
      if (insertedPost) {
        addPost({
          id: insertedPost.id,
          user_id: insertedPost.user_id,
          businessName: insertedPost.business_name,
          avatarUrl: insertedPost.avatar_url,
          imageUrl: insertedPost.image_url,
          price: insertedPost.price,
          description: insertedPost.description,
          likes: 0
        });
      }

      navigate('/home');
    } catch (e) {
      console.error('Error uploading post', e);
      alert('Hubo un error subiendo la publicación.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('¿Seguro que quieres descartar esta publicación?')) {
      navigate(-1);
    }
  };

  return (
    <MobileContainer className="bg-white relative overflow-y-auto pb-20">
      
      {/* App Bar area */}
      <div className="w-full flex items-center justify-between px-4 pt-10 pb-4 relative">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-black hover:bg-gray-100 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h1 className="font-inter font-normal text-[16px] leading-[19px] text-black">
          Subir publicación
        </h1>
        <button onClick={handleUpload} className="p-2 -mr-2 text-black hover:bg-gray-100 rounded-full transition-colors">
          <Check className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col w-full px-4 mt-6">
        {/* User Mini Profile */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-[40px] h-[40px] rounded-full overflow-hidden border border-gray-100 bg-gray-200">
            <img 
              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${displayName}`} 
              alt="Avatar" 
              className="w-full h-full object-cover" 
            />
          </div>
          <span className="font-roboto font-normal text-[14px] leading-[16px] text-black">
            {displayName}
          </span>
        </div>

        {/* Description Input */}
        <div className="mb-4">
          <textarea
            placeholder="Haz una descripción del producto..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={100}
            rows={2}
            className="w-[209px] font-roboto font-normal text-[14px] leading-[16px] text-black placeholder:text-[#848484] bg-transparent outline-none resize-none border-none"
          />
        </div>

        {/* Price Input */}
        <div className="mb-2">
          <div className="relative w-full max-w-[209px]">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 font-roboto text-[14px]">$</span>
            <input
              type="text"
              placeholder="Precio (ej. 15.000)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full pl-4 font-roboto font-normal text-[14px] leading-[16px] text-black placeholder:text-[#848484] bg-transparent outline-none border-b border-gray-200 pb-1 focus:border-[#9AD7F3] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Image Upload Area - Full Width */}
      <div 
        className="w-full h-[344px] bg-[#E8E8E8] relative mt-2 mb-6 cursor-pointer overflow-hidden flex items-center justify-center group"
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleImageChange}
        />
        
        {imagePreview ? (
          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-gray-600 transition-colors">
            <ImagePlus className="w-10 h-10" />
            <span className="font-roboto text-sm">Toca para añadir foto</span>
          </div>
        )}
      </div>

      {/* Selects Area */}
      <div className="w-full px-4 flex flex-col gap-4">
        {/* Category */}
        <div className="relative w-[341px] h-[22px] bg-[#D9D9D9] rounded-[10px] mx-auto flex items-center">
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-full bg-transparent appearance-none text-[#848484] font-roboto font-normal text-[12px] leading-[14px] px-3 outline-none"
          >
            <option value="" disabled hidden>Categoría</option>
            <option value="comida">Comida</option>
            <option value="ropa">Ropa</option>
            <option value="servicios">Servicios</option>
            <option value="tecnologia">Tecnología</option>
            <option value="otros">Otros</option>
          </select>
          <div className="absolute right-3 pointer-events-none text-[#848484]">
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="rotate-90">
              <path d="M1 1L6 6L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Type of Publication */}
        <div className="relative w-[341px] h-[22px] bg-[#D9D9D9] rounded-[10px] mx-auto flex items-center mt-2">
          <select 
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full h-full bg-transparent appearance-none text-[#848484] font-roboto font-normal text-[12px] leading-[14px] px-3 outline-none"
          >
            <option value="" disabled hidden>Tipo de publicación</option>
            <option value="venta">Venta de producto</option>
            <option value="promocion">Promoción/Descuento</option>
            <option value="preventa">Preventa</option>
          </select>
          <div className="absolute right-3 pointer-events-none text-[#848484]">
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="rotate-90">
              <path d="M1 1L6 6L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Buttons Area */}
      <div className="w-full flex justify-center gap-6 mt-10 px-4">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleUpload}
          disabled={isUploading}
          className="w-[150px] h-[32px] bg-[#9AD7F3] shadow-[0px_2.5px_5px_rgba(0,0,0,0.1)] rounded-[5px] flex items-center justify-center font-inter font-normal text-[13px] leading-[16px] text-center text-[#102042] disabled:opacity-50"
        >
          {isUploading ? 'Subiendo...' : 'Subir'}
        </motion.button>
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleDiscard}
          className="w-[150px] h-[32px] bg-[#9AD7F3] shadow-[0px_2.5px_5px_rgba(0,0,0,0.1)] rounded-[5px] flex items-center justify-center font-inter font-normal text-[13px] leading-[16px] text-center text-[#102042]"
        >
          Descartar
        </motion.button>
      </div>

    </MobileContainer>
  );
}
