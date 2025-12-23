import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';


// Custom styles for bento box grid
const styles = `
  .bento-feature {
    background: linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(230,245,255,0.18) 100%);
    border-radius: 1.5rem;
    box-shadow: 0 8px 32px 0 rgba(30,41,59,0.12), 0 3px 12px 0 rgba(30,41,59,0.08);
    transition: box-shadow 0.2s, transform 0.2s;
    border: 1.5px solid rgba(255,255,255,0.45);
    padding: 1.2rem 1.2rem 1rem 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    min-height: 180px;
    min-width: 0;
    max-width: 320px;
    backdrop-filter: blur(24px) saturate(1.7);
    -webkit-backdrop-filter: blur(24px) saturate(1.7);
    border-top: 2px solid rgba(255,255,255,0.55);
    border-left: 2px solid rgba(255,255,255,0.25);
    border-right: 2px solid rgba(30,64,175,0.10);
    border-bottom: 2px solid rgba(30,64,175,0.13);
    overflow: hidden;
    position: relative;
  }
  .bento-feature:before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 1.5rem;
    pointer-events: none;
    background: linear-gradient(120deg, rgba(255,255,255,0.25) 0%, rgba(0,184,255,0.08) 100%);
    opacity: 0.7;
    z-index: 0;
  }
  .bento-feature:hover {
    box-shadow: 0 16px 48px 0 rgba(30,41,59,0.18), 0 8px 24px 0 rgba(30,41,59,0.13);
    transform: translateY(-2px) scale(1.018);
    background: linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(230,245,255,0.28) 100%);
  }
  .bento-feature-image {
    width: 100%;
    height: 70px;
    border-radius: 1rem;
    object-fit: cover;
    margin-top: 0.5rem;
    background: rgba(243,244,246,0.7);
    border: 1px solid rgba(30,64,175,0.10);
    box-shadow: 0 2px 8px 0 rgba(30,41,59,0.08);
    z-index: 1;
  }
`;

const FeaturesSection = () => {
  const sectionRef = useRef(null);
  
  // Inject styles
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
    return () => styleSheet.remove();
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  
  const springConfig = { mass: 1, tension: 75, friction: 15 };
  const scale = useSpring(1, springConfig);

  const features = [
    {
      icon: (
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      title: 'Complete Player Management',
      description: 'Comprehensive player profiles with performance tracking, attendance monitoring, and progress analytics. Manage unlimited players with detailed insights.',
      color: 'blue'
    },
    {
      icon: (
        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Advanced Analytics Dashboard',
      description: 'Real-time performance analytics with detailed reports, trend analysis, and data-driven insights to optimize training programs and player development.',
      color: 'green'
    },
    {
      icon: (
        <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Smart Equipment Integration',
      description: 'Seamlessly integrate with our IoT smart footballs and sport trackers for enhanced training data collection and real-time performance monitoring.',
      color: 'purple'
    },
    {
      icon: (
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Multi-Academy Support',
      description: 'Designed for enterprise-level operations with support for multiple academies, role-based access control, and centralized management dashboard.',
      color: 'red'
    },
    {
      icon: (
        <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Automated Attendance System',
      description: 'Streamlined attendance tracking with automated notifications, performance rating integration, and comprehensive attendance analytics.',
      color: 'yellow'
    },
    {
      icon: (
        <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title: 'Communication Hub',
      description: 'Integrated messaging system for coaches, players, and parents. Send announcements, updates, and maintain seamless communication across your academy.',
      color: 'indigo'
    }
  ];

  return (
    <motion.section
      ref={sectionRef}
      id="features"
      className="min-h-screen py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50 text-gray-900 relative overflow-hidden"
      style={{ position: 'relative' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="max-w-[1400px] mx-auto px-8 relative z-10">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <motion.span
            className="inline-block text-sm font-semibold text-blue-400 tracking-wider uppercase mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Features
          </motion.span>
          <motion.h2 
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6"
          >
            <span className="block">Everything You Need to</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 mt-2">
              Transform Your Academy
            </span>
          </motion.h2>
        </motion.div>

        {/* Bento Box Feature Grid - centered, tight, glassy, true bento look */}
        <div className="mx-auto mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-w-4xl place-items-center">
          {features.map((feature, index) => {
            const isImageFeature = feature.title === 'Complete Player Management' || feature.title === 'Automated Attendance System';
            // Use Unsplash random landscape images for demo
            const imgUrl = index === 0
              ? 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80'
              : index === 4
              ? 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80'
              : null;
            return (
              <motion.div
                key={index}
                className="bento-feature"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                style={{ minHeight: isImageFeature ? 200 : 150, width: '100%', maxWidth: 300, position: 'relative', zIndex: 1 }}
              >
                <div className="flex items-center gap-2 mb-1 z-10">
                  {feature.icon}
                  <h3 className="text-base font-bold text-gray-900">{feature.title}</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed z-10">{feature.description}</p>
                {isImageFeature && imgUrl && (
                  <img className="bento-feature-image" src={imgUrl} alt={feature.title + ' illustration'} />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Premium CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-gray-500 mb-6 text-lg font-medium">Ready to revolutionize your academy?</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.a
              href="#pricing"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 transition-all duration-300 rounded-lg text-base font-semibold shadow-lg shadow-blue-600/30 text-white"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              Get Started Now
            </motion.a>
            <motion.a
              href="#contact"
              className="px-8 py-3 border border-gray-300 hover:border-blue-500 transition-all duration-300 rounded-lg text-base font-semibold text-blue-600 hover:text-blue-700 bg-white"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              Schedule Demo
            </motion.a>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default FeaturesSection;
