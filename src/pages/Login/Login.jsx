import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { auth, db } from '../../services/firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import styles from './Login.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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

  const handleCreateAdmin = async () => {
    if (!email || !password) {
      setError('Please enter an email and password first to create an admin account.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Set admin role in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      // Now login
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={`glass ${styles.loginBox}`}>
        <div className={styles.header}>
          <h2>Fitnova Admin</h2>
          <p>Login to manage the platform</p>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
          
          {/* Temporary button for development */}
          <button 
            type="button" 
            onClick={handleCreateAdmin} 
            disabled={loading} 
            className={styles.submitBtn} 
            style={{ backgroundColor: 'var(--color-secondary)', marginTop: '1rem' }}
          >
            {loading ? 'Creating...' : 'Create Admin Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
