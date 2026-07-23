import React, { useState, useEffect } from 'react';
import {
  FloppyDisk,
  Star,
  WarningCircle,
  Lightning,
  MusicNotes,
  CloudArrowUp,
  CheckCircle,
  Sparkle,
  Image,
} from '@phosphor-icons/react';
import {
  SLEEP_CATEGORIES,
  CATEGORY_SOUND_IMAGES,
} from '../../services/firebase/sleepService';
import { uploadToCloudinary } from '../../services/cloudinary/cloudinaryService';
import styles from './Form.module.css';

const SOUND_PRESETS = [
  {
    label: '🌧️ Heavy Rain & Thunder (60m)',
    title: 'Heavy Rain & Thunderstorm',
    category: 'nature',
    duration: 60,
    description: 'Calming rain sound with subtle distant thunderstorm rolling for deep sleep.',
    tags: 'rain, thunderstorm, nature, sleep',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=rain-and-thunder-nature-sounds-7803.mp3',
  },
  {
    label: '🌊 Pacific Ocean Waves (45m)',
    title: 'Pacific Shore Ocean Waves',
    category: 'ocean',
    duration: 45,
    description: 'Rhythmic ocean waves breaking softly against a warm sandy shore.',
    tags: 'ocean, waves, beach, relaxation',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_884478149e.mp3?filename=ocean-waves-ambient-1108.mp3',
  },
  {
    label: '📻 Deep Pink Noise (120m)',
    title: 'Deep White & Pink Noise',
    category: 'white_noise',
    duration: 120,
    description: 'Smooth pink noise frequency tuned to mask ambient household noise.',
    tags: 'white noise, pink noise, deep sleep, focus',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8ad0b25.mp3?filename=white-noise-relaxing-10255.mp3',
  },
  {
    label: '🧠 432Hz Delta Waves (30m)',
    title: '432Hz Binaural Delta Waves',
    category: 'binaural',
    duration: 30,
    description: 'Low-frequency binaural delta tones engineered for rapid REM sleep initiation.',
    tags: 'binaural, delta, 432hz, rem sleep',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/18/audio_31b0b57112.mp3?filename=binaural-beats-432hz-12401.mp3',
  },
];

const SleepForm = ({
  initialData = null,
  onSubmit = () => {},
  onCancel = () => {},
  isSubmitting = false,
  error = null,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'nature',
    duration: 60,
    audioUrl: '',
    publicId: null,
    imageUrl: CATEGORY_SOUND_IMAGES.nature,
    description: '',
    tags: 'sleep, relax',
    isFeatured: false,
    status: 'active',
  });

  // Upload state
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    if (initialData) {
      const cat = initialData.category || 'nature';
      setFormData({
        title: initialData.title || '',
        category: cat,
        duration: initialData.duration ?? 60,
        audioUrl: initialData.audioUrl || '',
        publicId: initialData.publicId || null,
        imageUrl: initialData.imageUrl || CATEGORY_SOUND_IMAGES[cat] || CATEGORY_SOUND_IMAGES.nature,
        description: initialData.description || '',
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : (initialData.tags || ''),
        isFeatured: Boolean(initialData.isFeatured),
        status: initialData.status || 'active',
      });
    }
  }, [initialData]);

  const applyPreset = (preset) => {
    const defaultImg = CATEGORY_SOUND_IMAGES[preset.category] || CATEGORY_SOUND_IMAGES.nature;
    setFormData((prev) => ({
      ...prev,
      title: preset.title,
      category: preset.category,
      duration: preset.duration,
      description: preset.description,
      tags: preset.tags,
      audioUrl: preset.audioUrl,
      imageUrl: defaultImg,
      publicId: null,
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'category') {
      const defaultImg = CATEGORY_SOUND_IMAGES[value] || CATEGORY_SOUND_IMAGES.nature;
      setFormData((prev) => ({
        ...prev,
        category: value,
        imageUrl: defaultImg,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  // Handle Cloudinary Audio Upload to fitnova/exercises/audio
  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAudio(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Direct Cloudinary upload to folder fitnova/exercises/audio
      const result = await uploadToCloudinary(
        file,
        'video', // Audio files use video resource endpoint in Cloudinary
        (progress) => setUploadProgress(progress),
        'fitnova/exercises/audio'
      );

      setFormData((prev) => ({
        ...prev,
        audioUrl: result.secure_url,
        publicId: result.public_id,
        duration: result.duration ? Math.round(result.duration / 60) || prev.duration : prev.duration,
      }));
    } catch (err) {
      console.error('Audio upload error:', err);
      setUploadError(err.message || 'Failed to upload audio to Cloudinary.');
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.audioUrl) {
      setUploadError('Please upload an audio file or provide a valid Audio URL.');
      return;
    }

    const cat = formData.category || 'nature';
    const defaultImg = CATEGORY_SOUND_IMAGES[cat] || CATEGORY_SOUND_IMAGES.nature;

    const finalData = {
      ...formData,
      imageUrl: formData.imageUrl.trim() || defaultImg,
    };
    onSubmit(finalData);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {(error || uploadError) && (
        <div className={styles.errorAlert}>
          <WarningCircle size={18} weight="fill" />
          <span>{error || uploadError}</span>
        </div>
      )}

      {/* Quick Ambient Presets */}
      <div className={styles.presetsSection}>
        <span className={styles.presetsLabel}>
          <Lightning size={14} weight="fill" color="#f59e0b" /> Quick Sound Presets:
        </span>
        <div className={styles.presetsRow}>
          {SOUND_PRESETS.map((preset, i) => (
            <button
              key={i}
              type="button"
              className={styles.presetBtn}
              onClick={() => applyPreset(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Track Title *</label>
        <input
          type="text"
          name="title"
          className={styles.input}
          placeholder="e.g. Heavy Rain & Thunderstorm"
          value={formData.title}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.rowTwo}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Sound Category *</label>
          <select
            name="category"
            className={styles.select}
            value={formData.category}
            onChange={handleChange}
            required
          >
            {SLEEP_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Duration (Minutes) *</label>
          <input
            type="number"
            name="duration"
            min="1"
            max="1440"
            className={styles.input}
            placeholder="e.g. 60"
            value={formData.duration}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      {/* Cloudinary Audio Upload File Picker & Field */}
      <div className={styles.formGroup}>
        <label className={styles.label}>
          <MusicNotes size={16} color="#3b82f6" /> Upload Audio File to Cloudinary (Folder: fitnova/exercises/audio) *
        </label>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="file"
            accept="audio/*,.mp3,.wav,.aac,.m4a,.ogg,.flac"
            id="audio-upload-input"
            style={{ display: 'none' }}
            onChange={handleAudioUpload}
            disabled={uploadingAudio || isSubmitting}
          />

          <label
            htmlFor="audio-upload-input"
            className={styles.cancelBtn}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: uploadingAudio ? 'not-allowed' : 'pointer',
              background: 'rgba(59, 130, 246, 0.1)',
              borderColor: 'rgba(59, 130, 246, 0.3)',
              color: '#3b82f6',
              fontWeight: 700,
            }}
          >
            <CloudArrowUp size={18} weight="bold" />
            {uploadingAudio ? `Uploading ${uploadProgress}%...` : 'Browse Audio File'}
          </label>

          {formData.audioUrl && (
            <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              <CheckCircle size={16} weight="fill" /> Audio Loaded
            </span>
          )}
        </div>

        {/* Real-time Progress Bar */}
        {uploadingAudio && (
          <div style={{ marginTop: '0.5rem', background: 'var(--color-border)', height: '6px', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${uploadProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                transition: 'width 0.15s ease',
              }}
            />
          </div>
        )}

        <input
          type="text"
          name="audioUrl"
          className={styles.input}
          style={{ marginTop: '0.5rem' }}
          placeholder="https://res.cloudinary.com/... or CDN audio link"
          value={formData.audioUrl}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Cover Image Banner URL (Auto-set by Category or Custom)</label>
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
          <label className={styles.label}>Tags (Comma Separated)</label>
          <input
            type="text"
            name="tags"
            className={styles.input}
            placeholder="e.g. rain, thunder, sleep, focus"
            value={formData.tags}
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
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Description</label>
        <textarea
          name="description"
          className={styles.textarea}
          placeholder="Describe the ambient sound track..."
          value={formData.description}
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
            <Star size={16} weight={formData.isFeatured ? 'fill' : 'regular'} color="#fbbf24" /> Feature this track on App Home Sleep Tab
          </span>
        </label>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={isSubmitting || uploadingAudio}>
          Cancel
        </button>
        <button type="submit" className={styles.submitBtn} disabled={isSubmitting || uploadingAudio}>
          {isSubmitting ? (
            <span className={styles.spinner} />
          ) : (
            <>
              <FloppyDisk size={18} weight="bold" /> Save Sleep Sound
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default SleepForm;
