import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

const AcademySettingsForm = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({
    // Branding Settings
    description: '',
    website: '',
    theme_color: '#0ea5e9',
    social_media: {
      facebook: '',
      twitter: '',
      instagram: '',
      youtube: ''
    },
    
    // Operational Settings
    season_start_date: '',
    season_end_date: '',
    training_days: [],
    training_time: '',
    facility_address: '',
    facility_amenities: [],
    
    // Notification Settings
    email_notifications: true,
    sms_notifications: false,
    parent_notifications: true,
    coach_notifications: true,
    
    // Privacy Settings
    public_profile: false,
    show_player_stats: true,
    show_coach_info: true,
    data_sharing_consent: false
  });

  const [activeSection, setActiveSection] = useState('branding');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const amenityOptions = ['Gym', 'Pool', 'Field', 'Locker Rooms', 'Parking', 'Cafeteria', 'Medical Room', 'Equipment Storage'];

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
        
        // Update form data with loaded settings
        setFormData(prevData => ({
          ...prevData,
          description: data.description || '',
          website: data.website || '',
          theme_color: data.theme_color || '#0ea5e9',
          social_media: {
            facebook: data.social_media?.facebook || '',
            twitter: data.social_media?.twitter || '',
            instagram: data.social_media?.instagram || '',
            youtube: data.social_media?.youtube || ''
          },
          season_start_date: data.season_start_date || '',
          season_end_date: data.season_end_date || '',
          training_days: data.training_days || [],
          training_time: data.training_time || '',
          facility_address: data.facility_address || '',
          facility_amenities: data.facility_amenities || [],
          email_notifications: data.email_notifications !== undefined ? data.email_notifications : true,
          sms_notifications: data.sms_notifications !== undefined ? data.sms_notifications : false,
          parent_notifications: data.parent_notifications !== undefined ? data.parent_notifications : true,
          coach_notifications: data.coach_notifications !== undefined ? data.coach_notifications : true,
          public_profile: data.public_profile !== undefined ? data.public_profile : false,
          show_player_stats: data.show_player_stats !== undefined ? data.show_player_stats : true,
          show_coach_info: data.show_coach_info !== undefined ? data.show_coach_info : true,
          data_sharing_consent: data.data_sharing_consent !== undefined ? data.data_sharing_consent : false
        }));

        // Set logo preview if exists
        if (data.logo_url) {
          setLogoPreview(`${API_BASE_URL}${data.logo_url}`);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prevData => ({
        ...prevData,
        [parent]: {
          ...prevData[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        [field]: value
      }));
    }
  };

  const handleArrayToggle = (field, item) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: prevData[field].includes(item) 
        ? prevData[field].filter(i => i !== item)
        : [...prevData[field], item]
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return;

    try {
      const formData = new FormData();
      formData.append('file', logoFile);

      const response = await fetch(`${API_BASE_URL}/api/academy/logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
        setLogoPreview(`${API_BASE_URL}${result.logo_url}`);
        setLogoFile(null);
        return result.logo_url;
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.detail || 'Failed to upload logo' });
        return null;
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage({ type: 'error', text: 'Failed to upload logo' });
      return null;
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      // Upload logo first if there's a new one
      if (logoFile) {
        await uploadLogo();
      }

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

  const SectionButton = ({ id, label, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`px-4 py-2 rounded-none font-medium transition-all duration-300 ${
        active
          ? 'bg-sky-500 text-white shadow-lg'
          : 'text-gray-400 hover:text-white hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-none h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Academy Settings</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30 px-6 py-2 rounded-none transition-all duration-300 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-none ${
          message.type === 'success' 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {message.text}
        </div>
      )}

      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        <SectionButton
          id="branding"
          label="Branding"
          active={activeSection === 'branding'}
          onClick={setActiveSection}
        />
        <SectionButton
          id="operational"
          label="Operational"
          active={activeSection === 'operational'}
          onClick={setActiveSection}
        />
        <SectionButton
          id="notifications"
          label="Notifications"
          active={activeSection === 'notifications'}
          onClick={setActiveSection}
        />
        <SectionButton
          id="privacy"
          label="Privacy"
          active={activeSection === 'privacy'}
          onClick={setActiveSection}
        />
      </div>

      {/* Branding Section */}
      {activeSection === 'branding' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-300 mb-4">Branding & Identity</h3>
          
          {/* Logo Upload */}
          <div className="bg-white/5 backdrop-blur-md rounded-none p-4 border border-white/10">
            <label className="block text-sm font-medium text-gray-300 mb-2">Academy Logo</label>
            <div className="flex items-center space-x-4">
              {logoPreview && (
                <img 
                  src={logoPreview} 
                  alt="Logo preview" 
                  className="w-16 h-16 object-cover rounded-none border border-white/10"
                />
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-semibold file:bg-sky-500/20 file:text-sky-400 hover:file:bg-sky-500/30"
                />
                <p className="mt-1 text-sm text-gray-500">PNG, JPG up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white/5 backdrop-blur-md rounded-none p-4 border border-white/10">
            <label className="block text-sm font-medium text-gray-300 mb-2">Academy Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your academy's mission and values"
              rows="3"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-none text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          {/* Website */}
          <div className="bg-white/5 backdrop-blur-md rounded-none p-4 border border-white/10">
            <label className="block text-sm font-medium text-gray-300 mb-2">Website URL</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://youracademy.com"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-none text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          {/* Theme Color */}
          <div className="bg-white/5 backdrop-blur-md rounded-none p-4 border border-white/10">
            <label className="block text-sm font-medium text-gray-300 mb-2">Theme Color</label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={formData.theme_color}
                onChange={(e) => handleInputChange('theme_color', e.target.value)}
                className="w-12 h-12 rounded-none border border-white/10 bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={formData.theme_color}
                onChange={(e) => handleInputChange('theme_color', e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-none text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-white/5 backdrop-blur-md rounded-none p-4 border border-white/10">
            <label className="block text-sm font-medium text-gray-300 mb-3">Social Media Links</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(formData.social_media).map((platform) => (
                <div key={platform}>
                  <label className="block text-sm text-gray-400 mb-1 capitalize">{platform}</label>
                  <input
                    type="url"
                    value={formData.social_media[platform]}
                    onChange={(e) => handleInputChange(`social_media.${platform}`, e.target.value)}
                    placeholder={`https://${platform}.com/youracademy`}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-none text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Operational Section */}
      {activeSection === 'operational' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-300 mb-4">Operational Settings</h3>
          
          {/* Season Dates */}
          <div className="bg-white/5 backdrop-blur-md rounded-none p-4 border border-white/10">
            <label className="block text-sm font-medium text-gray-300 mb-3">Season Period</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.season_start_date}
                  onChange={(e) => handleInputChange('season_start_date', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-none text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.season_end_date}
                  onChange={(e) => handleInputChange('season_end_date', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-none text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Training Schedule */}
          <div className="bg-white/5 backdrop-blur-md rounded-none p-4 border border-white/10">
            <label className="block text-sm font-medium text-gray-300 mb-3">Training Schedule</label>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Training Days</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {daysOfWeek.map((day) => (
                  <label key={day} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.training_days.includes(day)}
                      onChange={() => handleArrayToggle('training_days', day)}
                      className="rounded-none bg-white/5 border-white/10 text-sky-500 focus:ring-sky-500 focus:ring-offset-0"
                    />
                    <span className="text-gray-300 text-sm">{day.slice(0, 3)}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Training Time</label>
              <input
                type="text"
                value={formData.training_time}
                onChange={(e) => handleInputChange('training_time', e.target.value)}
                placeholder="e.g., 6:00 PM - 8:00 PM"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-none text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Facility Information */}
          <div className="bg-white/5 backdrop-blur-md rounded-none p-4 border border-white/10">
            <label className="block text-sm font-medium text-gray-300 mb-3">Facility Information</label>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Facility Address</label>
              <textarea
                value={formData.facility_address}
                onChange={(e) => handleInputChange('facility_address', e.target.value)}
                placeholder="123 Sports Complex Drive, Athletic City, AC 12345"
                rows="2"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-none text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Available Amenities</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {amenityOptions.map((amenity) => (
                  <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.facility_amenities.includes(amenity)}
                      onChange={() => handleArrayToggle('facility_amenities', amenity)}
                      className="rounded-none bg-white/5 border-white/10 text-sky-500 focus:ring-sky-500 focus:ring-offset-0"
                    />
                    <span className="text-gray-300 text-sm">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Section */}
      {activeSection === 'notifications' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-300 mb-4">Notification Preferences</h3>
          
          <div className="bg-white/5 backdrop-blur-md rounded-none p-4 border border-white/10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Email Notifications</label>
                  <p className="text-gray-400 text-sm">Receive important updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.email_notifications}
                    onChange={(e) => handleInputChange('email_notifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-800 rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">SMS Notifications</label>
                  <p className="text-gray-400 text-sm">Receive urgent alerts via text message</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.sms_notifications}
                    onChange={(e) => handleInputChange('sms_notifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-800 rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Parent Notifications</label>
                  <p className="text-gray-400 text-sm">Send notifications to parents about their children</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.parent_notifications}
                    onChange={(e) => handleInputChange('parent_notifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-800 rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Coach Notifications</label>
                  <p className="text-gray-400 text-sm">Send notifications to coaches about updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.coach_notifications}
                    onChange={(e) => handleInputChange('coach_notifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-800 rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Section */}
      {activeSection === 'privacy' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-300 mb-4">Privacy & Security</h3>
          
          <div className="bg-white/5 backdrop-blur-md rounded-none p-4 border border-white/10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Public Profile</label>
                  <p className="text-gray-400 text-sm">Make academy profile visible to public</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.public_profile}
                    onChange={(e) => handleInputChange('public_profile', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-800 rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Show Player Stats</label>
                  <p className="text-gray-400 text-sm">Display player statistics in public profile</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.show_player_stats}
                    onChange={(e) => handleInputChange('show_player_stats', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-800 rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Show Coach Information</label>
                  <p className="text-gray-400 text-sm">Display coach profiles in public profile</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.show_coach_info}
                    onChange={(e) => handleInputChange('show_coach_info', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-800 rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Data Sharing Consent</label>
                  <p className="text-gray-400 text-sm">Allow sharing anonymized data for research</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.data_sharing_consent}
                    onChange={(e) => handleInputChange('data_sharing_consent', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-800 rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademySettingsForm;
