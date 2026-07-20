import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, PersonSimpleRun, Barbell, Megaphone } from '@phosphor-icons/react';
import styles from './QuickActions.module.css';

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    { label: 'Add New User', icon: <UserPlus size={24} weight="duotone" />, path: '/users', colorClass: styles.indigo },
    { label: 'Create Workout', icon: <PersonSimpleRun size={24} weight="duotone" />, path: '/workouts', colorClass: styles.emerald },
    { label: 'Add Exercise', icon: <Barbell size={24} weight="duotone" />, path: '/exercises', colorClass: styles.amber },
    { label: 'Send Alert', icon: <Megaphone size={24} weight="duotone" />, path: '/notifications', colorClass: styles.rose }
  ];

  return (
    <div className={`glass ${styles.container}`}>
      <h3 className={styles.title}>Quick Actions</h3>
      <div className={styles.grid}>
        {actions.map((action, i) => (
          <button 
            key={i} 
            className={styles.actionCard} 
            onClick={() => navigate(action.path)}
          >
            <div className={`${styles.iconWrapper} ${action.colorClass}`}>
              {action.icon}
            </div>
            <span className={styles.label}>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
