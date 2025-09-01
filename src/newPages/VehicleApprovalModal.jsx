// VehicleApprovalModal.js
import React, { useEffect, useState, useCallback } from "react";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isSameDay, addDays } from "date-fns";

import {
  Typography,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import PhoneOutlined from "@mui/icons-material/PhoneOutlined";

import {
  IoChatboxOutline,
  IoLocationOutline,
  IoPersonOutline,
} from "react-icons/io5";
import { MdOutlineLocalPhone, MdOutlineMail } from "react-icons/md";
import {
  FaStar,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
} from "react-icons/fa";

import { getDownloadUrl } from "../api";
import image from "./avatar.png";

// Constants
const API_STATUS_TO_COLUMN = {
  pending: "inReview",
  approved: "approved",
  denied: "rejected",
  null: "unassigned",
  "": "unassigned",
};
const columnLabels = {
  unassigned: "Unassigned",
  inReview: "In Review",
  approved: "Approved",
  rejected: "Rejected",
};
const placeholderProfileImage = "https://via.placeholder.com/150";
const placeholderVehicleImage =
  "https://via.placeholder.com/600x400.png?text=No+Image+Available";

// --- HELPER FUNCTIONS ---
// (Existing helpers remain the same)
const getColumnKey = (apiStatus) =>
  API_STATUS_TO_COLUMN[apiStatus] || "unassigned";

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

// NEW: Helper to format service type for display
const formatServiceType = (serviceType) => {
  if (!serviceType) return "N/A";
  switch (serviceType) {
    case "self-drive":
      return "Self-Drive Only";
    case "with-driver":
      return "With Driver Only";
    case "both":
      return "Both Options Available";
    default:
      return serviceType;
  }
};

// NEW: Helper to format working days array
const formatWorkingDays = (days) => {
  if (!days || !Array.isArray(days) || days.length === 0) return "N/A";
  return days
    .map((day) => day.charAt(0).toUpperCase() + day.slice(1))
    .join(", ");
};

const VehicleApprovalModal = ({
  isOpen,
  vehicle,
  adminToken,
  onClose,
  onActionSuccess,
}) => {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem("admin"));
  const adminId = admin?.username;

  // --- STATE (unchanged) ---
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(
    placeholderProfileImage
  );
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [rentalRating, setRentalRating] = useState(0);

  const [vehicleImageUrls, setVehicleImageUrls] = useState([]);
  const [adminDocumentUrls, setAdminDocumentUrls] = useState([]);
  const [loadingMediaUrls, setLoadingMediaUrls] = useState(false);
  const [selectedImageForDisplay, setSelectedImageForDisplay] = useState(
    placeholderVehicleImage
  );
  const [isFullScreenView, setIsFullScreenView] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [openEventsDialog, setOpenEventsDialog] = useState(false);
  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [rejectReasons, setRejectReasons] = useState({
    ownerDetail: false,
    vehicleOverview: false,
    documents: false,
    photos: false,
    duplicateVehicle: false,
  });

  // --- All event handlers and useEffect hooks remain unchanged ---
  const handleChatWithRenter = useCallback(() => {
    const ownerId = vehicleDetails?.ownerId;
    const ownerGivenName =
      ownerProfile?.given_name || vehicleDetails?.ownerGivenName || "Unknown";
    const ownerFamilyName =
      ownerProfile?.family_name || vehicleDetails?.ownerSurName || "";
    const currentVehicleId = vehicleDetails?.id;
    if (!adminId || !ownerId || !currentVehicleId) {
      alert("Cannot initiate chat. Missing critical information.");
      return;
    }
    navigate(
      `/chat?renteeId=${ownerId}&reservationId=${currentVehicleId}&given_name=${ownerGivenName}&family_name=${ownerFamilyName}`
    );
  }, [navigate, adminId, vehicleDetails, ownerProfile]);

  const fetchRentalRating = useCallback(async (carID, token) => {
    if (!carID || !token) return 0;
    console.log("Fetching dummy rating for carId:", carID);
    return 4.5;
  }, []);

  const fetchMediaUrls = useCallback(
    async (vehicleData) => {
      if (!vehicleData) return;
      setLoadingMediaUrls(true);
      const vehicleKeys = vehicleData.vehicleImageKeys || [];
      const documentKeys = vehicleData.adminDocumentKeys || [];
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
        setVehicleImageUrls(
          imgResults.length ? imgResults : [placeholderVehicleImage]
        );
        setSelectedImageForDisplay(
          imgResults.length ? imgResults[0] : placeholderVehicleImage
        );
        setAdminDocumentUrls(docResults);
      } catch (err) {
        console.error("Error fetching media URLs:", err);
      } finally {
        setLoadingMediaUrls(false);
      }
    },
    [getDownloadUrl]
  );

  useEffect(() => {
    const fetchModalDetails = async () => {
      if (!isOpen || !vehicle?.id || !adminToken) {
        setVehicleDetails(null);
        return;
      }
      setLoadingDetails(true);
      setErrorDetails(null);
      setVehicleDetails(null);

      try {
        const apiUrl = `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/vehicle/${vehicle.id}`;
        const res = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (!res.ok) throw new Error(`Failed to fetch details: ${res.status}`);

        const data = await res.json();
        const details = data.body;
        setVehicleDetails(details);

        if (details?.ownerId) {
          setIsImageLoading(true);
          try {
            const profileUrl = `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/user/${details.ownerId}`;
            const profileRes = await fetch(profileUrl, {
              headers: { Authorization: `Bearer ${adminToken}` },
            });
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              setOwnerProfile(profileData);
              const picKey = profileData?.["custom:profile_picture_key"];
              if (picKey) {
                const imgUrlRes = await getDownloadUrl(picKey);
                setProfileImageUrl(imgUrlRes?.body || placeholderProfileImage);
              }
            }
          } catch (e) {
            console.error("Profile fetch failed:", e);
          } finally {
            setIsImageLoading(false);
          }
        } else {
          setIsImageLoading(false);
        }
        await fetchMediaUrls(details);
        const rating = await fetchRentalRating(details?.id, adminToken);
        setRentalRating(rating);
      } catch (err) {
        setErrorDetails(err.message);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchModalDetails();
  }, [isOpen, vehicle, adminToken, fetchMediaUrls, fetchRentalRating]);
  const handleOpenEventsDialog = () => setOpenEventsDialog(true);
  const handleCloseEventsDialog = () => setOpenEventsDialog(false);
  const handleOpenRejectModal = () => setOpenRejectModal(true);
  const handleCloseRejectModal = () => {
    setOpenRejectModal(false);
    setRejectReasons({
      ownerDetail: false,
      vehicleOverview: false,
      documents: false,
      photos: false,
      duplicateVehicle: false,
    });
  };
  const openFullScreen = (index) => {
    setIsFullScreenView(true);
    setCurrentImageIndex(index >= 0 ? index : 0);
  };
  const closeFullScreen = () => setIsFullScreenView(false);
  const nextImage = () =>
    setCurrentImageIndex((p) => (p + 1) % vehicleImageUrls.length);
  const previousImage = () =>
    setCurrentImageIndex(
      (p) => (p - 1 + vehicleImageUrls.length) % vehicleImageUrls.length
    );
  const handleViewDocument = (url) => {
    if (url) window.open(url, "_blank");
  };
  const handleRejectReasonChange = (e) =>
    setRejectReasons((p) => ({ ...p, [e.target.name]: e.target.checked }));

  const handleApproveListing = async () => {
    if (!vehicleDetails?.id || !adminToken) {
      setErrorDetails("Authentication required or vehicle details not loaded.");
      return;
    }
    setLoadingDetails(true);
    setErrorDetails(null);
    const approveApiUrl = `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/admin/approve_vehicle/${vehicleDetails.id}`;
    try {
      const response = await fetch(approveApiUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage =
          JSON.parse(errorBody)?.message ||
          `Failed to approve: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      alert("Listing approved successfully!");
      if (onActionSuccess) onActionSuccess();
      onClose();
    } catch (err) {
      setErrorDetails(err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleRejectListing = async () => {
    if (!vehicleDetails?.id || !adminToken) {
      setErrorDetails("Authentication required or vehicle details not loaded.");
      return;
    }
    const reasonsSelected = Object.keys(rejectReasons).filter(
      (key) => rejectReasons[key]
    );
    if (reasonsSelected.length === 0) {
      alert("Please select at least one reason for rejection.");
      return;
    }
    setLoadingDetails(true);
    setErrorDetails(null);
    const denialReasonMessage = reasonsSelected
      .map(
        (key) =>
          ({
            ownerDetail: "Owner Details Incomplete/Incorrect",
            vehicleOverview: "Vehicle Overview Inaccurate/Missing",
            documents: "Documents Missing/Invalid",
            photos: "Photos Unclear/Missing",
            duplicateVehicle: "Vehicle is a Duplicate (Vehicle already exists)",
          }[key])
      )
      .join(", ");

    const denyApiUrl = `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/admin/deny_vehicle/${vehicleDetails.id}`;
    try {
      const response = await fetch(denyApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ reason: denialReasonMessage }),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        const errorMessage =
          JSON.parse(errorBody)?.message ||
          `Failed to reject: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      alert("Listing rejected successfully!");
      handleCloseRejectModal();
      if (onActionSuccess) onActionSuccess();
      onClose();
    } catch (err) {
      setErrorDetails(err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const currentStatusLabel = vehicleDetails
    ? columnLabels[getColumnKey(vehicleDetails.isApproved)]
    : "Loading...";
  const ownerDisplayName =
    `${ownerProfile?.given_name || ""} ${
      ownerProfile?.family_name || ""
    }`.trim() ||
    `${vehicleDetails?.ownerGivenName} ${vehicleDetails?.ownerSurName}`.trim() ||
    "N/A";
  const ownerDisplayPhone =
    ownerProfile?.phone_number || vehicleDetails?.ownerPhone || "N/A";
  const ownerDisplayEmail =
    ownerProfile?.email || vehicleDetails?.ownerEmail || "N/A";
  const ownerDisplayLocation = vehicleDetails?.city || "N/A";
  const displayRegistrationDate = vehicleDetails?.createdAt
    ? `${new Date(vehicleDetails.createdAt).toLocaleDateString()} | ${new Date(
        vehicleDetails.createdAt
      ).toLocaleTimeString()}`
    : "N/A";
  const displayRentAmount = vehicleDetails?.price
    ? `${vehicleDetails.price} Birr/Day`
    : "N/A";

  return (
    <>
      <Modal
        style={{
          overlay: { backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1000 },
          content: {
            backgroundColor: "#fff",
            padding: "0px",
            borderRadius: "10px",
            width: "90%",
            maxWidth: "900px",
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            maxHeight: "90vh",
            overflowY: "auto",
          },
        }}
        isOpen={isOpen}
        onRequestClose={onClose}
        contentLabel="Vehicle Details Modal"
      >
        <div className="bg-[#00173C] w-full text-white px-8 py-2 flex justify-between items-center sticky top-0 z-20">
          <Typography variant="h6" component="h2">
            Listing Approval
          </Typography>
          <IconButton onClick={onClose} color="inherit" size="small">
            <CloseIcon />
          </IconButton>
        </div>

        {vehicleDetails && (
          <Box className="flex py-4 px-10 gap-4 w-full flex-wrap sticky top-[50px] bg-white z-10 border-b">
            <button
              onClick={handleOpenRejectModal}
              disabled={loadingDetails}
              className="flex-1 py-2 cursor-pointer text-sm rounded-full bg-[#FDEAEA] text-red-700 border border-red-700 disabled:opacity-50 hover:bg-red-100"
            >
              Reject Listing
            </button>
            <button
              onClick={handleApproveListing}
              disabled={loadingDetails}
              className="flex-1 cursor-pointer text-sm py-2 rounded-full bg-[#00113D] text-white disabled:opacity-50 hover:bg-[#002a5c]"
            >
              {loadingDetails ? "Processing..." : "Approve Listing"}
            </button>
            {errorDetails && (
              <Typography
                color="error"
                align="center"
                sx={{ width: "100%", mt: 1, fontSize: "0.8rem" }}
              >
                {errorDetails}
              </Typography>
            )}
          </Box>
        )}

        {!vehicleDetails &&
          (loadingDetails ? (
            <Typography align="center" sx={{ my: 4 }}>
              Loading... <CircularProgress size={20} />
            </Typography>
          ) : errorDetails ? (
            <Typography color="error" align="center" sx={{ my: 4 }}>
              {errorDetails}
            </Typography>
          ) : null)}

        {vehicleDetails && (
          <Box className="flex flex-col p-2 px-10">
            {vehicleDetails?.isApproved === "denied" &&
              vehicleDetails?.denialReason && (
                <Box
                  sx={{
                    bgcolor: "#ffebee",
                    color: "#c62828",
                    p: 2,
                    mb: 2,
                    borderRadius: "4px",
                    textAlign: "center",
                  }}
                >
                  <Typography variant="body1">
                    Rejected. Reason: {vehicleDetails.denialReason}
                  </Typography>
                </Box>
              )}

            <Box className="flex flex-wrap w-full h-fit bg-white p-6 space-y-6 rounded-xl drop-shadow-sm shadow-xs gap-4">
              <div className="flex justify-between flex-wrap w-full">
                {/* User Details Section */}
                <section className=" w-full md:w-[calc(50%_-_1rem)] flex flex-col gap-4 pr-0 md:pr-8 mb-8 md:mb-0">
                  <div className="items-center flex gap-8">
                    {isImageLoading ? (
                      <div className="w-32 h-32 rounded-full flex items-center justify-center bg-gray-100">
                        <FaSpinner className="animate-spin text-2xl text-gray-400" />
                      </div>
                    ) : (
                      <img
                        src={profileImageUrl}
                        alt="Renter Profile"
                        className="w-32 h-32 rounded-full object-cover"
                      />
                    )}
                    <div className="flex flex-col gap-2">
                      <h2 className="text-lg font-semibold text-[#00113D] mb-2">
                        User Details
                      </h2>
                      <Typography
                        variant="body2"
                        className="flex items-center gap-2 text-[#38393D]"
                      >
                        <IoPersonOutline size={18} />
                        {ownerDisplayName}
                      </Typography>
                      <Typography
                        variant="body2"
                        className="flex items-center gap-2 text-[#38393D] mt-1"
                      >
                        <PhoneOutlined sx={{ fontSize: "18px" }} />
                        {ownerDisplayPhone}
                      </Typography>
                      <Typography
                        variant="body2"
                        className="flex items-center gap-2 text-[#38393D] mt-1"
                      >
                        <MdOutlineMail size={18} />
                        {ownerDisplayEmail}
                      </Typography>
                      <Typography
                        variant="body2"
                        className="flex items-center gap-2 text-[#38393D] mt-1"
                      >
                        <IoLocationOutline size={18} />
                        {ownerDisplayLocation}
                      </Typography>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 text-sm  border rounded-full border-[#00113D] text-[#00113D] bg-white">
                    <IoChatboxOutline size={16} />
                    <button
                      onClick={handleChatWithRenter}
                      disabled={
                        loadingDetails || !adminId || !vehicleDetails?.ownerId
                      }
                    >
                      Chat With Renter
                    </button>
                  </div>
                  <div className="flex items-center gap-8 flex-wrap">
                    <Typography
                      variant="body2"
                      className="flex flex-col w-full md:w-1/2"
                    >
                      <span className=" text-lg font-semibold text-gray-700">
                        Assigned Admin
                      </span>
                      <span className="">Asigned to me</span>
                    </Typography>
                    <FormControl
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 120,
                        width: "100%",
                        md: { width: "auto" },
                      }}
                      disabled
                    >
                      <InputLabel size="small">Status</InputLabel>
                      <Select
                        label="Status"
                        name="status"
                        size="small"
                        value={getColumnKey(vehicleDetails?.isApproved)}
                      >
                        <MenuItem value="unassigned">Unassigned</MenuItem>
                        <MenuItem value="inReview">In Review</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                      </Select>
                    </FormControl>
                  </div>
                </section>

                {/* Account Details Section */}
                <section className="w-full md:w-1/4 mr-0 md:mr-14">
                  <h2 className="text-lg font-semibold text-[#00113D] mb-4">
                    Account Details
                  </h2>
                  <div className="flex flex-col text-sm text-[#38393D]">
                    <div className="flex items-center mb-2">
                      Vehicle Status:
                      <span className="ml-2 font-semibold text-sky-950">
                        {currentStatusLabel}
                      </span>
                    </div>
                    <div className="flex items-center mb-2">
                      Admin Status:
                      <span className="ml-2 font-semibold text-sky-950">
                        {vehicleDetails?.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center mb-2">
                      Registration Date:
                      <span className="ml-2 font-semibold text-sky-950">
                        {displayRegistrationDate}
                      </span>
                    </div>
                    {/* MODIFIED: Replaced Rent Amount with Self-Drive Price for clarity */}
                    <div className="flex items-center mb-2">
                      Self-Drive Price:
                      <span className="ml-2 font-semibold text-sky-950">
                        {displayRentAmount}
                      </span>
                    </div>
                    <div
                      className="flex justify-center items-center gap-2 mt-12 px-4 py-2 text-sm border rounded-full border-[#00113D] text-[#00113D] bg-white cursor-pointer hover:bg-gray-100"
                      onClick={handleOpenEventsDialog}
                    >
                      <CalendarMonthOutlinedIcon fontSize="small" />
                      <button>Unavailable Dates</button>
                    </div>
                  </div>
                </section>
                {/* Stat Cards Section */}
                <div className="flex flex-col w-full md:w-1/3 gap-6">
                  <div className=" bg-white p-6 flex justify-between items-center w-full gap-24 shadow-blue-200 rounded-xl drop-shadow-xs shadow-xs">
                    <h2 className="text-base font-semibold text-[#00113D]">
                      Total Rentals
                    </h2>
                    <span className="px-4 text-gray-600 text-base">N/A</span>
                  </div>
                  <div className=" bg-white p-6 flex justify-between items-center w-full gap-24 shadow-blue-200 rounded-xl drop-shadow-xs shadow-xs">
                    <h2 className="text-base font-semibold text-[#00113D]">
                      Total Earnings
                    </h2>
                    <span className="pr-4 text-gray-600 text-base">N/A</span>
                  </div>
                  <div className=" bg-white p-6 flex justify-between items-center w-full gap-24 shadow-blue-200 rounded-xl drop-shadow-xs shadow-xs">
                    <h2 className="text-base font-semibold text-[#00113D]">
                      Vehicle Rating
                    </h2>
                    <div className="pr-4 gap-x-2 flex text-lg items-center">
                      <FaStar color="gold" size={24} />
                      <span className="ml-2">
                        {rentalRating?.toFixed(1) ?? "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Box>

            {/* Vehicle Overview Section */}
            <div className="p-10 bg-white w-full flex flex-col drop-shadow-sm shadow-blue-200 shadow mt-8 rounded-lg">
              <div className=" text-xl font-semibold mb-8">
                Vehicle Overview
              </div>
              {/* Existing Vehicle Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 p-4 gap-4 ">
                <div className="flex flex-col">
                  <Typography variant="caption" color="textSecondary">
                    Vehicle Type
                  </Typography>
                  <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                    {vehicleDetails?.category || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <Typography variant="caption" color="textSecondary">
                    Vehicle Make
                  </Typography>
                  <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                    {vehicleDetails?.make || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <Typography variant="caption" color="textSecondary">
                    Vehicle Model
                  </Typography>
                  <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                    {vehicleDetails?.model || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <Typography variant="caption" color="textSecondary">
                    Year of Manufacture
                  </Typography>
                  <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                    {vehicleDetails?.year || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <Typography variant="caption" color="textSecondary">
                    License Plate Number
                  </Typography>
                  <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                    {vehicleDetails?.licensePlateNumber ||
                      vehicleDetails?.vehicleNumber ||
                      "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <Typography variant="caption" color="textSecondary">
                    Mileage
                  </Typography>
                  <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                    {vehicleDetails?.mileage
                      ? `${vehicleDetails.mileage} KM`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <Typography variant="caption" color="textSecondary">
                    Fuel Type
                  </Typography>
                  <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                    {vehicleDetails?.fuelType || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <Typography variant="caption" color="textSecondary">
                    Transmission Type
                  </Typography>
                  <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                    {vehicleDetails?.transmission || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <Typography variant="caption" color="textSecondary">
                    Doors
                  </Typography>
                  <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                    {vehicleDetails?.doors || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <Typography variant="caption" color="textSecondary">
                    Seats
                  </Typography>
                  <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                    {vehicleDetails?.seats || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <Typography variant="caption" color="textSecondary">
                    Vehicle ID
                  </Typography>
                  <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                    {vehicleDetails?.id || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <Typography variant="caption" color="textSecondary">
                    Color
                  </Typography>
                  <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                    {vehicleDetails?.color || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <Typography variant="caption" color="textSecondary">
                    Plate Region
                  </Typography>
                  <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                    {vehicleDetails?.plateRegion || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <Typography variant="caption" color="textSecondary">
                    Plate Code Number
                  </Typography>
                  <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                    {vehicleDetails?.licensePlateCodeNumber || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <Typography variant="caption" color="textSecondary">
                    City
                  </Typography>
                  <span className="mt-1 bg-blue-100 rounded-md p-2 ">
                    {vehicleDetails?.city || "N/A"}
                  </span>
                </div>
              </div>
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Features
                </Typography>
                {vehicleDetails?.carFeatures &&
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

            {/* --- NEW: Service & Pricing Details Section --- */}
            <div className="p-10 bg-white w-full flex flex-col drop-shadow-sm shadow-blue-200 shadow mt-8 rounded-lg">
              <div className="text-xl font-semibold mb-8">
                Service & Pricing Details
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 p-4 gap-4">
                {/* Service Type */}
                <div className="flex flex-col">
                  <Typography variant="caption" color="textSecondary">
                    Service Type
                  </Typography>
                  <span className="mt-1 bg-blue-100 rounded-md p-2 font-medium text-blue-800">
                    {formatServiceType(vehicleDetails?.serviceType)}
                  </span>
                </div>

                {/* Self-Drive Price */}
                <div className="flex flex-col">
                  <Typography variant="caption" color="textSecondary">
                    Self-Drive Daily Price
                  </Typography>
                  <span className="mt-1 bg-blue-100 rounded-md p-2">
                    {vehicleDetails?.price
                      ? `${vehicleDetails.price} Birr`
                      : "N/A"}
                  </span>
                </div>
              </div>

              {/* Conditionally render driver details */}
              {vehicleDetails?.serviceType !== "self-drive" && (
                <>
                  <div className="border-t my-6"></div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">
                    Driver Service Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 p-4 gap-4">
                    {/* Driver Price */}
                    <div className="flex flex-col">
                      <Typography variant="caption" color="textSecondary">
                        Driver Daily Price
                      </Typography>
                      <span className="mt-1 bg-green-100 text-green-800 rounded-md p-2 font-semibold">
                        {vehicleDetails?.driverPrice
                          ? `+ ${vehicleDetails.driverPrice} Birr`
                          : "N/A"}
                      </span>
                    </div>
                    {/* Driver Working Days */}
                    <div className="flex flex-col md:col-span-2">
                      <Typography variant="caption" color="textSecondary">
                        Driver Working Days
                      </Typography>
                      <span className="mt-1 bg-gray-100 rounded-md p-2">
                        {formatWorkingDays(
                          vehicleDetails?.driverWorkingDays ||
                            vehicleDetails?.driverInfo?.workingDays
                        )}
                      </span>
                    </div>
                    {/* Driver Working Hours */}
                    <div className="flex flex-col">
                      <Typography variant="caption" color="textSecondary">
                        Driver Working Hours
                      </Typography>
                      <span className="mt-1 bg-gray-100 rounded-md p-2">
                        {vehicleDetails?.driverHours ||
                          vehicleDetails?.driverInfo?.workingHours ||
                          "N/A"}
                      </span>
                    </div>
                    {/* Driver Max Hours */}
                    <div className="flex flex-col">
                      <Typography variant="caption" color="textSecondary">
                        Driver Max Hours/Day
                      </Typography>
                      <span className="mt-1 bg-gray-100 rounded-md p-2">
                        {vehicleDetails?.driverMaxHours ||
                          vehicleDetails?.driverInfo?.maxHoursPerDay ||
                          "N/A"}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex lg:flex-row flex-col gap-8 mt-4">
              {/* Documents and Compliance */}
              <div className="p-10 bg-white w-full lg:w-1/2 flex flex-col mt-4 drop-shadow-sm shadow-blue-200 shadow rounded-lg">
                <div className=" text-xl font-semibold mb-8">
                  Documents and Compliance
                </div>
                {loadingMediaUrls ? (
                  <Box display="flex" justifyContent="center">
                    <CircularProgress size={20} />
                  </Box>
                ) : adminDocumentUrls.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {adminDocumentUrls.map((doc, index) => (
                      <Button
                        key={index}
                        variant="text"
                        onClick={() => handleViewDocument(doc.url)}
                        startIcon={<AttachFileIcon />}
                        sx={{
                          justifyContent: "flex-start",
                          textTransform: "none",
                        }}
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

              {/* Photos and Media */}
              <div className="p-10 bg-white w-full lg:w-1/2 flex flex-col mt-lg-0 mt-4 drop-shadow-sm shadow-blue-200 shadow rounded-lg">
                <div className=" text-xl font-semibold mb-8">
                  Photos and Media
                </div>
                {loadingMediaUrls ? (
                  <Box display="flex" justifyContent="center">
                    <CircularProgress size={20} />
                  </Box>
                ) : vehicleImageUrls.length > 0 &&
                  vehicleImageUrls[0] !== placeholderVehicleImage ? (
                  <div className="flex flex-col gap-4">
                    <img
                      src={selectedImageForDisplay}
                      alt="Selected vehicle"
                      className="w-full h-auto max-h-[400px] object-contain rounded-lg mb-4 cursor-pointer"
                      onClick={() =>
                        openFullScreen(
                          vehicleImageUrls.indexOf(selectedImageForDisplay)
                        )
                      }
                    />
                    {vehicleImageUrls.length > 1 && (
                      <div className="flex justify-start space-x-2 items-center mt-2 overflow-x-auto pb-2">
                        {vehicleImageUrls.map((url, index) => (
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
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No photos available.
                  </Typography>
                )}
              </div>
            </div>
          </Box>
        )}
      </Modal>

      {/* --- ALL OTHER MODALS/DIALOGS REMAIN UNCHANGED --- */}
      {/* Unavailable Dates Dialog */}
      <Dialog
        open={openEventsDialog}
        onClose={handleCloseEventsDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Unavailable Dates
          <IconButton
            aria-label="close"
            onClick={handleCloseEventsDialog}
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
                (group, i) => (
                  <div
                    key={`unavailable-${i}`}
                    className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-md"
                  >
                    <CalendarMonthOutlinedIcon className="text-red-600" />
                    <span className="text-sm font-medium text-red-800">
                      {formatDateRange(group)}
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
          <Button onClick={handleCloseEventsDialog}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* Full-Screen Image Viewer */}
      {isFullScreenView && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-90 p-4">
          <button
            onClick={closeFullScreen}
            className="absolute top-5 right-5 z-10 text-white text-3xl hover:opacity-75"
          >
            <FaTimes />
          </button>
          <img
            src={vehicleImageUrls[currentImageIndex]}
            alt={`Fullscreen view ${currentImageIndex + 1}`}
            className="max-w-[95vw] max-h-[95vh] object-contain"
          />
          {vehicleImageUrls.length > 1 && (
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
      )}

      {/* Reject Reason Modal */}
      <Modal
        style={{
          overlay: { backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1001 },
          content: {
            backgroundColor: "#fff",
            padding: "0px",
            borderRadius: "10px",
            width: "40%",
            maxWidth: "400px",
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            maxHeight: "80vh",
            overflowY: "auto",
          },
        }}
        isOpen={openRejectModal}
        onRequestClose={handleCloseRejectModal}
        contentLabel="Reject Reason Modal"
      >
        <div className="bg-[#00173C] w-full text-white px-8 py-2 flex justify-between items-center">
          <Typography variant="h6" component="h2">
            Reason for Rejection
          </Typography>
          <IconButton
            onClick={handleCloseRejectModal}
            color="inherit"
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </div>
        <div className="p-8">
          <h1 className="font-semibold mb-6">
            Please select options from below
          </h1>
          <FormGroup className="px-0">
            <FormControlLabel
              control={
                <Checkbox
                  name="ownerDetail"
                  checked={rejectReasons.ownerDetail}
                  onChange={handleRejectReasonChange}
                />
              }
              label="Owner Details Incomplete/Incorrect"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="vehicleOverview"
                  checked={rejectReasons.vehicleOverview}
                  onChange={handleRejectReasonChange}
                />
              }
              label="Vehicle Overview Inaccurate/Missing"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="duplicateVehicle"
                  checked={rejectReasons.duplicateVehicle}
                  onChange={handleRejectReasonChange}
                />
              }
              label="Vehicle is a Duplicate (Vehicle already exists)"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="documents"
                  checked={rejectReasons.documents}
                  onChange={handleRejectReasonChange}
                />
              }
              label="Documents Missing/Invalid"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="photos"
                  checked={rejectReasons.photos}
                  onChange={handleRejectReasonChange}
                />
              }
              label="Photos Unclear/Missing"
            />
          </FormGroup>
          <Box className="flex mt-8 gap-4 w-full">
            <button
              onClick={handleRejectListing}
              disabled={
                loadingDetails ||
                Object.values(rejectReasons).every((reason) => !reason)
              }
              className="flex-1 text-sm py-2 cursor-pointer rounded-full bg-red-600 text-white disabled:opacity-50 hover:bg-red-700"
            >
              {loadingDetails ? "Processing..." : "Confirm Rejection"}
            </button>
          </Box>
          {errorDetails && (
            <Typography
              color="error"
              align="center"
              sx={{ mt: 2, fontSize: "0.8rem" }}
            >
              {errorDetails}
            </Typography>
          )}
        </div>
      </Modal>
    </>
  );
};

export default VehicleApprovalModal;
