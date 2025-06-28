import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Flag, User, Clock, AlertTriangle, CheckCircle, XCircle,
  Eye, MessageSquare, Calendar, FileText, Shield, Gavel, 
  ArrowRight, UserX, UserCheck, AlertCircle, ExternalLink
} from 'lucide-react';
import { NORMALIZED_API_URL } from '../../config/apiConfig';

interface ReportDetailModalProps {
  reportId: string;
  onClose: () => void;
  onReportUpdated: () => void;
}

interface DetailedReport {
  _id: string;
  reporterId: {
    _id: string;
    username: string;
    email: string;
    role: string;
  };
  reportedUserId: {
    _id: string;
    username: string;
    email: string;
    role: string;
    suspensions: any[];
    warnings: any[];
  };
  reportType: string;
  category: string;
  description: string;
  evidence?: string;
  specificContent?: {
    type: string;
    content: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed' | 'escalated';
  estimatedReviewTime: string;
  createdAt: string;
  assignedModerator?: {
    _id: string;
    username: string;
  };
  resolution?: {
    action: string;
    reason: string;
    notes: string;
    resolvedBy: { username: string };
    resolvedAt: string;
  };
  relatedReports: any[];
  metadata?: {
    ipAddress: string;
    userAgent: string;
    timestamp: string;
  };
}

const REPORT_TYPES = {
  inappropriate_profile: 'Inappropriate Profile',
  harassment: 'Harassment',
  spam: 'Spam',
  hate_speech: 'Hate Speech',
  impersonation: 'Impersonation',
  inappropriate_content: 'Inappropriate Content',
  privacy_violation: 'Privacy Violation',
  cheating_exploitation: 'Cheating/Exploitation'
};

const RESOLUTION_ACTIONS = {
  no_action: 'No Action Required',
  warning_issued: 'Warning Issued',
  content_removed: 'Content Removed',
  temp_ban: 'Temporary Suspension',
  permanent_ban: 'Permanent Ban',
  account_restricted: 'Account Restricted'
};

export default function ReportDetailModal({ reportId, onClose, onReportUpdated }: ReportDetailModalProps) {
  const [report, setReport] = useState<DetailedReport | null>(null);
  const [moderationLogs, setModerationLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);

  useEffect(() => {
    loadReportDetails();
  }, [reportId]);

  const loadReportDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/reports/${reportId}/details`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
        setModerationLogs(data.moderationLogs || []);
      }
    } catch (error) {
      console.error('Error loading report details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToMe = async () => {
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/reports/${reportId}/assign`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (response.ok) {
        loadReportDetails();
        onReportUpdated();
      }
    } catch (error) {
      console.error('Error assigning report:', error);
    }
  };

  const handleResolveReport = async (status: string, action: string, reason: string, notes: string) => {
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/reports/${reportId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, action, reason, notes })
      });

      if (response.ok) {
        loadReportDetails();
        onReportUpdated();
        setShowResolutionModal(false);
      }
    } catch (error) {
      console.error('Error resolving report:', error);
    }
  };

  const handleSuspendUser = async (reason: string, duration: string) => {
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/users/${report?.reportedUserId._id}/suspend`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          suspend: true,
          reason,
          duration: duration === 'permanent' ? 'permanent' : parseInt(duration)
        })
      });

      if (response.ok) {
        await loadReportDetails();
        
        await handleResolveReport('resolved', 'temp_ban', `User suspended: ${reason}`, `Duration: ${duration === 'permanent' ? 'Permanent' : duration + ' hours'}`);
        
        onReportUpdated();
        setShowSuspendModal(false);
        
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Failed to suspend user. Please try again.');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'escalated': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || !report) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-center mt-4">Loading report details...</p>
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
          className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                <Flag size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {REPORT_TYPES[report.reportType as keyof typeof REPORT_TYPES] || report.reportType}
                </h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}`}>
                    {report.severity}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                    {report.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 max-h-[70vh] overflow-y-auto">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Report Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <span className="text-gray-900">{report.category}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-gray-900 bg-white p-3 rounded border">{report.description}</p>
                  </div>
                  {report.evidence && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Evidence</label>
                      <p className="text-gray-900 bg-white p-3 rounded border">{report.evidence}</p>
                    </div>
                  )}
                  {report.specificContent && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Specific Content</label>
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm text-gray-600 mb-2">Type: {report.specificContent.type}</p>
                        <p className="text-gray-900">{report.specificContent.content}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Users Involved</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center space-x-2 mb-2">
                      <User size={16} className="text-blue-500" />
                      <span className="font-medium text-gray-900">Reporter</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{report.reporterId?.username || 'Anonymous'}</p>
                      <p className="text-sm text-gray-600">{report.reporterId?.email || 'No email'}</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                        report.reporterId?.role === 'admin' ? 'bg-red-100 text-red-800' :
                        report.reporterId?.role === 'moderator' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {report.reporterId?.role || 'user'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle size={16} className="text-red-500" />
                      <span className="font-medium text-gray-900">Reported User</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{report.reportedUserId?.username || 'Unknown User'}</p>
                      <p className="text-sm text-gray-600">{report.reportedUserId?.email || 'No email'}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          report.reportedUserId?.role === 'admin' ? 'bg-red-100 text-red-800' :
                          report.reportedUserId?.role === 'moderator' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {report.reportedUserId?.role || 'user'}
                        </span>
                        <span className="text-xs text-gray-600">
                          {report.reportedUserId?.warnings?.length || 0} warnings •{' '}
                          {report.reportedUserId?.suspensions?.length || 0} suspensions
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {report.resolution && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="font-semibold text-green-900 mb-4">Resolution</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-green-800 mb-1">Action Taken</label>
                      <span className="text-green-900">
                        {RESOLUTION_ACTIONS[report.resolution.action as keyof typeof RESOLUTION_ACTIONS] || report.resolution.action}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-800 mb-1">Reason</label>
                      <p className="text-green-900">{report.resolution.reason}</p>
                    </div>
                    {report.resolution.notes && (
                      <div>
                        <label className="block text-sm font-medium text-green-800 mb-1">Notes</label>
                        <p className="text-green-900">{report.resolution.notes}</p>
                      </div>
                    )}
                    <div className="text-sm text-green-700">
                      Resolved by {report.resolution.resolvedBy?.username || 'Unknown'} on{' '}
                      {new Date(report.resolution.resolvedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {moderationLogs.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Activity Log</h3>
                  <div className="space-y-3">
                    {moderationLogs.map((log, index) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium text-gray-900">
                              {log.action.replace('_', ' ')}
                            </span>
                            <p className="text-sm text-gray-700 mt-1">{log.details}</p>
                            {log.moderatorId && (
                              <p className="text-xs text-gray-500 mt-1">
                                By {log.moderatorId.username}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {!report.assignedModerator && (
                    <button
                      onClick={handleAssignToMe}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      <User size={16} className="mr-2" />
                      Assign to Me
                    </button>
                  )}
                  
                  {report.status === 'pending' || report.status === 'under_review' ? (
                    <button
                      onClick={() => setShowResolutionModal(true)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Resolve Report
                    </button>
                  ) : null}

                  <button
                    onClick={() => setShowSuspendModal(true)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <UserX size={16} className="mr-2" />
                    Suspend User
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Report Info</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      report.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      report.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      report.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {report.priority}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Review</label>
                    <span className="text-gray-900">{report.estimatedReviewTime}</span>
                  </div>
                  {report.assignedModerator && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                      <span className="text-gray-900">{report.assignedModerator.username}</span>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Submitted</label>
                    <span className="text-gray-900">{new Date(report.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {report.relatedReports && report.relatedReports.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Related Reports</h3>
                  <div className="space-y-2">
                    {report.relatedReports.slice(0, 3).map((relatedReport, index) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {relatedReport.reportType?.replace('_', ' ')}
                            </span>
                            <p className="text-xs text-gray-600 mt-1">
                              {relatedReport.status} • {new Date(relatedReport.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <ExternalLink size={14} className="text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.metadata && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Technical Details</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">IP Address:</span>
                      <span className="ml-2 text-gray-900 font-mono">
                        {report.metadata.ipAddress || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">User Agent:</span>
                      <p className="text-gray-900 text-xs break-all mt-1">
                        {report.metadata.userAgent || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>

      {showResolutionModal && (
        <ResolutionModal
          onConfirm={handleResolveReport}
          onCancel={() => setShowResolutionModal(false)}
        />
      )}

      {showSuspendModal && report && (
        <SuspendUserModal
          username={report.reportedUserId?.username || 'Unknown User'}
          onConfirm={handleSuspendUser}
          onCancel={() => setShowSuspendModal(false)}
        />
      )}
    </>
  );
}

function ResolutionModal({ onConfirm, onCancel }: {
  onConfirm: (status: string, action: string, reason: string, notes: string) => void;
  onCancel: () => void;
}) {
  const [status, setStatus] = useState('resolved');
  const [action, setAction] = useState('warning_issued');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]"
      onClick={onCancel}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Resolve Report</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action Taken</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="no_action">No Action Required</option>
              <option value="warning_issued">Warning Issued</option>
              <option value="content_removed">Content Removed</option>
              <option value="temp_ban">Temporary Suspension</option>
              <option value="permanent_ban">Permanent Ban</option>
              <option value="account_restricted">Account Restricted</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
              placeholder="Reason for resolution..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={2}
              placeholder="Additional notes (optional)..."
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
            onClick={() => onConfirm(status, action, reason, notes)}
            disabled={!reason.trim()}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300"
          >
            Resolve Report
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function SuspendUserModal({ username, onConfirm, onCancel }: {
  username: string;
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
        <h3 className="text-lg font-bold text-gray-900 mb-4">Suspend User: {username}</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
              placeholder="Reason for suspension..."
              required
            />
          </div>
          
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
            disabled={!reason.trim()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300"
          >
            Suspend User
          </button>
        </div>
      </div>
    </motion.div>
  );
} 