import { HiMiniArrowsUpDown } from "react-icons/hi2";
import React, { useState } from "react";
import {
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
  InputAdornment,
  inputBaseClasses,
} from "@mui/material";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { FaRegCircle } from "react-icons/fa";
import image from "./avatar.png";
import {
  IoChatboxOutline,
  IoLocationOutline,
  IoPersonOutline,
} from "react-icons/io5";
import { MdOutlineLocalPhone, MdOutlineMail } from "react-icons/md";
import { ETH } from "react-world-flags";
import CloseIcon from "@mui/icons-material/Close";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";

function handleClick(event) {
  event.preventDefault();
  console.info("You clicked a breadcrumb.");
}
// Mock Account Component (Replace with your actual component)
const Account = () => {
  const [rentals, setRentals] = useState([
    {
      startDate: "23/3/2022",
      endDate: "24/3/2022",
      carName: "Bekele Mamo",
      carOwner: "Bekele Mamo",
      phone: "+251 93432124",
      status: "Completed",
    },
    {
      startDate: "24/3/2022",
      endDate: "23/3/2022",
      carName: "Addis Ababa",
      carOwner: "Bekele Mamo",
      phone: "+251 93432124",
      status: "Active",
    },
    {
      startDate: "25/3/2022",
      endDate: "22/3/2022",
      carName: "Zeina Haile",
      carOwner: "Bekele Mamo",
      phone: "+251 93432124",
      status: "Canceled",
    },
    {
      startDate: "26/3/2022",
      endDate: "NA",
      carName: "Teddy Worku",
      carOwner: "Bekele Mamo",
      phone: "+251 93432124",
      status: "Completed",
    },
    {
      startDate: "27/3/2022",
      endDate: "21/3/2022",
      carName: "Biruk Tadesse",
      carOwner: "Bekele Mamo",
      phone: "+251 93432124",
      status: "Completed",
    },
  ]);

  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  const statusColors = {
    Completed: "bg-blue-950 text-white",
    Active: "bg-green-100 text-green-700",
    Canceled: "bg-red-100 text-red-600",
  };

  const sortedRentals = [...rentals].sort((a, b) => {
    if (sortConfig.key) {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Convert dates to Date objects for comparison if sorting by date
      if (sortConfig.key === "startDate" || sortConfig.key === "endDate") {
        aValue =
          aValue === "NA"
            ? null
            : new Date(aValue.split("/").reverse().join("/"));
        bValue =
          bValue === "NA"
            ? null
            : new Date(bValue.split("/").reverse().join("/"));
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

  return (
    <div className=" flex flex-col">
      <div className="flex   gap-10">
        {" "}
        {/* Rentee Details */}
        <section className="h-fit bg-white p-6 space-y-6 w-fit px-10  rounded-xl drop-shadow-sm shadow-sm">
          <div className=" items-center flex gap-8">
            <img
              src={image}
              alt="Renter Profile"
              className="w-32 h-32 rounded-full"
            />
            <div className="flex flex-col gap-2">
              <h2 className="text-lg  font-semibold text-[#00113D] mb-2">
                User Details
              </h2>
              <h3 className="flex gap-4 text-sm  text-[#38393D]">
                <IoPersonOutline size={18} /> Steven Gerard
              </h3>
              <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                <MdOutlineLocalPhone size={18} />
                <p>+251 9243212</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                <MdOutlineMail size={18} />
                <p>jandoe@gmail.com</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-[#38393D] mt-1">
                <IoLocationOutline size={18} />
                <p>Addis Ababa, Ethiopia</p>
              </div>
              <div className="flex items-center justify-center gap-2 mt-4 px-16 py-2 text-sm  border rounded-full border-[#00113D] text-[#00113D] bg-white">
                <IoChatboxOutline size={16} />
                <button>Chat With Renter</button>
              </div>
            </div>
          </div>
        </section>
        {/* Rental Details */}
        <section className="w-fit bg-white p-6   rounded-xl drop-shadow-sm shadow-sm">
          <h2 className="text-lg font-semibold text-[#00113D] mb-4">
            Account Details
          </h2>
          <div className="flex flex-col  text-sm text-[#38393D]">
            <div className="flex items-start gap-2">
              <div>
                <p className="flex items-center ">
                  <span className="pr-4">Status</span>
                  <span className="px-4 font-semibold text-sky-950">
                    Active
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div>
                <p className="flex items-center ">
                  <span className="pr-4">Registration Date</span>
                  <span className="px-4 font-semibold text-sky-950">
                    12/11/2025 | 12:05 am
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div>
                <p className="flex items-center ">
                  <span className="px-r">Role</span>
                  <span className="px-4 font-semibold text-sky-950">
                    Car Owner
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      {/* Table */}
      <div className=" bg-white mt-8 w-full drop-shadow-sm  shadow-sm rounded-lg">
        <div className="  p-6  rounded-lg ">
          <h2 className="text-lg font-semibold pl-2  my-8">Rental History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-x-0 border-t-0 border-gray-100 rounded-lg">
              <thead>
                <tr className="bg-gray-50 font-semibold">
                  <th
                    className="px-6 text-left text-sm font-semibold py-4 text-gray-600"
                    onClick={() => handleSort("startDate")}
                  >
                    Rent start date{" "}
                    <HiMiniArrowsUpDown className="inline ml-1 cursor-pointer" />
                  </th>
                  <th
                    className="px-6 text-left text-sm font-semibold py-4 text-gray-600"
                    onClick={() => handleSort("endDate")}
                  >
                    Rent end date{" "}
                    <HiMiniArrowsUpDown className="inline ml-1 cursor-pointer" />
                  </th>
                  <th
                    className="px-6 text-left text-sm font-semibold py-4 text-gray-600"
                    onClick={() => handleSort("carName")}
                  >
                    Car Name{" "}
                    <HiMiniArrowsUpDown className="inline ml-1 cursor-pointer" />
                  </th>
                  <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                    Car Owner
                  </th>
                  <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                    Phone Number
                  </th>
                  <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedRentals.map((rental, index) => (
                  <tr key={index} className="border-t border-gray-200">
                    <td className="px-6 py-0 text-sm text-gray-700">
                      {rental.startDate}
                    </td>
                    <td className="px-6 py-0 text-sm text-gray-700">
                      {rental.endDate}
                    </td>
                    <td className="px-6 py-0 text-sm text-gray-700">
                      {rental.carName}
                    </td>
                    <td className="px-6 py-0 text-sm text-gray-700">
                      {rental.carOwner}
                    </td>
                    <td className="px-6 py-0 text-sm text-gray-700">
                      {rental.phone}
                    </td>
                    <td className="p-8">
                      <span
                        className={`px-3 py-2 rounded-xl text-sm  ${
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
          </div>
        </div>
      </div>
    </div>
  );
};

const UserManagment = () => {
  const [rentals, setRentals] = useState([
    {
      name: "Bekele Mamo",
      registrationDate: "23/3/2022",
      email: "bekele@example.com",
      status: "Invited",
      role: "Car Owner",
    },
    {
      name: "Addis Ababa",
      registrationDate: "24/3/2022",
      email: "addis@example.com",
      status: "Active",
      role: "Customer Service",
    },
    {
      name: "Zeina Haile",
      registrationDate: "25/3/2022",
      email: "zeina@example.com",
      status: "Inactive",
      role: "Manager",
    },
    {
      name: "Teddy Worku",
      registrationDate: "26/3/2022",
      email: "teddy@example.com",
      status: "Invited",
      role: "Car Owner",
    },
    {
      name: "Biruk Tadesse",
      registrationDate: "27/3/2022",
      email: "biruk@example.com",
      status: "Invited",
      role: "Customer Service",
    },
  ]);

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

  const [selectedUser, setSelectedUser] = useState(null); // Track selected user
  const [showAccount, setShowAccount] = useState(false); // Control visibility of Account component

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
    // Safeguard: Ensure rental.name and filters.search are defined
    const rentalName = rental.name || ""; // Fallback to empty string if undefined
    const searchTerm = filters.search || ""; // Fallback to empty string if undefined

    return (
      rentalName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filters.role ? rental.role === filters.role : true) &&
      (filters.status ? rental.status === filters.status : true)
    );
  });

  const sortedRentals = [...filteredRentals].sort((a, b) => {
    if (sortConfig.key) {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "registrationDate") {
        aValue = new Date(aValue.split("/").reverse().join("/"));
        bValue = new Date(bValue.split("/").reverse().join("/"));
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
  };

  const paginatedRentals = sortedRentals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle row click
  const handleRowClick = (user) => {
    setSelectedUser(user);
    setShowAccount(true); // Show the Account component
  };
  const breadcrumbs = showAccount
    ? [
        <Link underline="hover" key="1" color="inherit" href="/">
          <HomeOutlinedIcon />
        </Link>,
        <button
          key="2"
          color="inherit"
          className=" cursor-pointer hover:text-blue-800"
          onClick={() => setShowAccount(false)}
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
  const [openModal, setOpenModal] = useState(false);

  // Modal styles
  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    boxShadow: 24,
    p: 4,
    borderRadius: "8px",
  };

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };
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
        // Show Account component if a row is clicked
        <Account selectedUser={selectedUser} />
      ) : (
        // Show the table if no row is clicked
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
                  <FormControl variant="outlined" sx={{ minWidth: 120 }}>
                    <InputLabel size="small">Role</InputLabel>
                    <Select
                      label="Role"
                      name="role"
                      value={filters.role}
                      onChange={handleFilterChange}
                      size="small"
                    >
                      <MenuItem value="">All Roles</MenuItem>
                      <MenuItem value="Car Owner">Car Owner</MenuItem>
                      <MenuItem value="Customer Service">
                        Customer Service
                      </MenuItem>
                      <MenuItem value="Manager">Manager</MenuItem>
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
                      <MenuItem value="Invited">Invited</MenuItem>
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </Box>
              {/* Add Owner Button */}
              <button
                onClick={handleOpenModal}
                className="bg-[#00173C]  cursor-pointer w-28 justify-center h-fit text-xs text-white flex items-center shadow-lg px-4 py-3 rounded-4xl mr-4 mx-2"
              >
                Add Owner
              </button>

              {/* Modal */}
              <Modal
                className="flex items-center justify-center"
                open={openModal}
                onClose={handleCloseModal}
              >
                <div className="bg-white w-[600px] items-center justify-center flex flex-col  ">
                  {/* Modal Header */}
                  <div className=" bg-[#00173C] w-full text-white px-8 py-2 flex justify-between">
                    <Typography variant="h6" component="h2">
                      Add User
                    </Typography>
                    <Button onClick={handleCloseModal}>
                      <CloseIcon />
                    </Button>
                  </div>
                  <img
                    src={image}
                    alt="Renter Profile"
                    className="w-32 h-32 mt-8 rounded-full"
                  />
                  <Box className="w-full px-8">
                    <span className="text-xl font-semibold">User Details</span>
                  </Box>
                  {/* Input Fields */}
                  <div
                    mt={2}
                    className="p-4 px-8 w-full grid gap-0 mb-10 gap-x-4 grid-cols-2  "
                  >
                    {" "}
                    <TextField
                      fullWidth
                      label="Name"
                      variant="outlined"
                      margin="normal"
                      size="small"
                    />
                    <TextField
                      fullWidth
                      label="Email"
                      variant="outlined"
                      margin="normal"
                      type="email"
                      size="small"
                    />
                    <TextField
                      label="Phone Number"
                      type="tel"
                      variant="outlined"
                      margin="normal"
                      fullWidth
                      size="small"
                    />
                    <FormControl fullWidth margin="normal">
                      <InputLabel size="small">Role</InputLabel>
                      <Select
                        label="Role"
                        name="role"
                        value={filters.role}
                        onChange={handleFilterChange}
                        size="small"
                      >
                        <MenuItem value="">All Roles</MenuItem>
                        <MenuItem value="Car Owner">Car Owner</MenuItem>
                        <MenuItem value="Customer Service">
                          Customer Service
                        </MenuItem>
                        <MenuItem value="Manager">Manager</MenuItem>
                      </Select>
                    </FormControl>
                  </div>

                  {/* Modal Actions */}
                  <Box className="flex pb-8 gap-4 w-full px-10">
                    <button
                      variant="outlined"
                      onClick={handleCloseModal}
                      className="flex-1 py-2  text-sm rounded-full bg-[#FDEAEA] text-red-700 border border-red-700"
                    >
                      Cancel
                    </button>
                    <button className="flex-1 text-sm py-1 rounded-full bg-[#00113D] text-white">
                      Add User
                    </button>
                  </Box>
                </div>
              </Modal>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-x-0 border-t-0 border-gray-100 rounded-lg">
                <thead>
                  <tr className="bg-gray-50 font-semibold">
                    <th
                      className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer"
                      onClick={() => handleSort("name")}
                    >
                      Name <HiMiniArrowsUpDown className="inline ml-1" />
                    </th>
                    <th
                      className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer"
                      onClick={() => handleSort("registrationDate")}
                    >
                      Registration Date{" "}
                      <HiMiniArrowsUpDown className="inline ml-1" />
                    </th>
                    <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                      Email
                    </th>
                    <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                      Role
                    </th>
                    <th
                      className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer"
                      onClick={() => handleSort("status")}
                    >
                      Status <HiMiniArrowsUpDown className="inline ml-1" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRentals.map((rental, index) => (
                    <tr
                      key={index}
                      className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleRowClick(rental)} // Handle row click
                    >
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {rental.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {rental.registrationDate}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {rental.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {rental.role}
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
      )}
    </div>
  );
};

export default UserManagment;
