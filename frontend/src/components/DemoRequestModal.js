import React, { useState } from 'react';
import axios from 'axios';

const DemoRequestModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    academy_name: '',
    location: '',
    sports_type: '',
    current_students: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const sportsTypes = [
    'Cricket', 'Football', 'Basketball', 'Tennis', 'Badminton', 
    'Swimming', 'Athletics', 'Hockey', 'Volleyball', 'Boxing', 
    'Wrestling', 'Gymnastics', 'Table Tennis', 'Other'
  ];

  const studentRanges = [
    '1-25 students', '26-50 students', '51-100 students', 
    '101-200 students', '201-500 students', '500+ students'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      await axios.post(`${backendUrl}/api/demo-requests`, formData);
      
      setSubmitStatus('success');
      setFormData({
        full_name: '', email: '', phone: '', academy_name: '',
        location: '', sports_type: '', current_students: '', message: ''
      });
      
      setTimeout(() => {
        onClose();
        setSubmitStatus(null);
      }, 2000);
    } catch (error) {
      console.error('Demo request error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Request Demo</h2>
              <p className="text-gray-400">See Track My Academy in action for your sports academy</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          {submitStatus === 'success' && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-400 font-medium">Demo request submitted successfully! We'll contact you within 24 hours.</p>
              </div>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-400 font-medium">Failed to submit request. Please try again.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Name and Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-sky-400 transition-colors"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-sky-400 transition-colors"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Row 2: Phone and Academy Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-sky-400 transition-colors"
                  placeholder="+91 99999 99999"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Academy Name *</label>
                <input
                  type="text"
                  name="academy_name"
                  value={formData.academy_name}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-sky-400 transition-colors"
                  placeholder="Enter academy name"
                />
              </div>
            </div>

            {/* Row 3: Location */}
            <div>
              <label className="block text-white font-medium mb-2">Location *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-sky-400 transition-colors"
                placeholder="City, State (e.g., Chennai, Tamil Nadu)"
              />
            </div>

            {/* Row 4: Sports Type and Student Count */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-medium mb-2">Primary Sport *</label>
                <select
                  name="sports_type"
                  value={formData.sports_type}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-sky-400 transition-colors"
                >
                  <option value="" className="bg-gray-900">Select sport</option>
                  {sportsTypes.map(sport => (
                    <option key={sport} value={sport} className="bg-gray-900">{sport}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Current Students</label>
                <select
                  name="current_students"
                  value={formData.current_students}
                  onChange={handleInputChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-sky-400 transition-colors"
                >
                  <option value="" className="bg-gray-900">Select range</option>
                  {studentRanges.map(range => (
                    <option key={range} value={range} className="bg-gray-900">{range}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-white font-medium mb-2">Additional Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows="4"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-sky-400 transition-colors resize-none"
                placeholder="Tell us about your academy and what features interest you most..."
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 disabled:from-gray-600 disabled:to-gray-700 px-8 py-4 rounded-lg text-white font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 shadow-lg hover:shadow-sky-500/25"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting Request...
                  </div>
                ) : (
                  'Request Demo'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              We'll get back to you within 24 hours to schedule your personalized demo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoRequestModal;