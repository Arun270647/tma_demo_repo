import React from 'react';
import Header from './landing/Header';
import Hero from './landing/Hero';
import Features from './landing/Features';
import About from './landing/About';
import Pricing from './landing/Pricing';
import Footer from './landing/Footer';
import SEOHelmet from './SEOHelmet';

const NewLandingPage = () => {
  // REMOVED: useEffect forcing global smooth scroll.
  // This eliminates the "floaty" or "delayed" feel when using a trackpad/mouse wheel.

  const homeStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Track My Academy",
    "url": "https://www.trackmyacademy.com",
    "logo": "https://i.ibb.co/NkkHtWk/TMA-LOGO-without-bg.png",
    "description": "Revolutionary sports academy management software for Indian academies. Complete SaaS platform with player management, performance analytics, attendance tracking, and smart equipment integration.",
    "foundingDate": "2024",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Incubation Centre, Vels University",
      "addressLocality": "Chennai",
      "addressRegion": "Tamil Nadu",
      "postalCode": "600043",
      "addressCountry": "IN"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91 89255 15617",
      "contactType": "customer service",
      "email": "admin@trackmyacademy.com",
      "availableLanguage": ["English", "Hindi", "Tamil"]
    },
    "sameAs": [
      "https://www.linkedin.com/company/track-my-academy"
    ]
  };

  return (
    <>
      <SEOHelmet
        title="Track My Academy - Sports Academy Management Software | SaaS Platform India"
        description="Revolutionary sports academy management software trusted by 25+ academies in India. Complete SaaS platform with player management, performance analytics, attendance tracking, smart equipment integration. Free demo available."
        keywords="sports academy management software India, academy management system Chennai, sports management platform Tamil Nadu, player tracking software, sports analytics India, attendance management system, IoT sports equipment, sports academy SaaS, track my academy, sports technology India"
        canonical="/"
        structuredData={homeStructuredData}
      />

      <div className="relative bg-white overflow-hidden">
      {/* Custom Scrollbar - Optimized */}
      <style>{`
        ::-webkit-scrollbar { width: 0; height: 0; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: transparent; border-radius: 5px; }
        ::-webkit-scrollbar-thumb:hover { background: transparent; }
        * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; }
      `}</style>

      {/* Header */}
      <Header />

      {/* All Sections */}
      <Hero />
      <Features />
      <About />
      <Pricing />
      <Footer />
    </div>
    </>
  );
};

export default NewLandingPage;
