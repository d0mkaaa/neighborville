/**
 * Format a date to a human readable string relative to now
 * e.g. "5 minutes ago", "2 hours ago", "yesterday", "5 days ago"
 */
export function formatDistanceToNow(date: Date | string | number): string {
  const now = new Date();
  const inputDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - inputDate.getTime()) / 1000);
  
  if (isNaN(diffInSeconds)) {
    return 'Invalid date';
  }
  
  if (diffInSeconds < 5) {
    return 'just now';
  }
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInDays === 1) {
    return 'yesterday';
  }
  
  if (diffInDays < 30) {
    return `${diffInDays} days ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  
  return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
}

/**
 * Format a date to a locale string with specified options
 */
export function formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  const inputDate = new Date(date);
  
  if (isNaN(inputDate.getTime())) {
    return 'Invalid date';
  }
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Intl.DateTimeFormat('en-US', options || defaultOptions).format(inputDate);
}

/**
 * Format a date to just the time part
 */
export function formatTime(date: Date | string | number): string {
  const inputDate = new Date(date);
  
  if (isNaN(inputDate.getTime())) {
    return 'Invalid time';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(inputDate);
} 