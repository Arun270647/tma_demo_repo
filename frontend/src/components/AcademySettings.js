import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Settings, Calendar, Clock, Bell, Shield, 
  Save, AlertCircle, CheckCircle, Globe, Users, Monitor
} from 'lucide-react';

const AcademySettings = () => {
  const { token } = useAuth();
  const { isLight } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({
    // Operational Settings
    season_start_date: '',
    season_end_date: '',
    training_days: [],
    training_time: '',
    
    // Notification Settings
    email_notifications: true,
    sms_notifications: false,
    parent_notifications: true,
    coach_notifications: true,
    
    // Privacy Settings
    public_profile: false,
    show_player_stats: true,
    show_coach_info: true,
    data_sharing_consent: false,
    
    // System Settings
    auto_backup: true,
    maintenance_mode: false,
    api_access: true,
    fee_reminder_type: 'manual'  // 'manual' or 'automatic'
  });

  const [message, setMessage] = useState({ type: '', text: '' });

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/academy/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        
        setFormData(prevData => ({
          ...prevData,
          season_start_date: data.season_start_date || '',
          season_end_date: data.season_end_date || '',
          training_days: data.training_days || [],
          training_time: data.training_time || '',
          email_notifications: data.email_notifications !== undefined ? data.email_notifications : true,
          sms_notifications: data.sms_notifications !== undefined ? data.sms_notifications : false,
          parent_notifications: data.parent_notifications !== undefined ? data.parent_notifications : true,
          coach_notifications: data.coach_notifications !== undefined ? data.coach_notifications : true,
          public_profile: data.public_profile !== undefined ? data.public_profile : false,
          show_player_stats: data.show_player_stats !== undefined ? data.show_player_stats : true,
          show_coach_info: data.show_coach_info !== undefined ? data.show_coach_info : true,
          data_sharing_consent: data.data_sharing_consent !== undefined ? data.data_sharing_consent : false,
          auto_backup: data.auto_backup !== undefined ? data.auto_backup : true,
          maintenance_mode: data.maintenance_mode !== undefined ? data.maintenance_mode : false,
          api_access: data.api_access !== undefined ? data.api_access : true
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  const handleArrayToggle = (field, item) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: prevData[field].includes(item) 
        ? prevData[field].filter(i => i !== item)
        : [...prevData[field], item]
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      const response = await fetch(`${API_BASE_URL}/api/academy/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedSettings = await response.json();
        setSettings(updatedSettings);
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.detail || 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const ToggleSwitch = ({ checked, onChange, disabled = false }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <div className={`w-11 h-6 rounded-full peer transition-all duration-300 ${
        isLight 
          ? checked 
            ? 'bg-blue-600' 
            : 'bg-gray-300'
          : checked 
            ? 'bg-cyan-500 shadow-cyan-500/30 shadow-lg' 
            : 'bg-gray-700'
      } peer-focus:outline-none peer-focus:ring-4 ${
        isLight ? 'peer-focus:ring-blue-300' : 'peer-focus:ring-cyan-800'
      } peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}></div>
    </label>
  );

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isLight ? 'bg-gray-50' : 'bg-black'}`}>
        <div className="flex flex-col items-center space-y-4">
          <div className={`animate-spin rounded-full h-12 w-12 border-4 ${
            isLight ? 'border-gray-300 border-t-blue-600' : 'border-gray-800 border-t-cyan-400'
          }`}></div>
          <p className={`${isLight ? 'text-gray-600' : 'text-cyan-400'}`}>Loading academy settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${isLight ? 'bg-gray-50' : 'bg-gray-900'} min-h-screen`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} flex items-center gap-3`}>
            <Settings className={`w-8 h-8 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
            Academy Settings
          </h2>
          <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mt-2 text-lg`}>
            Configure operational, notification, and privacy settings for your academy
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 shadow-md ${
            isLight 
              ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50' 
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-50'
          } disabled:cursor-not-allowed`}
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Messages */}
      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' 
            ? isLight ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-green-500/10 border border-green-500/30 text-green-400'
            : isLight ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {message.type === 'success' ? 
            <CheckCircle className="w-5 h-5" /> : 
            <AlertCircle className="w-5 h-5" />
          }
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Operational Settings */}
        <div className={`${
          isLight ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-gray-700'
        } rounded-2xl p-8 shadow-lg space-y-6`}>
          <div className="flex items-center gap-3 mb-6">
            <Calendar className={`w-6 h-6 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
            <h3 className={`text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Operational Settings
            </h3>
          </div>
          
          {/* Season Dates */}
          <div className="space-y-4">
            <h4 className={`font-medium ${isLight ? 'text-gray-800' : 'text-gray-200'}`}>Season Period</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.season_start_date}
                  onChange={(e) => handleInputChange('season_start_date', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                    isLight 
                      ? 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500' 
                      : 'border-gray-700 bg-gray-900 text-white focus:border-cyan-400'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.season_end_date}
                  onChange={(e) => handleInputChange('season_end_date', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                    isLight 
                      ? 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500' 
                      : 'border-gray-700 bg-gray-900 text-white focus:border-cyan-400'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                />
              </div>
            </div>
          </div>

          {/* Training Schedule */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className={`w-5 h-5 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
              <h4 className={`font-medium ${isLight ? 'text-gray-800' : 'text-gray-200'}`}>Training Schedule</h4>
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-3 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                Training Days
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {daysOfWeek.map((day) => (
                  <label key={day} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.training_days.includes(day)}
                      onChange={() => handleArrayToggle('training_days', day)}
                      className={`w-4 h-4 rounded border-2 transition-all duration-200 ${
                        isLight
                          ? 'text-blue-600 focus:ring-blue-500 border-gray-300'
                          : 'text-cyan-400 focus:ring-cyan-400 bg-gray-800 border-cyan-500/30'
                      }`}
                    />
                    <span className={`text-sm ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                      {day.slice(0, 3)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                Training Time
              </label>
              <input
                type="text"
                value={formData.training_time}
                onChange={(e) => handleInputChange('training_time', e.target.value)}
                placeholder="e.g., 6:00 PM - 8:00 PM"
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                  isLight 
                    ? 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500' 
                    : 'border-gray-700 bg-gray-900 text-white focus:border-cyan-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className={`${
          isLight ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-gray-700'
        } rounded-2xl p-8 shadow-lg space-y-6`}>
          <div className="flex items-center gap-3 mb-6">
            <Bell className={`w-6 h-6 ${isLight ? 'text-green-600' : 'text-green-400'}`} />
            <h3 className={`text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Notification Preferences
            </h3>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="text-left">
                <label className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  Email Notifications
                </label>
                <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                  Receive important updates via email
                </p>
              </div>
              <ToggleSwitch
                checked={formData.email_notifications}
                onChange={(checked) => handleInputChange('email_notifications', checked)}
              />
            </div>

            <div className="flex items-start justify-between">
              <div className="text-left">
                <label className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  SMS Notifications
                </label>
                <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                  Receive urgent alerts via text message
                </p>
              </div>
              <ToggleSwitch
                checked={formData.sms_notifications}
                onChange={(checked) => handleInputChange('sms_notifications', checked)}
              />
            </div>

            <div className="flex items-start justify-between">
              <div className="text-left">
                <label className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  Parent Notifications
                </label>
                <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                  Send notifications to parents about their children
                </p>
              </div>
              <ToggleSwitch
                checked={formData.parent_notifications}
                onChange={(checked) => handleInputChange('parent_notifications', checked)}
              />
            </div>

            <div className="flex items-start justify-between">
              <div className="text-left">
                <label className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  Coach Notifications
                </label>
                <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                  Send notifications to coaches about updates
                </p>
              </div>
              <ToggleSwitch
                checked={formData.coach_notifications}
                onChange={(checked) => handleInputChange('coach_notifications', checked)}
              />
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className={`${
          isLight ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-gray-700'
        } rounded-2xl p-8 shadow-lg space-y-6`}>
          <div className="flex items-center gap-3 mb-6">
            <Shield className={`w-6 h-6 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
            <h3 className={`text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Privacy & Security Settings
            </h3>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="text-left">
                <label className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  Public Profile
                </label>
                <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                  Make academy profile visible to public
                </p>
              </div>
              <ToggleSwitch
                checked={formData.public_profile}
                onChange={(checked) => handleInputChange('public_profile', checked)}
              />
            </div>

            <div className="flex items-start justify-between">
              <div className="text-left">
                <label className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  Show Player Stats
                </label>
                <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                  Display player statistics in public profile
                </p>
              </div>
              <ToggleSwitch
                checked={formData.show_player_stats}
                onChange={(checked) => handleInputChange('show_player_stats', checked)}
              />
            </div>

            <div className="flex items-start justify-between">
              <div className="text-left">
                <label className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  Show Coach Information
                </label>
                <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                  Display coach profiles in public profile
                </p>
              </div>
              <ToggleSwitch
                checked={formData.show_coach_info}
                onChange={(checked) => handleInputChange('show_coach_info', checked)}
              />
            </div>

            <div className="flex items-start justify-between">
              <div className="text-left">
                <label className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  Data Sharing Consent
                </label>
                <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                  Allow sharing anonymized data for research
                </p>
              </div>
              <ToggleSwitch
                checked={formData.data_sharing_consent}
                onChange={(checked) => handleInputChange('data_sharing_consent', checked)}
              />
            </div>
          </div>

        </div>

        {/* System Settings */}
        <div className={`${
          isLight ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-gray-700'
        } rounded-2xl p-8 shadow-lg space-y-6`}>
          <div className="flex items-center gap-3 mb-6">
            <Monitor className={`w-6 h-6 ${isLight ? 'text-orange-600' : 'text-orange-400'}`} />
            <h3 className={`text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              System Settings
            </h3>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="text-left">
                <label className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  Auto Backup
                </label>
                <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                  Automatically backup academy data weekly
                </p>
              </div>
              <ToggleSwitch
                checked={formData.auto_backup}
                onChange={(checked) => handleInputChange('auto_backup', checked)}
              />
            </div>

            <div className="flex items-start justify-between">
              <div className="text-left">
                <label className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  API Access
                </label>
                <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                  Allow third-party integrations access to academy data
                </p>
              </div>
              <ToggleSwitch
                checked={formData.api_access}
                onChange={(checked) => handleInputChange('api_access', checked)}
              />
            </div>

            <div className="flex items-start justify-between">
              <div className="text-left">
                <label className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  Maintenance Mode
                </label>
                <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                  Temporarily disable academy access for maintenance
                </p>
              </div>
              <ToggleSwitch
                checked={formData.maintenance_mode}
                onChange={(checked) => handleInputChange('maintenance_mode', checked)}
              />
            </div>

            <div className="flex items-start justify-between">
              <div className="text-left flex-1">
                <label className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  Fee Reminder Type
                </label>
                <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'} mb-2`}>
                  Choose how fee reminders are sent to students
                </p>
                <select
                  value={formData.fee_reminder_type}
                  onChange={(e) => handleInputChange('fee_reminder_type', e.target.value)}
                  className={`mt-2 px-4 py-2 rounded-lg border ${
                    isLight
                      ? 'bg-white border-gray-300 text-gray-900'
                      : 'bg-gray-700 border-gray-600 text-white'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="manual">Manual - Send reminders manually</option>
                  <option value="automatic">Automatic - Send reminders automatically</option>
                </select>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AcademySettings;
