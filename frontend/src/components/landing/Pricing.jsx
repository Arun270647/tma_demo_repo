import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import velsIncubationLogo from '../../assets/vels_incubation.jpg'; // Import the image

const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
  </svg>
);

const Pricing = () => {
  // 1. State for handling the annual/monthly toggle
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'annual' or 'monthly'

  const plans = [
    {
      name: "Starter",
      description: "Perfect for new and growing academies",
      annualPrice: "₹0",
      monthlyPrice: "₹0",
      savings: "",
      color: "blue",
      popular: false,
      guarantee: false,
      features: [
        "Up to 50 Players",
        "5 Coach Accounts",
        "Basic Performance Tracking",
        "Attendance Management",
        "Communication Hub",
        "Email Support",
        "Mobile App Access",
        "Data Export"
      ],
      cta: "Start Now"
    },
    {
      name: "Pro",
      description: "Best for established academies",
      annualPrice: "₹29,999",
      monthlyPrice: "₹3,500", 
      savings: "2 months (₹7,000)",
      color: "green",
      popular: true,
      guarantee: true,
      features: [
        "Up to 250 Players",
        "25 Coach Accounts",
        "Advanced Analytics",
        "Performance Insights",
        "Priority Support",
        "Multi-Location Support",
        "Custom Branding"
      ],
      cta: "Start Free Trial"
    },
    {
      name: "Enterprise",
      description: "For large-scale organizations",
      annualPrice: "₹44,999",
      monthlyPrice: "₹5,499", 
      savings: "2 months (₹10,998)",
      color: "purple",
      popular: false,
      guarantee: true,
      features: [
        "1000+ Players",
        "100+ Coach Accounts",
        "Custom Features",
        "White-label Options",
        "Dedicated Account Manager",
        "Priority Support",
        "Custom Integrations",
        "Advanced Security",
        "Training & Onboarding"
      ],
      cta: "Contact Sales"
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-100 rounded-full -translate-y-32 opacity-20"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-100 rounded-full translate-y-48 opacity-20"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black font-heading text-gray-900 mb-6">
            Simple, Transparent
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-500">
              Pricing Plans
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Choose the perfect plan for your academy. All plans include our core features with 
            no hidden costs and the flexibility to upgrade anytime.
          </p>
          
          {/* Billing Toggle - Now functional and responsive to state */}
          <div className="flex justify-center mb-12">
            <div className="bg-white rounded-xl p-2 shadow-xl border border-gray-200 inline-flex">
              <div className="flex space-x-1">
                <button 
                  onClick={() => setBillingCycle('annual')}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
                    billingCycle === 'annual' 
                      ? 'bg-blue-500 text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Annual (Save up to 2 months)
                </button>
                <button 
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
                    billingCycle === 'monthly' 
                      ? 'bg-blue-500 text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 ${
                plan.popular 
                  ? 'border-green-400 scale-[1.03] lg:scale-105'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-green-400 to-green-500 text-white text-sm font-bold px-6 py-2 rounded-full shadow-lg">
                    MOST POPULAR
                  </div>
                </div>
              )}
              <div className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  <div className="mb-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-5xl font-black text-gray-900">
                        {billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-gray-500 ml-2">
                        {plan.name !== 'Starter' ? (billingCycle === 'annual' ? '/year' : '/month') : ''}
                      </span>
                    </div>
                    {plan.name !== 'Starter' && (
                        <div className="text-gray-500 text-sm mt-1">
                          {billingCycle === 'annual' 
                            ? `~${(parseInt(plan.annualPrice.replace(/[₹,]/g, ''), 10) / 12).toFixed(0)}/month`
                            : `or ${plan.annualPrice}/year (Save ${plan.savings})`}
                        </div>
                    )}
                    {billingCycle === 'annual' && plan.savings && (
                      <div className="text-green-600 text-sm font-semibold mt-2">
                        {plan.savings}
                      </div>
                    )}
                  </div>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckIcon />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.name === 'Enterprise' ? "/contact" : "/login"}
                  className={`w-full block text-center font-bold py-4 px-6 rounded-xl transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-green-200'
                      : plan.name === 'Enterprise'
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-purple-200'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-blue-200'
                  }`}
                >
                  {plan.cta}
                </Link>
                {plan.guarantee && (
                    <p className="text-center text-sm text-gray-500 mt-4">
                        30-day money-back guarantee
                    </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="text-center bg-white rounded-3xl p-12 shadow-lg">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">
            Have Questions?
          </h3>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            Our team is here to help you choose the right plan and get started with Track My Academy. 
            Contact us for personalized guidance and pricing for larger organizations.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/contact#top"
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
            >
              Contact Sales
            </Link>
            {/* --- THIS BUTTON IS NOW FIXED --- */}
            <Link
              to="/contact#top"
              className="border-2 border-gray-300 text-gray-700 font-semibold py-3 px-8 rounded-xl hover:border-blue-500 hover:text-blue-500 transition-all duration-300"
            >
              Email Support
            </Link>
          </div>
        </div>
        
        {/* --- INCUBATION SECTION --- */}
        <div className="mt-16 bg-white rounded-3xl p-12 shadow-lg">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column: Text */}
            <div className="text-left">
              <h2 className="text-3xl font-black text-gray-900 mb-6">
                We Are <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">Proudly Incubated at VELS Innovation Council (VIC) since 2024</span>
              </h2>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                At Track My Academy, we’re not just building software—we’re backed by the vision and support of VELS Innovation Council's ecosystem. Being incubated at VIC means:
              </p>
              <ul className="text-left space-y-5 text-gray-700">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold mr-3 mt-1">&#10003;</span>
                  <span><strong>Trusted Academic Foundation</strong> – VIC provides a strong operational and research base that empowers our product to meet high standards of quality, data-integrity, and user experience.</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold mr-3 mt-1">&#10003;</span>
                  <span><strong>Access to Talent & Resource Networks</strong> – With access to cutting-edge labs, student interns, and domain experts, we constantly refine our platform to respond to real-world academy-management challenges.</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold mr-3 mt-1">&#10003;</span>
                  <span><strong>Accelerated Innovation & Growth</strong> – The incubation support helps us deploy rapidly, iterate smartly, and scale confidently—so your academy benefits from a future-ready solution, built on solid foundations.</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold mr-3 mt-1">&#10003;</span>
                  <span><strong>Commitment to Sports & Education Excellence</strong> – VIC’s commitment to combining academic discipline with sports development resonates directly with our mission: empowering every ground-based academy, coach, and student with technology that works.</span>
                </li>
              </ul>
            </div>

            {/* Right Column: Image */}
            <div className="flex items-center justify-center">
              <img 
                src={velsIncubationLogo} 
                alt="VELS Innovation Council Logo" 
                className="mx-auto w-full max-w-md h-auto rounded-lg shadow-md"
              />
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
