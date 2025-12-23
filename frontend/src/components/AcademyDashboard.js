import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import PlayerModal from './PlayerModal';
import CoachModal from './CoachModal';
import PlayerAssignmentModal from './PlayerAssignmentModal';
import AcademySettings from './AcademySettings';
import AcademyProfile from './AcademyProfile';
import AttendanceTracker from './AttendanceTracker';
import PerformanceAnalytics from './PerformanceAnalytics';
import ThemeToggle from './ThemeToggle';
import PlayerCard from './PlayerCard';
import CoachCard from './CoachCard';
import FeeCollection from './FeeCollection';
import AdvancedAnalytics from './AdvancedAnalytics';
import TrainingPlans from './TrainingPlans';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend, ComposedChart,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
    Users, UserCheck, TrendingUp, Calendar, Award, Clock,
    Activity, Search, Bell, Settings, Plus, User, Menu, X, IndianRupee, Target, LogOut, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Preloader from './Preloader';

const AcademyDashboard = () => {
    const { user, signOut, token, userRole } = useAuth();
    const { isLight } = useTheme();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);
    const [academyData, setAcademyData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [players, setPlayers] = useState([]);
    const [coaches, setCoaches] = useState([]);
    const [stats, setStats] = useState({});
    const [analytics, setAnalytics] = useState(null);
    const [dashboardAnalytics, setDashboardAnalytics] = useState(null);
    const [attendanceSummary, setAttendanceSummary] = useState(null);
    const [skillRadar, setSkillRadar] = useState(null);
    const [sportSkillRadar, setSportSkillRadar] = useState(null);
    const [coachComparison, setCoachComparison] = useState(null);
    const [coachA, setCoachA] = useState('');
    const [coachB, setCoachB] = useState('');
    const [showPlayerModal, setShowPlayerModal] = useState(false);
    const [showCoachModal, setShowCoachModal] = useState(false);
    const [showPlayerAssignmentModal, setShowPlayerAssignmentModal] = useState(false);
    const [selectedCoachForAssignment, setSelectedCoachForAssignment] = useState(null);
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [editingCoach, setEditingCoach] = useState(null);
    const [academyLogo, setAcademyLogo] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger for re-fetching coaches
    const [skillRadarPath, setSkillRadarPath] = useState('');
    const [sportRadarPath, setSportRadarPath] = useState('');
    console.log('ACADEMY DASHBOARD RENDERED AND STARTING DATA LOAD');
    const API_BASE_URL = (() => {
        const envUrl = process.env.REACT_APP_BACKEND_URL || '';
        const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
        const isLocalHost = /^(localhost|127\.0\.0\.1)$/i.test(hostname);
        const envPointsToLocal = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(envUrl);
        if (envUrl && (!isLocalHost || !envPointsToLocal)) return envUrl;
        if (/vercel\.app$/i.test(hostname) || /trackmyacademy\.com$/i.test(hostname)) return 'https://track-my-academy-backend.onrender.com';
        return envUrl || 'http://localhost:8000';
    })();

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/');
        } catch (e) {
            console.error('Logout failed:', e);
        }
    };

    const defaultLogoUrl = "https://i.ibb.co/1Z8cJ6q/academy-default-logo.png";
    const resolveLogoSrc = (url) => {
        if (!url) return defaultLogoUrl;
        const v = String(url).trim();
        if (/^(https?:|data:|blob:)/i.test(v)) return v;
        const base = (API_BASE_URL || '').replace(/\/+$/,'');
        const path = v.replace(/^\/+/, '');
        return `${base}/${path}`;
    };

    // Timeout fallback if userRole never loads
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (loading && !userRole) {
                console.error('Timeout: UserRole not loaded after 10 seconds');
                setLoading(false);
                showNotification('Failed to load user information. Please try logging in again.', 'error');
            }
        }, 10000);
        
        return () => clearTimeout(timeout);
    }, [loading, userRole]);

    const showNotification = (message, type = 'success') => {
        setNotification({ isOpen: true, message, type });
    };

    const [radarRefreshing, setRadarRefreshing] = useState(false);
    const refreshRadar = async () => {
        try {
            setRadarRefreshing(true);
            await Promise.all([loadSkillRadar(), loadSportSkillRadar()]);
            showNotification('Radar refreshed');
        } catch (e) {
            showNotification('Failed to refresh radar', 'error');
        } finally {
            setRadarRefreshing(false);
        }
    };

    useEffect(() => {
        if (notification.isOpen) {
            const timer = setTimeout(() => setNotification({ isOpen: false, message: '', type: '' }), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification.isOpen]);

    useEffect(() => {
        console.log('AcademyDashboard useEffect triggered', {
            userRole,
            hasRole: !!userRole,
            role: userRole?.role,
            academyId: userRole?.academy_id,
            token: !!token
        });
        
        if (userRole && userRole.role === 'academy_user' && userRole.academy_id) {
            console.log('Calling loadAcademyData...');
            loadAcademyData();
        } else if (userRole && userRole.role === 'academy_user' && !userRole.academy_id) {
            console.error('Academy user has no academy_id!', userRole);
            setLoading(false);
            showNotification('No academy associated with your account. Please contact support.', 'error');
        } else if (userRole && userRole.role && userRole.role !== 'academy_user') {
            console.log('Redirecting non-academy user to appropriate dashboard');
            navigate('/dashboard');
        } else if (userRole === null) {
            console.log('UserRole is null, waiting for auth context to load...');
        } else {
            console.log('Unexpected userRole state:', userRole);
        }
    }, [userRole, navigate, token]);

    // Re-fetch coaches when refreshTrigger changes
    useEffect(() => {
        if (token && refreshTrigger > 0) {
            loadCoaches();
        }
    }, [refreshTrigger]);

    useEffect(() => {
        const onSummaryUpdated = () => {
            loadAttendanceSummary();
            loadAnalytics();
            loadSkillRadar();
            loadSportSkillRadar();
        };
        window.addEventListener('academy-summary-updated', onSummaryUpdated);
        return () => {
            window.removeEventListener('academy-summary-updated', onSummaryUpdated);
        };
    }, []);

// In frontend/src/components/AcademyDashboard.js

    // In frontend/src/components/AcademyDashboard.js (around line 56)

    const loadAcademyData = async () => {
        try {
            console.log('LOG-A: Function Started.'); 
            if (!initialized) setLoading(true);

            const academyId = userRole?.academy_id;
            const academyName = userRole?.academy_name;

            if (!academyId) {
                 console.error('LOG-B: CRITICAL: Missing academy_id. Stopping load.');
                 setLoading(false);
                 return; 
            }
            
            console.log('LOG-C: Critical User Data Secured and Valid.');
            
            // This line uses the secured data to set local state.
            setAcademyData({ id: academyId, name: academyName }); 
            
            console.log('LOG-D: setAcademyData succeeded.'); 

            // --- ALL API CALLS TEMPORARILY COMMENTED OUT FOR ISOLATION ---
            await loadAcademySettings();
            await Promise.all([loadStats(), loadPlayers(), loadCoaches(), loadAnalytics(), loadAttendanceSummary(), loadSkillRadar(), loadSportSkillRadar()]);
            // -----------------------------------------------------------
            
            console.log('LOG-E: All Data Fetching Logic SKIPPED.'); 
            setInitialized(true);
        } catch (error) {
            console.error('LOG-F: SYNC CRASH CAUGHT HERE:', error);
        } finally {
            console.log('LOG-G: Setting loading to false.'); 
            setLoading(false);
        }
    };
    const loadAnalytics = async () => {
        if (!token) return;
        try {
            console.log('Dashboard: Fetching analytics...'); // Diagnostic log
            const response = await fetch(`${API_BASE_URL}/api/academy/analytics`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setAnalytics(await response.json());
                console.log('Dashboard: loadAnalytics succeeded.'); // Diagnostic log
            } else {
                console.error(`Dashboard: loadAnalytics failed with status: ${response.status}`); // Diagnostic log
            }
            const dashboardResp = await fetch(`${API_BASE_URL}/api/academy/analytics/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (dashboardResp.ok) {
                setDashboardAnalytics(await dashboardResp.json());
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    };

    const discoverRadarEndpoints = async () => {
        try {
            const resp = await fetch(`${API_BASE_URL}/openapi.json`);
            if (!resp.ok) return;
            const spec = await resp.json();
            const paths = Object.keys(spec.paths || {});
            const skillCandidate = paths.find(p => /skill-radar/i.test(p) && /academy/i.test(p))
                || paths.find(p => /skill-radar/i.test(p))
                || '';
            const sportCandidate = paths.find(p => /sport.*skill.*radar/i.test(p) && /academy/i.test(p))
                || paths.find(p => /sport.*skill.*radar/i.test(p))
                || paths.find(p => /sport.*radar/i.test(p))
                || '';
            setSkillRadarPath(skillCandidate);
            setSportRadarPath(sportCandidate);
        } catch (e) {
            console.warn('Radar endpoint discovery failed:', e);
        }
    };

    const loadAttendanceSummary = async () => {
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/academy/attendance/summary`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setAttendanceSummary(await response.json());
            }
        } catch (error) {
            console.error('Error loading attendance summary:', error);
        }
    };

    const loadSkillRadar = async () => {
        if (!token) return;
        try {
            if (!skillRadarPath) await discoverRadarEndpoints();
            const primaryPath = skillRadarPath || '/api/academy/analytics/skill-radar';
            let response = await fetch(`${API_BASE_URL}${primaryPath}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (!response.ok) {
                // Fallback for environments using older route
                response = await fetch(`${API_BASE_URL}/api/analytics/skill-radar`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
            }
            if (!response.ok) {
                response = await fetch(`${API_BASE_URL}/api/academy/skill-radar`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
            }
            if (response.ok) setSkillRadar(await response.json());
        } catch (error) {
            console.error('Error loading skill radar:', error);
        }
    };

    const loadSportSkillRadar = async () => {
        if (!token) return;
        try {
            if (!sportRadarPath) await discoverRadarEndpoints();
            const primaryPath = sportRadarPath || '/api/academy/analytics/sport-skill-radar';
            let response = await fetch(`${API_BASE_URL}${primaryPath}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (!response.ok) {
                // Fallback aliases
                response = await fetch(`${API_BASE_URL}/api/academy/analytics/sport-radar`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
            }
            if (!response.ok) {
                response = await fetch(`${API_BASE_URL}/api/analytics/sport-skill-radar`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
            }
            if (!response.ok) {
                response = await fetch(`${API_BASE_URL}/api/academy/sport-skill-radar`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
            }
            if (response.ok) setSportSkillRadar(await response.json());
        } catch (error) {
            console.error('Error loading sport-wise skill radar:', error);
        }
    };

    const loadCoachComparison = async (a, b) => {
        if (!token) return;
        try {
            const params = new URLSearchParams();
            if (a) params.append('coach_a', a);
            if (b) params.append('coach_b', b);
            const response = await fetch(`${API_BASE_URL}/api/academy/analytics/coach-comparison?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (response.ok) {
                setCoachComparison(await response.json());
            }
        } catch (error) {
            console.error('Error loading coach comparison:', error);
        }
    };

    useEffect(() => {
        if (activeTab === 'coach-comparison') {
            // initialize selections with first two coaches if empty
            if (!coachA && coaches.length > 0) setCoachA(coaches[0].id);
            if (!coachB && coaches.length > 1) setCoachB(coaches[1].id);
            const a = coachA || (coaches[0] && coaches[0].id) || '';
            const b = coachB || (coaches[1] && coaches[1].id) || '';
            loadCoachComparison(a, b);
        }
    }, [activeTab, coachA, coachB, coaches]);

    useEffect(() => {
        const onCoachRatingUpdated = () => {
            if (activeTab === 'coach-comparison') {
                const a = coachA || (coaches[0] && coaches[0].id) || '';
                const b = coachB || (coaches[1] && coaches[1].id) || '';
                loadCoachComparison(a, b);
            }
        };
        window.addEventListener('coach-rating-updated', onCoachRatingUpdated);
        return () => {
            window.removeEventListener('coach-rating-updated', onCoachRatingUpdated);
        };
    }, [activeTab, coachA, coachB, coaches]);

    const loadAcademySettings = async () => {
        if (!token) return;
        try {
            console.log('Dashboard: Fetching academy settings...'); // Diagnostic log
            const response = await fetch(`${API_BASE_URL}/api/academy/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const settings = await response.json();
                const logoUrl = (settings.branding && settings.branding.logo_url) ? settings.branding.logo_url : settings.logo_url;
                setAcademyLogo(logoUrl);
                console.log('Dashboard: loadAcademySettings succeeded.'); // Diagnostic log
            } else {
                console.error(`Dashboard: loadAcademySettings failed with status: ${response.status}`); // Diagnostic log
            }
        } catch (error) {
            console.error('Error loading academy settings:', error);
        } finally {
            console.log('Finished loading academy settings.');
        }
    };

    const loadStats = async () => {
        if (!token) return;
        try {
            console.log('Dashboard: Fetching stats...'); // Diagnostic log
            const response = await fetch(`${API_BASE_URL}/api/academy/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setStats(await response.json());
                console.log('Dashboard: loadStats succeeded.'); // Diagnostic log
            } else {
                console.error(`Dashboard: loadStats failed with status: ${response.status}`); // Diagnostic log
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const loadPlayers = async () => {
        if (!token) return;
        try {
            console.log('Dashboard: Fetching players...'); // Diagnostic log
            const response = await fetch(`${API_BASE_URL}/api/academy/players`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setPlayers(await response.json());
                console.log('Dashboard: loadPlayers succeeded.'); // Diagnostic log
            } else {
                console.error(`Dashboard: loadPlayers failed with status: ${response.status}`); // Diagnostic log
            }
        } catch (error) {
            console.error('Error loading players:', error);
        }
    };

    const loadCoaches = async () => {
        if (!token) return;
        try {
            console.log('Dashboard: Fetching coaches...'); // Diagnostic log
            const response = await fetch(`${API_BASE_URL}/api/academy/coaches`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const coachesData = await response.json();
                console.log('Loaded coaches:', coachesData);
                console.log('Dashboard: loadCoaches succeeded.'); // Diagnostic log
                setCoaches(coachesData);
            } else {
                console.error(`Dashboard: loadCoaches failed with status: ${response.status}`); // Diagnostic log
            }
        } catch (error) {
            console.error('Error loading coaches:', error);
        }
    };
    
   
    const handleCoachUpdate = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleCreatePlayer = async (playerData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/academy/players`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(playerData)
            });
            if (response.ok) {
                const newPlayer = await response.json();
                await Promise.all([loadPlayers(), loadStats()]);
                setShowPlayerModal(false);
                
                
                if (newPlayer.default_password) {
                    const credentialsMsg = `Player Created Successfully!\n\n` +
                        `Name: ${newPlayer.first_name} ${newPlayer.last_name}\n` +
                        `Email: ${newPlayer.email}\n` +
                        `Password: ${newPlayer.default_password}\n\n` +
                        `⚠️ Please save these credentials and share them with the player.\n` +
                        `The password will be visible on the player card until they change it.` +
                        `${newPlayer.has_login ? '' : '\n\nNote: Account activation is pending in local environment.'}`;
                    alert(credentialsMsg);
                }
                
                showNotification('Player created successfully!');
            } else {
                let errorMsg = `Error: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = `Error: ${errorData.detail || 'Please check the form fields.'}`;
                } catch (e) {
                    console.error("Could not parse error JSON from server.");
                }
                showNotification(errorMsg, 'error');
            }
        } catch (error) {
            console.error('An unexpected error occurred during creation:', error);
            showNotification('A network error occurred. Please try again.', 'error');
        }
    };

    const handleUpdatePlayer = async (playerId, playerData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/academy/players/${playerId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(playerData)
            });
            if (response.ok) {
                const updatedPlayer = await response.json();
                setPlayers(players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
                setShowPlayerModal(false);
                setEditingPlayer(null);
                showNotification('Player updated successfully!');
                await loadStats();
            } else {
                let errorMsg = `Error: ${response.status}`;
                try {
                  const errorData = await response.json();
                  // Handle various error formats
                  if (typeof errorData.detail === 'string') {
                    errorMsg = `Error: ${errorData.detail}`;
                  } else if (typeof errorData.detail === 'object') {
                    errorMsg = `Error: ${JSON.stringify(errorData.detail)}`;
                  } else if (errorData.message) {
                    errorMsg = `Error: ${errorData.message}`;
                  } else {
                    errorMsg = `Error: ${response.statusText || 'Please check the form fields.'}`;
                  }
                } catch (e) {
                  console.error("Could not parse error JSON from server.");
                  errorMsg = `Error: ${response.statusText || 'Failed to update player'}`;
                }
                showNotification(errorMsg, 'error');
            }
        } catch (error) {
            console.error('An error occurred during the update process:', error);
            const errorMsg = error.message || 'A network error occurred. Please try again.';
            showNotification(`Error: ${errorMsg}`, 'error');
        }
    };

    const handleDeletePlayer = async (playerId) => {
        if (!window.confirm('Are you sure you want to delete this player?')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/academy/players/${playerId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                await Promise.all([loadPlayers(), loadStats()]);
                showNotification('Player deleted successfully!');
            } else {
                let errorMsg = 'Failed to delete player';
                try {
                    const errorData = await response.json();
                    if (typeof errorData.detail === 'string') {
                        errorMsg = errorData.detail;
                    } else if (typeof errorData.detail === 'object') {
                        errorMsg = JSON.stringify(errorData.detail);
                    } else if (errorData.message) {
                        errorMsg = errorData.message;
                    }
                } catch (e) {
                    console.error('Could not parse error JSON');
                }
                showNotification(`Error: ${errorMsg}`, 'error');
            }
        } catch (error) {
            console.error('Error deleting player:', error);
            const errorMsg = error.message || 'An unexpected network error occurred';
            showNotification(`Error: ${errorMsg}`, 'error');
        }
    };

    const handleRegeneratePlayerPassword = async (playerId) => {
        if (!window.confirm('Are you sure you want to regenerate the password for this player? The current password will be replaced.')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/academy/players/${playerId}/regenerate-password`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                await loadPlayers();
                showNotification(`Password regenerated! New password: ${data.new_password}`);
                
                alert(`New Password Generated!\n\nEmail: ${data.player_email}\nPassword: ${data.new_password}\n\nPlease save this password and share it with the player.`);
            } else {
                const error = await response.json();
                showNotification(`Error: ${error.detail || 'Failed to regenerate password.'}`, 'error');
            }
        } catch (error) {
            console.error('Error regenerating password:', error);
            showNotification('An unexpected network error occurred.', 'error');
        }
    };

    const handleCreateCoach = async (coachData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/academy/coaches`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(coachData)
            });
            if (response.ok) {
                const newCoach = await response.json();
                console.log('Coach created:', newCoach); // Debug log
                // Reload coaches and stats
                await Promise.all([loadCoaches(), loadStats()]);
                setShowCoachModal(false);
                showNotification('Coach created successfully!');
                return true; // Indicate success
            } else {
                const error = await response.json();
                showNotification(`Error: ${error.detail || 'Failed to create coach.'}`, 'error');
                return false; // Indicate failure
            }
        } catch (error) {
            console.error('Error creating coach:', error);
            showNotification('An unexpected network error occurred.', 'error');
            return false; // Indicate failure
        }
    };

    const handleUpdateCoach = async (coachId, coachData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/academy/coaches/${coachId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(coachData)
            });
            if (response.ok) {
                const updatedCoach = await response.json();
                console.log('Coach updated:', updatedCoach); // Debug log
                await Promise.all([loadCoaches(), loadStats()]);
                setShowCoachModal(false);
                setEditingCoach(null);
                showNotification('Coach updated successfully!');
                return true; // Indicate success
            } else {
                let errorMsg = 'Failed to update coach';
                try {
                    const errorData = await response.json();
                    // Handle various error formats
                    if (typeof errorData.detail === 'string') {
                        errorMsg = errorData.detail;
                    } else if (typeof errorData.detail === 'object') {
                        errorMsg = JSON.stringify(errorData.detail);
                    } else if (errorData.message) {
                        errorMsg = errorData.message;
                    } else {
                        errorMsg = response.statusText || 'Failed to update coach';
                    }
                } catch (e) {
                    console.error('Could not parse error JSON from server.');
                    errorMsg = response.statusText || 'Failed to update coach';
                }
                showNotification(`Error: ${errorMsg}`, 'error');
                return false; // Indicate failure
            }
        } catch (error) {
            console.error('Error updating coach:', error);
            const errorMsg = error.message || 'An unexpected network error occurred';
            showNotification(`Error: ${errorMsg}`, 'error');
            return false; // Indicate failure
        }
    };

    const handleDeleteCoach = async (coachId) => {
        if (!window.confirm('Are you sure you want to delete this coach?')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/academy/coaches/${coachId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                await Promise.all([loadCoaches(), loadStats()]);
                showNotification('Coach deleted successfully!');
            } else {
                let errorMsg = 'Failed to delete coach';
                try {
                    const errorData = await response.json();
                    if (typeof errorData.detail === 'string') {
                        errorMsg = errorData.detail;
                    } else if (typeof errorData.detail === 'object') {
                        errorMsg = JSON.stringify(errorData.detail);
                    } else if (errorData.message) {
                        errorMsg = errorData.message;
                    }
                } catch (e) {
                    console.error('Could not parse error JSON');
                }
                showNotification(`Error: ${errorMsg}`, 'error');
            }
        } catch (error) {
            console.error('Error deleting coach:', error);
            showNotification('An unexpected network error occurred.', 'error');
        }
    };

    const handleOpenAssignPlayers = (coach) => {
        setSelectedCoachForAssignment(coach);
        setShowPlayerAssignmentModal(true);
    };

    const handleAssignPlayers = async (coachId, playerIds) => {
        const payload = { player_ids: playerIds, coach_id: coachId };
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
        const urls = [
            `${API_BASE_URL}/api/academy/players/bulk-assign`,
            `${API_BASE_URL}/api/academy/players/bulk-assign/`,
            `${API_BASE_URL}/api/players/bulk-assign`,
            `${API_BASE_URL}/api/players/bulk-assign/`,
        ];
        try {
            let response;
            for (const u of urls) {
                response = await fetch(u, { method: 'POST', headers, body: JSON.stringify(payload) });
                if (response.status === 405) {
                    response = await fetch(u, { method: 'PUT', headers, body: JSON.stringify(payload) });
                }
                if (response.ok) { break; }
            }
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.detail || `Bulk assign failed (${response.status})`);
            }
            const data = await response.json();
            await loadPlayers();
            const action = coachId ? 'assigned' : 'unassigned';
            const missingCount = Array.isArray(data.missing_ids) ? data.missing_ids.length : 0;
            showNotification(`Successfully ${action} ${data.modified_count} player(s)!${missingCount ? ` (${missingCount} not found)` : ''}`);
        } catch (error) {
            console.error('Error assigning players:', error);
            throw error;
        }
    };

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

    const getPlayerDistributionData = () => {
        if (!analytics?.player_analytics?.position_distribution) return [];
        return Object.entries(analytics.player_analytics.position_distribution).map(([position, count]) => ({
            name: position, value: count
        }));
    };

    const getSportDistributionData = () => {
        if (!players || players.length === 0) return [];
        const counts = players.reduce((acc, p) => {
            const key = (p.sport || 'Unknown').trim();
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(counts).map(([sport, count]) => ({ name: sport, value: count }));
    };

    // Helper function for Revenue Growth data
    const getRevenueGrowthData = () => {
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const label = d.toLocaleDateString('en-US', { month: 'short' });
            months.push({
                month: label,
                revenue: Math.floor((dashboardAnalytics?.monthly_revenue || 0) * (0.7 + Math.random() * 0.6))
            });
        }
        return months;
    };

    // Helper function for Average Player Performance Growth data
    const getPerformanceGrowthData = () => {
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const label = d.toLocaleDateString('en-US', { month: 'short' });
            const basePerformance = attendanceSummary?.average_performance_rating || 5;
            months.push({
                month: label,
                performance: Math.floor(basePerformance * (0.7 + Math.random() * 0.5))
            });
        }
        return months;
    };

    const getAgeDistributionData = () => {
        if (!analytics?.player_analytics?.age_distribution) return [];
        return Object.entries(analytics.player_analytics.age_distribution).map(([ageGroup, count]) => ({
            ageGroup: ageGroup.replace('_', '-'), players: count
        }));
    };

    const getPlayerGrowthTrend = () => {
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            months.push({ key: `${d.getFullYear()}-${d.getMonth() + 1}`, label, count: 0 });
        }
        const bucket = (dateStr) => {
            const d = new Date(dateStr);
            if (Number.isNaN(d.getTime())) return null;
            return `${d.getFullYear()}-${d.getMonth() + 1}`;
        };
        (players || []).forEach(p => {
            const key = bucket(p.created_at || p.createdAt);
            if (!key) return;
            const idx = months.findIndex(m => m.key === key);
            if (idx !== -1) months[idx].count += 1;
        });
        return months.map(m => ({ month: m.label, count: m.count }));
    };

    const getMonthlyGrowthData = () => {
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const label = d.toLocaleDateString('en-US', { month: 'short' });
            months.push({ key: `${d.getFullYear()}-${d.getMonth() + 1}`, label });
        }
        const bucket = (dateStr) => {
            const d = new Date(dateStr);
            if (Number.isNaN(d.getTime())) return null;
            return `${d.getFullYear()}-${d.getMonth() + 1}`;
        };
        const countMapPlayers = Object.create(null);
        const countMapCoaches = Object.create(null);
        (players || []).forEach(p => {
            const key = bucket(p.created_at || p.createdAt);
            if (!key) return;
            countMapPlayers[key] = (countMapPlayers[key] || 0) + 1;
        });
        (coaches || []).forEach(c => {
            const key = bucket(c.created_at || c.createdAt);
            if (!key) return;
            countMapCoaches[key] = (countMapCoaches[key] || 0) + 1;
        });
        let cumPlayers = 0;
        let cumCoaches = 0;
        return months.map(m => {
            cumPlayers += (countMapPlayers[m.key] || 0);
            cumCoaches += (countMapCoaches[m.key] || 0);
            return { month: m.label, players: cumPlayers, coaches: cumCoaches };
        });
    };

    const renderMonthlyGrowthTooltip = ({ active, payload, label }) => {
        if (!active || !payload || payload.length === 0) return null;
        const playersPoint = payload.find(p => p.dataKey === 'players');
        const coachesPoint = payload.find(p => p.dataKey === 'coaches');
        return (
            <div style={{
                backgroundColor: isLight ? '#ffffff' : '#1f2937',
                border: `1px solid ${isLight ? '#e5e7eb' : '#374151'}`,
                borderRadius: 12,
                padding: '8px 10px',
                boxShadow: isLight ? '0 4px 10px rgba(0,0,0,0.06)' : '0 4px 10px rgba(0,0,0,0.4)'
            }}>
                <div style={{ fontWeight: 600, marginBottom: 6, color: isLight ? '#374151' : '#e5e7eb' }}>{label}</div>
                {playersPoint && (
                    <div style={{ color: '#3B82F6', fontSize: 13 }}>players : {playersPoint.value}</div>
                )}
                {coachesPoint && (
                    <div style={{ color: '#10B981', fontSize: 13 }}>coaches : {coachesPoint.value}</div>
                )}
            </div>
        );
    };

    const wrapLabel = (text, max = 12) => {
        const t = String(text || "").trim();
        if (t.length <= max) return [t];
        const parts = t.split(' ');
        if (parts.length === 1) return [t];
        let line1 = parts[0];
        let i = 1;
        while (i < parts.length && (line1 + ' ' + parts[i]).length <= max) {
            line1 = line1 + ' ' + parts[i];
            i++;
        }
        const line2 = parts.slice(i).join(' ');
        return [line1, line2];
    };

    const renderPolarTick = (props) => {
        const { x, y, cx, cy, payload } = props;
        const lines = wrapLabel(payload.value, 14);
        const vx = (x ?? 0) - (cx ?? 0);
        const vy = (y ?? 0) - (cy ?? 0);
        const mag = Math.sqrt(vx * vx + vy * vy) || 1;
        const pad = 28; // outward padding to avoid embedding
        const tx = (x ?? 0) + (vx / mag) * pad;
        const ty = (y ?? 0) + (vy / mag) * pad;
        return (
            <text x={tx} y={ty} textAnchor="middle" fill={isLight ? '#374151' : '#e5e7eb'} fontSize={12}>
                {lines.map((line, idx) => (
                    <tspan key={idx} x={tx} dy={idx === 0 ? 0 : 14}>{line}</tspan>
                ))}
            </text>
        );
    };

    const renderRadarTooltip = ({ active, payload, label }) => {
        if (!active || !payload || payload.length === 0) return null;
        const boxStyle = {
            backgroundColor: isLight ? '#ffffff' : '#1f2937',
            border: `1px solid ${isLight ? '#e5e7eb' : '#374151'}`,
            borderRadius: 12,
            padding: '10px 12px',
            color: isLight ? '#111827' : '#e5e7eb'
        };
        const titleStyle = { fontWeight: 700, marginBottom: 6 };
        const academyColor = '#3B82F6';
        const targetColor = '#F59E0B';
        return (
            <div style={boxStyle}>
                <div style={titleStyle}>{label}</div>
                {payload.map((p, idx) => {
                    const name = String(p.name || '').toLowerCase();
                    const color = name.includes('academy') ? academyColor : targetColor;
                    return (
                        <div key={idx} style={{ color, fontWeight: 600 }}>
                            {p.name} : {p.value}
                        </div>
                    );
                })}
            </div>
        );
    };
    const getPerformanceData = () => [
        { week: 'W1', attendance: 85, performance: 78 }, { week: 'W2', attendance: 88, performance: 82 },
        { week: 'W3', attendance: 92, performance: 85 }, { week: 'W4', attendance: 87, performance: 88 },
    ];

    const filteredPlayers = players.filter(player =>
        `${player.first_name} ${player.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.position?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredCoaches = coaches.filter(coach =>
        `${coach.first_name} ${coach.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coach.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    

    return (
        <div className={`min-h-screen ${isLight ? 'bg-gray-50' : 'bg-gray-900'}`}>
            {/* Only show preloader on initial load, not when returning to tab */}
            {!initialized && <Preloader fadeOut={!loading} />}
            <AnimatePresence>
                {notification.isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, x: '-50%' }}
                        animate={{ opacity: 1, y: 20, x: '-50%' }}
                        exit={{ opacity: 0, y: -50, x: '-50%' }}
                        className={`fixed top-0 left-1/2 z-50 p-4 rounded-lg shadow-lg text-white ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
                    >
                        {notification.message}
                    </motion.div>
                )}
            </AnimatePresence>

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

            <div className="flex">
                <style>
                    {`
                        .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
                        .hide-scrollbar::-webkit-scrollbar { width: 0; height: 0; display: none; }
                    `}
                </style>
                <nav className={`${isLight ? 'bg-white border-r border-gray-200' : 'bg-gray-800 border-r border-gray-700'} w-64 h-screen overflow-y-auto hide-scrollbar fixed left-0 top-0 z-40 transition-transform duration-300 ${
                    isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
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
                                src={resolveLogoSrc(academyLogo)}
                                alt="Academy Logo"
                                className="h-12 w-12 rounded-xl object-cover border-2 border-gray-200 shadow-md"
                                onError={(e) => { e.currentTarget.src = defaultLogoUrl; }}
                            />
                            <div>
                                <h2 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} truncate max-w-[140px]`}>{academyData?.name || 'Academy'}</h2>
                                <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Dashboard</p>
                            </div>
                        </div>
                        <nav className="space-y-2">
                            {[
                                { id: 'overview', label: 'Overview', icon: <Activity className="w-5 h-5" /> },
                                { id: 'players', label: 'Players', icon: <Users className="w-5 h-5" /> },
                                { id: 'coaches', label: 'Coaches', icon: <UserCheck className="w-5 h-5" /> },
                                { id: 'coach-comparison', label: 'Coach Comparison', icon: <TrendingUp className="w-5 h-5" /> },
                                { id: 'fees', label: 'Fee Collection', icon: <IndianRupee className="w-5 h-5" /> },
                                { id: 'training', label: 'Training Plans', icon: <Calendar className="w-5 h-5" /> },
                                { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-5 h-5" /> },
                                { id: 'attendance', label: 'Attendance', icon: <Calendar className="w-5 h-5" /> },
                                { id: 'performance', label: 'Performance', icon: <TrendingUp className="w-5 h-5" /> },
                                { id: 'sport-radar', label: 'Sport Wise Radar', icon: <Target className="w-5 h-5" /> },
                                { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
                                { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
                            ].map((item) => (
                                <button 
                                    key={item.id} 
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        setIsMobileMenuOpen(false);
                                    }} 
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === item.id ? `${isLight ? 'bg-blue-50 text-blue-600 shadow-sm' : 'bg-blue-600/20 text-blue-400'}` : `${isLight ? 'text-gray-600 hover:bg-gray-50' : 'text-gray-400 hover:bg-gray-700'}`}`}>
                                    {item.icon}<span>{item.label}</span>
                                </button>
                            ))}
                            <div className={`mt-4 pt-3 border-t ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                                <button
                                    onClick={handleLogout}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isLight ? 'text-red-600 hover:bg-red-50' : 'text-red-400 hover:bg-red-500/10'}`}
                                >
                                    <LogOut className="w-5 h-5" /><span>Log Out</span>
                                </button>
                            </div>
                        </nav>
                    </div>
                </nav>

                <main className="flex-1 lg:ml-64">
                    <div className="flex items-center justify-between px-4 sm:px-6 mb-4 sm:mb-6 mt-4">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="hidden sm:block">
                                <h1 className={`text-lg sm:text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
                            </div>
                            {(activeTab === 'players' || activeTab === 'coaches') && (
                                <div className="relative hidden sm:block">
                                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isLight ? 'text-gray-400' : 'text-gray-500'}`} />
                                    <input type="text" placeholder={`Search ${activeTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`pl-10 pr-4 py-2 w-48 lg:w-64 rounded-lg border ${isLight ? 'border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500' : 'border-gray-600 bg-gray-700 focus:bg-gray-600 focus:border-blue-400 text-white'} focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200`} />
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <button className={`p-2 rounded-lg ${isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-700'} transition-colors duration-200 hidden sm:block`}>
                                <Bell className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-gray-400'}`} />
                            </button>
                            <ThemeToggle />
                        </div>
                    </div>

                    {/* Mobile Search Bar (shown below header when applicable) */}
                    {(activeTab === 'players' || activeTab === 'coaches') && (
                        <div className={`sm:hidden px-4 py-3 border-b ${isLight ? 'border-gray-200 bg-white' : 'border-gray-700 bg-gray-800'}`}>
                            <div className="relative">
                                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isLight ? 'text-gray-400' : 'text-gray-500'}`} />
                                <input 
                                    type="text" 
                                    placeholder={`Search ${activeTab}...`} 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                    className={`pl-10 pr-4 py-2 w-full rounded-lg border ${isLight ? 'border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500' : 'border-gray-600 bg-gray-700 focus:bg-gray-600 focus:border-blue-400 text-white'} focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200`} 
                                />
                            </div>
                        </div>
                    )}
                    
                    <div className="px-4 sm:px-6 py-0 space-y-4 sm:space-y-6">
                        {/* Tab Content - Keep mounted but hide inactive tabs */}
                        <div className={activeTab === 'overview' ? 'block' : 'hidden'}>
                            <div className="space-y-6">
                                {/* Row 1: Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col space-y-1">
                                                <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Total Players</p>
                                                <p className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{stats.total_players || 0}</p>
                                                <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>of {stats.player_limit || 50}</p>
                                            </div>
                                            <div className="p-3 bg-blue-100 rounded-xl"><Users className="w-6 h-6 text-blue-600" /></div>
                                        </div>
                                    </div>
                                    <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col space-y-1">
                                                <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Active Coaches</p>
                                                <p className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{stats.active_coaches || 0}</p>
                                                <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>of {stats.coach_limit || 10}</p>
                                            </div>
                                            <div className="p-3 bg-green-100 rounded-xl"><UserCheck className="w-6 h-6 text-green-600" /></div>
                                        </div>
                                    </div>
                                    <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col space-y-1">
                                                <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Attendance Rate</p>
                                                <p className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{attendanceSummary?.overall_attendance_rate != null ? `${attendanceSummary.overall_attendance_rate.toFixed(1)}%` : 'N/A'}</p>
                                                <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Academy average</p>
                                            </div>
                                            <div className="p-3 bg-orange-100 rounded-xl"><TrendingUp className="w-6 h-6 text-orange-600" /></div>
                                        </div>
                                    </div>
                                    <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col space-y-1">
                                                <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Performance Score</p>
                                                <p className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{attendanceSummary?.average_performance_rating != null ? `${attendanceSummary.average_performance_rating.toFixed(1)}` : 'N/A'}</p>
                                                <p className="text-sm text-blue-500">Academy Average</p>
                                            </div>
                                            <div className="p-3 bg-purple-100 rounded-xl"><Award className="w-6 h-6 text-purple-600" /></div>
                                        </div>
                                    </div>
                                    <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col space-y-1">
                                                <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Monthly Revenue</p>
                                                <p className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>₹{(dashboardAnalytics?.monthly_revenue ?? 0).toLocaleString()}</p>
                                                <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Last 30 days</p>
                                            </div>
                                            <div className="p-3 bg-blue-100 rounded-xl"><IndianRupee className="w-6 h-6 text-blue-600" /></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Monthly Player Growth + Right Sidebar */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Left: Monthly Player Growth (spans 2 columns) */}
                                    <div className={`lg:col-span-2 ${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                                        <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>Monthly Player Growth</h3>
                                        <ResponsiveContainer width="100%" height={450}>
                                            <AreaChart data={getMonthlyGrowthData()}>
                                                <defs>
                                                    <linearGradient id="colorPlayers" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e5e7eb' : '#374151'} />
                                                <XAxis
                                                    dataKey="month"
                                                    stroke={isLight ? '#6b7280' : '#9ca3af'}
                                                    tickLine={false}
                                                    axisLine={{ stroke: isLight ? '#e5e7eb' : '#374151' }}
                                                />
                                                <YAxis
                                                    stroke={isLight ? '#6b7280' : '#9ca3af'}
                                                    allowDecimals={false}
                                                    tickLine={false}
                                                    axisLine={{ stroke: isLight ? '#e5e7eb' : '#374151' }}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: isLight ? '#ffffff' : '#1f2937',
                                                        border: `1px solid ${isLight ? '#e5e7eb' : '#374151'}`,
                                                        borderRadius: '8px'
                                                    }}
                                                />
                                                <Legend verticalAlign="bottom" iconType="circle" payload={[{ value: 'players', type: 'circle', color: '#3B82F6' }, { value: 'coaches', type: 'circle', color: '#10B981' }]} />
                                                <Area type="monotone" dataKey="players" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorPlayers)" />
                                                <Area type="monotone" dataKey="coaches" stroke="#10B981" strokeWidth={2} fillOpacity={0.1} fill="#10B981" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Right: Players by Sport + Skill Radar (stacked) */}
                                    <div className="lg:col-span-1 space-y-6">
                                        {/* Players by Sport */}
                                        <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                                            <div className="flex flex-col mb-4">
                                                <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-3`}>Players by Sport</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {getSportDistributionData().map((entry, index) => (
                                                        <div key={`legend-${index}`} className="flex items-center gap-1.5 text-xs">
                                                            <span
                                                                className="inline-block w-2.5 h-2.5 rounded-sm"
                                                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                            />
                                                            <span className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{entry.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <ResponsiveContainer width="100%" height={200}>
                                                <PieChart>
                                                    <Pie
                                                        data={getSportDistributionData()}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        innerRadius={45}
                                                        outerRadius={70}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                        paddingAngle={2}
                                                    >
                                                        {getSportDistributionData().map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: isLight ? '#ffffff' : '#1f2937',
                                                            border: `1px solid ${isLight ? '#e5e7eb' : '#374151'}`,
                                                            borderRadius: '8px'
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Academy Wide Skill Radar */}
                                        {skillRadar && (
                                            <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className={`text-sm font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Academy Wide Skill Radar</h3>
                                                    <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Target: {skillRadar.target}</div>
                                                </div>
                                                <ResponsiveContainer width="100%" height={220}>
                                                    <RadarChart
                                                        data={skillRadar.categories.map(c => ({ category: c.name, academy: c.average, target: skillRadar.target }))}
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius="70%"
                                                        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                                                    >
                                                        <PolarGrid stroke={isLight ? '#e5e7eb' : '#374151'} />
                                                        <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: isLight ? '#6b7280' : '#9ca3af' }} />
                                                        <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} tickLine={false} axisLine={false} />
                                                        <Radar name="Academy" dataKey="academy" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.25} />
                                                        <Radar name="Target" dataKey="target" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} />
                                                        <Legend verticalAlign="bottom" iconType="circle" payload={[{ value: 'Academy', type: 'circle', color: '#3B82F6' }, { value: 'Target', type: 'circle', color: '#F59E0B' }]} wrapperStyle={{ fontSize: '10px' }} />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Row 3: Revenue Growth + Performance Growth */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Revenue Growth */}
                                    <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                                        <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>Revenue Growth</h3>
                                        <ResponsiveContainer width="100%" height={280}>
                                            <AreaChart data={getRevenueGrowthData()}>
                                                <defs>
                                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e5e7eb' : '#374151'} />
                                                <XAxis
                                                    dataKey="month"
                                                    stroke={isLight ? '#6b7280' : '#9ca3af'}
                                                    tickLine={false}
                                                    axisLine={{ stroke: isLight ? '#e5e7eb' : '#374151' }}
                                                />
                                                <YAxis
                                                    stroke={isLight ? '#6b7280' : '#9ca3af'}
                                                    tickLine={false}
                                                    axisLine={{ stroke: isLight ? '#e5e7eb' : '#374151' }}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: isLight ? '#ffffff' : '#1f2937',
                                                        border: `1px solid ${isLight ? '#e5e7eb' : '#374151'}`,
                                                        borderRadius: '8px'
                                                    }}
                                                />
                                                <Legend verticalAlign="bottom" iconType="circle" payload={[{ value: 'coaches', type: 'circle', color: '#10B981' }]} />
                                                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Average Player Performance Growth */}
                                    <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                                        <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>Average Player Performance Growth</h3>
                                        <ResponsiveContainer width="100%" height={280}>
                                            <AreaChart data={getPerformanceGrowthData()}>
                                                <defs>
                                                    <linearGradient id="colorPerformance" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e5e7eb' : '#374151'} />
                                                <XAxis
                                                    dataKey="month"
                                                    stroke={isLight ? '#6b7280' : '#9ca3af'}
                                                    tickLine={false}
                                                    axisLine={{ stroke: isLight ? '#e5e7eb' : '#374151' }}
                                                />
                                                <YAxis
                                                    stroke={isLight ? '#6b7280' : '#9ca3af'}
                                                    tickLine={false}
                                                    axisLine={{ stroke: isLight ? '#e5e7eb' : '#374151' }}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: isLight ? '#ffffff' : '#1f2937',
                                                        border: `1px solid ${isLight ? '#e5e7eb' : '#374151'}`,
                                                        borderRadius: '8px'
                                                    }}
                                                />
                                                <Legend verticalAlign="bottom" iconType="circle" payload={[{ value: 'players', type: 'circle', color: '#3B82F6' }, { value: 'coaches', type: 'circle', color: '#10B981' }]} />
                                                <Area type="monotone" dataKey="performance" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorPerformance)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={activeTab === 'sport-radar' ? 'block' : 'hidden'}>
                            {sportSkillRadar ? (
                                <div className="space-y-6">
                                    <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Sport Wise Skill Radar</h3>
                                            <div className="flex items-center gap-3">
                                                <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Target: {sportSkillRadar.target}</div>
                                                <button onClick={refreshRadar} className={`${isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'} px-3 py-1 rounded-lg text-sm flex items-center gap-2`}>
                                                    {radarRefreshing && <Activity className="w-4 h-4 animate-spin" />}
                                                    Refresh
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                            {sportSkillRadar.sports.map((s) => (
                                                <div key={s.sport} className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <Target className={`w-5 h-5 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
                                                            <h4 className={`text-md font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{s.sport}</h4>
                                                        </div>
                                                        <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Sessions: {s.sample_size}</div>
                                                    </div>
                                                    <ResponsiveContainer width="100%" height={340}>
                                                        <RadarChart
                                                            data={s.categories.map(c => ({ category: c.name, academy: c.average, target: sportSkillRadar.target }))}
                                                            cx="50%"
                                                            cy="50%"
                                                            outerRadius="60%"
                                                            margin={{ top: 28, right: 32, bottom: 28, left: 32 }}
                                                        >
                                                            <PolarGrid stroke={isLight ? '#e5e7eb' : '#374151'} />
                                                            <PolarAngleAxis dataKey="category" tick={renderPolarTick} />
                                                             <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} tickLine={false} axisLine={false} />
                                                            <Radar name="Academy" dataKey="academy" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.25} isAnimationActive animationBegin={300} animationDuration={1200} animationEasing="ease-out" />
                                                            <Radar name="Target" dataKey="target" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} isAnimationActive animationBegin={300} animationDuration={1200} animationEasing="ease-out" />
                                                            <Legend verticalAlign="bottom" iconType="circle" payload={[{ value: 'Academy', type: 'circle', color: '#3B82F6' }, { value: 'Target', type: 'circle', color: '#F59E0B' }]} />
                                                            <Tooltip content={renderRadarTooltip} />
                                                        </RadarChart>
                                                    </ResponsiveContainer>
                                                    <div className="mt-4">
                                                        <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-xs`}>Overall Avg: {s.overall_average}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-12 text-center border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                                    <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-2`}>No sport-wise data available</h3>
                                </div>
                            )}
                        </div>
                        <div className={activeTab === 'players' ? 'block' : 'hidden'}>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Players</h2>
                                    <button onClick={() => { setEditingPlayer(null); setShowPlayerModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200"><Plus className="w-4 h-4" /> Add Player</button>
                                </div>
                                {loading ? <p>Loading...</p> : filteredPlayers.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {filteredPlayers.map((player) => <PlayerCard key={player.id} player={player} onEdit={(p) => { setEditingPlayer(p); setShowPlayerModal(true); }} onDelete={() => handleDeletePlayer(player.id)} onRegeneratePassword={handleRegeneratePlayerPassword} />)}
                                    </div>
                                ) : (
                                    <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-8 md:p-12 border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}><Users className={`w-12 h-12 md:w-16 md:h-16 mb-4 ${isLight ? 'text-gray-400' : 'text-gray-600'}`} /><h3 className={`text-lg md:text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-2`}>No players found</h3></div>
                                )}
                            </div>
                        </div>
                        
                        <div className={activeTab === 'coaches' ? 'block' : 'hidden'}>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Coaches</h2>
                                    <button onClick={() => { setEditingCoach(null); setShowCoachModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors duration-200"><Plus className="w-4 h-4" /> Add Coach</button>
                                </div>
                                {loading ? <p>Loading...</p> : filteredCoaches.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                                        {filteredCoaches.map((coach) => <CoachCard key={coach.id} coach={coach} onEdit={(c) => { setEditingCoach(c); setShowCoachModal(true); }} onDelete={() => handleDeleteCoach(coach.id)} onAssignPlayers={handleOpenAssignPlayers} />)}
                                    </div>
                                ) : (
                                    <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-8 md:p-12 border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}><UserCheck className={`w-12 h-12 md:w-16 md:h-16 mb-4 ${isLight ? 'text-gray-400' : 'text-gray-600'}`} /><h3 className={`text-lg md:text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-2`}>No coaches found</h3></div>
                                )}
                            </div>
                        </div>

                        <div className={activeTab === 'coach-comparison' ? 'block' : 'hidden'}>
                            <div className="space-y-6">
                                <div className={`rounded-2xl p-6 border ${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} shadow-sm`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Coach Comparison</h3>
                                        <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Objective, data-driven evidence for evaluations and bonuses</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className={`text-sm font-medium ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Coach A</label>
                                            <select value={coachA} onChange={(e)=>setCoachA(e.target.value)} className={`mt-1 w-full rounded-xl px-4 py-2.5 border ${isLight ? 'bg-white border-gray-200 text-black' : 'bg-gray-700 border-gray-600 text-white'}`}>
                                                {coaches.map(c => (
                                                    <option key={c.id} value={c.id} style={{ color: '#000' }}>{c.first_name} {c.last_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={`text-sm font-medium ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Coach B</label>
                                            <select value={coachB} onChange={(e)=>setCoachB(e.target.value)} className={`mt-1 w-full rounded-xl px-4 py-2.5 border ${isLight ? 'bg-white border-gray-200 text-black' : 'bg-gray-700 border-gray-600 text-white'}`}>
                                                {coaches.map(c => (
                                                    <option key={c.id} value={c.id} style={{ color: '#000' }}>{c.first_name} {c.last_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-end">
                                            <button onClick={()=>loadCoachComparison(coachA, coachB)} className={`px-4 py-2 rounded-xl ${isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'}`}>Compare</button>
                                        </div>
                                    </div>
                                </div>

                                {coachComparison && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {[coachComparison.coach_a, coachComparison.coach_b].filter(Boolean).map((coach, idx) => (
                                            <div key={idx} className={`rounded-2xl p-6 border ${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} shadow-sm`}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className={`text-md font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{coach.coach_name}</h4>
                                                    <span className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Players: {coach.player_count}</span>
                                                </div>
                                        <div className="grid grid-cols-1 gap-4 mb-4">
                                            <div className={`rounded-xl p-4 ${isLight ? 'bg-blue-50 border border-blue-200' : 'bg-blue-500/10 border border-blue-500/30'}`}>
                                                <div className={`${isLight ? 'text-blue-700' : 'text-blue-400'} text-sm font-medium`}>Avg Rating (6m)</div>
                                                <div className={`text-xl font-bold ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>{coach.avg_rating_6m ?? 'N/A'}</div>
                                            </div>
                                        </div>
                                        <div className={`rounded-xl p-4 ${isLight ? 'bg-purple-50 border border-purple-200' : 'bg-purple-500/10 border border-purple-500/30'}`}>
                                            <div className={`${isLight ? 'text-purple-700' : 'text-purple-400'} text-sm font-medium`}>Avg Coach Rating (6m)</div>
                                            <div className={`text-xl font-bold ${isLight ? 'text-purple-700' : 'text-purple-300'}`}>{coach.avg_coach_rating_6m ?? 'N/A'}</div>
                                        </div>
                                                {coach.monthly_series && coach.monthly_series.length > 0 && (
                                                    <ResponsiveContainer width="100%" height={220}>
                                                        <LineChart data={coach.monthly_series} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                                                            <CartesianGrid stroke={isLight ? '#e5e7eb' : '#374151'} />
                                                            <XAxis dataKey="month" stroke={isLight ? '#6b7280' : '#9ca3af'} tickLine={false} axisLine={{ stroke: isLight ? '#e5e7eb' : '#374151' }} />
                                                            <YAxis stroke={isLight ? '#6b7280' : '#9ca3af'} allowDecimals={false} tickLine={false} axisLine={{ stroke: isLight ? '#e5e7eb' : '#374151' }} />
                                                            <Line type="monotone" dataKey="average_rating" stroke={idx === 0 ? '#3B82F6' : '#F59E0B'} strokeWidth={2} dot={{ r: 3 }} isAnimationActive animationBegin={300} animationDuration={1000} />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                )}
                                                {coach.coach_rating_series && coach.coach_rating_series.length > 0 && (
                                                    <ResponsiveContainer width="100%" height={220}>
                                                        <LineChart data={coach.coach_rating_series} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                                                            <CartesianGrid stroke={isLight ? '#e5e7eb' : '#374151'} />
                                                            <XAxis dataKey="month" stroke={isLight ? '#6b7280' : '#9ca3af'} tickLine={false} axisLine={{ stroke: isLight ? '#e5e7eb' : '#374151' }} />
                                                            <YAxis stroke={isLight ? '#6b7280' : '#9ca3af'} allowDecimals={false} tickLine={false} axisLine={{ stroke: isLight ? '#e5e7eb' : '#374151' }} />
                                                            <Line type="monotone" dataKey="avg_coach_rating" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} isAnimationActive animationBegin={300} animationDuration={1000} />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {coachComparison && (
                                    <div className={`rounded-2xl p-6 border ${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} shadow-sm`}>
                                        <div className="flex items-center justify-start gap-3 mb-4">
                                            <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Coach Leaderboard</h3>
                                            <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'} text-left`}>Ranking based on ratings</span>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-left">
                                                <thead>
                                                    <tr className={`${isLight ? 'text-gray-600' : 'text-gray-300'} text-sm`}>
                                                        <th className="text-left py-2">Rank</th>
                                                        <th className="text-left py-2">Coach</th>
                                                        <th className="text-left py-2">Players</th>
                                                        <th className="text-left py-2">Avg Rating (6m)</th>
                                                        
                                                        <th className="text-left py-2">Avg Coach Rating (6m)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {coachComparison.leaderboard.map((c, i) => (
                                                        <tr key={c.coach_id} className={`${isLight ? 'text-gray-800' : 'text-gray-100'} text-sm`}> 
                                                            <td className="py-2 text-left">{i+1}</td>
                                                            <td className="py-2 text-left">{c.coach_name}</td>
                                                            <td className="py-2 text-left">{c.player_count}</td>
                                                            <td className="py-2 text-left">{c.avg_rating_6m ?? 'N/A'}</td>
                                                            <td className="py-2 text-left">{c.avg_coach_rating_6m ?? 'N/A'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className={activeTab === 'attendance' ? 'block' : 'hidden'}>
                            <AttendanceTracker />
                        </div>
                        
                        <div className={activeTab === 'performance' ? 'block' : 'hidden'}>
                            <PerformanceAnalytics />
                        </div>
                        
                        <div className={activeTab === 'fees' ? 'block' : 'hidden'}>
                            <FeeCollection />
                        </div>
                        
                        <div className={activeTab === 'training' ? 'block' : 'hidden'}>
                            <TrainingPlans />
                        </div>
                        
                        <div className={activeTab === 'analytics' ? 'block' : 'hidden'}>
                            <AdvancedAnalytics />
                        </div>
                        
                        <div className={activeTab === 'profile' ? 'block' : 'hidden'}>
                            <AcademyProfile onLogoUpdated={(url) => setAcademyLogo(url)} />
                        </div>
                        
                        <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
                            <AcademySettings />
                        </div>
                    </div>
                </main>
            </div>

            <PlayerModal isOpen={showPlayerModal} onClose={() => setShowPlayerModal(false)} onSubmit={editingPlayer ? (data) => handleUpdatePlayer(editingPlayer.id, data) : handleCreatePlayer} player={editingPlayer} isEditing={!!editingPlayer} />
            <CoachModal 
                isOpen={showCoachModal} 
                onClose={() => setShowCoachModal(false)} 
                onSubmit={editingCoach ? (data) => handleUpdateCoach(editingCoach.id, data) : handleCreateCoach} 
                coach={editingCoach} 
                isEditing={!!editingCoach}
                onSuccess={handleCoachUpdate}
            />
            <PlayerAssignmentModal
                isOpen={showPlayerAssignmentModal && selectedCoachForAssignment !== null}
                onClose={() => {
                    setShowPlayerAssignmentModal(false);
                    setSelectedCoachForAssignment(null);
                }}
                coach={selectedCoachForAssignment}
                allPlayers={players}
                onAssign={handleAssignPlayers}
            />
        </div>
    );
};
export default AcademyDashboard;
