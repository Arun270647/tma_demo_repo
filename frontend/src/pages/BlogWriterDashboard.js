import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Edit, Trash2, Send, Eye, LogOut, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import { useAuth } from '../AuthContext';
import SEOHelmet from '../components/SEOHelmet';

export default function BlogWriterDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/blog/posts/my`, {
        headers: {
          'Authorization': `Bearer ${user.session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else {
        setError('Failed to load posts');
      }
    } catch (err) {
      setError('Error loading posts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (postData) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/blog/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      if (response.ok) {
        setShowCreateModal(false);
        fetchPosts();
      } else {
        const data = await response.json();
        alert(data.detail || 'Failed to create post');
      }
    } catch (err) {
      alert('Error creating post');
    }
  };

  const handleSubmitForApproval = async (postId) => {
    if (!window.confirm('Submit this post for admin approval?')) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/blog/posts/${postId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.session.access_token}`
        }
      });

      if (response.ok) {
        fetchPosts();
        alert('Post submitted for approval!');
      } else {
        alert('Failed to submit post');
      }
    } catch (err) {
      alert('Error submitting post');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this draft? This action cannot be undone.')) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/blog/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.session.access_token}`
        }
      });

      if (response.ok) {
        fetchPosts();
      } else {
        alert('Failed to delete post');
      }
    } catch (err) {
      alert('Error deleting post');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/internal/blog-login');
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { color: 'bg-gray-500', icon: FileText, text: 'Draft' },
      pending: { color: 'bg-yellow-500', icon: Clock, text: 'Pending Review' },
      approved: { color: 'bg-green-500', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'bg-red-500', icon: X, text: 'Rejected' }
    };

    const badge = badges[status] || badges.draft;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm ${badge.color}`}>
        <Icon className="w-4 h-4" />
        {badge.text}
      </span>
    );
  };

  const filteredPosts = statusFilter === 'all'
    ? posts
    : posts.filter(post => post.status === statusFilter);

  return (
    <>
      <SEOHelmet
        title="Writer Dashboard - Track My Academy Blog"
        description="Blog writer dashboard"
        noindex={true}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Writer Dashboard</h1>
                  <p className="text-sm text-gray-600">Welcome back, {user?.user_metadata?.name || user?.email}</p>
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

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Actions Bar */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-2">
              {['all', 'draft', 'pending', 'approved', 'rejected'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              New Blog Post
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Posts List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading posts...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
              <p className="text-gray-600 mb-6">
                {statusFilter === 'all'
                  ? "You haven't created any blog posts yet."
                  : `No ${statusFilter} posts found.`}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Your First Post
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{post.excerpt || 'No excerpt'}</p>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        {getStatusBadge(post.status)}
                        <span>Updated: {new Date(post.updated_at).toLocaleDateString()}</span>
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex gap-1">
                            {post.tags.map((tag, idx) => (
                              <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setSelectedPost(post)}
                      className="flex items-center gap-1 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    {post.status === 'draft' && (
                      <>
                        <button
                          onClick={() => {/* Edit functionality */ }}
                          className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleSubmitForApproval(post.id)}
                          className="flex items-center gap-1 px-3 py-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                        >
                          <Send className="w-4 h-4" />
                          Submit
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal (simplified - would be a full editor in production) */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreatePost}
        />
      )}

      {/* View Modal */}
      {selectedPost && (
        <ViewPostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </>
  );
}

// Create Post Modal Component
function CreatePostModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    tags: [],
    seo_title: '',
    seo_description: '',
    seo_keywords: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Create New Blog Post</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => {
                const title = e.target.value;
                setFormData({
                  ...formData,
                  title,
                  slug: generateSlug(title)
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter blog post title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Slug (URL) *</label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="blog-post-url-slug"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content (Markdown) *</label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={12}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Write your blog post content in Markdown..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt</label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Short summary of the post..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="sports, technology, education"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Draft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// View Post Modal Component
function ViewPostModal({ post, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{post.title}</h2>
            <p className="text-sm text-gray-600 mt-1">by {post.author_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <strong className="text-gray-700">Status:</strong> {post.status}
          </div>
          <div className="mb-4">
            <strong className="text-gray-700">Excerpt:</strong>
            <p className="text-gray-600 mt-1">{post.excerpt || 'No excerpt'}</p>
          </div>
          <div>
            <strong className="text-gray-700">Content:</strong>
            <pre className="mt-2 p-4 bg-gray-50 rounded border border-gray-200 whitespace-pre-wrap text-sm">
              {post.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
