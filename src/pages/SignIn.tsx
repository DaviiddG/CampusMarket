import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileContainer from '@/components/layout/MobileContainer';
import { useAuth } from '@/hooks/useAuth';
import { ChevronLeft, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import logoUrl from '@/assets/logo.png';
import { ShimmerButton } from "@/registry/magicui/shimmer-button";

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const { signIn, loading, error } = useAuth();
    const navigate = useNavigate();

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        const result = await signIn(email, password);

        if (result) {
            setShowSuccess(true);
            setTimeout(() => {
                navigate('/onboarding');
            }, 2500);
        }
    };

    return (
        <MobileContainer className="bg-white p-6 relative overflow-hidden">
            {/* Success Overlay */}
            {showSuccess && (
                <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-500">
                    <div className="bg-white p-8 rounded-full shadow-2xl mb-6 animate-bounce">
                        <CheckCircle className="w-20 h-20 text-[#9AD7F3]" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#102042] mb-2">¡Inicio de sesión exitoso!</h2>
                    <p className="text-grayText text-center px-8">Cargando tu experiencia de CampusMarket...</p>
                    <div className="mt-8 flex gap-1">
                        <div className="w-2 h-2 bg-[#9AD7F3] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-[#9AD7F3] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-[#9AD7F3] rounded-full animate-bounce"></div>
                    </div>
                </div>
            )}

            {/* Back Button */}
            <div className="w-full mb-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-darkText/50 hover:text-darkText transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
            </div>

            {/* Logo Section */}
            <div className="flex flex-col items-center mb-8">
                <img src={logoUrl} alt="CampusMarket" className="w-[180px] h-auto object-contain mb-6" />

                <div className="text-center">
                    <h1 className="text-3xl font-bold text-darkText mb-1">¡Bienvenido!</h1>
                    <p className="text-grayText text-sm">Inicia sesión para continuar</p>
                </div>
            </div>

            <div className="w-full flex-1">
                {error && (
                    <p className="text-red-500 text-xs text-center mb-4">{error}</p>
                )}

                <form onSubmit={handleSignIn} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-darkText/60 ml-1 uppercase">Correo Electrónico</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-grayText" />
                            <input
                                type="email"
                                placeholder="tucorreo@campus.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="minimalist-input pl-11"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-darkText/60 ml-1 uppercase">Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-grayText" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="minimalist-input pl-11 pr-11"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-grayText hover:text-darkText"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <button type="button" className="text-xs text-darkText/60">
                            ¿Olvidaste tu contraseña? <span className="font-bold text-primary">Cambiar contraseña.</span>
                        </button>
                    </div>

                    <div className="pt-4 flex flex-col gap-4">
                        <ShimmerButton
                            type="submit"
                            disabled={loading}
                            background="#9AD7F3"
                            className="w-full shadow-2xl h-14"
                        >
                            <span className="text-center text-sm leading-none font-bold tracking-tight whitespace-pre-wrap text-[#102042]">
                                {loading ? 'Cargando...' : 'Iniciar Sesión'}
                            </span>
                        </ShimmerButton>

                        <ShimmerButton
                            type="button"
                            onClick={() => navigate('/register')}
                            background="#102042"
                            className="w-full shadow-2xl h-14"
                        >
                            <span className="text-center text-sm leading-none font-bold tracking-tight whitespace-pre-wrap text-white">
                                Registrarse
                            </span>
                        </ShimmerButton>
                    </div>
                </form>
            </div>
        </MobileContainer>
    );
}
