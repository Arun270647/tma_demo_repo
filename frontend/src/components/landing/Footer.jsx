import React from 'react';
import { HashLink } from 'react-router-hash-link';
import { Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import velsIncubationCombinedLogo from '../../assets/vels_logo.png';

const Footer = () => {
  const navigation = [
    {
      title: 'Product',
      links: [
        { name: 'Features', href: '/#features', smooth: true },
        { name: 'Pricing', href: '/#pricing', smooth: true },
      ],
      id: 'product'
    },
    {
      title: 'Company',
      links: [
        { name: 'Home', href: '/#', smooth: true },
        { name: 'About', href: '/#about', smooth: true },
        { name: 'Founders', href: '/founders#top', smooth: false },
        { name: 'Team', href: '/team#', smooth: false },
        { name: 'Blog', href: '/blog#top', smooth: false },
        { name: 'Careers', href: '/careers#', smooth: false },
        { name: 'Contact', href: '/contact#', smooth: false }
      ],
      id: 'company'
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy', href: '/privacy-policy#', smooth: false },
        { name: 'Terms', href: '/terms-of-service#', smooth: false }
      ],
      id: 'legal'
    }
  ];

  const renderNavColumn = (column) => (
    // FIX: Added 'items-center text-center' for mobile centering
    // Kept 'md:items-start md:text-left' for desktop
    <div key={column.id} className="flex flex-col items-center text-center md:items-start md:text-left">
      <h3 className="text-white font-semibold mb-4 text-sm">{column.title}</h3>
      <ul className="space-y-3">
        {column.links.map((link, linkIndex) => (
          <li key={linkIndex}>
            <HashLink
              to={link.href}
              smooth={link.smooth}
              className="text-gray-400 hover:text-white transition-colors text-sm block"
            >
              {link.name}
            </HashLink>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="bg-[#0f1625] text-white relative z-50">
      <style>{'html, body { margin: 0 !important; background-color: #0d42b5 !important; }'}</style>
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">

        <div className="flex flex-col md:flex-row md:justify-between">

          {/* 1. Left Column - Brand & Description */}
          <div className="w-full md:w-[350px] flex-shrink-0 mb-12 md:mb-0 flex flex-col items-center text-center md:items-start md:text-left">
            <div className="mb-4 flex flex-col md:flex-row items-center md:items-start">
              <img
                src="https://customer-assets.emergentagent.com/job_athlete-tracker-20/artifacts/7g46lw3u_tma-white.png"
                alt="Track My Academy Logo"
                className="h-14 w-auto object-contain mb-2 md:mb-0"
              />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-2 max-w-xs md:max-w-none">
              We empower athletes, coaches, and academies with technology-led training systems and IoT-backed performance insights—enabling smarter decisions and consistent athletic growth.
            </p>
            <h1 className="text-xl text-white font-bold italic">Track - Train - Triumph</h1>
          </div>

          {/* 2. Middle Columns - Mobile Grid Layout */}
          <div className="w-full flex-grow md:mx-12 mb-12 md:mb-0">
            {/* FIX: Added 'justify-items-center' to center grid content */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 justify-items-center md:flex md:justify-between md:gap-0">

              {/* Row 2 Left (Mobile): Incubated At */}
              {/* FIX: Added 'items-center' */}
              <div className="flex flex-col items-center md:items-start">
                <img
                  src={velsIncubationCombinedLogo}
                  alt="Incubated at VELS University"
                  className="h-auto max-w-[120px]"
                />
              </div>

              {/* Row 2 Right (Mobile): Company */}
              {/* FIX: Removed padding, relying on justify-items-center */}
              <div className="flex flex-col items-center md:items-start">
                {renderNavColumn(navigation.find(nav => nav.id === 'company'))}
              </div>

              {/* Row 3 Left (Mobile): Product */}
              <div className="flex flex-col items-center md:items-start">
                {renderNavColumn(navigation.find(nav => nav.id === 'product'))}
              </div>

              {/* Row 3 Right (Mobile): Legal */}
              <div className="flex flex-col items-center md:items-start">
                {renderNavColumn(navigation.find(nav => nav.id === 'legal'))}
              </div>

            </div>
          </div>

          {/* 3. Right Column - Contact Us */}
          <div className="w-full md:w-[250px] flex-shrink-0 flex flex-col items-center md:items-start">
            <div className="w-full max-w-xs md:max-w-none">
              <h3 className="text-white font-semibold mb-4 text-sm text-center md:text-left">Contact Us</h3>
              <ul className="space-y-4">
                {/* Address */}
                <li className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3 text-gray-400 text-sm text-center md:text-left">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    EDB 210, INCUBATION CENTRE, VISTAS, PALLAVARAM, CHENNAI - 43, INDIA
                  </span>
                </li>

                {/* Phone */}
                <li className="flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-3 text-gray-400 text-sm">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <a href="tel:+918925515617" className="hover:text-white transition-colors">
                    +91 89255 15617
                  </a>
                </li>

                {/* Email */}
                <li className="flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-3 text-gray-400 text-sm">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <a href="mailto:admin@trackmyacademy.com" className="hover:text-white transition-colors">
                    sales@trackmyacademy.com
                  </a>
                </li>

                {/* Social Icons */}
                <li className="pt-2 text-center md:text-left">
                  <p className="text-white font-semibold mb-3 text-sm">Stay Connected</p>
                  <div className="flex gap-4 justify-center md:justify-start">
                    <a
                      href="https://www.instagram.com/trackmyacademy_/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                    <a
                      href="https://www.linkedin.com/company/track-my-academy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                  </div>
                </li>
              </ul>
            </div>
          </div>

        </div>

        {/* Bottom Bar - Copyright */}
        <div className="pt-8 text-center bg-[#0f1625]">
          <p className="text-sm text-gray-300">
            © 2025 Track My Academy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
