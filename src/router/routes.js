// src/routes.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import RentACarPage from '../pages/RentACarPage';
import AddCar from '../pages/AddCar';
import EnhancedMainLayout from '../Layout/EnhancedMainLayout';

const AppRoutes = ({ sidebarOpen, setSidebarOpen }) => (
    <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
            path="/dashboard"
            element={
                <EnhancedMainLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
                    <DashboardPage />
                </EnhancedMainLayout>
            }
        />
        <Route
            path="/rent-a-car"
            element={
                <EnhancedMainLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
                    <RentACarPage />
                </EnhancedMainLayout>
            }
        />
        <Route
            path="/add-car"
            element={
                <EnhancedMainLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
                    <AddCar />
                </EnhancedMainLayout>
            }
        />
    </Routes>
);

export default AppRoutes;