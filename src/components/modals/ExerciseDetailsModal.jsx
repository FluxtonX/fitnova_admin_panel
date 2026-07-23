import React from 'react';
import { X, PencilSimple, Copy, Trash, Flame, Clock, Barbell, Lightning, Star, Play, Check } from '@phosphor-icons/react';
import styles from './ExerciseDetailsModal.module.css';

const ExerciseDetailsModal = ({
  isOpen = false,
  exercise = null,
  onClose = () => {},
  onEdit = () => {},
  onDuplicate = () => {},
  onDelete = () => {},
}) => {
  if (!isOpen || !exercise) return null;

  const extractUrl = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val.trim();
    if (typeof val === 'object') return val.secure_url || val.url || val.videoUrl || val.videoAsset || '';
    return '';
  };

  const videoUrl = extractUrl(exercise.video || exercise.videoUrl || exercise.videoAsset || exercise.video_url || exercise.mediaUrl);
  const thumbnailUrl = extractUrl(exercise.thumbnail || exercise.thumbnailUrl || exercise.thumbnailAsset || exercise.thumbnail_url);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>

        {/* Header Bar */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <span className={`${styles.statusBadge} ${styles[(exercise.status || 'Active').toLowerCase()]}`}>
              {exercise.status || 'Active'}
            </span>
            {exercise.featured && (
              <span className={styles.featuredBadge}>
                <Star size={14} weight="fill" /> Featured
              </span>
            )}
            <h2 className={styles.exerciseTitle}>{exercise.name}</h2>
          </div>

          <button className={styles.closeBtn} onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          {/* Media Player Section */}
          <div className={styles.mediaContainer}>
            {videoUrl ? (
              <video src={videoUrl} controls autoPlay loop muted playsInline className={styles.mediaContent} />
            ) : thumbnailUrl ? (
              <img src={thumbnailUrl} alt={exercise.name} className={styles.mediaContent} />
            ) : (
              <div className={styles.noMediaPlaceholder}>
                <Barbell size={48} weight="duotone" />
                <p>No video or thumbnail uploaded</p>
              </div>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <Barbell size={22} weight="duotone" className={styles.metricIcon} />
              <div>
                <span className={styles.metricLabel}>Equipment</span>
                <span className={styles.metricValue}>{exercise.equipment || 'None'}</span>
              </div>
            </div>

            <div className={styles.metricCard}>
              <Lightning size={22} weight="duotone" className={styles.metricIcon} style={{ color: '#8b5cf6' }} />
              <div>
                <span className={styles.metricLabel}>Difficulty</span>
                <span className={styles.metricValue}>{exercise.difficulty || 'Beginner'}</span>
              </div>
            </div>

            <div className={styles.metricCard}>
              <Clock size={22} weight="duotone" className={styles.metricIcon} style={{ color: '#3b82f6' }} />
              <div>
                <span className={styles.metricLabel}>Duration / Sets</span>
                <span className={styles.metricValue}>{exercise.sets || 3} sets × {exercise.reps || 10} reps</span>
              </div>
            </div>

            <div className={styles.metricCard}>
              <Flame size={22} weight="duotone" className={styles.metricIcon} style={{ color: '#f97316' }} />
              <div>
                <span className={styles.metricLabel}>Calories Burned</span>
                <span className={styles.metricValue}>{exercise.calories || 0} kcal</span>
              </div>
            </div>
          </div>

          {/* Muscle & Category Info */}
          <div className={styles.infoSection}>
            <div className={styles.infoGroup}>
              <span className={styles.sectionLabel}>Category & Muscles</span>
              <div className={styles.tagWrap}>
                <span className={styles.primaryTag}>{exercise.category || 'Full Body'}</span>
                <span className={styles.tag}>Primary: {exercise.primaryMuscle || 'Full Body'}</span>
                {exercise.secondaryMuscle && <span className={styles.subTag}>Secondary: {exercise.secondaryMuscle}</span>}
                <span className={styles.subTag}>Rest: {exercise.restTime || 30}s</span>
              </div>
            </div>

            {exercise.description && (
              <div className={styles.infoGroup}>
                <span className={styles.sectionLabel}>Description</span>
                <p className={styles.textBlock}>{exercise.description}</p>
              </div>
            )}

            {exercise.instructions && (
              <div className={styles.infoGroup}>
                <span className={styles.sectionLabel}>Instructions</span>
                <p className={styles.textBlock}>{exercise.instructions}</p>
              </div>
            )}

            {exercise.benefits && (
              <div className={styles.infoGroup}>
                <span className={styles.sectionLabel}>Benefits</span>
                <p className={styles.textBlock}>{exercise.benefits}</p>
              </div>
            )}

            {exercise.tips && (
              <div className={styles.infoGroup}>
                <span className={styles.sectionLabel}>Pro Tips</span>
                <p className={styles.textBlock}>{exercise.tips}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
          <div className={styles.leftFooter}>
            <button className={styles.secondaryBtn} onClick={() => onDuplicate(exercise)}>
              <Copy size={16} weight="bold" /> Duplicate
            </button>
            <button className={`${styles.secondaryBtn} ${styles.danger}`} onClick={() => onDelete(exercise)}>
              <Trash size={16} weight="bold" /> Delete
            </button>
          </div>

          <button className={styles.primaryBtn} onClick={() => onEdit(exercise)}>
            <PencilSimple size={16} weight="bold" /> Edit Exercise
          </button>
        </div>

      </div>
    </div>
  );
};

export default ExerciseDetailsModal;
