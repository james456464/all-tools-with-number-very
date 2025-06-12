import React, { useState, useCallback, useRef } from 'react';
import { Mail, Copy, Download, Trash2, Upload, LogOut, Settings, Home, File } from 'lucide-react';
import { useSecurity } from '../contexts/SecurityContext';
import * as XLSX from 'xlsx';
import SecurityPopup from '../components/SecurityPopup';
import { Link } from 'react-router-dom';

const EmailExtractor: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [extractedEmails, setExtractedEmails] = useState<string[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error' | 'warning'>('success');
  const [autoExtract, setAutoExtract] = useState(true); // ✅ Auto-extract enabled by default
  const { logout } = useSecurity();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showPopupMessage = useCallback((message: string, type: 'success' | 'error' | 'warning') => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  }, []);

  // Helper function for email extraction
  const extractEmailsFromText = useCallback((text: string) => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailRegex) || [];
    const uniqueEmails = [...new Set(emails)];
    setExtractedEmails(uniqueEmails);

    if (uniqueEmails.length > 0) {
      showPopupMessage(`Extracted ${uniqueEmails.length} unique emails!`, 'success');
    } else {
      showPopupMessage('No valid emails found in the text.', 'warning');
    }
  }, [showPopupMessage]);

  const extractEmails = useCallback(() => {
    extractEmailsFromText(inputText);
  }, [inputText, extractEmailsFromText]);

  const copyToClipboard = async () => {
    if (extractedEmails.length === 0) {
      showPopupMessage('No emails to copy!', 'warning');
      return;
    }

    try {
      await navigator.clipboard.writeText(extractedEmails.join('\n'));
      showPopupMessage('Emails copied to clipboard!', 'success');
    } catch (err) {
      showPopupMessage('Failed to copy emails!', 'error');
    }
  };

  const downloadTxt = () => {
    if (extractedEmails.length === 0) {
      showPopupMessage('No emails to download!', 'warning');
      return;
    }

    const blob = new Blob([extractedEmails.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted_emails.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showPopupMessage('Emails downloaded as TXT file!', 'success');
  };

  const downloadExcel = () => {
    if (extractedEmails.length === 0) {
      showPopupMessage('No emails to download!', 'warning');
      return;
    }

    const ws = XLSX.utils.aoa_to_sheet([
      ['Email'],
      ...extractedEmails.map((email) => [email]),
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Emails');
    XLSX.writeFile(wb, 'extracted_emails.xlsx');
    showPopupMessage('Emails downloaded as Excel file!', 'success');
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      showPopupMessage('Text pasted from clipboard!', 'success');

      // ✅ Conditional Auto Extract
      if (autoExtract) {
        extractEmailsFromText(text);
      }
    } catch (err) {
      showPopupMessage('Failed to paste from clipboard!', 'error');
    }
  };

  // ✅ Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const fileName = file.name.toLowerCase();

    // Handle TXT files
    if (fileName.endsWith('.txt')) {
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setInputText(text);
        showPopupMessage('TXT file uploaded successfully!', 'success');
        
        // Auto extract if enabled
        if (autoExtract) {
          extractEmailsFromText(text);
        }
      };
      reader.readAsText(file);
    }
    // Handle Excel files
    else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Flatten and join all data
          const text = jsonData.flat().join(' ');
          setInputText(text);
          showPopupMessage('Excel file uploaded successfully!', 'success');
          
          // Auto extract if enabled
          if (autoExtract) {
            extractEmailsFromText(text);
          }
        } catch (error) {
          showPopupMessage('Failed to read Excel file', 'error');
        }
      };
      reader.readAsBinaryString(file);
    } else {
      showPopupMessage('Unsupported file type. Only TXT and Excel files are allowed.', 'error');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearAll = () => {
    setInputText('');
    setExtractedEmails([]);
    showPopupMessage('All data cleared!', 'success');
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Email Extractor Pro
                </h1>
                <p className="text-gray-600">Extract and manage email addresses with ease</p>
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
              <div className="flex items-center space-x-3">
                {/* ✅ Toggle for Auto Extract */}
                <label className="flex items-center text-sm text-gray-700 space-x-1">
                  <input
                    type="checkbox"
                    checked={autoExtract}
                    onChange={() => setAutoExtract((prev) => !prev)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span>Auto Extract</span>
                </label>
                {/* Paste Button */}
                <button
                  onClick={pasteFromClipboard}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                  <Upload className="w-4 h-4" />
                  <span>Paste</span>
                </button>
              </div>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-64 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white/50 backdrop-blur-sm"
              placeholder="Paste your text containing email addresses here..."
            />

            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={extractEmails}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
              >
                <Settings className="w-4 h-4" />
                <span>Extract Emails</span>
              </button>

              <button
                onClick={clearAll}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>

              {/* ✅ File Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200"
              >
                <File className="w-4 h-4" />
                <span>Upload File</span>
              </button>
              
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,.xlsx,.xls"
                className="hidden"
              />
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Extracted Emails ({extractedEmails.length})
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
                  className="flex items-center space-x-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200"
                >
                  <Download className="w-4 h-4" />
                  <span>TXT</span>
                </button>
                <button
                  onClick={downloadExcel}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                >
                  <Download className="w-4 h-4" />
                  <span>Excel</span>
                </button>
              </div>
            </div>

            <div className="h-64 overflow-y-auto bg-gray-50 rounded-xl p-4 border">
              {extractedEmails.length > 0 ? (
                <div className="space-y-2">
                  {extractedEmails.map((email, index) => (
                    <div
                      key={index}
                      className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
                    >
                      <span className="text-gray-800 font-mono text-sm">{email}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No emails extracted yet</p>
                    <p className="text-sm">Paste text and click "Extract Emails"</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics */}
        {extractedEmails.length > 0 && (
          <div className="mt-6 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">{extractedEmails.length}</div>
                <div className="text-blue-100">Unique Emails</div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">{inputText.length}</div>
                <div className="text-green-100">Characters Processed</div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">
                  {extractedEmails.filter((email) => email.includes('gmail')).length}
                </div>
                <div className="text-purple-100">Gmail Addresses</div>
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

export default EmailExtractor;