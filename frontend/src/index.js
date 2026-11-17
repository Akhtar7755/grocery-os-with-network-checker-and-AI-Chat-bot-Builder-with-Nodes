import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Hide the harmless "ResizeObserver loop" overlay in development (React Flow triggers it)
const RO_ERRORS = [
  'ResizeObserver loop completed with undelivered notifications.',
  'ResizeObserver loop limit exceeded',
];
window.addEventListener(
  'error',
  (e) => {
    if (RO_ERRORS.includes(e.message)) {
      e.stopImmediatePropagation();
      const overlay = document.getElementById('webpack-dev-server-client-overlay');
      const overlayDiv = document.getElementById('webpack-dev-server-client-overlay-div');
      if (overlay) overlay.style.display = 'none';
      if (overlayDiv) overlayDiv.style.display = 'none';
    }
  },
  true,
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();