import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, Eye, Users, Lock, Globe, Trash2, X } from 'lucide-react';

interface ReadingProgress {
  hasStartedReading: boolean;
  hasFinishedReading: boolean;
  scrollProgress: number;
}

interface PrivacyPolicyProps {
  onAccept?: () => void;
  onDecline?: () => void;
  onClose?: () => void;
  onReadingProgress?: (progress: ReadingProgress) => void;
  requireFullReading?: boolean;
  standalone?: boolean;
}

export default function PrivacyPolicy({ 
  onAccept, 
  onDecline, 
  onClose,
  onReadingProgress,
  requireFullReading = false,
  standalone = false 
}: PrivacyPolicyProps) {
  if (standalone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 py-12">
        <div className="container mx-auto px-4">
          <PrivacyContent 
            onAccept={onAccept} 
            onDecline={onDecline}
            onClose={onClose}
            onReadingProgress={onReadingProgress}
            requireFullReading={requireFullReading}
          />
        </div>
      </div>
    );
  }

  if (requireFullReading && onClose) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          <PrivacyContent 
            onAccept={onAccept} 
            onDecline={onDecline}
            onClose={onClose}
            onReadingProgress={onReadingProgress}
            requireFullReading={requireFullReading}
            modal={true}
          />
        </motion.div>
      </motion.div>
    );
  }

  return <PrivacyContent onAccept={onAccept} onDecline={onDecline} />;
}

function PrivacyContent({ 
  onAccept, 
  onDecline, 
  onClose,
  onReadingProgress,
  requireFullReading = false,
  modal = false
}: { 
  onAccept?: () => void; 
  onDecline?: () => void;
  onClose?: () => void;
  onReadingProgress?: (progress: ReadingProgress) => void;
  requireFullReading?: boolean;
  modal?: boolean;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasStartedReading, setHasStartedReading] = useState(false);
  const [hasFinishedReading, setHasFinishedReading] = useState(false);

  useEffect(() => {
    if (!requireFullReading || !onReadingProgress) return;

    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const progress = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
      
      setScrollProgress(progress);
      
      if (!hasStartedReading && scrollTop > 50) {
        setHasStartedReading(true);
      }
      
      if (progress >= 95 && !hasFinishedReading) {
        setHasFinishedReading(true);
      }
      
      onReadingProgress({
        hasStartedReading: hasStartedReading || scrollTop > 50,
        hasFinishedReading: hasFinishedReading || progress >= 95,
        scrollProgress: progress
      });
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll();
      
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [requireFullReading, onReadingProgress, hasStartedReading, hasFinishedReading]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className={`bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 overflow-hidden ${modal ? 'h-full' : ''}`}>
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 text-white relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X size={18} />
            </button>
          )}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Shield size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Privacy Policy</h1>
              <p className="text-emerald-100 mt-2">Last updated: June 06, 2025</p>
              {requireFullReading && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                  <span className="text-sm text-emerald-100">
                    Scroll progress: {scrollProgress}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div 
          ref={scrollContainerRef}
          className={`p-8 space-y-8 ${modal ? 'max-h-[60vh]' : 'max-h-[70vh]'} overflow-y-auto`}
        >
          {requireFullReading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <Eye size={18} className="text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">Reading Progress</p>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, scrollProgress)}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-medium text-blue-700">{scrollProgress}%</span>
              </div>
              {scrollProgress >= 95 && (
                <p className="text-xs text-green-600 mt-2 font-medium">✓ Reading complete - you may now accept this document</p>
              )}
            </div>
          )}

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye size={18} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">What Information We Collect</h2>
            </div>
            <div className="space-y-4 pl-11">
              <p className="text-gray-700 leading-relaxed">
                I collect several types of information to provide and improve NeighborVille:
              </p>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">📧 Account Information</h4>
                  <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm">
                    <li>Email address (for account creation and communication)</li>
                    <li>Username (chosen by you, displayed in-game)</li>
                    <li>Password (encrypted and stored securely)</li>
                    <li>Account creation date and last login time</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">🎮 Game Data</h4>
                  <ul className="list-disc list-inside space-y-1 text-green-700 text-sm">
                    <li>Game progress and achievements</li>
                    <li>City designs and building layouts</li>
                    <li>In-game currency and items</li>
                    <li>Game settings and preferences</li>
                    <li>Interaction history (chat messages, if applicable)</li>
                  </ul>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-800 mb-2">🔧 Technical Information</h4>
                  <ul className="list-disc list-inside space-y-1 text-orange-700 text-sm">
                    <li>Device type and operating system</li>
                    <li>Browser type and version</li>
                    <li>IP address and approximate location</li>
                    <li>Session duration and usage patterns</li>
                    <li>Error logs and crash reports</li>
                  </ul>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800 mb-2">📊 Analytics Data</h4>
                  <ul className="list-disc list-inside space-y-1 text-purple-700 text-sm">
                    <li>Feature usage and engagement metrics</li>
                    <li>Performance data and load times</li>
                    <li>User flow and navigation patterns</li>
                    <li>Aggregated, anonymized usage statistics</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Users size={18} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">How We Use Your Information</h2>
            </div>
            <div className="space-y-4 pl-11">
              <p className="text-gray-700 leading-relaxed">
                I use your information solely to provide, maintain, and improve NeighborVille:
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <h4 className="font-semibold text-emerald-800 mb-2">🚀 Service Provision</h4>
                  <ul className="list-disc list-inside space-y-1 text-emerald-700 text-sm">
                    <li>Enable gameplay and save progress</li>
                    <li>Authenticate your account</li>
                    <li>Provide customer support</li>
                    <li>Process your game actions</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">📈 Improvement</h4>
                  <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm">
                    <li>Analyze usage patterns</li>
                    <li>Fix bugs and optimize performance</li>
                    <li>Develop new features</li>
                    <li>Enhance user experience</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">🛡️ Security</h4>
                  <ul className="list-disc list-inside space-y-1 text-yellow-700 text-sm">
                    <li>Prevent fraud and abuse</li>
                    <li>Monitor for security threats</li>
                    <li>Enforce our terms of service</li>
                    <li>Protect user safety</li>
                  </ul>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h4 className="font-semibold text-indigo-800 mb-2">📞 Communication</h4>
                  <ul className="list-disc list-inside space-y-1 text-indigo-700 text-sm">
                    <li>Send important game updates</li>
                    <li>Respond to support requests</li>
                    <li>Notify about account issues</li>
                    <li>Share relevant announcements</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Lock size={18} className="text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">How We Protect Your Data</h2>
            </div>
            <div className="space-y-4 pl-11">
              <p className="text-gray-700 leading-relaxed">
                I implement industry-standard security measures to protect your information:
              </p>

              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">🔐 Encryption</h4>
                  <ul className="list-disc list-inside space-y-1 text-red-700 text-sm">
                    <li>All data transmitted using HTTPS/SSL encryption</li>
                    <li>Passwords are hashed using secure algorithms</li>
                    <li>Sensitive data encrypted at rest</li>
                    <li>Regular security audits and updates</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">🏢 Data Storage</h4>
                  <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm">
                    <li>Secure servers with access controls</li>
                    <li>Regular backups and disaster recovery</li>
                    <li>Limited employee access on need-to-know basis</li>
                    <li>Compliance with data protection regulations</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">👥 Access Control</h4>
                  <ul className="list-disc list-inside space-y-1 text-green-700 text-sm">
                    <li>Multi-factor authentication for admin accounts</li>
                    <li>Role-based permissions system</li>
                    <li>Audit logs for all data access</li>
                    <li>Regular security training for staff</li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Security Notice:</strong> While I implement strong security measures, 
                  no system is 100% secure. I continuously monitor and improve my security practices.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Eye size={18} className="text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Your Rights and Controls</h2>
            </div>
            <div className="space-y-4 pl-11">
              <p className="text-gray-700 leading-relaxed">
                You have several rights regarding your personal data. Contact me to exercise these rights:
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <Eye size={16} />
                    Access Your Data
                  </h4>
                  <p className="text-blue-700 text-sm">
                    Request a copy of all personal data I have about you. I'll provide it in a 
                    readable format within 30 days.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <FileText size={16} />
                    Correct Your Data
                  </h4>
                  <p className="text-green-700 text-sm">
                    Update incorrect or incomplete information. Most game data can be corrected 
                    directly in your account settings.
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                    <Trash2 size={16} />
                    Delete Your Data
                  </h4>
                  <p className="text-red-700 text-sm">
                    Request deletion of your personal data. Note that this will permanently 
                    delete your account and game progress.
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                    <Globe size={16} />
                    Data Portability
                  </h4>
                  <p className="text-purple-700 text-sm">
                    Export your data in a machine-readable format. Useful if you want to 
                    transfer your information elsewhere.
                  </p>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                    <Lock size={16} />
                    Restrict Processing
                  </h4>
                  <p className="text-orange-700 text-sm">
                    Limit how I use your data while maintaining your account. Available in 
                    certain circumstances under GDPR.
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Shield size={16} />
                    Object to Processing
                  </h4>
                  <p className="text-gray-700 text-sm">
                    Object to certain types of data processing, particularly for marketing 
                    purposes (though I don't currently do marketing).
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <p className="text-blue-800 text-sm">
                  <strong>How to Exercise Your Rights:</strong> Contact me at rutkauskasdomantas@gmail.com 
                  with your request. I'll respond within 30 days and may need to verify your identity.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Users size={18} className="text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Data Sharing and Third Parties</h2>
            </div>
            <div className="space-y-4 pl-11">
              <p className="text-gray-700 leading-relaxed">
                I do not sell, trade, or rent your personal information. I only share data in limited circumstances:
              </p>

              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">✅ When I Might Share Data</h4>
                  <ul className="list-disc list-inside space-y-1 text-green-700 text-sm">
                    <li>With your explicit consent</li>
                    <li>To comply with legal obligations</li>
                    <li>To protect rights, property, or safety</li>
                    <li>With trusted service providers (under strict agreements)</li>
                    <li>In case of business transfer (with notice to users)</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">🔒 Service Providers</h4>
                  <p className="text-blue-700 text-sm mb-2">
                    I work with trusted companies that help me provide the service:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm">
                    <li>Cloud hosting providers (for secure data storage)</li>
                    <li>Analytics services (for aggregated usage insights)</li>
                    <li>Email services (for account communications)</li>
                    <li>Security services (for fraud prevention)</li>
                  </ul>
                  <p className="text-blue-700 text-xs mt-2">
                    All service providers are bound by strict data protection agreements.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText size={18} className="text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Cookies and Tracking</h2>
            </div>
            <div className="space-y-4 pl-11">
              <p className="text-gray-700 leading-relaxed">
                I use cookies and similar technologies to enhance your experience:
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">🍪 Essential Cookies</h4>
                  <p className="text-green-700 text-sm mb-2">Required for basic functionality:</p>
                  <ul className="list-disc list-inside space-y-1 text-green-700 text-sm">
                    <li>Authentication and session management</li>
                    <li>Security and fraud prevention</li>
                    <li>Load balancing and performance</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">📊 Analytics Cookies</h4>
                  <p className="text-blue-700 text-sm mb-2">Help me understand usage (optional):</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm">
                    <li>Page visits and feature usage</li>
                    <li>Performance metrics</li>
                    <li>Error tracking and debugging</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">🔧 Cookie Management</h4>
                <p className="text-gray-700 text-sm">
                  You can control cookies through your browser settings. Note that disabling 
                  essential cookies may affect game functionality. I don't use tracking cookies 
                  for advertising purposes.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Users size={18} className="text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Children's Privacy</h2>
            </div>
            <div className="space-y-4 pl-11">
              <p className="text-gray-700 leading-relaxed">
                I am committed to protecting children's privacy online:
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Age Requirements</h4>
                <ul className="list-disc list-inside space-y-1 text-yellow-700 text-sm">
                  <li>My service is intended for users 13 years and older</li>
                  <li>I do not knowingly collect data from children under 13</li>
                  <li>Users under 18 should have parental consent</li>
                  <li>Parents can contact me to review or delete their child's data</li>
                </ul>
              </div>

              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <p className="text-red-800 text-sm">
                  <strong>If you believe I have collected information from a child under 13,</strong> 
                  please contact me immediately at rutkauskasdomantas@gmail.com and I will delete it promptly.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FileText size={18} className="text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Policy Updates</h2>
            </div>
            <div className="space-y-4 pl-11">
              <p className="text-gray-700 leading-relaxed">
                I may update this Privacy Policy to reflect changes in my practices or legal requirements:
              </p>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h4 className="font-semibold text-indigo-800 mb-2">How I Notify You</h4>
                <ul className="list-disc list-inside space-y-1 text-indigo-700 text-sm">
                  <li>Email notification for significant changes</li>
                  <li>In-game notice upon your next login</li>
                  <li>Updated "Last modified" date on this page</li>
                  <li>30-day notice period for major changes</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <p className="text-blue-800 text-sm">
                  <strong>Your Options:</strong> If you don't agree with updated terms, you can 
                  delete your account before the changes take effect. Continued use constitutes acceptance.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText size={18} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Contact Me</h2>
            </div>
            <div className="space-y-4 pl-11">
              <p className="text-gray-700 leading-relaxed">
                If you have questions about this Privacy Policy or my data practices:
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">📧 Contact Information</h4>
                    <ul className="space-y-1 text-green-700 text-sm">
                      <li><strong>Privacy Questions:</strong> rutkauskasdomantas@gmail.com</li>
                      <li><strong>Data Requests:</strong> rutkauskasdomantas@gmail.com</li>
                      <li><strong>General Support:</strong> rutkauskasdomantas@gmail.com</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">⏰ Response Times</h4>
                    <ul className="space-y-1 text-green-700 text-sm">
                      <li><strong>Privacy Requests:</strong> Within 30 days</li>
                      <li><strong>Data Access:</strong> Within 30 days</li>
                      <li><strong>General Inquiries:</strong> Within 48 hours</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <p className="text-blue-800 text-sm">
                  <strong>Data Protection Officer:</strong> For EU residents, you can also contact 
                  your local data protection authority if you have concerns about my data practices.
                </p>
              </div>
            </div>
          </section>
        </div>

        {onAccept && onDecline && (
          <div className="bg-gray-50 border-t border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onDecline}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              >
                I Do Not Agree
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAccept}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg"
              >
                I Agree to This Policy
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
