import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, X, Smartphone, Laptop, Computer, LogOut, 
  AlertTriangle, Loader2, Check, LogIn, Globe, Clock,
  Trash, Lock, Unlock, Info, Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import TwoFactorSettings from '../settings/TwoFactorSettings';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Shield size={24} className="mr-3" />
              <div>
                <h2 className="text-xl font-bold">Security Settings</h2>
                <p className="text-blue-100 text-sm">Manage your account security and active sessions</p>
              </div>
            </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Two-Factor Authentication</h3>
              <TwoFactorSettings />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Active Sessions</h3>
              
              {error && (
                <div className="mb-4 flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertTriangle size={16} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-4 flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
                  <Check size={16} />
                  <span className="text-sm">{success}</span>
                </div>
              )}
            
            {loading ? (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-blue-600 mr-2" />
                    <span className="text-gray-600">Loading active sessions...</span>
              </div>
              </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-4 border-b bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-800">Active Sessions ({sessions.length})</h4>
                        <p className="text-sm text-gray-600">Devices currently signed into your account</p>
                      </div>
                      {sessions.filter(s => !s.isCurrent).length > 0 && (
                        <button
                          onClick={() => setShowConfirmAll(true)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 transition-colors"
                        >
                          Revoke All Others
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="divide-y">
                    {sessions.map((session) => (
                      <div key={session.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                            {getDeviceIcon(session.device.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-gray-800">
                              {getSessionName(session)}
                                </h4>
                            {session.isCurrent && (
                                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                              <div className="mt-1 space-y-1">
                                <p className="text-sm text-gray-600">
                                  {session.device.browser} on {session.device.os}
                                </p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span className="flex items-center">
                                    <Globe size={12} className="mr-1" />
                              {session.ipAddress} 
                                  </span>
                                  {session.location && (
                                    <span>
                                      {session.location.city}, {session.location.country}
                                </span>
                              )}
                                  <span className="flex items-center">
                                    <Clock size={12} className="mr-1" />
                                    Last active {formatDate(session.lastActive)}
                                  </span>
                            </div>
                            </div>
                          </div>
                        </div>
                        
                        {!session.isCurrent && (
                          <button
                            onClick={() => revokeSession(session.id)}
                            disabled={revoking === session.id}
                              className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {revoking === session.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                                'Revoke'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              )}
            </div>
          </div>
                </div>
                
        {showConfirmAll && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle size={24} className="text-red-600" />
                <h3 className="text-lg font-semibold text-gray-800">Revoke All Other Sessions</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                This will sign you out of all other devices. You'll need to sign in again on those devices.
              </p>
              
              <div className="flex space-x-3">
                        <button
                          onClick={() => setShowConfirmAll(false)}
                  className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={revokeAllSessions}
                          disabled={revokingAll}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                        >
                          {revokingAll ? (
                            <>
                      <Loader2 size={16} className="animate-spin mr-2 inline" />
                              Revoking...
                            </>
                          ) : (
                    'Revoke All'
                          )}
                        </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
} 