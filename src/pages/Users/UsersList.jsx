import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, updateUserStatus, deleteUser, createNewUser } from '../../services/firebase/userService';
import {
  Search,
  UserCheck,
  UserX,
  Trash2,
  UserPlus,
  Users,
  ShieldCheck,
  UserMinus,
  RefreshCw,
  AlertTriangle,
  X,
  CheckCircle2,
} from 'lucide-react';
import styles from './UsersList.module.css';

const UsersList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    user: null,
    action: '', // 'suspend' | 'activate' | 'delete'
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    gender: 'Male',
    age: '',
    heightCm: '',
    weightKg: '',
    targetWeightKg: '',
    fitnessGoal: 'Lose Weight',
    activityLevel: '3',
    workoutLocation: 'Home Workout',
    dietPreference: 'Everything',
    daysPerWeek: '5',
  });

  const queryClient = useQueryClient();

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['users', debouncedSearch],
    queryFn: () => getUsers(50, null, debouncedSearch),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, status }) => updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
    },
  });

  const createUserMutation = useMutation({
    mutationFn: ({ email, password, profileData }) => createNewUser(email, password, profileData),
    onSuccess: (uid) => {
      queryClient.invalidateQueries(['users']);
      setSuccessBanner(`Successfully registered user account ${formData.email}!`);
      setIsAddModalOpen(false);
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        password: '',
        gender: 'Male',
        age: '',
        heightCm: '',
        weightKg: '',
        targetWeightKg: '',
        fitnessGoal: 'Lose Weight',
        activityLevel: '3',
        workoutLocation: 'Home Workout',
        dietPreference: 'Everything',
        daysPerWeek: '5',
      });
      // Clear banner after 5 seconds
      setTimeout(() => setSuccessBanner(''), 5000);
    },
    onError: (err) => {
      setFormError(err.message || 'Failed to create user.');
    }
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.fullName.trim()) return setFormError('Full name is required.');
    if (!formData.email.trim()) return setFormError('Email address is required.');
    if (!formData.password || formData.password.length < 6)
      return setFormError('Password must be at least 6 characters.');
    if (!formData.age || parseInt(formData.age) < 10 || parseInt(formData.age) > 100)
      return setFormError('Please enter a valid age between 10 and 100.');
    if (!formData.heightCm || parseInt(formData.heightCm) < 100)
      return setFormError('Please enter a valid height in cm.');
    if (!formData.weightKg || parseInt(formData.weightKg) < 20)
      return setFormError('Please enter a valid weight in kg.');
    if (!formData.targetWeightKg || parseInt(formData.targetWeightKg) < 20)
      return setFormError('Please enter a valid target weight in kg.');

    // Auto-compute fitnessLevel from activityLevel (mirrors app logic)
    const actLvl = parseInt(formData.activityLevel) || 3;
    const fitnessLevel = actLvl <= 2 ? 'beginner' : actLvl <= 4 ? 'intermediate' : 'advanced';

    // Auto-compute workoutLocation key from selection (mirrors app logic)
    const wl = formData.workoutLocation.toLowerCase();
    const workoutLocation = wl.includes('gym') ? 'gym'
      : wl.includes('outdoor') ? 'outdoor'
      : wl.includes('mixed') ? 'mixed'
      : 'home';

    // Auto-compute dailyCalories using BMR formula (mirrors app CalorieService)
    const age = parseInt(formData.age);
    const h = parseInt(formData.heightCm);
    const w = parseInt(formData.weightKg);
    const isMale = formData.gender === 'Male';
    const bmr = isMale
      ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * age
      : 447.593 + 9.247 * w + 3.098 * h - 4.330 * age;
    const activityMultipliers = { 1: 1.2, 2: 1.375, 3: 1.375, 4: 1.55, 5: 1.725, 6: 1.9 };
    const maintenance = bmr * (activityMultipliers[actLvl] || 1.375);
    const goalAdjustments = {
      'Lose Weight': -500, 'Build Muscle': +300, 'Boost Endurance': +100,
      'Improve Health': 0, 'Flexibility': 0, 'Sport Performance': +200,
    };
    const dailyCalories = Math.round(maintenance + (goalAdjustments[formData.fitnessGoal] || 0));

    const dietPreference = formData.dietPreference.toLowerCase();

    const profileData = {
      fullName: formData.fullName.trim(),
      role: 'user',
      gender: formData.gender,
      age,
      heightCm: h,
      weightKg: w,
      targetWeightKg: parseInt(formData.targetWeightKg),
      fitnessGoal: formData.fitnessGoal,
      fitnessLevel,
      activityLevel: actLvl,
      workoutLocation,
      dietPreference,
      daysPerWeek: parseInt(formData.daysPerWeek) || 5,
      availableTime: '45 mins',
      dailyCalories,
      isOnboardingComplete: true,
      updatedAt: new Date().toISOString(),
    };

    createUserMutation.mutate({
      email: formData.email.trim(),
      password: formData.password,
      profileData,
    });
  };

  const openConfirm = (user, action) => {
    setConfirmModal({
      isOpen: true,
      user,
      action,
    });
  };

  const closeConfirm = () => {
    setConfirmModal({
      isOpen: false,
      user: null,
      action: '',
    });
  };

  const handleConfirmAction = () => {
    const { user, action } = confirmModal;
    if (!user) return;

    if (action === 'suspend') {
      toggleStatusMutation.mutate({ userId: user.id, status: 'suspended' });
    } else if (action === 'activate') {
      toggleStatusMutation.mutate({ userId: user.id, status: 'active' });
    } else if (action === 'delete') {
      deleteUserMutation.mutate(user.id);
    }
    closeConfirm();
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
          month: 'short',
          day: 'numeric',
        });
  };

  const getAvatarStyle = (user) => {
    const name = user.fullName || user.email || 'A';
    const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      { bg: 'rgba(99, 102, 241, 0.12)', text: '#6366f1' },
      { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6' },
      { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981' },
      { bg: 'rgba(236, 72, 153, 0.12)', text: '#ec4899' },
      { bg: 'rgba(249, 115, 22, 0.12)', text: '#f97316' },
      { bg: 'rgba(139, 92, 246, 0.12)', text: '#8b5cf6' },
    ];
    return colors[charCodeSum % colors.length];
  };

  const getUserInitials = (user) => {
    const name = user.fullName || user.displayName || '';
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email ? user.email.charAt(0).toUpperCase() : '?';
  };

  const usersList = data?.users || [];
  const totalCount = usersList.length;
  const activeCount = usersList.filter((u) => u.status !== 'suspended').length;
  const suspendedCount = usersList.filter((u) => u.status === 'suspended').length;

  return (
    <div className={`${styles.container} animate-fade-in`}>
      
      {/* Success banner */}
      {successBanner && (
        <div className={styles.successBanner}>
          <CheckCircle2 size={16} />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>User Directory</h2>
          <p>Search, manage roles, and review status of all registered members.</p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className={styles.addBtn} onClick={() => setIsAddModalOpen(true)}>
            <UserPlus size={16} /> Add User
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={`glass ${styles.statCard}`}>
          <div className={`${styles.statIcon} ${styles.indigoBg}`}>
            <Users size={20} color="#6366f1" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Members</span>
            <span className={styles.statValue}>{isLoading ? '…' : totalCount}</span>
          </div>
        </div>
        <div className={`glass ${styles.statCard}`}>
          <div className={`${styles.statIcon} ${styles.greenBg}`}>
            <ShieldCheck size={20} color="#10b981" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Active Members</span>
            <span className={styles.statValue}>{isLoading ? '…' : activeCount}</span>
          </div>
        </div>
        <div className={`glass ${styles.statCard}`}>
          <div className={`${styles.statIcon} ${styles.redBg}`}>
            <UserMinus size={20} color="#ef4444" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Suspended Members</span>
            <span className={styles.statValue}>{isLoading ? '…' : suspendedCount}</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className={styles.tableCard}>
        {isLoading ? (
          <div className={styles.loadingState}>
            <RefreshCw size={24} className={styles.loadingSpinner} />
            <p>Fetching members from database...</p>
          </div>
        ) : isError ? (
          <div className={styles.errorState}>
            <p className={styles.errorText}>Error fetching data: {error.message}</p>
            <button onClick={() => refetch()} className={styles.retryBtn}>
              Retry Fetch
            </button>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>System Role</th>
                  <th>Account Status</th>
                  <th>Joined Date</th>
                  <th className={styles.actionsColumn}>Manage Access</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((user) => {
                  const avatarColor = getAvatarStyle(user);
                  const isSuspended = user.status === 'suspended';

                  return (
                    <tr key={user.id} className={isSuspended ? styles.suspendedRow : ''}>
                      <td>
                        <div className={styles.userInfo}>
                          <div
                            className={styles.avatar}
                            style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
                          >
                            {getUserInitials(user)}
                          </div>
                          <div className={styles.nameDetails}>
                            <span className={styles.fullName}>
                              {user.fullName || user.displayName || 'No Name Set'}
                            </span>
                            <span className={styles.emailText}>
                              {user.email || 'No email provided'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`${styles.roleBadge} ${
                            user.role === 'admin' ? styles.roleAdmin : styles.roleUser
                          }`}
                        >
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            isSuspended ? styles.statusSuspended : styles.statusActive
                          }`}
                        >
                          {isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <span className={styles.dateText}>
                          {formatDate(user.createdAt)}
                        </span>
                      </td>
                      <td className={styles.actionsColumn}>
                        <div className={styles.actions}>
                          <button
                            className={`${styles.actionBtn} ${
                              isSuspended ? styles.activateBtn : styles.suspendBtn
                            }`}
                            title={isSuspended ? 'Re-activate Account' : 'Suspend Account'}
                            onClick={() => openConfirm(user, isSuspended ? 'activate' : 'suspend')}
                          >
                            {isSuspended ? <UserCheck size={16} /> : <UserX size={16} />}
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                            title="Delete User Record"
                            onClick={() => openConfirm(user, 'delete')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {usersList.length === 0 && (
                  <tr>
                    <td colSpan="5" className={styles.emptyState}>
                      <Users size={32} className={styles.emptyIcon} />
                      <p>No user records matched your criteria.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Center Confirmation Modal ── */}
      {confirmModal.isOpen && (
        <div className={styles.modalOverlay} onClick={closeConfirm}>
          <div className={`glass ${styles.modalCard}`} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalCloseBtn} onClick={closeConfirm}>
              <X size={18} />
            </button>

            <div className={styles.modalHeader}>
              <div
                className={`${styles.modalIcon} ${
                  confirmModal.action === 'delete'
                    ? styles.modalRed
                    : confirmModal.action === 'suspend'
                    ? styles.modalYellow
                    : styles.modalGreen
                }`}
              >
                <AlertTriangle size={24} />
              </div>
              <h3>
                {confirmModal.action === 'delete'
                  ? 'Delete User Account'
                  : confirmModal.action === 'suspend'
                  ? 'Suspend User Account'
                  : 'Re-activate User Account'}
              </h3>
            </div>

            <div className={styles.modalContent}>
              <p>
                Are you sure you want to{' '}
                <strong>
                  {confirmModal.action === 'delete'
                    ? 'permanently delete'
                    : confirmModal.action === 'suspend'
                    ? 'suspend'
                    : 'activate'}
                </strong>{' '}
                the user <strong>{confirmModal.user?.fullName || confirmModal.user?.email}</strong>?
              </p>
              {confirmModal.action === 'delete' && (
                <span className={styles.warningText}>
                  ⚠ This is a critical action. It will permanently remove their records from the
                  Firebase database and cannot be undone.
                </span>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={closeConfirm}>
                Cancel
              </button>
              <button
                className={`${styles.confirmBtn} ${
                  confirmModal.action === 'delete'
                    ? styles.btnDanger
                    : confirmModal.action === 'suspend'
                    ? styles.btnWarning
                    : styles.btnSuccess
                }`}
                onClick={handleConfirmAction}
              >
                {confirmModal.action === 'delete'
                  ? 'Delete Account'
                  : confirmModal.action === 'suspend'
                  ? 'Suspend User'
                  : 'Activate User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add User Modal ── */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddModalOpen(false)}>
          <div className={`glass ${styles.formModalCard}`} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalCloseBtn} onClick={() => setIsAddModalOpen(false)}>
              <X size={18} />
            </button>

            <div className={styles.modalHeader}>
              <div className={`${styles.modalIcon} ${styles.indigoBg}`}>
                <UserPlus size={24} color="#6366f1" />
              </div>
              <h3>Register New Member</h3>
              <p className={styles.modalSubtitle}>Create auth credentials and set onboarding details.</p>
            </div>

            {formError && (
              <div className={styles.formErrorMsg}>
                <AlertTriangle size={14} /> <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className={styles.addForm}>
              <div className={styles.formGrid}>
                {/* ── Column 1: Account ── */}
                <div className={styles.formCol}>
                  <h4 className={styles.formSectionTitle}>Account Credentials</h4>

                  <div className={styles.formField}>
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      placeholder="e.g. Umar Farooq"
                      value={formData.fullName}
                      onChange={handleFormChange}
                      autoComplete="off"
                      required
                    />
                  </div>

                  <div className={styles.formField}>
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="e.g. umar@gmail.com"
                      value={formData.email}
                      onChange={handleFormChange}
                      autoComplete="new-email"
                      required
                    />
                  </div>

                  <div className={styles.formField}>
                    <label>Password</label>
                    <input
                      type="password"
                      name="password"
                      placeholder="Min. 6 characters"
                      value={formData.password}
                      onChange={handleFormChange}
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  <h4 className={styles.formSectionTitle} style={{ marginTop: '1.25rem' }}>Body Metrics</h4>

                  <div className={styles.formRow}>
                    <div className={styles.formField}>
                      <label>Gender</label>
                      <select name="gender" value={formData.gender} onChange={handleFormChange}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className={styles.formField}>
                      <label>Age</label>
                      <input
                        type="number"
                        name="age"
                        placeholder="e.g. 24"
                        min="10" max="100"
                        value={formData.age}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formField}>
                      <label>Height (cm)</label>
                      <input
                        type="number"
                        name="heightCm"
                        placeholder="e.g. 175"
                        min="100" max="250"
                        value={formData.heightCm}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>Weight (kg)</label>
                      <input
                        type="number"
                        name="weightKg"
                        placeholder="e.g. 70"
                        min="20" max="300"
                        value={formData.weightKg}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formField}>
                    <label>Target Weight (kg)</label>
                    <input
                      type="number"
                      name="targetWeightKg"
                      placeholder="e.g. 65"
                      min="20" max="300"
                      value={formData.targetWeightKg}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                </div>

                {/* ── Column 2: Fitness Profile ── */}
                <div className={styles.formCol}>
                  <h4 className={styles.formSectionTitle}>Fitness Profile</h4>

                  <div className={styles.formField}>
                    <label>Fitness Goal</label>
                    <select name="fitnessGoal" value={formData.fitnessGoal} onChange={handleFormChange}>
                      <option value="Lose Weight">Lose Weight</option>
                      <option value="Build Muscle">Build Muscle</option>
                      <option value="Boost Endurance">Boost Endurance</option>
                      <option value="Improve Health">Improve Health</option>
                      <option value="Flexibility">Flexibility</option>
                      <option value="Sport Performance">Sport Performance</option>
                    </select>
                  </div>

                  <div className={styles.formField}>
                    <label>Activity Level <span style={{color:'var(--color-text-muted)',fontWeight:400}}>(1 = Sedentary → 6 = Very Active)</span></label>
                    <select name="activityLevel" value={formData.activityLevel} onChange={handleFormChange}>
                      <option value="1">1 — Sedentary (no exercise)</option>
                      <option value="2">2 — Light (1–2 days/week)</option>
                      <option value="3">3 — Moderate (3–4 days/week)</option>
                      <option value="4">4 — Active (5 days/week)</option>
                      <option value="5">5 — Very Active (hard training)</option>
                      <option value="6">6 — Athlete (intense daily)</option>
                    </select>
                  </div>

                  <div className={styles.formField}>
                    <label>Workout Preference</label>
                    <select name="workoutLocation" value={formData.workoutLocation} onChange={handleFormChange}>
                      <option value="Home Workout">Home Workout</option>
                      <option value="Gym">Gym</option>
                      <option value="Outdoor">Outdoor</option>
                      <option value="Mixed">Mixed</option>
                    </select>
                  </div>

                  <div className={styles.formField}>
                    <label>Dietary Preference</label>
                    <select name="dietPreference" value={formData.dietPreference} onChange={handleFormChange}>
                      <option value="Everything">Everything</option>
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Vegan">Vegan</option>
                      <option value="Keto">Keto</option>
                      <option value="Paleo">Paleo</option>
                    </select>
                  </div>

                  <div className={styles.formField}>
                    <label>Days Available per Week</label>
                    <select name="daysPerWeek" value={formData.daysPerWeek} onChange={handleFormChange}>
                      <option value="1">1 Day</option>
                      <option value="2">2 Days</option>
                      <option value="3">3 Days</option>
                      <option value="4">4 Days</option>
                      <option value="5">5 Days</option>
                      <option value="6">6 Days</option>
                      <option value="7">7 Days</option>
                    </select>
                  </div>

                  <div className={styles.autoComputeNote}>
                    <CheckCircle2 size={13} />
                    <span>Fitness level &amp; daily calories are auto-calculated from your inputs, just like the app.</span>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.confirmBtn}
                  style={{ background: 'var(--color-primary)' }}
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? (
                    <><RefreshCw size={14} className={styles.loadingSpinner} /> Creating...</>
                  ) : (
                    'Create Member Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;

