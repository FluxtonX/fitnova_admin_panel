import React from 'react';
import styles from './Settings.module.css';

const Settings = () => {
  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Platform Settings</h2>
          <p>Manage application preferences and integrations.</p>
        </div>
      </div>

      <div className={styles.settingsGrid}>
        <div className={`glass ${styles.settingsCard}`}>
          <h3>General Configuration</h3>
          <div className={styles.formGroup}>
            <label>Platform Name</label>
            <input type="text" className={styles.input} defaultValue="Fitnova App" />
          </div>
          <div className={styles.formGroup}>
            <label>Support Email</label>
            <input type="email" className={styles.input} defaultValue="support@fitnova.com" />
          </div>
          <button className="btn primary">Save Changes</button>
        </div>

        <div className={`glass ${styles.settingsCard}`}>
          <h3>Firebase Integration</h3>
          <div className={styles.formGroup}>
            <label>Project ID</label>
            <input type="text" className={styles.input} defaultValue="fitnova-admin-prod" disabled />
          </div>
          <div className={styles.formGroup}>
            <label>Auth Domain</label>
            <input type="text" className={styles.input} defaultValue="fitnova-admin-prod.firebaseapp.com" disabled />
          </div>
          <p className={styles.helpText}>To change Firebase configs, edit your .env file and restart the server.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
