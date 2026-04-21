import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileContainer from '@/components/layout/MobileContainer';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFeedContext } from '@/contexts/FeedContext';
import { X, Check, ImagePlus } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/lib/canvasUtils';

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
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  // Fallback to name or placeholder
  const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0UyRThGMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjOTRBM0I4Ii8+PHBhdGggZD0iTTIwIDEwMGEzMCAzMCAwIDAgMSA2MCAwIiBmaWxsPSIjOTRBM0I4Ii8+PC9zdmc+';
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Mi Negocio';
  const avatarUrl = profileAvatar || user?.user_metadata?.avatar_url || DEFAULT_AVATAR;

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.avatar_url) setProfileAvatar(data.avatar_url);
      });
  }, [user]);

  // Format number with Colombian thousands separator (dots)
  const formatWithDots = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, ''); // only digits
    setPrice(raw);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const { addPost } = useFeedContext();

  const handleUpload = async () => {
    // Basic validation
    if (!description || !category || !type || !imagePreview || !price) {
      alert('Por favor completa todos los campos (incluyendo el precio) y sube una imagen.');
      return;
    }
    
    setIsUploading(true);

    try {
      let uploadFile: File | null = imageFile;
      
      // If the user cropped the image, generate the final cropped blob
      if (imagePreview && croppedAreaPixels) {
        try {
          const croppedBlob = await getCroppedImg(imagePreview, croppedAreaPixels);
          if (croppedBlob) {
            uploadFile = croppedBlob;
          }
        } catch (e) {
          console.error("Error al procesar el recorte de la imagen", e);
        }
      }

      if (!uploadFile) throw new Error("No hay archivo de imagen válido para subir.");

      // 1. Upload to Supabase Storage
      const fileName = `posts/${Date.now()}-cropped.jpeg`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, uploadFile);

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
          avatar_url: avatarUrl,
          image_url: publicUrl,
          category,
          type,
          price: '$' + formatWithDots(price),
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
    } catch (e: any) {
      console.error('Error uploading post', e);
      alert(`Error al subir la publicación: ${e.message || 'Error desconocido'}. Asegúrate de haber ejecutado el script SQL de permisos.`);
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
    <MobileContainer className="bg-white relative overflow-y-auto pb-20 no-scrollbar">
      {/* Scrollable Area */}
      <div className="w-full pb-[80px] lg:pb-10">
        <div className="max-w-[600px] mx-auto w-full">
          
          {/* App Bar area - Mobile Only */}
          <div className="w-full flex lg:hidden items-center justify-between px-4 pt-10 pb-4 relative">
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

          <div className="flex flex-col w-full px-6 mt-6">
            <h2 className="hidden lg:block text-2xl font-roboto font-bold mb-8">Crear nueva publicación</h2>
            
            {/* User Mini Profile */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-[44px] h-[44px] rounded-full overflow-hidden border border-gray-100 bg-gray-200 shadow-sm">
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <span className="font-roboto font-bold text-[15px] text-black">{displayName}</span>
            </div>

            {/* Description Input */}
            <div className="mb-6">
              <textarea
                placeholder="Escribe una descripción cautivadora..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={250}
                rows={3}
                className="w-full font-roboto font-normal text-[16px] text-black placeholder:text-gray-400 bg-transparent outline-none resize-none border-b border-gray-100 pb-2 focus:border-primary transition-colors"
              />
              <p className="text-[10px] text-gray-400 mt-1 text-right">{description.length}/250</p>
            </div>

            {/* Price Input */}
            <div className="mb-8">
              <label className="block text-[12px] font-bold text-gray-400 uppercase mb-2">Precio del producto</label>
              <div className="relative w-full">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500 font-roboto text-[18px]">$</span>
                <input
                  type="text"
                  placeholder="0"
                  value={formatWithDots(price)}
                  onChange={handlePriceChange}
                  className="w-full pl-6 font-roboto font-bold text-[24px] text-black placeholder:text-gray-200 bg-transparent outline-none border-b border-gray-100 pb-2 focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          {/* Image Upload Area - Full Width in container */}
          <div 
            className={`w-full h-[400px] bg-gray-50 border-y lg:border lg:rounded-3xl border-gray-100 relative mb-8 overflow-hidden flex items-center justify-center group transition-all ${!imagePreview ? 'cursor-pointer hover:bg-gray-100' : ''}`}
            onClick={() => { if (!imagePreview) fileInputRef.current?.click() }}
          >
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageChange}
            />
            
            {imagePreview ? (
              <div className="relative w-full h-full">
                <Cropper
                  image={imagePreview}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10 scale-0 group-hover:scale-100 transition-transform">
                  <span 
                    className="bg-white/90 px-4 py-2 rounded-full text-sm font-bold shadow-lg cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Cambiar foto
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-gray-400 group-hover:text-primary transition-colors">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <ImagePlus className="w-8 h-8" />
                </div>
                <span className="font-roboto font-bold text-sm">Seleccionar foto de producto</span>
              </div>
            )}
          </div>

          {/* Selects Area */}
          <div className="w-full px-6 flex flex-row gap-4 mb-10">
            {/* Category */}
            <div className="flex-1 relative">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Categoría</label>
              <div className="relative h-[45px] bg-gray-50 rounded-xl border border-gray-100 flex items-center group focus-within:border-primary transition-all">
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-full bg-transparent appearance-none text-gray-700 font-roboto text-[14px] px-4 outline-none cursor-pointer"
                >
                  <option value="" disabled hidden>Seleccionar categoría</option>
                  <option value="comida">🍔 Comida</option>
                  <option value="ropa">👕 Ropa</option>
                  <option value="servicios">🛠️ Servicios</option>
                  <option value="tecnologia">💻 Tecnología</option>
                  <option value="otros">📦 Otros</option>
                </select>
              </div>
            </div>

            {/* Type */}
            <div className="flex-1 relative">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Tipo de publicación</label>
              <div className="relative h-[45px] bg-gray-50 rounded-xl border border-gray-100 flex items-center group focus-within:border-primary transition-all">
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full h-full bg-transparent appearance-none text-gray-700 font-roboto text-[14px] px-4 outline-none cursor-pointer"
                >
                  <option value="" disabled hidden>¿Qué estás haciendo?</option>
                  <option value="venta">Vendo un producto</option>
                  <option value="promocion">Ofrezco una promoción</option>
                  <option value="preventa">Es una preventa limitada</option>
                </select>
              </div>
            </div>
          </div>

          {/* Buttons Area - Always horizontal to match PC design */}
          <div className="w-full flex flex-row justify-center gap-4 px-6 pb-10">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1 h-[50px] bg-primary text-white shadow-lg shadow-primary/30 rounded-2xl flex items-center justify-center font-roboto font-bold text-[16px] disabled:opacity-50 transition-all"
            >
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Publicando...</span>
                </div>
              ) : (
                'Publicar ahora'
              )}
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDiscard}
              className="flex-1 h-[50px] bg-gray-50 text-gray-600 border border-gray-100 rounded-2xl flex items-center justify-center font-roboto font-bold text-[16px] hover:bg-gray-100 transition-all"
            >
              Descartar
            </motion.button>
          </div>
        </div>
      </div>
    </MobileContainer>
  );
}
