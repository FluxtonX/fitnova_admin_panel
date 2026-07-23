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
  Image as ImageIcon,
  UserCheck,
  ListPlus,
  FolderOpen,
} from '@phosphor-icons/react';
import {
  MEDITATION_FOCUS_AREAS,
  FOCUS_AREA_IMAGES,
  getAvailableCloudinaryAudios,
} from '../../services/firebase/meditationService';
import { uploadToCloudinary } from '../../services/cloudinary/cloudinaryService';
import styles from './Form.module.css';



const MeditationForm = ({ initialData, onSubmit, onCancel, isSubmitting, serverError }) => {
  const [formData, setFormData] = useState({
    title: '',
    focus: 'mindfulness',
    duration: 15,
    audioUrl: '',
    publicId: '',
    imageUrl: '',
    description: '',
    instructor: 'Fitnova Master',
    tags: '',
    isFeatured: false,
    status: 'active',
  });

  const [audioSourceMode, setAudioSourceMode] = useState('upload'); // 'upload' | 'url' | 'library'
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [availableAudios, setAvailableAudios] = useState([]);
  const [loadingAudios, setLoadingAudios] = useState(false);

  useEffect(() => {
    fetchExistingAudios();
    if (initialData) {
      setFormData({
        title: initialData.title || initialData.name || '',
        focus: initialData.focus || initialData.category || 'mindfulness',
        duration: initialData.duration ? Number(String(initialData.duration).replace(/[^0-9]/g, '')) || 15 : 15,
        audioUrl: initialData.audioUrl || '',
        publicId: initialData.publicId || '',
        imageUrl: initialData.imageUrl || '',
        description: initialData.description || '',
        instructor: initialData.instructor || 'Fitnova Master',
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : initialData.tags || '',
        isFeatured: Boolean(initialData.isFeatured),
        status: initialData.status || 'active',
      });
    }
  }, [initialData]);

  const fetchExistingAudios = async () => {
    try {
      setLoadingAudios(true);
      const list = await getAvailableCloudinaryAudios();
      setAvailableAudios(list || []);
    } catch (_) {
    } finally {
      setLoadingAudios(false);
    }
  };

  const handleApplyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      title: preset.title,
      focus: preset.focus,
      duration: preset.duration,
      instructor: preset.instructor,
      description: preset.description,
      tags: preset.tags,
      audioUrl: prev.audioUrl || preset.audioUrl,
      imageUrl: FOCUS_AREA_IMAGES[preset.focus] || prev.imageUrl,
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const nextData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      if (name === 'focus') {
        const defaultImg = FOCUS_AREA_IMAGES[value];
        if (!prev.imageUrl || Object.values(FOCUS_AREA_IMAGES).includes(prev.imageUrl)) {
          nextData.imageUrl = defaultImg || '';
        }
      }

      return nextData;
    });
  };

  const handleAssignExistingAudio = (e) => {
    const selectedUrl = e.target.value;
    if (!selectedUrl) return;
    const matched = availableAudios.find((item) => item.audioUrl === selectedUrl);

    if (matched) {
      setFormData((prev) => ({
        ...prev,
        audioUrl: matched.audioUrl,
        publicId: matched.publicId || prev.publicId,
        title: prev.title || matched.title || '',
        duration: matched.duration || prev.duration,
        description: prev.description || matched.description || '',
      }));
    } else {
      setFormData((prev) => ({ ...prev, audioUrl: selectedUrl }));
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const res = await uploadToCloudinary(
        file,
        'video',
        (pct) => setUploadProgress(pct),
        'fitnova/exercises/audio'
      );

      const computedDuration = res.duration ? Math.ceil(res.duration / 60) : formData.duration;
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      setFormData((prev) => ({
        ...prev,
        audioUrl: res.secure_url,
        publicId: res.public_id,
        duration: computedDuration,
        title: prev.title.trim() ? prev.title : cleanTitle,
      }));
    } catch (err) {
      setUploadError(err.message || 'Failed to upload audio file.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a session title.');
      return;
    }
    if (!formData.audioUrl.trim()) {
      alert('Please upload or select an audio file for this session.');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {(serverError || uploadError) && (
        <div className={styles.errorAlert}>
          <WarningCircle size={20} weight="bold" />
          <span>{serverError || uploadError}</span>
        </div>
      )}



      {/* Audio Source Mode Switcher Tabs */}
      <div className={styles.formGroup}>
        <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MusicNotes size={18} weight="bold" color="#2563eb" />
          <span>Audio Source Selection *</span>
        </label>

        <div className={styles.tabBar}>
          <button
            type="button"
            className={`${styles.tabBtn} ${audioSourceMode === 'library' ? styles.tabActive : ''}`}
            onClick={() => setAudioSourceMode('library')}
          >
            <FolderOpen size={18} weight="bold" />
            <span>Cloudinary Audio Library</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${audioSourceMode === 'upload' ? styles.tabActive : ''}`}
            onClick={() => setAudioSourceMode('upload')}
          >
            <CloudArrowUp size={18} weight="bold" />
            <span>Upload New Audio File</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${audioSourceMode === 'url' ? styles.tabActive : ''}`}
            onClick={() => setAudioSourceMode('url')}
          >
            <MusicNotes size={18} weight="bold" />
            <span>Custom Audio URL</span>
          </button>
        </div>

        {audioSourceMode === 'library' ? (
          <div style={{ marginTop: '6px' }}>
            <select
              className={styles.select}
              value={formData.audioUrl}
              onChange={handleAssignExistingAudio}
            >
              <option value="">-- Choose from existing uploaded audios ({availableAudios.length}) --</option>
              {availableAudios.map((item) => (
                <option key={item.id} value={item.audioUrl}>
                  🎵 {item.title} ({item.duration || 15}m - {item.category || 'Audio'})
                </option>
              ))}
            </select>
          </div>
        ) : audioSourceMode === 'upload' ? (
          <div style={{ marginTop: '6px' }}>
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                border: '2px dashed #2563eb',
                borderRadius: '12px',
                background: 'var(--color-field, #f8fafc)',
                cursor: uploading ? 'not-allowed' : 'pointer',
                textAlign: 'center',
                gap: '6px',
              }}
            >
              <CloudArrowUp size={28} weight="bold" color="#2563eb" />
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                {uploading ? 'Uploading to Cloudinary...' : 'Click to Upload Audio File (.mp3, .wav, .m4a)'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Target Folder: fitnova/exercises/audio
              </span>
              <input
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg"
                onChange={handleFileChange}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>

            {uploading && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>Uploading to Cloudinary...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--color-field)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${uploadProgress}%`, backgroundColor: '#2563eb', transition: 'width 0.2s ease' }} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginTop: '6px' }}>
            <input
              type="url"
              name="audioUrl"
              value={formData.audioUrl}
              onChange={handleChange}
              placeholder="https://example.com/audio/meditation_track.mp3"
              className={styles.input}
            />
          </div>
        )}
      </div>

      {/* Selected Audio Preview Card */}
      {formData.audioUrl && (
        <div style={{ padding: '10px 14px', background: 'var(--color-field)', borderRadius: '12px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={16} weight="fill" /> Audio Track Linked
            </span>
          </div>
          <audio controls src={formData.audioUrl} style={{ width: '100%', height: '36px' }} />
        </div>
      )}

      {/* Session Title */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Session Title *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g. Morning Mindfulness & Presence"
          className={styles.input}
          required
        />
      </div>

      {/* Focus Area & Duration */}
      <div className={styles.rowTwo}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Focus Area / Category *</label>
          <select name="focus" value={formData.focus} onChange={handleChange} className={styles.select}>
            {MEDITATION_FOCUS_AREAS.map((cat) => (
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
            max="360"
            value={formData.duration}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>
      </div>

      {/* Instructor & Status */}
      <div className={styles.rowTwo}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Instructor / Guide</label>
          <input
            type="text"
            name="instructor"
            value={formData.instructor}
            onChange={handleChange}
            placeholder="e.g. Sarah Jenkins"
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className={styles.select}>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Cover Image Selection */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Cover Image Banner</label>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
          {Object.entries(FOCUS_AREA_IMAGES).map(([key, url]) => (
            <div
              key={key}
              onClick={() => setFormData((prev) => ({ ...prev, imageUrl: url }))}
              style={{
                width: '64px',
                height: '44px',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: formData.imageUrl === url ? '2px solid #2563eb' : '1px solid var(--color-border)',
                opacity: formData.imageUrl === url ? 1 : 0.65,
                flexShrink: 0,
              }}
            >
              <img src={url} alt={key} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
        <input
          type="url"
          name="imageUrl"
          value={formData.imageUrl}
          onChange={handleChange}
          placeholder="Or paste custom image URL (https://images.unsplash.com/...)"
          className={styles.input}
          style={{ fontSize: '12px', marginTop: '4px' }}
        />
      </div>

      {/* Description */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Description</label>
        <textarea
          name="description"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          placeholder="Brief overview of guidance, breathwork, or meditation technique used..."
          className={styles.textarea}
        />
      </div>

      {/* Tags */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Tags (Comma Separated)</label>
        <input
          type="text"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          placeholder="mindfulness, focus, morning, calm"
          className={styles.input}
        />
      </div>

      {/* Featured Checkbox */}
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
            <Star size={18} weight={formData.isFeatured ? 'fill' : 'regular'} color={formData.isFeatured ? '#F59E0B' : 'currentColor'} />
            <span>Feature on Home Screen & Recommended Section</span>
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button type="button" onClick={onCancel} className={styles.cancelBtn} disabled={isSubmitting || uploading}>
          Cancel
        </button>
        <button type="submit" className={styles.submitBtn} disabled={isSubmitting || uploading}>
          <FloppyDisk size={18} weight="bold" />
          <span>{isSubmitting ? 'Saving...' : initialData ? 'Update Session' : 'Save Session'}</span>
        </button>
      </div>
    </form>
  );
};

export default MeditationForm;
