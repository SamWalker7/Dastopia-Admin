import React, { useState, useEffect, useCallback } from "react";
import { HiMiniArrowsUpDown } from "react-icons/hi2";
import {
  IoChatboxOutline,
  IoLocationOutline,
  IoPersonOutline,
} from "react-icons/io5";
import { MdOutlineLocalPhone, MdOutlineMail } from "react-icons/md";
import image from "./avatar.png"; // Static fallback image
import { getDownloadUrl } from "../api"; // Assuming your api.js exports getDownloadUrl
import { useNavigate } from "react-router-dom"; // Import useNavigate

import {
  Typography,
  Box,
  Button,
  CircularProgress,
  Paper,
  Grid,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { FaSpinner } from "react-icons/fa"; // Import Spinner icon

// Add API_BASE_URL here (or ensure it's available globally)
const API_BASE_URL =
  "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod";

// --- CONSTANT DECLARATIONS - SHOULD BE OUTSIDE THE COMPONENT FUNCTION ---
// Keep placeholderProfileImage even if we use initials, it's a state value fallback indicator
const placeholderProfileImage = "https://via.placeholder.com/150";
const placeholderVehicleImage = "https://via.placeholder.com/300";
// --- END CONSTANT DECLARATIONS ---

// Helper function to format dates from API (assuming ISO string) to DD/MM/YYYY
const formatDate = (dateString) => {
  if (!dateString || dateString === "NA") return "NA";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return "Error";
  }
};

// Helper function to safely extract and format names (still useful for owner)
const formatUserName = (userObject) => {
  if (!userObject) return "N/A";
  // *** ADJUST these keys based on your ACTUAL API response for the OWNER object in BOOKING HISTORY ***
  // The booking history API might return different keys for the owner object than the /v1/user API
  const firstName = userObject.given_name || "";
  const lastName = userObject.family_name || "";
  return `${firstName} ${lastName}`.trim() || "N/A";
};

// Helper function to generate initials from a full name string
const getInitials = (fullName) => {
  if (!fullName || typeof fullName !== "string" || fullName.trim() === "") {
    return null; // Return null or a specific indicator if name is empty/invalid
  }
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean); // Split and filter empty strings
  if (nameParts.length === 0) return null; // Should not happen with trim and filter, but safety

  if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();

  // Take first initial of first part and first initial of last part
  return (
    nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)
  ).toUpperCase();
};

// Account Component - Displays user profile and rental history
const Account = ({ selectedUser, adminToken }) => {
  // Receive adminToken prop
  const navigate = useNavigate();

  // --- STATE DECLARATIONS ---
  const [rentals, setRentals] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const [fullUserProfile, setFullUserProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileFetchError, setProfileFetchError] = useState(null);

  const [error, setError] = useState(null); // General error state

  const [profileImageUrl, setProfileImageUrl] = useState(
    placeholderProfileImage
  );
  const [isImageLoading, setIsImageLoading] = useState(true);

  const [sortConfig, setSortConfig] = useState({
    key: "startDate",
    direction: "descending",
  });

  // --- Status Colors ---
  const statusColors = {
    Completed: "bg-blue-950 text-white",
    Active: "bg-green-100 text-green-700",
    Canceled: "bg-red-100 text-red-600",
    Invited: "bg-[#F6DE95] text-[#816204] font-bold",
    Inactive: "bg-[#FEE2E2] text-[#991B1B] font-bold",
    CONFIRMED: "bg-[#A0E6BA] text-[#136C34] font-bold", // User status confirmed
    UNCONFIRMED: "bg-[#F6DE95] text-[#816204] font-bold", // User status unconfirmed
    VERIFIED: "bg-[#A0E6BA] text-[#136C34] font-bold", // Example for custom:id_verified status
    PENDING_VERIFICATION: "bg-[#F6DE95] text-[#816204] font-bold", // Example
    REJECTED_VERIFICATION: "bg-red-100 text-red-600", // Example
    // Add any other API statuses returned by the rentee history endpoint or user profile
  };

  // Get admin details from local storage (for chat initiation)
  const admin = JSON.parse(localStorage.getItem("admin"));
  const adminId = admin?.username; // Assuming 'username' is the admin's chat ID

  // Handler for the Chat With User button
  const handleChatWithUser = useCallback(
    (userId, userGivenName, userFamilyName) => {
      if (!adminId) {
        console.error(
          "Admin ID not found in localStorage. Cannot initiate chat."
        );
        alert("Your admin ID is missing. Please log in as admin.");
        return;
      }
      if (!userId) {
        console.error("User ID missing. Cannot initiate chat.");
        alert("User details missing. Cannot initiate chat.");
        return;
      }

      // Navigate to the ChatApp route.
      // The 'renteeId' parameter should be the ID of the *target* user for the chat.
      // Using the target userId again for reservationId as a placeholder context if needed.
      navigate(
        `/chat?renteeId=${userId}&reservationId=${userId}&given_name=${userGivenName}&family_name=${userFamilyName}`
      );

      console.log(
        `Navigating to chat with User ID: ${userId} (as renteeId), Admin ID: ${adminId}`
      );
    },
    [navigate, adminId] // navigate and adminId are dependencies
  );

  // --- Function to fetch Rentee History ONLY ---
  const fetchRenteeHistory = useCallback(async (AccessToken, userId) => {
    if (!AccessToken)
      throw new Error("Access token is missing for rentee history");
    if (!userId) throw new Error("User ID is missing for rentee history");

    console.log(`Fetching rentee history for user ID: ${userId}`);

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/admin/booking/history/${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${AccessToken}`,
          },
        }
      );

      console.log("Rentee History Fetch response status:", response.status);

      if (!response.ok) {
        let errorData = { message: `HTTP error! status: ${response.status}` };
        try {
          errorData = await response.json();
        } catch (e) {
          console.error("Could not parse history error response JSON:", e);
        }
        console.error("Failed history response data:", errorData);
        throw new Error(
          `Failed to fetch rentee history: ${
            errorData.message || response.statusText
          }`
        );
      }

      const data = await response.json();
      console.log("Successfully fetched history data:", data);
      console.log("Raw history data:", JSON.stringify(data, null, 2));

      if (data && Array.isArray(data.bookings)) {
        return data.bookings;
      } else if (Array.isArray(data)) {
        console.warn(
          "History API response was directly an array, expected { bookings: [...] } structure."
        );
        return data;
      } else {
        console.warn(
          "History API response did not contain a 'bookings' array:",
          data
        );
        return [];
      }
    } catch (error) {
      console.error("Error fetching rentee history:", error);
      throw error;
    }
  }, []);

  // --- Function to fetch Full User Profile ONLY ---
  const fetchUserProfile = useCallback(async (AccessToken, userId) => {
    if (!AccessToken)
      throw new Error("Access token is missing for user profile");
    if (!userId) throw new Error("User ID is missing for user profile");

    console.log(`Fetching user profile for user ID: ${userId}`);

    try {
      const response = await fetch(`${API_BASE_URL}/v1/user/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AccessToken}`,
        },
      });

      console.log("User Profile Fetch response status:", response.status);

      if (!response.ok) {
        let errorData = { message: `HTTP error! status: ${response.status}` };
        try {
          errorData = await response.json();
        } catch (e) {
          console.error("Could not parse profile error response JSON:", e);
        }
        console.error("Failed profile response data:", errorData);
        throw new Error(
          `Failed to fetch user profile: ${
            errorData.message || response.statusText
          }`
        );
      }

      const data = await response.json();
      console.log("Successfully fetched user profile data:", data);
      console.log("Raw user profile data:", JSON.stringify(data, null, 2));

      if (data && typeof data === "object" && data.id === userId) {
        return data;
      } else {
        console.warn(
          "User profile API response did not match expected structure:",
          data
        );
        throw new Error("Invalid user profile data received.");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  }, []);

  // --- Helper function to transform API booking object to the required table row format ---
  // *** CRITICAL: Adjust keys based on the ACTUAL structure returned by /v1/admin/booking/history/:userId ***
  const transformBookingToRental = (booking) => {
    const startDate = formatDate(booking.startTime);
    const endDate = formatDate(booking.endTime);
    const carName = booking.car?.name || "N/A";
    const status = booking.status || "N/A";

    const ownerDetails = booking.owner;
    const carOwner = formatUserName(ownerDetails);
    const phone = ownerDetails?.phone_number || "N/A";

    const bookingId =
      booking.bookingId ||
      booking.id ||
      `fallback-${Math.random().toString(36).substring(7)}`;

    return {
      startDate,
      endDate,
      carName,
      carOwner,
      phone,
      status,
      bookingId,
    };
  };

  // --- Effect to fetch history and profile when selectedUser changes ---
  useEffect(() => {
    const loadUserData = async () => {
      // Reset states related to fetching user data
      setIsLoadingHistory(true);
      setHistoryError(null);
      setRentals([]);

      setIsLoadingProfile(true);
      setProfileFetchError(null);
      setFullUserProfile(null);
      setProfileImageUrl(placeholderProfileImage); // Reset image URL to placeholder
      setIsImageLoading(true); // Set image loading true at the start of data fetch

      const adminData = JSON.parse(localStorage.getItem("admin"));
      const adminToken = adminData?.AccessToken;

      const userId = selectedUser?.sub;

      if (!adminToken) {
        console.error(
          "Admin token is missing from localStorage. Cannot fetch user data."
        );
        setHistoryError("Authentication required.");
        setProfileFetchError("Authentication required.");
        setIsLoadingHistory(false);
        setIsLoadingProfile(false);
        setIsImageLoading(false); // Ensure image loading stops
        setError(null); // Clear general error on auth issue
        return;
      }

      if (!userId) {
        console.log(
          "Selected user or user ID is missing, skipping data fetch."
        );
        // Clear all user-specific data if user is deselected or invalid
        setRentals([]);
        setHistoryError(null);
        setIsLoadingHistory(false);

        setFullUserProfile(null);
        setProfileFetchError(null);
        setIsLoadingProfile(false);

        // **IMPORTANT:** Reset profile image state here to ensure correct fallback rendering
        setProfileImageUrl(placeholderProfileImage); // Reset to placeholder
        setIsImageLoading(false); // Ensure image loading is false
        setError(null); // Clear general error
        return;
      }

      // --- Fetch Profile and History in Parallel ---
      try {
        const [profileResult, historyResult] = await Promise.allSettled([
          fetchUserProfile(adminToken, userId),
          fetchRenteeHistory(adminToken, userId),
        ]);

        // Handle Profile Result
        if (profileResult.status === "fulfilled") {
          const profileData = profileResult.value;
          setFullUserProfile(profileData);

          const profilePictureKey = profileData?.["custom:profile_picture_key"];
          console.log(
            "Profile picture key from fetched profile:",
            profilePictureKey
          );

          if (profilePictureKey) {
            // setIsImageLoading remains true until getDownloadUrl finishes or fails
            try {
              const imageUrlResult = await getDownloadUrl(profilePictureKey);
              console.log("Profile image download URL result:", imageUrlResult);
              const imageUrl = imageUrlResult?.body;
              if (imageUrl && typeof imageUrl === "string") {
                setProfileImageUrl(imageUrl);
                console.log("Profile image URL set:", imageUrl);
              } else {
                console.warn(
                  "getDownloadUrl did not return a valid URL for key:",
                  profilePictureKey,
                  imageUrlResult
                );
                // profileImageUrl remains placeholderProfileImage, which is desired for fallback
              }
            } catch (imgUrlErr) {
              console.error("Error fetching profile image URL:", imgUrlErr);
              // profileImageUrl remains placeholderProfileImage
            } finally {
              setIsImageLoading(false); // Image loading finished (success or failure)
              console.log("Profile image URL fetch finished.");
            }
          } else {
            console.warn(
              "Fetched profile has no 'custom:profile_picture_key'.",
              profileData
            );
            // If no key, image loading is immediately false, render logic shows initials/fallback
            setIsImageLoading(false); // Ensure image loading is false
            console.log(
              "No profile picture key found. Image loading finished."
            );
          }
          setProfileFetchError(null); // Clear profile error on success
        } else {
          console.error("Profile fetch failed:", profileResult.reason);
          setProfileFetchError(
            profileResult.reason?.message || "Failed to load profile."
          );
          setFullUserProfile(null);
          setProfileImageUrl(placeholderProfileImage); // Reset image state on profile fetch error
          setIsImageLoading(false); // Turn off image loading
          console.log("Profile fetch failed. Image loading finished.");
        }

        // Handle History Result
        if (historyResult.status === "fulfilled") {
          const historyData = Array.isArray(historyResult.value)
            ? historyResult.value
            : [];
          const transformedHistory = historyData.map(transformBookingToRental);
          setRentals(transformedHistory);
          setHistoryError(null); // Clear history error on success
          console.log("History fetch fulfilled.");
        } else {
          console.error("History fetch failed:", historyResult.reason);
          setHistoryError(
            historyResult.reason?.message || "Failed to load history."
          );
          setRentals([]);
          console.log("History fetch failed.");
        }
      } catch (err) {
        console.error("Unexpected error during Promise.allSettled:", err);
        setError("An unexpected error occurred during data fetching.");
      } finally {
        // Explicitly ensure all loading states are off in finally, covering unexpected errors
        setIsLoadingHistory(false);
        setIsLoadingProfile(false);
        // isImageLoading is handled inside the profile Result block
        console.log("loadUserData finished.");
      }
    };

    if (selectedUser?.sub) {
      loadUserData();
    } else {
      console.log("selectedUser is null or has no 'sub', clearing user data.");
      // Clear all states if selectedUser is null or invalid
      setRentals([]);
      setHistoryError(null);
      setIsLoadingHistory(false);

      setFullUserProfile(null);
      setProfileFetchError(null);
      setIsLoadingProfile(false);

      // **IMPORTANT:** Reset profile image state here to ensure correct fallback rendering
      setProfileImageUrl(placeholderProfileImage); // Reset to placeholder
      setIsImageLoading(false); // Ensure image loading is false
      setError(null); // Clear any general error
    }
  }, [
    selectedUser,
    adminToken,
    fetchRenteeHistory,
    fetchUserProfile,
    getDownloadUrl,
  ]);

  // --- Sorting Logic (applied to the 'rentals' state) ---
  const sortedRentals = [...rentals].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    // Date sorting
    if (sortConfig.key === "startDate" || sortConfig.key === "endDate") {
      const parseDate = (dateStr) => {
        if (
          !dateStr ||
          typeof dateStr !== "string" ||
          dateStr === "NA" ||
          dateStr === "Error" ||
          dateStr === "Invalid Date"
        )
          return new Date(0);
        const parts = dateStr.split("/");
        if (parts.length !== 3) return new Date(0);
        const [day, month, year] = parts.map(Number);
        const date = new Date(year, month - 1, day);
        return isNaN(date.getTime()) ? new Date(0) : date;
      };

      const dateA = parseDate(aValue);
      const dateB = parseDate(bValue);

      const isValidA = dateA.getTime() > 0;
      const isValidB = dateB.getTime() > 0;

      if (!isValidA && !isValidB) return 0;
      if (!isValidA) return sortConfig.direction === "ascending" ? -1 : 1;
      if (!isValidB) return sortConfig.direction === "ascending" ? 1 : -1;

      return sortConfig.direction === "ascending"
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    }
    // String sorting
    else if (typeof aValue === "string" && typeof bValue === "string") {
      const valA = aValue === "N/A" ? "" : aValue.toLowerCase();
      const valB = bValue === "N/A" ? "" : bValue.toLowerCase();

      if (valA === valB) return 0;

      return sortConfig.direction === "ascending"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
    // Fallback
    else {
      const stringA = String(aValue ?? ""); // Treat null/undefined as empty string
      const stringB = String(bValue ?? "");
      return sortConfig.direction === "ascending"
        ? stringA.localeCompare(stringB)
        : stringB.localeCompare(stringA);
    }
  });

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // --- JSX Render ---

  // Render loading/placeholder if no user is selected
  if (!selectedUser) {
    return (
      <div className="text-center py-8 text-gray-600">
        Select a user to view details.
      </div>
    );
  }

  // Extract user details for rendering the top sections
  const userToDisplay = fullUserProfile || selectedUser;

  // Determine the full name for displaying and generating initials
  const userName =
    `${userToDisplay.given_name || ""} ${
      userToDisplay.family_name || ""
    }`.trim() || "N/A";

  const initials = getInitials(userName); // Generate initials

  const userPhoneNumber =
    userToDisplay.phone_number || userToDisplay.phone || "N/A";
  const userEmail = userToDisplay.email || "N/A";
  const userAddress = userToDisplay.address || userToDisplay.city || "N/A";
  const userStatus = userToDisplay.status || userToDisplay.UserStatus || "N/A";
  const userRegistrationDate = userToDisplay.UserCreateDate
    ? new Date(userToDisplay.UserCreateDate).toLocaleString()
    : userToDisplay.created
    ? new Date(userToDisplay.created).toLocaleString()
    : "N/A";
  const userRole = userToDisplay["custom:role"] || "N/A";

  return (
    <div className=" flex flex-col">
      {/* --- User Details & Account Details Sections --- */}
      <div className="flex flex-wrap gap-6 mb-8">
        <section className="flex-grow bg-white p-6 space-y-6 min-w-[300px] rounded-xl drop-shadow-sm shadow-sm">
          <div className="items-center flex flex-wrap gap-8">
            {/* --- Profile Picture / Initials / Spinner Logic --- */}
            {isImageLoading && profileImageUrl === placeholderProfileImage ? ( // Show spinner only if image is loading AND we are still showing the placeholder
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <FaSpinner className="animate-spin text-2xl text-gray-400" />
              </div>
            ) : profileImageUrl &&
              profileImageUrl !== placeholderProfileImage ? ( // If a valid image URL was fetched and is not the placeholder
              <img
                src={profileImageUrl} // Use the fetched URL
                alt={`${userName}'s Profile`}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover flex-shrink-0"
              />
            ) : // If loading finished and no valid URL was found, show initials or fallback image
            initials !== null ? ( // If initials could be generated
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-blue-600 text-white font-bold text-4xl flex items-center justify-center flex-shrink-0">
                {initials} {/* Display calculated initials */}
              </div>
            ) : (
              // If initials could NOT be generated (name empty/invalid)
              <img
                src={image} // Use the static fallback image
                alt={`${userName}'s Profile`} // Alt text still useful
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover flex-shrink-0"
              />
            )}
            {/* --- End Profile Picture Logic --- */}

            {/* Show spinner if profile details themselves are loading (separate from image URL fetch) */}
            {/* Use isLoadingProfile directly, as isImageLoading is for the picture specifically */}
            {isLoadingProfile && !fullUserProfile && (
              <Box display="flex" justifyContent="center" alignItems="center">
                <CircularProgress size={20} />{" "}
                <Typography sx={{ ml: 1 }}>
                  Loading Profile Details...
                </Typography>
              </Box>
            )}
            {/* Show error for profile details fetch if it occurred */}
            {profileFetchError && (
              <div className="text-red-600 text-sm mt-2">
                Error loading profile details: {profileFetchError}
              </div>
            )}

            <div className="flex flex-col gap-2 flex-grow">
              <h2 className="text-lg font-semibold text-[#00113D] mb-2">
                User Details
              </h2>
              {/* Display the user's name */}
              <h3 className="flex gap-4 text-sm text-[#38393D] items-center">
                <IoPersonOutline size={18} /> {userName}
              </h3>
              {/* Display the user's phone */}
              <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                <MdOutlineLocalPhone size={18} />
                <p>{userPhoneNumber}</p>
              </div>
              {/* Display the user's email */}
              <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                <MdOutlineMail size={18} />
                <p className="break-all">{userEmail}</p>
              </div>
              {userAddress !== "N/A" && (
                <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                  <IoLocationOutline size={18} />
                  <p>{userAddress}</p>
                </div>
              )}

              {/* Chat button */}
              <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 text-sm border rounded-full border-[#00113D] text-[#00113D] bg-white w-full sm:w-auto">
                <IoChatboxOutline size={16} />
                <button
                  onClick={() =>
                    handleChatWithUser(
                      userToDisplay.id || userToDisplay.sub, // Use the best available ID for the target user
                      userToDisplay.given_name || "User", // Pass given name
                      userToDisplay.family_name || "" // Pass family name
                    )
                  }
                  // Disable if adminId is missing or target user ID is missing
                  disabled={
                    !adminId || (!userToDisplay.id && !userToDisplay.sub)
                  }
                >
                  Chat With User
                </button>
              </div>
            </div>
          </div>
        </section>
        <section className="flex-grow bg-white p-6 rounded-xl drop-shadow-sm shadow-sm min-w-[250px]">
          <h2 className="text-lg font-semibold text-[#00113D] mb-4">
            Account Details
          </h2>
          <div className="space-y-2 text-sm text-[#38393D]">
            <p className="flex items-center">
              <span className="w-32 flex-shrink-0">Status</span>
              <span
                className={`px-3 py-1 rounded font-semibold ${
                  statusColors[userStatus] || "text-gray-700 bg-gray-200"
                }`}
              >
                {userStatus}
              </span>
            </p>
            <p className="flex items-center">
              <span className="w-32 flex-shrink-0">Registered</span>
              <span className="font-semibold text-sky-950">
                {userRegistrationDate}
              </span>
            </p>
            {userRole !== "N/A" && (
              <p className="flex items-center">
                <span className="w-32 flex-shrink-0">Role</span>
                <span className="font-semibold text-sky-950">{userRole}</span>
              </p>
            )}
          </div>
        </section>
      </div>

      {/* --- Rental History Table --- */}
      <div className=" bg-white mt-8 w-full drop-shadow-sm shadow-sm rounded-lg">
        <div className="p-4 md:p-6 rounded-lg ">
          <h2 className="text-lg font-semibold pl-2 my-4 md:my-6">
            Rental History (Cars Rented)
          </h2>
          {/* Render based on isLoadingHistory, historyError, or data presence */}
          {isLoadingHistory ? ( // Show loading spinner while fetching history
            <div className="text-center py-8 text-gray-600 flex items-center justify-center">
              Loading rental history...
              <CircularProgress size={20} sx={{ ml: 1 }} />
            </div>
          ) : historyError ? ( // Show error if history fetch failed
            <div className="text-center py-8 text-red-600 px-4">
              Error loading history: {historyError}
            </div>
          ) : sortedRentals.length === 0 ? ( // Show empty state if no rentals after loading
            <div className="text-center py-8 text-gray-500">
              No rental history found for this user.
            </div>
          ) : (
            // Show table if data exists and no loading/error
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border-collapse">
                <thead>
                  <tr className="bg-gray-50 font-semibold border-b border-gray-200">
                    <th
                      className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("startDate")}
                    >
                      Rent Start <HiMiniArrowsUpDown className="inline ml-1" />
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("endDate")}
                    >
                      Rent End <HiMiniArrowsUpDown className="inline ml-1" />
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("carName")}
                    >
                      Car Name <HiMiniArrowsUpDown className="inline ml-1" />
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("carOwner")}
                    >
                      Car Owner <HiMiniArrowsUpDown className="inline ml-1" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Owner Phone
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("status")}
                    >
                      Status <HiMiniArrowsUpDown className="inline ml-1" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedRentals.map((rental) => (
                    <tr key={rental.bookingId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {rental.startDate}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {rental.endDate}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {rental.carName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {rental.carOwner}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {rental.phone}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            statusColors[rental.status] ||
                            "bg-gray-200 text-gray-800"
                          }`}
                        >
                          {rental.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Available Events Dialog (Removed) */}
      {/* Image Slider Dialog (Removed) */}
    </div>
  );
};

export default Account;
