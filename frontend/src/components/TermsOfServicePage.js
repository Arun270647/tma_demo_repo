import React from 'react';
import Header from './landing/Header';
import Footer from './landing/Footer';
import SEOHelmet from './SEOHelmet';
import Breadcrumbs from './Breadcrumbs';

const TermsOfServicePage = () => {
  const lastUpdated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Terms of Service', url: '/terms-of-service' }
  ];

  const termsStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Terms of Service - Track My Academy",
    "description": "Terms of service for Track My Academy sports management software platform",
    "publisher": {
      "@type": "Organization",
      "name": "Track My Academy"
    },
    "dateModified": new Date().toISOString()
  };

  return (
    <>
      <SEOHelmet
        title="Terms of Service - Track My Academy"
        description={`Read the terms governing your use of Track My Academy platform and services. Comprehensive terms covering user responsibilities, service usage, and legal agreements. Last updated: ${lastUpdated}`}
        canonical="/terms-of-service"
        structuredData={termsStructuredData}
        noindex={false}
      />

      <div className="bg-white min-h-screen flex flex-col">
        <Header />
        <Breadcrumbs items={breadcrumbItems} />

      {/* Hero Section */}
      <section className="pt-32 pb-12 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
            Terms of Service
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            These terms govern your use of Track My Academy and its services.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Last updated: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 flex-grow">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-left space-y-16">

            {/* Introduction */}
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>
                These Terms of Service (“Terms”) govern access to and use of
                Track My Academy (“TMA”, “we”, “our”, or “us”), including our
                website, applications, dashboards, and connected sports
                technology products.
              </p>
              <p>
                By accessing or using TMA, you agree to comply with these Terms.
                If you do not agree, you must not use the platform.
              </p>
            </div>

            {/* Acceptance */}
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold text-gray-900 border-b pb-2">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-700 leading-relaxed">
                By registering, accessing, or using Track My Academy, you confirm
                that you have read, understood, and agreed to these Terms and
                our Privacy Policy.
              </p>
            </div>

            {/* Eligibility */}
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold text-gray-900 border-b pb-2">
                2. Eligibility
              </h2>
              <p className="text-gray-700 leading-relaxed">
                You must be legally capable of entering into a binding agreement
                to use this Service. For minors, access must be managed through
                an academy, coach, or authorized guardian.
              </p>
            </div>

            {/* Services */}
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold text-gray-900 border-b pb-2">
                3. Services Provided
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Track My Academy provides a digital platform for managing sports
                academies, tracking athlete performance, enabling coach feedback,
                and integrating IoT-based sports analytics.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We may update, modify, or discontinue features at any time to
                improve the platform.
              </p>
            </div>

            {/* Accounts */}
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold text-gray-900 border-b pb-2">
                4. User Accounts & Responsibilities
              </h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>You are responsible for maintaining account confidentiality</li>
                <li>You must provide accurate and current information</li>
                <li>You may not share accounts or impersonate others</li>
                <li>You are responsible for all activity under your account</li>
              </ul>
            </div>

            {/* Payments */}
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold text-gray-900 border-b pb-2">
                5. Payments & Subscriptions
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Certain features of TMA may require paid subscriptions.
                Payments are processed via secure third-party payment providers.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Subscription fees are non-refundable unless otherwise stated.
              </p>
            </div>

            {/* Data */}
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold text-gray-900 border-b pb-2">
                6. Data & Privacy
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Your data is handled in accordance with our Privacy Policy.
                Performance data, training metrics, and IoT-generated data are
                used solely for sports development and platform improvement.
              </p>
            </div>

            {/* Prohibited Use */}
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold text-gray-900 border-b pb-2">
                7. Prohibited Use
              </h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Misusing or attempting to hack the platform</li>
                <li>Uploading false, harmful, or illegal content</li>
                <li>Reverse engineering or copying platform components</li>
                <li>Using data for unauthorized commercial purposes</li>
              </ul>
            </div>

            {/* IP */}
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold text-gray-900 border-b pb-2">
                8. Intellectual Property
              </h2>
              <p className="text-gray-700 leading-relaxed">
                All content, software, designs, logos, and technology used in
                Track My Academy are the intellectual property of TMA and may
                not be used without prior written permission.
              </p>
            </div>

            {/* Termination */}
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold text-gray-900 border-b pb-2">
                9. Termination
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to suspend or terminate accounts that
                violate these Terms or misuse the platform, with or without notice.
              </p>
            </div>

            {/* Liability */}
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold text-gray-900 border-b pb-2">
                10. Limitation of Liability
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Track My Academy is not liable for indirect, incidental, or
                consequential damages arising from use of the Service.
                Use of the platform is at your own risk.
              </p>
            </div>

            {/* Law */}
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold text-gray-900 border-b pb-2">
                11. Governing Law
              </h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms are governed by and construed in accordance with
                the laws of India. Any disputes shall be subject to the
                jurisdiction of Chennai, Tamil Nadu.
              </p>
            </div>

            {/* Contact */}
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold text-gray-900 border-b pb-2">
                Contact Information
              </h2>
              <div className="bg-gray-100 rounded-xl p-6 border border-gray-200 shadow-md">
                <p className="text-gray-700 mb-4 font-semibold">
                  For questions regarding these Terms:
                </p>
                <p className="text-gray-700">
                  <strong>Email:</strong>{' '}
                  <a
                    href="mailto:admin@trackmyacademy.com"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    support@trackmyacademy.com
                  </a>
                </p>
              </div>
            </div>

            {/* Updates */}
            <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200 shadow-lg">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Changes to These Terms
              </h2>
              <p className="text-gray-700">
                We may update these Terms as our services evolve.
                Continued use of Track My Academy after changes means
                you accept the updated Terms.
              </p>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
    </>
  );
};

export default TermsOfServicePage;
