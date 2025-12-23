import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Award, Save, Upload, Trash2 } from 'lucide-react';

const CoachProfile = () => {
  const { token, signOut } = useAuth();
  const { isLight } = useTheme();
  const navigate = useNavigate();
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    profile_picture_url: '',
    description: ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadCoachProfile();

    // Poll for profile updates every 30 seconds to sync changes made by academy
    const profilePollingInterval = setInterval(() => {
      loadCoachProfile();
    }, 30000); // 30 seconds

    return () => {
      clearInterval(profilePollingInterval);
    };
  }, []);

  const loadCoachProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/coach/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCoach(data.coach);
        setFormData({
          profile_picture_url: data.coach.profile_picture_url || '',
          description: data.coach.description || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage('');
      setError('');

      const response = await fetch(`${API_BASE_URL}/api/coach/profile?profile_picture_url=${encodeURIComponent(formData.profile_picture_url)}&description=${encodeURIComponent(formData.description)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setMessage('✅ Profile updated successfully!');
      setTimeout(() => {
        setMessage('');
        loadCoachProfile();
      }, 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('❌ Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    try {
      setChangingPassword(true);

      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          new_password: newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to change password');
      }

      const result = await response.json();
      setPasswordMessage(`✅ ${result.message || 'Password changed successfully! You can now use your new password to log in.'}`);
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        setPasswordMessage('');
      }, 5000);
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError(`❌ ${error.message}`);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isLight ? 'bg-gray-50' : 'bg-gray-900'}`}>
        <div className={`animate-spin rounded-full h-16 w-16 border-4 ${isLight ? 'border-gray-300 border-t-blue-600' : 'border-gray-800 border-t-cyan-400'}`}></div>
      </div>
    );
  }

  if (!coach) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isLight ? 'bg-gray-50' : 'bg-gray-900'}`}>
        <p className={`text-lg ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isLight ? 'bg-gray-50' : 'bg-gray-900'} p-4 sm:p-6`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-cyan-500/30'} rounded-2xl p-6 shadow-sm`}>
          <h1 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} flex items-center gap-3`}>
            <User className={`w-6 h-6 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
            Coach Profile
          </h1>
          <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mt-1`}>
            Manage your personal information and profile settings
          </p>
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

        {/* Profile Information (Read-only) */}
        <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-cyan-500/30'} rounded-2xl p-6 shadow-sm`}>
          <h2 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>
            Basic Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                Full Name
              </label>
              <div className={`px-4 py-3 rounded-xl border ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-900 border-cyan-500/30 text-white'}`}>
                {coach.name}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                Email
              </label>
              <div className={`px-4 py-3 rounded-xl border flex items-center gap-2 ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-900 border-cyan-500/30 text-white'}`}>
                <Mail className="w-4 h-4" />
                {coach.email || 'Not provided'}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                Specialization
              </label>
              <div className={`px-4 py-3 rounded-xl border flex items-center gap-2 ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-900 border-cyan-500/30 text-white'}`}>
                <Award className="w-4 h-4" />
                {coach.specialization || 'Not specified'}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                Sports Handled
              </label>
              <div className={`px-4 py-3 rounded-xl border ${isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-900 border-cyan-500/30 text-white'}`}>
                {coach.sports && coach.sports.length > 0 ? coach.sports.join(', ') : 'None assigned'}
              </div>
            </div>
          </div>
        </div>

        {/* Editable Profile Settings */}
        <form onSubmit={handleSubmit} className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-cyan-500/30'} rounded-2xl p-6 shadow-sm`}>
          <h2 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>
            Profile Settings
          </h2>

          <div className="space-y-6">
            {/* Profile Picture URL */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                Profile Picture URL
              </label>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="url"
                  value={formData.profile_picture_url}
                  onChange={(e) => setFormData({ ...formData, profile_picture_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className={`flex-1 px-4 py-3 rounded-xl border transition-all duration-200 ${isLight ? 'border-gray-200 bg-white text-gray-900 focus:border-blue-500' : 'border-cyan-500/30 bg-gray-900 text-white focus:border-cyan-400'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                />
                {formData.profile_picture_url && (
                  <img 
                    src={formData.profile_picture_url} 
                    alt="Profile Preview" 
                    className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                )}
              </div>
              <p className={`text-xs mt-2 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                Enter a URL to your profile picture (e.g., from Google Drive, Imgur, etc.)
              </p>
            </div>

            {/* Description/Bio */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                Bio / Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="4"
                placeholder="Tell students about yourself, your coaching philosophy, achievements..."
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isLight ? 'border-gray-200 bg-white text-gray-900 focus:border-blue-500' : 'border-cyan-500/30 bg-gray-900 text-white focus:border-cyan-400'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
              <p className={`text-xs mt-2 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                This will be displayed on your profile and dashboard
              </p>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 ${
                isLight 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50' 
                  : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 disabled:opacity-50'
              } disabled:cursor-not-allowed font-medium`}
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving Profile...' : 'Save Profile'}
            </button>
          </div>
        </form>

        {/* Password Change Section */}
        <form onSubmit={handlePasswordChange} className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-cyan-500/30'} rounded-2xl p-6 shadow-sm`}>
          <h2 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>
            Change Password
          </h2>
          
          {passwordMessage && (
            <div className={`mb-4 p-4 rounded-xl ${isLight ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-green-500/10 border border-green-500/30 text-green-400'}`}>
              {passwordMessage}
            </div>
          )}

          {passwordError && (
            <div className={`mb-4 p-4 rounded-xl ${isLight ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
              {passwordError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isLight ? 'border-gray-200 bg-white text-gray-900 focus:border-blue-500' : 'border-cyan-500/30 bg-gray-900 text-white focus:border-cyan-400'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                minLength="6"
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${isLight ? 'border-gray-200 bg-white text-gray-900 focus:border-blue-500' : 'border-cyan-500/30 bg-gray-900 text-white focus:border-cyan-400'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                minLength="6"
                required
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 ${
                isLight 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50' 
                  : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 disabled:opacity-50'
              } disabled:cursor-not-allowed font-medium`}
            >
              <Save className="w-5 h-5" />
              {changingPassword ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>

          <p className={`text-xs mt-4 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
            Password must be at least 6 characters long. After changing, you'll use the new password to log in.
          </p>
        </form>
      </div>
    </div>
  );
};

export default CoachProfile;
