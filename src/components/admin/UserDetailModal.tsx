import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, User, Mail, Calendar, Shield, AlertTriangle, History,
  Flag, MessageSquare, UserX, UserCheck, Trash2, Edit, 
  Clock, CheckCircle, AlertCircle, Crown, Gavel, Eye
} from 'lucide-react';
import { NORMALIZED_API_URL } from '../../config/apiConfig';
import PublicProfileModal from '../profile/PublicProfileModal';

interface UserDetailModalProps {
  userId: string;
  onClose: () => void;
  onUserUpdated: () => void;
}

interface DetailedUser {
  id: string;
  username: string;
  email: string;
  role: string;
  verified: boolean;
  createdAt: string;
  isSuspended: boolean;
  suspensions: Array<{
    reason: string;
    startDate: string;
    endDate: string;
    issuedBy: { username: string };
    isActive: boolean;
  }>;
  warnings: Array<{
    reason: string;
    issuedAt: string;
    issuedBy: { username: string };
    severity: 'low' | 'medium' | 'high';
  }>;
  moderationStats: {
    totalReports: number;
    resolvedReports: number;
  };
  adminNotes: string;
  profileCompletion: number;
}

interface UserReport {
  _id: string;
  reportType: string;
  category: string;
  description: string;
  status: string;
  createdAt: string;
  reporterId?: { username: string };
  reportedUserId?: { username: string };
}

export default function UserDetailModal({ userId, onClose, onUserUpdated }: UserDetailModalProps) {
  const [user, setUser] = useState<DetailedUser | null>(null);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [moderationLogs, setModerationLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'reports' | 'logs'>('info');
  const [adminNotes, setAdminNotes] = useState('');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPublicProfile, setShowPublicProfile] = useState(false);

  useEffect(() => {
    loadUserDetails();
  }, [userId]);

  const loadUserDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/users/${userId}/details`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setReports(data.reports || []);
        setModerationLogs(data.moderationLogs || []);
        setAdminNotes(data.user.adminNotes || '');
      }
    } catch (error) {
      console.error('Error loading user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAdminNotes = async () => {
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/users/${userId}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes: adminNotes })
      });

      if (response.ok) {
        onUserUpdated();
      }
    } catch (error) {
      console.error('Error updating admin notes:', error);
    }
  };

  const handleSuspendUser = async (reason: string, duration: string) => {
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/users/${userId}/suspend`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          suspend: !user?.isSuspended,
          reason,
          duration: duration === 'permanent' ? 'permanent' : parseInt(duration)
        })
      });

      if (response.ok) {
        await loadUserDetails();
        onUserUpdated();
        setShowSuspendModal(false);
        
        const action = user?.isSuspended ? 'unsuspended' : 'suspended';
        alert(`User ${user?.username} has been ${action} successfully!`);
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Failed to suspend user. Please try again.');
    }
  };

  const handleWarnUser = async (reason: string, severity: string) => {
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/users/${userId}/warn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason, severity })
      });

      if (response.ok) {
        await loadUserDetails();
        onUserUpdated();
        setShowWarnModal(false);
        
        alert(`User ${user?.username} has been warned successfully!`);
      }
    } catch (error) {
      console.error('Error warning user:', error);
      alert('Failed to warn user. Please try again.');
    }
  };

  if (loading || !user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-center mt-4">Loading user details...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                <User size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user.username}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' ? 'bg-red-100 text-red-800' :
                    user.role === 'moderator' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.isSuspended ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {user.isSuspended ? 'Suspended' : 'Active'}
                  </span>
                  {user.verified && (
                    <CheckCircle size={16} className="text-green-500" />
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex border-b border-gray-200">
            {[
              { id: 'info', label: 'User Info', icon: User },
              { id: 'reports', label: `Reports (${reports.length})`, icon: Flag },
              { id: 'logs', label: `Activity (${moderationLogs.length})`, icon: History }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-6 py-3 font-medium ${
                  activeTab === tab.id
                    ? 'border-b-2 border-red-500 text-red-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon size={16} className="mr-2" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <div className="flex items-center mt-1">
                        <Mail size={16} className="text-gray-400 mr-2" />
                        <span className="text-gray-900">{user.email}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Joined</label>
                      <div className="flex items-center mt-1">
                        <Calendar size={16} className="text-gray-400 mr-2" />
                        <span className="text-gray-900">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Profile Completion</label>
                      <div className="mt-1">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${user.profileCompletion}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{user.profileCompletion}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Warnings</label>
                      <span className="text-2xl font-bold text-orange-600">{user.warnings.length}</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Suspensions</label>
                      <span className="text-2xl font-bold text-red-600">{user.suspensions.length}</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reports Made</label>
                      <span className="text-2xl font-bold text-blue-600">
                        {reports.filter(r => r.reporterId?.username === user.username).length}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={4}
                    placeholder="Add administrative notes about this user..."
                  />
                  <button
                    onClick={updateAdminNotes}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Save Notes
                  </button>
                </div>

                {user.warnings.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Recent Warnings</h4>
                    <div className="space-y-2">
                      {user.warnings.slice(0, 3).map((warning, index) => (
                        <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm text-orange-800">{warning.reason}</p>
                              <p className="text-xs text-orange-600 mt-1">
                                By {warning.issuedBy.username} • {new Date(warning.issuedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              warning.severity === 'high' ? 'bg-red-100 text-red-800' :
                              warning.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {warning.severity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {user.suspensions.some(s => s.isActive) && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Active Suspensions</h4>
                    <div className="space-y-2">
                      {user.suspensions.filter(s => s.isActive).map((suspension, index) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm text-red-800">{suspension.reason}</p>
                          <p className="text-xs text-red-600 mt-1">
                            By {suspension.issuedBy.username} • 
                            Until {new Date(suspension.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No reports found for this user.</p>
                ) : (
                  reports.map(report => (
                    <div key={report._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium text-gray-900">
                            {report.reportType.replace('_', ' ')}
                          </span>
                          <span className="mx-2 text-gray-400">•</span>
                          <span className="text-sm text-gray-600">{report.category}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{report.description}</p>
                      <div className="text-xs text-gray-500">
                        {new Date(report.createdAt).toLocaleString()}
                        {report.reporterId && (
                          <span> • Reported by {report.reporterId.username}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-4">
                {moderationLogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No moderation activity found.</p>
                ) : (
                  moderationLogs.map(log => (
                    <div key={log._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-900">{log.action.replace('_', ' ')}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{log.details}</p>
                      {log.moderatorId && (
                        <p className="text-xs text-gray-500 mt-1">
                          By {log.moderatorId.username}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center p-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowPublicProfile(true)}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Eye size={16} className="mr-2" />
                View Public Profile
              </button>
              <button
                onClick={() => setShowWarnModal(true)}
                className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                <AlertTriangle size={16} className="mr-2" />
                Warn User
              </button>
              <button
                onClick={() => setShowSuspendModal(true)}
                className={`flex items-center px-4 py-2 rounded-lg ${
                  user.isSuspended
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {user.isSuspended ? <UserCheck size={16} className="mr-2" /> : <UserX size={16} className="mr-2" />}
                {user.isSuspended ? 'Unsuspend' : 'Suspend'}
              </button>
              {user.role !== 'admin' && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete Account
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>

      {showSuspendModal && (
        <SuspendModal
          user={user}
          onConfirm={handleSuspendUser}
          onCancel={() => setShowSuspendModal(false)}
        />
      )}

      {showWarnModal && (
        <WarnModal
          onConfirm={handleWarnUser}
          onCancel={() => setShowWarnModal(false)}
        />
      )}

      {showDeleteModal && (
        <DeleteUserModal
          user={user}
          onConfirm={(reason) => {
            console.log('Delete user with reason:', reason);
            setShowDeleteModal(false);
          }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {showPublicProfile && (
        <PublicProfileModal
          onClose={() => setShowPublicProfile(false)}
          profile={{
            id: user.id,
            username: user.username,
            neighborhood: {
              name: 'Unnamed City',
              buildings: [],
              neighbors: [],
              stats: {
                totalHappiness: 85,
                totalIncome: 25000,
                totalResidents: 500,
                totalBuildings: 25
              }
            }
          }}
        />
      )}
    </>
  );
}

function SuspendModal({ user, onConfirm, onCancel }: {
  user: DetailedUser;
  onConfirm: (reason: string, duration: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('24');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]"
      onClick={onCancel}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {user.isSuspended ? 'Unsuspend User' : 'Suspend User'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason {!user.isSuspended && '*'}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
              placeholder={user.isSuspended ? 'Reason for unsuspending...' : 'Reason for suspension...'}
              required={!user.isSuspended}
            />
          </div>
          
          {!user.isSuspended && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="1">1 Hour</option>
                <option value="24">24 Hours</option>
                <option value="168">1 Week</option>
                <option value="720">1 Month</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason, duration)}
            disabled={!user.isSuspended && !reason.trim()}
            className={`px-4 py-2 rounded-lg text-white ${
              user.isSuspended
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-red-500 hover:bg-red-600 disabled:bg-gray-300'
            }`}
          >
            {user.isSuspended ? 'Unsuspend' : 'Suspend'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function WarnModal({ onConfirm, onCancel }: {
  onConfirm: (reason: string, severity: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  const [severity, setSeverity] = useState('medium');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]"
      onClick={onCancel}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Issue Warning</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
              placeholder="Reason for warning..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason, severity)}
            disabled={!reason.trim() || reason.length < 10}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300"
          >
            Issue Warning
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function DeleteUserModal({ user, onConfirm, onCancel }: {
  user: DetailedUser;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const canDelete = reason.length >= 20 && confirmText === `DELETE ${user.username}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]"
      onClick={onCancel}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center mb-4">
          <AlertCircle size={24} className="text-red-500 mr-3" />
          <h3 className="text-lg font-bold text-red-900">Delete User Account</h3>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800">
            <strong>Warning:</strong> This action is irreversible. The user's account and all associated data will be permanently deleted.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for deletion * (minimum 20 characters)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
              placeholder="Detailed reason for account deletion..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">{reason.length}/20 characters minimum</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type "DELETE {user.username}" to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder={`DELETE ${user.username}`}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!canDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300"
          >
            Delete Account
          </button>
        </div>
      </div>
    </motion.div>
  );
} 