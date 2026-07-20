import React from 'react';
import styles from './Button.module.css';

const Button = ({ 
  children, 
  variant = 'primary', // primary, secondary, outline, danger
  size = 'md', // sm, md, lg
  fullWidth = false,
  disabled = false,
  icon,
  onClick,
  type = 'button',
  ...props 
}) => {
  return (
    <button
      type={type}
      className={`
        ${styles.btn} 
        ${styles[variant]} 
        ${styles[size]} 
        ${fullWidth ? styles.fullWidth : ''}
      `}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
