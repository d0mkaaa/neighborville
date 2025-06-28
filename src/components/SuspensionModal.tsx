import React, { useState, useEffect } from 'react';
import { formatDistanceToNow, format } from 'date-fns';

interface SuspensionData {
  id?: string;
  reason: string;
  startDate: string;
  endDate: string;
  issuedBy: string;
  timeRemaining: number;
  isPermanent: boolean;
  canAppeal?: boolean;
  type?: 'user' | 'ip';
  appeal?: {
    id: string;
    reason: string;
    status: 'pending' | 'approved' | 'denied';
    submittedAt: string;
    adminResponse?: string;
  } | null;
}

interface SuspensionModalProps {
  suspensionData: SuspensionData;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onRefreshStatus: () => void;
}

const SuspensionModal: React.FC<SuspensionModalProps> = ({
  suspensionData,
  onLogout,
  onDeleteAccount,
  onRefreshStatus
}) => {
  const [timeLeft, setTimeLeft] = useState(suspensionData.timeRemaining);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  const [appealError, setAppealError] = useState('');
  const [appealSuccess, setAppealSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [deleteReason, setDeleteReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (suspensionData.isPermanent) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = Math.max(0, prev - 1000);
        if (newTime === 0) {
          onRefreshStatus();
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [suspensionData.isPermanent, onRefreshStatus]);

  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return 'Expired';
    
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const handleSubmitAppeal = async () => {
    if (appealReason.length < 20) {
      setAppealError('Appeal reason must be at least 20 characters long');
      return;
    }

    setIsSubmittingAppeal(true);
    setAppealError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/user/appeal-suspension`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          suspensionId: suspensionData.id,
          reason: appealReason
        })
      });

      const data = await response.json();

      if (data.success) {
        setAppealSuccess(true);
        setShowAppealForm(false);
        setAppealReason('');
        setTimeout(() => onRefreshStatus(), 1000);
      } else {
        setAppealError(data.message || 'Failed to submit appeal');
      }
    } catch (error) {
      setAppealError('Network error. Please try again.');
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteStep === 1) {
      setDeleteStep(2);
      return;
    }

    if (deleteStep === 2) {
      if (deleteReason.length < 20) {
        return;
      }
      setDeleteStep(3);
      return;
    }

    if (deleteStep === 3) {
      if (confirmText !== `DELETE ${suspensionData.issuedBy}`) {
        return;
      }

      setIsDeleting(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/user/delete-account`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ reason: deleteReason })
        });

        if (response.ok) {
          onDeleteAccount();
        } else {
          const data = await response.json();
          alert(`Failed to delete account: ${data.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('Network error occurred while trying to delete account');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[70] p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-full">
              {suspensionData.type === 'ip' ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {suspensionData.type === 'ip' ? 'IP Address Suspended' : 'Account Suspended'}
              </h2>
              <p className="text-red-100">
                {suspensionData.type === 'ip' 
                  ? 'Access from your IP address has been restricted' 
                  : 'Your account has been temporarily restricted'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Reason</label>
                <p className="mt-1 text-gray-900 font-medium">{suspensionData.reason}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Duration</label>
                <p className="mt-1 text-gray-900 font-medium">
                  {suspensionData.isPermanent ? 'Permanent' : formatDistanceToNow(new Date(suspensionData.endDate))}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Time Remaining</label>
                <p className="mt-1 text-lg font-bold text-red-600">
                  {suspensionData.isPermanent ? 'Permanent' : formatTimeRemaining(timeLeft)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Issued By</label>
                <p className="mt-1 text-gray-900 font-medium">{suspensionData.issuedBy}</p>
              </div>
            </div>
            
            <div className="pt-3 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Started:</span> {format(new Date(suspensionData.startDate), 'MMM dd, yyyy \'at\' h:mm a')}
                </div>
                {!suspensionData.isPermanent && (
                  <div>
                    <span className="font-medium">Expires:</span> {format(new Date(suspensionData.endDate), 'MMM dd, yyyy \'at\' h:mm a')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {suspensionData.type !== 'ip' && suspensionData.appeal ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-center space-x-2 mb-3">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <h3 className="font-semibold text-blue-900">Your Appeal</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  suspensionData.appeal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  suspensionData.appeal.status === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {suspensionData.appeal.status.charAt(0).toUpperCase() + suspensionData.appeal.status.slice(1)}
                </span>
              </div>
              <p className="text-gray-700 mb-3">{suspensionData.appeal.reason}</p>
              <p className="text-sm text-gray-500 mb-3">
                Submitted {formatDistanceToNow(new Date(suspensionData.appeal.submittedAt))} ago
              </p>
              {suspensionData.appeal.adminResponse && (
                <div className="bg-white border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-600 mb-1">Admin Response:</p>
                  <p className="text-gray-800">{suspensionData.appeal.adminResponse}</p>
                </div>
              )}
            </div>
          ) : (suspensionData.type !== 'ip' && suspensionData.canAppeal) && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="flex items-center space-x-2 mb-3">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <h3 className="font-semibold text-green-900">Appeal This Suspension</h3>
              </div>
              <p className="text-green-700 mb-4">
                If you believe this suspension was issued in error, you can submit an appeal for admin review.
              </p>
              
              {!showAppealForm ? (
                <button
                  onClick={() => setShowAppealForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Submit Appeal
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Explain why you believe this suspension should be lifted (minimum 20 characters):
                    </label>
                    <textarea
                      value={appealReason}
                      onChange={(e) => setAppealReason(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      rows={4}
                      maxLength={1000}
                      placeholder="Please provide a detailed explanation of why you believe this suspension was issued in error..."
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>{appealReason.length < 20 ? `${20 - appealReason.length} more characters needed` : 'Ready to submit'}</span>
                      <span>{appealReason.length}/1000</span>
                    </div>
                  </div>
                  
                  {appealError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-700 text-sm">{appealError}</p>
                    </div>
                  )}
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSubmitAppeal}
                      disabled={isSubmittingAppeal || appealReason.length < 20}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      {isSubmittingAppeal ? 'Submitting...' : 'Submit Appeal'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAppealForm(false);
                        setAppealReason('');
                        setAppealError('');
                      }}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {suspensionData.type === 'ip' && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
              <div className="flex items-center space-x-2 mb-3">
                <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <h3 className="font-semibold text-orange-900">IP Address Restriction</h3>
              </div>
              <div className="text-orange-800 space-y-2">
                <p>Your IP address has been suspended from accessing this service. This restriction affects all accounts accessed from your current network location.</p>
                <p>IP suspensions cannot be appealed through the user interface. If you believe this suspension was issued in error, please contact support through alternative means.</p>
              </div>
            </div>
          )}

          {appealSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-green-800 font-medium">Appeal submitted successfully! An admin will review it shortly.</p>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-yellow-900 mb-2">
                  {suspensionData.type === 'ip' ? 'Access Restrictions' : 'Account Restrictions'}
                </h3>
                <ul className="text-yellow-800 space-y-1 text-sm">
                  {suspensionData.type === 'ip' ? (
                    <>
                      <li>• Complete access blocked from this IP address</li>
                      <li>• All accounts accessed from this network are affected</li>
                      <li>• Cannot create new accounts from this IP</li>
                      <li>• Service access restored when suspension expires or is lifted</li>
                    </>
                  ) : (
                    <>
                      <li>• Cannot access game features or save progress</li>
                      <li>• Cannot modify profile settings or information</li>
                      <li>• Cannot interact with other users or community features</li>
                      <li>• Limited to account management actions only</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onRefreshStatus}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              <span>Check Status</span>
            </button>
            
            <button
              onClick={onLogout}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              <span>Logout</span>
            </button>
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M10 5a2 2 0 00-2 2v6a2 2 0 004 0V7a2 2 0 00-2-2zM8 7a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V7z" clipRule="evenodd" />
              </svg>
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-10">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M10 5a2 2 0 00-2 2v6a2 2 0 004 0V7a2 2 0 00-2-2zM8 7a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V7z" clipRule="evenodd" />
              </svg>
              Delete Account - Step {deleteStep}/3
            </h3>

            {deleteStep === 1 && (
              <div>
                <p className="text-gray-700 mb-4">
                  <strong className="text-red-600">Warning:</strong> This action is permanent and cannot be undone. 
                  All your game data, progress, and account information will be permanently deleted.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {deleteStep === 2 && (
              <div>
                <p className="text-gray-700 mb-4">
                  Please provide a detailed reason for deleting your account (minimum 20 characters):
                </p>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 p-3 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none"
                  rows={4}
                  placeholder="e.g., No longer interested in the game, privacy concerns, etc."
                />
                <p className="text-sm text-gray-500 mt-1">{deleteReason.length}/20 characters minimum</p>
                <div className="flex space-x-3 mt-4">
                  <button
                    onClick={() => setDeleteStep(1)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg"
                    disabled={deleteReason.length < 20}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {deleteStep === 3 && (
              <div>
                <p className="text-gray-700 mb-4">
                  <strong className="text-red-600">Final confirmation:</strong> Type exactly 
                  <code className="bg-gray-100 px-2 py-1 rounded mx-1 text-red-600 font-mono">DELETE {suspensionData.issuedBy}</code> 
                  to permanently delete your account:
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 p-3 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none"
                  placeholder={`DELETE ${suspensionData.issuedBy}`}
                />
                <div className="flex space-x-3 mt-4">
                  <button
                    onClick={() => setDeleteStep(2)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg"
                    disabled={isDeleting}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg"
                    disabled={confirmText !== `DELETE ${suspensionData.issuedBy}` || isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Forever'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuspensionModal; 