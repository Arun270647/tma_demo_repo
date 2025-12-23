import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const SubscriptionPayment = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('starter_monthly');
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    loadPlans();
    loadCurrentSubscription();
    checkPaymentReturn();
  }, []);

  const loadPlans = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/billing/plans`);
      
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  const loadCurrentSubscription = async () => {
    if (!user?.id) return;
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/billing/academy/${user.id}/subscription`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error loading current subscription:', error);
    }
  };

  const checkPaymentReturn = () => {
    const urlParams = new URLSearchParams(location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
      setPaymentStatus('checking');
      pollPaymentStatus(sessionId);
    }
  };

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000; // 2 seconds

    if (attempts >= maxAttempts) {
      setPaymentStatus('timeout');
      return;
    }

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/billing/payment-status/${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }

      const data = await response.json();
      
      if (data.payment_status === 'paid') {
        setPaymentStatus('success');
        loadCurrentSubscription(); // Refresh subscription data
        
        // Clear URL parameters after successful payment
        setTimeout(() => {
          navigate('/billing', { replace: true });
        }, 3000);
        return;
      } else if (data.status === 'expired') {
        setPaymentStatus('expired');
        return;
      }

      // If payment is still pending, continue polling
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentStatus('error');
    }
  };

  const handleSubscribe = async () => {
    if (!user?.id || !selectedPlan) return;
    
    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const originUrl = window.location.origin;
      
      const response = await fetch(`${backendUrl}/api/billing/create-payment-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          academy_id: user.id,
          billing_cycle: selectedPlan.includes('monthly') ? 'monthly' : 'annual',
          origin_url: originUrl
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Redirect to Stripe Checkout
        if (data.checkout_url) {
          window.location.href = data.checkout_url;
        } else {
          throw new Error('No checkout URL received');
        }
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create payment session');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(`Payment failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getAnnualSavings = (monthlyPrice, annualPrice) => {
    const monthlyTotal = monthlyPrice * 12;
    const savings = monthlyTotal - annualPrice;
    const percentage = Math.round((savings / monthlyTotal) * 100);
    return { amount: savings, percentage };
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-400 mb-6">Please log in to view billing information.</p>
          <button 
            onClick={() => navigate('/login')}
            className="bg-sky-500 text-white px-6 py-3 rounded-lg hover:bg-sky-600 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <img 
            src="https://i.ibb.co/1tLZ0Dp1/TMA-LOGO-without-bg.png" 
            alt="Track My Academy" 
            className="h-16 w-auto mx-auto mb-6"
          />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-400 to-white bg-clip-text text-transparent mb-4">
            Choose Your Plan
          </h1>
          <p className="text-gray-400 text-lg">
            Select the perfect plan for your academy's needs
          </p>
        </div>

        {/* Payment Status Messages */}
        {paymentStatus === 'checking' && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <svg className="animate-spin w-5 h-5 text-blue-400 mr-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-blue-400 font-medium">Checking payment status...</p>
            </div>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-400 font-medium">Payment successful! Your subscription is now active. Redirecting...</p>
            </div>
          </div>
        )}

        {paymentStatus === 'expired' && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400 font-medium">Payment session expired. Please try again.</p>
            </div>
          </div>
        )}

        {/* Current Subscription Status */}
        {currentSubscription && (
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">Current Subscription</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Plan</p>
                <p className="text-white font-medium capitalize">{currentSubscription.plan_id} ({currentSubscription.billing_cycle})</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Status</p>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${
                  currentSubscription.status === 'active' 
                    ? 'bg-green-500/20 text-green-400 border-green-400/30'
                    : 'bg-red-500/20 text-red-400 border-red-400/30'
                }`}>
                  {currentSubscription.status}
                </span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Next Billing</p>
                <p className="text-white font-medium">
                  {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {Object.entries(plans).map(([planKey, plan]) => {
            const isAnnual = plan.billing_cycle === 'annual';
            const monthlyEquivalent = planKey.replace('_annual', '_monthly');
            const savings = isAnnual && plans[monthlyEquivalent] 
              ? getAnnualSavings(plans[monthlyEquivalent].price, plan.price)
              : null;

            return (
              <div 
                key={planKey}
                className={`relative bg-white/5 backdrop-blur-md rounded-2xl p-8 border transition-all duration-300 hover:scale-105 cursor-pointer ${
                  selectedPlan === planKey 
                    ? 'border-sky-400 shadow-lg shadow-sky-500/25' 
                    : 'border-white/10 hover:border-sky-400/50'
                }`}
                onClick={() => setSelectedPlan(planKey)}
              >
                {planKey.includes('pro') && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-sky-500 to-sky-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {savings && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      Save {savings.percentage}%
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold bg-gradient-to-r from-sky-400 to-white bg-clip-text text-transparent mb-2">
                    {formatCurrency(plan.price)}
                  </div>
                  <p className="text-gray-400">
                    per {plan.billing_cycle}
                    {isAnnual && ` (${formatCurrency(plan.price / 12)}/month)`}
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 text-sky-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Up to {plan.player_limit} players
                  </div>
                  <div className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 text-sky-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Up to {plan.coach_limit} coaches
                  </div>
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 text-sky-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </div>
                  ))}
                </div>

                {selectedPlan === planKey && (
                  <div className="absolute inset-0 border-2 border-sky-400 rounded-2xl pointer-events-none"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Subscribe Button */}
        <div className="text-center">
          <button
            onClick={handleSubscribe}
            disabled={loading || !selectedPlan}
            className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 disabled:from-gray-600 disabled:to-gray-700 px-12 py-4 rounded-xl text-white font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-sky-500/25 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : (
              `Subscribe to ${plans[selectedPlan]?.name || 'Selected Plan'}`
            )}
          </button>
          
          <p className="text-gray-400 text-sm mt-4">
            Secure payment powered by Stripe • Cancel anytime
          </p>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sky-400 hover:text-sky-300 underline transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPayment;
