import React, { useState } from 'react';
import { Shield, Key, Lock, AlertTriangle } from 'lucide-react';
import { useSecurity } from '../contexts/SecurityContext';
import SecurityPopup from '../components/SecurityPopup';

const LoginPage: React.FC = () => {
  const [accessKey, setAccessKey] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error' | 'warning'>('success');
  const [popupMessage, setPopupMessage] = useState('');
  const { login } = useSecurity();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessKey.trim()) {
      showPopupMessage('Please enter an access key!', 'warning');
      return;
    }

    const success = await login(accessKey);
    if (success) {
      showPopupMessage('Login Successful! Welcome to DevTools Pro!', 'success');
      setTimeout(() => {
        setShowPopup(false);
      }, 2000);
    } else {
      showPopupMessage('Invalid Access Key! Please try again.', 'error');
      setAccessKey('');
    }
  };

  const showPopupMessage = (message: string, type: 'success' | 'error' | 'warning') => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  };

  const handleNeedKey = () => {
    showPopupMessage('Redirecting to Telegram for access key...', 'success');
    setTimeout(() => {
      window.open('https://t.me/muthassimbilla', '_blank');
      setShowPopup(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Main Login Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              DevTools Pro
            </h1>
            <p className="text-gray-600 mt-2">Professional Development Utilities</p>
            <p className="text-sm text-gray-500 mt-1">Enter your access key to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                placeholder="Enter your access key"
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <Lock className="w-5 h-5 mr-2" />
              Access DevTools Pro
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleNeedKey}
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 flex items-center justify-center mx-auto"
            >
              <AlertTriangle className="w-4 h-4 mr-1" />
              Need an access key?
            </button>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-6 bg-white/60 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Available Tools</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700">Email Extractor</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-gray-700">Duplicate Remover</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">User Agent Mixer</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-gray-700">Text Formatter</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-gray-700">Password Generator</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span className="text-gray-700">More Coming Soon</span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Security Notice:</p>
              <p>This application is protected by advanced security measures. Unauthorized access attempts are monitored.</p>
            </div>
          </div>
        </div>
      </div>

      {showPopup && (
        <SecurityPopup
          message={popupMessage}
          type={popupType}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
};

export default LoginPage;