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

const API_BASE_URL =
  "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod";

// Helper function to interpret verification status based on user attributes
const getVerificationStatus = (user) => {
  if (user["custom:id_verified"] === "1") {
    return { text: "Verified", color: "bg-[#A0E6BA] text-[#136C34] font-bold" };
  }
  if (user["custom:id_verified"] === "2") {
    return { text: "Rejected", color: "bg-[#FEE2E2] text-[#991B1B] font-bold" };
  }
  if (user["custom:veri_submitted"] === "true") {
    return {
      text: "Pending Review",
      color: "bg-[#F6DE95] text-[#816204] font-bold",
    };
  }
  return { text: "Not Submitted", color: "bg-gray-200 text-gray-800" };
};

const UserManagment = () => {
  const [adminToken, setAdminToken] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState(null);
  const navigate = useNavigate();

  const [sortConfig, setSortConfig] = useState({
    key: "created",
    direction: "descending",
  });
  const [filters, setFilters] = useState({
    search: "",
    user_type: "",
    id_verification_status: "",
    status: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [selectedUser, setSelectedUser] = useState(null);
  const [showAccount, setShowAccount] = useState(false);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [errorUserDetail, setErrorUserDetail] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const accountStatusColors = {
    CONFIRMED: "bg-[#A0E6BA] text-[#136C34] font-bold",
    UNCONFIRMED: "bg-[#F6DE95] text-[#816204] font-bold",
    FORCE_CHANGE_PASSWORD: "bg-orange-200 text-orange-800",
    RESET_REQUIRED: "bg-orange-200 text-orange-800",
  };

  // Updated function to fetch a single page of users
  const getUsers = async (accessToken, limit = 60, paginationToken) => {
    if (!accessToken) throw new Error("Authentication required.");

    const url = new URL(`${API_BASE_URL}/v1/user`);
    url.searchParams.append("limit", String(limit));
    if (paginationToken) {
      url.searchParams.append("paginationToken", paginationToken);
    }

    try {
      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch users: ${errorData.message || response.statusText}`
        );
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching a page of users:", error);
      throw error;
    }
  };

  const getUserById = async (userId, accessToken) => {
    if (!accessToken) throw new Error("Authentication required.");
    if (!userId) throw new Error("Invalid user identifier.");
    try {
      const response = await fetch(`${API_BASE_URL}/v1/user/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch user details: ${
            errorData.message || response.statusText
          }`
        );
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching user details:", error);
      throw error;
    }
  };

  // New function to fetch all users by iterating through paginated results
  const fetchAllUsers = useCallback(async () => {
    if (!adminToken) return;

    setLoadingUsers(true);
    setErrorUsers(null);
    let accumulatedUsers = [];
    let currentToken = null;
    let hasMorePages = true;

    try {
      while (hasMorePages) {
        const data = await getUsers(adminToken, 60, currentToken);
        const fetchedUsers =
          data?.users && Array.isArray(data.users) ? data.users : [];
        accumulatedUsers = [...accumulatedUsers, ...fetchedUsers];

        hasMorePages = data?.pagination?.hasMore || false;
        currentToken = data?.pagination?.nextToken || null;
      }
      setUsers(accumulatedUsers);
    } catch (error) {
      setErrorUsers(error.message || "Failed to fetch all users.");
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [adminToken]);

  useEffect(() => {
    const storedAdminJson = localStorage.getItem("admin");
    if (storedAdminJson) {
      try {
        const adminData = JSON.parse(storedAdminJson);
        if (adminData?.AccessToken) {
          setAdminToken(adminData.AccessToken);
        } else {
          setErrorUsers("Authentication token not found. Please log in.");
          setLoadingUsers(false);
        }
      } catch (error) {
        setErrorUsers("Failed to load authentication data.");
        setLoadingUsers(false);
      }
    } else {
      setErrorUsers("Authentication data not found. Please log in.");
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (adminToken && !showAccount) {
      fetchAllUsers();
    }
  }, [adminToken, showAccount, fetchAllUsers]);

  const handleRowClick = async (user) => {
    const userId = user.username;
    if (userId && adminToken) {
      setLoadingUserDetail(true);
      setErrorUserDetail(null);
      try {
        const userDetails = await getUserById(userId, adminToken);
        setSelectedUser(userDetails);
        setShowAccount(true);
      } catch (error) {
        setErrorUserDetail(error.message || "Failed to load user details.");
      } finally {
        setLoadingUserDetail(false);
      }
    } else {
      setErrorUsers("Cannot fetch details: missing user ID or auth token.");
    }
  };

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => {
    setOpenModal(false);
    fetchAllUsers(); // Refetch all users after adding a new one
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const filteredUsers = (users || []).filter((user) => {
    const fullName = `${user.given_name || ""} ${user.family_name || ""}`;
    const searchTerm = filters.search.toLowerCase();

    const matchesSearch =
      fullName.toLowerCase().includes(searchTerm) ||
      (user.email || "").toLowerCase().includes(searchTerm) ||
      (user.phone_number || "").includes(searchTerm);

    const matchesUserType = filters.user_type
      ? user["custom:user_type"] === filters.user_type
      : true;
    const matchesStatus = filters.status
      ? user.status === filters.status
      : true;
    const matchesVerification = filters.id_verification_status
      ? getVerificationStatus(user).text === filters.id_verification_status
      : true;

    return (
      matchesSearch && matchesUserType && matchesStatus && matchesVerification
    );
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue;
    let bValue;

    if (sortConfig.key === "given_name") {
      aValue = `${a.given_name || ""} ${a.family_name || ""}`.trim();
      bValue = `${b.given_name || ""} ${b.family_name || ""}`.trim();
    } else {
      aValue = a[sortConfig.key];
      bValue = b[sortConfig.key];
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    } else {
      aValue = aValue ?? "";
      bValue = bValue ?? "";
    }

    if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
    setCurrentPage(1);
  };

  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const breadcrumbs = [
    <Link underline="hover" key="1" color="inherit" href="/">
      <HomeOutlinedIcon />
    </Link>,
    showAccount ? (
      <button
        key="2"
        className="cursor-pointer hover:text-blue-800"
        onClick={() => setShowAccount(false)}
      >
        User Management
      </button>
    ) : (
      <Typography key="2" color="text.primary">
        User Management
      </Typography>
    ),
    showAccount && (
      <Typography key="3" color="text.primary">
        Account
      </Typography>
    ),
  ].filter(Boolean);

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

      {showAccount ? (
        loadingUserDetail ? (
          <div>Loading user details...</div>
        ) : errorUserDetail ? (
          <div className="text-red-600">Error: {errorUserDetail}</div>
        ) : selectedUser ? (
          <Account
            selectedUser={selectedUser}
            paginatedUsers={paginatedUsers}
          />
        ) : (
          <div>No user details available.</div>
        )
      ) : (
        <div className="bg-white w-full drop-shadow-sm py-4 shadow-lg rounded-lg">
          <div className="px-4 rounded-lg">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
              <TextField
                label="Search User"
                variant="outlined"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                size="small"
              />
              <div className="flex flex-wrap gap-4">
                <FormControl
                  variant="outlined"
                  sx={{ minWidth: 150 }}
                  size="small"
                >
                  <InputLabel>User Type</InputLabel>
                  <Select
                    label="User Type"
                    name="user_type"
                    value={filters.user_type}
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="rent">Renter</MenuItem>
                    <MenuItem value="list">Car Owner</MenuItem>
                    <MenuItem value="both">Both</MenuItem>
                  </Select>
                </FormControl>
                <FormControl
                  variant="outlined"
                  sx={{ minWidth: 150 }}
                  size="small"
                >
                  <InputLabel>Account Status</InputLabel>
                  <Select
                    label="Account Status"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                    <MenuItem value="UNCONFIRMED">Unconfirmed</MenuItem>
                  </Select>
                </FormControl>
                <FormControl
                  variant="outlined"
                  sx={{ minWidth: 180 }}
                  size="small"
                >
                  <InputLabel>Verification Status</InputLabel>
                  <Select
                    label="Verification Status"
                    name="id_verification_status"
                    value={filters.id_verification_status}
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="Verified">Verified</MenuItem>
                    <MenuItem value="Pending Review">Pending Review</MenuItem>
                    <MenuItem value="Rejected">Rejected</MenuItem>
                    <MenuItem value="Not Submitted">Not Submitted</MenuItem>
                  </Select>
                </FormControl>
              </div>
              <button
                onClick={handleOpenModal}
                className="bg-[#00173C] cursor-pointer w-28 justify-center h-fit text-xs text-white flex items-center shadow-lg px-4 py-3 rounded-md"
                disabled={!adminToken}
              >
                Add Owner
              </button>
              <AddOwnerModal
                open={openModal}
                handleClose={handleCloseModal}
                adminToken={adminToken}
                onUserAdded={fetchAllUsers} // Pass fetchAllUsers to the modal
              />
            </div>

            {loadingUsers ? (
              <div className="text-center py-8">Loading users...</div>
            ) : errorUsers ? (
              <div className="text-center py-8 text-red-600">
                Error: {errorUsers}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr className="bg-gray-50 font-semibold">
                        {[
                          { label: "Name", key: "given_name" },
                          { label: "User Type", key: "custom:user_type" },
                          { label: "Email", key: "email" },
                          { label: "Phone Number", key: "phone_number" },
                          { label: "Account Status", key: "status" },
                          {
                            label: "ID Verification",
                            key: "custom:id_verified",
                          },
                        ].map((head) => (
                          <th
                            key={head.key}
                            className="px-6 text-left text-sm py-4 text-gray-600 cursor-pointer"
                            onClick={() => handleSort(head.key)}
                          >
                            {head.label}{" "}
                            <HiMiniArrowsUpDown className="inline ml-1" />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.map((user) => {
                        const verification = getVerificationStatus(user);
                        return (
                          <tr
                            key={user.username}
                            className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleRowClick(user)}
                          >
                            <td className="px-6 py-4 text-sm text-gray-700">{`${
                              user.given_name || ""
                            } ${user.family_name || ""}`}</td>
                            <td className="px-6 py-4 text-sm text-gray-700 capitalize">
                              {user["custom:user_type"] || "N/A"}
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
                                  accountStatusColors[user.status] ||
                                  "text-gray-700 bg-gray-100"
                                }`}
                              >
                                {user.status || "N/A"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-2 rounded-xl text-xs ${verification.color}`}
                              >
                                {verification.text}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
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
                {!loadingUsers && filteredUsers.length > 0 && (
                  <Box display="flex" justifyContent="center" mt={4} pb={2}>
                    <Pagination
                      count={Math.ceil(filteredUsers.length / itemsPerPage)}
                      page={currentPage}
                      onChange={(e, val) => setCurrentPage(val)}
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
