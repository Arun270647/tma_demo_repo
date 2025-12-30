import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
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

  // Staggered animation variants
  const fadeUpVariant = {
    hidden: {
      opacity: 0,
      y: 30,
      filter: "blur(8px)"
    },
    visible: (delay = 0) => ({
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        delay: delay,
        ease: [0.25, 0.4, 0.25, 1]
      }
    })
  };

  const scaleInVariant = {
    hidden: {
      opacity: 0,
      scale: 0.8
    },
    visible: (delay = 0) => ({
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        delay: delay,
        ease: [0.25, 0.4, 0.25, 1]
      }
    })
  };

  return (
    <motion.section
      ref={containerRef}
      style={{ opacity }}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* 3D Shader Background - PRESERVED EXACTLY */}
      <div className="absolute inset-0 z-0">
        <ShaderBackground />
        {/* Enhanced overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        {/* Subtle radial gradient for depth */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)'
          }}
        />
      </div>

      {/* Content Container */}
      <motion.div
        style={{ y }}
        className="relative z-10 text-center px-6 w-full max-w-5xl mx-auto py-24 lg:py-32"
      >
        {/* Eyebrow / Label */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate="visible"
          custom={0.1}
          className="mb-6"
        >
          <span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: 'rgba(147, 197, 253, 1)'
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
                boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)'
              }}
            />
            Benefited from Zoho for Startups
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          variants={fadeUpVariant}
          initial="hidden"
          animate="visible"
          custom={0.25}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold mb-6 tracking-tight"
          style={{
            lineHeight: 1.05,
          }}
        >
          <span className="text-white" style={{ textShadow: '0 4px 30px rgba(0, 0, 0, 0.4)' }}>
            Transform Your
          </span>
          <br />
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 50%, #3B82F6 100%)',
              backgroundSize: '200% auto',
              textShadow: 'none',
              filter: 'drop-shadow(0 0 30px rgba(59, 130, 246, 0.4))'
            }}
          >
            Sports Academy
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={fadeUpVariant}
          initial="hidden"
          animate="visible"
          custom={0.4}
          className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 max-w-2xl mx-auto font-normal leading-relaxed"
          style={{
            color: 'rgba(148, 163, 184, 1)',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
          }}
        >
          Streamline operations, track athlete performance, and scale with
          <span style={{ color: 'rgba(255, 255, 255, 0.95)' }}> intelligent automation</span> —
          all in one powerful platform.
        </motion.p>

        {/* Horizontal Divider */}
        <motion.div
          variants={scaleInVariant}
          initial="hidden"
          animate="visible"
          custom={0.5}
          className="flex items-center justify-center gap-4 mb-10"
        >
          <div
            className="h-px w-16 sm:w-24"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.5) 100%)'
            }}
          />
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
              boxShadow: '0 0 12px rgba(59, 130, 246, 0.6)'
            }}
          />
          <div
            className="h-px w-16 sm:w-24"
            style={{
              background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.5) 0%, transparent 100%)'
            }}
          />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate="visible"
          custom={0.6}
          className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center items-center"
        >
          {/* Primary CTA - TMA Blue */}
          <motion.button
            whileHover={{
              scale: 1.04,
              boxShadow: '0 20px 50px rgba(59, 130, 246, 0.4), 0 0 80px rgba(59, 130, 246, 0.2)'
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/login')}
            className="group relative px-8 sm:px-10 py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 flex items-center gap-3 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              color: 'white',
              boxShadow: '0 10px 40px rgba(59, 130, 246, 0.35), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}
          >
            <span className="relative z-10">Get Started Free</span>
            <ArrowRight className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
            {/* Hover gradient overlay */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)'
              }}
            />
          </motion.button>

          {/* Secondary CTA - Ghost Style */}
          <motion.button
            whileHover={{
              scale: 1.04,
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              borderColor: 'rgba(59, 130, 246, 0.6)'
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/login')}
            className="group px-8 sm:px-10 py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 flex items-center gap-3"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              color: 'white',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Play className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
            <span>Watch Demo</span>
          </motion.button>
        </motion.div>

        {/* Trust Indicator Text */}
        <motion.p
          variants={fadeUpVariant}
          initial="hidden"
          animate="visible"
          custom={0.8}
          className="mt-10 text-sm"
          style={{ color: 'rgba(100, 116, 139, 1)' }}
        >
          Trusted by <span style={{ color: 'rgba(148, 163, 184, 1)' }}>25+ academies</span> across India
        </motion.p>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 rounded-full flex justify-center pt-2"
          style={{
            border: '2px solid rgba(59, 130, 246, 0.3)'
          }}
        >
          <motion.div
            animate={{ y: [0, 12, 0], opacity: [0.8, 0.2, 0.8] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)'
            }}
          />
        </motion.div>
      </motion.div>
    </motion.section>
  );
};

export default Hero;