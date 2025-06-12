export const applySecurityMeasures = () => {
  // Disable right-click context menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showSecurityAlert('Right-click is disabled for security reasons!');
  });

  // Disable F12 and other developer tools shortcuts
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12') {
      e.preventDefault();
      showSecurityAlert('Developer tools access is restricted!');
      return;
    }
    
    // Ctrl+Shift+I (Chrome DevTools)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      showSecurityAlert('Developer tools access is restricted!');
      return;
    }
    
    // Ctrl+Shift+J (Chrome Console)
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
      e.preventDefault();
      showSecurityAlert('Console access is restricted!');
      return;
    }
    
    // Ctrl+U (View Source)
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      showSecurityAlert('View source is disabled!');
      return;
    }
    
    // Ctrl+Shift+C (Element Inspector)
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      showSecurityAlert('Element inspector is disabled!');
      return;
    }
  });

  // Detect DevTools
  let devtools = {
    open: false,
    orientation: null
  };
  
  const threshold = 160;
  
  setInterval(() => {
    if (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold) {
      if (!devtools.open) {
        devtools.open = true;
        showSecurityAlert('Developer tools detected! Please close them.');
      }
    } else {
      devtools.open = false;
    }
  }, 500);

  // Disable text selection
  document.onselectstart = () => false;
  document.ondragstart = () => false;
};

const showSecurityAlert = (message: string) => {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse';
  alertDiv.textContent = message;
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    document.body.removeChild(alertDiv);
  }, 3000);
};

// Minified IIFE for additional security
(function(){const a=()=>{console.log('Security layer active')};a();})();