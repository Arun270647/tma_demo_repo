import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HashLink as Link } from 'react-router-hash-link';
import { FloatingDock } from "../ui/floating-dock";

// --- STATIC DATA (Text Labels instead of Icons) ---
const dockLinks = [
  {
    title: "Home",
    icon: "Home", // Text acts as the icon
    href: "/#"
  },
  {
    title: "About",
    icon: "About",
    href: "/#about"
  },
  {
    title: "Features",
    icon: "Features",
    href: "/#features"
  },
  {
    title: "Pricing",
    icon: "Pricing",
    href: "/#pricing"
  },
  {
    title: "Blog",
    icon: "Blog",
    href: "/blog"
  },
  {
    title: "Contact",
    icon: "Contact",
    href: "/contact#"
  }
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(prev => (prev !== isScrolled ? isScrolled : prev));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'auto';
  }, [isMobileMenuOpen]);

  const handleHomeClick = () => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/#');
    }
  };

  const handleMobileLinkClick = (path) => {
    setIsMobileMenuOpen(false);
    if (path === '/') {
      handleHomeClick();
    } else {
      navigate(path);
    }
  };

  const menuVariants = {
    open: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 20 }
    },
    closed: {
      opacity: 0,
      y: "-20%",
      transition: { type: 'spring', stiffness: 100, damping: 20 }
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: isHomePage ? -100 : 0 }}
        animate={{ y: 0 }}
        transition={{ duration: isHomePage ? 0.5 : 0, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/95 shadow-lg' : 'bg-black'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 relative">

          {/* Grid Layout */}
          <div className="h-20 grid grid-cols-3 items-center md:flex md:justify-between">

            {/* --- 1. LEFT SECTION --- */}
            <div className="flex justify-start">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="block md:hidden text-white z-50"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>

              <button
                onClick={handleHomeClick}
                className="hidden md:flex items-center hover:opacity-80 transition-opacity z-50"
              >
                <img
                  src="https://customer-assets.emergentagent.com/job_athlete-tracker-20/artifacts/7g46lw3u_tma-white.png"
                  alt="TMA Logo"
                  className="h-8 w-auto"
                  loading="eager"
                />
              </button>
            </div>

            {/* --- 2. CENTER SECTION (Desktop Floating Dock) --- */}
            <div className="flex justify-center items-center">
              {/* Mobile Logo */}
              <button
                onClick={handleHomeClick}
                className="flex md:hidden items-center hover:opacity-80 transition-opacity z-50"
              >
                <img
                  src="https://customer-assets.emergentagent.com/job_athlete-tracker-20/artifacts/7g46lw3u_tma-white.png"
                  alt="TMA Logo"
                  className="h-8 w-auto"
                />
              </button>

              {/* DESKTOP: Floating Text Dock */}
              <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center">
                <FloatingDock
                  items={dockLinks}
                  desktopClassName="bg-transparent border-none shadow-none"
                />
              </div>
            </div>

            {/* --- 3. RIGHT SECTION --- */}
            <div className="flex justify-end">
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
              >
                Log In
              </button>
            </div>

          </div>
        </div>
      </motion.header>

      {/* --- MOBILE MENU OVERLAY --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className={`fixed top-0 left-0 right-0 h-screen bg-black/95 backdrop-blur-lg z-40 md:hidden p-5 pt-20`}
          >
            <nav className="grid grid-cols-3 gap-x-4 gap-y-4 items-start justify-items-center text-center">
              <Link to="/#" smooth onClick={() => setIsMobileMenuOpen(false)} className="text-white/80 hover:text-white text-lg font-medium">Home</Link>
              <Link to="/#about" smooth onClick={() => setIsMobileMenuOpen(false)} className="text-white/80 hover:text-white text-lg font-medium">About</Link>
              <Link to="/#features" smooth onClick={() => setIsMobileMenuOpen(false)} className="text-white/80 hover:text-white text-lg font-medium">Features</Link>
              <Link to="/#pricing" smooth onClick={() => setIsMobileMenuOpen(false)} className="text-white/80 hover:text-white text-lg font-medium">Pricing</Link>
              <Link to="/blog" smooth={false} onClick={() => setIsMobileMenuOpen(false)} className="text-white/80 hover:text-white text-lg font-medium">Blog</Link>
            </nav>
            <div className="mt-4 flex justify-center">
              <Link to="/contact#" smooth={false} onClick={() => setIsMobileMenuOpen(false)} className="text-white/80 hover:text-white text-lg font-medium">Contact</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
