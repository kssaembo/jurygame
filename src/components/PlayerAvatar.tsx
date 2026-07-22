import React from 'react';

interface PlayerAvatarProps {
  index: number;
  className?: string;
}

export default function PlayerAvatar({ index, className = "w-10 h-10" }: PlayerAvatarProps) {
  const styleIdx = index % 16;

  switch (styleIdx) {
    case 0: // Spiky hair with round gold glasses
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#18181b" stroke="#d4af37" strokeWidth="2.5" />
          <circle cx="50" cy="53" r="26" fill="#fbcfe8" />
          <path d="M24 45L35 28L45 34L55 22L65 34L75 28L78 45" stroke="#d4af37" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="#b45309" />
          <circle cx="40" cy="53" r="8" stroke="#d4af37" strokeWidth="3" fill="none" />
          <circle cx="60" cy="53" r="8" stroke="#d4af37" strokeWidth="3" fill="none" />
          <line x1="48" y1="53" x2="52" y2="53" stroke="#d4af37" strokeWidth="3" />
        </svg>
      );
    case 1: // Long hair with blue headband
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#0f172a" stroke="#3b82f6" strokeWidth="2.5" />
          <path d="M22 55C22 28 78 28 78 55C78 72 70 82 68 82C60 82 50 76 50 76C50 76 40 82 32 82C30 82 22 72 22 55Z" fill="#1e3a8a" />
          <circle cx="50" cy="50" r="24" fill="#fde047" />
          <path d="M26 40C32 25 68 25 74 40" stroke="#60a5fa" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );
    case 2: // Baseball Red Cap & Visor
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#1c1917" stroke="#ef4444" strokeWidth="2.5" />
          <circle cx="50" cy="54" r="25" fill="#fdba74" />
          <path d="M26 48C26 30 74 30 74 48H26Z" fill="#b91c1c" />
          <path d="M20 48H80" stroke="#f87171" strokeWidth="5" strokeLinecap="round" />
          <circle cx="50" cy="30" r="4" fill="#f87171" />
        </svg>
      );
    case 3: // Emerald Short Crop & Square Glasses
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#064e3b" stroke="#10b981" strokeWidth="2.5" />
          <circle cx="50" cy="54" r="25" fill="#a7f3d0" />
          <path d="M25 45C25 20 75 20 75 45C75 45 65 38 50 38C35 38 25 45 25 45Z" fill="#047857" />
          <rect x="32" y="48" width="14" height="10" rx="2" stroke="#10b981" strokeWidth="2.5" fill="none" />
          <rect x="54" y="48" width="14" height="10" rx="2" stroke="#10b981" strokeWidth="2.5" fill="none" />
          <line x1="46" y1="53" x2="54" y2="53" stroke="#10b981" strokeWidth="2.5" />
        </svg>
      );
    case 4: // Gaming Headset & Flat Hair
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#18181b" stroke="#8b5cf6" strokeWidth="2.5" />
          <circle cx="50" cy="52" r="26" fill="#fed7aa" />
          <rect x="30" y="28" width="40" height="12" rx="4" fill="#581c87" />
          <path d="M22 50C22 22 78 22 78 50" stroke="#a78bfa" strokeWidth="4" fill="none" />
          <rect x="18" y="44" width="8" height="16" rx="3" fill="#18181b" stroke="#c084fc" strokeWidth="2" />
          <rect x="74" y="44" width="8" height="16" rx="3" fill="#18181b" stroke="#c084fc" strokeWidth="2" />
        </svg>
      );
    case 5: // Top Bun & Purple Band
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#31103f" stroke="#c084fc" strokeWidth="2.5" />
          <circle cx="50" cy="22" r="13" fill="#78350f" />
          <circle cx="50" cy="54" r="25" fill="#e9d5ff" />
          <path d="M25 50C25 35 75 35 75 50" stroke="#78350f" strokeWidth="5" fill="none" />
          <path d="M26 44C32 40 68 40 74 44" stroke="#c084fc" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 6: // Detective Fedora Hat
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#18181b" stroke="#f59e0b" strokeWidth="2.5" />
          <circle cx="50" cy="56" r="24" fill="#fef08a" />
          {/* Hat base */}
          <ellipse cx="50" cy="42" rx="32" ry="7" fill="#78350f" />
          {/* Hat crown */}
          <path d="M30 42L35 22C40 20 60 20 65 22L70 42Z" fill="#451a03" />
          <rect x="34" y="36" width="32" height="5" fill="#d4af37" />
        </svg>
      );
    case 7: // Cute Beret & Side Bangs
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#1e1b4b" stroke="#ec4899" strokeWidth="2.5" />
          <circle cx="50" cy="54" r="24" fill="#fce7f3" />
          <path d="M20 40C20 28 80 25 76 38C72 50 30 48 20 40Z" fill="#be185d" />
          <circle cx="70" cy="26" r="4" fill="#f472b6" />
          <path d="M26 44C30 52 35 55 35 55" stroke="#be185d" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 8: // Crown & Royal Hair
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#2e1065" stroke="#eab308" strokeWidth="2.5" />
          <circle cx="50" cy="56" r="24" fill="#fde68a" />
          <path d="M28 46C28 35 72 35 72 46" stroke="#ca8a04" strokeWidth="6" fill="none" />
          {/* Crown */}
          <path d="M30 36L35 22L42 30L50 18L58 30L65 22L70 36Z" fill="#eab308" stroke="#fef08a" strokeWidth="1.5" />
          <circle cx="50" cy="22" r="3" fill="#ef4444" />
        </svg>
      );
    case 9: // Cool Sunglasses & Pompadour Hair
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#022c22" stroke="#06b6d4" strokeWidth="2.5" />
          <circle cx="50" cy="54" r="25" fill="#fef3c7" />
          {/* Big Pompadour */}
          <path d="M25 42C20 25 40 15 50 15C65 15 80 25 75 42Z" fill="#0284c7" />
          {/* Sunglasses */}
          <polygon points="28,48 48,48 44,58 32,58" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
          <polygon points="52,48 72,48 68,58 56,58" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="48" y1="50" x2="52" y2="50" stroke="#38bdf8" strokeWidth="2" />
        </svg>
      );
    case 10: // Winter Beanie with Pom-pom
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#172554" stroke="#60a5fa" strokeWidth="2.5" />
          <circle cx="50" cy="56" r="24" fill="#fee2e2" />
          {/* Beanie Body */}
          <path d="M26 48C26 28 74 28 74 48Z" fill="#1d4ed8" />
          <rect x="24" y="44" width="52" height="8" rx="3" fill="#93c5fd" />
          <circle cx="50" cy="22" r="7" fill="#eff6ff" />
        </svg>
      );
    case 11: // Bandana / Ninja Wrap
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#18181b" stroke="#dc2626" strokeWidth="2.5" />
          <circle cx="50" cy="52" r="25" fill="#fca5a5" />
          {/* Bandana */}
          <path d="M22 42C22 30 78 30 78 42L82 48H18Z" fill="#991b1b" />
          <circle cx="22" cy="46" r="3" fill="#f87171" />
          <circle cx="78" cy="46" r="3" fill="#f87171" />
          {/* Mask */}
          <path d="M26 58C26 72 74 72 74 58Z" fill="#7f1d1d" />
        </svg>
      );
    case 12: // Curly Afro & Golden Hoop
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#3b0764" stroke="#a855f7" strokeWidth="2.5" />
          {/* Afro hair circles */}
          <circle cx="50" cy="38" r="26" fill="#581c87" />
          <circle cx="32" cy="42" r="18" fill="#581c87" />
          <circle cx="68" cy="42" r="18" fill="#581c87" />
          <circle cx="50" cy="54" r="22" fill="#fed7aa" />
          {/* Earring */}
          <circle cx="26" cy="56" r="4" stroke="#eab308" strokeWidth="2" fill="none" />
        </svg>
      );
    case 13: // Futuristic VR Goggles
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#0f172a" stroke="#22d3ee" strokeWidth="2.5" />
          <circle cx="50" cy="54" r="25" fill="#c7d2fe" />
          {/* Hair spikes */}
          <path d="M30 36L40 22L50 30L60 22L70 36" stroke="#06b6d4" strokeWidth="4" fill="none" />
          {/* VR Visor */}
          <rect x="24" y="44" width="52" height="16" rx="5" fill="#0891b2" stroke="#22d3ee" strokeWidth="2" />
          <line x1="28" y1="52" x2="72" y2="52" stroke="#a5f3fc" strokeWidth="2" />
        </svg>
      );
    case 14: // Artist Beret & Painter Apron
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#14532d" stroke="#84cc16" strokeWidth="2.5" />
          <circle cx="50" cy="54" r="24" fill="#fef9c3" />
          {/* Beret */}
          <ellipse cx="46" cy="32" rx="28" ry="12" fill="#3f6212" />
          <circle cx="46" cy="20" r="3" fill="#a3e635" />
          {/* Long Hair */}
          <path d="M26 44C24 60 26 72 26 72" stroke="#3f6212" strokeWidth="4" strokeLinecap="round" />
          <path d="M74 44C76 60 74 72 74 72" stroke="#3f6212" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 15: // Cat Ears & Cute Bow
    default:
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#4a044e" stroke="#f472b6" strokeWidth="2.5" />
          {/* Cat Ears */}
          <polygon points="25,36 35,16 45,32" fill="#a21caf" stroke="#f472b6" strokeWidth="2" />
          <polygon points="55,32 65,16 75,36" fill="#a21caf" stroke="#f472b6" strokeWidth="2" />
          <circle cx="50" cy="54" r="24" fill="#fbcfe8" />
          {/* Hair band */}
          <path d="M26 38C35 32 65 32 74 38" stroke="#e879f9" strokeWidth="4" />
          {/* Bow */}
          <circle cx="50" cy="32" r="4" fill="#ef4444" />
        </svg>
      );
  }
}
