import React from 'react';
import { useNavigate } from 'react-router-dom';
import MobileContainer from '@/components/layout/MobileContainer';
import logoUrl from '@/assets/logo.png';

export default function AuthPortal() {
    const navigate = useNavigate();

    return (
        <MobileContainer className="bg-white p-6">
            {/* Logo Section */}
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="mb-12 transform hover:scale-105 transition-transform duration-500">
                    <img src={logoUrl} alt="CampusMarket" className="w-[240px] h-auto object-contain" />
                </div>

                {/* Main Action Buttons */}
                <div className="w-full space-y-6 px-4">
                    <button
                        onClick={() => navigate('/login')}
                        className="btn-dark-blue h-14 text-base"
                    >
                        Iniciar Sesión
                    </button>

                    <div className="flex items-center gap-4 py-2">
                        <div className="h-[1px] flex-1 bg-gray-200"></div>
                        <span className="text-sm font-bold text-darkText/60">o</span>
                        <div className="h-[1px] flex-1 bg-gray-200"></div>
                    </div>

                    <button
                        onClick={() => navigate('/register')}
                        className="w-full text-center py-2 text-[#102042] font-bold text-sm tracking-tight hover:opacity-80 transition-opacity"
                    >
                        Registrase con el correo
                    </button>
                </div>
            </div>

            {/* Bottom Footer */}
            <div className="w-full bg-[#F3F3F3] -mx-6 px-6 py-4 flex justify-center items-center mt-auto">
                <p className="text-[11px] text-grayText">
                    Listo para crear una cuenta? <button onClick={() => navigate('/register')} className="font-bold text-[#102042]">Registrarse.</button>
                </p>
            </div>
        </MobileContainer>
    );
}
