import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Trash2 } from 'lucide-react';
import { NORMALIZED_API_URL } from '../../config/apiConfig';

interface DeleteUserModalProps {
  userId: string;
  username: string;
  onClose: () => void;
  onUserDeleted: () => void;
}

export default function DeleteUserModal({ userId, username, onClose, onUserDeleted }: DeleteUserModalProps) {
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = reason.length >= 20 && confirmText === `DELETE ${username}`;

  const handleDelete = async () => {
    if (!canDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        onUserDeleted();
        onClose();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
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
                Type "DELETE {username}" to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder={`DELETE ${username}`}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={!canDelete || isDeleting}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300"
            >
              {isDeleting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Trash2 size={16} className="mr-2" />
              )}
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 