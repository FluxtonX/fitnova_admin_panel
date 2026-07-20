import React, { useState } from 'react';
import { MagnifyingGlass, Plus, PencilSimple, Trash, BellRinging } from '@phosphor-icons/react';
import SlideOver from '../../components/modals/SlideOver';
import NotificationForm from '../../components/forms/NotificationForm';
import styles from '../../styles/tableLayout.module.css';

const NotificationsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Mock Data
  const mockNotifications = [
    { id: 1, title: 'New Feature Alert', type: 'System', sent: '124,500', date: '2026-07-15' },
    { id: 2, title: 'Challenge Ending Soon', type: 'Engagement', sent: '1,200', date: '2026-07-14' },
  ];

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Push Notifications</h2>
          <p>Send and manage global push notifications.</p>
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <MagnifyingGlass size={20} weight="duotone" className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search notifications..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn primary" onClick={() => setIsDrawerOpen(true)}>
            <Plus size={18} weight="bold" /> Send Alert
          </button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Notification Title</th>
              <th>Type</th>
              <th>Sent To</th>
              <th>Date</th>
              <th className={styles.actionsColumn}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockNotifications.map(notif => (
              <tr key={notif.id}>
                <td>
                  <div className={styles.userInfo}>
                    <div className={styles.avatar} style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
                      <BellRinging size={20} weight="duotone" />
                    </div>
                    <span className={styles.emailText}>{notif.title}</span>
                  </div>
                </td>
                <td><span className={styles.dateText}>{notif.audience}</span></td>
                <td><span className={styles.badge}>{notif.type}</span></td>
                <td><span className={styles.dateText}>{notif.date}</span></td>
                <td className={styles.actionsColumn}>
                  <div className={styles.actions}>
                    <button className={styles.iconBtn} title="Delete"><Trash size={20} weight="duotone" className={styles.dangerIcon} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SlideOver 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        title="Send Push Notification"
      >
        <NotificationForm 
          onCancel={() => setIsDrawerOpen(false)}
          onSubmit={(data) => {
            console.log(data);
            setIsDrawerOpen(false);
          }}
        />
      </SlideOver>
    </div>
  );
};

export default NotificationsList;
