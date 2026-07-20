import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={styles.adminLayout}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className={styles.mainContent}>
        <Header onMenuClick={() => setIsSidebarOpen(prev => !prev)} />
        <main className={`${styles.pageContent} animate-fade-in`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
