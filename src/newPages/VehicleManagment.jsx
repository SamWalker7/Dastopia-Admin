// VehicleManagment.js (or VehicleManagment.jsx)
import { HiMiniArrowsUpDown } from "react-icons/hi2";
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
  // InputAdornment was removed here, need to add it back
  InputAdornment, // <--- Add this back
  Typography,
  Link,
} from "@mui/material";

import Breadcrumbs from "@mui/material/Breadcrumbs";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import CarRentalOutlinedIcon from "@mui/icons-material/CarRentalOutlined";
import DirectionsCarFilledOutlinedIcon from "@mui/icons-material/DirectionsCarFilledOutlined";
import CarCrashOutlinedIcon from "@mui/icons-material/CarCrashOutlined";
import ApprovalOutlinedIcon from "@mui/icons-material/ApprovalOutlined";
import { Grid } from "@mui/material";
import { Search, UploadFile } from "@mui/icons-material";

import Account from "./Account1"; // Import the Account component
import AddCarModal from "./AddCarModal"; // Import the new AddCarModal component

const VehicleManagment = () => {
  const [rentals, setRentals] = useState([]);
  const admin = JSON.parse(localStorage.getItem("admin")); // Ensure this loads correctly
  const [adminToken, setAdminToken] = useState(null); // State for fetched users, loading, and error
  useEffect(() => {
    const storedAdminJson = localStorage.getItem("admin");
    if (storedAdminJson) {
      try {
        const adminData = JSON.parse(storedAdminJson); // Assuming the token is stored as AccessToken property
        if (adminData && adminData.AccessToken) {
          setAdminToken(adminData.AccessToken);
          // Initial fetch will be triggered by the effect below which watches adminToken
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
  }, []); // Empty dependency array means this runs only once on mount // --- Effect to fetch users when token is available and view is list ---

  const apiUrl =
    "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/admin/vehicles";

  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const response = await fetch(apiUrl, {
          headers: {
            // Include Authorization header
            Authorization: `Bearer ${admin.AccessToken}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Process the API response to match your desired state structure
        const formattedRentals = data.body.map((vehicle) => ({
          carMake: vehicle.make,
          vehicleID: vehicle.id,
          plate: vehicle.licensePlateNumber || null, // Use actual plate if available, otherwise null
          YearManufactured: vehicle.year, // Assuming year is in the response
          carModel: vehicle.model,
          status: vehicle.isApproved === "approved" ? "Active" : "Inactive", // Adjust status mapping as needed
          carType: vehicle.category, // Assuming category maps to carType
        }));
        setRentals(formattedRentals);
      } catch (error) {
        console.error("Error fetching rentals:", error);
        // Optionally set an error state to display an error message to the user
      }
    };

    fetchRentals();
  }, []);

  const [filters, setFilters] = useState({
    search: "",
    carType: "",
    status: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // State related to showing the Account view
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [showAccount, setShowAccount] = useState(false);

  // State related to the Add Car Modal
  const [openAddCarModal, setOpenAddCarModal] = useState(false); // Renamed for clarity

  const statusColors = {
    Invited: "bg-[#F6DE95] text-[#816204] font-bold",
    Active: "bg-[#A0E6BA] text-[#136C34] font-bold",
    Inactive: "bg-[#FEE2E2] text-[#991B1B] font-bold",
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const filteredRentals = rentals.filter((rental) => {
    const carMake = rental.carMake || "";
    const carModel = rental.carModel || "";
    const searchTerm = filters.search || "";

    const combinedMakeModel = `${carMake} ${carModel}`.toLowerCase();

    return (
      (carMake.toLowerCase().includes(searchTerm.toLowerCase()) ||
        carModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        combinedMakeModel.includes(searchTerm.toLowerCase())) &&
      (filters.carType ? rental.carType === filters.carType : true) &&
      (filters.status ? rental.status === filters.status : true)
    );
  });

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleRowClick = (rental) => {
    setSelectedVehicleId(rental.vehicleID);
    setShowAccount(true);
  };

  const breadcrumbs = showAccount
    ? [
        <Link underline="hover" key="1" color="inherit" href="/">
          <HomeOutlinedIcon />
        </Link>,
        <button
          key="2"
          color="inherit"
          className="cursor-pointer hover:text-blue-800"
          onClick={() => setShowAccount(false)} // Go back to vehicle list
        >
          Vehicle Management
        </button>,
        <Typography key="3" sx={{ color: "text.primary" }}>
          Account
        </Typography>,
      ]
    : [
        <Link underline="hover" key="1" color="inherit" href="/">
          <HomeOutlinedIcon />
        </Link>,
        <Typography key="2" sx={{ color: "text.primary" }}>
          Vehicle Management
        </Typography>,
      ];

  // Handlers for the Add Car Modal
  const handleOpenAddCarModal = () => {
    setOpenAddCarModal(true);
  };

  const handleCloseAddCarModal = () => {
    setOpenAddCarModal(false);
  };

  // This function will be called by the AddCarModal when the form is submitted
  const handleAddCarSubmit = (formData) => {
    console.log("Received form data from modal:", formData);
    // TODO: Implement the actual API call here to add the new car
    // You'll need to make a POST request to your vehicle API endpoint
    // using the formData received. Handle file upload separately if needed.
    // Example structure for a POST request:
    /*
      const addCarApiUrl = "YOUR_ADD_CAR_API_ENDPOINT"; // Replace with your actual endpoint
      try {
          const response = await fetch(addCarApiUrl, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json', // Or multipart/form-data if sending file directly
                  // Add Authorization header if required
              },
              body: JSON.stringify({
                 // Map formData fields to your API expected payload structure
                 make: formData.carMake,
                 model: formData.carModel,
                 year: formData.manufacturingDate, // Or just year part if API expects that
                 category: formData.carType,
                 // ... other fields
              })
          });
          if (!response.ok) {
              throw new Error(`Failed to add car: ${response.status}`);
          }
          console.log("Car added successfully!");
          // Optionally refresh the vehicle list after successful addition
          // fetchRentals(); // You might need to adjust this to refetch data
      } catch (error) {
          console.error("Error adding car:", error);
          // Show error message to user
      }
      */
    // After successful API call, you might want to refetch the list
    // For demonstration, let's just close the modal
    // handleCloseAddCarModal(); // Modal is closed within AddCarModal's handleSubmit now
  };

  // Sorting logic (Keep as is)
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  const sortedRentals = [...filteredRentals].sort((a, b) => {
    if (sortConfig.key) {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Note: Your date sorting logic might need adjustment depending on the date format
      // It currently splits by '/' and reverses, assuming MM/DD/YYYY or DD/MM/YYYY format,
      // but your API response gives just the year. Adjust if needed.
      if (sortConfig.key === "YearManufactured") {
        // Changed key from registrationDate to YearManufactured
        // Simple numerical sort for year
        // Handle potential non-numeric values gracefully
        const numA = Number(aValue);
        const numB = Number(bValue);

        if (isNaN(numA) && isNaN(numB)) return 0; // Both not numbers, keep original order
        if (isNaN(numA)) return sortConfig.direction === "ascending" ? 1 : -1; // Non-number goes to end
        if (isNaN(numB)) return sortConfig.direction === "ascending" ? -1 : 1; // Non-number goes to end

        return sortConfig.direction === "ascending" ? numA - numB : numB - numA;
      }

      // Default string comparison
      if (aValue === bValue) return 0;

      if (sortConfig.direction === "ascending") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    }
    return 0;
  });

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const paginatedRentals = sortedRentals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
        // Render the Account component when showAccount is true
        <Account vehicleId={selectedVehicleId} />
      ) : (
        // Render the vehicle list view when showAccount is false
        <div>
          <div className="flex gap-10 mb-10">
            {/* Your status cards */}
            <div>
              <div className="bg-white drop-shadow-xs pr-32 shadow-xs flex flex-col shadow-blue-100 rounded-2xl p-4">
                <DirectionsCarFilledOutlinedIcon />
                {/* These counts likely need to be fetched from an API or derived from the rentals data */}
                <Typography variant="h6">1,200</Typography>
                <Typography variant="body8">Total Vehicle</Typography>
              </div>
            </div>
            <div>
              <div className="bg-white drop-shadow-xs pr-32 shadow-xs flex flex-col shadow-blue-100 rounded-2xl p-4">
                <CarRentalOutlinedIcon />
                <Typography variant="h6">200</Typography>{" "}
                {/* Example static count */}
                <Typography variant="body8">Active Vehicle</Typography>
              </div>
            </div>
            <div>
              <div className="bg-white drop-shadow-xs pr-32 shadow-xs flex flex-col shadow-blue-100 rounded-2xl p-4">
                <ApprovalOutlinedIcon />
                <Typography variant="h6">50</Typography>{" "}
                {/* Example static count */}
                <Typography variant="body8">Pending Approval</Typography>
              </div>
            </div>
            <div>
              <div className="bg-white drop-shadow-xs pr-32 shadow-xs flex flex-col shadow-blue-100 rounded-2xl p-4">
                <CarCrashOutlinedIcon />
                <Typography variant="h6">12</Typography>{" "}
                {/* Example static count */}
                <Typography variant="body8">Deactivated Vehicle</Typography>
              </div>
            </div>
          </div>

          <div className="bg-white w-full drop-shadow-xs shadow-blue-200 py-4 shadow-xs rounded-lg">
            <div className="px-2 rounded-lg">
              <div className="flex items-center justify-between">
                {" "}
                {/* Added items-center */}
                <h2 className="text-sm font-semibold pl-2 my-4">Car List</h2>
                <div className="flex gap-4 items-center pr-4">
                  {" "}
                  {/* Added items-center */}
                  <TextField
                    label="Search Car"
                    variant="outlined"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    size="small"
                    // No fullWidth here, let flexbox manage width
                    sx={{ minWidth: 180 }} // Give it a minimum width
                    InputProps={{
                      // Add search icon back to search input
                      endAdornment: (
                        <InputAdornment position="end">
                          {" "}
                          {/* This is the InputAdornment causing the error */}
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
                      {/* Add other types if necessary */}
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
                      <MenuItem value="Inactive">Inactive</MenuItem>
                      <MenuItem value="Active">Active</MenuItem>
                      {/* Add other statuses if necessary, e.g., Pending Approval */}
                    </Select>
                  </FormControl>
                  {/* Button to open the Add Car Modal */}
                  <button
                    onClick={handleOpenAddCarModal} // Use the handler to open the new modal state
                    className="bg-[#00173C] cursor-pointer w-28 justify-center h-fit text-xs text-white flex items-center shadow-lg px-4 py-3 rounded-4xl"
                  >
                    Add Car
                  </button>
                </div>
              </div>

              {/* Render the new AddCarModal component */}
              <AddCarModal
                open={openAddCarModal} // Pass the open state
                onClose={handleCloseAddCarModal} // Pass the close handler
                onSubmit={handleAddCarSubmit} // Pass the submit handler
              />

              {/* Table and Pagination (Keep as is) */}
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-x-0 border-t-0 border-gray-100 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50 font-semibold">
                      <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                        Vehicle ID
                      </th>
                      <th
                        className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer" // Added cursor-pointer
                        onClick={() => handleSort("carType")}
                      >
                        Car Type <HiMiniArrowsUpDown className="inline ml-1" />
                      </th>
                      <th
                        className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer" // Added cursor-pointer
                        onClick={() => handleSort("carMake")}
                      >
                        Car Make <HiMiniArrowsUpDown className="inline ml-1" />
                      </th>
                      <th
                        className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer" // Added cursor-pointer
                        onClick={() => handleSort("carModel")}
                      >
                        Car Model <HiMiniArrowsUpDown className="inline ml-1" />
                      </th>
                      <th
                        className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer" // Added cursor-pointer
                        onClick={() => handleSort("YearManufactured")} // Use correct key for sorting
                      >
                        Year of Manufacture{" "}
                        <HiMiniArrowsUpDown className="inline ml-1" />
                      </th>
                      <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                        License Plate Number
                      </th>
                      <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                        Rent Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRentals.map((rental, index) => (
                      <tr
                        key={index}
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
                              statusColors[rental.status]
                            }`}
                          >
                            {rental.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <Box display="flex" justifyContent="center" mt={4}>
                  <Pagination
                    count={Math.ceil(filteredRentals.length / itemsPerPage)}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                  />
                </Box>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleManagment;
