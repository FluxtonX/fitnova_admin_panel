import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import useDashboard from '../../hooks/useDashboard';
import {
  Users,
  Barbell,
  Trophy,
  Brain,
  ForkKnife,
  Moon,
  UserPlus,
  PresentationChart,
  TrendUp,
  Lightning,
  ArrowClockwise,
} from '@phosphor-icons/react';

import TopBanner from '../../components/widgets/TopBanner';
import StatCard from '../../components/cards/StatCard';
import ChartWidget from '../../components/widgets/ChartWidget';
import QuickActions from '../../components/widgets/QuickActions';
import TimelineWidget from '../../components/widgets/TimelineWidget';
import LeaderboardWidget from '../../components/widgets/LeaderboardWidget';

import styles from './Dashboard.module.css';

// ─── Activity type → icon + color ───────────────────────────
const activityIcon = (type) => {
  switch (type) {
    case 'workout':    return <Barbell weight="duotone" />;
    case 'nutrition':  return <ForkKnife weight="duotone" />;
    case 'challenge':  return <Trophy weight="duotone" />;
    case 'meditation': return <Brain weight="duotone" />;
    case 'register':
    default:           return <UserPlus weight="duotone" />;
  }
};

// ─── Skeleton shimmer placeholder ───────────────────────────
const SkeletonStat = () => (
  <div className={`glass ${styles.skeletonCard}`}>
    <div className={styles.skeletonLine} style={{ width: '60%', height: 12, marginBottom: 14 }} />
    <div className={styles.skeletonLine} style={{ width: '38%', height: 28, marginBottom: 10 }} />
    <div className={styles.skeletonLine} style={{ width: '50%', height: 11 }} />
  </div>
);

// ─── Empty chart fallback data ───────────────────────────────
const EMPTY_WEEKLY = [
  { name: 'Mon', users: 0 },
  { name: 'Tue', users: 0 },
  { name: 'Wed', users: 0 },
  { name: 'Thu', users: 0 },
  { name: 'Fri', users: 0 },
  { name: 'Sat', users: 0 },
  { name: 'Sun', users: 0 },
];

const EMPTY_WORKOUT = [
  { name: 'Strength', count: 0 },
  { name: 'Cardio', count: 0 },
  { name: 'Yoga', count: 0 },
  { name: 'HIIT', count: 0 },
  { name: 'Pilates', count: 0 },
];

// ─── Dashboard ───────────────────────────────────────────────
const Dashboard = () => {
  const { currentUser } = useAuth();
  const { data, loading, error, reload } = useDashboard();

  const {
    totalUsers,
    activeSessions,
    totalFitnessPlans,
    activeChallenges,
    weeklyUsers,
    workoutPopularity,
    topUsers,
    recentActivity,
  } = data;

  // Enrich activity events with icons
  const enrichedEvents = recentActivity.length > 0
    ? recentActivity.map((e) => ({ ...e, icon: activityIcon(e.type) }))
    : [
        {
          user: 'No activity',
          action: '',
          target: 'yet',
          time: '—',
          color: '#6b7280',
          icon: <UserPlus weight="duotone" />,
        },
      ];

  return (
    <div className={styles.dashboard}>
      <TopBanner user={currentUser} />

      {/* Error banner */}
      {error && (
        <div className={styles.errorBanner}>
          <span>⚠ Could not load some data: {error}</span>
          <button onClick={reload} className={styles.retryBtn}>
            <ArrowClockwise size={14} /> Retry
          </button>
        </div>
      )}

      <div className={styles.mainGrid}>
        <div className={styles.leftCol}>

          {/* ── Stat Cards ── */}
          <div className={styles.statsGrid}>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonStat key={i} />)
            ) : (
              <>
                {/* Row 1 */}
                <StatCard
                  title="Total Users"
                  value={totalUsers.toLocaleString()}
                  icon={<Users size={28} weight="duotone" color="var(--indigo-500)" />}
                  trend={null}
                  trendLabel="registered"
                />
                <StatCard
                  title="Active Sessions"
                  value={activeSessions > 0 ? activeSessions.toLocaleString() : '0'}
                  icon={<Lightning size={28} weight="duotone" color="var(--color-success)" />}
                  trend={null}
                  trendLabel="challenge participants"
                />
                <StatCard
                  title="Fitness Plans"
                  value={totalFitnessPlans.toLocaleString()}
                  icon={<TrendUp size={28} weight="duotone" color="var(--color-warning)" />}
                  trend={null}
                  trendLabel="in library"
                />
                <StatCard
                  title="Avg Retention"
                  value="—"
                  icon={<PresentationChart size={28} weight="duotone" color="var(--indigo-400)" />}
                  trend={null}
                  trendLabel="not tracked"
                />

                {/* Row 2 */}
                <StatCard
                  title="Total Exercises"
                  value="40+"
                  icon={<Barbell size={28} weight="duotone" />}
                  trend={null}
                  trendLabel="in app library"
                />
                <StatCard
                  title="Active Challenges"
                  value={activeChallenges.toLocaleString()}
                  icon={<Trophy size={28} weight="duotone" />}
                  trend={null}
                  trendLabel="available"
                />
                <StatCard
                  title="Sleep Sessions"
                  value="—"
                  icon={<Moon size={28} weight="duotone" />}
                  trend={null}
                  trendLabel="not tracked"
                />
                <StatCard
                  title="Premium Users"
                  value="—"
                  icon={<Users size={28} weight="duotone" />}
                  trend={null}
                  trendLabel="not tracked"
                />
              </>
            )}
          </div>

          {/* ── Charts ── */}
          <div className={styles.chartsRow}>
            <ChartWidget
              title="Weekly New Users"
              data={weeklyUsers.length > 0 ? weeklyUsers : EMPTY_WEEKLY}
              dataKey="users"
              color="#5e6ad2"
            />
            <ChartWidget
              title="Workout Popularity"
              data={workoutPopularity.length > 0 ? workoutPopularity : EMPTY_WORKOUT}
              type="bar"
              dataKey="count"
              color="#10b981"
            />
          </div>

          <QuickActions />
        </div>

        <div className={styles.rightCol}>
          {/* ── Top Users Leaderboard ── */}
          <LeaderboardWidget
            title="Top Users (This Week)"
            items={
              topUsers.length > 0
                ? topUsers
                : [{ name: 'No data yet', subtitle: 'Users will appear here', score: '0', metric: 'XP' }]
            }
            metric={topUsers.length > 0 && topUsers[0]?.metric === 'time' ? 'time' : 'XP'}
          />

          {/* ── Recent Activity ── */}
          <TimelineWidget
            title="Recent Activity"
            events={enrichedEvents}
          />

          {/* ── System Status ── */}
          <div className={`glass ${styles.statusWidget}`}>
            <h3 className={styles.widgetTitle}>System Status</h3>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Firebase API</span>
              <span className={styles.statusBadge}>
                {error ? 'Degraded' : 'Operational'}
              </span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>
                Users tracked: {loading ? '…' : totalUsers.toLocaleString()}
              </span>
              <div className={styles.progressBar}>
                <div
                  className={styles.progress}
                  style={{
                    width: loading ? '0%' : `${Math.min((totalUsers / 50000) * 100, 100).toFixed(1)}%`,
                    transition: 'width 0.8s ease',
                  }}
                />
              </div>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>
                Challenges: {loading ? '…' : activeChallenges.toLocaleString()}
              </span>
              <div className={styles.progressBar}>
                <div
                  className={styles.progress}
                  style={{
                    width: loading ? '0%' : `${Math.min((activeChallenges / 50) * 100, 100).toFixed(1)}%`,
                    transition: 'width 0.8s ease',
                    background: 'var(--color-success)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
