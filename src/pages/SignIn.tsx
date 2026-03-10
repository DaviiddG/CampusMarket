import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MobileContainer from '@/components/layout/MobileContainer';
import TextField from '@/components/ui/TextField';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { ChevronLeft } from 'lucide-react';
import logoUrl from '@/assets/logo.png';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { signIn, loading, error } = useAuth();
    const navigate = useNavigate();

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        const data = await signIn(email, password);
        if (data) {
            console.log('Logged in successfully');
            // navigate('/dashboard'); // Not defined in scope but standard next step
        }
    };

    return (
        <MobileContainer>
            {/* Header / Back Button */}
            <div className="w-full px-6 py-2 flex items-center relative z-10">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#969696] hover:text-darkText">
                    <ChevronLeft className="w-6 h-6" />
                </button>
            </div>

            {/* Logo Section */}
            <div className="absolute top-[60px] left-[50%] -translate-x-1/2 w-full flex justify-center">
                <img src={logoUrl} alt="CampusMarket Logo" className="w-[180px] h-auto object-contain drop-shadow-sm" />
            </div>

            <div className="flex-1 w-full px-[28px] mt-[120px]">
                {error && <p className="text-red-500 text-xs text-center mb-4">{error}</p>}

                <form onSubmit={handleEmailSignIn} className="flex flex-col gap-4">
                    <TextField
                        label="Correo o nombre de usuario"
                        type="email"
                        placeholder="Introduce tu correo"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        required
                        className="mb-2"
                    />

                    <TextField
                        label="Contraseña"
                        type="password"
                        placeholder="Introduce tu contraseña"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        required
                    />

                    <div className="flex w-full items-center justify-between px-2 mt-2">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="policy" className="w-[10px] h-[10px] bg-[#D9D9D9] border-none rounded-sm accent-primary" />
                            <label htmlFor="policy" className="text-[8px] font-inter text-grayDark">Aceptas las politicas</label>
                        </div>
                        <div className="flex gap-1 text-[8px] font-inter">
                            <span className="text-[#6D6D6D]">Olvidaste tu contraseña?</span>
                            <span className="text-[#23244F] font-medium cursor-pointer">Cambiar contraseña.</span>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col items-center w-full">
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading}
                            className="w-full h-[54px] text-lg font-semibold"
                        >
                            {loading ? 'Cargando...' : 'Iniciar sesión'}
                        </Button>
                    </div>
                </form>

                <div className="absolute bottom-0 left-0 w-full h-[45px] bg-[#F4F4F4] flex justify-center items-center gap-1 text-[12px] font-inter">
                    <span className="text-[#6B6B6B]">Listo para crear una cuenta?</span>
                    <Link to="/register" className="text-[#23244F] font-medium hover:underline">Registrarse.</Link>
                </div>
            </div>
        </MobileContainer>
    );
}
