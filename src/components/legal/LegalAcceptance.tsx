import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, FileText, Check, AlertCircle, ExternalLink, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { updateLegalAcceptance } from "../../services/userService";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";

interface LegalAcceptanceProps {
  onAccept: (acceptanceData?: { termsOfService: boolean; privacyPolicy: boolean; marketingConsent: boolean }) => void;
  onDecline: () => void;
  isRequired?: boolean;
  skipServerSave?: boolean;
}

interface ReadingProgress {
  hasStartedReading: boolean;
  hasFinishedReading: boolean;
  scrollProgress: number;
}

export default function LegalAcceptance({ onAccept, onDecline, isRequired = false, skipServerSave = false }: LegalAcceptanceProps) {
  const [termsOfService, setTermsOfService] = useState(false);
  const [privacyPolicy, setPrivacyPolicy] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingDocument, setViewingDocument] = useState<'privacy' | 'terms' | null>(null);

  const [privacyReadingProgress, setPrivacyReadingProgress] = useState<ReadingProgress>({
    hasStartedReading: false,
    hasFinishedReading: false,
    scrollProgress: 0
  });
  
  const [termsReadingProgress, setTermsReadingProgress] = useState<ReadingProgress>({
    hasStartedReading: false,
    hasFinishedReading: false,
    scrollProgress: 0
  });

  const canAcceptPrivacy = privacyReadingProgress.hasFinishedReading;
  const canAcceptTerms = termsReadingProgress.hasFinishedReading;

  const handlePrivacyReadingProgress = (progress: ReadingProgress) => {
    setPrivacyReadingProgress(progress);
  };

  const handleTermsReadingProgress = (progress: ReadingProgress) => {
    setTermsReadingProgress(progress);
  };

  const handleSubmit = async () => {
    if (!termsOfService || !privacyPolicy) {
      setError('You must accept both the Privacy Policy and Terms of Service to continue.');
      return;
    }

    if (!canAcceptPrivacy || !canAcceptTerms) {
      setError('Please read the complete Privacy Policy and Terms of Service before accepting.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const acceptanceData = {
        termsOfService,
        privacyPolicy,
        marketingConsent,
        version: '1.0.0'
      };

      if (!skipServerSave) {
        await updateLegalAcceptance(acceptanceData);
      }

      onAccept({
        termsOfService,
        privacyPolicy,
        marketingConsent
      });
    } catch (err) {
      console.error('Error saving legal acceptance:', err);
      setError('Failed to save acceptance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocumentClose = () => {
    setViewingDocument(null);
  };

  if (viewingDocument === 'privacy') {
    return (
      <PrivacyPolicy
        onClose={handleDocumentClose}
        onReadingProgress={handlePrivacyReadingProgress}
        requireFullReading={true}
      />
    );
  }

  if (viewingDocument === 'terms') {
    return (
      <TermsOfService
        onClose={handleDocumentClose}
        onReadingProgress={handleTermsReadingProgress}
        requireFullReading={true}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full mx-auto overflow-hidden border border-white/20"
    >
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Legal Requirements</h2>
            <p className="text-blue-100 text-sm">Please review and accept our policies to continue</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-1">Required Reading</h3>
              <p className="text-blue-700 text-sm">
                You must read the complete Privacy Policy and Terms of Service before you can accept them. 
                Scroll to the bottom of each document to enable the acceptance checkboxes.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Shield size={16} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Privacy Policy</h3>
                  <p className="text-sm text-gray-600">How I handle your personal information</p>
                </div>
              </div>
              <button
                onClick={() => setViewingDocument('privacy')}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
              >
                <Eye size={16} />
                Read Document
              </button>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Reading Progress</span>
                <span className="text-emerald-600 font-medium">{privacyReadingProgress.scrollProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${privacyReadingProgress.scrollProgress}%` }}
                />
              </div>
              {privacyReadingProgress.hasStartedReading && !privacyReadingProgress.hasFinishedReading && (
                <p className="text-xs text-gray-500 mt-1">Keep reading to enable acceptance...</p>
              )}
              {privacyReadingProgress.hasFinishedReading && (
                <p className="text-xs text-emerald-600 mt-1 font-medium">✓ Reading complete!</p>
              )}
            </div>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyPolicy}
                onChange={(e) => setPrivacyPolicy(e.target.checked)}
                disabled={!canAcceptPrivacy}
                className={`w-5 h-5 text-emerald-600 border-2 rounded focus:ring-emerald-500 ${
                  !canAcceptPrivacy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              />
              <span className={`text-sm ${!canAcceptPrivacy ? 'text-gray-400' : 'text-gray-700'}`}>
                I have read and accept the Privacy Policy
              </span>
              {privacyPolicy && canAcceptPrivacy && (
                <CheckCircle2 size={16} className="text-emerald-500" />
              )}
            </label>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText size={16} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Terms of Service</h3>
                  <p className="text-sm text-gray-600">Rules and guidelines for using NeighborVille</p>
                </div>
              </div>
              <button
                onClick={() => setViewingDocument('terms')}
                className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
              >
                <Eye size={16} />
                Read Document
              </button>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Reading Progress</span>
                <span className="text-purple-600 font-medium">{termsReadingProgress.scrollProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${termsReadingProgress.scrollProgress}%` }}
                />
              </div>
              {termsReadingProgress.hasStartedReading && !termsReadingProgress.hasFinishedReading && (
                <p className="text-xs text-gray-500 mt-1">Keep reading to enable acceptance...</p>
              )}
              {termsReadingProgress.hasFinishedReading && (
                <p className="text-xs text-purple-600 mt-1 font-medium">✓ Reading complete!</p>
              )}
            </div>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsOfService}
                onChange={(e) => setTermsOfService(e.target.checked)}
                disabled={!canAcceptTerms}
                className={`w-5 h-5 text-purple-600 border-2 rounded focus:ring-purple-500 ${
                  !canAcceptTerms ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              />
              <span className={`text-sm ${!canAcceptTerms ? 'text-gray-400' : 'text-gray-700'}`}>
                I have read and accept the Terms of Service
              </span>
              {termsOfService && canAcceptTerms && (
                <CheckCircle2 size={16} className="text-purple-500" />
              )}
            </label>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <ExternalLink size={16} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Marketing Communications</h3>
                <p className="text-sm text-gray-600">Optional updates about NeighborVille</p>
              </div>
            </div>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-2 rounded focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700">
                I'd like to receive updates about new features and improvements (optional)
              </span>
              {marketingConsent && (
                <CheckCircle2 size={16} className="text-blue-500" />
              )}
            </label>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
          >
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </motion.div>
        )}

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onDecline}
            className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            disabled={isSubmitting}
          >
            Decline
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={!termsOfService || !privacyPolicy || !canAcceptPrivacy || !canAcceptTerms || isSubmitting}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              (!termsOfService || !privacyPolicy || !canAcceptPrivacy || !canAcceptTerms || isSubmitting)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Accept & Continue</span>
              </>
            )}
          </motion.button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          <p>
            By accepting, you acknowledge that you have read and understood both documents in their entirety. 
            You can review these policies anytime from the settings menu.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
