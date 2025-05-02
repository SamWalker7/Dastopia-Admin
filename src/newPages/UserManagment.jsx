import { HiMiniArrowsUpDown } from "react-icons/hi2";
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Select,
  MenuItem,
  Button,
  Pagination,
  Box,
  FormControl,
  InputLabel,
  IconButton,
  Typography,
} from "@mui/material";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import CloseIcon from "@mui/icons-material/Close";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import Account from "./Account";
import AddOwnerModal from "./AddOwner";

const API_BASE_URL = "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod";
const admin = JSON.parse(localStorage.getItem("admin")); // Ensure this loads correctly

const UserManagment = () => {
  const [adminToken, setAdminToken] = useState(null);
  // Ensure initial state is always an empty array
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState(null);
  const navigate = useNavigate();

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
  const itemsPerPage = 8;

  const [selectedUser, setSelectedUser] = useState(null);
  const [showAccount, setShowAccount] = useState(false);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [errorUserDetail, setErrorUserDetail] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const statusColors = {
    Invited: "bg-[#F6DE95] text-[#816204] font-bold",
    Active: "bg-[#A0E6BA] text-[#136C34] font-bold",
    Inactive: "bg-[#FEE2E2] text-[#991B1B] font-bold",
    Completed: "bg-blue-950 text-white",
    Canceled: "bg-red-100 text-red-600",
    // Added status colors based on the provided JSON statuses
    CONFIRMED: "bg-[#A0E6BA] text-[#136C34] font-bold",
    UNCONFIRMED: "bg-[#F6DE95] text-[#816204] font-bold",
  };

  // Modified getUsers to ensure it returns an array and handles the response structure
  const getUsers = async (accessToken) => {
    if (!accessToken) {
      console.error("Access token is missing for getUsers");
      throw new Error("Authentication required.");
    }
    try {
      const response = await fetch(`${API_BASE_URL}/v1/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch users: ${errorData.message || response.statusText || `Status ${response.status}`}`);
      }

      const data = await response.json();
      // Ensure we always return an array, checking for the 'users' key
      if (data && Array.isArray(data.users)) {
        // Return the array of user objects directly as they contain the required fields
        return data.users;
      } else {
        // If response is not an object with a 'users' array, return empty array
        console.warn("API response did not contain a 'users' array:", data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  };


  // getUserById remains largely the same, assuming the API endpoint
  // expects an identifier found in the user object (like username or sub)
  const getUserById = async (userIdentifier, accessToken) => {
    if (!accessToken) {
      console.error("Access token is missing for getUserById");
      throw new Error("Authentication required.");
    }
    if (!userIdentifier) {
      console.error("User identifier is missing for getUserById");
      throw new Error("Invalid user identifier.");
    }
    try {
      // Assuming the API uses the identifier (username/sub) in the path
      const response = await fetch(`${API_BASE_URL}/v1/user/${userIdentifier}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch user details: ${errorData.message || response.statusText || `Status ${response.status}`}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  };

  const refetchUsers = useCallback(async () => {
    if (adminToken && !showAccount) {
      setLoadingUsers(true);
      setErrorUsers(null);
      try {
        const fetchedUsers = await getUsers(adminToken);
        setUsers(fetchedUsers);
      } catch (error) {
        setErrorUsers(error.message || "Failed to refresh users.");
        // Ensure users is always an array on error
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    }
  }, [adminToken, showAccount]);

  useEffect(() => {
    const storedAdminJson = localStorage.getItem("admin");
    if (storedAdminJson) {
      try {
        const adminData = JSON.parse(storedAdminJson);
        if (adminData && adminData.AccessToken) {
          setAdminToken(adminData.AccessToken);
        } else {
          console.warn("localStorage 'admin' found, but AccessToken property is missing.");
          setErrorUsers("Authentication token not found. Please log in.");
          setLoadingUsers(false);
          setUsers([]); // Ensure users is empty array
        }
      } catch (error) {
        console.error("Failed to parse admin data from localStorage:", error);
        setErrorUsers("Failed to load authentication data.");
        setLoadingUsers(false);
        setUsers([]); // Ensure users is empty array
      }
    } else {
      console.warn("No 'admin' data found in localStorage.");
      setErrorUsers("Authentication data not found. Please log in.");
      setLoadingUsers(false);
      setUsers([]); // Ensure users is empty array
    }
  }, []);

  useEffect(() => {
    // Fetch users only if adminToken is available and not showing account details
    if (adminToken && !showAccount) {
      refetchUsers();
    }
  }, [adminToken, refetchUsers, showAccount]); // Depend on adminToken, refetchUsers, and showAccount

  // Modified handleRowClick to pass the correct user identifier (username or sub)
  const handleRowClick = async (userInList) => {
    // Use user.username or user.sub as the identifier, assuming API uses one of these
    // Based on the JSON, username and sub are often the same GUID
    const userIdentifier = userInList.username || userInList.sub;

    if (userIdentifier && adminToken) {
      setLoadingUserDetail(true);
      setErrorUserDetail(null);
      setSelectedUser(null);
      try {
        // Pass the identifier to getUserById
        const userDetails = await getUserById(userIdentifier, adminToken);
        setSelectedUser(userDetails);
        setShowAccount(true);
      } catch (error) {
        console.error("Error fetching user details:", error);
        setErrorUserDetail(error.message || "Failed to load user details.");
        setSelectedUser(null);
      } finally {
        setLoadingUserDetail(false);
      }
    } else if (!adminToken) {
      setErrorUsers("Authentication token not available to fetch user details.");
    } else {
      console.error("User object or identifier is missing for row click.", userInList);
      setErrorUsers("Could not retrieve user identifier for details.");
    }
  };


  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    refetchUsers(); // Refresh user list after adding a user
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
    setCurrentPage(1); // Reset pagination on filter change
  };

  // Modified filteredUsers to use Array.from(users || []) for robustness
  const filteredUsers = Array.from(users || []).filter((user) => {
    const userGivenName = user.given_name || "";
    const userFamilyName = user.family_name || "";
    const userEmail = user.email || "";
    const userPhone = user.phone_number || "";
    const userStatus = user.status || "";
    // Use custom:role for role filtering if it exists, otherwise fallback or adjust logic
    const userRole = user['custom:role'] || "";
    const searchTerm = filters.search || "";

    const matchesSearch = userGivenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userFamilyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userPhone.includes(searchTerm);

    // Updated the role filter to use 'custom:role' if available
    // Using user.email for role filtering as in original code might be incorrect
    // Filter by userRole if available, otherwise filter by email if filters.role is an email
    const matchesRole = filters.role
        ? (userRole !== "" ? userRole === filters.role : userEmail === filters.role)
        : true;


    const matchesStatus = filters.status ? userStatus === filters.status : true;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Modified sortedUsers to use Array.from(filteredUsers || []) for robustness
  const sortedUsers = Array.from(filteredUsers || []).sort((a, b) => {
    if (sortConfig.key) {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle date sorting for the 'created' field
      if (sortConfig.key === "created") {
        const parseDate = (dateStr) => {
           if (!dateStr) return new Date(0);
           try {
             // Attempt to parse ISO 8601 format (like "2024-09-09T17:07:12.966Z")
             const date = new Date(dateStr);
             return isNaN(date.getTime()) ? new Date(0) : date;
           } catch (e) {
             console.error("Failed to parse date:", dateStr, e);
             return new Date(0); // Invalid date returns epoch start
           }
         };
         aValue = parseDate(aValue);
         bValue = parseDate(bValue);

         // Compare date objects
         if (aValue < bValue) {
           return sortConfig.direction === "ascending" ? -1 : 1;
         }
         if (aValue > bValue) {
           return sortConfig.direction === "ascending" ? 1 : -1;
         }
         return 0; // Dates are equal
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      } else if (typeof aValue === 'number') {
         return (sortConfig.direction === "ascending") ? aValue - bValue : bValue - aValue;
      }

      // Default string comparison
      if (aValue === bValue) return 0;
      return sortConfig.direction === "ascending" ?
        (aValue > bValue ? 1 : -1) :
        (aValue < bValue ? 1 : -1);
    }
    return 0;
  });


  // Modified handleSort to accept the actual key from the response
  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    // Update the sort key to match the actual field names in the response
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset pagination on sort change
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const breadcrumbs = showAccount
    ? [
        <Link underline="hover" key="1" color="inherit" href="/">
          <HomeOutlinedIcon />
        </Link>,
        <button
          key="2"
          color="inherit"
          className="cursor-pointer hover:text-blue-800"
          onClick={() => {
            setShowAccount(false);
            setSelectedUser(null);
            setErrorUserDetail(null);
             // Consider refetching users here if you made changes in the Account view
             // or if you want to ensure the list is fresh when returning.
             // refetchUsers();
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
          // Pass the fetched selectedUser object to the Account component
          <Account selectedUser={selectedUser} paginatedUsers={paginatedUsers}/>
        
        ) : (
          // Fallback if somehow not loading, no error, but also no selectedUser
          <div className="text-center py-8 text-gray-500">
            No user details available.
          </div>
        )
      ) : (
        // Show the table view when not showing account details
        <div className="bg-white w-full drop-shadow-sm py-4 shadow-lg rounded-lg">
          <div className="px-2 rounded-lg">
            <div className="flex justify-between items-center mb-4 px-2"> {/* Adjusted flex and spacing */}
              <h2 className="text-sm font-semibold">Users</h2> {/* Removed vertical margins */}

              <div className="flex gap-4 items-center"> {/* Aligned items */}
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
                     {/* Options based on the 'custom:role' field in the JSON */}
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                     {/* Add other roles if present in your user data */}
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
                    {/* Options based on the 'status' field in the JSON */}
                    <MenuItem value="CONFIRMED">CONFIRMED</MenuItem>
                    <MenuItem value="UNCONFIRMED">UNCONFIRMED</MenuItem>
                     {/* Add other statuses if present in your user data */}
                  </Select>
                </FormControl>
              </div>
              {/* Add Owner Button */}
              <button
                onClick={handleOpenModal}
                className={`bg-[#00173C] cursor-pointer w-28 justify-center h-fit text-xs text-white flex items-center shadow-lg px-4 py-3 rounded-4xl ${
                  !adminToken ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={!adminToken}
              >
                Add Owner
              </button>

              {/* Add Owner Modal */}
              <AddOwnerModal
                open={openModal}
                handleClose={handleCloseModal}
                adminToken={adminToken}
                onUserAdded={refetchUsers}
              />
            </div>

            {/* Table Display Area */}
            {loadingUsers ? (
              <div className="text-center py-8">Loading users...</div>
            ) : errorUsers ? (
              <div className="text-center py-8 text-red-600">
                Error: {errorUsers}
              </div>
            ) : (
               // Wrapped table in overflow div, moved pagination outside
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-x-0 border-t-0 border-gray-100 rounded-lg">
                    <thead>
                      <tr className="bg-gray-50 font-semibold">
                        <th
                          className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer"
                          onClick={() => handleSort("given_name")} 
                        >
                          Name <HiMiniArrowsUpDown className="inline ml-1" />
                        </th>

                        <th
                          className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer"
                          onClick={() => handleSort("created")} 
                        >
                          Registration Date
                          <HiMiniArrowsUpDown className="inline ml-1" />
                        </th>

                        <th
                          className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer"
                           onClick={() => handleSort("family_name")} 
                         >
                          Last Name <HiMiniArrowsUpDown className="inline ml-1" />
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
                          key={user.username || user.sub || index} // Use a unique key
                          className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleRowClick(user)} // Call the handler to fetch/show details
                        >
                          <td className="px-6 py-4 text-sm text-gray-700">
                             {/* Display given_name */}
                            {user.given_name || "N/A"}
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-700">
                            {/* Format the ISO date string for display */}
                            {user.created ? new Date(user.created).toLocaleDateString() : "N/A"}
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-700">
                            {/* Display family_name */}
                            {user.family_name || "N/A"}
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
                  </table>
                </div>
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagment;