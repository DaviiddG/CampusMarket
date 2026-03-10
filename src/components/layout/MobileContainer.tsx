import React from 'react';

interface MobileContainerProps {
    children: React.ReactNode;
}

export default function MobileContainer({ children }: MobileContainerProps) {
    return (
        <div className="w-full h-full min-h-[100dvh] bg-white relative overflow-x-hidden flex flex-col">
            {/* Content wrapper */}
            <div className="flex-1 w-full h-full flex flex-col items-center">
                {children}
            </div>
        </div>
    );
}
