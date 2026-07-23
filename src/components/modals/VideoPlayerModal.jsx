import React, { useRef, useEffect, useState } from 'react';
import { X, Video, ArrowSquareOut, Play, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react';
import styles from './VideoPlayerModal.module.css';

const VideoPlayerModal = ({ title, videoUrl, posterUrl, onClose }) => {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn('Autoplay prevented by browser:', err);
            setIsPlaying(false);
          });
      }
    }
  }, [videoUrl]);

  if (!videoUrl) return null;

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleManualPlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
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
            key={videoUrl}
            controls
            playsInline
            muted
            preload="auto"
            poster={posterUrl || (typeof videoUrl === 'string' ? videoUrl.replace(/\.mp4$/i, '.jpg') : '')}
            className={styles.videoElement}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={(e) => {
              console.warn('Video onError triggered for:', videoUrl, e);
              // Only set error if video source is completely broken
              if (!videoRef.current || videoRef.current.networkState === 3) {
                setHasError(true);
              }
            }}
          >
            <source src={videoUrl} type="video/mp4" />
            <source src={videoUrl} type="video/webm" />
            Your browser does not support HTML5 video playback.
          </video>

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
                href={videoUrl}
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
            href={videoUrl}
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
