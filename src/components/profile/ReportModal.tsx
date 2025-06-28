import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flag, X, AlertTriangle, User, MessageSquare, Globe, MapPin, Heart, Gamepad2, CheckCircle, XCircle } from 'lucide-react';
import { NORMALIZED_API_URL } from '../../config/apiConfig';
import { getAuthToken } from '../../services/userService';

interface ReportedUser {
  id: string;
  username: string;
  displayName: string;
}

interface ReportableContent {
  bio?: string;
  location?: string;
  website?: string;
  interests?: string[];
  gamePreferences?: {
    favoriteBuilding?: string;
    playStyle?: string;
  };
}

interface ReportData {
  reportType: string;
  category: string;
  description: string;
  evidence?: string;
  specificContent?: {
    type: string;
    content: string;
  };
}

interface ReportModalProps {
  reportedUser: ReportedUser;
  reportableContent: ReportableContent;
  onClose: () => void;
  onSubmit: (reportData: ReportData) => void;
}

const REPORT_TYPES = [
  {
    id: 'inappropriate_profile',
    name: 'Inappropriate Profile Content',
    description: 'Bio, location, or other profile information that violates community guidelines',
    icon: <User size={20} />,
    categories: [
      'hate_speech', 'harassment', 'sexual_content', 'spam', 'personal_info', 
      'offensive_language', 'inappropriate_images', 'misleading_info', 'other'
    ]
  },
  {
    id: 'harassment',
    name: 'Harassment or Bullying',
    description: 'Targeting, intimidating, or bullying behavior',
    icon: <AlertTriangle size={20} />,
    categories: [
      'targeted_harassment', 'bullying', 'threats', 'doxxing', 'stalking',
      'unwanted_contact', 'intimidation', 'cyberbullying', 'other'
    ]
  },
  {
    id: 'spam',
    name: 'Spam or Fake Account',
    description: 'Spam content, fake account, or promotional abuse',
    icon: <MessageSquare size={20} />,
    categories: [
      'spam_content', 'fake_account', 'promotional_abuse', 'bot_activity',
      'duplicate_account', 'scam_attempt', 'phishing', 'malicious_links', 'other'
    ]
  },
  {
    id: 'hate_speech',
    name: 'Hate Speech',
    description: 'Content that promotes hatred or discrimination',
    icon: <XCircle size={20} />,
    categories: [
      'racial_discrimination', 'religious_hatred', 'gender_discrimination', 
      'sexual_orientation_discrimination', 'disability_discrimination', 
      'age_discrimination', 'nationality_discrimination', 'other_discrimination', 'other'
    ]
  },
  {
    id: 'impersonation',
    name: 'Impersonation',
    description: 'Pretending to be someone else or a fake identity',
    icon: <User size={20} />,
    categories: [
      'celebrity_impersonation', 'user_impersonation', 'brand_impersonation',
      'government_impersonation', 'organization_impersonation', 'identity_theft', 'other'
    ]
  },
  {
    id: 'inappropriate_content',
    name: 'Inappropriate Content',
    description: 'Sexual, violent, or otherwise inappropriate content',
    icon: <Flag size={20} />,
    categories: [
      'sexual_content', 'violent_content', 'disturbing_content', 'illegal_content',
      'graphic_content', 'self_harm', 'drug_content', 'weapon_content', 'other'
    ]
  },
  {
    id: 'privacy_violation',
    name: 'Privacy Violation',
    description: 'Sharing private information without consent',
    icon: <AlertTriangle size={20} />,
    categories: [
      'personal_info_sharing', 'private_photos', 'contact_info', 'location_sharing',
      'financial_info', 'medical_info', 'family_info', 'other'
    ]
  },
  {
    id: 'cheating_exploitation',
    name: 'Cheating or Exploitation',
    description: 'Game cheating, exploits, or unfair advantages',
    icon: <Gamepad2 size={20} />,
    categories: [
      'game_cheating', 'exploit_abuse', 'unfair_advantage', 'account_sharing',
      'real_money_trading', 'griefing', 'game_disruption', 'other'
    ]
  }
];

const CATEGORY_DESCRIPTIONS = {
  hate_speech: 'Content that promotes hatred based on race, religion, gender, etc.',
  harassment: 'Targeted harassment, bullying, or intimidation',
  sexual_content: 'Inappropriate sexual content or imagery',
  spam: 'Repetitive, promotional, or irrelevant content',
  personal_info: 'Sharing personal information without consent',
  offensive_language: 'Use of profanity, slurs, or offensive language',
  inappropriate_images: 'Profile pictures or images that violate guidelines',
  misleading_info: 'False or misleading information in profile',
  
  targeted_harassment: 'Specifically targeting an individual with harmful content',
  bullying: 'Intimidating or aggressive behavior',
  threats: 'Threats of violence or harm',
  doxxing: 'Sharing private personal information',
  stalking: 'Persistent unwanted contact or following',
  unwanted_contact: 'Continued contact after being asked to stop',
  intimidation: 'Behavior intended to frighten or coerce',
  cyberbullying: 'Online bullying or harassment',
  
  spam_content: 'Repetitive or promotional spam',
  fake_account: 'Account appears to be fake or automated',
  promotional_abuse: 'Excessive self-promotion or advertising',
  bot_activity: 'Automated or bot-like behavior',
  duplicate_account: 'Multiple accounts by the same person',
  scam_attempt: 'Attempting to scam or defraud users',
  phishing: 'Attempting to steal personal information',
  malicious_links: 'Sharing harmful or malicious links',
  
  racial_discrimination: 'Content discriminating based on race or ethnicity',
  religious_hatred: 'Content promoting hatred based on religion',
  gender_discrimination: 'Content discriminating based on gender',
  sexual_orientation_discrimination: 'Discrimination based on sexual orientation',
  disability_discrimination: 'Discrimination against people with disabilities',
  age_discrimination: 'Discrimination based on age',
  nationality_discrimination: 'Discrimination based on nationality or origin',
  other_discrimination: 'Other forms of discrimination or hatred',
  
  celebrity_impersonation: 'Pretending to be a celebrity or public figure',
  user_impersonation: 'Pretending to be another user',
  brand_impersonation: 'Pretending to represent a brand or organization',
  government_impersonation: 'Pretending to be a government official',
  organization_impersonation: 'Pretending to represent an organization',
  identity_theft: 'Using someone else\'s identity without permission',
  
  violent_content: 'Content depicting or promoting violence',
  disturbing_content: 'Content that is disturbing or graphic',
  illegal_content: 'Content that may be illegal',
  graphic_content: 'Excessively graphic or disturbing imagery',
  self_harm: 'Content promoting or depicting self-harm',
  drug_content: 'Content promoting illegal drug use',
  weapon_content: 'Inappropriate content involving weapons',
  
  personal_info_sharing: 'Sharing someone\'s personal information',
  private_photos: 'Sharing private photos without consent',
  contact_info: 'Sharing contact information without permission',
  location_sharing: 'Sharing someone\'s location without consent',
  financial_info: 'Sharing financial or payment information',
  medical_info: 'Sharing private medical information',
  family_info: 'Sharing information about family members',
  
  game_cheating: 'Using cheats, hacks, or exploits in the game',
  exploit_abuse: 'Abusing game bugs or exploits',
  unfair_advantage: 'Gaining unfair advantages over other players',
  account_sharing: 'Sharing account credentials with others',
  real_money_trading: 'Trading game items for real money',
  griefing: 'Intentionally disrupting other players\' experience',
  game_disruption: 'Behavior that disrupts normal gameplay',
  
  other: 'Other issues not covered by the above categories'
};

export default function ReportModal({ reportedUser, reportableContent, onClose, onSubmit }: ReportModalProps) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState('');
  const [selectedContent, setSelectedContent] = useState<{ type: string; content: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [existingReports, setExistingReports] = useState<any[]>([]);
  const [canReport, setCanReport] = useState(true);

  useEffect(() => {
    if (reportedUser.username) {
      checkExistingReports();
    }
  }, []);

  const checkExistingReports = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${NORMALIZED_API_URL}/api/reports/check-existing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reportedUsername: reportedUser.username
        })
      });

      const data = await response.json();
      if (data.success) {
        setExistingReports(data.reports || []);
        setCanReport(data.canReport !== false);
      }
    } catch (error) {
      console.error('Error checking existing reports:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType || !selectedCategory || !description.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (description.trim().length < 20) {
      setErrorMessage('Please provide a more detailed description (at least 20 characters).');
      return;
    }

    if (description.trim().length > 1000) {
      setErrorMessage('Description is too long (maximum 1000 characters).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('You must be logged in to submit a report.');
      }

      const reportData = {
        reportedUsername: reportedUser.username,
        reportType: selectedType,
        category: selectedCategory,
        description: description.trim(),
        evidence: evidence.trim() || undefined,
        specificContent: selectedContent || undefined
      };

      const response = await fetch(`${NORMALIZED_API_URL}/api/reports/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reportData)
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus('success');
        setTimeout(() => {
          onSubmit(reportData);
        }, 2000);
      } else {
        throw new Error(data.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit report. Please try again.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'bio': return <MessageSquare size={16} />;
      case 'location': return <MapPin size={16} />;
      case 'website': return <Globe size={16} />;
      case 'interests': return <Heart size={16} />;
      case 'gamePreferences': return <Gamepad2 size={16} />;
      default: return <User size={16} />;
    }
  };

  const renderContentSelection = () => {
    const availableContent = [];

    if (reportableContent.bio) {
      availableContent.push({
        type: 'bio',
        label: 'Bio',
        content: reportableContent.bio,
        icon: <MessageSquare size={16} />
      });
    }

    if (reportableContent.location) {
      availableContent.push({
        type: 'location',
        label: 'Location',
        content: reportableContent.location,
        icon: <MapPin size={16} />
      });
    }

    if (reportableContent.website) {
      availableContent.push({
        type: 'website',
        label: 'Website',
        content: reportableContent.website,
        icon: <Globe size={16} />
      });
    }

    if (reportableContent.interests && reportableContent.interests.length > 0) {
      availableContent.push({
        type: 'interests',
        label: 'Interests',
        content: reportableContent.interests.join(', '),
        icon: <Heart size={16} />
      });
    }

    if (reportableContent.gamePreferences) {
      const prefs = [];
      if (reportableContent.gamePreferences.favoriteBuilding) {
        prefs.push(`Favorite Building: ${reportableContent.gamePreferences.favoriteBuilding}`);
      }
      if (reportableContent.gamePreferences.playStyle) {
        prefs.push(`Play Style: ${reportableContent.gamePreferences.playStyle}`);
      }
      if (prefs.length > 0) {
        availableContent.push({
          type: 'gamePreferences',
          label: 'Game Preferences',
          content: prefs.join(', '),
          icon: <Gamepad2 size={16} />
        });
      }
    }

    if (availableContent.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <User size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No specific content available to report.</p>
          <p className="text-sm mt-2">You can still report this user's general behavior.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 mb-4">
          Select specific content you want to report (optional):
        </p>
        
        <div className="space-y-2">
          {availableContent.map((item) => (
            <div
              key={item.type}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                selectedContent?.type === item.type
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedContent(
                  selectedContent?.type === item.type 
                    ? null 
                    : { type: item.type, content: item.content }
                );
              }}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900">{item.label}</div>
                  <div className="text-sm text-gray-600 mt-1 break-words">
                    {item.content.length > 100 
                      ? `${item.content.substring(0, 100)}...` 
                      : item.content
                    }
                  </div>
                </div>
                {selectedContent?.type === item.type && (
                  <CheckCircle size={20} className="text-red-500 flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!canReport) {
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
          className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <AlertTriangle size={48} className="mx-auto mb-4 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Limit Reached</h3>
            <p className="text-gray-600 mb-4">
              You have already reported this user recently. Please wait 24 hours before submitting another report.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (submitStatus === 'success') {
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
          className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Submitted</h3>
            <p className="text-gray-600 mb-4">
              Thank you for helping keep our community safe. We'll review your report and take appropriate action.
            </p>
            <div className="text-sm text-gray-500">
              Closing automatically...
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

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
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-red-600 text-white flex justify-between items-center">
          <h2 className="text-lg font-medium flex items-center">
            <Flag size={20} className="mr-2" />
            Report User
          </h2>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors text-xl"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                <User size={20} className="text-gray-600" />
              </div>
              <div>
                <div className="font-medium">{reportedUser.displayName}</div>
                <div className="text-sm text-gray-600">@{reportedUser.username}</div>
              </div>
            </div>
          </div>

          {existingReports.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6">
              <div className="flex items-start">
                <AlertTriangle size={20} className="text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-amber-800">Previous Reports</div>
                  <div className="text-sm text-amber-700 mt-1">
                    You have submitted {existingReports.length} report{existingReports.length !== 1 ? 's' : ''} about this user in the past 24 hours.
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">What are you reporting?</h3>
              <div className="space-y-3">
                {REPORT_TYPES.map((type) => (
                  <div
                    key={type.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedType === type.id
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedType(type.id);
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {type.icon}
                      </div>
                      <div>
                        <div className="font-medium">{type.name}</div>
                        <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedType}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center mb-4">
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-600 hover:text-gray-800 mr-3"
                >
                  ← Back
                </button>
                <h3 className="text-lg font-semibold">Provide details</h3>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Category *
                </label>
                <div className="space-y-2">
                  {REPORT_TYPES.find(t => t.id === selectedType)?.categories.map((category) => (
                    <div
                      key={category}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedCategory === category
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategory(category);
                      }}
                    >
                      <div className="font-medium text-sm">{category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {CATEGORY_DESCRIPTIONS[category as keyof typeof CATEGORY_DESCRIPTIONS]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Specific Content (Optional)
                </label>
                {renderContentSelection()}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedCategory}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="flex items-center mb-4">
                <button
                  onClick={() => setStep(2)}
                  className="text-gray-600 hover:text-gray-800 mr-3"
                >
                  ← Back
                </button>
                <h3 className="text-lg font-semibold">Additional information</h3>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe the issue in detail. What happened? When did it occur? Any additional context that would help us understand the situation."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  rows={4}
                  maxLength={1000}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {description.length}/1000 characters (minimum 20 required)
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Evidence (Optional)
                </label>
                <textarea
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder="Any additional evidence, context, or information that supports your report."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  rows={3}
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {evidence.length}/500 characters
                </div>
              </div>

              {selectedContent && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-2">Reported Content:</div>
                  <div className="flex items-start space-x-2">
                    {getContentIcon(selectedContent.type)}
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{selectedContent.type}:</span> {selectedContent.content}
                    </div>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {errorMessage}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !description.trim() || description.trim().length < 20}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
} 