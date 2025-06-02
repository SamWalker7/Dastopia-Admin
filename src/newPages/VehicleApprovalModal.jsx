// VehicleApprovalModal.js
import React, { useEffect, useState, useCallback } from "react";
import Modal from "react-modal"; // Keep react-modal for the main modal
import { useNavigate } from "react-router-dom"; // <-- Import useNavigate

import {
  Typography,
  Box,
  Button,
  CircularProgress,
  Avatar,
  Dialog, // Added Dialog for MUI modals
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton, // Added IconButton for close button
  FormGroup,
  FormControlLabel,
  Checkbox,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import DirectionsCarOutlined from "@mui/icons-material/DirectionsCarOutlined";
import LocalOfferOutlined from "@mui/icons-material/LocalOfferOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import GridViewIcon from "@mui/icons-material/GridView";
import PhoneOutlined from "@mui/icons-material/PhoneOutlined"; // Added PhoneOutlined for profile

import {
  IoChatboxOutline, // <-- Keep this one
  IoLocationOutline,
  IoPersonOutline,
} from "react-icons/io5";
import { MdOutlineLocalPhone, MdOutlineMail } from "react-icons/md";
import { FaStar, FaSpinner } from "react-icons/fa";

// Import the getDownloadUrl function - Make sure this path is correct
import { getDownloadUrl } from "../api";
// Import the default avatar image - Make sure this path is correct
import image from "./avatar.png";
// Import the Image Slider component - Make sure this path is correct
import ImageSlider from "./ImageSlider";

// Make sure the app element is set if not already done in index.js or App.js
// Modal.setAppElement("#root"); // Can be set once at the app entry point

// Constants used in modal (can be shared or duplicated)
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
const placeholderVehicleImage = "https://via.placeholder.com/300";

// Helper function (can be shared or duplicated) - Used for displaying status
const getColumnKey = (apiStatus) => {
  return API_STATUS_TO_COLUMN[apiStatus] || "unassigned";
};

const VehicleApprovalModal = ({
  isOpen, // Controlled by parent
  vehicle, // The basic vehicle object from the list (contains ID, initial status)
  adminToken, // Passed from parent
  onClose, // Function to call when modal should close
  onActionSuccess, // Function to call after successful approve/reject
}) => {
  const navigate = useNavigate(); // <-- Initialize useNavigate hook

  // Get admin details from local storage (same logic as Account1.js)
  const admin = JSON.parse(localStorage.getItem("admin"));
  // Assuming 'username' holds the admin's unique ID for chat initiation
  const adminId = admin?.username; // <-- Retrieve adminId

  // State for details fetched SPECIFICALLY for this modal
  const [vehicleDetails, setVehicleDetails] = useState(null); // Full vehicle details from API /v1/vehicle/{id}
  const [loadingDetails, setLoadingDetails] = useState(false); // Loading state for modal details fetch
  const [errorDetails, setErrorDetails] = useState(null); // Error state for modal details fetch
  const [ownerProfile, setOwnerProfile] = useState(null); // Full owner profile for modal
  const [profileImageUrl, setProfileImageUrl] = useState(
    // State for owner profile image URL
    placeholderProfileImage
  );
  const [isImageLoading, setIsImageLoading] = useState(false); // Loading state for owner profile image
  const [rentalRating, setRentalRating] = useState(0); // Rental rating for modal

  // State for fetched vehicle image/document URLs for the modal
  const [vehicleImageUrls, setVehicleImageUrls] = useState([]); // Array of vehicle image URLs
  const [adminDocumentUrls, setAdminDocumentUrls] = useState([]); // Array of admin document URLs
  const [loadingMediaUrls, setLoadingMediaUrls] = useState(false); // Loading state for image/document URLs

  // State for the Material UI Dialog modals (Available Dates, Image Slider, Reject)
  const [openEventsDialog, setOpenEventsDialog] = useState(false);
  const [openImagesDialog, setOpenImagesDialog] = useState(false);
  const [openRejectModal, setOpenRejectModal] = useState(false);

  const [rejectReasons, setRejectReasons] = useState({
    ownerDetail: false,
    vehicleOverview: false,
    documents: false,
    photos: false,
  });

  // --- Handler for the Chat With Renter button (Copied/Adapted from Account1.js) ---
  const handleChatWithRenter = useCallback(() => {
    // Use the fully fetched ownerProfile and vehicleDetails from the modal's state
    const ownerId = vehicleDetails?.ownerId; // Get ownerId from fetched vehicle details
    // Use fetched ownerProfile data for name if available, fallback to vehicle details
    const ownerGivenName =
      ownerProfile?.given_name || vehicleDetails?.ownerGivenName || "Unknown";
    const ownerFamilyName =
      ownerProfile?.family_name || vehicleDetails?.ownerSurName || "";
    const currentVehicleId = vehicleDetails?.id; // Get vehicle ID from fetched details

    if (!adminId) {
      console.error(
        "Modal: Admin ID not found in localStorage. Cannot initiate chat."
      );
      alert("Your admin ID is missing. Please log in again.");
      return;
    }
    if (!ownerId) {
      console.error(
        "Modal: Owner ID not found in vehicle details. Cannot initiate chat."
      );
      alert("Owner details missing. Cannot initiate chat.");
      return;
    }
    if (!currentVehicleId) {
      console.error(
        "Modal: Vehicle ID not found. Cannot initiate chat context."
      );
      alert("Vehicle details missing. Cannot initiate chat.");
      return;
    }

    // Navigate to the ChatApp route.
    // 'renteeId' = ID of the target user (the owner)
    // 'reservationId' = context (using vehicleId here)
    // Pass owner's name for initial chat setup on the chat page.
    const chatUrl = `/chat?renteeId=${ownerId}&reservationId=${currentVehicleId}&given_name=${ownerGivenName}&family_name=${ownerFamilyName}`;

    console.log(
      `Modal: Navigating to chat with Owner ID: ${ownerId} (as renteeId), Admin ID: ${adminId}, Vehicle ID: ${currentVehicleId}`
    );

    navigate(chatUrl);

    // Optionally close the modal after navigating, consistent with typical workflow
    // onClose(); // Decide if you want the modal to close or stay open
    // Keeping it open might be better if the admin needs to do other things after starting chat
    // For now, let's match the previous behavior and *don't* auto-close, but keep the option in mind.
  }, [navigate, adminId, vehicleDetails, ownerProfile]); // Dependencies: hooks, state/props used

  // --- Fetch Rental Rating (Callback) ---
  const fetchRentalRating = useCallback(
    async (carID, token) => {
      if (!carID || !token) {
        console.warn(
          "Modal: Skipping rental rating fetch: Missing car ID or token."
        );
        return 0;
      }
      try {
        // Using the same endpoint structure as indicated
        const ratingApiUrl = `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/vehicle/${carID}/rating`;
        console.log("Modal: Fetching rental rating for vehicle ID:", carID);

        const response = await fetch(ratingApiUrl, {
          method: "GET", // Or POST, depending on your API
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Pass token
          },
          // If POST, add body: JSON.stringify({...})
        });

        if (!response.ok) {
          console.warn(
            `Modal: Failed to fetch rental rating: ${response.status} ${response.statusText}`
          );
          try {
            const errorBody = await response.text();
            console.warn("Modal: Rental rating fetch error body:", errorBody);
          } catch (e) {
            /* ignore */
          }
          return 0;
        }
        const data = await response.json();
        console.log("Modal: Rating API response:", data);

        // Adjust extraction based on the expected response structure
        if (data && data.body && data.body.averageRating !== undefined) {
          return data.body.averageRating;
        } else if (data && data.averageRating !== undefined) {
          return data.averageRating; // If not nested under body
        } else {
          console.warn(
            "Modal: Failed to fetch rental rating: Unexpected response structure",
            data
          );
          return 0;
        }
      } catch (error) {
        console.error("Modal: Error fetching rental rating:", error);
        return 0;
      }
    },
    [] // Dependencies for fetchRentalRating itself (the API call)
  );

  // --- Helper function to fetch image and document URLs ---
  const fetchMediaUrls = useCallback(
    async (vehicleKeys, documentKeys, token) => {
      setLoadingMediaUrls(true);
      const fetchedImageUrls = [];
      const fetchedDocumentUrls = [];

      try {
        // Fetch Image URLs
        if (vehicleKeys && vehicleKeys.length > 0) {
          const imageUrlPromises = vehicleKeys.map(async (key) => {
            try {
              // Call getDownloadUrl with the key
              const result = await getDownloadUrl(key, token); // Pass token as per Account1's vehicle media fetch
              return result?.body || result || null; // Check for .body or direct URL
            } catch (urlErr) {
              console.error(
                "Modal: Error fetching image URL for key:",
                key,
                urlErr
              );
              return null;
            }
          });
          const urls = await Promise.all(imageUrlPromises);
          fetchedImageUrls.push(...urls.filter((url) => url !== null));
        }

        // Fetch Document URLs
        if (documentKeys && documentKeys.length > 0) {
          const documentUrlPromises = documentKeys.map(async (key) => {
            try {
              // Call getDownloadUrl with the key
              const result = await getDownloadUrl(key, token); // Pass token as per Account1's vehicle media fetch
              return result?.body || result || null; // Check for .body or direct URL
            } catch (urlErr) {
              console.error(
                "Modal: Error fetching document URL for key:",
                key,
                urlErr
              );
              return null;
            }
          });
          const docUrls = await Promise.all(documentUrlPromises);
          fetchedDocumentUrls.push(...docUrls.filter((url) => url !== null));
        }

        setVehicleImageUrls(
          fetchedImageUrls.length > 0
            ? fetchedImageUrls
            : [placeholderVehicleImage] // Use placeholder if none fetched
        );
        setAdminDocumentUrls(fetchedDocumentUrls);
      } catch (urlFetchErr) {
        console.error(
          "Modal: Error in overall media URL fetching:",
          urlFetchErr
        );
        setVehicleImageUrls([placeholderVehicleImage]);
        setAdminDocumentUrls([]);
      } finally {
        setLoadingMediaUrls(false);
      }
    },
    [getDownloadUrl] // Depends on the imported getDownloadUrl function
  );

  // --- Effect to fetch Detailed Vehicle Data for the Modal ---
  useEffect(() => {
    const fetchModalDetails = async () => {
      // Reset states when modal opens or vehicle changes, but only if vehicle/token are present
      if (!isOpen || !vehicle?.id || !adminToken) {
        // Reset state when modal is not open or vehicle/token is missing
        console.log(
          "Modal: Resetting state due to missing props or modal closed."
        );
        setVehicleDetails(null);
        setErrorDetails(null);
        setLoadingDetails(false);
        setOwnerProfile(null);
        setProfileImageUrl(placeholderProfileImage);
        setRentalRating(0);
        setIsImageLoading(false);
        setVehicleImageUrls([]);
        setAdminDocumentUrls([]);
        setLoadingMediaUrls(false);
        setRejectReasons({
          // Also reset reject reasons
          ownerDetail: false,
          vehicleOverview: false,
          documents: false,
          photos: false,
        });
        return; // Stop if conditions not met
      }

      // Start loading only if vehicle and token are available and modal is open
      console.log(`Modal: Starting fetch for vehicle ID: ${vehicle.id}`);
      setLoadingDetails(true);
      setErrorDetails(null);
      // Clear specific states that will be refetched
      setVehicleDetails(null);
      setOwnerProfile(null);
      setProfileImageUrl(placeholderProfileImage);
      setRentalRating(0);
      setIsImageLoading(false); // Start false, set true just before image fetch if ownerId exists
      setVehicleImageUrls([]);
      setAdminDocumentUrls([]);
      setLoadingMediaUrls(false);

      try {
        // 1. Fetch Vehicle Details
        const apiUrlDetail = `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/vehicle/${vehicle.id}`;
        console.log("Modal: Fetching vehicle details from:", apiUrlDetail);
        const detailResponse = await fetch(apiUrlDetail, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        if (!detailResponse.ok) {
          const errorBody = await detailResponse.text();
          console.error(
            `Modal: HTTP error fetching vehicle details! status: ${detailResponse.status}`,
            errorBody
          );
          throw new Error(
            `Failed to fetch vehicle details: ${detailResponse.statusText}`
          );
        }

        const detailData = await detailResponse.json();
        console.log("Modal: Vehicle Detail API Response:", detailData);
        const modalVehicleDetails = detailData.body; // Assuming details are under 'body'
        if (!modalVehicleDetails || typeof modalVehicleDetails !== "object") {
          throw new Error("Invalid vehicle details response structure.");
        }
        setVehicleDetails(modalVehicleDetails);

        // 2. Fetch Owner Profile (if ownerId exists) AND Profile Image
        let modalOwnerProfile = null;
        let modalProfileImageUrl = placeholderProfileImage;
        setIsImageLoading(true); // Start loading for profile image specifically

        // Use the determined ownerId from vehicle details
        const ownerId = modalVehicleDetails?.ownerId; // Using ownerId from the fetched detailed data

        if (ownerId) {
          try {
            // Use the same user endpoint as Account1.js and MyApprovalListing
            const profileApiUrl = `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/user/${ownerId}`;
            console.log(
              `Modal: Attempting to fetch owner profile for owner ${ownerId} from:`,
              profileApiUrl
            );
            const profileResponse = await fetch(profileApiUrl, {
              headers: {
                Authorization: `Bearer ${adminToken}`, // Pass token
              },
            });

            console.log(
              `Modal: Owner profile response status for ${ownerId}:`,
              profileResponse.status
            );

            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              console.log("Modal: Owner Profile API Response:", profileData);

              // *** Use the EXACT SAME key extraction logic as Account1.js ***
              // Look for 'custom:profile_picture_key' using bracket notation
              // Assuming profileData itself is the object containing the key
              const profilePictureKey =
                profileData?.["custom:profile_picture_key"];

              console.log(
                `Modal: Profile picture key found for ${ownerId}:`,
                profilePictureKey
              );

              if (profilePictureKey) {
                try {
                  // *** Use the EXACT SAME getDownloadUrl call as Account1.js ***
                  // Account1.js calls getDownloadUrl with ONLY the key for the profile image.
                  // If getDownloadUrl requires the token, its internal implementation must handle it.
                  console.log(
                    `Modal: Calling getDownloadUrl for profile image key ${profilePictureKey} (owner ${ownerId})...`
                  );
                  const imageUrlResult = await getDownloadUrl(
                    profilePictureKey
                  );
                  console.log(
                    `Modal: getDownloadUrl result for profile image key ${profilePictureKey}:`,
                    imageUrlResult
                  );

                  // Assuming getDownloadUrl returns { body: 'the-url' }
                  modalProfileImageUrl =
                    imageUrlResult?.body || placeholderProfileImage; // Check for .body, fallback to placeholder
                  if (!imageUrlResult?.body) {
                    console.warn(
                      `Modal: getDownloadUrl did not return a body/URL for profile image key ${profilePictureKey} (owner ${ownerId})`
                    );
                  }
                } catch (imgUrlErr) {
                  console.error(
                    `Modal: Error fetching profile image URL for key ${profilePictureKey} (owner ${ownerId}):`,
                    imgUrlErr
                  );
                  modalProfileImageUrl = placeholderProfileImage; // Fallback on URL fetch error
                }
              } else {
                console.warn(
                  `Modal: Owner profile for ${ownerId} did not contain 'custom:profile_picture_key'.`,
                  profileData
                );
                modalProfileImageUrl = placeholderProfileImage; // Use placeholder if key is missing in profile data
              }
              modalOwnerProfile = profileData; // Set owner profile data after potentially getting image
            } else {
              console.warn(
                `Modal: HTTP error fetching owner profile: ${profileResponse.status} ${profileResponse.statusText} for owner ${ownerId}`,
                await profileResponse.text() // Log response text for debugging
              );
              modalProfileImageUrl = placeholderProfileImage; // Fallback on profile fetch error
            }
          } catch (profileError) {
            console.error(
              `Modal: Error fetching owner profile for owner ${ownerId}:`,
              profileError
            );
            modalProfileImageUrl = placeholderProfileImage; // Fallback on profile fetch error
          } finally {
            setIsImageLoading(false); // Stop loading state for the image
          }
        } else {
          console.log(
            `Modal: No ownerId found for vehicle ${vehicle.id}. Skipping profile fetch.`
          );
          modalProfileImageUrl = placeholderProfileImage; // Ensure placeholder if no ownerId on vehicle
          setIsImageLoading(false); // Stop loading state
        }
        setOwnerProfile(modalOwnerProfile);
        setProfileImageUrl(modalProfileImageUrl);

        // 3. Fetch Vehicle Image and Document URLs for modal
        // Pass adminToken here as per Account1's vehicle media fetch logic
        fetchMediaUrls(
          modalVehicleDetails?.vehicleImageKeys,
          modalVehicleDetails?.adminDocumentKeys,
          adminToken
        );

        // 4. Fetch Rental Rating for modal
        if (modalVehicleDetails?.id) {
          // Pass adminToken here as per the updated fetchRentalRating
          const rating = await fetchRentalRating(
            modalVehicleDetails.id,
            adminToken
          );
          setRentalRating(rating);
        } else {
          console.warn(
            "Modal: Vehicle details ID is missing for fetching rental rating."
          );
          setRentalRating(0);
        }
      } catch (err) {
        console.error("Modal: Error in main fetchModalDetails:", err);
        setErrorDetails(
          err.message || "An error occurred while fetching details."
        );
        setVehicleDetails(null);
        setOwnerProfile(null); // Clear states on main error
        setProfileImageUrl(placeholderProfileImage);
        setRentalRating(0);
        setIsImageLoading(false);
        setVehicleImageUrls([]);
        setAdminDocumentUrls([]);
        setLoadingMediaUrls(false);
      } finally {
        setLoadingDetails(false); // Stop main loading state
        console.log("Modal: fetchModalDetails finished.");
      }
    };

    // Fetch details only if modal is open, vehicle and token are present
    if (isOpen && vehicle?.id && adminToken) {
      fetchModalDetails();
    }
    // No cleanup needed for simple fetches, but good practice if using subscriptions/listeners
  }, [
    isOpen, // Re-run effect when modal opens/closes
    vehicle, // Re-run effect when a different vehicle is selected
    adminToken, // Re-run if admin token changes
    fetchRentalRating, // Dependency from useCallback
    fetchMediaUrls, // Dependency from useCallback
    getDownloadUrl, // Dependency from import
  ]);

  // --- Handlers for Dialogs/Modals internal to this component ---
  const handleOpenEventsDialog = useCallback(() => {
    if (vehicleDetails?.events && vehicleDetails.events.length > 0) {
      setOpenEventsDialog(true);
    } else {
      console.warn(
        "Modal: Attempted to open events dialog, but no events available."
      );
    }
  }, [vehicleDetails?.events]); // Depends on vehicleDetails.events

  const handleCloseEventsDialog = useCallback(
    () => setOpenEventsDialog(false),
    []
  );

  const handleOpenImagesDialog = useCallback(() => {
    if (
      vehicleImageUrls &&
      vehicleImageUrls.length > 0 &&
      vehicleImageUrls[0] !== placeholderVehicleImage
    ) {
      setOpenImagesDialog(true);
    } else {
      console.warn(
        "Modal: Attempted to open images dialog, but no images available or loading."
      );
    }
  }, [vehicleImageUrls]); // Depends on vehicleImageUrls

  const handleCloseImagesDialog = useCallback(
    () => setOpenImagesDialog(false),
    []
  );

  const handleViewDocument = useCallback((url) => {
    if (url) {
      window.open(url, "_blank");
    } else {
      console.warn(
        "Modal: Attempted to view document with null or undefined URL."
      );
    }
  }, []); // No dependencies

  const handleOpenRejectModal = useCallback(() => {
    if (vehicleDetails) {
      // Use vehicleDetails for modal context
      setOpenRejectModal(true);
    }
  }, [vehicleDetails]); // Depends on vehicleDetails

  const handleCloseRejectModal = useCallback(() => {
    setOpenRejectModal(false);
    // Reset reject reasons when closing the reject modal without submitting
    setRejectReasons({
      ownerDetail: false,
      vehicleOverview: false,
      documents: false,
      photos: false,
    });
  }, []); // No dependencies

  const handleRejectReasonChange = useCallback((event) => {
    setRejectReasons((prevReasons) => ({
      ...prevReasons,
      [event.target.name]: event.target.checked,
    }));
  }, []); // No dependencies

  const handleApproveListing = useCallback(async () => {
    if (!vehicleDetails?.id || !adminToken) {
      console.warn("Modal: Cannot approve: Missing vehicle ID or admin token.");
      setErrorDetails("Authentication required or vehicle details not loaded.");
      return;
    }

    setLoadingDetails(true);
    setErrorDetails(null);

    const approveApiUrl = `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/admin/approve_vehicle/${vehicleDetails.id}`;
    console.log("Modal: Approving vehicle from:", approveApiUrl);
    try {
      const response = await fetch(approveApiUrl, {
        method: "GET", // Assuming GET is correct based on URL structure
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          `Modal: HTTP error approving vehicle! status: ${response.status}`,
          errorBody
        );
        let errorMsg = `Failed to approve listing: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorBody);
          if (errorJson && errorJson.message) {
            errorMsg = `Failed to approve listing: ${errorJson.message}`;
          }
        } catch (parseError) {
          /* ignore */
        }
        setErrorDetails(errorMsg); // Set error state
        // No need to throw if setting state covers the error display
      } else {
        const result = await response.json();
        console.log("Modal: Approve API response:", result);
        alert("Listing approved successfully!");
        if (onActionSuccess) {
          onActionSuccess(); // Notify parent to refresh list
        }
        onClose(); // Close the modal
      }
    } catch (err) {
      console.error("Modal: Error approving listing:", err);
      // Only set a generic error if a more specific one wasn't already set by HTTP error
      if (!errorDetails) {
        setErrorDetails("An unexpected error occurred during approval.");
      }
    } finally {
      setLoadingDetails(false);
    }
  }, [vehicleDetails?.id, adminToken, onActionSuccess, onClose]); // Dependencies

  const handleRejectListing = useCallback(async () => {
    if (!vehicleDetails?.id || !adminToken) {
      console.warn("Modal: Cannot reject: Missing vehicle ID or admin token.");
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
    setErrorDetails(null); // Clear previous errors

    const denialReasonMessage = reasonsSelected
      .map((key) => {
        switch (key) {
          case "ownerDetail":
            return "Owner Details Incomplete/Incorrect";
          case "vehicleOverview":
            return "Vehicle Overview Inaccurate/Missing";
          case "documents":
            return "Documents Missing/Invalid";
          case "photos":
            return "Photos Unclear/Missing";
          default:
            return key; // Should not happen if reasons are fixed
        }
      })
      .join(", ");

    const denyApiUrl = `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/admin/deny_vehicle/${vehicleDetails.id}`;
    console.log(
      "Modal: Denying vehicle from:",
      denyApiUrl,
      "with reason:",
      denialReasonMessage
    );
    try {
      const response = await fetch(denyApiUrl, {
        method: "POST", // Assuming POST is correct
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ reason: denialReasonMessage }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          `Modal: HTTP error denying vehicle! status: ${response.status}`,
          errorBody
        );
        let errorMsg = `Failed to reject listing: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorBody);
          if (errorJson && errorJson.message) {
            errorMsg = `Failed to reject listing: ${errorJson.message}`;
          }
        } catch (parseError) {
          /* ignore */
        }
        setErrorDetails(errorMsg); // Set error state
        // No need to throw here if setting state covers display
      } else {
        const result = await response.json();
        console.log("Modal: Deny API response:", result);
        alert("Listing rejected successfully!");
        handleCloseRejectModal(); // Close reject modal first
        if (onActionSuccess) {
          onActionSuccess(); // Notify parent to refresh list
        }
        onClose(); // Close the main modal
      }
    } catch (err) {
      console.error("Modal: Error denying listing:", err);
      // Only set a generic error if a more specific one wasn't already set by HTTP error
      if (!errorDetails) {
        setErrorDetails("An unexpected error occurred during rejection.");
      }
    } finally {
      setLoadingDetails(false);
    }
  }, [
    vehicleDetails?.id,
    adminToken,
    rejectReasons,
    handleCloseRejectModal,
    onActionSuccess,
    onClose,
  ]); // Dependencies including rejectReasons

  // Filter events for the modal
  const availableEvents = vehicleDetails?.events
    ? vehicleDetails.events.filter((event) => event.status === "available")
    : [];

  // Determine current status label from fetched details (prioritize fetched)
  const currentStatusLabel = vehicleDetails?.isApproved
    ? columnLabels[getColumnKey(vehicleDetails.isApproved)]
    : vehicle?.isApproved // Fallback to status from the basic vehicle object passed by parent
    ? columnLabels[getColumnKey(vehicle.isApproved)]
    : columnLabels.unassigned; // Default if no status found

  // Memoize data used in render for potential minor performance gain
  const ownerDisplayName =
    ownerProfile?.given_name ||
    ownerProfile?.firstName ||
    ownerProfile?.family_name ||
    ownerProfile?.lastName
      ? `${ownerProfile?.given_name || ownerProfile?.firstName || ""} ${
          ownerProfile?.family_name || ownerProfile?.lastName || ""
        }`.trim()
      : vehicleDetails?.ownerGivenName && vehicleDetails?.ownerSurName
      ? `${vehicleDetails.ownerGivenName} ${vehicleDetails.ownerSurName}`
      : "N/A";

  const ownerDisplayPhone =
    ownerProfile?.phone_number || vehicleDetails?.ownerPhone || "N/A";
  const ownerDisplayEmail =
    ownerProfile?.email || vehicleDetails?.ownerEmail || "N/A";
  const ownerDisplayLocation = vehicleDetails?.city || "N/A"; // Using vehicle city for location

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
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
          },
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
        isOpen={isOpen} // Controlled by parent's state
        onRequestClose={onClose} // Call parent's close handler
        contentLabel="Vehicle Details Modal"
      >
        {/* Modal Header */}
        <div className=" bg-[#00173C] w-full text-white px-8 py-2 flex justify-between items-center sticky top-0 z-20">
          {" "}
          {/* Increased z-index slightly */}
          <Typography variant="h6" component="h2">
            Listing Approval
          </Typography>
          <IconButton
            onClick={onClose} // Call parent's close handler
            color="inherit"
            size="small" // Use small size for better appearance
          >
            <CloseIcon />
          </IconButton>
        </div>

        {/* Approval/Reject Buttons & Status */}
        {/* Only show buttons if a vehicle is selected/passed */}
        {
          // vehicleDetails &&
          //   vehicleDetails?.isApproved === "pending"
          true && ( // Use fetched vehicleDetails status
            <Box className="flex py-4 px-10 gap-4 w-full flex-wrap sticky top-[50px] bg-white z-10 border-b">
              {" "}
              {/* Adjusted top for sticky */}
              <button
                onClick={handleOpenRejectModal}
                disabled={loadingDetails}
                className="flex-1 py-2 cursor-pointer text-sm rounded-full bg-[#FDEAEA] text-red-700 border border-red-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-100 transition-colors"
              >
                Reject Listing
              </button>
              <button
                onClick={handleApproveListing}
                disabled={loadingDetails}
                className="flex-1 cursor-pointer text-sm py-2 rounded-full bg-[#00113D] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#002a5c] transition-colors"
              >
                {loadingDetails && !errorDetails // Only show processing if loading AND no specific error displayed below
                  ? "Processing..."
                  : "Approve Listing"}
              </button>
              {/* Error display below buttons if action fails */}
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
          )
        }
        {/* Display status if not pending, or if loading/error and status is known */}
        {vehicleDetails &&
          vehicleDetails?.isApproved !== "pending" && ( // Use fetched vehicleDetails status
            <Box className="flex py-4 px-10 gap-4 w-full flex-wrap sticky top-[50px] bg-white z-10 border-b items-center justify-center">
              {" "}
              {/* Adjusted top and added centering */}
              <Typography
                className={`flex-1 text-center font-semibold py-2 ${
                  currentStatusLabel === columnLabels.approved
                    ? "text-green-700"
                    : currentStatusLabel === columnLabels.rejected
                    ? "text-red-700"
                    : "text-gray-700" // Default color for unassigned/in review/loading
                }`}
              >
                Status:{" "}
                {loadingDetails && !errorDetails
                  ? "Loading..."
                  : currentStatusLabel}
              </Typography>
              {errorDetails && ( // Show error below status if not pending initially
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
        {/* Display loading/error if details haven't loaded at all */}
        {!vehicleDetails &&
          (loadingDetails ? (
            <Typography align="center" sx={{ my: 4 }}>
              Loading vehicle details...{" "}
              <CircularProgress size={20} sx={{ ml: 1 }} />
            </Typography>
          ) : errorDetails ? ( // Display error if details fetch failed completely
            <Typography color="error" align="center" sx={{ my: 4 }}>
              Error loading details: {errorDetails}
            </Typography>
          ) : (
            // Should only show if modal is open but vehicleDetails is null unexpectedly
            isOpen && (
              <Typography
                align="center"
                sx={{ my: 4, color: "text.secondary" }}
              >
                Select a vehicle to view details.{" "}
                {/* Or "Vehicle details not available." */}
              </Typography>
            )
          ))}

        {/* Modal Content Body (Only render if vehicleDetails are successfully loaded) */}
        {vehicleDetails && (
          <Box className="flex flex-col p-2 px-10">
            {/* Display denial reason if rejected */}
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

            {/* Owner/User Details, Account Details, Stat Cards */}
            <Box className="flex flex-wrap w-full h-fit bg-white p-6 space-y-6 rounded-xl drop-shadow-sm shadow-xs gap-4">
              <div className="flex justify-between flex-wrap w-full">
                {/* User Details Section */}
                <section className=" w-full md:w-[calc(50%_-_1rem)] flex flex-col gap-4 pr-0 md:pr-8 mb-8 md:mb-0">
                  <div className=" items-center flex gap-8">
                    {/* Profile Image Loading/Display */}
                    {isImageLoading ? (
                      <div className="w-32 h-32 rounded-full flex items-center justify-center bg-gray-100">
                        <FaSpinner className="animate-spin text-2xl text-gray-400" />
                      </div>
                    ) : (
                      // Use the fetched or placeholder image URL
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
                        {ownerDisplayName} {/* Use memoized display name */}
                      </Typography>
                      <Typography
                        variant="body2"
                        className="flex items-center gap-2 text-[#38393D] mt-1"
                      >
                        {/* Use PhoneOutlined icon */}
                        <PhoneOutlined
                          size={18}
                          sx={{ fontSize: "18px" }}
                        />{" "}
                        {/* Explicitly set size if needed */}
                        <p>{ownerDisplayPhone}</p> {/* Use memoized phone */}
                      </Typography>
                      <Typography
                        variant="body2"
                        className="flex items-center gap-2 text-[#38393D] mt-1"
                      >
                        <MdOutlineMail size={18} />
                        <p>{ownerDisplayEmail}</p> {/* Use memoized email */}
                      </Typography>
                      <Typography
                        variant="body2"
                        className="flex items-center gap-2 text-[#38393D] mt-1"
                      >
                        <IoLocationOutline size={18} />
                        <p>{ownerDisplayLocation}</p>{" "}
                        {/* Use memoized location */}
                      </Typography>
                    </div>
                  </div>
                  {/* Chat Button */}
                  <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 text-sm  border rounded-full border-[#00113D] text-[#00113D] bg-white">
                    <IoChatboxOutline size={16} />
                    <button
                      onClick={handleChatWithRenter} // <-- Attach the handler
                      // Disable if loading, adminId is missing, or ownerId is missing
                      disabled={
                        loadingDetails || !adminId || !vehicleDetails?.ownerId
                      }
                    >
                      Chat With Renter
                    </button>
                  </div>
                  {/* Assigned Admin & Status - Consider if status should be editable here or only via approve/reject */}
                  <div className="flex items-center gap-8 flex-wrap">
                    <Typography
                      variant="body2"
                      className="flex flex-col w-full md:w-1/2"
                    >
                      <span className=" text-lg font-semibold text-gray-700">
                        Assigned Admin
                      </span>
                      <span className="">Asigned to me</span>{" "}
                      {/* Replace with actual assigned admin */}
                    </Typography>
                    {/* Status Display (Read-only here as actions handle status change) */}
                    <FormControl
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 120,
                        width: "100%",
                        md: { width: "auto" },
                      }}
                      disabled // Make it read-only
                    >
                      <InputLabel size="small">Status</InputLabel>
                      <Select
                        label="Status"
                        name="status"
                        size="small"
                        value={getColumnKey(vehicleDetails?.isApproved)} // Display current status from fetched details
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
                    Account Details {/* Label from Account1 */}
                  </h2>
                  <div className="flex flex-col   text-sm text-[#38393D]">
                    <div className="flex items-center mb-2">
                      Vehicle Status: {/* Clarified label */}
                      <span className="ml-2 font-semibold text-sky-950">
                        {currentStatusLabel} {/* Use the determined label */}
                      </span>
                    </div>
                    {/* Assuming isActive exists in modal details */}
                    <div className="flex items-center mb-2">
                      Admin Status:
                      <span className="ml-2 font-semibold text-sky-950">
                        {vehicleDetails?.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center mb-2">
                      Registration Date:
                      <span className="ml-2 font-semibold text-sky-950">
                        {displayRegistrationDate} {/* Use memoized date */}
                      </span>
                    </div>
                    <div className="flex items-center mb-2">
                      Rent Amount:
                      <span className="ml-2 font-semibold text-sky-950">
                        {displayRentAmount} {/* Use memoized rent amount */}
                      </span>
                    </div>

                    {/* Available Dates Button */}
                    <div
                      className={`flex items-center justify-center gap-2 mt-12 px-4 py-2 text-sm border rounded-full border-[#00113D] text-[#00113D] bg-white ${
                        !vehicleDetails?.events || availableEvents.length === 0 // Check availableEvents count
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer hover:bg-gray-100"
                      }`}
                      onClick={handleOpenEventsDialog}
                      disabled={
                        !vehicleDetails?.events || availableEvents.length === 0 // Check availableEvents count
                      }
                    >
                      <CalendarMonthOutlinedIcon fontSize="small" />
                      <button
                        disabled={
                          !vehicleDetails?.events ||
                          availableEvents.length === 0
                        }
                      >
                        Available Dates ({availableEvents.length})
                      </button>
                    </div>
                  </div>
                </section>

                {/* Stat Cards Section - Assuming these are vehicle specific stats */}
                <div className="flex flex-col w-full md:w-1/3 gap-6">
                  <div className=" bg-white p-6 flex justify-between items-center w-full gap-24 shadow-blue-200   rounded-xl drop-shadow-xs shadow-xs">
                    <h2 className="text-base font-semibold text-[#00113D] ">
                      Total Rentals {/* Clarified label */}
                    </h2>
                    <span className="px-4 text-gray-600 text-base">N/A</span>{" "}
                    {/* Replace with actual data if available */}
                  </div>
                  <div className=" bg-white p-6 flex justify-between items-center w-full gap-24 shadow-blue-200   rounded-xl drop-shadow-xs shadow-xs">
                    <h2 className="text-base font-semibold text-[#00113D] ">
                      Total Earnings {/* Clarified label */}
                    </h2>
                    <span className="pr-4 text-gray-600 text-base">N/A</span>{" "}
                    {/* Replace with actual data if available */}
                  </div>
                  <div className=" bg-white p-6 flex justify-between items-center w-full gap-24 shadow-blue-200   rounded-xl drop-shadow-xs shadow-xs">
                    <h2 className="text-base font-semibold text-[#00113D] ">
                      Vehicle Rating {/* Clarified label */}
                    </h2>
                    <div className="pr-4 gap-x-2 flex  text-lg items-center">
                      <FaStar color="gold" size={24} />
                      <span className="ml-2">
                        {rentalRating !== null
                          ? rentalRating?.toFixed(1)
                          : "N/A"}
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
              {/* Vehicle details grid - Use optional chaining (?.) for safety */}
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
                      vehicleDetails?.vehicleNumber || // Fallback
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

              {/* Features Section */}
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

            {/* Documents and Photos Sections */}
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
                    {adminDocumentUrls.map((url, index) => (
                      <Button
                        key={index}
                        variant="text"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewDocument(url);
                        }}
                        href="#"
                        startIcon={<AttachFileIcon />}
                        sx={{
                          justifyContent: "flex-start",
                          textTransform: "none",
                        }}
                      >
                        Document {index + 1}{" "}
                        {/* Or use actual names if available */}
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
                    <Button
                      variant="text"
                      onClick={handleOpenImagesDialog}
                      startIcon={<GridViewIcon />}
                      sx={{
                        justifyContent: "flex-start",
                        textTransform: "none",
                      }}
                    >
                      View {vehicleImageUrls.length} Photo(s)
                    </Button>
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

      {/* --- Available Events Dialog (MUI Dialog) --- */}
      <Dialog
        open={openEventsDialog}
        onClose={handleCloseEventsDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Available Events
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
          {availableEvents.length > 0 ? (
            <ul>
              {availableEvents.map((event, index) => (
                <li
                  key={event.eventId || index}
                  style={{
                    marginBottom: "12px",
                    paddingBottom: "12px",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <Typography variant="body2">
                    <strong>Status:</strong> {event.status}
                  </Typography>
                  <Typography variant="body2">
                    <strong>From:</strong>{" "}
                    {event.startDate
                      ? new Date(event.startDate).toLocaleString()
                      : "N/A"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>To:</strong>{" "}
                    {event.endDate
                      ? new Date(event.endDate).toLocaleString()
                      : "N/A"}
                  </Typography>
                </li>
              ))}
            </ul>
          ) : (
            <Typography>No available events found for this vehicle.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEventsDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* --- Image Slider Dialog (MUI Dialog) --- */}
      <Dialog
        open={openImagesDialog}
        onClose={handleCloseImagesDialog}
        fullScreen
      >
        <DialogTitle sx={{ bgcolor: "#333", color: "#fff", pb: 1 }}>
          Vehicle Photos
          <IconButton
            aria-label="close"
            onClick={handleCloseImagesDialog}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "#fff",
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            backgroundColor: "#333",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 0,
          }}
        >
          {loadingMediaUrls ? (
            <CircularProgress color="inherit" />
          ) : vehicleImageUrls.length > 0 &&
            vehicleImageUrls[0] !== placeholderVehicleImage ? (
            <ImageSlider
              imageUrls={vehicleImageUrls.filter(
                (url) => url !== placeholderVehicleImage // Ensure placeholder isn't in the slider
              )}
            />
          ) : (
            <Typography variant="h6" sx={{ color: "#fff" }}>
              No images available.
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* --- Reject Reason Modal (react-modal) --- */}
      <Modal
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1001, // Higher z-index than main modal
          },
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
        <div className=" bg-[#00173C] w-full text-white px-8 py-2 flex justify-between items-center">
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
          <h1 className=" font-semibold mb-6">
            Please select options from below
          </h1>
          <FormGroup className="px-4">
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
          <Box className="flex mt-8 gap-4 w-full ">
            <button
              onClick={handleRejectListing}
              disabled={
                loadingDetails ||
                Object.values(rejectReasons).every((reason) => !reason) // Disable if no reasons selected
              }
              className="flex-1 text-sm py-2 cursor-pointer rounded-full bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
            >
              {loadingDetails ? "Processing..." : "Confirm Rejection"}
            </button>
          </Box>
          {errorDetails && ( // Display rejection action error
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
