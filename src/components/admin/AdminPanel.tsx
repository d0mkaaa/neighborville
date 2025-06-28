import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Shield, Users, Flag, Search, Eye, UserX, UserCheck, MoreVertical, 
  CheckCircle, AlertTriangle, Clock, BarChart3, History, 
  TrendingUp, UserMinus, Settings, Gavel, AlertOctagon,
  ChevronDown, Download, Upload, Filter, RefreshCw, Calendar,
  MapPin, Globe, Wifi, Activity, LogOut, Ban, FileText, MessageSquare,
  Network, Monitor, Smartphone, Tablet, Edit, Trash2, AlertCircle,
  UserPlus, Key, Mail, Phone, CreditCard, Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NORMALIZED_API_URL } from '../../config/apiConfig';
import UserDetailModal from './UserDetailModal';
import ReportDetailModal from './ReportDetailModal';
import DeleteUserModal from './DeleteUserModal';
import IPSuspensionModal from './IPSuspensionModal';
import SessionLogsModal from './SessionLogsModal';
import SuspensionModal from './SuspensionModal';

interface AdminPanelProps {
  onClose: () => void;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  verified: boolean;
  createdAt: string;
  lastLogin?: string;
  isSuspended: boolean;
  suspensions?: Array<{
    reason: string;
    startDate: string;
    endDate: string;
    issuedBy: { username: string };
    isActive: boolean;
  }>;
  warnings?: Array<{
    reason: string;
    issuedAt: string;
    issuedBy: { username: string };
    severity: 'low' | 'medium' | 'high';
  }>;
  moderationStats?: {
    totalReports: number;
    resolvedReports: number;
    averageResolutionTime: number;
    lastModerationAction?: string;
  };
  adminNotes?: string;
  profileSettings?: {
    bio?: string;
    visibility?: string;
  };
  permissions?: string[];
  securityFlags?: {
    isVpnUser: boolean;
    hasMultipleAccounts: boolean;
    suspiciousActivity: boolean;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  riskScore?: number;
  ipCount?: number;
  deviceCount?: number;
  activityStats?: {
    totalLogins: number;
    totalGameSessions: number;
    totalPlayTime: number;
    averageSessionLength: number;
    lastActivityDate: string;
  };
  accountAge?: number;
  lastSeenDays?: number;
  isNewUser?: boolean;
  isActiveUser?: boolean;
}

interface ModerationLog {
  id: string;
  userId: string;
  username: string;
  content: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  action: string;
}

interface Report {
  _id: string;
  reporterId: {
    _id: string;
    username: string;
  };
  reportedUserId: {
    _id: string;
    username: string;
    email: string;
  };
  reportType: string;
  category: string;
  description: string;
  evidence?: string;
  specificContent?: {
    type: string;
    content: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed' | 'escalated';
  estimatedReviewTime: string;
  createdAt: string;
  assignedModerator?: {
    _id: string;
    username: string;
  };
}

interface Appeal {
  id: string;
  userId: string;
  username: string;
  email: string;
  suspensionId: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminResponse?: string;
  suspension: {
    reason: string;
    startDate: string;
    endDate: string;
    issuedBy: string;
    isActive: boolean;
  };
}

interface IPSuspension {
  _id: string;
  ip: string;
  reason: string;
  startDate: string;
  endDate: string;
  issuedBy: {
    _id: string;
    username: string;
  };
  targetUserId?: {
    _id: string;
    username: string;
    email: string;
  };
  type: 'user' | 'ip' | 'device' | 'global';
  severity: 'warning' | 'temporary' | 'permanent';
  isActive: boolean;
  affectedUsers: Array<{
    userId: {
      _id: string;
      username: string;
      email: string;
    };
    detectedAt: string;
  }>;
  notes?: string;
  createdAt: string;
}

interface SecurityOverview {
  highRiskUsers: Array<{
    id: string;
    username: string;
    email: string;
    riskLevel: string;
    riskScore: number;
    ipCount: number;
    deviceCount: number;
    flags: {
      vpn: boolean;
      multiAccount: boolean;
      suspicious: boolean;
    };
  }>;
  recentIPSuspensions: IPSuspension[];
  patterns: {
    vpnUsers: number;
    multiAccountUsers: number;
    suspiciousUsers: number;
  };
}

interface Analytics {
  registrationTrends: Array<{
    _id: { year: number; month: number; day: number };
    count: number;
  }>;
  activity: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    suspendedUsers: number;
    averagePlayTime: number;
    totalSessions: number;
  };
  riskDistribution: Array<{
    _id: string;
    count: number;
  }>;
  geoDistribution: Array<{
    _id: string;
    count: number;
  }>;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'reports' | 'appeals' | 'moderation' | 'settings' | 'security' | 'analytics' | 'ip-suspensions' | 'settings'>('dashboard');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [moderationLogs, setModerationLogs] = useState<ModerationLog[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [appealStats, setAppealStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'user' | 'moderator' | 'admin'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'under_review' | 'resolved' | 'dismissed' | 'escalated'>('all');
  const [selectedAppealStatus, setSelectedAppealStatus] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');
  const [selectedPriority, setSelectedPriority] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  const [selectedUserDetail, setSelectedUserDetail] = useState<string | null>(null);
  const [selectedReportDetail, setSelectedReportDetail] = useState<string | null>(null);
  const [reviewingAppeal, setReviewingAppeal] = useState<string | null>(null);
  const [appealResponse, setAppealResponse] = useState('');
  const [dataLoaded, setDataLoaded] = useState({
    dashboard: false,
    users: false,
    reports: false,
    appeals: false,
    moderation: false
  });

  const [ipSuspensions, setIPSuspensions] = useState<IPSuspension[]>([]);
  const [securityOverview, setSecurityOverview] = useState<SecurityOverview | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [advancedSearchQuery, setAdvancedSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    riskLevel: 'all',
    hasVPN: false,
    hasMultipleAccounts: false,
    ipAddress: '',
    minSuspensions: '',
    accountAge: '',
    lastActive: ''
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showIPSuspensionModal, setShowIPSuspensionModal] = useState<string | null>(null);
  const [showSuspensionModal, setShowSuspensionModal] = useState<string | null>(null);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  const [userActionDropdown, setUserActionDropdown] = useState<string | null>(null);
  const [showSessionLogsModal, setShowSessionLogsModal] = useState<string | null>(null);

  const [deleteUserModal, setDeleteUserModal] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'dashboard' && !dataLoaded.dashboard) {
      loadDashboardStats();
      setDataLoaded(prev => ({ ...prev, dashboard: true }));
    } else if (activeTab === 'users' && !dataLoaded.users) {
      loadUsers();
      setDataLoaded(prev => ({ ...prev, users: true }));
    } else if (activeTab === 'reports' && !dataLoaded.reports) {
      loadReports();
      setDataLoaded(prev => ({ ...prev, reports: true }));
    } else if (activeTab === 'appeals' && !dataLoaded.appeals) {
      loadAppeals();
      loadAppealStats();
      setDataLoaded(prev => ({ ...prev, appeals: true }));
    } else if (activeTab === 'moderation' && !dataLoaded.moderation) {
      loadModerationLogs();
      setDataLoaded(prev => ({ ...prev, moderation: true }));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'appeals' && dataLoaded.appeals) {
      loadAppeals();
    }
  }, [selectedAppealStatus]);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/dashboard-stats`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data.stats);
      }
      
      await loadAppealStats();
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/reports`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAppeals = async () => {
    setLoading(true);
    try {
      const status = selectedAppealStatus === 'all' ? 'pending' : selectedAppealStatus;
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/appeals?status=${status}&limit=50`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAppeals(data.appeals || []);
      }
    } catch (error) {
      console.error('Error loading appeals:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAppealStats = async () => {
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/appeals/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAppealStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading appeal stats:', error);
    }
  };

  const loadModerationLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/moderation-logs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const mappedLogs = (data.logs || []).map((log: any) => ({
          id: log._id,
          userId: log.userId?._id || log.userId,
          username: log.userId?.username || log.moderatorId?.username || 'Unknown',
          content: log.originalContent || log.cleanedContent || '',
          reason: log.reason || '',
          severity: log.severity || 'low',
          timestamp: log.createdAt || log.updatedAt,
          action: log.action || 'unknown'
        }));
        setModerationLogs(mappedLogs);
      }
    } catch (error) {
      console.error('Error loading moderation logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadIPSuspensions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/ip-suspensions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setIPSuspensions(data.suspensions || []);
      }
    } catch (error) {
      console.error('Error loading IP suspensions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSecurityOverview = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/security/overview`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSecurityOverview(data.security);
      }
    } catch (error) {
      console.error('Error loading security overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/analytics/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const performAdvancedSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (advancedSearchQuery) params.append('query', advancedSearchQuery);
      if (searchFilters.riskLevel !== 'all') params.append('riskLevel', searchFilters.riskLevel);
      if (searchFilters.hasVPN) params.append('hasVPN', 'true');
      if (searchFilters.hasMultipleAccounts) params.append('hasMultipleAccounts', 'true');
      if (searchFilters.ipAddress) params.append('ipAddress', searchFilters.ipAddress);
      if (searchFilters.minSuspensions) params.append('minSuspensions', searchFilters.minSuspensions);
      if (searchFilters.accountAge) params.append('accountAge', searchFilters.accountAge);
      if (searchFilters.lastActive) params.append('lastActive', searchFilters.lastActive);

      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/users/advanced-search?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error performing advanced search:', error);
    } finally {
      setLoading(false);
    }
  };

  const createIPSuspension = async (ipData: any) => {
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/ip-suspensions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(ipData)
      });

      if (response.ok) {
        setShowIPSuspensionModal(null);
        loadIPSuspensions();
        return true;
      }
    } catch (error) {
      console.error('Error creating IP suspension:', error);
    }
    return false;
  };

  const performBulkAction = async (actionData: any) => {
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/users/bulk-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(actionData)
      });

      if (response.ok) {
        setShowBulkActionModal(false);
        setSelectedUsers([]);
        loadUsers();
        return true;
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
    return false;
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'moderator' | 'admin') => {
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const toggleUserSuspend = async (userId: string, reason: string = 'Suspended by admin', alsoSuspendIP: boolean = false, duration: number = 24) => {
    try {
      const targetUser = users.find(u => u.id === userId);
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/users/${userId}/suspend`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          suspend: !targetUser?.isSuspended,
          reason: reason,
          duration: targetUser?.isSuspended ? undefined : duration,
          alsoSuspendIP: alsoSuspendIP && !targetUser?.isSuspended
        })
      });

      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, isSuspended: !u.isSuspended } : u));
        refreshCurrentTab();
      }
    } catch (error) {
      console.error('Error toggling user suspension:', error);
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/reports/${reportId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setReports(reports.map(r => r._id === reportId ? { ...r, status: newStatus as any } : r));
      }
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  };

  const assignReport = async (reportId: string) => {
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/reports/${reportId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setReports(reports.map(r => r._id === reportId ? { 
          ...r, 
          status: 'under_review',
          assignedModerator: { _id: user!.id, username: user!.username }
        } : r));
      }
    } catch (error) {
      console.error('Error assigning report:', error);
    }
  };

  const reviewAppeal = async (appealId: string, action: 'approve' | 'deny', response: string) => {
    try {
      const res = await fetch(`${NORMALIZED_API_URL}/api/admin/appeals/${appealId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ action, response })
      });

      if (res.ok) {
        setReviewingAppeal(null);
        setAppealResponse('');
        loadAppeals();
        loadAppealStats();
      }
    } catch (error) {
      console.error('Error reviewing appeal:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-700 bg-red-100';
      case 'moderator': return 'text-orange-700 bg-orange-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-100';
      case 'high': return 'text-orange-700 bg-orange-100';
      case 'medium': return 'text-yellow-700 bg-yellow-100';
      case 'low': return 'text-blue-700 bg-blue-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const refreshCurrentTab = () => {
    if (activeTab === 'appeals') {
      loadAppeals();
      loadAppealStats();
    } else if (activeTab === 'dashboard') {
      loadDashboardStats();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'reports') {
      loadReports();
    } else if (activeTab === 'moderation') {
      loadModerationLogs();
    } else if (activeTab === 'security') {
      loadSecurityOverview();
    } else if (activeTab === 'analytics') {
      loadAnalytics();
    } else if (activeTab === 'ip-suspensions') {
      loadIPSuspensions();
    }
  };

  useEffect(() => {
    if (activeTab === 'security' && !securityOverview) {
      loadSecurityOverview();
    } else if (activeTab === 'analytics' && !analytics) {
      loadAnalytics();
    } else if (activeTab === 'ip-suspensions' && ipSuspensions.length === 0) {
      loadIPSuspensions();
    }
  }, [activeTab]);

  const createIPSuspensionForUser = async (userId: string, reason: string, duration: string) => {
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/users/${userId}/ip-suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          reason, 
          duration,
          includeConnectedAccounts: true 
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        loadUsers();
        setShowIPSuspensionModal(null);
        console.log('IP suspension created successfully:', data.message);
      } else {
        console.error('Failed to create IP suspension:', data.message);
      }
    } catch (error) {
      console.error('Error creating IP suspension:', error);
    }
  };

  const viewUserSessions = async (userId: string) => {
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/users/${userId}/sessions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setShowSessionLogsModal(userId);
        console.log('User sessions loaded:', data.sessions);
      } else {
        console.error('Failed to fetch user sessions:', data.message);
      }
    } catch (error) {
      console.error('Error fetching user sessions:', error);
    }
  };

  const viewUserLoginHistory = async (userId: string) => {
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/users/${userId}/login-history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();
      if (response.ok && data.success) {
        console.log('Login history loaded:', data.loginHistory);
      } else {
        console.error('Failed to fetch login history:', data.message);
      }
    } catch (error) {
      console.error('Error fetching login history:', error);
    }
  };

  const impersonateUser = async (userId: string) => {
    if (confirm('Are you sure you want to impersonate this user? This action will be logged.')) {
      try {
        const response = await fetch(`${NORMALIZED_API_URL}/api/admin/users/${userId}/impersonate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        const data = await response.json();
        if (response.ok && data.success) {
          console.log('Impersonation started:', data.message);
        } else {
          console.error('Failed to impersonate user:', data.message);
        }
      } catch (error) {
        console.error('Error impersonating user:', error);
      }
    }
  };

  const sendSystemMessage = async (userId: string, message: string) => {
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/admin/users/${userId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        console.log('System message sent successfully');
      } else {
        console.error('Failed to send system message:', data.message);
      }
    } catch (error) {
      console.error('Error sending system message:', error);
    }
  };

  const resetUserPassword = async (userId: string) => {
    if (confirm('Are you sure you want to reset this user\'s password? They will be notified via email.')) {
      try {
        const response = await fetch(`${NORMALIZED_API_URL}/api/admin/users/${userId}/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        const data = await response.json();
        if (response.ok && data.success) {
          console.log('Password reset successfully:', data.message);
        } else {
          console.error('Failed to reset password:', data.message);
        }
      } catch (error) {
        console.error('Error resetting password:', error);
      }
    }
  };

  const forceLogoutUser = async (userId: string) => {
    if (confirm('Are you sure you want to force logout this user from all devices?')) {
      try {
        const response = await fetch(`${NORMALIZED_API_URL}/api/admin/users/${userId}/force-logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        const data = await response.json();
        if (response.ok && data.success) {
          loadUsers();
          console.log('User force logged out successfully:', data.message);
        } else {
          console.error('Failed to force logout user:', data.message);
        }
      } catch (error) {
        console.error('Error forcing logout:', error);
      }
    }
  };

  const UserActionsDropdown = ({ userId, user }: { userId: string; user: AdminUser }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleActionClick = (action: () => void): void => {
      action();
      setIsOpen(false);
    };

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="p-1 rounded text-gray-600 hover:bg-gray-100"
          title="More Actions"
        >
          <MoreVertical size={16} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsOpen(false)}
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-8 z-20 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionClick(() => setSelectedUserDetail(userId));
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                >
                  <Eye size={16} className="mr-3 text-blue-600" />
                  View Full Details
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionClick(() => viewUserSessions(userId));
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                >
                  <Activity size={16} className="mr-3 text-purple-600" />
                  Session Logs
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionClick(() => viewUserLoginHistory(userId));
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                >
                  <Clock size={16} className="mr-3 text-indigo-600" />
                  Login History
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionClick(() => viewUserSessions(userId));
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                >
                  <Monitor size={16} className="mr-3 text-cyan-600" />
                  Device Information
                </button>

                <div className="border-t border-gray-100 my-2" />

                <div className="px-4 py-1">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Administrative</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionClick(() => setShowSuspensionModal(userId));
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center ${
                    user.isSuspended ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  <UserMinus size={16} className="mr-3" />
                  {user.isSuspended ? 'Unsuspend User' : 'Suspend User'}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionClick(() => {
                      const message = prompt('Enter system message to send to user:');
                      if (message && message.trim()) {
                        sendSystemMessage(userId, message);
                      }
                    });
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                >
                  <MessageSquare size={16} className="mr-3 text-green-600" />
                  Send Message
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionClick(() => resetUserPassword(userId));
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-orange-50 flex items-center text-orange-600"
                >
                  <Key size={16} className="mr-3" />
                  Reset Password
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionClick(() => forceLogoutUser(userId));
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-yellow-50 flex items-center text-yellow-600"
                >
                  <LogOut size={16} className="mr-3" />
                  Force Logout
                </button>

                <div className="border-t border-gray-100 my-2" />

                <div className="px-4 py-1">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Advanced</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionClick(() => impersonateUser(userId));
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-purple-50 flex items-center text-purple-600"
                >
                  <UserPlus size={16} className="mr-3" />
                  Impersonate User
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionClick(() => {
                      const notes = prompt('Enter admin notes for this user:', user.adminNotes || '');
                      if (notes !== null) {
                        console.log('Admin notes updated:', notes);
                      }
                    });
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                >
                  <Edit size={16} className="mr-3 text-gray-600" />
                  Edit Notes
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionClick(() => {
                      if (confirm(`Are you sure you want to delete ${user.username}'s account? This action cannot be undone.`)) {
                        console.log('Account deletion requested for user:', userId);
                      }
                    });
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center text-red-600"
                >
                  <Trash2 size={16} className="mr-3" />
                  Delete Account
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (user?.role !== 'admin') {
    return null;
  }

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
        className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 bg-gradient-to-r from-red-600 to-orange-600 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Shield size={24} className="mr-3" />
              <div>
                <h2 className="text-xl font-bold">Admin Panel</h2>
                <p className="text-red-100 text-sm">System Administration</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="flex space-x-1 bg-red-500/20 rounded-lg p-1">
            {[
              { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { key: 'users', label: 'Users', icon: Users },
              { key: 'reports', label: 'Reports', icon: Flag },
              { key: 'appeals', label: 'Appeals', icon: Gavel },
              { key: 'moderation', label: 'Activity Log', icon: History },
              { key: 'security', label: 'Security', icon: Shield },
              { key: 'analytics', label: 'Analytics', icon: TrendingUp },
              { key: 'ip-suspensions', label: 'IP Bans', icon: UserMinus },
              { key: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.key 
                    ? 'bg-white/20 text-white' 
                    : 'text-red-100 hover:bg-white/10'
                }`}
              >
                <tab.icon size={16} className="mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Dashboard Overview</h3>
              
              {loading && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                </div>
              )}
              
              {dashboardStats && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Users size={24} className="text-blue-600 mr-3" />
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Total Users</p>
                          <p className="text-2xl font-bold text-blue-900">{dashboardStats.totalUsers}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Flag size={24} className="text-yellow-600 mr-3" />
                        <div>
                          <p className="text-sm text-yellow-600 font-medium">Total Reports</p>
                          <p className="text-2xl font-bold text-yellow-900">{dashboardStats.totalReports}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Clock size={24} className="text-orange-600 mr-3" />
                        <div>
                          <p className="text-sm text-orange-600 font-medium">Pending Reports</p>
                          <p className="text-2xl font-bold text-orange-900">{dashboardStats.pendingReports}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <UserX size={24} className="text-red-600 mr-3" />
                        <div>
                          <p className="text-sm text-red-600 font-medium">Suspended Users</p>
                          <p className="text-2xl font-bold text-red-900">{dashboardStats.suspendedUsers}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {appealStats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <AlertOctagon size={24} className="text-purple-600 mr-3" />
                          <div>
                            <p className="text-sm text-purple-600 font-medium">Total Appeals</p>
                            <p className="text-2xl font-bold text-purple-900">{appealStats.total}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <Clock size={24} className="text-amber-600 mr-3" />
                          <div>
                            <p className="text-sm text-amber-600 font-medium">Pending Appeals</p>
                            <p className="text-2xl font-bold text-amber-900">{appealStats.pending}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <CheckCircle size={24} className="text-green-600 mr-3" />
                          <div>
                            <p className="text-sm text-green-600 font-medium">Approved Appeals</p>
                            <p className="text-2xl font-bold text-green-900">{appealStats.approved}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <X size={24} className="text-gray-600 mr-3" />
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Approval Rate</p>
                            <p className="text-2xl font-bold text-gray-900">{appealStats.approvalRate}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Recent Activity</h4>
                    <div className="space-y-3">
                      {dashboardStats.recentActivity?.map((activity: any, index: number) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium text-gray-900">
                                {activity.action?.replace('_', ' ')}
                              </span>
                              <p className="text-sm text-gray-700 mt-1">{activity.details}</p>
                              {activity.moderatorId && (
                                <p className="text-xs text-gray-500 mt-1">
                                  By {activity.moderatorId.username}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(activity.timestamp || activity.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Roles</option>
                  <option value="user">Users</option>
                  <option value="moderator">Moderators</option>
                  <option value="admin">Admins</option>
                </select>
                <button
                  onClick={loadUsers}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Refresh
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">User</th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Role</th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Security</th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Last Activity</th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(userItem => (
                      <tr key={userItem.id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900 flex items-center">
                              {userItem.username}
                              {userItem.securityFlags?.isVpnUser && (
                                <Wifi size={12} className="ml-2 text-orange-500" />
                              )}
                              {userItem.securityFlags?.hasMultipleAccounts && (
                                <Users size={12} className="ml-1 text-red-500" />
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{userItem.email}</div>
                            {userItem.ipCount && userItem.ipCount > 3 && (
                              <div className="text-xs text-orange-600">
                                {userItem.ipCount} IPs used
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-3">
                          <select
                            value={userItem.role}
                            onChange={(e) => updateUserRole(userItem.id, e.target.value as any)}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(userItem.role)}`}
                          >
                            <option value="user">User</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="border border-gray-200 px-4 py-3">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2">
                              {userItem.verified ? (
                                <CheckCircle size={16} className="text-green-500" />
                              ) : (
                                <AlertTriangle size={16} className="text-yellow-500" />
                              )}
                              <span className={`text-xs ${userItem.isSuspended ? 'text-red-600' : 'text-green-600'}`}>
                                {userItem.isSuspended ? 'Suspended' : 'Active'}
                              </span>
                            </div>
                            {userItem.riskScore && userItem.riskScore > 50 && (
                              <div className="text-xs text-red-600 flex items-center">
                                <AlertCircle size={12} className="mr-1" />
                                Risk: {userItem.riskScore}%
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-3">
                          <div className="flex flex-col space-y-1 text-xs">
                            {userItem.securityFlags && (
                              <div className="flex space-x-1">
                                {userItem.securityFlags.isVpnUser && (
                                  <span className="bg-orange-100 text-orange-800 px-1 rounded">VPN</span>
                                )}
                                {userItem.securityFlags.hasMultipleAccounts && (
                                  <span className="bg-red-100 text-red-800 px-1 rounded">Multi</span>
                                )}
                                {userItem.securityFlags.suspiciousActivity && (
                                  <span className="bg-yellow-100 text-yellow-800 px-1 rounded">Sus</span>
                                )}
                              </div>
                            )}
                            <div className="text-gray-600">
                              {userItem.deviceCount} devices
                            </div>
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">
                          <div className="flex flex-col">
                            <div>{userItem.lastLogin ? new Date(userItem.lastLogin).toLocaleDateString() : 'Never'}</div>
                            {userItem.lastSeenDays !== undefined && (
                              <div className="text-xs text-gray-500">
                                {userItem.lastSeenDays === 0 ? 'Today' : `${userItem.lastSeenDays}d ago`}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <UserActionsDropdown userId={userItem.id} user={userItem} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Reports</h3>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                  <option value="escalated">Escalated</option>
                </select>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as any)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="space-y-3">
                {reports.map(report => (
                  <div key={report._id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedReportDetail(report._id)}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{report.reportedUserId.username}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}`}>
                          {report.severity}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {report.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                        <Eye size={16} className="text-gray-400" />
                      </div>
                    </div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">{report.description}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>Type: {report.reportType.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>Category: {report.category}</span>
                          {report.assignedModerator && (
                            <>
                              <span>•</span>
                              <span>Assigned to: {report.assignedModerator.username}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            assignReport(report._id);
                          }}
                          className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                        >
                          {report.assignedModerator ? 'Assigned' : 'Assign to Me'}
                        </button>
                        <select
                          value={report.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateReportStatus(report._id, e.target.value);
                          }}
                          className="px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="pending">Pending</option>
                          <option value="under_review">Under Review</option>
                          <option value="resolved">Resolved</option>
                          <option value="dismissed">Dismissed</option>
                          <option value="escalated">Escalated</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'appeals' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Appeals</h3>
                <button
                  onClick={refreshCurrentTab}
                  className="flex items-center px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Refresh
                </button>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <select
                  value={selectedAppealStatus}
                  onChange={(e) => setSelectedAppealStatus(e.target.value as any)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="denied">Denied</option>
                </select>
              </div>

              <div className="space-y-3">
                {appeals.map(appeal => (
                  <div key={appeal.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer" onClick={() => setReviewingAppeal(appeal.id)}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{appeal.username}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          appeal.status === 'approved' ? 'bg-green-100 text-green-800' :
                          appeal.status === 'denied' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {appeal.status.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(appeal.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">{appeal.reason}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>Suspended until: {new Date(appeal.suspension.endDate).toLocaleDateString()}</span>
                          {appeal.adminResponse && (
                            <>
                              <span>•</span>
                              <span>Admin Response: {appeal.adminResponse}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setReviewingAppeal(appeal.id);
                            setAppealResponse('');
                          }}
                          className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'moderation' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Recent Moderation Actions</h3>
                <button
                  onClick={loadModerationLogs}
                  disabled={loading}
                  className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
                >
                  <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              
              <div className="space-y-2">
                {moderationLogs.map(log => (
                  <div key={log.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{log.username}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                          {log.severity}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{log.reason}</p>
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      Content: {log.content ? log.content.substring(0, 100) + (log.content.length > 100 ? '...' : '') : 'No content available'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Security Overview</h3>
              
              {loading && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                </div>
              )}
              
              {securityOverview && (
                <>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">High Risk Users</h4>
                    <div className="space-y-3">
                      {securityOverview.highRiskUsers.map((user, index) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium text-gray-900">{user.username}</span>
                              <p className="text-sm text-gray-700 mt-1">{user.email}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(user.riskLevel)}`}>
                                {user.riskLevel}
                              </span>
                              <span className="text-sm text-gray-500">
                                Risk Score: {user.riskScore}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Recent IPSuspensions</h4>
                    <div className="space-y-3">
                      {securityOverview.recentIPSuspensions.map((suspension, index) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium text-gray-900">{suspension.ip}</span>
                              <p className="text-sm text-gray-700 mt-1">{suspension.reason}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">
                                {new Date(suspension.startDate).toLocaleDateString()} - {new Date(suspension.endDate).toLocaleDateString()}
                              </span>
                              <span className="text-sm text-gray-500">
                                {suspension.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Patterns</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">VPN Users</span>
                        <span className="text-sm text-gray-500">{securityOverview.patterns.vpnUsers}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Multi-Account Users</span>
                        <span className="text-sm text-gray-500">{securityOverview.patterns.multiAccountUsers}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Suspicious Users</span>
                        <span className="text-sm text-gray-500">{securityOverview.patterns.suspiciousUsers}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Analytics</h3>
              
              {loading && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                </div>
              )}
              
              {analytics && (
                <>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Registration Trends</h4>
                    <div className="space-y-3">
                      {analytics.registrationTrends.map((trend, index) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium text-gray-900">{new Date(trend._id.year, trend._id.month - 1, trend._id.day).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">
                                {trend.count}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Activity</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Total Users</span>
                        <span className="text-sm text-gray-500">{analytics.activity.totalUsers}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Active Users</span>
                        <span className="text-sm text-gray-500">{analytics.activity.activeUsers}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">New Users</span>
                        <span className="text-sm text-gray-500">{analytics.activity.newUsers}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Suspended Users</span>
                        <span className="text-sm text-gray-500">{analytics.activity.suspendedUsers}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Average Play Time</span>
                        <span className="text-sm text-gray-500">{analytics.activity.averagePlayTime.toFixed(2)} minutes</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Total Sessions</span>
                        <span className="text-sm text-gray-500">{analytics.activity.totalSessions}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Risk Distribution</h4>
                    <div className="space-y-3">
                      {analytics.riskDistribution.map((distribution, index) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium text-gray-900">{distribution._id}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">
                                {distribution.count}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Geo Distribution</h4>
                    <div className="space-y-3">
                      {analytics.geoDistribution.map((distribution, index) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium text-gray-900">{distribution._id}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">
                                {distribution.count}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'ip-suspensions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">IP Suspensions</h3>
              
              {loading && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                </div>
              )}
              
              {ipSuspensions.map(suspension => (
                <div key={suspension._id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium text-gray-900">{suspension.ip}</span>
                      <p className="text-sm text-gray-700 mt-1">{suspension.reason}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {new Date(suspension.startDate).toLocaleDateString()} - {new Date(suspension.endDate).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-gray-500">
                        {suspension.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">System Settings</h3>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle size={20} className="text-yellow-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Admin Features</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      More admin features will be added here, such as content moderation settings, 
                      system configuration, and analytics.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {selectedUserDetail && (
        <UserDetailModal
          userId={selectedUserDetail}
          onClose={() => setSelectedUserDetail(null)}
          onUserUpdated={() => {
            loadUsers();
            setSelectedUserDetail(null);
          }}
        />
      )}

      {selectedReportDetail && (
        <ReportDetailModal
          reportId={selectedReportDetail}
          onClose={() => setSelectedReportDetail(null)}
          onReportUpdated={() => {
            loadReports();
            setSelectedReportDetail(null);
          }}
        />
      )}

      {reviewingAppeal && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setReviewingAppeal(null);
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Review Appeal</h3>
                <button
                  onClick={() => setReviewingAppeal(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              {(() => {
                const appeal = appeals.find(a => a.id === reviewingAppeal);
                if (!appeal) return null;
                
                return (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">User</label>
                          <p className="text-gray-900">{appeal.username}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Submitted</label>
                          <p className="text-gray-900">{new Date(appeal.submittedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-600">Original Suspension</label>
                        <p className="text-gray-900">{appeal.suspension?.reason}</p>
                        <p className="text-sm text-gray-500">
                          Until: {appeal.suspension ? new Date(appeal.suspension.endDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Appeal Reason</label>
                        <p className="text-gray-900 mt-1 p-3 bg-white rounded border">{appeal.reason}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Response (10-500 characters):
                      </label>
                      <textarea
                        value={appealResponse}
                        onChange={(e) => setAppealResponse(e.target.value)}
                        placeholder="Enter your response to this appeal..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                        rows={4}
                        maxLength={500}
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>{appealResponse.length < 10 ? `${10 - appealResponse.length} more characters needed` : 'Ready to submit'}</span>
                        <span>{appealResponse.length}/500</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <button
                        onClick={() => {
                          setReviewingAppeal(null);
                          setAppealResponse('');
                        }}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => reviewAppeal(reviewingAppeal!, 'deny', appealResponse)}
                        disabled={appealResponse.length < 10}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition-colors"
                      >
                        Deny Appeal
                      </button>
                      <button
                        onClick={() => reviewAppeal(reviewingAppeal!, 'approve', appealResponse)}
                        disabled={appealResponse.length < 10}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                      >
                        Approve Appeal
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        </div>
      )}

      {deleteUserModal && (
        <DeleteUserModal
          userId={deleteUserModal}
          username={users.find(u => u.id === deleteUserModal)?.username || ''}
          onClose={() => setDeleteUserModal(null)}
          onUserDeleted={loadUsers}
        />
      )}

      {showIPSuspensionModal && (
        <IPSuspensionModal
          userId={showIPSuspensionModal}
          username={users.find(u => u.id === showIPSuspensionModal)?.username || ''}
          onClose={() => setShowIPSuspensionModal(null)}
          onConfirm={createIPSuspensionForUser}
        />
      )}

      {showSuspensionModal && (
        <SuspensionModal
          userId={showSuspensionModal}
          username={users.find(u => u.id === showSuspensionModal)?.username || ''}
          currentlySuspended={users.find(u => u.id === showSuspensionModal)?.isSuspended || false}
          onClose={() => setShowSuspensionModal(null)}
          onConfirm={toggleUserSuspend}
        />
      )}

      {showSessionLogsModal && (
        <SessionLogsModal
          userId={showSessionLogsModal}
          username={users.find(u => u.id === showSessionLogsModal)?.username || ''}
          onClose={() => setShowSessionLogsModal(null)}
        />
      )}
    </motion.div>
  );
} 