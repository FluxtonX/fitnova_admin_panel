import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import {
  Menu,
  Bell,
  BellRing,
  Sun,
  Moon,
  User,
  X,
  UserCheck,
} from 'lucide-react';
import styles from './Header.module.css';

const Header = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Apply theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Real-time listener for new users created during this session
  useEffect(() => {
    const sessionStart = new Date();
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const userData = change.doc.data();
          
          // Parse createdAt timestamp safely
          let createdDate = null;
          if (userData.createdAt?.seconds) {
            createdDate = new Date(userData.createdAt.seconds * 1000);
          } else if (userData.createdAt) {
            createdDate = new Date(userData.createdAt);
          }

          // Trigger notification only if user was created after the session started
          if (createdDate && createdDate.getTime() >= sessionStart.getTime()) {
            const userName = userData.fullName || userData.email?.split('@')[0] || 'A New Member';
            const email = userData.email || '';
            
            const newNotification = {
              id: change.doc.id,
              title: 'New Member Signed Up',
              message: `${userName} (${email}) joined FitNova!`,
              time: createdDate,
              read: false,
            };

            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);

            // Play notification chime sound (Mixkit SFX - royalty free beep/alert)
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
            audio.volume = 0.45;
            audio.play().catch(() => {});
          }
        }
      });
    });

    return () => unsubscribe();
  }, []);

  const handleNotificationClick = () => {
    setIsDropdownOpen(false);
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    navigate('/notifications');
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    setIsDropdownOpen(false);
  };

  const formatRelativeTime = (date) => {
    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr}h ago`;
  };

  return (
    <header className={`glass ${styles.header}`}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuClick} title="Open navigation">
          <Menu size={20} />
        </button>
      </div>

      <div className={styles.right}>
        {/* Theme Toggle */}
        <button
          className={styles.iconBtn}
          onClick={() => setIsDark(!isDark)}
          title="Toggle Theme"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications Icon with Badge */}
        <div className={styles.notificationWrapper}>
          <button
            className={`${styles.iconBtn} ${unreadCount > 0 ? styles.activeBell : ''}`}
            onClick={handleNotificationClick}
            title="Notifications"
          >
            {unreadCount > 0 ? (
              <BellRing size={20} className={styles.wobbleBell} />
            ) : (
              <Bell size={20} />
            )}
            {unreadCount > 0 && (
              <span className={styles.badge}>{unreadCount}</span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isDropdownOpen && (
            <div className={`glass ${styles.dropdown}`}>
              <div className={styles.dropdownHeader}>
                <h4>Activity Monitor</h4>
                {notifications.length > 0 && (
                  <button className={styles.clearBtn} onClick={clearAllNotifications}>
                    Clear All
                  </button>
                )}
              </div>
              <div className={styles.dropdownContent}>
                {notifications.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Bell size={28} className={styles.emptyIcon} />
                    <p>No new member notifications</p>
                    <span className={styles.emptySubtitle}>Live events will appear here in real-time</span>
                  </div>
                ) : (
                  <ul className={styles.notifList}>
                    {notifications.map((n) => (
                      <li key={n.id} className={styles.notifItem}>
                        <div className={styles.notifIconCircle}>
                          <UserCheck size={14} color="#10b981" />
                        </div>
                        <div className={styles.notifDetails}>
                          <p className={styles.notifTitle}>{n.title}</p>
                          <p className={styles.notifMessage}>{n.message}</p>
                          <span className={styles.notifTime}>{formatRelativeTime(n.time)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Navigation Button */}
        <button
          className={styles.profileBtn}
          onClick={() => {
            setIsDropdownOpen(false);
            navigate('/profile');
          }}
          title="Admin Profile"
        >
          <User size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
