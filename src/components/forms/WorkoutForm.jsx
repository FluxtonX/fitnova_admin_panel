import React, { useState } from 'react';
import { FloppyDisk } from '@phosphor-icons/react';
import styles from './Form.module.css';

const WorkoutForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    duration: '',
    intensity: '',
    description: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting Workout:', formData);
    if (onSubmit) onSubmit(formData);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label className={styles.label}>Workout Title</label>
        <input 
          type="text" 
          name="title"
          className={styles.input} 
          placeholder="e.g. 30 Min Full Body HIIT" 
          value={formData.title}
          onChange={handleChange}
          required 
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Category</label>
        <select 
          name="category" 
          className={styles.select}
          value={formData.category}
          onChange={handleChange}
          required
        >
          <option value="">Select category...</option>
          <option value="Strength">Strength</option>
          <option value="Cardio">Cardio</option>
          <option value="HIIT">HIIT</option>
          <option value="Yoga">Yoga</option>
          <option value="Pilates">Pilates</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Duration (minutes)</label>
        <input 
          type="number" 
          name="duration"
          className={styles.input} 
          placeholder="e.g. 30" 
          value={formData.duration}
          onChange={handleChange}
          min="1"
          required 
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Intensity Level</label>
        <select 
          name="intensity" 
          className={styles.select}
          value={formData.intensity}
          onChange={handleChange}
          required
        >
          <option value="">Select intensity...</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Workout Description</label>
        <textarea 
          name="description"
          className={styles.textarea} 
          placeholder="Describe the workout flow and goals..."
          value={formData.description}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={styles.submitBtn}>
          <FloppyDisk size={20} weight="duotone" />
          Save Workout
        </button>
      </div>
    </form>
  );
};

export default WorkoutForm;
