import React from 'react';
import Header from './landing/Header';
import Footer from './landing/Footer';
import SEOHelmet from './SEOHelmet';
import Breadcrumbs from './Breadcrumbs';

const PrivacyPolicyPage = () => {
  const lastUpdated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Privacy Policy', url: '/privacy-policy' }
  ];

  const privacyStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Privacy Policy - Track My Academy",
    "description": "Privacy policy for Track My Academy sports management software platform",
    "publisher": {
      "@type": "Organization",
      "name": "Track My Academy"
    },
    "dateModified": new Date().toISOString()
  };

  return (
    <>
      <SEOHelmet
        title="Privacy Policy - Track My Academy"
        description={`Learn how Track My Academy collects, uses, and protects your data. Our comprehensive privacy policy explains data handling, security measures, and your rights. Last updated: ${lastUpdated}`}
        canonical="/privacy-policy"
        structuredData={privacyStructuredData}
        noindex={false}
      />

      <div className="bg-white min-h-screen flex flex-col">
        <Header />
        <Breadcrumbs items={breadcrumbItems} />

      {/* Hero Section */}
      <section className="pt-32 pb-12 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Your privacy matters. This policy explains how Track My Academy collects, uses,
            and protects your data.
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
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Track My Academy (“TMA”, “we”, “our”, or “us”) is a sports-technology platform
                built to support athletes, coaches, and academies through data-driven
                training and performance insights.
              </p>
              <p>
                This Privacy Policy explains what information we collect, why we collect it,
                and how we ensure it is handled responsibly.
              </p>
            </div>

            {/* Information We Collect */}
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold text-gray-900 border-b pb-2">
                Information We Collect
              </h2>

              <div className="space-y-4 text-gray-700 leading-relaxed">
                <h3 className="text-2xl font-bold text-gray-800">
                  Academy Owners / Admins
                </h3>
                <p>
                  When an academy registers on TMA, we collect basic personal details
                  (name, email, phone), academy information (academy name, address, logo),
                  and billing details processed securely via trusted payment partners.
                </p>

                <h3 className="text-2xl font-bold text-gray-800">
                  Coaches
                </h3>
                <p>
                  We collect coach profile information such as name, contact details,
                  assigned academy, training schedules, and feedback entered within the
                  platform.
                </p>

                <h3 className="text-2xl font-bold text-gray-800">
                  Players / Parents
                </h3>
                <p>
                  For players, we collect basic personal information (name, age, contact
                  details) and sports-related data such as attendance, performance metrics,
                  progress reports, and coach assessments.
                </p>

                <h3 className="text-2xl font-bold text-gray-800">
                  IoT & Performance Data
                </h3>
                <p>
                  When TMA-supported hardware or tracking devices are used, we may collect
                  motion, force, and training data strictly for performance analysis and
                  improvement.
                </p>
              </div>
            </div>

            {/* How We Use Data */}
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold text-gray-900 border-b pb-2">
                How We Use Your Data
              </h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>To track and improve athlete performance</li>
                <li>To help coaches deliver better training insights</li>
                <li>To enable smooth interaction between academies, coaches, and players</li>
                <li>To improve platform features and reliability</li>
                <li>To ensure security and prevent misuse</li>
              </ul>
              <p className="font-semibold text-gray-800">
                We do not sell or rent user data to advertisers or third parties.
              </p>
            </div>

            {/* Data Sharing */}
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold text-gray-900 border-b pb-2">
                Data Sharing
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Data is shared only with the relevant academy, assigned coaches,
                trusted service providers (such as cloud infrastructure and analytics),
                or when required by law. All partners are bound by strict confidentiality
                and security obligations.
              </p>
            </div>

            {/* Security */}
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold text-gray-900 border-b pb-2">
                Data Security
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We use secure servers, encrypted storage, access controls, and regular
                monitoring to protect your data. While no system is completely immune,
                TMA follows industry-standard security practices.
              </p>
            </div>

            {/* User Rights */}
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold text-gray-900 border-b pb-2">
                Your Rights
              </h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Access and update your personal information</li>
                <li>Request correction of inaccurate data</li>
                <li>Request account or data deletion</li>
                <li>Control communication preferences</li>
              </ul>
            </div>

            {/* Children */}
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold text-gray-900 border-b pb-2">
                Children’s Privacy
              </h2>
              <p className="text-gray-700 leading-relaxed">
                For minors, data is managed through academies or authorized guardians.
                We do not knowingly collect personal data without appropriate consent.
              </p>
            </div>

            {/* Contact */}
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold text-gray-900 border-b pb-2">
                Contact Us
              </h2>
              <div className="bg-gray-100 rounded-xl p-6 border border-gray-200 shadow-md">
                <p className="text-gray-700 mb-4 font-semibold">
                  For questions about this Privacy Policy:
                </p>
                <p className="text-gray-700">
                  <strong>Email:</strong>{' '}
                  <a
                    href="mailto:privacy@trackmyacademy.com"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    privacy@trackmyacademy.com
                  </a>
                </p>
              </div>
            </div>

            {/* Updates */}
            <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200 shadow-lg">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Policy Updates
              </h2>
              <p className="text-gray-700">
                We may update this Privacy Policy as our platform evolves. Any changes
                will be reflected on this page with a revised update date.
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

export default PrivacyPolicyPage;
