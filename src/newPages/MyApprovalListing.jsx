// MyApprovalListing.js
import { HiMiniArrowsUpDown } from "react-icons/hi2";
import React, { useEffect, useState, useCallback } from "react";
import {
  TextField,
  Select,
  MenuItem,
  Pagination,
  Box,
  FormControl,
  InputLabel,
  InputAdornment,
  Typography,
  Link,
  CircularProgress,
  Avatar,
} from "@mui/material";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import { Search } from "@mui/icons-material";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import RuleFolderOutlinedIcon from "@mui/icons-material/RuleFolderOutlined";

import { getDownloadUrl } from "../api";
import image from "./avatar.png"; // Default avatar
import VehicleApprovalModal from "./VehicleApprovalModal";

// Mapping from API status to a consistent status string
const API_STATUS_MAP = {
  pending: "In Review",
  approved: "Approved",
  denied: "Rejected",
};

const getStatusFromString = (apiStatus) => {
  return API_STATUS_MAP[apiStatus] || "Unassigned";
};

const MyApprovalListing = () => {
  const [vehicles, setVehicles] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [adminToken, setAdminToken] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const apiUrl =
    "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/admin/vehicles";

  const fetchAllVehicles = useCallback(
    async (token, key = null, accumulatedVehicles = []) => {
      if (!token) return [];
      const url = new URL(apiUrl);
      if (key) url.searchParams.append("lastEvaluatedKey", key);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const fetchedVehicles =
        data.body && Array.isArray(data.body) ? data.body : [];

      // Enrich vehicles with owner details
      const enrichmentPromises = fetchedVehicles
        .filter((v) => v != null && v.id)
        .map(async (vehicle) => {
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
                  const imageUrlResult = await getDownloadUrl(
                    profilePictureKey
                  );
                  profileImageUrl = imageUrlResult?.body || image;
                }
              }
            } catch (error) {
              console.error("Failed to fetch owner profile:", error);
            }
          }
          const renterName =
            `${ownerProfileData?.given_name || vehicle.ownerGivenName || ""} ${
              ownerProfileData?.family_name || vehicle.ownerSurName || ""
            }`.trim() || "N/A";

          return {
            ...vehicle,
            renterName,
            renterAvatarUrl: profileImageUrl,
            renterPhone:
              ownerProfileData?.phone_number || vehicle.ownerPhone || "N/A",
            submissionDate: vehicle.createdAt || "N/A",
            status: getStatusFromString(vehicle.isApproved),
          };
        });

      const enrichedVehicles = (await Promise.all(enrichmentPromises)).filter(
        Boolean
      );
      const allSoFar = [...accumulatedVehicles, ...enrichedVehicles];

      if (data.lastEvaluatedKey) {
        return await fetchAllVehicles(token, data.lastEvaluatedKey, allSoFar);
      }

      return allSoFar;
    },
    [apiUrl]
  );

  const refreshVehicleList = useCallback(
    async (token) => {
      setIsLoadingList(true);
      setVehicles([]);
      setCurrentPage(1);
      try {
        const allVehiclesData = await fetchAllVehicles(token);
        setVehicles(allVehiclesData);
      } catch (error) {
        console.error("Error fetching all vehicles:", error);
        setAdminToken(null);
      } finally {
        setIsLoadingList(false);
      }
    },
    [fetchAllVehicles]
  );

  useEffect(() => {
    const storedAdminJson = localStorage.getItem("admin");
    let token = null;
    if (storedAdminJson) {
      try {
        const adminData = JSON.parse(storedAdminJson);
        token = adminData?.AccessToken;
        setAdminToken(token);
      } catch (error) {
        console.error("Failed to parse admin data:", error);
      }
    }

    if (token) {
      refreshVehicleList(token);
    } else {
      console.warn("No admin token found.");
      setIsLoadingList(false);
    }
  }, [refreshVehicleList]);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });

  const itemsPerPage = 8;

  const statusColors = {
    "In Review": "bg-[#F6DE95] text-[#816204] font-bold",
    Approved: "bg-[#A0E6BA] text-[#136C34] font-bold",
    Rejected: "bg-[#FEE2E2] text-[#991B1B] font-bold",
    Unassigned: "bg-gray-200 text-gray-800",
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
    setCurrentPage(1);
  };

  const filteredDataSource = vehicles.filter((item) => {
    const searchTerm = filters.search.toLowerCase() || "";
    const searchMatch =
      (item.renterName || "").toLowerCase().includes(searchTerm) ||
      (item.make || "").toLowerCase().includes(searchTerm) ||
      (item.model || "").toLowerCase().includes(searchTerm) ||
      (item.id || "").toLowerCase().includes(searchTerm);
    const statusMatch = filters.status ? item.status === filters.status : true;
    return searchMatch && statusMatch;
  });

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  const sortedDataSource = [...filteredDataSource].sort((a, b) => {
    if (sortConfig.key) {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const paginatedDataSource = sortedDataSource.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sortedDataSource.length / itemsPerPage);
  const handlePageChange = (event, value) => setCurrentPage(value);

  const handleRowClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedVehicle(null);
  };

  const handleActionSuccess = () => {
    handleCloseModal();
    if (adminToken) {
      refreshVehicleList(adminToken);
    }
  };

  const breadcrumbs = [
    <Link underline="hover" key="1" color="inherit" href="/">
      <HomeOutlinedIcon sx={{ mr: 0.5 }} fontSize="inherit" />
      Home
    </Link>,
    <Typography key="2" sx={{ color: "text.primary" }}>
      My Approval Listing
    </Typography>,
  ];

  const totalSubmissions = vehicles.length;
  const inReviewVehicles = vehicles.filter(
    (v) => v.status === "In Review"
  ).length;
  const approvedVehicles = vehicles.filter(
    (v) => v.status === "Approved"
  ).length;
  const rejectedVehicles = vehicles.filter(
    (v) => v.status === "Rejected"
  ).length;

  const showNoTokenMessage = !isLoadingList && !adminToken;
  const showNoDataMessage =
    !isLoadingList && adminToken && vehicles.length === 0;
  const showNoFilteredDataMessage =
    !isLoadingList && sortedDataSource.length === 0 && vehicles.length > 0;

  return (
    <div className="flex flex-col">
      <Box pb={3} pl={1}>
        <span className="text-xl">My Approval Listing</span>
      </Box>
      <div className="m-4 mb-12">
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          {breadcrumbs}
        </Breadcrumbs>
      </div>
      <div>
        <div className="flex gap-10 mb-10 flex-wrap">
          <div className="bg-white drop-shadow-xs pr-32 shadow-xs flex flex-col shadow-blue-100 rounded-2xl p-4">
            <RuleFolderOutlinedIcon color="primary" />
            <Typography variant="h6">{totalSubmissions}</Typography>
            <Typography variant="body2">Total Submissions</Typography>
          </div>
          <div className="bg-white drop-shadow-xs pr-32 shadow-xs flex flex-col shadow-blue-100 rounded-2xl p-4">
            <PersonSearchOutlinedIcon color="warning" />
            <Typography variant="h6">{inReviewVehicles}</Typography>
            <Typography variant="body2">In Review</Typography>
          </div>
          <div className="bg-white drop-shadow-xs pr-32 shadow-xs flex flex-col shadow-blue-100 rounded-2xl p-4">
            <ThumbUpOutlinedIcon color="success" />
            <Typography variant="h6">{approvedVehicles}</Typography>
            <Typography variant="body2">Approved</Typography>
          </div>
          <div className="bg-white drop-shadow-xs pr-32 shadow-xs flex flex-col shadow-blue-100 rounded-2xl p-4">
            <ThumbDownOutlinedIcon color="error" />
            <Typography variant="h6">{rejectedVehicles}</Typography>
            <Typography variant="body2">Rejected</Typography>
          </div>
        </div>

        <div className="bg-white w-full drop-shadow-xs shadow-blue-200 py-4 shadow-xs rounded-lg">
          <div className="px-2 rounded-lg">
            <div className="flex items-center justify-between gap-4 flex-wrap p-2">
              <h2 className="text-sm font-semibold pl-2 flex-shrink-0">
                Vehicle Approval List
              </h2>
              <div className="flex gap-4 items-center flex-wrap">
                <TextField
                  label="Search by Owner/Make/Model/ID"
                  variant="outlined"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  size="small"
                  sx={{ minWidth: 280 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
                <FormControl
                  variant="outlined"
                  sx={{ minWidth: 150 }}
                  size="small"
                >
                  <InputLabel size="small">Status</InputLabel>
                  <Select
                    label="Status"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    size="small"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="In Review">In Review</MenuItem>
                    <MenuItem value="Approved">Approved</MenuItem>
                    <MenuItem value="Rejected">Rejected</MenuItem>
                    {/* <MenuItem value="Unassigned">Unassigned</MenuItem> */}
                  </Select>
                </FormControl>
              </div>
            </div>

            <VehicleApprovalModal
              isOpen={openModal}
              vehicle={selectedVehicle}
              adminToken={adminToken}
              onClose={handleCloseModal}
              onActionSuccess={handleActionSuccess}
            />

            {isLoadingList ? (
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                minHeight="200px"
              >
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>
                  Loading approvals, please wait...
                </Typography>
              </Box>
            ) : showNoTokenMessage ? (
              <Typography variant="body1" align="center" sx={{ py: 4 }}>
                Please log in to view the approval list.
              </Typography>
            ) : showNoDataMessage ? (
              <Typography variant="body1" align="center" sx={{ py: 4 }}>
                No vehicle submissions found.
              </Typography>
            ) : showNoFilteredDataMessage ? (
              <Typography variant="body1" align="center" sx={{ py: 4 }}>
                No vehicles match your current filters.
              </Typography>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-x-0 border-t-0 border-gray-100 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50 font-semibold">
                      <th
                        className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("renterName")}
                      >
                        Owner
                        {sortConfig.key === "renterName" ? (
                          <HiMiniArrowsUpDown
                            className={`inline ml-1 transform ${
                              sortConfig.direction === "descending"
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        ) : (
                          <HiMiniArrowsUpDown className="inline ml-1 text-gray-400" />
                        )}
                      </th>
                      <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                        Vehicle ID
                      </th>
                      <th
                        className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("make")}
                      >
                        Vehicle
                        {sortConfig.key === "make" ? (
                          <HiMiniArrowsUpDown
                            className={`inline ml-1 transform ${
                              sortConfig.direction === "descending"
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        ) : (
                          <HiMiniArrowsUpDown className="inline ml-1 text-gray-400" />
                        )}
                      </th>
                      <th
                        className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("submissionDate")}
                      >
                        Submission Date
                        {sortConfig.key === "submissionDate" ? (
                          <HiMiniArrowsUpDown
                            className={`inline ml-1 transform ${
                              sortConfig.direction === "descending"
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        ) : (
                          <HiMiniArrowsUpDown className="inline ml-1 text-gray-400" />
                        )}
                      </th>
                      <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDataSource.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleRowClick(item)}
                      >
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div className="flex items-center">
                            <Avatar
                              alt={item.renterName}
                              src={item.renterAvatarUrl}
                              sx={{ width: 40, height: 40, mr: 2 }}
                            />
                            <div>
                              <p className="font-medium">{item.renterName}</p>
                              <p className="text-xs text-gray-500">
                                {item.renterPhone}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                          {item.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <p className="font-medium">
                            {item.make} {item.model}
                          </p>
                          <p className="text-xs text-gray-500">
                            Year: {item.year || "N/A"}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {new Date(item.submissionDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-2 rounded-xl text-xs ${
                              statusColors[item.status] ||
                              "bg-gray-200 text-gray-800"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalPages > 1 && (
                  <Box display="flex" justifyContent="center" mt={4}>
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={handlePageChange}
                      color="primary"
                    />
                  </Box>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyApprovalListing;
