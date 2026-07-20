import React, { useState } from 'react';
import { MagnifyingGlass, Plus, PencilSimple, Trash, Trophy } from '@phosphor-icons/react';
import SlideOver from '../../components/modals/SlideOver';
import ChallengeForm from '../../components/forms/ChallengeForm';
import styles from '../../styles/tableLayout.module.css';

const ChallengesList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const mockChallenges = [
    { id: 1, name: '30 Day Abs', type: 'Workout', participants: 1240, status: 'Active' },
    { id: 2, name: 'Vegan Week', type: 'Nutrition', participants: 850, status: 'Active' },
    { id: 3, name: '10k Steps Daily', type: 'Activity', participants: 3200, status: 'Completed' },
  ];

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Community Challenges</h2>
          <p>Create and monitor user challenges.</p>
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <MagnifyingGlass size={20} weight="duotone" className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search challenges..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn primary" onClick={() => setIsDrawerOpen(true)}>
            <Plus size={18} weight="bold" /> Create Challenge
          </button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Challenge Name</th>
              <th>Type</th>
              <th>Participants</th>
              <th>Status</th>
              <th className={styles.actionsColumn}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockChallenges.map(challenge => (
              <tr key={challenge.id}>
                <td>
                  <div className={styles.userInfo}>
                    <div className={styles.avatar} style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
                      <Trophy size={20} weight="duotone" />
                    </div>
                    <span className={styles.emailText}>{challenge.name}</span>
                  </div>
                </td>
                <td><span className={styles.dateText}>{challenge.participants}</span></td>
                <td><span className={styles.badge}>{challenge.status}</span></td>
                <td><span className={styles.dateText}>{challenge.endDate}</span></td>
                <td className={styles.actionsColumn}>
                  <div className={styles.actions}>
                    <button className={styles.iconBtn} title="Edit"><PencilSimple size={20} weight="duotone" /></button>
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
        title="Create New Challenge"
      >
        <ChallengeForm 
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

export default ChallengesList;
