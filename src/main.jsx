// src/main.jsx (Final Clean Version)
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/main.css';

// Direct import of AuthProvider to fix the "AuthModule" red underlines
import { AuthProvider } from './context/AuthContext.jsx'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);