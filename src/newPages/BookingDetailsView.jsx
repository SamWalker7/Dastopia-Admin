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
// Icons used ONLY in the details view (or primarily)
import {
  IoChatboxOutline,
  IoLocationOutline,
  IoPersonOutline,
} from "react-icons/io5";
import { MdOutlineLocalPhone, MdOutlineMail } from "react-icons/md";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import GridViewIcon from "@mui/icons-material/GridView";
import CloseIcon from "@mui/icons-material/Close";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import {
  // Font Awesome icons
  // FaRegCircle, // Not used
  FaStar, // Used for rating display
  FaSpinner, // Used for profile image loading
  FaCheckCircle, // Used in getStatusIcon
  FaTimesCircle, // Used in getStatusIcon
  FaClock, // Used in getStatusIcon
} from "react-icons/fa";

// Icons potentially used in both (importing here for BookingDetailsView)
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined"; // Used in getStatusIcon for 'review'

// Keep static images as placeholders for default
import image from "./avatar.png"; // Rentee default image fallback
import image1 from "./avatar1.png"; // Owner default image fallback

// --- Import the actual getDownloadUrl function ---
// You NEED to have this file and function implemented correctly at '../api'.
// It must accept only the key and return a Promise resolving to { body: 'the_url' }
import { getDownloadUrl } from "../api"; // <-- !!! ENSURE THIS PATH IS CORRECT relative to BookingDetailsView.js!!!

// --- Import the actual Image Slider component ---
import ImageSlider from "./ImageSlider"; // <-- !!! ENSURE THIS PATH IS CORRECT relative to BookingDetailsView.js!!!

// --- Import Hooks ---
import { useNavigate } from "react-router-dom"; // Import useNavigate here

// Base API URL (Redefine or import from a config file)
const API_BASE_URL =
  "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1";

// --- CONSTANT DECLARATIONS (Keep outside) ---
const placeholderProfileImage = "https://via.placeholder.com/150"; // Placeholder for when no image URL is set yet
const placeholderVehicleImage = "https://via.placeholder.com/300"; // Placeholder for vehicle images if needed
// --- END CONSTANT DECLARATIONS ---

// Helper function to get the access token (Can stay outside as it's a utility)
const getAccessToken = () => {
  try {
    const adminData = localStorage.getItem("admin");
    if (adminData) {
      const admin = JSON.parse(adminData);
      return admin.AccessToken;
    }
  } catch (e) {
    console.error("Error parsing admin data from localStorage:", e);
    return null;
  }
  return null;
};

// Helper function to safely extract and format names (Can stay outside or move inside)
// Moving inside BookingDetailsView as it's tightly coupled with user details structure here
/*
const formatUserName = (userObject) => {
  if (!userObject) return "N/A";
  const firstName = userObject.given_name || userObject.first_name || "";
  const lastName = userObject.family_name || userObject.last_name || "";
  return `${firstName} ${lastName}`.trim() || "N/A";
};
*/

// Helper function to generate initials from a full name string (Can stay outside or move inside)
// Moving inside BookingDetailsView
/*
const getInitials = (fullName) => { ... };
*/

// Booking Details View Component
const BookingDetailsView = ({ selectedBooking }) => {
  // Receiving selectedBooking prop
  // --- Import Hooks INSIDE the component ---
  const navigate = useNavigate(); // Declare useNavigate hook

  // State for fetched data
  const [vehicleDetails, setVehicleDetails] = useState(null);
  // const [ownerProfile, setOwnerProfile] = useState(null); // Owner profile endpoint data (seems redundant with user endpoint)
  const [ownerUserDetails, setOwnerUserDetails] = useState(null); // Full owner user details from /v1/user
  const [renteeDetails, setRenteeDetails] = useState(null); // Full rentee user details from /v1/user

  // State for loading and errors
  const [loading, setLoading] = useState(true); // Main loading for *this* component's data fetches
  const [error, setError] = useState(null); // Main error state for *this* component's data fetches
  const [loadingUrls, setLoadingUrls] = useState(false); // Loading for vehicle media/doc URLs

  // State for media/docs
  const [imageUrls, setImageUrls] = useState([]); // Vehicle image URLs
  const [documentUrls, setDocumentUrls] = useState([]); // Vehicle document URLs
  // Profile image state for the OWNER
  const [ownerProfileImageUrl, setOwnerProfileImageUrl] = useState(
    placeholderProfileImage
  ); // Owner profile image URL state
  const [isOwnerProfileImageLoading, setIsOwnerProfileImageLoading] =
    useState(true); // Loading state specifically for the owner profile image
  // Profile image state for the RENTEE (Assuming we *don't* fetch rentee profile image here, just use initials/fallback)
  // const [renteeProfileImageUrl, setRenteeProfileImageUrl] = useState(placeholderProfileImage);
  // const [isRenteeProfileImageLoading, setIsRenteeProfileImageLoading] = useState(false); // No loading if not fetching

  // State for modals
  const [showEventsModal, setShowEventsModal] = useState(false); // Vehicle events modal
  const [showImagesModal, setShowImagesModal] = useState(false); // Vehicle images modal

  // State for other details (like vehicle rating)
  const [rentalRating, setRentalRating] = useState(0); // State for the rating

  // Get admin details from local storage (for token and chat initiation ID)
  const admin = JSON.parse(localStorage.getItem("admin"));
  const adminId = admin?.username; // Assuming 'username' is the admin's chat ID
  const adminToken = admin?.AccessToken; // Need adminToken here

  // --- Helper functions used within this component (Wrapped in useCallback) ---

  const formatDateTime = useCallback((isoString) => {
    if (!isoString) return "N/A";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      const options = {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      };
      return date.toLocaleString("en-GB", options).replace(",", " |");
    } catch (e) {
      console.error("Error formatting date:", isoString, e);
      return "Error";
    }
  }, []);

  // Helper function to generate initials from a full name string
  const getInitials = useCallback((fullName) => {
    if (!fullName || typeof fullName !== "string" || fullName.trim() === "") {
      return null;
    }
    const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length === 0) return null;

    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();

    const firstInitial = nameParts[0].charAt(0).toUpperCase();
    const lastInitial = nameParts[nameParts.length - 1]
      ?.charAt(0)
      ?.toUpperCase();

    if (firstInitial && lastInitial) {
      return firstInitial + lastInitial;
    } else if (firstInitial) {
      return firstInitial;
    } else if (lastInitial) {
      return lastInitial;
    }

    return null;
  }, []);

  // --- getStatusIcon helper ---
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

  const getUserDisplayName = useCallback((userDetails) => {
    if (!userDetails) return "N/A";
    const firstName = userDetails.given_name || userDetails.first_name || "";
    const lastName = userDetails.family_name || userDetails.last_name || "";

    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

    if (fullName) return fullName;

    return userDetails.id || userDetails.sub || "Unknown User";
  }, []);

  const getUserPhoneNumber = useCallback((userDetails) => {
    if (!userDetails) return "N/A";
    return userDetails.phone_number || userDetails.phone || "N/A";
  }, []);

  const handleViewDocument = useCallback((url) => {
    if (url) {
      window.open(url, "_blank");
    } else {
      console.warn("Attempted to view document with null or undefined URL.");
    }
  }, []);
  // --- END Helper functions used within this component ---

  // Handler for the Chat With Owner button
  const handleChatWithOwner = useCallback(
    (ownerId, ownerGivenName, ownerFamilyName, bookingId) => {
      if (!adminId) {
        console.error(
          "Admin ID not found in localStorage. Cannot initiate chat."
        );
        alert("Your admin ID is missing. Please log in again.");
        return;
      }
      if (!ownerId) {
        console.error("Owner ID missing. Cannot initiate chat.");
        alert("Owner details missing. Cannot initiate chat.");
        return;
      }

      navigate(
        `/chat?renteeId=${ownerId}&reservationId=${bookingId}&given_name=${ownerGivenName}&family_name=${ownerFamilyName}`
      );

      console.log(
        `Navigating to chat with Owner ID: ${ownerId} (as renteeId), Admin ID: ${adminId}, Booking ID: ${bookingId}`
      );
    },
    [navigate, adminId] // navigate and adminId are dependencies
  );

  // Handler for the Chat With Rentee button
  const handleChatWithRentee = useCallback(
    (renteeId, renteeGivenName, renteeFamilyName, bookingId) => {
      if (!adminId) {
        console.error(
          "Admin ID not found in localStorage. Cannot initiate chat."
        );
        alert("Your admin ID is missing. Please log in again.");
        return;
      }
      if (!renteeId) {
        console.error("Rentee ID missing. Cannot initiate chat.");
        alert("Rentee details missing. Cannot initiate chat.");
        return;
      }

      navigate(
        `/chat?renteeId=${renteeId}&reservationId=${bookingId}&given_name=${renteeGivenName}&family_name=${renteeFamilyName}`
      );

      console.log(
        `Navigating to chat with Rentee ID: ${renteeId} (as renteeId), Admin ID: ${adminId}, Booking ID: ${bookingId}`
      );
    },
    [navigate, adminId] // navigate and adminId are dependencies
  );

  const fetchDownloadUrls = useCallback(
    async (vehicle) => {
      setLoadingUrls(true);
      const fetchedImageUrls = [];
      const fetchedDocumentUrls = [];

      if (!vehicle) {
        setLoadingUrls(false);
        return;
      }

      try {
        // Fetch vehicle image URLs
        if (vehicle?.vehicleImageKeys && vehicle.vehicleImageKeys.length > 0) {
          const urls = await Promise.all(
            vehicle.vehicleImageKeys.map((key) =>
              getDownloadUrl(key).catch((urlErr) => {
                console.error("Error fetching URL for key:", key, urlErr);
                return null; // Return null or undefined on error
              })
            )
          );
          // Filter out null/undefined results and invalid body structures
          fetchedImageUrls.push(
            ...urls
              .filter(
                (result) => result?.body && typeof result.body === "string"
              )
              .map((result) => result.body)
          );
        }

        // Fetch vehicle document URLs
        if (
          vehicle?.adminDocumentKeys &&
          vehicle.adminDocumentKeys.length > 0
        ) {
          const docUrls = await Promise.all(
            vehicle.adminDocumentKeys.map((key) =>
              getDownloadUrl(key).catch((urlErr) => {
                console.error(
                  "Error fetching document URL for key:",
                  key,
                  urlErr
                );
                return null; // Return null or undefined on error
              })
            )
          );
          // Filter out null/undefined results and invalid body structures
          fetchedDocumentUrls.push(
            ...docUrls
              .filter(
                (result) => result?.body && typeof result.body === "string"
              )
              .map((result) => result.body)
          );
        }

        setImageUrls(fetchedImageUrls);
        setDocumentUrls(fetchedDocumentUrls);
      } catch (urlFetchErr) {
        console.error("Error in overall URL fetching:", urlFetchErr);
        setImageUrls([]); // Clear urls on error
        setDocumentUrls([]); // Clear doc urls on error
      } finally {
        setLoadingUrls(false);
      }
    },
    [getDownloadUrl]
  ); // getDownloadUrl is a dependency

  // --- Fetch Rental Rating (Placeholder) ---
  const fetchRentalRating = useCallback(
    async (carID) => {
      // Using local adminToken state from this component
      if (!carID || !adminToken) return 0;
      try {
        console.warn(
          "Using placeholder logic for fetchRentalRating. PLEASE REPLACE!"
        );
        // Simulate API call delay and return a random rating
        await new Promise((resolve) => setTimeout(resolve, 300));
        const mockRating = Math.floor(Math.random() * 50) / 10; // Random rating between 0 and 5
        return mockRating;
      } catch (error) {
        console.error("Error fetching rental rating:", error);
        return 0;
      }
    },
    [adminToken] // Dependency on adminToken
  );

  // --- Main Effect to fetch all details for the selected booking ---
  useEffect(() => {
    console.log("BookingDetailsView useEffect triggered.");
    // Ensure selectedBooking and adminToken are available before fetching
    if (!selectedBooking || !adminToken) {
      console.log("selectedBooking or Admin Token missing. Clearing details.");
      // Set loading to false and clear data if requirements are not met
      setLoading(false);
      setError(
        new Error("Booking details cannot be loaded. Missing parameters.")
      );
      // Clear all states related to booking details
      setVehicleDetails(null);
      // setOwnerProfile(null); // Redundant state
      setOwnerUserDetails(null);
      setRenteeDetails(null);
      setOwnerProfileImageUrl(placeholderProfileImage); // Reset owner profile image
      setIsOwnerProfileImageLoading(false); // Stop owner profile image loading
      setRentalRating(0);
      setImageUrls([]); // Clear vehicle images
      setDocumentUrls([]); // Clear vehicle docs
      setLoadingUrls(false); // Stop vehicle media/doc loading
      return; // Exit the effect
    }

    const fetchAllDetails = async () => {
      console.log("Fetching all details for booking:", selectedBooking.id);
      setLoading(true); // Start main loading
      setError(null); // Clear previous errors

      // Reset states before fetching new data
      setVehicleDetails(null);
      // setOwnerProfile(null); // Redundant state
      setOwnerUserDetails(null);
      setRenteeDetails(null);
      setOwnerProfileImageUrl(placeholderProfileImage); // Reset owner profile image
      setIsOwnerProfileImageLoading(true); // Start owner profile image loading
      setRentalRating(0);
      setImageUrls([]); // Clear vehicle images
      setDocumentUrls([]); // Clear vehicle docs
      setLoadingUrls(false); // Stop vehicle media/doc loading initially

      const { carId, ownerId, renteeId } = selectedBooking;

      // --- Fetch Owner User Details (needed for profile picture key and name) ---
      // Execute this regardless of other fetches' success, if ownerId exists
      let ownerUserPromise = Promise.resolve(null); // Initialize promise
      if (ownerId) {
        // Use an immediately invoked async function to handle the async logic within the promise chain
        ownerUserPromise = (async () => {
          console.log("Fetching owner user details for ID:", ownerId);
          setIsOwnerProfileImageLoading(true); // Start image loading related to owner profile fetch
          try {
            // Use the /v1/user/{userId} endpoint for full user details
            const ownerUserApiUrl = `${API_BASE_URL}/user/${ownerId}`;
            const ownerUserResponse = await fetch(ownerUserApiUrl, {
              headers: { Authorization: `Bearer ${adminToken}` }, // Use adminToken
            });
            if (!ownerUserResponse.ok) {
              console.warn(
                `Failed to fetch owner user details for ID ${ownerId}: ${ownerUserResponse.status}`
              );
              return null; // Return null on fetch failure
            }
            const ownerUserData = await ownerUserResponse.json();
            console.log(
              "Fetched owner user details (from /v1/user):",
              ownerUserData
            );
            // Check if the data is a valid object and has the expected ID
            if (
              ownerUserData &&
              typeof ownerUserData === "object" &&
              ownerUserData.id === ownerId
            ) {
              // --- Fetch Owner Profile Image URL ---
              const profilePictureKey =
                ownerUserData["custom:profile_picture_key"];
              console.log("Owner profile picture key:", profilePictureKey);

              if (profilePictureKey) {
                try {
                  // isOwnerProfileImageLoading is already true
                  const imageUrlResult = await getDownloadUrl(
                    profilePictureKey
                  ); // Use getDownloadUrl
                  console.log(
                    "Owner profile image download URL result:",
                    imageUrlResult
                  );
                  const imageUrl = imageUrlResult?.body;
                  if (imageUrl && typeof imageUrl === "string") {
                    setOwnerProfileImageUrl(imageUrl); // Set the fetched URL
                    console.log("Owner profile image URL set:", imageUrl);
                  } else {
                    console.warn(
                      "getDownloadUrl did not return a valid URL for key:",
                      profilePictureKey,
                      imageUrlResult
                    );
                    // ownerProfileImageUrl remains placeholderProfileImage
                  }
                } catch (imgUrlErr) {
                  console.error(
                    "Error fetching owner profile image URL:",
                    imgUrlErr
                  );
                  // ownerProfileImageUrl remains placeholderProfileImage
                }
              } else {
                console.warn(
                  "Fetched owner user details has no 'custom:profile_picture_key'.",
                  ownerUserData
                );
                // ownerProfileImageUrl remains placeholderProfileImage
              }
              // --- End Fetch Owner Profile Image URL ---

              return ownerUserData; // Return user data on success
            } else {
              console.warn(
                "Invalid owner user response structure from /v1/user:",
                ownerUserData
              );
              return null; // Return null if structure is invalid
            }
          } catch (userErr) {
            console.error("Error fetching owner user details:", userErr);
            return null; // Return null on exception
          } finally {
            setIsOwnerProfileImageLoading(false); // Image loading finished (regardless of success/failure)
            console.log("Owner profile image URL fetch finished.");
          }
        })(); // Immediately invoke the async function
      } else {
        console.warn(
          "No ownerId in selected booking. Skipping owner user details fetch."
        );
        setOwnerUserDetails(null); // Ensure state is null
        setOwnerProfileImageUrl(placeholderProfileImage); // Reset image
        setIsOwnerProfileImageLoading(false); // Stop image loading
      }

      // --- Fetch Vehicle Details ---
      // Execute this regardless of other fetches' success, if carId exists
      let vehiclePromise = Promise.resolve(null);
      if (carId) {
        console.log("Fetching vehicle details for ID:", carId);
        const vehicleApiUrl = `${API_BASE_URL}/vehicle/${carId}`;
        // Use an immediately invoked async function for vehicle fetch
        vehiclePromise = (async () => {
          try {
            const vehicleResponse = await fetch(vehicleApiUrl, {
              headers: { Authorization: `Bearer ${adminToken}` },
            }); // Use adminToken
            if (!vehicleResponse.ok) {
              const errorBody = await vehicleResponse.text();
              if (vehicleResponse.status === 404) {
                console.warn(`Vehicle with ID ${carId} not found.`);
              } else {
                console.error(
                  `Failed to fetch vehicle details: ${vehicleResponse.status} ${vehicleResponse.statusText} - ${errorBody}`
                );
              }
              return null; // Return null on fetch failure
            }
            const vehicleData = await vehicleResponse.json();
            console.log("Fetched vehicle details:", vehicleData);
            if (vehicleData && vehicleData.body) {
              fetchDownloadUrls(vehicleData.body); // Fetch vehicle media/docs (has its own loading state)
              fetchRentalRating(carId).then(setRentalRating); // Fetch rating
              return vehicleData.body; // Return vehicle data on success
            } else {
              console.warn("Invalid vehicle response structure.", vehicleData);
              return null; // Return null on invalid structure
            }
          } catch (vehicleErr) {
            console.error("Error fetching vehicle details:", vehicleErr);
            return null; // Return null on exception
          }
        })(); // Immediately invoke the async function
      } else {
        console.warn(
          "No carId in selected booking. Skipping vehicle details fetch."
        );
        setVehicleDetails(null); // Ensure state is null
        fetchDownloadUrls(null); // Call with null to clear loading state/URLs
        setRentalRating(0); // Reset rating
      }

      // --- Fetch Rentee User Details ---
      // Execute this regardless of other fetches' success, if renteeId exists
      let renteeUserPromise = Promise.resolve(null);
      if (renteeId) {
        console.log("Fetching rentee user details for ID:", renteeId);
        const renteeApiUrl = `${API_BASE_URL}/user/${renteeId}`;
        // Use an immediately invoked async function for rentee fetch
        renteeUserPromise = (async () => {
          try {
            const renteeResponse = await fetch(renteeApiUrl, {
              headers: { Authorization: `Bearer ${adminToken}` },
            }); // Use adminToken
            if (!renteeResponse.ok) {
              console.warn(
                `Failed to fetch rentee details for ID ${renteeId}: ${renteeResponse.status}`
              );
              return null; // Return null on fetch failure
            }
            const renteeData = await renteeResponse.json();
            console.log("Fetched rentee details:", renteeData);
            if (
              renteeData &&
              typeof renteeData === "object" &&
              renteeData.id === renteeId
            ) {
              return renteeData; // Return rentee data on success
            } else {
              console.warn("Invalid rentee response structure:", renteeData);
              return null; // Return null on invalid structure
            }
          } catch (renteeErr) {
            console.error("Error fetching rentee details:", renteeErr);
            return null; // Return null on exception
          }
        })(); // Immediately invoke the async function
      } else {
        console.warn(
          "No renteeId in selected booking. Skipping rentee details fetch."
        );
        setRenteeDetails(null); // Ensure state is null
      }

      // --- Wait for all parallel fetches to settle ---
      // Assign results to variables as they are fetched
      const [ownerUserResult, vehicleResult, renteeUserResult] =
        await Promise.allSettled([
          ownerUserPromise,
          vehiclePromise,
          renteeUserPromise,
        ]);

      // Update state *after* all are settled (reduces re-renders during fetches)
      if (ownerUserResult.status === "fulfilled")
        setOwnerUserDetails(ownerUserResult.value);
      if (vehicleResult.status === "fulfilled")
        setVehicleDetails(vehicleResult.value);
      if (renteeUserResult.status === "fulfilled")
        setRenteeDetails(renteeUserResult.value);

      // --- Final Error Check ---
      // Determine if a significant error occurred that should be reported
      let finalError = null;
      // Check if the fetch failed AND the ID was present in the booking
      if (vehicleResult.status === "rejected" && selectedBooking.carId) {
        finalError = new Error(
          "Could not load vehicle details for this booking."
        );
      }
      // Use else if or combine messages if multiple could fail
      if (ownerUserResult.status === "rejected" && selectedBooking.ownerId) {
        finalError = finalError
          ? `${finalError.message}, Owner details missing.`
          : new Error("Could not load owner details for this booking.");
      }
      if (renteeUserResult.status === "rejected" && selectedBooking.renteeId) {
        finalError = finalError
          ? `${finalError.message}, Rentee details missing.`
          : new Error("Could not load rentee details for this booking.");
      }

      // Set error state if any significant issue was detected, otherwise clear previous errors
      setError(finalError);

      setLoading(false); // Main loading is complete
      // Specific loadings (isOwnerProfileImageLoading, loadingUrls) are handled in their respective logic blocks
      console.log("fetchAllDetails finished.");
    }; // --- End fetchAllDetails async function ---

    // Only trigger the main fetch if selectedBooking and adminToken are available
    if (selectedBooking?.id && adminToken) {
      fetchAllDetails(); // Call the async function defined above
    } else {
      // This case is handled at the top of the effect already by the initial check
      console.log(
        "Effect triggered but selectedBooking or adminToken is missing. Skipping fetchAllDetails."
      );
    }

    // Cleanup function for this effect (optional for fetch calls)
    return () => {
      console.log("BookingDetailsView useEffect cleanup.");
      // No explicit cleanup needed for fetch calls unless using AbortController.
      // State clearing happens at the start of the effect or when selectedBooking/adminToken is missing.
    };

    // Include memoized helper fetch functions and getDownloadUrl in dependencies
    // Note: We are now using local state 'adminToken' instead of a prop.
  }, [selectedBooking, adminToken, fetchDownloadUrls, fetchRentalRating]);

  // Handlers for Modals (Wrapped in useCallback if used as event handlers)
  const handleOpenEventsModal = useCallback(() => setShowEventsModal(true), []);
  const handleCloseEventsModal = useCallback(
    () => setShowEventsModal(false),
    []
  );

  const handleOpenImagesModal = useCallback(() => setShowImagesModal(true), []);
  const handleCloseImagesModal = useCallback(
    () => setShowImagesModal(false),
    []
  );

  // --- Render Logic ---
  // Show main loading spinner for the entire view if main data is loading
  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh" // Use minHeight to avoid collapse
        sx={{ mt: 4 }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2, mt: 2 }}>
          Loading booking and vehicle details...
        </Typography>
      </Box>
    );
  }

  // Show main error if the primary fetches failed
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        Error loading details: {error.message || String(error)}{" "}
        {/* Display error message or convert error object to string */}
      </Alert>
    );
  }

  // If loading is false, but selectedBooking is somehow null (shouldn't happen if parent works correctly)
  if (!selectedBooking) {
    console.warn(
      "BookingDetailsView rendered without a selectedBooking after loading finished."
    );
    return <Typography sx={{ mt: 4 }}>No booking selected.</Typography>;
  }

  // Data derived from state for display
  const availableEvents = vehicleDetails?.events
    ? vehicleDetails.events.filter((event) => event.status === "available")
    : [];

  // Filter out invalid image URLs for the image slider
  const validImageUrls = imageUrls.filter(
    (url) => typeof url === "string" && url !== placeholderProfileImage
  );

  // Get display names and initials for Owner and Rentee
  const ownerDisplayName = getUserDisplayName(ownerUserDetails);
  const renteeDisplayName = getUserDisplayName(renteeDetails);
  const ownerPhoneNumber = getUserPhoneNumber(ownerUserDetails);
  const renteePhoneNumber = getUserPhoneNumber(renteeDetails);

  const ownerInitials = getInitials(ownerDisplayName); // Get initials for Owner
  const renteeInitials = getInitials(renteeDisplayName); // Get initials for Rentee

  return (
    <div className="flex flex-col mt-8">
      {/* Owner and Rentee Details Section */}
      <div className="flex w-full gap-4 flex-row">
        {/* Owner Details Section */}
        <section className="h-fit bg-white p-6 space-y-6 w-full lg:w-1/2 px-10 shadow-blue-300 rounded-xl drop-shadow-xs shadow-xs">
          <div className="items-center flex gap-8">
            {/* Owner Profile Picture / Initials / Spinner / Fallback Image Logic */}
            {isOwnerProfileImageLoading &&
            ownerProfileImageUrl === placeholderProfileImage ? ( // Show spinner only if image is loading AND we are still showing the placeholder
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <FaSpinner className="animate-spin text-2xl text-gray-400" />
              </div>
            ) : ownerProfileImageUrl &&
              ownerProfileImageUrl !== placeholderProfileImage ? ( // If a valid image URL was fetched and is not the placeholder
              <img
                src={ownerProfileImageUrl} // Use the fetched URL
                alt={`${ownerDisplayName}'s Profile`}
                className="w-32 h-32 rounded-full object-cover flex-shrink-0"
                onError={(e) => {
                  // Add a fallback onError handler just in case the fetched URL fails to load
                  console.error(
                    "Owner profile image failed to load from URL:",
                    e.target.src
                  );
                  e.target.onerror = null; // Prevent infinite loop if the fallback also fails
                  // Replace the img element with either the initials div or the static fallback img
                  const parentDiv = e.target.parentNode;
                  if (ownerInitials !== null) {
                    parentDiv.innerHTML = `<div class="w-32 h-32 rounded-full bg-blue-600 text-white font-bold text-4xl flex items-center justify-center flex-shrink-0">${ownerInitials}</div>`;
                  } else {
                    const fallbackImg = document.createElement("img");
                    fallbackImg.src = image1; // Use static image1
                    fallbackImg.alt = `${ownerDisplayName}'s Profile`;
                    fallbackImg.className =
                      "w-32 h-32 rounded-full object-cover flex-shrink-0";
                    parentDiv.innerHTML = ""; // Clear original img
                    parentDiv.appendChild(fallbackImg); // Append fallback
                  }
                }}
              />
            ) : // If loading finished and no valid URL was found, show initials or fallback image
            ownerInitials !== null ? ( // If initials could be generated
              <div className="w-32 h-32 rounded-full bg-blue-600 text-white font-bold text-4xl flex items-center justify-center flex-shrink-0">
                {ownerInitials} {/* Display calculated initials */}
              </div>
            ) : (
              // If initials could NOT be generated (name empty/invalid)
              <img
                src={image1} // Use the static fallback image 'image1'
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
              {ownerUserDetails?.email && ( // Use ownerUserDetails for email
                <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                  <MdOutlineMail size={18} />
                  <p>{ownerUserDetails.email}</p>
                </div>
              )}
              {(ownerUserDetails?.city ||
                vehicleDetails?.city ||
                (vehicleDetails?.pickUp && vehicleDetails.pickUp[0])) && (
                <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                  <IoLocationOutline size={18} />
                  <p>
                    {ownerUserDetails?.city ||
                      vehicleDetails?.city ||
                      "Location Available"}
                  </p>
                </div>
              )}

              {/* Chat Button for Owner */}
              <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 text-sm border rounded-full border-[#00113D] text-[#00113D] bg-white cursor-pointer hover:bg-gray-100">
                <IoChatboxOutline size={16} />
                <button
                  onClick={() =>
                    handleChatWithOwner(
                      selectedBooking?.ownerId, // Owner's ID from booking
                      ownerUserDetails?.given_name ||
                        ownerDisplayName.split(" ")[0] ||
                        "Owner", // Pass given name from user details or part of display name
                      ownerUserDetails?.family_name ||
                        ownerDisplayName.split(" ")[1] ||
                        "", // Pass family name or part of display name
                      selectedBooking?.id // Pass booking ID
                    )
                  }
                  disabled={!adminId || !selectedBooking?.ownerId} // Disable if admin or owner ID missing
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
            {/* Rentee Profile Picture / Initials / Static Image Logic */}
            {/* Assuming no profile fetch for rentee in this component, directly use initials or static image */}
            {/* Use the Rentee's initials or fallback */}
            {renteeInitials !== null ? ( // If initials could be generated for rentee
              <div className="w-32 h-32 rounded-full bg-green-600 text-white font-bold text-4xl flex items-center justify-center flex-shrink-0">
                {renteeInitials} {/* Display calculated initials */}
              </div>
            ) : (
              // If initials could NOT be generated for rentee (name empty/invalid)
              <img
                src={image} // Use the static fallback image 'image' for rentee
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
              {renteeDetails?.email && ( // Use renteeDetails for email
                <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                  <MdOutlineMail size={18} />
                  <p>{renteeDetails.email}</p>
                </div>
              )}
              {renteeDetails?.city && ( // Use renteeDetails for city
                <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                  <IoLocationOutline size={18} />
                  <p>{renteeDetails.city}</p>
                </div>
              )}

              {/* Chat Button for Rentee */}
              <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 text-sm border rounded-full border-[#00113D] text-[#00113D] bg-white cursor-pointer hover:bg-gray-100">
                <IoChatboxOutline size={16} />
                <button
                  onClick={() =>
                    handleChatWithRentee(
                      selectedBooking?.renteeId, // Rentee's ID from booking
                      renteeDetails?.given_name ||
                        renteeDisplayName.split(" ")[0] ||
                        "Rentee", // Pass given name from user details or part of display name
                      renteeDetails?.family_name ||
                        renteeDisplayName.split(" ")[1] ||
                        "", // Pass family name or part of display name
                      selectedBooking?.id // Pass booking ID
                    )
                  }
                  disabled={!adminId || !selectedBooking?.renteeId} // Disable if admin or rentee ID missing
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
        {/* Booking Details */}
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
                    : selectedBooking?.isPayed === "failed"
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {selectedBooking?.isPayed || "N/A"}
              </span>
            </div>
          </div>
        </section>

        {/* Vehicle Listing Status Section */}
        <section className="w-full lg:w-1/3 bg-white p-6 h-fit shadow-blue-300 rounded-xl drop-shadow-xs shadow-xs">
          <h2 className="text-lg font-semibold text-[#00113D] mb-4">
            Vehicle Listing Status
          </h2>
          {/* Show spinner if vehicle details are specifically loading */}
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
                <CircularProgress size={20} />{" "}
                <Typography sx={{ ml: 1 }}>
                  Loading Vehicle Status...
                </Typography>
              </Box>
            )}
          {/* Show error if vehicle details failed to load */}
          {vehicleDetails === null &&
            selectedBooking?.carId &&
            error && ( // Check the main error state
              <Typography variant="body2" color="error.main" sx={{ mb: 2 }}>
                Could not load vehicle status.
              </Typography>
            )}
          {/* Show details only if vehicleDetails are loaded */}
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
                <button>Available Dates ({availableEvents.length})</button>
              </div>
            </div>
          ) : (
            // Show placeholder if vehicle details were not loaded
            <Typography variant="body2" color="textSecondary">
              Vehicle details not available.
            </Typography>
          )}
        </section>

        {/* Rental Rating Section */}
        <section className="w-full lg:w-1/3 bg-white p-6 h-fit shadow-blue-300 rounded-xl drop-shadow-xs shadow-xs">
          <h2 className="text-lg font-semibold text-[#00113D] mb-4">
            Rental Rating
          </h2>
          {vehicleDetails ? ( // Only show if vehicle details were fetched
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
                    "N/A (No ratings found or placeholder used)"
                  )}
                </span>
              </div>
              {/* Add more rating details here if available from API */}
            </div>
          ) : (
            <Typography variant="body2" color="textSecondary">
              Cannot load rental rating without vehicle details.
            </Typography>
          )}
        </section>
      </div>

      {/* Vehicle Overview Section */}
      {vehicleDetails && ( // Only show if vehicle details are loaded
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

      {/* Documents and Photos Sections in two columns */}
      {/* Only show these sections if vehicle details were potentially fetched */}
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
                {documentUrls.map((url, index) => (
                  <Button
                    key={index}
                    variant="text"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewDocument(url);
                    }}
                    href="#"
                    startIcon={<AttachFileIcon />}
                    sx={{ justifyContent: "flex-start" }}
                  >
                    Document {index + 1}
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
            ) : validImageUrls.length > 0 ? (
              <div className="flex flex-col gap-4">
                <Button
                  variant="text"
                  onClick={handleOpenImagesModal}
                  startIcon={<GridViewIcon />}
                  sx={{ justifyContent: "flex-start" }}
                >
                  View {validImageUrls.length} Photo(s)
                </Button>
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

      {/* Available Events Dialog */}
      <Dialog
        open={showEventsModal}
        onClose={handleCloseEventsModal}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Available Events
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
                    <strong>Status:</strong> {event.status || "N/A"}
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
          <Button onClick={handleCloseEventsModal}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Image Slider Dialog */}
      <Dialog
        open={showImagesModal}
        onClose={handleCloseImagesModal}
        fullScreen
      >
        <DialogTitle sx={{ bgcolor: "#333", color: "#fff", pb: 1 }}>
          Vehicle Photos
          <IconButton
            aria-label="close"
            onClick={handleCloseImagesModal}
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
          {loadingUrls ? (
            <CircularProgress color="inherit" />
          ) : validImageUrls.length > 0 ? (
            <ImageSlider imageUrls={validImageUrls} />
          ) : (
            <Typography variant="h6" sx={{ color: "#fff" }}>
              No images available.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// --- Export the BookingDetailsView component ---
export default BookingDetailsView;
