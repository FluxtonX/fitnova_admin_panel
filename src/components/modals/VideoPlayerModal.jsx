import React, { useRef, useEffect, useState } from 'react';
import { X, Video, ArrowSquareOut, Play, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react';
import styles from './VideoPlayerModal.module.css';

const extractUrl = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object') return val.secure_url || val.url || val.videoUrl || val.videoAsset || '';
  return '';
};

const VideoPlayerModal = ({ title, videoUrl, posterUrl, onClose }) => {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  const cleanVideoUrl = extractUrl(videoUrl);
  const cleanPosterUrl = extractUrl(posterUrl);

  useEffect(() => {
    setHasError(false);
    if (videoRef.current && cleanVideoUrl) {
      videoRef.current.muted = true;
      videoRef.current.src = cleanVideoUrl;
      videoRef.current.load();
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn('Autoplay notice:', err);
            setIsPlaying(false);
          });
      }
    }
  }, [cleanVideoUrl]);

  if (!cleanVideoUrl) return null;

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleManualPlay = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleInfo}>
            <Video size={20} weight="duotone" color="#10b981" />
            <h3 className={styles.title}>{title || 'Exercise Video Preview'}</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Close Video">
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Video Player Box */}
        <div className={styles.playerWrapper}>
          <video
            ref={videoRef}
            key={cleanVideoUrl}
            src={cleanVideoUrl}
            controls
            playsInline
            muted
            autoPlay
            preload="auto"
            poster={cleanPosterUrl || (cleanVideoUrl ? cleanVideoUrl.replace(/\.mp4$/i, '.jpg') : '')}
            className={styles.videoElement}
            onPlay={() => {
              setIsPlaying(true);
              setHasError(false);
            }}
            onPause={() => setIsPlaying(false)}
            onError={(e) => {
              console.warn('Video element onError for:', cleanVideoUrl, e);
              if (videoRef.current && videoRef.current.error) {
                setHasError(true);
              }
            }}
          />

          {/* Manual Play Overlay if Browser blocked Autoplay */}
          {!isPlaying && !hasError && (
            <button className={styles.playOverlayBtn} onClick={handleManualPlay} title="Click to Play Video">
              <Play size={36} weight="fill" color="#ffffff" />
            </button>
          )}

          {/* Error Banner Fallback */}
          {hasError && (
            <div className={styles.errorOverlay}>
              <p>Direct video playback issue.</p>
              <a
                href={cleanVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn primary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              >
                <ArrowSquareOut size={16} /> Open Video in New Tab
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Source: Cloudinary CDN</span>
            <button type="button" className={styles.muteBtn} onClick={toggleMute}>
              {isMuted ? <SpeakerSlash size={16} /> : <SpeakerHigh size={16} />}
              {isMuted ? 'Unmute Sound' : 'Mute'}
            </button>
          </div>

          <a
            href={cleanVideoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.videoLink}
            title="Open raw video link in new tab"
          >
            <ArrowSquareOut size={16} /> Open Direct URL
          </a>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerModal;
