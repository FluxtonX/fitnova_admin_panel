import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './Login.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>

      {/* Smooth animated color background */}
      <div className={styles.animatedBg} />

      {/* Subtle dot-grid overlay */}
      <div className={styles.gridOverlay} />

      {/* Glassmorphism card */}
      <div className={styles.loginCard}>

        {/* Logo mark */}
        <div className={styles.logoWrap}>
          <div className={styles.logoIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                fill="white" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div className={styles.header}>
          <h1 className={styles.title}>Fitnova Admin</h1>
          <p className={styles.subtitle}>Welcome back! Sign in to manage your platform.</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className={styles.error} role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" stroke="#EF4444" strokeWidth="2" />
              <path d="M12 8v4m0 4h.01" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className={styles.form} noValidate>

          {/* Email */}
          <div className={styles.fieldGroup}>
            <label htmlFor="admin-email" className={styles.label}>Email address</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                    stroke="rgba(255,255,255,0.35)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="22,6 12,13 2,6"
                    stroke="rgba(255,255,255,0.35)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <input
                type="email"
                id="admin-email"
                className={styles.input}
                placeholder="admin@fitnova.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className={styles.fieldGroup}>
            <label htmlFor="admin-password" className={styles.label}>Password</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"
                    stroke="rgba(255,255,255,0.35)" strokeWidth="1.6" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"
                    stroke="rgba(255,255,255,0.35)" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="admin-password"
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                      stroke="rgba(255,255,255,0.4)" strokeWidth="1.6" strokeLinecap="round" />
                    <line x1="1" y1="1" x2="23" y2="23"
                      stroke="rgba(255,255,255,0.4)" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                      stroke="rgba(255,255,255,0.4)" strokeWidth="1.6" />
                    <circle cx="12" cy="12" r="3"
                      stroke="rgba(255,255,255,0.4)" strokeWidth="1.6" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className={styles.rememberRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className={styles.checkboxCustom} />
              <span className={styles.checkboxText}>Remember me</span>
            </label>
          </div>

          {/* Sign In button */}
          <button type="submit" disabled={loading} className={styles.signInBtn}>
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"
                    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="10 17 15 12 10 7"
                    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="15" y1="12" x2="3" y2="12"
                    stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Sign In
              </>
            )}
          </button>
        </form>

        <p className={styles.footer}>Fitnova Admin Panel &copy; {new Date().getFullYear()}</p>
      </div>
    </div>
  );
};

export default Login;
