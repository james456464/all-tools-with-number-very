import React, { useState } from 'react';
import { Shield, Key, Plus, Trash2, Copy, Eye, EyeOff, Users, Monitor, Calendar, Clock } from 'lucide-react';
import { useSecurity } from '../contexts/SecurityContext';
import SecurityPopup from '../components/SecurityPopup';
import { formatLocation } from '../utils/location';

const AdminPanel: React.FC = () => {
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error' | 'warning'>('success');
  
  const { apiKeys, addApiKey, removeApiKey, getDeviceFingerprint } = useSecurity();

  const ADMIN_PASSWORD = 'adminbilla';

  const showPopupMessage = (message: string, type: 'success' | 'error' | 'warning') => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      showPopupMessage('Admin access granted!', 'success');
    } else {
      showPopupMessage('Invalid admin password!', 'error');
      setAdminPassword('');
    }
  };

  const handleAddApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApiKey.trim()) {
      showPopupMessage('Please enter a valid API key!', 'warning');
      return;
    }
    
    if (!newKeyName.trim()) {
      showPopupMessage('Please enter a key name!', 'warning');
      return;
    }

    if (!newKeyExpiry) {
      showPopupMessage('Please select an expiry date!', 'warning');
      return;
    }
    
    if (apiKeys.some(key => key.key === newApiKey)) {
      showPopupMessage('This API key already exists!', 'error');
      return;
    }

    const expiryDate = new Date(newKeyExpiry);
    if (expiryDate <= new Date()) {
      showPopupMessage('Expiry date must be in the future!', 'error');
      return;
    }

    await addApiKey(newApiKey, newKeyName, expiryDate.toISOString());
    setNewApiKey('');
    setNewKeyName('');
    setNewKeyExpiry('');
    showPopupMessage('API key added successfully!', 'success');
  };

  const handleRemoveApiKey = (id: string) => {
    if (window.confirm('Are you sure you want to remove this API key?')) {
      removeApiKey(id);
      showPopupMessage('API key removed successfully!', 'success');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showPopupMessage('Copied to clipboard!', 'success');
    } catch (err) {
      showPopupMessage('Failed to copy!', 'error');
    }
  };

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `KEY-${result}`;
  };

  const isKeyExpired = (expiresAt: string): boolean => {
    return new Date() > new Date(expiresAt);
  };

  const getDaysUntilExpiry = (expiresAt: string): number => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getDefaultExpiryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // 30 days from now
    return date.toISOString().split('T')[0];
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-full mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-gray-600 mt-2">Restricted Access Area</p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div className="relative">
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="Enter admin password"
                  autoComplete="off"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                <Shield className="w-5 h-5 mr-2" />
                Access Admin Panel
              </button>
            </form>
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
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                  Admin Control Panel
                </h1>
                <p className="text-gray-600">Manage API keys and system security</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowPasswords(!showPasswords)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors duration-200"
              >
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showPasswords ? 'Hide' : 'Show'} Keys</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{apiKeys.length}</div>
                <div className="text-blue-100">Total Keys</div>
              </div>
              <Key className="w-8 h-8 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{apiKeys.filter(k => k.isActive && !isKeyExpired(k.expiresAt)).length}</div>
                <div className="text-green-100">Active Keys</div>
              </div>
              <Users className="w-8 h-8 text-green-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{apiKeys.filter(k => k.deviceId).length}</div>
                <div className="text-purple-100">Bound Devices</div>
              </div>
              <Monitor className="w-8 h-8 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{apiKeys.filter(k => isKeyExpired(k.expiresAt)).length}</div>
                <div className="text-red-100">Expired Keys</div>
              </div>
              <Clock className="w-8 h-8 text-red-200" />
            </div>
          </div>
        </div>

        {/* Add New API Key */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-6 border border-white/20">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New API Key</h2>
          <form onSubmit={handleAddApiKey} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Key Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                  placeholder="Enter user name for this key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                <input
                  type="date"
                  value={newKeyExpiry}
                  onChange={(e) => setNewKeyExpiry(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <input
                type="text"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                placeholder="Enter new API key or generate one"
              />
              <button
                type="button"
                onClick={() => setNewApiKey(generateRandomKey())}
                className="px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors duration-200"
              >
                Generate
              </button>
              <button
                type="button"
                onClick={() => setNewKeyExpiry(getDefaultExpiryDate())}
                className="px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors duration-200"
              >
                30 Days
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Add Key</span>
              </button>
            </div>
          </form>
        </div>

        {/* API Keys List */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">API Keys Management</h2>
          <div className="space-y-4">
            {apiKeys.map((apiKey) => {
              const expired = isKeyExpired(apiKey.expiresAt);
              const daysLeft = getDaysUntilExpiry(apiKey.expiresAt);
              
              return (
                <div
                  key={apiKey.id}
                  className={`rounded-xl p-4 border hover:shadow-md transition-shadow duration-200 ${
                    expired ? 'bg-red-50 border-red-200' : 
                    daysLeft <= 7 ? 'bg-orange-50 border-orange-200' : 
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="font-mono text-lg font-semibold text-gray-800">
                          {showPasswords ? apiKey.key : '•'.repeat(apiKey.key.length)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(apiKey.key)}
                          className="p-1 text-blue-500 hover:text-blue-700 transition-colors duration-200"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          expired ? 'bg-red-100 text-red-800' :
                          daysLeft <= 7 ? 'bg-orange-100 text-orange-800' :
                          apiKey.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {expired ? 'Expired' : 
                           daysLeft <= 7 ? `${daysLeft} days left` :
                           apiKey.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="bg-white rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-blue-800">User</span>
                          </div>
                          <p className="text-gray-700 font-semibold">{apiKey.name}</p>
                        </div>

                        <div className="bg-white rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <Calendar className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-green-800">Created</span>
                          </div>
                          <p className="text-gray-700">{new Date(apiKey.createdAt).toLocaleDateString()}</p>
                        </div>

                        <div className="bg-white rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <Clock className={`w-4 h-4 ${expired ? 'text-red-600' : daysLeft <= 7 ? 'text-orange-600' : 'text-blue-600'}`} />
                            <span className={`font-medium ${expired ? 'text-red-800' : daysLeft <= 7 ? 'text-orange-800' : 'text-blue-800'}`}>Expires</span>
                          </div>
                          <p className={`${expired ? 'text-red-700' : daysLeft <= 7 ? 'text-orange-700' : 'text-gray-700'}`}>
                            {new Date(apiKey.expiresAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="bg-white rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <Monitor className="w-4 h-4 text-purple-600" />
                            <span className="font-medium text-purple-800">Location</span>
                          </div>
                          <p className="text-gray-700 text-xs">{formatLocation(apiKey.deviceLocation)}</p>
                          {apiKey.deviceId && (
                            <p className="text-green-600 text-xs mt-1">Device Bound</p>
                          )}
                        </div>
                      </div>

                      {apiKey.lastUsed && (
                        <div className="mt-2 text-xs text-gray-500">
                          Last used: {new Date(apiKey.lastUsed).toLocaleString()}
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleRemoveApiKey(apiKey.id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 ml-4"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Information */}
        <div className="mt-6 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">System Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Current Device Fingerprint</h3>
              <p className="font-mono text-sm text-gray-600 break-all">{getDeviceFingerprint()}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Security Status</h3>
              <div className="space-y-1 text-sm">
                <p className="text-green-600">✓ Right-click protection enabled</p>
                <p className="text-green-600">✓ Developer tools blocked</p>
                <p className="text-green-600">✓ Device fingerprinting active</p>
                <p className="text-green-600">✓ Content Security Policy enforced</p>
                <p className="text-green-600">✓ Key expiration monitoring active</p>
              </div>
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

export default AdminPanel;