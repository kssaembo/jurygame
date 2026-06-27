import React from 'react';
import { Play, BookOpen, Scale } from 'lucide-react';
import { motion } from 'motion/react';

interface MainScreenProps {
  onStartClick: () => void;
  onOpenManual: () => void;
}

export default function MainScreen({ onStartClick, onOpenManual }: MainScreenProps) {
  return (
    <div className="w-full max-w-4xl mx-auto py-10 px-6 flex flex-col items-center justify-between min-h-[80vh] relative select-none">
      
      {/* Title / Header Area with "The Genius" Style */}
      <div className="text-center space-y-4 max-w-2xl mt-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="inline-block px-4 py-1.5 bg-gold-950/40 border border-gold-500/30 rounded-full mb-2 shadow-inner"
        >
          <span className="text-xs sm:text-sm font-mono tracking-[0.2em] text-gold-400 font-bold uppercase">
            THE GENIUS CLASSROOM SPECIAL
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="font-display text-4xl sm:text-6xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold-100 via-gold-400 to-gold-600 drop-shadow-[0_4px_12px_rgba(212,175,55,0.15)] uppercase"
        >
          배심원 게임
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-sm sm:text-base font-medium tracking-[0.3em] text-gold-500/95 pl-1"
        >
          지니어스한 학급 놀이 프로젝트
        </motion.p>
      </div>

      {/* Decorative Golden Scale of Justice (공정함의 저울) */}
      <div className="my-10 relative flex items-center justify-center w-72 h-72">
        {/* Soft background glows */}
        <div className="absolute inset-0 bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute w-56 h-56 bg-gradient-to-tr from-gold-950/20 to-transparent border border-gold-500/10 rounded-full flex items-center justify-center shadow-2xl">
          <div className="w-44 h-44 border border-gold-500/20 rounded-full border-dashed animate-[spin_120s_linear_infinite]" />
        </div>

        {/* Elegant Animated Scale Illustration */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotate: -3 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1.2, delay: 0.4, type: 'spring' }}
          className="absolute z-10 text-gold-400/90 drop-shadow-[0_0_20px_rgba(212,175,55,0.3)] flex flex-col items-center"
        >
          {/* Custom SVG Scale for a high-end styled look */}
          <svg className="w-48 h-48 filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Beam / Pillar Base */}
            <path d="M50 82 L50 25" stroke="url(#goldGradient)" strokeWidth="4" strokeLinecap="round" />
            <path d="M38 82 L62 82" stroke="url(#goldGradient)" strokeWidth="4" strokeLinecap="round" />
            <path d="M42 85 L58 85" stroke="url(#goldGradient)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="50" cy="82" r="3" fill="#D4AF37" />

            {/* Top decorative cap */}
            <circle cx="50" cy="22" r="4" fill="url(#goldGradient)" stroke="#000" strokeWidth="1" />
            
            {/* Rotating / Swaying horizontal beam */}
            <motion.g
              animate={{ rotate: [-2.5, 2.5, -2.5] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              style={{ originX: '50px', originY: '28px' }}
            >
              {/* Main Crossbar */}
              <path d="M20 28 L80 28" stroke="url(#goldGradient)" strokeWidth="3" strokeLinecap="round" />
              <circle cx="50" cy="28" r="2.5" fill="#FFF" />
              <circle cx="20" cy="28" r="2" fill="#D4AF37" />
              <circle cx="80" cy="28" r="2" fill="#D4AF37" />

              {/* Left Plate (Suspended) */}
              <g>
                {/* Chains */}
                <path d="M20 28 L10 52 M20 28 L30 52" stroke="#8A7322" strokeWidth="1" />
                {/* Plate cup */}
                <path d="M8 52 H32 C32 58 8 58 8 52 Z" fill="url(#goldGradient)" stroke="#8A7322" strokeWidth="0.5" />
                {/* Balancing line */}
                <line x1="8" y1="52" x2="32" y2="52" stroke="#D4AF37" strokeWidth="1.5" />
              </g>

              {/* Right Plate (Suspended) */}
              <g>
                {/* Chains */}
                <path d="M80 28 L70 52 M80 28 L90 52" stroke="#8A7322" strokeWidth="1" />
                {/* Plate cup */}
                <path d="M68 52 H92 C92 58 68 58 68 52 Z" fill="url(#goldGradient)" stroke="#8A7322" strokeWidth="0.5" />
                {/* Balancing line */}
                <line x1="68" y1="52" x2="92" y2="52" stroke="#D4AF37" strokeWidth="1.5" />
              </g>
            </motion.g>

            {/* Definitions for gorgeous gradients */}
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF2B2" />
                <stop offset="30%" stopColor="#D4AF37" />
                <stop offset="70%" stopColor="#AA7C11" />
                <stop offset="100%" stopColor="#F3E5AB" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute bottom-6 font-mono text-[10px] uppercase text-gold-500/70 tracking-[0.4em] font-semibold">
            EQUITY & JUSTICE
          </div>
        </motion.div>
      </div>

      {/* Button Menu Container */}
      <div className="w-full max-w-sm flex flex-col gap-3.5 z-20 mt-2">
        <motion.button
          id="main-start-game-btn"
          onClick={onStartClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600 hover:from-gold-500 hover:to-gold-500 text-black font-extrabold text-sm rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(212,175,55,0.25)] flex items-center justify-center gap-2.5 uppercase tracking-widest font-display cursor-pointer"
        >
          <Play className="w-4 h-4 fill-black text-black" />
          시작하기
        </motion.button>

        <motion.button
          id="main-manual-btn"
          onClick={onOpenManual}
          whileHover={{ scale: 1.02, bg: 'rgba(212,175,55,0.08)' }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3.5 bg-black/40 hover:bg-gold-950/10 border border-gold-500/30 hover:border-gold-400 text-gold-400 font-bold text-xs rounded-xl transition-all duration-300 flex items-center justify-center gap-2 tracking-wider cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          사용설명서 보기
        </motion.button>
      </div>

      {/* Footer Area with Copyright Contact Info */}
      <div className="w-full text-center mt-12 pt-6 border-t border-gold-950/20 text-gray-500 text-xs tracking-wider space-y-1.5 z-10">
        <p className="text-gray-400 font-medium">제안이나 문의사항이 있으시면 언제든 메일 주세요.</p>
        <p className="font-mono text-gold-500/70">
          Contact: <a href="mailto:sinjoppo@naver.com" className="hover:text-gold-400 underline transition">sinjoppo@naver.com</a>
        </p>
        <p className="text-[10px] font-mono mt-2 text-gray-600">
          ⓒ 2026. Kwon's class. All rights reserved.
        </p>
      </div>

    </div>
  );
}
