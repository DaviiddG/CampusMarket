import React from 'react';

interface MobileContainerProps {
    children: React.ReactNode;
    className?: string;
}

export default function MobileContainer({ children, className = "bg-white" }: MobileContainerProps) {
    return (
        <div className="min-h-[100dvh] w-full bg-[#F3F3F3] flex items-center justify-center sm:py-8">
            <div
                className={`w-full max-w-[480px] h-full sm:h-[900px] sm:max-h-[90vh] relative overflow-x-hidden flex flex-col sm:rounded-[2.5rem] sm:shadow-2xl sm:border-[8px] sm:border-gray-900 overflow-hidden ${className}`}
                style={{
                    // On mobile, force full height. On desktop, let it use the tailwind constraints above.
                    minHeight: '100%',
                }}
            >
                {/* Content wrapper */}
                <div className="flex-1 w-full h-full flex flex-col items-center">
                    {children}
                </div>
            </div>
        </div>
    );
}
