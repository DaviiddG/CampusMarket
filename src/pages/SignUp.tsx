import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MobileContainer from '@/components/layout/MobileContainer';
import TextField from '@/components/ui/TextField';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { ChevronLeft } from 'lucide-react';
import logoUrl from '@/assets/logo.png';

export default function SignUp() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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
        const data = await signUp(email, password, { data: { full_name: name } });
        if (data) {
            console.log('Registered successfully');
            navigate('/login');
        }
    };

    return (
        <MobileContainer>
            <div className="w-full px-6 py-2 flex items-center relative z-10">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#969696] hover:text-darkText">
                    <ChevronLeft className="w-6 h-6" />
                </button>
            </div>

            {/* Decorative Image */}
            <div className="flex w-full justify-center mt-2 mb-4">
                <img src={logoUrl} alt="CampusMarket Logo" className="w-[160px] h-auto object-contain drop-shadow-md" />
            </div>

            <div className="flex-1 w-full px-[28px] mt-[40px] flex flex-col items-center">
                {error && <p className="text-red-500 text-xs text-center mb-4">{error}</p>}

                <form onSubmit={handleSignUp} className="flex flex-col gap-4 w-full">
                    <TextField
                        label="Nombre o emprendimiento"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                        required
                    />
                    <TextField
                        label="Correo"
                        type="email"
                        placeholder="tucorreo@campus.com"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        required
                    />
                    <TextField
                        label="Contraseña"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        required
                    />
                    <TextField
                        label="Confirmar contraseña"
                        type="password"
                        placeholder="Vuelve a escribir la contraseña"
                        value={confirmPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                        required
                    />

                    <div className="flex w-full items-center gap-2 px-2 mt-2">
                        <input
                            type="checkbox"
                            id="policy_signup"
                            className="w-[10px] h-[10px] bg-[#D9D9D9] border-none rounded-sm accent-primary"
                            checked={acceptedPolicy}
                            onChange={(e) => setAcceptedPolicy(e.target.checked)}
                        />
                        <label htmlFor="policy_signup" className="text-[8px] font-inter text-grayDark">
                            Aceptas las politicas
                        </label>
                    </div>

                    <div className="mt-8 flex flex-col items-center w-full">
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading}
                            className="w-full h-[54px] text-lg font-semibold"
                        >
                            {loading ? 'Cargando...' : 'Registrarse'}
                        </Button>
                    </div>
                </form>
            </div>

            <div className="mt-auto w-full h-[45px] bg-[#F4F4F4] flex justify-center items-center gap-1 text-[12px] font-inter">
                <span className="text-[#6B6B6B]">Ya tienes una cuenta?</span>
                <Link to="/login" className="text-[#23244F] font-medium hover:underline">Iniciar Sesión.</Link>
            </div>
        </MobileContainer>
    );
}
