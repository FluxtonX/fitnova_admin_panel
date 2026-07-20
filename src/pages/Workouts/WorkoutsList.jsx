import React, { useState } from 'react';
import { MagnifyingGlass, Plus, PencilSimple, Trash, PersonSimpleRun } from '@phosphor-icons/react';
import SlideOver from '../../components/modals/SlideOver';
import WorkoutForm from '../../components/forms/WorkoutForm';
import styles from '../../styles/tableLayout.module.css';

const WorkoutsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Mock Data
  const mockWorkouts = [
    { id: 1, name: 'Full Body HIIT', duration: '45 min', level: 'Advanced', author: 'Fitnova Team' },
    { id: 2, name: 'Upper Body Power', duration: '60 min', level: 'Intermediate', author: 'Coach Alex' },
    { id: 3, name: 'Core Crusher', duration: '15 min', level: 'Beginner', author: 'Fitnova Team' },
  ];

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Workout Programs</h2>
          <p>Create and manage workout routines.</p>
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <MagnifyingGlass size={20} weight="duotone" className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search workouts..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn primary" onClick={() => setIsDrawerOpen(true)}>
            <Plus size={18} weight="bold" /> Create Workout
          </button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Workout Title</th>
              <th>Duration</th>
              <th>Level</th>
              <th>Author</th>
              <th className={styles.actionsColumn}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockWorkouts.map(workout => (
              <tr key={workout.id}>
                <td>
                  <div className={styles.userInfo}>
                    <div className={styles.avatar} style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                      <PersonSimpleRun size={20} weight="duotone" />
                    </div>
                    <span className={styles.emailText}>{workout.name}</span>
                  </div>
                </td>
                <td><span className={styles.dateText}>{workout.duration}</span></td>
                <td><span className={styles.badge}>{workout.level}</span></td>
                <td><span className={styles.dateText}>{workout.author}</span></td>
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
        title="Create New Workout"
      >
        <WorkoutForm 
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

export default WorkoutsList;
