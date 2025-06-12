import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSecurity } from './contexts/SecurityContext';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import EmailExtractor from './pages/EmailExtractor';
import DuplicateRemover from './pages/DuplicateRemover';
import UserAgentMixer from './pages/UserAgentMixer';
import TextFormatter from './pages/TextFormatter';
import PasswordGenerator from './pages/PasswordGenerator';
import AdminPanel from './pages/AdminPanel';
import { applySecurityMeasures } from './utils/security';

function App() {
  const { isAuthenticated } = useSecurity();

  useEffect(() => {
    applySecurityMeasures();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Routes>
        <Route 
          path="/" 
          element={isAuthenticated ? <HomePage /> : <LoginPage />} 
        />
        <Route 
          path="/email-extractor" 
          element={isAuthenticated ? <EmailExtractor /> : <LoginPage />} 
        />
        <Route 
          path="/duplicate-remover" 
          element={isAuthenticated ? <DuplicateRemover /> : <LoginPage />} 
        />
        <Route 
          path="/user-agent-mixer" 
          element={isAuthenticated ? <UserAgentMixer /> : <LoginPage />} 
        />
        <Route 
          path="/text-formatter" 
          element={isAuthenticated ? <TextFormatter /> : <LoginPage />} 
        />
        <Route 
          path="/password-generator" 
          element={isAuthenticated ? <PasswordGenerator /> : <LoginPage />} 
        />
        <Route 
          path="/admin/billa" 
          element={<AdminPanel />} 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;