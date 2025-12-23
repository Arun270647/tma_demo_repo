import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import CreateAcademyModal from './CreateAcademyModal';
import EditAcademyModal from './EditAcademyModal';
import DemoRequestsTable from './DemoRequestsTable';
import BillingDashboard from './BillingDashboard';
import ThemeToggle from './ThemeToggle';
import UserCard from './UserCard';
import AcademyCard from './AcademyCard';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import { 
  Users, School, TrendingUp, Calendar, Award, Clock, 
  Activity, Target, BookOpen, Search, Bell, Settings, Plus,
  IndianRupee, UserCheck, Building2, AlertCircle, Menu, X
} from 'lucide-react';

const Dashboard = () => {
  const { user, signOut, token, userRole } = useAuth();
  const { isLight } = useTheme();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAcademies: 0,
    pendingAcademies: 0,
    activeUsers: 0
  });
  const [users, setUsers] = useState([]);
  const [academies, setAcademies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAcademy, setSelectedAcademy] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedAcademies, setSelectedAcademies] = useState([]);
  const [systemOverview, setSystemOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // ... (useEffect and API calls remain unchanged)
  useEffect(() => {
    if (userRole && userRole.role === 'academy_user') {
      navigate('/academy');
      return;
    }
    if (userRole && userRole.role === 'super_admin') {
      loadDashboardData();
      loadSystemOverview();
    }
  }, [userRole, navigate]);

  const loadSystemOverview = async () => {
    try {
      setOverviewLoading(true);
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/system-overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSystemOverview(data);
      } else {
        console.error('Failed to load system overview');
      }
    } catch (error) {
      console.error('Error loading system overview:', error);
    } finally {
      setOverviewLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const academiesResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/academies`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (academiesResponse.ok) {
        const academiesData = await academiesResponse.json();
        setAcademies(academiesData);
        const pendingCount = academiesData.filter(a => a.status === 'pending').length;
        const approvedCount = academiesData.filter(a => a.status === 'approved').length;
        setStats({
          totalUsers: academiesData.length,
          totalAcademies: academiesData.length,
          pendingAcademies: pendingCount,
          activeUsers: approvedCount
        });
        const usersData = academiesData.map((academy) => ({
          id: academy.id,
          email: academy.email,
          academy: academy.name,
          status: academy.status === 'approved' ? 'active' : academy.status,
          joined: new Date(academy.created_at).toLocaleDateString()
        }));
        setUsers(usersData);
      } else {
        console.error('Failed to fetch academies');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcademyCreated = (newAcademy) => {
    setSuccessMessage(`Academy "${newAcademy.user?.user_metadata?.academy_name || 'New Academy'}" created successfully!`);
    setTimeout(() => setSuccessMessage(''), 5000);
    loadDashboardData();
    loadSystemOverview();
  };

  const handleEditAcademy = (academy) => {
    setSelectedAcademy(academy);
    setShowEditModal(true);
  };

  const handleAcademyUpdated = (updatedAcademy) => {
    setSuccessMessage(`Academy "${updatedAcademy.name}" updated successfully!`);
    setTimeout(() => setSuccessMessage(''), 5000);
    loadDashboardData();
  };

  const handleDeleteAcademy = async (academyId, academyName) => {
    if (!window.confirm(`Are you sure you want to delete "${academyName}"? This action cannot be undone.`)) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/academies/${academyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setSuccessMessage(`Academy "${academyName}" deleted successfully!`);
        setTimeout(() => setSuccessMessage(''), 5000);
        loadDashboardData();
      } else {
        const data = await response.json();
        alert(`Failed to delete academy: ${data.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting academy:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleApproveAcademy = async (academyId, academyName) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/academies/${academyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'approved' })
      });
      if (response.ok) {
        setSuccessMessage(`Academy "${academyName}" approved successfully!`);
        setTimeout(() => setSuccessMessage(''), 5000);
        loadDashboardData();
      } else {
        const data = await response.json();
        alert(`Failed to approve academy: ${data.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error approving academy:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleRejectAcademy = async (academyId, academyName) => {
    if (!window.confirm(`Are you sure you want to reject "${academyName}"?`)) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/academies/${academyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'rejected' })
      });
      if (response.ok) {
        setSuccessMessage(`Academy "${academyName}" rejected successfully!`);
        setTimeout(() => setSuccessMessage(''), 5000);
        loadDashboardData();
      } else {
        const data = await response.json();
        alert(`Failed to reject academy: ${data.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error rejecting academy:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedAcademies.length === 0) return;
    if (!window.confirm(`Are you sure you want to approve ${selectedAcademies.length} selected academies?`)) return;
    try {
      const promises = selectedAcademies.map(academyId =>
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/academies/${academyId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'approved' })
        })
      );
      await Promise.all(promises);
      setSuccessMessage(`${selectedAcademies.length} academies approved successfully!`);
      setTimeout(() => setSuccessMessage(''), 5000);
      setSelectedAcademies([]);
      loadDashboardData();
    } catch (error) {
      console.error('Error in bulk approve:', error);
      alert('Some academies could not be approved. Please try again.');
    }
  };

  const handleSelectAcademy = (academyId) => {
    setSelectedAcademies(prev => prev.includes(academyId) ? prev.filter(id => id !== academyId) : [...prev, academyId]);
  };

  const handleSelectAll = () => {
    const allIds = academies.map(academy => academy.id);
    setSelectedAcademies(selectedAcademies.length === allIds.length ? [] : allIds);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Chart color schemes
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
  
  // Prepare chart data
  const getGrowthData = () => {
    return [
      { month: 'Jan', academies: 5, users: 15 },
      { month: 'Feb', academies: 8, users: 24 },
      { month: 'Mar', academies: 12, users: 36 },
      { month: 'Apr', academies: 18, users: 54 },
      { month: 'May', academies: 25, users: 75 },
      { month: 'Jun', academies: stats.totalAcademies || 30, users: stats.totalUsers || 90 },
    ];
  };

  const getStatusDistribution = () => {
    return [
      { name: 'Active', value: stats.activeUsers, color: '#10B981' },
      { name: 'Pending', value: stats.pendingAcademies, color: '#F59E0B' },
      { name: 'Rejected', value: Math.max(0, stats.totalAcademies - stats.activeUsers - stats.pendingAcademies), color: '#EF4444' }
    ].filter(item => item.value > 0);
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.academy?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAcademies = academies.filter(academy => 
    academy.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    academy.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    academy.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className={`h-screen w-screen ${isLight ? 'bg-gray-50' : 'bg-gray-900'} flex items-center justify-center m-0 p-0 overflow-hidden`}>
        <div className="flex flex-col items-center space-y-4">
          <div className={`animate-spin rounded-full h-12 w-12 border-4 ${isLight ? 'border-gray-300 border-t-blue-600' : 'border-gray-600 border-t-blue-400'}`}></div>
          <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (userRole && userRole.role !== 'super_admin') {
    return (
      <div className={`h-screen w-screen ${isLight ? 'bg-gray-50' : 'bg-gray-900'} flex items-center justify-center m-0 p-0 overflow-hidden`}>
        <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-8 text-center shadow-lg border ${isLight ? 'border-gray-200' : 'border-gray-700'} max-w-md`}>
          <div className={`${isLight ? 'text-red-600' : 'text-red-400'} text-xl mb-2 font-semibold`}>Access Denied</div>
          <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mb-6`}>You don't have permission to access the super admin dashboard.</div>
          <button
            onClick={handleSignOut}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    // FIX: Added h-screen, w-full, overflow-hidden, m-0 to root div to remove unwanted spaces
    <div className={`h-screen w-full overflow-hidden m-0 p-0 flex ${isLight ? 'bg-gray-50' : 'bg-gray-900'}`}>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className={`lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg ${
          isLight ? 'bg-white shadow-md' : 'bg-gray-800 shadow-lg'
        } ${isMobileMenuOpen ? 'hidden' : 'block'}`}
      >
        <Menu className={`w-6 h-6 ${isLight ? 'text-gray-900' : 'text-white'}`} />
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Modern Sidebar */}
      {/* Sidebar fixed within the flex layout */}
      <nav className={`${isLight ? 'bg-white border-r border-gray-200' : 'bg-gray-800 border-r border-gray-700'} w-64 h-full flex-shrink-0 flex flex-col z-40 transition-transform duration-300 ${
        isMobileMenuOpen ? 'fixed translate-x-0' : 'fixed -translate-x-full lg:relative lg:translate-x-0'
      }`}>
        {/* Close button for mobile */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className={`lg:hidden absolute top-4 right-4 p-2 rounded-lg ${
            isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-700'
          }`}
        >
          <X className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-gray-400'}`} />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <img 
              src="https://i.ibb.co/1tLZ0Dp/TMA-LOGO-without-bg.png" 
              alt="Track My Academy" 
              className="h-10 w-10 rounded-xl object-contain"
            />
            <div>
              <h2 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Super Admin
              </h2>
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Dashboard</p>
            </div>
          </div>
          
          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: <Activity className="w-5 h-5" /> },
              { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
              { id: 'academies', label: 'Academies', icon: <School className="w-5 h-5" /> },
              { id: 'demo-requests', label: 'Demo Requests', icon: <Target className="w-5 h-5" /> },
              { id: 'billing', label: 'Billing', icon: <IndianRupee className="w-5 h-5" /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false); // Close menu on mobile when tab is clicked
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === item.id
                    ? `${isLight ? 'bg-blue-50 text-blue-600 shadow-sm' : 'bg-blue-600/20 text-blue-400'}`
                    : `${isLight ? 'text-gray-600 hover:bg-gray-50' : 'text-gray-400 hover:bg-gray-700'}`
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </nav>

      {/* Main Content - Scrollable */}
      <main className="flex-1 h-full overflow-y-auto flex flex-col relative">
        {/* Top Bar */}
        <header className={`${isLight ? 'bg-white/80 backdrop-blur-sm border-b border-gray-200' : 'bg-gray-800/80 backdrop-blur-sm border-b border-gray-700'} sticky top-0 z-10`}>
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="lg:hidden w-10" /> {/* Spacer for hamburger button */}
              <div className="h-6" />
              {(activeTab === 'users' || activeTab === 'academies') && (
                <div className="relative hidden sm:block">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isLight ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-10 pr-4 py-2 w-48 lg:w-64 rounded-lg border ${
                      isLight 
                        ? 'border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500' 
                        : 'border-gray-600 bg-gray-700 focus:bg-gray-600 focus:border-blue-400 text-white'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200`}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <p className={`text-xs sm:text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'} hidden md:block truncate max-w-[150px]`}>
                {user?.email}
              </p>
              <button className={`p-2 rounded-lg ${isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-700'} transition-colors duration-200 hidden sm:block`}>
                <Bell className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-gray-400'}`} />
              </button>
              <ThemeToggle />
              <button
                onClick={handleSignOut}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isLight 
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Search Bar */}
        {(activeTab === 'users' || activeTab === 'academies') && (
          <div className={`sm:hidden px-4 py-3 border-b ${isLight ? 'border-gray-200 bg-white' : 'border-gray-700 bg-gray-800'}`}>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isLight ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2 w-full rounded-lg border ${
                  isLight 
                    ? 'border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500' 
                    : 'border-gray-600 bg-gray-700 focus:bg-gray-600 focus:border-blue-400 text-white'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200`}
              />
            </div>
          </div>
        )}

        {/* Content Padding */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pb-20"> 
          {successMessage && (
            <div className={`${isLight ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-green-500/10 border border-green-500/30 text-green-400'} px-4 py-3 rounded-xl`}>
              {successMessage}
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Total Users</p>
                      <p className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} mt-1`}>{stats.totalUsers}</p>
                      <p className="text-sm text-blue-500 mt-1">Academy Owners</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                {/* ... other KPI cards ... */}
                <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Total Academies</p>
                      <p className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} mt-1`}>{stats.totalAcademies}</p>
                      <p className="text-sm text-green-500 mt-1">Registered</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-xl">
                      <School className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
                 {/* ... remaining KPI cards ... */}
                <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Pending Approvals</p>
                        <p className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} mt-1`}>{stats.pendingAcademies}</p>
                        <p className="text-sm text-orange-500 mt-1">Awaiting Review</p>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-xl">
                        <AlertCircle className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                </div>

                <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Active Academies</p>
                        <p className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} mt-1`}>{stats.activeUsers}</p>
                        <p className="text-sm text-purple-500 mt-1">Operational</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-xl">
                        <UserCheck className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                  <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>Platform Growth</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={getGrowthData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e5e7eb' : '#374151'} />
                      <XAxis dataKey="month" stroke={isLight ? '#6b7280' : '#9ca3af'} />
                      <YAxis stroke={isLight ? '#6b7280' : '#9ca3af'} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isLight ? '#ffffff' : '#1f2937',
                          border: `1px solid ${isLight ? '#e5e7eb' : '#374151'}`,
                          borderRadius: '12px'
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="academies" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} />
                      <Area type="monotone" dataKey="users" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                  <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>Academy Status</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getStatusDistribution()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getStatusDistribution().map((entry, index) => (
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
              </div>

              {/* Recent Activity & Academies */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                  <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>Recent Activity</h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {systemOverview?.recent_activities?.length > 0 ? systemOverview.recent_activities.map((activity) => (
                      <div key={activity.id} className={`${isLight ? 'bg-gray-50' : 'bg-gray-700'} rounded-xl p-3`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            activity.status === 'success' ? 'bg-green-500' : activity.status === 'pending' ? 'bg-orange-500' : 'bg-blue-500'
                          }`}></div>
                          <div className="flex-1">
                            <p className={`${isLight ? 'text-gray-800' : 'text-gray-200'}`}>{activity.description}</p>
                            <p className={`${isLight ? 'text-gray-500' : 'text-gray-400'} text-xs mt-1`}>
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-center py-8`}>No recent activities</div>
                    )}
                  </div>
                </div>

                <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                  <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>Recently Added Academies</h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {systemOverview?.recent_academies?.length > 0 ? systemOverview.recent_academies.map((academy) => (
                      <div key={academy.id} className={`${isLight ? 'bg-gray-50' : 'bg-gray-700'} rounded-xl p-3`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className={`${isLight ? 'text-gray-900' : 'text-white'} font-medium`}>{academy.name}</h4>
                            <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Owner: {academy.owner_name}</p>
                            <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>{academy.location} • {academy.sports_type}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            academy.status === 'approved' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>{academy.status}</span>
                        </div>
                        <p className={`${isLight ? 'text-gray-500' : 'text-gray-400'} text-xs mt-2`}>
                          Added: {new Date(academy.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    )) : (
                      <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-center py-8`}>No academies yet</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other Tabs */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>User Management</h2>
                <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Academy owners and administrators</p>
              </div>

              {filteredUsers.length === 0 ? (
                <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-12 text-center border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                  <Users className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-400' : 'text-gray-600'}`} />
                  <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-2`}>No users found</h3>
                  <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Users will appear here once academies are created.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredUsers.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'academies' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Academy Management</h2>
                <div className="flex gap-3 items-center">
                  <label className={`flex items-center gap-2 text-sm ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                    <input
                      type="checkbox"
                      checked={selectedAcademies.length === academies.length && academies.length > 0}
                      onChange={handleSelectAll}
                      className={`rounded ${isLight ? 'border-gray-300 text-blue-600 focus:ring-blue-500' : 'bg-gray-800 border-gray-600 text-blue-500 focus:ring-blue-500'}`}
                    />
                    Select All
                  </label>
                  {selectedAcademies.length > 0 && (
                    <button 
                      onClick={handleBulkApprove}
                      className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors duration-200"
                    >
                      Approve Selected ({selectedAcademies.length})
                    </button>
                  )}
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Academy
                  </button>
                </div>
              </div>

              {filteredAcademies.length === 0 ? (
                <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-12 text-center border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                  <School className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-400' : 'text-gray-600'}`} />
                  <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-2`}>No academies found</h3>
                  <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mb-6`}>Start by creating your first academy.</p>
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200"
                  >
                    Add Your First Academy
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredAcademies.map((academy) => (
                    <AcademyCard
                      key={academy.id}
                      academy={academy}
                      selected={selectedAcademies.includes(academy.id)}
                      onSelect={() => handleSelectAcademy(academy.id)}
                      onApprove={() => handleApproveAcademy(academy.id, academy.name)}
                      onReject={() => handleRejectAcademy(academy.id, academy.name)}
                      onEdit={() => handleEditAcademy(academy)}
                      onDelete={() => handleDeleteAcademy(academy.id, academy.name)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'demo-requests' && (
            <div className="space-y-6">
              <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Demo Requests</h2>
              <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'} overflow-hidden`}>
                <DemoRequestsTable />
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Billing Management</h2>
              <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'} overflow-hidden`}>
                <BillingDashboard />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <CreateAcademyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleAcademyCreated}
      />

      <EditAcademyModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAcademy(null);
        }}
        onSuccess={handleAcademyUpdated}
        academy={selectedAcademy}
      />
    </div>
  );
};

export default Dashboard;
