import React, { useEffect, useState } from 'react';
import { X } from '@phosphor-icons/react';
import styles from './SlideOver.module.css';

const SlideOver = ({ isOpen, onClose, title, children }) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      // Delay unmounting to allow animation to complete
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Must match transition duration
      return () => clearTimeout(timer);
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`}>
      <div className={styles.backdrop} onClick={onClose} />
      
      <div className={`${styles.panel} ${isOpen ? styles.slideIn : ''}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={24} weight="bold" />
          </button>
        </div>
        
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default SlideOver;
