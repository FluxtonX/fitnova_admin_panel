import React from 'react';
import {
  X,
  Trophy,
  Clock,
  Star,
  Users,
  Target,
  PencilSimple,
  Trash,
  CheckCircle,
} from '@phosphor-icons/react';
import { CATEGORY_IMAGES } from '../../services/firebase/challengeService';
import styles from './ChallengeDetailModal.module.css';

const ChallengeDetailModal = ({ challenge, onClose, onEdit, onDelete }) => {
  if (!challenge) return null;

  const categoryKey = challenge.type || challenge.category || 'complete_workouts';
  const coverImage =
    challenge.imageUrl ||
    challenge.bannerUrl ||
    CATEGORY_IMAGES[categoryKey] ||
    CATEGORY_IMAGES.complete_workouts;

  const rulesList = Array.isArray(challenge.rules)
    ? challenge.rules
    : (challenge.rules || '').split('\n').filter(Boolean);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Banner Header Image */}
        <div
          className={styles.imageBanner}
          style={{ backgroundImage: `url(${coverImage})` }}
        >
          <div className={styles.overlay} />
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} weight="bold" />
          </button>

          <div className={styles.bannerInfo}>
            <div className={styles.badges}>
              <span className={styles.categoryBadge}>
                {(challenge.type || 'WORKOUTS').replace('_', ' ').toUpperCase()}
              </span>
              <span
                className={`${styles.statusBadge} ${
                  styles[(challenge.status || 'active').toLowerCase()]
                }`}
              >
                {challenge.status || 'active'}
              </span>
              {challenge.isFeatured && (
                <span className={styles.featuredBadge}>
                  <Star size={14} weight="fill" color="#fbbf24" /> Featured
                </span>
              )}
            </div>
            <h2 className={styles.title}>{challenge.title}</h2>
          </div>
        </div>

        {/* Modal Body */}
        <div className={styles.body}>
          {/* Stats Row */}
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <Target size={20} weight="duotone" className={styles.iconBlue} />
              <div>
                <span className={styles.statLabel}>Target Goal</span>
                <span className={styles.statVal}>
                  {challenge.targetValue || 10} {challenge.unit || 'units'}
                </span>
              </div>
            </div>

            <div className={styles.statItem}>
              <Clock size={20} weight="duotone" className={styles.iconPurple} />
              <div>
                <span className={styles.statLabel}>Duration</span>
                <span className={styles.statVal}>
                  {challenge.durationDays || 7} Days
                </span>
              </div>
            </div>

            <div className={styles.statItem}>
              <Trophy size={20} weight="duotone" className={styles.iconGold} />
              <div>
                <span className={styles.statLabel}>Reward Points</span>
                <span className={styles.statVal}>
                  +{challenge.rewardPoints || 500} pts
                </span>
              </div>
            </div>

            <div className={styles.statItem}>
              <Users size={20} weight="duotone" className={styles.iconGreen} />
              <div>
                <span className={styles.statLabel}>Mode</span>
                <span className={styles.statVal}>
                  {challenge.challengeMode || 'Community'}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {challenge.description && (
            <div className={styles.section}>
              <h4>About Challenge</h4>
              <p>{challenge.description}</p>
            </div>
          )}

          {/* Goal Statement */}
          {challenge.goal && (
            <div className={styles.section}>
              <h4>Goal Statement</h4>
              <p className={styles.goalText}>{challenge.goal}</p>
            </div>
          )}

          {/* Rules */}
          {rulesList.length > 0 && (
            <div className={styles.section}>
              <h4>Challenge Rules</h4>
              <ul className={styles.rulesList}>
                {rulesList.map((rule, idx) => (
                  <li key={idx}>
                    <CheckCircle size={16} weight="fill" className={styles.checkIcon} />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Badge Name */}
          {challenge.badgeName && (
            <div className={styles.badgeSection}>
              <Trophy size={20} weight="fill" color="#fbbf24" />
              <span>
                Completion Badge: <strong>{challenge.badgeName}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={styles.footer}>
          <button
            className={`${styles.footerBtn} ${styles.dangerBtn}`}
            onClick={() => {
              onClose();
              onDelete(challenge);
            }}
          >
            <Trash size={16} weight="duotone" /> Delete
          </button>
          <div className={styles.footerRight}>
            <button className="btn secondary" onClick={onClose}>
              Close
            </button>
            <button
              className="btn primary"
              onClick={() => {
                onClose();
                onEdit(challenge);
              }}
            >
              <PencilSimple size={16} weight="bold" /> Edit Challenge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeDetailModal;
