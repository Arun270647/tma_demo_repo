import React, { useState } from 'react';
import Header from './landing/Header'; // Changed from './Navbar'
import Footer from './landing/Footer'; // Added this import
import SEOHelmet from './SEOHelmet';
import Breadcrumbs from './Breadcrumbs';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    academyName: '',
    message: '',
    inquiryType: 'demo'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' or 'error'

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Contact', url: '/contact' }
  ];
  
  // UPDATED WITH YOUR ACCESS KEY
  const WEB3FORMS_ACCESS_KEY = "8c2085f8-e616-4d5c-aed9-990be7112e88"; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          ...formData,
          // Custom subject line for easier email sorting
          subject: `New Inquiry via Website (${formData.inquiryType})`,
          from_name: "TMA Website Contact Form"
        })
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          academyName: '',
          message: '',
          inquiryType: 'demo'
        });
      } else {
        console.error("Error submitting form:", result);
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error("Network error:", error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const contactStructuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Track My Academy",
    "description": "Sports academy management software for Indian academies",
    "image": "https://i.ibb.co/NkkHtWk/TMA-LOGO-without-bg.png",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "EDB 210, Incubation Centre, VISTAS, Pallavaram",
      "addressLocality": "Chennai",
      "addressRegion": "Tamil Nadu",
      "postalCode": "600043",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "13.0827",
      "longitude": "80.2707"
    },
    "telephone": "+91 89255 15617",
    "email": "admin@trackmyacademy.com",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "18:00"
      }
    ],
    "url": "https://www.trackmyacademy.com",
    "priceRange": "₹₹",
    "sameAs": [
      "https://www.linkedin.com/company/track-my-academy"
    ]
  };

  return (
    <>
      <SEOHelmet
        title="Contact Us - Track My Academy | Sports Tech Chennai"
        description="Get in touch with the Track My Academy team in Chennai. Request a demo, ask questions, or learn more about our sports academy management software. Available Mon-Fri 9 AM - 6 PM IST."
        keywords="contact track my academy, sports tech chennai, request demo, academy management support, Chennai sports technology, contact sports software"
        canonical="/contact"
        structuredData={contactStructuredData}
      />
      
      <div className="bg-gray-50 min-h-screen">
        <Header />
        
        <Breadcrumbs items={breadcrumbItems} />

        <section className="py-20 md:py-24">
          {/* FIX: Replaced 'container' with 'max-w-7xl' to ensure
            mx-auto will center the content.
          */}
          <div className="max-w-7xl mx-auto px-6">
            
            {/* Section Header */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                Get in Touch
              </h1>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
                Have a question or want to request a demo? Fill out the form below or email us.
              </p>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Column 1: Contact Form */}
              <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">
                  Send us a Message
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Inquiry Type */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">What can we help you with?</label>
                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="inquiryType" 
                          value="demo" 
                          checked={formData.inquiryType === 'demo'} 
                          onChange={handleChange}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-800">Request a Demo</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="inquiryType" 
                          value="pricing" 
                          checked={formData.inquiryType === 'pricing'} 
                          onChange={handleChange}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-800">Pricing Inquiry</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="inquiryType" 
                          value="support" 
                          checked={formData.inquiryType === 'support'} 
                          onChange={handleChange}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-800">Support</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Name & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="text-sm font-semibold text-gray-700 mb-2 block">Full Name</label>
                      <input 
                        type="text" 
                        id="name" 
                        name="name" 
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="John Doe" 
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-2 block">Email Address</label>
                      <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="you@example.com" 
                      />
                    </div>
                  </div>
                  
                  {/* Phone & Academy Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="phone" className="text-sm font-semibold text-gray-700 mb-2 block">Phone Number (Optional)</label>
                      <input 
                        type="tel" 
                        id="phone" 
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="+91 98765 43210" 
                      />
                    </div>
                    <div>
                      <label htmlFor="academyName" className="text-sm font-semibold text-gray-700 mb-2 block">Academy Name (Optional)</label>
                      <input 
                        type="text" 
                        id="academyName" 
                        name="academyName"
                        value={formData.academyName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Your Academy" 
                      />
                    </div>
                  </div>
                  
                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="text-sm font-semibold text-gray-700 mb-2 block">Your Message</label>
                    <textarea 
                      id="message" 
                      name="message" 
                      rows="5"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="How can we help you?"
                    ></textarea>
                  </div>
                  
                  {/* Submit Button */}
                  <div>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full font-bold py-4 px-6 rounded-xl transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-blue-200 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                  
                  {/* Submission Status */}
                  {submitStatus === 'success' && (
                    <div className="text-center p-4 rounded-lg bg-green-50 text-green-700 border border-green-200">
                      Thank you! Your message has been sent successfully. We'll be in touch soon.
                    </div>
                  )}
                  {submitStatus === 'error' && (
                    <div className="text-center p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
                      Oops! Something went wrong. Please try again or email us directly.
                    </div>
                  )}
                </form>
              </div>
              
              {/* Column 2: Contact Details */}
              <div className="space-y-8">
                {/* Contact Info Card */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 text-left">Contact Information</h2>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                      <div>
                        <a href="mailto:support@trackmyacademy.com" className="text-blue-600 hover:underline">support@trackmyacademy.com</a>
                      </div>
                    </div>
                    <div className="flex items">
                      <svg className="w-5 h-5 text-blue-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      <div>
                        <p className="text-sm text-left text-gray-500">EDB 210, INCUBATION CENTRE , VISTAS, PALLAVARAM, CHENNAI - 43, INDIA</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Business Hours Card */}
                <div className="bg-blue-50 rounded-3xl p-8 border border-blue-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 text-left">Business Hours</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Monday-Friday</span>
                      <span className="font-semibold text-gray-900">10:00 AM-6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Saturday</span>
                      <span className="font-semibold text-gray-900">10:00 AM-4:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Sunday</span>
                      <span className="font-semibold text-red-600">Closed</span>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-white rounded-xl">
                    <p className="text-sm text-gray-600">
                      <strong>Note:</strong> For urgent support requests outside business hours in Chennai timezone, 
                      please email us and we'll respond within 24 hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default ContactPage;
