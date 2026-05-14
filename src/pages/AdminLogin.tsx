import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileContainer from '@/components/layout/MobileContainer';
import { useAuth } from '@/hooks/useAuth';
import { ShieldAlert, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ShimmerButton } from "@/registry/magicui/shimmer-button";
import { useAuthContext } from '@/contexts/AuthContext';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [adminError, setAdminError] = useState<string | null>(null);
    const { signIn, loading, error: authError } = useAuth();
    const { session } = useAuthContext();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (session && !showSuccess) {
            const role = session.user.user_metadata?.role;
            if (role === 'admin') {
                navigate('/admin-dashboard', { replace: true });
            }
        }
    }, [session, showSuccess, navigate]);

    const handleAdminSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdminError(null);
        
        if (!email || !password) return;
        
        const result = await signIn(email, password);

        if (result) {
            const role = result.user?.user_metadata?.role;
            if (role === 'admin') {
                setShowSuccess(true);
                setTimeout(() => {
                    navigate('/admin-dashboard', { replace: true });
                }, 2000);
            } else {
                setAdminError('Acceso denegado. No tienes permisos de administrador.');
            }
        }
    };

    return (
        <MobileContainer className="p-6 relative overflow-hidden flex flex-col bg-white" showSidebars={false}>
            {/* Success Overlay */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-primary/95 backdrop-blur-md flex flex-col items-center justify-center"
                    >
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 12 }}
                            className="bg-white p-8 rounded-full shadow-2xl mb-6"
                        >
                            <CheckCircle className="w-20 h-20 text-primary" />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-white mb-2 font-roboto">Acceso Autorizado</h2>
                        <p className="text-white/70 text-center px-8 font-roboto">Entrando al panel de control central...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Back Button */}
            {/* Back button removed as requested */}

            {/* Admin Header Section */}
            <div className="flex flex-col items-center mb-10">
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-20 h-20 bg-primary/10 rounded-[32px] flex items-center justify-center shadow-sm mb-6 border border-primary/20"
                >
                    <ShieldAlert className="w-10 h-10 text-primary" />
                </motion.div>

                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-center"
                >
                    <h1 className="text-3xl font-bold text-black mb-1 font-roboto">Panel Admin</h1>
                    <p className="text-gray-400 text-sm font-roboto">Ingresa tus credenciales maestras</p>
                </motion.div>
            </div>

            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full flex-1"
            >
                {(authError || adminError) && (
                    <div className="bg-red-50 border border-red-100 p-4 rounded-2xl mb-6">
                        <p className="text-red-500 text-xs text-center font-bold font-roboto">
                            {adminError || authError}
                        </p>
                    </div>
                )}

                <form onSubmit={handleAdminSignIn} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-widest font-roboto">Email Administrador</label>
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="admin@campusmarket.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 font-roboto text-sm focus:border-primary focus:bg-white outline-none transition-all shadow-sm"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-widest font-roboto">Clave de Seguridad</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 font-roboto text-sm focus:border-primary focus:bg-white outline-none transition-all shadow-sm"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-primary"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-6">
                        <ShimmerButton
                            type="submit"
                            disabled={loading}
                            background="#0095f6"
                            className="w-full shadow-xl h-14 rounded-2xl"
                        >
                            <span className="text-center text-sm leading-none font-bold tracking-tight whitespace-pre-wrap text-white font-roboto">
                                {loading ? 'Validando...' : 'Autenticar Administrador'}
                            </span>
                        </ShimmerButton>
                    </div>
                </form>
            </motion.div>

            <div className="mt-auto py-6 text-center space-y-2">
                <p className="text-[10px] text-gray-400 font-roboto uppercase tracking-widest">
                    Sistema de Control de CampusMarket v1.0
                </p>
                <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-orange-400 uppercase tracking-[2px] bg-orange-50 py-1 px-3 rounded-full w-fit mx-auto border border-orange-100">
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
                    Sistema en Desarrollo
                </div>
            </div>
        </MobileContainer>
    );
}
