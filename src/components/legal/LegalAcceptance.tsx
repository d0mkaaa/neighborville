import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, AlertCircle, ExternalLink } from "lucide-react";
import { updateLegalAcceptance } from "../../services/userService";

interface LegalAcceptanceProps {
  onAccept: (acceptanceData?: { termsOfService: boolean; privacyPolicy: boolean; marketingConsent: boolean }) => void;
  onDecline: () => void;
  isRequired?: boolean;
  skipServerSave?: boolean;
}

export default function LegalAcceptance({ onAccept, onDecline, isRequired = false, skipServerSave = false }: LegalAcceptanceProps) {
  const [termsOfService, setTermsOfService] = useState(false);
  const [privacyPolicy, setPrivacyPolicy] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!termsOfService || !privacyPolicy) {
      setError('You must accept both the Privacy Policy and Terms of Service to continue.');
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
            <h2 className="text-xl font-bold">Terms & Privacy</h2>
            <p className="text-blue-100 text-sm">Please review and accept our terms</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-1">Review Required Documents</h3>
              <p className="text-blue-700 text-sm">
                Please review our Privacy Policy and Terms of Service before continuing. 
                Click the links below to open them in a new tab.
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
                  <p className="text-sm text-gray-600">How we handle your personal information</p>
                </div>
              </div>
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
              >
                <ExternalLink size={16} />
                Read Document
              </a>
            </div>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyPolicy}
                onChange={(e) => setPrivacyPolicy(e.target.checked)}
                className="w-5 h-5 text-emerald-600 border-2 rounded focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700">
                I have read and accept the Privacy Policy
              </span>
            </label>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield size={16} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Terms of Service</h3>
                  <p className="text-sm text-gray-600">Rules and guidelines for using our service</p>
                </div>
              </div>
              <a
                href="/tos"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                <ExternalLink size={16} />
                Read Document
              </a>
            </div>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsOfService}
                onChange={(e) => setTermsOfService(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-2 rounded focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700">
                I have read and accept the Terms of Service
              </span>
            </label>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="w-5 h-5 text-purple-600 border-2 rounded focus:ring-purple-500 cursor-pointer mt-0.5"
              />
              <div>
                <span className="text-sm text-gray-700 font-medium">
                  I would like to receive updates and promotional emails
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Get notified about new features, events, and game updates
                </p>
              </div>
            </label>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle size={16} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            onClick={onDecline}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Decline
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !termsOfService || !privacyPolicy}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 transition-all font-medium"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Accepting...
              </div>
            ) : (
              'Accept & Continue'
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
