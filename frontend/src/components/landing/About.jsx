import React from 'react';
import { motion } from 'framer-motion';

const About = () => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const featureCards = [
    {
      icon: (
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      text: 'Lightning-fast performance',
    },
    {
      icon: (
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.007 12.007 0 002.92 12c0 3.072 1.407 5.838 3.565 7.747L9.5 22.952v-6.526A11.957 11.957 0 0112 16.03c1.074 0 2.11-.192 3.085-.566l2.915 2.196-1.574-3.565c2.158-1.909 3.565-4.675 3.565-7.747a12.007 12.007 0 00-3.085-8.056z" />
        </svg>
      ),
      text: 'Enterprise-grade security',
    },
    {
      icon: (
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h2m-4-4H9m11 0a2 2 0 002-2V7a2 2 0 00-2-2h-1V3a1 1 0 00-1-1H7a1 1 0 00-1 1v2H5a2 2 0 00-2 2v4m0 8l2.646-2.646C7.354 16.354 7.646 16 8 16h4.055m1.056 0h.008zm1.056 0h.008zm1.056 0h.008z" />
        </svg>
      ),
      text: 'Access from anywhere',
    },
    {
      icon: (
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      text: 'Easy to use interface',
    },
  ];

  return (
    <section id="about" className="py-20 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          className="lg:flex lg:items-center lg:justify-between"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* Left Column - Text Content */}
          <div className="lg:w-1/2 lg:pr-16 mb-12 lg:mb-0 text-center lg:text-left">
            <motion.span
              className="inline-block px-4 py-2 mb-6 text-xs font-semibold text-gray-700 bg-gray-100 rounded-full"
              variants={itemVariants}
            >
              Why Track My Academy
            </motion.span>
            <motion.h2
              className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 mb-6"
              variants={itemVariants}
            >
              Built for modern
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">
                sports academies
              </span>
            </motion.h2>
            <motion.p
              className="text-lg text-gray-700 leading-relaxed mb-10 max-w-xl lg:max-w-none mx-auto lg:mx-0"
              variants={itemVariants}
            >
              Streamline operations, track performance, and scale your academy with our comprehensive management platform. Everything you need in one place.
            </motion.p>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0"
              variants={containerVariants}
            >
              {featureCards.map((card, index) => (
                <motion.div
                  key={index}
                  className="flex items-center p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-200"
                  variants={itemVariants}
                >
                  {card.icon}
                  <span className="ml-3 font-medium text-gray-800">{card.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right Column - All-in-one platform card */}
          <div className="lg:w-1/2 flex justify-center lg:justify-end">
            <motion.div
              className="relative bg-gradient-to-br from-indigo-700 to-purple-800 text-white rounded-3xl p-8 md:p-12 shadow-xl border border-indigo-600 max-w-md w-full"
              variants={itemVariants}
            >
              <span className="absolute -top-4 right-6 bg-gradient-to-r from-blue-400 to-indigo-400 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md rotate-3">
                Modern
              </span>
              <h3 className="text-3xl font-bold mb-6 flex items-center">
                <svg className="w-8 h-8 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                All-in-one platform
              </h3>
              <p className="text-indigo-100 mb-8 text-lg">Everything you need</p>
              <ul className="space-y-4">
                {[
                  'Attendance tracking',
                  'Performance analytics',
                  'Event management',
                  'Team communication',
                  'Player health monitoring',
                  'Financial management'
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-green-300 mr-3 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    <span className="text-indigo-50 text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;