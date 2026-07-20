import React from 'react';
import { Sun, CalendarBlank } from '@phosphor-icons/react';
import styles from './TopBanner.module.css';

const TopBanner = ({ user }) => {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className={`${styles.banner} animate-fade-in`}>
      <div className={styles.left}>
        <h1 className={styles.greeting}>
          Good morning, <span>{user?.email?.split('@')[0] || 'Admin'}</span> 👋
        </h1>
        <p className={styles.motivation}>
          "Success usually comes to those who are too busy to be looking for it."
        </p>
      </div>

      <div className={styles.right}>
        <div className={styles.infoBadge}>
          <CalendarBlank size={20} weight="duotone" className={styles.icon} />
          <span>{today}</span>
        </div>
        <div className={styles.infoBadge}>
          <Sun size={20} weight="duotone" className={styles.icon} />
          <span>72°F, Sunny</span>
        </div>
      </div>
    </div>
  );
};

export default TopBanner;
