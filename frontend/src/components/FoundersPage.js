import React, { useState, useEffect, useCallback } from 'react';
import Header from './landing/Header';
import Footer from './landing/Footer';
import SEOHelmet from './SEOHelmet';
import Breadcrumbs from './Breadcrumbs';

// --- IMPORTED IMAGES (CHECK FILENAMES) ---
import rahulImg from '../assets/team-pictures/rahul-dk.png';
import arichandranImg from '../assets/team-pictures/arichandran.jpg';
// --- END OF IMPORTS ---

// --- NEW PARTICLE BACKGROUND COMPONENT (Retained for dynamic effect) ---
const ParticleBackground = ({ color }) => {
  const [particles, setParticles] = useState([]);

  // Generate a random position within the container
  const getRandomPosition = () => ({
    x: Math.random() * 100, // %
    y: Math.random() * 100, // %
  });

  // Effect to create and manage particles
  useEffect(() => {
    const createParticle = () => {
      return {
        id: Math.random(),
        ...getRandomPosition(),
        size: Math.random() * 4 + 1, // Increased max size from 3+2 to 4+1 (effectively 1px to 5px max)
        opacity: Math.random() * 0.4 + 0.6, // Increased min opacity (0.6 to 1.0)
        speedX: (Math.random() - 0.5) * 0.6, 
        speedY: (Math.random() - 0.5) * 0.6,
      };
    };

    const initialParticles = Array.from({ length: 80 }).map(createParticle); // Doubled density from 40 to 80
    setParticles(initialParticles);

    const animateParticles = () => {
      setParticles(prevParticles =>
        prevParticles.map(p => {
          let newX = p.x + p.speedX * 0.1;
          let newY = p.y + p.speedY * 0.1;

          // Wrap particles around the edges
          if (newX > 100) newX = -p.size;
          if (newX < -p.size) newX = 100;
          if (newY > 100) newY = -p.size;
          if (newY < -p.size) newY = 100;

          return { ...p, x: newX, y: newY };
        })
      );
      animationFrameId = requestAnimationFrame(animateParticles);
    };

    let animationFrameId = requestAnimationFrame(animateParticles);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Handle mouse interaction for a subtle push effect
  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 100; // Mouse X as %
    const mouseY = ((e.clientY - rect.top) / rect.height) * 100; // Mouse Y as %

    setParticles(prevParticles =>
      prevParticles.map(p => {
        const distanceX = mouseX - p.x;
        const distanceY = mouseY - p.y;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        if (distance < 15) { // If particle is close to mouse
          const force = 0.5;
          p.speedX = (p.speedX + (distanceX / distance) * force) * 0.9; // Push away and dampen
          p.speedY = (p.speedY + (distanceY / distance) * force) * 0.9;
        }
        return p;
      })
    );
  }, []);

  const particleColor = color === 'blue' ? 'bg-blue-500' : 'bg-green-500'; // Increased brightness/saturation

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {particles.map(p => (
        <div
          key={p.id}
          className={`absolute rounded-full ${particleColor}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            transition: 'opacity 0.5s ease-out', // Smooth opacity changes
          }}
        />
      ))}
    </div>
  );
};
// --- END OF NEW PARTICLE BACKGROUND COMPONENT ---


// --- NEW ICON COMPONENT (Minimal) ---
const CheckIcon = () => (
    <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
);
// --- END OF NEW ICON COMPONENT ---

const FoundersPage = () => {
  const [hoveredEmail, setHoveredEmail] = useState(null); // State to track which email is hovered

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Founders', url: '/founders' }
  ];

  // --- UPDATED FOUNDERS ARRAY (ROLE TEXT REMOVED) ---
  const founders = [
    {
      name: "Rahul DK",
      title: "Founder & CEO",
      role: "", 
      image: rahulImg, 
      bio: "Rahul is a young tech innovator with a passion for turning ideas into impactful digital products. As the mind behind Track My Academy, he blends technology and sports to build smarter platforms for academies, coaches, and athletes. With a background in computer science and a love for creating solutions from scratch, Rahul’s vision is to make managing sports academies effortless, data-driven, and future-ready.",
      details: [
        "Strong academic foundation in computer science",
        "Hands-on experience in developing digital solutions from scratch",
        "Deep passion for integrating technology with sports",
        "Focus on creating smart and future-ready management tools"
      ],
      social: {
        linkedin: "https://www.linkedin.com/in/dkrahul/",
        email: "rahuldk@trackmyacademy.com"
      }
    },
    {
      name: "Arichandran CP", 
      title: "Co-Founder , Managing Director",
      role: "", 
      image: arichandranImg, 
      bio: "Arichandran CP is a well-known name in the Chennai sports industry — a successful entrepreneur who runs multiple sports academies and leads major sports infrastructure projects across the city. With his strong industry connections and years of hands-on experience, he brings the real-world sports expertise that powers Track My Academy’s growth. His mission is to make quality sports management accessible and professional across India.",
      details: [
        "Extensive business expertise within the sports sector",
        "Proven track record in promoting multiple sports academies",
        "Wide industry network and strong professional connections",
        "Strategic leadership driving professionalism, and accessibility."
      ],
      social: {
        linkedin: "https://www.linkedin.com/in/arichandran-cp-715589106/",
        email: "arichandran@cpsports.in"
      }
    }
  ];
  // --- END OF UPDATED ARRAY ---

  const foundersStructuredData = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "Track My Academy Founders",
    "description": "Meet the visionary founders behind Track My Academy - India's leading sports academy management platform",
    "mainEntity": {
      "@type": "Organization",
      "name": "Track My Academy",
      "founders": founders.map(founder => ({
        "@type": "Person",
        "name": founder.name,
        "jobTitle": founder.title,
        "description": founder.bio,
        "email": founder.social.email
      }))
    }
  };

  return (
    <>
      <SEOHelmet 
        title="Meet Our Founders - Track My Academy | Sports Technology Leaders India"
        description="Meet the visionary founders behind Track My Academy - combining student innovation with sports industry expertise to revolutionize academy management in India. Learn about our leadership team in Chennai."
        keywords="Track My Academy founders, sports technology founders India, academy management founders, sports startup founders Chennai, sports tech leadership, academy management visionaries"
        canonical="/founders"
        structuredData={foundersStructuredData}
      />
      {/* White background container for minimalist, high-contrast look */}
      <div className="bg-white text-gray-900 min-h-screen">
        <Header />
        <div id="top" className="absolute top-0"></div>
        <Breadcrumbs items={breadcrumbItems} />
        
        {/* Hero Section: Compressed and Clean */}
        <section className="pt-20 pb-8 bg-white relative overflow-hidden">
          <div className="container mx-auto px-6 text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">
              Meet the
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-600 py-1">
                Driving Force
              </span>
            </h1>
            <p className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed font-medium">
              Merging raw technological vision with unparalleled domain expertise.
            </p>
          </div>
        </section>

        {/* Founders Grid: Clean, Alternating, Minimalist Cards */}
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 gap-y-20 max-w-6xl mx-auto">
              {founders.map((founder, index) => {
                  return (
                    <article 
                      key={index} 
                      className={`bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-300`} 
                      itemScope itemType="https://schema.org/Person"
                    >
                      <div className={`flex flex-col lg:flex-row ${index % 2 !== 0 ? 'lg:flex-row-reverse' : ''} h-full`}>
                        
                        {/* Image Column: Clean White Background (Interactive elements removed) */}
                        <div className={`lg:w-1/3 p-4 flex items-center justify-center relative overflow-hidden rounded-t-xl lg:rounded-t-none ${index % 2 === 0 ? 'lg:border-r border-gray-200' : 'lg:border-l border-gray-200'}`}>
                            
                            {/* Image is now the only content in this column */}
                            <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-gray-300 shadow-xl relative z-20">
                                <img 
                                  src={founder.image} 
                                  alt={founder.name}
                                  className="w-full h-full object-cover transition-all duration-700" 
                                />
                            </div>
                            
                        </div>

                        {/* Content Column: High Contrast Text - INTERACTIVE BACKGROUND ADDED HERE */}
                        <div className="lg:w-2/3 p-8 md:p-12 space-y-8 relative overflow-hidden">
                            
                            {/* Particle Background is now here */}
                            <ParticleBackground color={index % 2 === 0 ? 'blue' : 'green'} />

                            <div className="space-y-8 relative z-20"> {/* Inner content wrapper */}
                                {/* Title & Role */}
                                <header className="pb-4 border-b border-gray-200">
                                    <h2 className="text-4xl font-extrabold mb-1 tracking-tight text-gray-900" itemProp="name">{founder.name}</h2>
                                    <p className={`text-xl font-semibold mb-1 ${index % 2 === 0 ? 'text-blue-700' : 'text-green-700'}`} itemProp="jobTitle">{founder.title}</p>
                                    <p className="text-gray-600 text-sm italic" itemProp="description">{founder.role}</p>
                                </header>

                                {/* Bio */}
                                <div className="space-y-4">
                                    <p className="text-gray-800 leading-relaxed font-normal" itemProp="description">
                                      {founder.bio}
                                    </p>
                                </div>
                                
                                {/* Connect Section - Icons Centered */}
                                <div className="border-t border-gray-200 pt-6">
                                    <h4 className="font-bold text-gray-900 mb-4">Connect and Engage</h4>
                                    <div className="flex space-x-4 justify-center">
                                      {/* LinkedIn Icon (Redirects) */}
                                      <a 
                                        href={founder.social.linkedin} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors duration-300 border border-blue-300"
                                        aria-label={`Connect with ${founder.name} on LinkedIn`}
                                      >
                                        <svg className="w-6 h-6 text-blue-700" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                          <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                                        </svg>
                                      </a>
                                      
                                      {/* Email Icon with Pop-up/Tooltip Behavior */}
                                      <div 
                                        className="relative"
                                        onMouseEnter={() => setHoveredEmail(founder.name)}
                                        onMouseLeave={() => setHoveredEmail(null)}
                                      >
                                        <div 
                                          className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg hover:bg-green-200 transition-colors duration-300 border border-green-300 cursor-pointer"
                                          aria-label={`Display Email for ${founder.name}`}
                                          role="button"
                                        >
                                          <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                          </svg>
                                        </div>
                                        
                                        {/* Tooltip Pop-up */}
                                        {hoveredEmail === founder.name && (
                                          <div className="absolute z-30 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 text-xs text-white bg-gray-800 rounded-md shadow-lg whitespace-nowrap opacity-100 transition-opacity duration-300 pointer-events-none">
                                            {founder.social.email}
                                            <svg className="absolute text-gray-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve">
                                              <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
                                            </svg>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
            </div>
          </div>
        </section>

        {/* Vision Section: Clean, Minimalist Quote Box */}
        <section className="py-24 bg-gray-50 border-t border-gray-300">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-8 tracking-tight">The Mandate: Domination Through Data</h2>
              <article className="bg-white rounded-xl p-10 shadow-lg border border-gray-300">
                <blockquote className="text-2xl text-gray-800 leading-relaxed font-semibold mb-6 italic" cite="Track My Academy Vision Statement">
                  "To revolutionize sports academy management worldwide by combining comprehensive SaaS solutions 
                  with innovative IoT smart equipment, empowering coaches and academies to focus on what matters most - 
                  <span className="text-blue-700 font-extrabold"> developing talented athletes and building successful sports programs.</span>"
                </blockquote>
                <p className="text-lg text-gray-600 mt-4">This isn't just software; it's a strategic performance advantage.</p>
              </article>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default FoundersPage;