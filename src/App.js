import React, { useEffect, useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Provider, useDispatch } from "react-redux";
import store from "./store/store";
import "./output.css"; // Import Tailwind CSS
import PermanentDrawerLeft from "./newPages/PermanentDrawerLeft";
import { refreshToken } from "./store/auth/authThunks";
import Login from "./newPages/Login"; // Import your Login component
import OTP from "./newPages/Otp"; // Import your OTP component
import UserManagment from "./newPages/UserManagment"; // Import your UserManagment component
import AddCar from "./newPages/Add Car/AddCar";
import Step2 from "./newPages/Add Car/Step2";
import Step3 from "./newPages/Add Car/Step3";
import Step4 from "./newPages/Add Car/Step4";
import Step5 from "./newPages/Add Car/Step5";
import ChatApp from "./newPages/chat";
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
    // <Provider store={store}>
    //   <ThemeProvider theme={theme}>
    //     <CssBaseline />
    //     <Router>
    //       <AppRoutes
    //         sidebarOpen={sidebarOpen}
    //         setSidebarOpen={setSidebarOpen}
    //       />
    //     </Router>
    //   </ThemeProvider>
    // </Provider>
    <Provider store={store}>
      <Routes>
        <Route index path="/" element={<Login />} />
        <Route path="/dashboard" element={<PermanentDrawerLeft />} />
        <Route index path="/otp" element={<OTP />} />
        <Route index path="/usermanagment" element={<UserManagment />} />
        <Route path="chat" element={<ChatApp />} />
      </Routes>
    </Provider>
  );
}

export default App;
