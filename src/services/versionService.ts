import { api } from '../utils/api';
import { buildApiEndpoint } from '../config/apiConfig';

export interface VersionInfo {
  version: string;
  commit: string;
  branch: string;
  buildDate: string;
  environment: string;
  isLive: boolean;
}

export interface UpdateEntry {
  id: string;
  version: string;
  date: string;
  title: string;
  description: string;
  type: 'major' | 'minor' | 'patch' | 'hotfix';
  changes: {
    type: 'feature' | 'improvement' | 'bugfix' | 'security';
    description: string;
  }[];
  commit?: string;
  author?: string;
}

export const getCurrentVersion = (): VersionInfo => {
  return {
    version: '1.0.0-live',
    commit: 'unknown',
    branch: 'main',
    buildDate: new Date().toISOString(),
    environment: import.meta.env.MODE || 'development',
    isLive: true
  };
};

export const getUpdateHistory = (): UpdateEntry[] => {
  return [
    {
      id: 'v0.9.1-beta',
      version: '0.9.1-beta',
      date: '2025-06-08T21:57:19Z',
      title: 'Production Deployment & Critical Fixes',
      description: 'Major production update with critical bug fixes and performance improvements.',
      type: 'minor',
      commit: '070e1aa5604e2861dc0000c09602fc88e83f8b88',
      author: 'domkaa',
      changes: [
        {
          type: 'bugfix',
          description: 'Fixed critical production deployment issues'
        },
        {
          type: 'improvement',
          description: 'Enhanced server stability and performance'
        },
        {
          type: 'bugfix',
          description: 'Resolved authentication edge cases'
        },
        {
          type: 'security',
          description: 'Improved security measures for production environment'
        }
      ]
    },
    {
      id: 'v0.9.0-beta',
      version: '0.9.0-beta',
      date: '2025-06-05T21:25:49Z',
      title: 'Major Game Systems Overhaul',
      description: 'Massive update introducing new production system, overhauled authentication with Terms of Service and Privacy Policy, enhanced settings, and much more.',
      type: 'major',
      commit: '731c5d614a309cf96581d473214e00eb0f2c4ff7',
      author: 'domkaa',
      changes: [
        {
          type: 'feature',
          description: 'Complete production system redesign with new mechanics'
        },
        {
          type: 'feature',
          description: 'Overhauled authentication system with legal compliance'
        },
        {
          type: 'feature',
          description: 'Added comprehensive Terms of Service and Privacy Policy'
        },
        {
          type: 'improvement',
          description: 'Enhanced settings panel with new options'
        },
        {
          type: 'feature',
          description: 'New user onboarding improvements'
        },
        {
          type: 'improvement',
          description: 'Better game balance and progression'
        }
      ]
    },
    {
      id: 'v0.8.5-beta',
      version: '0.8.5-beta',
      date: '2025-05-24T20:30:56Z',
      title: 'Memory Game & Tax System Update',
      description: 'Fixed memory game mechanics, introduced new tax management system, and improved authentication modal.',
      type: 'minor',
      commit: 'a152bb973b990d6e09adc858f37ac25dfb9fab54',
      author: 'domkaa',
      changes: [
        {
          type: 'bugfix',
          description: 'Fixed memory game functionality and scoring'
        },
        {
          type: 'feature',
          description: 'New comprehensive tax management system'
        },
        {
          type: 'improvement',
          description: 'Enhanced authentication modal design and UX'
        },
        {
          type: 'improvement',
          description: 'Better game balance for economic systems'
        }
      ]
    },
    {
      id: 'v0.8.4-beta',
      version: '0.8.4-beta',
      date: '2025-05-18T19:48:47Z',
      title: 'Authentication Stability Fixes',
      description: 'Critical fixes for new user authentication and registration process.',
      type: 'patch',
      commit: 'a676e0d9a387a787f845cc88af157e00b4f98017',
      author: 'domkaa',
      changes: [
        {
          type: 'bugfix',
          description: 'Fixed authentication issues for new users'
        },
        {
          type: 'bugfix',
          description: 'Resolved registration process edge cases'
        },
        {
          type: 'improvement',
          description: 'Enhanced error handling for auth flows'
        }
      ]
    },
    {
      id: 'v0.8.3-beta',
      version: '0.8.3-beta',
      date: '2025-05-18T19:06:06Z',
      title: 'Time System & Weather Rework',
      description: 'Major rework of time system and weather mechanics, removed happiness system, fixed marketplace, and improved email verification.',
      type: 'minor',
      commit: 'f8cbf58fc948368bd6c422ce17661fc34550ce41',
      author: 'domkaa',
      changes: [
        {
          type: 'feature',
          description: 'Complete rework of time system mechanics'
        },
        {
          type: 'feature',
          description: 'Enhanced weather system with new effects'
        },
        {
          type: 'improvement',
          description: 'Removed outdated happiness system for better balance'
        },
        {
          type: 'bugfix',
          description: 'Fixed marketplace sell tab functionality'
        },
        {
          type: 'improvement',
          description: 'Optimized email verification code generation'
        }
      ]
    },
    {
      id: 'v0.8.2-beta',
      version: '0.8.2-beta',
      date: '2025-05-17T12:17:30Z',
      title: 'Cloud Save System & Authentication Overhaul',
      description: 'Complete rework of authentication and cloud saving system. No more local saves, everything is now cloud-based with enhanced features.',
      type: 'major',
      commit: 'fb6d37475901df50c095a4a0871c6a4095d5b165',
      author: 'domkaa',
      changes: [
        {
          type: 'feature',
          description: 'Complete cloud save system implementation'
        },
        {
          type: 'feature',
          description: 'Full authentication system rework'
        },
        {
          type: 'improvement',
          description: 'Removed local save dependencies'
        },
        {
          type: 'feature',
          description: 'Enhanced user session management'
        },
        {
          type: 'security',
          description: 'Improved data security with cloud infrastructure'
        }
      ]
    },
    {
      id: 'v0.8.1-beta',
      version: '0.8.1-beta',
      date: '2025-05-15T20:56:53Z',
      title: 'Multiple Saves & Settings Enhancement',
      description: 'Added support for multiple save files, removed unneeded features, and improved authentication handling with better settings.',
      type: 'minor',
      commit: '741cac008e450760e409eca77e9af7d512007cae',
      author: 'domkaa',
      changes: [
        {
          type: 'feature',
          description: 'Multiple save file support'
        },
        {
          type: 'improvement',
          description: 'Enhanced authentication handling'
        },
        {
          type: 'improvement',
          description: 'Better settings management interface'
        },
        {
          type: 'improvement',
          description: 'Code cleanup and optimization'
        }
      ]
    },
    {
      id: 'v0.8.0-beta',
      version: '0.8.0-beta',
      date: '2025-05-14T18:32:23Z',
      title: 'Infrastructure & Deployment Updates',
      description: 'Major backend infrastructure improvements, SSL fixes, and deployment optimizations.',
      type: 'minor',
      commit: 'c4191bc254f5fb8f646915cb86253bb7d0847ddb',
      author: 'domkaa',
      changes: [
        {
          type: 'improvement',
          description: 'Backend infrastructure enhancements'
        },
        {
          type: 'security',
          description: 'SSL configuration improvements'
        },
        {
          type: 'improvement',
          description: 'Docker and deployment optimizations'
        },
        {
          type: 'bugfix',
          description: 'Fixed various production deployment issues'
        }
      ]
    }
  ];
};

export const getRecentUpdates = (limit?: number): UpdateEntry[] => {
  const updates = getUpdateHistory();
  return limit ? updates.slice(0, limit) : updates;
};

export const getVersionInfo = (version: string): UpdateEntry | null => {
  const updates = getUpdateHistory();
  return updates.find(update => update.version === version) || null;
};

export const isNewerVersion = (currentVersion: string, compareVersion: string): boolean => {
  const current = currentVersion.replace(/[^\d.]/g, '').split('.').map(Number);
  const compare = compareVersion.replace(/[^\d.]/g, '').split('.').map(Number);
  
  for (let i = 0; i < Math.max(current.length, compare.length); i++) {
    const curr = current[i] || 0;
    const comp = compare[i] || 0;
    
    if (comp > curr) return true;
    if (comp < curr) return false;
  }
  
  return false;
};

export const getChangelog = (fromVersion?: string, toVersion?: string): UpdateEntry[] => {
  const updates = getUpdateHistory();
  
  if (!fromVersion && !toVersion) {
    return updates;
  }
  
  let startIndex = 0;
  let endIndex = updates.length;
  
  if (toVersion) {
    const toIndex = updates.findIndex(update => update.version === toVersion);
    if (toIndex !== -1) endIndex = toIndex + 1;
  }
  
  if (fromVersion) {
    const fromIndex = updates.findIndex(update => update.version === fromVersion);
    if (fromIndex !== -1) startIndex = fromIndex;
  }
  
  return updates.slice(startIndex, endIndex);
};

export const fetchVersionFromAPI = async (): Promise<VersionInfo> => {
  try {
    const response = await fetch(buildApiEndpoint('/api/version'));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.versionInfo;
  } catch (error) {
    console.error('Failed to fetch version from API:', error);
    throw error;
  }
};

export const fetchUpdatesFromAPI = async (limit?: number): Promise<UpdateEntry[]> => {
  try {
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/updates${limit ? `?limit=${limit}` : ''}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const updates = data.updates || [];
      
      const hasLiveData = updates.some((update: any) => update.isLive);
      console.log('✅ Update data fetched:', hasLiveData ? 'LIVE GitHub commits' : 'FALLBACK data');
      
      return updates;
    }
  } catch (error) {
    console.warn('Failed to fetch updates from API:', error);
  }
  
  return getRecentUpdates(limit);
};

export const fetchGitHubCommits = async (repo: string = 'd0mkaaa/neighborville', limit: number = 20): Promise<any[]> => {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=${limit}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Failed to fetch GitHub commits:', error);
  }
  
  return [];
};

export const formatVersion = (versionInfo: VersionInfo): string => {
  return `${versionInfo.version} (${versionInfo.commit.substring(0, 7)})`;
};

export const getCommitUrl = (commit: string): string => {
  return `https://github.com/d0mkaaa/neighborville/commit/${commit}`;
};

export const GITHUB_REPO = 'd0mkaaa/neighborville';
export const GITHUB_BRANCH = 'main';

export default {
  getCurrentVersion,
  getUpdateHistory,
  getRecentUpdates,
  getVersionInfo,
  isNewerVersion,
  getChangelog,
  fetchVersionFromAPI,
  fetchUpdatesFromAPI,
  fetchGitHubCommits,
  formatVersion,
  getCommitUrl,
  GITHUB_REPO,
  GITHUB_BRANCH
}; 