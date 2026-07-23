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
  Moon,
  SpeakerHigh,
  X,
  Waveform,
  Headphones,
} from '@phosphor-icons/react';
import SlideOver from '../../components/modals/SlideOver';
import SleepForm from '../../components/forms/SleepForm';
import ConfirmModal from '../../components/modals/ConfirmModal';
import {
  getSleepSounds,
  createSleepSound,
  updateSleepSound,
  deleteSleepSound,
  CATEGORY_SOUND_IMAGES,
} from '../../services/firebase/sleepService';
import styles from './SleepList.module.css';

const CATEGORY_FILTERS = [
  { value: 'All', label: 'All Sounds' },
  { value: 'nature', label: '🌧️ Nature & Rain' },
  { value: 'ocean', label: '🌊 Ocean & Waves' },
  { value: 'white_noise', label: '📻 White & Pink Noise' },
  { value: 'binaural', label: '🧠 Binaural Delta Waves' },
  { value: 'ambient_music', label: '🎵 Ambient Music' },
  { value: 'sleep_story', label: '📖 Sleep Bedtime Story' },
];

const SleepList = () => {
  const [sounds, setSounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // View Mode: 'grid' | 'table'
  const [viewMode, setViewMode] = useState('grid');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
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
  const [editingTrack, setEditingTrack] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete Confirm Modal State
  const [deletingTrack, setDeletingTrack] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchSoundsData();
  }, []);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSoundsData = async () => {
    setLoading(true);
    try {
      const data = await getSleepSounds();
      setSounds(data || []);
    } catch (err) {
      console.warn('Error fetching sleep sounds:', err);
      setSounds([]);
    } finally {
      setLoading(false);
    }
  };

  // Audio Playback Handling
  const handlePlayTrack = (track) => {
    if (currentTrack && currentTrack.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.src = currentTrack.audioUrl;
      audioRef.current.play().catch((err) => console.warn('Audio play error:', err));
      setIsPlaying(true);
    }
  }, [currentTrack]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime || 0;
      const dur = audioRef.current.duration || 1;
      setAudioCurrentTime(cur);
      setAudioDuration(dur);
      setAudioProgress((cur / dur) * 100);
    }
  };

  const handleSeek = (e) => {
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

  // Filter & Sort Logic
  const processedSounds = useMemo(() => {
    let list = [...sounds];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.description || '').toLowerCase().includes(q) ||
          (s.category || '').toLowerCase().includes(q)
      );
    }

    if (activeCategory !== 'All') {
      list = list.filter((s) => (s.category || 'nature') === activeCategory);
    }

    list.sort((a, b) => {
      if (sortBy === 'name-asc') return a.title.localeCompare(b.title);
      if (sortBy === 'duration') return (b.duration || 0) - (a.duration || 0);
      if (sortBy === 'plays') return (b.playCount || 0) - (a.playCount || 0);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return list;
  }, [sounds, searchTerm, activeCategory, sortBy]);

  // Calculated Stats
  const stats = useMemo(() => {
    const total = sounds.length;
    const totalMins = sounds.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
    const totalHours = (totalMins / 60).toFixed(1);
    const featured = sounds.filter((s) => s.isFeatured).length;
    const categoriesCount = new Set(sounds.map((s) => s.category)).size;

    return { total, totalHours, featured, categoriesCount };
  }, [sounds]);

  // Save / Update Track
  const handleFormSubmit = async (formData) => {
    setFormSubmitting(true);
    setFormError(null);
    try {
      if (editingTrack) {
        await updateSleepSound(editingTrack.id, formData);
        setSounds((prev) =>
          prev.map((s) => (s.id === editingTrack.id ? { ...s, ...formData } : s))
        );
        showToast(`Sleep sound "${formData.title}" updated!`);
      } else {
        const newId = await createSleepSound(formData);
        const newObj = { id: newId, ...formData, createdAt: new Date().toISOString() };
        setSounds((prev) => [newObj, ...prev]);
        showToast(`Sleep sound "${formData.title}" created successfully!`);
      }
      setIsDrawerOpen(false);
      setEditingTrack(null);
    } catch (err) {
      console.error('Failed to save sleep sound:', err);
      setFormError(err.message || 'Failed to save sleep sound to Firebase.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Track
  const handleConfirmDelete = async () => {
    if (!deletingTrack) return;
    setDeleteLoading(true);
    try {
      await deleteSleepSound(deletingTrack.id, deletingTrack);
      setSounds((prev) => prev.filter((s) => s.id !== deletingTrack.id));
      if (currentTrack?.id === deletingTrack.id) {
        audioRef.current?.pause();
        setCurrentTrack(null);
        setIsPlaying(false);
      }
      showToast(`Sleep sound "${deletingTrack.title}" deleted.`);
      setDeletingTrack(null);
    } catch (err) {
      console.error('Failed to delete track:', err);
      showToast(err.message || 'Failed to delete track.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className={`${styles.container} animate-fade-in`}>
      {/* Hidden HTML5 Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Toast Notification Banner */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.type === 'success' ? <CheckCircle size={20} weight="fill" /> : <WarningCircle size={20} weight="fill" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Sleep & Ambient Sounds</h2>
          <p>Manage high quality ambient soundscapes, white noise, and sleep audio.</p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <MagnifyingGlass size={20} weight="duotone" className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search sounds..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.activeView : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <SquaresFour size={18} weight="bold" />
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'table' ? styles.activeView : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <TableIcon size={18} weight="bold" />
            </button>
          </div>

          <button
            className="btn primary"
            onClick={() => {
              setEditingTrack(null);
              setFormError(null);
              setIsDrawerOpen(true);
            }}
          >
            <Plus size={18} weight="bold" /> Upload Sound
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
            <Headphones size={24} weight="fill" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Tracks</span>
            <span className={styles.statValue}>{stats.total}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
            <Clock size={24} weight="fill" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Duration</span>
            <span className={styles.statValue}>{stats.totalHours} hrs</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
            <Star size={24} weight="fill" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Featured</span>
            <span className={styles.statValue}>{stats.featured}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <Moon size={24} weight="fill" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Categories</span>
            <span className={styles.statValue}>{stats.categoriesCount}</span>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className={styles.filterChips}>
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat.value}
            className={`${styles.chip} ${activeCategory === cat.value ? styles.active : ''}`}
            onClick={() => setActiveCategory(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Controls & Sorting */}
      <div className={styles.controlsBar}>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
          Showing {processedSounds.length} audio tracks
        </span>

        <div className={styles.sortGroup}>
          <span className={styles.sortLabel}>Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.miniSelect}
          >
            <option value="newest">Newest First</option>
            <option value="name-asc">Title (A-Z)</option>
            <option value="duration">Longest Duration</option>
            <option value="plays">Most Played</option>
          </select>
        </div>
      </div>

      {/* Main Sound Grid or Table View */}
      {loading ? (
        <div className={styles.grid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      ) : processedSounds.length === 0 ? (
        <div className={styles.emptyState}>
          <Moon size={48} weight="duotone" className={styles.emptyIcon} />
          <h3>No sleep sounds found</h3>
          <p>No track matches your search query or category filter.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className={styles.grid}>
          {processedSounds.map((track) => {
            const isThisPlaying = currentTrack?.id === track.id && isPlaying;
            const categoryKey = track.category || 'nature';
            const coverArt =
              track.imageUrl || CATEGORY_SOUND_IMAGES[categoryKey] || CATEGORY_SOUND_IMAGES.nature;

            return (
              <div key={track.id} className={styles.card}>
                <div
                  className={styles.cardImageBanner}
                  style={{ backgroundImage: `url(${coverArt})` }}
                >
                  <div className={styles.cardImageOverlay} />

                  <div className={styles.cardTopRow}>
                    <span className={styles.categoryBadge}>{track.category}</span>
                    {track.isFeatured && <Star size={18} weight="fill" color="#fbbf24" />}
                  </div>

                  <button
                    className={styles.playOverlayBtn}
                    onClick={() => handlePlayTrack(track)}
                    title={isThisPlaying ? 'Pause Audio' : 'Play Audio'}
                  >
                    {isThisPlaying ? <Pause size={24} weight="fill" /> : <Play size={24} weight="fill" style={{ marginLeft: 3 }} />}
                  </button>

                  <div className={styles.cardHeaderBottom}>
                    <h3 className={styles.cardTitle}>{track.title}</h3>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <p className={styles.descriptionText}>{track.description || 'Ambient sleep sound.'}</p>
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.durationBadge}>
                    <Clock size={16} /> {track.duration || 30} min
                  </span>

                  <div className={styles.cardActions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => {
                        setEditingTrack(track);
                        setFormError(null);
                        setIsDrawerOpen(true);
                      }}
                      title="Edit Track"
                    >
                      <PencilSimple size={18} />
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.danger}`}
                      onClick={() => setDeletingTrack(track)}
                      title="Delete Track"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 60 }}>Play</th>
                <th>Track Title</th>
                <th>Category</th>
                <th>Duration</th>
                <th>Plays</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedSounds.map((track) => {
                const isThisPlaying = currentTrack?.id === track.id && isPlaying;
                return (
                  <tr key={track.id}>
                    <td>
                      <button
                        className={styles.playBtnSmall}
                        onClick={() => handlePlayTrack(track)}
                      >
                        {isThisPlaying ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" style={{ marginLeft: 2 }} />}
                      </button>
                    </td>
                    <td>
                      <div className={styles.tableNameCell}>
                        <span className={styles.tableName}>{track.title}</span>
                        {track.isFeatured && <Star size={14} weight="fill" color="#fbbf24" />}
                      </div>
                    </td>
                    <td>
                      <span className={styles.tableCategory}>{track.category}</span>
                    </td>
                    <td>{track.duration || 30} min</td>
                    <td>{track.playCount || 0}</td>
                    <td>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>
                        {track.status || 'active'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => {
                            setEditingTrack(track);
                            setIsDrawerOpen(true);
                          }}
                          title="Edit"
                        >
                          <PencilSimple size={16} />
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.danger}`}
                          onClick={() => setDeletingTrack(track)}
                          title="Delete"
                        >
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
        <div className={styles.playerBar}>
          <div className={styles.playerTrackInfo}>
            <div
              className={styles.playerArt}
              style={{
                backgroundImage: `url(${
                  currentTrack.imageUrl ||
                  CATEGORY_SOUND_IMAGES[currentTrack.category] ||
                  CATEGORY_SOUND_IMAGES.nature
                })`,
              }}
            />
            <div className={styles.playerMeta}>
              <h4 className={styles.playerTitle}>{currentTrack.title}</h4>
              <span className={styles.playerSub}>{currentTrack.category} • {currentTrack.duration} min</span>
            </div>
          </div>

          <div className={styles.playerControls}>
            <button
              className={styles.mainPlayBtn}
              onClick={() => handlePlayTrack(currentTrack)}
            >
              {isPlaying ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" style={{ marginLeft: 2 }} />}
            </button>

            <span className={styles.timeText}>{formatTime(audioCurrentTime)}</span>
            <input
              type="range"
              className={styles.timeSlider}
              min="0"
              max="100"
              value={audioProgress || 0}
              onChange={handleSeek}
            />
            <span className={styles.timeText}>{formatTime(audioDuration)}</span>
          </div>

          <button
            className={styles.closePlayerBtn}
            onClick={() => {
              audioRef.current?.pause();
              setCurrentTrack(null);
              setIsPlaying(false);
            }}
            title="Close Player"
          >
            <X size={20} weight="bold" />
          </button>
        </div>
      )}

      {/* SlideOver Drawer for Sleep Form */}
      <SlideOver
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingTrack(null);
        }}
        title={editingTrack ? `Edit "${editingTrack.title}"` : 'Upload New Sleep Sound'}
      >
        <SleepForm
          initialData={editingTrack}
          isSubmitting={formSubmitting}
          error={formError}
          onCancel={() => {
            setIsDrawerOpen(false);
            setEditingTrack(null);
          }}
          onSubmit={handleFormSubmit}
        />
      </SlideOver>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingTrack)}
        title={`Delete "${deletingTrack?.title}"?`}
        message="Are you sure you want to delete this sleep sound track? If custom uploaded, the audio file will also be deleted from Cloudinary."
        confirmText="Yes, Delete"
        confirmVariant="danger"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingTrack(null)}
      />
    </div>
  );
};

export default SleepList;
