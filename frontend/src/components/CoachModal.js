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

const CoachModal = ({ isOpen, onClose, onSubmit, coach = null, isEditing = false, onSuccess }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    sports: [],
    specialization: '',
    experience_years: '',
    qualifications: '',
    salary: '',
    hire_date: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    bio: '',
    photo_url: '',
    status: 'active'
  });

  const [photoPreview, setPhotoPreview] = useState(defaultAvatar);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sports options
  const sportsOptions = [
    'Football',
    'Cricket',
    'Basketball',
    'Tennis',
    'Badminton',
    'Swimming',
    'Athletics',
    'Hockey',
    'Volleyball',
    'Table Tennis',
    'Kabaddi',
    'Boxing',
    'Wrestling',
    'Gymnastics',
    'Other'
  ];

  // Specialization options for coaches
  const specializationOptions = [
    'Head Coach',
    'Assistant Coach',
    'Fitness Coach',
    'Technical Coach',
    'Goalkeeping Coach',
    'Youth Development',
    'Tactical Coach',
    'Mental Performance',
    'Sports Psychology',
    'Physiotherapy',
    'Nutrition',
    'Strength & Conditioning',
    'General Coaching',
    'Other'
  ];

  useEffect(() => {
    const initialData = {
      first_name: '', last_name: '', email: '', phone: '',
      sports: [], specialization: '', experience_years: '', qualifications: '',
      salary: '', hire_date: '',
      emergency_contact_name: '', emergency_contact_phone: '',
      bio: '', photo_url: '', status: 'active'
    };

    if (isOpen && isEditing && coach) {
      const coachFormData = {};
      for (const key in initialData) {
        coachFormData[key] = coach[key] || initialData[key];
      }
      setFormData(coachFormData);
      // Handle both base64 and URL
      if (coach.photo_url) {
        setPhotoPreview(coach.photo_url.startsWith('data:') ? coach.photo_url : `${process.env.REACT_APP_BACKEND_URL}${coach.photo_url}`);
      } else {
        setPhotoPreview(defaultAvatar);
      }
    } else {
      setFormData(initialData);
      setPhotoPreview(defaultAvatar);
    }
  }, [isOpen, isEditing, coach]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSportsChange = (sport) => {
    setFormData(prev => {
      const currentSports = prev.sports || [];
      if (currentSports.includes(sport)) {
        return { ...prev, sports: currentSports.filter(s => s !== sport) };
      } else {
        return { ...prev, sports: [...currentSports, sport] };
      }
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

    try {
      // Convert numeric fields if provided
      const submitData = {
        ...formData,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        salary: formData.salary ? parseFloat(formData.salary) : null,
      };

      // Always pass only the submitData - the wrapper function in parent handles the ID for updates
      const success = await onSubmit(submitData);

      // Only call onSuccess if submission was successful
      if (success !== false && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting coach form:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">{isEditing ? 'Edit Coach Details' : 'Add New Coach'}</h2>
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
                <div className="md:col-span-2">
                  <FormLabel htmlFor="status">Status</FormLabel>
                  <FormSelect name="status" id="status" value={formData.status} onChange={handleChange}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </FormSelect>
                </div>
              </div>
            </div>
          </div>

          {/* Sports Handled Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Sports Handled *</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {sportsOptions.map((sport) => (
                <label
                  key={sport}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.sports && formData.sports.includes(sport)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.sports && formData.sports.includes(sport)}
                    onChange={() => handleSportsChange(sport)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">{sport}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">Select all sports this coach can handle. This will be used to auto-assign players.</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Professional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

              <div>
                <FormLabel htmlFor="specialization">Specialization</FormLabel>
                <FormSelect name="specialization" id="specialization" value={formData.specialization} onChange={handleChange}>
                  <option value="">Select Specialization</option>
                  {specializationOptions.map(spec => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </FormSelect>
              </div>

              <div>
                <FormLabel htmlFor="experience_years">Experience Years</FormLabel>
                <FormInput
                  type="number"
                  name="experience_years"
                  id="experience_years"
                  value={formData.experience_years}
                  onChange={handleChange}
                  min="0"
                  max="50"
                  placeholder="e.g., 5"
                />
              </div>

              <div>
                <FormLabel htmlFor="qualifications">Qualifications</FormLabel>
                <FormInput
                  type="text"
                  name="qualifications"
                  id="qualifications"
                  value={formData.qualifications}
                  onChange={handleChange}
                  placeholder="e.g., UEFA A License, Sports Science Degree"
                />
              </div>

              <div>
                <FormLabel htmlFor="salary">Salary (Monthly)</FormLabel>
                <FormInput
                  type="number"
                  name="salary"
                  id="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="e.g., 50000"
                />
              </div>

              <div>
                <FormLabel htmlFor="hire_date">Joining Date</FormLabel>
                <FormInput
                  type="date"
                  name="hire_date"
                  id="hire_date"
                  value={formData.hire_date}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Emergency Contact & Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <FormLabel htmlFor="emergency_contact_name">Emergency Contact Name</FormLabel>
                <FormInput
                  type="text"
                  name="emergency_contact_name"
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <FormLabel htmlFor="emergency_contact_phone">Emergency Contact Phone</FormLabel>
                <FormInput
                  type="tel"
                  name="emergency_contact_phone"
                  id="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleChange}
                />
              </div>

              <div className="md:col-span-2">
                <FormLabel htmlFor="bio">Bio / Notes</FormLabel>
                <textarea
                  name="bio"
                  id="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Brief biography, achievements, coaching philosophy, etc..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end items-center gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || isUploading}
              className="px-6 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isUploading}
              className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {(loading || isUploading) && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {(loading || isUploading) ? 'Saving...' : (coach ? 'Update Coach' : 'Add Coach')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CoachModal;
