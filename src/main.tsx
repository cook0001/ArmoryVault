import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize mock backend only if not running inside Electron
if (typeof window !== 'undefined' && !window.api) {
  import('./mockBackend').then(({ setupMockBackend }) => {
    setupMockBackend();
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
