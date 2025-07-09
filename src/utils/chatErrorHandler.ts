export interface ChatErrorDetails {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  actionable?: string;
  duration?: number;
}

export interface SecurityError {
  success: false;
  message: string;
  rateLimitType?: string;
  retryAfter?: number;
  moderation?: {
    reason: string;
    severity: string;
    violationType: string;
    cleanedText?: string;
    suggestionsEnabled?: boolean;
    flaggedWords?: string[];
    flaggedPatterns?: string[];
  };
  spamType?: string;
  floodType?: string;
  maxLength?: number;
  currentLength?: number;
  maxUrls?: number;
  foundUrls?: number;
  maxMentions?: number;
  foundMentions?: number;
  validActions?: string[];
  validDurations?: number[];
  allowPermanent?: boolean;
}

export function handleChatError(error: any): ChatErrorDetails {
  if (!error.response) {
    return {
      type: 'error',
      title: 'Connection Error',
      message: 'Unable to connect to chat. Please check your internet connection.',
      actionable: 'Try again in a moment',
      duration: 7000
    };
  }

  const errorData: SecurityError = error.response?.data || error;
  const status = error.response?.status || 500;

  if (status === 429) {
    if (errorData.rateLimitType === 'burst') {
      return {
        type: 'warning',
        title: 'Slow Down!',
        message: 'You\'re typing too fast. Please wait a moment before sending another message.',
        actionable: 'Take a breath and try again',
        duration: 5000
      };
    }
    
    if (errorData.rateLimitType === 'global') {
      return {
        type: 'warning',
        title: 'Rate Limited',
        message: 'You\'ve sent too many messages recently. Please wait before sending more.',
        actionable: `Try again in ${Math.ceil((errorData.retryAfter || 60) / 60)} minute(s)`,
        duration: 8000
      };
    }
    
    if (errorData.floodType === 'duplicate') {
      return {
        type: 'warning',
        title: 'Duplicate Message',
        message: 'You\'re sending the same message repeatedly.',
        actionable: 'Try sending different messages',
        duration: 6000
      };
    }
    
    return {
      type: 'warning',
      title: 'Too Many Messages',
      message: 'You\'re sending messages too quickly.',
      actionable: `Please wait ${errorData.retryAfter || 60} seconds before trying again`,
      duration: 7000
    };
  }

  if (status === 400 && errorData.moderation) {
    const { moderation } = errorData;
    
    if (moderation.violationType === 'profanity' || moderation.violationType === 'hate_speech') {
      return {
        type: 'error',
        title: 'Message Blocked',
        message: `Your message contains inappropriate language and was blocked.`,
        actionable: moderation.cleanedText 
          ? `Try this instead: "${moderation.cleanedText}"` 
          : 'Please rephrase your message without offensive language',
        duration: 10000
      };
    }
    
    if (moderation.violationType === 'spam') {
      return {
        type: 'warning',
        title: 'Spam Detected',
        message: 'Your message appears to be spam.',
        actionable: 'Please send normal, conversational messages',
        duration: 7000
      };
    }
    
    if (moderation.violationType === 'personal_info') {
      return {
        type: 'warning',
        title: 'Personal Information Detected',
        message: 'Your message may contain personal information.',
        actionable: 'For your safety, avoid sharing personal details in chat',
        duration: 9000
      };
    }
    
    if (moderation.violationType === 'sexual_content') {
      return {
        type: 'error',
        title: 'Inappropriate Content',
        message: 'Your message contains inappropriate content.',
        actionable: 'Please keep conversations family-friendly',
        duration: 8000
      };
    }
    
    if (moderation.violationType === 'threats') {
      return {
        type: 'error',
        title: 'Threatening Content Detected',
        message: 'Your message contains threatening language.',
        actionable: 'Please be respectful in your communications',
        duration: 10000
      };
    }
    
    return {
      type: 'error',
      title: 'Message Blocked',
      message: moderation.reason || 'Your message violates community guidelines.',
      actionable: moderation.cleanedText 
        ? `Suggested edit: "${moderation.cleanedText}"` 
        : 'Please rephrase your message appropriately',
      duration: 8000
    };
  }

  if (status === 400 && errorData.spamType === 'pattern_detected') {
    return {
      type: 'warning',
      title: 'Spam Pattern Detected',
      message: 'Your message appears to contain spam patterns.',
      actionable: 'Please send normal messages without excessive repetition',
      duration: 7000
    };
  }

  if (status === 400) {
    if (errorData.maxLength && errorData.currentLength) {
      return {
        type: 'warning',
        title: 'Message Too Long',
        message: `Your message is ${errorData.currentLength} characters but the limit is ${errorData.maxLength}.`,
        actionable: `Please shorten by ${errorData.currentLength - errorData.maxLength} characters`,
        duration: 6000
      };
    }
    
    if (errorData.maxUrls && errorData.foundUrls) {
      return {
        type: 'warning',
        title: 'Too Many Links',
        message: `You can only include ${errorData.maxUrls} link(s) per message, but you have ${errorData.foundUrls}.`,
        actionable: 'Please remove some links and try again',
        duration: 7000
      };
    }
    
    if (errorData.maxMentions && errorData.foundMentions) {
      return {
        type: 'warning',
        title: 'Too Many Mentions',
        message: `You can only mention ${errorData.maxMentions} people per message, but you have ${errorData.foundMentions}.`,
        actionable: 'Please reduce the number of @mentions',
        duration: 7000
      };
    }
    
    if (errorData.message?.includes('empty') || errorData.message?.includes('required')) {
      return {
        type: 'warning',
        title: 'Empty Message',
        message: 'You cannot send an empty message.',
        actionable: 'Please type something before sending',
        duration: 4000
      };
    }
  }

  if (status === 403) {
    if (errorData.message?.includes('banned')) {
      return {
        type: 'error',
        title: 'Banned from Chat',
        message: 'You are banned from this chat room.',
        actionable: 'Contact a moderator if you believe this is an error',
        duration: 10000
      };
    }
    
    if (errorData.message?.includes('muted')) {
      return {
        type: 'warning',
        title: 'Muted in Chat',
        message: 'You are currently muted in this chat room.',
        actionable: 'Wait for your mute to expire or contact a moderator',
        duration: 8000
      };
    }
    
    if (errorData.message?.includes('conversation')) {
      return {
        type: 'error',
        title: 'Access Denied',
        message: 'You don\'t have permission to access this conversation.',
        actionable: 'Make sure you\'re part of this conversation',
        duration: 7000
      };
    }
    
    return {
      type: 'error',
      title: 'Permission Denied',
      message: 'You don\'t have permission to perform this action.',
      actionable: 'Contact support if you believe this is an error',
      duration: 7000
    };
  }

  if (errorData.validActions || errorData.validDurations) {
    return {
      type: 'warning',
      title: 'Invalid Moderation Action',
      message: errorData.message || 'The moderation action you attempted is not valid.',
      actionable: errorData.validActions 
        ? `Valid actions: ${errorData.validActions.join(', ')}` 
        : 'Please check the action parameters',
      duration: 8000
    };
  }

  if (status >= 500) {
    return {
      type: 'error',
      title: 'Server Error',
      message: 'Something went wrong on our end.',
      actionable: 'Please try again in a moment',
      duration: 6000
    };
  }

  return {
    type: 'error',
    title: 'Message Failed',
    message: errorData.message || 'Unable to send your message.',
    actionable: 'Please try again',
    duration: 5000
  };
}

export function formatModerationSuggestion(moderation: SecurityError['moderation']): string | null {
  if (!moderation?.cleanedText) return null;
  
  const maxLength = 100;
  if (moderation.cleanedText.length > maxLength) {
    return `"${moderation.cleanedText.substring(0, maxLength)}..."`;
  }
  
  return `"${moderation.cleanedText}"`;
}

export function isSecurityError(error: any): boolean {
  const status = error.response?.status;
  const errorData = error.response?.data || error;
  
  return status === 429 ||
         status === 403 ||
         (status === 400 && (errorData.moderation || errorData.spamType || errorData.floodType));
}

export function getNotificationDuration(errorType: ChatErrorDetails['type'], severity?: string): number {
  if (severity === 'critical') return 15000;
  if (severity === 'high') return 12000;
  if (severity === 'medium') return 8000;
  
  switch (errorType) {
    case 'error': return 10000;
    case 'warning': return 7000;
    case 'info': return 5000;
    default: return 6000;
  }
} 