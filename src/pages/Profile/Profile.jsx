import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useAuth } from '../../hooks/useAuth';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Edit2,
  Check,
  ArrowLeft,
  Loader,
  AlertCircle,
  Clock,
} from 'lucide-react';
import styles from './Profile.module.css';

const Profile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchAdminProfile = async () => {
      if (!currentUser?.uid) return;
      try {
        setLoading(true);
        setError('');
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);
          setEditName(data.fullName || data.displayName || '');
        } else {
          setError('Admin profile document not found in database.');
        }
      } catch (err) {
        console.error('Error fetching admin profile:', err);
        setError('Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminProfile();
  }, [currentUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;

    try {
      setSaving(true);
      setSuccessMsg('');
      const docRef = doc(db, 'users', currentUser.uid);
      await updateDoc(docRef, {
        fullName: editName.trim(),
        updatedAt: new Date().toISOString()
      });

      setProfile((prev) => ({ ...prev, fullName: editName.trim() }));
      setIsEditing(false);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error updating name:', err);
      setError('Failed to update name in database.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    let date;
    if (dateString.seconds) {
      date = new Date(dateString.seconds * 1000);
    } else {
      date = new Date(dateString);
    }
    return isNaN(date.getTime())
      ? '—'
      : date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
  };

  const getInitials = () => {
    const name = profile?.fullName || profile?.displayName || currentUser?.email || 'A';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Loader className={styles.spinner} size={28} />
        <p>Loading your profile details...</p>
      </div>
    );
  }

  return (
    <div className={`${styles.container} animate-fade-in`}>
      {/* Back navigation */}
      <button className={styles.backBtn} onClick={() => navigate('/')}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* Main card */}
      <div className={`glass ${styles.profileCard}`}>
        {/* Banner area */}
        <div className={styles.profileBanner}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>{getInitials()}</div>
            <span className={styles.activeIndicator} />
          </div>
        </div>

        {/* Info & Form */}
        <div className={styles.profileBody}>
          <div className={styles.titleSection}>
            {isEditing ? (
              <form onSubmit={handleSave} className={styles.editForm}>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={styles.nameInput}
                  autoFocus
                  required
                />
                <div className={styles.editActions}>
                  <button type="submit" className={styles.saveBtn} disabled={saving}>
                    {saving ? <Loader size={14} className={styles.spinner} /> : <Check size={14} />} Save
                  </button>
                  <button type="button" className={styles.cancelBtn} onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className={styles.nameWrap}>
                <h2>{profile?.fullName || 'Administrator'}</h2>
                <button className={styles.editToggleBtn} onClick={() => setIsEditing(true)}>
                  <Edit2 size={14} /> Edit Name
                </button>
              </div>
            )}
            <p className={styles.userRole}>Studio Owner & Director</p>
          </div>

          {successMsg && <div className={styles.successAlert}>{successMsg}</div>}
          {error && (
            <div className={styles.errorAlert}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Details list */}
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <div className={styles.detailIcon}>
                <Mail size={18} />
              </div>
              <div className={styles.detailInfo}>
                <span className={styles.detailLabel}>Email Address</span>
                <span className={styles.detailValue}>{profile?.email || currentUser?.email}</span>
              </div>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.detailIcon}>
                <Shield size={18} />
              </div>
              <div className={styles.detailInfo}>
                <span className={styles.detailLabel}>System Role</span>
                <span className={styles.detailValue} style={{ textTransform: 'uppercase' }}>
                  {profile?.role || 'admin'}
                </span>
              </div>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.detailIcon}>
                <Calendar size={18} />
              </div>
              <div className={styles.detailInfo}>
                <span className={styles.detailLabel}>Registration Date</span>
                <span className={styles.detailValue}>{formatDate(profile?.createdAt)}</span>
              </div>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.detailIcon}>
                <Clock size={18} />
              </div>
              <div className={styles.detailInfo}>
                <span className={styles.detailLabel}>App Activity Tracker</span>
                <span className={styles.detailValue}>
                  {profile?.weeklyTimeSpentSeconds
                    ? `${Math.floor(profile.weeklyTimeSpentSeconds / 60)} minutes spent this week`
                    : 'No app activity recorded'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
