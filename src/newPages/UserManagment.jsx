import { HiMiniArrowsUpDown } from "react-icons/hi2";
import React, { useEffect, useState, useCallback } from "react"; // Import useEffect, useState, and useCallback
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Select,
  MenuItem,
  Button,
  Pagination,
  Box,
  FormControl,
  InputLabel, // Removed Modal as the imported component will be used directly
  IconButton,
  Typography, // Note: CircularProgress, Snackbar, Alert used in AddOwnerModal/OtpContent
} from "@mui/material";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
// Removed unused imports
import CloseIcon from "@mui/icons-material/Close";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
// Removed image import as it's used inside AddOwnerModal now
// import image from "./avatar.png"; // <-- Removed
// Import the Account component
import Account from "./Account"; // Adjust the path based on your file structure
// Removed the incorrect 'otp' import
// import otp from "./Otp" // <-- Removed
// Import the external modal component
import AddOwnerModal from "./AddOwner";

// Base URL for your API
const API_BASE_URL =
  "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod";
const admin = JSON.parse(localStorage.getItem("admin")); // Ensure this loads correctly

const UserManagment = () => {
  // State to hold the parsed access token
  const [adminToken, setAdminToken] = useState(null); // State for fetched users, loading, and error
  const [users, setUsers] = useState([]); // This will hold the actual user data from the API
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState(null);
  const navigate = useNavigate(); // State for filters, pagination, sorting (applied to fetched users)

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // State for showing user account details

  const [selectedUser, setSelectedUser] = useState(null); // Will hold full details if fetched
  const [showAccount, setShowAccount] = useState(false); // Added loading/error states for fetching single user detail
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [errorUserDetail, setErrorUserDetail] = useState(null); // State for Add Owner Modal visibility (This now controls the *imported* AddOwnerModal)

  const [openModal, setOpenModal] = useState(false); // const [newUserFormData, setNewUserFormData] = useState({ ... }); // <-- Removed // const [addingUser, setAddingUser] = useState(false); // <-- Removed // const [addUserError, setAddUserError] = useState(null); // <-- Removed

  // --- REMOVED: Old form state and handlers, as they are now in AddOwnerModal ---
  // const handleModalInputChange = (e) => { ... }; // <-- Removed

  const statusColors = {
    Invited: "bg-[#F6DE95] text-[#816204] font-bold",
    Active: "bg-[#A0E6BA] text-[#136C34] font-bold",
    Inactive: "bg-[#FEE2E2] text-[#991B1B] font-bold", // Include statuses from Account component for completeness in filters/display
    Completed: "bg-blue-950 text-white",
    Canceled: "bg-red-100 text-red-600",
  }; // --- API Helper Functions ---

  const getUsers = async (accessToken) => {
    if (!accessToken) {
      console.error("Access token is missing for getUsers");
      throw new Error("Authentication required.");
    }
    console.log(
      "Fetching users with token:",
      admin.AccessToken ? "Present" : "Missing"
    ); // Debugging line
    try {
      const response = await fetch(`${API_BASE_URL}/v1/user`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.AccessToken}`, // Use the token from localStorage/state
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch users: ${
            errorData.message ||
            response.statusText ||
            `Status ${response.status}`
          }`
        );
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error; // Re-throw to be handled by the component
    }
  }; // const createUser = async (userData, accessToken) => { ... }; // <-- Removed

  // --- REMOVED: createUser API helper, as it's now handled inside AddOwnerModal ---
  const getUserById = async (userId, accessToken) => {
    if (!accessToken) {
      console.error("Access token is missing for getUserById");
      throw new Error("Authentication required.");
    }
    if (!userId) {
      console.error("User ID is missing for getUserById");
      throw new Error("Invalid user ID.");
    }
    try {
      const response = await fetch(`${API_BASE_URL}/v1/user/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.AccessToken}`, // Use the passed token
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch user details: ${
            errorData.message ||
            response.statusText ||
            `Status ${response.status}`
          }`
        );
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching user details:", error);
      throw error;
    }
  };

  // --- Added: Function to refetch users ---
  // Defined outside useEffect for reusability and useCallback for stability
  const refetchUsers = useCallback(async () => {
    // Only refetch if token is available and not showing the Account view
    if (adminToken && !showAccount) {
      setLoadingUsers(true);
      setErrorUsers(null); // Clear previous errors before fetching
      try {
        const fetchedUsers = await getUsers(adminToken);
        setUsers(fetchedUsers);
      } catch (error) {
        setErrorUsers(error.message || "Failed to refresh users.");
        setUsers([]); // Clear existing data on error
      } finally {
        setLoadingUsers(false);
      }
    } else if (!adminToken && !localStorage.getItem("admin") && !showAccount) {
      // Handle case where no token and no data initially
      setLoadingUsers(false);
    }
  }, [adminToken, showAccount]); // Dependencies // --- Effect to load token from localStorage on mount ---

  // And trigger initial user fetch
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
          setErrorUsers("Authentication token not found. Please log in.");
          setLoadingUsers(false); // Stop initial loading
        }
      } catch (error) {
        console.error("Failed to parse admin data from localStorage:", error);
        setErrorUsers("Failed to load authentication data.");
        setLoadingUsers(false); // Stop initial loading
      }
    } else {
      console.warn("No 'admin' data found in localStorage.");
      setErrorUsers("Authentication data not found. Please log in.");
      setLoadingUsers(false); // Stop initial loading
    }
  }, []); // Empty dependency array means this runs only once on mount // --- Effect to fetch users when token is available and view is list ---

  useEffect(() => {
    // This effect triggers the initial fetch and refreshes when needed
    refetchUsers(); // Dependency array: runs when adminToken or showAccount changes, and includes refetchUsers // refetchUsers is stable due to useCallback, so this won't loop unnecessarily
  }, [refetchUsers]); // --- Handle row click to view details --- // Calls the top-level getUserById

  const handleRowClick = async (userInList) => {
    // Assume each user object in the list has an 'id' property
    if (userInList && userInList.id && adminToken) {
      // Check for token
      setLoadingUserDetail(true);
      setErrorUserDetail(null);
      setSelectedUser(null); // Clear previous user details while loading
      try {
        // Fetch full user details using the ID and token
        const userDetails = await getUserById(userInList.id, adminToken); // Pass the token
        setSelectedUser(userDetails); // Set the fetched details
        setShowAccount(true); // Navigate to the Account view
      } catch (error) {
        console.error("Error fetching user details:", error);
        setErrorUserDetail(error.message || "Failed to load user details.");
        setSelectedUser(null); // Ensure selectedUser is null on error
      } finally {
        setLoadingUserDetail(false);
      }
    } else if (!adminToken) {
      setErrorUsers(
        "Authentication token not available to fetch user details."
      ); // Show error in list view
    } else {
      console.error(
        "User object or user ID is missing for row click.",
        userInList
      );
      setErrorUsers("Could not retrieve user ID for details."); // Show error in list view
    }
  }; // --- Add Owner Modal Handlers --- // This function opens the *imported* AddOwnerModal by setting the state

  const handleOpenModal = () => {
    setOpenModal(true); // AddOwnerModal now manages its internal step and form state
  }; // This function closes the *imported* AddOwnerModal by setting the state

  // This is passed as the `handleClose` prop to AddOwnerModal
  const handleCloseModal = () => {
    setOpenModal(false);
  }; // const handleModalInputChange = (e) => { ... }; // Removed // --- Filter and Sort Logic (Client-Side) ---

  // --- REMOVED: Old form state and handlers ---
  // const [newUserFormData, setNewUserFormData] = useState({ ... }); // Removed
  // const handleAddUserSubmit = async () => { ... }; // Removed

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
    setCurrentPage(1); // Reset pagination when filters change
  }; // Filter based on the 'users' state (fetched data)

  const filteredUsers = users.filter((user) => {
    // Use user properties fetched from API (assuming first_name, last_name, etc.)
    const userName = user.first_name || "";
    const userLastName = user.last_name || "";
    const userEmail = user.email || "";
    const userPhone = user.phone_number || "";
    const userStatus = user.status || "";
    const searchTerm = filters.search || ""; // Search includes first name, last name, email, and phone number

    const matchesSearch =
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userLastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userPhone.includes(searchTerm); // Simple phone search // Note: Your matchesRole filter still compares userEmail to filters.role,

    // which seems incorrect for filtering by role type. Keep as is per previous instruction.
    const matchesRole = filters.role ? userEmail === filters.role : true;
    const matchesStatus = filters.status ? userStatus === filters.status : true;

    return matchesSearch && matchesRole && matchesStatus;
  }); // Sort based on filteredUsers

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortConfig.key) {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "registrationDate") {
        // Safely parse date - assuming 'DD/MM/YYYY', adjust format based on actual API
        const parseDate = (dateStr) => {
          if (!dateStr) return new Date(0); // Treat missing date as very early
          const parts = dateStr.split("/");
          if (parts.length === 3) {
            const [day, month, year] = parts.map(Number);
            if (
              !isNaN(day) &&
              !isNaN(month) &&
              !isNaN(year) &&
              month >= 1 &&
              month <= 12 &&
              day >= 1 &&
              day <= 31
            ) {
              return new Date(year, month - 1, day); // Month is 0-indexed
            }
          }
          return new Date(0); // Invalid date treated as very early
        };
        aValue = parseDate(aValue);
        bValue = parseDate(bValue);
      } else if (typeof aValue === "string") {
        // Case-insensitive string comparison
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      } else if (typeof aValue === "number") {
        // Numeric comparison
        return sortConfig.direction === "ascending"
          ? aValue - bValue
          : bValue - aValue;
      }

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

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  }; // Paginate based on sortedUsers

  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ); // Breadcrumbs logic

  const breadcrumbs = showAccount
    ? [
        <Link underline="hover" key="1" color="inherit" href="/">
          <HomeOutlinedIcon />
        </Link>,
        <button
          key="2"
          color="inherit"
          className=" cursor-pointer hover:text-blue-800"
          onClick={() => {
            setShowAccount(false);
            setSelectedUser(null); // Clear selected user when going back to list
            setErrorUserDetail(null); // Clear any detail error // The useEffect watching showAccount will trigger fetchUsers here
          }}
        >
          User Management
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
          User Management
        </Typography>,
      ];

  return (
    <div className="flex flex-col">
      <Box pb={3} pl={1}>
        <span className="text-xl">User Management</span>
      </Box>

      <div className="m-4 mb-12">
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          {breadcrumbs}
        </Breadcrumbs>
      </div>

      {/* Conditional Rendering based on showAccount and loading/error states */}

      {showAccount ? (
        // Show Account component or loading/error for details
        loadingUserDetail ? (
          <div className="text-center py-8">Loading user details...</div>
        ) : errorUserDetail ? (
          <div className="text-center py-8 text-red-600">
            Error: {errorUserDetail}
          </div>
        ) : selectedUser ? ( // Ensure selectedUser data exists before rendering Account
          // Note: The Account component itself still uses mock data internally,
          // but this is where you would pass the fetched selectedUser prop to it.
          <Account selectedUser={selectedUser} />
        ) : (
          // Fallback if somehow not loading, no error, but also no selectedUser
          <div className="text-center py-8 text-gray-500">
            No user details available.
          </div>
        )
      ) : (
        // Show the table view
        <div className="bg-white w-full drop-shadow-sm py-4 shadow-lg rounded-lg">
          <div className="px-2 rounded-lg">
            <div className="flex">
              <Box
                className="flex justify-between px-2 w-full"
                display="flex"
                gap={2}
                mb={2}
              >
                <h2 className="text-sm font-semibold pl-2 my-4">Users</h2>

                <div className="flex gap-4">
                  <TextField
                    label="Search User"
                    variant="outlined"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    size="small"
                  />

                  <FormControl
                    variant="outlined"
                    sx={{ minWidth: 120 }}
                    size="small"
                  >
                    <InputLabel>Role</InputLabel>
                    <Select
                      label="Role"
                      name="role"
                      value={filters.role}
                      onChange={handleFilterChange}
                    >
                      <MenuItem value="">All Roles</MenuItem>
                      <MenuItem value="Car Owner">Car Owner</MenuItem>
                      <MenuItem value="Customer Service">
                        Customer Service
                      </MenuItem>
                      <MenuItem value="Manager">Manager</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl
                    variant="outlined"
                    sx={{ minWidth: 120 }}
                    size="small"
                  >
                    <InputLabel>Status</InputLabel>
                    <Select
                      label="Status"
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                    >
                      <MenuItem value="">All Statuses</MenuItem>
                      <MenuItem value="Invited">Invited</MenuItem>
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Inactive">Inactive</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                      <MenuItem value="Canceled">Canceled</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </Box>
              {/* Add Owner Button */}
              <button
                onClick={handleOpenModal} // <-- Correctly calls the handler to open the modal
                className={`bg-[#00173C] cursor-pointer w-28 justify-center h-fit text-xs text-white flex items-center shadow-lg px-4 py-3 rounded-4xl mr-4 mx-2 ${
                  !adminToken ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={!adminToken} // Disable if token is not available
              >
                Add Owner
              </button>

              {/* --- REPLACED: Old inline Modal with imported AddOwnerModal --- */}
              {/* The imported AddOwnerModal is rendered conditionally based on openModal state */}
              <AddOwnerModal
                open={openModal} // Pass the state to control visibility
                handleClose={handleCloseModal} // Pass the handler to allow closing
                adminToken={adminToken} // Pass the token for API calls inside the modal
                onUserAdded={refetchUsers} // Pass the function to refresh the user list on success
              />
              {/* --- END REPLACEMENT --- */}
            </div>
            {/* Table Display Area */}
            {loadingUsers ? (
              <div className="text-center py-8">Loading users...</div>
            ) : errorUsers ? (
              <div className="text-center py-8 text-red-600">
                Error: {errorUsers}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-x-0 border-t-0 border-gray-100 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50 font-semibold">
                      <th
                        className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer"
                        onClick={() => handleSort("first_name")} // Using the new key for sorting
                      >
                        Name <HiMiniArrowsUpDown className="inline ml-1" />
                      </th>

                      <th
                        className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer"
                        onClick={() => handleSort("registrationDate")}
                      >
                        Registration Date
                        <HiMiniArrowsUpDown className="inline ml-1" />
                      </th>

                      <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                        Last Name
                      </th>

                      <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                        Email
                      </th>

                      <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                        Phone Number
                      </th>

                      <th
                        className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer"
                        onClick={() => handleSort("status")}
                      >
                        Status
                        <HiMiniArrowsUpDown className="inline ml-1" />
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {/* Display fetched user data */}
                    {paginatedUsers.map((user, index) => (
                      <tr
                        key={user.id || user.email || index} // Use a unique key
                        className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleRowClick(user)} // Call the handler to fetch/show details
                      >
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {user.first_name || "N/A"}
                          {/* Display using new key */}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {user.registrationDate || "N/A"}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {user.last_name || "N/A"}
                          {/* Display using new key */}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {user.email || "N/A"}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {user.phone_number || "N/A"}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-2 rounded-xl text-xs ${
                              statusColors[user.status] ||
                              "text-gray-700 bg-gray-100"
                            }`}
                          >
                            {user.status || "N/A"}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {/* Display message if no users found after filtering/loading */}

                    {!loadingUsers && filteredUsers.length === 0 && (
                      <tr>
                        <td
                          colSpan="6"
                          className="text-center py-8 text-gray-500"
                        >
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {/* Pagination */}
                  {!loadingUsers && filteredUsers.length > 0 && (
                    <Box display="flex" justifyContent="center" mt={4} pb={2}>
                      <Pagination
                        count={Math.ceil(filteredUsers.length / itemsPerPage)}
                        page={currentPage}
                        onChange={handlePageChange}
                        color="primary"
                      />
                    </Box>
                  )}
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagment;
