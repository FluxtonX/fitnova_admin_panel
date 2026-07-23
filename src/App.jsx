import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout/AdminLayout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import UsersList from './pages/Users/UsersList';
import ExercisesList from './pages/Exercises/ExercisesList';

import WorkoutsList from './pages/Workouts/WorkoutsList';
import NutritionList from './pages/Nutrition/NutritionList';
import MeditationList from './pages/Meditation/MeditationList';
import SleepList from './pages/Sleep/SleepList';
import ChallengesList from './pages/Challenges/ChallengesList';
import NotificationsList from './pages/Notifications/NotificationsList';
import Settings from './pages/Settings/Settings';
import Profile from './pages/Profile/Profile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000, // 1 minute
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="app-container">
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                } 
              >
                {/* Nested routes will render in the Outlet of AdminLayout */}
                <Route index element={<Dashboard />} />
                <Route path="users" element={<UsersList />} />
                <Route path="exercises" element={<Navigate to="/workouts" replace />} />
                <Route path="workouts" element={<WorkoutsList />} />
                <Route path="recipes" element={<NutritionList />} />
                <Route path="meditation" element={<MeditationList />} />
                <Route path="sleep" element={<Navigate to="/meditation" replace />} />
                <Route path="challenges" element={<ChallengesList />} />
                <Route path="notifications" element={<NotificationsList />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
