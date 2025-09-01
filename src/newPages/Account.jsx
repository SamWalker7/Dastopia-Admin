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
import UserEditForm from "./UserEditForm"; // Import the new component

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
  TextField, // Import TextField for the dialog input
  Alert, // Import Alert for feedback messages
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { FaSpinner } from "react-icons/fa"; // Import Spinner icon

// Add API_BASE_URL here (or ensure it's available globally)
const API_BASE_URL =
  "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod";

// --- CONSTANT DECLARATIONS - SHOULD BE OUTSIDE THE COMPONENT FUNCTION ---
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

// Helper function to safely extract and format names
const formatUserName = (userObject) => {
  if (!userObject) return "N/A";
  const firstName = userObject.given_name || "";
  const lastName = userObject.family_name || "";
  return `${firstName} ${lastName}`.trim() || "N/A";
};

// Helper function to generate initials from a full name string
const getInitials = (fullName) => {
  if (!fullName || typeof fullName !== "string" || fullName.trim() === "") {
    return null;
  }
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
  if (nameParts.length === 0) return null;
  if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
  return (
    nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)
  ).toUpperCase();
};

// Account Component - Displays user profile and rental history
const Account = ({ selectedUser, adminToken }) => {
  const navigate = useNavigate();

  // --- STATE DECLARATIONS ---
  const [rentals, setRentals] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const [fullUserProfile, setFullUserProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileFetchError, setProfileFetchError] = useState(null);

  const [profileImageUrl, setProfileImageUrl] = useState(
    placeholderProfileImage
  );
  const [isImageLoading, setIsImageLoading] = useState(true);

  const [sortConfig, setSortConfig] = useState({
    key: "startDate",
    direction: "descending",
  });

  // --- STATE for APPROVAL/DENIAL ---
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isDenyDialogOpen, setIsDenyDialogOpen] = useState(false);
  const [expDate, setExpDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState({
    type: "",
    message: "",
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0); // To trigger re-fetch

  // --- NEW STATE for Edit User Dialog ---
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // --- Status Colors ---
  const statusColors = {
    Completed: "bg-blue-950 text-white",
    Active: "bg-green-100 text-green-700",
    Canceled: "bg-red-100 text-red-600",
    Invited: "bg-[#F6DE95] text-[#816204] font-bold",
    Inactive: "bg-[#FEE2E2] text-[#991B1B] font-bold",
    CONFIRMED: "bg-[#A0E6BA] text-[#136C34] font-bold",
    UNCONFIRMED: "bg-[#F6DE95] text-[#816204] font-bold",
    VERIFIED: "bg-[#A0E6BA] text-[#136C34] font-bold",
    PENDING_VERIFICATION: "bg-[#F6DE95] text-[#816204] font-bold",
    REJECTED_VERIFICATION: "bg-red-100 text-red-600",
  };

  const admin = JSON.parse(localStorage.getItem("admin"));
  const adminId = admin?.username;

  const handleChatWithUser = useCallback(
    (userId, userGivenName, userFamilyName) => {
      if (!adminId) {
        alert("Your admin ID is missing. Please log in as admin.");
        return;
      }
      if (!userId) {
        alert("User details missing. Cannot initiate chat.");
        return;
      }
      navigate(
        `/chat?renteeId=${userId}&reservationId=${userId}&given_name=${userGivenName}&family_name=${userFamilyName}`
      );
    },
    [navigate, adminId]
  );

  // --- Functions to fetch data (unchanged) ---
  const fetchRenteeHistory = useCallback(async (AccessToken, userId) => {
    if (!AccessToken || !userId)
      throw new Error("Access token or User ID is missing");
    const response = await fetch(
      `${API_BASE_URL}/v1/admin/booking/history/${userId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AccessToken}`,
        },
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to fetch history: ${errorData.message || response.statusText}`
      );
    }
    const data = await response.json();
    return data?.bookings || (Array.isArray(data) ? data : []);
  }, []);

  const fetchUserProfile = useCallback(async (AccessToken, userId) => {
    if (!AccessToken || !userId)
      throw new Error("Access token or User ID is missing");
    const response = await fetch(`${API_BASE_URL}/v1/user/${userId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AccessToken}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to fetch profile: ${errorData.message || response.statusText}`
      );
    }
    const data = await response.json();
    if (data && typeof data === "object" && data.id === userId) return data;
    throw new Error("Invalid user profile data received.");
  }, []);

  const transformBookingToRental = (booking) => {
    return {
      startDate: formatDate(booking.startTime),
      endDate: formatDate(booking.endTime),
      carName: booking.car?.name || "N/A",
      carOwner: formatUserName(booking.owner),
      phone: booking.owner?.phone_number || "N/A",
      status: booking.status || "N/A",
      bookingId:
        booking.bookingId ||
        booking.id ||
        `fallback-${Math.random().toString(36).substring(7)}`,
    };
  };

  // --- Main Data Fetching Effect ---
  useEffect(() => {
    const loadUserData = async () => {
      // Reset states
      setIsLoadingProfile(true);
      setIsLoadingHistory(true);
      setProfileFetchError(null);
      setHistoryError(null);
      setFullUserProfile(null);
      setRentals([]);
      setProfileImageUrl(placeholderProfileImage);
      setIsImageLoading(true);
      setActionFeedback({ type: "", message: "" }); // Clear feedback on new user select

      const adminData = JSON.parse(localStorage.getItem("admin"));
      const currentAdminToken = adminToken || adminData?.AccessToken;
      const userId = selectedUser?.sub;

      if (!currentAdminToken || !userId) {
        setProfileFetchError("Authentication required or user not selected.");
        setIsLoadingProfile(false);
        setIsLoadingHistory(false);
        setIsImageLoading(false);
        return;
      }

      try {
        const [profileResult, historyResult] = await Promise.allSettled([
          fetchUserProfile(currentAdminToken, userId),
          fetchRenteeHistory(currentAdminToken, userId),
        ]);

        // Handle Profile Result
        if (profileResult.status === "fulfilled") {
          const profileData = profileResult.value;
          setFullUserProfile(profileData);
          const profilePictureKey = profileData?.["custom:profile_picture_key"];
          if (profilePictureKey) {
            try {
              const imageUrlResult = await getDownloadUrl(profilePictureKey);
              const imageUrl = imageUrlResult?.body;
              setProfileImageUrl(
                imageUrl && typeof imageUrl === "string"
                  ? imageUrl
                  : placeholderProfileImage
              );
            } catch (imgUrlErr) {
              console.error("Error fetching profile image URL:", imgUrlErr);
            } finally {
              setIsImageLoading(false);
            }
          } else {
            setIsImageLoading(false);
          }
        } else {
          setProfileFetchError(
            profileResult.reason?.message || "Failed to load profile."
          );
          setIsImageLoading(false);
        }

        // Handle History Result
        if (historyResult.status === "fulfilled") {
          const transformedHistory = historyResult.value.map(
            transformBookingToRental
          );
          setRentals(transformedHistory);
        } else {
          setHistoryError(
            historyResult.reason?.message || "Failed to load history."
          );
        }
      } catch (err) {
        console.error("Unexpected error during data fetching:", err);
        setProfileFetchError("An unexpected error occurred.");
      } finally {
        setIsLoadingProfile(false);
        setIsLoadingHistory(false);
      }
    };

    if (selectedUser?.sub) {
      loadUserData();
    } else {
      // Clear all states if no user is selected
      setRentals([]);
      setHistoryError(null);
      setIsLoadingHistory(false);
      setFullUserProfile(null);
      setProfileFetchError(null);
      setIsLoadingProfile(false);
      setProfileImageUrl(placeholderProfileImage);
      setIsImageLoading(false);
    }
  }, [
    selectedUser,
    adminToken,
    refreshTrigger,
    fetchRenteeHistory,
    fetchUserProfile,
    getDownloadUrl,
  ]);

  // --- Handlers for Approval/Denial ---

  const handleOpenVerifyDialog = () => setIsVerifyDialogOpen(true);
  const handleCloseVerifyDialog = () => {
    setIsVerifyDialogOpen(false);
    setExpDate(""); // Reset date on close
  };

  const handleOpenDenyDialog = () => setIsDenyDialogOpen(true);
  const handleCloseDenyDialog = () => setIsDenyDialogOpen(false);

  // --- NEW: Handlers for Edit User Dialog ---
  const handleOpenEditDialog = () => setIsEditDialogOpen(true);
  const handleCloseEditDialog = () => setIsEditDialogOpen(false);

  const handleUserUpdated = () => {
    handleCloseEditDialog();
    // Set a success message and trigger a data refresh
    setActionFeedback({
      type: "success",
      message: "User updated successfully!",
    });
    setRefreshTrigger((t) => t + 1);
  };

  const handleConfirmApprove = async () => {
    const userId = fullUserProfile?.id;
    const adminToken = JSON.parse(localStorage.getItem("admin"))?.AccessToken;
    if (!adminToken || !userId || !expDate) {
      setActionFeedback({
        type: "error",
        message:
          "Missing required information (Token, User ID, or Expiration Date).",
      });
      return;
    }

    setIsSubmitting(true);
    setActionFeedback({ type: "", message: "" });

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/account/verify_account/${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ expDate }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "An unknown error occurred." }));
        throw new Error(
          errorData.message || `HTTP error! Status: ${response.status}`
        );
      }

      setActionFeedback({
        type: "success",
        message: "Account verified successfully!",
      });
      setRefreshTrigger((t) => t + 1); // Trigger data re-fetch
      handleCloseVerifyDialog();
    } catch (error) {
      console.error("Error approving user:", error);
      setActionFeedback({
        type: "error",
        message: `Failed to approve user: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeny = async () => {
    const userId = fullUserProfile?.id;
    if (!adminToken || !userId) {
      setActionFeedback({
        type: "error",
        message: "Missing required information (Token or User ID).",
      });
      return;
    }

    setIsSubmitting(true);
    setActionFeedback({ type: "", message: "" });

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/account/deny_account/${userId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "An unknown error occurred." }));
        throw new Error(
          errorData.message || `HTTP error! Status: ${response.status}`
        );
      }

      setActionFeedback({
        type: "success",
        message: "Account denied successfully.",
      });
      setRefreshTrigger((t) => t + 1); // Trigger data re-fetch
      handleCloseDenyDialog();
    } catch (error) {
      console.error("Error denying user:", error);
      setActionFeedback({
        type: "error",
        message: `Failed to deny user: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Sorting Logic (unchanged) ---
  const sortedRentals = [...rentals].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    if (sortConfig.key === "startDate" || sortConfig.key === "endDate") {
      const parseDate = (dateStr) => {
        if (
          !dateStr ||
          typeof dateStr !== "string" ||
          ["NA", "Error", "Invalid Date"].includes(dateStr)
        )
          return new Date(0);
        const [day, month, year] = dateStr.split("/").map(Number);
        const date = new Date(year, month - 1, day);
        return isNaN(date.getTime()) ? new Date(0) : date;
      };
      const dateA = parseDate(aValue);
      const dateB = parseDate(bValue);
      return sortConfig.direction === "ascending"
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    } else if (typeof aValue === "string" && typeof bValue === "string") {
      const valA = aValue === "N/A" ? "" : aValue.toLowerCase();
      const valB = bValue === "N/A" ? "" : bValue.toLowerCase();
      return sortConfig.direction === "ascending"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
    return 0;
  });

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // --- JSX Render ---
  if (!selectedUser) {
    return (
      <div className="text-center py-8 text-gray-600">
        Select a user to view details.
      </div>
    );
  }

  const userToDisplay = fullUserProfile || selectedUser;
  const userName =
    `${userToDisplay.given_name || ""} ${
      userToDisplay.family_name || ""
    }`.trim() || "N/A";
  const initials = getInitials(userName);
  const userPhoneNumber = userToDisplay.phone_number || "N/A";
  const userEmail = userToDisplay.email || "N/A";
  const userAddress = userToDisplay.address || "N/A";
  const userStatus = userToDisplay.status || userToDisplay.UserStatus || "N/A";
  const userRegistrationDate = userToDisplay.UserCreateDate
    ? new Date(userToDisplay.UserCreateDate).toLocaleString()
    : userToDisplay.created
    ? new Date(userToDisplay.created).toLocaleString()
    : "N/A";
  const userRole = userToDisplay["custom:role"] || "N/A";

  return (
    <div className="flex flex-col">
      {/* --- Feedback Alert --- */}
      {actionFeedback.message && (
        <Alert
          severity={actionFeedback.type}
          onClose={() => setActionFeedback({ type: "", message: "" })}
          sx={{ mb: 2 }}
        >
          {actionFeedback.message}
        </Alert>
      )}

      {/* --- User Details & Account Details Sections --- */}
      <div className="flex flex-wrap gap-6 mb-8">
        <section className="flex-grow bg-white p-6 space-y-6 min-w-[300px] rounded-xl drop-shadow-sm shadow-sm">
          <div className="items-center flex flex-wrap gap-8">
            {/* Profile Picture Logic */}
            {isImageLoading ? (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <FaSpinner className="animate-spin text-2xl text-gray-400" />
              </div>
            ) : profileImageUrl &&
              profileImageUrl !== placeholderProfileImage ? (
              <img
                src={profileImageUrl}
                alt={`${userName}'s Profile`}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover flex-shrink-0"
              />
            ) : initials ? (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-blue-600 text-white font-bold text-4xl flex items-center justify-center flex-shrink-0">
                {initials}
              </div>
            ) : (
              <img
                src={image}
                alt="Default avatar"
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover flex-shrink-0"
              />
            )}

            {isLoadingProfile && !fullUserProfile ? (
              <Box display="flex" justifyContent="center" alignItems="center">
                <CircularProgress size={20} />
                <Typography sx={{ ml: 1 }}>Loading Profile...</Typography>
              </Box>
            ) : profileFetchError ? (
              <div className="text-red-600 text-sm mt-2">
                Error: {profileFetchError}
              </div>
            ) : (
              <div className="flex flex-col gap-2 flex-grow">
                <h2 className="text-lg font-semibold text-[#00113D] mb-2">
                  User Details
                </h2>
                <h3 className="flex gap-4 text-sm text-[#38393D] items-center">
                  <IoPersonOutline size={18} /> {userName}
                </h3>
                <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                  <MdOutlineLocalPhone size={18} />
                  <p>{userPhoneNumber}</p>
                </div>
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
                <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 text-sm border rounded-full border-[#00113D] text-[#00113D] bg-white w-full sm:w-auto">
                  <IoChatboxOutline size={16} />
                  <button
                    onClick={() =>
                      handleChatWithUser(
                        userToDisplay.id || userToDisplay.sub,
                        userToDisplay.given_name,
                        userToDisplay.family_name
                      )
                    }
                    disabled={
                      !adminId || (!userToDisplay.id && !userToDisplay.sub)
                    }
                  >
                    Chat With User
                  </button>
                </div>
              </div>
            )}
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

          {/* --- ACTION BUTTONS --- */}
          <div className="flex flex-wrap gap-2 mt-6">
            {/* NEW: Edit User Button */}
            <Button
              variant="outlined"
              onClick={handleOpenEditDialog}
              disabled={!fullUserProfile || isSubmitting}
            >
              Edit User
            </Button>

            {/* Existing Approval/Denial Buttons */}
            {userStatus === "UNCONFIRMED" && fullUserProfile && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleOpenVerifyDialog}
                  disabled={isSubmitting}
                >
                  Approve
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleOpenDenyDialog}
                  disabled={isSubmitting}
                >
                  Deny
                </Button>
              </>
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
          {isLoadingHistory ? (
            <div className="text-center py-8 text-gray-600 flex items-center justify-center">
              Loading rental history...
              <CircularProgress size={20} sx={{ ml: 1 }} />
            </div>
          ) : historyError ? (
            <div className="text-center py-8 text-red-600 px-4">
              Error loading history: {historyError}
            </div>
          ) : sortedRentals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No rental history found for this user.
            </div>
          ) : (
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

      {/* --- APPROVAL DIALOG --- */}
      <Dialog
        open={isVerifyDialogOpen}
        onClose={handleCloseVerifyDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Approve User Account</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please enter the expiration date for the user's verification.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="expDate"
            label="Expiration Date"
            type="date"
            fullWidth
            variant="outlined"
            value={expDate}
            onChange={(e) => setExpDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            error={!expDate && isSubmitting} // Example validation
            helperText={!expDate && isSubmitting ? "Date is required." : ""}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVerifyDialog} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmApprove}
            variant="contained"
            color="primary"
            disabled={isSubmitting || !expDate}
          >
            {isSubmitting ? <CircularProgress size={24} /> : "Confirm Approval"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- DENIAL CONFIRMATION DIALOG --- */}
      <Dialog
        open={isDenyDialogOpen}
        onClose={handleCloseDenyDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Confirm Account Denial</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to deny this user's account? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDenyDialog} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDeny}
            variant="contained"
            color="error"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : "Confirm Denial"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- NEW: EDIT USER DIALOG --- */}
      {fullUserProfile && (
        <UserEditForm
          user={fullUserProfile}
          open={isEditDialogOpen}
          onClose={handleCloseEditDialog}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  );
};

export default Account;
