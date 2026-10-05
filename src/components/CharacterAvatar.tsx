import React, { useState } from 'react';
import { getCharacterAvatarUrl, getCharacterFallbackBadge, ASTRALYS_ELEMENT_COLORS } from '../data/characters';
import { ElementType } from '../types/er';

interface CharacterAvatarProps {
  name: string;
  element?: ElementType | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showElementDot?: boolean;
  showBorder?: boolean;
}

const SIZE_MAP = {
  xs: 'w-6 h-6 text-[9px]',
  sm: 'w-8 h-8 text-[11px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-16 h-16 text-base',
};

const DOT_SIZE_MAP = {
  xs: 'w-2 h-2',
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-3.5 h-3.5',
  xl: 'w-4 h-4',
};

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  name,
  element,
  size = 'md',
  className = '',
  showElementDot = true,
  showBorder = true,
}) => {
  const [hasError, setHasError] = useState(false);
  const avatarUrl = getCharacterAvatarUrl(name);
  const fallback = getCharacterFallbackBadge(name);

  // Determine element color
  const matchedElement = (element as ElementType) || fallback.element || 'None';
  const elemColors = ASTRALYS_ELEMENT_COLORS[matchedElement] || ASTRALYS_ELEMENT_COLORS.None;

  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const dotSizeClass = DOT_SIZE_MAP[size] || DOT_SIZE_MAP.md;

  return (
    <div 
      className={`relative rounded-full flex-shrink-0 flex items-center justify-center font-bold uppercase select-none shadow-md overflow-hidden ${sizeClass} ${className}`}
      style={{
        border: showBorder ? `2px solid ${elemColors.border}` : undefined,
        background: elemColors.bgGradient,
        boxShadow: showBorder ? `0 0 10px ${elemColors.glow}` : undefined,
      }}
      title={name}
    >
      {!hasError && avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          crossOrigin="anonymous"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover object-top scale-110 transition-transform duration-200"
          loading="lazy"
        />
      ) : (
        <span 
          className="font-black tracking-tight"
          style={{ color: elemColors.tint }}
        >
          {fallback.initials}
        </span>
      )}

      {/* Elemental Dot Badge */}
      {showElementDot && (
        <div 
          className={`absolute bottom-0 right-0 rounded-full border border-slate-950 shadow-sm ${dotSizeClass}`}
          style={{ 
            backgroundColor: elemColors.hex,
            boxShadow: `0 0 4px ${elemColors.hex}`
          }}
          title={matchedElement}
        />
      )}
    </div>
  );
};
