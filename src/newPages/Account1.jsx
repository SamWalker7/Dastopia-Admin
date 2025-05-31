// Account1.js
import React, { useEffect, useState, useCallback } from "react";
import image from "./avatar.png"; // This can still be the default placeholder
import {
  // Import icons
  IoPersonOutline,
  IoLocationOutline,
  IoChatboxOutline,
} from "react-icons/io5";
import { MdOutlineLocalPhone, MdOutlineMail } from "react-icons/md";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import GridViewIcon from "@mui/icons-material/GridView";
import {
  // Added status icons
  FaStar,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
} from "react-icons/fa";
import { getDownloadUrl } from "../api"; // Assuming your api.js exports getDownloadUrl
import { useNavigate } from "react-router-dom"; // Import useNavigate

import {
  // Material UI components
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

// Import the Image Slider component
import ImageSlider from "./ImageSlider"; // <--- Ensure this path is correct

const placeholderProfileImage = "https://via.placeholder.com/150"; // Placeholder for when no image is available or loading fails
const placeholderVehicleImage = "https://via.placeholder.com/300"; // For the main preview

const Account = ({ vehicleId, adminToken }) => {
  // Receive vehicleId and adminToken props
  const navigate = useNavigate(); // Initialize useNavigate

  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [loading, setLoading] = useState(true); // Main loading state for vehicle details
  const [error, setError] = useState(null); // Error state for main fetch
  const [ownerProfile, setOwnerProfile] = useState(null); // State to hold owner profile data
  const [profileImageUrl, setProfileImageUrl] = useState(
    placeholderProfileImage
  ); // State for the profile image URL
  const [isImageLoading, setIsImageLoading] = useState(true); // Loading state specifically for the profile image
  const [rentalRating, setRentalRating] = useState(0); // State for vehicle rental rating

  const [imageUrls, setImageUrls] = useState([]); // State for vehicle image URLs
  const [documentUrls, setDocumentUrls] = useState([]); // State for document URLs
  const [loadingUrls, setLoadingUrls] = useState(false); // Loading state for file URLs

  const [showEventsModal, setShowEventsModal] = useState(false); // State for events modal
  const [showImagesModal, setShowImagesModal] = useState(false); // State for images modal

  // Get admin details from local storage
  const admin = JSON.parse(localStorage.getItem("admin"));
  // Assuming 'username' holds the admin's unique ID for chat initiation
  const adminId = admin?.username;

  // Handler for the Chat With Owner button
  const handleChatWithOwner = useCallback(
    (ownerId, ownerGivenName, ownerFamilyName, currentVehicleId) => {
      if (!adminId) {
        console.error(
          "Admin ID not found in localStorage. Cannot initiate chat."
        );
        alert("Your admin ID is missing. Please log in again.");
        return;
      }
      if (!ownerId) {
        console.error("Owner ID not found. Cannot initiate chat.");
        alert("Owner details missing. Cannot initiate chat.");
        return;
      }

      // Navigate to the ChatApp route.
      // The 'renteeId' parameter should be the ID of the *target* user for the chat (the owner).
      // The 'reservationId' parameter can be used for context; using the vehicleId makes sense here.
      // Pass owner's name for initial chat setup on the chat page.
      navigate(
        `/chat?renteeId=${ownerId}&reservationId=${currentVehicleId}&given_name=${ownerGivenName}&family_name=${ownerFamilyName}`
      );

      console.log(
        `Navigating to chat with Owner ID: ${ownerId} (as renteeId), Admin ID: ${adminId}, Vehicle ID: ${currentVehicleId}`
      );
    },
    [navigate, adminId] // navigate and adminId are dependencies
  );

  // Define fetchDownloadUrls using useCallback to avoid re-creating
  const fetchDownloadUrls = useCallback(
    async (vehicle) => {
      setLoadingUrls(true);
      const fetchedImageUrls = [];
      const fetchedDocumentUrls = [];

      try {
        // Fetch Image URLs
        if (vehicle.vehicleImageKeys && vehicle.vehicleImageKeys.length > 0) {
          const urls = await Promise.all(
            vehicle.vehicleImageKeys.map(async (key) => {
              try {
                const result = await getDownloadUrl(key);
                // Assuming getDownloadUrl returns { body: 'the-url' } or similar
                return result?.body || null;
              } catch (urlErr) {
                console.error("Error fetching URL for key:", key, urlErr);
                return null;
              }
            })
          );
          fetchedImageUrls.push(...urls.filter((url) => url !== null)); // Add non-null URLs
        }

        // Fetch Document URLs
        if (vehicle.adminDocumentKeys && vehicle.adminDocumentKeys.length > 0) {
          const docUrls = await Promise.all(
            vehicle.adminDocumentKeys.map(async (key) => {
              try {
                const result = await getDownloadUrl(key); // Assume returns { body: 'url' }
                return result?.body || null; // Use optional chaining for safety
              } catch (urlErr) {
                console.error(
                  "Error fetching document URL for key:",
                  key,
                  urlErr
                );
                return null; // Return null on error
              }
            })
          );
          fetchedDocumentUrls.push(...docUrls.filter((url) => url !== null)); // Add non-null URLs
        }

        setImageUrls(
          fetchedImageUrls.length > 0
            ? fetchedImageUrls
            : [placeholderVehicleImage]
        ); // Use placeholder if none fetched
        setDocumentUrls(fetchedDocumentUrls);
      } catch (urlFetchErr) {
        console.error("Error in overall URL fetching:", urlFetchErr);
        // Keep previous state or set to defaults
        setImageUrls([placeholderVehicleImage]);
        setDocumentUrls([]);
      } finally {
        setLoadingUrls(false);
      }
    },
    [getDownloadUrl]
  ); // getDownloadUrl is a dependency as it's called inside

  // Fetch Rental Rating
  const fetchRentalRating = useCallback(
    async (carID) => {
      if (!carID) return 0;
      try {
        // **CRITICAL:** Replace this with your ACTUAL API endpoint and logic for fetching ratings by CAR ID
        console.warn(
          "Using placeholder URL for fetchRentalRating. PLEASE REPLACE!"
        );
        const ratingApiUrl = "YOUR_ACTUAL_GET_RATING_API_ENDPOINT"; // <--- REPLACE THIS PLACEHOLDER

        // Dummy fetch call to avoid breaking if the placeholder URL is used directly
        // If your actual API requires POST/body, uncomment and modify the fetch options
        /*
        const response = await fetch(ratingApiUrl, {
          method: "POST", // Or GET, depending on your API
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`, // Might need token
          },
          body: JSON.stringify({
            // Payload structure depends on your API
            operation: "getRatingsbyID", // Adjust operation if needed
            carId: carID,
          }),
        });
        const data = await response.json();
        console.log("Rating API response:", data);
        if (data && data.body && data.body.averageRating !== undefined) {
          return data.body.averageRating || 0;
        } else {
          console.warn(
            "Failed to fetch rental rating or rating not found for vehicle",
            carID, data
          );
          return 0;
        }
        */
        // --- Temporary Dummy Return ---
        console.log("Fetching dummy rating for carId:", carID);
        return 4.5; // Return a dummy rating
        // --- End Temporary Dummy Return ---
      } catch (error) {
        console.error("Error fetching rental rating:", error);
        return 0; // Return 0 on error
      }
    },
    [adminToken] // Dependency on adminToken if used in the actual fetch
  );

  // Main Effect to fetch vehicle details, owner profile, urls, and rating
  useEffect(() => {
    // Ensure necessary props are available
    if (!vehicleId || !adminToken) {
      console.warn("Vehicle ID or Admin Token missing.");
      setLoading(false);
      setError("Vehicle details cannot be loaded. Missing parameters.");
      setIsImageLoading(false);
      setLoadingUrls(false);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      // Clear states before fetching new data
      setVehicleDetails(null);
      setOwnerProfile(null);
      setProfileImageUrl(placeholderProfileImage);
      setRentalRating(0);
      setImageUrls([]);
      setDocumentUrls([]);

      try {
        // 1. Fetch Vehicle Details (using admin token)
        const vehicleApiUrl = `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/vehicle/${vehicleId}`; // Use admin endpoint
        console.log("Fetching vehicle details from:", vehicleApiUrl);
        const vehicleResponse = await fetch(vehicleApiUrl, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });

        if (!vehicleResponse.ok) {
          if (vehicleResponse.status === 404) {
            throw new Error(`Vehicle with ID ${vehicleId} not found.`);
          }
          throw new Error(
            `Failed to fetch vehicle details: ${vehicleResponse.status}`
          );
        }

        const vehicleData = await vehicleResponse.json();
        console.log("Fetched vehicle details:", vehicleData);

        if (vehicleData && vehicleData.body) {
          const vehicle = vehicleData.body;
          setVehicleDetails(vehicle);

          // 2. Fetch Owner Profile (if ownerId exists)
          if (vehicle.ownerId) {
            setIsImageLoading(true); // Start loading profile image
            try {
              // *** MODIFIED API URL FOR OWNER PROFILE ***
              // Use the /v1/user/{userId} endpoint as specified
              const profileApiUrl = `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/user/${vehicle.ownerId}`;
              console.log("Fetching owner profile from:", profileApiUrl);

              const profileResponse = await fetch(profileApiUrl, {
                headers: { Authorization: `Bearer ${adminToken}` }, // Authentication header needed
              });

              if (!profileResponse.ok) {
                console.warn(
                  `Failed to fetch owner profile for ID ${vehicle.ownerId}: ${profileResponse.status}`
                );
                setOwnerProfile(null); // Clear owner profile state
                setProfileImageUrl(placeholderProfileImage); // Use placeholder on error
              } else {
                const profileData = await profileResponse.json();
                console.log(
                  "Fetched owner profile (from /v1/user):",
                  profileData
                );

                // Check if profileData contains expected fields based on the specified structure
                // Assuming the structure you provided is the response body itself, not nested under 'body'
                if (
                  profileData &&
                  typeof profileData === "object" &&
                  profileData.id === vehicle.ownerId
                ) {
                  setOwnerProfile(profileData); // Set the fetched object as the profile

                  // *** MODIFIED KEY ACCESS AND DOWNLOAD URL CALL ***
                  // Look for the 'custom:profile_picture_key' property using bracket notation
                  const profilePictureKey =
                    profileData["custom:profile_picture_key"];

                  if (profilePictureKey) {
                    console.log(
                      "Profile picture key found:",
                      profilePictureKey
                    );
                    try {
                      // Call getDownloadUrl with the key
                      const imageUrlResult = await getDownloadUrl(
                        profilePictureKey
                      );
                      console.log(
                        "Profile image download URL result:",
                        imageUrlResult
                      );
                      // Assuming getDownloadUrl returns { body: 'the-url' } or similar
                      setProfileImageUrl(
                        imageUrlResult?.body || placeholderProfileImage // Use optional chaining for safety
                      );
                      if (!imageUrlResult?.body) {
                        console.warn(
                          "getDownloadUrl did not return a body/URL for key:",
                          profilePictureKey
                        );
                      }
                    } catch (imgUrlErr) {
                      console.error(
                        "Error fetching profile image URL for key:",
                        profilePictureKey,
                        imgUrlErr
                      );
                      setProfileImageUrl(placeholderProfileImage); // Fallback on URL fetch error
                    }
                  } else {
                    console.warn(
                      "Profile data did not contain 'custom:profile_picture_key'.",
                      profileData
                    );
                    setProfileImageUrl(placeholderProfileImage); // Use placeholder if key is missing
                  }
                } else {
                  console.warn(
                    "Invalid profile response structure from /v1/user:",
                    profileData
                  );
                  setOwnerProfile(null);
                  setProfileImageUrl(placeholderProfileImage);
                }
              }
            } catch (profileErr) {
              console.error("Error fetching owner profile:", profileErr);
              setOwnerProfile(null);
              setProfileImageUrl(placeholderProfileImage);
            } finally {
              setIsImageLoading(false); // Stop loading profile image regardless of success/failure
            }
          } else {
            // No owner ID for this vehicle, so no profile to fetch
            console.log("No ownerId for this vehicle. Skipping profile fetch.");
            setOwnerProfile(null);
            setProfileImageUrl(placeholderProfileImage);
            setIsImageLoading(false);
          }

          // 3. Fetch Vehicle Image and Document URLs
          fetchDownloadUrls(vehicle); // This uses its own loading state (loadingUrls)

          // 4. Fetch Rental Rating
          const rating = await fetchRentalRating(vehicle.id); // Use vehicle.id
          setRentalRating(rating);
        } else {
          // Vehicle details fetch was OK, but body was unexpected
          setError("Invalid response structure for vehicle details.");
          setVehicleDetails(null); // Clear potentially partial details
          setOwnerProfile(null);
          setProfileImageUrl(placeholderProfileImage);
          setRentalRating(0);
          setImageUrls([]);
          setDocumentUrls([]);
          setIsImageLoading(false); // Ensure loading stops
          setLoadingUrls(false); // Ensure URL loading stops
        }
      } catch (err) {
        // Catch any error during vehicle details fetch or subsequent steps
        console.error("Error in main fetchDetails:", err);
        setError(err.message || "An error occurred while fetching details.");
        setVehicleDetails(null);
        setOwnerProfile(null);
        setProfileImageUrl(placeholderProfileImage);
        setRentalRating(0);
        setImageUrls([]);
        setDocumentUrls([]);
        setIsImageLoading(false); // Ensure loading stops
        setLoadingUrls(false); // Ensure URL loading stops
      } finally {
        setLoading(false); // Stop main loading
        console.log("fetchDetails finished.");
      }
    };

    fetchDetails();

    // Cleanup function (optional for simple fetches, but good practice)
    // No explicit cleanup needed for standard fetch calls, but can abort if fetch controller is used
    // If this effect relies on external subscriptions, unsubscribe here.
  }, [
    vehicleId, // Re-run if vehicleId changes
    adminToken, // Re-run if adminToken changes
    fetchDownloadUrls, // Re-run if fetchDownloadUrls identity changes (due to its dependencies)
    fetchRentalRating, // Re-run if fetchRentalRating identity changes (due to its dependencies)
    getDownloadUrl, // Re-run if getDownloadUrl identity changes (if it's not a stable import)
    // Exclude state setters like setVehicleDetails, setOwnerProfile, etc.
  ]);

  // Handlers for Modals
  const handleOpenEventsModal = () => setShowEventsModal(true);
  const handleCloseEventsModal = () => setShowEventsModal(false);

  const handleOpenImagesModal = () => setShowImagesModal(true);
  const handleCloseImagesModal = () => setShowImagesModal(false);

  const handleViewDocument = useCallback((url) => {
    if (url) {
      window.open(url, "_blank"); // Open URL in a new tab
    } else {
      console.warn("Attempted to view document with null or undefined URL.");
    }
  }, []); // Empty dependency array as it doesn't depend on component state/props

  const getStatusIcon = useCallback((status) => {
    switch (
      status?.toLowerCase() // Use toLowerCase for case-insensitivity
    ) {
      case "approved":
      case "active":
        return <FaCheckCircle className="text-green-600 inline-block mr-1" />;
      case "pending":
        return <FaClock className="text-yellow-600 inline-block mr-1" />;
      case "inactive":
      case "rejected":
        return <FaTimesCircle className="text-red-600 inline-block mr-1" />;
      default:
        return null; // Or a default icon
    }
  }, []); // Empty dependency array as it's a pure function

  // Render null or loading indicator if main vehicle details are still loading
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

  // Render error message if main fetch failed
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

  // Render fallback if no vehicle details are available after loading
  if (!vehicleDetails) {
    // This should ideally be caught by the error state above if vehicleId was valid but fetch failed,
    // or if vehicleId was initially null (handled by the initial check).
    // But adding a fallback message is fine.
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

  // Filter available events
  const availableEvents = vehicleDetails.events
    ? vehicleDetails.events.filter((event) => event.status === "available")
    : [];

  // Determine the owner's name for display and chat (prioritize ownerProfile if fetched)
  const ownerGivenName =
    ownerProfile?.given_name || vehicleDetails?.ownerGivenName || "Unknown"; // Note: Access 'given_name' from new API response structure
  const ownerFamilyName =
    ownerProfile?.family_name || vehicleDetails?.ownerSurName || ""; // Note: Access 'family_name' from new API response structure

  return (
    <div className="flex flex-col mt-8">
      <div className="flex w-full gap-4">
        {/* User Details Section */}
        <section className="h-fit bg-white p-6 space-y-6 w-fit px-10 shadow-blue-100 rounded-xl drop-shadow-xs shadow-xs">
          <div className="items-center flex gap-8">
            {isImageLoading ? (
              <div className="w-32 h-32 rounded-full flex items-center justify-center bg-gray-100">
                <FaSpinner className="animate-spin text-2xl text-gray-400" />
              </div>
            ) : (
              <img
                src={profileImageUrl} // Use fetched URL state
                alt="User Profile"
                className="w-32 h-32 rounded-full object-cover"
              />
            )}
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold text-[#00113D] mb-2">
                User Details
              </h2>
              {/* Display the user's name (owner) - Use combined name from state or fallback */}
              <h3 className="flex gap-4 text-sm text-[#38393D]">
                <IoPersonOutline size={18} />
                {ownerGivenName} {ownerFamilyName} {/* Display the names */}
              </h3>
              {/* Display the user's phone (owner) - Prioritize fetched profile data, then vehicle data */}
              <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                <MdOutlineLocalPhone size={18} />
                <p>
                  {ownerProfile?.phone_number || // Use 'phone_number' from new API response structure
                    vehicleDetails.ownerPhone ||
                    "N/A"}
                </p>
              </div>
              {/* Display the user's email (owner) - Prioritize fetched profile data, then vehicle data */}
              <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                <MdOutlineMail size={18} />
                <p>
                  {ownerProfile?.email || // Use 'email' from new API response structure
                    vehicleDetails.ownerEmail ||
                    "N/A"}
                </p>
              </div>
              {/* Display the user's location (owner) - Prioritize fetched profile data, then vehicle data */}
              {/* Assuming city is in both or either */}
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
              {/* Chat button */}
              <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 text-sm border rounded-full border-[#00113D] text-[#00113D] bg-white">
                <IoChatboxOutline size={16} />
                <button
                  onClick={() =>
                    handleChatWithOwner(
                      vehicleDetails?.ownerId, // Owner's ID is the target
                      ownerGivenName, // Owner's given name (using the variable that prioritizes profile)
                      ownerFamilyName, // Owner's family name (using the variable that prioritizes profile)
                      vehicleDetails?.id // Pass the vehicle ID for chat context
                    )
                  }
                  // Disable if adminId is missing or ownerId is missing
                  disabled={!adminId || !vehicleDetails?.ownerId}
                >
                  Chat With Owner {/* Changed label for clarity */}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Account Details Section (Related to the vehicle owner account) */}
        <section className="w-fit bg-white p-6 shadow-blue-100 rounded-xl drop-shadow-xs shadow-xs">
          <h2 className="text-lg font-semibold text-[#00113D] mb-4">
            Vehicle Account Details {/* Clarified label */}
          </h2>
          <div className="flex flex-col text-sm text-[#38393D]">
            <div className="flex items-center mb-2">
              Status: {/* Vehicle Approval Status */}
              <span className="ml-2 font-semibold text-sky-950">
                {getStatusIcon(vehicleDetails.isApproved)}
                {vehicleDetails.isApproved}
              </span>
            </div>
            <div className="flex items-center mb-2">
              Admin Status: {/* Vehicle Active/Inactive Status */}
              <span className="ml-2 font-semibold text-sky-950">
                {getStatusIcon(vehicleDetails.isActive)}
                {vehicleDetails.isActive}
              </span>
            </div>
            <div className="flex items-center mb-2">
              Registration Date: {/* Vehicle Registration Date */}
              <span className="ml-2 font-semibold text-sky-950">
                {new Date(vehicleDetails.createdAt).toLocaleDateString()} |{" "}
                {new Date(vehicleDetails.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center mb-2">
              Rent Amount: {/* Vehicle Rent Price */}
              <span className="ml-2 font-semibold text-sky-950">
                {vehicleDetails.price} Birr/Day
              </span>
            </div>

            {/* Available Dates Button */}
            {/* Assuming events are vehicle-specific */}
            <div
              className="flex justify-center items-center gap-2 mt-12 px-4 py-2 text-sm border rounded-full border-[#00113D] text-[#00113D] bg-white cursor-pointer hover:bg-gray-100"
              onClick={handleOpenEventsModal}
            >
              <CalendarMonthOutlinedIcon fontSize="small" />
              <button>Available Dates ({availableEvents.length})</button>
            </div>
          </div>
        </section>

        {/* Stat Cards Section (Assuming these stats are for the Owner/Account, not just this vehicle?) */}
        {/* Adjust labels if these are specifically vehicle stats */}
        <div className="flex flex-col w-1/3 gap-6">
          {/* Example: This might be Total Rentals *by this owner* across all their vehicles */}
          <div className=" bg-white p-6 flex justify-between items-center w-full shadow-blue-200 rounded-xl drop-shadow-xs shadow-xs">
            <h2 className="text-base font-semibold text-[#00113D] ">
              Total Rentals {/* Clarified label */}
            </h2>
            <span className="px-4 text-gray-600 text-base">12</span>{" "}
            {/* Replace with actual data if available - need to fetch this separately if it's owner-level stat */}
          </div>
          {/* Example: This might be Total Earnings *by this owner* across all their vehicles */}
          <div className=" bg-white p-6 flex justify-between items-center w-full shadow-blue-200 rounded-xl drop-shadow-xs shadow-xs">
            <h2 className="text-base font-semibold text-[#00113D] ">
              Total Earnings {/* Clarified label */}
            </h2>
            <span className="pr-4 text-gray-600 text-base">1,273</span>{" "}
            {/* Replace with actual data if available - need to fetch this separately */}
          </div>
          {/* Rental Ratings: This could be average rating *for this specific vehicle* OR *for the owner* across all vehicles */}
          {/* Based on previous logic, it seems it was intended for the vehicle, which is already fetched */}
          <div className=" bg-white p-6 flex justify-between items-center w-full shadow-blue-200 rounded-xl drop-shadow-xs shadow-xs">
            <h2 className="text-base font-semibold text-[#00113D] ">
              Vehicle Rating {/* Clarified label */}
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
        {/* Vehicle details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 p-4 gap-4 ">
          {/* Map over vehicleDetails properties to display */}
          {/* Keeping existing structure as it seems to work */}
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

        {/* Features Section */}
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

      {/* Documents and Photos Sections in two columns */}
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
                  Document {index + 1}{" "}
                  {/* Generic name, improve if actual names available */}
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
          <div className=" text-xl font-semibold mb-8">Photos and Media</div>
          {loadingUrls ? (
            <Box display="flex" justifyContent="center">
              <CircularProgress size={20} />
            </Box>
          ) : imageUrls.length > 0 &&
            imageUrls[0] !== placeholderVehicleImage ? (
            <div className="flex flex-col gap-4">
              <Button
                variant="text"
                onClick={handleOpenImagesModal}
                startIcon={<GridViewIcon />}
                sx={{ justifyContent: "flex-start" }}
              >
                View {imageUrls.length} Photo(s)
              </Button>
            </div>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No photos available.
            </Typography>
          )}
        </div>
      </div>

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
                  key={event.eventId || index} // Use eventId if available, fallback to index
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
          ) : imageUrls.length > 0 &&
            imageUrls[0] !== placeholderVehicleImage ? (
            <ImageSlider
              imageUrls={imageUrls.filter(
                (url) => url !== placeholderVehicleImage
              )}
            />
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

export default Account;
