import React from 'react';

interface MobileContainerProps {
    children: React.ReactNode;
    className?: string;
}

export default function MobileContainer({ children, className = "bg-white" }: MobileContainerProps) {
    return (
        <div className="min-h-screen w-full bg-white md:bg-static-mesh flex items-center justify-center p-0 md:p-8">
            <div
                className={`w-full min-h-screen md:min-h-0 md:max-w-md relative flex flex-col md:rounded-3xl md:shadow-[0_0_50px_rgba(0,0,0,0.1)] overflow-hidden ${className}`}
            >
                {/* Content wrapper */}
                <div className="flex-1 w-full flex flex-col items-center">
                    {children}
                </div>
            </div>
        </div>
    );
}
