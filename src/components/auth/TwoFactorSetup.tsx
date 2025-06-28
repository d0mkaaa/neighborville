import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Copy, Check, AlertCircle, RefreshCw, Download, Eye, EyeOff, Smartphone, Key } from 'lucide-react';
import { NORMALIZED_API_URL } from '../../config/apiConfig';

interface TwoFactorSetupProps {
  onClose: () => void;
  onComplete: () => void;
}

interface TwoFactorData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export default function TwoFactorSetup({ onClose, onComplete }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup' | 'complete'>('setup');
  const [twoFactorData, setTwoFactorData] = useState<TwoFactorData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [backupCodesSaved, setBackupCodesSaved] = useState(false);

  useEffect(() => {
    generateTwoFactorSecret();
  }, []);

  const generateTwoFactorSecret = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${NORMALIZED_API_URL}/api/user/2fa/setup`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setTwoFactorData({
          secret: data.secret,
          qrCodeUrl: data.qrCodeUrl,
          backupCodes: data.backupCodes
        });
      } else {
        setError(data.message || 'Failed to generate 2FA secret');
      }
    } catch (error) {
      console.error('Error generating 2FA secret:', error);
      setError('Failed to setup 2FA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${NORMALIZED_API_URL}/api/user/2fa/verify-setup`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: verificationCode
        })
      });

      const data = await response.json();
      if (data.success) {
        setStep('backup');
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      setError('Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const completeTwoFactorSetup = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${NORMALIZED_API_URL}/api/user/2fa/complete-setup`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setStep('complete');
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        setError(data.message || 'Failed to complete 2FA setup');
      }
    } catch (error) {
      console.error('Error completing 2FA setup:', error);
      setError('Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'secret' | 'backup') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'secret') {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedBackup(text);
        setTimeout(() => setCopiedBackup(null), 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const downloadBackupCodes = () => {
    if (!twoFactorData) return;
    
    const content = `Neighborville 2FA Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n${twoFactorData.backupCodes.join('\n')}\n\nKeep these codes safe and secure. Each code can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'neighborville-2fa-backup-codes.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setBackupCodesSaved(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step === 'verify') {
      verifyAndEnable2FA();
    }
  };

  const renderSetupStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Setup Two-Factor Authentication
        </h3>
        <p className="text-gray-600">
          Scan the QR code with your authenticator app or enter the secret manually
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : twoFactorData && (
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <img 
                src={twoFactorData.qrCodeUrl}
                alt="2FA QR Code"
                className="w-48 h-48"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Manual Entry Key
              </label>
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="text-gray-500 hover:text-gray-700"
              >
                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type={showSecret ? 'text' : 'password'}
                value={twoFactorData.secret}
                readOnly
                className="flex-1 px-3 py-2 text-sm font-mono bg-white border border-gray-200 rounded"
              />
              <button
                onClick={() => copyToClipboard(twoFactorData.secret, 'secret')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                {copiedSecret ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
              <Smartphone className="w-4 h-4 mr-2" />
              Setup Instructions
            </h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Install an authenticator app (Google Authenticator, Authy, etc.)</li>
              <li>Scan the QR code or enter the secret key manually</li>
              <li>Enter the 6-digit code from your app to verify</li>
            </ol>
          </div>

          <button
            onClick={() => setStep('verify')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Continue to Verification
          </button>
        </div>
      )}
    </div>
  );

  const renderVerifyStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Key className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Verify Your Setup
        </h3>
        <p className="text-gray-600">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verification Code
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setVerificationCode(value);
              setError('');
            }}
            onKeyPress={handleKeyPress}
            placeholder="000000"
            className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={6}
            autoComplete="off"
          />
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={() => setStep('setup')}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={verifyAndEnable2FA}
            disabled={loading || verificationCode.length !== 6}
            className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify & Enable'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderBackupStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
          <Download className="w-8 h-8 text-yellow-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Save Your Backup Codes
        </h3>
        <p className="text-gray-600">
          Store these codes safely. You can use them to access your account if you lose your authenticator.
        </p>
      </div>

      {twoFactorData && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2">
              {twoFactorData.backupCodes.map((code, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-white rounded border">
                  <span className="flex-1 font-mono text-sm">{code}</span>
                  <button
                    onClick={() => copyToClipboard(code, 'backup')}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    {copiedBackup === code ? (
                      <Check size={14} className="text-green-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Important:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Each backup code can only be used once</li>
                  <li>Store them in a secure location</li>
                  <li>Don't share them with anyone</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={downloadBackupCodes}
              className="flex-1 bg-yellow-600 text-white py-3 px-4 rounded-lg hover:bg-yellow-700 transition-colors font-medium flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Codes
            </button>
            <button
              onClick={completeTwoFactorSetup}
              disabled={loading || !backupCodesSaved}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Complete Setup'}
            </button>
          </div>

          {!backupCodesSaved && (
            <p className="text-sm text-gray-600 text-center">
              Please download your backup codes before completing setup
            </p>
          )}
        </div>
      )}
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          2FA Successfully Enabled!
        </h3>
        <p className="text-gray-600">
          Your account is now protected with two-factor authentication.
        </p>
      </div>
      <div className="bg-green-50 rounded-lg p-4">
        <p className="text-sm text-green-800">
          You'll need to enter a verification code from your authenticator app each time you log in.
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Two-Factor Authentication
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 'setup' && renderSetupStep()}
              {step === 'verify' && renderVerifyStep()}
              {step === 'backup' && renderBackupStep()}
              {step === 'complete' && renderCompleteStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
} 