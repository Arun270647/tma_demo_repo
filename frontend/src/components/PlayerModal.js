import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parseISO } from 'date-fns';
import axios from 'axios';
import { supabase } from '../supabaseClient.js';

const defaultAvatar = 'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg';

const FormInput = (props) => (
  <input
    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-200 disabled:cursor-not-allowed"
    {...props}
  />
);
const FormSelect = ({ children, ...props }) => (
  <select
    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
    {...props}
  >
    {children}
  </select>
);
const FormLabel = ({ children, ...props }) => (
  <label className="block text-sm font-medium text-gray-600 mb-1" {...props}>
    {children}
  </label>
);


const PlayerModal = ({ isOpen, onClose, onSubmit, player = null, isEditing = false }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    age: '',
    gender: '',
    sport: '',
    position: '',
    registration_number: '',
    photo_url: '',
    training_days: [],
    training_batch: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_notes: '',
    status: 'active',
    coach_id: ''  // Add coach_id field
  });

  const [photoPreview, setPhotoPreview] = useState(defaultAvatar);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sportConfig, setSportConfig] = useState({
    sports: {},
    performance_categories: {},
    individual_sports: [],
    team_sports: []
  });
  const [availableCoaches, setAvailableCoaches] = useState([]);
  const [loadingCoaches, setLoadingCoaches] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  const genderOptions = ['Male', 'Female', 'Other'];
  const [sportsOptions, setSportsOptions] = useState([]);

  useEffect(() => {
    const loadSportConfig = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/sports/config`);
        if (response.ok) {
          const config = await response.json();
          setSportConfig(config);
          setSportsOptions(Object.keys(config.sports));
        }
      } catch (error) {
        console.error('Error loading sport configuration:', error);
      }
    };
    if (isOpen) {
      loadSportConfig();
    }
  }, [isOpen]);

  useEffect(() => {
    const initialData = {
      first_name: '', last_name: '', email: '', phone: '',
      date_of_birth: '', age: '', gender: '', sport: '', position: '',
      registration_number: '', photo_url: '', training_days: [],
      training_batch: '', emergency_contact_name: '', emergency_contact_phone: '',
      medical_notes: '', status: 'active'
    };

    if (isOpen && isEditing && player) {
      const playerFormData = {};
      for (const key in initialData) {
        playerFormData[key] = player[key] || initialData[key];
      }
      setFormData(playerFormData);
      // Handle both base64 and URL
      if (player.photo_url) {
        setPhotoPreview(player.photo_url.startsWith('data:') ? player.photo_url : `${process.env.REACT_APP_BACKEND_URL}${player.photo_url}`);
      } else {
        setPhotoPreview(defaultAvatar);
      }
    } else {
      setFormData(initialData);
      setPhotoPreview(defaultAvatar);
    }
  }, [isOpen, isEditing, player]);

    useEffect(() => {
        if (formData.date_of_birth) {
          try {
            const birthDate = parseISO(formData.date_of_birth);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
        
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
        
            if (age >= 0 && age <= 100) {
              setFormData(prev => ({ ...prev, age: age.toString() }));
            }
          } catch (error) {
            setFormData(prev => ({ ...prev, age: '' }));
          }
        }
      }, [formData.date_of_birth]);

  // Fetch coaches when sport is selected
  useEffect(() => {
    const fetchCoachesForSport = async () => {
      if (formData.sport) {
        setLoadingCoaches(true);
        try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          const response = await fetch(`${API_BASE_URL}/api/coaches/by-sport?sport=${encodeURIComponent(formData.sport)}`, {
            headers: { 
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setAvailableCoaches(data);
            
            // Auto-assign coach if only one coach handles this sport (only for new players)
            if (!isEditing && data.length === 1) {
              setFormData(prev => ({ ...prev, coach_id: data[0].id }));
            }
          } else {
            setAvailableCoaches([]);
          }
        } catch (error) {
          console.error('Error fetching coaches:', error);
          setAvailableCoaches([]);
        } finally {
          setLoadingCoaches(false);
        }
      } else {
        setAvailableCoaches([]);
        setFormData(prev => ({ ...prev, coach_id: '' }));
      }
    };

    fetchCoachesForSport();
  }, [formData.sport, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'sport') {
      setFormData(prev => ({ ...prev, position: '' }));
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, date_of_birth: date ? format(date, 'yyyy-MM-dd') : '' }));
  };

  const handleCheckboxChange = (day) => {
    setFormData(prev => {
      const newTrainingDays = prev.training_days.includes(day)
        ? prev.training_days.filter(d => d !== day)
        : [...prev.training_days, day];
      return { ...prev, training_days: newTrainingDays };
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      alert('Only JPG, JPEG, PNG, and HEIC formats are allowed.');
      return;
    }

    // Validate file size (500KB = 500 * 1024 bytes)
    const maxSize = 500 * 1024;
    if (file.size > maxSize) {
      alert('Photo size must be less than 500KB. Please choose a smaller file.');
      return;
    }

    setIsUploading(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormData(prev => ({ ...prev, photo_url: base64String }));
        setPhotoPreview(base64String);
        setIsUploading(false);
      };
      reader.onerror = () => {
        alert('Failed to read photo. Please try again.');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
      setIsUploading(false);
    }
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = { ...formData };
    
    // Convert age to a number or null, as the backend expects an integer.
    payload.age = payload.age ? parseInt(payload.age, 10) : null;
    if (isNaN(payload.age)) {
        payload.age = null;
    }

    try {
      // Always pass only the payload - the wrapper function in parent handles the ID for updates
      await onSubmit(payload);
    } catch (error) {
      console.error('Error submitting player form:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPositionOptions = () => sportConfig.sports[formData.sport] || [];
  const isIndividualSport = () => sportConfig.individual_sports.includes(formData.sport);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">{isEditing ? 'Edit Player Details' : 'Add New Player'}</h2>
          <button 
            onClick={onClose} 
            disabled={loading}
            className="text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8 max-h-[calc(90vh-120px)] overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
              <div className="md:col-span-1 flex flex-col items-center justify-center space-y-2 pt-4">
                <img src={photoPreview} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-gray-200" />
                <input type="file" id="photo-upload" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                <label htmlFor="photo-upload" className="cursor-pointer text-sm font-semibold text-blue-600 hover:text-blue-700 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                  {isUploading ? 'Uploading...' : 'Upload Photo'}
                </label>
                {isUploading && <p className="text-xs text-gray-500">Please wait...</p>}
              </div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <FormLabel htmlFor="first_name">First Name *</FormLabel>
                  <FormInput type="text" name="first_name" id="first_name" value={formData.first_name} onChange={handleChange} required />
                </div>
                <div>
                  <FormLabel htmlFor="last_name">Last Name *</FormLabel>
                  <FormInput type="text" name="last_name" id="last_name" value={formData.last_name} onChange={handleChange} required />
                </div>
                <div>
                  <FormLabel htmlFor="email">Email Address</FormLabel>
                  <FormInput type="email" name="email" id="email" value={formData.email} onChange={handleChange} />
                </div>
                <div>
                  <FormLabel htmlFor="phone">Phone Number</FormLabel>
                  <FormInput type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} />
                </div>
                
                <div className="mb-2">
                  <FormLabel htmlFor="date_of_birth">Date of Birth</FormLabel>
                  <DatePicker 
                    id="date_of_birth" 
                    selected={formData.date_of_birth ? parseISO(formData.date_of_birth) : null} 
                    onChange={handleDateChange} 
                    dateFormat="yyyy-MM-dd" 
                    placeholderText="YYYY-MM-DD" 
                    showMonthDropdown 
                    showYearDropdown 
                    dropdownMode="select" 
                    yearDropdownItemNumber={70} 
                    scrollableYearDropdown
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <FormLabel htmlFor="age">Age {formData.date_of_birth && <span className="text-sm text-blue-500">(Auto)</span>}</FormLabel>
                  <FormInput type="number" name="age" id="age" value={formData.age} readOnly disabled />
                </div>
                <div className="md:col-span-2">
                  <FormLabel htmlFor="gender">Gender *</FormLabel>
                  <FormSelect name="gender" id="gender" value={formData.gender} onChange={handleChange} required>
                    <option value="">Select Gender</option>
                    {genderOptions.map(g => <option key={g} value={g}>{g}</option>)}
                  </FormSelect>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Sports Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <FormLabel htmlFor="sport">Sport *</FormLabel>
                <FormSelect name="sport" id="sport" value={formData.sport} onChange={handleChange} required>
                  <option value="">Select Sport</option>
                  {sportsOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
              </div>

              {/* Assign Coach Dropdown */}
              <div>
                <FormLabel htmlFor="coach_id">
                  Assign Coach {formData.sport && '(Optional)'}
                </FormLabel>
                <FormSelect 
                  name="coach_id" 
                  id="coach_id" 
                  value={formData.coach_id} 
                  onChange={handleChange}
                  disabled={!formData.sport || loadingCoaches}
                >
                  <option value="">
                    {!formData.sport 
                      ? 'Select sport first' 
                      : loadingCoaches 
                        ? 'Loading coaches...' 
                        : availableCoaches.length === 0 
                          ? 'No coaches available for this sport'
                          : 'Select Coach (Optional)'}
                  </option>
                  {availableCoaches.map(coach => (
                    <option key={coach.id} value={coach.id}>
                      {coach.name} {coach.specialization && `- ${coach.specialization}`}
                    </option>
                  ))}
                </FormSelect>
                {formData.sport && availableCoaches.length === 0 && !loadingCoaches && (
                  <p className="text-xs text-yellow-600 mt-1">
                    ⚠️ No coaches assigned to {formData.sport} yet
                  </p>
                )}
              </div>

              {formData.sport && !isIndividualSport() && (
                <div>
                  <FormLabel htmlFor="position">Position</FormLabel>
                  <FormSelect name="position" id="position" value={formData.position} onChange={handleChange}>
                    <option value="">Select Position</option>
                    {getPositionOptions().map(p => <option key={p} value={p}>{p}</option>)}
                  </FormSelect>
                </div>
              )}
              {formData.sport && isIndividualSport() && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3 text-sm flex items-center h-fit mt-6">
                    📌 <strong>{formData.sport}</strong> is an individual sport.
                  </div>
              )}
               <div>
                <FormLabel htmlFor="registration_number">Registration Number</FormLabel>
                <FormInput type="text" name="registration_number" id="registration_number" value={formData.registration_number} onChange={handleChange} placeholder="e.g., REG001" />
              </div>
               <div>
                <FormLabel htmlFor="training_batch">Training Batch</FormLabel>
                  <FormSelect name="training_batch" id="training_batch" value={formData.training_batch} onChange={handleChange}>
                    <option value="">Select Batch</option>
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Both">Both</option>
                  </FormSelect>
              </div>
              <div className="md:col-span-2">
                  <FormLabel>Training Days</FormLabel>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                          <label key={day} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition">
                              <input type="checkbox" checked={formData.training_days.includes(day)} onChange={() => handleCheckboxChange(day)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                              <span className="text-gray-700 text-sm">{day}</span>
                          </label>
                      ))}
                  </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Emergency & Medical</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
               <div>
                <FormLabel htmlFor="emergency_contact_name">Emergency Contact Name</FormLabel>
                <FormInput type="text" name="emergency_contact_name" id="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} />
              </div>
              <div>
                <FormLabel htmlFor="emergency_contact_phone">Emergency Contact Phone</FormLabel>
                <FormInput type="tel" name="emergency_contact_phone" id="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleChange} />
              </div>
               <div className="md:col-span-2">
                <FormLabel htmlFor="medical_notes">Medical Notes</FormLabel>
                <textarea
                  name="medical_notes" id="medical_notes" value={formData.medical_notes} onChange={handleChange}
                  rows="3" placeholder="Any medical conditions, allergies, or special notes..."
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-y"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end items-center gap-4 pt-4 border-t border-gray-200">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading}
              className="px-6 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || isUploading} 
              className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {loading ? 'Saving...' : (isEditing ? 'Update Player' : 'Create Player')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlayerModal;
