import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MobileContainer from '@/components/layout/MobileContainer';
import { useAuth } from '@/hooks/useAuth';
import { ChevronLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import logoUrl from '@/assets/logo.png';
import { ShimmerButton } from "@/registry/magicui/shimmer-button";

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { signIn, loading, error } = useAuth();
    const navigate = useNavigate();

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        await signIn(email, password);
    };

    return (
        <MobileContainer className="bg-white p-6">
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
                            className="w-full shadow-2xl h-14"
                        >
                            <span className="text-center text-sm leading-none font-bold tracking-tight whitespace-pre-wrap text-white">
                                {loading ? 'Cargando...' : 'Iniciar Sesión'}
                            </span>
                        </ShimmerButton>

                        <Link to="/register" className="btn-dark-blue">
                            Registrarse
                        </Link>
                    </div>
                </form>
            </div>
        </MobileContainer>
    );
}
