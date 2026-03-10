import { useNavigate } from 'react-router-dom';
import MobileContainer from '@/components/layout/MobileContainer';
import { Hammer, ArrowLeft } from 'lucide-react';
import { ShimmerButton } from '@/registry/magicui/shimmer-button';
import { motion } from 'framer-motion';

export default function DevelopmentScreen() {
    const navigate = useNavigate();

    return (
        <MobileContainer className="bg-white p-6 relative flex flex-col items-center justify-center">
            {/* Back to Home Button */}
            <div className="absolute top-6 left-6 z-10">
                <button
                    onClick={() => navigate('/auth-portal')}
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

                <div className="w-full pt-8">
                    <ShimmerButton
                        onClick={() => navigate('/auth-portal')}
                        background="#9AD7F3"
                        className="w-full shadow-2xl h-14"
                    >
                        <span className="text-center text-sm leading-none font-bold tracking-tight whitespace-pre-wrap text-[#102042]">
                            Regresar al Inicio
                        </span>
                    </ShimmerButton>
                </div>
            </motion.div>
        </MobileContainer>
    );
}
