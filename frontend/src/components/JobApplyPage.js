import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { jobsData } from '../data/jobsData';
import Header from './landing/Header';
import Footer from './landing/Footer';
import SEOHelmet from './SEOHelmet';
import Breadcrumbs from './Breadcrumbs';

const JobApplyPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const job = jobsData.find(j => j.id === jobId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Map job IDs to Zoho form URLs
  const formUrls = {
    'product-development-intern': 'https://forms.zohopublic.in/trackmyacademy/form/InternshipOnboardingformProductDevelopmentIntern/formperma/k_dMEE4h1nnOHjbUEL__6wSY0dQ2VUk02bC1UJ4XGP4',
    'frontend-development-intern': 'https://forms.zohopublic.in/trackmyacademy/form/FrontEndDevelopmentInternshipForm/formperma/-aZ4cZt3SCItS7eReupnmw3_nwxh5SePD2qL7EQAHPo',
    'product-research-intern': 'https://forms.zohopublic.in/trackmyacademy/form/ResearchandDevelopmentInternshipForm/formperma/PQGWmpQsZit9FM96fgGs-cWm2vZvnnAcox5dTHIuAaY',
    'blog-content-writing-intern': 'https://forms.zohopublic.in/trackmyacademy/form/BlogContentWritingIntern/formperma/Jf2RY3Tp63Gdlms1cBcOs4s9uqnrZAye3hkQ86spSPE'
  };

  const formUrl = formUrls[jobId];

  if (!job || !formUrl) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-900 text-lg mb-4">Application form not found.</p>
          <button
            onClick={() => navigate('/careers')}
            className="text-blue-600 font-medium hover:underline"
          >
            Back to Careers
          </button>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Careers', url: '/careers' },
    { name: job.title, url: `/careers/${job.id}` },
    { name: 'Apply', url: `/careers/apply/${job.id}` }
  ];

  return (
    <>
      <SEOHelmet
        title={`Apply for ${job.title} - Track My Academy`}
        description={`Apply for the ${job.title} position at Track My Academy. ${job.location} | ${job.type} | ${job.duration}. Submit your application now!`}
        canonical={`/careers/apply/${job.id}`}
        noindex={true}
      />

      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <Breadcrumbs items={breadcrumbItems} />

        {/* Minimal Page Header */}
        <div className="pt-6 pb-4 px-4 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
          <div className="max-w-full mx-auto">
            <button
              onClick={() => navigate(`/careers/${jobId}`)}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-3 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Job Details
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
              Apply for {job.title}
            </h1>
            <p className="text-sm text-gray-600">
              {job.location} • {job.type} • {job.duration}
            </p>
          </div>
        </div>

        {/* Full-width iframe container - no padding, no borders */}
        <div className="flex-1 bg-white overflow-hidden">
          <iframe
            title={`Application Form - ${job.title}`}
            src={formUrl}
            aria-label={job.title}
            frameBorder="0"
            style={{
              width: '100%',
              height: 'calc(100vh - 220px)',
              minHeight: '1000px',
              border: 'none',
              display: 'block'
            }}
            allowFullScreen
          >
            Loading application form...
          </iframe>
        </div>
      </div>
    </>
  );
};

export default JobApplyPage;
