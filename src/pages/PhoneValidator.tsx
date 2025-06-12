import React, { useState, useCallback, useRef } from 'react';
import { Phone, Copy, Download, Trash2, Upload, LogOut, Settings, Home, File, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useSecurity } from '../contexts/SecurityContext';
import * as XLSX from 'xlsx';
import SecurityPopup from '../components/SecurityPopup';
import { Link } from 'react-router-dom';

interface ValidationResult {
  phone: string;
  isValid: boolean;
  country?: string;
  carrier?: string;
  type?: string;
  error?: string;
}

const PhoneValidator: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error' | 'warning'>('success');
  const [autoValidate, setAutoValidate] = useState(true);
  const [stats, setStats] = useState({ total: 0, valid: 0, invalid: 0 });
  const { logout } = useSecurity();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showPopupMessage = useCallback((message: string, type: 'success' | 'error' | 'warning') => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  }, []);

  // Extract phone numbers from text
  const extractPhoneNumbers = (text: string): string[] => {
    // Enhanced regex for various phone number formats
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})|(?:\+?[1-9]\d{0,3}[-.\s]?)?\(?([0-9]{1,4})\)?[-.\s]?([0-9]{1,4})[-.\s]?([0-9]{1,9})/g;
    const phones = text.match(phoneRegex) || [];
    return [...new Set(phones.map(phone => phone.trim()))];
  };

  // Validate phone number using API
  const validatePhoneNumber = async (phone: string): Promise<ValidationResult> => {
    try {
      // Clean phone number
      const cleanPhone = phone.replace(/[^\d+]/g, '');
      
      // Basic validation first
      if (cleanPhone.length < 7 || cleanPhone.length > 15) {
        return {
          phone,
          isValid: false,
          error: 'Invalid length'
        };
      }

      // Call validation API (you can replace this with your preferred API)
      const response = await fetch(`/api/validate-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: cleanPhone })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          phone,
          isValid: data.valid,
          country: data.country,
          carrier: data.carrier,
          type: data.type
        };
      } else {
        // Fallback validation
        return {
          phone,
          isValid: /^\+?[1-9]\d{1,14}$/.test(cleanPhone),
          country: 'Unknown',
          type: 'Unknown'
        };
      }
    } catch (error) {
      // Fallback validation
      const cleanPhone = phone.replace(/[^\d+]/g, '');
      return {
        phone,
        isValid: /^\+?[1-9]\d{7,14}$/.test(cleanPhone),
        country: 'Unknown',
        type: 'Unknown',
        error: 'API unavailable'
      };
    }
  };

  const validatePhones = useCallback(async () => {
    if (!inputText.trim()) {
      showPopupMessage('Please enter some phone numbers first!', 'warning');
      return;
    }

    setIsValidating(true);
    const phones = extractPhoneNumbers(inputText);
    
    if (phones.length === 0) {
      showPopupMessage('No valid phone number formats found!', 'warning');
      setIsValidating(false);
      return;
    }

    try {
      const results: ValidationResult[] = [];
      
      // Validate phones in batches to avoid overwhelming the API
      const batchSize = 10;
      for (let i = 0; i < phones.length; i += batchSize) {
        const batch = phones.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(phone => validatePhoneNumber(phone))
        );
        results.push(...batchResults);
        
        // Update progress
        if (i + batchSize < phones.length) {
          showPopupMessage(`Validating... ${i + batchSize}/${phones.length}`, 'success');
        }
      }

      setValidationResults(results);
      
      const validCount = results.filter(r => r.isValid).length;
      const invalidCount = results.length - validCount;
      
      setStats({
        total: results.length,
        valid: validCount,
        invalid: invalidCount
      });

      showPopupMessage(`Validated ${results.length} phone numbers!`, 'success');
    } catch (error) {
      showPopupMessage('Error during validation!', 'error');
    } finally {
      setIsValidating(false);
    }
  }, [inputText]);

  const copyResults = async (type: 'all' | 'valid' | 'invalid') => {
    let resultsToCopy: ValidationResult[] = [];
    
    switch (type) {
      case 'valid':
        resultsToCopy = validationResults.filter(r => r.isValid);
        break;
      case 'invalid':
        resultsToCopy = validationResults.filter(r => !r.isValid);
        break;
      default:
        resultsToCopy = validationResults;
    }

    if (resultsToCopy.length === 0) {
      showPopupMessage(`No ${type} results to copy!`, 'warning');
      return;
    }

    try {
      const text = resultsToCopy.map(r => r.phone).join('\n');
      await navigator.clipboard.writeText(text);
      showPopupMessage(`${type} phone numbers copied to clipboard!`, 'success');
    } catch (err) {
      showPopupMessage('Failed to copy results!', 'error');
    }
  };

  const downloadResults = (format: 'txt' | 'excel', type: 'all' | 'valid' | 'invalid') => {
    let resultsToDownload: ValidationResult[] = [];
    
    switch (type) {
      case 'valid':
        resultsToDownload = validationResults.filter(r => r.isValid);
        break;
      case 'invalid':
        resultsToDownload = validationResults.filter(r => !r.isValid);
        break;
      default:
        resultsToDownload = validationResults;
    }

    if (resultsToDownload.length === 0) {
      showPopupMessage(`No ${type} results to download!`, 'warning');
      return;
    }

    if (format === 'txt') {
      const text = resultsToDownload.map(r => r.phone).join('\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-phone-numbers.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const ws = XLSX.utils.aoa_to_sheet([
        ['Phone Number', 'Valid', 'Country', 'Carrier', 'Type', 'Error'],
        ...resultsToDownload.map(r => [
          r.phone,
          r.isValid ? 'Yes' : 'No',
          r.country || '',
          r.carrier || '',
          r.type || '',
          r.error || ''
        ])
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Phone Numbers');
      XLSX.writeFile(wb, `${type}-phone-validation.xlsx`);
    }

    showPopupMessage(`${type} results downloaded as ${format.toUpperCase()}!`, 'success');
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      showPopupMessage('Text pasted from clipboard!', 'success');

      if (autoValidate) {
        setTimeout(() => validatePhones(), 500);
      }
    } catch (err) {
      showPopupMessage('Failed to paste from clipboard!', 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.txt')) {
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setInputText(text);
        showPopupMessage('TXT file uploaded successfully!', 'success');
        
        if (autoValidate) {
          setTimeout(() => validatePhones(), 500);
        }
      };
      reader.readAsText(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          const text = jsonData.flat().join(' ');
          setInputText(text);
          showPopupMessage('Excel file uploaded successfully!', 'success');
          
          if (autoValidate) {
            setTimeout(() => validatePhones(), 500);
          }
        } catch (error) {
          showPopupMessage('Failed to read Excel file', 'error');
        }
      };
      reader.readAsBinaryString(file);
    } else {
      showPopupMessage('Unsupported file type. Only TXT and Excel files are allowed.', 'error');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearAll = () => {
    setInputText('');
    setValidationResults([]);
    setStats({ total: 0, valid: 0, invalid: 0 });
    showPopupMessage('All data cleared!', 'success');
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Phone Validator Pro
                </h1>
                <p className="text-gray-600">Validate and verify phone numbers with advanced checking</p>
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
              <h2 className="text-xl font-semibold text-gray-800">Input Phone Numbers</h2>
              <div className="flex items-center space-x-3">
                <label className="flex items-center text-sm text-gray-700 space-x-1">
                  <input
                    type="checkbox"
                    checked={autoValidate}
                    onChange={() => setAutoValidate((prev) => !prev)}
                    className="form-checkbox h-4 w-4 text-green-600"
                  />
                  <span>Auto Validate</span>
                </label>
                <button
                  onClick={pasteFromClipboard}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                >
                  <Upload className="w-4 h-4" />
                  <span>Paste</span>
                </button>
              </div>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-64 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none bg-white/50 backdrop-blur-sm"
              placeholder="Enter phone numbers here (one per line or separated by spaces)..."
            />

            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={validatePhones}
                disabled={isValidating}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Settings className="w-4 h-4" />
                <span>{isValidating ? 'Validating...' : 'Validate Numbers'}</span>
              </button>

              <button
                onClick={clearAll}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200"
              >
                <File className="w-4 h-4" />
                <span>Upload File</span>
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,.xlsx,.xls"
                className="hidden"
              />
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Validation Results ({validationResults.length})
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => copyResults('valid')}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                >
                  <Copy className="w-4 h-4" />
                  <span>Valid</span>
                </button>
                <button
                  onClick={() => copyResults('invalid')}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                >
                  <Copy className="w-4 h-4" />
                  <span>Invalid</span>
                </button>
              </div>
            </div>

            <div className="h-64 overflow-y-auto bg-gray-50 rounded-xl p-4 border">
              {validationResults.length > 0 ? (
                <div className="space-y-2">
                  {validationResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg shadow-sm border transition-shadow duration-200 ${
                        result.isValid 
                          ? 'bg-green-50 border-green-200 hover:shadow-md' 
                          : 'bg-red-50 border-red-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {result.isValid ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="font-mono text-sm font-medium">{result.phone}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          result.isValid 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {result.isValid ? 'Valid' : 'Invalid'}
                        </span>
                      </div>
                      {(result.country || result.carrier || result.type || result.error) && (
                        <div className="mt-2 text-xs text-gray-600">
                          {result.country && <span>Country: {result.country} | </span>}
                          {result.carrier && <span>Carrier: {result.carrier} | </span>}
                          {result.type && <span>Type: {result.type}</span>}
                          {result.error && <span className="text-red-600">Error: {result.error}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Phone className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No validation results yet</p>
                    <p className="text-sm">Add phone numbers and click "Validate"</p>
                  </div>
                </div>
              )}
            </div>

            {/* Download Options */}
            {validationResults.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => downloadResults('txt', 'valid')}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Valid TXT</span>
                </button>
                <button
                  onClick={() => downloadResults('excel', 'all')}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>All Excel</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        {stats.total > 0 && (
          <div className="mt-6 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Validation Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-blue-100">Total Numbers</div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">{stats.valid}</div>
                <div className="text-green-100">Valid Numbers</div>
              </div>
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">{stats.invalid}</div>
                <div className="text-red-100">Invalid Numbers</div>
              </div>
            </div>
            {stats.total > 0 && (
              <div className="mt-4 text-center">
                <div className="text-lg font-semibold text-gray-800">
                  Success Rate: {((stats.valid / stats.total) * 100).toFixed(1)}%
                </div>
              </div>
            )}
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

export default PhoneValidator;