import React, { useState, useRef } from 'react';
import { UploadSimple, Trash, ArrowCounterClockwise, PlayCircle, Image, CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { uploadToCloudinary } from '../../services/cloudinary/cloudinaryService';
import styles from './CloudinaryUploader.module.css';

/**
 * Cloudinary File Uploader Component with real-time progress, retry, preview, replace, and validation.
 */
const CloudinaryUploader = ({
  label = 'Upload Media',
  accept = 'image/*',
  resourceType = 'image', // 'image' | 'video'
  maxSizeMB = 50,
  value = null, // Cloudinary metadata object { url, public_id, ... }
  onChange = () => {},
  helperText = '',
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [lastFile, setLastFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAndUploadFile(file);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processAndUploadFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const processAndUploadFile = async (file) => {
    setError(null);

    // Validate size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`File size (${fileSizeMB.toFixed(1)} MB) exceeds maximum allowed limit of ${maxSizeMB} MB.`);
      return;
    }

    // Validate mime type
    if (resourceType === 'image' && !file.type.startsWith('image/')) {
      setError('Invalid file format. Please select an image file (JPG, PNG, WebP).');
      return;
    }
    if (resourceType === 'video' && !file.type.startsWith('video/')) {
      setError('Invalid file format. Please select a video file (MP4, MOV, WebM).');
      return;
    }

    setLastFile(file);
    setUploading(true);
    setProgress(0);

    try {
      const metadata = await uploadToCloudinary(file, resourceType, (percent) => {
        setProgress(percent);
      });

      setUploading(false);
      setProgress(100);
      onChange(metadata);
    } catch (err) {
      setUploading(false);
      setError(err.message || 'Upload failed. Please try again.');
    }
  };

  const handleRetry = async () => {
    if (lastFile) {
      await processAndUploadFile(lastFile);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = () => {
    setError(null);
    setProgress(0);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const previewUrl = value?.url || value?.secure_url;

  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>

      {/* Media Preview Box if uploaded */}
      {previewUrl && !uploading && (
        <div className={styles.previewBox}>
          {resourceType === 'video' ? (
            <video src={previewUrl} controls className={styles.mediaPreview} />
          ) : (
            <img src={previewUrl} alt="Preview" className={styles.mediaPreview} />
          )}

          <div className={styles.previewOverlay}>
            <div className={styles.badgeSuccess}>
              <CheckCircle size={16} weight="fill" /> Uploaded to Cloudinary
            </div>

            <div className={styles.previewActions}>
              <button
                type="button"
                className={styles.actionBtnBtn}
                onClick={() => fileInputRef.current?.click()}
                title="Replace Media"
              >
                <UploadSimple size={16} weight="bold" /> Replace
              </button>
              <button
                type="button"
                className={`${styles.actionBtnBtn} ${styles.dangerBtn}`}
                onClick={handleRemove}
                title="Remove Media"
              >
                <Trash size={16} weight="bold" /> Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Zone if no file uploaded or currently uploading */}
      {(!previewUrl || uploading) && (
        <div
          className={`${styles.dropzone} ${uploading ? styles.isUploading : ''} ${error ? styles.hasError : ''}`}
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept={accept}
            className={styles.fileInput}
            onChange={handleFileSelect}
            disabled={uploading}
          />

          {!uploading && (
            <div className={styles.dropzoneContent}>
              <div className={styles.iconBox}>
                {resourceType === 'video' ? (
                  <PlayCircle size={32} weight="duotone" />
                ) : (
                  <Image size={32} weight="duotone" />
                )}
              </div>
              <p className={styles.dropzoneText}>
                <span className={styles.highlight}>Click to upload</span> or drag & drop
              </p>
              <span className={styles.subtext}>
                {helperText || (resourceType === 'video' ? `MP4, MOV up to ${maxSizeMB}MB` : `PNG, JPG, WebP up to ${maxSizeMB}MB`)}
              </span>
            </div>
          )}

          {/* Upload Progress Bar */}
          {uploading && (
            <div className={styles.progressContainer}>
              <div className={styles.progressHeader}>
                <span>Uploading to Cloudinary...</span>
                <span className={styles.percentText}>{progress}%</span>
              </div>
              <div className={styles.progressBarTrack}>
                <div className={styles.progressBarFill} style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Alert with Retry */}
      {error && (
        <div className={styles.errorBanner}>
          <WarningCircle size={18} weight="fill" className={styles.errorIcon} />
          <span className={styles.errorMsg}>{error}</span>
          <button type="button" className={styles.retryBtn} onClick={handleRetry}>
            <ArrowCounterClockwise size={16} weight="bold" /> Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default CloudinaryUploader;
