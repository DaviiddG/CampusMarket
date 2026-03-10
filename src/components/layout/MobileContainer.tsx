import React from 'react';

interface MobileContainerProps {
    children: React.ReactNode;
    className?: string;
}

export default function MobileContainer({ children, className = "bg-white" }: MobileContainerProps) {
    return (
        <div className="min-h-screen w-full bg-black md:bg-static-mesh flex items-center justify-center p-4 py-8 md:p-8">
            <div
                className={`w-full h-full min-h-[600px] max-w-md relative flex flex-col rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.4)] md:shadow-[0_0_50px_rgba(0,0,0,0.1)] overflow-hidden ${className}`}
            >
                {/* Content wrapper */}
                <div className="flex-1 w-full flex flex-col items-center">
                    {children}
                </div>
            </div>
        </div>
    );
}
