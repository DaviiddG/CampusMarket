import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileContainer from '@/components/layout/MobileContainer';
import { useAuthContext } from '@/contexts/AuthContext';
import { ShimmerButton } from '@/registry/magicui/shimmer-button';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Utensils, Shirt, MonitorSmartphone, BookOpen, Coffee, Store, PackagePlus, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const USUARIO_INTERESTS = [
  { id: 'comida', label: 'Comida', icon: Utensils },
  { id: 'ropa', label: 'Ropa & Moda', icon: Shirt },
  { id: 'tech', label: 'Tecnología', icon: MonitorSmartphone },
  { id: 'tutorias', label: 'Tutorías', icon: BookOpen },
  { id: 'postres', label: 'Postres', icon: Coffee },
];

export default function Personalization() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isFinishing, setIsFinishing] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);

  const role = user?.user_metadata?.role || 'usuario'; 
  const isUsuario = role === 'usuario';

  useEffect(() => {
    // If they magically ended up here and already have the flag, redirect to home.
    const metadata = user?.user_metadata || {};
    if (localStorage.getItem('hasPersonalized') || metadata.has_personalized) {
      navigate('/home', { replace: true });
    }
    
    // Check if profile was completed (for entrepreneur)
    if (localStorage.getItem('profileCompleted') === 'true') {
      setProfileCompleted(true);
    }
  }, [navigate]);

  const handleFinish = async () => {
    setIsFinishing(true);
    await supabase.auth.updateUser({ data: { has_personalized: true } });
    setTimeout(() => {
      localStorage.setItem('hasPersonalized', 'true');
      navigate('/home', { replace: true });
    }, 1500);
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Determine button state
  const isContinueDisabled = !isUsuario && !profileCompleted;

  return (
    <MobileContainer className="bg-white" showSidebars={false}>
      <AnimatePresence>
        {!isFinishing ? (
          <motion.div
            key="personalization"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col w-full px-6 py-12 flex-1"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-[#102042] rounded-2xl mb-6 mx-auto shadow-lg shadow-[#102042]/20">
              {isUsuario ? (
                <Search className="text-white w-8 h-8" />
              ) : (
                <Store className="text-white w-8 h-8" />
              )}
            </div>

            <h1 className="text-center text-2xl font-bold font-poppins text-[#102042] mb-3">
              {isUsuario ? '¿Qué estás buscando?' : '¡Impulsa tu negocio!'}
            </h1>
            
            <p className="text-center text-grayText font-roboto text-sm mb-10 px-2 lg:px-4">
              {isUsuario 
                ? 'Selecciona tus temas favoritos para mostrarte recomendaciones personalizadas dentro del campus.'
                : 'Configura tu espacio para que más estudiantes descubran lo que ofreces.'}
            </p>

            {isUsuario ? (
              <div className="flex flex-wrap justify-center gap-3">
                {USUARIO_INTERESTS.map((interest) => {
                  const Icon = interest.icon;
                  const isSelected = selectedInterests.includes(interest.id);
                  return (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      key={interest.id}
                      onClick={() => toggleInterest(interest.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-3 border-2 rounded-xl font-roboto text-sm transition-all shadow-sm",
                        isSelected 
                          ? "border-[#102042] bg-[#102042] text-white"
                          : "border-grayBase bg-white text-darkText hover:border-[#9AD7F3]"
                      )}
                    >
                      <Icon size={18} />
                      {interest.label}
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Step 1: Profile Completeness */}
                <motion.button 
                  whileHover={!profileCompleted ? { scale: 1.02 } : {}}
                  whileTap={!profileCompleted ? { scale: 0.98 } : {}}
                  onClick={() => !profileCompleted && navigate('/complete-profile')}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-2 shadow-sm text-left transition-all",
                    profileCompleted 
                      ? "border-green-500 bg-green-50 pointer-events-none" 
                      : "border-grayBase bg-white hover:border-[#9AD7F3] cursor-pointer"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                    profileCompleted ? "bg-green-100" : "bg-[#E8E8E8]"
                  )}>
                    {profileCompleted ? (
                      <CheckCircle2 size={24} className="text-green-600" />
                    ) : (
                      <Store size={20} className="text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={cn(
                      "font-poppins font-semibold text-sm mb-1",
                      profileCompleted ? "text-green-800" : "text-darkText"
                    )}>
                      {profileCompleted ? "Perfil completo" : "Completa tu Perfil"}
                    </h3>
                    <p className="font-roboto text-xs text-grayText">
                      {profileCompleted ? "Datos guardados correctamente." : "Completa este paso para poder continuar."}
                    </p>
                  </div>
                </motion.button>

                {/* Step 2: Upload indicator */}
                <div className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 text-left opacity-70 border-grayBase bg-white"
                )}>
                  <div className="w-12 h-12 rounded-full bg-[#E8E8E8] flex items-center justify-center">
                    <PackagePlus size={20} className="text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-poppins font-semibold text-gray-500 text-sm mb-1">
                      Sube productos 
                    </h3>
                    <p className="font-roboto text-xs text-gray-400">
                      Podrás hacerlo desde tu panel o perfil.
                    </p>
                  </div>
                </div>

              </div>
            )}

            <div className="mt-auto pt-8">
              <ShimmerButton
                  onClick={handleFinish}
                  disabled={isContinueDisabled}
                  background={(isUsuario && selectedInterests.length === 0) || isContinueDisabled ? "#E0E0E0" : "#9AD7F3"}
                  className="w-full shadow-lg h-14"
              >
                  <span className={cn(
                    "text-center text-sm leading-none font-bold tracking-tight whitespace-pre-wrap",
                    (isUsuario && selectedInterests.length === 0) || isContinueDisabled ? "text-grayText" : "text-[#102042]"
                  )}>
                      {isUsuario 
                        ? (selectedInterests.length === 0 ? "Omitir por ahora" : "Continuar")
                        : "Ir a mi panel"}
                  </span>
              </ShimmerButton>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center w-full flex-1"
          >
            <div className="w-24 h-24 bg-[#102042] rounded-full flex items-center justify-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                {isUsuario ? (
                  <Search className="text-[#9AD7F3] w-12 h-12" />
                ) : (
                  <Store className="text-[#9AD7F3] w-12 h-12" />
                )}
              </motion.div>
            </div>
            <h2 className="text-2xl font-bold font-poppins text-[#102042] mb-2 text-center">¡Todo listo!</h2>
            <p className="text-grayText text-center font-roboto">Cargando tu CampusMarket...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileContainer>
  );
}
