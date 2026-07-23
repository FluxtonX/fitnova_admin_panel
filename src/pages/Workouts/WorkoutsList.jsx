import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlass,
  Plus,
  PencilSimple,
  Trash,
  PersonSimpleRun,
  SquaresFour,
  List,
  Clock,
  Flame,
  Barbell,
  Copy,
  Eye,
  Sparkle,
  CloudArrowUp,
} from '@phosphor-icons/react';
import SlideOver from '../../components/modals/SlideOver';
import WorkoutForm from '../../components/forms/WorkoutForm';
import WorkoutDetailModal from './WorkoutDetailModal';
import {
  getWorkouts,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  duplicateWorkout,
  seedDefaultWorkouts,
} from '../../services/firebase/workoutService';
import { syncCloudinaryPresetExercises } from '../../services/firebase/exerciseService';
import tableStyles from '../../styles/tableLayout.module.css';
import styles from './WorkoutsList.module.css';

const CATEGORIES = ['All', 'Full Body', 'Strength', 'HIIT', 'Cardio', 'Core', 'Yoga', 'Pilates'];
const DIFFICULTIES = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

const WorkoutsList = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Levels');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals & Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [viewingWorkout, setViewingWorkout] = useState(null);

  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchWorkoutsData();
  }, []);

  const fetchWorkoutsData = async () => {
    try {
      setLoading(true);
      const data = await getWorkouts();
      setWorkouts(data);
    } catch (err) {
      console.error('Failed to load workouts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncCloudinary = async () => {
    try {
      setSyncing(true);
      const count = await syncCloudinaryPresetExercises();
      await seedDefaultWorkouts();
      alert(`Success! Synced ${count} Cloudinary video links and generated workouts into Firestore database.`);
      fetchWorkoutsData();
    } catch (err) {
      alert('Cloudinary sync failed: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingWorkout(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (workout) => {
    setEditingWorkout(workout);
    setIsDrawerOpen(true);
  };

  const handleSaveWorkout = async (formData) => {
    try {
      if (editingWorkout) {
        await updateWorkout(editingWorkout.id, formData);
      } else {
        await createWorkout(formData);
      }
      setIsDrawerOpen(false);
      setEditingWorkout(null);
      fetchWorkoutsData();
    } catch (err) {
      alert('Failed to save workout: ' + err.message);
    }
  };

  const handleDeleteWorkout = async (id) => {
    if (window.confirm('Are you sure you want to delete this workout routine?')) {
      try {
        const workoutObj = workouts.find((w) => w.id === id);
        await deleteWorkout(id, workoutObj);
        fetchWorkoutsData();
      } catch (err) {
        alert('Failed to delete workout: ' + err.message);
      }
    }
  };

  const handleDuplicateWorkout = async (workout) => {
    try {
      await duplicateWorkout(workout);
      fetchWorkoutsData();
    } catch (err) {
      alert('Failed to duplicate workout: ' + err.message);
    }
  };

  // Filter workouts based on search term, category, difficulty
  const filteredWorkouts = workouts.filter((w) => {
    const matchesSearch =
      w.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' ||
      w.category?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesDifficulty =
      selectedDifficulty === 'All Levels' ||
      w.difficulty?.toLowerCase() === selectedDifficulty.toLowerCase();

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Calculate statistics overview
  const totalWorkoutsCount = workouts.length;
  const activeWorkoutsCount = workouts.filter((w) => w.status === 'Active' || !w.status).length;
  const totalExercisesAttached = workouts.reduce(
    (acc, curr) => acc + (curr.exerciseDetails?.length || curr.exercises?.length || 0),
    0
  );
  const avgDuration =
    totalWorkoutsCount > 0
      ? Math.round(
          workouts.reduce((acc, curr) => acc + (parseInt(curr.duration) || 30), 0) /
            totalWorkoutsCount
        )
      : 0;

  return (
    <div className={`${styles.container} animate-fade-in`}>
      {/* ── 1. Top Overview Metric Cards ── */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.emerald}`}>
            <PersonSimpleRun size={24} weight="duotone" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statTitle}>Total Workouts</span>
            <span className={styles.statNumber}>{totalWorkoutsCount}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.blue}`}>
            <Sparkle size={24} weight="duotone" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statTitle}>Active Routines</span>
            <span className={styles.statNumber}>{activeWorkoutsCount}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.purple}`}>
            <Barbell size={24} weight="duotone" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statTitle}>Exercises Configured</span>
            <span className={styles.statNumber}>{totalExercisesAttached}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.orange}`}>
            <Clock size={24} weight="duotone" />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statTitle}>Avg Duration</span>
            <span className={styles.statNumber}>{avgDuration} min</span>
          </div>
        </div>
      </div>

      {/* ── 2. Filters & Controls Header ── */}
      <div className={styles.headerControls}>
        <div className={styles.topRow}>
          <div className={styles.titleArea}>
            <h2>Workout Programs</h2>
            <p>Create, manage and publish customized workout routines with embedded exercises.</p>
          </div>

          <div className={styles.actionControls}>
            <div className={styles.searchBox}>
              <MagnifyingGlass size={18} weight="duotone" className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search workouts or exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Grid / Table toggle */}
            <div className={styles.viewToggle}>
              <button
                className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.active : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <SquaresFour size={18} weight="duotone" />
              </button>
              <button
                className={`${styles.toggleBtn} ${viewMode === 'table' ? styles.active : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <List size={18} weight="duotone" />
              </button>
            </div>

            <button className="btn secondary" onClick={handleSyncCloudinary} disabled={syncing} title="Sync Cloudinary videos & metadata directly into Firestore">
              <CloudArrowUp size={18} weight="duotone" /> {syncing ? 'Syncing...' : 'Sync Cloudinary Videos'}
            </button>

            <button className="btn primary" onClick={handleOpenCreate}>
              <Plus size={18} weight="bold" /> Create Workout
            </button>
          </div>
        </div>

        {/* Category & Level Chips */}
        <div className={styles.chipRow}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`${styles.filterChip} ${selectedCategory === cat ? styles.active : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}

          <div style={{ marginLeft: 'auto' }}>
            <select
              className={styles.selectFilter}
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              {DIFFICULTIES.map((diff) => (
                <option key={diff} value={diff}>
                  {diff}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── 3. Content View (Grid or Table) ── */}
      {loading ? (
        <div className={styles.emptyState}>Loading workouts from Firestore...</div>
      ) : filteredWorkouts.length === 0 ? (
        <div className={styles.emptyState}>
          <PersonSimpleRun size={40} weight="duotone" />
          <p>No workouts match your current filters.</p>
          <button className="btn secondary" onClick={handleOpenCreate}>
            Create New Workout
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── GRID CARDS VIEW ── */
        <div className={styles.cardsGrid}>
          {filteredWorkouts.map((workout) => {
            const exList = workout.exerciseDetails || [];
            const displayExercises = exList.length > 0 ? exList.map((e) => e.name) : workout.exercises || [];

            return (
              <div
                key={workout.id}
                className={styles.workoutCard}
                onClick={() => setViewingWorkout(workout)}
                style={{ cursor: 'pointer' }}
              >
                {/* Cover Image Banner */}
                <div
                  className={styles.cardHeader}
                  style={{ backgroundImage: `url(${workout.imageUrl})` }}
                >
                  <div className={styles.cardHeaderOverlay} />
                  <div className={styles.cardBadges}>
                    <span className={styles.badgeCategory}>{workout.category || 'Full Body'}</span>
                    <span className={styles.badgeLevel}>{workout.difficulty || 'Intermediate'}</span>
                  </div>

                  <div className={styles.cardHeaderFooter}>
                    <h3 className={styles.cardTitle}>{workout.title}</h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className={styles.cardBody}>
                  <div className={styles.metaPills}>
                    <span className={styles.metaItem}>
                      <Clock size={16} weight="duotone" style={{ color: '#3b82f6' }} />
                      {workout.duration || '30 min'}
                    </span>
                    <span className={styles.metaItem}>
                      <Flame size={16} weight="duotone" style={{ color: '#f97316' }} />
                      {workout.calories ? `${workout.calories} kcal` : '220 kcal'}
                    </span>
                    <span className={styles.metaItem}>
                      <Barbell size={16} weight="duotone" style={{ color: '#8b5cf6' }} />
                      {displayExercises.length} Exercises
                    </span>
                  </div>

                  {/* Exercises Tags Preview */}
                  <div className={styles.exercisesPreview}>
                    <span className={styles.previewLabel}>Exercises Included:</span>
                    <div className={styles.chipsContainer}>
                      {displayExercises.slice(0, 3).map((exName, idx) => (
                        <span key={idx} className={styles.exChip}>
                          {exName}
                        </span>
                      ))}
                      {displayExercises.length > 3 && (
                        <span className={styles.exChip}>+{displayExercises.length - 3} more</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className={styles.cardFooter}>
                  <span className={styles.clickHint}>Click to view details</span>

                  <div className={styles.cardActions}>
                    <button
                      className={styles.iconBtn}
                      title="Duplicate Workout"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateWorkout(workout);
                      }}
                    >
                      <Copy size={18} weight="duotone" />
                    </button>
                    <button
                      className={styles.iconBtn}
                      title="Edit Workout"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(workout);
                      }}
                    >
                      <PencilSimple size={18} weight="duotone" />
                    </button>
                    <button
                      className={`${styles.iconBtn} ${styles.dangerIcon}`}
                      title="Delete Workout"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWorkout(workout.id);
                      }}
                    >
                      <Trash size={18} weight="duotone" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── TABLE VIEW ── */
        <div className={tableStyles.tableContainer}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Workout Title</th>
                <th>Category</th>
                <th>Duration</th>
                <th>Difficulty</th>
                <th>Exercises Included</th>
                <th>Status</th>
                <th className={tableStyles.actionsColumn}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkouts.map((workout) => {
                const exCount = workout.exerciseDetails?.length || workout.exercises?.length || 0;
                return (
                  <tr
                    key={workout.id}
                    onClick={() => setViewingWorkout(workout)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className={tableStyles.userInfo}>
                        <img
                          src={workout.imageUrl}
                          alt={workout.title}
                          className={tableStyles.avatar}
                          style={{ objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600 }}>{workout.title}</div>
                          <span className={tableStyles.emailText}>{workout.author || 'Admin'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={tableStyles.badge}>{workout.category || 'Full Body'}</span>
                    </td>
                    <td>
                      <span className={tableStyles.dateText}>{workout.duration || '30 min'}</span>
                    </td>
                    <td>
                      <span className={tableStyles.badge}>{workout.difficulty || 'Intermediate'}</span>
                    </td>
                    <td>
                      <span className={tableStyles.dateText}>{exCount} items</span>
                    </td>
                    <td>
                      <span
                        className={tableStyles.badge}
                        style={{
                          background:
                            workout.status === 'Draft'
                              ? 'var(--color-warning-bg)'
                              : 'var(--color-success-bg)',
                          color:
                            workout.status === 'Draft'
                              ? 'var(--color-warning)'
                              : 'var(--color-success)',
                        }}
                      >
                        {workout.status || 'Active'}
                      </span>
                    </td>
                    <td className={tableStyles.actionsColumn}>
                      <div className={tableStyles.actions}>
                        <button
                          className={tableStyles.iconBtn}
                          title="View Workout Details"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingWorkout(workout);
                          }}
                        >
                          <Eye size={18} weight="duotone" />
                        </button>
                        <button
                          className={tableStyles.iconBtn}
                          title="Duplicate"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateWorkout(workout);
                          }}
                        >
                          <Copy size={18} weight="duotone" />
                        </button>
                        <button
                          className={tableStyles.iconBtn}
                          title="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(workout);
                          }}
                        >
                          <PencilSimple size={18} weight="duotone" />
                        </button>
                        <button
                          className={tableStyles.iconBtn}
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWorkout(workout.id);
                          }}
                        >
                          <Trash size={18} weight="duotone" className={tableStyles.dangerIcon} />
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

      {/* SlideOver Drawer for Create & Edit Workout */}
      <SlideOver
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingWorkout ? 'Edit Workout Routine' : 'Create New Workout'}
      >
        <WorkoutForm
          initialData={editingWorkout}
          onCancel={() => setIsDrawerOpen(false)}
          onSubmit={handleSaveWorkout}
        />
      </SlideOver>

      {/* Workout Detail Modal */}
      {viewingWorkout && (
        <WorkoutDetailModal
          workout={viewingWorkout}
          onClose={() => setViewingWorkout(null)}
          onEdit={(w) => handleOpenEdit(w)}
          onWorkoutUpdated={() => fetchWorkoutsData()}
        />
      )}
    </div>
  );
};

export default WorkoutsList;
