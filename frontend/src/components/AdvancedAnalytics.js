import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { TrendingUp, TrendingDown, Users, IndianRupee, Target, Award, Calendar, BarChart3 } from 'lucide-react';
import { Line, Bar, Area } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

const AdvancedAnalytics = () => {
  const { token } = useAuth();
  const { isLight } = useTheme();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/academy/analytics/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGrowthTrendData = () => {
    if (!analytics?.growth_trend) return null;

    return {
      labels: analytics.growth_trend.map(t => t.month),
      datasets: [{
        label: 'New Players',
        data: analytics.growth_trend.map(t => t.new_players),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`text-center py-12 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
        No analytics data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
          Advanced Analytics
        </h2>
        <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mt-1`}>
          Comprehensive insights and performance metrics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-xl p-6`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>Player Growth Trend</h3>
              <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'} mt-1`}>New player acquisitions over last 6 months</p>
            </div>
            <BarChart3 className={`w-6 h-6 ${isLight ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          {getGrowthTrendData() && (
            <div className="h-80">
              <Line
                data={getGrowthTrendData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false }, tooltip: { backgroundColor: isLight ? '#fff' : '#1f2937', titleColor: isLight ? '#111827' : '#f9fafb', bodyColor: isLight ? '#374151' : '#d1d5db', borderColor: isLight ? '#e5e7eb' : '#374151', borderWidth: 1, padding: 12, displayColors: false } },
                  scales: { y: { beginAtZero: true, ticks: { color: isLight ? '#6b7280' : '#9ca3af', stepSize: 1 }, grid: { color: isLight ? '#f3f4f6' : '#374151' } }, x: { ticks: { color: isLight ? '#6b7280' : '#9ca3af' }, grid: { display: false } } }
                }}
              />
            </div>
          )}
        </div>
        <div className="min-h-[20rem] flex items-center justify-center p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${isLight ? 'bg-white border-2 border-blue-200' : 'bg-gray-900 border-2 border-cyan-500/40'} rounded-xl p-6 flex justify-between items-start`}>
            <div>
              <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Total Players</p>
              <p className={`text-3xl font-bold ${isLight ? 'text-blue-900' : 'text-blue-300'}`}>{analytics.total_players}</p>
              <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Active students</p>
            </div>
            <div className={`p-3 ${isLight ? 'bg-blue-100' : 'bg-cyan-500/20'} rounded-lg`}>
              <Users className={`w-6 h-6 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
            </div>
          </div>
          <div className={`${isLight ? 'bg-white border-2 border-green-200' : 'bg-gray-900 border-2 border-green-500/40'} rounded-xl p-6 flex justify-between items-start`}>
            <div>
              <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Retention Rate</p>
              <p className={`text-3xl font-bold ${analytics.retention_rate >= 70 ? (isLight ? 'text-green-700' : 'text-green-300') : (isLight ? 'text-red-600' : 'text-red-400')}`}>{analytics.retention_rate}%</p>
              <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>3-month retention</p>
            </div>
            <div className={`p-3 ${isLight ? (analytics.retention_rate >= 70 ? 'bg-green-100' : 'bg-red-100') : (analytics.retention_rate >= 70 ? 'bg-green-500/20' : 'bg-red-500/20')} rounded-lg`}>
              {analytics.retention_rate >= 70 ? (
                <TrendingUp className={`w-6 h-6 ${isLight ? 'text-green-600' : 'text-green-400'}`} />
              ) : (
                <TrendingDown className={`w-6 h-6 ${isLight ? 'text-red-600' : 'text-red-400'}`} />
              )}
            </div>
          </div>
          <div className={`${isLight ? 'bg-white border-2 border-purple-200' : 'bg-gray-900 border-2 border-purple-500/40'} rounded-xl p-6 flex justify-between items-start`}>
            <div>
              <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Avg Attendance</p>
              <p className={`text-3xl font-bold ${analytics.average_attendance >= 75 ? (isLight ? 'text-green-700' : 'text-green-300') : (isLight ? 'text-red-600' : 'text-red-400')}`}>{analytics.average_attendance}%</p>
              <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Overall academy</p>
            </div>
            <div className={`p-3 ${isLight ? 'bg-purple-100' : 'bg-purple-500/20'} rounded-lg`}>
              <Calendar className={`w-6 h-6 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
            </div>
          </div>
          <div className={`${isLight ? 'bg-white border-2 border-orange-200' : 'bg-gray-900 border-2 border-orange-500/40'} rounded-xl p-6 flex justify-between items-start`}>
            <div>
              <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Monthly Revenue</p>
              <p className={`text-3xl font-bold ${isLight ? 'text-orange-900' : 'text-orange-300'}`}>₹{analytics.monthly_revenue.toLocaleString()}</p>
              <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Last 30 days</p>
            </div>
            <div className={`p-3 ${isLight ? 'bg-orange-100' : 'bg-orange-500/20'} rounded-lg`}>
              <IndianRupee className={`w-6 h-6 ${isLight ? 'text-orange-600' : 'text-orange-400'}`} />
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Coaches */}
        <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-xl p-4 relative`}>
          <div className="absolute top-4 right-4">
            <div className={`p-2 ${isLight ? 'bg-gray-100' : 'bg-gray-700'} rounded-lg`}>
              <Users className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
          </div>
          <div className="space-y-1">
            <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'} font-medium mb-1`}>
              Total Coaches
            </p>
            <p className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              {analytics.total_coaches}
            </p>
            <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'} mt-2`}>
              Active coaching staff
            </p>
          </div>
        </div>

        {/* Total Batches */}
        <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-xl p-4 relative`}>
          <div className="absolute top-4 right-4">
            <div className={`p-2 ${isLight ? 'bg-gray-100' : 'bg-gray-700'} rounded-lg`}>
              <Award className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
          </div>
          <div className="space-y-1">
            <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'} font-medium mb-1`}>
              Total Batches
            </p>
            <p className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              {analytics.total_batches}
            </p>
            <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'} mt-2`}>
              Active training groups
            </p>
          </div>
        </div>

        {/* Player to Coach Ratio */}
        <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-xl p-4 relative`}>
          <div className="absolute top-4 right-4">
            <div className={`p-2 ${isLight ? 'bg-gray-100' : 'bg-gray-700'} rounded-lg`}>
              <Target className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
          </div>
          <div className="space-y-1">
            <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'} font-medium mb-1`}>
              Player-Coach Ratio
            </p>
            <p className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              {analytics.total_coaches > 0 ? Math.round(analytics.total_players / analytics.total_coaches) : 0}:1
            </p>
            <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'} mt-2`}>
              Students per coach
            </p>
          </div>
        </div>
      </div>


      {/* Insights Section */}
      <div className={`${isLight ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200' : 'bg-gradient-to-r from-blue-900/10 to-purple-900/10 border-blue-700'} border rounded-xl p-6`}>
        <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'} mb-4`}>
          📊 Key Insights
        </h3>
        <div className="space-y-3">
          {analytics.retention_rate >= 70 ? (
            <div className={`flex items-start gap-3 ${isLight ? 'text-green-700' : 'text-green-400'}`}>
              <div className="mt-0.5">✅</div>
              <p className="text-sm">
                Excellent retention rate at {analytics.retention_rate}%. Your academy is successfully retaining students long-term.
              </p>
            </div>
          ) : (
            <div className={`flex items-start gap-3 ${isLight ? 'text-orange-700' : 'text-orange-400'}`}>
              <div className="mt-0.5">⚠️</div>
              <p className="text-sm">
                Retention rate at {analytics.retention_rate}% could be improved. Consider engagement initiatives.
              </p>
            </div>
          )}

          {analytics.average_attendance >= 75 ? (
            <div className={`flex items-start gap-3 ${isLight ? 'text-green-700' : 'text-green-400'}`}>
              <div className="mt-0.5">✅</div>
              <p className="text-sm">
                Strong attendance rate of {analytics.average_attendance}%. Students are consistently participating.
              </p>
            </div>
          ) : (
            <div className={`flex items-start gap-3 ${isLight ? 'text-orange-700' : 'text-orange-400'}`}>
              <div className="mt-0.5">⚠️</div>
              <p className="text-sm">
                Attendance at {analytics.average_attendance}% needs attention. Review scheduling and engagement.
              </p>
            </div>
          )}

          {analytics.monthly_revenue > 0 && (
            <div className={`flex items-start gap-3 ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>
              <div className="mt-0.5">💰</div>
              <p className="text-sm">
                Monthly revenue of ₹{analytics.monthly_revenue.toLocaleString()} from fee collections.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
