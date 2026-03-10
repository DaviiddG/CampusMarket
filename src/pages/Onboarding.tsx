import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileContainer from '@/components/layout/MobileContainer';
import logoUrl from '@/assets/logo.png';
import productosUrl from '@/assets/productos.jpg';
import calificarUrl from '@/assets/calificar.png';
import { TextAnimate } from '@/components/magicui/text-animate';

// Define the steps data based on Figma "Pagina inicial 1, 2, 3"
const ONBOARDING_STEPS = [
    {
        title: "CampusMarket conecta a emprendedores con personas interesadas en apoyar sus productos.",
        titleClass: "text-[#2F2E41]",
    },
    {
        title: "Explora productos creados por estudiantes, conoce nuevas ideas y apoya los proyectos de la comunidad universitaria.",
        titleClass: "text-[#2F2E41] w-[303px]",
    },
    {
        title: "Califica, comenta y descubre productos únicos mientras apoyas el crecimiento de los emprendedores del campus.",
        titleClass: "text-[#2F2E41] w-[353px]",
    }
];

export default function Onboarding() {
    const [step, setStep] = useState(0);
    const navigate = useNavigate();

    const handleNext = () => {
        if (step < 2) {
            setStep(step + 1);
        } else {
            navigate('/development', { replace: true });
        }
    };

    return (
        <MobileContainer>
            {/* Hidden button area just to trigger navigation on tap */}
            <div className="absolute inset-0 z-10" onClick={handleNext}></div>

            {/* Centered content */}
            <div className="flex flex-col items-center justify-center gap-6 w-full px-6 py-8">
                {/* Visual Image */}
                <div className="relative w-full h-[260px] flex justify-center items-center">
                    {step === 0 && (
                        <div className="w-[220px] h-[220px] flex justify-center items-center">
                            <img src={logoUrl} alt="CampusMarket Logo" className="w-full h-auto object-contain drop-shadow-md" />
                        </div>
                    )}
                    {step === 1 && (
                        <div className="w-[260px] h-[260px] bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center overflow-hidden">
                            <img src={productosUrl} alt="Productos" className="w-full h-full object-cover" />
                        </div>
                    )}
                    {step === 2 && (
                        <div className="w-[260px] h-[260px] bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center overflow-hidden">
                            <img src={calificarUrl} alt="Calificar" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>

                {/* Title Text */}
                <div className="flex flex-col items-center w-full">
                    <TextAnimate
                        key={step}
                        animation="blurIn"
                        as="h2"
                        by="word"
                        startOnView={false}
                        className={`font-poppins font-normal text-[21.5px] leading-[32px] text-center transition-all ${ONBOARDING_STEPS[step].titleClass}`}
                    >
                        {ONBOARDING_STEPS[step].title}
                    </TextAnimate>
                </div>

                {/* Pagination Dots */}
                <div className="flex justify-center items-center gap-[7px] mt-2">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className={`rounded-full transition-all duration-300 ${step === i
                                ? 'w-[10px] h-[10px] bg-soft-gradient shadow-[0_0_5px_rgba(154,215,243,0.8)]'
                                : 'w-[5px] h-[5px] bg-black'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </MobileContainer>
    );
}
