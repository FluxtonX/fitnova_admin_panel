import React, { useState, useEffect } from 'react';
import {
  FloppyDisk,
  Star,
  WarningCircle,
  Lightning,
} from '@phosphor-icons/react';
import { CATEGORY_IMAGES } from '../../services/firebase/challengeService';
import styles from './Form.module.css';

const CHALLENGE_TYPES = [
  { value: 'complete_workouts', label: '🏋️‍♂️ Workout Completion (Workouts)', unit: 'workouts' },
  { value: 'build_streak', label: '🏃‍♂️ Step Streak (Daily Steps)', unit: 'steps' },
  { value: 'burn_calories', label: '🔥 Calorie Burn (Burn Calories)', unit: 'calories' },
  { value: 'meditation_goal', label: '🧘‍♀️ Meditation & Mindfulness', unit: 'minutes' },
  { value: 'water', label: '💧 Water Hydration Goal', unit: 'glasses' },
  { value: 'weight_loss', label: '⚖️ Weight Transformation (Weight Loss)', unit: 'kg' },
  { value: 'strength_goal', label: '💪 Strength & Muscle Building', unit: 'sessions' },
  { value: 'team_challenge', label: '👥 Team & Group Challenge', unit: 'workouts' },
  { value: 'custom', label: '⚡ Custom Goal Challenge', unit: 'units' },
];

const PRESET_TEMPLATES = [
  {
    label: '🏋️‍♂️ 28-Day Workout Blitz',
    title: '28 Days Workout Blitz',
    type: 'complete_workouts',
    targetValue: 28,
    unit: 'workouts',
    durationDays: 28,
    rewardPoints: 500,
    goal: 'Complete 28 guided workouts',
    description: 'Build consistency by completing a workout every day for 28 days.',
  },
  {
    label: '🏃‍♂️ 10K Daily Step Streak',
    title: '10K Daily Step Streak',
    type: 'build_streak',
    targetValue: 10000,
    unit: 'steps',
    durationDays: 30,
    rewardPoints: 600,
    goal: 'Reach 10,000 steps daily for 30 consecutive days',
    description: 'Keep your momentum high with daily walking and step tracking.',
  },
  {
    label: '🔥 500 Calorie Burner',
    title: '500 kcal Calorie Shred',
    type: 'burn_calories',
    targetValue: 500,
    unit: 'calories',
    durationDays: 14,
    rewardPoints: 400,
    goal: 'Burn 500 kcal daily through active workouts',
    description: 'High intensity burn challenge designed for fat loss.',
  },
  {
    label: '🧘‍♀️ 15 Min Meditation',
    title: 'Mindfulness & Meditation',
    type: 'meditation_goal',
    targetValue: 15,
    unit: 'minutes',
    durationDays: 21,
    rewardPoints: 350,
    goal: 'Complete 15 minutes of daily meditation sessions',
    description: 'Reduce stress, improve focus, and relax your mind.',
  },
  {
    label: '💧 Hydration Hero',
    title: 'Daily Water Hydration',
    type: 'water',
    targetValue: 8,
    unit: 'glasses',
    durationDays: 7,
    rewardPoints: 200,
    goal: 'Drink 8 glasses of fresh water daily for a week',
    description: 'Stay properly hydrated to boost energy and recovery.',
  },
];

const ChallengeForm = ({
  initialData = null,
  onSubmit = () => {},
  onCancel = () => {},
  isSubmitting = false,
  error = null,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'complete_workouts',
    targetValue: 28,
    unit: 'workouts',
    durationDays: 28,
    rewardPoints: 500,
    badgeName: '',
    description: '',
    imageUrl: CATEGORY_IMAGES.complete_workouts,
    goal: '',
    rules: '',
    status: 'active',
    challengeMode: 'community',
    isFeatured: false,
  });

  useEffect(() => {
    if (initialData) {
      const typeKey = initialData.type || initialData.category || 'complete_workouts';
      setFormData({
        title: initialData.title || '',
        type: typeKey,
        targetValue: initialData.targetValue ?? 28,
        unit: initialData.unit || initialData.targetUnit || 'workouts',
        durationDays: initialData.durationDays ?? 28,
        rewardPoints: initialData.rewardPoints ?? 500,
        badgeName: initialData.badgeName || '',
        description: initialData.description || '',
        imageUrl: initialData.imageUrl || CATEGORY_IMAGES[typeKey] || CATEGORY_IMAGES.complete_workouts,
        goal: initialData.goal || '',
        rules: Array.isArray(initialData.rules) ? initialData.rules.join('\n') : (initialData.rules || ''),
        status: initialData.status || 'active',
        challengeMode: initialData.challengeMode || 'community',
        isFeatured: Boolean(initialData.isFeatured || initialData.featured),
      });
    }
  }, [initialData]);

  const applyPreset = (preset) => {
    const defaultImg = CATEGORY_IMAGES[preset.type] || CATEGORY_IMAGES.complete_workouts;
    setFormData((prev) => ({
      ...prev,
      title: preset.title,
      type: preset.type,
      targetValue: preset.targetValue,
      unit: preset.unit,
      durationDays: preset.durationDays,
      rewardPoints: preset.rewardPoints,
      goal: preset.goal,
      description: preset.description,
      imageUrl: defaultImg,
      badgeName: `${preset.title} Badge`,
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'type') {
      const selected = CHALLENGE_TYPES.find((t) => t.value === value);
      const defaultImg = CATEGORY_IMAGES[value] || CATEGORY_IMAGES.complete_workouts;
      setFormData((prev) => ({
        ...prev,
        type: value,
        unit: selected ? selected.unit : prev.unit,
        imageUrl: defaultImg,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const typeKey = formData.type || 'complete_workouts';
    const defaultImg = CATEGORY_IMAGES[typeKey] || CATEGORY_IMAGES.complete_workouts;

    const finalData = {
      ...formData,
      imageUrl: formData.imageUrl.trim() || defaultImg,
      badgeName: formData.badgeName.trim() || `${formData.title.trim()} Badge`,
      goal: formData.goal.trim() || `Complete ${formData.targetValue} ${formData.unit}`,
    };
    onSubmit(finalData);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && (
        <div className={styles.errorAlert}>
          <WarningCircle size={18} weight="fill" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Template Presets */}
      <div className={styles.presetsSection}>
        <span className={styles.presetsLabel}>
          <Lightning size={14} weight="fill" color="#f59e0b" /> Quick Template Presets:
        </span>
        <div className={styles.presetsRow}>
          {PRESET_TEMPLATES.map((tmpl, i) => (
            <button
              key={i}
              type="button"
              className={styles.presetBtn}
              onClick={() => applyPreset(tmpl)}
            >
              {tmpl.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Challenge Title *</label>
        <input
          type="text"
          name="title"
          className={styles.input}
          placeholder="e.g. 28 Days Workout Blitz"
          value={formData.title}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.rowTwo}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Challenge Category / Type *</label>
          <select
            name="type"
            className={styles.select}
            value={formData.type}
            onChange={handleChange}
            required
          >
            {CHALLENGE_TYPES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Challenge Mode *</label>
          <select
            name="challengeMode"
            className={styles.select}
            value={formData.challengeMode}
            onChange={handleChange}
            required
          >
            <option value="community">Public Community Challenge</option>
            <option value="solo">Solo (Private Challenge)</option>
            <option value="friend">Friends Only Challenge</option>
            <option value="team">Team Invite Challenge</option>
          </select>
        </div>
      </div>

      <div className={styles.rowTwo}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Target Value *</label>
          <input
            type="number"
            name="targetValue"
            min="1"
            className={styles.input}
            placeholder="e.g. 28"
            value={formData.targetValue}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Target Unit *</label>
          <input
            type="text"
            name="unit"
            className={styles.input}
            placeholder="e.g. workouts, steps, calories, kg"
            value={formData.unit}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className={styles.rowTwo}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Duration (Days) *</label>
          <input
            type="number"
            name="durationDays"
            min="1"
            max="365"
            className={styles.input}
            placeholder="e.g. 28"
            value={formData.durationDays}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Reward Points *</label>
          <input
            type="number"
            name="rewardPoints"
            min="0"
            className={styles.input}
            placeholder="e.g. 500"
            value={formData.rewardPoints}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>
          Cover Image Banner URL (Auto-set by Category or Custom)
        </label>
        <input
          type="text"
          name="imageUrl"
          className={styles.input}
          placeholder="https://images.unsplash.com/..."
          value={formData.imageUrl}
          onChange={handleChange}
        />
      </div>

      <div className={styles.rowTwo}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Badge Name</label>
          <input
            type="text"
            name="badgeName"
            className={styles.input}
            placeholder="e.g. Master Workout Badge"
            value={formData.badgeName}
            onChange={handleChange}
          />
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
            <option value="active">Active</option>
            <option value="ended">Ended</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Description</label>
        <textarea
          name="description"
          className={styles.textarea}
          placeholder="Brief description of what this challenge is about..."
          value={formData.description}
          onChange={handleChange}
          rows={3}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Goal Statement</label>
        <input
          type="text"
          name="goal"
          className={styles.input}
          placeholder="e.g. Complete 28 guided workouts in 28 days."
          value={formData.goal}
          onChange={handleChange}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Rules (One rule per line)</label>
        <textarea
          name="rules"
          className={styles.textarea}
          placeholder="1. Log daily workouts from Fitnova player&#10;2. Completing today's video increases streak&#10;3. Finish target to unlock badge."
          value={formData.rules}
          onChange={handleChange}
          rows={3}
        />
      </div>

      <div className={styles.checkboxGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            name="isFeatured"
            checked={formData.isFeatured}
            onChange={handleChange}
            className={styles.checkboxInput}
          />
          <span className={styles.checkboxText}>
            <Star size={16} weight={formData.isFeatured ? 'fill' : 'regular'} color="#fbbf24" /> Feature this challenge on App Home
          </span>
        </label>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? (
            <span className={styles.spinner} />
          ) : (
            <>
              <FloppyDisk size={18} weight="bold" /> Save Challenge
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ChallengeForm;
