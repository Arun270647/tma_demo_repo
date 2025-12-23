import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DemoRequestsTable = () => {
  const [demoRequests, setDemoRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, contacted, closed

  useEffect(() => {
    fetchDemoRequests();
  }, []);

  const fetchDemoRequests = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await axios.get(`${backendUrl}/api/admin/demo-requests`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setDemoRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch demo requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      await axios.put(`${backendUrl}/api/admin/demo-requests/${requestId}`, 
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );
      fetchDemoRequests();
    } catch (error) {
      console.error('Failed to update request status:', error);
    }
  };

  const filteredRequests = demoRequests.filter(request => 
    filter === 'all' || request.status === filter
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-900/20 text-yellow-400 border-yellow-400/30';
      case 'contacted': return 'bg-blue-900/20 text-blue-400 border-blue-400/30';
      case 'closed': return 'bg-green-900/20 text-green-400 border-green-400/30';
      default: return 'bg-gray-900/20 text-gray-400 border-gray-400/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading demo requests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Demo Requests</h2>
          <p className="text-gray-400">Manage and track demo requests from potential clients</p>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex space-x-2">
          {['all', 'pending', 'contacted', 'closed'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                filter === status 
                  ? 'bg-sky-600 text-white' 
                  : 'bg-white/10 text-gray-400 hover:text-white hover:bg-white/20'
              }`}
            >
              {status === 'all' ? 'All' : status}
              <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {status === 'all' ? demoRequests.length : demoRequests.filter(r => r.status === status).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-white font-semibold">Contact Info</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Academy Details</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Sport & Size</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Submitted</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-white font-medium">{request.full_name}</div>
                      <div className="text-gray-400 text-sm">{request.email}</div>
                      {request.phone && (
                        <div className="text-gray-400 text-sm">{request.phone}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-white font-medium">{request.academy_name}</div>
                      <div className="text-gray-400 text-sm">{request.location}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-white font-medium">{request.sports_type}</div>
                      {request.current_students && (
                        <div className="text-gray-400 text-sm">{request.current_students}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-400 text-sm">
                      {new Date(request.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {request.status === 'pending' && (
                        <button
                          onClick={() => updateRequestStatus(request.id, 'contacted')}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                        >
                          Mark Contacted
                        </button>
                      )}
                      {request.status === 'contacted' && (
                        <button
                          onClick={() => updateRequestStatus(request.id, 'closed')}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors"
                        >
                          Mark Closed
                        </button>
                      )}
                      {request.message && (
                        <button
                          onClick={() => {
                            alert(`Message from ${request.full_name}:\n\n${request.message}`);
                          }}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors"
                        >
                          View Message
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400">No demo requests found for the selected filter.</div>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="text-2xl font-bold text-white">{demoRequests.length}</div>
          <div className="text-gray-400 text-sm">Total Requests</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="text-2xl font-bold text-yellow-400">{demoRequests.filter(r => r.status === 'pending').length}</div>
          <div className="text-gray-400 text-sm">Pending</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="text-2xl font-bold text-blue-400">{demoRequests.filter(r => r.status === 'contacted').length}</div>
          <div className="text-gray-400 text-sm">Contacted</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="text-2xl font-bold text-green-400">{demoRequests.filter(r => r.status === 'closed').length}</div>
          <div className="text-gray-400 text-sm">Closed</div>
        </div>
      </div>
    </div>
  );
};

export default DemoRequestsTable;