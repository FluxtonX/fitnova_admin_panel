import React from 'react';
import { Warning, Trash, Check, X } from '@phosphor-icons/react';
import styles from './ConfirmModal.module.css';

const ConfirmModal = ({
  isOpen = false,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  confirmVariant = 'danger', // 'danger' | 'primary'
  loading = false,
  onConfirm = () => {},
  onClose = () => {},
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} title="Close">
          <X size={18} />
        </button>

        <div className={`${styles.iconWrap} ${styles[confirmVariant]}`}>
          {confirmVariant === 'danger' ? (
            <Trash size={28} weight="duotone" />
          ) : (
            <Warning size={28} weight="duotone" />
          )}
        </div>

        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className={`${styles.confirmBtn} ${styles[confirmVariant]}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              <>
                {confirmVariant === 'danger' ? <Trash size={18} weight="bold" /> : <Check size={18} weight="bold" />}
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
