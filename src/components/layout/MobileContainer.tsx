import React from 'react';

interface MobileContainerProps {
    children: React.ReactNode;
    className?: string;
}

export default function MobileContainer({ children, className = "bg-white" }: MobileContainerProps) {
    return (
        <div className={`w-full h-full min-h-[100dvh] relative overflow-x-hidden flex flex-col ${className}`}>
            {/* Content wrapper */}
            <div className="flex-1 w-full h-full flex flex-col items-center">
                {children}
            </div>
        </div>
    );
}
