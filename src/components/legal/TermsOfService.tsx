import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Users, Gavel, AlertTriangle, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Link 
              to="/" 
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Neighborville
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Gavel size={32} className="text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-800">Terms of Service</h1>
            </div>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-blue max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <Shield size={24} className="mr-2 text-blue-600" />
                1. Introduction
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Welcome to Neighborville! These Terms of Service ("Terms") govern your use of the Neighborville 
                city-building game and related services (collectively, the "Service") operated by Neighborville 
                ("us", "we", or "our").
              </p>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with 
                any part of these terms, then you may not access the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By creating an account or using Neighborville, you acknowledge that you have read, understood, 
                and agree to be bound by these Terms and our Privacy Policy. These Terms apply to all visitors, 
                users, and others who access or use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <Users size={24} className="mr-2 text-blue-600" />
                3. User Accounts
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">3.1 Account Creation</h3>
                  <p className="text-gray-700 leading-relaxed">
                    To use certain features of the Service, you must create an account. You agree to provide 
                    accurate, current, and complete information during the registration process.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">3.2 Account Security</h3>
                  <p className="text-gray-700 leading-relaxed">
                    You are responsible for safeguarding your account credentials and for all activities that 
                    occur under your account. We strongly recommend enabling two-factor authentication for 
                    enhanced security.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">3.3 Account Termination</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We reserve the right to suspend or terminate your account at any time for violations of 
                    these Terms or for any other reason at our sole discretion.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <AlertTriangle size={24} className="mr-2 text-orange-600" />
                4. Acceptable Use Policy
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree not to use the Service for any unlawful purpose or in any way that could damage, 
                disable, overburden, or impair the Service. Prohibited activities include, but are not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Violating any applicable laws or regulations</li>
                <li>Harassing, threatening, or intimidating other users</li>
                <li>Posting offensive, inappropriate, or harmful content</li>
                <li>Attempting to gain unauthorized access to other accounts or systems</li>
                <li>Using automated tools or bots to interact with the Service</li>
                <li>Distributing malware, viruses, or other harmful code</li>
                <li>Engaging in any form of cheating or exploiting game mechanics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Game Content and Virtual Items</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">5.1 Virtual Currency and Items</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Neighborville may include virtual currency, items, or other digital content. These virtual 
                    items have no real-world value and cannot be exchanged for real money or items of value.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">5.2 Game Progress</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Your game progress, including cities built, achievements earned, and virtual items acquired, 
                    is stored on our servers. We make reasonable efforts to preserve your progress but cannot 
                    guarantee against data loss.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Privacy and Data Protection</h2>
              <p className="text-gray-700 leading-relaxed">
                Your privacy is important to us. Our collection and use of personal information is governed by 
                our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, 
                you consent to the collection and use of your information as described in the Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Intellectual Property Rights</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">7.1 Our Rights</h3>
                  <p className="text-gray-700 leading-relaxed">
                    The Service and its original content, features, and functionality are and will remain the 
                    exclusive property of Neighborville and its licensors. The Service is protected by copyright, 
                    trademark, and other laws.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">7.2 Your Rights</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Subject to these Terms, we grant you a limited, non-exclusive, non-transferable license to 
                    access and use the Service for your personal, non-commercial use.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Disclaimers</h2>
              <p className="text-gray-700 leading-relaxed">
                The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, expressed 
                or implied, and hereby disclaim all other warranties including, without limitation, implied 
                warranties of merchantability, fitness for a particular purpose, or non-infringement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                In no event shall Neighborville, its directors, employees, partners, agents, suppliers, or 
                affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, 
                including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, 
                we will try to provide at least 30 days notice prior to any new terms taking effect. Your 
                continued use of the Service after such changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <Mail size={24} className="mr-2 text-blue-600" />
                11. Contact Us
              </h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> rutkauskasdomantas@gmail.com
                </p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              By using Neighborville, you acknowledge that you have read and understood these Terms of Service.
            </p>
            <div className="mt-4 flex justify-center space-x-4">
              <Link 
                to="/privacy" 
                className="text-blue-600 hover:text-blue-800 text-sm transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                to="/" 
                className="text-blue-600 hover:text-blue-800 text-sm transition-colors"
              >
                Back to Game
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
