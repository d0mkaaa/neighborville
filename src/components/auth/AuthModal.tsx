import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ArrowRight, Shield, User } from 'lucide-react';
import { sendVerificationEmail } from '../../services/emailService';
import { check2FAStatus, verifyLogin, updateLegalAcceptance, updateUsername } from '../../api/userService';
import TwoFactorVerification from './TwoFactorVerification';
import LegalAcceptance from '../legal/LegalAcceptance';
import { NORMALIZED_API_URL } from '../../config/apiConfig';

type AuthModalProps = {
  onClose: () => void;
  onLogin: (userData: { id: string; username: string; email?: string }) => void;
};

type AuthStep = 'email' | 'verification' | '2fa' | 'username' | 'legal';

export default function AuthModal({ onClose, onLogin }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [username, setUsername] = useState('');
  const [currentStep, setCurrentStep] = useState<AuthStep>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [has2FA, setHas2FA] = useState(false);
  const [userId, setUserId] = useState('');
  const [skipEmailVerification, setSkipEmailVerification] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [legalAcceptanceData, setLegalAcceptanceData] = useState<any>(null);
  const [pendingUserData, setPendingUserData] = useState<any>(null);
  const [rememberMe, setRememberMe] = useState(false);

  
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('AuthModal: Component mounted, currentStep:', currentStep);
    const savedEmail = localStorage.getItem('saved_email');
    const rememberEmail = localStorage.getItem('remember_email') === 'true';
    console.log('AuthModal: Saved email from localStorage:', savedEmail, 'Remember:', rememberEmail);
    if (savedEmail && rememberEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
      console.log('AuthModal: Set email from localStorage:', savedEmail);
    }
  }, []);

  useEffect(() => {
    if (currentStep === 'verification' && codeInputRef.current) {
      codeInputRef.current.focus();
    }
  }, [currentStep]);

  const saveEmailIfRemembered = (emailToSave: string) => {
    if (rememberMe) {
      localStorage.setItem('saved_email', emailToSave);
      localStorage.setItem('remember_email', 'true');
    } else {
      localStorage.removeItem('saved_email');
      localStorage.removeItem('remember_email');
    }
  };



  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (!email || !email.trim()) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      console.log('AuthModal: Submitting email:', email);

      console.log('AuthModal: Calling check2FAStatus with email:', email.trim());
      const statusResult = await check2FAStatus(email.trim());
      console.log('AuthModal: check2FAStatus result:', statusResult);
      
      if (!statusResult.success) {
        if (statusResult.message && statusResult.message.includes('Network error')) {
          setError('Unable to connect to server. Please check your connection and try again.');
        } else {
          setError(statusResult.message || 'Failed to check account status');
        }
        setIsLoading(false);
        return;
      }

      setIsNewUser(statusResult.isNewUser);
      setHas2FA(statusResult.has2FA);
      setUserId(statusResult.userId || '');

      if (statusResult.isNewUser) {
        if (!legalAccepted) {
          setCurrentStep('legal');
          setIsLoading(false);
          return;
        }
        setCurrentStep('username');
      } else if (statusResult.needsUsernameUpdate) {
        setCurrentStep('username');
        setInfoMessage('Please choose a username for your account');
      } else if (statusResult.has2FA) {
        setSkipEmailVerification(true);
        setCurrentStep('2fa');
        setSuccessMessage('Please enter your 2FA authentication code');
      } else {
        const emailResult = await sendVerificationEmail(email, '', statusResult.username || '');
        if (emailResult.success) {
          setCurrentStep('verification');
          setSuccessMessage('Verification code sent to your email!');
          if (emailResult.isExistingCode) {
            setInfoMessage('You already have a valid verification code. It will expire 10 minutes after it was first created.');
          }
        } else {
          setError(emailResult.message || 'Failed to send verification email');
        }
      }

      saveEmailIfRemembered(email);
    } catch (err) {
      console.error('Error during email submission:', err);
      setError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!isNewUser && userId) {
        const updateResult = await updateUsername(email, username);
        if (updateResult.success) {
          setSuccessMessage('Username updated successfully!');
          const emailResult = await sendVerificationEmail(email, username);
          if (emailResult.success) {
            setCurrentStep('verification');
            setSuccessMessage('Username updated! Verification code sent to your email.');
          } else {
            setError(emailResult.message || 'Failed to send verification email');
          }
        } else {
          setError(updateResult.message || 'Failed to update username');
        }
      } else {
        const emailResult = await sendVerificationEmail(email, username);
      if (emailResult.success) {
        setCurrentStep('verification');
        setSuccessMessage('Verification code sent to your email!');
      } else {
        setError(emailResult.message || 'Failed to send verification email');
        }
      }
    } catch (err) {
      console.error('Error during username submission:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await verifyLogin(
        email,
        verificationCode,
        undefined,
        isNewUser ? username : undefined
      );

      if (result.success) {
        if (result.requires2FA) {
          setUserId(result.userId || '');
          setCurrentStep('2fa');
          setSuccessMessage('Email verified! Please enter your 2FA code.');
        } else {
          const userData = {
            id: result.user?.id || email,
            username: result.user?.username || username,
            email: result.user?.email || email
          };

          if (result.isNewRegistration && !legalAccepted) {
            setPendingUserData(userData);
            setCurrentStep('legal');
          } else {
            handleLoginSuccess(userData);
          }
        }
      } else {
        setError(result.message || 'Verification failed');
      }
    } catch (err) {
      console.error('Error during verification:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (userData: { id: string; username: string; email?: string }) => {
    setSuccessMessage('Login successful!');
    setTimeout(() => {
      onLogin(userData);
    }, 1000);
  };

  const handle2FASuccess = (userData: any) => {
    const finalUserData = {
      id: userData.id || userId,
      username: userData.username || username,
      email: userData.email || email
    };
    handleLoginSuccess(finalUserData);
  };

  const handleLegalAccept = async (acceptanceData?: { termsOfService: boolean; privacyPolicy: boolean; marketingConsent: boolean }) => {
    setLegalAccepted(true);
    setLegalAcceptanceData(acceptanceData);

    try {
      if (acceptanceData) {
        const result = await updateLegalAcceptance(acceptanceData);
        console.log('Legal acceptance result:', result);
      }
        } catch (error) {
      console.error('Error updating legal acceptance:', error);
        }

    if (pendingUserData) {
      handleLoginSuccess(pendingUserData);
    } else {
      if (email && email.trim()) {
        setCurrentStep(isNewUser ? 'username' : 'verification');
      } else {
        setCurrentStep('email');
      }
    }
  };

  const handleLegalDecline = () => {
    onClose();
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'email': return 'Welcome to Neighborville';
      case 'username': return 'Choose Your Username';
      case 'verification': return 'Check Your Email';
      case '2fa': return 'Two-Factor Authentication';
      case 'legal': return 'Terms & Privacy';
      default: return 'Welcome';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'email': return 'Enter your email to sign in or create an account';
      case 'username': return 'Pick a unique username for your neighborhood';
      case 'verification': return 'Enter the 6-digit code we sent to your email';
      case '2fa': return 'Please verify your identity';
      case 'legal': return 'Review and accept our terms to continue';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full overflow-hidden ${
          currentStep === 'legal' ? 'max-w-2xl' : 'max-w-md'
        }`}
      >
        <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-6 text-white">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="text-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{getStepTitle()}</h2>
              <p className="text-blue-100 text-sm">{getStepDescription()}</p>
            </div>
          </div>

          <div className="flex justify-center mt-4 space-x-2">
            {(() => {
              const steps = ['email'];
              if (isNewUser) {
                steps.push('username');
              }
              if (has2FA && !isNewUser) {
                steps.push('2fa');
              } else if (!isNewUser) {
                steps.push('verification');
              } else {
                steps.push('verification');
              }
              if (currentStep === 'legal') {
                steps.push('legal');
              }
              
              return steps.map((step, index) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    step === currentStep || 
                    (currentStep === 'verification' && step === 'email') ||
                    (currentStep === '2fa' && ['email', 'verification'].includes(step)) ||
                    (currentStep === 'username' && step === 'email') ||
                    (currentStep === 'legal' && ['email', 'username', 'verification'].includes(step))
                      ? 'bg-white' 
                      : 'bg-white/30'
                  }`}
                />
              ));
            })()}
          </div>
        </div>

        <div className="px-6">
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {successMessage}
            </div>
          )}
          {infoMessage && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
              {infoMessage}
            </div>
          )}
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {currentStep === 'email' && (
              <div className="space-y-4">
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="rememberMe" className="text-sm text-gray-600">
                    Remember my email
                  </label>
                </div>



                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Checking...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight size={16} className="ml-2" />
                    </>
                  )}
                </button>
                </form>
              </div>
            )}

            {currentStep === 'username' && (
              <div className="space-y-4">
                <form onSubmit={handleUsernameSubmit} className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User size={24} className="text-blue-600" />
                  </div>
                </div>

                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError(null);
                    }}
                    placeholder="Choose a username"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                    autoFocus
                    minLength={3}
                    maxLength={30}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || username.length < 3}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight size={16} className="ml-2" />
                    </>
                  )}
                </button>
                </form>
              </div>
            )}

            {currentStep === 'verification' && (
              <div className="space-y-4">
                <form onSubmit={handleVerificationSubmit} className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Mail size={24} className="text-blue-600" />
                  </div>
                </div>

                <div className="relative">
                  <input
                    ref={codeInputRef}
                    type="text"
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setVerificationCode(value);
                      setError(null);
                    }}
                    placeholder="000000"
                    className="w-full text-center text-2xl font-mono tracking-widest p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={6}
                  />
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Enter the 6-digit code from your email
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || verificationCode.length !== 6}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Verifying...
                    </>
                  ) : (
                    'Verify & Continue'
                  )}
                </button>
                </form>
              </div>
            )}

            {currentStep === '2fa' && (
              <div>
                <TwoFactorVerification
                  userId={userId}
                  onSuccess={handle2FASuccess}
                  onBack={() => setCurrentStep(skipEmailVerification ? 'email' : 'verification')}
                  onError={(error) => setError(error)}
                />
              </div>
            )}

            {currentStep === 'legal' && (
              <div>
                <LegalAcceptance 
                  onAccept={handleLegalAccept}
                  onDecline={handleLegalDecline}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
} 