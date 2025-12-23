import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

const BillingDashboard = () => {
  const { token } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('subscriptions');
  const [stats, setStats] = useState({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      // Load subscriptions
      const subscriptsionsResponse = await fetch(`${backendUrl}/api/admin/billing/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Load transactions
      const transactionsResponse = await fetch(`${backendUrl}/api/admin/billing/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (subscriptsionsResponse.ok && transactionsResponse.ok) {
        const subscriptionsData = await subscriptsionsResponse.json();
        const transactionsData = await transactionsResponse.json();
        
        setSubscriptions(subscriptionsData);
        setTransactions(transactionsData);
        
        // Calculate stats
        const activeSubscriptions = subscriptionsData.filter(s => s.status === 'active').length;
        const totalRevenue = transactionsData
          .filter(t => t.payment_status === 'paid')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyRevenue = transactionsData
          .filter(t => {
            const transactionDate = new Date(t.created_at);
            return t.payment_status === 'paid' && 
                   transactionDate.getMonth() === currentMonth && 
                   transactionDate.getFullYear() === currentYear;
          })
          .reduce((sum, t) => sum + t.amount, 0);
        
        setStats({
          totalSubscriptions: subscriptionsData.length,
          activeSubscriptions,
          monthlyRevenue,
          totalRevenue
        });
      }
    } catch (error) {
      console.error('Error loading billing data:', error);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-400/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-400/30';
      case 'suspended': return 'bg-orange-500/20 text-orange-400 border-orange-400/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30';
      case 'paid': return 'bg-green-500/20 text-green-400 border-green-400/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-400/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-400/30';
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color.replace('text', 'bg').replace('-400', '-400/20')}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Billing & Subscriptions</h2>
        <p className="text-gray-400">Manage academy subscriptions and payment transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Subscriptions"
          value={stats.totalSubscriptions}
          color="text-blue-400"
          icon={
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 011.732-1.732l.268.268a2 2 0 002.828 0l.268-.268A2 2 0 0112 8a2 2 0 11-4 4 2 2 0 01-2-2z" />
            </svg>
          }
        />
        <StatCard
          title="Active Subscriptions"
          value={stats.activeSubscriptions}
          color="text-green-400"
          icon={
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          }
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          color="text-yellow-400"
          icon={
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
          }
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          color="text-sky-400"
          icon={
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
            </svg>
          }
        />
      </div>

      {/* Tabs */}
      <div className="flex space-x-4">
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
            activeTab === 'subscriptions'
              ? 'bg-sky-500 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          Subscriptions ({subscriptions.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
            activeTab === 'transactions'
              ? 'bg-sky-500 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          Transactions ({transactions.length})
        </button>
      </div>

      {/* Content */}
      <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
        {activeTab === 'subscriptions' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-white font-semibold">Academy</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Plan</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Billing</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Amount</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Period</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{subscription.academy_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-300 capitalize">{subscription.plan_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-300 capitalize">{subscription.billing_cycle}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{formatCurrency(subscription.amount)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(subscription.status)}`}>
                        {subscription.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-300 text-sm">
                        <div>{formatDate(subscription.current_period_start)}</div>
                        <div className="text-xs text-gray-500">to {formatDate(subscription.current_period_end)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors">
                          Edit
                        </button>
                        <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors">
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {subscriptions.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400">No subscriptions found.</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-white font-semibold">Transaction ID</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Academy</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Amount</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Description</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white font-mono text-sm">{transaction.session_id.slice(0, 12)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-300">{transaction.academy_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{formatCurrency(transaction.amount)}</div>
                      <div className="text-xs text-gray-500 uppercase">INR</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(transaction.payment_status)}`}>
                        {transaction.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-300">{transaction.description}</div>
                      {transaction.billing_cycle && (
                        <div className="text-xs text-gray-500 capitalize">{transaction.billing_cycle} billing</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-300">{formatDate(transaction.created_at)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {transactions.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400">No transactions found.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingDashboard;
