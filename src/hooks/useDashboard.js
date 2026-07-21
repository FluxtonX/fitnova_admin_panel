import { useState, useEffect } from 'react';
import { fetchDashboardData } from '../services/firebase/dashboardService';

/**
 * useDashboard
 * ─────────────────────────────────────────────────────────────
 * Fetches all dashboard stats from Firebase.
 * Every metric defaults to 0 / [] so the UI never shows
 * raw mock data or crashes while loading.
 */
const useDashboard = () => {
  const [data, setData] = useState({
    totalUsers: 0,
    activeSessions: 0,
    totalFitnessPlans: 0,
    activeChallenges: 0,
    weeklyUsers: [],
    workoutPopularity: [],
    topUsers: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDashboardData();
      setData(result);
    } catch (err) {
      console.error('[useDashboard] error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchDashboardData();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          console.error('[useDashboard] error:', err);
          setError(err.message || 'Failed to load');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error, reload: load };
};

export default useDashboard;
