import React, { useEffect, useState, useCallback } from "react";
import {
  TextField,
  Select,
  MenuItem,
  Button,
  Box,
  Typography,
  Link,
  Breadcrumbs,
  Avatar,
  Grid,
  CircularProgress,
  ButtonGroup, // Import ButtonGroup
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import DirectionsCarOutlined from "@mui/icons-material/DirectionsCarOutlined";
import LocalOfferOutlined from "@mui/icons-material/LocalOfferOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PhoneOutlined from "@mui/icons-material/PhoneOutlined";
import { getDownloadUrl } from "../api";
import image from "./avatar.png";
import VehicleApprovalModal from "./VehicleApprovalModal";

const API_STATUS_TO_COLUMN = {
  pending: "inReview",
  approved: "approved",
  denied: "rejected",
  null: "unassigned",
  "": "unassigned",
};

const DISPLAY_COLUMNS = ["inReview", "approved", "rejected"];

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

const getColumnKey = (apiStatus) => {
  return API_STATUS_TO_COLUMN[apiStatus] || "unassigned";
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
  const [vehicles, setVehicles] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [isLoadingAll, setIsLoadingAll] = useState(false); // NEW state for "Load All"
  const [errorList, setErrorList] = useState(null);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [selectedVehicleForModal, setSelectedVehicleForModal] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [adminToken, setAdminToken] = useState(null);

  useEffect(() => {
    const storedAdminJson = localStorage.getItem("admin");
    if (storedAdminJson) {
      try {
        const adminData = JSON.parse(storedAdminJson);
        if (adminData && adminData.AccessToken) {
          setAdminToken(adminData.AccessToken);
        } else {
          setErrorList("Authentication token missing.");
        }
      } catch (error) {
        setErrorList("Failed to load authentication data.");
      }
    } else {
      setErrorList("Admin not logged in.");
    }
  }, []);

  const fetchAndEnrichVehiclesList = useCallback(
    async (token, currentLastEvaluatedKey = null) => {
      if (!token) {
        setLoadingList(false);
        return;
      }
      setLoadingList(true);
      setErrorList(null);

      try {
        let apiUrlList =
          "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/admin/vehicles";
        if (currentLastEvaluatedKey) {
          apiUrlList += `?lastEvaluatedKey=${encodeURIComponent(
            currentLastEvaluatedKey
          )}`;
        }
        const response = await fetch(apiUrlList, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch vehicle list: ${response.status}`);
        }

        const data = await response.json();
        const fetchedVehicles = data?.body;
        const nextLastEvaluatedKey = data?.lastEvaluatedKey || null;

        setLastEvaluatedKey(nextLastEvaluatedKey);
        setHasMorePages(!!nextLastEvaluatedKey);

        if (Array.isArray(fetchedVehicles)) {
          const basicVehicles = fetchedVehicles.filter((v) => v != null);
          const enrichmentPromises = basicVehicles.map(async (vehicle) => {
            if (!vehicle?.id) return null;
            let ownerProfileData = null;
            let profileImageUrl = image;

            const ownerId = vehicle?.ownerId || vehicle?.owenerId;
            if (ownerId) {
              try {
                const profileUrl = `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/user/${ownerId}`;
                const profileResponse = await fetch(profileUrl, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (profileResponse.ok) {
                  ownerProfileData = await profileResponse.json();
                  const profilePictureKey =
                    ownerProfileData?.["custom:profile_picture_key"];
                  if (profilePictureKey) {
                    try {
                      const imageUrlResult = await getDownloadUrl(
                        profilePictureKey
                      );
                      profileImageUrl = imageUrlResult?.body || image;
                    } catch (imgUrlErr) {
                      profileImageUrl = image;
                    }
                  }
                }
              } catch (profileError) {
                /* empty */
              }
            }

            const renterName = `${
              ownerProfileData?.given_name || vehicle.ownerGivenName || ""
            } ${ownerProfileData?.family_name || vehicle.ownerSurName || ""}`;
            return {
              ...vehicle,
              renterName: renterName.trim() || "N/A",
              renterPhone:
                ownerProfileData?.phone_number || vehicle.ownerPhone || "N/A",
              rentalPrice: vehicle?.price || "N/A",
              submissionDate: vehicle?.createdAt || "N/A",
              renterAvatarUrl: profileImageUrl,
            };
          });

          const enrichedVehicles = (
            await Promise.all(enrichmentPromises)
          ).filter(Boolean);

          setVehicles((prevVehicles) =>
            currentLastEvaluatedKey
              ? [...prevVehicles, ...enrichedVehicles]
              : enrichedVehicles
          );
        } else if (!currentLastEvaluatedKey) {
          setErrorList("Invalid data received from server.");
          setVehicles([]);
        }
      } catch (err) {
        setErrorList("Failed to load listings: " + err.message);
        if (!currentLastEvaluatedKey) setVehicles([]);
      } finally {
        setLoadingList(false);
      }
    },
    []
  );

  useEffect(() => {
    if (adminToken) {
      fetchAndEnrichVehiclesList(adminToken, null);
    } else {
      setLoadingList(false);
      setVehicles([]);
    }
  }, [adminToken, fetchAndEnrichVehiclesList]);

  const handleLoadMore = () => {
    if (
      adminToken &&
      lastEvaluatedKey &&
      hasMorePages &&
      !loadingList &&
      !isLoadingAll
    ) {
      fetchAndEnrichVehiclesList(adminToken, lastEvaluatedKey);
    }
  };

  // NEW: Function to handle loading all remaining pages
  const handleLoadAll = async () => {
    if (!adminToken || !hasMorePages || loadingList || isLoadingAll) return;

    setIsLoadingAll(true);
    setErrorList(null);
    let currentKey = lastEvaluatedKey;
    const allNewVehicles = [];

    try {
      while (currentKey) {
        const apiUrl = `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/admin/vehicles?lastEvaluatedKey=${encodeURIComponent(
          currentKey
        )}`;
        const response = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (!response.ok)
          throw new Error(`Failed on page with key ${currentKey}`);

        const data = await response.json();
        const pageVehicles = data?.body;

        if (Array.isArray(pageVehicles)) {
          const enrichmentPromises = pageVehicles
            .filter((v) => v)
            .map(async (vehicle) => {
              if (!vehicle?.id) return null;
              let ownerProfileData = null;
              let profileImageUrl = image;
              const ownerId = vehicle?.ownerId || vehicle?.owenerId;
              if (ownerId) {
                try {
                  const profileUrl = `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/user/${ownerId}`;
                  const profileResponse = await fetch(profileUrl, {
                    headers: { Authorization: `Bearer ${adminToken}` },
                  });
                  if (profileResponse.ok) {
                    ownerProfileData = await profileResponse.json();
                    const picKey =
                      ownerProfileData?.["custom:profile_picture_key"];
                    if (picKey)
                      profileImageUrl =
                        (await getDownloadUrl(picKey))?.body || image;
                  }
                } catch {
                  /* ignore individual errors */
                }
              }
              const renterName = `${
                ownerProfileData?.given_name || vehicle.ownerGivenName || ""
              } ${ownerProfileData?.family_name || vehicle.ownerSurName || ""}`;
              return {
                ...vehicle,
                renterName: renterName.trim() || "N/A",
                renterPhone:
                  ownerProfileData?.phone_number || vehicle.ownerPhone || "N/A",
                rentalPrice: vehicle?.price || "N/A",
                submissionDate: vehicle?.createdAt || "N/A",
                renterAvatarUrl: profileImageUrl,
              };
            });
          const enrichedPage = (await Promise.all(enrichmentPromises)).filter(
            Boolean
          );
          allNewVehicles.push(...enrichedPage);
        }

        currentKey = data?.lastEvaluatedKey || null;
      }

      setVehicles((prev) => [...prev, ...allNewVehicles]);
      setHasMorePages(false);
      setLastEvaluatedKey(null);
    } catch (err) {
      setErrorList(
        "An error occurred while loading all vehicles. Some data may be missing."
      );
    } finally {
      setIsLoadingAll(false);
    }
  };

  const handleOpenModal = (vehicle) => {
    setSelectedVehicleForModal(vehicle);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedVehicleForModal(null);
  };

  const handleModalActionSuccess = () => {
    handleCloseModal();
    fetchAndEnrichVehiclesList(adminToken, null);
  };

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

      <Box
        sx={{
          position: "fixed",
          top: "200px",
          right: "44px",
          zIndex: 1100,
        }}
      >
        {hasMorePages && vehicles.length > 0 && (
          <ButtonGroup
            variant="contained"
            aria-label="outlined primary button group"
          >
            <Button
              onClick={handleLoadMore}
              disabled={loadingList || isLoadingAll}
              startIcon={
                loadingList && !isLoadingAll ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }
            >
              {loadingList && !isLoadingAll ? "Loading..." : "Load More"}
            </Button>
            <Button
              onClick={handleLoadAll}
              disabled={loadingList || isLoadingAll}
              startIcon={
                isLoadingAll ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }
            >
              {isLoadingAll ? "Loading All..." : "Load All"}
            </Button>
          </ButtonGroup>
        )}
      </Box>

      <Grid container spacing={3}>
        {DISPLAY_COLUMNS.map((columnKey) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={columnKey}>
            <Box
              className={`drop-shadow-xs p-2 shadow-xs shadow-blue-100 border-t-4 ${
                cardBorderColors[columnKey] || "border-gray-300"
              } rounded-md min-h-[500px]`}
            >
              <Box sx={{ mb: 2, px: 2, pb: 1, borderBottom: "1px solid #eee" }}>
                <Typography variant="h6">
                  {columnLabels[columnKey]} ({vehicleCountByColumn[columnKey]})
                </Typography>
              </Box>
              <div className="flex flex-col gap-0">
                {vehicles
                  .filter(
                    (vehicle) => getColumnKey(vehicle?.isApproved) === columnKey
                  )
                  .map((vehicle) => (
                    <ProfileCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      onClick={handleOpenModal}
                      renterName={vehicle.renterName}
                      renterPhone={vehicle.renterPhone}
                      rentalPrice={vehicle.rentalPrice}
                      submissionDate={vehicle.submissionDate}
                      renterAvatarUrl={vehicle.renterAvatarUrl}
                    />
                  ))}
                {!loadingList &&
                  !isLoadingAll &&
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

      {errorList && vehicles.length === 0 && (
        <Typography color="error" align="center" sx={{ py: 4 }}>
          Error loading list: {errorList}
        </Typography>
      )}

      {!hasMorePages &&
        !loadingList &&
        !isLoadingAll &&
        vehicles.length > 0 && (
          <Typography align="center" sx={{ mt: 4, color: "text.secondary" }}>
            End of list. All vehicles loaded.
          </Typography>
        )}

      <VehicleApprovalModal
        isOpen={openModal}
        vehicle={selectedVehicleForModal}
        adminToken={adminToken}
        onClose={handleCloseModal}
        onActionSuccess={handleModalActionSuccess}
      />
    </Box>
  );
};

export default MyApprovalListing;
