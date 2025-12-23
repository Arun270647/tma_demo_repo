import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

const EditAcademyModal = ({ isOpen, onClose, onSuccess, academy }) => {
  const [formData, setFormData] = useState({
    name: '',
    owner_name: '',
    phone: '',
    location: '',
    sports_type: '',
    player_limit: 50,
    coach_limit: 10,
    status: 'pending'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    if (academy) {
      setFormData({
        name: academy.name || '',
        owner_name: academy.owner_name || '',
        phone: academy.phone || '',
        location: academy.location || '',
        sports_type: academy.sports_type || '',
        player_limit: academy.player_limit || 50,
        coach_limit: academy.coach_limit || 10,
        status: academy.status || 'pending'
      });
    }
  }, [academy]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/academies/${academy.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess(data);
        onClose();
      } else {
        setError(data.detail || 'Failed to update academy');
      }
    } catch (error) {
      console.error('Error updating academy:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !academy) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Edit Academy</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                Academy Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Elite Sports Academy"
              />
            </div>

            <div>
              <label htmlFor="owner_name" className="block text-sm font-medium text-gray-300 mb-1">
                Owner Name *
              </label>
              <input
                type="text"
                id="owner_name"
                name="owner_name"
                value={formData.owner_name}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="+91 9876543210"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Mumbai, India"
              />
            </div>

            <div>
              <label htmlFor="sports_type" className="block text-sm font-medium text-gray-300 mb-1">
                Sports Type
              </label>
              <select
                id="sports_type"
                name="sports_type"
                value={formData.sports_type}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="">Select Sport Type</option>
                <option value="Cricket">Cricket</option>
                <option value="Football">Football</option>
                <option value="Basketball">Basketball</option>
                <option value="Tennis">Tennis</option>
                <option value="Swimming">Swimming</option>
                <option value="Badminton">Badminton</option>
                <option value="Athletics">Athletics</option>
                <option value="Multi-Sport">Multi-Sport</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Account Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="player_limit" className="block text-sm font-medium text-gray-300 mb-1">
                  Player Accounts Limit
                </label>
                <input
                  type="number"
                  id="player_limit"
                  name="player_limit"
                  value={formData.player_limit}
                  onChange={handleInputChange}
                  min="1"
                  max="1000"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="50"
                />
              </div>
              <div>
                <label htmlFor="coach_limit" className="block text-sm font-medium text-gray-300 mb-1">
                  Coach Accounts Limit
                </label>
                <input
                  type="number"
                  id="coach_limit"
                  name="coach_limit"
                  value={formData.coach_limit}
                  onChange={handleInputChange}
                  min="1"
                  max="100"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="10"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </div>
              ) : (
                'Update Academy'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAcademyModal;