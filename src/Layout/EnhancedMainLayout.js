// src/Layout/EnhancedMainLayout.js
import React from 'react';
import MainLayout from './MainLayout';

const EnhancedMainLayout = ({ children, sidebarOpen, setSidebarOpen }) => (
    <MainLayout
        open={sidebarOpen}
        handleDrawerOpen={() => setSidebarOpen(true)}
        handleDrawerClose={() => setSidebarOpen(false)}
    >
        {children}
    </MainLayout>
);

export default EnhancedMainLayout;
