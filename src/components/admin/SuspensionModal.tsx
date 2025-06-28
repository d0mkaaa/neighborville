import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, UserMinus, Shield, AlertTriangle, Network } from 'lucide-react';

interface SuspensionModalProps {
  userId: string;
  username: string;
  currentlySuspended: boolean;
  onClose: () => void;
  onConfirm: (userId: string, reason: string, alsoSuspendIP: boolean, duration: number) => void;
}

export default function SuspensionModal({
  userId,
  username,
  currentlySuspended,
  onClose,
  onConfirm
}: SuspensionModalProps) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(24);
  const [alsoSuspendIP, setAlsoSuspendIP] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!currentlySuspended && (!reason.trim() || reason.trim().length < 10)) {
      return;
    }

    setLoading(true);
    try {
      await onConfirm(userId, reason.trim(), alsoSuspendIP, duration);
      onClose();
    } catch (error) {
      console.error('Error processing suspension:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-xl shadow-xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`p-6 ${currentlySuspended ? 'bg-green-600' : 'bg-red-600'} text-white rounded-t-xl`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {currentlySuspended ? (
                <Shield size={24} className="mr-3" />
              ) : (
                <UserMinus size={24} className="mr-3" />
              )}
              <div>
                <h3 className="text-lg font-semibold">
                  {currentlySuspended ? 'Unsuspend User' : 'Suspend User'}
                </h3>
                <p className={currentlySuspended ? 'text-green-100' : 'text-red-100'}>
                  {username}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {currentlySuspended ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Shield size={20} className="text-green-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-green-800">Remove Suspension</h4>
                    <p className="text-sm text-green-700 mt-1">
                      This will immediately restore access to {username}'s account.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle size={20} className="text-yellow-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Account Suspension</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      This will prevent the user from accessing the game and most features.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suspension Reason (required, 10-200 characters):
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter the reason for suspension..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={3}
                  maxLength={200}
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>
                    {reason.length < 10 ? `${10 - reason.length} more characters needed` : 'Ready'}
                  </span>
                  <span>{reason.length}/200</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (hours):
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value={1}>1 hour</option>
                  <option value={6}>6 hours</option>
                  <option value={12}>12 hours</option>
                  <option value={24}>1 day</option>
                  <option value={72}>3 days</option>
                  <option value={168}>1 week</option>
                  <option value={720}>1 month</option>
                  <option value={8760}>1 year</option>
                  <option value={999999}>Permanent</option>
                </select>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="alsoSuspendIP"
                    checked={alsoSuspendIP}
                    onChange={(e) => setAlsoSuspendIP(e.target.checked)}
                    className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <label htmlFor="alsoSuspendIP" className="flex items-center cursor-pointer">
                      <Network size={16} className="text-orange-600 mr-2" />
                      <span className="font-medium text-orange-800">Also suspend IP address</span>
                    </label>
                    <p className="text-sm text-orange-700 mt-1">
                      This will prevent access from their current IP address, affecting any other accounts they may have.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || (!currentlySuspended && (reason.length < 10))}
            className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
              currentlySuspended 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {loading ? 'Processing...' : (
              currentlySuspended ? 'Remove Suspension' : 'Suspend User'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
} 