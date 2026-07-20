import React, { useEffect, useState } from 'react';
import { MdMenu, MdNotifications, MdAccountCircle, MdLightMode, MdDarkMode } from 'react-icons/md';
import styles from './Header.module.css';

const Header = ({ onMenuClick }) => {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage or default to system
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Apply theme on load and change
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <header className={`glass ${styles.header}`}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuClick}>
          <MdMenu />
        </button>
      </div>
      
      <div className={styles.right}>
        <button 
          className={styles.iconBtn} 
          onClick={() => setIsDark(!isDark)}
          title="Toggle Theme"
        >
          {isDark ? <MdLightMode className={styles.animateSpin} /> : <MdDarkMode className={styles.animateSpin} />}
        </button>
        <button className={styles.iconBtn}>
          <MdNotifications />
        </button>
        <div className={styles.profile}>
          <MdAccountCircle className={styles.profileIcon} />
        </div>
      </div>
    </header>
  );
};

export default Header;
