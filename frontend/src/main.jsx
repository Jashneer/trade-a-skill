// src/main.jsx (Simplified for React/Mock Data)
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
// REMOVE: import * as Apollo from '@apollo/client'; 
// REMOVE: import client from './apolloClient';
import App from './App.jsx';
import './styles/main.css';
import * as AuthModule from './context/AuthContext.jsx'; 

const AuthProvider = AuthModule.AuthProvider; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* CRITICAL FIX: AuthProvider remains, ApolloProvider is removed. */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);