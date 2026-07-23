import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  PersonStanding,
  UtensilsCrossed,
  Brain,
  Moon,
  Trophy,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import styles from './Sidebar.module.css';

const navGroups = [
  {
    title: 'Overview',
    items: [
      {
        path: '/',
        label: 'Dashboard',
        icon: LayoutDashboard,
        color: '#6366f1',
        bg: 'rgba(99,102,241,0.12)',
      },
      {
        path: '/users',
        label: 'Users',
        icon: Users,
        color: '#3b82f6',
        bg: 'rgba(59,130,246,0.12)',
      },
    ],
  },
  {
    title: 'Training',
    items: [
      {
        path: '/workouts',
        label: 'Workouts',
        icon: PersonStanding,
        color: '#10b981',
        bg: 'rgba(16,185,129,0.12)',
      },
      {
        path: '/recipes',
        label: 'Nutrition',
        icon: UtensilsCrossed,
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.12)',
      },
    ],
  },
  {
    title: 'Wellness',
    items: [
      {
        path: '/meditation',
        label: 'Meditation & Sleep',
        icon: Brain,
        color: '#8b5cf6',
        bg: 'rgba(139,92,246,0.12)',
      },
      {
        path: '/challenges',
        label: 'Challenges',
        icon: Trophy,
        color: '#eab308',
        bg: 'rgba(234,179,8,0.12)',
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        path: '/notifications',
        label: 'Notifications',
        icon: Bell,
        color: '#ec4899',
        bg: 'rgba(236,72,153,0.12)',
      },
      {
        path: '/settings',
        label: 'Settings',
        icon: Settings,
        color: '#64748b',
        bg: 'rgba(100,116,139,0.12)',
      },
    ],
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const displayName =
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    'Admin';

  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <>
      <div
        className={`${styles.mobileBackdrop} ${isOpen ? styles.backdropOpen : ''}`}
        onClick={onClose}
      />

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>

        {/* ── Brand ── */}
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}>
            <Flame size={18} strokeWidth={2.5} color="#fff" />
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoName}>FitNova</span>
            <span className={styles.logoBadge}>ADMIN</span>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className={styles.divider} />

        {/* ── Navigation ── */}
        <nav className={styles.nav}>
          {navGroups.map((group, gi) => (
            <div key={gi} className={styles.navGroup}>
              <p className={styles.groupTitle}>{group.title}</p>
              <ul className={styles.navList}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path} className={styles.navItem}>
                      <NavLink
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) =>
                          isActive
                            ? `${styles.navLink} ${styles.active}`
                            : styles.navLink
                        }
                        style={{ '--item-color': item.color, '--item-bg': item.bg }}
                      >
                        <span
                          className={styles.iconWrap}
                          style={{ '--item-color': item.color, '--item-bg': item.bg }}
                        >
                          <Icon size={16} strokeWidth={2} />
                        </span>
                        <span className={styles.label}>{item.label}</span>
                        <ChevronRight size={13} className={styles.arrow} />
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* ── Footer: User Profile ── */}
        <div className={styles.sidebarFooter}>
          <div className={styles.divider} />
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              <span>{initials}</span>
              <span className={styles.onlineDot} />
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{displayName}</span>
              <span className={styles.userRole}>Administrator</span>
            </div>
            <button className={styles.logoutBtn} title="Sign out" onClick={handleLogout}>
              <LogOut size={15} strokeWidth={2} />
            </button>
          </div>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;
