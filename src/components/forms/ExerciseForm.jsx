import React, { useState, useEffect } from 'react';
import { FloppyDisk, Star, Info, ListNumbers, FilmStrip, WarningCircle } from '@phosphor-icons/react';
import CloudinaryUploader from '../exercises/CloudinaryUploader';
import styles from './Form.module.css';

const ExerciseForm = ({
  initialData = null,
  onSubmit = () => {},
  onCancel = () => {},
  isSubmitting = false,
  error = null,
}) => {
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'metrics' | 'details' | 'media'

  const [formData, setFormData] = useState({
    name: '',
    category: 'Full Body',
    primaryMuscle: 'Full Body',
    secondaryMuscle: '',
    difficulty: 'Beginner',
    equipment: 'None',
    description: '',
    instructions: '',
    benefits: '',
    tips: '',
    duration: 30,
    calories: 150,
    sets: 3,
    reps: 10,
    restTime: 30,
    status: 'Active',
    featured: false,
    thumbnail: null,
    video: null,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || 'Full Body',
        primaryMuscle: initialData.primaryMuscle || 'Full Body',
        secondaryMuscle: initialData.secondaryMuscle || '',
        difficulty: initialData.difficulty || 'Beginner',
        equipment: initialData.equipment || 'None',
        description: initialData.description || '',
        instructions: initialData.instructions || '',
        benefits: initialData.benefits || '',
        tips: initialData.tips || '',
        duration: initialData.duration ?? 30,
        calories: initialData.calories ?? 150,
        sets: initialData.sets ?? 3,
        reps: initialData.reps ?? 10,
        restTime: initialData.restTime ?? 30,
        status: initialData.status || 'Active',
        featured: Boolean(initialData.featured),
        thumbnail: initialData.thumbnail || null,
        video: initialData.video || null,
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>

      {/* Tab Navigation inside SlideOver Form */}
      <div className={styles.tabBar}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'basic' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('basic')}
        >
          <Info size={16} /> Basic Info
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'metrics' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          <ListNumbers size={16} /> Metrics
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'details' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <Info size={16} /> Instructions
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'media' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('media')}
        >
          <FilmStrip size={16} /> Media
        </button>
      </div>

      {error && (
        <div className={styles.errorAlert}>
          <WarningCircle size={18} weight="fill" />
          <span>{error}</span>
        </div>
      )}

      {/* ── TAB 1: BASIC INFO ── */}
      {activeTab === 'basic' && (
        <div className={styles.tabSection}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Exercise Name *</label>
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

          <div className={styles.rowTwo}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Category *</label>
              <select
                name="category"
                className={styles.select}
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="Legs">Legs</option>
                <option value="Chest">Chest</option>
                <option value="Back">Back</option>
                <option value="Arms">Arms</option>
                <option value="Shoulders">Shoulders</option>
                <option value="Core">Core</option>
                <option value="Full Body">Full Body</option>
                <option value="Flexibility">Flexibility</option>
                <option value="Cardio">Cardio</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Difficulty Level *</label>
              <select
                name="difficulty"
                className={styles.select}
                value={formData.difficulty}
                onChange={handleChange}
                required
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className={styles.rowTwo}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Primary Muscle *</label>
              <select
                name="primaryMuscle"
                className={styles.select}
                value={formData.primaryMuscle}
                onChange={handleChange}
                required
              >
                <option value="Full Body">Full Body</option>
                <option value="Quads">Quads</option>
                <option value="Hamstrings">Hamstrings</option>
                <option value="Chest">Chest</option>
                <option value="Lats">Lats / Upper Back</option>
                <option value="Biceps">Biceps</option>
                <option value="Triceps">Triceps</option>
                <option value="Shoulders">Shoulders / Delts</option>
                <option value="Abs">Abs / Core</option>
                <option value="Lower Back">Lower Back</option>
                <option value="Calves">Calves</option>
                <option value="Glutes">Glutes</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Secondary Muscle</label>
              <input
                type="text"
                name="secondaryMuscle"
                className={styles.input}
                placeholder="e.g. Glutes, Lower Back"
                value={formData.secondaryMuscle}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.rowTwo}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Equipment Required *</label>
              <select
                name="equipment"
                className={styles.select}
                value={formData.equipment}
                onChange={handleChange}
                required
              >
                <option value="None">None (Bodyweight)</option>
                <option value="Dumbbells">Dumbbells</option>
                <option value="Barbell">Barbell</option>
                <option value="Kettlebell">Kettlebell</option>
                <option value="Resistance Band">Resistance Band</option>
                <option value="Machine">Machine</option>
                <option value="Cable">Cable</option>
                <option value="Mat">Yoga Mat</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Status *</label>
              <select
                name="status"
                className={styles.select}
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
                className={styles.checkboxInput}
              />
              <span className={styles.checkboxText}>
                <Star size={16} weight={formData.featured ? 'fill' : 'regular'} color="#fbbf24" /> Mark as Featured Exercise
              </span>
            </label>
          </div>
        </div>
      )}

      {/* ── TAB 2: METRICS ── */}
      {activeTab === 'metrics' && (
        <div className={styles.tabSection}>
          <div className={styles.rowTwo}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Sets Count</label>
              <input
                type="number"
                name="sets"
                min="1"
                max="20"
                className={styles.input}
                value={formData.sets}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Reps per Set</label>
              <input
                type="number"
                name="reps"
                min="1"
                max="100"
                className={styles.input}
                value={formData.reps}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.rowTwo}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Rest Time (Seconds)</label>
              <input
                type="number"
                name="restTime"
                min="0"
                step="5"
                className={styles.input}
                value={formData.restTime}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Duration (Seconds)</label>
              <input
                type="number"
                name="duration"
                min="0"
                step="5"
                className={styles.input}
                value={formData.duration}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Estimated Calories Burned (kcal)</label>
            <input
              type="number"
              name="calories"
              min="0"
              className={styles.input}
              value={formData.calories}
              onChange={handleChange}
            />
          </div>
        </div>
      )}

      {/* ── TAB 3: DETAILS & INSTRUCTIONS ── */}
      {activeTab === 'details' && (
        <div className={styles.tabSection}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Summary Description</label>
            <textarea
              name="description"
              className={styles.textarea}
              placeholder="Brief summary of the exercise and key targets..."
              value={formData.description}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Step-by-Step Instructions</label>
            <textarea
              name="instructions"
              className={styles.textarea}
              placeholder="1. Stand upright with feet shoulder-width apart&#10;2. Lower your hips until thighs are parallel to floor&#10;3. Drive back up through your heels."
              value={formData.instructions}
              onChange={handleChange}
              rows={4}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Key Benefits</label>
            <textarea
              name="benefits"
              className={styles.textarea}
              placeholder="Builds leg strength, improves core stability, enhances mobility."
              value={formData.benefits}
              onChange={handleChange}
              rows={2}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Safety & Form Tips</label>
            <textarea
              name="tips"
              className={styles.textarea}
              placeholder="Keep chest lifted, do not let knees cave inwards."
              value={formData.tips}
              onChange={handleChange}
              rows={2}
            />
          </div>
        </div>
      )}

      {/* ── TAB 4: MEDIA UPLOADS (Cloudinary) ── */}
      {activeTab === 'media' && (
        <div className={styles.tabSection}>
          <CloudinaryUploader
            label="Exercise Video (Cloudinary MP4 / MOV)"
            accept="video/mp4,video/quicktime,video/webm"
            resourceType="video"
            maxSizeMB={100}
            value={formData.video}
            onChange={(metadata) => setFormData((prev) => ({ ...prev, video: metadata }))}
            helperText="Direct upload to Cloudinary. Supports MP4, MOV up to 100MB."
          />

          <CloudinaryUploader
            label="Thumbnail Image (Cloudinary Image)"
            accept="image/jpeg,image/png,image/webp"
            resourceType="image"
            maxSizeMB={15}
            value={formData.thumbnail}
            onChange={(metadata) => setFormData((prev) => ({ ...prev, thumbnail: metadata }))}
            helperText="Direct upload to Cloudinary. Supports JPG, PNG, WebP up to 15MB."
          />
        </div>
      )}

      {/* Action Footer */}
      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? (
            <span className={styles.spinner} />
          ) : (
            <>
              <FloppyDisk size={18} weight="bold" /> Save Exercise
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ExerciseForm;
