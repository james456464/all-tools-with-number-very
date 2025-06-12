import React, { useState, useCallback } from 'react';
import { Shuffle, Copy, Download, Trash2, Upload, LogOut, Plus, X, Home } from 'lucide-react';
import { useSecurity } from '../contexts/SecurityContext';
import * as XLSX from 'xlsx';
import SecurityPopup from '../components/SecurityPopup';
import { Link } from 'react-router-dom';

interface DeviceBox {
  id: string;
  name: string;
  userAgents: string[];
}

const UserAgentMixer: React.FC = () => {
  const [deviceBoxes, setDeviceBoxes] = useState<DeviceBox[]>([
    { id: '1', name: 'iPhone', userAgents: [] },
    { id: '2', name: 'Samsung', userAgents: [] },
    { id: '3', name: 'Motorola', userAgents: [] }
  ]);
  const [mixedUserAgents, setMixedUserAgents] = useState<string[]>([]);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error' | 'warning'>('success');
  const { logout } = useSecurity();

  const showPopupMessage = (message: string, type: 'success' | 'error' | 'warning') => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  };

  const isValidUserAgent = (ua: string): boolean => {
    return typeof ua === "string" && ua.length > 20 &&
      (ua.toLowerCase().includes("mozilla") ||
       ua.toLowerCase().includes("applewebkit") ||
       ua.toLowerCase().includes("chrome"));
  };

  const sanitizeUserAgents = (userAgents: string[]): string[] => {
    const seen = new Set<string>();
    return userAgents
      .map(ua => ua.trim())
      .filter(ua => ua.length > 0)
      .filter(isValidUserAgent)
      .filter(ua => {
        const key = ua.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  };

  const updateDeviceUserAgents = (deviceId: string, text: string) => {
    const userAgents = text.split(/\r?\n/).filter(Boolean);
    const cleanUserAgents = sanitizeUserAgents(userAgents);
    
    setDeviceBoxes(prev => prev.map(device => 
      device.id === deviceId 
        ? { ...device, userAgents: cleanUserAgents }
        : device
    ));
  };

  const addDeviceBox = () => {
    if (!newDeviceName.trim()) {
      showPopupMessage('Please enter a device name!', 'warning');
      return;
    }

    if (deviceBoxes.some(device => device.name.toLowerCase() === newDeviceName.toLowerCase())) {
      showPopupMessage('Device name already exists!', 'error');
      return;
    }

    const newDevice: DeviceBox = {
      id: Date.now().toString(),
      name: newDeviceName.trim(),
      userAgents: []
    };

    setDeviceBoxes(prev => [...prev, newDevice]);
    setNewDeviceName('');
    showPopupMessage(`Device "${newDevice.name}" added successfully!`, 'success');
  };

  const removeDeviceBox = (deviceId: string) => {
    const device = deviceBoxes.find(d => d.id === deviceId);
    if (device && window.confirm(`Are you sure you want to delete "${device.name}"?`)) {
      setDeviceBoxes(prev => prev.filter(d => d.id !== deviceId));
      showPopupMessage(`Device "${device.name}" removed successfully!`, 'success');
    }
  };

  const pasteUserAgents = async (deviceId: string) => {
    try {
      const text = await navigator.clipboard.readText();
      const device = deviceBoxes.find(d => d.id === deviceId);
      if (device) {
        const existingText = device.userAgents.join('\n');
        const newText = existingText ? `${existingText}\n${text}` : text;
        updateDeviceUserAgents(deviceId, newText);
        showPopupMessage('User agents pasted successfully!', 'success');
      }
    } catch (err) {
      showPopupMessage('Failed to paste from clipboard!', 'error');
    }
  };

  const uploadFile = (event: React.ChangeEvent<HTMLInputElement>, deviceId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const device = deviceBoxes.find(d => d.id === deviceId);
    
    if (!device) return;

    if (file.name.endsWith('.txt')) {
      reader.onload = () => {
        const text = reader.result as string;
        const existingText = device.userAgents.join('\n');
        const newText = existingText ? `${existingText}\n${text}` : text;
        updateDeviceUserAgents(deviceId, newText);
        showPopupMessage('TXT file uploaded successfully!', 'success');
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.xlsx')) {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
          const userAgents = jsonData.flat().filter(item => typeof item === "string" && item.trim());
          
          const existingText = device.userAgents.join('\n');
          const newText = existingText ? `${existingText}\n${userAgents.join('\n')}` : userAgents.join('\n');
          updateDeviceUserAgents(deviceId, newText);
          showPopupMessage('Excel file uploaded successfully!', 'success');
        } catch (error) {
          showPopupMessage('Error processing Excel file!', 'error');
        }
      };
      reader.readAsArrayBuffer(file);
    }
    
    event.target.value = '';
  };

  const mixUserAgents = useCallback(() => {
    // Update all device boxes first
    deviceBoxes.forEach(device => {
      const textarea = document.querySelector(`#device-${device.id} textarea`) as HTMLTextAreaElement;
      if (textarea) {
        updateDeviceUserAgents(device.id, textarea.value);
      }
    });

    const iphoneDevice = deviceBoxes.find(d => d.name.toLowerCase() === 'iphone');
    const iphoneList = iphoneDevice ? [...iphoneDevice.userAgents] : [];
    
    if (!iphoneList.length) {
      showPopupMessage('At least one iPhone user agent is required!', 'error');
      return;
    }

    const otherDevices = deviceBoxes
      .filter(d => d.name.toLowerCase() !== 'iphone')
      .map(d => ({ name: d.name, list: [...d.userAgents] }))
      .filter(d => d.list.length > 0);

    if (!otherDevices.length) {
      setMixedUserAgents(iphoneList);
      showPopupMessage(`Mixed ${iphoneList.length} user agents successfully!`, 'success');
      return;
    }

    const result: string[] = [];
    let nextOtherIdx = 0;

    while (iphoneList.length || otherDevices.some(d => d.list.length)) {
      const remainingOther = otherDevices.reduce((sum, d) => sum + d.list.length, 0);
      const quota = remainingOther ? Math.ceil(iphoneList.length / (remainingOther + 1)) : iphoneList.length;

      // Add iPhone user agents
      for (let i = 0; i < quota && iphoneList.length; i++) {
        result.push(iphoneList.shift()!);
      }

      // Add one from other devices
      if (remainingOther) {
        let loops = 0;
        while (loops < otherDevices.length) {
          const device = otherDevices[nextOtherIdx];
          nextOtherIdx = (nextOtherIdx + 1) % otherDevices.length;
          loops++;
          if (device.list.length) {
            result.push(device.list.shift()!);
            break;
          }
        }
      }
    }

    setMixedUserAgents(result);
    showPopupMessage(`Mixed ${result.length} user agents successfully!`, 'success');
  }, [deviceBoxes]);

  const copyMixedUserAgents = async () => {
    if (mixedUserAgents.length === 0) {
      showPopupMessage('No mixed user agents to copy!', 'warning');
      return;
    }

    try {
      await navigator.clipboard.writeText(mixedUserAgents.join('\n'));
      showPopupMessage('Mixed user agents copied to clipboard!', 'success');
    } catch (err) {
      showPopupMessage('Failed to copy user agents!', 'error');
    }
  };

  const downloadTxt = () => {
    if (mixedUserAgents.length === 0) {
      showPopupMessage('No mixed user agents to download!', 'warning');
      return;
    }

    const blob = new Blob([mixedUserAgents.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mixed-user-agents.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showPopupMessage('User agents downloaded as TXT file!', 'success');
  };

  const downloadExcel = () => {
    if (mixedUserAgents.length === 0) {
      showPopupMessage('No mixed user agents to download!', 'warning');
      return;
    }

    try {
      const worksheet = XLSX.utils.aoa_to_sheet(mixedUserAgents.map(ua => [ua]));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'UserAgents');
      XLSX.writeFile(workbook, 'mixed-user-agents.xlsx');
      showPopupMessage('User agents downloaded as Excel file!', 'success');
    } catch (error) {
      showPopupMessage('Error creating Excel file!', 'error');
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                <Shuffle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  User Agent Mixer Pro
                </h1>
                <p className="text-gray-600">Mix and randomize user agents from different devices</p>
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-6 border border-white/20">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Device</h2>
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                  placeholder="Enter device name"
                  onKeyPress={(e) => e.key === 'Enter' && addDeviceBox()}
                />
                <button
                  onClick={addDeviceBox}
                  className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>

              <h2 className="text-xl font-semibold text-gray-800 mb-4">Mixing Controls</h2>
              <div className="space-y-3">
                <button
                  onClick={mixUserAgents}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
                >
                  <Shuffle className="w-5 h-5" />
                  <span>Mix User Agents</span>
                </button>
                
                <button
                  onClick={copyMixedUserAgents}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Results</span>
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={downloadTxt}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors duration-200"
                  >
                    <Download className="w-4 h-4" />
                    <span>TXT</span>
                  </button>
                  <button
                    onClick={downloadExcel}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors duration-200"
                  >
                    <Download className="w-4 h-4" />
                    <span>Excel</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mixed Results */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Mixed Results</h2>
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {mixedUserAgents.length} UAs
                </span>
              </div>
              <div className="h-64 overflow-y-auto bg-gray-50 rounded-xl p-4 border">
                {mixedUserAgents.length > 0 ? (
                  <div className="space-y-2">
                    {mixedUserAgents.map((ua, index) => (
                      <div
                        key={index}
                        className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
                      >
                        <span className="text-gray-800 font-mono text-xs break-all">{ua}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Shuffle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No mixed user agents yet</p>
                      <p className="text-sm">Add user agents and click "Mix"</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Device Boxes */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Device Boxes</h2>
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {deviceBoxes.length} devices
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {deviceBoxes.map((device) => (
                  <div
                    key={device.id}
                    id={`device-${device.id}`}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-800">{device.name}</h3>
                        <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                          {device.userAgents.length} UAs
                        </span>
                      </div>
                      <button
                        onClick={() => removeDeviceBox(device.id)}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => pasteUserAgents(device.id)}
                        className="flex items-center space-x-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Paste</span>
                      </button>
                      <label className="flex items-center space-x-1 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200 text-sm cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept=".txt,.xlsx"
                          onChange={(e) => uploadFile(e, device.id)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <textarea
                      value={device.userAgents.join('\n')}
                      onChange={(e) => updateDeviceUserAgents(device.id, e.target.value)}
                      className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none bg-white font-mono text-sm"
                      placeholder="Paste user agents here, one per line..."
                    />
                  </div>
                ))}
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

export default UserAgentMixer;