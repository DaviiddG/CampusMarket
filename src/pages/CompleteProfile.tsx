import { useState, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileContainer from '@/components/layout/MobileContainer';
import { ChevronLeft, CheckCircle, Camera, User } from 'lucide-react';
import { ShimmerButton } from '@/registry/magicui/shimmer-button';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.user_metadata?.avatar_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialName = user?.user_metadata?.full_name || '';

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let avatarUrl = user?.user_metadata?.avatar_url;

    try {
      // 1. Upload Avatar if selected
      if (avatarFile) {
        const fileName = `avatars/${Date.now()}-${avatarFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, avatarFile);

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        
        avatarUrl = publicData.publicUrl;
      }
      
      // 2. Set the backend metadata
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No se encontró una sesión activa. Por favor, intenta cerrar sesión e iniciarla de nuevo.');
      }

      const { error } = await supabase.auth.updateUser({ 
        data: { 
          profile_completed: true,
          phone_number: phone,
          bio: bio,
          avatar_url: avatarUrl
        } 
      });

      if (error) throw error;
      
      // 3. Success flow
      localStorage.setItem('profileCompleted', 'true');
      setSuccess(true);
      setTimeout(() => {
        navigate('/personalization', { replace: true });
      }, 1500);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      alert('Error al actualizar el perfil: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileContainer className="bg-white relative overflow-hidden">
      {success && (
        <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="bg-white p-8 rounded-full shadow-2xl mb-6 animate-bounce">
            <CheckCircle className="w-20 h-20 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#102042] mb-2">¡Perfil Actualizado!</h2>
          <p className="text-grayText text-center px-8">Guardando tus datos...</p>
        </div>
      )}

      {/* Header */}
      <div className="w-full flex items-center mb-6 pt-4 px-4">
        <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-darkText/50 hover:text-darkText transition-colors"
        >
            <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center font-roboto font-medium text-[16px] pr-6">Datos del Negocio</h1>
      </div>

      <div className="flex-1 px-6 overflow-y-auto w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold font-poppins text-[#102042] mb-2">Paso obligatorio</h2>
          <p className="text-sm font-roboto text-grayText">
            Necesitamos algunos detalles de tu emprendimiento para que tus clientes puedan contactarte.
          </p>
        </div>

        {/* Avatar Selection UI */}
        <div className="flex flex-col items-center mb-8">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="relative w-28 h-28 rounded-full bg-gray-100 border-4 border-white shadow-xl overflow-hidden group cursor-pointer"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <User size={48} strokeWidth={1} />
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white w-8 h-8" />
            </div>
          </div>
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 text-[#102042] text-[13px] font-bold"
          >
            Cargar foto de perfil
          </button>
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-darkText/60 ml-1 uppercase">Nombre del Emprendimiento</label>
            <input
              type="text"
              value={initialName}
              disabled
              className="minimalist-input bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-[10px] text-grayText ml-1">Para cambiarlo, contacta a soporte.</p>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-darkText/60 ml-1 uppercase">Número de Contacto (WhatsApp)</label>
            <div className="flex gap-2">
              <span className="flex items-center justify-center bg-gray-100 rounded-xl px-3 font-medium text-darkText border-2 border-grayBase">
                +57
              </span>
              <input
                type="tel"
                placeholder="300 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
                required
                className="minimalist-input flex-1"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-darkText/60 ml-1 uppercase">Descripción / Biografía</label>
            <textarea
              placeholder="Ej: Emprendimiento de fresas. Ubicados en crr 34 #56-70"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={150}
              required
              className="w-full bg-transparent border-2 border-grayBase rounded-2xl px-4 py-3 outline-none focus:border-[#9AD7F3] font-roboto text-[14px] text-darkText transition-colors resize-none"
            />
            <div className="flex justify-end">
              <span className="text-[10px] text-grayText">{bio.length}/150</span>
            </div>
          </div>

          <div className="pt-8">
            <ShimmerButton
              type="submit"
              disabled={loading || phone.length < 10 || bio.length < 3}
              background="#102042"
              className="w-full shadow-lg h-14 disabled:opacity-50"
            >
              <span className="text-center text-sm leading-none font-bold tracking-tight whitespace-pre-wrap text-white">
                {loading ? 'Guardando...' : 'Guardar y Continuar'}
              </span>
            </ShimmerButton>
          </div>
        </form>
      </div>
    </MobileContainer>
  );
}
