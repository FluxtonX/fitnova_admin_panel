import React from 'react';
import styles from './StatCard.module.css';

const StatCard = ({ title, value, icon, trend, trendLabel }) => {
  const isPositive = trend && trend >= 0;

  return (
    <div className={`glass ${styles.card} animate-slide-up`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.icon}>{icon}</div>
      </div>
      <div className={styles.content}>
        <div className={styles.value}>{value}</div>
        {trend !== undefined && (
          <div className={styles.trend}>
            <span className={`${styles.trendValue} ${isPositive ? styles.positive : styles.negative}`}>
              {isPositive ? '+' : ''}{trend}%
            </span>
            <span className={styles.trendLabel}>{trendLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
