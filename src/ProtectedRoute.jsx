// src/routes/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
    const user = localStorage.getItem("admin"); // or access Redux auth state

    if (!user) {
        return <Navigate to="/" replace />; // redirect to Login
    }

    return <Outlet />; // allow access
};

export default ProtectedRoute;
