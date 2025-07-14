import React, { useEffect, useState, useCallback } from "react";
import {
  // Import icons
  IoPersonOutline,
  IoLocationOutline,
  IoChatboxOutline,
} from "react-icons/io5";
import { MdOutlineLocalPhone, MdOutlineMail } from "react-icons/md";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import {
  // Added status and image viewer icons
  FaStar,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
} from "react-icons/fa";
import { getDownloadUrl } from "../api";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isSameDay, addDays } from "date-fns"; // <-- REQUIRED IMPORT

import {
  // Material UI components
  Typography,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const placeholderProfileImage = "https://via.placeholder.com/150";
const placeholderVehicleImage =
  "https://via.placeholder.com/600x400.png?text=No+Image+Available";

// --- API Base URL ---
const API_BASE_URL =
  "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod";

// --- HELPER: Get a friendlier name from a document key ---
const getDocumentName = (key) => {
  if (!key || typeof key !== "string") return "Document";
  try {
    const parts = key.split("/");
    const filename = parts[parts.length - 1];
    // Remove potential random numbers (e.g., 'front-334' becomes 'front')
    const name = filename.split("-")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return "Document";
  }
};

// --- HELPER: Group consecutive dates from an array of ISO strings ---
function groupConsecutiveDates(dates) {
  if (!dates || dates.length === 0) return [];

  const sorted = dates
    .map((dateStr) => parseISO(dateStr))
    .sort((a, b) => a - b);

  if (sorted.length === 0) return [];

  const groups = [];
  let currentGroup = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = currentGroup[currentGroup.length - 1];
    const curr = sorted[i];

    if (isSameDay(curr, addDays(prev, 1))) {
      currentGroup.push(curr);
    } else {
      groups.push([...currentGroup]);
      currentGroup = [curr];
    }
  }

  groups.push([...currentGroup]);
  return groups;
}

// --- HELPER: Format a group of dates into a readable string range ---
function formatDateRange(group) {
  const start = group[0];
  const end = group[group.length - 1];

  if (isSameDay(start, end)) {
    return format(start, "MMMM d, yyyy");
  }

  if (format(start, "yyyy") !== format(end, "yyyy")) {
    return `${format(start, "MMMM d, yyyy")} – ${format(end, "MMMM d, yyyy")}`;
  }

  if (format(start, "MMMM") !== format(end, "MMMM")) {
    return `${format(start, "MMMM d")} – ${format(end, "MMMM d, yyyy")}`;
  }

  return `${format(start, "MMMM d")}–${format(end, "d, yyyy")}`;
}

const Account = ({ vehicleId, adminToken }) => {
  const navigate = useNavigate();

  // Component State
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(
    placeholderProfileImage
  );
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [rentalRating, setRentalRating] = useState(0);

  // Media and Document State
  const [imageUrls, setImageUrls] = useState([]);
  const [documentUrls, setDocumentUrls] = useState([]);
  const [loadingUrls, setLoadingUrls] = useState(false);
  const [selectedImageForDisplay, setSelectedImageForDisplay] = useState(
    placeholderVehicleImage
  );
  const [isFullScreenView, setIsFullScreenView] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Modal and Dialog State
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [dialogOpen, setDialogOpen] = useState({
    softDelete: false,
    restore: false,
    permanentDelete: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const admin = JSON.parse(localStorage.getItem("admin"));
  const adminId = admin?.username;

  const fetchVehicleDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const vehicleApiUrl = `${API_BASE_URL}/v1/vehicle/${vehicleId}`;
      const vehicleResponse = await fetch(vehicleApiUrl, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!vehicleResponse.ok)
        throw new Error(`Failed to fetch vehicle: ${vehicleResponse.status}`);

      const vehicleData = await vehicleResponse.json();
      if (vehicleData && vehicleData.body) {
        const vehicle = vehicleData.body;
        setVehicleDetails(vehicle);

        if (vehicle.ownerId) {
          setIsImageLoading(true);
          try {
            const profileApiUrl = `${API_BASE_URL}/v1/user/${vehicle.ownerId}`;
            const profileResponse = await fetch(profileApiUrl, {
              headers: { Authorization: `Bearer ${adminToken}` },
            });
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              setOwnerProfile(profileData);
              const picKey = profileData["custom:profile_picture_key"];
              if (picKey) {
                const urlRes = await getDownloadUrl(picKey);
                setProfileImageUrl(urlRes?.body || placeholderProfileImage);
              }
            }
          } catch (e) {
            console.error("Failed to fetch owner profile:", e);
          } finally {
            setIsImageLoading(false);
          }
        } else {
          setIsImageLoading(false);
        }

        await fetchDownloadUrls(vehicle);
        const rating = await fetchRentalRating(vehicle.id);
        setRentalRating(rating);
      } else {
        setError("Invalid vehicle data structure.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [vehicleId, adminToken]);

  // --- Admin Action Handlers ---

  const handleSoftDelete = useCallback(async () => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/admin/soft_delete_vehicle/${vehicleId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to soft delete.");
      }
      setDialogOpen((prev) => ({ ...prev, softDelete: false }));
      await fetchVehicleDetails(); // Refresh data
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [vehicleId, adminToken, fetchVehicleDetails]);

  const handleRestore = useCallback(async () => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/admin/restore_vehicle/${vehicleId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to restore vehicle.");
      }
      setDialogOpen((prev) => ({ ...prev, restore: false }));
      await fetchVehicleDetails(); // Refresh data
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [vehicleId, adminToken, fetchVehicleDetails]);

  const handlePermanentDelete = useCallback(async () => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/admin/permanently_delete_vehicle/${vehicleId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        // The API nests the actual message inside a 'body' object which is a stringified JSON
        const body = errorData.body || "{}";
        const message = body.message || "Failed to permanently delete.";
        const details = body.daysRemaining
          ? `Days remaining: ${body.daysRemaining}.`
          : "";
        throw new Error(`${message} ${details}`);
      }

      setDialogOpen((prev) => ({ ...prev, permanentDelete: false }));
      alert("Vehicle permanently deleted.");
      navigate("/vehicles"); // Navigate away after successful deletion
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [vehicleId, adminToken, navigate]);

  const handleChatWithOwner = useCallback(
    (ownerId, ownerGivenName, ownerFamilyName, currentVehicleId) => {
      if (!adminId) {
        alert("Your admin ID is missing. Please log in again.");
        return;
      }
      if (!ownerId) {
        alert("Owner details missing. Cannot initiate chat.");
        return;
      }
      navigate(
        `/chat?renteeId=${ownerId}&reservationId=${currentVehicleId}&given_name=${ownerGivenName}&family_name=${ownerFamilyName}`
      );
    },
    [navigate, adminId]
  );

  const fetchDownloadUrls = useCallback(async (vehicle) => {
    setLoadingUrls(true);

    // --- Fetch Image URLs ---
    const imageKeys = vehicle.vehicleImageKeys || [];
    if (imageKeys.length > 0) {
      const imagePromises = imageKeys.map(async (keyObj) => {
        // Handle both string keys and {key: "..."} objects
        const key = typeof keyObj === "string" ? keyObj : keyObj?.key;
        if (!key) return null;
        try {
          const urlResponse = await getDownloadUrl(key);
          return urlResponse?.body || null;
        } catch (error) {
          console.error(
            `Failed to get download URL for image key ${key}:`,
            error
          );
          return null;
        }
      });
      const fetchedImageUrls = (await Promise.all(imagePromises)).filter(
        Boolean
      );

      if (fetchedImageUrls.length > 0) {
        setImageUrls(fetchedImageUrls);
        setSelectedImageForDisplay(fetchedImageUrls[0]);
      } else {
        setImageUrls([placeholderVehicleImage]);
        setSelectedImageForDisplay(placeholderVehicleImage);
      }
    } else {
      setImageUrls([placeholderVehicleImage]);
      setSelectedImageForDisplay(placeholderVehicleImage);
    }

    // --- Fetch Document URLs ---
    const docKeys = vehicle.adminDocumentKeys || [];
    if (docKeys.length > 0) {
      const docPromises = docKeys.map(async (keyObj) => {
        const key = typeof keyObj === "string" ? keyObj : keyObj?.key;
        if (!key) return null;
        try {
          const urlResponse = await getDownloadUrl(key);
          if (urlResponse?.body) {
            return { url: urlResponse.body, name: getDocumentName(key) };
          }
          return null;
        } catch (error) {
          console.error(
            `Failed to get download URL for doc key ${key}:`,
            error
          );
          return null;
        }
      });
      const fetchedDocUrls = (await Promise.all(docPromises)).filter(Boolean);
      setDocumentUrls(fetchedDocUrls);
    } else {
      setDocumentUrls([]);
    }

    setLoadingUrls(false);
  }, []);

  const fetchRentalRating = useCallback(async (carID) => {
    if (!carID) return 0;
    console.log("Fetching dummy rating for carId:", carID);
    return 4.5;
  }, []);

  useEffect(() => {
    if (!vehicleId || !adminToken) {
      setLoading(false);
      setError("Vehicle details cannot be loaded. Missing parameters.");
      return;
    }
    fetchVehicleDetails();
  }, [vehicleId, adminToken, fetchVehicleDetails]);

  const handleOpenDialog = (dialog) => {
    setActionError(null);
    setDialogOpen((prev) => ({ ...prev, [dialog]: true }));
  };

  const handleCloseDialog = () => {
    setDialogOpen({
      softDelete: false,
      restore: false,
      permanentDelete: false,
    });
    setActionError(null);
  };

  const handleOpenEventsModal = () => setShowEventsModal(true);
  const handleCloseEventsModal = () => setShowEventsModal(false);
  const handleViewDocument = useCallback((url) => {
    if (url) window.open(url, "_blank");
  }, []);
  const openFullScreen = useCallback((index) => {
    setCurrentImageIndex(index);
    setIsFullScreenView(true);
  }, []);
  const closeFullScreen = useCallback(() => setIsFullScreenView(false), []);
  const nextImage = useCallback(() => {
    if (imageUrls.length > 1)
      setCurrentImageIndex((p) => (p + 1) % imageUrls.length);
  }, [imageUrls.length]);
  const previousImage = useCallback(() => {
    if (imageUrls.length > 1)
      setCurrentImageIndex(
        (p) => (p - 1 + imageUrls.length) % imageUrls.length
      );
  }, [imageUrls.length]);

  const getStatusIcon = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case "approved":
      case "active":
        return <FaCheckCircle className="text-green-600 inline-block mr-1" />;
      case "pending":
        return <FaClock className="text-yellow-600 inline-block mr-1" />;
      case "inactive":
      case "rejected":
        return <FaTimesCircle className="text-red-600 inline-block mr-1" />;
      default:
        return null;
    }
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading vehicle details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
        color="error.main"
      >
        <Typography>Error: {error}</Typography>
      </Box>
    );
  }

  if (!vehicleDetails) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <Typography>No vehicle details available.</Typography>
      </Box>
    );
  }

  const ownerGivenName =
    ownerProfile?.given_name || vehicleDetails?.ownerGivenName || "Unknown";
  const ownerFamilyName =
    ownerProfile?.family_name || vehicleDetails?.ownerSurName || "";

  return (
    <div className="flex flex-col mt-8">
      <div className="flex flex-wrap w-full gap-4">
        {/* User Details Section */}
        <section className="h-fit bg-white p-6 space-y-6 w-fit px-10 shadow-blue-100 rounded-xl drop-shadow-xs shadow-xs">
          <div className="items-center flex gap-8">
            {isImageLoading ? (
              <div className="w-32 h-32 rounded-full flex items-center justify-center bg-gray-100">
                <FaSpinner className="animate-spin text-2xl text-gray-400" />
              </div>
            ) : (
              <img
                src={profileImageUrl}
                alt="User Profile"
                className="w-32 h-32 rounded-full object-cover"
              />
            )}
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold text-[#00113D] mb-2">
                User Details
              </h2>
              <h3 className="flex gap-4 text-sm text-[#38393D]">
                <IoPersonOutline size={18} />
                {ownerGivenName} {ownerFamilyName}
              </h3>
              <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                <MdOutlineLocalPhone size={18} />
                <p>
                  {ownerProfile?.phone_number ||
                    vehicleDetails.ownerPhone ||
                    "N/A"}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                <MdOutlineMail size={18} />
                <p>
                  {ownerProfile?.email || vehicleDetails.ownerEmail || "N/A"}
                </p>
              </div>
              {(ownerProfile?.city ||
                vehicleDetails.city ||
                (vehicleDetails.pickUp && vehicleDetails.pickUp[0])) && (
                <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                  <IoLocationOutline size={18} />
                  <p>
                    {ownerProfile?.city ||
                      vehicleDetails.city ||
                      "Location Available"}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 text-sm border rounded-full border-[#00113D] text-[#00113D] bg-white">
                <IoChatboxOutline size={16} />
                <button
                  onClick={() =>
                    handleChatWithOwner(
                      vehicleDetails?.ownerId,
                      ownerGivenName,
                      ownerFamilyName,
                      vehicleDetails?.id
                    )
                  }
                  disabled={!adminId || !vehicleDetails?.ownerId}
                >
                  Chat With Owner
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Account Details Section */}
        <section className="w-fit bg-white p-6 shadow-blue-100 rounded-xl drop-shadow-xs shadow-xs">
          <h2 className="text-lg font-semibold text-[#00113D] mb-4">
            Vehicle Account Details
          </h2>
          <div className="flex flex-col text-sm text-[#38393D]">
            {vehicleDetails.isDeleted && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                This vehicle is currently soft-deleted.
              </Alert>
            )}
            <div className="flex items-center mb-2">
              Status:
              <span className="ml-2 font-semibold text-sky-950">
                {getStatusIcon(vehicleDetails.isApproved)}
                {vehicleDetails.isApproved}
              </span>
            </div>
            <div className="flex items-center mb-2">
              Admin Status:
              <span className="ml-2 font-semibold text-sky-950">
                {getStatusIcon(vehicleDetails.isActive)}
                {vehicleDetails.isActive}
              </span>
            </div>
            <div className="flex items-center mb-2">
              Registration Date:
              <span className="ml-2 font-semibold text-sky-950">
                {new Date(vehicleDetails.createdAt).toLocaleDateString()} |{" "}
                {new Date(vehicleDetails.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center mb-2">
              Rent Amount:
              <span className="ml-2 font-semibold text-sky-950">
                {vehicleDetails.price} Birr/Day
              </span>
            </div>
            <div
              className="flex justify-center items-center gap-2 mt-12 px-4 py-2 text-sm border rounded-full border-[#00113D] text-[#00113D] bg-white cursor-pointer hover:bg-gray-100"
              onClick={handleOpenEventsModal}
            >
              <CalendarMonthOutlinedIcon fontSize="small" />
              <button>Unavailable Dates</button>
            </div>
          </div>
        </section>

        {/* Admin Actions Section - NEW */}
        <section className="w-fit bg-white p-6 shadow-blue-100 rounded-xl drop-shadow-xs shadow-xs">
          <h2 className="text-lg font-semibold text-[#00113D] mb-4">
            Admin Actions
          </h2>
          <div className="flex flex-col space-y-4">
            {!vehicleDetails.isDeleted ? (
              <Button
                variant="contained"
                color="warning"
                onClick={() => handleOpenDialog("softDelete")}
              >
                Soft Delete Vehicle
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleOpenDialog("restore")}
                >
                  Restore Vehicle
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleOpenDialog("permanentDelete")}
                >
                  Permanently Delete
                </Button>
              </>
            )}
          </div>
        </section>

        {/* Stat Cards Section */}
        <div className="flex flex-col w-1/3 gap-6">
          <div className=" bg-white p-6 flex justify-between items-center w-full shadow-blue-200 rounded-xl drop-shadow-xs shadow-xs">
            <h2 className="text-base font-semibold text-[#00113D] ">
              Total Rentals
            </h2>
            <span className="px-4 text-gray-600 text-base">12</span>
          </div>
          <div className=" bg-white p-6 flex justify-between items-center w-full shadow-blue-200 rounded-xl drop-shadow-xs shadow-xs">
            <h2 className="text-base font-semibold text-[#00113D] ">
              Total Earnings
            </h2>
            <span className="pr-4 text-gray-600 text-base">1,273</span>
          </div>
          <div className=" bg-white p-6 flex justify-between items-center w-full shadow-blue-200 rounded-xl drop-shadow-xs shadow-xs">
            <h2 className="text-base font-semibold text-[#00113D] ">
              Vehicle Rating
            </h2>
            <div className="pr-4 gap-x-2 flex text-lg items-center">
              <FaStar color="gold" size={24} />
              <span className="ml-2">
                {rentalRating !== null ? rentalRating?.toFixed(1) : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Overview Section */}
      <div className="p-10 bg-white w-full flex flex-col drop-shadow-sm shadow-blue-200 shadow mt-8 rounded-lg">
        <div className=" text-xl font-semibold mb-8">Vehicle Overview</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 p-4 gap-4 ">
          <div className="flex flex-col">
            <Typography variant="caption" color="textSecondary">
              Vehicle Type
            </Typography>
            <span className="mt-1 bg-blue-100 rounded-md p-2 ">
              {vehicleDetails.category}
            </span>
          </div>
          <div className="flex flex-col">
            <Typography variant="caption" color="textSecondary">
              Vehicle Make
            </Typography>
            <span className="mt-1 bg-blue-100 rounded-md p-2 ">
              {vehicleDetails.make}
            </span>
          </div>
          <div className="flex flex-col">
            <Typography variant="caption" color="textSecondary">
              Vehicle Model
            </Typography>
            <span className="mt-1 bg-blue-100 rounded-md p-2 ">
              {vehicleDetails.model}
            </span>
          </div>
          <div className="flex flex-col">
            <Typography variant="caption" color="textSecondary">
              Year of Manufacture
            </Typography>
            <span className="mt-1 bg-blue-100 rounded-md p-2 ">
              {vehicleDetails.year}
            </span>
          </div>
          <div className="flex flex-col">
            <Typography variant="caption" color="textSecondary">
              License Plate Number
            </Typography>
            <span className="mt-1 bg-blue-100 rounded-md p-2 ">
              {vehicleDetails.vehicleNumber}
            </span>
          </div>
          <div className="flex flex-col">
            <Typography variant="caption" color="textSecondary">
              Mileage
            </Typography>
            <span className="mt-1 bg-blue-100 rounded-md p-2 ">
              {vehicleDetails.mileage} KM
            </span>
          </div>
          <div className="flex flex-col">
            <Typography variant="caption" color="textSecondary">
              Fuel Type
            </Typography>
            <span className="mt-1 bg-blue-100 rounded-md p-2 ">
              {vehicleDetails.fuelType}
            </span>
          </div>
          <div className="flex flex-col">
            <Typography variant="caption" color="textSecondary">
              Transmission Type
            </Typography>
            <span className="mt-1 bg-blue-100 rounded-md p-2 ">
              {vehicleDetails.transmission}
            </span>
          </div>
          <div className="flex flex-col">
            <Typography variant="caption" color="textSecondary">
              Doors
            </Typography>
            <span className="mt-1 bg-blue-100 rounded-md p-2 ">
              {vehicleDetails.doors}
            </span>
          </div>
          <div className="flex flex-col">
            <Typography variant="caption" color="textSecondary">
              Seats
            </Typography>
            <span className="mt-1 bg-blue-100 rounded-md p-2 ">
              {vehicleDetails.seats}
            </span>
          </div>
          <div className="flex flex-col">
            <Typography variant="caption" color="textSecondary">
              Vehicle ID
            </Typography>
            <span className="mt-1 bg-blue-100 rounded-md p-2 ">
              {vehicleDetails.id}
            </span>
          </div>
          <div className="flex flex-col">
            <Typography variant="caption" color="textSecondary">
              Color
            </Typography>
            <span className="mt-1 bg-blue-100 rounded-md p-2 ">
              {vehicleDetails.color}
            </span>
          </div>
          <div className="flex flex-col">
            <Typography variant="caption" color="textSecondary">
              Plate Region
            </Typography>
            <span className="mt-1 bg-blue-100 rounded-md p-2 ">
              {vehicleDetails.plateRegion}
            </span>
          </div>
          <div className="flex flex-col">
            <Typography variant="caption" color="textSecondary">
              Plate Code Number
            </Typography>
            <span className="mt-1 bg-blue-100 rounded-md p-2 ">
              {vehicleDetails.licensePlateCodeNumber}
            </span>
          </div>
          <div className="flex flex-col">
            <Typography variant="caption" color="textSecondary">
              City
            </Typography>
            <span className="mt-1 bg-blue-100 rounded-md p-2 ">
              {vehicleDetails.city}
            </span>
          </div>
        </div>
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Features
          </Typography>
          {vehicleDetails.carFeatures &&
          vehicleDetails.carFeatures.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {vehicleDetails.carFeatures.map((feature, index) => (
                <span
                  key={index}
                  className="bg-blue-100 rounded-md px-3 py-1 text-sm"
                >
                  {feature}
                </span>
              ))}
            </div>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No features listed.
            </Typography>
          )}
        </Box>
      </div>

      <div className="flex lg:flex-row flex-col gap-8 mt-4">
        {/* Documents and Compliance Section */}
        <div className="p-10 bg-white w-full lg:w-1/2 flex flex-col drop-shadow-sm shadow-blue-200 shadow rounded-lg">
          <div className=" text-xl font-semibold mb-8">
            Documents and Compliance
          </div>
          {loadingUrls ? (
            <Box display="flex" justifyContent="center">
              <CircularProgress size={20} />
            </Box>
          ) : documentUrls.length > 0 ? (
            <div className="flex flex-col gap-4">
              {documentUrls.map((doc, index) => (
                <Button
                  key={index}
                  variant="text"
                  onClick={(e) => {
                    e.preventDefault();
                    handleViewDocument(doc.url);
                  }}
                  startIcon={<AttachFileIcon />}
                  sx={{ justifyContent: "flex-start" }}
                >
                  {doc.name || `Document ${index + 1}`}
                </Button>
              ))}
            </div>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No documents available.
            </Typography>
          )}
        </div>

        {/* Photos and Media Section */}
        <div className="p-10 bg-white w-full lg:w-1/2 flex flex-col mt-lg-0 mt-4 drop-shadow-sm shadow-blue-200 shadow rounded-lg">
          <div className=" text-xl font-semibold mb-8">Photos and Media</div>
          {loadingUrls ? (
            <Box display="flex" justifyContent="center">
              <CircularProgress size={20} />
            </Box>
          ) : imageUrls.length > 0 &&
            imageUrls[0] !== placeholderVehicleImage ? (
            <div className="flex flex-col gap-4">
              <img
                src={selectedImageForDisplay}
                alt="Selected vehicle view"
                className="w-full h-auto max-h-[400px] object-contain rounded-lg mb-4 cursor-pointer"
                onClick={() => {
                  const currentIndex = imageUrls.indexOf(
                    selectedImageForDisplay
                  );
                  openFullScreen(currentIndex >= 0 ? currentIndex : 0);
                }}
              />
              {imageUrls.length > 1 && (
                <div className="flex justify-start space-x-2 items-center mt-2 overflow-x-auto pb-2">
                  {imageUrls.map((thumbUrl, index) => (
                    <img
                      key={index}
                      src={thumbUrl}
                      alt={`Vehicle thumbnail ${index + 1}`}
                      onClick={() => setSelectedImageForDisplay(thumbUrl)}
                      className={`w-20 h-20 object-cover cursor-pointer rounded-lg border-2 flex-shrink-0 ${
                        selectedImageForDisplay === thumbUrl
                          ? "border-blue-500"
                          : "border-transparent hover:border-gray-300"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No photos available.
            </Typography>
          )}
        </div>
      </div>

      {/* --- Dialogs Section --- */}

      {/* Unavailable Dates Dialog */}
      <Dialog
        open={showEventsModal}
        onClose={handleCloseEventsModal}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Unavailable Dates
          <IconButton
            aria-label="close"
            onClick={handleCloseEventsModal}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {vehicleDetails.unavailableDates &&
          vehicleDetails.unavailableDates.length > 0 ? (
            <div className="space-y-3">
              {groupConsecutiveDates(vehicleDetails.unavailableDates).map(
                (dateGroup, i) => (
                  <div
                    key={`unavailable-${i}`}
                    className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-md"
                  >
                    <CalendarMonthOutlinedIcon className="text-red-600" />
                    <span className="text-sm font-medium text-red-800">
                      {formatDateRange(dateGroup)}
                    </span>
                  </div>
                )
              )}
            </div>
          ) : (
            <Typography>
              No specific unavailable dates have been marked for this vehicle.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEventsModal}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialogs for Admin Actions */}
      <Dialog open={dialogOpen.softDelete} onClose={handleCloseDialog}>
        <DialogTitle>Confirm Soft Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to mark this vehicle as deleted? The owner
            will no longer see it, but it can be restored within 90 days.
          </Typography>
          {actionError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {actionError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSoftDelete}
            color="warning"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogOpen.restore} onClose={handleCloseDialog}>
        <DialogTitle>Confirm Vehicle Restoration</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to restore this vehicle? It will become active
            and visible to the owner again.
          </Typography>
          {actionError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {actionError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleRestore}
            color="success"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogOpen.permanentDelete} onClose={handleCloseDialog}>
        <DialogTitle>Confirm Permanent Deletion</DialogTitle>
        <DialogContent>
          <Alert severity="error">
            This action is irreversible and will permanently delete all data for
            this vehicle.
          </Alert>
          <Typography sx={{ mt: 2 }}>
            Please confirm you want to proceed.
          </Typography>
          {actionError && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {actionError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handlePermanentDelete}
            color="error"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : (
              "Confirm Permanent Delete"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Account;
