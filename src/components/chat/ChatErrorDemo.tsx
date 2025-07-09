import React from 'react';
import { motion } from 'framer-motion';
import { testScenario, getDemoScenarioNames, DEMO_ERROR_SCENARIOS } from '../../utils/chatSecurityDemo';
import { handleChatError } from '../../utils/chatErrorHandler';

interface ChatErrorDemoProps {
  addNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info', autoRemove?: boolean) => void;
  onClose: () => void;
}

const ChatErrorDemo: React.FC<ChatErrorDemoProps> = ({ addNotification, onClose }) => {
  
  const testChatError = (scenarioName: string) => {
    const scenario = DEMO_ERROR_SCENARIOS.find(s => s.name === scenarioName);
    if (!scenario) return;
    
    try {
      const errorDetails = handleChatError(scenario.mockError);
      const fullMessage = errorDetails.actionable 
        ? `${errorDetails.message} ${errorDetails.actionable}`
        : errorDetails.message;
      
      addNotification(fullMessage, errorDetails.type, true);
      
      console.log(`🧪 Tested scenario: ${scenarioName}`);
      console.log(`📝 Expected: ${scenario.expectedNotification.message}`);
      console.log(`✅ Actually showed: ${fullMessage}`);
    } catch (error) {
      console.error('Error testing scenario:', error);
      addNotification('Failed to test error scenario', 'error', true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Chat Security Demo</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">
            Test the new chat security notification system. Click any scenario below to see how the error would appear to users.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEMO_ERROR_SCENARIOS.map((scenario) => (
              <div key={scenario.name} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <h3 className="font-semibold text-gray-800 mb-2">{scenario.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    scenario.expectedNotification.type === 'error' ? 'bg-red-100 text-red-800' :
                    scenario.expectedNotification.type === 'warning' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {scenario.expectedNotification.type}
                  </span>
                  <button
                    onClick={() => testChatError(scenario.name)}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                  >
                    Test
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Security Features Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Rate Limits</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Global: 20 messages/minute</li>
                  <li>• Direct: 50 messages/minute</li>
                  <li>• Burst: 5 messages/10 seconds</li>
                  <li>• New users: 10 messages/minute</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Content Rules</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Max length: 2000 characters</li>
                  <li>• Max URLs: 3 per message</li>
                  <li>• Max mentions: 10 per message</li>
                  <li>• AI-powered content filtering</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">✨ What's New</h3>
            <p className="text-green-700 text-sm">
              Chat errors now use your beautiful game notification system instead of generic toasts! 
              Users get clear, actionable guidance with appropriate icons and colors for each type of security violation.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatErrorDemo; 