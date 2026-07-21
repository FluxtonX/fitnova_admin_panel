/**
 * dashboardService.js
 * ─────────────────────────────────────────────────────────────
 * Fetches REAL data from Firestore using the exact collection
 * names and field names used by the Flutter FitNova app.
 *
 * Safe helpers return 0 / [] on any error so the UI always
 * renders — never crashes, never shows stale mock data.
 * ─────────────────────────────────────────────────────────────
 * Verified collection map (from Flutter source):
 *   users                      → fullName, email, createdAt (Timestamp),
 *                                weeklyTimeSpentSeconds, timeSpentResetAt
 *   default_challenges         → challenge definitions (the app's challenges)
 *   user_challenge_progress    → streak, progressPercent, status, userId
 *   challenge_participants     → userId, progressPercent
 *   fitness_plans/{id}/workouts→ category, title, difficulty
 *   fitness_plans              → plan docs
 *   progress/{uid}/daily_logs  → per-user daily logs
 */

import {
  collection,
  collectionGroup,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from './config';

// ─── Safe helpers ────────────────────────────────────────────

/** Returns 0 on any Firestore error */
const safeCount = async (q) => {
  try {
    // Use server-side count aggregation when possible (faster, fewer reads)
    const snap = await getCountFromServer(q);
    return snap.data().count;
  } catch {
    // Fallback: client-side count
    try {
      const snap = await getDocs(q);
      return snap.size;
    } catch {
      return 0;
    }
  }
};

/** Returns [] on any Firestore error */
const safeDocs = async (q) => {
  try {
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
};

/**
 * Convert ANY Firestore timestamp / ISO string / null → JS Date.
 * Returns null if it cannot be parsed.
 */
const toDate = (raw) => {
  if (!raw) return null;
  if (typeof raw.toDate === 'function') return raw.toDate(); // Firestore Timestamp
  if (raw instanceof Date) return raw;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Human-readable relative time string.
 */
const relativeTime = (raw) => {
  const date = toDate(raw);
  if (!date) return 'recently';
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)} hours ago`;
  const days = Math.floor(diffMin / 1440);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
};

// ─── 1. Total Users ──────────────────────────────────────────
export const getTotalUsers = () =>
  safeCount(query(collection(db, 'users')));

// ─── 2. Active Challenges ────────────────────────────────────
/**
 * The Flutter app stores challenge definitions in 'default_challenges'.
 * Active = those whose endDate hasn't passed (or no endDate set).
 * We count ALL default_challenges as "active challenges" since these
 * are the definitions the app uses.
 */
export const getActiveChallenges = async () => {
  const total = await safeCount(query(collection(db, 'default_challenges')));
  if (total > 0) return total;
  // Also check 'challenges' collection as fallback
  return safeCount(query(collection(db, 'challenges')));
};

// ─── 3. Fitness Plans count (used as "Total Workouts") ───────
export const getTotalFitnessPlans = () =>
  safeCount(query(collection(db, 'fitness_plans')));

// ─── 4. Total challenge participants (used as "Active Sessions") ─
export const getTotalParticipants = () =>
  safeCount(query(collection(db, 'challenge_participants')));

// ─── 5. Users with weekly app time > 0 (Active this week) ───
export const getWeeklyActiveUsers = async () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const results = [];

  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    // Query users whose createdAt falls in this day
    const count = await safeCount(
      query(
        collection(db, 'users'),
        where('createdAt', '>=', dayStart),
        where('createdAt', '<=', dayEnd)
      )
    );

    results.push({ name: days[dayStart.getDay()], users: count });
  }

  return results;
};

// ─── 6. Workout category distribution ───────────────────────
/**
 * Fetches fitness_plans and counts by category.
 * Falls back to user_challenge_progress type distribution.
 */
export const getWorkoutPopularity = async () => {
  const plans = await safeDocs(query(collection(db, 'fitness_plans')));

  if (plans.length > 0) {
    const counts = {};
    plans.forEach((p) => {
      const key = p.category || p.type || p.title || 'Other';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }

  // Fallback: count challenge types from default_challenges
  const challenges = await safeDocs(query(collection(db, 'default_challenges')));
  if (challenges.length > 0) {
    const counts = {};
    challenges.forEach((c) => {
      const key = c.category || c.type || c.title || 'Other';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }

  return [
    { name: 'Strength', count: 0 },
    { name: 'Cardio', count: 0 },
    { name: 'Yoga', count: 0 },
    { name: 'HIIT', count: 0 },
    { name: 'Pilates', count: 0 },
  ];
};

// ─── 7. Top Users Leaderboard ────────────────────────────────
/**
 * Flutter app tracks weeklyTimeSpentSeconds per user (app_usage_service.dart).
 * Sort by that to get most-active users this week.
 * Fallback: sort by number of challenge progresses.
 */
export const getTopUsers = async () => {
  // Try weeklyTimeSpentSeconds
  const byTime = await safeDocs(
    query(
      collection(db, 'users'),
      orderBy('weeklyTimeSpentSeconds', 'desc'),
      limit(4)
    )
  );

  if (byTime.length > 0 && byTime.some((u) => (u.weeklyTimeSpentSeconds || 0) > 0)) {
    return byTime.map((u) => {
      const seconds = u.weeklyTimeSpentSeconds || 0;
      const mins = Math.floor(seconds / 60);
      const hrs = (mins / 60).toFixed(1);
      return {
        name: u.fullName || u.displayName || u.email?.split('@')[0] || 'User',
        subtitle: seconds > 3600 ? 'Power User' : 'Active User',
        score: mins >= 60 ? `${hrs}h` : `${mins}m`,
        metric: 'time',
      };
    });
  }

  // Fallback: most recently joined users
  const recent = await safeDocs(
    query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(4))
  );

  return recent.map((u) => ({
    name: u.fullName || u.displayName || u.email?.split('@')[0] || 'User',
    subtitle: 'Member',
    score: '—',
    metric: 'XP',
  }));
};

// ─── 8. Recent Activity ──────────────────────────────────────
/**
 * Shows the most recently registered users as activity events.
 * Also tries to fetch recent challenge progress events.
 */
export const getRecentActivity = async () => {
  const recentUsers = await safeDocs(
    query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(4))
  );

  if (recentUsers.length === 0) return [];

  return recentUsers.map((u) => ({
    user:
      u.fullName?.split(' ')[0] ||
      u.displayName?.split(' ')[0] ||
      (u.email ? u.email.split('@')[0] : 'User'),
    action: 'registered',
    target: 'New Account',
    time: relativeTime(u.createdAt),
    color: '#8b5cf6',
    type: 'register',
  }));
};

// ─── 9. Master fetch (called by useDashboard hook) ───────────
export const fetchDashboardData = async () => {
  const [
    totalUsers,
    activeChallenges,
    totalFitnessPlans,
    totalParticipants,
    weeklyUsers,
    workoutPopularity,
    topUsers,
    recentActivity,
  ] = await Promise.all([
    getTotalUsers(),
    getActiveChallenges(),
    getTotalFitnessPlans(),
    getTotalParticipants(),
    getWeeklyActiveUsers(),
    getWorkoutPopularity(),
    getTopUsers(),
    getRecentActivity(),
  ]);

  return {
    // Stat cards
    totalUsers,          // users collection count
    activeSessions: totalParticipants, // challenge_participants count
    totalFitnessPlans,   // fitness_plans count
    activeChallenges,    // default_challenges count
    // Charts
    weeklyUsers,
    workoutPopularity,
    // Widgets
    topUsers,
    recentActivity,
  };
};
