import React, { useState } from 'react';
import { FloppyDisk } from '@phosphor-icons/react';
import styles from './Form.module.css';

const ExerciseForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    muscleGroup: '',
    difficulty: '',
    equipment: '',
    description: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting Exercise:', formData);
    if (onSubmit) onSubmit(formData);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label className={styles.label}>Exercise Name</label>
        <input 
          type="text" 
          name="name"
          className={styles.input} 
          placeholder="e.g. Barbell Squat" 
          value={formData.name}
          onChange={handleChange}
          required 
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Target Muscle Group</label>
        <select 
          name="muscleGroup" 
          className={styles.select}
          value={formData.muscleGroup}
          onChange={handleChange}
          required
        >
          <option value="">Select a muscle group...</option>
          <option value="Chest">Chest</option>
          <option value="Back">Back</option>
          <option value="Legs">Legs</option>
          <option value="Arms">Arms</option>
          <option value="Shoulders">Shoulders</option>
          <option value="Core">Core</option>
          <option value="Full Body">Full Body</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Difficulty Level</label>
        <select 
          name="difficulty" 
          className={styles.select}
          value={formData.difficulty}
          onChange={handleChange}
          required
        >
          <option value="">Select difficulty...</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Equipment Required</label>
        <select 
          name="equipment" 
          className={styles.select}
          value={formData.equipment}
          onChange={handleChange}
          required
        >
          <option value="">Select equipment...</option>
          <option value="None">None (Bodyweight)</option>
          <option value="Dumbbells">Dumbbells</option>
          <option value="Barbell">Barbell</option>
          <option value="Kettlebell">Kettlebell</option>
          <option value="Resistance Band">Resistance Band</option>
          <option value="Machine">Machine</option>
          <option value="Cable">Cable</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Description & Instructions</label>
        <textarea 
          name="description"
          className={styles.textarea} 
          placeholder="Explain how to perform this exercise correctly..."
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
          Save Exercise
        </button>
      </div>
    </form>
  );
};

export default ExerciseForm;
