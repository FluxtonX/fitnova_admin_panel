import React, { useState } from 'react';
import { FloppyDisk } from '@phosphor-icons/react';
import styles from './Form.module.css';

const SleepForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    duration: '',
    description: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting Sleep Audio:', formData);
    if (onSubmit) onSubmit(formData);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label className={styles.label}>Audio Title</label>
        <input 
          type="text" 
          name="title"
          className={styles.input} 
          placeholder="e.g. Deep Forest Rain" 
          value={formData.title}
          onChange={handleChange}
          required 
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Audio Type</label>
        <select 
          name="type" 
          className={styles.select}
          value={formData.type}
          onChange={handleChange}
          required
        >
          <option value="">Select type...</option>
          <option value="Soundscape">Soundscape</option>
          <option value="White Noise">White Noise</option>
          <option value="Story">Sleep Story</option>
          <option value="Music">Ambient Music</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Duration (minutes)</label>
        <input 
          type="number" 
          name="duration"
          className={styles.input} 
          placeholder="e.g. 60" 
          value={formData.duration}
          onChange={handleChange}
          min="1"
          required 
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Description</label>
        <textarea 
          name="description"
          className={styles.textarea} 
          placeholder="Describe the audio track..."
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
          Save Audio
        </button>
      </div>
    </form>
  );
};

export default SleepForm;
