import React, { createContext, useContext, useState, useEffect } from 'react';
import { observeAuthState, loginAdmin, logoutAdmin } from '../services/firebase/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = observeAuthState((user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (email, password) => {
    return loginAdmin(email, password);
  };

  const logout = () => {
    return logoutAdmin();
  };

  const value = {
    currentUser,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090b',
          color: '#ffffff',
          fontFamily: 'sans-serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '38px',
              height: '38px',
              border: '3px solid rgba(255,255,255,0.15)',
              borderTopColor: '#2563eb',
              borderRadius: '50%',
              animation: 'authSpin 0.75s linear infinite',
              margin: '0 auto 1rem'
            }} />
            <p style={{ fontSize: '0.88rem', color: '#a1a1aa', fontWeight: 500 }}>Loading Fitnova Admin...</p>
            <style>{`@keyframes authSpin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
