import React, { useState } from 'react';
import { FloppyDisk } from '@phosphor-icons/react';
import styles from './Form.module.css';

const MeditationForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    instructor: '',
    duration: '',
    category: '',
    description: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting Meditation:', formData);
    if (onSubmit) onSubmit(formData);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label className={styles.label}>Session Title</label>
        <input 
          type="text" 
          name="title"
          className={styles.input} 
          placeholder="e.g. Morning Clarity" 
          value={formData.title}
          onChange={handleChange}
          required 
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Instructor</label>
        <input 
          type="text" 
          name="instructor"
          className={styles.input} 
          placeholder="e.g. Sarah Jenkins" 
          value={formData.instructor}
          onChange={handleChange}
          required 
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Duration (minutes)</label>
        <input 
          type="number" 
          name="duration"
          className={styles.input} 
          placeholder="e.g. 15" 
          value={formData.duration}
          onChange={handleChange}
          min="1"
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
          <option value="Focus">Focus</option>
          <option value="Anxiety">Anxiety</option>
          <option value="Sleep">Sleep</option>
          <option value="Beginners">Beginners</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Description</label>
        <textarea 
          name="description"
          className={styles.textarea} 
          placeholder="Describe the meditation..."
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
          Save Meditation
        </button>
      </div>
    </form>
  );
};

export default MeditationForm;
