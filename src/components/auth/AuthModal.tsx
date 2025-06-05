import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, CheckCircle, RefreshCcw, AlertCircle, Info, Shield } from 'lucide-react';
import { sendVerificationEmail } from '../../services/emailService';
import { verifyEmail, checkRegisteredEmail, saveAuthToken, checkLegalAcceptanceRequired, updateLegalAcceptance, isRememberMeEnabled } from '../../services/userService';
import { NORMALIZED_API_URL } from '../../config/apiConfig';
import LegalAcceptance from '../legal/LegalAcceptance';

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
  const [showLegalAcceptance, setShowLegalAcceptance] = useState(false);
  const [pendingUserData, setPendingUserData] = useState<{ id: string; username: string; email?: string } | null>(null);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [legalAcceptanceData, setLegalAcceptanceData] = useState<{ termsOfService: boolean; privacyPolicy: boolean; marketingConsent: boolean } | null>(null);
  const [rememberMe, setRememberMe] = useState(isRememberMeEnabled());
  const [emailSaved, setEmailSaved] = useState(false);
  
  const loginTimeoutRef = useRef<number | null>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem('neighborville_saved_email');
    if (savedEmail && rememberMe) {
      setEmail(savedEmail);
      setEmailSaved(true);
    }
  }, [rememberMe]);

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

  const saveEmailIfRemembered = (emailToSave: string) => {
    if (rememberMe) {
      localStorage.setItem('neighborville_saved_email', emailToSave);
    } else {
      localStorage.removeItem('neighborville_saved_email');
    }
  };

  const handleAutoVerification = async () => {
    if (isAutoVerifying) return;
    
    setIsAutoVerifying(true);
    setError(null);
    
    try {
      const { success, user, message, isNewRegistration } = await verifyEmail(email, verificationCode);
      
      if (success) {
        setSuccessMessage('Email verified successfully!');
        saveEmailIfRemembered(email);
        
        if (isNewRegistration || !user?.username || (user?.username && user.username.includes('@'))) {
          setIsUsernameStep(true);
          setIsAutoVerifying(false);
          return;
        }
        
        const needsLegalAcceptance = checkLegalAcceptanceRequired(user);
        
        const finalUserData = {
          id: user.id || email,
          username: user.username || email.split('@')[0],
          email: user.email || email
        };
        
        if (needsLegalAcceptance) {
          setPendingUserData(finalUserData);
          setShowLegalAcceptance(true);
          setIsAutoVerifying(false);
          return;
        }
        
        setIsVerifying(true);
        loginTimeoutRef.current = window.setTimeout(() => {
          saveLegalAcceptanceAfterLogin(finalUserData);
          setIsVerifying(false);
        }, 1000);
        setIsAutoVerifying(false);
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
      if (!legalAccepted) {
        setShowLegalAcceptance(true);
        return;
      }
      
      setIsLoading(true);
      try {
        const { exists } = await checkRegisteredEmail(email);
        setIsNewUser(!exists);
        saveEmailIfRemembered(email);
        
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
            saveEmailIfRemembered(email);
            
            if (isNewRegistration || !user?.username || (user?.username && user.username.includes('@'))) {
              setIsUsernameStep(true);
              setIsLoading(false);
              return;
            }
            
            const finalUserData = {
              id: user.id || email,
              username: user.username || email.split('@')[0],
              email: user.email || email
            };
            
            const needsLegalAcceptance = checkLegalAcceptanceRequired(user);
            
            if (needsLegalAcceptance) {
              setPendingUserData(finalUserData);
              setShowLegalAcceptance(true);
              setIsLoading(false);
              return;
            }
            
            setIsVerifying(true);
            loginTimeoutRef.current = window.setTimeout(() => {
              saveLegalAcceptanceAfterLogin(finalUserData);
              setIsVerifying(false);
            }, 1000);
            setIsLoading(false);
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
          saveAuthToken(data.token, rememberMe);
        } else {
          console.warn('No token received from username update');
        }
        
        const finalUserData = {
          id: data.user?.id || email,
          username: data.user?.username || username,
          email: data.user?.email || email
        };
        
        const needsLegalAcceptance = data.user ? checkLegalAcceptanceRequired(data.user) : true;
        
        if (needsLegalAcceptance && !legalAccepted) {
          setPendingUserData(finalUserData);
          setShowLegalAcceptance(true);
          setIsLoading(false);
          return;
        }
        
        setIsVerifying(true);
        loginTimeoutRef.current = window.setTimeout(() => {
          saveLegalAcceptanceAfterLogin(finalUserData);
          setIsVerifying(false);
        }, 1000);
        setIsLoading(false);
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

  const saveLegalAcceptanceAfterLogin = async (userData: { id: string; username: string; email?: string }) => {
    if (legalAcceptanceData) {
      try {
        await updateLegalAcceptance({
          ...legalAcceptanceData,
          version: '1.0.0'
        });
        console.log('Legal acceptance saved successfully after login');
      } catch (error) {
        console.error('Failed to save legal acceptance after login:', error);
      }
    }
    
    onLogin(userData);
  };

  const handleLegalAccept = (acceptanceData?: { termsOfService: boolean; privacyPolicy: boolean; marketingConsent: boolean }) => {
    setLegalAccepted(true);
    setShowLegalAcceptance(false);
    setError(null);
    
    if (acceptanceData) {
      setLegalAcceptanceData(acceptanceData);
    }
    
    if (pendingUserData) {
      setIsVerifying(true);
      loginTimeoutRef.current = window.setTimeout(() => {
        saveLegalAcceptanceAfterLogin(pendingUserData);
        setIsVerifying(false);
      }, 1000);
      setPendingUserData(null);
    } else {
      handleEmailSubmit({ preventDefault: () => {} } as React.FormEvent);
    }
  };

  const handleLegalDecline = () => {
    setShowLegalAcceptance(false);
    setLegalAccepted(false);
    setPendingUserData(null);
    setError('You must accept the Privacy Policy and Terms of Service to use NeighborVille.');
  };

  if (showLegalAcceptance) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-blue-500/20 backdrop-blur-md"
      >
        <LegalAcceptance 
          onAccept={handleLegalAccept}
          onDecline={handleLegalDecline}
          isRequired={true}
          skipServerSave={true}
        />
      </motion.div>
    );
  }

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
                {!isCodeSent ? 'Sign in or create account' : 
                 isUsernameStep ? 'Choose your username' : 
                 'Verify your email'}
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
          
          <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
            <motion.div
              className="h-full bg-white/60"
              initial={{ width: "25%" }}
              animate={{ 
                width: isVerifying ? "100%" : isUsernameStep ? "75%" : isCodeSent ? "50%" : "25%" 
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="p-6 space-y-4">
          <AnimatePresence mode="wait">
            {!isCodeSent && !isUsernameStep && !isVerifying && (
              <motion.div
                key="email-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <p className="text-gray-600 text-sm mb-4">
                    Enter your email to sign in or create a new account
                  </p>
                  
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                          required
                        />
                        {emailSaved && (
                          <div className="absolute right-3 top-3 text-emerald-500">
                            <CheckCircle size={18} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-600">Remember me</span>
                      </label>
                      
                      {!legalAccepted && (
                        <button
                          type="button"
                          onClick={() => setShowLegalAcceptance(true)}
                          className="text-sm text-emerald-600 hover:text-emerald-700 underline flex items-center gap-1"
                        >
                          <Shield size={14} />
                          Review Terms
                        </button>
                      )}
                    </div>

                    {legalAccepted && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle size={16} />
                          <span className="text-sm font-medium">Legal requirements accepted</span>
                        </div>
                      </div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading || !legalAccepted}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                        isLoading || !legalAccepted
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <span>Continue</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            )}

            {isCodeSent && !isUsernameStep && !isVerifying && (
              <motion.div
                key="verification-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <p className="text-gray-600 text-sm mb-4">
                    Enter the verification code sent to <span className="font-medium text-gray-800">{email}</span>
                  </p>
                  
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Verification Code</label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                          ref={codeInputRef}
                          type="text"
                          value={verificationCode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setVerificationCode(value);
                          }}
                          onFocus={() => setCodeInputFocused(true)}
                          onBlur={() => setCodeInputFocused(false)}
                          className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-mono text-center text-lg tracking-widest ${
                            codeInputFocused || verificationCode ? 'border-emerald-300' : 'border-gray-200'
                          }`}
                          placeholder="123456"
                          maxLength={6}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={isLoading}
                        className="text-emerald-600 hover:text-emerald-700 underline disabled:opacity-50"
                      >
                        Resend code
                      </button>
                      <span className="text-gray-500">Code expires in 10 minutes</span>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading || verificationCode.length !== 6}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                        isLoading || verificationCode.length !== 6
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify Email</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            )}

            {isUsernameStep && !isVerifying && (
              <motion.div
                key="username-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <p className="text-gray-600 text-sm mb-4">
                    Choose a username for your account
                  </p>
                  
                  <form onSubmit={handleUsernameSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Username</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="e.g., d0mkaaa"
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Must be at least 3 characters and cannot contain @ symbol
                      </p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading || username.length < 3}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                        isLoading || username.length < 3
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Setting Username...</span>
                        </>
                      ) : (
                        <>
                          <span>Complete Setup</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            )}

            {isVerifying && (
              <motion.div
                key="verification-result"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-6 shadow-lg">
                    <CheckCircle size={40} className="text-white" />
                  </div>
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

          <div className="mt-6 text-xs text-gray-400 text-center">
            <span>© NeighborVille {new Date().getFullYear()} • Secure Email Verification</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}