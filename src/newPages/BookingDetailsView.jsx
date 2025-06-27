// src/components/BookingDetailsView.js

import React, { useState, useEffect, useCallback } from "react";
import {
  // Material UI components
  Box,
  Typography,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
} from "@mui/material";
// Icons used
import {
  IoChatboxOutline,
  IoLocationOutline,
  IoPersonOutline,
} from "react-icons/io5";
import { MdOutlineLocalPhone, MdOutlineMail } from "react-icons/md";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import {
  FaStar,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
} from "react-icons/fa";

// Static image fallbacks
import image from "./avatar.png";
import image1 from "./avatar1.png";

// API and Hooks
import { getDownloadUrl } from "../api";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isSameDay, addDays } from "date-fns";

// Base API URL
const API_BASE_URL =
  "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1";

// Constants
const placeholderProfileImage = "https://via.placeholder.com/150";
const placeholderVehicleImage =
  "https://via.placeholder.com/600x400.png?text=No+Image+Available";

// --- HELPER FUNCTIONS ---
const getDocumentName = (key) => {
  if (!key || typeof key !== "string") return "Document";
  try {
    const parts = key.split("/");
    const filename = parts[parts.length - 1];
    const name = filename.split("-")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return "Document";
  }
};

function groupConsecutiveDates(dates) {
  if (!dates || dates.length === 0) return [];
  const sorted = dates
    .map((d) => parseISO(d))
    .sort((a, b) => a.getTime() - b.getTime());
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

function formatDateRange(group) {
  const start = group[0];
  const end = group[group.length - 1];
  if (isSameDay(start, end)) return format(start, "MMMM d, yyyy");
  if (format(start, "yyyy") !== format(end, "yyyy"))
    return `${format(start, "MMMM d, yyyy")} – ${format(end, "MMMM d, yyyy")}`;
  if (format(start, "MMMM") !== format(end, "MMMM"))
    return `${format(start, "MMMM d")} – ${format(end, "MMMM d, yyyy")}`;
  return `${format(start, "MMMM d")}–${format(end, "d, yyyy")}`;
}

const BookingDetailsView = ({ selectedBooking }) => {
  const navigate = useNavigate();

  // --- STATE ---
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [ownerUserDetails, setOwnerUserDetails] = useState(null);
  const [renteeDetails, setRenteeDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingUrls, setLoadingUrls] = useState(false);

  // Media and Image Gallery State
  const [imageUrls, setImageUrls] = useState([]);
  const [documentUrls, setDocumentUrls] = useState([]);
  const [selectedImageForDisplay, setSelectedImageForDisplay] = useState(
    placeholderVehicleImage
  );
  const [isFullScreenView, setIsFullScreenView] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Profile Image State
  const [ownerProfileImageUrl, setOwnerProfileImageUrl] = useState(
    placeholderProfileImage
  );
  const [isOwnerProfileImageLoading, setIsOwnerProfileImageLoading] =
    useState(true);

  // Modal State
  const [showEventsModal, setShowEventsModal] = useState(false);

  // Other State
  const [rentalRating, setRentalRating] = useState(0);

  const admin = JSON.parse(localStorage.getItem("admin"));
  const adminId = admin?.username;
  const adminToken = admin?.AccessToken;

  // --- HELPER & EVENT HANDLERS (useCallback) ---
  const formatDateTime = useCallback((isoString) => {
    if (!isoString) return "N/A";
    try {
      return new Date(isoString)
        .toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
        .replace(",", " |");
    } catch (e) {
      return "Error";
    }
  }, []);

  const getInitials = useCallback((fullName) => {
    if (!fullName || typeof fullName !== "string" || !fullName.trim())
      return null;
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return null;
    if (parts.length === 1) return parts[0][0].toUpperCase();
    const first = parts[0][0].toUpperCase();
    const last = parts[parts.length - 1][0].toUpperCase();
    return first && last ? first + last : first || last || null;
  }, []);

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
      case "review":
        return (
          <PendingActionsOutlinedIcon className="text-yellow-600 inline-block mr-1" />
        );
      default:
        return null;
    }
  }, []);

  const getUserDisplayName = useCallback((user) => {
    if (!user) return "N/A";
    return (
      [user.given_name, user.family_name].filter(Boolean).join(" ").trim() ||
      user.id ||
      "Unknown"
    );
  }, []);

  const getUserPhoneNumber = useCallback(
    (user) => user?.phone_number || "N/A",
    []
  );

  const handleChatWithOwner = useCallback(
    (ownerId, ownerGivenName, ownerFamilyName, bookingId) => {
      if (!adminId) {
        alert("Your admin ID is missing. Please log in again.");
        return;
      }
      if (!ownerId) {
        alert("Owner details missing. Cannot initiate chat.");
        return;
      }
      navigate(
        `/chat?renteeId=${ownerId}&reservationId=${bookingId}&given_name=${ownerGivenName}&family_name=${ownerFamilyName}`
      );
    },
    [navigate, adminId]
  );

  const handleChatWithRentee = useCallback(
    (renteeId, renteeGivenName, renteeFamilyName, bookingId) => {
      if (!adminId) {
        alert("Your admin ID is missing. Please log in again.");
        return;
      }
      if (!renteeId) {
        alert("Rentee details missing. Cannot initiate chat.");
        return;
      }
      navigate(
        `/chat?renteeId=${renteeId}&reservationId=${bookingId}&given_name=${renteeGivenName}&family_name=${renteeFamilyName}`
      );
    },
    [navigate, adminId]
  );

  const fetchDownloadUrls = useCallback(
    async (vehicle) => {
      if (!vehicle) return;
      setLoadingUrls(true);
      const vehicleKeys = vehicle.vehicleImageKeys || [];
      const documentKeys = vehicle.adminDocumentKeys || [];

      try {
        const imgPromises = vehicleKeys.map((keyObj) =>
          getDownloadUrl(
            typeof keyObj === "string" ? keyObj : keyObj?.key
          ).catch(() => null)
        );
        const docPromises = documentKeys.map((keyObj) => {
          const key = typeof keyObj === "string" ? keyObj : keyObj?.key;
          return getDownloadUrl(key)
            .then((res) => ({ ...res, originalKey: key }))
            .catch(() => null);
        });

        const imgResults = (await Promise.all(imgPromises))
          .map((res) => res?.body)
          .filter(Boolean);
        const docResults = (await Promise.all(docPromises))
          .map((res) =>
            res?.body
              ? { url: res.body, name: getDocumentName(res.originalKey) }
              : null
          )
          .filter(Boolean);

        setImageUrls(
          imgResults.length ? imgResults : [placeholderVehicleImage]
        );
        setSelectedImageForDisplay(
          imgResults.length ? imgResults[0] : placeholderVehicleImage
        );
        setDocumentUrls(docResults);
      } catch (err) {
        console.error("Error fetching media URLs:", err);
      } finally {
        setLoadingUrls(false);
      }
    },
    [getDownloadUrl]
  );

  const fetchRentalRating = useCallback(async (carID) => {
    if (!carID) return 0;
    try {
      console.warn("Using placeholder logic for fetchRentalRating.");
      return 4.5;
    } catch (error) {
      console.error("Error fetching rental rating:", error);
      return 0;
    }
  }, []);

  useEffect(() => {
    if (!selectedBooking || !adminToken) {
      setLoading(false);
      setError(
        new Error("Booking details cannot be loaded. Missing parameters.")
      );
      return;
    }
    const fetchAllDetails = async () => {
      setLoading(true);
      setError(null);
      setVehicleDetails(null);
      setOwnerUserDetails(null);
      setRenteeDetails(null);
      setOwnerProfileImageUrl(placeholderProfileImage);
      setIsOwnerProfileImageLoading(true);
      const { carId, ownerId, renteeId } = selectedBooking;

      const ownerUserPromise = ownerId
        ? fetch(`${API_BASE_URL}/user/${ownerId}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
          })
        : Promise.resolve(null);
      const vehiclePromise = carId
        ? fetch(`${API_BASE_URL}/vehicle/${carId}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
          })
        : Promise.resolve(null);
      const renteeUserPromise = renteeId
        ? fetch(`${API_BASE_URL}/user/${renteeId}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
          })
        : Promise.resolve(null);

      const [ownerRes, vehicleRes, renteeRes] = await Promise.allSettled([
        ownerUserPromise,
        vehiclePromise,
        renteeUserPromise,
      ]);

      if (ownerRes.status === "fulfilled" && ownerRes.value?.ok) {
        const ownerData = await ownerRes.value.json();
        setOwnerUserDetails(ownerData);
        const picKey = ownerData["custom:profile_picture_key"];
        if (picKey) {
          try {
            const imgUrlRes = await getDownloadUrl(picKey);
            setOwnerProfileImageUrl(imgUrlRes?.body || placeholderProfileImage);
          } catch {
            setOwnerProfileImageUrl(placeholderProfileImage);
          }
        }
      }
      setIsOwnerProfileImageLoading(false);

      if (vehicleRes.status === "fulfilled" && vehicleRes.value?.ok) {
        const vehicleData = await vehicleRes.value.json();
        setVehicleDetails(vehicleData.body);
        fetchDownloadUrls(vehicleData.body);
        fetchRentalRating(carId).then(setRentalRating);
      }

      if (renteeRes.status === "fulfilled" && renteeRes.value?.ok) {
        const renteeData = await renteeRes.value.json();
        setRenteeDetails(renteeData);
      }

      setLoading(false);
    };
    fetchAllDetails();
  }, [selectedBooking, adminToken, fetchDownloadUrls, fetchRentalRating]);

  // Modal and Image Viewer Handlers
  const handleOpenEventsModal = () => setShowEventsModal(true);
  const handleCloseEventsModal = () => setShowEventsModal(false);
  const handleViewDocument = (url) => {
    if (url) window.open(url, "_blank");
  };
  const openFullScreen = (index) => {
    setIsFullScreenView(true);
    setCurrentImageIndex(index >= 0 ? index : 0);
  };
  const closeFullScreen = () => setIsFullScreenView(false);
  const nextImage = () =>
    setCurrentImageIndex((p) => (p + 1) % imageUrls.length);
  const previousImage = () =>
    setCurrentImageIndex((p) => (p - 1 + imageUrls.length) % imageUrls.length);

  // --- RENDER LOGIC ---
  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
        sx={{ mt: 4 }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2, mt: 2 }}>
          Loading booking and vehicle details...
        </Typography>
      </Box>
    );
  }
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        Error loading details: {error.message || String(error)}
      </Alert>
    );
  }
  if (!selectedBooking) {
    return <Typography sx={{ mt: 4 }}>No booking selected.</Typography>;
  }

  const ownerDisplayName = getUserDisplayName(ownerUserDetails);
  const renteeDisplayName = getUserDisplayName(renteeDetails);
  const ownerPhoneNumber = getUserPhoneNumber(ownerUserDetails);
  const renteePhoneNumber = getUserPhoneNumber(renteeDetails);
  const ownerInitials = getInitials(ownerDisplayName);
  const renteeInitials = getInitials(renteeDisplayName);

  return (
    <div className="flex flex-col mt-8">
      {/* Owner and Rentee Details Section */}
      <div className="flex w-full gap-4 flex-row">
        {/* Owner Details Section */}
        <section className="h-fit bg-white p-6 space-y-6 w-full lg:w-1/2 px-10 shadow-blue-300 rounded-xl drop-shadow-xs shadow-xs">
          <div className="items-center flex gap-8">
            {isOwnerProfileImageLoading ? (
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <FaSpinner className="animate-spin text-2xl text-gray-400" />
              </div>
            ) : ownerProfileImageUrl &&
              ownerProfileImageUrl !== placeholderProfileImage ? (
              <img
                src={ownerProfileImageUrl}
                alt={`${ownerDisplayName}'s Profile`}
                className="w-32 h-32 rounded-full object-cover flex-shrink-0"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = image1;
                }}
              />
            ) : ownerInitials ? (
              <div className="w-32 h-32 rounded-full bg-blue-600 text-white font-bold text-4xl flex items-center justify-center flex-shrink-0">
                {ownerInitials}
              </div>
            ) : (
              <img
                src={image1}
                alt={`${ownerDisplayName}'s Profile`}
                className="w-32 h-32 rounded-full object-cover flex-shrink-0"
              />
            )}
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold text-[#00113D] mb-2">
                Owner Details
              </h2>
              <h3 className="flex gap-4 text-sm text-[#38393D]">
                <IoPersonOutline size={18} />
                {ownerDisplayName}
              </h3>
              <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                <MdOutlineLocalPhone size={18} />
                <p>{ownerPhoneNumber}</p>
              </div>
              {ownerUserDetails?.email && (
                <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                  <MdOutlineMail size={18} />
                  <p>{ownerUserDetails.email}</p>
                </div>
              )}
              {(ownerUserDetails?.city || vehicleDetails?.city) && (
                <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                  <IoLocationOutline size={18} />
                  <p>
                    {ownerUserDetails?.city ||
                      vehicleDetails?.city ||
                      "Location Available"}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 text-sm border rounded-full border-[#00113D] text-[#00113D] bg-white cursor-pointer hover:bg-gray-100">
                <IoChatboxOutline size={16} />
                <button
                  onClick={() =>
                    handleChatWithOwner(
                      selectedBooking?.ownerId,
                      ownerUserDetails?.given_name,
                      ownerUserDetails?.family_name,
                      selectedBooking?.id
                    )
                  }
                  disabled={!adminId || !selectedBooking?.ownerId}
                >
                  Chat With Owner
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Rentee Details Section */}
        <section className="h-fit bg-white p-6 space-y-6 w-full lg:w-1/2 px-10 shadow-blue-300 rounded-xl drop-shadow-xs shadow-xs">
          <div className="items-center flex gap-8">
            {renteeInitials ? (
              <div className="w-32 h-32 rounded-full bg-green-600 text-white font-bold text-4xl flex items-center justify-center flex-shrink-0">
                {renteeInitials}
              </div>
            ) : (
              <img
                src={image}
                alt={`${renteeDisplayName}'s Profile`}
                className="w-32 h-32 rounded-full object-cover"
              />
            )}
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold text-[#00113D] mb-2">
                Rentee Details
              </h2>
              <h3 className="flex gap-4 text-sm text-[#38393D]">
                <IoPersonOutline size={18} />
                {renteeDisplayName}
              </h3>
              <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                <MdOutlineLocalPhone size={18} />
                <p>{renteePhoneNumber}</p>
              </div>
              {renteeDetails?.email && (
                <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                  <MdOutlineMail size={18} />
                  <p>{renteeDetails.email}</p>
                </div>
              )}
              {renteeDetails?.city && (
                <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                  <IoLocationOutline size={18} />
                  <p>{renteeDetails.city}</p>
                </div>
              )}
              <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 text-sm border rounded-full border-[#00113D] text-[#00113D] bg-white cursor-pointer hover:bg-gray-100">
                <IoChatboxOutline size={16} />
                <button
                  onClick={() =>
                    handleChatWithRentee(
                      selectedBooking?.renteeId,
                      renteeDetails?.given_name,
                      renteeDetails?.family_name,
                      selectedBooking?.id
                    )
                  }
                  disabled={!adminId || !selectedBooking?.renteeId}
                >
                  Chat With Rentee
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Booking, Account, and Stat Sections */}
      <div className="flex w-full pt-8 gap-4 lg:flex-row flex-col">
        <section className="w-full lg:w-1/3 bg-white p-6 h-fit shadow-blue-300 rounded-xl drop-shadow-xs shadow-xs">
          <h2 className="text-lg font-semibold text-[#00113D] mb-4">
            Booking Details
          </h2>
          <div className="flex flex-col text-sm text-[#38393D]">
            <div className="flex items-center gap-2 mb-2">
              Status:
              <span className="ml-2 font-semibold text-sky-950">
                {getStatusIcon(selectedBooking?.approvedStatus)}
                {selectedBooking?.approvedStatus || "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              Booking Created At:
              <span className="ml-2 font-semibold text-sky-950">
                {formatDateTime(selectedBooking?.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              Pickup Date:
              <span className="ml-2 font-semibold text-sky-950">
                {formatDateTime(selectedBooking?.startDate)}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              Dropoff Date:
              <span className="ml-2 font-semibold text-sky-950">
                {formatDateTime(selectedBooking?.endDate)}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              Total Amount:
              <span className="ml-2 font-semibold text-sky-950">
                {selectedBooking?.amount
                  ? `${parseFloat(
                      selectedBooking.amount
                    ).toLocaleString()} Birr`
                  : "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              Payment Status:
              <span
                className={`ml-2 font-semibold ${
                  selectedBooking?.isPayed === "paid"
                    ? "text-green-600"
                    : selectedBooking?.isPayed === "pending"
                    ? "text-yellow-600"
                    : "text-gray-600"
                }`}
              >
                {selectedBooking?.isPayed || "N/A"}
              </span>
            </div>
          </div>
        </section>

        <section className="w-full lg:w-1/3 bg-white p-6 h-fit shadow-blue-300 rounded-xl drop-shadow-xs shadow-xs">
          <h2 className="text-lg font-semibold text-[#00113D] mb-4">
            Vehicle Listing Status
          </h2>
          {vehicleDetails === null &&
            selectedBooking?.carId &&
            !loading &&
            !error && (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="100px"
              >
                <CircularProgress size={20} />
                <Typography sx={{ ml: 1 }}>Loading Status...</Typography>
              </Box>
            )}
          {vehicleDetails === null && selectedBooking?.carId && error && (
            <Typography variant="body2" color="error.main" sx={{ mb: 2 }}>
              Could not load vehicle status.
            </Typography>
          )}
          {vehicleDetails ? (
            <div className="flex flex-col text-sm text-[#38393D]">
              <div className="flex items-center gap-2 mb-2">
                Approval Status:
                <span className="ml-2 font-semibold text-sky-950">
                  {getStatusIcon(vehicleDetails?.isApproved)}
                  {vehicleDetails?.isApproved || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                Admin Status:
                <span className="ml-2 font-semibold text-sky-950">
                  {getStatusIcon(vehicleDetails?.isActive)}
                  {vehicleDetails?.isActive || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                Listed Price:
                <span className="ml-2 font-semibold text-sky-950">
                  {vehicleDetails?.price
                    ? `${parseFloat(
                        vehicleDetails.price
                      ).toLocaleString()} Birr/Day`
                    : "N/A"}
                </span>
              </div>
              <div
                className="flex justify-center items-center gap-2 mt-7 px-4 py-2 text-sm border rounded-full border-[#00113D] text-[#00113D] bg-white cursor-pointer hover:bg-gray-100"
                onClick={handleOpenEventsModal}
              >
                <CalendarMonthOutlinedIcon fontSize="small" />
                <button>Unavailable Dates</button>
              </div>
            </div>
          ) : (
            <Typography variant="body2" color="textSecondary">
              Vehicle details not available.
            </Typography>
          )}
        </section>

        <section className="w-full lg:w-1/3 bg-white p-6 h-fit shadow-blue-300 rounded-xl drop-shadow-xs shadow-xs">
          <h2 className="text-lg font-semibold text-[#00113D] mb-4">
            Rental Rating
          </h2>
          {vehicleDetails ? (
            <div className="flex flex-col text-sm text-[#38393D]">
              <div className="flex items-center gap-2 mb-2">
                Average Rating:
                <span className="ml-2 font-semibold text-sky-950">
                  {rentalRating > 0 ? (
                    <>
                      {rentalRating.toFixed(1)}{" "}
                      <FaStar className="inline text-yellow-500 ml-1" />
                    </>
                  ) : (
                    "N/A"
                  )}
                </span>
              </div>
            </div>
          ) : (
            <Typography variant="body2" color="textSecondary">
              Cannot load rating without vehicle details.
            </Typography>
          )}
        </section>
      </div>

      {vehicleDetails && (
        <div className="p-10 bg-white w-full flex flex-col drop-shadow-sm shadow-blue-200 shadow mt-8 rounded-lg">
          <div className=" text-xl font-semibold mb-8">Vehicle Overview</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 p-4 gap-4 ">
            <div className="flex flex-col">
              <Typography variant="caption" color="textSecondary">
                Vehicle Type
              </Typography>
              <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                {vehicleDetails.category || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <Typography variant="caption" color="textSecondary">
                Vehicle Make
              </Typography>
              <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                {vehicleDetails.make || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <Typography variant="caption" color="textSecondary">
                Vehicle Model
              </Typography>
              <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                {vehicleDetails.model || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <Typography variant="caption" color="textSecondary">
                Year of Manufacture
              </Typography>
              <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                {vehicleDetails.year || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <Typography variant="caption" color="textSecondary">
                License Plate Number
              </Typography>
              <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                {vehicleDetails.vehicleNumber || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <Typography variant="caption" color="textSecondary">
                Mileage
              </Typography>
              <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                {vehicleDetails.mileage
                  ? `${vehicleDetails.mileage} KM`
                  : "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <Typography variant="caption" color="textSecondary">
                Fuel Type
              </Typography>
              <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                {vehicleDetails.fuelType || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <Typography variant="caption" color="textSecondary">
                Transmission Type
              </Typography>
              <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                {vehicleDetails.transmission || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <Typography variant="caption" color="textSecondary">
                Doors
              </Typography>
              <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                {vehicleDetails.doors || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <Typography variant="caption" color="textSecondary">
                Seats
              </Typography>
              <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                {vehicleDetails.seats || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <Typography variant="caption" color="textSecondary">
                Vehicle ID
              </Typography>
              <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                {vehicleDetails.id || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <Typography variant="caption" color="textSecondary">
                Color
              </Typography>
              <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                {vehicleDetails.color || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <Typography variant="caption" color="textSecondary">
                Plate Region
              </Typography>
              <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                {vehicleDetails.plateRegion || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <Typography variant="caption" color="textSecondary">
                Plate Code Number
              </Typography>
              <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                {vehicleDetails.licensePlateCodeNumber || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <Typography variant="caption" color="textSecondary">
                City
              </Typography>
              <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                {vehicleDetails.city || "N/A"}
              </span>
            </div>
          </div>
          {vehicleDetails.carFeatures && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Features
              </Typography>
              {vehicleDetails.carFeatures.length > 0 ? (
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
          )}
        </div>
      )}

      {/* --- REPLACEMENT STARTS HERE --- */}

      {/* Documents and Photos Sections in two columns */}
      {(vehicleDetails || loadingUrls) && (
        <div className="flex lg:flex-row flex-col gap-8 mt-4">
          {/* Documents and Compliance */}
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
                    onClick={() => handleViewDocument(doc.url)}
                    startIcon={<AttachFileIcon />}
                    sx={{ justifyContent: "flex-start", textTransform: "none" }}
                  >
                    {doc.name}
                  </Button>
                ))}
              </div>
            ) : vehicleDetails ? (
              <Typography variant="body2" color="textSecondary">
                No documents available for this vehicle.
              </Typography>
            ) : (
              <Typography variant="body2" color="textSecondary">
                Vehicle details not loaded.
              </Typography>
            )}
          </div>

          {/* Photos and Media */}
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
                  alt="Selected vehicle"
                  className="w-full h-auto max-h-[400px] object-contain rounded-lg mb-4 cursor-pointer"
                  onClick={() =>
                    openFullScreen(imageUrls.indexOf(selectedImageForDisplay))
                  }
                />
                {imageUrls.length > 1 && (
                  <div className="flex justify-start space-x-2 items-center mt-2 overflow-x-auto pb-2">
                    {imageUrls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Thumbnail ${index + 1}`}
                        onClick={() => setSelectedImageForDisplay(url)}
                        className={`w-20 h-20 object-cover cursor-pointer rounded-lg border-2 flex-shrink-0 ${
                          selectedImageForDisplay === url
                            ? "border-blue-500"
                            : "border-transparent hover:border-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : vehicleDetails ? (
              <Typography variant="body2" color="textSecondary">
                No photos available for this vehicle.
              </Typography>
            ) : (
              <Typography variant="body2" color="textSecondary">
                Vehicle details not loaded.
              </Typography>
            )}
          </div>
        </div>
      )}

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
          {vehicleDetails?.unavailableDates &&
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

      {/* Full-Screen Image Viewer */}
      {/* {isFullScreenView && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-90 p-4">
          <button
            onClick={closeFullScreen}
            className="absolute top-5 right-5 z-10 text-white text-3xl hover:opacity-75"
          >
            <FaTimes />
          </button>

          <img
            src={imageUrls[currentImageIndex]}
            alt={`Fullscreen view ${currentImageIndex + 1}`}
            className="max-w-[95vw] max-h-[95vh] object-contain"
          />

          {imageUrls.length > 1 && (
            <>
              <button
                onClick={previousImage}
                className="absolute top-1/2 left-5 -translate-y-1/2 text-white text-4xl hover:opacity-75"
              >
                <FaChevronLeft />
              </button>
              <button
                onClick={nextImage}
                className="absolute top-1/2 right-5 -translate-y-1/2 text-white text-4xl hover:opacity-75"
              >
                <FaChevronRight />
              </button>
            </>
          )}
        </div>
      )} */}

      {/* --- REPLACEMENT ENDS HERE --- */}
    </div>
  );
};

export default BookingDetailsView;
