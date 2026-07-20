import React, { useState } from 'react';
import { MdSearch, MdAdd, MdEdit, MdDelete, MdBedtime } from 'react-icons/md';
import styles from '../../styles/tableLayout.module.css';

const SleepList = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const mockSleepAudio = [
    { id: 1, name: 'Rain Sounds', category: 'Nature', duration: '60 min' },
    { id: 2, name: 'White Noise', category: 'Ambience', duration: 'Infinite' },
    { id: 3, name: 'Ocean Waves', category: 'Nature', duration: '45 min' },
  ];

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Sleep Sounds</h2>
          <p>Manage sleep aid audio and ambient sounds.</p>
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <MdSearch className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search audio..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn primary">
            <MdAdd /> Upload Sound
          </button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Track Name</th>
              <th>Category</th>
              <th>Duration</th>
              <th className={styles.actionsColumn}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockSleepAudio.map(track => (
              <tr key={track.id}>
                <td>
                  <div className={styles.userInfo}>
                    <div className={styles.avatar} style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                      <MdBedtime />
                    </div>
                    <span className={styles.emailText}>{track.name}</span>
                  </div>
                </td>
                <td><span className={styles.badge}>{track.category}</span></td>
                <td><span className={styles.dateText}>{track.duration}</span></td>
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

export default SleepList;
