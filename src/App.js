import React, { useEffect, useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Provider, useDispatch } from "react-redux";
import store from "./store/store";
import "./output.css"; // Import Tailwind CSS
import PermanentDrawerLeft from "./newPages/PermanentDrawerLeft";
import { refreshToken } from "./store/auth/authThunks";
import Login from "./newPages/Login"; // Import your Login component
import OTP from "./newPages/Otp"; // Import your OTP component
import UserManagment from "./newPages/UserManagment";
import ChatApp from "./newPages/chat";
import Dashboard from "./newPages/Dashboard";
import VehicleManagment from "./newPages/VehicleManagment";
import FinancialDashboard from "./newPages/FinancialDashboard";
import CarListingApproval from "./newPages/CarListingApproval";
import MyApprovalListing from "./newPages/MyApprovalListing";
import BookingApproval from "./newPages/BookingApproval";
import RoleSettings from "./newPages/RoleSettings";
import UserSettings from "./newPages/UserSettings";
import ReferralStatistics from "./newPages/ReferralStatistics";
import PromoAnalytics from "./newPages/PromoAnalytics";
import NewCarListing from "./newPages/NewCarListing";
import ProtectedRoute from "./ProtectedRoute";

function App() {

  const [user, setUser] = useState(() => {
    // Retrieve user data from localStorage on initial load
    const storedUser = localStorage.getItem("admin");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const dispatch = useDispatch();

  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Refreshing token...");
      dispatch(refreshToken());
    }, 600000); // Runs every 60 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [dispatch]);


  useEffect(() => {
    // Listen for changes in localStorage and update the user state
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem("admin");
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <Provider store={store}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/otp" element={<OTP />} />
        <Route path="/chat" element={<ChatApp />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<PermanentDrawerLeft />}>
            <Route index element={<Dashboard />} />
            <Route path="user-management" element={<UserManagment />} />
            <Route path="vehicle-management" element={<VehicleManagment />} />
            <Route path="financial-dashboard" element={<FinancialDashboard />} />
            <Route path="new-car-listings" element={<NewCarListing />} />
            <Route path="car-listing-approval" element={<CarListingApproval />} />
            <Route path="my-approval-listing" element={<MyApprovalListing />} />
            <Route path="booking-approval" element={<BookingApproval />} />
            <Route path="role-settings" element={<RoleSettings />} />
            <Route path="user-settings" element={<UserSettings />} />
            <Route path="referral-statistics" element={<ReferralStatistics />} />
            <Route path="promocode-analytics" element={<PromoAnalytics />} />
          </Route>
        </Route>
      </Routes>
    </Provider>

  );
}

export default App;
