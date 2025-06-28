import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Network, AlertTriangle } from 'lucide-react';

interface IPSuspensionModalProps {
  userId: string;
  username: string;
  onClose: () => void;
  onConfirm: (userId: string, reason: string, duration: string) => void;
}

export default function IPSuspensionModal({ userId, username, onClose, onConfirm }: IPSuspensionModalProps) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('24h');
  const [includeConnectedAccounts, setIncludeConnectedAccounts] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!reason.trim() || reason.trim().length < 10) {
      alert('Reason must be at least 10 characters long');
      return;
    }
    
    setIsLoading(true);
    try {
      await onConfirm(userId, reason.trim(), duration);
    } catch (error) {
      console.error('Error creating IP suspension:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleBackdropClick}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 bg-red-600 text-white rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Network size={24} className="mr-3" />
              <div>
                <h3 className="text-lg font-semibold">IP Suspend User</h3>
                <p className="text-red-100 text-sm">Suspend {username} by IP address</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle size={20} className="text-yellow-600 mr-3 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Warning: IP Suspension</p>
                <p>This will suspend the user's IP address, preventing them from accessing the service from their current network. This action will be logged.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for IP Suspension *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for IP suspension..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="1h">1 Hour</option>
              <option value="6h">6 Hours</option>
              <option value="24h">24 Hours</option>
              <option value="3d">3 Days</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="permanent">Permanent</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeConnected"
              checked={includeConnectedAccounts}
              onChange={(e) => setIncludeConnectedAccounts(e.target.checked)}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <label htmlFor="includeConnected" className="ml-2 text-sm text-gray-700">
              Also suspend accounts that have used this IP
            </label>
          </div>
        </div>

        <div className="p-6 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason.trim() || reason.trim().length < 10 || isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Suspending...' : 'Suspend IP'}
          </button>
        </div>
      </motion.div>
    </div>
  );
} 