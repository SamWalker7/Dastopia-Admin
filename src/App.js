import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage';
import DashboardPage from './pages/DashboardPage';
import RentACarPage from './pages/RentACarPage';
import MainLayout from './Layout/MainLayout';
import AddCar from './pages/AddCar';

// src/App.js
function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Change this line

  // Enhanced MainLayout to include sidebar state and toggle functionality
  const EnhancedMainLayout = ({ children }) => (
    <MainLayout
      open={sidebarOpen}
      handleDrawerOpen={() => setSidebarOpen(true)}
      handleDrawerClose={() => setSidebarOpen(false)}
    >
      {children}
    </MainLayout>
  );

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={<EnhancedMainLayout><DashboardPage /></EnhancedMainLayout>}
        />
        <Route
          path="/rent-a-car"
          element={<EnhancedMainLayout><RentACarPage /></EnhancedMainLayout>}
        />
        <Route 
          path="/add-car"
          element={<EnhancedMainLayout><AddCar /></EnhancedMainLayout>}
        />
      </Routes>
    </Router>
  );
}

export default App;
