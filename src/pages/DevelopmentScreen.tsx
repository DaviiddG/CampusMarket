
import MobileContainer from '@/components/layout/MobileContainer';
import { Hammer } from 'lucide-react';
import { motion } from 'framer-motion';
import BottomNav from '@/components/layout/BottomNav';
export default function DevelopmentScreen() {
    return (
        <MobileContainer className="bg-white p-6 relative flex flex-col items-center justify-center overflow-hidden h-full min-h-full">
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
            </motion.div>

            {/* Persistent Bottom Nav */}
            <BottomNav activeTab="search" />
        </MobileContainer>
    );
}
