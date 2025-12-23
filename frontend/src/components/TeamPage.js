import React, { useState, useEffect } from 'react';
import Header from './landing/Header';
import Footer from './landing/Footer';
import SEOHelmet from './SEOHelmet';
import Breadcrumbs from './Breadcrumbs';
import { Linkedin, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- IMPORTED IMAGES ---
import rahulImg from '../assets/team-pictures/rahul-dk.png';
import arichandranImg from '../assets/team-pictures/arichandran.jpg';
import arunImg from '../assets/team-pictures/arun.png';
import ebinImg from '../assets/team-pictures/ebin.png';
import jitendraImg from '../assets/team-pictures/jitendra.png';
import kharthickImg from '../assets/team-pictures/kharthick.png';
import ashwinImg from '../assets/team-pictures/ashwin.png';

// --- TEAM DATA ---
const teamMembers = [
    {
      id: 1,
      name: "Rahul DK",
      title: "Founder & CEO",
      image: rahulImg, 
      quote: "Vision without execution is just a hallucination. We are building the digital backbone of sports academies.",
      social: { linkedin: "https://www.linkedin.com/in/dkrahul/", email: "rahuldk@trackmyacademy.com" }
    },
    {
      id: 2,
      name: "Arichandran CP", 
      title: "Co-Founder",
      image: arichandranImg, 
      quote: "Sports is about discipline and data. We bring professional-grade management to every academy.",
      social: { linkedin: "https://www.linkedin.com/in/arichandran-cp-715589106/", email: "arichandran@cpsports.in" }
    },
    {
        name: "Kharthick Raghav L",
        title: "Technical Manager",
        image: kharthickImg,
        quote: "Innovation isn't just about new tech; it's about solving real problems with elegant code.",
        social: { linkedin: "https://www.linkedin.com/in/kharthick-raghav/", email: "kharthick@trackmyacademy.com" }
    },
    {
        name: "Arun Vignesh V",
        title: "Product Manager - Software",
        image: arunImg,
        quote: "User experience is our top priority. We design for coaches, parents, and players alike.",
        social: { linkedin: "https://www.linkedin.com/in/arun-vignesh-v/", email: "arun@trackmyacademy.com" }
    },
    {
        name: "Jitendra S",
        title: "Embedded Technology Developer",
        image: jitendraImg,
        quote: "Bridging the gap between physical sports and digital analytics through IoT.",
        social: { linkedin: "https://www.linkedin.com/in/jitendra-sundesha", email: "jitendra@trackmyacademy.com" }
    },
    {
        name: "Ebin M",
        title: "Product Manager - Hardware",
        image: ebinImg,
        quote: "Robust hardware meets smart software. We ensure our devices stand up to the game.",
        social: { linkedin: "https://www.linkedin.com/in/ebin-virjo/", email: "ebin@trackmyacademy.com" }
    },
    {
        name: "Ashwin S",
        title: "Marketing and Media Manager",
        image: ashwinImg,
        quote: "Great products deserve great stories. We connect with our audience through authentic engagement.",
        social: { linkedin: "https://www.linkedin.com/in/prince-ashwin-193145354/", email: "ashwin@trackmyacademy.com" }
    },
];

// --- INLINE COMPONENT: ANIMATED TESTIMONIALS ---
const AnimatedTestimonials = ({ testimonials, autoplay = false }) => {
  const [active, setActive] = useState(0);

  const handleNext = () => {
    setActive((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const isActive = (index) => {
    return index === active;
  };

  useEffect(() => {
    if (autoplay) {
      const interval = setInterval(handleNext, 8000); 
      return () => clearInterval(interval);
    }
  }, [autoplay]);

  const randomRotateY = () => {
    return Math.floor(Math.random() * 21) - 10;
  };

  return (
    <div className="max-w-sm md:max-w-4xl mx-auto antialiased font-sans px-4 md:px-8 lg:px-12 py-12">
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-20">
        
        {/* Image Section */}
        <div>
          <div className="relative h-80 w-full">
            <AnimatePresence>
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, scale: 0.9, z: -100, rotate: randomRotateY() }}
                  animate={{
                    opacity: isActive(index) ? 1 : 0.7,
                    scale: isActive(index) ? 1 : 0.95,
                    z: isActive(index) ? 0 : -100,
                    rotate: isActive(index) ? 0 : randomRotateY(),
                    zIndex: isActive(index) ? 30 : testimonials.length + 2 - index,
                    y: isActive(index) ? [0, -80, 0] : 0,
                  }}
                  exit={{ opacity: 0, scale: 0.9, z: 100, rotate: randomRotateY() }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="absolute inset-0 origin-bottom"
                >
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    draggable={false}
                    className="h-full w-full rounded-3xl object-cover object-center shadow-2xl"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex justify-between flex-col py-4">
          <motion.div
            key={active}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              {testimonials[active].name}
            </h3>
            <p className="text-sm text-blue-600 font-bold uppercase tracking-wider mb-6">
              {testimonials[active].title}
            </p>
            
            <div className="text-lg text-gray-600 italic leading-relaxed">
              "{testimonials[active].quote}"
            </div>
          </motion.div>
          
          <div className="flex gap-4 pt-12 md:pt-0">
            <button
              onClick={handlePrev}
              className="h-12 w-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center group/button transition-colors"
            >
              <ChevronLeft className="h-6 w-6 text-gray-800 group-hover/button:rotate-12 transition-transform duration-300" />
            </button>
            <button
              onClick={handleNext}
              className="h-12 w-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center group/button transition-colors"
            >
              <ChevronRight className="h-6 w-6 text-gray-800 group-hover/button:-rotate-12 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- INLINE COMPONENT: COMET CARD ---
const CometCard = ({ children }) => {
  return (
    <div className="relative w-full group z-0 transition-all duration-500 hover:z-10 hover:-translate-y-2">
      {/* Comet Tail Effect */}
      <div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 via-cyan-400 to-green-400 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-70"
      />
      {/* Inner Card Background */}
      <div className="relative h-full w-full rounded-2xl bg-white border border-gray-200 p-[2px]">
        <div className="h-full w-full rounded-[14px] bg-white overflow-hidden relative">
             {children}
        </div>
      </div>
    </div>
  );
};

// --- MAIN TEAM PAGE COMPONENT ---
const TeamPage = () => {
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Team', url: '/team' }
  ];

  const teamStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Track My Academy Team",
    "description": "Meet the core development and business team behind Track My Academy.",
    "mainEntity": {
      "@type": "Organization",
      "name": "Track My Academy",
      "members": teamMembers.map(member => ({
        "@type": "Person",
        "name": member.name,
        "jobTitle": member.title,
      }))
    }
  };

  return (
    <>
      <SEOHelmet 
        title="Meet Our Team - Track My Academy"
        description="Meet the core development and business team behind Track My Academy."
        canonical="/team"
        structuredData={teamStructuredData}
      />
      
      <div className="bg-white text-gray-900 min-h-screen">
        <Header />
        <div id="top" className="absolute top-0"></div>
        <Breadcrumbs items={breadcrumbItems} />
        
        {/* Header Section */}
        <section className="pt-20 pb-8 bg-white relative overflow-hidden z-0">
          <div className="container mx-auto px-6 text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">
              Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-600">Core Team</span>
            </h1>
            <p className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed font-medium">
              The engineers, designers, and strategists building the future of sports management.
            </p>
          </div>
        </section>

        {/* ALL MEMBERS GRID (Comet Cards) - MOVED TO TOP */}
        <section className="py-16 px-6 bg-white relative z-0">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {teamMembers.map((member) => (
                 <CometCard key={member.name}>
                   <div className="flex flex-col h-full w-full bg-white rounded-xl overflow-hidden group">
                      <div className="relative aspect-[4/5] w-full overflow-hidden">
                        <img
                          src={member.image}
                          alt={member.name}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
                        
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                           <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                           <p className="text-xs text-blue-300 font-bold uppercase tracking-wider mb-4">{member.title}</p>
                           
                           <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                              <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-blue-600 transition-colors border border-white/10">
                                  <Linkedin size={16} />
                              </a>
                              <a href={`mailto:${member.social.email}`} className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-green-600 transition-colors border border-white/10">
                                  <Mail size={16} />
                              </a>
                           </div>
                        </div>
                      </div>
                   </div>
                 </CometCard>
               ))}
            </div>
          </div>
        </section>

        {/* FEATURED: Animated Testimonials Component - MOVED BELOW */}
        <section className="py-24 bg-gray-50 border-y border-gray-100 relative z-0">
            <div className="container mx-auto px-6">
                <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gray-900">Leadership Voices</h2>
                <AnimatedTestimonials testimonials={teamMembers} autoplay={true} />
            </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default TeamPage;