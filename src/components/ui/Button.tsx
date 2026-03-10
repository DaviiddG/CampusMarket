import React from 'react';
import { cn } from '@/lib/utils'; // We'll create a simple merge utility

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    fullWidth?: boolean;
}

export default function Button({
    className,
    variant = 'primary',
    fullWidth = true,
    children,
    ...props
}: ButtonProps) {

    const baseStyles = "h-[42px] px-4 rounded-[5px] font-inter font-medium text-[13px] leading-[16px] text-center flex items-center justify-center transition-all duration-200";

    const variants = {
        primary: "bg-primary text-white shadow-[0px_4px_8px_rgba(0,0,0,0.1)] active:scale-[0.98]",
        secondary: "bg-secondary bg-opacity-60 text-primary text-opacity-30 active:scale-[0.98]", // Figma: rgba(154, 215, 243, 0.6) and text rgba(16, 32, 66, 0.3)
        ghost: "bg-transparent text-grayDark" // Simple ghost button
    };

    return (
        <button
            className={cn(
                baseStyles,
                variants[variant],
                fullWidth ? "w-full max-w-[315px]" : "", // Max 315px as per figma
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
