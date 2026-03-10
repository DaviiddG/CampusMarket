import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
    ({ className, type, label, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        const isPassword = type === 'password';

        return (
            <div className="flex flex-col w-full max-w-[320px]">
                {label && (
                    <label className="mb-1 text-[12px] font-inter text-grayDark">
                        {label}
                    </label>
                )}
                <div className="relative w-full">
                    <input
                        type={isPassword && showPassword ? 'text' : type}
                        className={cn(
                            "w-full h-[40px] px-[12px] bg-grayBase border-[0.5px] border-[#C5C5C5] rounded-[4px]",
                            "font-inter text-[12px] text-darkText placeholder:text-grayText",
                            "focus:border-primary focus:ring-1 focus:ring-primary transition-all",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-[12px] top-1/2 -translate-y-1/2 text-grayText hover:text-darkText transition-colors"
                        >
                            {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                        </button>
                    )}
                </div>
            </div>
        );
    }
);
TextField.displayName = 'TextField';

export default TextField;
