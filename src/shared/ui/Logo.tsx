import React from 'react';
import logoSrc from '@/assets/logo.png';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
  return (
    <img
      src={logoSrc}
      alt="Vortex"
      width={size}
      height={size}
      className={`select-none object-contain ${className}`}
      draggable={false}
    />
  );
};

export default Logo;
