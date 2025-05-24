import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, CheckCircle, RefreshCcw, AlertCircle, Info } from 'lucide-react';
import { sendVerificationEmail } from '../../services/emailService';
import { verifyEmail, checkRegisteredEmail, saveAuthToken } from '../../services/userService';
import { NORMALIZED_API_URL } from '../../config/apiConfig';

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
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isUsernameStep, setIsUsernameStep] = useState(false);
  const [autoVerifyCode, setAutoVerifyCode] = useState('');
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);
  const [codeInputFocused, setCodeInputFocused] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const loginTimeoutRef = useRef<number | null>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (loginTimeoutRef.current) {
        window.clearTimeout(loginTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (verificationCode.length === 6 && isCodeSent && !isLoading) {
      handleAutoVerification();
    }
  }, [verificationCode, isCodeSent, isLoading]);

  useEffect(() => {
    if (isCodeSent && codeInputRef.current) {
      setTimeout(() => {
        codeInputRef.current?.focus();
      }, 100);
    }
  }, [isCodeSent]);

  const handleAutoVerification = async () => {
    if (isAutoVerifying) return;
    
    setIsAutoVerifying(true);
    setError(null);
    
    try {
      const { success, user, message, isNewRegistration } = await verifyEmail(email, verificationCode);
      
      if (success) {
        setSuccessMessage('Email verified successfully!');
        
        if (isNewRegistration || !user?.username || (user?.username && user.username.includes('@'))) {
          setIsUsernameStep(true);
          setIsAutoVerifying(false);
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
        }, 1500);
      } else {
        setError(message || 'Invalid or expired verification code.');
      }
    } catch (err) {
      console.error('Error during auto verification:', err);
      setError('An error occurred during verification.');
    } finally {
      setIsAutoVerifying(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setSuccessMessage(null);
    
    if (!isCodeSent) {
      setIsLoading(true);
      try {
        const { exists } = await checkRegisteredEmail(email);
        setIsNewUser(!exists);
        
        const emailResult = await sendVerificationEmail(email, '', username);
        
        if (emailResult.success) {
          setIsCodeSent(true);
          setError(null);
          setSuccessMessage('Verification code sent to your email!');
          
          if (emailResult.isExistingCode) {
            setInfoMessage('You already have a valid verification code. It will expire 10 minutes after it was first created.');
          }
        } else {
          setError(emailResult.message || 'Failed to send verification email. Please try again.');
        }
      } catch (err) {
        console.error('Error during email verification:', err);
        setError('An error occurred. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!isAutoVerifying) {
        setIsLoading(true);
        try {
          const { success, user, message, isNewRegistration } = await verifyEmail(email, verificationCode);
          
          if (success) {
            setError(null);
            setSuccessMessage('Email verified successfully!');
            
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
        const response = await fetch(`${NORMALIZED_API_URL}/api/user/update-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, username })
      });
      
      const data = await response.json();
      console.log('Username update response:', data);
      
      if (data.success) {
        setError(null);
        
        if (data.token) {
          console.log(`Token received from username update: ${data.token.substring(0, 15)}...`);
          saveAuthToken(data.token);
        } else {
          console.warn('No token received from username update');
        }
        
        setIsVerifying(true);
        
        if (loginTimeoutRef.current) {
          window.clearTimeout(loginTimeoutRef.current);
        }

        loginTimeoutRef.current = window.setTimeout(() => {
          onLogin({
            id: data.user?.id || email,
            username: data.user?.username || username,
            email: data.user?.email || email
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
    setInfoMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);
    
    try {
      const emailResult = await sendVerificationEmail(email, '', username);
      
      if (emailResult.success) {
        setSuccessMessage('New verification code sent!');
        setInfoMessage(emailResult.isExistingCode 
          ? 'You already have a valid verification code. Remember, it will expire 10 minutes after it was first created.' 
          : 'A new verification code has been sent to your email.');
      } else {
        setError(emailResult.message || 'Failed to resend verification email. Please try again.');
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-blue-500/20 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-white/20"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="p-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/50 via-teal-600/50 to-blue-600/50 backdrop-blur-sm"></div>
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Welcome to NeighborVille
              </h2>
              <p className="text-emerald-100 text-sm mt-1">
                {!isCodeSent ? 'Sign in or create account' : 'Verify your email'}
              </p>
            </div>
            {!isUsernameStep && (
              <button 
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                ×
              </button>
            )}
          </div>
          
          {/* Progress indicator */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
            <motion.div
              className="h-full bg-white/60"
              initial={{ width: "33%" }}
              animate={{ 
                width: isUsernameStep ? "100%" : isCodeSent ? "66%" : "33%" 
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="p-8">
          {isUsernameStep ? (
            <motion.form 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleUsernameSubmit} 
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                  <User className="text-white" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Username</h3>
                <p className="text-gray-600">
                  {isNewUser 
                    ? "Welcome to NeighborVille! Let's set up your profile."
                    : "Please choose a username to continue to the game."}
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="w-full py-3 px-4 pl-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-gray-50 focus:bg-white"
                      placeholder="e.g., d0mkaaa"
                      required
                      minLength={3}
                      disabled={isLoading}
                    />
                    <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                  </div>
                  <div className="text-xs text-gray-500 mt-2 space-y-1 bg-gray-50 p-3 rounded-lg">
                    <p>✓ Will be displayed in game and leaderboards</p>
                    <p>✓ Must be at least 3 characters</p>
                    <p>✓ Cannot be an email address</p>
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start"
                  >
                    <AlertCircle size={18} className="text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </motion.div>
                )}

                <button
                  type="submit"
                  className={`w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center justify-center gap-3 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Setting Username...
                    </>
                  ) : (
                    <>
                      <ArrowRight size={20} />
                      Continue to Game
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          ) : !isCodeSent ? (
            <motion.form 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleEmailSubmit} 
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                  <Mail className="text-white" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Sign In or Register</h3>
                <p className="text-gray-600">
                  Enter your email address to continue. We'll send you a secure verification code.
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full py-3 px-4 pl-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
                      placeholder="you@example.com"
                      required
                      disabled={isLoading}
                    />
                    <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start"
                  >
                    <AlertCircle size={18} className="text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </motion.div>
                )}

                {infoMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start"
                  >
                    <Info size={18} className="text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700 font-medium">{infoMessage}</p>
                  </motion.div>
                )}

                {successMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start"
                  >
                    <CheckCircle size={18} className="text-emerald-500 mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-emerald-700 font-medium">{successMessage}</p>
                  </motion.div>
                )}

                <button
                  type="submit"
                  className={`w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all flex items-center justify-center gap-3 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending Code...
                    </>
                  ) : (
                    <>
                      <ArrowRight size={20} />
                      Send Verification Code
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.form 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleEmailSubmit} 
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <Lock className="text-white" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h3>
                <p className="text-gray-600">
                  We've sent a 6-digit verification code to <br />
                  <span className="font-semibold text-gray-800">{email}</span>
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <div className="relative">
                    <input
                      ref={codeInputRef}
                      type="text"
                      value={verificationCode}
                      onChange={e => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setVerificationCode(value);
                      }}
                      onFocus={() => setCodeInputFocused(true)}
                      onBlur={() => setCodeInputFocused(false)}
                      className={`w-full py-3 px-4 pl-12 border-2 rounded-xl focus:ring-2 focus:ring-teal-500 transition-all text-center text-lg font-mono tracking-widest ${
                        codeInputFocused || verificationCode
                          ? 'border-teal-300 bg-white'
                          : 'border-gray-200 bg-gray-50'
                      } ${
                        verificationCode.length === 6
                          ? 'border-emerald-300 bg-emerald-50'
                          : ''
                      }`}
                      placeholder="123456"
                      required
                      disabled={isLoading || isAutoVerifying}
                      maxLength={6}
                    />
                    <Lock className={`absolute left-4 top-3.5 transition-colors ${
                      codeInputFocused || verificationCode
                        ? 'text-teal-500'
                        : 'text-gray-400'
                    }`} size={18} />
                    {verificationCode.length === 6 && (
                      <CheckCircle className="absolute right-4 top-3.5 text-emerald-500" size={18} />
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-2 flex justify-between items-center">
                    <span>Enter the 6-digit code from your email</span>
                    <span className={`font-mono ${verificationCode.length === 6 ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {verificationCode.length}/6
                    </span>
                  </div>
                </div>

                {(error || infoMessage || successMessage) && (
                  <div className="space-y-2">
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start"
                      >
                        <AlertCircle size={18} className="text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 font-medium">{error}</p>
                      </motion.div>
                    )}

                    {infoMessage && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start"
                      >
                        <Info size={18} className="text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-700 font-medium">{infoMessage}</p>
                      </motion.div>
                    )}

                    {successMessage && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start"
                      >
                        <CheckCircle size={18} className="text-emerald-500 mr-3 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-emerald-700 font-medium">{successMessage}</p>
                      </motion.div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {!isAutoVerifying && verificationCode.length < 6 && (
                    <button
                      type="submit"
                      className={`w-full py-3 px-6 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:from-teal-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-3 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                      disabled={isLoading || verificationCode.length === 0}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={20} />
                          Verify Code
                        </>
                      )}
                    </button>
                  )}

                  {isAutoVerifying && (
                    <div className="w-full py-3 px-6 bg-gradient-to-r from-emerald-400 to-teal-400 text-white rounded-xl flex items-center justify-center gap-3 font-semibold">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Auto-verifying...
                    </div>
                  )}

                  <button 
                    type="button" 
                    onClick={handleResendCode}
                    className="text-sm text-teal-600 hover:text-teal-800 flex items-center justify-center gap-2 py-2 hover:bg-teal-50 rounded-lg transition-colors"
                    disabled={isLoading || isAutoVerifying}
                  >
                    <RefreshCcw size={16} />
                    Resend verification code
                  </button>
                </div>
              </div>
            </motion.form>
          )}

          <AnimatePresence mode="wait">
            {isVerifying && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 rounded-2xl"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-6 shadow-lg">
                  <CheckCircle size={40} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Welcome to NeighborVille!</h3>
                <p className="text-gray-600 text-center mb-4">Your account has been verified successfully.</p>
                <div className="flex items-center gap-2 text-emerald-600">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isVerifying && (
            <div className="mt-6 text-xs text-gray-400 text-center">
              <span>© NeighborVille {new Date().getFullYear()} • Secure Email Verification</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
} 