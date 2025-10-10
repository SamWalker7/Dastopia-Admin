import React, { useState, useEffect, useCallback } from "react";
import { HiMiniArrowsUpDown } from "react-icons/hi2";
import {
  IoChatboxOutline,
  IoLocationOutline,
  IoPersonOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";
import { MdOutlineLocalPhone, MdOutlineMail } from "react-icons/md";
import image from "./avatar.png"; // Static fallback image
import { getDownloadUrl } from "../api";
import { useNavigate } from "react-router-dom";
import UserEditForm from "./UserEditForm";

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
  TextField,
  Alert,
} from "@mui/material";
// FIX: Corrected the import path for the CloseIcon
import CloseIcon from "@mui/icons-material/Close";
import { FaSpinner } from "react-icons/fa";

const API_BASE_URL =
  "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod";

const placeholderProfileImage = "https://via.placeholder.com/150";

const formatDate = (dateString) => {
  if (!dateString || dateString === "NA" || dateString === "NONE") return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return "Error";
  }
};

const formatUserName = (userObject) => {
  if (!userObject) return "N/A";
  const firstName = userObject.given_name || "";
  const lastName = userObject.family_name || "";
  return `${firstName} ${lastName}`.trim() || "N/A";
};

const getInitials = (fullName) => {
  if (!fullName || typeof fullName !== "string" || fullName.trim() === "")
    return null;
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
  if (nameParts.length === 0) return null;
  if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
  return (
    nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)
  ).toUpperCase();
};

const Account = ({ selectedUser, adminToken }) => {
  const navigate = useNavigate();

  const [rentals, setRentals] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const [fullUserProfile, setFullUserProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileFetchError, setProfileFetchError] = useState(null);

  const [imageUrls, setImageUrls] = useState({
    profile: { url: null, loading: true },
    selfie: { url: null, loading: true },
    idFront: { url: null, loading: true },
    idBack: { url: null, loading: true },
  });

  const [sortConfig, setSortConfig] = useState({
    key: "startDate",
    direction: "descending",
  });
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isDenyDialogOpen, setIsDenyDialogOpen] = useState(false);
  const [expDate, setExpDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState({
    type: "",
    message: "",
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const statusColors = {
    Completed: "bg-blue-950 text-white",
    Active: "bg-green-100 text-green-700",
    Canceled: "bg-red-100 text-red-600",
    Invited: "bg-[#F6DE95] text-[#816204] font-bold",
    Inactive: "bg-[#FEE2E2] text-[#991B1B] font-bold",
    CONFIRMED: "bg-[#A0E6BA] text-[#136C34] font-bold",
    UNCONFIRMED: "bg-[#F6DE95] text-[#816204] font-bold",
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
    if (
      data &&
      typeof data === "object" &&
      (data.id === userId || data.username === userId)
    )
      return data;
    throw new Error("Invalid user profile data received.");
  }, []);

  const transformBookingToRental = (booking) => ({
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
  });

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoadingProfile(true);
      setIsLoadingHistory(true);
      setProfileFetchError(null);
      setHistoryError(null);
      setFullUserProfile(null);
      setRentals([]);
      setActionFeedback({ type: "", message: "" });
      setImageUrls({
        profile: { url: null, loading: true },
        selfie: { url: null, loading: true },
        idFront: { url: null, loading: true },
        idBack: { url: null, loading: true },
      });

      const currentAdminToken =
        adminToken || JSON.parse(localStorage.getItem("admin"))?.AccessToken;
      const userId = selectedUser?.username || selectedUser?.sub;

      if (!currentAdminToken || !userId) {
        setProfileFetchError("Authentication required or user not selected.");
        setIsLoadingProfile(false);
        setIsLoadingHistory(false);
        return;
      }

      Promise.allSettled([
        fetchUserProfile(currentAdminToken, userId),
        fetchRenteeHistory(currentAdminToken, userId),
      ]).then(([profileResult, historyResult]) => {
        if (profileResult.status === "fulfilled") {
          const profileData = profileResult.value;
          setFullUserProfile(profileData);

          const imageKeys = {
            profile: profileData?.["custom:profile_picture_key"],
            selfie: profileData?.["custom:selfie_key"],
            idFront: profileData?.["custom:id_front_key"],
            idBack: profileData?.["custom:id_back_key"],
          };

          Object.keys(imageKeys).forEach((key) => {
            if (imageKeys[key]) {
              getDownloadUrl(imageKeys[key])
                .then((urlResult) => {
                  const imageUrl = urlResult?.body;
                  if (imageUrl && typeof imageUrl === "string") {
                    setImageUrls((prev) => ({
                      ...prev,
                      [key]: { url: imageUrl, loading: false },
                    }));
                  } else {
                    throw new Error("Invalid image URL received");
                  }
                })
                .catch((err) => {
                  console.error(`Error fetching ${key} image URL:`, err);
                  setImageUrls((prev) => ({
                    ...prev,
                    [key]: { url: null, loading: false },
                  }));
                });
            } else {
              setImageUrls((prev) => ({
                ...prev,
                [key]: { url: null, loading: false },
              }));
            }
          });
        } else {
          setProfileFetchError(
            profileResult.reason?.message || "Failed to load profile."
          );
          setImageUrls({
            profile: { url: null, loading: false },
            selfie: { url: null, loading: false },
            idFront: { url: null, loading: false },
            idBack: { url: null, loading: false },
          });
        }
        setIsLoadingProfile(false);

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
        setIsLoadingHistory(false);
      });
    };

    if (selectedUser?.username || selectedUser?.sub) {
      loadUserData();
    } else {
      setIsLoadingProfile(false);
      setIsLoadingHistory(false);
    }
  }, [
    selectedUser,
    adminToken,
    refreshTrigger,
    fetchRenteeHistory,
    fetchUserProfile,
  ]);

  const handleOpenVerifyDialog = () => setIsVerifyDialogOpen(true);
  const handleCloseVerifyDialog = () => {
    setIsVerifyDialogOpen(false);
    setExpDate("");
  };

  const handleOpenDenyDialog = () => setIsDenyDialogOpen(true);
  const handleCloseDenyDialog = () => setIsDenyDialogOpen(false);

  const handleOpenEditDialog = () => setIsEditDialogOpen(true);
  const handleCloseEditDialog = () => setIsEditDialogOpen(false);

  const handleUserUpdated = () => {
    handleCloseEditDialog();
    setActionFeedback({
      type: "success",
      message: "User updated successfully!",
    });
    setRefreshTrigger((t) => t + 1);
  };

  const handleConfirmApprove = async () => {
    const userId = fullUserProfile?.username;
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
      if (!response.ok) throw new Error("Verification failed");
      setActionFeedback({
        type: "success",
        message: "Account verified successfully!",
      });
      setRefreshTrigger((t) => t + 1);
      handleCloseVerifyDialog();
    } catch (error) {
      setActionFeedback({
        type: "error",
        message: `Failed to approve user: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeny = async () => {
    const userId = fullUserProfile?.username;
    const adminToken = JSON.parse(localStorage.getItem("admin"))?.AccessToken;
    if (!adminToken || !userId) {
      setActionFeedback({
        type: "error",
        message: "Missing required information.",
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
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      if (!response.ok) throw new Error("Denial failed");
      setActionFeedback({
        type: "success",
        message: "Account denied successfully.",
      });
      setRefreshTrigger((t) => t + 1);
      handleCloseDenyDialog();
    } catch (error) {
      setActionFeedback({
        type: "error",
        message: `Failed to deny user: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedRentals = [...rentals].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    if (sortConfig.key === "startDate" || sortConfig.key === "endDate") {
      const parseDate = (dateStr) => {
        if (!dateStr || ["NA", "Error", "Invalid Date"].includes(dateStr))
          return new Date(0);
        const [day, month, year] = dateStr.split("/").map(Number);
        return new Date(year, month - 1, day);
      };
      return sortConfig.direction === "ascending"
        ? parseDate(aValue) - parseDate(bValue)
        : parseDate(bValue) - parseDate(aValue);
    }
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  };

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

  return (
    <div className="flex flex-col">
      {actionFeedback.message && (
        <Alert
          severity={actionFeedback.type}
          onClose={() => setActionFeedback({ type: "", message: "" })}
          sx={{ mb: 2 }}
        >
          {actionFeedback.message}
        </Alert>
      )}

      <div className="flex flex-wrap gap-6 mb-8">
        <section className="flex-grow bg-white p-6 space-y-6 min-w-[300px] rounded-xl drop-shadow-sm shadow-sm">
          <div className="items-center flex flex-wrap gap-8">
            {imageUrls.profile.loading ? (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <FaSpinner className="animate-spin text-2xl text-gray-400" />
              </div>
            ) : imageUrls.profile.url ? (
              <img
                src={imageUrls.profile.url}
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

            {isLoadingProfile ? (
              <CircularProgress />
            ) : profileFetchError ? (
              <div className="text-red-600">{profileFetchError}</div>
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
                  <p>{userToDisplay.phone_number || "N/A"}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                  <MdOutlineMail size={18} />
                  <p className="break-all">{userToDisplay.email || "N/A"}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                  <IoLocationOutline size={18} />
                  <p>{userToDisplay.address || "N/A"}</p>
                </div>
                <button
                  onClick={() =>
                    handleChatWithUser(
                      userToDisplay.username,
                      userToDisplay.given_name,
                      userToDisplay.family_name
                    )
                  }
                  disabled={!adminId || !userToDisplay.username}
                  className="flex items-center justify-center gap-2 mt-4 px-4 py-2 text-sm border rounded-full border-[#00113D] text-[#00113D] bg-white w-full sm:w-auto hover:bg-gray-50 disabled:opacity-50"
                >
                  <IoChatboxOutline size={16} /> Chat With User
                </button>
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
                  statusColors[userToDisplay.status] ||
                  "text-gray-700 bg-gray-200"
                }`}
              >
                {userToDisplay.status}
              </span>
            </p>
            <p className="flex items-center">
              <span className="w-32 flex-shrink-0">Registered</span>
              <span className="font-semibold text-sky-950">
                {formatDate(userToDisplay.created)}
              </span>
            </p>
            <p className="flex items-center">
              <span className="w-32 flex-shrink-0">Role</span>
              <span className="font-semibold text-sky-950 capitalize">
                {userToDisplay["custom:role"] || "N/A"}
              </span>
            </p>
            <p className="flex items-center">
              <span className="w-32 flex-shrink-0">User Type</span>
              <span className="font-semibold text-sky-950 capitalize">
                {userToDisplay["custom:user_type"] || "N/A"}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mt-6">
            <Button
              variant="outlined"
              onClick={handleOpenEditDialog}
              disabled={!fullUserProfile || isSubmitting}
            >
              Edit User
            </Button>
            {userToDisplay.status === "UNCONFIRMED" &&
              userToDisplay["custom:veri_submitted"] === "true" && (
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

      <section className="bg-white p-6 rounded-xl drop-shadow-sm shadow-sm mb-8">
        <h2 className="text-lg font-semibold text-[#00113D] mb-4">
          User Verification Details
        </h2>
        {isLoadingProfile ? (
          <CircularProgress />
        ) : !fullUserProfile ? (
          <Typography>No verification data available.</Typography>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm mb-6">
              <div className="flex items-center gap-3">
                <IoShieldCheckmarkOutline size={20} className="text-gray-500" />
                <div>
                  <span className="text-gray-600 block">
                    Verification Status
                  </span>
                  <span className="font-semibold">
                    {fullUserProfile["custom:id_verified"] === "1"
                      ? "Verified"
                      : fullUserProfile["custom:id_verified"] === "2"
                      ? "Rejected"
                      : "Pending"}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-gray-600 block">Fayda / ID Number</span>
                <span className="font-semibold">
                  {fullUserProfile["custom:idNumber"] || "Not Provided"}
                </span>
              </div>
              <div>
                <span className="text-gray-600 block">ID Expiration</span>
                <span className="font-semibold">
                  {formatDate(fullUserProfile["custom:id_exp"])}
                </span>
              </div>
            </div>
            <Divider sx={{ my: 2 }} />
            <h3 className="text-md font-semibold text-gray-800 mb-3">
              Submitted Documents
            </h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries(imageUrls).map(([key, { url, loading }]) => (
                <div key={key} className="text-center group">
                  {loading ? (
                    <div className="w-28 h-28 bg-gray-200 rounded-lg flex items-center justify-center">
                      <CircularProgress size={24} />
                    </div>
                  ) : url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt={key}
                        className="w-28 h-28 rounded-lg object-cover border-2 border-transparent group-hover:border-blue-500 transition"
                      />
                    </a>
                  ) : (
                    <div className="w-28 h-28 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                      Not Submitted
                    </div>
                  )}
                  <span className="text-xs text-gray-600 mt-1 block capitalize">
                    {key.replace("id", "ID ")}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <div className="bg-white w-full drop-shadow-sm shadow-sm rounded-lg">
        <div className="p-4 md:p-6 rounded-lg">
          <h2 className="text-lg font-semibold pl-2 my-4 md:my-6">
            Rental History (Cars Rented)
          </h2>
          {isLoadingHistory ? (
            <div className="text-center py-8">
              <CircularProgress />
            </div>
          ) : historyError ? (
            <div className="text-center py-8 text-red-600">{historyError}</div>
          ) : sortedRentals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No rental history found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-50 font-semibold border-b">
                    {[
                      "Rent Start",
                      "Rent End",
                      "Car Name",
                      "Car Owner",
                      "Owner Phone",
                      "Status",
                    ].map((head) => (
                      <th
                        key={head}
                        className="px-4 py-3 text-left text-sm font-semibold text-gray-600 cursor-pointer"
                        onClick={() =>
                          handleSort(head.toLowerCase().replace(/ /g, ""))
                        }
                      >
                        {head} <HiMiniArrowsUpDown className="inline ml-1" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRentals.map((rental) => (
                    <tr
                      key={rental.bookingId}
                      className="hover:bg-gray-50 border-b"
                    >
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {rental.startDate}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {rental.endDate}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {rental.carName}
                      </td>
                      <td className="px-4 py-3 text-sm">{rental.carOwner}</td>
                      <td className="px-4 py-3 text-sm">{rental.phone}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            statusColors[rental.status] || "bg-gray-200"
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

      <Dialog
        open={isVerifyDialogOpen}
        onClose={handleCloseVerifyDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Approve User Account</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Enter the expiration date for the user's verification.
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVerifyDialog} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmApprove}
            variant="contained"
            disabled={isSubmitting || !expDate}
          >
            {isSubmitting ? <CircularProgress size={24} /> : "Confirm Approval"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={isDenyDialogOpen}
        onClose={handleCloseDenyDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Confirm Account Denial</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to deny this user's account?
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
