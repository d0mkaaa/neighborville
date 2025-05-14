import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight, CheckCircle, Play, RefreshCcw, AlertCircle } from 'lucide-react';
import { sendVerificationEmail } from '../../services/emailService';
import { verifyEmail } from '../../services/userService';

type AuthModalProps = {
  onClose: () => void;
  onLogin: (userData: { id: string; username: string; email?: string; isGuest?: boolean }) => void;
};

export default function AuthModal({ onClose, onLogin }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
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
    
    if (!isCodeSent) {
      setIsLoading(true);
      try {
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
        const { success, user, message } = await verifyEmail(email, verificationCode);
        
        if (success && user) {
          setError(null);
          setIsVerifying(true);
          
          setTimeout(() => {
            onLogin({
              id: user.id || email,
              username: user.username || username || email.split('@')[0],
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
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex justify-between items-center">
          <h2 className="text-lg font-medium">
            Welcome to NeighborVille
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={20} />
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
              <span className="px-2 bg-white text-gray-500">Or sign in for cloud saves</span>
            </div>
          </div>

          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('login')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'login'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'register'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {!isCodeSent ? (
              <>
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

                {activeTab === 'register' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full py-2 px-4 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Choose a username"
                        required={activeTab === 'register'}
                        disabled={isLoading}
                      />
                      <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    </div>
                  </div>
                )}
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
                  Processing...
                </>
              ) : (
                <>
                  {isCodeSent ? 'Verify Code' : 'Continue'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {isCodeSent && !error && !isVerifying && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center gap-2 text-green-700">
              <CheckCircle size={18} />
              <span className="text-sm">Verification code sent to your email</span>
            </div>
          )}
          
          {isVerifying && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-6 bg-blue-50 rounded-lg flex flex-col items-center gap-3 text-blue-700"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 260, 
                  damping: 20,
                  delay: 0.2 
                }}
                className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white"
              >
                <motion.div
                  initial={{ opacity: 0, pathLength: 0 }}
                  animate={{ opacity: 1, pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <CheckCircle size={32} />
                </motion.div>
              </motion.div>
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-lg font-medium"
              >
                Verification Successful!
              </motion.span>
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-sm text-blue-600 text-center"
              >
                Logging you in...
              </motion.span>
            </motion.div>
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
} 