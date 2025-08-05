import React from 'react';
import { iconMapping, iconSizes, iconColors } from '@/app/utils/iconMapping';

// Özel X (Twitter) ikonu
const XIcon: React.FC<{ size?: number; color?: string; className?: string; onClick?: () => void }> = ({ 
  size = 24, 
  color = '#000000', 
  className = '',
  onClick 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    onClick={onClick}
    style={{ cursor: onClick ? 'pointer' : 'default' }}
  >
    <path
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      fill={color}
    />
  </svg>
);

interface IconProps {
  name: string;
  size?: keyof typeof iconSizes | number;
  color?: keyof typeof iconColors | string;
  className?: string;
  onClick?: () => void;
}

const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 'md', 
  color = 'black',
  className = '',
  onClick 
}) => {
  // Özel X ikonu için kontrol
  if (name === 'x-social') {
    const iconSize = typeof size === 'string' ? iconSizes[size] : size;
    const iconColor = typeof color === 'string' && iconColors[color as keyof typeof iconColors] 
      ? iconColors[color as keyof typeof iconColors] 
      : color;
    
    return (
      <XIcon
        size={iconSize}
        color={iconColor}
        className={className}
        onClick={onClick}
      />
    );
  }

  const IconComponent = iconMapping[name as keyof typeof iconMapping];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in iconMapping`);
    return null;
  }

  const iconSize = typeof size === 'string' ? iconSizes[size] : size;
  const iconColor = typeof color === 'string' && iconColors[color as keyof typeof iconColors] 
    ? iconColors[color as keyof typeof iconColors] 
    : color;

  return (
    <IconComponent
      size={iconSize}
      color={iconColor}
      className={className}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    />
  );
};

export default Icon; 