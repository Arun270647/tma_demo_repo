import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Plus, Calendar, Flag, CheckCircle, Clock, X, Edit2, Trash2 } from 'lucide-react';

const TrainingPlans = () => {
  const { token } = useAuth();
  const { isLight } = useTheme();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [batches, setBatches] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sport: '',
    batch_id: '',
    start_date: '',
    end_date: '',
    drills: [],
    goals: []
  });
  const [newDrill, setNewDrill] = useState({
    name: '',
    description: '',
    duration: '',
    focus_area: ''
  });
  const [newGoal, setNewGoal] = useState({
    description: '',
    target_date: ''
  });

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (showCreateModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showCreateModal]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadPlans(), loadBatches()]);
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/academy/training-plans`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPlans(data.training_plans || []);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  const loadBatches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/academy/batches`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBatches(data.batches || []);
      }
    } catch (error) {
      console.error('Error loading batches:', error);
    }
  };

  const handleCreatePlan = async () => {
    if (!formData.title || !formData.sport || !formData.start_date || !formData.end_date) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/api/academy/training-plans`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          sport: formData.sport,
          batch_id: formData.batch_id || null,
          start_date: formData.start_date,
          end_date: formData.end_date,
          schedule: {},
          drills: formData.drills,
          goals: formData.goals
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert('✅ Training plan created successfully!');
        setShowCreateModal(false);
        resetForm();
        await loadPlans();
      } else {
        const error = await response.json();
        alert(`❌ Failed to create training plan: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      alert('❌ Error creating training plan. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      sport: '',
      batch_id: '',
      start_date: '',
      end_date: '',
      drills: [],
      goals: []
    });
    setNewDrill({ name: '', description: '', duration: '', focus_area: '' });
    setNewGoal({ description: '', target_date: '' });
  };

  const addDrill = () => {
    if (!newDrill.name || !newDrill.duration) {
      alert('Please fill in drill name and duration');
      return;
    }

    setFormData({
      ...formData,
      drills: [...formData.drills, newDrill]
    });
    setNewDrill({ name: '', description: '', duration: '', focus_area: '' });
  };

  const removeDrill = (index) => {
    setFormData({
      ...formData,
      drills: formData.drills.filter((_, i) => i !== index)
    });
  };

  const addGoal = () => {
    if (!newGoal.description) {
      alert('Please enter goal description');
      return;
    }

    setFormData({
      ...formData,
      goals: [...formData.goals, newGoal]
    });
    setNewGoal({ description: '', target_date: '' });
  };

  const removeGoal = (index) => {
    setFormData({
      ...formData,
      goals: formData.goals.filter((_, i) => i !== index)
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'flagged':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <Flag className="w-3 h-3" />
            Flagged
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold border border-yellow-400 text-red-600 bg-transparent dark:border-yellow-500 dark:text-red-400">
            <Clock className="w-3 h-3 text-red-600 dark:text-red-400" />
            Pending Review
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl md:text-2xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
            Training Plans
          </h2>
          <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mt-1 text-sm md:text-base`}>
            Create and manage training schedules for coaches
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition whitespace-nowrap text-sm md:text-base"
        >
          <Plus className="w-4 h-4" />
          Create Plan
        </button>
      </div>

      {/* Plans List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-xl p-6`}
          >
            {/* Plan Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                  {plan.title}
                </h3>
                <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'} mt-1`}>
                  {plan.description}
                </p>
              </div>
              {getStatusBadge(plan.status)}
            </div>

            {/* Plan Details */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Sport:</span>
                <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>
                  {plan.sport}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Duration:</span>
                <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>
                  {new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Drills:</span>
                <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>
                  {plan.drills?.length || 0} exercises
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Goals:</span>
                <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>
                  {plan.goals?.length || 0} objectives
                </span>
              </div>
            </div>

            {/* Reviews */}
            {plan.reviews && plan.reviews.length > 0 && (
              <div className={`${isLight ? 'bg-gray-50' : 'bg-gray-900'} rounded-lg p-3 mt-4`}>
                <p className={`text-xs font-medium ${isLight ? 'text-gray-700' : 'text-gray-300'} mb-2`}>
                  Coach Reviews:
                </p>
                {plan.reviews.map((review, idx) => (
                  <div key={idx} className="text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-white'} capitalize`}>
                        {review.action}
                      </span>
                      <span className={`${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(review.reviewed_at).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comments && (
                      <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                        {review.comments}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-xl p-8 md:p-12`}>
          <Calendar className={`w-12 h-12 md:w-16 md:h-16 ${isLight ? 'text-gray-300' : 'text-gray-600'} mb-4`} />
          <h3 className={`text-lg md:text-xl font-semibold ${isLight ? 'text-gray-800' : 'text-white'} mb-2`}>
            No Training Plans Yet
          </h3>
          <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mb-4 text-sm md:text-base`}>
            Create your first training plan to get started
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Create Plan
          </button>
        </div>
      )}

      {/* Create Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 py-0 overflow-hidden">
          <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                Create Training Plan
              </h3>
              <button
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                disabled={submitting}
                className={`p-1 rounded ${isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-700'} disabled:opacity-50`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Basic Info */}
              <div>
                <label className={`block ${isLight ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-2`}>
                  Plan Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-3 py-2 ${isLight ? 'bg-gray-50 border-gray-300 text-gray-800' : 'bg-gray-700 border-gray-600 text-white'} border rounded-lg focus:ring-2 focus:ring-blue-500`}
                  placeholder="e.g., Advanced Football Training"
                />
              </div>

              <div>
                <label className={`block ${isLight ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-2`}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-3 py-2 ${isLight ? 'bg-gray-50 border-gray-300 text-gray-800' : 'bg-gray-700 border-gray-600 text-white'} border rounded-lg focus:ring-2 focus:ring-blue-500`}
                  rows="3"
                  placeholder="Describe the training plan..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block ${isLight ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-2`}>
                    Sport *
                  </label>
                  <select
                    value={formData.sport}
                    onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                    className={`w-full px-3 py-2 ${isLight ? 'bg-gray-50 border-gray-300 text-gray-800' : 'bg-gray-700 border-gray-600 text-white'} border rounded-lg focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="">Select Sport</option>
                    <option value="Football">Football</option>
                    <option value="Cricket">Cricket</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Tennis">Tennis</option>
                    <option value="Badminton">Badminton</option>
                  </select>
                </div>

                <div>
                  <label className={`block ${isLight ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-2`}>
                    Batch (Optional)
                  </label>
                  <select
                    value={formData.batch_id}
                    onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                    className={`w-full px-3 py-2 ${isLight ? 'bg-gray-50 border-gray-300 text-gray-800' : 'bg-gray-700 border-gray-600 text-white'} border rounded-lg focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="">No Batch</option>
                    {batches.map(batch => (
                      <option key={batch.id} value={batch.id}>{batch.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block ${isLight ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-2`}>
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className={`w-full px-3 py-2 ${isLight ? 'bg-gray-50 border-gray-300 text-gray-800' : 'bg-gray-700 border-gray-600 text-white'} border rounded-lg focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                <div>
                  <label className={`block ${isLight ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-2`}>
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className={`w-full px-3 py-2 ${isLight ? 'bg-gray-50 border-gray-300 text-gray-800' : 'bg-gray-700 border-gray-600 text-white'} border rounded-lg focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>

              {/* Drills Section */}
              <div className={`${isLight ? 'bg-gray-50' : 'bg-gray-900'} rounded-lg p-4`}>
                <h4 className={`text-sm font-semibold ${isLight ? 'text-gray-800' : 'text-white'} mb-3`}>
                  Training Drills
                </h4>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    value={newDrill.name}
                    onChange={(e) => setNewDrill({ ...newDrill, name: e.target.value })}
                    placeholder="Drill name"
                    className={`px-3 py-2 text-sm ${isLight ? 'bg-white border-gray-300 text-gray-800' : 'bg-gray-800 border-gray-600 text-white'} border rounded-lg`}
                  />
                  <input
                    type="text"
                    value={newDrill.duration}
                    onChange={(e) => setNewDrill({ ...newDrill, duration: e.target.value })}
                    placeholder="Duration (e.g., 30 mins)"
                    className={`px-3 py-2 text-sm ${isLight ? 'bg-white border-gray-300 text-gray-800' : 'bg-gray-800 border-gray-600 text-white'} border rounded-lg`}
                  />
                  <input
                    type="text"
                    value={newDrill.focus_area}
                    onChange={(e) => setNewDrill({ ...newDrill, focus_area: e.target.value })}
                    placeholder="Focus area"
                    className={`px-3 py-2 text-sm ${isLight ? 'bg-white border-gray-300 text-gray-800' : 'bg-gray-800 border-gray-600 text-white'} border rounded-lg`}
                  />
                  <button
                    onClick={addDrill}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Add Drill
                  </button>
                </div>

                {formData.drills.length > 0 && (
                  <div className="space-y-2">
                    {formData.drills.map((drill, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 ${isLight ? 'bg-white' : 'bg-gray-800'} rounded`}
                      >
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>
                            {drill.name}
                          </p>
                          <p className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                            {drill.duration} • {drill.focus_area}
                          </p>
                        </div>
                        <button
                          onClick={() => removeDrill(idx)}
                          className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Goals Section */}
              <div className={`${isLight ? 'bg-gray-50' : 'bg-gray-900'} rounded-lg p-4`}>
                <h4 className={`text-sm font-semibold ${isLight ? 'text-gray-800' : 'text-white'} mb-3`}>
                  Training Goals
                </h4>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    placeholder="Goal description"
                    className={`px-3 py-2 text-sm ${isLight ? 'bg-white border-gray-300 text-gray-800' : 'bg-gray-800 border-gray-600 text-white'} border rounded-lg`}
                  />
                  <input
                    type="date"
                    value={newGoal.target_date}
                    onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                    placeholder="Target date"
                    className={`px-3 py-2 text-sm ${isLight ? 'bg-white border-gray-300 text-gray-800' : 'bg-gray-800 border-gray-600 text-white'} border rounded-lg`}
                  />
                  <button
                    onClick={addGoal}
                    className="col-span-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Add Goal
                  </button>
                </div>

                {formData.goals.length > 0 && (
                  <div className="space-y-2">
                    {formData.goals.map((goal, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 ${isLight ? 'bg-white' : 'bg-gray-800'} rounded`}
                      >
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${isLight ? 'text-gray-800' : 'text-white'}`}>
                            {goal.description}
                          </p>
                          {goal.target_date && (
                            <p className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                              Target: {new Date(goal.target_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeGoal(idx)}
                          className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreatePlan}
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    'Create Training Plan'
                  )}
                </button>
                <button
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  disabled={submitting}
                  className={`flex-1 ${isLight ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' : 'bg-gray-700 hover:bg-gray-600 text-white'} font-medium px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingPlans;
