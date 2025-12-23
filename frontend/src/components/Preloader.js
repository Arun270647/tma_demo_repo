import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import basketballImg from '../assets/pre-loader-assets/basketball.png';
import footballImg from '../assets/pre-loader-assets/football.png';
import cricketImg from '../assets/pre-loader-assets/cricket.png';
import tennisImg from '../assets/pre-loader-assets/tennis.png';

// External SVG URLs for a cleaner codebase
const sportsIcons = [
  { id: 'basketball', src: basketballImg, alt: 'Basketball' },
  { id: 'football', src: footballImg, alt: 'Football' },
  { id: 'cricket', src: cricketImg, alt: 'Cricket' },
  { id: 'tennis', src: tennisImg, alt: 'Tennis Ball' }
];

const Preloader = ({ fadeOut }) => {
  const [show, setShow] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const phrase = 'INITIALIZING DASHBOARD...';
  const [typedText, setTypedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle fading out logic
  useEffect(() => {
    if (fadeOut) {
      const timer = setTimeout(() => setShow(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [fadeOut]);

  // Loop through sports icons every 1.5 seconds
  useEffect(() => {
    const iconInterval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sportsIcons.length);
    }, 1500); // 1.5 seconds per icon

    return () => clearInterval(iconInterval);
  }, []);

  useEffect(() => {
    if (fadeOut) return;
    const delay = typedText === phrase ? 800 : isDeleting ? 50 : 100;
    const t = setTimeout(() => {
      if (!isDeleting) {
        const next = phrase.slice(0, typedText.length + 1);
        setTypedText(next);
        if (next === phrase) setIsDeleting(true);
      } else {
        const next = phrase.slice(0, Math.max(typedText.length - 1, 0));
        setTypedText(next);
        if (next.length === 0) setIsDeleting(false);
      }
    }, delay);
    return () => clearTimeout(t);
  }, [typedText, isDeleting, fadeOut]);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.8s ease-out',
      }}
    >
      <div className="flex flex-col items-center justify-center relative">
        
        <div className="relative w-[220px] h-[220px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-[160px] w-[160px] border-4 border-transparent border-t-gray-500"></div>
            <div className="absolute inset-0 flex items-center justify-center z-20">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={sportsIcons[currentIndex].id}
                        src={sportsIcons[currentIndex].src}
                        alt={sportsIcons[currentIndex].alt}
                        className="w-20 h-20 opacity-90 drop-shadow-xl"
                        initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 1.2, rotate: 45 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                </AnimatePresence>
            </div>
        </div>

        {/* Text content with Looping Animation */}
        <div className="mt-2 text-center">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-2xl md:text-3xl font-bold tracking-widest text-black"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            TRACK MY ACADEMY
          </motion.h1>
          <p 
             className="text-black text-sm mt-2 font-medium tracking-wide typing-caret"
             style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {typedText}
          </p>
        </div>
      </div>

      {/* Inline styles for typing caret */}
      <style>
        {`
          .typing-caret::after { content: '|'; margin-left: 2px; color: #000; animation: blink 1s steps(2, start) infinite; }
          @keyframes blink { to { visibility: hidden; } }
        `}
      </style>
    </div>
  );
};

export default Preloader;
