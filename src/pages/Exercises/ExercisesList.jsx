import React, { useState } from 'react';
import { MagnifyingGlass, Plus, PencilSimple, Trash, Barbell } from '@phosphor-icons/react';
import SlideOver from '../../components/modals/SlideOver';
import ExerciseForm from '../../components/forms/ExerciseForm';
import styles from './ExercisesList.module.css';

const filters = ['All', 'Legs', 'Chest', 'Back', 'Arms', 'Core'];

const ExercisesList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Mock Data mapped perfectly to the screenshot
  const mockExercises = [
    { id: 1, name: 'Barbell Squat', muscleGroup: 'Legs', difficulty: 'Intermediate', equipment: 'Barbell' },
    { id: 2, name: 'Bench Press', muscleGroup: 'Chest', difficulty: 'Intermediate', equipment: 'Barbell' },
    { id: 3, name: 'Pull-up', muscleGroup: 'Back', difficulty: 'Advanced', equipment: 'Bodyweight' },
    { id: 4, name: 'Dumbbell Curl', muscleGroup: 'Arms', difficulty: 'Beginner', equipment: 'Dumbbell' },
    { id: 5, name: 'Plank', muscleGroup: 'Core', difficulty: 'Beginner', equipment: 'None' },
  ];

  const filteredExercises = mockExercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'All' || ex.muscleGroup === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Exercises Library</h2>
          <p>Manage exercise library and workout elements.</p>
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <MagnifyingGlass size={20} weight="duotone" className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search exercises..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn primary" onClick={() => setIsDrawerOpen(true)}>
            <Plus size={18} weight="bold" /> Add Exercise
          </button>
        </div>
      </div>

      <div className={styles.filterChips}>
        <button 
          className={`${styles.chip} ${activeFilter === 'All' ? styles.active : ''}`}
          onClick={() => setActiveFilter('All')}
        >
          All • {mockExercises.length}
        </button>
        {filters.slice(1).map(filter => (
          <button 
            key={filter} 
            className={`${styles.chip} ${activeFilter === filter ? styles.active : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {filteredExercises.map(ex => (
          <div 
            key={ex.id} 
            className={styles.card} 
            data-muscle={ex.muscleGroup}
            data-difficulty={ex.difficulty}
          >
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <Barbell size={24} weight="duotone" />
              </div>
              <div className={styles.cardActions}>
                <button className={styles.actionBtn} title="Edit">
                  <PencilSimple size={18} />
                </button>
                <button className={`${styles.actionBtn} ${styles.danger}`} title="Delete">
                  <Trash size={18} />
                </button>
              </div>
            </div>

            <h3 className={styles.cardTitle}>{ex.name}</h3>
            <div>
              <span className={styles.badge}>{ex.muscleGroup}</span>
            </div>

            <div className={styles.divider} />

            <div className={styles.cardFooter}>
              <div className={styles.footerCol}>
                <span className={styles.footerLabel}>Equipment</span>
                <span className={styles.footerValue}>{ex.equipment}</span>
              </div>
              
              <div className={styles.footerCol} style={{ alignItems: 'flex-end' }}>
                <span className={styles.footerLabel}>{ex.difficulty}</span>
                {/* We use currentColor in CSS inherited from the card muscle group to tint the bars, or a generic color */}
                <div className={styles.difficultyBars} style={{ color: `var(--color-${
                  ex.muscleGroup === 'Legs' || ex.muscleGroup === 'Chest' ? 'danger' :
                  ex.muscleGroup === 'Back' ? 'primary' :
                  ex.muscleGroup === 'Arms' ? 'warning' : 'success'
                })`}}>
                  <div className={styles.difficultyBar}></div>
                  <div className={styles.difficultyBar}></div>
                  <div className={styles.difficultyBar}></div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Add New Exercise Card */}
        <div className={styles.addCard} onClick={() => setIsDrawerOpen(true)}>
          <div className={styles.addIconBox}>
            <Plus size={24} weight="bold" />
          </div>
          <span className={styles.addText}>Add new exercise</span>
        </div>
      </div>

      <SlideOver 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        title="Add New Exercise"
      >
        <ExerciseForm 
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

export default ExercisesList;
