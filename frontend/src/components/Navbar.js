import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo - Updated to only show a larger TMA logo */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center" aria-label="Track My Academy - Sports Academy Management Software Home">
            <img
              src="https://customer-assets.emergentagent.com/job_602f5f47-7e7e-407d-b35e-9ed8dfafa24e/artifacts/e13u80sz_TMA%20LOGO%20without%20bg.png"
              alt="Track My Academy Logo - Sports Academy Management Software"
              // Adjusted classes for a proper navbar size for the logo
              className="w-auto h-8 sm:h-10 object-contain"
            />
            {/* Removed the <h1> tag for 'Track My Academy' text */}
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8" role="navigation" aria-label="Main navigation">
          <Link to="/blog" className="text-gray-700 hover:text-blue-500 transition-colors font-medium">Blog</Link>
          <a href="/#about" className="text-gray-700 hover:text-blue-500 transition-colors font-medium">About Us</a>
          <a href="/#pricing" className="text-gray-700 hover:text-blue-500 transition-colors font-medium">Pricing</a>
        </nav>

        {/* Desktop CTA Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <Link
            to="/contact"
            className="text-gray-700 hover:text-blue-500 transition-colors font-medium"
            aria-label="Contact Track My Academy for demos and support"
          >
            Contact Us
          </Link>
          <Link
            to="/login"
            className="bg-blue-500 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-blue-600 transition-colors shadow-lg hover:shadow-blue-200"
            aria-label="Login to Track My Academy platform"
          >
            Login
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label="Toggle mobile navigation menu"
        >
          <svg
            className={`w-6 h-6 text-gray-700 transition-transform ${isMobileMenuOpen ? 'rotate-45' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div id="mobile-menu" className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-lg md:hidden">
            <nav className="container mx-auto px-6 py-6 space-y-4" role="navigation" aria-label="Mobile navigation">
              <a href="/#features" className="block text-gray-700 hover:text-blue-500 transition-colors font-medium py-2">Features</a>
              <a href="/#about" className="block text-gray-700 hover:text-blue-500 transition-colors font-medium py-2">About</a>
              <a href="/#pricing" className="block text-gray-700 hover:text-blue-500 transition-colors font-medium py-2">Pricing</a>
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <Link
                  to="/contact"
                  className="block text-gray-700 hover:text-blue-500 transition-colors font-medium py-2"
                >
                  Contact Us
                </Link>
                <Link
                  to="/login"
                  className="block bg-blue-500 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-blue-600 transition-colors text-center"
                >
                  Login
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
