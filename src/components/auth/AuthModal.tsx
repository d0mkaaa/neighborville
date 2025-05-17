import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, CheckCircle, RefreshCcw, AlertCircle } from 'lucide-react';
import { sendVerificationEmail } from '../../services/emailService';
import { verifyEmail, checkRegisteredEmail } from '../../services/userService';

type AuthModalProps = {
  onClose: () => void;
  onLogin: (userData: { id: string; username: string; email?: string }) => void;
};

export default function AuthModal({ onClose, onLogin }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isUsernameStep, setIsUsernameStep] = useState(false);
  const loginTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (loginTimeoutRef.current) {
        window.clearTimeout(loginTimeoutRef.current);
      }
    };
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!isCodeSent) {
      setIsLoading(true);
      try {
        const { exists } = await checkRegisteredEmail(email);
        setIsNewUser(!exists);
        
        const emailSent = await sendVerificationEmail(email, '', username);
        
        if (emailSent) {
          setIsCodeSent(true);
          setError(null);
        } else {
          setError('Failed to send verification email. Please try again.');
        }
      } catch (err) {
        console.error('Error during email verification:', err);
        setError('An error occurred. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(true);
      try {
        const { success, user, message, isNewRegistration } = await verifyEmail(email, verificationCode);
        
        if (success) {
          setError(null);
          
          if (isNewRegistration || !user?.username || (user?.username && user.username.includes('@'))) {
            setIsUsernameStep(true);
            setIsLoading(false);
            return;
          }
          
          setIsVerifying(true);
          
          if (loginTimeoutRef.current) {
            window.clearTimeout(loginTimeoutRef.current);
          }

          loginTimeoutRef.current = window.setTimeout(() => {
            onLogin({
              id: user.id || email,
              username: user.username || email.split('@')[0],
              email: user.email || email
            });
            
            setIsVerifying(false);
          }, 1000);
        } else {
          setError(message || 'Invalid or expired verification code.');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error during code verification:', err);
        setError('An error occurred. Please try again later.');
        setIsLoading(false);
      }
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    
    if (username.includes('@')) {
      setError('Username cannot contain @ symbol');
      return;
    }
    
    setIsLoading(true);
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/user/update-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, username })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setError(null);
        setIsVerifying(true);
        
        if (loginTimeoutRef.current) {
          window.clearTimeout(loginTimeoutRef.current);
        }

        loginTimeoutRef.current = window.setTimeout(() => {
          onLogin({
            id: data.user?.id || email,
            username: username,
            email: email
          });
          
          setIsVerifying(false);
        }, 1000);
      } else {
        console.error('Username update failed:', data.message);
        setError(data.message || 'Failed to set username. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error setting username:', err);
      setError('An error occurred. Please try again later.');
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      const emailSent = await sendVerificationEmail(email, '', username);
      
      if (emailSent) {
        setError(null);
      } else {
        setError('Failed to resend verification email. Please try again.');
      }
    } catch (err) {
      console.error('Error during email verification:', err);
      setError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
      >
        <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex justify-between items-center">
          <h2 className="text-lg font-medium">
            Welcome to NeighborVille
          </h2>
          {/* Only show close button if not in the mandatory username step */}
          {!isUsernameStep && (
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              ×
            </button>
          )}
        </div>

        <div className="p-6">
          {isUsernameStep ? (
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Choose Your Username</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {isNewUser 
                    ? "You're new to NeighborVille! Please choose a username for your profile."
                    : "Please set a username to continue to the game."}
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full py-2 px-4 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., d0mkaaa"
                    required
                    minLength={3}
                    disabled={isLoading}
                  />
                  <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
                <div className="text-xs text-gray-500 mt-1 space-y-1">
                  <p>This will be displayed in the game and leaderboards</p>
                  <p>Must be at least 3 characters</p>
                  <p>Cannot be an email address</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start">
                  <AlertCircle size={18} className="text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                className={`w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Setting Username...
                  </>
                ) : (
                  <>
                    <ArrowRight size={18} />
                    Continue
                  </>
                )}
              </button>
            </form>
          ) : !isCodeSent ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Sign In or Register</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Enter your email address to continue. We'll send you a verification code.
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full py-2 px-4 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="you@example.com"
                    required
                    disabled={isLoading}
                  />
                  <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start">
                  <AlertCircle size={18} className="text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                className={`w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Code...
                  </>
                ) : (
                  <>
                    <ArrowRight size={18} />
                    Continue
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Verify Your Email</h3>
                <p className="text-sm text-gray-500 mb-4">
                  We've sent a verification code to <span className="font-medium">{email}</span>. Please enter it below.
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value)}
                    className="w-full py-2 px-4 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter code from email"
                    required
                    disabled={isLoading}
                  />
                  <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
                <div className="mt-2">
                  <button 
                    type="button" 
                    onClick={handleResendCode}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    disabled={isLoading}
                  >
                    <RefreshCcw size={14} />
                    Resend verification code
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start">
                  <AlertCircle size={18} className="text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                className={`w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Verify Code
                  </>
                )}
              </button>
            </form>
          )}

          <AnimatePresence mode="wait">
            {isVerifying && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-white flex flex-col items-center justify-center p-6"
              >
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">Success!</h3>
                <p className="text-gray-600 text-center mb-4">Your account has been verified. Logging in...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
} 