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
  ButtonGroup, // Added for the view toggle
} from "@mui/material";

import Breadcrumbs from "@mui/material/Breadcrumbs";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import CarRentalOutlinedIcon from "@mui/icons-material/CarRentalOutlined";
import DirectionsCarFilledOutlinedIcon from "@mui/icons-material/DirectionsCarFilledOutlined";
import CarCrashOutlinedIcon from "@mui/icons-material/CarCrashOutlined";
import ApprovalOutlinedIcon from "@mui/icons-material/ApprovalOutlined";
import { Grid } from "@mui/material";
import { Search } from "@mui/icons-material";

import Account from "./Account1";
import AddCarModal from "./AddCarModal";

const VehicleManagment = () => {
  const [rentals, setRentals] = useState([]);
  const [deletedRentals, setDeletedRentals] = useState([]); // State for deleted vehicles
  const [viewMode, setViewMode] = useState("active"); // 'active' or 'deleted'
  const [adminToken, setAdminToken] = useState(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const activeApiUrl =
    "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/admin/vehicles";
  const deletedApiUrl =
    "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/admin/deleted_vehicles";

  const fetchAllRentals = useCallback(
    async (token, key = null, accumulatedRentals = []) => {
      if (!token) return [];
      const url = new URL(activeApiUrl);
      if (key) url.searchParams.append("lastEvaluatedKey", key);
      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const newRentals = data.body && Array.isArray(data.body) ? data.body : [];
      const allSoFar = [...accumulatedRentals, ...newRentals];
      if (data.lastEvaluatedKey) {
        return await fetchAllRentals(token, data.lastEvaluatedKey, allSoFar);
      }
      return allSoFar;
    },
    [activeApiUrl]
  );

  const fetchDeletedRentals = useCallback(
    async (token) => {
      if (!token) return [];
      console.log("Fetching deleted vehicles...");
      const response = await fetch(deletedApiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(
          `HTTP error fetching deleted vehicles: ${response.status}`
        );
      }
      const data = await response.json();
      console.log("Deleted vehicles data:", data);
      return data.body?.vehicles || [];
    },
    [deletedApiUrl]
  );

  useEffect(() => {
    const initiateFetch = async () => {
      setIsLoadingList(true);
      setRentals([]);
      setDeletedRentals([]);
      setCurrentPage(1);

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
        try {
          if (viewMode === "active") {
            console.log("Starting to fetch all active vehicles...");
            const allRentalsData = await fetchAllRentals(token);
            const formattedRentals = allRentalsData.map((vehicle) => ({
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
              ownerId: vehicle.ownerId || vehicle.owenerId,
            }));
            setRentals(formattedRentals);
          } else {
            // viewMode is 'deleted'
            const deletedData = await fetchDeletedRentals(token);
            const formattedDeleted = deletedData.map((v) => ({
              vehicleID: v.id,
              carMake: v.make,
              carModel: v.model,
              YearManufactured: v.year,
              ownerEmail: v.ownerEmail || "N/A",
              deletedAt: new Date(v.deletedAt).toLocaleDateString(),
              daysUntilPermanentDeletion: v.daysUntilPermanentDeletion,
            }));
            setDeletedRentals(formattedDeleted);
          }
        } catch (error) {
          console.error("Error during data fetch:", error);
          setAdminToken(null);
        } finally {
          setIsLoadingList(false);
        }
      } else {
        console.warn("No admin token found.");
        setIsLoadingList(false);
      }
    };

    initiateFetch();
  }, [viewMode, fetchAllRentals, fetchDeletedRentals]);

  const [filters, setFilters] = useState({
    search: "",
    carType: "",
    status: "",
  });

  const itemsPerPage = 8;
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
    setFilters({ ...filters, [name]: value });
    setCurrentPage(1);
  };

  const activeDataSource = viewMode === "active" ? rentals : deletedRentals;

  const filteredDataSource = activeDataSource.filter((item) => {
    const searchTerm = filters.search || "";
    if (viewMode === "active") {
      const carMake = item.carMake || "";
      const carModel = item.carModel || "";
      const plate = item.plate || "";
      const searchMatch =
        carMake.toLowerCase().includes(searchTerm.toLowerCase()) ||
        carModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plate.toLowerCase().includes(searchTerm.toLowerCase());
      const typeMatch = filters.carType
        ? item.carType === filters.carType
        : true;
      const statusMatch = filters.status
        ? item.status === filters.status
        : true;
      return searchMatch && typeMatch && statusMatch;
    } else {
      // Filtering for deleted view
      const carMake = item.carMake || "";
      const carModel = item.carModel || "";
      const ownerEmail = item.ownerEmail || "";
      return (
        carMake.toLowerCase().includes(searchTerm.toLowerCase()) ||
        carModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  });

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  const sortedDataSource = [...filteredDataSource].sort((a, b) => {
    if (sortConfig.key) {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === "ascending" ? 1 : -1;
      if (bValue == null) return sortConfig.direction === "ascending" ? -1 : 1;
      if (
        sortConfig.key === "YearManufactured" ||
        sortConfig.key === "daysUntilPermanentDeletion"
      ) {
        const numA = Number(aValue);
        const numB = Number(bValue);
        if (isNaN(numA) && isNaN(numB)) return 0;
        if (isNaN(numA)) return sortConfig.direction === "ascending" ? 1 : -1;
        if (isNaN(numB)) return sortConfig.direction === "ascending" ? -1 : 1;
        return sortConfig.direction === "ascending" ? numA - numB : numB - numA;
      }
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    }
    return 0;
  });

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key) {
      direction =
        sortConfig.direction === "ascending" ? "descending" : "ascending";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const paginatedDataSource = sortedDataSource.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredDataSource.length / itemsPerPage);
  const handlePageChange = (event, value) => setCurrentPage(value);
  const handleRowClick = (rental) => {
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

  const handleOpenAddCarModal = () => setOpenAddCarModal(true);
  const handleCloseAddCarModal = () => {
    setOpenAddCarModal(false);
    // After adding a car, switch to active view to see it, which triggers a refetch
    setViewMode("active");
  };

  const totalVehicles = rentals.length;
  const activeVehicles = rentals.filter((r) => r.status === "Active").length;
  const pendingApprovalVehicles = rentals.filter(
    (r) => r.status === "Pending Approval"
  ).length;
  const deactivatedVehicles = rentals.filter(
    (r) => r.status === "Inactive"
  ).length;

  const showNoTokenMessage = !isLoadingList && !adminToken;
  const showNoDataMessage =
    !isLoadingList && adminToken && activeDataSource.length === 0;
  const showNoFilteredDataMessage =
    !isLoadingList &&
    filteredDataSource.length === 0 &&
    activeDataSource.length > 0;

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
        <Account vehicleId={selectedVehicleId} adminToken={adminToken} />
      ) : (
        <div>
          {viewMode === "active" && (
            <div className="flex gap-10 mb-10 flex-wrap">
              <div className="bg-white drop-shadow-xs pr-32 shadow-xs flex flex-col shadow-blue-100 rounded-2xl p-4">
                <DirectionsCarFilledOutlinedIcon color="primary" />
                <Typography variant="h6">{totalVehicles}</Typography>
                <Typography variant="body2">Total Vehicles</Typography>
              </div>
              <div className="bg-white drop-shadow-xs pr-32 shadow-xs flex flex-col shadow-blue-100 rounded-2xl p-4">
                <CarRentalOutlinedIcon color="success" />
                <Typography variant="h6">{activeVehicles}</Typography>
                <Typography variant="body2">Active Vehicles</Typography>
              </div>
              <div className="bg-white drop-shadow-xs pr-32 shadow-xs flex flex-col shadow-blue-100 rounded-2xl p-4">
                <ApprovalOutlinedIcon color="warning" />
                <Typography variant="h6">{pendingApprovalVehicles}</Typography>
                <Typography variant="body2">Pending Approval</Typography>
              </div>
              <div className="bg-white drop-shadow-xs pr-32 shadow-xs flex flex-col shadow-blue-100 rounded-2xl p-4">
                <CarCrashOutlinedIcon color="error" />
                <Typography variant="h6">{deactivatedVehicles}</Typography>
                <Typography variant="body2">Inactive Vehicles</Typography>
              </div>
            </div>
          )}

          <div className="bg-white w-full drop-shadow-xs shadow-blue-200 py-4 shadow-xs rounded-lg">
            <div className="px-2 rounded-lg">
              <div className="flex items-center justify-between gap-4 flex-wrap p-2">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-semibold pl-2 flex-shrink-0">
                    {viewMode === "active" ? "Car List" : "Deleted Cars List"}
                  </h2>
                  <ButtonGroup size="small">
                    <Button
                      variant={viewMode === "active" ? "contained" : "outlined"}
                      onClick={() => setViewMode("active")}
                    >
                      All Vehicles
                    </Button>
                    <Button
                      variant={
                        viewMode === "deleted" ? "contained" : "outlined"
                      }
                      onClick={() => setViewMode("deleted")}
                      color="secondary"
                    >
                      Deleted
                    </Button>
                  </ButtonGroup>
                </div>
                <div className="flex gap-4 items-center flex-wrap">
                  <TextField
                    label={
                      viewMode === "active"
                        ? "Search by Make/Model/Plate"
                        : "Search by Make/Model/Email"
                    }
                    variant="outlined"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    size="small"
                    sx={{ minWidth: 220 }}
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
                    disabled={viewMode === "deleted"}
                  >
                    <InputLabel size="small">Car Type</InputLabel>
                    <Select
                      label="Car Type"
                      name="carType"
                      value={filters.carType}
                      onChange={handleFilterChange}
                      size="small"
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="Sedan">Sedan</MenuItem>
                      <MenuItem value="SUV">SUV</MenuItem>
                      <MenuItem value="Hatchback">Hatchback</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl
                    variant="outlined"
                    sx={{ minWidth: 120 }}
                    size="small"
                    disabled={viewMode === "deleted"}
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
                adminToken={adminToken}
                onSuccess={handleCloseAddCarModal}
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
                    Loading vehicles, please wait...
                  </Typography>
                </Box>
              ) : showNoTokenMessage ? (
                <Typography variant="body1" align="center" sx={{ py: 4 }}>
                  Please log in to view vehicles.
                </Typography>
              ) : showNoDataMessage ? (
                <Typography variant="body1" align="center" sx={{ py: 4 }}>
                  No vehicles found.
                </Typography>
              ) : showNoFilteredDataMessage ? (
                <Typography variant="body1" align="center" sx={{ py: 4 }}>
                  No vehicles match your current filters.
                </Typography>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-x-0 border-t-0 border-gray-100 rounded-lg">
                    {viewMode === "active" ? (
                      <thead>
                        <tr className="bg-gray-50 font-semibold">
                          <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                            Vehicle ID
                          </th>
                          <th
                            className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort("carType")}
                          >
                            Car Type{" "}
                            {sortConfig.key === "carType" ? (
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
                            onClick={() => handleSort("carMake")}
                          >
                            Car Make{" "}
                            {sortConfig.key === "carMake" ? (
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
                            onClick={() => handleSort("carModel")}
                          >
                            Car Model{" "}
                            {sortConfig.key === "carModel" ? (
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
                            onClick={() => handleSort("YearManufactured")}
                          >
                            Year{" "}
                            {sortConfig.key === "YearManufactured" ? (
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
                            License Plate
                          </th>
                          <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                            Status
                          </th>
                        </tr>
                      </thead>
                    ) : (
                      <thead>
                        <tr className="bg-red-50 font-semibold">
                          <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                            Vehicle ID
                          </th>
                          <th
                            className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer hover:bg-red-100"
                            onClick={() => handleSort("carMake")}
                          >
                            Car Make{" "}
                            {sortConfig.key === "carMake" ? (
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
                            className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer hover:bg-red-100"
                            onClick={() => handleSort("carModel")}
                          >
                            Car Model{" "}
                            {sortConfig.key === "carModel" ? (
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
                            Owner Email
                          </th>
                          <th
                            className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer hover:bg-red-100"
                            onClick={() => handleSort("deletedAt")}
                          >
                            Deleted At{" "}
                            {sortConfig.key === "deletedAt" ? (
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
                            className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer hover:bg-red-100"
                            onClick={() =>
                              handleSort("daysUntilPermanentDeletion")
                            }
                          >
                            Days Left{" "}
                            {sortConfig.key === "daysUntilPermanentDeletion" ? (
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
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {paginatedDataSource.map((item) => (
                        <tr
                          key={item.vehicleID}
                          className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleRowClick(item)}
                        >
                          {viewMode === "active" ? (
                            <>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {item.vehicleID}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {item.carType}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {item.carMake}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {item.carModel}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {item.YearManufactured}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {item.plate}
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
                            </>
                          ) : (
                            <>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {item.vehicleID}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {item.carMake}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {item.carModel}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {item.ownerEmail}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {item.deletedAt}
                              </td>
                              <td className="px-6 py-4 text-sm text-red-600 font-medium">
                                {item.daysUntilPermanentDeletion}
                              </td>
                            </>
                          )}
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
      )}
    </div>
  );
};

export default VehicleManagment;
