import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  ShieldCheck, 
  ShieldOff, 
  Key, 
  Download, 
  Copy, 
  Check, 
  AlertTriangle, 
  RefreshCw,
  Eye,
  EyeOff,
  Smartphone,
  Clock,
  X,
  Fingerprint,
  Plus,
  Trash2
} from 'lucide-react';
import { NORMALIZED_API_URL } from '../../config/apiConfig';
import TwoFactorSetup from '../auth/TwoFactorSetup';

interface TwoFactorStatus {
  enabled: boolean;
  setupCompleted: boolean;
  method: 'totp' | 'sms';
  lastUsed: string | null;
  backupCodesRemaining: number;
}

interface BackupCode {
  code: string;
  used: boolean;
  usedAt: string | null;
}



export default function TwoFactorSettings() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [showNewBackupCodes, setShowNewBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [generating, setGenerating] = useState(false);



  useEffect(() => {
    loadTwoFactorStatus();
  }, []);

  const loadTwoFactorStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${NORMALIZED_API_URL}/api/user/2fa/status`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setStatus(data.twoFactorAuth);
      } else {
        setError(data.message || 'Failed to load 2FA status');
      }
    } catch (error) {
      console.error('Error loading 2FA status:', error);
      setError('Failed to load 2FA status');
    } finally {
      setLoading(false);
    }
  };



  const handleSetupComplete = () => {
    setShowSetup(false);
    setSuccess('2FA has been enabled successfully!');
    loadTwoFactorStatus();
  };

  const disable2FA = async () => {
    if (!disablePassword.trim()) {
      setError('Password is required to disable 2FA');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${NORMALIZED_API_URL}/api/user/2fa/disable`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: disablePassword
        })
      });

      const data = await response.json();
      if (data.success) {
        setStatus(prev => prev ? { ...prev, enabled: false, setupCompleted: false } : null);
        setShowDisableConfirm(false);
        setDisablePassword('');
      } else {
        setError(data.message || 'Failed to disable 2FA');
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      setError('Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBackupCodes = async () => {
    if (!password || !twoFactorCode) {
      setError('Password and 2FA code are required');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/user/2fa/backup-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ password, token: twoFactorCode })
      });

      const data = await response.json();
      
      if (data.success) {
        setBackupCodes(data.backupCodes);
        setShowNewBackupCodes(true);
        setSuccess('New backup codes generated successfully');
        setPassword('');
        setTwoFactorCode('');
        loadTwoFactorStatus();
      } else {
        setError(data.message || 'Failed to generate backup codes');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const copyBackupCodes = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.map(code => code.code).join('\n'));
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    } catch (error) {
      console.error('Failed to copy backup codes:', error);
    }
  };

  const downloadBackupCodes = () => {
    const availableCodes = backupCodes.filter(code => !code.used);
    const content = `Neighborville 2FA Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n${availableCodes.map(code => code.code).join('\n')}\n\nKeep these codes safe and secure. Each code can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'neighborville-2fa-backup-codes.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatLastUsed = (lastUsed: string | null) => {
    if (!lastUsed) return 'Never';
    const date = new Date(lastUsed);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };



  if (loading && !status) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 text-gray-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertTriangle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
          <Check size={16} />
          <span className="text-sm">{success}</span>
        </div>
      )}



      {status && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {status.enabled ? (
                <ShieldCheck className="w-8 h-8 text-green-600" />
              ) : (
                <ShieldOff className="w-8 h-8 text-gray-400" />
              )}
              <div>
                <h3 className="font-medium text-gray-900">
                  Two-Factor Authentication
                </h3>
                <p className="text-sm text-gray-600">
                  {status.enabled ? 'Enabled and protecting your account' : 'Not enabled'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                status.enabled 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {status.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {status.enabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Key className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Last Used</span>
                  </div>
                  <p className="text-sm text-blue-800">{formatLastUsed(status.lastUsed)}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Shield className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-900">Backup Codes</span>
                  </div>
                  <p className="text-sm text-yellow-800">
                    {status.backupCodesRemaining} remaining
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Backup Codes</h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowBackupCodes(true)}
                      disabled={loading}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'View Codes'}
                    </button>
                    <button
                      onClick={() => setShowNewBackupCodes(true)}
                      disabled={generating}
                      className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg transition-colors"
                    >
                      {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Generate New'}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Backup codes can be used to access your account if you lose your authenticator device.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowDisableConfirm(true)}
                  className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors text-sm font-medium"
                >
                  Disable Two-Factor Authentication
                </button>
              </div>
            </div>
          )}

          {!status.enabled && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Enhance Your Security</p>
                    <p>Two-factor authentication adds an extra layer of security to your account by requiring a verification code from your phone in addition to your password.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowSetup(true)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
              >
                <Shield className="w-4 h-4 mr-2" />
                Enable Two-Factor Authentication
              </button>
            </div>
          )}
        </div>
      )}

      {showSetup && (
        <TwoFactorSetup
          onClose={() => setShowSetup(false)}
          onComplete={handleSetupComplete}
        />
      )}

      {showDisableConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Disable Two-Factor Authentication
              </h3>
              <button
                onClick={() => {
                  setShowDisableConfirm(false);
                  setDisablePassword('');
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-1">Security Warning</p>
                    <p>Disabling 2FA will make your account less secure. You'll only need your password to log in.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => {
                    setDisablePassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Your account password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDisableConfirm(false);
                    setDisablePassword('');
                    setError('');
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={disable2FA}
                  disabled={loading || !disablePassword.trim()}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Disable 2FA'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBackupCodes && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Backup Codes
              </h3>
              <button
                onClick={() => setShowBackupCodes(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Important</p>
                    <p>Each backup code can only be used once. Store them in a secure location.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {backupCodes.map((backupCode, index) => (
                  <div key={index} className={`p-2 rounded border flex items-center justify-between ${
                    backupCode.used ? 'bg-gray-100 text-gray-500' : 'bg-white'
                  }`}>
                    <span className="font-mono text-sm">
                      {backupCode.used ? '████████' : backupCode.code}
                    </span>
                    <span className="text-xs">
                      {backupCode.used ? 'Used' : 'Available'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={downloadBackupCodes}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
                <button
                  onClick={() => setShowBackupCodes(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewBackupCodes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Check size={24} className="text-green-600" />
                <h3 className="text-lg font-semibold text-gray-800">New Backup Codes Generated</h3>
              </div>
              <button
                onClick={() => setShowNewBackupCodes(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Save These Codes</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Each code can only be used once. Store them in a safe place.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800">Your New Backup Codes</h4>
                <div className="flex space-x-2">
                  <button
                    onClick={copyBackupCodes}
                    className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {copiedCodes ? <Check size={16} /> : <Copy size={16} />}
                    <span className="ml-1">{copiedCodes ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={downloadBackupCodes}
                    className="flex items-center px-3 py-1 text-sm text-green-600 hover:text-green-800 transition-colors"
                  >
                    <Download size={16} />
                    <span className="ml-1">Download</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="p-2 bg-white rounded border text-center">
                    {code.code}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowNewBackupCodes(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}


    </div>
  );
} 