import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileContainer from '@/components/layout/MobileContainer';
import { useAuth } from '@/hooks/useAuth';
import { ChevronLeft, Eye, EyeOff, ChevronDown } from 'lucide-react';
import logoUrl from '@/assets/logo.png';

export default function SignUp() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('usuario');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [acceptedPolicy, setAcceptedPolicy] = useState(false);

    const { signUp, loading, error } = useAuth();
    const navigate = useNavigate();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Las contraseñas no coinciden");
            return;
        }
        if (!acceptedPolicy) {
            alert("Debe aceptar las políticas para continuar");
            return;
        }
        await signUp(email, password, { data: { full_name: name, role } });
    };

    return (
        <MobileContainer className="bg-white p-6">
            {/* Back Button */}
            <div className="w-full mb-2">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-darkText/50 hover:text-darkText transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
            </div>

            {/* Logo Section */}
            <div className="flex flex-col items-center mb-6">
                <img src={logoUrl} alt="CampusMarket" className="w-[120px] h-auto object-contain mb-2" />
            </div>

            <div className="w-full flex-1 overflow-y-auto pb-4">
                {error && (
                    <p className="text-red-500 text-xs text-center mb-4">{error}</p>
                )}

                <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-darkText/60 ml-1">Nombre o emprendimiento</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Nombre o emprendimiento"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="minimalist-input"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-darkText/60 ml-1">Correo</label>
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="Correo"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="minimalist-input"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-darkText/60 ml-1">Emprendedor o usuario</label>
                        <div className="relative">
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="minimalist-input appearance-none"
                            >
                                <option value="usuario">Usuario</option>
                                <option value="emprendedor">Emprendedor</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-grayText pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-darkText/60 ml-1">Contraseña</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="minimalist-input pr-11"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-grayText"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-darkText/60 ml-1">Contraseña</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Contraseña"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="minimalist-input pr-11"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-grayText"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-1 pt-2">
                        <input
                            type="checkbox"
                            id="policy-signup"
                            checked={acceptedPolicy}
                            onChange={(e) => setAcceptedPolicy(e.target.checked)}
                            className="w-3 h-3 rounded-sm border-gray-300"
                        />
                        <label htmlFor="policy-signup" className="text-[9px] text-grayText">Aceptas las políticas</label>
                    </div>
                </form>
            </div>

            {/* Bottom Register Button */}
            <div className="w-full mt-auto pt-4">
                <button
                    onClick={handleSignUp}
                    disabled={loading}
                    className="btn-dark-blue"
                >
                    {loading ? 'Cargando...' : 'Log in'}
                </button>
            </div>
        </MobileContainer>
    );
}
