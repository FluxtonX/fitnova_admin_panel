import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Users, Barbell, PersonSimpleRun, ForkKnife, Trophy, Brain, Moon, UserPlus, PresentationChart, TrendUp, Lightning } from '@phosphor-icons/react';

import TopBanner from '../../components/widgets/TopBanner';
import StatCard from '../../components/cards/StatCard';
import ChartWidget from '../../components/widgets/ChartWidget';
import QuickActions from '../../components/widgets/QuickActions';
import TimelineWidget from '../../components/widgets/TimelineWidget';
import LeaderboardWidget from '../../components/widgets/LeaderboardWidget';

import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { currentUser } = useAuth();

  // Mock data for charts
  const weeklyUsersData = [
    { name: 'Mon', users: 400 },
    { name: 'Tue', users: 550 },
    { name: 'Wed', users: 480 },
    { name: 'Thu', users: 700 },
    { name: 'Fri', users: 950 },
    { name: 'Sat', users: 1100 },
    { name: 'Sun', users: 1300 },
  ];

  const workoutsData = [
    { name: 'Strength', count: 120 },
    { name: 'Cardio', count: 250 },
    { name: 'Yoga', count: 80 },
    { name: 'HIIT', count: 180 },
    { name: 'Pilates', count: 50 },
  ];

  const recentEvents = [
    { user: 'John D.', action: 'completed', target: 'Morning Yoga', time: '10 mins ago', color: '#10b981', icon: <Brain weight="duotone" /> },
    { user: 'Sarah M.', action: 'joined', target: 'Summer Challenge', time: '1 hour ago', color: '#f59e0b', icon: <Trophy weight="duotone" /> },
    { user: 'Mike T.', action: 'logged', target: 'Chicken Salad', time: '2 hours ago', color: '#3b82f6', icon: <ForkKnife weight="duotone" /> },
    { user: 'Emma W.', action: 'registered', target: 'New Account', time: '5 hours ago', color: '#8b5cf6', icon: <UserPlus weight="duotone" /> },
  ];

  const topUsers = [
    { name: 'Alex Johnson', subtitle: 'Pro Member', score: '12,450', metric: 'XP' },
    { name: 'Jessica Davis', subtitle: 'Free Member', score: '9,800', metric: 'XP' },
    { name: 'Marcus Chen', subtitle: 'Pro Member', score: '8,200', metric: 'XP' },
    { name: 'Sam Taylor', subtitle: 'Pro Member', score: '7,150', metric: 'XP' },
  ];

  return (
    <div className={styles.dashboard}>
      <TopBanner user={currentUser} />

      <div className={styles.mainGrid}>
        <div className={styles.leftCol}>
          
          <div className={styles.statsGrid}>
          <StatCard 
            title="Total Users" 
            value="12,482" 
            icon={<Users size={28} weight="duotone" color="var(--indigo-500)" />}
            trend={12.5}
            trendLabel="vs last month"
          />
          <StatCard 
            title="Active Sessions" 
            value="8,432" 
            icon={<Lightning size={28} weight="duotone" color="var(--color-success)" />}
            trend={5.2}
            trendLabel="vs last week"
          />
          <StatCard 
            title="Revenue" 
            value="$12,543" 
            icon={<TrendUp size={28} weight="duotone" color="var(--color-warning)" />}
            trend={18.1}
            trendLabel="vs last month"
          />
          <StatCard 
            title="Avg Retention" 
            value="76%" 
            icon={<PresentationChart size={28} weight="duotone" color="var(--indigo-400)" />}
            trend={-2.4}
            trendLabel="vs last month"
          />
            <StatCard title="Total Exercises" value="240" icon={<Barbell size={28} weight="duotone" />} trend={2} trendLabel="vs last month" />
            <StatCard title="Active Challenges" value="4" icon={<Trophy size={28} weight="duotone" />} trend={0} trendLabel="vs last month" />
            <StatCard title="Sleep Sessions" value="5,430" icon={<Moon size={28} weight="duotone" />} trend={22} trendLabel="vs last month" />
            <StatCard title="Premium Users" value="2,100" icon={<Users size={28} weight="duotone" />} trend={18} trendLabel="vs last month" />
          </div>

          <div className={styles.chartsRow}>
            <ChartWidget 
              title="Weekly Active Users" 
              data={weeklyUsersData} 
              dataKey="users" 
              color="#5e6ad2" 
            />
            <ChartWidget 
              title="Workout Popularity" 
              data={workoutsData} 
              type="bar" 
              dataKey="count" 
              color="#10b981" 
            />
          </div>

          <QuickActions />

        </div>

        <div className={styles.rightCol}>
          <LeaderboardWidget title="Top Users (This Week)" items={topUsers} metric="XP" />
          <TimelineWidget title="Recent Activity" events={recentEvents} />
          
          {/* Server Status Widget */}
          <div className={`glass ${styles.statusWidget}`}>
            <h3 className={styles.widgetTitle}>System Status</h3>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Firebase API</span>
              <span className={styles.statusBadge}>Operational</span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Storage (32GB / 100GB)</span>
              <div className={styles.progressBar}><div className={styles.progress} style={{width: '32%'}}></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
