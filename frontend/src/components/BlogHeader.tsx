import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/blog" },
    { name: "Articles", href: "/blog" },
  ];

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[hsl(222_47%_11%)] ${isScrolled
        ? "py-2 shadow-lg"
        : "py-4"
        }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/blog"
            className="group relative flex items-center"
          >
            <motion.div
              className="relative"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <img
                src="/tma-logo.png"
                alt="TrackMyAcademy"
                className={`transition-all duration-300 ${isScrolled ? "h-8 md:h-10" : "h-10 md:h-12"
                  } w-auto object-contain`}
              />
            </motion.div>
          </Link>

          {/* Navigation Links - Center */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-white/80 hover:text-white transition-colors text-sm font-medium"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Log In Button */}
          <motion.button
            className="px-5 py-2 rounded-full border-2 border-primary text-primary font-medium text-sm transition-all duration-300 hover:bg-primary hover:text-white"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Log In
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
