import React, { useState, useCallback } from 'react';
import { Type, Copy, Download, Trash2, Upload, LogOut, Settings, Home } from 'lucide-react';
import { useSecurity } from '../contexts/SecurityContext';
import SecurityPopup from '../components/SecurityPopup';
import { Link } from 'react-router-dom';

const TextFormatter: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error' | 'warning'>('success');
  const { logout } = useSecurity();

  const showPopupMessage = (message: string, type: 'success' | 'error' | 'warning') => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  };

  const formatText = useCallback((operation: string) => {
    if (!inputText.trim()) {
      showPopupMessage('Please enter some text first!', 'warning');
      return;
    }

    let result = '';
    
    switch (operation) {
      case 'uppercase':
        result = inputText.toUpperCase();
        break;
      case 'lowercase':
        result = inputText.toLowerCase();
        break;
      case 'titlecase':
        result = inputText.replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
        break;
      case 'sentencecase':
        result = inputText.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, (c) => 
          c.toUpperCase()
        );
        break;
      case 'removeSpaces':
        result = inputText.replace(/\s+/g, '');
        break;
      case 'removeExtraSpaces':
        result = inputText.replace(/\s+/g, ' ').trim();
        break;
      case 'removeLineBreaks':
        result = inputText.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();
        break;
      case 'addLineBreaks':
        result = inputText.replace(/\.\s+/g, '.\n').replace(/\?\s+/g, '?\n').replace(/\!\s+/g, '!\n');
        break;
      case 'reverse':
        result = inputText.split('').reverse().join('');
        break;
      case 'removeNumbers':
        result = inputText.replace(/\d/g, '');
        break;
      case 'removeSpecialChars':
        result = inputText.replace(/[^a-zA-Z0-9\s]/g, '');
        break;
      case 'extractEmails':
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = inputText.match(emailRegex) || [];
        result = [...new Set(emails)].join('\n');
        break;
      case 'extractUrls':
        const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
        const urls = inputText.match(urlRegex) || [];
        result = [...new Set(urls)].join('\n');
        break;
      case 'wordCount':
        const words = inputText.trim().split(/\s+/).filter(word => word.length > 0);
        const chars = inputText.length;
        const charsNoSpaces = inputText.replace(/\s/g, '').length;
        const lines = inputText.split(/\r\n|\r|\n/).length;
        result = `Words: ${words.length}\nCharacters: ${chars}\nCharacters (no spaces): ${charsNoSpaces}\nLines: ${lines}`;
        break;
      default:
        result = inputText;
    }

    setOutputText(result);
    showPopupMessage(`Text formatted successfully!`, 'success');
  }, [inputText]);

  const copyToClipboard = async () => {
    if (!outputText.trim()) {
      showPopupMessage('No formatted text to copy!', 'warning');
      return;
    }

    try {
      await navigator.clipboard.writeText(outputText);
      showPopupMessage('Text copied to clipboard!', 'success');
    } catch (err) {
      showPopupMessage('Failed to copy text!', 'error');
    }
  };

  const downloadTxt = () => {
    if (!outputText.trim()) {
      showPopupMessage('No formatted text to download!', 'warning');
      return;
    }

    const blob = new Blob([outputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted-text.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showPopupMessage('Text downloaded as TXT file!', 'success');
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
    setOutputText('');
    showPopupMessage('All data cleared!', 'success');
  };

  const formatButtons = [
    { id: 'uppercase', label: 'UPPERCASE', color: 'bg-blue-500 hover:bg-blue-600' },
    { id: 'lowercase', label: 'lowercase', color: 'bg-green-500 hover:bg-green-600' },
    { id: 'titlecase', label: 'Title Case', color: 'bg-purple-500 hover:bg-purple-600' },
    { id: 'sentencecase', label: 'Sentence case', color: 'bg-orange-500 hover:bg-orange-600' },
    { id: 'removeSpaces', label: 'Remove Spaces', color: 'bg-red-500 hover:bg-red-600' },
    { id: 'removeExtraSpaces', label: 'Remove Extra Spaces', color: 'bg-pink-500 hover:bg-pink-600' },
    { id: 'removeLineBreaks', label: 'Remove Line Breaks', color: 'bg-indigo-500 hover:bg-indigo-600' },
    { id: 'addLineBreaks', label: 'Add Line Breaks', color: 'bg-teal-500 hover:bg-teal-600' },
    { id: 'reverse', label: 'Reverse Text', color: 'bg-yellow-500 hover:bg-yellow-600' },
    { id: 'removeNumbers', label: 'Remove Numbers', color: 'bg-gray-500 hover:bg-gray-600' },
    { id: 'removeSpecialChars', label: 'Remove Special Chars', color: 'bg-cyan-500 hover:bg-cyan-600' },
    { id: 'extractEmails', label: 'Extract Emails', color: 'bg-emerald-500 hover:bg-emerald-600' },
    { id: 'extractUrls', label: 'Extract URLs', color: 'bg-lime-500 hover:bg-lime-600' },
    { id: 'wordCount', label: 'Word Count', color: 'bg-violet-500 hover:bg-violet-600' }
  ];

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl">
                <Type className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Text Formatter Pro
                </h1>
                <p className="text-gray-600">Format, clean, and transform your text with powerful tools</p>
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
                className="flex items-center space-x-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
              >
                <Upload className="w-4 h-4" />
                <span>Paste</span>
              </button>
            </div>
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-64 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none bg-white/50 backdrop-blur-sm"
              placeholder="Enter your text here to format..."
            />

            {/* Format Buttons */}
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Formatting Options</h3>
              <div className="grid grid-cols-2 gap-2">
                {formatButtons.map((button) => (
                  <button
                    key={button.id}
                    onClick={() => formatText(button.id)}
                    className={`flex items-center justify-center space-x-2 px-3 py-2 text-white rounded-lg transition-colors duration-200 text-sm ${button.color}`}
                  >
                    <Settings className="w-3 h-3" />
                    <span>{button.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={clearAll}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Formatted Text
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
              </div>
            </div>

            <div className="h-64 overflow-y-auto bg-gray-50 rounded-xl p-4 border">
              {outputText ? (
                <div className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                  {outputText}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Type className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No formatted text yet</p>
                    <p className="text-sm">Enter text and choose a formatting option</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics */}
        {inputText && (
          <div className="mt-6 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Text Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">{inputText.trim().split(/\s+/).filter(word => word.length > 0).length}</div>
                <div className="text-blue-100">Words</div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">{inputText.length}</div>
                <div className="text-green-100">Characters</div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">{inputText.replace(/\s/g, '').length}</div>
                <div className="text-purple-100">No Spaces</div>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">{inputText.split(/\r\n|\r|\n/).length}</div>
                <div className="text-orange-100">Lines</div>
              </div>
            </div>
          </div>
        )}
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

export default TextFormatter;