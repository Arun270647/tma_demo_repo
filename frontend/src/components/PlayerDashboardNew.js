import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import {
  User, Calendar, TrendingUp, IndianRupee, Settings,
  LogOut, Upload, Camera, Award, Activity, Bell, Trash2
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
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
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PlayerDashboardNew = () => {
  const { user, signOut, token } = useAuth();
  const { theme, isLight, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [playerData, setPlayerData] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState(null);
  const [coachInfo, setCoachInfo] = useState(null);
  const [coachRating, setCoachRating] = useState(5);
  const [coachRatingNotes, setCoachRatingNotes] = useState('');
  const [submittingCoachRating, setSubmittingCoachRating] = useState(false);
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    notification_priority: 'all',
    push_notifications: true
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  // Logo resolver function - handles both full URLs and relative paths
  const defaultLogoUrl = "https://i.ibb.co/1tLZ0Dp/TMA-LOGO-without-bg.png";
  const resolveLogoSrc = (url) => {
    if (!url) return defaultLogoUrl;
    const v = String(url).trim();
    if (/^(https?:|data:|blob:)/i.test(v)) return v;
    const base = (API_BASE_URL || '').replace(/\/+$/,'');
    const path = v.replace(/^\/+/, '');
    return `${base}/${path}`;
  };

  useEffect(() => {
    loadAllData();

    // Poll for profile updates every 30 seconds to sync changes made by academy
    const profilePollingInterval = setInterval(() => {
      loadPlayerProfile();
    }, 30000); // 30 seconds

    return () => {
      clearInterval(profilePollingInterval);
    };
  }, []);

  const loadAllData = async () => {
    try {
      // Only show full-page loader on initial load, not on refreshes
      if (!initialLoadComplete) {
        setLoading(true);
      }
      await Promise.all([
        loadPlayerProfile(),
        loadPlayerStats(),
        loadAttendanceHistory(),
        loadPerformanceData(),
        loadPaymentHistory(),
        loadNotificationPreferences()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  };

  const loadCoachInfo = async () => {
    try {
      const today = new Date().toISOString().slice(0,10);
      const response = await fetch(`${API_BASE_URL}/api/player/coach-info?date=${encodeURIComponent(today)}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setCoachInfo(data);
      } else {
        setCoachInfo(null);
      }
    } catch (e) {
      console.error('Error loading coach info:', e);
      setCoachInfo(null);
    }
  };

  const loadPlayerProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/player/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPlayerData(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadPlayerStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/player/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPlayerStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadAttendanceHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/player/attendance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        const normalized = Array.isArray(data)
          ? data
          : Array.isArray(data?.attendance_records)
            ? data.attendance_records
            : Array.isArray(data?.records)
              ? data.records
              : [];
        setAttendanceHistory(normalized);
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const loadPerformanceData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/player/performance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPerformanceData(data);
      }
    } catch (error) {
      console.error('Error loading performance:', error);
    }
  };

  const loadPaymentHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/player/payment-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPaymentHistory(data);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const loadNotificationPreferences = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/player/notification-preferences`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert('Photo size must be less than 500KB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/api/player/upload-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setPlayerData(prev => ({
          ...prev,
          player: { ...prev.player, photo_url: data.photo_url }
        }));
        alert('Photo uploaded successfully!');
      } else {
        alert('Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Error uploading photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePasswordChange = async (currentPassword, newPassword) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/player/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      if (response.ok) {
        alert('Password changed successfully!');
        return true;
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to change password');
        return false;
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Error changing password');
      return false;
    }
  };

  const handleNotificationUpdate = async (newPrefs) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/player/notification-preferences?email_notifications=${newPrefs.email_notifications}&notification_priority=${newPrefs.notification_priority}&push_notifications=${newPrefs.push_notifications}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(newPrefs);
        alert('Notification preferences updated!');
      } else {
        alert('Failed to update preferences');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      alert('Error updating preferences');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Render Dashboard Content
  const renderDashboard = () => {
    if (!playerData || !playerStats) return null;

    const player = playerData.player;
    const academy = playerData.academy;

    // Prepare performance chart data
    const performanceCategories = Object.keys(playerStats.performance_by_category || {});
    const performanceValues = Object.values(playerStats.performance_by_category || {});

    const performanceChartData = {
      labels: performanceCategories,
      datasets: [{
        label: 'Performance Rating',
        data: performanceValues,
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2
      }]
    };

    // Prepare attendance chart data (last 30 days)
    const recentAttendance = (Array.isArray(attendanceHistory) ? attendanceHistory : []).slice(0, 30).reverse();
    const attendanceChartData = {
      labels: recentAttendance.map(a => new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [{
        label: 'Attendance',
        data: recentAttendance.map(a => a.present ? 1 : 0),
        fill: true,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: 'rgb(16, 185, 129)',
        tension: 0.4
      }]
    };

    return (
      <div className="space-y-6">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Player Photo Card - Spans 1 column */}
          <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-xl p-6 flex flex-col items-center justify-center relative`}>
            <div className="relative">
              {player.photo_url ? (
                <img
                  src={player.photo_url.startsWith('data:') ? player.photo_url : `${API_BASE_URL}${player.photo_url}`}
                  alt="Player"
                  className="w-32 h-32 rounded-full object-cover border-4 border-blue-500"
                />
              ) : (
                <div className={`w-32 h-32 rounded-full ${isLight ? 'bg-gray-200' : 'bg-gray-700'} flex items-center justify-center border-4 border-blue-500`}>
                  <User className={`w-16 h-16 ${isLight ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
              </label>
            </div>
            <div className="mt-4 text-center">
              <h3 className={`text-xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                {player.first_name} {player.last_name}
              </h3>
              <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm mt-1`}>
                {academy?.name}
              </p>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">
                  {player.sport}
                </span>
              </div>
              {playerStats.coach_name && (
                <p className={`${isLight ? 'text-gray-500' : 'text-gray-400'} text-xs mt-2`}>
                  Coach: {playerStats.coach_name}
                </p>
              )}
            </div>
          </div>

          {/* Stats Cards - Span 2 columns */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            {/* Attendance Percentage */}
            <div className={`${isLight ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' : 'bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-700'} border rounded-xl p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${isLight ? 'text-green-600' : 'text-green-400'} text-sm font-medium`}>Attendance</p>
                  <p className={`text-3xl font-bold ${isLight ? 'text-green-700' : 'text-green-300'} mt-1`}>
                    {playerStats.attendance_percentage}%
                  </p>
                  <p className={`${isLight ? 'text-green-600' : 'text-green-500'} text-xs mt-1`}>
                    {playerStats.attended_sessions} / {playerStats.total_sessions} sessions
                  </p>
                </div>
                <Calendar className={`w-12 h-12 ${isLight ? 'text-green-500' : 'text-green-400'} opacity-50`} />
              </div>
            </div>

            {/* Performance Score */}
            <div className={`${isLight ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' : 'bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-700'} border rounded-xl p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${isLight ? 'text-blue-600' : 'text-blue-400'} text-sm font-medium`}>Performance</p>
                  <p className={`text-3xl font-bold ${isLight ? 'text-blue-700' : 'text-blue-300'} mt-1`}>
                    {Math.round(playerStats.overall_performance)}
                  </p>
                  <p className={`${isLight ? 'text-blue-600' : 'text-blue-500'} text-xs mt-1`}>
                    Overall Score
                  </p>
                </div>
                <TrendingUp className={`w-12 h-12 ${isLight ? 'text-blue-500' : 'text-blue-400'} opacity-50`} />
              </div>
            </div>

            {/* Training Sessions */}
            <div className={`${isLight ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200' : 'bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-700'} border rounded-xl p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${isLight ? 'text-purple-600' : 'text-purple-400'} text-sm font-medium`}>Sessions</p>
                  <p className={`text-3xl font-bold ${isLight ? 'text-purple-700' : 'text-purple-300'} mt-1`}>
                    {playerStats.total_sessions}
                  </p>
                  <p className={`${isLight ? 'text-purple-600' : 'text-purple-500'} text-xs mt-1`}>
                    Total Completed
                  </p>
                </div>
                <Activity className={`w-12 h-12 ${isLight ? 'text-purple-500' : 'text-purple-400'} opacity-50`} />
              </div>
            </div>

            {/* Achievement Badge */}
            <div className={`${isLight ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200' : 'bg-gradient-to-br from-orange-900/20 to-orange-800/20 border-orange-700'} border rounded-xl p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${isLight ? 'text-orange-600' : 'text-orange-400'} text-sm font-medium`}>Status</p>
                  <p className={`text-xl font-bold ${isLight ? 'text-orange-700' : 'text-orange-300'} mt-1`}>
                    {playerStats.attendance_percentage >= 80 ? '🌟 Excellent' : playerStats.attendance_percentage >= 60 ? '👍 Good' : '📈 Improving'}
                  </p>
                  <p className={`${isLight ? 'text-orange-600' : 'text-orange-500'} text-xs mt-1`}>
                    Keep it up!
                  </p>
                </div>
                <Award className={`w-12 h-12 ${isLight ? 'text-orange-500' : 'text-orange-400'} opacity-50`} />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Chart */}
          <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-xl p-6`}>
            <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'} mb-4`}>
              Performance by Category
            </h3>
            {performanceCategories.length > 0 ? (
              <Bar
                data={performanceChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 10,
                      ticks: { color: isLight ? '#666' : '#ccc' },
                      grid: { color: isLight ? '#eee' : '#333' }
                    },
                    x: {
                      ticks: { color: isLight ? '#666' : '#ccc' },
                      grid: { display: false }
                    }
                  }
                }}
              />
            ) : (
              <p className={`${isLight ? 'text-gray-500' : 'text-gray-400'} text-center py-8`}>
                No performance data available
              </p>
            )}
          </div>

          {/* Attendance Chart */}
          <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-xl p-6`}>
            <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'} mb-4`}>
              Attendance Trend (Last 30 Days)
            </h3>
            {attendanceHistory.length > 0 ? (
              <Line
                data={attendanceChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 1,
                      ticks: {
                        stepSize: 1,
                        color: isLight ? '#666' : '#ccc',
                        callback: (value) => value === 1 ? 'Present' : 'Absent'
                      },
                      grid: { color: isLight ? '#eee' : '#333' }
                    },
                    x: {
                      ticks: { color: isLight ? '#666' : '#ccc', maxRotation: 45, minRotation: 45 },
                      grid: { display: false }
                    }
                  }
                }}
              />
            ) : (
              <p className={`${isLight ? 'text-gray-500' : 'text-gray-400'} text-center py-8`}>
                No attendance data available
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render Payments Page
  const renderPayments = () => {
    if (!paymentHistory) return null;

    return (
      <div className="space-y-6">
        <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
          Payment History
        </h2>

        {/* Next Payment Info */}
        {paymentHistory.next_payment && (
          <div className={`${isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-700'} border rounded-xl p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${isLight ? 'text-blue-800' : 'text-blue-300'}`}>
                  Next Payment Due
                </h3>
                <p className={`${isLight ? 'text-blue-600' : 'text-blue-400'} mt-1`}>
                  Due on: {new Date(paymentHistory.next_payment.due_date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-bold ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>
                  ₹{paymentHistory.next_payment.amount}
                </p>
                <p className={`${isLight ? 'text-blue-600' : 'text-blue-400'} text-sm mt-1`}>
                  {paymentHistory.next_payment.billing_cycle}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment History Table */}
        <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-xl overflow-hidden`}>
          <div className="p-6">
            <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'} mb-4`}>
              Past Payments
            </h3>
            {paymentHistory.payment_history && paymentHistory.payment_history.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`${isLight ? 'border-gray-200' : 'border-gray-700'} border-b`}>
                      <th className={`text-left py-3 px-4 ${isLight ? 'text-gray-700' : 'text-gray-300'} font-medium`}>Date</th>
                      <th className={`text-left py-3 px-4 ${isLight ? 'text-gray-700' : 'text-gray-300'} font-medium`}>Amount</th>
                      <th className={`text-left py-3 px-4 ${isLight ? 'text-gray-700' : 'text-gray-300'} font-medium`}>Method</th>
                      <th className={`text-left py-3 px-4 ${isLight ? 'text-gray-700' : 'text-gray-300'} font-medium`}>Cycle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.payment_history.map((payment, index) => (
                      <tr key={index} className={`${isLight ? 'border-gray-100' : 'border-gray-700'} border-b last:border-0`}>
                        <td className={`py-3 px-4 ${isLight ? 'text-gray-800' : 'text-gray-300'}`}>
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </td>
                        <td className={`py-3 px-4 ${isLight ? 'text-gray-800' : 'text-gray-300'} font-medium`}>
                          ₹{payment.amount}
                        </td>
                        <td className={`py-3 px-4 ${isLight ? 'text-gray-800' : 'text-gray-300'}`}>
                          {payment.payment_method}
                        </td>
                        <td className={`py-3 px-4 ${isLight ? 'text-gray-800' : 'text-gray-300'}`}>
                          {payment.billing_cycle || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={`${isLight ? 'text-gray-500' : 'text-gray-400'} text-center py-8`}>
                No payment history available
              </p>
            )}
          </div>

          {/* Total Paid */}
          <div className={`${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-900 border-gray-700'} border-t p-6`}>
            <div className="flex items-center justify-between">
              <span className={`${isLight ? 'text-gray-700' : 'text-gray-300'} font-medium`}>
                Total Paid
              </span>
              <span className={`text-2xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                ₹{paymentHistory.total_paid || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Monthly Performance Page
  const renderMonthlyPerformance = () => {
    if (!playerStats) return null;

    return (
      <div className="space-y-6">
        <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
          Monthly Performance Analysis
        </h2>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-xl p-6`}>
            <h3 className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm font-medium mb-2`}>
              Overall Performance
            </h3>
            <p className={`text-3xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
              {Math.round(playerStats.overall_performance)}/100
            </p>
            <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${playerStats.overall_performance}%` }}
              />
            </div>
          </div>

          <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-xl p-6`}>
            <h3 className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm font-medium mb-2`}>
              Attendance Rate
            </h3>
            <p className={`text-3xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
              {playerStats.attendance_percentage}%
            </p>
            <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${playerStats.attendance_percentage}%` }}
              />
            </div>
          </div>

          <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-xl p-6`}>
            <h3 className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm font-medium mb-2`}>
              Total Sessions
            </h3>
            <p className={`text-3xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
              {playerStats.total_sessions}
            </p>
            <p className={`${isLight ? 'text-gray-500' : 'text-gray-400'} text-sm mt-2`}>
              {playerStats.attended_sessions} attended
            </p>
          </div>
        </div>

        {/* Performance by Category */}
        <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-xl p-6`}>
          <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'} mb-4`}>
            Performance Breakdown
          </h3>
          <div className="space-y-4">
            {Object.entries(playerStats.performance_by_category || {}).map(([category, score]) => (
              <div key={category}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`${isLight ? 'text-gray-700' : 'text-gray-300'} font-medium`}>
                    {category}
                  </span>
                  <span className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                    {score.toFixed(1)}/10
                  </span>
                </div>
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(score / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const handleSubmitCoachRating = async (e) => {
    e.preventDefault();
    if (!playerData?.player?.coach_name) {
      alert('No coach assigned');
      return;
    }
    setSubmittingCoachRating(true);
    try {
      const today = new Date().toISOString().slice(0,10);
      const response = await fetch(`${API_BASE_URL}/api/player/coach-rating?date=${encodeURIComponent(today)}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: coachRating, notes: coachRatingNotes || null })
      });
      if (response.ok) {
        alert('Thanks! Your rating has been recorded.');
        setCoachRating(5);
        setCoachRatingNotes('');
        await loadCoachInfo();
        window.dispatchEvent(new Event('coach-rating-updated'));
      } else {
        const err = await response.json();
        alert(err.detail || 'Failed to submit coach rating');
      }
    } catch (error) {
      console.error('Error submitting coach rating:', error);
      alert('Error submitting coach rating');
    } finally {
      setSubmittingCoachRating(false);
    }
  };

  const renderCoachRating = () => {
    const coach = coachInfo?.coach;
    const canRate = coachInfo?.can_rate_coach;
    return (
      <div className="space-y-6">
        <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>Coach Rating</h2>

        <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-xl p-6`}>
          {coach ? (
            <div className="flex items-start gap-6">
              <div className={`w-16 h-16 rounded-full ${isLight ? 'bg-gray-200' : 'bg-gray-700'} flex items-center justify-center`}>
                <User className={`w-8 h-8 ${isLight ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>{coach.first_name} {coach.last_name}</div>
                    <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>{coach.specialization || 'Coach'}</div>
                  </div>
                  <div className={`${isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-500/30'} border rounded-xl p-4`}>
                    <div className={`${isLight ? 'text-blue-700' : 'text-blue-300'} text-sm font-medium`}>Avg Rating (6m)</div>
                    <div className={`text-xl font-bold ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>{coachInfo?.avg_coach_rating_6m ?? 'N/A'}</div>
                  </div>
                </div>
                <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm mt-2`}>{coach.description || ''}</div>
              </div>
            </div>
          ) : (
            <div className={`text-center ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>No coach assigned</div>
          )}
        </div>

        {coach && (
          <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-xl p-6`}>
            <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'} mb-4`}>Rate Your Coach</h3>
            {!canRate && (
              <div className={`${isLight ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-yellow-900/30 border-yellow-700 text-yellow-200'} border rounded-lg p-4 mb-4`}>
                You can rate your coach only after you are marked present and a performance rating has been recorded for you in the last 7 days.
              </div>
            )}
            <form onSubmit={handleSubmitCoachRating} className="space-y-4">
              <div>
                <label className={`block ${isLight ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-2`}>Rating (1–10)</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={coachRating}
                  onChange={(e) => setCoachRating(Number(e.target.value))}
                  className="w-full"
                  disabled={!canRate}
                />
                <div className={`${isLight ? 'text-gray-700' : 'text-gray-300'} mt-1 font-medium`}>{coachRating}</div>
              </div>
              <div>
                <label className={`block ${isLight ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-2`}>Notes (optional)</label>
                <textarea
                  value={coachRatingNotes}
                  onChange={(e) => setCoachRatingNotes(e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-2 ${isLight ? 'bg-gray-50 border-gray-300 text-gray-800' : 'bg-gray-700 border-gray-600 text-white'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Share feedback to help improve coaching"
                  disabled={!canRate}
                />
              </div>
              <button
                type="submit"
                disabled={submittingCoachRating || !canRate}
                className={`bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-lg transition ${submittingCoachRating ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {submittingCoachRating ? 'Submitting...' : 'Submit Rating'}
              </button>
            </form>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (activeTab === 'coach-rating') {
      loadCoachInfo();
    }
  }, [activeTab]);

  useEffect(() => {
    const onAcademySummaryUpdated = () => {
      if (activeTab === 'coach-rating') {
        loadCoachInfo();
      }
    };
    window.addEventListener('academy-summary-updated', onAcademySummaryUpdated);
    return () => {
      window.removeEventListener('academy-summary-updated', onAcademySummaryUpdated);
    };
  }, [activeTab]);

  // Render Settings Page - Move hooks to component level
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tempNotifications, setTempNotifications] = useState(notifications);

  // Update temp notifications when main notifications change
  useEffect(() => {
    setTempNotifications(notifications);
  }, [notifications]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    
    const success = await handlePasswordChange(currentPassword, newPassword);
    if (success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleNotificationSubmit = (e) => {
    e.preventDefault();
    handleNotificationUpdate(tempNotifications);
  };

  const renderSettings = () => {

    return (
      <div className="space-y-6">
        <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
          Settings
        </h2>

        {/* Password Change */}
        <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-xl p-6`}>
          <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'} mb-4`}>
            Change Password
          </h3>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className={`block ${isLight ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-2`}>
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`w-full px-4 py-2 ${isLight ? 'bg-gray-50 border-gray-300 text-gray-800' : 'bg-gray-700 border-gray-600 text-white'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                required
              />
            </div>
            <div>
              <label className={`block ${isLight ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-2`}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full px-4 py-2 ${isLight ? 'bg-gray-50 border-gray-300 text-gray-800' : 'bg-gray-700 border-gray-600 text-white'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                required
                minLength={8}
              />
            </div>
            <div>
              <label className={`block ${isLight ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-2`}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-2 ${isLight ? 'bg-gray-50 border-gray-300 text-gray-800' : 'bg-gray-700 border-gray-600 text-white'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-lg transition"
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Theme Preferences */}
        <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-xl p-6`}>
          <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'} mb-4`}>
            Appearance
          </h3>
          <div className="flex items-center justify-between py-2">
            <div>
              <label className={`${isLight ? 'text-gray-700' : 'text-gray-300'} font-medium`}>
                Dark Background
              </label>
              <p className={`${isLight ? 'text-gray-500' : 'text-gray-400'} text-sm`}>
                Switch between light and dark mode
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleTheme(user?.email)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-xl p-6`}>
          <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'} mb-4`}>
            Notification Preferences
          </h3>
          <form onSubmit={handleNotificationSubmit} className="space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <label className={`${isLight ? 'text-gray-700' : 'text-gray-300'} font-medium`}>
                  Email Notifications
                </label>
                <p className={`${isLight ? 'text-gray-500' : 'text-gray-400'} text-sm`}>
                  Receive updates via email
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTempNotifications(prev => ({ ...prev, email_notifications: !prev.email_notifications }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  tempNotifications.email_notifications ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    tempNotifications.email_notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <label className={`${isLight ? 'text-gray-700' : 'text-gray-300'} font-medium`}>
                  Push Notifications
                </label>
                <p className={`${isLight ? 'text-gray-500' : 'text-gray-400'} text-sm`}>
                  Receive push notifications
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTempNotifications(prev => ({ ...prev, push_notifications: !prev.push_notifications }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  tempNotifications.push_notifications ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    tempNotifications.push_notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Notification Priority */}
            <div>
              <label className={`block ${isLight ? 'text-gray-700' : 'text-gray-300'} font-medium mb-2`}>
                Notification Priority
              </label>
              <select
                value={tempNotifications.notification_priority}
                onChange={(e) => setTempNotifications(prev => ({ ...prev, notification_priority: e.target.value }))}
                className={`w-full px-4 py-2 ${isLight ? 'bg-gray-50 border-gray-300 text-gray-800' : 'bg-gray-700 border-gray-600 text-white'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              >
                <option value="all">All Notifications</option>
                <option value="important">Important Only</option>
                <option value="none">None</option>
              </select>
            </div>

            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-lg transition"
            >
              Save Preferences
            </button>
          </form>
        </div>
      </div>
    );
  };

  // Only show full-page loader on initial load, not when returning to tab
  if (loading && !initialLoadComplete) {
    return (
      <div className={`min-h-screen ${isLight ? 'bg-gray-50' : 'bg-gray-900'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isLight ? 'bg-gray-50' : 'bg-gray-900'}`}>
      <div className="flex">
        {/* Sidebar */}
        <aside className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border-r w-64 min-h-screen p-6 fixed left-0 top-0 hidden lg:block`}>
          <div className="flex items-center space-x-3 mb-8">
            <img
              src={resolveLogoSrc(playerData?.academy?.logo_url)}
              alt={playerData?.academy?.name || 'Academy'}
              className="h-10 w-10 rounded-lg object-contain"
              onError={(e) => { e.currentTarget.src = defaultLogoUrl; }}
            />
            <span className={`text-xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
              {playerData?.academy?.name || 'Academy'}
            </span>
          </div>

          <nav className="space-y-2 text-left">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'dashboard'
                  ? 'bg-blue-500 text-white'
                  : isLight
                    ? 'text-gray-700 hover:bg-gray-100'
                    : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Activity className="w-5 h-5" />
              <span className="font-medium text-left">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'payments'
                  ? 'bg-blue-500 text-white'
                  : isLight
                    ? 'text-gray-700 hover:bg-gray-100'
                    : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <IndianRupee className="w-5 h-5" />
              <span className="font-medium text-left">My Payments</span>
            </button>

            <button
              onClick={() => setActiveTab('performance')}
              className={`w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'performance'
                  ? 'bg-blue-500 text-white'
                  : isLight
                    ? 'text-gray-700 hover:bg-gray-100'
                    : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium text-left">Monthly Performance</span>
            </button>

            <button
              onClick={() => setActiveTab('coach-rating')}
              className={`w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'coach-rating'
                  ? 'bg-blue-500 text-white'
                  : isLight
                    ? 'text-gray-700 hover:bg-gray-100'
                    : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Award className="w-5 h-5" />
              <span className="font-medium text-left">Coach Rating</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'settings'
                  ? 'bg-blue-500 text-white'
                  : isLight
                    ? 'text-gray-700 hover:bg-gray-100'
                    : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium text-left">Settings</span>
            </button>
          </nav>

          <div className="absolute bottom-6 left-6 right-6">
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                isLight
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-red-400 hover:bg-red-900/20'
              }`}
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className={`text-3xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                {activeTab === 'dashboard' && 'My Dashboard'}
                {activeTab === 'payments' && 'My Payments'}
                {activeTab === 'performance' && 'Monthly Performance'}
                {activeTab === 'coach-rating' && 'Coach Rating'}
                {activeTab === 'settings' && 'Settings'}
              </h1>
              <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mt-1`}>
                Welcome back, {playerData?.player?.first_name}!
              </p>
            </div>

            {/* Content */}
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'payments' && renderPayments()}
            {activeTab === 'performance' && renderMonthlyPerformance()}
            {activeTab === 'coach-rating' && renderCoachRating()}
            {activeTab === 'settings' && renderSettings()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PlayerDashboardNew;
