import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { IndianRupee, Bell, Check, Clock, AlertCircle, Edit2, X, Mail } from 'lucide-react';

const FeeCollection = () => {
  const { token } = useAuth();
  const { isLight } = useTheme();
  const [feeRecords, setFeeRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [sendingReminder, setSendingReminder] = useState(null);
  const [feeReminderType, setFeeReminderType] = useState('manual');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailModalData, setEmailModalData] = useState(null);
  const [emailForm, setEmailForm] = useState({
    subject: '',
    content: ''
  });

  const [editForm, setEditForm] = useState({
    amount: '',
    frequency: 'monthly',
    due_date: '',
    status: 'due',
    notes: ''
  });

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadFeeRecords();
    loadFeeReminderSettings();
  }, []);

  const loadFeeRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/academy/student-fees`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFeeRecords(data.fee_records || []);
      }
    } catch (error) {
      console.error('Error loading fee records:', error);
      alert('Failed to load fee records');
    } finally {
      setLoading(false);
    }
  };

  const handleEditFee = (feeRecord) => {
    setEditingFee(feeRecord);
    setEditForm({
      amount: feeRecord.amount || '',
      frequency: feeRecord.frequency || 'monthly',
      due_date: feeRecord.due_date ? new Date(feeRecord.due_date).toISOString().split('T')[0] : '',
      status: feeRecord.status || 'due',
      notes: feeRecord.notes || ''
    });
    setShowEditModal(true);
  };

  const handleSaveFee = async () => {
    if (!editForm.amount || !editForm.due_date) {
      alert('Please fill in amount and due date');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/academy/student-fees/${editingFee.player_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(editForm.amount),
          frequency: editForm.frequency,
          due_date: editForm.due_date,
          status: editForm.status,
          notes: editForm.notes
        })
      });

      if (response.ok) {
        alert('✅ Fee updated successfully!');
        setShowEditModal(false);
        // Ensure reload completes before continuing
        await loadFeeRecords();
      } else {
        const error = await response.json();
        alert(`❌ Failed to update fee: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving fee:', error);
      alert('❌ Error saving fee');
    }
  };

  const handleToggleStatus = async (feeRecord) => {
    const newStatus = feeRecord.status === 'paid' ? 'due' : 'paid';
    const confirmMessage = newStatus === 'paid'
      ? 'Mark this fee as Paid?'
      : 'Mark this fee as Due?';

    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/academy/student-fees/${feeRecord.player_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: feeRecord.amount,
          frequency: feeRecord.frequency,
          due_date: feeRecord.due_date,
          status: newStatus,
          notes: feeRecord.notes
        })
      });

      if (response.ok) {
        // Update local state immediately for instant UI feedback
        setFeeRecords(prevRecords =>
          prevRecords.map(record =>
            record.player_id === feeRecord.player_id
              ? { ...record, status: newStatus }
              : record
          )
        );
        alert(`✅ Fee status updated to ${newStatus}!`);
        // Reload to ensure data is in sync with backend
        await loadFeeRecords();
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to update fee status: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating fee status:', error);
      alert('❌ Error updating fee status');
    }
  };

  const loadFeeReminderSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/academy/fee-reminder-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFeeReminderType(data.fee_reminder_type || 'manual');
      }
    } catch (error) {
      console.error('Error loading fee reminder settings:', error);
    }
  };

  const handleSendReminder = async (record) => {
    // Check reminder type
    if (feeReminderType === 'automatic') {
      // Send automatic email
      setSendingReminder(record.player_id);
      try {
        const response = await fetch(`${API_BASE_URL}/api/academy/student-fees/${record.player_id}/send-reminder`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          alert(`✅ Email sent to ${record.player_email} successfully!`);
          loadFeeRecords();
        } else {
          alert('❌ Failed to send email');
        }
      } catch (error) {
        console.error('Error sending email:', error);
        alert('❌ Error sending email');
      } finally {
        setSendingReminder(null);
      }
    } else {
      // Open manual email composition modal
      setEmailModalData({
        playerId: record.player_id,
        playerName: record.player_name,
        playerEmail: record.player_email,
        feeAmount: record.amount,
        dueDate: record.due_date,
        frequency: record.frequency
      });
      setEmailForm({
        subject: `Fee Payment Reminder - ${record.player_name}`,
        content: `Dear ${record.player_name},\n\nThis is a reminder regarding your fee payment of ₹${record.amount}.\n\nPlease make the payment at your earliest convenience.\n\nThank you.`
      });
      setShowEmailModal(true);
    }
  };

  const handleSendManualEmail = async () => {
    // Validate inputs
    if (!emailForm.subject || !emailForm.subject.trim()) {
      alert('⚠️ Please enter an email subject');
      return;
    }

    if (!emailForm.content || !emailForm.content.trim()) {
      alert('⚠️ Please enter email content');
      return;
    }

    if (emailForm.subject.length > 200) {
      alert('⚠️ Subject must be less than 200 characters');
      return;
    }

    setSendingReminder(emailModalData.playerId);

    try {
      console.log('Sending manual email to:', emailModalData.playerEmail);

      const response = await fetch(`${API_BASE_URL}/api/academy/student-fees/send-manual-reminder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          player_id: emailModalData.playerId,
          subject: emailForm.subject.trim(),
          content: emailForm.content.trim()
        })
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Email sent successfully:', data);

        // Show success message
        alert(`✅ Email sent successfully!\n\nRecipient: ${data.recipient || emailModalData.playerEmail}\nPlayer: ${data.player_name || emailModalData.playerName}`);

        // Close modal and refresh
        setShowEmailModal(false);
        await loadFeeRecords();
      } else {
        // Handle different error status codes
        let errorMessage = 'Unknown error occurred';

        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || 'Unknown error';
          console.error('Server error:', errorData);
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
          errorMessage = `Server returned ${response.status}: ${response.statusText}`;
        }

        // Show user-friendly error based on status code
        if (response.status === 404) {
          alert(`❌ Player not found\n\n${errorMessage}`);
        } else if (response.status === 400) {
          alert(`❌ Invalid request\n\n${errorMessage}`);
        } else if (response.status === 429) {
          alert(`⚠️ Rate limit exceeded\n\nPlease wait a few minutes before sending more reminders.`);
        } else if (response.status === 500) {
          alert(`❌ Email service error\n\n${errorMessage}\n\nPlease contact support if this persists.`);
        } else {
          alert(`❌ Failed to send email\n\n${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('Network or unexpected error:', error);

      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert('❌ Network error\n\nCould not connect to server. Please check your internet connection.');
      } else {
        alert(`❌ Unexpected error\n\n${error.message || 'Please try again or contact support.'}`);
      }
    } finally {
      setSendingReminder(null);
    }
  };

  const getStatusColor = (status, dueDate) => {
    if (status === 'paid') {
      return isLight ? 'bg-green-100 text-green-800 border-green-200' : 'bg-green-900/30 text-green-400 border-green-800';
    }

    // Status is 'due'
    if (dueDate) {
      const due = new Date(dueDate);
      const now = new Date();
      const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        // Overdue
        return isLight ? 'bg-red-100 text-red-800 border-red-200' : 'bg-red-900/30 text-red-400 border-red-800';
      } else if (diffDays <= 3) {
        // Due soon
        return isLight ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-orange-900/30 text-orange-400 border-orange-800';
      }
    }

    // Normal due status
    return isLight ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-blue-900/30 text-blue-400 border-blue-800';
  };

  const getStatusText = (status, dueDate) => {
    if (status === 'paid') return 'Paid';

    // Status is 'due'
    if (dueDate) {
      const due = new Date(dueDate);
      const now = new Date();
      const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return `Due (Overdue by ${Math.abs(diffDays)}d)`;
      if (diffDays === 0) return 'Due (Today)';
      if (diffDays <= 3) return `Due (in ${diffDays}d)`;
      return 'Due';
    }

    return 'Due (Not Set)';
  };

  const getStatusIcon = (status, dueDate) => {
    if (status === 'paid') return <Check className="w-4 h-4" />;

    if (dueDate) {
      const due = new Date(dueDate);
      const now = new Date();
      const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return <AlertCircle className="w-4 h-4" />;
      return <Clock className="w-4 h-4" />;
    }

    return <AlertCircle className="w-4 h-4" />;
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
            Fee Management
          </h2>
          <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mt-1`}>
            Manage student fees, payments, and reminders
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Total Students</p>
              <p className={`text-2xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                {feeRecords.length}
              </p>
            </div>
            <IndianRupee className={`w-8 h-8 ${isLight ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
        </div>

        <div className={`${isLight ? 'bg-green-50 border-green-200' : 'bg-green-900/20 border-green-800'} border rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isLight ? 'text-green-600' : 'text-green-400'}`}>Paid</p>
              <p className={`text-2xl font-bold ${isLight ? 'text-green-700' : 'text-green-300'}`}>
                {feeRecords.filter(f => f.status === 'paid').length}
              </p>
            </div>
            <Check className={`w-8 h-8 ${isLight ? 'text-green-500' : 'text-green-400'}`} />
          </div>
        </div>

        <div className={`${isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-800'} border rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>Due</p>
              <p className={`text-2xl font-bold ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>
                {feeRecords.filter(f => f.status === 'due').length}
              </p>
            </div>
            <Clock className={`w-8 h-8 ${isLight ? 'text-blue-500' : 'text-blue-400'}`} />
          </div>
        </div>

        <div className={`${isLight ? 'bg-red-50 border-red-200' : 'bg-red-900/20 border-red-800'} border rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isLight ? 'text-red-600' : 'text-red-400'}`}>Overdue</p>
              <p className={`text-2xl font-bold ${isLight ? 'text-red-700' : 'text-red-300'}`}>
                {feeRecords.filter(f => {
                  if (f.status === 'paid' || !f.due_date) return false;
                  return new Date(f.due_date) < new Date();
                }).length}
              </p>
            </div>
            <AlertCircle className={`w-8 h-8 ${isLight ? 'text-red-500' : 'text-red-400'}`} />
          </div>
        </div>
      </div>

      {/* Fee Records Table */}
      <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} border rounded-lg overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-900 border-gray-700'} border-b`}>
              <tr>
                <th className={`text-left py-3 px-4 ${isLight ? 'text-gray-700' : 'text-gray-300'} font-medium text-sm`}>
                  Student
                </th>
                <th className={`text-left py-3 px-4 ${isLight ? 'text-gray-700' : 'text-gray-300'} font-medium text-sm`}>
                  Sport
                </th>
                <th className={`text-left py-3 px-4 ${isLight ? 'text-gray-700' : 'text-gray-300'} font-medium text-sm`}>
                  Amount
                </th>
                <th className={`text-left py-3 px-4 ${isLight ? 'text-gray-700' : 'text-gray-300'} font-medium text-sm`}>
                  Due Date
                </th>
                <th className={`text-left py-3 px-4 ${isLight ? 'text-gray-700' : 'text-gray-300'} font-medium text-sm`}>
                  Status
                </th>
                <th className={`text-left py-3 px-4 ${isLight ? 'text-gray-700' : 'text-gray-300'} font-medium text-sm`}>
                  Actions
                </th>
                <th className={`text-left py-3 px-4 ${isLight ? 'text-gray-700' : 'text-gray-300'} font-medium text-sm`}>
                  Reminder
                </th>
              </tr>
            </thead>
            <tbody>
              {feeRecords.map((record, index) => (
                <tr
                  key={index}
                  className={`${isLight ? 'border-gray-100 hover:bg-gray-50' : 'border-gray-700 hover:bg-gray-750'} border-b transition`}
                >
                  <td className={`py-3 px-4 text-left ${isLight ? 'text-gray-800' : 'text-gray-300'}`}>
                    <div>
                      <p className="font-medium">{record.player_name || 'N/A'}</p>
                      <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                        {record.registration_number || 'No Reg #'}
                      </p>
                    </div>
                  </td>
                  <td className={`py-3 px-4 text-left ${isLight ? 'text-gray-800' : 'text-gray-300'}`}>
                    {record.sport || 'N/A'}
                  </td>
                  <td className={`py-3 px-4 text-left ${isLight ? 'text-gray-800' : 'text-gray-300'} font-medium`}>
                    {record.amount ? `₹${record.amount}` : 'Not Set'}
                  </td>
                  <td className={`py-3 px-4 text-left ${isLight ? 'text-gray-800' : 'text-gray-300'}`}>
                    {record.due_date ? new Date(record.due_date).toLocaleDateString() : 'Not Set'}
                  </td>
                  <td className="py-3 px-4 text-left">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status, record.due_date)}`}>
                        {getStatusIcon(record.status, record.due_date)}
                        {getStatusText(record.status, record.due_date)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-left">
                    <div className="flex items-center gap-2">
                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditFee(record)}
                        className={`p-1.5 rounded ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'} transition`}
                        title="Edit Fee Details"
                      >
                        <Edit2 className={`w-4 h-4 ${isLight ? 'text-gray-600' : 'text-gray-300'}`} />
                      </button>

                      {/* Toggle Status Button */}
                      <button
                        onClick={() => handleToggleStatus(record)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                          record.status === 'paid'
                            ? isLight
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                            : isLight
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                        }`}
                        title={record.status === 'paid' ? 'Mark as Due' : 'Mark as Paid'}
                      >
                        {record.status === 'paid' ? 'Mark Due' : 'Mark Paid'}
                      </button>

                    </div>
                  </td>
                  <td className="py-3 px-4 text-left">
                    {/* Send Reminder Button - Show for all non-paid fees (due, pending, or overdue) */}
                    {record.status !== 'paid' && (
                      <button
                        onClick={() => handleSendReminder(record)}
                        disabled={sendingReminder === record.player_id}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                          isLight
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed'
                            : 'bg-orange-900/30 text-orange-400 hover:bg-orange-900/50 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                        title="Send Fee Reminder"
                      >
                        {sendingReminder === record.player_id ? 'Sending...' : 'Send Reminder'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {feeRecords.length === 0 && (
            <div className="text-center py-12">
            <IndianRupee className={`w-16 h-16 mx-auto ${isLight ? 'text-gray-300' : 'text-gray-600'} mb-4`} />
              <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                No fee records found. Add players to see their fee information.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Fee Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-lg max-w-md w-full p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                Edit Fee for {editingFee?.player_name}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className={`p-1 rounded ${isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-700'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block ${isLight ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-2`}>
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  className={`w-full px-3 py-2 ${isLight ? 'bg-gray-50 border-gray-300 text-gray-800' : 'bg-gray-700 border-gray-600 text-white'} border rounded-lg focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className={`block ${isLight ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-2`}>
                  Frequency *
                </label>
                <select
                  value={editForm.frequency}
                  onChange={(e) => setEditForm({ ...editForm, frequency: e.target.value })}
                  className={`w-full px-3 py-2 ${isLight ? 'bg-gray-50 border-gray-300 text-gray-800' : 'bg-gray-700 border-gray-600 text-white'} border rounded-lg focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="half_yearly">Half Yearly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>

              <div>
                <label className={`block ${isLight ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-2`}>
                  Due Date *
                </label>
                <input
                  type="date"
                  value={editForm.due_date}
                  onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                  className={`w-full px-3 py-2 ${isLight ? 'bg-gray-50 border-gray-300 text-gray-800' : 'bg-gray-700 border-gray-600 text-white'} border rounded-lg focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className={`block ${isLight ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-2`}>
                  Status *
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className={`w-full px-3 py-2 ${isLight ? 'bg-gray-50 border-gray-300 text-gray-800' : 'bg-gray-700 border-gray-600 text-white'} border rounded-lg focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="due">Due</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div>
                <label className={`block ${isLight ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-2`}>
                  Notes (Optional)
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows="3"
                  className={`w-full px-3 py-2 ${isLight ? 'bg-gray-50 border-gray-300 text-gray-800' : 'bg-gray-700 border-gray-600 text-white'} border rounded-lg focus:ring-2 focus:ring-blue-500`}
                  placeholder="Add any notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className={`flex-1 px-4 py-2 ${isLight ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' : 'bg-gray-700 hover:bg-gray-600 text-white'} rounded-lg transition font-medium`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFee}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Composition Modal */}
      {showEmailModal && emailModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                <Mail className="inline w-5 h-5 mr-2" />
                Compose Fee Reminder Email
              </h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className={`p-1 rounded ${isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-700'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* From Field (Read-only) */}
              <div>
                <label className={`block ${isLight ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-2`}>
                  From
                </label>
                <div className={`w-full px-3 py-2 ${isLight ? 'bg-gray-100 text-gray-800' : 'bg-gray-700 text-gray-300'} border border-gray-300 rounded-lg`}>
                  donotreply@trackmyacademy.com
                </div>
              </div>

              {/* To Field (Read-only) */}
              <div>
                <label className={`block ${isLight ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-2`}>
                  To
                </label>
                <div className={`w-full px-3 py-2 ${isLight ? 'bg-gray-100 text-gray-800' : 'bg-gray-700 text-gray-300'} border border-gray-300 rounded-lg`}>
                  {emailModalData.playerEmail} ({emailModalData.playerName})
                </div>
              </div>

              {/* Subject Field */}
              <div>
                <label className={`block ${isLight ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-2`}>
                  Subject *
                </label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  className={`w-full px-3 py-2 ${isLight ? 'bg-white border-gray-300 text-gray-800' : 'bg-gray-700 border-gray-600 text-white'} border rounded-lg focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter email subject"
                />
              </div>

              {/* Content Field */}
              <div>
                <label className={`block ${isLight ? 'text-gray-700' : 'text-gray-300'} text-sm font-medium mb-2`}>
                  Message *
                </label>
                <textarea
                  value={emailForm.content}
                  onChange={(e) => setEmailForm({ ...emailForm, content: e.target.value })}
                  rows="10"
                  className={`w-full px-3 py-2 ${isLight ? 'bg-white border-gray-300 text-gray-800' : 'bg-gray-700 border-gray-600 text-white'} border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm`}
                  placeholder="Enter your message here..."
                />
              </div>

              {/* Fee Details Preview */}
              <div className={`p-4 rounded-lg ${isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-800'} border`}>
                <p className={`text-xs ${isLight ? 'text-blue-700' : 'text-blue-400'} font-medium mb-2`}>
                  Fee Details for Reference
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Amount:</span>
                    <span className={`ml-2 ${isLight ? 'text-gray-800' : 'text-white'} font-medium`}>
                      ₹{emailModalData.feeAmount}
                    </span>
                  </div>
                  <div>
                    <span className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Due Date:</span>
                    <span className={`ml-2 ${isLight ? 'text-gray-800' : 'text-white'} font-medium`}>
                      {emailModalData.dueDate ? new Date(emailModalData.dueDate).toLocaleDateString() : 'Not Set'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEmailModal(false)}
                  disabled={sendingReminder}
                  className={`flex-1 px-4 py-2 ${isLight ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' : 'bg-gray-700 hover:bg-gray-600 text-white'} rounded-lg transition font-medium disabled:opacity-50`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendManualEmail}
                  disabled={sendingReminder}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sendingReminder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeCollection;
