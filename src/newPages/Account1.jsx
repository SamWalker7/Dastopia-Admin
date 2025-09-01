import React, { useEffect, useState, useCallback } from "react";
import {
  // Import icons
  IoPersonOutline,
  IoLocationOutline,
  IoChatboxOutline,
} from "react-icons/io5";
import {
  MdOutlineLocalPhone,
  MdOutlineMail,
  MdUploadFile,
  MdDelete,
} from "react-icons/md";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import {
  // Added status and image viewer icons
  FaStar,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaTimes,
} from "react-icons/fa";
// Make sure this path is correct for your project structure
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
import UndoIcon from "@mui/icons-material/Undo";

const placeholderProfileImage = "https://via.placeholder.com/150";
const placeholderVehicleImage =
  "https://via.placeholder.com/600x400.png?text=No+Image+Available";

// --- API Base URL ---
const API_BASE_URL =
  "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod";

// --- API FUNCTIONS FOR FILE OPERATIONS (Unchanged) ---
const getUploadUrl = async (vehicleId, filename, contentType, token) => {
  const url =
    "https://xo55y7ogyj.execute-api.us-east-1.amazonaws.com/prod/add_vehicle";
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      operation: "getPresignedUrl",
      vehicleId,
      filename,
      contentType,
    }),
  };
  try {
    const response = await fetch(url, options);
    if (!response.ok)
      throw new Error(`Failed to get presigned URL: ${await response.text()}`);
    const data = await response.json();
    if (!data?.body?.url || !data?.body?.key)
      throw new Error("Invalid presigned URL response structure");
    return data.body;
  } catch (error) {
    console.error("Error fetching presigned URL:", error);
    throw error;
  }
};

const uploadFile = async (presignedUrl, file) => {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!response.ok) throw new Error("S3 file upload failed.");
};

const deleteFile = async (vehicleId, key, token) => {
  const url =
    "https://xo55y7ogyj.execute-api.us-east-1.amazonaws.com/prod/add_vehicle";
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ operation: "deleteFile", vehicleId, key }),
  };
  try {
    const response = await fetch(url, options);
    if (!response.ok)
      throw new Error(`Failed to delete file: ${await response.text()}`);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};
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
    .map((dateStr) => parseISO(dateStr))
    .sort((a, b) => a - b);
  const groups = [];
  if (sorted.length === 0) return groups;
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

// NEW: Helper functions for service type display
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

const formatWorkingDays = (days) => {
  if (!days || !Array.isArray(days) || days.length === 0) return "N/A";
  return days
    .map((day) => day.charAt(0).toUpperCase() + day.slice(1))
    .join(", ");
};

const Account = ({ vehicleId, adminToken }) => {
  const navigate = useNavigate();
  // Component State (unchanged)
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(
    placeholderProfileImage
  );
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [rentalRating, setRentalRating] = useState(0);

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editableVehicleDetails, setEditableVehicleDetails] = useState(null);

  // Media and Document State
  const [documentUrls, setDocumentUrls] = useState([]);
  const [loadingUrls, setLoadingUrls] = useState(false);
  const [docsToDelete, setDocsToDelete] = useState(new Set());
  const [newDocs, setNewDocs] = useState([]);
  const [managedImages, setManagedImages] = useState([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState(
    placeholderVehicleImage
  );

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

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      managedImages.forEach((image) => {
        if (image.source === "preview") URL.revokeObjectURL(image.url);
      });
    };
  }, [managedImages]);

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
      if (vehicleData?.body) {
        const vehicle = vehicleData.body;
        setVehicleDetails(vehicle);
        setEditableVehicleDetails(vehicle);
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
        // Dummy rating, replace with actual API call if available
        setRentalRating(4.5);
      } else {
        setError("Invalid vehicle data structure.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [vehicleId, adminToken]);

  const fetchDownloadUrls = useCallback(async (vehicle) => {
    setLoadingUrls(true);
    const imageKeys = vehicle.vehicleImageKeys || [];
    const docKeys = vehicle.adminDocumentKeys || [];
    const fetchUrls = async (keys) => {
      const promises = keys.map(async (keyObj) => {
        const key = typeof keyObj === "string" ? keyObj : keyObj?.key;
        if (!key) return null;
        try {
          const urlResponse = await getDownloadUrl(key);
          return {
            key,
            url: urlResponse?.body,
            name: getDocumentName(key),
          };
        } catch (error) {
          return null;
        }
      });
      return (await Promise.all(promises)).filter(Boolean);
    };

    const fetchedImageUrls = await fetchUrls(imageKeys);
    const initialManagedImages = fetchedImageUrls.map((img) => ({
      source: "url",
      key: img.key,
      url: img.url,
      status: "existing",
    }));
    setManagedImages(initialManagedImages);

    if (initialManagedImages.length > 0) {
      setSelectedImageUrl(initialManagedImages[0].url);
    } else {
      setSelectedImageUrl(placeholderVehicleImage);
    }

    const fetchedDocUrls = await fetchUrls(docKeys);
    setDocumentUrls(fetchedDocUrls);
    setLoadingUrls(false);
  }, []);
  // Sync selected image if the current one is deleted or the list changes
  useEffect(() => {
    const availableImages = managedImages.filter(
      (img) => img.status !== "deleted"
    );
    const isSelectedImageAvailable = availableImages.some(
      (img) => img.url === selectedImageUrl
    );

    if (!isSelectedImageAvailable && availableImages.length > 0) {
      setSelectedImageUrl(availableImages[0].url);
    } else if (availableImages.length === 0) {
      setSelectedImageUrl(placeholderVehicleImage);
    }
  }, [managedImages, selectedImageUrl]);
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
        const body = errorData.body ? JSON.parse(errorData.body) : {};
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
  // --- All existing handlers up to this point remain the same ---

  const handleEditClick = () => setIsEditing(true);

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditableVehicleDetails(vehicleDetails);
    // Reset file changes on cancel
    fetchDownloadUrls(vehicleDetails);
    setDocsToDelete(new Set());
    setNewDocs([]);
    setActionError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableVehicleDetails((prev) => ({ ...prev, [name]: value }));
  };

  // NEW: Handler for working days checkboxes
  const handleWorkingDaysChange = (e) => {
    const { value, checked } = e.target;
    setEditableVehicleDetails((prev) => {
      const currentDays = prev.driverWorkingDays || [];
      const newDays = checked
        ? [...currentDays, value]
        : currentDays.filter((day) => day !== value);
      return { ...prev, driverWorkingDays: [...new Set(newDays)] }; // Ensure uniqueness
    });
  };

  const handleNewImageChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).map((file) => ({
        source: "preview",
        url: URL.createObjectURL(file),
        file,
        status: "new",
        key: `new-${Date.now()}-${Math.random()}`,
      }));
      setManagedImages((prev) => [...prev, ...filesArray]);
    }
  };

  const handleImageDelete = (keyToDelete) => {
    setManagedImages((prev) =>
      prev.map((img) =>
        img.key === keyToDelete ? { ...img, status: "deleted" } : img
      )
    );
  };

  const handleImageUndoDelete = (keyToUndo) => {
    setManagedImages((prev) =>
      prev.map((img) =>
        img.key === keyToUndo ? { ...img, status: "existing" } : img
      )
    );
  };

  const handleRemoveNewImage = (keyToRemove) => {
    setManagedImages((prev) => {
      const imageToRemove = prev.find((img) => img.key === keyToRemove);
      if (imageToRemove?.source === "preview")
        URL.revokeObjectURL(imageToRemove.url);
      return prev.filter((img) => img.key !== keyToRemove);
    });
  };

  const handleNewDocChange = (e) => {
    if (e.target.files)
      setNewDocs((prev) => [...prev, ...Array.from(e.target.files)]);
  };
  const handleMarkDocForDelete = (key) =>
    setDocsToDelete((prev) => new Set(prev).add(key));
  const handleUnmarkDocForDelete = (key) => {
    const newSet = new Set(docsToDelete);
    newSet.delete(key);
    setDocsToDelete(newSet);
  };
  const handleRemoveNewDoc = (index) =>
    setNewDocs((prev) => prev.filter((_, i) => i !== index));

  // --- MODIFIED: `handleSaveChanges` to include new fields ---
  const handleSaveChanges = useCallback(async () => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      // --- File operations (unchanged) ---
      const imagesToDelete = managedImages.filter(
        (img) => img.status === "deleted" && img.source === "url"
      );
      const deleteImagePromises = imagesToDelete.map((img) =>
        deleteFile(vehicleId, img.key, adminToken)
      );
      const deleteDocPromises = Array.from(docsToDelete).map((key) =>
        deleteFile(vehicleId, key, adminToken)
      );
      await Promise.all([...deleteImagePromises, ...deleteDocPromises]);

      const imagesToUpload = managedImages.filter(
        (img) => img.status === "new"
      );
      const uploadImagePromises = imagesToUpload.map(async (img) => {
        const { url, key } = await getUploadUrl(
          vehicleId,
          img.file.name,
          img.file.type,
          adminToken
        );
        await uploadFile(url, img.file);
        return { key };
      });
      const uploadDocPromises = newDocs.map(async (file) => {
        const { url, key } = await getUploadUrl(
          vehicleId,
          file.name,
          file.type,
          adminToken
        );
        await uploadFile(url, file);
        return { key };
      });
      const newImageKeys = await Promise.all(uploadImagePromises);
      const newDocKeys = await Promise.all(uploadDocPromises);

      // --- Prepare final data payload with NEW fields ---
      const updatedDetails = { ...editableVehicleDetails };
      const existingKeys = managedImages
        .filter((img) => img.status === "existing")
        .map((img) => ({ key: img.key }));
      updatedDetails.vehicleImageKeys = [...existingKeys, ...newImageKeys];
      const remainingDocKeys = documentUrls
        .filter((doc) => !docsToDelete.has(doc.key))
        .map((doc) => ({ key: doc.key }));
      updatedDetails.adminDocumentKeys = [...remainingDocKeys, ...newDocKeys];

      // NEW: Clear driver fields if service type is self-drive
      if (updatedDetails.serviceType === "self-drive") {
        updatedDetails.driverPrice = null;
        updatedDetails.driverMaxHours = null;
        updatedDetails.driverHours = "";
        updatedDetails.driverWorkingDays = [];
      }

      // --- Update vehicle details via API ---
      const response = await fetch(`${API_BASE_URL}/v1/vehicle/${vehicleId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedDetails),
      });

      if (!response.ok) throw new Error(await response.text());

      setIsEditing(false);
      await fetchVehicleDetails(); // Refresh all data
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    vehicleId,
    adminToken,
    editableVehicleDetails,
    managedImages,
    documentUrls,
    docsToDelete,
    newDocs,
    fetchVehicleDetails,
  ]);

  // --- Dialog and Modal Handlers (unchanged) ---
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
  // Initial data fetch
  useEffect(() => {
    if (!vehicleId || !adminToken) {
      setLoading(false);
      setError("Vehicle details cannot be loaded. Missing parameters.");
      return;
    }
    fetchVehicleDetails();
  }, [vehicleId, adminToken, fetchVehicleDetails]);

  // Status Icon Helper
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
  // --- RENDER LOGIC ---

  if (loading)
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
  if (error)
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
  if (!vehicleDetails)
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

  const EditableField = ({ label, name, value, type = "text" }) => (
    <div className="flex flex-col">
      <Typography variant="caption" color="textSecondary">
        {label}
      </Typography>
      {isEditing ? (
        <input
          type={type}
          name={name}
          value={value || ""}
          onChange={handleInputChange}
          className="mt-1 bg-gray-50 border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
        />
      ) : (
        <span className="mt-1 bg-blue-100 rounded-md p-2 ">
          {value || "N/A"}
        </span>
      )}
    </div>
  );

  const ownerGivenName =
    ownerProfile?.given_name || vehicleDetails?.ownerGivenName || "Unknown";
  const ownerFamilyName =
    ownerProfile?.family_name || vehicleDetails?.ownerSurName || "";

  return (
    <div className="flex flex-col mt-8">
      {/* Top section with user/account/admin details */}
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
              <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                <IoLocationOutline size={18} />
                <p>
                  {ownerProfile?.city ||
                    vehicleDetails.city ||
                    "Location Available"}
                </p>
              </div>
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
            {/* MODIFIED: Label changed for clarity */}
            <div className="flex items-center mb-2">
              Self-Drive Price:
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
        {/* Admin Actions Section */}
        <section className="w-fit bg-white p-6 shadow-blue-100 rounded-xl drop-shadow-xs shadow-xs">
          <h2 className="text-lg font-semibold text-[#00113D] mb-4">
            Admin Actions
          </h2>
          <div className="flex flex-col space-y-4">
            {isEditing ? (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveChanges}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleEditClick}
                >
                  Edit Vehicle
                </Button>
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
              </>
            )}
            {actionError && !isEditing && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {actionError}
              </Alert>
            )}
          </div>
        </section>
        {/* Stat Cards */}
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
              <span className="ml-2">{rentalRating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Overview Section */}
      <div className="p-10 bg-white w-full flex flex-col drop-shadow-sm shadow-blue-200 shadow mt-8 rounded-lg">
        <div className=" text-xl font-semibold mb-8">Vehicle Overview</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 p-4 gap-4 ">
          <EditableField
            label="Vehicle Type"
            name="category"
            value={editableVehicleDetails.category}
          />
          <EditableField
            label="Vehicle Make"
            name="make"
            value={editableVehicleDetails.make}
          />
          <EditableField
            label="Vehicle Model"
            name="model"
            value={editableVehicleDetails.model}
          />
          <EditableField
            label="Year of Manufacture"
            name="year"
            value={editableVehicleDetails.year}
            type="number"
          />
          <EditableField
            label="License Plate Number"
            name="vehicleNumber"
            value={editableVehicleDetails.vehicleNumber}
          />
          <EditableField
            label="Mileage"
            name="mileage"
            value={editableVehicleDetails.mileage}
          />
          <EditableField
            label="Fuel Type"
            name="fuelType"
            value={editableVehicleDetails.fuelType}
          />
          <EditableField
            label="Transmission Type"
            name="transmission"
            value={editableVehicleDetails.transmission}
          />
          <EditableField
            label="Doors"
            name="doors"
            value={editableVehicleDetails.doors}
            type="number"
          />
          <EditableField
            label="Seats"
            name="seats"
            value={editableVehicleDetails.seats}
            type="number"
          />
          <EditableField
            label="Vehicle ID"
            name="id"
            value={editableVehicleDetails.id}
          />
          <EditableField
            label="Color"
            name="color"
            value={editableVehicleDetails.color}
          />
          <EditableField
            label="Plate Region"
            name="plateRegion"
            value={editableVehicleDetails.plateRegion}
          />
          <EditableField
            label="Plate Code Number"
            name="licensePlateCodeNumber"
            value={editableVehicleDetails.licensePlateCodeNumber}
          />
          <EditableField
            label="City"
            name="city"
            value={editableVehicleDetails.city}
          />
        </div>
      </div>

      {/* --- NEW & MODIFIED: Service & Pricing Section --- */}
      <div className="p-10 bg-white w-full flex flex-col drop-shadow-sm shadow-blue-200 shadow mt-8 rounded-lg">
        <div className="text-xl font-semibold mb-8">
          Service & Pricing Details
        </div>
        {/* --- EDITING VIEW --- */}
        {isEditing ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 p-4 gap-4">
              <div className="flex flex-col">
                <Typography variant="caption" color="textSecondary">
                  Service Type
                </Typography>
                <select
                  name="serviceType"
                  value={editableVehicleDetails.serviceType || "self-drive"}
                  onChange={handleInputChange}
                  className="mt-1 bg-gray-50 border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="self-drive">Self-Drive Only</option>
                  <option value="with-driver">With Driver Only</option>
                  <option value="both">Both Options Available</option>
                </select>
              </div>
              <EditableField
                label="Self-Drive Daily Price (Birr)"
                name="price"
                value={editableVehicleDetails.price}
                type="number"
              />
            </div>
            {editableVehicleDetails.serviceType !== "self-drive" && (
              <>
                <div className="border-t my-6"></div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Driver Service Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 p-4 gap-4">
                  <EditableField
                    label="Driver Daily Price (Birr)"
                    name="driverPrice"
                    value={editableVehicleDetails.driverPrice}
                    type="number"
                  />
                  <EditableField
                    label="Driver Working Hours"
                    name="driverHours"
                    value={editableVehicleDetails.driverHours}
                  />
                  <EditableField
                    label="Driver Max Hours/Day"
                    name="driverMaxHours"
                    value={editableVehicleDetails.driverMaxHours}
                    type="number"
                  />
                </div>
                <div className="p-4">
                  <Typography variant="caption" color="textSecondary">
                    Driver Working Days
                  </Typography>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {[
                      "monday",
                      "tuesday",
                      "wednesday",
                      "thursday",
                      "friday",
                      "saturday",
                      "sunday",
                    ].map((day) => (
                      <label key={day} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          value={day}
                          checked={
                            editableVehicleDetails.driverWorkingDays?.includes(
                              day
                            ) || false
                          }
                          onChange={handleWorkingDaysChange}
                          className="rounded"
                        />
                        <span>
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          /* --- VIEWING MODE --- */
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 p-4 gap-4">
              <div className="flex flex-col">
                <Typography variant="caption" color="textSecondary">
                  Service Type
                </Typography>
                <span className="mt-1 bg-blue-100 rounded-md p-2 font-medium text-blue-800">
                  {formatServiceType(vehicleDetails.serviceType)}
                </span>
              </div>
              <div className="flex flex-col">
                <Typography variant="caption" color="textSecondary">
                  Self-Drive Daily Price
                </Typography>
                <span className="mt-1 bg-blue-100 rounded-md p-2">
                  {vehicleDetails.price
                    ? `${vehicleDetails.price} Birr`
                    : "N/A"}
                </span>
              </div>
            </div>
            {vehicleDetails.serviceType !== "self-drive" && (
              <>
                <div className="border-t my-6"></div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Driver Service Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 p-4 gap-4">
                  <div className="flex flex-col">
                    <Typography variant="caption" color="textSecondary">
                      Driver Daily Price
                    </Typography>
                    <span className="mt-1 bg-green-100 text-green-800 rounded-md p-2 font-semibold">
                      {vehicleDetails.driverPrice
                        ? `+ ${vehicleDetails.driverPrice} Birr`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex flex-col md:col-span-2">
                    <Typography variant="caption" color="textSecondary">
                      Driver Working Days
                    </Typography>
                    <span className="mt-1 bg-gray-100 rounded-md p-2">
                      {formatWorkingDays(
                        vehicleDetails.driverWorkingDays ||
                          vehicleDetails.driverInfo?.workingDays
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <Typography variant="caption" color="textSecondary">
                      Driver Working Hours
                    </Typography>
                    <span className="mt-1 bg-gray-100 rounded-md p-2">
                      {vehicleDetails.driverHours ||
                        vehicleDetails.driverInfo?.workingHours ||
                        "N/A"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <Typography variant="caption" color="textSecondary">
                      Driver Max Hours/Day
                    </Typography>
                    <span className="mt-1 bg-gray-100 rounded-md p-2">
                      {vehicleDetails.driverMaxHours ||
                        vehicleDetails.driverInfo?.maxHoursPerDay ||
                        "N/A"}
                    </span>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* --- Existing Documents and Media Sections (unchanged) --- */}
      <div className="flex lg:flex-row flex-col gap-8 mt-4">
        {/* Documents Section */}
        <div className="p-10 bg-white w-full lg:w-1/2 flex flex-col drop-shadow-sm shadow-blue-200 shadow rounded-lg">
          <div className=" text-xl font-semibold mb-8">
            Documents and Compliance
          </div>
          <div className="flex flex-col gap-4">
            {documentUrls.map((doc) => (
              <div
                key={doc.key}
                className={`flex items-center justify-between p-2 rounded-md ${
                  docsToDelete.has(doc.key) ? "bg-red-100" : ""
                }`}
              >
                <Button
                  variant="text"
                  startIcon={<AttachFileIcon />}
                  onClick={() => window.open(doc.url, "_blank")}
                  sx={{ justifyContent: "flex-start" }}
                >
                  {doc.name}
                </Button>
                {isEditing &&
                  (docsToDelete.has(doc.key) ? (
                    <IconButton
                      onClick={() => handleUnmarkDocForDelete(doc.key)}
                      aria-label="Undo delete document"
                    >
                      <UndoIcon />
                    </IconButton>
                  ) : (
                    <IconButton
                      onClick={() => handleMarkDocForDelete(doc.key)}
                      aria-label="Delete document"
                    >
                      <MdDelete className="text-red-500" />
                    </IconButton>
                  ))}
              </div>
            ))}
            {isEditing &&
              newDocs.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2"
                >
                  <Typography variant="body2">{file.name}</Typography>
                  <IconButton onClick={() => handleRemoveNewDoc(index)}>
                    <FaTimes />
                  </IconButton>
                </div>
              ))}
            {isEditing && (
              <Button variant="outlined" component="label" sx={{ mt: 2 }}>
                Add Documents
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={handleNewDocChange}
                />
              </Button>
            )}
          </div>
        </div>
        {/* Photos Section */}
        <div className="p-10 bg-white w-full lg:w-1/2 flex flex-col mt-lg-0 mt-4 drop-shadow-sm shadow-blue-200 shadow rounded-lg">
          <div className="text-xl font-semibold mb-8">Photos and Media</div>
          {loadingUrls ? (
            <Box display="flex" justifyContent="center">
              <CircularProgress size={20} />
            </Box>
          ) : managedImages.length > 0 || isEditing ? (
            <div className="flex flex-col gap-4">
              <img
                src={selectedImageUrl}
                alt="Selected vehicle"
                className="w-full h-auto max-h-[400px] object-contain rounded-lg mb-4"
              />
              <div className="flex flex-wrap gap-2 items-center">
                {managedImages.map((img) => (
                  <div key={img.key} className="relative flex-shrink-0">
                    <img
                      src={img.url}
                      alt={`Thumbnail for ${img.key}`}
                      onClick={() => {
                        if (img.status !== "deleted") {
                          setSelectedImageUrl(img.url);
                        }
                      }}
                      className={`w-20 h-20 object-cover rounded-lg border-2 flex-shrink-0 ${
                        img.status !== "deleted" ? "cursor-pointer" : ""
                      } ${
                        selectedImageUrl === img.url && img.status !== "deleted"
                          ? "border-blue-500"
                          : "border-transparent"
                      } ${
                        img.status === "deleted"
                          ? "opacity-40 filter grayscale"
                          : "hover:border-gray-300"
                      }`}
                    />
                    {isEditing && (
                      <div className="absolute top-0 right-0 transform -translate-y-1/2 translate-x-1/2 z-10">
                        {img.status === "existing" && (
                          <button
                            type="button"
                            onClick={() => handleImageDelete(img.key)}
                            className="p-1 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
                            aria-label="Delete image"
                          >
                            <MdDelete className="text-red-600" size={24} />
                          </button>
                        )}
                        {img.status === "deleted" && (
                          <button
                            type="button"
                            onClick={() => handleImageUndoDelete(img.key)}
                            className="p-1 bg-white rounded-full shadow-lg hover:bg-green-50 transition-colors"
                            aria-label="Undo delete"
                          >
                            <UndoIcon sx={{ fontSize: 24, color: "#16a34a" }} />
                          </button>
                        )}
                        {img.status === "new" && (
                          <button
                            type="button"
                            onClick={() => handleRemoveNewImage(img.key)}
                            className="p-1 bg-white rounded-full shadow-lg hover:bg-yellow-50 transition-colors"
                            aria-label="Remove new image"
                          >
                            <FaTimes className="text-yellow-600" size={22} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <label className="relative w-20 h-20 flex-shrink-0 flex flex-col items-center justify-center border-2 border-dashed border-gray-400 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-500 transition-colors">
                    <MdUploadFile className="w-8 h-8 text-gray-500" />
                    <span className="mt-1 text-xs text-gray-600 text-center">
                      Add
                    </span>
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*"
                      onChange={handleNewImageChange}
                    />
                  </label>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center text-gray-500">
              <img
                src={placeholderVehicleImage}
                alt="No images available"
                className="w-full h-auto max-h-[400px] object-contain rounded-lg mb-4"
              />
              <Typography variant="body2" color="textSecondary">
                No photos available.
              </Typography>
            </div>
          )}
        </div>
      </div>

      {/* --- ALL DIALOGS REMAIN UNCHANGED --- */}
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
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {vehicleDetails.unavailableDates?.length > 0 ? (
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
            <Typography>No unavailable dates marked.</Typography>
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
