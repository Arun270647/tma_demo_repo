import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, FileText, CheckCircle, X, LogOut, AlertCircle, Eye, Star } from 'lucide-react';
import { useAuth } from '../AuthContext';
import SEOHelmet from './SEOHelmet';

export default function BlogAdminDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [pendingPosts, setPendingPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [writers, setWriters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendingRes, allRes, writersRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/blog/admin/posts/pending`, {
          headers: { 'Authorization': `Bearer ${user.session.access_token}` }
        }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/blog/admin/posts`, {
          headers: { 'Authorization': `Bearer ${user.session.access_token}` }
        }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/blog/writers`, {
          headers: { 'Authorization': `Bearer ${user.session.access_token}` }
        })
      ]);

      if (pendingRes.ok) setPendingPosts(await pendingRes.json());
      if (allRes.ok) setAllPosts(await allRes.json());
      if (writersRes.ok) setWriters(await writersRes.json());
    } catch (err) {
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (postId, action, comment, rating) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/blog/admin/posts/${postId}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, comment, rating })
      });

      if (response.ok) {
        setShowReviewModal(false);
        setSelectedPost(null);
        fetchData();
        alert(`Post ${action}d successfully!`);
      } else {
        const data = await response.json();
        alert(data.detail || 'Review failed');
      }
    } catch (err) {
      alert('Error reviewing post');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/internal/blog-login');
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { color: 'bg-gray-500', text: 'Draft' },
      pending: { color: 'bg-yellow-500', text: 'Pending' },
      approved: { color: 'bg-green-500', text: 'Approved' },
      rejected: { color: 'bg-red-500', text: 'Rejected' }
    };
    const badge = badges[status] || badges.draft;
    return (
      <span className={`px-3 py-1 rounded-full text-white text-sm ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const stats = {
    totalPosts: allPosts.length,
    pending: pendingPosts.length,
    approved: allPosts.filter(p => p.status === 'approved').length,
    rejected: allPosts.filter(p => p.status === 'rejected').length,
    writers: writers.filter(w => w.is_active).length
  };

  return (
    <>
      <SEOHelmet
        title="Admin Dashboard - Track My Academy Blog"
        description="Blog admin dashboard"
        noindex={true}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-sm text-gray-600">Blog Management System</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <StatCard icon={FileText} label="Total Posts" value={stats.totalPosts} color="blue" />
            <StatCard icon={AlertCircle} label="Pending Review" value={stats.pending} color="yellow" />
            <StatCard icon={CheckCircle} label="Approved" value={stats.approved} color="green" />
            <StatCard icon={X} label="Rejected" value={stats.rejected} color="red" />
            <StatCard icon={Users} label="Active Writers" value={stats.writers} color="purple" />
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['pending', 'all', 'writers'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : activeTab === 'pending' ? (
            <PendingPostsList
              posts={pendingPosts}
              onReview={(post) => {
                setSelectedPost(post);
                setShowReviewModal(true);
              }}
              getStatusBadge={getStatusBadge}
            />
          ) : activeTab === 'all' ? (
            <AllPostsList posts={allPosts} getStatusBadge={getStatusBadge} />
          ) : (
            <WritersList writers={writers} />
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedPost && (
        <ReviewModal
          post={selectedPost}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedPost(null);
          }}
          onSubmit={handleReview}
        />
      )}
    </>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className={`inline-flex p-3 rounded-lg ${colors[color]} mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

// Pending Posts List
function PendingPostsList({ posts, onReview, getStatusBadge }) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending reviews</h3>
        <p className="text-gray-600">All caught up! No posts waiting for approval.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{post.excerpt || 'No excerpt'}</p>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                {getStatusBadge(post.status)}
                <span>by {post.author_name}</span>
                <span>Submitted: {new Date(post.submitted_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={() => onReview(post)}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Review
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// All Posts List
function AllPostsList({ posts, getStatusBadge }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {posts.map((post) => (
            <tr key={post.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{post.title}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{post.author_name}</td>
              <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(post.status)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(post.updated_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Writers List
function WritersList({ writers }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {writers.map((writer) => (
            <tr key={writer.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{writer.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{writer.email}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                  {writer.role}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-semibold rounded ${
                  writer.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {writer.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Review Modal
function ReviewModal({ post, onClose, onSubmit }) {
  const [action, setAction] = useState('approve');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (action === 'reject' && !comment) {
      alert('Please provide feedback for rejection');
      return;
    }
    onSubmit(post.id, action, comment || null, action === 'reject' ? rating : null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Review Blog Post</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h3>
            <p className="text-sm text-gray-600">by {post.author_name}</p>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded border">
            <p className="text-gray-700">{post.excerpt}</p>
          </div>

          <div className="mb-6">
            <pre className="p-4 bg-gray-50 rounded border whitespace-pre-wrap text-sm">
              {post.content}
            </pre>
          </div>

          <form onSubmit={handleSubmit} className="border-t pt-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Decision</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setAction('approve')}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                    action === 'approve'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <CheckCircle className="w-5 h-5 inline mr-2" />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setAction('reject')}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                    action === 'reject'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <X className="w-5 h-5 inline mr-2" />
                  Reject
                </button>
              </div>
            </div>

            {action === 'reject' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback (Required for rejection)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Provide constructive feedback..."
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating (1-10)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={rating}
                      onChange={(e) => setRating(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="flex items-center gap-1 font-bold text-lg">
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      {rating}/10
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-6 py-2 text-white rounded-lg transition-colors ${
                  action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm {action === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
