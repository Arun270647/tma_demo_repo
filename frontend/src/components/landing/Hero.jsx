import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ShaderBackground from '../ui/ShaderBackground';

const Hero = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, -50]);

  return (
    <motion.section 
      ref={containerRef}
      style={{ opacity }}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* 3D Shader Background */}
      <div className="absolute inset-0 z-0">
        <ShaderBackground />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
      </div>

      {/* Content */}
      <motion.div 
        style={{ y }}
        className="relative z-10 text-center px-6 max-w-5xl mx-auto"
      >
        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white"
        >
          Sports Academy Management
          <br />
          <span className="text-white/90">Simplified</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto font-light"
        >
          Track performance, manage operations, and scale your academy with intelligent automation
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/login')}
            className="px-8 py-3.5 rounded-lg bg-white text-gray-900 font-medium text-base shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </motion.button>

          {/* --- THIS BUTTON IS NOW FIXED --- */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/login')} // Added this line
            className="px-8 py-3.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium text-base hover:bg-white/20 transition-all"
          >
            View Demo
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-5 h-8 border-2 border-white/30 rounded-full flex justify-center pt-1.5"
        >
          <motion.div
            animate={{ y: [0, 10, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1 h-1 bg-white/60 rounded-full"
          />
        </motion.div>
      </motion.div>
    </motion.section>
  );
};

export default Hero;