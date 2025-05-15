import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, CheckCircle, Play, RefreshCcw, AlertCircle } from 'lucide-react';
import { sendVerificationEmail } from '../../services/emailService';
import { verifyEmail } from '../../services/userService';

type AuthModalProps = {
  onClose: () => void;
  onLogin: (userData: { id: string; username: string; email?: string; isGuest?: boolean }) => void;
};

export default function AuthModal({ onClose, onLogin }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGuestLogin = () => {
    const guestId = `guest_${Date.now()}`;
    const guestUsername = `Guest_${Math.floor(Math.random() * 1000)}`;
    onLogin({
      id: guestId,
      username: guestUsername,
      isGuest: true
    });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (activeTab === 'register' && !username.trim()) {
      setError('Username is required for registration');
      return;
    }
    
    if (!isCodeSent) {
      setIsLoading(true);
      try {
        const emailSent = await sendVerificationEmail(
          email, 
          '', 
          activeTab === 'register' ? username : undefined
        );
        
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
        const { success, user, message } = await verifyEmail(email, verificationCode);
        
        if (success && user) {
          setError(null);
          setIsVerifying(true);
          
          const finalUsername = activeTab === 'register' ? username : user.username;
          
          setTimeout(() => {
            onLogin({
              id: user.id || email,
              username: finalUsername || email.split('@')[0],
              email: user.email || email,
              isGuest: user.isGuest || false
            });
          }, 1500);
        } else {
          setError(message || 'Invalid or expired verification code.');
          setIsLoading(false);
          console.error('Verification failed:', message);
        }
      } catch (err) {
        console.error('Error during code verification:', err);
        setError('An error occurred. Please try again later.');
        setIsLoading(false);
      }
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      const emailSent = await sendVerificationEmail(
        email, 
        '', 
        activeTab === 'register' ? username : undefined
      );
      
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

  const handleTabChange = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setError(null);
    if (isCodeSent) {
      setIsCodeSent(false);
      setVerificationCode('');
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
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <button
              onClick={handleGuestLogin}
              className="w-full py-3 px-4 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Play size={20} />
              Play as Guest
            </button>
            <p className="text-center text-sm text-gray-500 mt-2">
              Game data will only be saved locally on this device
            </p>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or create an account for cloud saves</span>
            </div>
          </div>

          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => handleTabChange('login')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'login'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => handleTabChange('register')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'register'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Register (Recommended)
            </button>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {!isCodeSent ? (
              <>
                {activeTab === 'register' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Choose Your Username <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full py-2 px-4 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., d0mkaaa"
                        required={activeTab === 'register'}
                        disabled={isLoading}
                      />
                      <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">This will be displayed in the game and leaderboards</p>
                  </div>
                )}

                <div>
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
              </>
            ) : (
              <div>
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
            )}

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
                  {isCodeSent ? 'Verifying...' : 'Sending Code...'}
                </>
              ) : (
                <>
                  {isCodeSent ? (
                    <>
                      <CheckCircle size={18} />
                      Verify Code
                    </>
                  ) : (
                    <>
                      <ArrowRight size={18} />
                      {activeTab === 'login' ? 'Login with Email' : 'Create Account'}
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          {!isCodeSent && (
            <p className="mt-4 text-xs text-gray-500 text-center">
              {activeTab === 'login' 
                ? "Don't have an account? Click Register above." 
                : "We'll send a verification code to your email"}
            </p>
          )}
          
          {activeTab === 'login' && !isCodeSent && (
            <p className="mt-2 text-xs text-red-500 text-center">
              Note: If you haven't registered yet, please click the Register tab
            </p>
          )}

          <AnimatePresence>
            {isVerifying && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
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