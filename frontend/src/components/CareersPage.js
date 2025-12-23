import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Clock } from 'lucide-react';
import { jobsData } from '../data/jobsData';
import Header from './landing/Header';
import Footer from './landing/Footer';
import SEOHelmet from './SEOHelmet';
import Breadcrumbs from './Breadcrumbs';

const CareersPage = () => {
  const navigate = useNavigate();

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Careers', url: '/careers' }
  ];

  // Create JobPosting structured data for all positions
  const jobPostings = jobsData.map(job => ({
    "@type": "JobPosting",
    "title": job.title,
    "description": job.roleOverview || "Join our team at Track My Academy",
    "hiringOrganization": {
      "@type": "Organization",
      "name": "Track My Academy",
      "sameAs": "https://www.trackmyacademy.com"
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.location.split(',')[0],
        "addressCountry": "IN"
      }
    },
    "employmentType": job.type || "FULL_TIME",
    "datePosted": "2025-01-01"
  }));

  const careersStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": jobPostings
  };

  return (
    <>
      <SEOHelmet
        title="Careers at Track My Academy - Join Our Team | Sports Tech Jobs India"
        description="Join Track My Academy's innovative team building the future of sports management software. Open positions in Chennai for software developers, product managers, marketing, and more. Explore exciting career opportunities in sports technology."
        keywords="sports tech careers India, Chennai jobs, sports software jobs, academy management careers, sports technology jobs Chennai, developer jobs Chennai, product manager jobs India, marketing jobs Chennai"
        canonical="/careers"
        structuredData={careersStructuredData}
      />

      <div className="min-h-screen bg-white">
        <Header />
        <Breadcrumbs items={breadcrumbItems} />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 lg:px-12 xl:px-24">
        <div className="max-w-7xl mx-auto text-left">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight animate-fade-in">
            Come build with us
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-3xl mb-8">
            We're building software that powers the next generation of sports academies.
            Join our team and help shape the future of sports management.
          </p>
          <button
            onClick={() => {
              const openPositions = document.getElementById('open-positions');
              openPositions?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
          >
            View Open Positions
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Divider */}
      <div className="px-6 lg:px-12 xl:px-24">
        <div className="max-w-7xl mx-auto border-t border-gray-200"></div>
      </div>

      {/* Life at Track My Academy - Intro */}
      <section className="py-20 px-6 lg:px-12 xl:px-24">
        <div className="max-w-7xl mx-auto text-left">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Life at Track My Academy
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mb-20">
            We're more than a team—we're a family. Our culture is built on collaboration,
            mutual respect, and genuine care for each other's growth and success.
          </p>

          {/* Text Left, Image Right */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24 opacity-0 animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
            <div className="text-left space-y-4">
              <h3 className="text-3xl font-bold text-gray-900">
                We're family
              </h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Every team member is valued, respected, and celebrated for their unique
                contributions. We support each other through challenges and celebrate
                victories together. At Track My Academy, you're not just an employee—you're
                part of a close-knit family that cares about your growth and success.
              </p>
            </div>
            <div className="overflow-hidden rounded-xl shadow-md">
              <img
                src="/team-photos/team1.jpg"
                alt="Track My Academy team members collaborating on sports technology solutions"
                className="w-full h-[350px] object-cover hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
            </div>
          </div>

          {/* Image Left, Text Right */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24 opacity-0 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            <div className="overflow-hidden rounded-xl shadow-md md:order-1">
              <img
                src="/team-photos/team2.jpg"
                alt="Track My Academy team brainstorming session and collaborative planning"
                className="w-full h-[350px] object-cover hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
            </div>
            <div className="text-left space-y-4 md:order-2">
              <h3 className="text-3xl font-bold text-gray-900">
                Collaborative spirit
              </h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                From team trips to brainstorming sessions, we believe in building strong
                relationships. Our collaborative plans create bonds that go beyond the workplace.
                We work together, innovate together, and celebrate our wins together.
              </p>
            </div>
          </div>

          {/* Text Left, Image Right */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24 opacity-0 animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
            <div className="text-left space-y-4">
              <h3 className="text-3xl font-bold text-gray-900">
                Recognition matters
              </h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                We give every team member the appreciation and credit they deserve. Your
                contributions are acknowledged, your ideas are valued, and your growth is our priority.
                We celebrate individual achievements and ensure everyone gets the recognition they've earned.
              </p>
            </div>
            <div className="overflow-hidden rounded-xl shadow-md">
              <img
                src="/team-photos/team3.jpg"
                alt="Track My Academy team outing - celebrating achievements together"
                className="w-full h-[350px] object-cover hover:scale-105 transition-transform duration-700"
                style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
                loading="lazy"
              />
            </div>
          </div>

          {/* Image Left, Text Right */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16 opacity-0 animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
            <div className="overflow-hidden rounded-xl shadow-md md:order-1">
              <img
                src="/team-photos/team4.jpg"
                alt="Track My Academy team enjoying company events and building lasting friendships"
                className="w-full h-[350px] object-cover hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
            </div>
            <div className="text-left space-y-4 md:order-2">
              <h3 className="text-3xl font-bold text-gray-900">
                More than work
              </h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                We organize team trips, celebrations, and fun activities because we believe in
                doing more than just work. We create memories and friendships that last a lifetime.
                Life at Track My Academy is about balance, joy, and meaningful connections.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="px-6 lg:px-12 xl:px-24">
        <div className="max-w-7xl mx-auto border-t border-gray-200"></div>
      </div>

      {/* Open Positions */}
      <section id="open-positions" className="py-20 px-6 lg:px-12 xl:px-24">
        <div className="max-w-7xl mx-auto text-left">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-16">
            Open positions
          </h2>

          <div className="space-y-0">
            {jobsData.map((job, index) => (
              <div key={job.id} className="opacity-0 animate-fade-in" style={{ animationDelay: `${0.5 + index * 0.1}s`, animationFillMode: 'forwards' }}>
                {index > 0 && <div className="border-t border-gray-200"></div>}
                <div
                  onClick={() => navigate(`/careers/${job.id}`)}
                  className="py-8 cursor-pointer group text-left"
                >
                  <div className="flex items-start justify-between gap-8">
                    <div className="flex-1 text-left">
                      <h3 className="text-2xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-base text-gray-500">
                        <span>{job.department}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {job.duration}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-2 transition-all flex-shrink-0 mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 px-6 lg:px-12 xl:px-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto text-left">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Can't find the right role?
          </h2>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl">
            We're always looking for talented people. Send us your resume and we'll
            keep you in mind for future opportunities.
          </p>
          <button
            onClick={() => navigate('/contact#')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Get in touch
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      <Footer />
    </div>
    </>
  );
};

export default CareersPage;
