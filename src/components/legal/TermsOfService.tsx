import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, Eye, Scale, X } from 'lucide-react';

interface ReadingProgress {
  hasStartedReading: boolean;
  hasFinishedReading: boolean;
  scrollProgress: number;
}

interface TermsOfServiceProps {
  onAccept?: () => void;
  onDecline?: () => void;
  onClose?: () => void;
  onReadingProgress?: (progress: ReadingProgress) => void;
  requireFullReading?: boolean;
  standalone?: boolean;
}

export default function TermsOfService({ 
  onAccept, 
  onDecline, 
  onClose,
  onReadingProgress,
  requireFullReading = false,
  standalone = false 
}: TermsOfServiceProps) {
  if (standalone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 py-12">
        <div className="container mx-auto px-4">
          <TermsContent 
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
          <TermsContent 
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

  return <TermsContent onAccept={onAccept} onDecline={onDecline} />;
}

function TermsContent({ 
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
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-8 text-white relative">
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
              <FileText size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Terms of Service</h1>
              <p className="text-blue-100 mt-2">Last updated: June 06, 2025</p>
              {requireFullReading && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                  <span className="text-sm text-blue-100">
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
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-800">Reading Progress</p>
                  <div className="w-full bg-purple-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, scrollProgress)}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-medium text-purple-700">{scrollProgress}%</span>
              </div>
              {scrollProgress >= 95 && (
                <p className="text-xs text-green-600 mt-2 font-medium">✓ Reading complete - you may now accept this document</p>
              )}
            </div>
          )}

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield size={18} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">1. Acceptance of Terms</h2>
            </div>
            <div className="space-y-4 pl-11">
              <p className="text-gray-700 leading-relaxed">
                Welcome to NeighborVille! These Terms of Service ("Terms") govern your use of the 
                NeighborVille city-building game and related services (the "Service") provided by 
                Domantas Rutkauskas ("d0mkaaa", "I", "me"). By accessing or using the Service, you 
                agree to be bound by these Terms.
              </p>
              <p className="text-gray-700 leading-relaxed">
                By using NeighborVille, you agree to comply with and be bound by these Terms. 
                If you do not agree to these Terms, please do not use the Service.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <p className="text-blue-800 font-medium">
                  Important: By creating an account or playing as a guest, you acknowledge that you 
                  have read, understood, and agree to these terms.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye size={18} className="text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">2. Account Responsibilities</h2>
            </div>
            <div className="space-y-4 pl-11">
              <p className="text-gray-700 leading-relaxed">
                When you create an account with me, you must provide information that is accurate, 
                complete, and current at all times.
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>You are responsible for safeguarding your account credentials</li>
                <li>You must not share your account with others</li>
                <li>You are responsible for all activities that occur under your account</li>
                <li>You must notify me immediately of any unauthorized use</li>
              </ul>

            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Scale size={18} className="text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">3. Acceptable Use Policy</h2>
            </div>
            <div className="space-y-4 pl-11">
              <p className="text-gray-700 leading-relaxed">
                You agree to use NeighborVille in a manner that is legal, ethical, and respectful 
                to other players and our community.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">Prohibited Activities</h4>
                <ul className="list-disc list-inside space-y-1 text-red-700 text-sm">
                  <li>Harassment, bullying, or threatening other players</li>
                  <li>Using offensive, discriminatory, or inappropriate language</li>
                  <li>Attempting to exploit, hack, or cheat in the game</li>
                  <li>Creating multiple accounts to gain unfair advantages</li>
                  <li>Sharing inappropriate or harmful content</li>
                  <li>Impersonating other players or staff members</li>
                  <li>Engaging in any form of real-money trading of game items</li>
                  <li>Using automated scripts, bots, or third-party software</li>
                  <li>Attempting to reverse engineer or modify the game</li>
                  <li>Violating any applicable laws or regulations</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Encouraged Behavior</h4>
                <ul className="list-disc list-inside space-y-1 text-green-700 text-sm">
                  <li>Being respectful and helpful to other players</li>
                  <li>Reporting bugs or issues to help improve the game</li>
                  <li>Participating constructively in community discussions</li>
                  <li>Following fair play principles</li>
                  <li>Respecting others' privacy and personal information</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText size={18} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">4. Global Chat and Communication Rules</h2>
            </div>
            <div className="space-y-4 pl-11">
              <p className="text-gray-700 leading-relaxed">
                NeighborVille may include chat features, forums, or other communication tools. 
                When using these features, additional rules apply:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Chat Guidelines</h4>
                  <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm">
                    <li>Use appropriate language at all times</li>
                    <li>Stay on topic in designated channels</li>
                    <li>No spam, excessive caps, or flooding</li>
                    <li>Respect different cultures and backgrounds</li>
                    <li>No advertising or self-promotion</li>
                    <li>Keep discussions game-related when appropriate</li>
                  </ul>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-800 mb-2">Consequences</h4>
                  <ul className="list-disc list-inside space-y-1 text-orange-700 text-sm">
                    <li>First violation: Warning</li>
                    <li>Second violation: Temporary chat ban</li>
                    <li>Severe violations: Permanent chat ban</li>
                    <li>Extreme cases: Account suspension</li>
                    <li>Illegal content: Permanent ban + reporting</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700 text-sm">
                  <strong>Note:</strong> All communications may be monitored for safety and 
                  compliance purposes. I reserve the right to remove content and take action 
                  against accounts that violate these guidelines.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Shield size={18} className="text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">5. Intellectual Property Rights</h2>
            </div>
            <div className="space-y-4 pl-11">
              <p className="text-gray-700 leading-relaxed">
                NeighborVille and its original content, features, and functionality are owned by 
                me and are protected by international copyright, trademark, patent, trade 
                secret, and other intellectual property laws.
              </p>
              <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4">
                <p className="text-indigo-800">
                  <strong>Your Rights:</strong> You retain ownership of any content you create 
                  within the game (such as city names or designs), but you grant me a license 
                  to use this content as necessary to provide the service.
                </p>
              </div>
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <p className="text-red-800">
                  <strong>My Rights:</strong> I reserve all rights to the game engine, art assets, 
                  music, sound effects, and all other original content included in NeighborVille.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText size={18} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">6. Virtual Items and In-Game Currency</h2>
            </div>
            <div className="space-y-4 pl-11">
              <p className="text-gray-700 leading-relaxed">
                NeighborVille may include virtual currencies, items, or other digital goods. 
                These virtual items have no real-world value and cannot be exchanged for real money.
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Virtual items are licenses, not ownership transfers</li>
                <li>I may modify, suspend, or discontinue virtual items at any time</li>
                <li>Virtual items cannot be transferred between accounts</li>
                <li>Loss of virtual items due to account suspension is not refundable</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye size={18} className="text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">7. Privacy and Data Protection</h2>
            </div>
            <div className="space-y-4 pl-11">
              <p className="text-gray-700 leading-relaxed">
                Your privacy is important to me. Please review my Privacy Policy, which also 
                governs your use of the Service, to understand my practices.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <p className="text-blue-800">
                  I collect and process data as outlined in my Privacy Policy. By using my 
                  service, you consent to such processing and warrant that all data provided 
                  is accurate.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Scale size={18} className="text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">8. Enforcement and Violations</h2>
            </div>
            <div className="space-y-4 pl-11">
              <p className="text-gray-700 leading-relaxed">
                I reserve the right to investigate and take appropriate action against users 
                who violate these Terms or engage in conduct that I deem harmful to other users, 
                my business, or the Service.
              </p>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-800 mb-2">Enforcement Actions May Include:</h4>
                <ul className="list-disc list-inside space-y-1 text-orange-700 text-sm">
                  <li>Warning messages</li>
                  <li>Temporary suspension of account features</li>
                  <li>Temporary account suspension</li>
                  <li>Permanent account termination</li>
                  <li>Removal of content or progress</li>
                  <li>Legal action where appropriate</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Appeal Process</h4>
                <p className="text-blue-700 text-sm">
                  If you believe an enforcement action was taken in error, you may appeal by 
                  contacting my support team within 30 days of the action. I will review 
                  appeals in good faith but reserve the right to make final decisions.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <FileText size={18} className="text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">9. Service Availability and Modifications</h2>
            </div>
            <div className="space-y-4 pl-11">
              <p className="text-gray-700 leading-relaxed">
                I strive to keep NeighborVille available 24/7, but I cannot guarantee 
                uninterrupted service. I may need to perform maintenance, updates, or 
                modifications that temporarily affect availability.
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>I may modify or discontinue features at any time</li>
                <li>Scheduled maintenance will be announced when possible</li>
                <li>Emergency maintenance may occur without notice</li>
                <li>I am not liable for temporary service interruptions</li>
              </ul>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-yellow-800">
                  I will make reasonable efforts to notify users of significant changes 
                  or extended maintenance periods in advance.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Scale size={18} className="text-gray-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">10. Disclaimers and Limitation of Liability</h2>
            </div>
            <div className="space-y-4 pl-11">
              <p className="text-gray-700 leading-relaxed">
                NeighborVille is provided "as is" and "as available" without warranties of any kind, 
                either express or implied.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700 text-sm">
                  <strong>Important:</strong> To the fullest extent permitted by law, I disclaim 
                  all warranties and shall not be liable for any indirect, incidental, special, 
                  consequential, or punitive damages related to your use of the service.
                </p>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <p className="text-blue-800 text-sm">
                  <strong>Note:</strong> Some jurisdictions do not allow the exclusion of certain 
                  warranties or limitations on liability. In such cases, my liability will be 
                  limited to the maximum extent permitted by law.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FileText size={18} className="text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">11. Changes to Terms of Service</h2>
            </div>
            <div className="space-y-4 pl-11">
              <p className="text-gray-700 leading-relaxed">
                I reserve the right to modify these Terms at any time. I will notify users 
                of significant changes by posting the new Terms on this page and updating the 
                "Last updated" date.
              </p>
              <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4">
                <p className="text-indigo-800">
                  Your continued use of NeighborVille after changes become effective constitutes 
                  acceptance of the new Terms. If you do not agree to the changes, you should 
                  discontinue use of the service.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Scale size={18} className="text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">12. Governing Law and Jurisdiction</h2>
            </div>
            <div className="space-y-4 pl-11">
              <p className="text-gray-700 leading-relaxed">
                These Terms shall be interpreted and governed by the laws of the jurisdiction 
                where my company is registered, without regard to conflict of law provisions.
              </p>
              <div className="bg-purple-50 border-l-4 border-purple-400 p-4">
                <p className="text-purple-800">
                  Any disputes arising from these Terms or your use of NeighborVille will be 
                  subject to the exclusive jurisdiction of the courts in my registered jurisdiction.
                </p>
              </div>
              <p className="text-gray-600 text-sm">
                I encourage users to contact me directly to resolve any issues before 
                pursuing legal action.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye size={18} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">13. Contact Information</h2>
            </div>
            <div className="space-y-4 pl-11">
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about these Terms of Service, please contact me:
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <ul className="space-y-2 text-green-700">
                  <li><strong>Email:</strong> rutkauskasdomantas@gmail.com</li>
                  <li><strong>Support:</strong> Through the in-game help system</li>
                  <li><strong>Response Time:</strong> I aim to respond within 48 hours</li>
                </ul>
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
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
              >
                I Agree to These Terms
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
