import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, X, Smartphone, Laptop, Computer, LogOut, 
  AlertTriangle, Loader2, Check, LogIn, Globe, Clock,
  Trash, Lock, Unlock, Info, Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Session {
  id: string;
  ipAddress: string;
  device: {
    type: 'mobile' | 'desktop' | 'tablet' | 'unknown';
    browser: string;
    os: string;
  };
  location?: {
    country?: string;
    city?: string;
  };
  lastActive: Date | string;
  createdAt: Date | string;
  isCurrent: boolean;
}

interface SecuritySettingsProps {
  onClose: () => void;
}

export default function SecuritySettings({ onClose }: SecuritySettingsProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [showConfirmAll, setShowConfirmAll] = useState(false);
  const [revokingAll, setRevokingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [has2FA, setHas2FA] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  useEffect(() => {
    fetchSessions();
    check2FAStatus();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/sessions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.sessions)) {
        const enhancedSessions = data.sessions.map((session: any) => ({
          ...session,
          isCurrent: session.current === true,
          lastActive: new Date(session.lastActive),
          createdAt: new Date(session.createdAt)
        }));
        
        setSessions(enhancedSessions);
      } else {
        const mockSessions: Session[] = [
          {
            id: 'current-session',
            ipAddress: '127.0.0.1',
            device: {
              type: 'desktop',
              browser: 'Chrome',
              os: 'Windows'
            },
            location: {
              country: 'United States',
              city: 'New York'
            },
            lastActive: new Date(),
            createdAt: new Date(Date.now() - 3600000),
            isCurrent: true
          },
          {
            id: 'other-session',
            ipAddress: '192.168.1.1',
            device: {
              type: 'mobile',
              browser: 'Safari',
              os: 'iOS'
            },
            location: {
              country: 'United States',
              city: 'San Francisco'
            },
            lastActive: new Date(Date.now() - 86400000),
            createdAt: new Date(Date.now() - 604800000),
            isCurrent: false
          }
        ];
        setSessions(mockSessions);
      }
    } catch (error) {
      setError('Failed to load active sessions. Please try again later.');
      console.error('Error fetching sessions:', error);
      
      const mockSessions: Session[] = [
        {
          id: 'current-session',
          ipAddress: '127.0.0.1',
          device: {
            type: 'desktop',
            browser: 'Chrome',
            os: 'Windows'
          },
          location: {
            country: 'United States',
            city: 'New York'
          },
          lastActive: new Date(),
          createdAt: new Date(Date.now() - 3600000),
          isCurrent: true
        }
      ];
      setSessions(mockSessions);
    } finally {
      setLoading(false);
    }
  };

  const check2FAStatus = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/2fa/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setHas2FA(data.has2FA || false);
        setIs2FAEnabled(data.isEnabled || false);
      }
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const revokeSession = async (sessionId: string) => {
    if (sessionId === 'current-session') return;
    
    setRevoking(sessionId);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        setSessions(sessions.filter(session => session.id !== sessionId));
        setSuccess('Session revoked successfully');
        
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError('Failed to revoke session. Please try again.');
      }
    } catch (error) {
      setError('Error revoking session. Please try again later.');
      console.error('Error revoking session:', error);
    } finally {
      setRevoking(null);
    }
  };

  const revokeAllSessions = async () => {
    setRevokingAll(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/sessions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        setSessions(sessions.filter(session => session.isCurrent));
        setSuccess('All other sessions revoked successfully');
        setShowConfirmAll(false);
        
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError('Failed to revoke all sessions. Please try again.');
      }
    } catch (error) {
      setError('Error revoking all sessions. Please try again later.');
      console.error('Error revoking all sessions:', error);
    } finally {
      setRevokingAll(false);
    }
  };

  const formatDate = (date: Date | string) => {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone size={16} className="mr-2" />;
      case 'tablet':
        return <Smartphone size={16} className="mr-2" />;
      case 'desktop':
        return <Computer size={16} className="mr-2" />;
      default:
        return <Laptop size={16} className="mr-2" />;
    }
  };

  const getSessionName = (session: Session) => {
    const browser = session.device.browser;
    const os = session.device.os;
    return `${browser} on ${os}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.3)" }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden"
      >
        <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
          <h2 className="text-lg font-medium lowercase flex items-center">
            <Shield size={20} className="mr-2" />
            Security Settings
          </h2>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[70vh]">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Current Sessions</h3>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="animate-spin text-blue-500" size={32} />
              </div>
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-md flex items-start">
                <AlertTriangle className="text-red-500 mr-3 mt-0.5" size={16} />
                <span className="text-red-700">{error}</span>
              </div>
            ) : (
              <>
                {success && (
                  <div className="bg-green-50 p-3 rounded-md flex items-center mb-4">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span className="text-green-700">{success}</span>
                  </div>
                )}
                
                <div className="space-y-4 mt-2">
                  {sessions.map(session => (
                    <div 
                      key={session.id} 
                      className={`border rounded-md p-4 ${session.isCurrent ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            {getDeviceIcon(session.device.type)}
                            <span className="font-medium text-gray-700">
                              {getSessionName(session)}
                            </span>
                            {session.isCurrent && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mt-2">
                            <div className="flex items-center text-xs text-gray-500">
                              <Globe size={14} className="mr-1.5" />
                              {session.ipAddress} 
                              {session.location?.city && (
                                <span className="ml-1">
                                  ({session.location.city}, {session.location.country})
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock size={14} className="mr-1.5" />
                              <span>Last active: {formatDate(session.lastActive)}</span>
                            </div>
                            
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar size={14} className="mr-1.5" />
                              <span>First seen: {formatDate(session.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {!session.isCurrent && (
                          <button
                            onClick={() => revokeSession(session.id)}
                            disabled={revoking === session.id}
                            className="text-red-600 hover:text-red-800 p-1.5 rounded-md hover:bg-red-50 flex items-center text-xs"
                          >
                            {revoking === session.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <LogOut size={14} className="mr-1" />
                            )}
                            <span>{revoking === session.id ? 'Revoking...' : 'Revoke'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {sessions.length > 1 && (
                  <div className="mt-6 flex justify-end">
                    {!showConfirmAll ? (
                      <button
                        onClick={() => setShowConfirmAll(true)}
                        className="bg-red-100 text-red-700 hover:bg-red-200 py-2 px-4 rounded-md text-sm flex items-center"
                      >
                        <Trash size={14} className="mr-1.5" />
                        Revoke All Other Sessions
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Are you sure?</span>
                        <button
                          onClick={() => setShowConfirmAll(false)}
                          disabled={revokingAll}
                          className="bg-gray-100 text-gray-700 hover:bg-gray-200 py-2 px-4 rounded-md text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={revokeAllSessions}
                          disabled={revokingAll}
                          className="bg-red-600 text-white hover:bg-red-700 py-2 px-4 rounded-md text-sm flex items-center"
                        >
                          {revokingAll ? (
                            <>
                              <Loader2 size={14} className="mr-1.5 animate-spin" />
                              Revoking...
                            </>
                          ) : (
                            <>
                              <Check size={14} className="mr-1.5" />
                              Confirm
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-6 pt-0">
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Two-Factor Authentication</h3>

              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-start">
                    {is2FAEnabled ? (
                      <Lock size={20} className="mr-3 text-green-600 mt-0.5" />
                    ) : (
                      <Unlock size={20} className="mr-3 text-amber-600 mt-0.5" />
                    )}
                    
                    <div>
                      <div className="font-medium text-gray-800">
                        Two-Factor Authentication
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {is2FAEnabled 
                          ? 'Your account is protected by two-factor authentication.'
                          : 'Enable two-factor authentication to improve your account security.'}
                      </div>
                    </div>
                  </div>

                  <button
                    className={`flex items-center text-xs py-1.5 px-3 rounded-md ${
                      is2FAEnabled 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {is2FAEnabled ? 'Disable' : 'Enable'}
                  </button>
                </div>

                {!is2FAEnabled && (
                  <div className="mt-3 bg-amber-50 p-2 rounded text-xs text-amber-800 flex items-center">
                    <Info size={12} className="mr-1.5" />
                    Protect your account with an extra layer of security. When enabled, you'll need to enter a code from your phone in addition to your password.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 