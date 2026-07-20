import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  SquaresFour, 
  Users, 
  Barbell, 
  PersonSimpleRun, 
  ForkKnife, 
  YinYang, 
  MoonStars,
  Trophy,
  BellRinging,
  Gear
} from '@phosphor-icons/react';
import styles from './Sidebar.module.css';

const navGroups = [
  {
    title: 'OVERVIEW',
    items: [
      { path: '/', label: 'Dashboard', icon: <SquaresFour size={24} weight="duotone" /> },
      { path: '/users', label: 'Users', icon: <Users size={24} weight="duotone" /> },
    ]
  },
  {
    title: 'TRAINING',
    items: [
      { path: '/exercises', label: 'Exercises', icon: <Barbell size={24} weight="duotone" /> },
      { path: '/workouts', label: 'Workouts', icon: <PersonSimpleRun size={24} weight="duotone" /> },
      { path: '/recipes', label: 'Nutrition', icon: <ForkKnife size={24} weight="duotone" /> },
    ]
  },
  {
    title: 'WELLNESS',
    items: [
      { path: '/meditation', label: 'Meditation', icon: <YinYang size={24} weight="duotone" /> },
      { path: '/sleep', label: 'Sleep', icon: <MoonStars size={24} weight="duotone" /> },
      { path: '/challenges', label: 'Challenges', icon: <Trophy size={24} weight="duotone" /> },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { path: '/notifications', label: 'Notifications', icon: <BellRinging size={24} weight="duotone" /> },
      { path: '/settings', label: 'Settings', icon: <Gear size={24} weight="duotone" /> }
    ]
  }
];

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      <div 
        className={`${styles.mobileBackdrop} ${isOpen ? styles.backdropOpen : ''}`} 
        onClick={onClose} 
      />
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>
          <div className={styles.bars}>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
          </div>
        </div>
        <h2>Fitnova</h2>
        <span className={styles.badge}>ADMIN</span>
      </div>
      
      <nav className={styles.nav}>
        {navGroups.map((group, index) => (
          <div key={index} className={styles.navGroup}>
            <h3 className={styles.groupTitle}>{group.title}</h3>
            <ul className={styles.navList}>
              {group.items.map((item) => (
                <li key={item.path} className={styles.navItem}>
                  <NavLink 
                    to={item.path} 
                    className={({ isActive }) => 
                      isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
                    }
                    end={item.path === '/'}
                  >
                    <span className={styles.icon}>{item.icon}</span>
                    <span className={styles.label}>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className={styles.userProfile}>
        <div className={styles.userAvatar}>
          SA
        </div>
        <div className={styles.userInfo}>
          <h4>Sana Admin</h4>
          <p>Studio Owner</p>
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
