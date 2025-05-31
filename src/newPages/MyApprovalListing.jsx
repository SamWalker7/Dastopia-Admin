import React, { useEffect, useState, useCallback } from "react";
import {
  // Keep only the ones actually used or commonly needed in a list view container
  TextField, // Used for search/filter (if implemented)
  Select, // Used for filtering (if implemented)
  MenuItem, // Used for Select
  Button, // Used potentially for actions
  Box, // General layout container
  Typography, // Text elements
  Link, // Navigation links
  Breadcrumbs, // Navigation breadcrumbs
  Avatar, // Used in ProfileCard
  Grid, // Layout grid
  CircularProgress, // Loading indicator
} from "@mui/material";

// Keep only the icons actually used in the list container or ProfileCard
import NavigateNextIcon from "@mui/icons-material/NavigateNext"; // Used in Breadcrumbs
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined"; // Used in Breadcrumbs
import PersonOutlined from "@mui/icons-material/PersonOutlined"; // Used in ProfileCard
import DirectionsCarOutlined from "@mui/icons-material/DirectionsCarOutlined"; // Used in ProfileCard
import LocalOfferOutlined from "@mui/icons-material/LocalOfferOutlined"; // Used in ProfileCard price
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined"; // Used in ProfileCard date
import PhoneOutlined from "@mui/icons-material/PhoneOutlined"; // Assuming this icon is desired for phone

// Import the getDownloadUrl function
import { getDownloadUrl } from "../api"; // Assuming this is the same function as in Account1.js

// image is used in ProfileCard as a fallback
import image from "./avatar.png";

// Import the modal component (assuming path is correct)
import VehicleApprovalModal from "./VehicleApprovalModal";

// Constants remain the same
const API_STATUS_TO_COLUMN = {
  pending: "inReview",
  approved: "approved",
  denied: "rejected",
  null: "unassigned",
  "": "unassigned",
  // Add any other potential statuses if needed
};

// Define the columns you want to display
const DISPLAY_COLUMNS = ["inReview", "approved", "rejected"];
// If you need an "Unassigned" column for vehicles with status null/""/unrecognized, add it here:
// const DISPLAY_COLUMNS = ["unassigned", "inReview", "approved", "rejected"];

const columnLabels = {
  unassigned: "Unassigned",
  inReview: "In Review",
  approved: "Approved",
  rejected: "Rejected",
};

const cardBorderColors = {
  unassigned: "border-gray-300",
  inReview: "border-yellow-500",
  approved: "border-green-500",
  rejected: "border-red-500",
};

// Placeholder for profile image - only used as a fallback if getDownloadUrl fails
// The local `image` import is the ultimate fallback in ProfileCard
const placeholderProfileImage = "https://via.placeholder.com/150"; // Note: This is not used directly now, `image` import is the direct fallback

// --- getColumnKey remains here as it's used in ProfileCard ---
const getColumnKey = (apiStatus) => {
  return API_STATUS_TO_COLUMN[apiStatus] || "unassigned";
};

// ProfileCard component (remains largely the same, uses the passed renterAvatarUrl)
const ProfileCard = ({
  vehicle,
  onClick,
  renterName,
  renterPhone,
  rentalPrice,
  submissionDate,
  renterAvatarUrl, // This prop now comes from the parent with the fetched URL
}) => {
  const columnKey = getColumnKey(vehicle?.isApproved);
  const borderColorClass = cardBorderColors[columnKey] || "border-gray-300";

  const vehicleMakeModelYear = `${vehicle?.make || "N/A"}, ${
    vehicle?.model || "N/A"
  } ${vehicle?.year || ""}`;
  const vehicleID = vehicle?.id || "N/A";

  const displayRenterName = renterName || "N/A";
  const displayRenterPhone = renterPhone || "N/A";
  const displayRentalPrice = rentalPrice ? `${rentalPrice} Birr` : "N/A";
  const displaySubmissionDate = submissionDate
    ? new Date(submissionDate).toLocaleDateString()
    : "N/A";
  // Use the enriched URL if available, otherwise local default (imported 'image')
  const displayRenterAvatar = renterAvatarUrl || image;

  return (
    <div className="p-2">
      <div
        className={`bg-[#FAF9FE] drop-shadow-xs shadow-xs flex flex-col shadow-blue-200 p-4 text-gray-600 text-sm rounded-2xl cursor-pointer border-l-4 ${borderColorClass}`}
        onClick={() => onClick(vehicle)} // Pass the basic vehicle object to the modal handler
      >
        <Box display="flex" alignItems="center" mb={2}>
          {/* Use Avatar component with the passed URL */}
          <Avatar
            alt={displayRenterName}
            src={displayRenterAvatar} // <-- Use the fetched URL here
            sx={{ width: 56, height: 56, mr: 2 }}
          />

          <Box>
            <p>
              <PersonOutlined
                fontSize="small"
                sx={{ verticalAlign: "middle", mr: 1 }}
              />
              {displayRenterName}
            </p>
            <p>
              {/* Use PhoneOutlined icon for phone */}
              <PhoneOutlined
                fontSize="small"
                sx={{ verticalAlign: "middle", mr: 1 }}
              />
              {displayRenterPhone}
            </p>
          </Box>
        </Box>
        <Box display="flex" alignItems="center" mb={1}>
          <DirectionsCarOutlined fontSize="small" sx={{ mr: 1 }} />
          <p>{vehicleMakeModelYear}</p>
        </Box>
        <Box display="flex" alignItems="center" mb={1}>
          <Typography variant="body2" component="span" sx={{ mr: 1 }}>
            <LocalOfferOutlined
              fontSize="small"
              sx={{ verticalAlign: "middle" }}
            />
            {displayRentalPrice}
          </Typography>
          <Typography
            variant="body2"
            component="span"
            sx={{ ml: "auto", color: "text.secondary", fontSize: "0.75rem" }}
          >
            <CalendarMonthOutlinedIcon
              fontSize="small"
              sx={{ verticalAlign: "middle", mr: 0.5 }}
            />
            {displaySubmissionDate}
          </Typography>
        </Box>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mt={1}
        >
          <Typography variant="caption" color="text.secondary">
            Vehicle ID: {vehicleID}
          </Typography>
          <Typography variant="caption" className={`font-bold text-right`}>
            Status: {columnLabels[columnKey]}
          </Typography>
        </Box>
      </div>
    </div>
  );
};

const MyApprovalListing = () => {
  // State for the list view (basic enriched data)
  const [vehicles, setVehicles] = useState([]);
  const [loadingList, setLoadingList] = useState(true); // Use for both initial and "Load More" loading
  const [errorList, setErrorList] = useState(null);

  // --- Pagination State ---
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null); // Store key for the next page
  const [hasMorePages, setHasMorePages] = useState(true); // Flag if there are more pages

  // State for the main react-modal
  const [selectedVehicleForModal, setSelectedVehicleForModal] = useState(null); // Basic vehicle object from list
  const [openModal, setOpenModal] = useState(false); // Controls the main react-modal

  // Token state remains in the parent as it's needed for the initial list fetch
  const [adminToken, setAdminToken] = useState(null);

  // --- Token Fetch Effect ---
  useEffect(() => {
    const storedAdminJson = localStorage.getItem("admin");
    if (storedAdminJson) {
      try {
        const adminData = JSON.parse(storedAdminJson);
        if (adminData && adminData.AccessToken) {
          setAdminToken(adminData.AccessToken);
        } else {
          console.warn(
            "localStorage 'admin' found, but AccessToken property is missing."
          );
          setErrorList("Authentication token missing.");
        }
      } catch (error) {
        console.error("Failed to parse admin data from localStorage:", error);
        setErrorList("Failed to load authentication data.");
      }
    } else {
      console.warn("No 'admin' data found in localStorage.");
      setErrorList("Admin not logged in.");
    }
  }, []);

  // --- Fetch and Enrich Vehicle for the List View (Paginated) ---
  // This function fetches basic vehicle data (a page) and then enriches it
  // with owner name, phone, profile image URL for the list display.
  // It accepts the key to fetch the *next* page.
  const fetchAndEnrichVehiclesList = useCallback(
    async (token, currentLastEvaluatedKey = null) => {
      if (!token) {
        setLoadingList(false); // Stop loading if no token
        // Error state already set in token effect or previous calls
        return;
      }

      setLoadingList(true);
      setErrorList(null); // Clear error before fetching

      try {
        // 1. Construct the API URL with pagination parameter
        let apiUrlList =
          "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/admin/vehicles";
        if (currentLastEvaluatedKey) {
          apiUrlList += `?lastEvaluatedKey=${encodeURIComponent(
            currentLastEvaluatedKey
          )}`;
        }

        console.log("Fetching vehicle list from:", apiUrlList);

        const response = await fetch(apiUrlList, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(
            `HTTP error fetching list! status: ${response.status}`,
            errorBody
          );
          if (response.status === 401 || response.status === 403) {
            setErrorList(
              "Authentication failed or expired. Please log in again."
            );
            // Optionally clear admin token here if needed
          } else {
            setErrorList(
              `Failed to fetch vehicle list: ${
                response.statusText
              }. ${errorBody.substring(0, 100)}...`
            );
          }
          throw new Error(
            `Failed to fetch vehicle list: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("Vehicle List API Response:", data);

        // --- Extract Pagination Info ---
        const fetchedVehicles = data?.body;
        const nextLastEvaluatedKey = data?.lastEvaluatedKey || null;
        const count = data?.count || 0;
        const totalCount = data?.totalCount; // Total count might be inconsistent with pagination, rely on lastEvaluatedKey

        setLastEvaluatedKey(nextLastEvaluatedKey);
        // Determine if there are more pages: If lastEvaluatedKey is present in the response
        setHasMorePages(!!nextLastEvaluatedKey);

        if (Array.isArray(fetchedVehicles)) {
          const basicVehicles = fetchedVehicles.filter((v) => v != null);

          // 2. Fetch owner profile and image URL for each vehicle in parallel for list display
          const enrichmentPromises = basicVehicles.map(async (vehicle) => {
            // --- START DEBUGGING LOGS ---
            // console.log(
            //   "--- Processing vehicle:",
            //   vehicle.id,
            //   "Owner ID:",
            //   vehicle.ownerId,
            //   "---"
            // );
            // --- END DEBUGGING LOGS ---

            if (!vehicle?.id) {
              console.warn(
                "Skipping enrichment for vehicle with missing ID or null entry."
              );
              return { id: null, error: "Missing ID" }; // Return identifiable error object
            }

            let ownerProfileData = null;
            let profileImageUrl = image; // Default to local image

            // Fetch Owner Profile (if ownerId is available) for LIST CARD
            // Using vehicle.ownerId || vehicle.owenerId for robustness as seen in previous code
            const ownerId = vehicle?.ownerId || vehicle?.owenerId;
            if (ownerId) {
              try {
                const profileUrl = `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/user/${ownerId}`;
                // --- START DEBUGGING LOGS ---
                // console.log(
                //   `Attempting to fetch owner profile for owner ${ownerId} from:`,
                //   profileUrl
                // );
                // --- END DEBUGGING LOGS ---
                const profileResponse = await fetch(profileUrl, {
                  headers: { Authorization: `Bearer ${token}` },
                });

                // --- START DEBUGGING LOGS ---
                // console.log(
                //   `Owner profile response status for ${ownerId}:`,
                //   profileResponse.status
                // );
                // --- END DEBUGGING LOGS ---

                if (profileResponse.ok) {
                  ownerProfileData = await profileResponse.json();
                  // --- START DEBUGGING LOGS ---
                  // console.log(
                  //   `Fetched owner profile data for ${ownerId}:`,
                  //   ownerProfileData
                  // );
                  // --- END DEBUGGING LOGS ---

                  // *** Use the same key extraction logic as Account1.js ***
                  const profilePictureKey =
                    ownerProfileData?.["custom:profile_picture_key"];

                  // --- START DEBUGGING LOGS ---
                  // console.log(
                  //   `Profile picture key found for ${ownerId}:`,
                  //   profilePictureKey
                  // );
                  // --- END DEBUGGING LOGS ---

                  if (profilePictureKey) {
                    try {
                      // *** Use the imported getDownloadUrl function ***
                      // --- START DEBUGGING LOGS ---
                      // console.log(
                      //   `Calling getDownloadUrl for key ${profilePictureKey} (owner ${ownerId})...`
                      // );
                      // --- END DEBUGGING LOGS ---
                      const imageUrlResult = await getDownloadUrl(
                        profilePictureKey
                      );
                      // --- START DEBUGGING LOGS ---
                      // console.log(
                      //   `getDownloadUrl result for key ${profilePictureKey}:`,
                      //   imageUrlResult
                      // );
                      // --- END DEBUGGING LOGS ---

                      // Assuming getDownloadUrl returns { body: 'the-url' }
                      profileImageUrl = imageUrlResult?.body || image; // Use fetched URL or local default
                      if (!imageUrlResult?.body) {
                        console.warn(
                          `getDownloadUrl did not return a body/URL for key ${profilePictureKey} (owner ${ownerId})`
                        );
                      }
                    } catch (imgUrlErr) {
                      // --- START DEBUGGING LOGS ---
                      console.error(
                        `Error fetching profile image URL for key ${profilePictureKey} (owner ${ownerId}):`,
                        imgUrlErr
                      );
                      // --- END DEBUGGING LOGS ---
                      profileImageUrl = image; // Fallback on URL fetch error
                    }
                  } else {
                    // --- START DEBUGGING LOGS ---
                    // console.warn(
                    //   `Owner profile for ${ownerId} did not contain 'custom:profile_picture_key'.`
                    // );
                    // --- END DEBUGGING LOGS ---
                    profileImageUrl = image; // Use default if key is missing
                  }
                } else {
                  // Log response text for debugging non-OK profile responses
                  const profileErrorText = await profileResponse.text();
                  console.warn(
                    `HTTP error fetching owner profile during list enrichment: ${
                      profileResponse.status
                    } ${
                      profileResponse.statusText
                    } for owner ${ownerId}. Response body: ${profileErrorText.substring(
                      0,
                      100
                    )}...`
                  );
                  profileImageUrl = image; // Fallback on profile fetch error
                }
              } catch (profileError) {
                // --- START DEBUGGING LOGS ---
                console.error(
                  `Error fetching owner profile during list enrichment for owner ${ownerId}:`,
                  profileError
                );
                // --- END DEBUGGING LOGS ---
                profileImageUrl = image; // Fallback on profile fetch error
              }
            } else {
              // --- START DEBUGGING LOGS ---
              // console.log(
              //   `No ownerId for vehicle ${vehicle?.id}. Skipping profile fetch.`
              // );
              // --- END DEBUGGING LOGS ---
            }

            // Combine data for the list item
            const renterName =
              (ownerProfileData?.given_name ||
                ownerProfileData?.firstName ||
                "") +
              " " +
              (ownerProfileData?.family_name ||
                ownerProfileData?.lastName ||
                "");
            const displayRenterName =
              renterName.trim() ||
              (vehicle.ownerGivenName && vehicle.ownerSurName // Fallback to vehicle data if profile name is empty
                ? `${vehicle.ownerGivenName} ${vehicle.ownerSurName}`
                : "N/A");

            const displayRenterPhone =
              ownerProfileData?.phone_number || vehicle.ownerPhone || "N/A"; // Fallback to vehicle data

            return {
              ...vehicle, // Keep original vehicle data
              renterName: displayRenterName,
              renterPhone: displayRenterPhone,
              rentalPrice: vehicle?.price || "N/A", // Assuming price is in the basic vehicle data
              submissionDate: vehicle?.createdAt || "N/A", // Assuming creation date is in basic vehicle data
              renterAvatarUrl: profileImageUrl, // This should hold the fetched URL or fallback
            };
          });

          const enrichedVehicles = await Promise.all(enrichmentPromises);

          // Filter out any enrichment promises that failed completely (returned { id: null, error: ... })
          const validEnrichedVehicles = enrichedVehicles.filter(
            (v) => v && v.id !== null && !v.error // Check for null id and explicit error
          );

          // --- Append or Replace Data ---
          setVehicles(
            (prevVehicles) =>
              currentLastEvaluatedKey
                ? [...prevVehicles, ...validEnrichedVehicles] // Append for "Load More"
                : validEnrichedVehicles // Replace for initial fetch
          );

          // --- START DEBUGGING LOGS ---
          console.log(
            "Final Enriched Vehicles for List (after setting state):",
            currentLastEvaluatedKey
              ? [...vehicles, ...validEnrichedVehicles]
              : validEnrichedVehicles // Log the *next* state value
          );
          console.log("LastEvaluatedKey set to:", nextLastEvaluatedKey);
          console.log("HasMorePages set to:", !!nextLastEvaluatedKey);
          // --- END DEBUGGING LOGS ---
        } else {
          console.warn(
            "API response body is not an array or is missing 'body' property:",
            data
          );
          if (!currentLastEvaluatedKey) {
            // Only set error if initial fetch fails or is not an array
            setErrorList("Invalid data received from server.");
            setVehicles([]); // Clear vehicles if initial data is bad
          }
        }
      } catch (err) {
        console.error("Error fetching vehicle list or enriching data:", err);
        if (!currentLastEvaluatedKey) {
          // Only set list error for the first load
          setErrorList("Failed to load vehicle listings: " + err.message);
          setVehicles([]); // Clear vehicles on initial error
        } else {
          // For "Load More" errors, maybe show a temporary message or log
          console.error("Failed to load more vehicles:", err);
          // Optionally set a temporary state like `loadingMoreError` if needed
        }
      } finally {
        setLoadingList(false); // Always turn off loading regardless of success/failure
      }
    },
    [adminToken, getDownloadUrl] // Dependencies
  );

  // --- Effect to fetch the FIRST page of vehicles when token is available ---
  useEffect(() => {
    if (adminToken) {
      console.log("Admin token available, fetching first page...");
      // Fetch the first page (pass null for lastEvaluatedKey)
      fetchAndEnrichVehiclesList(adminToken, null);
    } else {
      setLoadingList(false); // Stop loading if no token is found initially
      setVehicles([]); // Ensure vehicle list is empty
      // setErrorList is handled in the token effect now
    }
  }, [adminToken, fetchAndEnrichVehiclesList]); // Re-run if adminToken changes

  // --- Handler for "Load More" button ---
  const handleLoadMore = () => {
    if (adminToken && lastEvaluatedKey && hasMorePages && !loadingList) {
      console.log("Loading more vehicles with key:", lastEvaluatedKey);
      fetchAndEnrichVehiclesList(adminToken, lastEvaluatedKey);
    } else if (!hasMorePages) {
      console.log("No more pages to load.");
    } else if (loadingList) {
      console.log("Already loading, ignoring 'Load More' click.");
    } else if (!adminToken) {
      console.warn("Cannot load more, admin token is missing.");
    }
  };

  // --- Handlers for the main modal (controlled by this component) ---
  const handleOpenModal = (vehicle) => {
    // Note: We pass the BASIC vehicle object here.
    // The modal component should fetch its own detailed data if needed.
    setSelectedVehicleForModal(vehicle);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    // Clearing selectedVehicleForModal immediately ensures the modal component resets its state
    setSelectedVehicleForModal(null);
  };

  // This function is passed to the modal and called when approve/reject succeeds
  const handleModalActionSuccess = () => {
    // Refresh the list when an action in the modal is successful
    console.log(
      "Modal action successful, refreshing vehicle list (fetching first page)..."
    );
    handleCloseModal(); // Close the modal after success
    // Refetch the *first* page to ensure the updated item appears near the top
    // This clears the current list and fetches fresh data from the beginning.
    // A more complex approach could update the item in the current list, but refetching is simpler.
    fetchAndEnrichVehiclesList(adminToken, null);
  };

  // --- Render Logic ---
  const vehicleCountByColumn = DISPLAY_COLUMNS.reduce((acc, columnKey) => {
    acc[columnKey] = vehicles.filter(
      (v) => getColumnKey(v?.isApproved) === columnKey
    ).length;
    return acc;
  }, {});

  return (
    <Box sx={{ padding: 0, minHeight: "100vh", px: 3, py: 2 }}>
      <Box pb={3} pl={1}>
        <span className="text-xl">My Approval Listing</span>
      </Box>
      <div className="m-4 mb-12">
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          <Link underline="hover" key="1" color="inherit" href="/dashboard">
            <HomeOutlinedIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home
          </Link>
          <Typography key="2" sx={{ color: "text.primary" }}>
            My Approval Listing
          </Typography>
        </Breadcrumbs>
      </div>

      {/* Render the Grid layout with columns */}
      <Grid container spacing={3}>
        {DISPLAY_COLUMNS.map((columnKey) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={columnKey}>
            <Box
              className={`drop-shadow-xs p-2 shadow-xs shadow-blue-100 border-t-4 ${
                cardBorderColors[columnKey] || "border-gray-300"
              } rounded-md min-h-[500px]`} // min-h to maintain layout if column is empty
            >
              <Box sx={{ mb: 2, px: 2, pb: 1, borderBottom: "1px solid #eee" }}>
                <Typography variant="h6">
                  {columnLabels[columnKey]} ({vehicleCountByColumn[columnKey]}){" "}
                  {/* Add dynamic count */}
                </Typography>
              </Box>

              <div className="flex flex-col gap-0">
                {/* Filter and map vehicles for the current column */}
                {vehicles
                  .filter(
                    (vehicle) => getColumnKey(vehicle?.isApproved) === columnKey
                  )
                  .map((vehicle) => (
                    <ProfileCard
                      key={vehicle.id} // Use vehicle ID as key
                      vehicle={vehicle} // Pass the enriched vehicle object
                      onClick={handleOpenModal}
                      // Pass the enriched data from the list state directly
                      renterName={vehicle.renterName}
                      renterPhone={vehicle.renterPhone}
                      rentalPrice={vehicle.rentalPrice}
                      submissionDate={vehicle.submissionDate}
                      renterAvatarUrl={vehicle.renterAvatarUrl} // <-- This now holds the fetched URL
                    />
                  ))}

                {/* Message if a column is empty and we're not loading or have errors */}
                {!loadingList &&
                  !errorList &&
                  vehicleCountByColumn[columnKey] === 0 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                      sx={{ mt: 4 }}
                    >
                      No vehicles in this category.
                    </Typography>
                  )}
                {/* Show loading indicator only in the first column or if no vehicles yet */}
                {loadingList &&
                  vehicles.length === 0 &&
                  columnKey === DISPLAY_COLUMNS[0] && (
                    <Box
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      sx={{ py: 4 }}
                    >
                      <CircularProgress size={20} />
                      <Typography sx={{ ml: 1 }} variant="body2">
                        Loading...
                      </Typography>
                    </Box>
                  )}
              </div>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Loading/Error States for the entire list area */}
      {/* These will show below the columns or instead of them if initial load fails */}
      {errorList && vehicles.length === 0 && (
        <Typography color="error" align="center" sx={{ py: 4 }}>
          Error loading list: {errorList}
        </Typography>
      )}
      {loadingList && vehicles.length > 0 && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          sx={{ py: 2 }}
        >
          <CircularProgress size={20} />
          <Typography sx={{ ml: 1 }} variant="body2">
            Loading more...
          </Typography>
        </Box>
      )}
      {!loadingList && !errorList && vehicles.length === 0 && (
        <Typography align="center" sx={{ mt: 4, color: "text.secondary" }}>
          No vehicle listings found.
        </Typography>
      )}

      {/* "Load More" button */}
      {hasMorePages && !loadingList && vehicles.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Button
            variant="contained"
            onClick={handleLoadMore}
            disabled={loadingList} // Disable while loading
          >
            Load More
          </Button>
        </Box>
      )}

      {/* Message when all pages are loaded */}
      {!hasMorePages && !loadingList && vehicles.length > 0 && (
        <Typography align="center" sx={{ mt: 4, color: "text.secondary" }}>
          End of list. All vehicles loaded.
        </Typography>
      )}

      {/* Render the VehicleApprovalModal component */}
      {/* Ensure vehicle and adminToken are passed to the modal */}
      <VehicleApprovalModal
        isOpen={openModal}
        vehicle={selectedVehicleForModal} // Pass the basic/enriched vehicle object from the list
        adminToken={adminToken} // Pass the token
        onClose={handleCloseModal}
        onActionSuccess={handleModalActionSuccess} // Pass the success handler
      />
    </Box>
  );
};

export default MyApprovalListing;
