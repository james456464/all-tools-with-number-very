import React, { useState, useCallback } from 'react';
import { Copy, Download, Trash2, Upload, LogOut, Settings, ArrowUpDown, BarChart3, Home } from 'lucide-react';
import { useSecurity } from '../contexts/SecurityContext';
import SecurityPopup from '../components/SecurityPopup';
import { Link } from 'react-router-dom';

const DuplicateRemover: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [processedLines, setProcessedLines] = useState<string[]>([]);
  const [stats, setStats] = useState({ total: 0, unique: 0, removed: 0 });
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error' | 'warning'>('success');
  const { logout } = useSecurity();

  const showPopupMessage = (message: string, type: 'success' | 'error' | 'warning') => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  };

  const removeDuplicates = useCallback(() => {
    if (!inputText.trim()) {
      showPopupMessage('Please enter some text first!', 'warning');
      return;
    }

    const lines = inputText
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line !== '');

    const seen = new Set<string>();
    const uniqueLines = lines.filter(line => {
      if (!seen.has(line)) {
        seen.add(line);
        return true;
      }
      return false;
    });

    setProcessedLines(uniqueLines);
    setStats({
      total: lines.length,
      unique: uniqueLines.length,
      removed: lines.length - uniqueLines.length
    });

    showPopupMessage(`Removed ${lines.length - uniqueLines.length} duplicates!`, 'success');
  }, [inputText]);

  const sortLines = () => {
    if (processedLines.length === 0) {
      showPopupMessage('No data to sort! Remove duplicates first.', 'warning');
      return;
    }

    const sorted = [...processedLines].sort();
    setProcessedLines(sorted);
    showPopupMessage('Lines sorted alphabetically!', 'success');
  };

  const copyToClipboard = async () => {
    if (processedLines.length === 0) {
      showPopupMessage('No data to copy!', 'warning');
      return;
    }

    try {
      await navigator.clipboard.writeText(processedLines.join('\n'));
      showPopupMessage('Copied to clipboard!', 'success');
    } catch (err) {
      showPopupMessage('Failed to copy!', 'error');
    }
  };

  const downloadTxt = () => {
    if (processedLines.length === 0) {
      showPopupMessage('No data to download!', 'warning');
      return;
    }

    const blob = new Blob([processedLines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'unique_lines.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showPopupMessage('File downloaded successfully!', 'success');
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      showPopupMessage('Text pasted from clipboard!', 'success');
    } catch (err) {
      showPopupMessage('Failed to paste from clipboard!', 'error');
    }
  };

  const clearAll = () => {
    setInputText('');
    setProcessedLines([]);
    setStats({ total: 0, unique: 0, removed: 0 });
    showPopupMessage('All data cleared!', 'success');
  };

  const clearInput = () => {
    setInputText('');
    showPopupMessage('Input cleared!', 'success');
  };

  const clearOutput = () => {
    setProcessedLines([]);
    setStats({ total: 0, unique: 0, removed: 0 });
    showPopupMessage('Output cleared!', 'success');
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
                <Copy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Duplicate Remover Pro
                </h1>
                <p className="text-gray-600">Remove duplicates and organize your text data</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Input Text</h2>
              <button
                onClick={pasteFromClipboard}
                className="flex items-center space-x-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200"
              >
                <Upload className="w-4 h-4" />
                <span>Paste</span>
              </button>
            </div>
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-64 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white/50 backdrop-blur-sm"
              placeholder="Paste your text with duplicates here..."
            />

            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={removeDuplicates}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
              >
                <Settings className="w-4 h-4" />
                <span>Remove Duplicates</span>
              </button>
              
              <button
                onClick={sortLines}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                <ArrowUpDown className="w-4 h-4" />
                <span>Sort A-Z</span>
              </button>
              
              <button
                onClick={clearInput}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Input</span>
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Processed Text ({processedLines.length} lines)
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={downloadTxt}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={clearOutput}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            <div className="h-64 overflow-y-auto bg-gray-50 rounded-xl p-4 border">
              {processedLines.length > 0 ? (
                <div className="space-y-2">
                  {processedLines.map((line, index) => (
                    <div
                      key={index}
                      className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
                    >
                      <span className="text-gray-800 font-mono text-sm">{line}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Copy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No processed text yet</p>
                    <p className="text-sm">Add text and click "Remove Duplicates"</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics */}
        {stats.total > 0 && (
          <div className="mt-6 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800">Processing Statistics</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-blue-100">Total Lines</div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">{stats.unique}</div>
                <div className="text-green-100">Unique Lines</div>
              </div>
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">{stats.removed}</div>
                <div className="text-red-100">Duplicates Removed</div>
              </div>
            </div>
          </div>
        )}

        {/* Clear All Button */}
        <div className="mt-6 text-center">
          <button
            onClick={clearAll}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 mx-auto"
          >
            <Trash2 className="w-5 h-5" />
            <span>Clear Everything</span>
          </button>
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

export default DuplicateRemover;