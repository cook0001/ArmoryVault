import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { setupDesktopBridge } from './bridge/tauriBridge';

// Initialize Tauri / Desktop bridge
setupDesktopBridge().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
});
