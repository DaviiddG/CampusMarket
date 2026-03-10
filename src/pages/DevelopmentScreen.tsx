import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileContainer from '@/components/layout/MobileContainer';
import { Hammer, ArrowLeft, LogOut, AlertCircle } from 'lucide-react';
import { ShimmerButton } from '@/registry/magicui/shimmer-button';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

export default function DevelopmentScreen() {
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/auth-portal');
    };

    const handleVolver = () => {
        setShowLogoutModal(true);
    };

    return (
        <MobileContainer className="bg-white p-6 relative flex flex-col items-center justify-center overflow-hidden h-full min-h-full">
            {/* Custom Logout Modal */}
            <AnimatePresence>
                {showLogoutModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl flex flex-col items-center text-center"
                        >
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-[#102042] mb-2">¿Cerrar Sesión?</h3>
                            <p className="text-grayText text-sm mb-8">
                                Necesitas cerrar sesión para salir de esta pantalla y volver al inicio.
                            </p>

                            <div className="w-full space-y-3">
                                <ShimmerButton
                                    onClick={handleSignOut}
                                    background="#ef4444" // red-500
                                    className="w-full shadow-lg h-12"
                                >
                                    <span className="text-center text-sm font-bold text-white">
                                        Sí, cerrar sesión
                                    </span>
                                </ShimmerButton>
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="w-full py-3 text-grayText font-bold text-sm hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Back to Home Button */}
            <div className="absolute top-6 left-6 z-10">
                <button
                    onClick={handleVolver}
                    className="p-2 -ml-2 text-darkText/50 hover:text-darkText transition-colors flex items-center gap-2"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-xs font-medium">Volver</span>
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center space-y-8"
            >
                {/* Construction Icon Animation */}
                <div className="relative">
                    <div className="absolute inset-0 bg-[#9AD7F3] rounded-full blur-3xl opacity-20 animate-pulse"></div>
                    <div className="bg-gradient-to-br from-[#102042] to-[#2a457a] w-24 h-24 rounded-full flex items-center justify-center shadow-2xl relative z-10">
                        <Hammer className="w-12 h-12 text-white animate-bounce" />
                    </div>
                </div>

                <div className="text-center space-y-4 px-4">
                    <h1 className="text-3xl font-extrabold text-[#102042] tracking-tight">
                        En Desarrollo
                    </h1>
                    <p className="text-grayText text-center text-sm leading-relaxed max-w-[280px] mx-auto">
                        Estamos trabajando arduamente para traerte la mejor experiencia de CampusMarket. ¡Vuelve pronto para ver las novedades!
                    </p>
                </div>

                <div className="w-full pt-8 flex flex-col gap-4">
                    <ShimmerButton
                        onClick={handleVolver}
                        background="#9AD7F3"
                        className="w-full shadow-2xl h-14"
                    >
                        <span className="text-center text-sm leading-none font-bold tracking-tight whitespace-pre-wrap text-[#102042]">
                            Regresar al Inicio
                        </span>
                    </ShimmerButton>

                    <button
                        onClick={handleVolver}
                        className="flex items-center justify-center gap-2 w-full py-3 text-red-500 font-bold text-sm tracking-tight hover:bg-red-50 rounded-xl transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                    </button>
                </div>
            </motion.div>
        </MobileContainer>
    );
}
