import React, { useState } from 'react';
import { FloppyDisk } from '@phosphor-icons/react';
import styles from './Form.module.css';

const ChallengeForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    metric: '',
    target: '',
    startDate: '',
    endDate: '',
    points: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting Challenge:', formData);
    if (onSubmit) onSubmit(formData);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label className={styles.label}>Challenge Title</label>
        <input 
          type="text" 
          name="title"
          className={styles.input} 
          placeholder="e.g. 10k Steps a Day" 
          value={formData.title}
          onChange={handleChange}
          required 
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Goal Metric</label>
        <select 
          name="metric" 
          className={styles.select}
          value={formData.metric}
          onChange={handleChange}
          required
        >
          <option value="">Select metric...</option>
          <option value="Steps">Steps</option>
          <option value="Workouts">Workouts Completed</option>
          <option value="Calories">Calories Burned</option>
          <option value="Meditation">Meditation Minutes</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Target Value</label>
        <input 
          type="number" 
          name="target"
          className={styles.input} 
          placeholder="e.g. 10000" 
          value={formData.target}
          onChange={handleChange}
          required 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Start Date</label>
          <input 
            type="date" 
            name="startDate"
            className={styles.input} 
            value={formData.startDate}
            onChange={handleChange}
            required 
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>End Date</label>
          <input 
            type="date" 
            name="endDate"
            className={styles.input} 
            value={formData.endDate}
            onChange={handleChange}
            required 
          />
        </div>
      </div>
      
      <div className={styles.formGroup}>
        <label className={styles.label}>Reward Points (XP)</label>
        <input 
          type="number" 
          name="points"
          className={styles.input} 
          placeholder="e.g. 500" 
          value={formData.points}
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
          Save Challenge
        </button>
      </div>
    </form>
  );
};

export default ChallengeForm;
