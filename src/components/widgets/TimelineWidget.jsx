import React from 'react';
import styles from './TimelineWidget.module.css';

const TimelineWidget = ({ title, events }) => {
  return (
    <div className={`glass ${styles.container}`}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.timeline}>
        {events.map((event, index) => (
          <div key={index} className={styles.event}>
            <div className={styles.node} style={{ backgroundColor: event.color }}>
              {event.icon}
            </div>
            <div className={styles.content}>
              <p className={styles.eventTitle}>
                <span className={styles.user}>{event.user}</span> {event.action} <span className={styles.target}>{event.target}</span>
              </p>
              <span className={styles.time}>{event.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineWidget;
