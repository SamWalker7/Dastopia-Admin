// VehicleManagment.js (or VehicleManagment.jsx)
import { HiMiniArrowsUpDown } from "react-icons/hi2";
import React, { useEffect, useState, useCallback } from "react";
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
  CircularProgress,
  PaginationItem, // Import PaginationItem
} from "@mui/material";

import Breadcrumbs from "@mui/material/Breadcrumbs";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import CarRentalOutlinedIcon from "@mui/icons-material/CarRentalOutlined";
import DirectionsCarFilledOutlinedIcon from "@mui/icons-material/DirectionsCarFilledOutlined";
import CarCrashOutlinedIcon from "@mui/icons-material/CarCrashOutlined";
import ApprovalOutlinedIcon from "@mui/icons-material/ApprovalOutlined";
import { Grid } from "@mui/material"; // Grid seems unused, keeping import
import { Search } from "@mui/icons-material";

import Account from "./Account1"; // Assuming path is correct
// Removed AddCarModal import

// Hardcoded Admin ID for filtering
// ** IMPORTANT: Ensure this ADMIN_OWNER_ID is correct for the admin whose vehicles you want to list **
const ADMIN_OWNER_ID = "e4d8c438-9041-7097-207f-74a13f19b03a";

const VehicleManagment = () => {
  const [filters, setFilters] = useState({
    search: "",
    carType: "",
    status: "",
  });

  // This state will hold the cumulative list of ADMIN-OWNED vehicles fetched from the API
  const [vehicles, setVehicles] = useState([]);

  const [adminToken, setAdminToken] = useState(null);

  // Loading states: initial load vs. fetching more
  const [isLoadingList, setIsLoadingList] = useState(true); // True initially
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Pagination states related to API fetching
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null); // Key from API for the next fetch
  const [hasMore, setHasMore] = useState(true); // Assume more data from API until proven false

  // Current page state for client-side pagination over the LOADED & FILTERED data
  const [currentPage, setCurrentPage] = useState(1); // Add this line
  const itemsPerPage = 8; // Items to show per page on the frontend

  const apiUrl =
    "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/admin/vehicles";

  // Define fetchAdminVehicles using useCallback, accepting pagination key
  const fetchAdminVehicles = useCallback(
    async (token, key = null) => {
      if (!token) {
        console.log("Admin token not available during fetch attempt.");
        setVehicles([]);
        setLastEvaluatedKey(null);
        setHasMore(false);
        setIsLoadingList(false);
        setIsFetchingMore(false);
        return;
      }
      console.log(
        `Fetching admin vehicles with token and key=${key || "null"}...`
      );

      // Set appropriate loading state
      if (key === null) {
        // isLoadingList is set true by the calling useEffect
      } else {
        setIsFetchingMore(true);
      }

      try {
        const url = new URL(apiUrl);
        // ** Include the admin owner ID filter in the API request **
        // Assuming the API supports filtering by ownerId via query parameter
        url.searchParams.append("ownerId", ADMIN_OWNER_ID);
        // Include the pagination key if provided
        if (key) {
          url.searchParams.append("lastEvaluatedKey", key);
        }
        console.log("Request URL:", url.toString());

        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          if (response.status === 401) {
            console.error(
              "Authentication failed. Token might be expired or invalid. Clearing token."
            );
            setAdminToken(null);
            setVehicles([]);
            setLastEvaluatedKey(null);
            setHasMore(false);
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched admin vehicle data:", data);

        if (data && data.body && Array.isArray(data.body)) {
          // ** DEFENSIVE FILTERING: Keep only vehicles matching ADMIN_OWNER_ID
          // This is crucial in case the API filtering isn't perfect or uses 'owenerId' inconsistently **
          const adminVehiclesFromBatch = data.body.filter(
            (vehicle) =>
              vehicle.ownerId === ADMIN_OWNER_ID ||
              vehicle.owenerId === ADMIN_OWNER_ID
          );
          console.log(
            `Batch contained ${data.body.length} vehicles, ${adminVehiclesFromBatch.length} matched admin ID.`
          );

          // Append new admin vehicles if fetching more, otherwise replace
          setVehicles((prevVehicles) =>
            key
              ? [...prevVehicles, ...adminVehiclesFromBatch]
              : adminVehiclesFromBatch
          );

          // Update pagination states from the API response
          setLastEvaluatedKey(data.lastEvaluatedKey || null);
          setHasMore(!!data.lastEvaluatedKey); // hasMore is true if a key was returned

          // Reset currentPage to 1 ONLY on the initial fetch (key === null)
          // When loading more (key !== null), currentPage remains unchanged.
          if (key === null) {
            setCurrentPage(1);
          }
        } else {
          console.warn(
            "API response did not contain an array body or key as expected:",
            data
          );
          if (key === null) {
            setVehicles([]); // Clear data on initial load if response format is bad
          }
          setLastEvaluatedKey(null); // No key means no more data
          setHasMore(false);
        }
      } catch (error) {
        console.error("Error fetching admin vehicles:", error);
        if (key === null) {
          setVehicles([]); // Clear data on initial error
        }
        setLastEvaluatedKey(null);
        setHasMore(false); // Assume no more data on error
        // TODO: Set an error state to display to the user
      } finally {
        // Always stop the appropriate loading state
        if (key === null) {
          setIsLoadingList(false); // Stop initial loading
        } else {
          setIsFetchingMore(false); // Stop 'fetching more' loading
        }
      }
    },
    // Add all state setters and external variables used inside fetchAdminVehicles to useCallback dependencies
    // Include ADMIN_OWNER_ID in dependencies as it's used in the API call URL
    [
      apiUrl,
      ADMIN_OWNER_ID,
      setVehicles,
      setLastEvaluatedKey,
      setHasMore,
      setCurrentPage,
      setAdminToken,
      setIsLoadingList,
      setIsFetchingMore,
    ]
  );

  // Effect to get admin token from localStorage and trigger the initial fetch
  useEffect(() => {
    // Ensure loading is true when this effect starts
    setIsLoadingList(true);

    const storedAdminJson = localStorage.getItem("admin");
    let token = null;

    if (storedAdminJson) {
      try {
        const adminData = JSON.parse(storedAdminJson);
        if (adminData && adminData.AccessToken) {
          token = adminData.AccessToken;
          setAdminToken(token); // Update state
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

    // If token is found, trigger the initial fetch of admin vehicles
    if (token) {
      console.log(
        "Admin token found, initiating initial admin vehicle list fetch..."
      );
      // Pass null key for the first page
      fetchAdminVehicles(token, null);
    } else {
      // No token, cannot fetch. Stop loading.
      console.log("No admin token found, cannot fetch admin vehicle list.");
      setVehicles([]);
      setLastEvaluatedKey(null);
      setHasMore(false);
      setIsLoadingList(false);
    }
    // Dependency on fetchAdminVehicles is needed because it's called inside
    // Dependency on ADMIN_OWNER_ID is needed if you ever plan to change it dynamically
  }, [fetchAdminVehicles, ADMIN_OWNER_ID]);

  // States related to showing the Account view
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [showAccount, setShowAccount] = useState(false);

  // Removed Add Car modal state and handlers as per the provided code's removal

  const statusColors = {
    "Pending Approval": "bg-[#F6DE95] text-[#816204] font-bold",
    Active: "bg-[#A0E6BA] text-[#136C34] font-bold",
    Inactive: "bg-[#FEE2E2] text-[#991B1B] font-bold",
  };

  // handleFilterChange updates filters and resets client-side pagination
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
    setCurrentPage(1); // Always reset pagination to page 1 when filters change
    // Note: Filtering (search, type, status) is client-side on loaded data. Changing filters does NOT refetch from API.
  };

  // Filtering (search, type, status) is done client-side on the loaded admin vehicles (`vehicles` state)
  const filteredVehicles = vehicles.filter((vehicle) => {
    const carMake = vehicle.make || "";
    const carModel = vehicle.model || "";
    const plate = vehicle.licensePlateNumber || "";
    const searchTerm = filters.search || "";

    const searchMatch =
      carMake.toLowerCase().includes(searchTerm.toLowerCase()) ||
      carModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plate.toLowerCase().includes(searchTerm.toLowerCase());

    // Map API status to display status for client-side filtering
    const currentStatus =
      vehicle.isApproved === "approved"
        ? "Active"
        : vehicle.isApproved === "pending"
        ? "Pending Approval"
        : "Inactive"; // Assuming 'denied' or other non-approved/pending are 'Inactive'

    const typeMatch = filters.carType
      ? vehicle.category === filters.carType
      : true;
    const statusMatch = filters.status
      ? currentStatus === filters.status
      : true;

    return searchMatch && typeMatch && statusMatch;
  });

  // Sorting logic applied to the client-side filtered list
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    if (sortConfig.key) {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle null/undefined values during sorting
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === "ascending" ? 1 : -1; // Nulls last in ascending
      if (bValue == null) return sortConfig.direction === "ascending" ? -1 : 1; // Nulls last in ascending

      // Numerical sort for Year (year field) and Daily Pricing (price field)
      if (sortConfig.key === "year" || sortConfig.key === "price") {
        const numA = Number(aValue);
        const numB = Number(bValue);

        if (isNaN(numA) && isNaN(numB)) return 0;
        if (isNaN(numA)) return sortConfig.direction === "ascending" ? 1 : -1; // Invalid numbers last
        if (isNaN(numB)) return sortConfig.direction === "ascending" ? -1 : 1; // Invalid numbers last

        return sortConfig.direction === "ascending" ? numA - numB : numB - numA;
      }

      // Date sort for Submission Date (createdAt field from API)
      if (sortConfig.key === "createdAt") {
        const dateA = aValue ? new Date(aValue).getTime() : 0; // Use 0 for null/invalid dates
        const dateB = bValue ? new Date(bValue).getTime() : 0;

        if (dateA === dateB) return 0;

        return sortConfig.direction === "ascending"
          ? dateA - dateB
          : dateB - dateA;
      }

      // Special case for Status sorting if needed (e.g., Pending always first)
      // Otherwise, default string comparison on the API status ('approved', 'pending', 'denied')
      if (sortConfig.key === "isApproved") {
        const statusOrder = { pending: 1, approved: 2, denied: 3, inactive: 4 }; // Define custom order
        const orderA = statusOrder[aValue] || 5; // Default large value for unknown statuses
        const orderB = statusOrder[bValue] || 5;

        if (orderA === orderB) return 0;

        return sortConfig.direction === "ascending"
          ? orderA - orderB
          : orderB - orderA;
      }

      // Default string comparison (case-insensitive for strings) for other keys
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    }
    return 0; // No sorting applied
  });

  // Map sortable headers to the actual data keys from the API response object
  const sortKeyMap = {
    "Car Type": "category",
    "Car Make": "make",
    "Car Model": "model",
    "Submission Date": "createdAt", // API field name
    "Daily Pricing": "price", // API field name
    "License Plate Number": "licensePlateNumber",
    Status: "isApproved", // API field name
    "Year of Manufacture": "year", // API field name
  };

  // Handle sort click, updates sort config and resets client-side pagination
  const handleSort = (headerLabel) => {
    const key = sortKeyMap[headerLabel] || headerLabel;
    let direction = "ascending";
    if (sortConfig.key === key) {
      if (sortConfig.direction === "ascending") {
        direction = "descending";
      } else {
        // Cycle from descending back to no sort
        setSortConfig({ key: null, direction: "ascending" });
        return;
      }
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page of the client-side filtered/sorted list
  };

  // Determine the slice of data for the current page from the sorted & filtered list
  const paginatedVehicles = sortedVehicles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate total pages based on the *loaded and filtered* data
  const totalLoadedPages = Math.ceil(filteredVehicles.length / itemsPerPage);

  // Calculate the total number of pages to show in the pagination control.
  // This is the number of standard pages based on client-side filtering,
  // PLUS one extra 'Load More' page if hasMore is true (based on API pagination status).
  const paginationCount = totalLoadedPages + (hasMore ? 1 : 0);

  // Handle pagination clicks (modified for Load More)
  const handlePageChange = (event, value) => {
    // Check if the clicked page number is the one representing the 'Load More' action.
    // This happens when 'value' is exactly one more than the number of pages
    // calculated from the currently loaded and filtered data.
    // Also ensure we have a token, a key for the next API page, and are not already loading more API data.
    if (
      value > totalLoadedPages &&
      hasMore &&
      !isFetchingMore &&
      adminToken &&
      lastEvaluatedKey
    ) {
      console.log(
        "Clicked 'Load More' page number:",
        value,
        "Attempting to fetch next batch with key:",
        lastEvaluatedKey
      );
      // Trigger fetching the next batch of admin vehicles from the API
      fetchAdminVehicles(adminToken, lastEvaluatedKey);
      // Do NOT update currentPage here. The user stays on the last page of the old data.
      // The pagination component will update its count based on the new total loaded data (`vehicles` state)
      // when the API fetch completes. The user will effectively remain on the last page of the previous set,
      // but more pages will become available.
    } else if (value <= totalLoadedPages) {
      // This is a standard page navigation within the data already loaded and filtered.
      setCurrentPage(value);
      // Optional: Scroll to top of table/list on page change
      // const tableContainer = document.querySelector('.overflow-x-auto');
      // if(tableContainer) {
      //     tableContainer.scrollTo({ top: 0, behavior: 'smooth' });
      // } else {
      //      window.scrollTo({ top: 0, behavior: 'smooth' });
      // }
    }
    // If value > totalLoadedPages but hasMore is false, or already fetching, do nothing.
  };

  // handleRowClick passes vehicle.id to the Account component
  const handleRowClick = (vehicle) => {
    setSelectedVehicleId(vehicle.id);
    setShowAccount(true);
  };

  const breadcrumbs = showAccount
    ? [
        <Link underline="hover" key="1" color="inherit" href="/">
          <HomeOutlinedIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>,
        <button
          key="2"
          className="cursor-pointer hover:text-blue-800 text-inherit"
          onClick={() => setShowAccount(false)}
        >
          Vehicle Management
        </button>,
        <Typography key="3" sx={{ color: "text.primary" }}>
          Account
        </Typography>,
      ]
    : [
        <Link underline="hover" key="1" color="inherit" href="/">
          <HomeOutlinedIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>,
        <Typography key="2" sx={{ color: "text.primary" }}>
          Vehicle Management
        </Typography>,
      ];

  // Stats calculations are based on the *full loaded and client-side filtered* list (`filteredVehicles`)
  const totalAdminVehicles = filteredVehicles.length;
  // Use API status 'approved' for Active
  const activeAdminVehicles = filteredVehicles.filter(
    (v) => v.isApproved === "approved"
  ).length;
  // Use API status 'pending' for Pending Approval
  const pendingAdminApprovalVehicles = filteredVehicles.filter(
    (v) => v.isApproved === "pending"
  ).length;
  // Use API status 'denied' or 'isActive === "inactive"' for Deactivated
  // Using 'isActive === "inactive"' as a possible definition for inactive, check your API
  const deactivatedAdminVehicles = filteredVehicles.filter(
    (v) => v.isApproved === "denied" || v.isActive === "inactive"
  ).length;

  // Conditional messages based on loading/data state
  const showNoTokenMessage = !isLoadingList && !adminToken;
  // No admin vehicles returned by API *after initial load*
  const showNoAdminVehiclesLoaded =
    !isLoadingList && adminToken && vehicles.length === 0 && !isFetchingMore;
  // Data loaded (at least one vehicle), but none match client-side filters
  const showNoFilteredData =
    !isLoadingList && filteredVehicles.length === 0 && vehicles.length > 0;

  return (
    <div className="flex flex-col">
      <Box pb={3} pl={1}>
        <span className="text-xl">Vehicle Management (Admin Owned)</span>{" "}
        {/* Updated Title */}
      </Box>
      <div className="m-4 mb-12">
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          {breadcrumbs}
        </Breadcrumbs>
      </div>

      {showAccount && selectedVehicleId ? (
        // Pass the adminToken to the Account component
        <Account vehicleId={selectedVehicleId} adminToken={adminToken} />
      ) : (
        <div>
          <div className="flex gap-10 mb-10">
            {/* Status Cards - Based on filtered loaded data */}
            <div>
              <div className="bg-white drop-shadow-xs pr-32 shadow-xs flex flex-col shadow-blue-100 rounded-2xl p-4">
                <DirectionsCarFilledOutlinedIcon color="primary" />
                <Typography variant="h6">{totalAdminVehicles}</Typography>
                <Typography variant="body2">Total Admin (Filtered)</Typography>
              </div>
            </div>
            <div>
              <div className="bg-white drop-shadow-xs pr-32 shadow-xs flex flex-col shadow-blue-100 rounded-2xl p-4">
                <CarRentalOutlinedIcon color="success" />
                <Typography variant="h6">{activeAdminVehicles}</Typography>
                <Typography variant="body2">
                  Approved Admin (Filtered)
                </Typography>
              </div>
            </div>
            <div>
              <div className="bg-white drop-shadow-xs pr-32 shadow-xs flex flex-col shadow-blue-100 rounded-2xl p-4">
                <ApprovalOutlinedIcon color="warning" />
                <Typography variant="h6">
                  {pendingAdminApprovalVehicles}
                </Typography>
                <Typography variant="body2">
                  Pending Admin (Filtered)
                </Typography>
              </div>
            </div>
            <div>
              <div className="bg-white drop-shadow-xs pr-32 shadow-xs flex flex-col shadow-blue-100 rounded-2xl p-4">
                <CarCrashOutlinedIcon color="error" />
                <Typography variant="h6">{deactivatedAdminVehicles}</Typography>
                <Typography variant="body2">
                  Denied/Inactive Admin (Filtered)
                </Typography>
              </div>
            </div>
          </div>

          <div className="bg-white w-full drop-shadow-xs shadow-blue-200 py-4 shadow-xs rounded-lg">
            <div className="px-2 rounded-lg">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-sm font-semibold pl-2 my-4 flex-shrink-0">
                  Admin Car List
                </h2>
                <div className="flex gap-4 items-center flex-wrap">
                  <TextField
                    label="Search Car"
                    variant="outlined"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    size="small"
                    sx={{ minWidth: 180 }}
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
                    size="small"
                    sx={{ minWidth: 120 }}
                  >
                    <InputLabel size="small">Car Type</InputLabel>
                    <Select
                      label="Car Type"
                      name="carType"
                      value={filters.carType}
                      onChange={handleFilterChange}
                      size="small"
                    >
                      <MenuItem value="">All Car Types</MenuItem>
                      <MenuItem value="Sedan">Sedan</MenuItem>
                      <MenuItem value="SUV">SUV</MenuItem>
                      <MenuItem value="Hatchback">Hatchback</MenuItem>
                      {/* Add other types from your data if needed */}
                    </Select>
                  </FormControl>
                  <FormControl variant="outlined" sx={{ minWidth: 120 }}>
                    <InputLabel size="small">Status</InputLabel>
                    <Select
                      label="Status"
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                      size="small"
                    >
                      <MenuItem value="">All Statuses</MenuItem>
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Inactive">Inactive</MenuItem>
                      <MenuItem value="Pending Approval">
                        Pending Approval
                      </MenuItem>
                      {/* Add other statuses from your data if needed */}
                    </Select>
                  </FormControl>
                  {/* Removed Add Car Button */}
                </div>
              </div>

              {/* Removed Add Car Modal Component */}

              {/* Conditional rendering for table/loading/empty states */}
              {isLoadingList && vehicles.length === 0 ? ( // Show main loader only when no data is loaded yet
                <Box
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  minHeight="200px"
                >
                  <CircularProgress />
                  <Typography sx={{ mt: 2 }}>
                    Loading admin vehicle list...
                  </Typography>
                </Box>
              ) : showNoTokenMessage ? (
                <Typography variant="body1" align="center" sx={{ py: 4 }}>
                  Please log in to view vehicles.
                </Typography>
              ) : showNoAdminVehiclesLoaded ? (
                <Typography variant="body1" align="center" sx={{ py: 4 }}>
                  No vehicles found for this admin account.
                </Typography>
              ) : showNoFilteredData ? (
                <Typography variant="body1" align="center" sx={{ py: 4 }}>
                  No vehicles match your current filters.
                </Typography>
              ) : (
                // Render the table if data exists and no specific empty state message is shown
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-x-0 border-t-0 border-gray-100 rounded-lg">
                    <thead>
                      <tr className="bg-gray-50 font-semibold">
                        <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                          Vehicle ID
                        </th>
                        <th
                          className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("Car Type")}
                        >
                          Car Type {/* Add sorting icons */}
                          {sortConfig.key === "category" && (
                            <HiMiniArrowsUpDown
                              className={`inline ml-1 transform ${
                                sortConfig.direction === "descending"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          )}
                          {sortConfig.key !== "category" && (
                            <HiMiniArrowsUpDown className="inline ml-1 text-gray-400" />
                          )}
                        </th>
                        <th
                          className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("Car Make")}
                        >
                          Car Make{" "}
                          {sortConfig.key === "make" && (
                            <HiMiniArrowsUpDown
                              className={`inline ml-1 transform ${
                                sortConfig.direction === "descending"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          )}
                          {sortConfig.key !== "make" && (
                            <HiMiniArrowsUpDown className="inline ml-1 text-gray-400" />
                          )}
                        </th>
                        <th
                          className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("Car Model")}
                        >
                          Car Model{" "}
                          {sortConfig.key === "model" && (
                            <HiMiniArrowsUpDown
                              className={`inline ml-1 transform ${
                                sortConfig.direction === "descending"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          )}
                          {sortConfig.key !== "model" && (
                            <HiMiniArrowsUpDown className="inline ml-1 text-gray-400" />
                          )}
                        </th>
                        <th
                          className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("Year of Manufacture")}
                        >
                          Year of Manufacture{" "}
                          {sortConfig.key === "year" && (
                            <HiMiniArrowsUpDown
                              className={`inline ml-1 transform ${
                                sortConfig.direction === "descending"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          )}
                          {sortConfig.key !== "year" && (
                            <HiMiniArrowsUpDown className="inline ml-1 text-gray-400" />
                          )}
                        </th>
                        <th
                          className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("Daily Pricing")}
                        >
                          Daily Pricing{" "}
                          {sortConfig.key === "price" && (
                            <HiMiniArrowsUpDown
                              className={`inline ml-1 transform ${
                                sortConfig.direction === "descending"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          )}
                          {sortConfig.key !== "price" && (
                            <HiMiniArrowsUpDown className="inline ml-1 text-gray-400" />
                          )}
                        </th>
                        <th
                          className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("License Plate Number")}
                        >
                          License Plate Number{" "}
                          {sortConfig.key === "licensePlateNumber" && (
                            <HiMiniArrowsUpDown
                              className={`inline ml-1 transform ${
                                sortConfig.direction === "descending"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          )}
                          {sortConfig.key !== "licensePlateNumber" && (
                            <HiMiniArrowsUpDown className="inline ml-1 text-gray-400" />
                          )}
                        </th>
                        <th
                          className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("Status")}
                        >
                          Status
                          {sortConfig.key === "isApproved" && (
                            <HiMiniArrowsUpDown
                              className={`inline ml-1 transform ${
                                sortConfig.direction === "descending"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          )}
                          {sortConfig.key !== "isApproved" && (
                            <HiMiniArrowsUpDown className="inline ml-1 text-gray-400" />
                          )}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Use paginatedVehicles for the current page display */}
                      {paginatedVehicles.map((vehicle) => (
                        <tr
                          key={vehicle.id}
                          className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleRowClick(vehicle)}
                        >
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {vehicle.id}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {vehicle.category}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {vehicle.make}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {vehicle.model}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {vehicle.year} {/* Use vehicle.year directly */}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {vehicle.price !== undefined &&
                            vehicle.price !== null
                              ? `${vehicle.price} Birr`
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {vehicle.licensePlateNumber || "N/A"}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-2 rounded-xl text-xs ${
                                statusColors[
                                  vehicle.isApproved === "approved"
                                    ? "Active"
                                    : vehicle.isApproved === "pending"
                                    ? "Pending Approval"
                                    : "Inactive" // Assuming 'denied' or other states map to Inactive
                                ] || "bg-gray-200 text-gray-800"
                              }`}
                            >
                              {vehicle.isApproved === "approved"
                                ? "Active"
                                : vehicle.isApproved === "pending"
                                ? "Pending Approval"
                                : vehicle.isApproved === "denied" // Added specific 'denied' check
                                ? "Inactive" // Or "Denied" if that's a status you want to show
                                : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination and Load More Indicator */}
                  {/* Show pagination if there's more than one "page" worth of filtered data OR if more data is currently being fetched */}
                  {(totalLoadedPages > 0 || isFetchingMore) && (
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      mt={4}
                      pb={isFetchingMore ? 2 : 0}
                    >
                      <Pagination
                        count={paginationCount} // Use the calculated count including the 'Load More' page
                        page={currentPage}
                        onChange={handlePageChange} // Use the modified handler
                        color="primary"
                        // Optional: Customize renderItem if you want to display "Load More" text on the last button
                        // renderItem={(item) => {
                        //    // If this is the last item AND we have more data to fetch from API
                        //    if (item.page === paginationCount && hasMore) {
                        //       return <PaginationItem {...item} sx={{ fontWeight: 'bold' }}>Load More</PaginationItem>;
                        //    }
                        //    return <PaginationItem {...item} />;
                        // }}
                      />
                      {/* Show spinner below pagination when fetching more API data */}
                      {isFetchingMore && (
                        <Box display="flex" alignItems="center" mt={2}>
                          <CircularProgress size={20} />
                          <Typography sx={{ ml: 1 }}>
                            Loading more admin vehicles...
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                  {/* Message when all API pages are loaded and displayed */}
                  {/* Show message if no more data from API AND we have loaded data AND we are showing the last page of filtered data */}
                  {!hasMore &&
                    !isFetchingMore &&
                    filteredVehicles.length > 0 &&
                    currentPage >= totalLoadedPages && (
                      <Typography
                        align="center"
                        sx={{ mt: 4, color: "text.secondary" }}
                      >
                        End of list. All admin vehicles loaded.
                      </Typography>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleManagment;
