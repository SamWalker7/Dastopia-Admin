import React, { useEffect, useState } from "react";
import {
  TextField,
  Select,
  MenuItem,
  Button,
  Pagination,
  Box,
  FormControl,
  InputLabel,
  InputAdornment,
  Typography,
  Link,
  Breadcrumbs,
  Avatar,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Grid,
} from "@mui/material";

import Modal from "react-modal";

import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import DirectionsCarFilledOutlinedIcon from "@mui/icons-material/DirectionsCarFilledOutlined";
import CarRentalOutlinedIcon from "@mui/icons-material/CarRentalOutlined";
import ApprovalOutlinedIcon from "@mui/icons-material/ApprovalOutlined";
import CarCrashOutlinedIcon from "@mui/icons-material/CarCrashOutlined";
import { Search, UploadFile } from "@mui/icons-material";
import PhoneOutlined from "@mui/icons-material/PhoneOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import DirectionsCarOutlined from "@mui/icons-material/DirectionsCarOutlined";
import LocalOfferOutlined from "@mui/icons-material/LocalOfferOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import GridViewIcon from "@mui/icons-material/GridView";
import CloseIcon from "@mui/icons-material/Close";

import { HiMiniArrowsUpDown } from "react-icons/hi2";
import {
  IoChatboxOutline,
  IoLocationOutline,
  IoPersonOutline,
} from "react-icons/io5";
import { MdOutlineLocalPhone, MdOutlineMail } from "react-icons/md";
import { FaStar, FaSpinner } from "react-icons/fa";

import { getDownloadUrl } from "../api";

import image from "./avatar.png";

Modal.setAppElement("#root");

const API_STATUS_TO_COLUMN = {
  pending: "inReview",
  approved: "approved",
  denied: "rejected",
};

const DISPLAY_COLUMNS = ["unassigned", "inReview", "approved", "rejected"];

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

const ProfileCard = ({
  vehicle,
  onClick,
  renterName,
  renterPhone,
  rentalPrice,
  submissionDate,
  renterAvatarUrl,
}) => {
  const columnKey = API_STATUS_TO_COLUMN[vehicle?.isApproved] || "unassigned";
  const borderColorClass = cardBorderColors[columnKey] || "border-gray-300";

  const vehicleMakeModelYear = `${vehicle?.make || "N/A"}, ${
    vehicle?.model || "N/A"
  } ${vehicle?.year || ""}`;
  const vehicleID = vehicle?.id || "N/A";

  // Use props passed from the parent component
  const displayRenterName = renterName || "N/A";
  const displayRenterPhone = renterPhone || "N/A";
  const displayRentalPrice = rentalPrice ? `${rentalPrice} Birr` : "N/A";
  const displaySubmissionDate = submissionDate
    ? new Date(submissionDate).toLocaleDateString()
    : "N/A";
  const displayRenterAvatar = renterAvatarUrl || image;

  return (
    <div className="p-2">
      <div
        className={`bg-[#FAF9FE] drop-shadow-xs shadow-xs flex flex-col shadow-blue-200 p-4 text-gray-600 text-sm rounded-2xl cursor-pointer border-l-4 ${borderColorClass}`}
        onClick={() => onClick(vehicle)}
      >
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar
            alt={displayRenterName}
            src={displayRenterAvatar}
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
  // State now holds enriched vehicle data for the list view
  const [vehicles, setVehicles] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [errorList, setErrorList] = useState(null);

  // State for the modal details (fetched when a card is clicked)
  const [selectedVehicleForModal, setSelectedVehicleForModal] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openRejectModal, setOpenRejectModal] = useState(false);

  // Details fetched specifically for the opened modal
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [rentalRating, setRentalRating] = useState(0);

  const [adminToken, setAdminToken] = useState(null);

  const [rejectReasons, setRejectReasons] = useState({
    ownerDetail: false,
    vehicleOverview: false,
    documents: false,
    photos: false,
  });

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
        }
      } catch (error) {
        console.error("Failed to parse admin data from localStorage:", error);
      }
    } else {
      console.warn("No 'admin' data found in localStorage.");
    }
  }, []);

  const fetchRentalRating = async (carID) => {
    const ratingApiUrl =
      "https://xo55y7ogyj.execute-api.us-east-1.amazonaws.com/prod/add_vehicle";
    try {
      const response = await fetch(ratingApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "getRatingsbyID",
          carId: carID,
        }),
      });

      if (!response.ok) {
        console.warn(`Failed to fetch rental rating: ${response.status}`);
        return 0;
      }
      const data = await response.json();
      if (data && data.body && data.body.data) {
        return data.body.data.averageRating || 0;
      } else {
        console.warn(
          "Failed to fetch rental rating: Unexpected response structure",
          data
        );
        return 0;
      }
    } catch (error) {
      console.error("Error fetching rental rating:", error);
      return 0;
    }
  };

  // Helper function to fetch details and owner data for a single vehicle item
  const fetchAndEnrichVehicle = async (vehicle, token) => {
    if (!vehicle?.id || !token) {
      console.warn(`Skipping enrichment for null/missing vehicle or token.`);
      // Return basic vehicle with placeholders if fetch cannot happen
      return {
        ...vehicle,
        renterName: "N/A",
        renterPhone: "N/A",
        rentalPrice: "N/A",
        submissionDate: "N/A",
        renterAvatarUrl: image,
      };
    }

    try {
      // 1. Fetch Vehicle Details
      const detailUrl = `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/vehicle/${vehicle.id}`;
      const detailResponse = await fetch(detailUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const detailData = detailResponse.ok ? await detailResponse.json() : null;
      const detailedVehicle = detailData?.body || vehicle; // Use original vehicle data if detail fetch fails

      // 2. Fetch Owner Profile (if ownerId is available)
      let ownerProfileData = null;
      let profileImageUrl = image; // Default image
      if (detailedVehicle?.ownerId) {
        try {
          const profileUrl = `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/user/${detailedVehicle.ownerId}`;
          const profileResponse = await fetch(profileUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (profileResponse.ok) {
            ownerProfileData = await profileResponse.json();
            if (ownerProfileData?.profile_picture_key) {
              try {
                const imageUrlResponse = await getDownloadUrl(
                  ownerProfileData.profile_picture_key
                );
                profileImageUrl = imageUrlResponse?.body || image; // Use default image on getDownloadUrl error or empty body
              } catch (imgError) {
                console.error(
                  "Error fetching profile image URL during list enrichment:",
                  imgError
                );
                profileImageUrl = image; // Fallback on image URL fetch error
              }
            }
          } else {
            console.warn(
              `HTTP error fetching owner profile during list enrichment: ${profileResponse.status} for owner ${detailedVehicle.ownerId}`
            );
            ownerProfileData = null; // Ensure ownerProfileData is null on error
          }
        } catch (profileError) {
          console.error(
            `Error fetching owner profile during list enrichment for owner ${detailedVehicle.ownerId}:`,
            profileError
          );
          ownerProfileData = null; // Ensure ownerProfileData is null on error
        }
      }

      // 3. Combine data for the list item
      return {
        ...detailedVehicle, // Spread the potentially more detailed data over the basic vehicle
        renterName:
          ownerProfileData?.given_name ||
          ownerProfileData?.firstName ||
          ownerProfileData?.family_name ||
          ownerProfileData?.lastName
            ? `${
                ownerProfileData?.given_name ||
                ownerProfileData?.firstName ||
                ""
              } ${
                ownerProfileData?.family_name ||
                ownerProfileData?.lastName ||
                ""
              }`.trim()
            : "N/A",
        renterPhone: ownerProfileData?.phone_number || "N/A",
        rentalPrice: detailedVehicle?.price || "N/A",
        submissionDate: detailedVehicle?.createdAt || "N/A",
        renterAvatarUrl: profileImageUrl,
        // Note: Rental Rating is not fetched for the list card to keep it lighter.
        // It's still fetched specifically for the modal.
      };
    } catch (error) {
      console.error(`Error enriching vehicle ${vehicle.id}:`, error);
      // Return the basic vehicle with 'N/A' for the enriched fields on error
      return {
        ...vehicle,
        renterName: "N/A",
        renterPhone: "N/A",
        rentalPrice: "N/A",
        submissionDate: "N/A",
        renterAvatarUrl: image,
        error: error.message || "Failed to enrich data", // Optionally add an error flag
      };
    }
  };

  const fetchVehiclesList = async () => {
    if (!adminToken) {
      setLoadingList(false);
      setErrorList("Authentication required.");
      return;
    }

    setLoadingList(true);
    setErrorList(null);
    setVehicles([]); // Clear previous list while loading

    try {
      // First, fetch the basic list of vehicles
      const apiUrlList =
        "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/admin/vehicles";
      const response = await fetch(apiUrlList, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          `HTTP error fetching list! status: ${response.status}`,
          errorBody
        );
        throw new Error(
          `Failed to fetch vehicle list: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Vehicle List API Response (basic):", data);

      if (data && data.body && Array.isArray(data.body)) {
        const basicVehicles = data.body.filter((v) => v != null);

        // Now, fetch details and owner info for each vehicle in parallel
        const enrichmentPromises = basicVehicles.map((v) =>
          fetchAndEnrichVehicle(v, adminToken)
        );

        // Wait for all enrichment fetches to complete
        const enrichedVehicles = await Promise.all(enrichmentPromises);

        console.log("Enriched Vehicles for List:", enrichedVehicles);
        setVehicles(enrichedVehicles); // Set the state with the enriched data
      } else {
        console.warn("API response body for basic list is not an array:", data);
        setVehicles([]);
      }
    } catch (err) {
      console.error("Error fetching vehicle list or enriching data:", err);
      setErrorList("Failed to load vehicle listings: " + err.message);
      setVehicles([]); // Ensure vehicles is empty or shows basic data on error
    } finally {
      // Loading finishes only after all enrichment fetches are done
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchVehiclesList();
  }, [adminToken]);

  useEffect(() => {
    // This useEffect still handles fetching detailed data when the modal opens
    // (separate from the list enrichment to keep list fetching lighter)
    const fetchModalVehicleDetails = async () => {
      if (!selectedVehicleForModal?.id) {
        setVehicleDetails(null);
        setErrorDetails(null);
        setLoadingDetails(false);
        setOwnerProfile(null);
        setProfileImageUrl("");
        setRentalRating(0);
        setIsImageLoading(false);
        return;
      }

      if (!adminToken) {
        setErrorDetails("Authentication token not available to fetch details.");
        setLoadingDetails(false);
        return;
      }

      setLoadingDetails(true);
      setErrorDetails(null);
      setVehicleDetails(null);
      setOwnerProfile(null);
      setProfileImageUrl("");
      setRentalRating(0);
      setIsImageLoading(false);

      try {
        // Fetch vehicle details for modal
        const apiUrlDetail = `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/vehicle/${selectedVehicleForModal.id}`;
        const detailResponse = await fetch(apiUrlDetail, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        if (!detailResponse.ok) {
          const errorBody = await detailResponse.text();
          console.error(
            `HTTP error fetching vehicle details for modal! status: ${detailResponse.status}`,
            errorBody
          );
          throw new Error(
            `Failed to fetch vehicle details: ${detailResponse.status} ${detailResponse.statusText}`
          );
        }

        const detailData = await detailResponse.json();
        console.log("Vehicle Detail API Response (modal):", detailData);
        const modalVehicleDetails = detailData.body;
        setVehicleDetails(modalVehicleDetails);

        // Fetch owner profile for modal (using ownerId from modalVehicleDetails)
        let modalOwnerProfile = null;
        let modalProfileImageUrl = image;
        if (modalVehicleDetails?.ownerId) {
          setIsImageLoading(true);
          try {
            const profileApiUrl = `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/user/${modalVehicleDetails.ownerId}`;
            const profileResponse = await fetch(profileApiUrl, {
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
            });

            if (!profileResponse.ok) {
              console.warn(
                `HTTP error fetching owner profile for modal! status: ${profileResponse.status}`
              );
              modalOwnerProfile = null;
              modalProfileImageUrl = image;
            } else {
              const profileData = await profileResponse.json();
              console.log("Owner Profile API Response (modal):", profileData);
              modalOwnerProfile = profileData;

              if (profileData?.profile_picture_key) {
                try {
                  const imageUrlResponse = await getDownloadUrl(
                    profileData.profile_picture_key
                  );
                  modalProfileImageUrl = imageUrlResponse?.body || image;
                } catch (imgError) {
                  console.error(
                    "Error fetching profile image URL for modal:",
                    imgError
                  );
                  modalProfileImageUrl = image;
                }
              } else {
                console.warn(
                  "Owner profile for modal has no 'profile_picture_key' key or it is empty."
                );
                modalProfileImageUrl = image;
              }
            }
          } catch (profileError) {
            console.error(
              "Error fetching owner profile for modal:",
              profileError
            );
            modalOwnerProfile = null;
            modalProfileImageUrl = image;
          } finally {
            setIsImageLoading(false);
          }
        }
        setOwnerProfile(modalOwnerProfile);
        setProfileImageUrl(modalProfileImageUrl);

        // Fetch rental rating for modal
        if (modalVehicleDetails?.id) {
          const rating = await fetchRentalRating(modalVehicleDetails.id);
          setRentalRating(rating);
        } else {
          console.warn(
            "Vehicle details ID is missing for fetching rental rating for modal."
          );
          setRentalRating(0);
        }
      } catch (err) {
        console.error("Error fetching vehicle details for modal:", err);
        setErrorDetails("Failed to load vehicle details: " + err.message);
        setVehicleDetails(null);
        setOwnerProfile(null);
        setProfileImageUrl("");
        setRentalRating(0);
        setIsImageLoading(false);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchModalVehicleDetails();
  }, [selectedVehicleForModal, adminToken]);

  const getColumnKey = (apiStatus) => {
    return API_STATUS_TO_COLUMN[apiStatus] || "unassigned";
  };

  const handleOpenModal = (vehicle) => {
    setSelectedVehicleForModal(vehicle);
    setOpenModal(true);
    // Note: Details for the modal are fetched by the useEffect when selectedVehicleForModal changes
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedVehicleForModal(null);
    // Reset modal-specific state
    setVehicleDetails(null);
    setOwnerProfile(null);
    setProfileImageUrl("");
    setRentalRating(0);
    setErrorDetails(null);
    // Reset reject reasons
    setRejectReasons({
      ownerDetail: false,
      vehicleOverview: false,
      documents: false,
      photos: false,
    });
  };

  const handleOpenRejectModal = () => {
    if (selectedVehicleForModal) {
      setOpenRejectModal(true);
    }
  };

  const handleCloseRejectModal = () => {
    setOpenRejectModal(false);
    // Reset reject reasons when closing the reject modal without submitting
    setRejectReasons({
      ownerDetail: false,
      vehicleOverview: false,
      documents: false,
      photos: false,
    });
  };

  const handleRejectReasonChange = (event) => {
    setRejectReasons({
      ...rejectReasons,
      [event.target.name]: event.target.checked,
    });
  };

  const handleApproveListing = async () => {
    if (!selectedVehicleForModal?.id || !adminToken) {
      console.warn("Cannot approve: Missing vehicle ID or admin token.");
      setErrorDetails("Authentication required or vehicle not selected.");
      return;
    }

    setLoadingDetails(true); // Use modal loading state
    setErrorDetails(null); // Clear modal error

    const approveApiUrl = `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/admin/approve_vehicle/${selectedVehicleForModal.id}`;
    try {
      const response = await fetch(approveApiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          `HTTP error approving vehicle! status: ${response.status}`,
          errorBody
        );
        let errorMsg = `Failed to approve listing: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorBody);
          if (errorJson && errorJson.message) {
            errorMsg = `Failed to approve listing: ${errorJson.message}`;
          }
        } catch (parseError) {
          // Ignore parse error
        }
        throw new Error(errorMsg);
      }

      const result = await response.json();
      console.log("Approve API response:", result);

      alert("Listing approved successfully!");

      handleCloseModal(); // Close the modal on success
      fetchVehiclesList(); // Refresh the main list to update status
    } catch (err) {
      console.error("Error approving listing:", err);
      setErrorDetails("Failed to approve listing: " + err.message); // Display error in modal
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleRejectListing = async () => {
    if (!selectedVehicleForModal?.id || !adminToken) {
      console.warn("Cannot reject: Missing vehicle ID or admin token.");
      setErrorDetails("Authentication required or vehicle not selected.");
      return;
    }

    const reasonsSelected = Object.keys(rejectReasons).filter(
      (key) => rejectReasons[key]
    );
    if (reasonsSelected.length === 0) {
      alert("Please select at least one reason for rejection.");
      return;
    }

    setLoadingDetails(true); // Use modal loading state
    setErrorDetails(null); // Clear modal error

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
            return key;
        }
      })
      .join(", ");

    const denyApiUrl = `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/admin/deny_vehicle/${selectedVehicleForModal.id}`;
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
        console.error(
          `HTTP error denying vehicle! status: ${response.status}`,
          errorBody
        );
        let errorMsg = `Failed to reject listing: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorBody);
          if (errorJson && errorJson.message) {
            errorMsg = `Failed to reject listing: ${errorJson.message}`;
          }
        } catch (parseError) {
          // Ignore parse error
        }
        throw new Error(errorMsg);
      }

      const result = await response.json();
      console.log("Deny API response:", result);

      alert("Listing rejected successfully!");

      handleCloseRejectModal();
      handleCloseModal();
      fetchVehiclesList(); // Refresh the main list
    } catch (err) {
      console.error("Error denying listing:", err);
      setErrorDetails("Failed to reject listing: " + err.message); // Display error in modal
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <Box sx={{ padding: 0, minHeight: "100vh" }}>
      <Box pb={3} pl={1}>
        <span className="text-xl">My Approval Listing</span>
      </Box>
      <div className="m-4 mb-12">
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          <Link underline="hover" key="1" color="inherit" href="/">
            <HomeOutlinedIcon />
          </Link>
          <Typography key="2" sx={{ color: "text.primary" }}>
            New Car Listings
          </Typography>
        </Breadcrumbs>
      </div>

      {loadingList && (
        <Typography align="center">Loading vehicles list...</Typography>
      )}
      {errorList && (
        <Typography color="error" align="center">
          Error loading list: {errorList}
        </Typography>
      )}

      {!loadingList &&
        !errorList &&
        (vehicles.length > 0 ? ( // Only show grid if not loading and there are vehicles
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {DISPLAY_COLUMNS.map((columnKey) => (
              <div key={columnKey}>
                <div
                  className={`drop-shadow-xs p-2 shadow-xs shadow-blue-100 border-t-4 ${
                    cardBorderColors[columnKey] || "border-gray-300"
                  } rounded-md min-h-[500px]`}
                >
                  <Box
                    sx={{ mb: 2, px: 2, pb: 1, borderBottom: "1px solid #eee" }}
                  >
                    <Typography variant="h6">
                      {columnLabels[columnKey]}
                    </Typography>
                  </Box>

                  <div className="flex flex-col gap-0">
                    {vehicles
                      .filter(
                        (vehicle) =>
                          getColumnKey(vehicle?.isApproved) === columnKey
                      )
                      .map((vehicle) => (
                        <ProfileCard
                          key={vehicle.id}
                          vehicle={vehicle}
                          onClick={handleOpenModal}
                          // Pass the enriched data from the vehicle object
                          renterName={vehicle.renterName}
                          renterPhone={vehicle.renterPhone}
                          rentalPrice={vehicle.rentalPrice}
                          submissionDate={vehicle.submissionDate}
                          renterAvatarUrl={vehicle.renterAvatarUrl}
                        />
                      ))}
                    {vehicles.filter(
                      (v) => getColumnKey(v?.isApproved) === columnKey
                    ).length === 0 && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        align="center"
                        sx={{ mt: 4 }}
                      >
                        No vehicles in this category.
                      </Typography>
                    )}
                    {columnKey === "unassigned" &&
                      !loadingList &&
                      vehicles.length > 0 && // Show helper text only if overall list is not empty
                      vehicles.filter(
                        (v) => getColumnKey(v?.isApproved) === columnKey
                      ).length === 0 && (
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          align="center"
                          sx={{ mt: 2 }}
                        >
                          (Items with unrecognized status)
                        </Typography>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Show message if list is empty after loading
          !loadingList &&
          !errorList && (
            <Typography align="center" sx={{ mt: 4, color: "text.secondary" }}>
              No vehicle listings found.
            </Typography>
          )
        ))}

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
            width: "70%",
            maxWidth: "800px",
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
        isOpen={openModal}
        onRequestClose={handleCloseModal}
        contentLabel="Vehicle Details Modal"
      >
        <div className=" bg-[#00173C] w-full text-white px-8 py-2 flex justify-between items-center">
          <Typography variant="h6" component="h2">
            Listing Approval
          </Typography>
          <Button
            onClick={handleCloseModal}
            color="inherit"
            sx={{ minWidth: "unset", padding: 0 }}
          >
            <CloseIcon />
          </Button>
        </div>

        <Box className="flex py-8 gap-4 w-full px-10">
          {selectedVehicleForModal?.isApproved !== "denied" &&
            selectedVehicleForModal?.isApproved !== "approved" && ( // Show Reject only if pending
              <button
                onClick={handleOpenRejectModal}
                disabled={loadingDetails}
                className="flex-1 py-2 cursor-pointer text-sm rounded-full bg-[#FDEAEA] text-red-700 border border-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject Listing
              </button>
            )}
          {selectedVehicleForModal?.isApproved !== "approved" &&
            selectedVehicleForModal?.isApproved !== "denied" && ( // Show Approve only if pending
              <button
                onClick={handleApproveListing}
                disabled={loadingDetails}
                className="flex-1 cursor-pointer text-sm py-1 rounded-full bg-[#00113D] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingDetails && !errorDetails // Check loading specific to modal details fetch or action
                  ? "Processing..."
                  : "Approve Listing"}
              </button>
            )}
          {selectedVehicleForModal?.isApproved === "approved" && (
            <Typography className="flex-1 text-center text-green-700 font-semibold">
              Already Approved
            </Typography>
          )}
          {selectedVehicleForModal?.isApproved === "denied" && (
            <Typography className="flex-1 text-center text-red-700 font-semibold">
              Already Rejected
            </Typography>
          )}
          {selectedVehicleForModal?.isApproved === "pending" && (
            <Typography className="flex-1 text-center text-yellow-700 font-semibold">
              Pending Review
            </Typography>
          )}
        </Box>

        {loadingDetails && !vehicleDetails && !errorDetails ? (
          <Typography align="center" sx={{ my: 4 }}>
            Loading vehicle details...
          </Typography>
        ) : errorDetails ? (
          <Typography color="error" align="center" sx={{ my: 4 }}>
            Error loading details: {errorDetails}
          </Typography>
        ) : vehicleDetails ? (
          <div className=" flex flex-col p-2">
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
            <div className="flex flex-col w-full h-fit bg-white p-6 space-y-6  px-10 shadow-blue-100  rounded-xl drop-shadow-sm shadow-xs  gap-4">
              <div className="flex justify-between flex-wrap">
                <section className=" w-full md:w-[calc(50%_-_1rem)] flex flex-col gap-4 pr-0 md:pr-8 mb-8 md:mb-0">
                  <div className=" items-center flex gap-8">
                    {isImageLoading ? (
                      <div className="w-32 h-32 rounded-full flex items-center justify-center bg-gray-100">
                        <FaSpinner className="animate-spin text-2xl text-gray-400" />
                      </div>
                    ) : (
                      <img
                        src={profileImageUrl || image}
                        alt="Renter Profile"
                        className="w-32 h-32 rounded-full object-cover"
                      />
                    )}
                    <div className="flex flex-col gap-2">
                      <h2 className="text-lg  font-semibold text-[#00113D] mb-2">
                        User Details
                      </h2>
                      <Typography
                        variant="body2"
                        className="flex items-center gap-2 text-[#38393D]"
                      >
                        <IoPersonOutline size={18} />
                        {ownerProfile?.given_name ||
                        ownerProfile?.firstName ||
                        ownerProfile?.family_name ||
                        ownerProfile?.lastName
                          ? `${
                              ownerProfile?.given_name ||
                              ownerProfile?.firstName ||
                              ""
                            } ${
                              ownerProfile?.family_name ||
                              ownerProfile?.lastName ||
                              ""
                            }`.trim()
                          : "N/A"}
                      </Typography>
                      <Typography
                        variant="body2"
                        className="flex items-center gap-2 text-[#38393D] mt-1"
                      >
                        <MdOutlineLocalPhone size={18} />
                        <p>{ownerProfile?.phone_number || "N/A"}</p>
                      </Typography>
                      <Typography
                        variant="body2"
                        className="flex items-center gap-2 text-[#38393D] mt-1"
                      >
                        <MdOutlineMail size={18} />
                        <p>{ownerProfile?.email || "N/A"}</p>
                      </Typography>
                      <Typography
                        variant="body2"
                        className="flex items-center gap-2 text-[#38393D] mt-1"
                      >
                        <IoLocationOutline size={18} />
                        <p>{vehicleDetails?.city || "N/A"}</p>
                      </Typography>
                    </div>
                  </div>
                  <div className="flex items-center cursor-pointer justify-center gap-2 mt-4 px-4 py-2 text-sm  border rounded-full border-[#00113D] text-[#00113D] bg-white">
                    <IoChatboxOutline size={16} />
                    <button>Chat With Renter</button>
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
                    >
                      <InputLabel size="small">Status</InputLabel>
                      <Select label="Status" name="status" size="small">
                        <MenuItem value="">All Statuses</MenuItem>
                        <MenuItem value="Assigned">Assigned</MenuItem>
                        <MenuItem value="Unassigned">Unassigned</MenuItem>
                        <MenuItem value="Review">Review</MenuItem>
                      </Select>
                    </FormControl>
                  </div>
                </section>
                <section className="w-full md:w-1/4 mr-0 md:mr-14">
                  <h2 className="text-lg font-semibold text-[#00113D] mb-4">
                    Account Details
                  </h2>
                  <div className="flex flex-col   text-sm text-[#38393D]">
                    <div className="flex items-start gap-2">
                      <div>
                        <Typography
                          variant="body2"
                          className="flex items-center "
                        >
                          <span className="pr-4">Status</span>
                          <span className="px-4 font-semibold text-sky-950">
                            {vehicleDetails?.isApproved
                              ? columnLabels[
                                  API_STATUS_TO_COLUMN[
                                    vehicleDetails.isApproved
                                  ]
                                ]
                              : "N/A"}
                          </span>
                        </Typography>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div>
                        <Typography
                          variant="body2"
                          className="flex items-center "
                        >
                          <span className="pr-4">Registration Date</span>
                          <span className="px-4 font-semibold text-sky-950">
                            {vehicleDetails?.createdAt
                              ? `${new Date(
                                  vehicleDetails.createdAt
                                ).toLocaleDateString()} | ${new Date(
                                  vehicleDetails.createdAt
                                ).toLocaleTimeString()}`
                              : "N/A"}
                          </span>
                        </Typography>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div>
                        <Typography
                          variant="body2"
                          className="flex items-center "
                        >
                          <span className="px-r">Rent Amount</span>
                          <span className="px-4 font-semibold text-sky-950">
                            {vehicleDetails?.price
                              ? `${vehicleDetails.price} Birr/Day`
                              : "N/A"}
                          </span>
                        </Typography>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-20 px-4 py-2 text-sm   border rounded-full border-[#00113D] text-[#00113D] bg-white">
                      <CalendarMonthOutlinedIcon fontSize="small" />
                      <button>Available Dates</button>
                    </div>
                  </div>
                </section>
                <div className="flex flex-col w-full md:w-1/3 gap-6">
                  <div className=" bg-white p-6 flex justify-between items-center w-full gap-24 shadow-blue-200   rounded-xl drop-shadow-xs shadow-xs">
                    <h2 className="text-base font-semibold text-[#00113D] ">
                      Total Rent
                    </h2>
                    <span className="px-4 text-gray-600 text-base">12</span>
                  </div>
                  <div className=" bg-white p-6 flex justify-between items-center w-full gap-24 shadow-blue-200   rounded-xl drop-shadow-xs shadow-xs">
                    <h2 className="text-base font-semibold text-[#00113D] ">
                      Rental Earnings
                    </h2>
                    <span className="pr-4 text-gray-600 text-base">1,273</span>
                  </div>
                  <div className=" bg-white p-6 flex justify-between items-center w-full gap-24 shadow-blue-200   rounded-xl drop-shadow-xs shadow-xs">
                    <h2 className="text-base font-semibold text-[#00113D] ">
                      Rental Ratings
                    </h2>
                    <div className="pr-4 gap-x-2 flex  text-lg items-center">
                      <FaStar color="gold" size={24} />
                      <span className="ml-2">{rentalRating?.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-10 bg-white w-full flex flex-col   drop-shadow-sm shadow-blue-200 shadow mt-8 rounded-lg">
              <div className=" text-xl font-semibold mb-8">
                Vehicle Overview
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 p-4 gap-4 ">
                <div className="flex items-center flex-wrap">
                  <Typography variant="body2" component="span">
                    Vehicle Type
                  </Typography>
                  <span className="mx-2 bg-blue-100 rounded-md p-2 text-sm ">
                    {vehicleDetails?.category || "N/A"}
                  </span>
                </div>
                <div className="flex items-center flex-wrap">
                  <Typography variant="body2" component="span">
                    Vehicle Make
                  </Typography>
                  <span className="mx-2 bg-blue-100 rounded-md p-2 text-sm ">
                    {vehicleDetails?.make || "N/A"}
                  </span>
                </div>
                <div className="flex items-center flex-wrap">
                  <Typography variant="body2" component="span">
                    License Plate Number
                  </Typography>
                  <span className="mx-2 bg-blue-100 rounded-md p-2 text-sm ">
                    {vehicleDetails?.licensePlateNumber ||
                      vehicleDetails?.vehicleNumber ||
                      "N/A"}
                  </span>
                </div>
                <div className="flex items-center flex-wrap">
                  <Typography variant="body2" component="span">
                    Year of Manufacture
                  </Typography>
                  <span className="mx-2 bg-blue-100 rounded-md p-2 text-sm ">
                    {vehicleDetails?.year || "N/A"}
                  </span>
                </div>
                <div className="flex items-center flex-wrap">
                  <Typography variant="body2" component="span">
                    Mileage
                  </Typography>
                  <span className="mx-2 bg-blue-100 rounded-md p-2 text-sm ">
                    {vehicleDetails?.mileage
                      ? `${vehicleDetails.mileage} KM`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center flex-wrap">
                  <Typography variant="body2" component="span">
                    Vehicle Model
                  </Typography>
                  <span className="mx-2 bg-blue-100 rounded-md p-2 text-sm ">
                    {vehicleDetails?.model || "N/A"}
                  </span>
                </div>
                <div className="flex items-center flex-wrap">
                  <Typography variant="body2" component="span">
                    Fuel Type
                  </Typography>
                  <span className="mx-2 bg-blue-100 rounded-md p-2 text-sm ">
                    {vehicleDetails?.fuelType || "N/A"}
                  </span>
                </div>
                <div className="flex items-center flex-wrap">
                  <Typography variant="body2" component="span">
                    Transmission Type
                  </Typography>
                  <span className="mx-2 bg-blue-100 rounded-md p-2 text-sm ">
                    {vehicleDetails?.transmission || "N/A"}
                  </span>
                </div>
                <div className="flex items-center flex-wrap">
                  <Typography variant="body2" component="span">
                    Vehicle ID
                  </Typography>
                  <span className="mx-2 bg-blue-100 rounded-md p-2 text-sm ">
                    {vehicleDetails?.id || "N/A"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-8 flex-wrap">
              <div className="p-10 bg-white w-full md:w-1/2 flex flex-col mt-4 drop-shadow-sm shadow-blue-200 shadow rounded-lg">
                <div className=" text-xl font-semibold mb-8">
                  Documents and Compliance
                </div>
                <div className=" w-full   justify-between gap-4   flex flex-wrap ">
                  <div className="flex flex-col items-center">
                    Libre Document{" "}
                    {vehicleDetails?.adminDocumentKeys &&
                    vehicleDetails.adminDocumentKeys.length > 0 ? (
                      <span className="my-2 bg-blue-100 underline rounded-md p-2 cursor-pointer text-sm">
                        <AttachFileIcon
                          sx={{ verticalAlign: "middle", mr: 0.5 }}
                        />
                        View Documents (
                        {vehicleDetails.adminDocumentKeys.length})
                      </span>
                    ) : (
                      <span className="my-2 bg-gray-200 rounded-md p-2 text-sm text-gray-600 cursor-not-allowed">
                        {" "}
                        <AttachFileIcon
                          sx={{ verticalAlign: "middle", mr: 0.5 }}
                        />
                        No Libre Document{" "}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-center">
                    Insurance Document{" "}
                    {vehicleDetails?.adminDocumentKeys && // Assuming Insurance is also in adminDocumentKeys
                    vehicleDetails.adminDocumentKeys.length > 0 ? (
                      <span className="my-2 bg-blue-100 underline rounded-md p-2 cursor-pointer text-sm ">
                        <AttachFileIcon
                          sx={{ verticalAlign: "middle", mr: 0.5 }}
                        />
                        View Insurance
                      </span>
                    ) : (
                      <span className="my-2 bg-gray-200 rounded-md p-2 text-sm text-gray-600 cursor-not-allowed">
                        <AttachFileIcon
                          sx={{ verticalAlign: "middle", mr: 0.5 }}
                        />
                        No Insurance Document
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-10 bg-white w-full md:w-1/2 flex flex-col mt-4 drop-shadow-sm shadow-blue-200 shadow rounded-lg">
                <div className=" text-xl font-semibold mb-8">
                  Photos and Media
                </div>
                <div className=" w-full   justify-between gap-4   flex flex-wrap ">
                  <div className="flex flex-col items-center">
                    Vehicle Photos{" "}
                    {vehicleDetails?.vehicleImageKeys &&
                    vehicleDetails.vehicleImageKeys.length > 0 ? (
                      <span className="my-2 bg-blue-100 underline rounded-md p-2 cursor-pointer text-sm">
                        <GridViewIcon
                          sx={{ verticalAlign: "middle", mr: 0.5 }}
                        />
                        View Photos ({vehicleDetails.vehicleImageKeys.length})
                      </span>
                    ) : (
                      <span className="my-2 bg-gray-200 rounded-md p-2 text-sm text-gray-600 cursor-not-allowed">
                        {" "}
                        <GridViewIcon
                          sx={{ verticalAlign: "middle", mr: 0.5 }}
                        />{" "}
                        No Vehicle Photos{" "}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          !loadingDetails && (
            <Typography align="center" sx={{ my: 4, color: "text.secondary" }}>
              Select a vehicle to view details.
            </Typography>
          )
        )}
      </Modal>

      <Modal
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1001,
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
          <Button
            onClick={handleCloseRejectModal}
            color="inherit"
            sx={{ minWidth: "unset", padding: 0 }}
          >
            <CloseIcon />
          </Button>
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
                Object.values(rejectReasons).every((reason) => !reason)
              }
              className="flex-1 text-sm py-2 cursor-pointer rounded-full bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
            >
              {loadingDetails &&
              !errorDetails &&
              selectedVehicleForModal?.isApproved !== "denied"
                ? "Processing..."
                : "Confirm Rejection"}
            </button>
          </Box>
          {errorDetails && (
            <Typography color="error" align="center" sx={{ mt: 2 }}>
              {errorDetails}
            </Typography>
          )}
        </div>
      </Modal>
    </Box>
  );
};

export default MyApprovalListing;
