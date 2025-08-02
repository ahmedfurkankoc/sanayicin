import React from 'react';
import { iconMapping, iconSizes, iconColors } from '@/app/utils/iconMapping';

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