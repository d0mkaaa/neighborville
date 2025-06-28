import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Calendar, 
  User, 
  GitCommit, 
  Plus, 
  Wrench, 
  Bug, 
  AlertTriangle,
  Star,
  ExternalLink,
  Loader2,
  RefreshCw
} from 'lucide-react';
import ModalWrapper from '../ui/ModalWrapper';
import { 
  getUpdateHistory, 
  getCurrentVersion, 
  fetchUpdatesFromAPI,
  fetchVersionFromAPI,
  getCommitUrl,
  formatVersion,
  type UpdateEntry,
  type VersionInfo
} from '../../services/versionService';

interface UpdateLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpdateLogModal({ isOpen, onClose }: UpdateLogModalProps) {
  const [updateLogs, setUpdateLogs] = useState<UpdateEntry[]>([]);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiveData, setIsLiveData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUpdateData();
    }
  }, [isOpen]);

  const loadUpdateData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [logs, version] = await Promise.all([
        fetchUpdatesFromAPI(20),
        fetchVersionFromAPI()
      ]);

      setUpdateLogs(logs);
      setVersionInfo(version);
      
      const hasLiveUpdates = logs.some((log: any) => log.isLive);
      const hasLiveVersion = version && (version as any).isLive;
      setIsLiveData(hasLiveUpdates || hasLiveVersion);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading update data:', err);
      setError('Failed to load update information');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadUpdateData();
  };

  const handleMarkViewed = async (updateId: string) => {
    console.log('Marked update as viewed:', updateId);
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'feature':
        return <Plus size={16} className="text-green-600" />;
      case 'improvement':
        return <Wrench size={16} className="text-blue-600" />;
      case 'bugfix':
        return <Bug size={16} className="text-orange-600" />;
      case 'breaking':
        return <AlertTriangle size={16} className="text-red-600" />;
      default:
        return <Plus size={16} className="text-gray-600" />;
    }
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'feature':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'improvement':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'bugfix':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'breaking':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <ModalWrapper isOpen={isOpen} onClose={onClose} title="Update Log" maxWidth="2xl">
        <div className="p-8 text-center">
          <Loader2 className="animate-spin w-8 h-8 text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading update information...</p>
        </div>
      </ModalWrapper>
    );
  }

  if (error) {
    return (
      <ModalWrapper isOpen={isOpen} onClose={onClose} title="Update Log" maxWidth="2xl">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-red-600" />
          </div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={loadUpdateData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </ModalWrapper>
    );
  }

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Update Log" maxWidth="2xl">
      <div className="max-h-[600px] overflow-y-auto">
        {versionInfo && (
          <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold">Current Version</h3>
                  {isLiveData && (
                    <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full animate-pulse">
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-blue-100">{formatVersion(versionInfo)}</p>
                <p className="text-sm text-blue-200">
                  Built on {formatDate(versionInfo.buildDate)} • {versionInfo.environment}
                  {isLiveData && (versionInfo as any).isLive && (
                    <span className="ml-2 text-green-200">• Connected to GitHub</span>
                  )}
                </p>
                {lastUpdated && (
                  <p className="text-xs text-blue-300 mt-1">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
                  title="Refresh from GitHub"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  <span className="text-sm">Refresh</span>
                </button>
                {versionInfo.commit !== 'unknown' && (
                  <a
                    href={getCommitUrl(versionInfo.commit)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <GitCommit size={16} />
                    <span className="text-sm">View Commit</span>
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
  
        <div className="p-6">
          {updateLogs.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-600">No update logs available</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Recent Updates</h3>
                {isLiveData ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Live from GitHub</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-orange-600">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm font-medium">Cached Data</span>
                  </div>
                )}
              </div>
              
              {updateLogs.map((update, index) => (
                <div
                  key={update.id}
                  onClick={() => handleMarkViewed(update.id)}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${update.type === 'major' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                        {update.type === 'major' ? (
                          <Star size={20} className="text-purple-600" />
                        ) : (
                          <GitCommit size={20} className="text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          {update.title}
                          {(update as any).isLive && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                              GitHub
                            </span>
                          )}
                          {update.type === 'major' && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                              Major
                            </span>
                          )}
                          {update.type === 'hotfix' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                              Hotfix
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{formatDate(update.date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">
                              v{update.version}
                            </span>
                          </div>
                          {update.author && (
                            <div className="flex items-center gap-1">
                              <User size={14} />
                              <span>{update.author}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {update.commit && (
                      <a
                        href={getCommitUrl(update.commit)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>

                  <p className="text-gray-700 mb-4">{update.description}</p>

                  {update.changes.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-800 text-sm">Changes:</h5>
                      <div className="space-y-2">
                        {update.changes.map((change, changeIndex) => (
                          <div
                            key={changeIndex}
                            className={`flex items-start gap-2 p-2 rounded-lg border ${getChangeColor(change.type)}`}
                          >
                            {getChangeIcon(change.type)}
                            <span className="text-sm flex-1">{change.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
} 