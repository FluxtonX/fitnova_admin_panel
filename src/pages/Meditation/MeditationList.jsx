import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MagnifyingGlass,
  Plus,
  PencilSimple,
  Trash,
  Play,
  Pause,
  SquaresFour,
  Table as TableIcon,
  CheckCircle,
  WarningCircle,
  Star,
  Clock,
  SpeakerHigh,
  X,
  Waveform,
  UserCheck,
  Moon,
  Brain,
} from '@phosphor-icons/react';
import SlideOver from '../../components/modals/SlideOver';
import MeditationForm from '../../components/forms/MeditationForm';
import ConfirmModal from '../../components/modals/ConfirmModal';
import {
  getMeditations,
  createMeditation,
  updateMeditation,
  deleteMeditation,
  FOCUS_AREA_IMAGES,
} from '../../services/firebase/meditationService';
import styles from './MeditationList.module.css';

const WELLNESS_FILTERS = [
  { value: 'All', label: 'All Wellness Audio' },
  { value: 'mindfulness', label: '🧘‍♂️ Mindfulness' },
  { value: 'focus', label: '🎯 Focus & Clarity' },
  { value: 'stress_relief', label: '🌊 Stress Relief' },
  { value: 'sleep', label: '🌙 Sleep Prep' },
  { value: 'nature', label: '🌧️ Nature & Rain' },
  { value: 'ocean', label: '🌊 Ocean & Waves' },
  { value: 'white_noise', label: '📻 White Noise' },
  { value: 'binaural', label: '🧠 Binaural Waves' },
  { value: 'ambient_music', label: '🎵 Ambient Relaxation' },
  { value: 'breathing', label: '🌬️ Deep Breathing' },
];

const MeditationList = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // View Mode: 'grid' | 'table'
  const [viewMode, setViewMode] = useState('grid');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFocus, setActiveFocus] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Active Audio Player State
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef(null);

  // Drawer / Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete Confirm Modal State
  const [deletingSession, setDeletingSession] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchMeditationsData();
  }, []);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchMeditationsData = async () => {
    setLoading(true);
    try {
      const data = await getMeditations();
      setSessions(data || []);
    } catch (err) {
      console.warn('Error fetching wellness audio sessions:', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // Audio Playback Handling
  const handlePlayTrack = (session) => {
    if (!session.audioUrl) {
      showToast('No audio file associated with this session.', 'error');
      return;
    }
    if (currentTrack && currentTrack.id === session.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentTrack(session);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.src = currentTrack.audioUrl;
      audioRef.current.play().catch((e) => {
        console.warn('Audio auto-play notice:', e);
        setIsPlaying(false);
      });
    }
  }, [currentTrack]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime || 0;
    const dur = audioRef.current.duration || 1;
    setAudioCurrentTime(cur);
    setAudioDuration(dur);
    setAudioProgress((cur / dur) * 100);
  };

  const handleScrub = (e) => {
    const val = Number(e.target.value);
    if (audioRef.current && audioDuration > 0) {
      const newTime = (val / 100) * audioDuration;
      audioRef.current.currentTime = newTime;
      setAudioProgress(val);
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Filter & Sort Computations
  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    if (activeFocus !== 'All') {
      result = result.filter((s) => (s.focus || s.category || '').toLowerCase() === activeFocus.toLowerCase());
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          (s.title || s.name || '').toLowerCase().includes(query) ||
          (s.instructor || '').toLowerCase().includes(query) ||
          (s.description || '').toLowerCase().includes(query)
      );
    }

    if (sortBy === 'newest') {
      result.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    } else if (sortBy === 'duration') {
      result.sort((a, b) => (Number(b.duration) || 0) - (Number(a.duration) || 0));
    } else if (sortBy === 'title') {
      result.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''));
    }

    return result;
  }, [sessions, activeFocus, searchTerm, sortBy]);

  const stats = useMemo(() => {
    const total = sessions.length;
    const totalMins = sessions.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
    const totalHours = (totalMins / 60).toFixed(1);
    const featured = sessions.filter((s) => s.isFeatured).length;
    const focusAreasCount = new Set(sessions.map((s) => s.focus || s.category)).size;

    return { total, totalHours, featured, focusAreasCount };
  }, [sessions]);

  // Form Drawer Handlers
  const handleOpenCreate = () => {
    setEditingSession(null);
    setFormError(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (session) => {
    setEditingSession(session);
    setFormError(null);
    setIsDrawerOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setFormSubmitting(true);
    setFormError(null);
    try {
      if (editingSession) {
        await updateMeditation(editingSession.id, formData);
        setSessions((prev) =>
          prev.map((s) => (s.id === editingSession.id ? { ...s, ...formData } : s))
        );
        showToast(`Audio session "${formData.title}" updated!`);
      } else {
        const newId = await createMeditation(formData);
        const newObj = { id: newId, ...formData, createdAt: new Date().toISOString() };
        setSessions((prev) => [newObj, ...prev]);
        showToast(`Audio session "${formData.title}" created successfully!`);
      }
      setIsDrawerOpen(false);
      setEditingSession(null);
    } catch (err) {
      console.error('Failed to save audio session:', err);
      setFormError(err.message || 'Failed to save audio session to Firebase.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Handling
  const handleConfirmDelete = async () => {
    if (!deletingSession) return;
    setDeleteLoading(true);
    try {
      await deleteMeditation(deletingSession.id, deletingSession);
      setSessions((prev) => prev.filter((s) => s.id !== deletingSession.id));
      if (currentTrack?.id === deletingSession.id) {
        audioRef.current?.pause();
        setCurrentTrack(null);
        setIsPlaying(false);
      }
      showToast(`Audio session "${deletingSession.title || deletingSession.name}" deleted.`);
      setDeletingSession(null);
    } catch (err) {
      console.error('Failed to delete session:', err);
      showToast(err.message || 'Failed to delete session.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className={`${styles.container} animate-fade-in`}>
      {/* Toast Banner */}
      {toast && (
        <div
          className={styles.toast}
          style={{ background: toast.type === 'error' ? '#EF4444' : '#10B981' }}
        >
          {toast.type === 'error' ? <WarningCircle size={20} weight="bold" /> : <CheckCircle size={20} weight="bold" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2>Meditation & Sleep Audio</h2>
            <span style={{ fontSize: '11px', background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', padding: '3px 8px', borderRadius: '12px', fontWeight: '700' }}>UNIFIED TAB</span>
          </div>
          <p>Manage guided meditation sessions, sleep soundscapes, white noise, and ambient audio in one place.</p>
        </div>

        <div className={styles.headerActions}>
          <button className="btn primary" onClick={handleOpenCreate}>
            <Plus size={18} weight="bold" />
            <span>Upload & Assign Audio</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}>
            <Waveform size={24} weight="bold" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Audio Tracks</span>
            <span className={styles.statValue}>{stats.total}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' }}>
            <Clock size={24} weight="bold" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Duration</span>
            <span className={styles.statValue}>{stats.totalHours} hrs</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
            <Star size={24} weight="bold" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Featured</span>
            <span className={styles.statValue}>{stats.featured}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
            <Moon size={24} weight="bold" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Categories</span>
            <span className={styles.statValue}>{stats.focusAreasCount}</span>
          </div>
        </div>
      </div>

      {/* Wellness Filter Chips */}
      <div className={styles.filterChipsRow}>
        {WELLNESS_FILTERS.map((chip) => (
          <button
            key={chip.value}
            className={`${styles.chipButton} ${activeFocus === chip.value ? styles.chipActive : ''}`}
            onClick={() => setActiveFocus(chip.value)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <MagnifyingGlass size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search meditation, sleep sounds, guide, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.toolbarRight}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.sortSelect}
          >
            <option value="newest">Sort: Newest First</option>
            <option value="duration">Sort: Longest Duration</option>
            <option value="title">Sort: Title (A-Z)</option>
          </select>

          <div className={styles.viewToggleGroup}>
            <button
              className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <SquaresFour size={20} weight={viewMode === 'grid' ? 'bold' : 'regular'} />
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'table' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <TableIcon size={20} weight={viewMode === 'table' ? 'bold' : 'regular'} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-secondary)' }}>
          <p>Loading Meditation & Sleep audio sessions from Firebase...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--color-surface)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
          <Waveform size={48} weight="thin" color="var(--color-text-tertiary)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
            No meditation or sleep audio sessions found
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
            Upload a new Cloudinary audio file or assign an existing sound track to create your session.
          </p>
          <button className="btn primary" onClick={handleOpenCreate}>
            <Plus size={18} weight="bold" /> Upload Audio Session
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className={styles.grid}>
          {filteredSessions.map((session) => {
            const focusVal = session.focus || session.category || 'mindfulness';
            const imgUrl = session.imageUrl || FOCUS_AREA_IMAGES[focusVal] || FOCUS_AREA_IMAGES.mindfulness;
            const isThisPlaying = currentTrack?.id === session.id && isPlaying;

            return (
              <div key={session.id} className={styles.card}>
                <div className={styles.cardImageWrapper}>
                  <img src={imgUrl} alt={session.title || session.name} className={styles.cardImage} />
                  <div className={styles.cardOverlay}>
                    <button
                      className={styles.playOverlayBtn}
                      onClick={() => handlePlayTrack(session)}
                      title={isThisPlaying ? 'Pause Audio' : 'Play Audio'}
                    >
                      {isThisPlaying ? <Pause size={24} weight="fill" /> : <Play size={24} weight="fill" style={{ marginLeft: '3px' }} />}
                    </button>
                  </div>

                  <span className={styles.badgeTag}>{(session.focus || session.category || 'Mindfulness').replace('_', ' ')}</span>

                  {session.isFeatured && (
                    <div className={styles.featuredStar} title="Featured Session">
                      <Star size={16} weight="fill" />
                    </div>
                  )}
                </div>

                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{session.title || session.name}</h3>
                  <p className={styles.cardDesc}>{session.description || 'Guided meditation & sleep audio session for relaxation and inner clarity.'}</p>

                  <div className={styles.cardFooter}>
                    <div className={styles.cardMeta}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} /> {session.duration} min
                      </span>
                      <span>•</span>
                      <span>{session.instructor || 'Fitnova Master'}</span>
                    </div>

                    <div className={styles.cardActions}>
                      <button className={styles.actionIconBtn} onClick={() => handleOpenEdit(session)} title="Edit Session">
                        <PencilSimple size={16} />
                      </button>
                      <button className={`${styles.actionIconBtn} ${styles.actionIconBtnDelete}`} onClick={() => setDeletingSession(session)} title="Delete Session">
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View Mode */
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Session Name</th>
                <th>Category</th>
                <th>Duration</th>
                <th>Guide / Instructor</th>
                <th>Audio File</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => {
                const isThisPlaying = currentTrack?.id === session.id && isPlaying;
                const fileName = session.audioUrl ? session.audioUrl.split('/').pop().split('?')[0] : 'No File';

                return (
                  <tr key={session.id} className={styles.tableTr}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: isThisPlaying ? 'var(--color-primary)' : 'var(--color-field)',
                            color: isThisPlaying ? '#fff' : 'var(--color-primary)',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                          onClick={() => handlePlayTrack(session)}
                        >
                          {isThisPlaying ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" style={{ marginLeft: '2px' }} />}
                        </button>
                        <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>{session.title || session.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.badgeTag} style={{ position: 'static' }}>
                        {session.focus || session.category || 'Mindfulness'}
                      </span>
                    </td>
                    <td>{session.duration} min</td>
                    <td>{session.instructor || 'Fitnova Master'}</td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      🎵 {fileName}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button className={styles.actionIconBtn} onClick={() => handleOpenEdit(session)}>
                          <PencilSimple size={16} />
                        </button>
                        <button className={`${styles.actionIconBtn} ${styles.actionIconBtnDelete}`} onClick={() => setDeletingSession(session)}>
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Web Audio Player Bar */}
      {currentTrack && (
        <div className={styles.audioPlayerBar}>
          <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onEnded={() => setIsPlaying(false)} />

          <div className={styles.playerTrackInfo}>
            <img
              src={currentTrack.imageUrl || FOCUS_AREA_IMAGES[currentTrack.focus] || FOCUS_AREA_IMAGES.mindfulness}
              alt=""
              className={styles.playerThumb}
            />
            <div>
              <div className={styles.playerTitle}>{currentTrack.title || currentTrack.name}</div>
              <div className={styles.playerCategory}>{currentTrack.focus || currentTrack.category} • {currentTrack.duration}m</div>
            </div>
          </div>

          <div className={styles.playerControls}>
            <button className={styles.playToggleBtn} onClick={() => handlePlayTrack(currentTrack)}>
              {isPlaying ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" style={{ marginLeft: '2px' }} />}
            </button>

            <div className={styles.progressBarContainer}>
              <span className={styles.timeText}>{formatTime(audioCurrentTime)}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={audioProgress || 0}
                onChange={handleScrub}
                className={styles.scrubber}
              />
              <span className={styles.timeText}>{formatTime(audioDuration)}</span>
            </div>
          </div>

          <button
            onClick={() => {
              audioRef.current?.pause();
              setCurrentTrack(null);
              setIsPlaying(false);
            }}
            style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
            title="Close Player"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* SlideOver Drawer for Create / Edit */}
      <SlideOver
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingSession ? 'Edit Audio Session' : 'Upload & Assign Audio Session'}
      >
        <MeditationForm
          initialData={editingSession}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsDrawerOpen(false)}
          isSubmitting={formSubmitting}
          serverError={formError}
        />
      </SlideOver>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingSession)}
        onClose={() => setDeletingSession(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Audio Session"
        message={`Are you sure you want to delete "${deletingSession?.title || deletingSession?.name}"? If it has a custom Cloudinary audio file, it will also be permanently deleted from Cloudinary.`}
        confirmText="Delete Session"
        isDanger={true}
        loading={deleteLoading}
      />
    </div>
  );
};

export default MeditationList;
