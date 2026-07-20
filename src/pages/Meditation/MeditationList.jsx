import React, { useState } from 'react';
import { MdSearch, MdAdd, MdEdit, MdDelete, MdSelfImprovement } from 'react-icons/md';
import styles from '../../styles/tableLayout.module.css';

const MeditationList = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const mockSessions = [
    { id: 1, name: 'Morning Clarity', duration: '10 min', focus: 'Focus', audioUrl: 'morning.mp3' },
    { id: 2, name: 'Deep Relaxation', duration: '20 min', focus: 'Stress Relief', audioUrl: 'relax.mp3' },
    { id: 3, name: 'Sleep Preparation', duration: '15 min', focus: 'Sleep', audioUrl: 'sleep.mp3' },
  ];

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Meditation Audio</h2>
          <p>Manage guided meditation sessions.</p>
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <MdSearch className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search sessions..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn primary">
            <MdAdd /> Upload Audio
          </button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Session Name</th>
              <th>Duration</th>
              <th>Focus Area</th>
              <th>File</th>
              <th className={styles.actionsColumn}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockSessions.map(session => (
              <tr key={session.id}>
                <td>
                  <div className={styles.userInfo}>
                    <div className={styles.avatar} style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
                      <MdSelfImprovement />
                    </div>
                    <span className={styles.emailText}>{session.name}</span>
                  </div>
                </td>
                <td><span className={styles.dateText}>{session.duration}</span></td>
                <td><span className={styles.badge}>{session.focus}</span></td>
                <td><span className={styles.dateText}>{session.audioUrl}</span></td>
                <td className={styles.actionsColumn}>
                  <div className={styles.actions}>
                    <button className={styles.iconBtn} title="Edit"><MdEdit /></button>
                    <button className={styles.iconBtn} title="Delete"><MdDelete className={styles.dangerIcon} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MeditationList;
