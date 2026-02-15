import React from 'react';

export const BrandIcon = ({ size = 32, className = "" }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <circle cx="50" cy="50" r="48" fill="#22c55e" />
        <path
            d="M35 40H60C62.7614 40 65 42.2386 65 45V65C65 67.7614 62.7614 70 60 70H35V40Z"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
        />
        <path
            d="M65 48C70 48 73 52 73 55C73 58 70 62 65 62"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
        />
        <rect x="40" y="32" width="3" height="6" rx="1.5" fill="white" />
        <rect x="48" y="32" width="3" height="6" rx="1.5" fill="white" />
        <rect x="56" y="32" width="3" height="6" rx="1.5" fill="white" />
    </svg>
);
