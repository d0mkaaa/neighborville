import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

interface SuspensionData {
  id?: string;
  reason: string;
  startDate: string;
  endDate: string;
  issuedBy: string;
  timeRemaining: number;
  isPermanent: boolean;
  canAppeal?: boolean;
  type?: 'user' | 'ip';
  appeal?: {
    id: string;
    reason: string;
    status: 'pending' | 'approved' | 'denied';
    submittedAt: string;
    adminResponse?: string;
  } | null;
}

interface SuspensionCheckResult {
  isSuspended: boolean;
  suspensionData: SuspensionData | null;
  isLoading: boolean;
  error: string | null;
  checkStatus: () => Promise<void>;
}

export const useSuspensionCheck = (): SuspensionCheckResult => {
  const { user, refreshUser, isLoading: authLoading, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      setError(null);
      await refreshUser();
    } catch (err) {
      console.error('Error refreshing user status:', err);
      setError('Failed to check suspension status');
    }
  }, [refreshUser]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const timer = setTimeout(() => {
        checkStatus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user?.id, checkStatus]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [checkStatus, isAuthenticated]);

  return {
    isSuspended: user?.isSuspended || false,
    suspensionData: user?.activeSuspension || null,
    isLoading: authLoading,
    error,
    checkStatus
  };
}; 