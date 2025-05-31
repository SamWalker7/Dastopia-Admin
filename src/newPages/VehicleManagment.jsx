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
  PaginationItem, // Import PaginationItem if needed for custom rendering (not strictly necessary for this logic)
} from "@mui/material";

import Breadcrumbs from "@mui/material/Breadcrumbs";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import CarRentalOutlinedIcon from "@mui/icons-material/CarRentalOutlined";
import DirectionsCarFilledOutlinedIcon from "@mui/icons-material/DirectionsCarFilledOutlined";
import CarCrashOutlinedIcon from "@mui/icons-material/CarCrashOutlined";
import ApprovalOutlinedIcon from "@mui/icons-material/ApprovalOutlined";
import { Grid } from "@mui/material"; // Grid seems unused in this component's current structure, but keeping it as it was imported
import { Search } from "@mui/icons-material"; // UploadFile seems unused, removed

import Account from "./Account1"; // Assuming path is correct
import AddCarModal from "./AddCarModal"; // Assuming path is correct

const VehicleManagment = () => {
  const [rentals, setRentals] = useState([]);
  const [adminToken, setAdminToken] = useState(null);
  // isLoadingList indicates the very first load. isFetchingMore for subsequent 'Load More' clicks.
  // Start isLoadingList as true to show initial loading on mount.
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null); // To store the key for the next fetch
  // Assume there's more data until the first fetch response proves otherwise
  const [hasMore, setHasMore] = useState(true);

  // --- MISSING STATE DECLARATION ---
  const [currentPage, setCurrentPage] = useState(1); // Add this line
  // --- END MISSING STATE DECLARATION ---

  const apiUrl =
    "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/admin/vehicles";

  // Define fetchRentals using useCallback, including all state setters it uses
  const fetchRentals = useCallback(
    async (token, key = null) => {
      // Defensive check: if somehow called without a token
      if (!token) {
        console.log("Admin token not available during fetch attempt.");
        setRentals([]);
        setLastEvaluatedKey(null);
        setHasMore(false);
        // Ensure loading states are false if fetch wasn't possible
        setIsLoadingList(false);
        setIsFetchingMore(false);
        return;
      }

      // Set the appropriate loading state *before* the async operation
      // isLoadingList is for the very first load, isFetchingMore for subsequent 'Load More' clicks.
      if (key === null) {
        // setIsLoadingList(true); // Already set true by the useEffect caller
      } else {
        setIsFetchingMore(true); // Set fetchingMore for subsequent calls with a key
      }

      try {
        const url = new URL(apiUrl);
        // Add lastEvaluatedKey parameter if a key is provided
        if (key) {
          url.searchParams.append("lastEvaluatedKey", key);
        }
        console.log(
          `Fetching vehicles with token and key=${key || "null"}:`,
          url.toString()
        );

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
            setAdminToken(null); // Clear token state on auth failure
            setRentals([]); // Clear data associated with old token
            setLastEvaluatedKey(null);
            setHasMore(false);
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched vehicle data:", data);

        if (data && data.body && Array.isArray(data.body)) {
          const formattedRentals = data.body.map((vehicle) => ({
            carMake: vehicle.make,
            vehicleID: vehicle.id,
            plate: vehicle.licensePlateNumber || "N/A",
            YearManufactured: vehicle.year,
            carModel: vehicle.model,
            status:
              vehicle.isApproved === "approved"
                ? "Active"
                : vehicle.isApproved === "pending"
                ? "Pending Approval"
                : "Inactive",
            carType: vehicle.category,
            // Include owner details needed for the Account page lookup later
            ownerId: vehicle.ownerId || vehicle.owenerId, // Use consistent key name
          }));

          // Append new data if a key was provided (fetching more), otherwise replace (initial fetch)
          setRentals((prevRentals) =>
            key ? [...prevRentals, ...formattedRentals] : formattedRentals
          );

          // Update lastEvaluatedKey and hasMore based on the response
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
            // Only clear data on initial load if response format is bad
            setRentals([]);
          }
          setLastEvaluatedKey(null); // No key means no more data
          setHasMore(false);
        }
      } catch (error) {
        console.error("Error fetching rentals:", error);
        if (key === null) {
          // Clear rentals on initial error
          setRentals([]);
        }
        setLastEvaluatedKey(null);
        setHasMore(false); // Assume no more data on error
        // TODO: Set an error state state to display to the user if needed
      } finally {
        // Always stop the appropriate loading state
        if (key === null) {
          setIsLoadingList(false); // Stop initial loading
        } else {
          setIsFetchingMore(false); // Stop 'fetching more' loading
        }
      }
    },
    // Add all state setters and external variables used inside fetchRentals to useCallback dependencies
    [
      apiUrl,
      setRentals,
      setLastEvaluatedKey,
      setHasMore,
      setCurrentPage,
      setAdminToken,
      setIsLoadingList,
      setIsFetchingMore,
    ]
  );

  // Effect to get admin token from localStorage AND trigger the initial fetch
  useEffect(() => {
    // Ensure loading is true when this effect starts, in case it reruns unexpectedly
    setIsLoadingList(true);

    const storedAdminJson = localStorage.getItem("admin");
    let token = null; // Use a local variable first

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

    // Now, if we successfully found a token, trigger the initial data fetch
    if (token) {
      console.log(
        "Admin token found, initiating initial vehicle list fetch..."
      );
      // Call fetchRentals with the token and null key for the first page.
      // fetchRentals will set isLoadingList to false in its finally block.
      fetchRentals(token, null);
    } else {
      // If no token was found, we can't fetch. Stop loading and reflect empty state.
      console.log("No admin token found, cannot fetch vehicle list.");
      setRentals([]); // Ensure list is empty
      setLastEvaluatedKey(null); // No key
      setHasMore(false); // No data, so no more data
      setIsLoadingList(false); // Stop loading as no fetch happened
    }

    // This effect should run only once on mount to initiate the token check and first fetch.
    // Its dependency array needs fetchRentals because fetchRentals is called inside.
  }, [fetchRentals]); // Dependency on fetchRentals

  const [filters, setFilters] = useState({
    search: "",
    carType: "",
    status: "",
  });

  const itemsPerPage = 8; // Number of items to display per page

  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [showAccount, setShowAccount] = useState(false);

  const [openAddCarModal, setOpenAddCarModal] = useState(false);

  const statusColors = {
    "Pending Approval": "bg-[#F6DE95] text-[#816204] font-bold",
    Active: "bg-[#A0E6BA] text-[#136C34] font-bold",
    Inactive: "bg-[#FEE2E2] text-[#991B1B] font-bold",
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
    setCurrentPage(1); // Reset pagination to page 1 on filter change
    // Note: Filtering/sorting happens client-side on *all* loaded data.
    // If you needed server-side filtering/sorting, you would refetch from page 1
    // via fetchRentals(adminToken, null) after changing filters.
  };

  // Filtering logic applied to the *cumulative* list of rentals
  const filteredRentals = rentals.filter((rental) => {
    const carMake = rental.carMake || "";
    const carModel = rental.carModel || "";
    const plate = rental.plate || "";
    const searchTerm = filters.search || "";

    const searchMatch =
      carMake.toLowerCase().includes(searchTerm.toLowerCase()) ||
      carModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plate.toLowerCase().includes(searchTerm.toLowerCase());

    const typeMatch = filters.carType
      ? rental.carType === filters.carType
      : true;
    const statusMatch = filters.status
      ? rental.status === filters.status
      : true;

    return searchMatch && typeMatch && statusMatch;
  });

  // Sorting logic applied to the *filtered* list
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  const sortedRentals = [...filteredRentals].sort((a, b) => {
    if (sortConfig.key) {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle null/undefined values during sorting
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === "ascending" ? 1 : -1; // Nulls last in ascending
      if (bValue == null) return sortConfig.direction === "ascending" ? -1 : 1; // Nulls last in ascending

      if (sortConfig.key === "YearManufactured") {
        // Handle non-numeric years gracefully
        const numA = Number(aValue);
        const numB = Number(bValue);

        if (isNaN(numA) && isNaN(numB)) return 0; // Both invalid, treat as equal
        if (isNaN(numA)) return sortConfig.direction === "ascending" ? 1 : -1; // Invalid years last
        if (isNaN(numB)) return sortConfig.direction === "ascending" ? -1 : 1; // Invalid years last

        return sortConfig.direction === "ascending" ? numA - numB : numB - numA;
      }

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
    return 0;
  });

  const handleSort = (key) => {
    let direction = "ascending";
    // If already sorting by this key, cycle direction or reset
    if (sortConfig.key === key) {
      if (sortConfig.direction === "ascending") {
        direction = "descending";
      } else {
        // Cycle from descending back to no sort
        setSortConfig({ key: null, direction: "ascending" });
        return;
      }
    }
    // Set new sort config
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Determine the slice of data for the current page from the sorted & filtered list
  const paginatedRentals = sortedRentals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate total pages based on the *loaded and filtered* data
  const totalLoadedPages = Math.ceil(filteredRentals.length / itemsPerPage);

  // Calculate the total number of pages to show in the pagination control.
  // This is the number of standard pages plus one extra 'Load More' page if hasMore is true.
  const paginationCount = totalLoadedPages + (hasMore ? 1 : 0);

  // Handle pagination clicks
  const handlePageChange = (event, value) => {
    // Check if the clicked page number is the one representing the 'Load More' action.
    // This happens when 'value' is exactly one more than the number of pages
    // calculated from the currently loaded and filtered data.
    if (
      value > totalLoadedPages &&
      hasMore &&
      !isFetchingMore &&
      adminToken &&
      lastEvaluatedKey
    ) {
      console.log(
        "Clicked 'Load More' page:",
        value,
        "Attempting to fetch next batch with key:",
        lastEvaluatedKey
      );
      // Trigger fetching the next batch using the lastEvaluatedKey
      fetchRentals(adminToken, lastEvaluatedKey);
      // Do NOT update currentPage here. The user stays on the last page of the old data.
      // The pagination component will update its count when the new data arrives,
      // and the user will still be viewing the same range, but more pages will be available.
    } else if (value <= totalLoadedPages) {
      // This is a standard page navigation within the data already loaded.
      setCurrentPage(value);
      // Optional: Scroll to top of table/list on page change
      // Consider adding a ref to the table container and scrolling it
      // const tableContainer = document.querySelector('.overflow-x-auto');
      // if(tableContainer) {
      //     tableContainer.scrollTo({ top: 0, behavior: 'smooth' });
      // } else {
      //      window.scrollTo({ top: 0, behavior: 'smooth' });
      // }
    }
    // If value > totalLoadedPages but hasMore is false, or already fetching, do nothing.
  };

  const handleRowClick = (rental) => {
    // When clicking a row, pass the vehicleID to the Account component.
    // The Account component should ideally fetch the full detailed data for that vehicle.
    setSelectedVehicleId(rental.vehicleID);
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

  const handleOpenAddCarModal = () => {
    setOpenAddCarModal(true);
  };

  const handleCloseAddCarModal = () => {
    setOpenAddCarModal(false);
    // Refetch rentals when the modal is closed, assuming a car might have been added
    // This will refetch from the beginning, ensuring the new car is included if it's in the first batch.
    if (adminToken) {
      console.log("Add car modal closed, refetching vehicle list...");
      // Reset pagination state before refetching from the start
      setRentals([]); // Clear current list
      setLastEvaluatedKey(null); // Reset key
      setHasMore(true); // Assume there's data until proven otherwise by the fetch
      setCurrentPage(1); // Reset to the first page
      fetchRentals(adminToken, null); // Fetch from the beginning
    }
  };

  // Stats calculations are based on the *full* loaded rentals array
  // Note: If using server-side pagination without cumulative loading, these stats
  // would only reflect the current page or require a separate API call for totals.
  // With cumulative loading, these reflect all data fetched so far.
  const totalVehicles = rentals.length;
  const activeVehicles = rentals.filter((r) => r.status === "Active").length;
  const pendingApprovalVehicles = rentals.filter(
    (r) => r.status === "Pending Approval"
  ).length;
  const deactivatedVehicles = rentals.filter(
    (r) => r.status === "Inactive"
  ).length;

  // Conditional messages based on loading/data state
  const showNoTokenMessage = !isLoadingList && !adminToken;
  const showNoVehiclesMessage =
    !isLoadingList &&
    adminToken &&
    rentals.length === 0 &&
    !filters.search &&
    !filters.carType &&
    !filters.status;
  const showNoFilteredDataMessage =
    !isLoadingList &&
    filteredRentals.length === 0 &&
    (filters.search || filters.carType || filters.status);
  const showTable =
    !isLoadingList &&
    !showNoTokenMessage &&
    !showNoVehiclesMessage &&
    !showNoFilteredDataMessage;

  return (
    <div className="flex flex-col">
      <Box pb={3} pl={1}>
        <span className="text-xl">Vehicle Management</span>
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
        // Account component should use this token to fetch details for selectedVehicleId
        <Account vehicleId={selectedVehicleId} adminToken={adminToken} />
      ) : (
        <div>
          <div className="flex gap-10 mb-10">
            {/* Status Cards */}
            {/* These stats reflect the counts of all vehicles *currently loaded*. */}
            <div>
              <div className="bg-white drop-shadow-xs pr-32 shadow-xs flex flex-col shadow-blue-100 rounded-2xl p-4">
                <DirectionsCarFilledOutlinedIcon color="primary" />
                <Typography variant="h6">{totalVehicles}</Typography>
                <Typography variant="body2">
                  Total Vehicles (Loaded)
                </Typography>{" "}
                {/* Indicate loaded count */}
              </div>
            </div>
            <div>
              <div className="bg-white drop-shadow-xs pr-32 shadow-xs flex flex-col shadow-blue-100 rounded-2xl p-4">
                <CarRentalOutlinedIcon color="success" />
                <Typography variant="h6">{activeVehicles}</Typography>
                <Typography variant="body2">
                  Active Vehicles (Loaded)
                </Typography>
              </div>
            </div>
            <div>
              <div className="bg-white drop-shadow-xs pr-32 shadow-xs flex flex-col shadow-blue-100 rounded-2xl p-4">
                <ApprovalOutlinedIcon color="warning" />
                <Typography variant="h6">{pendingApprovalVehicles}</Typography>
                <Typography variant="body2">
                  Pending Approval (Loaded)
                </Typography>
              </div>
            </div>
            <div>
              <div className="bg-white drop-shadow-xs pr-32 shadow-xs flex flex-col shadow-blue-100 rounded-2xl p-4">
                <CarCrashOutlinedIcon color="error" />
                <Typography variant="h6">{deactivatedVehicles}</Typography>
                <Typography variant="body2">
                  Inactive Vehicles (Loaded)
                </Typography>
              </div>
            </div>
          </div>

          <div className="bg-white w-full drop-shadow-xs shadow-blue-200 py-4 shadow-xs rounded-lg">
            <div className="px-2 rounded-lg">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-sm font-semibold pl-2 my-4 flex-shrink-0">
                  Car List
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
                      {/* Add other types as needed */}
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
                    </Select>
                  </FormControl>
                  <button
                    onClick={handleOpenAddCarModal}
                    className="bg-[#00173C] cursor-pointer w-28 justify-center h-fit text-xs text-white flex items-center shadow-lg px-4 py-3 rounded-4xl"
                  >
                    Add Car
                  </button>
                </div>
              </div>

              <AddCarModal
                open={openAddCarModal}
                onClose={handleCloseAddCarModal}
                adminToken={adminToken} // Pass token to modal if it needs it for its own API calls
                onSuccess={handleCloseAddCarModal} // Call the handler that refetches on success
              />

              {/* Conditional rendering for table/loading/empty states */}
              {isLoadingList && rentals.length === 0 ? ( // Show main loader only when no data is loaded yet
                <Box
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  minHeight="200px"
                >
                  <CircularProgress />
                  <Typography sx={{ mt: 2 }}>
                    Loading initial vehicle list...
                  </Typography>
                </Box>
              ) : showNoTokenMessage ? (
                <Typography variant="body1" align="center" sx={{ py: 4 }}>
                  Please log in to view vehicles.
                </Typography>
              ) : showNoVehiclesMessage ? (
                <Typography variant="body1" align="center" sx={{ py: 4 }}>
                  No vehicles found for this admin account.
                </Typography>
              ) : showNoFilteredDataMessage ? (
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
                          onClick={() => handleSort("carType")}
                        >
                          Car Type {/* Add sorting icons */}
                          {sortConfig.key === "carType" && (
                            <HiMiniArrowsUpDown
                              className={`inline ml-1 transform ${
                                sortConfig.direction === "descending"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          )}
                          {sortConfig.key !== "carType" && (
                            <HiMiniArrowsUpDown className="inline ml-1 text-gray-400" />
                          )}
                        </th>
                        <th
                          className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("carMake")}
                        >
                          Car Make{" "}
                          {sortConfig.key === "carMake" && (
                            <HiMiniArrowsUpDown
                              className={`inline ml-1 transform ${
                                sortConfig.direction === "descending"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          )}
                          {sortConfig.key !== "carMake" && (
                            <HiMiniArrowsUpDown className="inline ml-1 text-gray-400" />
                          )}
                        </th>
                        <th
                          className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("carModel")}
                        >
                          Car Model{" "}
                          {sortConfig.key === "carModel" && (
                            <HiMiniArrowsUpDown
                              className={`inline ml-1 transform ${
                                sortConfig.direction === "descending"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          )}
                          {sortConfig.key !== "carModel" && (
                            <HiMiniArrowsUpDown className="inline ml-1 text-gray-400" />
                          )}
                        </th>
                        <th
                          className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("YearManufactured")}
                        >
                          Year of Manufacture{" "}
                          {sortConfig.key === "YearManufactured" && (
                            <HiMiniArrowsUpDown
                              className={`inline ml-1 transform ${
                                sortConfig.direction === "descending"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          )}
                          {sortConfig.key !== "YearManufactured" && (
                            <HiMiniArrowsUpDown className="inline ml-1 text-gray-400" />
                          )}
                        </th>
                        <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                          License Plate Number
                        </th>
                        <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Use paginatedRentals for the current page display */}
                      {paginatedRentals.map((rental) => (
                        <tr
                          key={rental.vehicleID}
                          className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleRowClick(rental)}
                        >
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {rental.vehicleID}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {rental.carType}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {rental.carMake}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {rental.carModel}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {rental.YearManufactured}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {rental.plate}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-2 rounded-xl text-xs ${
                                statusColors[rental.status] ||
                                "bg-gray-200 text-gray-800"
                              }`}
                            >
                              {rental.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination and Load More Indicator */}
                  {/* Show pagination if there's more than one "page" worth of data *including the load more page* */}
                  {(paginationCount > 1 || isFetchingMore) && (
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
                        // Optional: Customize renderItem to display "Load More" text on the last page number
                        // renderItem={(item) => (
                        //   <PaginationItem
                        //     {...item}
                        //     // If this is the last page number AND we have more data, change the text
                        //     // Note: Material UI PaginationItem's text isn't easily customized like this
                        //     // without complex logic, clicking the number is the standard approach.
                        //     // You could, however, render a Button instead of the last item if needed.
                        //   />
                        // )}
                      />
                      {/* Show spinner below pagination when fetching more */}
                      {isFetchingMore && (
                        <Box display="flex" alignItems="center" mt={2}>
                          <CircularProgress size={20} />
                          <Typography sx={{ ml: 1 }}>
                            Loading more vehicles...
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                  {/* Message when all pages are loaded and displayed */}
                  {!hasMore &&
                    !isFetchingMore &&
                    filteredRentals.length > 0 &&
                    paginatedRentals.length < filteredRentals.length && (
                      <Typography
                        align="center"
                        sx={{ mt: 4, color: "text.secondary" }}
                      >
                        End of list. All vehicles loaded.
                      </Typography>
                    )}
                  {/* Message when all loaded data fits on the current page */}
                  {!hasMore &&
                    !isFetchingMore &&
                    filteredRentals.length > 0 &&
                    paginatedRentals.length === filteredRentals.length &&
                    totalLoadedPages <= 1 && (
                      <Typography
                        align="center"
                        sx={{ mt: 4, color: "text.secondary" }}
                      >
                        All vehicles displayed.
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
