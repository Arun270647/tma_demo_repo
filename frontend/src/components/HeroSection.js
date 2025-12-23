import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import * as THREE from "three";
import WAVES from "vanta/dist/vanta.waves.min";


const HeroSection = () => {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const y = useSpring(useTransform(scrollYProgress, [0, 1], [0, 300]), {
    stiffness: 100,
    damping: 30,
    mass: 0.5,
  });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  // Vanta.js WAVES background
  const vantaRef = useRef(null);
  const [vantaEffect, setVantaEffect] = useState(null);
  useEffect(() => {
    if (!vantaEffect) {
      setVantaEffect(
        WAVES({
          el: vantaRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          color: 0x2563eb,
          shininess: 50,
          waveHeight: 20,
          waveSpeed: 1,
          zoom: 1,
        })
      );
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  return (
    <motion.section
      ref={vantaRef}
      className="relative min-h-screen flex items-center text-white overflow-hidden pt-24"
    >
      {/* ✅ 3D Background via Spline */}
      {/* You can add overlays or gradients here if you want, but Vanta is now the background. */}

      {/* 🔹 Overlay Gradient for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950/90 via-gray-900/40 to-gray-950/90 -z-10 pointer-events-none"></div>

      {/* 🔹 Animated Glow Layer */}
      <div className="absolute inset-0 -z-5">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.03)_1px,transparent_1px),linear-gradient(to_right,rgba(37,99,235,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        >
          <motion.div
            className="absolute top-0 left-0 w-full h-full"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.15) 0%, transparent 60%)",
              filter: "blur(80px)",
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </motion.div>
      </div>

      {/* 🔹 Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              className="space-y-6"
            >
              <motion.h1
                className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Transform Your
                <motion.span
                  className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 mt-2"
                  animate={{
                    backgroundPosition: ["0%", "100%"],
                    filter: [
                      "brightness(1)",
                      "brightness(1.3)",
                      "brightness(1)",
                    ],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                >
                  Sports Academy Management
                </motion.span>
              </motion.h1>

              <motion.p
                className="text-xl text-gray-300 max-w-xl leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Launching soon — your all-in-one platform for managing sports
                academies. Streamline operations, track athlete progress, and
                grow your academy with modern tools designed for the future of
                sports training
              </motion.p>

              <motion.div
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Link
                  to="/login"
                  className="relative inline-flex items-center justify-center px-8 py-3 overflow-hidden bg-blue-600 rounded-lg transition-all duration-300 hover:bg-blue-700"
                >
                  <span className="text-white font-semibold">Join Beta</span>
                </Link>
                <Link
                  to="/contact"
                  className="relative inline-flex items-center justify-center px-8 py-3 overflow-hidden border border-blue-500/30 rounded-lg hover:border-blue-400/50 transition"
                >
                  <span className="text-white font-semibold group-hover:text-blue-400 transition-colors">
                    Early Access
                  </span>
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                className="grid grid-cols-3 gap-6 pt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                {[
                  { value: "Coming", label: "Q4 2025" },
                  { value: "Beta", label: "Sign Up" },
                  { value: "24/7", label: "Support" },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    className="relative p-4 rounded-xl bg-blue-900/20 border border-blue-500/20"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div className="text-2xl font-bold text-blue-400">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>

          {/* Right Column */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <div className="relative aspect-square max-w-2xl mx-auto">
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-blue-400/50">Interactive 3D Spline Background</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{
          y: [0, 10, 0],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-8 h-12 rounded-full border-2 border-blue-500/30 flex items-center justify-center">
          <motion.div
            className="w-2 h-2 bg-blue-400 rounded-full"
            animate={{
              y: [0, 16, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </motion.div>
    </motion.section>
  );
};

export default HeroSection;
