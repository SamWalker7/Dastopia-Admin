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

// --- API FUNCTIONS FOR FILE OPERATIONS ---
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
  if (!key) return "Document";
  try {
    const parts = key.split("/");
    const filename = parts[parts.length - 1];
    return (
      filename.split("-")[0].charAt(0).toUpperCase() +
      filename.split("-")[0].slice(1)
    );
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

const Account = ({ vehicleId, adminToken }) => {
  const navigate = useNavigate();
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(
    placeholderProfileImage
  );
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editableVehicleDetails, setEditableVehicleDetails] = useState(null);
  const [docsToDelete, setDocsToDelete] = useState(new Set());
  const [newDocs, setNewDocs] = useState([]);
  const [documentUrls, setDocumentUrls] = useState([]);
  const [loadingUrls, setLoadingUrls] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [rentalRating, setRentalRating] = useState(0);
  const [managedImages, setManagedImages] = useState([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState(
    placeholderVehicleImage
  );
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [dialogOpen, setDialogOpen] = useState({
    softDelete: false,
    restore: false,
    permanentDelete: false,
  });
  const admin = JSON.parse(localStorage.getItem("admin"));
  const adminId = admin?.username;

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
          return { key, url: urlResponse?.body, name: getDocumentName(key) };
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

  const handleEditClick = () => setIsEditing(true);

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditableVehicleDetails(vehicleDetails);
    fetchDownloadUrls(vehicleDetails);
    setDocsToDelete(new Set());
    setNewDocs([]);
    setActionError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableVehicleDetails((prev) => ({ ...prev, [name]: value }));
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

  const handleSaveChanges = useCallback(async () => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const imagesToDelete = managedImages.filter(
        (img) => img.status === "deleted" && img.source === "url"
      );
      const imagesToUpload = managedImages.filter(
        (img) => img.status === "new"
      );

      const deleteImagePromises = imagesToDelete.map((img) =>
        deleteFile(vehicleId, img.key, adminToken)
      );
      const deleteDocPromises = Array.from(docsToDelete).map((key) =>
        deleteFile(vehicleId, key, adminToken)
      );

      await Promise.all([...deleteImagePromises, ...deleteDocPromises]);

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

      const updatedDetails = { ...editableVehicleDetails };

      const existingKeys = managedImages
        .filter((img) => img.status === "existing")
        .map((img) => ({ key: img.key }));
      updatedDetails.vehicleImageKeys = [...existingKeys, ...newImageKeys];

      const remainingDocKeys = documentUrls
        .filter((doc) => !docsToDelete.has(doc.key))
        .map((doc) => ({ key: doc.key }));
      updatedDetails.adminDocumentKeys = [...remainingDocKeys, ...newDocKeys];

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
      await fetchVehicleDetails();
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

  const handleSoftDelete = useCallback(async () => {
    /* ... */
  }, []);
  const handleRestore = useCallback(async () => {
    /* ... */
  }, []);
  const handlePermanentDelete = useCallback(async () => {
    /* ... */
  }, []);
  const handleChatWithOwner = useCallback(() => {
    /* ... */
  }, []);
  const handleOpenDialog = (dialog) =>
    setDialogOpen((prev) => ({ ...prev, [dialog]: true }));
  const handleCloseDialogs = () =>
    setDialogOpen({
      softDelete: false,
      restore: false,
      permanentDelete: false,
    });
  const handleOpenEventsModal = () => setShowEventsModal(true);
  const handleCloseEventsModal = () => setShowEventsModal(false);

  useEffect(() => {
    if (!vehicleId || !adminToken) {
      setLoading(false);
      setError("Vehicle details cannot be loaded.");
      return;
    }
    fetchVehicleDetails();
  }, [vehicleId, adminToken, fetchVehicleDetails]);

  if (loading)
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading...</Typography>
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

  const EditableField = ({ label, name, value }) => (
    <div className="flex flex-col">
      <Typography variant="caption" color="textSecondary">
        {label}
      </Typography>
      {isEditing ? (
        <input
          type={
            name.includes("year") ||
            name.includes("doors") ||
            name.includes("seats")
              ? "number"
              : "text"
          }
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

  return (
    <div className="flex flex-col mt-8">
      <div className="flex flex-wrap w-full gap-4">
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
                {vehicleDetails.ownerFirstName} {vehicleDetails.ownerLastName}
              </h3>
              <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                <MdOutlineLocalPhone size={18} />
                <p>{vehicleDetails.ownerPhone || "N/A"}</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                <MdOutlineMail size={18} />
                <p>{vehicleDetails.ownerEmail || "N/A"}</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                <IoLocationOutline size={18} />
                <p>{vehicleDetails.city || "Location Available"}</p>
              </div>
              <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 text-sm border rounded-full border-[#00113D] text-[#00113D] bg-white">
                <IoChatboxOutline size={16} />
                <button onClick={handleChatWithOwner}>Chat With Owner</button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-fit bg-white p-6 shadow-blue-100 rounded-xl drop-shadow-xs shadow-xs">
          <h2 className="text-lg font-semibold text-[#00113D] mb-4">
            Vehicle Account Details
          </h2>
          <div className="flex flex-col text-sm text-[#38393D]">
            <div className="flex items-center mb-2">
              Status:
              <span className="ml-2 font-semibold text-sky-950">
                {vehicleDetails.isApproved}
              </span>
            </div>
            <div className="flex items-center mb-2">
              Admin Status:
              <span className="ml-2 font-semibold text-sky-950">
                {vehicleDetails.isActive}
              </span>
            </div>
            <div className="flex items-center mb-2">
              Registration Date:
              <span className="ml-2 font-semibold text-sky-950">
                {new Date(vehicleDetails.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div
              className="flex justify-center items-center gap-2 mt-12 px-4 py-2 text-sm border rounded-full border-[#00113D] text-[#00113D] bg-white cursor-pointer"
              onClick={handleOpenEventsModal}
            >
              <CalendarMonthOutlinedIcon fontSize="small" />
              <button>Unavailable Dates</button>
            </div>
          </div>
        </section>
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
            {actionError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {actionError}
              </Alert>
            )}
          </div>
        </section>
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
            label="Year"
            name="year"
            value={editableVehicleDetails.year}
          />
          <EditableField
            label="Doors"
            name="doors"
            value={editableVehicleDetails.doors}
          />
          <EditableField
            label="Seats"
            name="seats"
            value={editableVehicleDetails.seats}
          />
          <EditableField
            label="Color"
            name="color"
            value={editableVehicleDetails.color}
          />
        </div>
      </div>

      <div className="flex lg:flex-row flex-col gap-8 mt-4">
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
                  onClick={() => window.open(doc.url, "_blank")}
                >
                  {doc.name}
                </Button>
                {isEditing &&
                  (docsToDelete.has(doc.key) ? (
                    <IconButton
                      onClick={() => handleUnmarkDocForDelete(doc.key)}
                    >
                      <UndoIcon />
                    </IconButton>
                  ) : (
                    <IconButton onClick={() => handleMarkDocForDelete(doc.key)}>
                      <MdDelete color="error" />
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
                  <p>{file.name}</p>
                  <IconButton onClick={() => handleRemoveNewDoc(index)}>
                    <FaTimes />
                  </IconButton>
                </div>
              ))}
            {isEditing && (
              <Button variant="outlined" component="label">
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
                        selectedImageUrl === img.url
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
                  <div key={i}>{formatDateRange(group)}</div>
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
      <Dialog open={dialogOpen.softDelete} onClose={handleCloseDialogs}>
        <DialogTitle>Confirm Soft Deletion</DialogTitle>
        <DialogContent>
          <Typography>Are you sure? This can be restored later.</Typography>
          {actionError && <Alert severity="error">{actionError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handleSoftDelete} color="warning">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={dialogOpen.restore} onClose={handleCloseDialogs}>
        <DialogTitle>Confirm Restore</DialogTitle>
        <DialogContent>
          <Typography>Restore this vehicle?</Typography>
          {actionError && <Alert severity="error">{actionError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handleRestore} color="success">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={dialogOpen.permanentDelete} onClose={handleCloseDialogs}>
        <DialogTitle>Confirm Permanent Deletion</DialogTitle>
        <DialogContent>
          <Alert severity="error">This is irreversible.</Alert>
          {actionError && <Alert severity="info">{actionError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handlePermanentDelete} color="error">
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Account;
