import React from 'react';
import styles from './LeaderboardWidget.module.css';

const LeaderboardWidget = ({ title, items, metric }) => {
  return (
    <div className={`glass ${styles.container}`}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.list}>
        {items.map((item, index) => (
          <div key={index} className={styles.item}>
            <div className={styles.rank}>{index + 1}</div>
            <div className={styles.info}>
              <span className={styles.name}>{item.name}</span>
              <span className={styles.subtitle}>{item.subtitle}</span>
            </div>
            <div className={styles.score}>
              <span className={styles.value}>{item.score}</span>
              <span className={styles.metric}>{metric}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardWidget;
