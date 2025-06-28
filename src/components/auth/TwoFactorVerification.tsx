import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, AlertTriangle, Key, Smartphone, HelpCircle } from 'lucide-react';
import { NORMALIZED_API_URL } from '../../config/apiConfig';

interface TwoFactorVerificationProps {
  userId: string;
  onSuccess: (userData: any) => void;
  onBack: () => void;
  onError: (error: string) => void;
}

export default function TwoFactorVerification({ userId, onSuccess, onBack, onError }: TwoFactorVerificationProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBackupCode, setIsBackupCode] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleVerification = async () => {
    if (!verificationCode) {
      setError('Please enter a verification code');
      return;
    }

    if (!isBackupCode && verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    if (isBackupCode && verificationCode.length !== 8) {
      setError('Please enter a valid 8-character backup code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/user/login/2fa-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          userId, 
          token: verificationCode 
        })
      });

      const data = await response.json();
      
      if (data.success) {
        onSuccess(data.user);
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    if (isBackupCode) {
      const cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
      setVerificationCode(cleanValue);
    } else {
      const cleanValue = value.replace(/\D/g, '').slice(0, 6);
      setVerificationCode(cleanValue);
    }
    setError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && verificationCode.length > 0) {
      handleVerification();
    }
  };

  const toggleCodeType = () => {
    setIsBackupCode(!isBackupCode);
    setVerificationCode('');
    setError('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield size={32} className="text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Two-Factor Authentication</h2>
        <p className="text-gray-600">
          {isBackupCode 
            ? 'Enter one of your backup codes to continue'
            : 'Enter the 6-digit code from your authenticator app'
          }
        </p>
      </div>

      <div className="space-y-6">
        <div className="relative">
          <div className="flex items-center justify-center mb-4">
            {isBackupCode ? (
              <Key size={24} className="text-gray-400" />
            ) : (
              <Smartphone size={24} className="text-gray-400" />
            )}
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={verificationCode}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isBackupCode ? 'ABCD1234' : '000000'}
            className={`w-full text-center text-2xl font-mono tracking-widest p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              error ? 'border-red-300 bg-red-50' : ''
            }`}
            maxLength={isBackupCode ? 8 : 6}
            autoComplete="off"
          />
          
          <p className="text-sm text-gray-500 text-center mt-2">
            {isBackupCode 
              ? 'Enter an 8-character backup code'
              : 'Enter the 6-digit code from your app'
            }
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg"
          >
            <AlertTriangle size={16} />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleVerification}
            disabled={loading || verificationCode.length === 0}
            className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Verifying...
              </>
            ) : (
              'Verify & Continue'
            )}
          </button>

          <button
            onClick={toggleCodeType}
            className="w-full px-6 py-2 text-blue-600 hover:text-blue-800 transition-colors text-sm"
          >
            {isBackupCode 
              ? 'Use authenticator app instead'
              : 'Use backup code instead'
            }
          </button>
        </div>

        <div className="border-t pt-4">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center justify-center w-full text-gray-600 hover:text-gray-800 transition-colors text-sm"
          >
            <HelpCircle size={16} className="mr-2" />
            Need help?
          </button>
          
          {showHelp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 p-4 bg-gray-50 rounded-lg text-sm text-gray-600"
            >
              <div className="space-y-2">
                <p><strong>Authenticator App:</strong> Open your authenticator app (Google Authenticator, Authy, etc.) and enter the 6-digit code for Neighborville.</p>
                <p><strong>Backup Code:</strong> If you don't have access to your phone, use one of the 8-character backup codes you saved during setup.</p>
                <p><strong>Lost Access?</strong> Contact support if you've lost access to both your authenticator app and backup codes.</p>
              </div>
            </motion.div>
          )}
        </div>

        <button
          onClick={onBack}
          className="flex items-center justify-center w-full text-gray-600 hover:text-gray-800 transition-colors text-sm pt-4 border-t"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to login
        </button>
      </div>
    </motion.div>
  );
} 