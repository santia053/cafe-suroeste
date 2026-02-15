import React from 'react';
import Link from 'next/link';
import { BrandIcon } from './BrandIcon';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    variant?: 'white' | 'brand';
}

export const Logo: React.FC<LogoProps> = ({
    size = 'md',
    className = '',
    variant = 'brand'
}) => {
    const iconSizes = {
        sm: 14,
        md: 18,
        lg: 24,
        xl: 32
    };

    const fontSizes = {
        sm: 'text-sm',
        md: 'text-lg',
        lg: 'text-2xl',
        xl: 'text-4xl'
    };

    const containerPadding = {
        sm: 'p-1.5',
        md: 'p-2',
        lg: 'p-2.5',
        xl: 'p-3'
    };

    const borderRadius = {
        sm: 'rounded-lg',
        md: 'rounded-xl',
        lg: 'rounded-2xl',
        xl: 'rounded-[20px]'
    };

    return (
        <Link
            href="/"
            className={`flex items-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98] group ${className}`}
        >
            <div className={`
                flex items-center justify-center
                transition-all duration-300
                group-hover:shadow-brand-primary/40
                group-hover:-rotate-6
            `}>
                <BrandIcon size={iconSizes[size] * 2.2} />
            </div>
            <div className="flex flex-col leading-none">
                <span className={`
                    ${fontSizes[size]} 
                    font-black tracking-tighter text-white uppercase
                `}>
                    CAFÉ<span className="text-brand-primary italic ml-0.5">SUROESTE</span>
                </span>
                {size === 'xl' && (
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.4em] mt-1 ml-0.5">
                        Selección Premium
                    </span>
                )}
            </div>
        </Link>
    );
};
