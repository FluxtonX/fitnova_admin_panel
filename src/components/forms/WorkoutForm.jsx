import React, { useState, useEffect } from 'react';
import {
  FloppyDisk,
  Plus,
  Trash,
  ArrowUp,
  ArrowDown,
  Barbell,
  Sparkle,
  ListPlus,
  Video,
} from '@phosphor-icons/react';
import { getExercises } from '../../services/firebase/exerciseService';
import presetVideos from '../../services/firebase/cloudinaryPresetVideos.json';
import styles from './WorkoutForm.module.css';

const PRESET_THUMBNAILS = [
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80',
];

const WorkoutForm = ({ initialData = null, onSubmit, onCancel }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [libraryExercises, setLibraryExercises] = useState([]);

  useEffect(() => {
    // Fetch live exercise documents directly from Firebase Firestore
    getExercises()
      .then((docs) => {
        if (docs && docs.length > 0) {
          setLibraryExercises(docs);
        }
      })
      .catch((err) => {
        console.warn('Using preset library fallback for exercises:', err);
      });
  }, []);

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    category: initialData?.category || 'Full Body',
    duration: initialData?.duration ? parseInt(initialData.duration) || 30 : 30,
    difficulty: initialData?.difficulty || 'Intermediate',
    calories: initialData?.calories || 250,
    imageUrl: initialData?.imageUrl || PRESET_THUMBNAILS[0],
    description: initialData?.description || '',
    status: initialData?.status || 'Active',
    author: initialData?.author || 'Admin',
  });

  const [exerciseDetails, setExerciseDetails] = useState(
    initialData?.exerciseDetails?.length > 0
      ? initialData.exerciseDetails
      : [
          {
            order: 1,
            name: 'Wide Hand Push-up',
            videoAsset: 'https://res.cloudinary.com/ncjlij4d/video/upload/v1784724361/fitnova/exercises/videos/Wide-Hand-Push-up_Chest_fj6geh.mp4',
            thumbnailAsset: 'https://res.cloudinary.com/ncjlij4d/video/upload/v1784724361/fitnova/exercises/videos/Wide-Hand-Push-up_Chest_fj6geh.jpg',
            sets: [
              { set: 1, instruction: '12 Reps' },
              { set: 2, instruction: '12 Reps' },
              { set: 3, instruction: '10 Reps' },
            ],
          },
        ]
  );

  const [searchExercise, setSearchExercise] = useState('');
  const [customExerciseName, setCustomExerciseName] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };



  // Add custom exercise
  const handleAddCustomExercise = () => {
    if (!customExerciseName.trim()) return;
    const newEx = {
      order: exerciseDetails.length + 1,
      name: customExerciseName.trim(),
      videoAsset: '',
      thumbnailAsset: '',
      sets: [
        { set: 1, instruction: '12 Reps' },
        { set: 2, instruction: '12 Reps' },
        { set: 3, instruction: '10 Reps' },
      ],
    };
    setExerciseDetails((prev) => [...prev, newEx]);
    setCustomExerciseName('');
    recalculateDurationAndCalories([...exerciseDetails, newEx]);
  };

  const handleRemoveExercise = (index) => {
    const updated = exerciseDetails.filter((_, i) => i !== index);
    const reordered = updated.map((item, idx) => ({ ...item, order: idx + 1 }));
    setExerciseDetails(reordered);
    recalculateDurationAndCalories(reordered);
  };

  const handleMoveExercise = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= exerciseDetails.length) return;
    const copy = [...exerciseDetails];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    const reordered = copy.map((item, idx) => ({ ...item, order: idx + 1 }));
    setExerciseDetails(reordered);
  };

  const handleUpdateExerciseName = (index, value) => {
    setExerciseDetails((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], name: value };
      return copy;
    });
  };

  const handleAddSet = (exIndex) => {
    setExerciseDetails((prev) => {
      const copy = [...prev];
      const ex = copy[exIndex];
      const nextSetNum = (ex.sets?.length || 0) + 1;
      const updatedSets = [...(ex.sets || []), { set: nextSetNum, instruction: '10 Reps' }];
      copy[exIndex] = { ...ex, sets: updatedSets };
      return copy;
    });
  };

  const handleRemoveSet = (exIndex, setIndex) => {
    setExerciseDetails((prev) => {
      const copy = [...prev];
      const ex = copy[exIndex];
      const filteredSets = ex.sets.filter((_, i) => i !== setIndex);
      const renumberedSets = filteredSets.map((s, i) => ({ ...s, set: i + 1 }));
      copy[exIndex] = { ...ex, sets: renumberedSets };
      return copy;
    });
  };

  const handleUpdateSetInstruction = (exIndex, setIndex, val) => {
    setExerciseDetails((prev) => {
      const copy = [...prev];
      const ex = copy[exIndex];
      const updatedSets = [...ex.sets];
      updatedSets[setIndex] = { ...updatedSets[setIndex], instruction: val };
      copy[exIndex] = { ...ex, sets: updatedSets };
      return copy;
    });
  };

  const recalculateDurationAndCalories = (exercisesList) => {
    // Estimate ~4 mins & ~40 kcal per exercise
    const estMin = Math.max(10, exercisesList.length * 4);
    const estCal = Math.max(80, exercisesList.length * 45);
    setFormData((prev) => ({
      ...prev,
      duration: estMin,
      calories: estCal,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a workout title');
      return;
    }

    const payload = {
      ...formData,
      exerciseDetails,
      exercises: exerciseDetails.map((e) => e.name),
    };

    if (onSubmit) onSubmit(payload);
  };

  const handleAddPresetExercise = (item) => {
    const rawName = item.name || item.title || 'Exercise';
    const cleanTitle = rawName
      .replace(/\.mp4$/i, '')
      .replace(/_.*$/, '')
      .replace(/-(female|male)/gi, '')
      .replace(/-(version-\d*|FIX\d*)/gi, '')
      .replace(/-/g, ' ')
      .trim()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    const videoAsset = item.videoUrl || item.videoAsset || item.secure_url || '';
    const thumbnailAsset = item.thumbnailUrl || item.thumbnailAsset || (typeof videoAsset === 'string' ? videoAsset.replace(/\.mp4$/i, '.jpg') : '');

    const newEx = {
      order: exerciseDetails.length + 1,
      name: cleanTitle,
      videoAsset,
      thumbnailAsset,
      sets: [
        { set: 1, instruction: '12 Reps' },
        { set: 2, instruction: '12 Reps' },
        { set: 3, instruction: '10 Reps' },
      ],
    };

    const updated = [...exerciseDetails, newEx];
    setExerciseDetails(updated);
    recalculateDurationAndCalories(updated);
  };

  // Dynamic exercise source: Live Firebase Firestore exercises OR uploaded preset videos
  const availableSource = libraryExercises.length > 0 ? libraryExercises : presetVideos;

  const filteredPresets = availableSource
    .filter((v) => v.name || v.title)
    .filter((v) => (v.name || v.title).toLowerCase().includes(searchExercise.toLowerCase()))
    .slice(0, 24);

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit}>
      {/* Navigation Tabs */}
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'details' ? styles.active : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <Sparkle size={16} weight="bold" /> Workout Info
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'exercises' ? styles.active : ''}`}
          onClick={() => setActiveTab('exercises')}
        >
          <Barbell size={16} weight="bold" /> Exercises List
          <span className={styles.badgeCount}>{exerciseDetails.length}</span>
        </button>
      </div>

      {/* TAB 1: Workout Info */}
      {activeTab === 'details' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Workout Title *</label>
            <input
              type="text"
              name="title"
              className={styles.input}
              placeholder="e.g. 30 Min Full Body Burn"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Category</label>
              <select name="category" className={styles.select} value={formData.category} onChange={handleChange}>
                <option value="Full Body">Full Body</option>
                <option value="Strength">Strength</option>
                <option value="HIIT">HIIT</option>
                <option value="Cardio">Cardio</option>
                <option value="Core">Core</option>
                <option value="Yoga">Yoga</option>
                <option value="Pilates">Pilates</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Difficulty Level</label>
              <select name="difficulty" className={styles.select} value={formData.difficulty} onChange={handleChange}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Est. Duration (minutes)</label>
              <input
                type="number"
                name="duration"
                className={styles.input}
                value={formData.duration}
                onChange={handleChange}
                min="1"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Est. Calories (kcal)</label>
              <input
                type="number"
                name="calories"
                className={styles.input}
                value={formData.calories}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Cover Image URL</label>
            <input
              type="text"
              name="imageUrl"
              className={styles.input}
              placeholder="https://..."
              value={formData.imageUrl}
              onChange={handleChange}
            />
            <div className={styles.presetImages}>
              {PRESET_THUMBNAILS.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Thumbnail ${i + 1}`}
                  className={`${styles.presetThumb} ${formData.imageUrl === url ? styles.selected : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, imageUrl: url }))}
                />
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Workout Description</label>
            <textarea
              name="description"
              className={styles.textarea}
              placeholder="Describe the workout routine, targeted muscles, and goals..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Publish Status</label>
            <select name="status" className={styles.select} value={formData.status} onChange={handleChange}>
              <option value="Active">Active (Published to App)</option>
              <option value="Draft">Draft (Hidden)</option>
            </select>
          </div>
        </div>
      )}

      {/* TAB 2: Exercises inside Workout */}
      {activeTab === 'exercises' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Quick Picker Bar */}
          <div className={styles.addExerciseBar}>
            <div className={styles.pickerHeader}>
              <ListPlus size={18} /> Quick Add Exercise from Library:
            </div>
            <input
              type="text"
              placeholder="Search exercise library..."
              className={styles.input}
              value={searchExercise}
              onChange={(e) => setSearchExercise(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem' }}
            />
            <div className={styles.pickerList}>
              {filteredPresets.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles.pickerChip}
                  onClick={() => handleAddPresetExercise(item)}
                  title="Click to add exercise to workout"
                >
                  <Plus size={12} weight="bold" />
                  {item.name.replace(/\.mp4$/i, '').replace(/_.*$/, '').replace(/-/g, ' ')}
                </button>
              ))}
            </div>

            {/* Custom Entry */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <input
                type="text"
                placeholder="Or type custom exercise name..."
                className={styles.input}
                value={customExerciseName}
                onChange={(e) => setCustomExerciseName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomExercise();
                  }
                }}
                style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem' }}
              />
              <button
                type="button"
                className="btn secondary"
                onClick={handleAddCustomExercise}
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', whiteSpace: 'nowrap' }}
              >
                <Plus size={14} /> Add Custom
              </button>
            </div>
          </div>

          {/* Added Exercises List */}
          {exerciseDetails.length === 0 ? (
            <div className={styles.emptyExercises}>
              <Barbell size={32} weight="duotone" />
              <p>No exercises added yet. Use the library above to add exercises to this workout.</p>
            </div>
          ) : (
            <div className={styles.exerciseList}>
              {exerciseDetails.map((ex, index) => (
                <div key={index} className={styles.exerciseCard}>
                  <div className={styles.exerciseHeader}>
                    <div className={styles.exerciseMeta}>
                      <span className={styles.exerciseNumber}>{index + 1}</span>
                      <input
                        type="text"
                        className={styles.exerciseNameInput}
                        value={ex.name}
                        onChange={(e) => handleUpdateExerciseName(index, e.target.value)}
                      />
                      {ex.videoAsset && (
                        <span title="Video attached" style={{ color: '#10b981', display: 'flex', alignItems: 'center' }}>
                          <Video size={16} weight="duotone" />
                        </span>
                      )}
                    </div>

                    <div className={styles.exerciseActions}>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => handleMoveExercise(index, -1)}
                        disabled={index === 0}
                        title="Move Up"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => handleMoveExercise(index, 1)}
                        disabled={index === exerciseDetails.length - 1}
                        title="Move Down"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.iconBtn} ${styles.dangerIcon}`}
                        onClick={() => handleRemoveExercise(index)}
                        title="Remove from Workout"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Sets Breakdown */}
                  <div className={styles.setsContainer}>
                    {ex.sets?.map((setObj, setIdx) => (
                      <div key={setIdx} className={styles.setRow}>
                        <span className={styles.setTag}>Set {setObj.set || setIdx + 1}</span>
                        <input
                          type="text"
                          className={styles.setInput}
                          value={setObj.instruction || ''}
                          onChange={(e) => handleUpdateSetInstruction(index, setIdx, e.target.value)}
                          placeholder="e.g. 12 Reps or 45 Sec"
                        />
                        {ex.sets.length > 1 && (
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => handleRemoveSet(index, setIdx)}
                            title="Remove Set"
                          >
                            <Trash size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" className={styles.addSetBtn} onClick={() => handleAddSet(index)}>
                      <Plus size={14} /> Add Set
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Form Action Footer */}
      <div className={styles.formActions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={styles.submitBtn}>
          <FloppyDisk size={20} weight="duotone" />
          Save Workout & Exercises
        </button>
      </div>
    </form>
  );
};

export default WorkoutForm;
