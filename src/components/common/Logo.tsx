import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
    >
      <defs>
        <linearGradient id="stream-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" /> {/* Cyan 400 */}
          <stop offset="100%" stopColor="#0ea5e9" /> {/* Sky 500 */}
        </linearGradient>
        <linearGradient id="stream-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" /> {/* Sky 500 */}
          <stop offset="100%" stopColor="#2563eb" /> {/* Blue 600 */}
        </linearGradient>
        <linearGradient id="stream-gradient-3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" /> {/* Blue 600 */}
          <stop offset="100%" stopColor="#8b5cf6" /> {/* Violet 500 */}
        </linearGradient>
        
        <filter id="stream-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#stream-glow)">
        {/* Top sweeping ribbon */}
        <path
          d="M 32 72 
             C 30 55, 30 38, 35 30 
             C 40 22, 55 33, 76 46 
             C 71 42, 57 32, 45 32 
             C 38 32, 36 48, 36 62 Z"
          fill="url(#stream-gradient-1)"
        />

        {/* Bottom sweeping ribbon */}
        <path
          d="M 76 46 
             C 81 49, 81 51, 76 54 
             C 62 63, 44 71, 36 74 
             C 32 76, 31 71, 33 65 
             C 34 60, 42 55, 52 50 Z"
          fill="url(#stream-gradient-2)"
        />

        {/* Inner connector ribbon */}
        <path
          d="M 33 65 
             C 33 55, 33 45, 32 35 
             C 31 25, 36 28, 42 32 
             C 48 36, 48 42, 42 45 
             C 36 48, 35 58, 33 65 Z"
          fill="url(#stream-gradient-3)"
          opacity="0.9"
        />
      </g>
    </svg>
  );
};

export default Logo;
