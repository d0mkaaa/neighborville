import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Activity, Monitor, Smartphone, Tablet, Clock, MapPin, Wifi, AlertCircle, Shield, Globe } from 'lucide-react';
import { NORMALIZED_API_URL } from '../../config/apiConfig';

interface SessionData {
  id: string;
  ipAddress: string;
  userAgent: string;
  device: {
    type: 'mobile' | 'desktop' | 'tablet' | 'unknown';
    browser: string;
    os: string;
  };
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
  loginTime: string;
  lastActivity: string;
  isActive: boolean;
  isCurrent: boolean;
  duration: number;
  riskScore?: number;
  flags?: {
    vpnDetected: boolean;
    suspiciousLocation: boolean;
    deviceMismatch: boolean;
  };
}

interface SessionLogsModalProps {
  userId: string;
  username: string;
  onClose: () => void;
}

export default function SessionLogsModal({ userId, username, onClose }: SessionLogsModalProps) {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessionData();
  }, [userId]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/users/${userId}/sessions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSessions(data.sessions || []);
      } else {
        setError(data.message || 'Failed to load session data');
      }
    } catch (error) {
      console.error('Error loading session data:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone size={16} className="text-green-500" />;
      case 'tablet': return <Tablet size={16} className="text-blue-500" />;
      case 'desktop': return <Monitor size={16} className="text-gray-500" />;
      default: return <Monitor size={16} className="text-gray-400" />;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getRiskColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 7) return 'text-red-500';
    if (score >= 4) return 'text-yellow-500';
    return 'text-green-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getLocationString = (location?: { country?: string; city?: string; region?: string }) => {
    if (!location) return 'Unknown';
    const parts = [location.city, location.region, location.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Unknown';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
      >
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center">
                <Activity className="mr-3" size={24} />
                Session Logs
              </h2>
              <p className="text-purple-100 text-sm mt-1">
                Viewing sessions for {username}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">Loading session data...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-red-600">
              <AlertCircle size={20} className="mr-2" />
              {error}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Activity size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No session data found for this user.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`border rounded-lg p-4 ${
                    session.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        {getDeviceIcon(session.device.type)}
                        <span className="ml-2 font-medium">
                          {session.device.browser} on {session.device.os}
                        </span>
                        {session.isActive && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Active
                          </span>
                        )}
                        {session.isCurrent && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            Current
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">IP Address:</span>
                          <div className="flex items-center">
                            <code className="bg-gray-100 px-2 py-1 rounded">{session.ipAddress}</code>
                                                         {session.flags?.vpnDetected && (
                               <Wifi size={14} className="ml-2 text-orange-500" />
                             )}
                          </div>
                        </div>

                        <div>
                          <span className="text-gray-500">Location:</span>
                          <div className="flex items-center">
                            <MapPin size={14} className="mr-1 text-gray-400" />
                            {getLocationString(session.location)}
                                                         {session.flags?.suspiciousLocation && (
                               <Shield size={14} className="ml-2 text-red-500" />
                             )}
                          </div>
                        </div>

                        <div>
                          <span className="text-gray-500">Login Time:</span>
                          <div className="flex items-center">
                            <Clock size={14} className="mr-1 text-gray-400" />
                            {formatDate(session.loginTime)}
                          </div>
                        </div>

                        <div>
                          <span className="text-gray-500">Duration:</span>
                          <div>{formatDuration(session.duration)}</div>
                        </div>

                        <div>
                          <span className="text-gray-500">Last Activity:</span>
                          <div>{formatDate(session.lastActivity)}</div>
                        </div>

                        {session.riskScore !== undefined && (
                          <div>
                            <span className="text-gray-500">Risk Score:</span>
                            <div className={`font-medium ${getRiskColor(session.riskScore)}`}>
                              {session.riskScore}/10
                            </div>
                          </div>
                        )}
                      </div>

                      {session.flags && Object.values(session.flags).some(Boolean) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <span className="text-gray-500 text-sm">Security Flags:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {session.flags.vpnDetected && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full flex items-center">
                                <Wifi size={12} className="mr-1" />
                                VPN Detected
                              </span>
                            )}
                            {session.flags.suspiciousLocation && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center">
                                <Globe size={12} className="mr-1" />
                                Suspicious Location
                              </span>
                            )}
                            {session.flags.deviceMismatch && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center">
                                <AlertCircle size={12} className="mr-1" />
                                Device Mismatch
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className="text-gray-500 text-sm">User Agent:</span>
                        <div className="text-xs text-gray-600 mt-1 font-mono break-all">
                          {session.userAgent}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} found
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 