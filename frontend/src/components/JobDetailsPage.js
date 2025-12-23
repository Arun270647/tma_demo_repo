import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { jobsData } from '../data/jobsData';
import SEOHelmet from './SEOHelmet';
import Breadcrumbs from './Breadcrumbs';
import Header from './landing/Header';
import Footer from './landing/Footer';

const JobDetailsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const job = jobsData.find(j => j.id === jobId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!job) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-900 text-lg mb-4">Job not found.</p>
          <button onClick={() => navigate('/careers')} className="text-blue-600 font-medium hover:underline">
            Back to Careers
          </button>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Careers', url: '/careers' },
    { name: job.title, url: `/careers/${job.id}` }
  ];

  // Create JobPosting structured data for Google Jobs
  const jobPostingSchema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.roleOverview,
    "identifier": {
      "@type": "PropertyValue",
      "name": "Track My Academy",
      "value": job.id
    },
    "datePosted": "2025-01-01",
    "validThrough": "2025-12-31",
    "employmentType": job.type || "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": "Track My Academy",
      "sameAs": "https://www.trackmyacademy.com",
      "logo": "https://i.ibb.co/NkkHtWk/TMA-LOGO-without-bg.png"
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Incubation Centre, VISTAS",
        "addressLocality": job.location.split(',')[0],
        "addressRegion": "Tamil Nadu",
        "addressCountry": "IN"
      }
    },
    "responsibilities": job.responsibilities?.join(', '),
    "skills": job.idealProfile?.join(', '),
    "applicantLocationRequirements": {
      "@type": "Country",
      "name": "India"
    },
    "jobLocationType": "TELECOMMUTE"
  };

  return (
    <>
      <SEOHelmet
        title={`${job.title} at Track My Academy | ${job.location}`}
        description={`${job.roleOverview.substring(0, 155)}... Join Track My Academy's ${job.department} team in ${job.location}. ${job.type} position. Apply now!`}
        keywords={`${job.title}, ${job.department} jobs, ${job.location} jobs, sports tech careers, Track My Academy jobs, ${job.type}`}
        canonical={`/careers/${job.id}`}
        structuredData={jobPostingSchema}
      />

      <div className="min-h-screen bg-white">
        <Header />
        <Breadcrumbs items={breadcrumbItems} />

        <div className="font-sans pt-12 pb-20">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Back Navigation */}
        <button
          onClick={() => navigate('/careers')}
          className="flex items-center text-gray-500 hover:text-gray-900 mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to all jobs
        </button>

        {/* Job Header */}
        <div className="border-b border-gray-200 pb-10 mb-10 text-left">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            {job.title}
          </h1>

          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 text-gray-600 mb-8">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">Department</span>
              <span className="font-medium">{job.department}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">Location</span>
              <span className="font-medium">{job.location}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">Duration</span>
              <span className="font-medium">{job.duration}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">Type</span>
              <span className="font-medium">{job.type}</span>
            </div>
          </div>

          <button
            onClick={() => navigate(`/careers/apply/${job.id}`)}
            className="inline-block bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-md font-medium transition-all shadow-sm hover:shadow-md"
          >
            Apply for this position
          </button>
        </div>

        {/* Job Content - Strict Left Align */}
        <div className="space-y-12 text-left max-w-3xl">
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Role Overview</h3>
            <p className="text-gray-600 leading-relaxed text-lg">
              {job.roleOverview}
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Responsibilities</h3>
            <ul className="space-y-3">
              {job.responsibilities.map((item, i) => (
                <li key={i} className="flex items-start text-gray-600">
                  <span className="mr-3 mt-1.5 w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Ideal Profile</h3>
            <ul className="space-y-3">
              {job.idealProfile.map((item, i) => (
                <li key={i} className="flex items-start text-gray-600">
                  <span className="mr-3 mt-1.5 w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">What You'll Gain</h3>
            <ul className="space-y-3">
              {job.whatYoullGain.map((item, i) => (
                <li key={i} className="flex items-start text-gray-600">
                  <Check className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Footer CTA */}
        <div className="mt-16 pt-10 border-t border-gray-200 text-left">
          <p className="text-gray-900 font-medium mb-4">Interested in this role?</p>
          <button
            onClick={() => navigate(`/careers/apply/${job.id}`)}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-medium transition-colors"
          >
            Apply Now
          </button>
        </div>
      </div>
    </div>

    <Footer />
    </div>
    </>
  );
};

export default JobDetailsPage;
