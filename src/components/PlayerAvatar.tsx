import React from 'react';

interface PlayerAvatarProps {
  index: number;
  className?: string;
}

export default function PlayerAvatar({ index, className = "w-10 h-10" }: PlayerAvatarProps) {
  const styleIdx = index % 6;

  // We'll return 6 different minimalist inline SVG characters
  // Styles are clean, high contrast with gray/gold tones, no facial features as requested (mouth/nose omitted)
  switch (styleIdx) {
    case 0: // Short spiky hair with round glasses
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#1e1e24" stroke="#d4af37" strokeWidth="2" />
          {/* Head */}
          <circle cx="50" cy="53" r="26" fill="#fbcfe8" opacity="0.8" />
          {/* Spiky Hair */}
          <path d="M24 45L35 30L45 35L55 25L65 35L75 30L78 45" stroke="#d4af37" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="#b45309" />
          {/* Round Glasses */}
          <circle cx="40" cy="53" r="8" stroke="#d4af37" strokeWidth="3" fill="none" />
          <circle cx="60" cy="53" r="8" stroke="#d4af37" strokeWidth="3" fill="none" />
          <line x1="48" y1="53" x2="52" y2="53" stroke="#d4af37" strokeWidth="3" />
        </svg>
      );
    case 1: // Long curly hair
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#1e1e24" stroke="#d4af37" strokeWidth="2" />
          {/* Hair back */}
          <path d="M22 55C22 30 78 30 78 55C78 70 70 80 68 80C60 80 50 75 50 75C50 75 40 80 32 80C30 80 22 70 22 55Z" fill="#1e3a8a" opacity="0.9" />
          {/* Head */}
          <circle cx="50" cy="50" r="24" fill="#fde047" opacity="0.8" />
          {/* Hair details */}
          <path d="M26 40C32 25 68 25 74 40" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 2: // Baseball cap / Beanie
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#1e1e24" stroke="#d4af37" strokeWidth="2" />
          {/* Head */}
          <circle cx="50" cy="54" r="25" fill="#fdba74" opacity="0.8" />
          {/* Beanie / Cap */}
          <path d="M26 48C26 32 74 32 74 48H26Z" fill="#b91c1c" />
          {/* Cap Visor */}
          <path d="M20 48H80" stroke="#f87171" strokeWidth="5" strokeLinecap="round" />
          {/* Beanie top pin */}
          <circle cx="50" cy="30" r="4" fill="#f87171" />
        </svg>
      );
    case 3: // High volume sleek hair
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#1e1e24" stroke="#d4af37" strokeWidth="2" />
          {/* Head */}
          <circle cx="50" cy="54" r="25" fill="#a7f3d0" opacity="0.8" />
          {/* Big Hair top */}
          <path d="M25 45C25 20 75 20 75 45C75 45 65 38 50 38C35 38 25 45 25 45Z" fill="#047857" />
        </svg>
      );
    case 4: // Stylish headset
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#1e1e24" stroke="#d4af37" strokeWidth="2" />
          {/* Head */}
          <circle cx="50" cy="52" r="26" fill="#fed7aa" opacity="0.8" />
          {/* Flat Top hair */}
          <rect x="30" y="28" width="40" height="10" rx="3" fill="#065f46" />
          {/* Headset Band */}
          <path d="M22 50C22 22 78 22 78 50" stroke="#a1a1aa" strokeWidth="4" fill="none" />
          {/* Ear cups */}
          <rect x="18" y="44" width="8" height="16" rx="3" fill="#18181b" stroke="#d4af37" strokeWidth="1.5" />
          <rect x="74" y="44" width="8" height="16" rx="3" fill="#18181b" stroke="#d4af37" strokeWidth="1.5" />
        </svg>
      );
    case 5: // Hair bun with head band
    default:
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#1e1e24" stroke="#d4af37" strokeWidth="2" />
          {/* Top Bun */}
          <circle cx="50" cy="24" r="12" fill="#78350f" />
          {/* Head */}
          <circle cx="50" cy="54" r="25" fill="#e9d5ff" opacity="0.8" />
          {/* Hair sides */}
          <path d="M25 50C25 35 75 35 75 50" stroke="#78350f" strokeWidth="5" fill="none" />
          {/* Headband */}
          <path d="M26 44C32 40 68 40 74 44" stroke="#c084fc" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
  }
}
