import React from 'react';
import { cn } from '@/lib/utils';
import Button from './Button';

interface SocialButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    provider: 'facebook' | 'google'; // Extensible for later
    children: React.ReactNode;
}

export default function SocialButton({ provider, children, className, ...props }: SocialButtonProps) {
    return (
        <Button
            variant="primary"
            className={cn("bg-[#1877F2] shadow-[0px_2.5px_5px_rgba(0,0,0,0.1)] gap-2", className)}
            {...props}
        >
            {/* Basic Facebook SVG icon to match Figma "FB" text/icon */}
            {provider === 'facebook' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px]">
                    <path d="M22.675 0H1.325C0.593 0 0 0.593 0 1.325V22.676C0 23.407 0.593 24 1.325 24H12.82V14.706H9.692V11.084H12.82V8.413C12.82 5.313 14.713 3.625 17.479 3.625C18.804 3.625 19.942 3.724 20.274 3.768V7.008L18.356 7.009C16.852 7.009 16.561 7.724 16.561 8.772V11.085H20.148L19.681 14.707H16.561V24H22.677C23.407 24 24 23.407 24 22.675V1.325C24 0.593 23.407 0 22.675 0Z" />
                </svg>
            )}
            <span className="font-medium text-[13px]">{children}</span>
        </Button>
    );
}
