import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Users, Award, TrendingUp, Calendar, BookOpen, 
  Activity, Target, CheckCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const CoachDashboard = () => {
  const { token } = useAuth();
  const { isLight } = useTheme();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadDashboard();

    // Poll for dashboard updates every 30 seconds to sync changes made by academy
    const dashboardPollingInterval = setInterval(() => {
      loadDashboard();
    }, 30000); // 30 seconds

    return () => {
      clearInterval(dashboardPollingInterval);
    };
  }, []);

  const loadDashboard = async () => {
    try {
      // Only show full-page loader on initial load, not on refreshes
      if (!initialLoadComplete) {
        setLoading(true);
      }
      const response = await fetch(`${API_BASE_URL}/api/coach/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  };

  const getPlayersBySportData = () => {
    if (!dashboardData?.summary?.stats_by_sport) return [];
    return Object.entries(dashboardData.summary.stats_by_sport).map(([sport, count]) => ({
      name: sport,
      value: count,
      color: getColorForSport(sport)
    }));
  };

  const getColorForSport = (sport) => {
    const colors = {
      'Football': '#3B82F6',
      'Cricket': '#10B981',
      'Basketball': '#F59E0B',
      'Tennis': '#EF4444',
      'Badminton': '#8B5CF6',
      'Swimming': '#06B6D4'
    };
    return colors[sport] || '#6B7280';
  };

  // Only show full-page loader on initial load, not when returning to tab
  if (loading && !initialLoadComplete) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isLight ? 'bg-gray-50' : 'bg-gray-900'}`}>
        <div className={`animate-spin rounded-full h-16 w-16 border-4 ${isLight ? 'border-gray-300 border-t-blue-600' : 'border-gray-800 border-t-cyan-400'}`}></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isLight ? 'bg-gray-50' : 'bg-gray-900'}`}>
        <p className={`text-lg ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Failed to load dashboard data</p>
      </div>
    );
  }

  const { coach, summary, players_by_sport } = dashboardData;

  return (
    <div className={`min-h-screen ${isLight ? 'bg-gray-50' : 'bg-gray-900'} p-4 sm:p-6 space-y-6`}>
      {/* Welcome Header */}
      <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-cyan-500/30'} rounded-2xl p-6 shadow-sm`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className={`w-16 h-16 rounded-full ${isLight ? 'bg-blue-100' : 'bg-cyan-500/20'} flex items-center justify-center`}>
            {coach.profile_picture_url ? (
              <img src={coach.profile_picture_url} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <Users className={`w-8 h-8 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
            )}
          </div>
          <div className="flex-1">
            <h1 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Welcome back, {coach.name}!
            </h1>
            <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mt-1`}>
              {coach.specialization && `${coach.specialization} Coach • `}
              {coach.sports && coach.sports.length > 0 ? coach.sports.join(', ') : 'Multi-Sport Coach'}
            </p>
          </div>
        </div>
        {coach.description && (
          <p className={`mt-4 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
            {coach.description}
          </p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-cyan-500/30'} rounded-2xl p-6 shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Total Students</p>
              <p className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} mt-1`}>
                {summary.total_players}
              </p>
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'} mt-1`}>Assigned to you</p>
            </div>
            <div className={`p-3 rounded-xl ${isLight ? 'bg-blue-100' : 'bg-cyan-500/20'}`}>
              <Users className={`w-6 h-6 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
            </div>
          </div>
        </div>

        <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-green-500/30'} rounded-2xl p-6 shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Today's Attendance</p>
              <p className={`text-3xl font-bold ${isLight ? 'text-green-600' : 'text-green-400'} mt-1`}>
                {summary.today_attendance}
              </p>
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'} mt-1`}>Students present</p>
            </div>
            <div className={`p-3 rounded-xl ${isLight ? 'bg-green-100' : 'bg-green-500/20'}`}>
              <CheckCircle className={`w-6 h-6 ${isLight ? 'text-green-600' : 'text-green-400'}`} />
            </div>
          </div>
        </div>

        <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-purple-500/30'} rounded-2xl p-6 shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Sports Handled</p>
              <p className={`text-3xl font-bold ${isLight ? 'text-purple-600' : 'text-purple-400'} mt-1`}>
                {coach.sports ? coach.sports.length : 0}
              </p>
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'} mt-1`}>Different sports</p>
            </div>
            <div className={`p-3 rounded-xl ${isLight ? 'bg-purple-100' : 'bg-purple-500/20'}`}>
              <Award className={`w-6 h-6 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students by Sport */}
        <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-cyan-500/30'} rounded-2xl p-6 shadow-sm`}>
          <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>
            Students by Sport
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={getPlayersBySportData()}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {getPlayersBySportData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isLight ? '#ffffff' : '#1f2937', 
                  border: `1px solid ${isLight ? '#e5e7eb' : '#374151'}`,
                  borderRadius: '12px'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Sport-wise Distribution Bar Chart */}
        <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-cyan-500/30'} rounded-2xl p-6 shadow-sm`}>
          <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>
            Sport-wise Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={getPlayersBySportData()}>
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e5e7eb' : '#374151'} />
              <XAxis dataKey="name" stroke={isLight ? '#6b7280' : '#9ca3af'} />
              <YAxis stroke={isLight ? '#6b7280' : '#9ca3af'} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isLight ? '#ffffff' : '#1f2937', 
                  border: `1px solid ${isLight ? '#e5e7eb' : '#374151'}`,
                  borderRadius: '12px'
                }} 
              />
              <Bar dataKey="value" fill={isLight ? '#3B82F6' : '#06B6D4'} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Students List by Sport */}
      <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-cyan-500/30'} rounded-2xl p-6 shadow-sm`}>
        <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4 flex items-center gap-2`}>
          <BookOpen className={`w-5 h-5 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
          My Students
        </h3>
        
        {Object.keys(players_by_sport).length === 0 ? (
          <p className={`text-center py-8 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
            No students assigned yet
          </p>
        ) : (
          <div className="space-y-6">
            {Object.entries(players_by_sport).map(([sport, players]) => (
              <div key={sport}>
                <h4 className={`text-md font-semibold ${isLight ? 'text-gray-800' : 'text-cyan-400'} mb-3 flex items-center gap-2`}>
                  <Target className="w-4 h-4" />
                  {sport} ({players.length} students)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {players.map((player) => (
                    <div 
                      key={player.id}
                      className={`p-4 rounded-xl border ${isLight ? 'border-gray-200 hover:border-blue-300' : 'border-cyan-500/30 hover:border-cyan-500/60'} transition-all duration-200`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            {player.name}
                          </p>
                          <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'} mt-1`}>
                            {player.position || 'N/A'}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${isLight ? 'bg-blue-100 text-blue-700' : 'bg-cyan-500/20 text-cyan-400'}`}>
                          #{player.registration_number}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachDashboard;
