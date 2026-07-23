import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Flame,
  Barbell,
  PersonSimpleRun,
  Video,
  Play,
  Plus,
  Trash,
  CloudArrowUp,
  Spinner,
} from '@phosphor-icons/react';
import VideoPlayerModal from '../../components/modals/VideoPlayerModal';
import { uploadToCloudinary } from '../../services/cloudinary/cloudinaryService';
import {
  addExerciseToWorkout,
  removeExerciseFromWorkout,
} from '../../services/firebase/workoutService';
import styles from './WorkoutDetailModal.module.css';

const WorkoutDetailModal = ({ workout, onClose, onEdit, onWorkoutUpdated }) => {
  const [currentWorkout, setCurrentWorkout] = useState(workout);
  const [activeVideo, setActiveVideo] = useState(null);

  // Upload new video form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [exerciseTitle, setExerciseTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Deleting exercise state
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    setCurrentWorkout(workout);
  }, [workout]);

  if (!currentWorkout) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!exerciseTitle.trim()) {
        const cleanName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());
        setExerciseTitle(cleanName);
      }
    }
  };

  const handleUploadAndAddVideo = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a video file to upload.');
      return;
    }
    if (!exerciseTitle.trim()) {
      alert('Please enter an exercise title.');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setStatusMsg('Uploading video to Cloudinary...');

      // 1. Upload to Cloudinary
      const uploadRes = await uploadToCloudinary(selectedFile, 'video', (percent) => {
        setUploadProgress(percent);
      });

      setStatusMsg('Saving metadata to Firebase...');

      // 2. Add to Workout document in Firestore
      const updatedWorkout = await addExerciseToWorkout(currentWorkout.id, {
        name: exerciseTitle,
        videoUrl: uploadRes.secure_url,
        videoPublicId: uploadRes.public_id,
        thumbnailUrl: uploadRes.secure_url.replace(/\.mp4$/i, '.jpg'),
        isCustomUpload: true,
      });

      setCurrentWorkout(updatedWorkout);
      setShowAddForm(false);
      setSelectedFile(null);
      setExerciseTitle('');
      setUploadProgress(0);
      setStatusMsg('Video successfully added!');

      if (onWorkoutUpdated) onWorkoutUpdated(updatedWorkout);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      console.error('Failed to upload & add video:', err);
      alert(`Error uploading video: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteExercise = async (index, exerciseItem) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${exerciseItem.name}"?\nThis will remove the video from Cloudinary and clean up metadata from Firebase.`
    );
    if (!confirmDelete) return;

    try {
      setDeletingIndex(index);
      setStatusMsg('Deleting video from Cloudinary & Firebase...');

      const updatedWorkout = await removeExerciseFromWorkout(
        currentWorkout.id,
        index,
        exerciseItem
      );

      setCurrentWorkout(updatedWorkout);
      setStatusMsg('Exercise video deleted successfully!');
      if (onWorkoutUpdated) onWorkoutUpdated(updatedWorkout);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      console.error('Failed to delete exercise:', err);
      alert(`Failed to delete exercise: ${err.message}`);
    } finally {
      setDeletingIndex(null);
    }
  };

  const exerciseDetails = currentWorkout.exerciseDetails || [];

  return (
    <>
      <div className={styles.backdrop} onClick={onClose}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          {/* Header Image banner */}
          <div className={styles.imageBanner} style={{ backgroundImage: `url(${currentWorkout.imageUrl})` }}>
            <div className={styles.overlay} />
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={20} weight="bold" />
            </button>

            <div className={styles.bannerInfo}>
              <div className={styles.badges}>
                <span className={styles.categoryBadge}>{currentWorkout.category || 'Full Body'}</span>
                <span className={`${styles.levelBadge} ${styles[currentWorkout.difficulty?.toLowerCase() || 'intermediate']}`}>
                  {currentWorkout.difficulty || 'Intermediate'}
                </span>
              </div>
              <h2 className={styles.title}>{currentWorkout.title}</h2>
            </div>
          </div>

          {/* Status Message Notification */}
          {statusMsg && <div className={styles.statusBanner}>{statusMsg}</div>}

          {/* Modal Body */}
          <div className={styles.body}>
            {/* Quick Stats Grid */}
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <Clock size={20} weight="duotone" className={styles.iconBlue} />
                <div>
                  <span className={styles.statLabel}>Duration</span>
                  <span className={styles.statVal}>{currentWorkout.duration || '30 min'}</span>
                </div>
              </div>

              <div className={styles.statItem}>
                <Flame size={20} weight="duotone" className={styles.iconOrange} />
                <div>
                  <span className={styles.statLabel}>Calories</span>
                  <span className={styles.statVal}>{currentWorkout.calories ? `${currentWorkout.calories} kcal` : '250 kcal'}</span>
                </div>
              </div>

              <div className={styles.statItem}>
                <Barbell size={20} weight="duotone" className={styles.iconPurple} />
                <div>
                  <span className={styles.statLabel}>Exercises</span>
                  <span className={styles.statVal}>
                    {exerciseDetails.length} items
                  </span>
                </div>
              </div>

              <div className={styles.statItem}>
                <PersonSimpleRun size={20} weight="duotone" className={styles.iconGreen} />
                <div>
                  <span className={styles.statLabel}>Author</span>
                  <span className={styles.statVal}>{currentWorkout.author || 'Fitnova Team'}</span>
                </div>
              </div>
            </div>

            {currentWorkout.description && (
              <div className={styles.descriptionSection}>
                <h4>Description</h4>
                <p>{currentWorkout.description}</p>
              </div>
            )}

            {/* Exercises Section */}
            <div className={styles.exercisesSection}>
              <div className={styles.exercisesHeaderRow}>
                <h4>Exercises Routine ({exerciseDetails.length})</h4>
                <button
                  type="button"
                  className={styles.addVideoBtn}
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  <Plus size={16} weight="bold" /> {showAddForm ? 'Cancel' : 'Upload New Video'}
                </button>
              </div>

              {/* Upload Form Box */}
              {showAddForm && (
                <form onSubmit={handleUploadAndAddVideo} className={styles.addVideoForm}>
                  <div className={styles.addVideoTitle}>
                    <Video size={18} weight="duotone" />
                    <span>Upload New Exercise Video to this Workout</span>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label>Exercise Title / Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Dumbbell Shoulder Press"
                      value={exerciseTitle}
                      onChange={(e) => setExerciseTitle(e.target.value)}
                      disabled={uploading}
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label>Select Video File (MP4, MOV, WebM) *</label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                      disabled={uploading}
                      required
                    />
                  </div>

                  {uploading && (
                    <div className={styles.progressBox}>
                      <div className={styles.progressTrack}>
                        <div className={styles.progressBar} style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <span className={styles.progressText}>
                        <CloudArrowUp size={16} weight="bold" /> {uploadProgress}% Uploaded to Cloudinary
                      </span>
                    </div>
                  )}

                  <div className={styles.formBtnRow}>
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => setShowAddForm(false)}
                      disabled={uploading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn primary"
                      disabled={uploading || !selectedFile || !exerciseTitle.trim()}
                    >
                      {uploading ? (
                        <>
                          <Spinner size={16} className="animate-spin" /> Uploading...
                        </>
                      ) : (
                        'Upload & Save Video'
                      )}
                    </button>
                  </div>
                </form>
              )}

              {exerciseDetails.length > 0 ? (
                <div className={styles.exercisesList}>
                  {exerciseDetails.map((ex, i) => (
                    <div key={i} className={styles.exerciseCard}>
                      <div className={styles.exOrder}>{ex.order || i + 1}</div>

                      <div className={styles.exInfo}>
                        <div className={styles.exTitleRow}>
                          <span className={styles.exName}>{ex.name}</span>

                          <div className={styles.exActionButtons}>
                            {(ex.videoAsset || ex.videoUrl) && (
                              <button
                                type="button"
                                className={styles.videoLink}
                                onClick={() =>
                                  setActiveVideo({
                                    title: ex.name,
                                    url: ex.videoAsset || ex.videoUrl,
                                    poster: ex.thumbnailAsset || ex.thumbnailUrl,
                                  })
                                }
                                title="Play Exercise Video inside Admin Panel"
                              >
                                <Play size={14} weight="fill" /> Play Video
                              </button>
                            )}

                            <button
                              type="button"
                              className={styles.deleteExBtn}
                              onClick={() => handleDeleteExercise(i, ex)}
                              disabled={deletingIndex === i}
                              title="Delete from Cloudinary & Firebase metadata"
                            >
                              {deletingIndex === i ? (
                                <span className={styles.deletingSpinner}>Deleting...</span>
                              ) : (
                                <>
                                  <Trash size={14} weight="duotone" /> Delete
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Sets list */}
                        {ex.sets?.length > 0 && (
                          <div className={styles.setsChips}>
                            {ex.sets.map((set, sIdx) => (
                              <span key={sIdx} className={styles.setChip}>
                                Set {set.set || sIdx + 1}: {set.instruction || '10 Reps'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.noExercises}>No exercise details registered for this workout routine.</p>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className={styles.footer}>
            <button className="btn secondary" onClick={onClose}>
              Close
            </button>
            <button
              className="btn primary"
              onClick={() => {
                onClose();
                if (onEdit) onEdit(currentWorkout);
              }}
            >
              Edit Workout
            </button>
          </div>
        </div>
      </div>

      {/* Video Player Modal */}
      {activeVideo && (
        <VideoPlayerModal
          title={activeVideo.title}
          videoUrl={activeVideo.url}
          posterUrl={activeVideo.poster}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </>
  );
};

export default WorkoutDetailModal;
