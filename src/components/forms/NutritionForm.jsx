import React, { useState } from 'react';
import { FloppyDisk } from '@phosphor-icons/react';
import styles from './Form.module.css';

const NutritionForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    dietType: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    instructions: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting Recipe:', formData);
    if (onSubmit) onSubmit(formData);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label className={styles.label}>Recipe Name</label>
        <input 
          type="text" 
          name="title"
          className={styles.input} 
          placeholder="e.g. Grilled Chicken Salad" 
          value={formData.title}
          onChange={handleChange}
          required 
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Diet Type</label>
        <select 
          name="dietType" 
          className={styles.select}
          value={formData.dietType}
          onChange={handleChange}
          required
        >
          <option value="">Select diet type...</option>
          <option value="Any">Any</option>
          <option value="Vegan">Vegan</option>
          <option value="Vegetarian">Vegetarian</option>
          <option value="Keto">Keto</option>
          <option value="Paleo">Paleo</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Calories (kcal)</label>
          <input 
            type="number" 
            name="calories"
            className={styles.input} 
            value={formData.calories}
            onChange={handleChange}
            required 
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Protein (g)</label>
          <input 
            type="number" 
            name="protein"
            className={styles.input} 
            value={formData.protein}
            onChange={handleChange}
            required 
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Carbs (g)</label>
          <input 
            type="number" 
            name="carbs"
            className={styles.input} 
            value={formData.carbs}
            onChange={handleChange}
            required 
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Fat (g)</label>
          <input 
            type="number" 
            name="fat"
            className={styles.input} 
            value={formData.fat}
            onChange={handleChange}
            required 
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Instructions</label>
        <textarea 
          name="instructions"
          className={styles.textarea} 
          placeholder="Recipe steps..."
          value={formData.instructions}
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
          Save Recipe
        </button>
      </div>
    </form>
  );
};

export default NutritionForm;
