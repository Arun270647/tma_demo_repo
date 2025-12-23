import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Calendar, Users, CheckCircle, XCircle, Search, Save, TrendingUp
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Fallback categories if sports config fails to load
const DEFAULT_PERFORMANCE_CATEGORIES = [
  'Technical Skills',
  'Physical Fitness',
  'Mental Strength',
  'Performance Consistency',
  'Training Attitude'
];

const AttendanceTracker = () => {
  const { token, userRole } = useAuth();
  const { isLight } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [players, setPlayers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveSummary, setSaveSummary] = useState({ processed: 0, total: 0, present: 0, absent: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, present, absent
  const [academySummary, setAcademySummary] = useState(null);
  const [perfCategoriesBySport, setPerfCategoriesBySport] = useState({});
  const [openRatingsFor, setOpenRatingsFor] = useState('');
  const [universalCategories, setUniversalCategories] = useState([]);
  const [radarCategoriesBySport, setRadarCategoriesBySport] = useState({});
  const ratingPanelRef = useRef(null);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const isCoach = userRole && (userRole.role === 'coach_user' || userRole.role === 'coach');

  const getCategoriesForSport = (sport) => {
    const target = (sport || 'Other').toLowerCase();
    const matchedKey = Object.keys(perfCategoriesBySport).find(k => k.toLowerCase() === target) || 'Other';
    const sportCats = radarCategoriesBySport[target];
    if (sportCats && sportCats.length) return sportCats;
    if (universalCategories.length) return universalCategories;
    return perfCategoriesBySport[matchedKey] || DEFAULT_PERFORMANCE_CATEGORIES;
  };

  const loadSportConfig = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/sports/config`);
      if (resp.ok) {
        const data = await resp.json();
        setPerfCategoriesBySport(data.performance_categories || {});
      }
    } catch (e) {
      console.warn('Failed to load sport config', e);
    }
  };

  const loadUniversalCategories = async () => {
    try {
      const endpoints = [
        '/api/academy/analytics/skill-radar',
        '/api/analytics/skill-radar',
        '/api/academy/skill-radar'
      ];
      for (const path of endpoints) {
        const resp = await fetch(`${API_BASE_URL}${path}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (resp.ok) {
          const data = await resp.json();
          const cats = (data.categories || []).map(c => c.name).filter(Boolean);
          if (cats.length) {
            setUniversalCategories(cats);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load universal categories', e);
    }
  };

  const loadRadarCategoriesBySport = async () => {
    try {
      const endpoints = [
        '/api/academy/analytics/sport-skill-radar',
        '/api/academy/analytics/sport-radar',
        '/api/analytics/sport-skill-radar',
        '/api/academy/sport-skill-radar'
      ];
      for (const path of endpoints) {
        const resp = await fetch(`${API_BASE_URL}${path}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (resp.ok) {
          const data = await resp.json();
          const sports = Array.isArray(data.sports) ? data.sports : [];
          const map = {};
          for (const s of sports) {
            const key = String(s.sport || 'other').toLowerCase();
            const cats = Array.isArray(s.categories) ? s.categories.map(c => c.name).filter(Boolean) : [];
            if (cats.length) map[key] = cats;
          }
          if (Object.keys(map).length) {
            setRadarCategoriesBySport(map);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load sport radar categories', e);
    }
  };

  useEffect(() => {
    loadPlayers();
    loadAcademySummary();
    loadSportConfig();
    loadUniversalCategories();
    loadRadarCategoriesBySport();
  }, [isCoach]);

  useEffect(() => {
    if (players.length > 0) {
      loadAttendanceForDate(selectedDate);
    }
  }, [selectedDate, players]);

  useEffect(() => {
    if (openRatingsFor && ratingPanelRef.current) {
      ratingPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [openRatingsFor]);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      setError('');
      const url = isCoach ? `${API_BASE_URL}/api/coach/players` : `${API_BASE_URL}/api/academy/players`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const playersData = await response.json();
      setPlayers(playersData);

      const initialRecords = playersData.map(player => ({
        player_id: player.id,
        player_name: `${player.first_name} ${player.last_name}`,
        position: player.position,
        registration_number: player.registration_number,
        sport: player.sport || 'Other',
        present: false,
        performance_ratings: getCategoriesForSport(player.sport).reduce((acc, cat) => { acc[cat] = null; return acc; }, {})
      }));
      setAttendanceRecords(initialRecords);
    } catch (error) {
      console.error('Error loading players:', error);
      setError('Error loading players. Please check your network connection and server status.');
    } finally {
      setLoading(false);
    }
  };

  const loadAcademySummary = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/academy/attendance/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const summaryData = await response.json();
        setAcademySummary(summaryData);
      }
    } catch (error) {
      console.error('Error loading academy summary:', error);
    }
  };

  const loadAttendanceForDate = async (date) => {
    const baseRecords = players.map(player => ({
      player_id: player.id,
      player_name: `${player.first_name} ${player.last_name}`,
      position: player.position,
      registration_number: player.registration_number,
      sport: player.sport || 'Other',
      present: false,
      performance_ratings: getCategoriesForSport(player.sport).reduce((acc, cat) => { acc[cat] = null; return acc; }, {})
    }));

    try {
      const url = isCoach ? `${API_BASE_URL}/api/coach/attendance/${date}` : `${API_BASE_URL}/api/academy/attendance/${date}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        setAttendanceRecords(baseRecords);
        return;
      }
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const attendanceData = await response.json();

      if (attendanceData.attendance_records) {
        const merged = baseRecords.map(record => {
          const existingRecord = attendanceData.attendance_records.find(
            existing => existing.player_id === record.player_id
          );
          if (existingRecord) {
            return { ...record, present: existingRecord.present, performance_ratings: existingRecord.performance_ratings || record.performance_ratings };
          }
          return record;
        });
        setAttendanceRecords(merged);
      } else {
        setAttendanceRecords(baseRecords);
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
      setAttendanceRecords(baseRecords);
    }
  };

  const updateAttendanceRecord = (playerId, field, value) => {
    setAttendanceRecords(prevRecords =>
      prevRecords.map(record =>
        record.player_id === playerId ? { ...record, [field]: value } : record
      )
    );
  };

  const updateRating = (playerId, category, value) => {
    const v = value === '' ? null : Math.max(0, Math.min(10, Number(value)));
    setAttendanceRecords(prevRecords => prevRecords.map(rec => {
      if (rec.player_id !== playerId) return rec;
      const ratings = { ...(rec.performance_ratings || {}) };
      ratings[category] = v;
      return { ...rec, performance_ratings: ratings };
    }));
  };

  const resetPlayerRatings = (playerId) => {
    setAttendanceRecords(prevRecords => prevRecords.map(rec => {
      if (rec.player_id !== playerId) return rec;
      const categories = Object.keys(rec.performance_ratings || {});
      const cleared = categories.reduce((acc, cat) => { acc[cat] = null; return acc; }, {});
      return { ...rec, performance_ratings: cleared };
    }));
  };

  const savePlayerRatings = async (playerId) => {
    try {
      setSaving(true);
      setMessage('');
      setError('');
      const rec = attendanceRecords.find(r => r.player_id === playerId);
      if (!rec) return;
      const attendanceData = {
        date: selectedDate,
        attendance_records: [{
          player_id: rec.player_id,
          date: selectedDate,
          present: rec.present,
          sport: rec.sport,
          performance_ratings: rec.performance_ratings || {}
        }]
      };
      const url = isCoach ? `${API_BASE_URL}/api/coach/attendance` : `${API_BASE_URL}/api/academy/attendance`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(attendanceData)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `API returned status ${response.status}`);
      }
      await loadAcademySummary();
      window.dispatchEvent(new CustomEvent('academy-summary-updated'));
      setMessage('✅ Ratings saved');
      setTimeout(() => setMessage(''), 2500);
    } catch (err) {
      console.error('Error saving player ratings:', err);
      setError(`❌ Error saving ratings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const markAllAbsent = () => {
    setAttendanceRecords(prevRecords =>
      prevRecords.map(record => ({ ...record, present: false }))
    );
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);
      setMessage('');
      setError('');
      const attendanceData = {
        date: selectedDate,
        attendance_records: attendanceRecords.map(record => ({
          player_id: record.player_id,
          date: selectedDate,
          present: record.present,
          sport: record.sport,
          performance_ratings: record.performance_ratings || {}
        }))
      };
      const url = isCoach ? `${API_BASE_URL}/api/coach/attendance` : `${API_BASE_URL}/api/academy/attendance`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(attendanceData)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `API returned status ${response.status}`);
      }
      const result = await response.json();
      const processed = result.results?.length || 0;
      const total = attendanceRecords.length;
      const present = getPresentCount();
      const absent = getAbsentCount();
      setSaveSummary({ processed, total, present, absent });
      setShowSaveModal(true);
      
      // Re-fetch data to refresh the UI with saved values
      await loadAttendanceForDate(selectedDate);
      await loadAcademySummary();
      window.dispatchEvent(new CustomEvent('academy-summary-updated'));

      setTimeout(() => setMessage(''), 3000);
  } catch (error) {
      console.error('Error saving attendance:', error);
      setError(`❌ Error saving attendance: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getPresentCount = () => attendanceRecords.filter(record => record.present).length;
  const getAbsentCount = () => attendanceRecords.filter(record => !record.present).length;

  const getAttendanceData = () => [
    { name: 'Present', value: getPresentCount(), color: '#10B981' },
    { name: 'Absent', value: getAbsentCount(), color: '#EF4444' }
  ];

  const markAllPresent = () => {
    setAttendanceRecords(prevRecords =>
      prevRecords.map(record => ({ ...record, present: true }))
    );
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.player_name.toLowerCase().includes(searchTerm.toLowerCase()) || record.position?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || (filterStatus === 'present' && record.present) || (filterStatus === 'absent' && !record.present);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isLight ? 'bg-gray-50' : 'bg-black'}`}>
        <div className="flex flex-col items-center space-y-4">
          <div className={`animate-spin rounded-full h-12 w-12 border-4 ${isLight ? 'border-gray-300 border-t-blue-600' : 'border-gray-800 border-t-cyan-400'}`}></div>
          <p className={`${isLight ? 'text-gray-600' : 'text-cyan-400'}`}>Loading attendance tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${isLight ? 'bg-gray-50' : 'bg-black'} min-h-screen`}>
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`w-full max-w-md rounded-2xl p-6 border ${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
            <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-3`}>Attendance Saved</h3>
            <p className={`${isLight ? 'text-gray-600' : 'text-gray-300'} mb-4`}>All attendance records have been processed.</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className={`${isLight ? 'bg-green-50 border border-green-200' : 'bg-green-500/10 border border-green-500/30'} rounded-xl p-4`}>
                <div className={`${isLight ? 'text-green-700' : 'text-green-400'} text-sm font-medium`}>Processed</div>
                <div className={`text-xl font-bold ${isLight ? 'text-green-700' : 'text-green-300'}`}>{saveSummary.processed}/{saveSummary.total}</div>
              </div>
              <div className={`${isLight ? 'bg-blue-50 border border-blue-200' : 'bg-blue-500/10 border border-blue-500/30'} rounded-xl p-4`}>
                <div className={`${isLight ? 'text-blue-700' : 'text-blue-400'} text-sm font-medium`}>Present</div>
                <div className={`text-xl font-bold ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>{saveSummary.present}</div>
              </div>
              <div className={`${isLight ? 'bg-orange-50 border border-orange-200' : 'bg-orange-500/10 border border-orange-500/30'} rounded-xl p-4`}>
                <div className={`${isLight ? 'text-orange-700' : 'text-orange-400'} text-sm font-medium`}>Absent</div>
                <div className={`text-xl font-bold ${isLight ? 'text-orange-700' : 'text-orange-300'}`}>{saveSummary.absent}</div>
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setShowSaveModal(false)} className={`px-4 py-2 rounded-xl ${isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'}`}>OK</button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} flex items-center gap-3`}>
            <Calendar className={`w-6 h-6 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
            Attendance Tracker
          </h2>
          <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mt-1`}>Track and manage player attendance for training sessions</p>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Select Date</label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              className={`px-4 py-2 rounded-xl border transition-all duration-200 ${isLight ? 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' : 'bg-gray-900 border-cyan-500/30 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'} focus:outline-none`}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {academySummary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className={`${isLight ? 'bg-white border-2 border-blue-200' : 'bg-gray-900 border-2 border-cyan-500/40'} rounded-2xl p-6 shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Total Sessions</p>
                    <p className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} mt-1`}>{academySummary.total_records}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${isLight ? 'bg-blue-100' : 'bg-cyan-500/20'}`}><Calendar className={`w-6 h-6 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} /></div>
                </div>
              </div>
              <div className={`${isLight ? 'bg-white border-2 border-green-200' : 'bg-gray-900 border-2 border-green-500/40'} rounded-2xl p-6 shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Academy Attendance</p>
                    <p className={`text-3xl font-bold mt-1 ${academySummary.overall_attendance_rate >= 90 ? (isLight ? 'text-green-600' : 'text-green-400') : academySummary.overall_attendance_rate >= 80 ? (isLight ? 'text-yellow-600' : 'text-yellow-400') : academySummary.overall_attendance_rate >= 70 ? (isLight ? 'text-orange-600' : 'text-orange-400') : (isLight ? 'text-red-600' : 'text-red-400')}`}>
                      {academySummary.overall_attendance_rate ? academySummary.overall_attendance_rate.toFixed(1) : 'N/A'}%
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${isLight ? 'bg-green-100' : 'bg-green-500/20'}`}><Users className={`w-6 h-6 ${isLight ? 'text-green-600' : 'text-green-400'}`} /></div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className={`${isLight ? 'bg-white border-2 border-blue-200' : 'bg-gray-900 border-2 border-cyan-500/40'} rounded-2xl p-6 shadow-sm`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Total Players</p>
                  <p className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} mt-1`}>{attendanceRecords.length}</p>
                  <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'} mt-1`}>Registered</p>
                </div>
                <div className={`p-3 rounded-xl ${isLight ? 'bg-blue-100' : 'bg-cyan-500/20'}`}><Users className={`w-6 h-6 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} /></div>
              </div>
            </div>
            <div className={`${isLight ? 'bg-white border-2 border-green-200' : 'bg-gray-900 border-2 border-green-500/40'} rounded-2xl p-6 shadow-sm`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Present</p>
                  <p className={`text-3xl font-bold ${isLight ? 'text-green-600' : 'text-green-400'} mt-1`}>{getPresentCount()}</p>
                  <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'} mt-1`}>{attendanceRecords.length > 0 ? Math.round((getPresentCount() / attendanceRecords.length) * 100) : 0}% attendance</p>
                </div>
                <div className={`p-3 rounded-xl ${isLight ? 'bg-green-100' : 'bg-green-500/20'}`}><CheckCircle className={`w-6 h-6 ${isLight ? 'text-green-600' : 'text-green-400'}`} /></div>
              </div>
            </div>
          </div>

          <div className={`${isLight ? 'bg-white border-2 border-blue-200' : 'bg-gray-900 border-2 border-cyan-500/40'} rounded-2xl p-6 shadow-sm`}>
            <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>Attendance Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={getAttendanceData()} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {getAttendanceData().map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: isLight ? '#ffffff' : '#1f2937', border: `1px solid ${isLight ? '#e5e7eb' : '#06b6d4'}`, borderRadius: '12px', color: isLight ? '#374151' : '#ffffff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isLight ? 'text-gray-400' : 'text-gray-500'}`} />
              <input type="text" placeholder="Search players..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2 w-64 rounded-xl border transition-all duration-200 ${isLight ? 'border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500' : 'border-cyan-500/30 bg-gray-800 focus:bg-gray-700 focus:border-cyan-400 text-white'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-2 rounded-xl border transition-all duration-200 ${isLight ? 'border-gray-200 bg-white text-gray-900 focus:border-blue-500' : 'border-cyan-500/30 bg-gray-800 text-white focus:border-cyan-400'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            >
              <option value="all">All Players</option>
              <option value="present">Present Only</option>
              <option value="absent">Absent Only</option>
            </select>
            <button onClick={saveAttendance} disabled={saving} className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all duration-200 ${isLight ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-50'} disabled:cursor-not-allowed`}>
              <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Records'}
            </button>
          </div>

          <div className={`${isLight ? 'bg-white border-2 border-blue-200' : 'bg-gray-900 border-2 border-cyan-500/40'} rounded-2xl shadow-sm overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${isLight ? 'bg-gray-50' : 'bg-gray-800/50'}`}>
                  <tr className={`border-b ${isLight ? 'border-gray-200' : 'border-cyan-500/20'}`}>
                    <th className={`text-left font-medium py-4 px-6 ${isLight ? 'text-gray-900' : 'text-white'}`}>Player</th>
                    <th className={`text-left font-medium py-4 px-6 ${isLight ? 'text-gray-900' : 'text-white'}`}>Position</th>
                    <th className={`text-center font-medium py-4 px-6 ${isLight ? 'text-gray-900' : 'text-white'}`}>Present</th>
                    <th className={`text-center font-medium py-4 px-6 ${isLight ? 'text-gray-900' : 'text-white'}`}>Ratings</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.player_id} className={`border-b transition-colors duration-200 ${isLight ? 'border-gray-100 hover:bg-gray-50' : 'border-cyan-500/10 hover:bg-cyan-500/5'}`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">{record.player_name.split(' ').map(n => n[0]).join('')}</div>
                          <div><div className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>{record.player_name}</div></div>
                        </div>
                      </td>
                      <td className={`py-4 px-6 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{record.position || 'N/A'}</td>
                      <td className="py-4 px-6 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={record.present} onChange={(e) => updateAttendanceRecord(record.player_id, 'present', e.target.checked)} className={`w-5 h-5 rounded border-2 transition-all duration-200 ${isLight ? 'text-green-600 focus:ring-green-500 border-gray-300' : 'text-green-400 focus:ring-green-400 bg-gray-800 border-green-500/30'}`} />
                        </label>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button onClick={() => setOpenRatingsFor(openRatingsFor === record.player_id ? '' : record.player_id)} className={`px-3 py-1 rounded-lg text-sm ${isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'}`}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {openRatingsFor && (() => {
            const rec = attendanceRecords.find(r => r.player_id === openRatingsFor);
            if (!rec) return null;
            const cats = getCategoriesForSport(rec.sport);
            return (
              <div ref={ratingPanelRef} className={`${isLight ? 'bg-white border-2 border-blue-200' : 'bg-gray-900 border-2 border-cyan-500/40'} rounded-2xl p-6 shadow-sm`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-semibold`}>Ratings for {rec.player_name} ({rec.sport})</div>
                  <button onClick={() => setOpenRatingsFor('')} className={`${isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'} px-3 py-1 rounded-lg text-sm`}>Close</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cats.map(cat => (
                    <div key={cat} className="flex items-center gap-3">
                      <label className={`${isLight ? 'text-gray-700' : 'text-gray-300'} w-40`}>{cat}</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="1"
                        pattern="[0-9]*"
                        value={(rec.performance_ratings || {})[cat] ?? ''}
                        onChange={(e) => updateRating(rec.player_id, cat, e.target.value)}
                        className={`w-24 px-2 py-1 rounded-lg border text-black ${isLight ? 'border-gray-200 bg-white' : 'border-gray-700 bg-gray-800'}`}
                        inputMode="numeric"
                      />
                    </div>
                  ))}
                </div>
                <p className={`${isLight ? 'text-gray-500' : 'text-gray-400'} text-xs mt-2`}>Enter values 0–10; leave blank to skip a category.</p>
                <div className="flex items-center justify-end gap-3 mt-4">
                  <button onClick={() => resetPlayerRatings(rec.player_id)} className={`${isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'} px-4 py-2 rounded-lg`}>Reset</button>
                  <button onClick={() => savePlayerRatings(rec.player_id)} disabled={saving} className={`${isLight ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-50'} px-4 py-2 rounded-lg`}>Save</button>
                </div>
              </div>
            );
          })()}
          <div className="flex items-center justify-start gap-4">
            <button onClick={markAllPresent} className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-200 ${isLight ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'}`}><CheckCircle className="w-5 h-5" />Mark All Present</button>
            <button onClick={markAllAbsent} className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-200 ${isLight ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'}`}><XCircle className="w-5 h-5" />Mark All Absent</button>
          </div>
        </div>
      </div>

      {filteredRecords.length === 0 && (
        <div className={`${isLight ? 'bg-white border-2 border-blue-200' : 'bg-gray-900 border-2 border-cyan-500/40'} rounded-2xl p-12 text-center`}>
          <Users className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-400' : 'text-gray-600'}`} />
          <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-2`}>No players found</h3>
          <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{searchTerm || filterStatus !== 'all' ? 'Try adjusting your search or filter criteria.' : 'Add players to your academy to start tracking attendance.'}</p>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracker;
