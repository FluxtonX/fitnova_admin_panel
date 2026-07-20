import React, { useState } from 'react';
import { PaperPlaneRight } from '@phosphor-icons/react';
import styles from './Form.module.css';

const NotificationForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target: '',
    type: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Sending Notification:', formData);
    if (onSubmit) onSubmit(formData);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label className={styles.label}>Notification Title</label>
        <input 
          type="text" 
          name="title"
          className={styles.input} 
          placeholder="e.g. Special Weekend Challenge!" 
          value={formData.title}
          onChange={handleChange}
          required 
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Message Body</label>
        <textarea 
          name="message"
          className={styles.textarea} 
          placeholder="Enter the push notification message..."
          value={formData.message}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Target Audience</label>
        <select 
          name="target" 
          className={styles.select}
          value={formData.target}
          onChange={handleChange}
          required
        >
          <option value="">Select audience...</option>
          <option value="All">All Users</option>
          <option value="Premium">Premium Subscribers</option>
          <option value="Free">Free Users</option>
          <option value="Inactive">Inactive Users (30+ days)</option>
        </select>
      </div>
      
      <div className={styles.formGroup}>
        <label className={styles.label}>Notification Type</label>
        <select 
          name="type" 
          className={styles.select}
          value={formData.type}
          onChange={handleChange}
          required
        >
          <option value="">Select type...</option>
          <option value="Marketing">Marketing / Promo</option>
          <option value="System">System Alert</option>
          <option value="Challenge">Challenge Update</option>
        </select>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={styles.submitBtn}>
          <PaperPlaneRight size={20} weight="duotone" />
          Send Now
        </button>
      </div>
    </form>
  );
};

export default NotificationForm;
