import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Award, Calendar, Target, 
  BarChart3, User, Save, CheckCircle, XCircle, AlertCircle, TrendingUp
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const PerformanceAnalytics = () => {
  const { token, userRole } = useAuth();
  const isCoach = userRole && (userRole.role === 'coach_user' || userRole.role === 'coach');
  const { isLight } = useTheme();
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const [performanceData, setPerformanceData] = useState({
    speed: 5,
    agility: 5,
    movement: 5,
    pace: 5,
    stamina: 5,
    overall_rating: 5,
    notes: ''
  });
  const [playerPerformance, setPlayerPerformance] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadPlayers();
    loadAttendanceSummary();
  }, []);

  useEffect(() => {
    if (selectedPlayer && selectedDate) {
      checkAttendance();
      loadPlayerPerformance(selectedPlayer);
    }
  }, [selectedPlayer, selectedDate]);

  // Populate form with metrics for the selected date
  useEffect(() => {
    if (playerPerformance?.performance_trend && selectedDate) {
      // Find the performance record for the selected date
      const dateRecord = playerPerformance.performance_trend.find(
        record => record.date === selectedDate
      );

      if (dateRecord) {
        // Populate form with the metrics for this date
        setPerformanceData({
          speed: dateRecord.speed || 5,
          agility: dateRecord.agility || 5,
          movement: dateRecord.movement || 5,
          pace: dateRecord.pace || 5,
          stamina: dateRecord.stamina || 5,
          overall_rating: dateRecord.rating || 5,
          notes: dateRecord.notes || ''
        });
      } else {
        // Reset to default values if no record exists for this date
        setPerformanceData({
          speed: 5,
          agility: 5,
          movement: 5,
          pace: 5,
          stamina: 5,
          overall_rating: 5,
          notes: ''
        });
      }
    }
  }, [playerPerformance, selectedDate]);

  const loadPlayers = async () => {
    try {
      const url = isCoach ? `${API_BASE_URL}/api/coach/players` : `${API_BASE_URL}/api/academy/players`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const playersData = await response.json();
        setPlayers(playersData);
        if (playersData.length > 0) {
          setSelectedPlayer(playersData[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };

  const loadAttendanceSummary = async () => {
    try {
      const url = isCoach ? `${API_BASE_URL}/api/coach/attendance/summary` : `${API_BASE_URL}/api/academy/attendance/summary`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const summaryData = await response.json();
        setAttendanceSummary(summaryData);
      }
    } catch (error) {
      console.error('Error loading attendance summary:', error);
    }
  };

  const checkAttendance = async () => {
    try {
      setLoading(true);
      // Don't clear attendanceRecord to prevent flash of "No attendance" message
      const url = isCoach ? `${API_BASE_URL}/api/coach/attendance/${selectedDate}` : `${API_BASE_URL}/api/academy/attendance/${selectedDate}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.attendance_records) {
          const playerRecord = data.attendance_records.find(
            record => record.player_id === selectedPlayer
          );
          setAttendanceRecord(playerRecord || null);
        }
      }
    } catch (error) {
      console.error('Error checking attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayerPerformance = async (playerId) => {
    try {
      setLoading(true);
      const url = isCoach ? `${API_BASE_URL}/api/coach/players/${playerId}/performance` : `${API_BASE_URL}/api/academy/players/${playerId}/performance`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const performanceData = await response.json();
        setPlayerPerformance(performanceData);
      } else {
        // If the API fails or returns no data, clear the state
        setPlayerPerformance(null);
      }
    } catch (error) {
      console.error('Error loading player performance:', error);
      setPlayerPerformance(null);
    } finally {
      setLoading(false);
    }
  };

  

  const savePerformance = async () => {
    try {
      setSaving(true);
      setMessage('');
      setError('');
      
      const payload = {
        player_id: selectedPlayer,
        date: selectedDate,
        ...performanceData
      };

      const url = isCoach ? `${API_BASE_URL}/api/coach/performance` : `${API_BASE_URL}/api/academy/performance`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save performance data');
      }

      const result = await response.json();
      setMessage('✅ Performance data saved successfully!');
      setTimeout(() => setMessage(''), 3000);
      
      // Reload player performance data
      await loadPlayerPerformance(selectedPlayer);
      await loadAttendanceSummary();
      window.dispatchEvent(new CustomEvent('academy-summary-updated'));
    } catch (error) {
      console.error('Error saving performance:', error);
      setError(`❌ Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updatePerformanceField = (field, value) => {
    setPerformanceData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getPerformanceColor = (rating) => {
    if (rating === null || rating === undefined) return isLight ? 'text-gray-600' : 'text-gray-400';
    if (rating >= 8) return isLight ? 'text-green-600' : 'text-green-400';
    if (rating >= 6) return isLight ? 'text-yellow-600' : 'text-yellow-400';
    if (rating >= 4) return isLight ? 'text-orange-600' : 'text-orange-400';
    return isLight ? 'text-red-600' : 'text-red-400';
  };
  
  const getAttendanceColor = (percentage) => {
    if (percentage === null || percentage === undefined) return isLight ? 'text-gray-600' : 'text-gray-400';
    if (percentage >= 90) return isLight ? 'text-green-600' : 'text-green-400';
    if (percentage >= 80) return isLight ? 'text-yellow-600' : 'text-yellow-400';
    if (percentage >= 70) return isLight ? 'text-orange-600' : 'text-orange-400';
    return isLight ? 'text-red-600' : 'text-red-400';
  };

  const getPerformanceTrendChartData = () => {
    if (!playerPerformance?.performance_trend) return [];
    // Ensure all sessions are included in the trend chart
    return playerPerformance.performance_trend.map(trend => ({
      date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      Performance: trend.rating,
    }));
  };

  const getAverageRating = () => {
    const avg = playerPerformance?.average_rating;
    if (avg !== null && avg !== undefined) return avg;
    const ratings = (playerPerformance?.performance_trend || [])
      .map(t => t.rating)
      .filter(r => r !== null && r !== undefined);
    if (ratings.length === 0) return null;
    return ratings.reduce((a, b) => a + b, 0) / ratings.length;
  };

  const getMonthlyStatsChartData = () => {
    if (!playerPerformance?.monthly_stats) return [];
    return Object.entries(playerPerformance.monthly_stats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, stats]) => ({
        month: new Date(month + '-02').toLocaleString('default', { month: 'short', year: '2-digit' }),
        'Avg Performance': stats.average_rating || 0,
        'Attendance %': stats.attendance_percentage || 0,
      }));
  };

  return (
    <div className={`p-6 space-y-6 ${isLight ? 'bg-gray-50' : 'bg-black'} min-h-screen`}>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} flex items-center gap-3`}>
            <BarChart3 className={`w-6 h-6 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
            Performance Analytics
          </h2>
          <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mt-1`}>Analyze player performance and attendance trends.</p>
        </div>
      </div>

      {attendanceSummary && (
        <div className="grid grid-cols-1 gap-6">
          <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-purple-500/30'} rounded-2xl p-6 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Academy Avg. Performance</p>
                <p className={`text-3xl font-bold mt-1 ${getPerformanceColor(attendanceSummary.average_performance_rating)}`}>
                  {attendanceSummary.average_performance_rating ? attendanceSummary.average_performance_rating.toFixed(1) : 'N/A'}/10
                </p>
              </div>
              <div className={`p-3 rounded-xl ${isLight ? 'bg-purple-100' : 'bg-purple-500/20'}`}><TrendingUp className={`w-6 h-6 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} /></div>
            </div>
          </div>
        </div>
      )}

      {/* Player Selection and Date Selection */}
      <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-cyan-500/30'} rounded-2xl p-6 shadow-sm`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-4">
            <User className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-cyan-400'}`} />
            <div className="flex-1">
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>Select Player:</label>
              <select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isLight ? 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' : 'bg-gray-800 border-cyan-500/30 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'} focus:outline-none`}
              >
                <option value="">Choose a player...</option>
                {players.map(player => (
                  <option key={player.id} value={player.id}>{player.first_name} {player.last_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Calendar className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-cyan-400'}`} />
            <div className="flex-1">
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>Select Date:</label>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isLight ? 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' : 'bg-gray-800 border-cyan-500/30 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'} focus:outline-none`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Status Check and Performance Form */}
      {selectedPlayer && selectedDate && !loading && (
        <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-cyan-500/30'} rounded-2xl p-6 shadow-sm`}>
          {attendanceRecord ? (
            attendanceRecord.present ? (
              <div className="space-y-6">
                {/* Player was present - Show performance form */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <div>
                    <h3 className={`font-semibold ${isLight ? 'text-green-900' : 'text-green-400'}`}>Player was present on {selectedDate}</h3>
                    <p className={`text-sm ${isLight ? 'text-green-700' : 'text-green-300'}`}>You can now add detailed performance metrics below.</p>
                  </div>
                </div>

                {message && (
                  <div className={`p-4 rounded-xl ${isLight ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-green-500/10 border border-green-500/30 text-green-400'}`}>
                    {message}
                  </div>
                )}
                {error && (
                  <div className={`p-4 rounded-xl ${isLight ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                    {error}
                  </div>
                )}

                <h3 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} flex items-center gap-3`}>
                  <Award className={`w-6 h-6 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
                  Add Performance Metrics
                </h3>

                {/* Performance Metrics Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['speed', 'agility', 'movement', 'pace', 'stamina'].map((metric) => (
                    <div key={metric}>
                      <label className={`block text-sm font-medium mb-2 capitalize ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                        {metric}: <span className={`font-bold ${isLight ? 'text-blue-600' : 'text-cyan-400'}`}>{performanceData[metric]}/10</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={performanceData[metric]}
                        onChange={(e) => updatePerformanceField(metric, parseInt(e.target.value))}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                        style={{
                          background: `linear-gradient(to right, #ef4444 0%, #eab308 50%, #22c55e 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span className={isLight ? 'text-gray-500' : 'text-gray-400'}>Poor</span>
                        <span className={isLight ? 'text-gray-500' : 'text-gray-400'}>Average</span>
                        <span className={isLight ? 'text-gray-500' : 'text-gray-400'}>Excellent</span>
                      </div>
                    </div>
                  ))}

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                      Overall Rating: <span className={`font-bold ${isLight ? 'text-blue-600' : 'text-cyan-400'}`}>{performanceData.overall_rating}/10</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={performanceData.overall_rating}
                      onChange={(e) => updatePerformanceField('overall_rating', parseInt(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #ef4444 0%, #eab308 50%, #22c55e 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs mt-1">
                      <span className={isLight ? 'text-gray-500' : 'text-gray-400'}>Poor</span>
                      <span className={isLight ? 'text-gray-500' : 'text-gray-400'}>Average</span>
                      <span className={isLight ? 'text-gray-500' : 'text-gray-400'}>Excellent</span>
                    </div>
                  </div>
                </div>

                {/* Coach Notes */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                    Coach's Notes
                  </label>
                  <textarea
                    value={performanceData.notes}
                    onChange={(e) => updatePerformanceField('notes', e.target.value)}
                    rows="4"
                    placeholder="Add observations, strengths, areas for improvement..."
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isLight ? 'border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500' : 'border-cyan-500/30 bg-gray-800 focus:bg-gray-700 focus:border-cyan-400 text-white'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                </div>

                {/* Save Button */}
                <button
                  onClick={savePerformance}
                  disabled={saving}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 ${
                    isLight 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50' 
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-50'
                  } disabled:cursor-not-allowed`}
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Saving Performance Data...' : 'Save Performance Data'}
                </button>
              </div>
            ) : (
              /* Player was absent */
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                <div>
                  <h3 className={`font-semibold ${isLight ? 'text-red-900' : 'text-red-400'}`}>Player was absent on {selectedDate}</h3>
                  <p className={`text-sm ${isLight ? 'text-red-700' : 'text-red-300'}`}>Performance can only be added for present players.</p>
                </div>
              </div>
            )
          ) : (
            /* No attendance record found */
            <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30">
              <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              <div>
                <h3 className={`font-semibold ${isLight ? 'text-yellow-900' : 'text-yellow-400'}`}>No attendance record found</h3>
                <p className={`text-sm ${isLight ? 'text-yellow-700' : 'text-yellow-300'}`}>Attendance must be marked before adding performance metrics.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-cyan-500/30'} rounded-2xl p-12 text-center`}>
          <div className={`animate-spin rounded-full h-12 w-12 border-4 mx-auto mb-4 ${isLight ? 'border-gray-300 border-t-blue-600' : 'border-gray-800 border-t-cyan-400'}`}></div>
          <p className={`${isLight ? 'text-gray-600' : 'text-cyan-400'}`}>Loading attendance data...</p>
        </div>
      )}

      {/* Individual Player Analytics */}
      {selectedPlayer && (
        <div className="space-y-6">
          {loading ? (
            <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-cyan-500/30'} rounded-2xl p-12 text-center`}>
              <div className={`animate-spin rounded-full h-12 w-12 border-4 mx-auto mb-4 ${isLight ? 'border-gray-300 border-t-blue-600' : 'border-gray-800 border-t-cyan-400'}`}></div>
              <p className={`${isLight ? 'text-gray-600' : 'text-cyan-400'}`}>Loading performance data...</p>
            </div>
          ) : playerPerformance ? (
            <>
              {/* Individual Player Summary Cards */}
              <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-cyan-500/30'} rounded-2xl p-6 shadow-sm`}>
                <h3 className={`text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-6 flex items-center gap-2`}>
                  <Award className={`w-5 h-5 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
                  {playerPerformance.player_name} - Performance Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                        <div className={`text-3xl font-bold ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>{playerPerformance.total_sessions}</div>
                        <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm font-medium`}>Total Sessions</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                        <div className={`text-3xl font-bold ${isLight ? 'text-green-600' : 'text-green-400'}`}>{playerPerformance.attended_sessions}</div>
                        <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm font-medium`}>Attended</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10">
                        <div className={`text-3xl font-bold ${getAttendanceColor(playerPerformance.attendance_percentage)}`}>{playerPerformance.attendance_percentage}%</div>
                        <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm font-medium`}>Attendance</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                        <div className={`text-3xl font-bold ${getPerformanceColor(getAverageRating())}`}>
                            {getAverageRating() !== null && getAverageRating() !== undefined ? getAverageRating().toFixed(1) : 'N/A'}/10
                        </div>
                        <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm font-medium`}>Avg Rating</div>
                    </div>
                </div>
              </div>

              {/* Charts for Individual Player */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-purple-500/30'} rounded-2xl p-6 shadow-sm`}>
                  <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>Performance Trend (All Sessions)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getPerformanceTrendChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e5e7eb' : '#374151'} />
                      <XAxis dataKey="date" stroke={isLight ? '#6b7280' : '#9ca3af'} />
                      <YAxis domain={[0, 10]} stroke={isLight ? '#6b7280' : '#9ca3af'} />
                      <Tooltip contentStyle={{ backgroundColor: isLight ? '#ffffff' : '#1f2937', border: `1px solid ${isLight ? '#e5e7eb' : '#8b5cf6'}`, borderRadius: '12px', color: isLight ? '#374151' : '#ffffff' }} />
                      <Legend />
                      <Line type="monotone" dataKey="Performance" stroke={isLight ? '#8B5CF6' : '#a855f7'} strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-green-500/30'} rounded-2xl p-6 shadow-sm`}>
                  <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>Monthly Overview</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getMonthlyStatsChartData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e5e7eb' : '#374151'} />
                        <XAxis dataKey="month" stroke={isLight ? '#6b7280' : '#9ca3af'} />
                        <YAxis yAxisId="left" orientation="left" stroke={isLight ? '#10B981' : '#22c55e'} />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 10]} stroke={isLight ? '#8B5CF6' : '#a855f7'} />
                        <Tooltip contentStyle={{ backgroundColor: isLight ? '#ffffff' : '#1f2937', border: `1px solid ${isLight ? '#e5e7eb' : '#10b981'}`, borderRadius: '12px', color: isLight ? '#374151' : '#ffffff' }} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="Attendance %" fill={isLight ? '#10B981' : '#22c55e'} radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="Avg Performance" fill={isLight ? '#8B5CF6' : '#a855f7'} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-cyan-500/30'} rounded-2xl p-12 text-center`}>
              <Target className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-400' : 'text-gray-600'}`} />
              <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-2`}>No performance data available</h3>
              <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Start tracking attendance to see performance analytics for this player.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PerformanceAnalytics;
