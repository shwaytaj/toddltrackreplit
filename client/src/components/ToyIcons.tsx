interface ToyIconProps {
  className?: string;
}

export function ToyBuildingBlocks({ className = "w-16 h-16" }: ToyIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="8" y="32" width="14" height="14" rx="2" fill="#FF6B6B" stroke="#C92A2A" strokeWidth="1.5"/>
      <rect x="24" y="32" width="14" height="14" rx="2" fill="#4ECDC4" stroke="#0B7285" strokeWidth="1.5"/>
      <rect x="40" y="32" width="14" height="14" rx="2" fill="#FFE66D" stroke="#FAB005" strokeWidth="1.5"/>
      <rect x="16" y="18" width="14" height="14" rx="2" fill="#95E1D3" stroke="#0CA678" strokeWidth="1.5"/>
      <rect x="32" y="18" width="14" height="14" rx="2" fill="#A8DADC" stroke="#1864AB" strokeWidth="1.5"/>
      <rect x="24" y="4" width="14" height="14" rx="2" fill="#F9C74F" stroke="#E67700" strokeWidth="1.5"/>
      <circle cx="15" cy="39" r="2" fill="#FFF" opacity="0.5"/>
      <circle cx="31" cy="39" r="2" fill="#FFF" opacity="0.5"/>
      <circle cx="47" cy="39" r="2" fill="#FFF" opacity="0.5"/>
    </svg>
  );
}

export function ToyMusical({ className = "w-16 h-16" }: ToyIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <ellipse cx="32" cy="42" rx="18" ry="12" fill="#FF6B9D" stroke="#C92A60" strokeWidth="2"/>
      <ellipse cx="32" cy="38" rx="14" ry="9" fill="#FFB3D9"/>
      <rect x="28" y="12" width="8" height="28" rx="2" fill="#8B5A3C" stroke="#5C3D2E" strokeWidth="1.5"/>
      <circle cx="32" cy="12" r="5" fill="#FFD93D" stroke="#F4A261" strokeWidth="1.5"/>
      <path d="M 20 32 Q 24 28 28 32" stroke="#C92A60" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M 36 32 Q 40 28 44 32" stroke="#C92A60" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M 12 22 Q 14 20 16 22 M 48 22 Q 50 20 52 22" stroke="#4ECDC4" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="14" cy="24" r="1.5" fill="#4ECDC4"/>
      <circle cx="50" cy="24" r="1.5" fill="#4ECDC4"/>
    </svg>
  );
}

export function ToyPuzzle({ className = "w-16 h-16" }: ToyIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M 12 12 L 30 12 Q 30 8 34 8 Q 38 8 38 12 L 52 12 L 52 26 Q 56 26 56 30 Q 56 34 52 34 L 52 52 L 38 52 Q 38 56 34 56 Q 30 56 30 52 L 12 52 L 12 38 Q 8 38 8 34 Q 8 30 12 30 Z" fill="#6BCF7F" stroke="#2F9E4F" strokeWidth="1.5"/>
      <path d="M 30 12 L 30 30 L 12 30 L 12 12 Z" fill="#4ECDC4" stroke="#0B7285" strokeWidth="1.5"/>
      <path d="M 38 12 L 52 12 L 52 26 Q 56 26 56 30 Q 56 34 52 34 L 52 34 L 38 34 Q 38 30 34 30 Q 30 30 30 34 L 30 12 Q 30 8 34 8 Q 38 8 38 12 Z" fill="#FFB84D" stroke="#E67700" strokeWidth="1.5"/>
      <path d="M 12 38 L 12 52 L 30 52 Q 30 56 34 56 Q 38 56 38 52 L 38 38 Q 38 34 34 34 Q 30 34 30 38 L 12 38 Q 8 38 8 34 Q 8 30 12 30 L 12 38 Z" fill="#F06292" stroke="#C2185B" strokeWidth="1.5"/>
      <path d="M 38 52 L 52 52 L 52 34 L 38 34 Z" fill="#9575CD" stroke="#5E35B1" strokeWidth="1.5"/>
    </svg>
  );
}

export function ToyBook({ className = "w-16 h-16" }: ToyIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="14" y="10" width="36" height="44" rx="2" fill="#4ECDC4" stroke="#0B7285" strokeWidth="2"/>
      <rect x="14" y="10" width="18" height="44" fill="#63D9D1"/>
      <path d="M 32 10 L 32 54" stroke="#0B7285" strokeWidth="2"/>
      <rect x="18" y="16" width="10" height="2" rx="1" fill="#FFF"/>
      <rect x="18" y="22" width="10" height="2" rx="1" fill="#FFF"/>
      <rect x="18" y="28" width="10" height="2" rx="1" fill="#FFF"/>
      <rect x="36" y="16" width="10" height="2" rx="1" fill="#FFF"/>
      <rect x="36" y="22" width="10" height="2" rx="1" fill="#FFF"/>
      <rect x="36" y="28" width="10" height="2" rx="1" fill="#FFF"/>
      <circle cx="25" cy="40" r="4" fill="#FFE66D" stroke="#FAB005" strokeWidth="1"/>
      <path d="M 23 40 L 24 41 L 27 38" stroke="#FAB005" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

export function ToyArt({ className = "w-16 h-16" }: ToyIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <ellipse cx="28" cy="38" rx="16" ry="18" fill="#F9F9F9" stroke="#999" strokeWidth="2"/>
      <ellipse cx="28" cy="32" rx="12" ry="10" fill="#FFF"/>
      <rect x="24" y="8" width="8" height="26" fill="#E67700" stroke="#CC6600" strokeWidth="1.5"/>
      <circle cx="15" cy="28" r="4" fill="#FF6B6B"/>
      <circle cx="28" cy="25" r="4" fill="#4ECDC4"/>
      <circle cx="41" cy="28" r="4" fill="#FFE66D"/>
      <circle cx="22" cy="36" r="4" fill="#95E1D3"/>
      <circle cx="34" cy="36" r="4" fill="#F9C74F"/>
      <path d="M 44 16 Q 46 10 50 8 L 52 12 Q 50 14 48 16 L 54 28 L 48 32 Z" fill="#8B5A3C" stroke="#5C3D2E" strokeWidth="1.5"/>
      <ellipse cx="50" cy="24" rx="5" ry="8" fill="#FFB3D9" opacity="0.7"/>
    </svg>
  );
}

export function ToyPlush({ className = "w-16 h-16" }: ToyIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <ellipse cx="32" cy="38" rx="16" ry="18" fill="#F4A6D7" stroke="#E91E63" strokeWidth="2"/>
      <circle cx="22" cy="24" r="6" fill="#F4A6D7" stroke="#E91E63" strokeWidth="2"/>
      <circle cx="42" cy="24" r="6" fill="#F4A6D7" stroke="#E91E63" strokeWidth="2"/>
      <circle cx="32" cy="26" r="14" fill="#FFB3D9" stroke="#E91E63" strokeWidth="2"/>
      <circle cx="27" cy="24" r="2.5" fill="#000"/>
      <circle cx="37" cy="24" r="2.5" fill="#000"/>
      <circle cx="26" cy="23" r="0.8" fill="#FFF"/>
      <circle cx="36" cy="23" r="0.8" fill="#FFF"/>
      <path d="M 28 30 Q 32 33 36 30" stroke="#000" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <ellipse cx="32" cy="32" rx="2" ry="1.5" fill="#FFB3D9"/>
      <path d="M 16 46 Q 14 48 16 52 L 20 54 Q 22 50 20 46 Z" fill="#F4A6D7" stroke="#E91E63" strokeWidth="1.5"/>
      <path d="M 48 46 Q 50 48 48 52 L 44 54 Q 42 50 44 46 Z" fill="#F4A6D7" stroke="#E91E63" strokeWidth="1.5"/>
      <circle cx="24" cy="20" r="1.5" fill="#FF69B4"/>
      <circle cx="40" cy="20" r="1.5" fill="#FF69B4"/>
    </svg>
  );
}

export function ToyBall({ className = "w-16 h-16" }: ToyIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="32" cy="32" r="20" fill="#FF6B6B" stroke="#C92A2A" strokeWidth="2"/>
      <path d="M 32 12 Q 42 22 32 32 Q 22 22 32 12 Z" fill="#FFF" opacity="0.3"/>
      <path d="M 52 32 Q 42 42 32 32 Q 42 22 52 32 Z" fill="#FFF" opacity="0.3"/>
      <path d="M 32 52 Q 22 42 32 32 Q 42 42 32 52 Z" fill="#FFF" opacity="0.3"/>
      <path d="M 12 32 Q 22 22 32 32 Q 22 42 12 32 Z" fill="#FFF" opacity="0.3"/>
      <circle cx="32" cy="32" r="20" fill="none" stroke="#C92A2A" strokeWidth="2"/>
      <path d="M 32 12 C 32 12 38 20 32 32 C 32 32 26 20 32 12" stroke="#C92A2A" strokeWidth="1.5" fill="none"/>
      <path d="M 52 32 C 52 32 44 38 32 32 C 32 32 44 26 52 32" stroke="#C92A2A" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

export function ToySensory({ className = "w-16 h-16" }: ToyIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="32" cy="32" r="18" fill="#FFE66D" stroke="#FAB005" strokeWidth="2"/>
      <circle cx="32" cy="32" r="14" fill="#FFF" opacity="0.3"/>
      <circle cx="22" cy="24" r="3" fill="#FF6B6B"/>
      <circle cx="32" cy="22" r="3" fill="#4ECDC4"/>
      <circle cx="42" cy="24" r="3" fill="#95E1D3"/>
      <circle cx="24" cy="32" r="3" fill="#F9C74F"/>
      <circle cx="40" cy="32" r="3" fill="#A8DADC"/>
      <circle cx="22" cy="40" r="3" fill="#9575CD"/>
      <circle cx="32" cy="42" r="3" fill="#FFB3D9"/>
      <circle cx="42" cy="40" r="3" fill="#6BCF7F"/>
      <path d="M 28 28 L 36 36 M 28 36 L 36 28" stroke="#FAB005" strokeWidth="2" opacity="0.3"/>
      <circle cx="32" cy="32" r="4" fill="#FFF" opacity="0.5"/>
    </svg>
  );
}

export function ToySorting({ className = "w-16 h-16" }: ToyIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="8" y="38" width="48" height="18" rx="2" fill="#8B5A3C" stroke="#5C3D2E" strokeWidth="2"/>
      <rect x="12" y="42" width="12" height="10" rx="1" fill="#FF6B6B" stroke="#C92A2A" strokeWidth="1"/>
      <rect x="26" y="42" width="12" height="10" rx="1" fill="#4ECDC4" stroke="#0B7285" strokeWidth="1"/>
      <rect x="40" y="42" width="12" height="10" rx="1" fill="#FFE66D" stroke="#FAB005" strokeWidth="1"/>
      <circle cx="28" cy="22" r="6" fill="#FF6B6B" stroke="#C92A2A" strokeWidth="1.5"/>
      <rect x="36" y="16" width="12" height="12" rx="1" fill="#4ECDC4" stroke="#0B7285" strokeWidth="1.5"/>
      <path d="M 14 8 L 20 8 L 17 14 Z" fill="#FFE66D" stroke="#FAB005" strokeWidth="1.5"/>
      <path d="M 28 30 L 28 36 M 26 34 L 28 36 L 30 34" stroke="#FF6B6B" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M 42 30 L 42 36 M 40 34 L 42 36 L 44 34" stroke="#4ECDC4" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function ToyPushPull({ className = "w-16 h-16" }: ToyIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="16" y="20" width="24" height="16" rx="2" fill="#4ECDC4" stroke="#0B7285" strokeWidth="2"/>
      <rect x="20" y="24" width="16" height="8" rx="1" fill="#FFF" opacity="0.3"/>
      <circle cx="22" cy="44" r="6" fill="#5C3D2E" stroke="#3D2817" strokeWidth="2"/>
      <circle cx="22" cy="44" r="3" fill="#FFF" opacity="0.3"/>
      <circle cx="34" cy="44" r="6" fill="#5C3D2E" stroke="#3D2817" strokeWidth="2"/>
      <circle cx="34" cy="44" r="3" fill="#FFF" opacity="0.3"/>
      <path d="M 40 24 L 52 12 M 52 12 L 48 12 M 52 12 L 52 16" stroke="#E67700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="24" y="16" width="8" height="4" rx="1" fill="#FF6B6B" stroke="#C92A2A" strokeWidth="1"/>
      <circle cx="28" cy="14" r="1.5" fill="#FFE66D"/>
    </svg>
  );
}

export function ToyGeneric({ className = "w-16 h-16" }: ToyIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="12" y="12" width="40" height="40" rx="4" fill="#A8DADC" stroke="#457B9D" strokeWidth="2"/>
      <circle cx="32" cy="32" r="12" fill="#F9C74F" stroke="#F3722C" strokeWidth="2"/>
      <circle cx="32" cy="32" r="6" fill="#FFF" opacity="0.5"/>
      <rect x="18" y="18" width="8" height="8" rx="1" fill="#FF6B6B"/>
      <circle cx="46" cy="22" r="4" fill="#4ECDC4"/>
      <path d="M 18 46 L 26 46 L 22 40 Z" fill="#95E1D3"/>
      <rect x="38" y="42" width="8" height="8" rx="1" fill="#FFB3D9"/>
      <path d="M 28 24 L 28 20 L 32 20 L 32 24 M 30 20 L 30 16" stroke="#F3722C" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export type ToyCategory = 
  | 'building'
  | 'musical'
  | 'puzzle'
  | 'book'
  | 'art'
  | 'plush'
  | 'ball'
  | 'sensory'
  | 'sorting'
  | 'push-pull'
  | 'generic';

export const ToyIconMap: Record<ToyCategory, React.ComponentType<ToyIconProps>> = {
  'building': ToyBuildingBlocks,
  'musical': ToyMusical,
  'puzzle': ToyPuzzle,
  'book': ToyBook,
  'art': ToyArt,
  'plush': ToyPlush,
  'ball': ToyBall,
  'sensory': ToySensory,
  'sorting': ToySorting,
  'push-pull': ToyPushPull,
  'generic': ToyGeneric,
};

export function categorizeToy(toyName: string, searchQuery: string = ''): ToyCategory {
  const text = `${toyName} ${searchQuery}`.toLowerCase();
  
  // Building/Construction toys
  if (text.match(/block|lego|duplo|build|construction|stack|tower/i)) {
    return 'building';
  }
  
  // Musical toys
  if (text.match(/music|drum|piano|xylophone|instrument|guitar|bell|rattle|sound|sing/i)) {
    return 'musical';
  }
  
  // Puzzles
  if (text.match(/puzzle|jigsaw|match|shape|sorter/i)) {
    return 'puzzle';
  }
  
  // Books
  if (text.match(/book|story|read|picture book|board book/i)) {
    return 'book';
  }
  
  // Art supplies
  if (text.match(/crayon|paint|draw|art|color|marker|chalk|clay|dough|playdough/i)) {
    return 'art';
  }
  
  // Plush/Stuffed toys
  if (text.match(/plush|stuffed|teddy|bear|soft toy|doll/i)) {
    return 'plush';
  }
  
  // Balls and active play
  if (text.match(/ball|kick|throw|bounce|sport/i)) {
    return 'ball';
  }
  
  // Sensory toys
  if (text.match(/sensory|texture|fidget|squeeze|touch|feel/i)) {
    return 'sensory';
  }
  
  // Sorting/Stacking toys
  if (text.match(/sort|stack|nest|ring|cup/i)) {
    return 'sorting';
  }
  
  // Push/Pull toys
  if (text.match(/push|pull|walk|wheel|car|truck|wagon|walker/i)) {
    return 'push-pull';
  }
  
  return 'generic';
}

export function getToyIcon(toyName: string, searchQuery: string = '') {
  const category = categorizeToy(toyName, searchQuery);
  return ToyIconMap[category];
}
