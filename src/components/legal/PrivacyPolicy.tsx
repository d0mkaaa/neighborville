import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Eye, Database, Lock, Users, Mail, Cookie } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Link 
              to="/" 
              className="flex items-center text-green-600 hover:text-green-800 transition-colors"
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
              <Shield size={32} className="text-green-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-800">Privacy Policy</h1>
            </div>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-green max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <Eye size={24} className="mr-2 text-green-600" />
                1. Introduction
              </h2>
              <p className="text-gray-700 leading-relaxed">
                At Neighborville, we take your privacy seriously. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our city-building game and related 
                services (collectively, the "Service").
              </p>
              <p className="text-gray-700 leading-relaxed">
                By using our Service, you agree to the collection and use of information in accordance with 
                this Privacy Policy. If you do not agree with our policies and practices, please do not use 
                our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <Database size={24} className="mr-2 text-green-600" />
                2. Information We Collect
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">2.1 Personal Information</h3>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    We may collect personal information that you voluntarily provide to us when you:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>Create an account</li>
                    <li>Contact us for support</li>
                    <li>Participate in surveys or promotions</li>
                    <li>Subscribe to our newsletter</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-3">
                    This information may include your email address, username, and any other information 
                    you choose to provide.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">2.2 Game Data</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We collect information about your gameplay, including:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>Game progress and achievements</li>
                    <li>Cities you build and customize</li>
                    <li>In-game purchases and virtual currency</li>
                    <li>Game settings and preferences</li>
                    <li>Time spent playing and session data</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">2.3 Technical Information</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We automatically collect certain technical information when you use our Service:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>IP address and location data</li>
                    <li>Device type, operating system, and browser information</li>
                    <li>Screen resolution and device capabilities</li>
                    <li>Network connection type</li>
                    <li>Crash reports and error logs</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">2.4 Cookies and Tracking</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We use cookies and similar tracking technologies to enhance your experience:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>Authentication cookies to keep you logged in</li>
                    <li>Preference cookies to remember your settings</li>
                    <li>Analytics cookies to understand how you use our Service</li>
                    <li>Performance cookies to optimize loading times</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <Users size={24} className="mr-2 text-green-600" />
                3. How We Use Your Information
              </h2>
              
              <p className="text-gray-700 leading-relaxed mb-4">
                We use the information we collect for various purposes, including:
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">Service Provision</h4>
                  <ul className="list-disc list-inside space-y-1 text-green-700 text-sm">
                    <li>Provide and maintain our Service</li>
                    <li>Process your account registration</li>
                    <li>Save your game progress</li>
                    <li>Enable multiplayer features</li>
                    <li>Provide customer support</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Improvement & Analytics</h4>
                  <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm">
                    <li>Analyze usage patterns</li>
                    <li>Improve game features</li>
                    <li>Fix bugs and technical issues</li>
                    <li>Develop new content</li>
                    <li>Optimize performance</li>
                  </ul>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-800 mb-2">Communication</h4>
                  <ul className="list-disc list-inside space-y-1 text-purple-700 text-sm">
                    <li>Send important updates</li>
                    <li>Respond to your inquiries</li>
                    <li>Notify about new features</li>
                    <li>Send promotional content (with consent)</li>
                    <li>Provide technical support</li>
                  </ul>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-orange-800 mb-2">Security & Compliance</h4>
                  <ul className="list-disc list-inside space-y-1 text-orange-700 text-sm">
                    <li>Prevent fraud and abuse</li>
                    <li>Enforce our Terms of Service</li>
                    <li>Comply with legal obligations</li>
                    <li>Protect user safety</li>
                    <li>Monitor for violations</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Information Sharing and Disclosure</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">4.1 We Do Not Sell Your Data</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We do not sell, trade, or rent your personal information to third parties for their 
                    commercial purposes.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">4.2 Limited Sharing</h3>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    We may share your information in the following limited circumstances:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li><strong>Service Providers:</strong> With trusted third-party services that help us operate our Service (hosting, analytics, customer support)</li>
                    <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
                    <li><strong>Safety:</strong> To protect the rights, property, or safety of our users or others</li>
                    <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                    <li><strong>Consent:</strong> With your explicit consent for specific purposes</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <Lock size={24} className="mr-2 text-green-600" />
                5. Data Security
              </h2>
              
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement appropriate technical and organizational security measures to protect your 
                personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-medium text-green-800 mb-3">Our Security Measures Include:</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="list-disc list-inside space-y-2 text-green-700 text-sm">
                    <li>Encryption of data in transit and at rest</li>
                    <li>Regular security audits and updates</li>
                    <li>Access controls and authentication</li>
                    <li>Secure hosting infrastructure</li>
                  </ul>
                  <ul className="list-disc list-inside space-y-2 text-green-700 text-sm">
                    <li>Two-factor authentication support</li>
                    <li>Regular backup procedures</li>
                    <li>Incident response procedures</li>
                    <li>Employee security training</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  <strong>Important:</strong> While we strive to protect your personal information, no method 
                  of transmission over the internet or electronic storage is 100% secure. We cannot guarantee 
                  absolute security.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Data Retention</h2>
              
              <p className="text-gray-700 leading-relaxed mb-4">
                We retain your personal information only for as long as necessary to fulfill the purposes 
                outlined in this Privacy Policy, unless a longer retention period is required by law.
              </p>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <strong className="text-gray-800">Account Data:</strong>
                    <span className="text-gray-700"> Retained while your account is active and for a reasonable period after deletion</span>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <strong className="text-gray-800">Game Progress:</strong>
                    <span className="text-gray-700"> Stored indefinitely unless you request deletion</span>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <strong className="text-gray-800">Analytics Data:</strong>
                    <span className="text-gray-700"> Aggregated and anonymized data may be retained longer for research purposes</span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Your Privacy Rights</h2>
              
              <p className="text-gray-700 leading-relaxed mb-4">
                Depending on your location, you may have certain rights regarding your personal information:
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Eye size={16} className="text-green-600 mt-1" />
                    <div>
                      <strong className="text-gray-800">Access:</strong>
                      <span className="text-gray-700"> Request a copy of your personal data</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Database size={16} className="text-green-600 mt-1" />
                    <div>
                      <strong className="text-gray-800">Rectification:</strong>
                      <span className="text-gray-700"> Correct inaccurate information</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Lock size={16} className="text-green-600 mt-1" />
                    <div>
                      <strong className="text-gray-800">Erasure:</strong>
                      <span className="text-gray-700"> Request deletion of your data</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Shield size={16} className="text-green-600 mt-1" />
                    <div>
                      <strong className="text-gray-800">Portability:</strong>
                      <span className="text-gray-700"> Export your data in a readable format</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users size={16} className="text-green-600 mt-1" />
                    <div>
                      <strong className="text-gray-800">Objection:</strong>
                      <span className="text-gray-700"> Object to certain processing activities</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Cookie size={16} className="text-green-600 mt-1" />
                    <div>
                      <strong className="text-gray-800">Consent:</strong>
                      <span className="text-gray-700"> Withdraw consent at any time</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  To exercise any of these rights, please contact us using the information provided in the 
                  "Contact Us" section below. We will respond to your request within a reasonable timeframe 
                  and in accordance with applicable law.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Children's Privacy</h2>
              
              <p className="text-gray-700 leading-relaxed mb-4">
                Our Service is not intended for children under the age of 13. We do not knowingly collect 
                personal information from children under 13. If you are a parent or guardian and believe 
                your child has provided us with personal information, please contact us.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">
                  <strong>Important:</strong> If we discover that we have collected personal information 
                  from a child under 13 without parental consent, we will take steps to delete that 
                  information as quickly as possible.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. International Data Transfers</h2>
              
              <p className="text-gray-700 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. 
                These countries may have different data protection laws. When we transfer your information, 
                we ensure appropriate safeguards are in place to protect your privacy and rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Changes to This Privacy Policy</h2>
              
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material 
                changes by posting the new Privacy Policy on this page and updating the "Last updated" date. 
                We encourage you to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <Mail size={24} className="mr-2 text-green-600" />
                11. Contact Us
              </h2>
              
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us:
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <p className="text-green-700">
                  <strong>Email:</strong> rutkauskasdomantas@gmail.com<br />
                  <strong>Response Time:</strong> Within 72 hours
                </p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Your privacy is important to us. We are committed to protecting your personal information 
              and being transparent about our data practices.
            </p>
            <div className="mt-4 flex justify-center space-x-4">
              <Link 
                to="/tos" 
                className="text-green-600 hover:text-green-800 text-sm transition-colors"
              >
                Terms of Service
              </Link>
              <Link 
                to="/" 
                className="text-green-600 hover:text-green-800 text-sm transition-colors"
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
