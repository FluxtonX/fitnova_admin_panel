import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, updateUserStatus, deleteUser } from '../../services/firebase/userService';
import { MagnifyingGlass, Prohibit, CheckCircle, Trash, Plus } from '@phosphor-icons/react';
import styles from './UsersList.module.css';

const UsersList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['users', debouncedSearch],
    queryFn: () => getUsers(15, null, debouncedSearch),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, status }) => updateUserStatus(userId, status),
    onSuccess: () => queryClient.invalidateQueries(['users'])
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => deleteUser(userId),
    onSuccess: () => queryClient.invalidateQueries(['users'])
  });

  const handleToggleStatus = (user) => {
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    if (window.confirm(`Are you sure you want to ${newStatus === 'suspended' ? 'suspend' : 'activate'} this user?`)) {
      toggleStatusMutation.mutate({ userId: user.id, status: newStatus });
    }
  };

  const handleDelete = (userId) => {
    if (window.confirm('Are you sure you want to completely delete this user document?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>User Management</h2>
          <p>Manage, suspend, and view user details.</p>
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <MagnifyingGlass size={20} weight="duotone" className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search by email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn primary">
            <Plus size={18} weight="bold" /> Add User
          </button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        {isLoading ? (
          <div className={styles.emptyState}>
            <div className={styles.spinner}></div>
            <p>Loading users...</p>
          </div>
        ) : isError ? (
          <div className={styles.emptyState}>
            <p className={styles.errorText}>Error: {error.message}</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created At</th>
                <th className={styles.actionsColumn}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className={styles.userInfo}>
                      <div className={styles.avatar}>
                        {user.email ? user.email.charAt(0).toUpperCase() : '?'}
                      </div>
                      <span className={styles.emailText}>{user.email || 'No email provided'}</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.badge}>{user.role || 'user'}</span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${user.status === 'suspended' ? styles.suspended : styles.active}`}>
                      {user.status || 'active'}
                    </span>
                  </td>
                  <td>
                    <span className={styles.dateText}>{formatDate(user.createdAt)}</span>
                  </td>
                  <td className={styles.actionsColumn}>
                    <div className={styles.actions}>
                      <button 
                        className={styles.iconBtn} 
                        title={user.status === 'suspended' ? 'Activate' : 'Suspend'}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.status === 'suspended' ? <CheckCircle size={20} weight="duotone" className={styles.successIcon} /> : <Prohibit size={20} weight="duotone" className={styles.warningIcon} />}
                      </button>
                      <button 
                        className={styles.iconBtn} 
                        title="Delete"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash size={20} weight="duotone" className={styles.dangerIcon} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data?.users.length === 0 && (
                <tr>
                  <td colSpan="5" className={styles.emptyState}>No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UsersList;
