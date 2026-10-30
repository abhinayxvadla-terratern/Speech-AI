import React from 'react';
import logoEmblem from '../../assets/logo-emblem.png';
import logoFull from '../../assets/logo-full.png';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'emblem' | 'full';
  className?: string;
  alt?: string;
}

const SIZE_MAP: Record<string, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
};

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  variant = 'emblem',
  className = '',
  alt = 'SpeechAI Logo',
}) => {
  const src = variant === 'full' ? logoFull : logoEmblem;
  const sizeClass = typeof size === 'string' ? SIZE_MAP[size] || 'w-10 h-10' : '';
  const inlineStyle = typeof size === 'number' ? { width: size, height: size } : undefined;

  return (
    <img
      src={src}
      alt={alt}
      style={inlineStyle}
      className={`object-contain shrink-0 select-none ${sizeClass} ${className}`}
      loading="eager"
      decoding="async"
    />
  );
};
