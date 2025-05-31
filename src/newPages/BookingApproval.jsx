// src/newPages/BookingApproval.jsx

import { HiMiniArrowsUpDown } from "react-icons/hi2";
import React, { useState, useEffect, useCallback } from "react";
import {
  // Material UI components
  TextField,
  Select,
  MenuItem,
  Button,
  Pagination,
  Box,
  FormControl,
  InputLabel,
  Modal,
  IconButton,
  Typography,
  Link,
  Breadcrumbs,
  CircularProgress,
  Alert,
  Dialog, // Keeping Dialog imports just in case the main component uses them later
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
// Icons used in the parent component (summary boxes, table headers)
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";

// Material UI icons used in breadcrumbs
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";

// Note: FontAwesome and other specific icons are only used in BookingDetailsView now
/*
import { FaRegCircle, FaStar, FaSpinner, FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";
import image from "./avatar.png";
import image1 from "./avatar1.png";
import { IoChatboxOutline, IoLocationOutline, IoPersonOutline } from "react-icons/io5";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import GridViewIcon from "@mui/icons-material/GridView";
import { MdOutlineLocalPhone, MdOutlineMail } from "react-icons/md";
import CloseIcon from "@mui/icons-material/Close";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
*/

// --- Import Hooks ---
import { useNavigate } from "react-router-dom"; // Import useNavigate here

// --- Import the separated BookingDetailsView component ---
import BookingDetailsView from "./BookingDetailsView"; // <-- !!! ENSURE THIS PATH IS CORRECT relative to BookingApproval.jsx!!!

// Base API URL (Keep outside)
const API_BASE_URL =
  "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1";

// Helper function to get the access token (Can stay outside as it's a utility)
const getAccessToken = () => {
  try {
    const adminData = localStorage.getItem("admin");
    if (adminData) {
      const admin = JSON.parse(adminData);
      return admin.AccessToken;
    }
  } catch (e) {
    console.error("Error parsing admin data from localStorage:", e);
    return null;
  }
  return null;
};

// BookingApproval Component (Main Component)
const BookingApproval = () => {
  // --- Import Hooks INSIDE the component ---
  const navigate = useNavigate(); // Declare useNavigate hook

  // State for the main bookings list
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true); // Loading for the main booking list fetch
  const [error, setError] = useState(null); // Error for the main booking list fetch

  // State for summary counts
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [inReviewCount, setInReviewCount] = useState(0);

  // State for filtering the list
  const [filters, setFilters] = useState({
    search: "",
    carType: "", // This filter remains in state but doesn't filter API data here
    status: "", // Maps to API approvedStatus
  });

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // State for the booking selected from the table (to show details view)
  const [selectedBooking, setSelectedBooking] = useState(null);

  // State to control showing the detailed view vs the list view
  const [showDetailsView, setShowDetailsView] = useState(false);

  // Status color maps (used in the table)
  const paymentStatusColors = {
    pending: "bg-[#F6DE95] text-[#816204] font-bold",
    failed: "bg-[#FFDAD6] text-[#410002] font-bold",
    paid: "bg-[#A0E6BA] text-[#136C34] font-bold",
  };

  const approvedStatusColors = {
    approved: "bg-[#A0E6BA] text-[#136C34] font-bold",
    pending: "bg-[#F6DE95] text-[#816204] font-bold",
    rejected: "bg-[#FFDAD6] text-[#410002] font-bold",
    review: "bg-[#A4C9F9] text-[#00173C] font-bold",
  };

  // --- Fetch Bookings on Mount ---
  const fetchBookings = useCallback(async () => {
    // Wrap in useCallback
    console.log("Fetching all admin bookings.");
    setLoading(true); // Start loading
    setError(null); // Clear previous error

    const accessToken = getAccessToken();

    if (!accessToken) {
      const authError = new Error(
        "Authentication token not found. Please log in."
      );
      setError(authError);
      setLoading(false); // Stop loading on auth error
      console.error(authError);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/bookings`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        const fetchError = new Error(
          `Failed to fetch bookings: ${response.status} ${response.statusText} - ${errorBody}`
        );
        console.error("Error fetching bookings:", fetchError);
        throw fetchError; // Throw the error to be caught below
      }

      const data = await response.json();
      console.log("Successfully fetched bookings data:", data);

      if (data && Array.isArray(data.body)) {
        // Sort by createdAt date descending by default
        const sortedData = data.body.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0; // Handle missing dates
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA; // Descending sort
        });
        setBookings(sortedData); // Update bookings state
        setError(null); // Clear error on success
      } else {
        console.warn(
          "API returned unexpected data structure for bookings:",
          data
        );
        setBookings([]); // Set to empty array on unexpected structure
        setError(new Error("Received unexpected data format from API."));
      }
    } catch (err) {
      console.error("Caught error in fetchBookings:", err);
      setError(err); // Set error state
      setBookings([]); // Clear bookings on error
    } finally {
      setLoading(false); // Stop loading
      console.log("fetchBookings finished.");
    }
  }, []); // Empty dependency array, this callback is stable

  useEffect(() => {
    fetchBookings(); // Call the memoized fetch function when the component mounts
  }, [fetchBookings]); // Dependency array includes the memoized fetchBookings function

  // --- Calculate Summary Counts ---
  useEffect(() => {
    console.log("Calculating summary counts...");
    // Calculate counts whenever the 'bookings' state changes
    if (bookings.length > 0) {
      const pending = bookings.filter(
        (b) => b.approvedStatus === "pending"
      ).length;
      const approved = bookings.filter(
        (b) => b.approvedStatus === "approved"
      ).length;
      const inReview = bookings.filter(
        (b) => b.approvedStatus === "review"
      ).length;

      setPendingCount(pending);
      setApprovedCount(approved);
      setInReviewCount(inReview);
    } else {
      // Reset counts if bookings array is empty
      setPendingCount(0);
      setApprovedCount(0);
      setInReviewCount(0);
    }
    console.log("Summary counts updated:", {
      pending: pendingCount,
      approved: approvedCount,
      inReview: inReviewCount,
    });
  }, [bookings]); // This effect runs when the 'bookings' state updates

  // --- Filter Logic ---
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
    setCurrentPage(1); // Reset pagination when filters change
  };

  const filteredBookings = bookings.filter((booking) => {
    const searchTerm = filters.search.toLowerCase();
    // Convert properties to string defensively before filtering
    const bookingId = String(booking.id ?? "").toLowerCase();
    const carId = String(booking.carId ?? "").toLowerCase();
    const ownerId = String(booking.ownerId ?? "").toLowerCase();
    const renteeId = String(booking.renteeId ?? "").toLowerCase();
    const amount = String(booking.amount ?? "").toLowerCase(); // Ensure amount is stringified safely
    const startDate = String(booking.startDate ?? "").toLowerCase();
    const endDate = String(booking.endDate ?? "").toLowerCase();
    const approvedStatus = String(booking.approvedStatus ?? "").toLowerCase();
    const isPayed = String(booking.isPayed ?? "").toLowerCase(); // <-- FIX Applied Here

    const matchesSearch =
      bookingId.includes(searchTerm) ||
      carId.includes(searchTerm) ||
      ownerId.includes(searchTerm) ||
      renteeId.includes(searchTerm) ||
      amount.includes(searchTerm) ||
      startDate.includes(searchTerm) ||
      endDate.includes(searchTerm) ||
      approvedStatus.includes(searchTerm) ||
      isPayed.includes(searchTerm);

    // Filter by approval status
    const matchesStatus = filters.status
      ? booking.approvedStatus === filters.status
      : true;

    return matchesSearch && matchesStatus;
  });

  // --- Sorting Logic ---
  // Sort config state is declared at the top
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "descending",
  });

  const handleSort = useCallback(
    (key) => {
      let direction = "ascending";
      if (sortConfig.key === key && sortConfig.direction === "ascending") {
        direction = "descending";
      } else if (
        sortConfig.key === key &&
        sortConfig.direction === "descending"
      ) {
        // Cycle back to ascending if already descending
        direction = "ascending";
      } else {
        // Default to ascending when changing columns
        direction = "ascending";
      }
      setSortConfig({ key, direction });
    },
    [sortConfig]
  );

  // Sorting logic applied directly when rendering, using a copy of filteredBookings
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    if (!sortConfig.key) {
      // Default sort if no key is set (e.g., initial load, sortConfig empty)
      // Defaulting to createdAt descending based on initial fetch sort
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // Default descending sort
    }

    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Handle null or undefined values - treat them as smaller
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortConfig.direction === "ascending" ? -1 : 1; // Null comes first in ascending
    if (bValue == null) return sortConfig.direction === "ascending" ? 1 : -1; // Null comes last in ascending

    // Handle specific data types for sorting
    if (["createdAt", "startDate", "endDate"].includes(sortConfig.key)) {
      // Attempt to parse dates, fall back to string comparison if dates are invalid
      const dateA = new Date(aValue);
      const dateB = new Date(bValue);

      // Corrected date/string comparison logic for sorting
      if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) {
        // Both invalid dates, compare as strings
        const stringA = String(aValue ?? "");
        const stringB = String(bValue ?? "");
        return sortConfig.direction === "ascending"
          ? stringA.localeCompare(stringB)
          : stringB.localeCompare(stringA);
      } else if (isNaN(dateA.getTime())) {
        // A is invalid, B is valid. Invalid dates come first in ascending.
        return sortConfig.direction === "ascending" ? -1 : 1;
      } else if (isNaN(dateB.getTime())) {
        // B is invalid, A is valid. Invalid dates come first in ascending.
        return sortConfig.direction === "ascending" ? 1 : -1;
      } else {
        // Both are valid dates, compare timestamps
        return sortConfig.direction === "ascending"
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      }
    } else if (sortConfig.key === "amount") {
      // Attempt to parse amounts, fall back to 0 if invalid
      const numA = parseFloat(aValue) || 0;
      const numB = parseFloat(bValue) || 0;
      return sortConfig.direction === "ascending" ? numA - numB : numB - numA;
    } else {
      // Default to string comparison for other keys
      // Convert to string defensively before comparison
      const stringA = String(aValue ?? "").toLowerCase();
      const stringB = String(bValue ?? "").toLowerCase();
      return sortConfig.direction === "ascending"
        ? stringA.localeCompare(stringB)
        : stringB.localeCompare(stringA);
    }
  });

  // --- Pagination Logic ---
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const paginatedBookings = sortedBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- Row Click Handler ---
  const handleRowClick = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsView(true); // Show the detailed view
  };

  // --- Back Button Handler ---
  const handleBackToList = () => {
    setShowDetailsView(false); // Hide the detailed view
    setSelectedBooking(null); // Clear the selected booking when going back to list
  };

  // --- Breadcrumbs ---
  const breadcrumbs = showDetailsView
    ? [
        <Link underline="hover" key="1" color="inherit" href="#">
          <HomeOutlinedIcon /> {/* Or navigate home */}
        </Link>,
        <button
          key="2"
          color="inherit"
          className="cursor-pointer hover:text-blue-800"
          onClick={handleBackToList}
        >
          Booking Approval
        </button>,
        <Typography key="3" sx={{ color: "text.primary" }}>
          Booking Details
        </Typography>,
      ]
    : [
        <Link underline="hover" key="1" color="inherit" href="#">
          <HomeOutlinedIcon /> {/* Or navigate home */}
        </Link>,
        <Typography key="2" sx={{ color: "text.primary" }}>
          Booking Approval
        </Typography>,
      ];

  // Modal state for the upload modal (Seems unrelated to main functionality, keeping as is)
  const [openModal, setOpenModal] = useState(false);
  const [file, setFile] = useState(null);
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);
  const handleFileUpload = (e) => setFile(e.target.files[0]);

  return (
    <div className="flex flex-col">
      <Box pb={3} pl={1}>
        <span className="text-xl">Booking Approval</span>
      </Box>
      <div className="m-4 mb-12">
        {" "}
        {/* Adjust margin as needed */}
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          {breadcrumbs}
        </Breadcrumbs>
      </div>

      {/* --- Conditional Rendering: Show Details View or List --- */}
      {showDetailsView ? (
        // Render the separated BookingDetailsView component
        // selectedBooking prop is passed from this component's state
        // Note: adminToken is retrieved within BookingDetailsView now using getAccessToken()
        <BookingDetailsView selectedBooking={selectedBooking} />
      ) : (
        // --- Booking List View ---
        <div>
          {/* Summary Boxes (Now using real counts) */}
          <div className="gap-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-10">
            {" "}
            {/* Responsive grid */}
            {/* Pending Listings */}
            <div>
              <div className="bg-white w-full drop-shadow-xs p-4 shadow-xs flex items-center justify-between shadow-blue-100 rounded-2xl">
                <Box>
                  <Typography variant="h6">{pendingCount}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pending Bookings
                  </Typography>
                </Box>
                <PendingActionsOutlinedIcon
                  sx={{ color: "#F6DE95", fontSize: 40 }}
                />
              </div>
            </div>
            {/* Approved Listings */}
            <div>
              <div className="bg-white w-full drop-shadow-xs p-4 shadow-xs flex items-center justify-between shadow-blue-100 rounded-2xl">
                <Box>
                  <Typography variant="h6">{approvedCount}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Approved Bookings
                  </Typography>
                </Box>
                <CheckCircleOutlineOutlinedIcon
                  sx={{ color: "#A0E6BA", fontSize: 40 }}
                />
              </div>
            </div>
            {/* In-Review Listings */}
            <div>
              <div className="bg-white w-full drop-shadow-xs p-4 shadow-xs flex items-center justify-between shadow-blue-100 rounded-2xl">
                <Box>
                  <Typography variant="h6">{inReviewCount}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    In-Review Bookings
                  </Typography>
                </Box>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white w-full drop-shadow-xs shadow-blue-200 py-4 shadow-xs rounded-lg">
            <div className="px-2 rounded-lg">
              <div className="flex">
                <Box
                  className="flex justify-between px-2 w-full flex-wrap md:flex-nowrap"
                  display="flex"
                  gap={2}
                  mb={2}
                >
                  <h2 className="text-base font-semibold pl-2 my-4">
                    Bookings List
                  </h2>
                  <Box display="flex" gap={2} flexWrap="wrap">
                    <TextField
                      label="Search"
                      variant="outlined"
                      name="search"
                      value={filters.search}
                      onChange={handleFilterChange}
                      size="small"
                      sx={{ minWidth: 180 }}
                    />
                    <FormControl
                      variant="outlined"
                      size="small"
                      sx={{ minWidth: 120 }}
                    >
                      <InputLabel size="small">Approval Status</InputLabel>
                      <Select
                        label="Approval Status"
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        size="small"
                      >
                        <MenuItem value="">All Statuses</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="review">In-Review</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </div>

              {loading ? (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  minHeight="200px"
                >
                  <CircularProgress />
                  <Typography variant="h6" sx={{ ml: 2 }}>
                    Loading bookings...
                  </Typography>
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ m: 2 }}>
                  Error loading bookings: {error.message}
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-x-0 border-t-0 border-gray-100 rounded-lg">
                    <thead>
                      <tr className="bg-gray-50 font-semibold">
                        <th
                          className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer"
                          onClick={() => handleSort("id")}
                        >
                          Booking ID
                          <HiMiniArrowsUpDown className="inline ml-1" />
                        </th>
                        <th
                          className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer"
                          onClick={() => handleSort("carId")}
                        >
                          Vehicle ID
                          <HiMiniArrowsUpDown className="inline ml-1" />
                        </th>
                        <th
                          className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer"
                          onClick={() => handleSort("createdAt")}
                        >
                          Submission Date
                          <HiMiniArrowsUpDown className="inline ml-1" />
                        </th>
                        <th
                          className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer"
                          onClick={() => handleSort("amount")}
                        >
                          Total Amount
                          <HiMiniArrowsUpDown className="inline ml-1" />
                        </th>
                        <th
                          className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer"
                          onClick={() => handleSort("approvedStatus")}
                        >
                          Approval Status
                          <HiMiniArrowsUpDown className="inline ml-1" />
                        </th>
                        <th
                          className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer"
                          onClick={() => handleSort("isPayed")}
                        >
                          Payment Status
                          <HiMiniArrowsUpDown className="inline ml-1" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedBookings.map((booking) => (
                        <tr
                          key={booking.id}
                          className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleRowClick(booking)}
                        >
                          <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                            {booking.id || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                            {booking.carId || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                            {booking.createdAt
                              ? new Date(booking.createdAt).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                            {booking.amount
                              ? `${parseFloat(
                                  booking.amount
                                ).toLocaleString()} Birr`
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-2 rounded-xl text-xs ${
                                approvedStatusColors[booking.approvedStatus] ||
                                "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {booking.approvedStatus || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-2 rounded-xl text-xs ${
                                paymentStatusColors[booking.isPayed] ||
                                "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {booking.isPayed || "N/A"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Box display="flex" justifyContent="center" mt={4}>
                    <Pagination
                      count={Math.ceil(filteredBookings.length / itemsPerPage)}
                      page={currentPage}
                      onChange={handlePageChange}
                      color="primary"
                      disabled={
                        loading || error || filteredBookings.length === 0
                      }
                    />
                  </Box>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <IconButton
            aria-label="close"
            onClick={handleCloseModal}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
            }}
          >
            X
          </IconButton>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Modal Title
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            Modal content goes here.
          </Typography>
          <input type="file" onChange={handleFileUpload} />
          {file && (
            <Typography sx={{ mt: 2 }}>Selected file: {file.name}</Typography>
          )}
        </Box>
      </Modal>
    </div>
  );
};

export default BookingApproval;
