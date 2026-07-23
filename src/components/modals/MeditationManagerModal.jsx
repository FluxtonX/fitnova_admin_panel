import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  PencilSimple,
  Trash,
  MusicNotes,
  CheckCircle,
  PlayCircle,
  Spinner,
} from '@phosphor-icons/react';
import {
  getMeditationSessions,
  addMeditationSession,
  updateMeditationSession,
  deleteMeditationSession,
} from '../../services/firebase/meditationService';
import styles from './MeditationManagerModal.module.css';

const CATEGORIES = ['Sleep', 'Focus', 'Calm', 'Energy'];

const MeditationManagerModal = ({ isOpen, onClose }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Calm',
    guide: 'Sarah Johnson',
    durationMinutes: 10,
    audioUrl: '',
    imageUrl: '',
    tag: 'Guided',
  });

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await getMeditationSessions();
      setSessions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      category: 'Calm',
      guide: 'Sarah Johnson',
      durationMinutes: 10,
      audioUrl: '',
      imageUrl: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=300&q=80',
      tag: 'Guided',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      category: item.category || 'Calm',
      guide: item.instructor || item.guide || 'Sarah Johnson',
      durationMinutes: item.durationMinutes || item.duration || 10,
      audioUrl: item.audioUrl || '',
      imageUrl: item.imageUrl || item.image || '',
      tag: item.tag || item.category || 'Guided',
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSubmitting(true);
    try {
      if (editingItem) {
        await updateMeditationSession(editingItem.id, formData, editingItem.collectionName);
      } else {
        await addMeditationSession(formData);
      }
      setIsFormOpen(false);
      setEditingItem(null);
      await fetchSessions();
    } catch (err) {
      alert('Failed to save session: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}" session?`)) return;
    try {
      await deleteMeditationSession(item.id, item.collectionName);
      setSessions((prev) => prev.filter((s) => s.id !== item.id));
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <MusicNotes size={26} color="#7a00f4" weight="duotone" />
            <div>
              <h3>Meditation & Sound Library</h3>
              <p>Manage audio sessions and music links streamed to the Fitnova app.</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {isFormOpen ? (
            <form onSubmit={handleSubmit} className={styles.addForm}>
              <h4 className={styles.addFormTitle}>
                {editingItem ? `Edit Session: "${editingItem.title}"` : 'Add New Meditation / Audio Session'}
              </h4>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Deep Sleep Rain, Morning Breathing"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Guide / Instructor Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Johnson, Michael Chen"
                    value={formData.guide}
                    onChange={(e) => setFormData({ ...formData, guide: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Duration (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Audio Music URL (Direct MP3 / Audio Stream Link)</label>
                  <input
                    type="url"
                    placeholder="https://example.com/audio/meditation_music.mp3"
                    value={formData.audioUrl}
                    onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Thumbnail Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setIsFormOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.submitBtn} disabled={submitting}>
                    {submitting ? <Spinner className="animate-spin" size={16} /> : <CheckCircle size={18} />}
                    {editingItem ? 'Save Changes' : 'Create Session'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <>
              <div className={styles.sectionHeader}>
                <h4>Available Sessions ({sessions.length})</h4>
                <button className={styles.addBtn} onClick={handleOpenAdd}>
                  <Plus size={16} weight="bold" />
                  Add Audio Session
                </button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  Loading sessions from Firestore...
                </div>
              ) : sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  No meditation audio sessions found in Firestore. Click "Add Audio Session" to create one.
                </div>
              ) : (
                <div className={styles.sessionsList}>
                  {sessions.map((item) => (
                    <div key={item.id} className={styles.sessionItem}>
                      <div className={styles.sessionInfo}>
                        <img
                          src={
                            item.imageUrl ||
                            item.image ||
                            'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=300&q=80'
                          }
                          alt={item.title}
                          className={styles.sessionThumb}
                        />
                        <div className={styles.sessionMeta}>
                          <h5>{item.title}</h5>
                          <p>
                            {item.instructor || item.guide || 'Sarah Johnson'} •{' '}
                            {item.durationMinutes || item.duration || 10} min
                          </p>
                          <div className={styles.sessionBadges}>
                            <span className={`${styles.badge} ${styles.badgeCategory}`}>
                              {item.category}
                            </span>
                            {item.audioUrl ? (
                              <span className={styles.badge} style={{ background: '#dcfce7', color: '#15803d' }}>
                                🎵 Audio Linked
                              </span>
                            ) : (
                              <span className={styles.badge} style={{ background: '#fef3c7', color: '#b45309' }}>
                                🌬️ Breathing Only
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={styles.itemActions}>
                        <button
                          className={styles.iconBtn}
                          onClick={() => handleOpenEdit(item)}
                          title="Edit Session"
                        >
                          <PencilSimple size={16} />
                        </button>
                        <button
                          className={`${styles.iconBtn} ${styles.danger}`}
                          onClick={() => handleDelete(item)}
                          title="Delete Session"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeditationManagerModal;
