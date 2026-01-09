// VehicleManagment.js (or VehicleManagment.jsx)
import { HiMiniArrowsUpDown } from "react-icons/hi2";
import React, { useEffect, useState, useMemo } from "react";
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
  ButtonGroup,
} from "@mui/material";

import Breadcrumbs from "@mui/material/Breadcrumbs";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import CarRentalOutlinedIcon from "@mui/icons-material/CarRentalOutlined";
import DirectionsCarFilledOutlinedIcon from "@mui/icons-material/DirectionsCarFilledOutlined";
import CarCrashOutlinedIcon from "@mui/icons-material/CarCrashOutlined";
import ApprovalOutlinedIcon from "@mui/icons-material/ApprovalOutlined";
import { Search } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";

import Account from "./Account1";
import AddCarModal from "./AddCarModal";

const VehicleManagment = () => {
  const [viewMode, setViewMode] = useState("active");
  const [adminToken, setAdminToken] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDuplicates, setShowDuplicates] = useState(false);

  const activeApiUrl =
    "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/admin/vehicles";
  // const deletedApiUrl =
  //   "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/admin/deleted_vehicles";

  useEffect(() => {
    const storedAdminJson = localStorage.getItem("admin");
    if (!storedAdminJson) return;

    try {
      const adminData = JSON.parse(storedAdminJson);
      setAdminToken(adminData?.AccessToken || null);
    } catch (e) {
      console.error("Failed to parse admin data", e);
    }
  }, []);

  const fetchAllRentals = async ({ queryKey }) => {
    const [, { token, apiUrl }] = queryKey;
    if (!token) return [];

    const fetchPage = async (lastKey = null, accumulated = []) => {
      const url = new URL(apiUrl);
      if (lastKey) {
        url.searchParams.append("lastEvaluatedKey", lastKey);
      }

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const items = Array.isArray(data.body) ? data.body : [];
      const merged = [...accumulated, ...items];

      return data.lastEvaluatedKey
        ? fetchPage(data.lastEvaluatedKey, merged)
        : merged;
    };

    return fetchPage();
  };

  // const fetchDeletedRentals =
  //   async (token) => {
  //     if (!token) return [];
  //     const response = await fetch(deletedApiUrl, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //     if (!response.ok) {
  //       throw new Error(
  //         `HTTP error fetching deleted vehicles: ${response.status}`
  //       );
  //     }
  //     const data = await response.json();
  //     return data.body?.vehicles || [];
  //   }


  const {
    data: rentals = [],
    isLoading: isLoadingList,
    isError,
    error,
  } = useQuery({
    queryKey: [
      "rentals",
      {
        token: adminToken,
        apiUrl: activeApiUrl,
      },
    ],
    queryFn: fetchAllRentals,
    enabled: !!adminToken && viewMode === "active",
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,

    select: (allRentalsData) =>
      allRentalsData.map((vehicle) => ({
        carMake: vehicle.make,
        vehicleID: vehicle.id,
        vehicleNumber: vehicle.vehicleNumber || "N/A",
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
        ownerFullName:
          `${vehicle.ownerGivenName || ""} ${vehicle.ownerSurName || ""}`.trim() ||
          "N/A",
        submissionDate: vehicle.createdAt || new Date().toISOString(),
      })),
  });


  // const {
  //   data: deletedRentals = [],
  //   error: deletedError,
  //   isLoading } = useQuery({
  //     queryKey: ['deletedRentals', adminToken],
  //     queryFn: () => fetchDeletedRentals(adminToken),
  //     enabled: !!adminToken,
  //     staleTime: 5 * 60 * 1000,

  //     select: (deletedData) =>
  //       deletedData.map((vehicle) => ({
  //         carMake: vehicle.make,
  //         vehicleID: vehicle.id,
  //         vehicleNumber: vehicle.vehicleNumber || "N/A",
  //         YearManufactured: vehicle.year,
  //         carModel: vehicle.model,
  //         status:
  //           vehicle.isApproved === "approved"
  //             ? "Active"
  //             : vehicle.isApproved === "pending"
  //               ? "Pending Approval"
  //               : "Inactive",
  //         carType: vehicle.category,
  //         ownerId: vehicle.ownerId || vehicle.owenerId,
  //         ownerFullName:
  //           `${vehicle.ownerGivenName || ""} ${vehicle.ownerSurName || ""}`.trim() ||
  //           "N/A",
  //         submissionDate: vehicle.createdAt || new Date().toISOString(),
  //       })),
  //   });


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

  const duplicateRentals = useMemo(() => {
    const plateCounts = rentals.reduce((acc, vehicle) => {
      const vNumber = vehicle.vehicleNumber;
      if (vNumber && vNumber !== "N/A") {
        acc[vNumber] = (acc[vNumber] || 0) + 1;
      }
      return acc;
    }, {});

    const duplicatePlates = Object.keys(plateCounts).filter(
      (vNumber) => plateCounts[vNumber] > 1
    );

    return rentals.filter((vehicle) =>
      duplicatePlates.includes(vehicle.vehicleNumber)
    );
  }, [rentals]);

  const activeDataSource =
    viewMode === "active"
      ? showDuplicates
        ? duplicateRentals
        : rentals
      : [];

  const filteredDataSource = activeDataSource.filter((item) => {
    if (showDuplicates) return true;

    const searchTerm = filters.search || "";
    if (viewMode === "active") {
      const carMake = item.carMake || "";
      const carModel = item.carModel || "";
      const vehicleNumber = item.vehicleNumber || "";
      const ownerName = item.ownerFullName || "";
      const searchMatch =
        carMake.toLowerCase().includes(searchTerm.toLowerCase()) ||
        carModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ownerName.toLowerCase().includes(searchTerm.toLowerCase());
      const typeMatch = filters.carType
        ? item.carType === filters.carType
        : true;
      const statusMatch = filters.status
        ? item.status === filters.status
        : true;
      return searchMatch && typeMatch && statusMatch;
    } else {
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
    if (showDuplicates) {
      const vNumA = a.vehicleNumber || "";
      const vNumB = b.vehicleNumber || "";
      if (vNumA < vNumB) return -1;
      if (vNumA > vNumB) return 1;
    }

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
    setViewMode("active");
  };

  const handleToggleDuplicates = () => {
    setShowDuplicates((prev) => !prev);
    if (!showDuplicates) {
      setSortConfig({ key: "vehicleNumber", direction: "ascending" });
    } else {
      setSortConfig({ key: null, direction: "ascending" });
    }
    setCurrentPage(1);
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

  let lastPlate = null;

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
                    {showDuplicates
                      ? "Duplicate License Plates"
                      : viewMode === "active"
                          ? "Car List"
                          : "Deleted Cars List"}
                  </h2>
                  <ButtonGroup size="small">
                    <Button
                      variant={viewMode === "active" ? "contained" : "outlined"}
                      onClick={() => {
                        setViewMode("active");
                        setShowDuplicates(false);
                      }}
                    >
                      All Vehicles
                    </Button>
                    <Button
                      variant={
                        viewMode === "deleted" ? "contained" : "outlined"
                      }
                      onClick={() => {
                        setViewMode("deleted");
                        setShowDuplicates(false);
                      }}
                      color="secondary"
                    >
                      Deleted
                    </Button>
                  </ButtonGroup>
                </div>
                <div className="flex gap-4 items-center flex-wrap">
                  <TextField
                    label="Search by Make/Model/Plate/Owner"
                    variant="outlined"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    size="small"
                    sx={{ minWidth: 220 }}
                    disabled={showDuplicates}
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
                    disabled={viewMode === "deleted" || showDuplicates}
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
                    disabled={viewMode === "deleted" || showDuplicates}
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
                  {viewMode === "active" && (
                    <Button
                      onClick={handleToggleDuplicates}
                      variant={showDuplicates ? "contained" : "outlined"}
                      size="medium"
                      color="info"
                      sx={{ height: "40px" }}
                    >
                      {showDuplicates ? "Show All" : "Find Duplicates"}
                    </Button>
                  )}
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
                  {showDuplicates
                    ? "No duplicate license plates found."
                    : "No vehicles found."}
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
                          <th
                            className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort("ownerFullName")}
                          >
                            Owner Name{" "}
                            <HiMiniArrowsUpDown
                                        className={`inline ml-1 ${sortConfig.key === "ownerFullName"
                                          ? ""
                                          : "text-gray-400"
                                          }`}
                            />
                          </th>
                          <th
                            className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort("carMake")}
                          >
                            Vehicle{" "}
                            <HiMiniArrowsUpDown
                                        className={`inline ml-1 ${sortConfig.key === "carMake"
                                          ? ""
                                          : "text-gray-400"
                                          }`}
                            />
                          </th>
                          <th
                            className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort("vehicleNumber")}
                          >
                            License Plate{" "}
                            <HiMiniArrowsUpDown
                                        className={`inline ml-1 ${sortConfig.key === "vehicleNumber"
                                          ? ""
                                          : "text-gray-400"
                                          }`}
                            />
                          </th>
                          <th
                            className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort("submissionDate")}
                          >
                            Submission Date{" "}
                            <HiMiniArrowsUpDown
                                        className={`inline ml-1 ${sortConfig.key === "submissionDate"
                                          ? ""
                                          : "text-gray-400"
                                          }`}
                            />
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
                          <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                            Vehicle
                          </th>
                          <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                            Owner Email
                          </th>
                          <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                            Deleted At
                          </th>
                          <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                            Days Left
                          </th>
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {paginatedDataSource.map((item) => {
                        let isFirstInGroup = false;
                        if (
                          showDuplicates &&
                          item.vehicleNumber !== lastPlate
                        ) {
                          isFirstInGroup = true;
                          lastPlate = item.vehicleNumber;
                        }

                        return (
                          <tr
                            key={item.vehicleID}
                            className={`border-t border-gray-200 hover:bg-gray-50 cursor-pointer ${isFirstInGroup && showDuplicates
                              ? "border-t-2 border-t-blue-300 bg-blue-50"
                              : ""
                              }`}
                            onClick={() => handleRowClick(item)}
                          >
                            {viewMode === "active" ? (
                              <>
                                <td className="px-6 py-4 text-sm text-gray-700">
                                  {item.ownerFullName}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700">
                                  <div className="font-medium">{`${item.carMake} ${item.carModel}`}</div>
                                  <div className="text-xs text-gray-500">
                                    Year: {item.YearManufactured}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                                  {item.vehicleNumber}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700">
                                  {new Date(
                                    item.submissionDate
                                  ).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`px-3 py-2 rounded-xl text-xs ${statusColors[item.status] ||
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
                                <td className="px-6 py-4 text-sm text-gray-700">{`${item.carMake} ${item.carModel} (${item.YearManufactured})`}</td>
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
                        );
                      })}
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
