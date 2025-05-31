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

const RoleSettings = () => {
  const [rentals, setRentals] = useState([
    {
      RoleName: "Admin",
      registrationDate: "23/3/2022",
      email:
        "Lorem ipsum dolor sit amet consectetur. Lectus in non elit sit commodo. Vel varius quis eget.",
      status: "Invited",
      role: "4",
    },
    {
      RoleName: "Super Admin",
      registrationDate: "24/3/2022",
      email:
        "Lorem ipsum dolor sit amet consectetur. Lectus in non elit sit commodo. Vel varius quis eget.",
      status: "Active",
      role: "8",
    },
    {
      RoleName: "Sales Admin",
      registrationDate: "25/3/2022",
      email:
        "Lorem ipsum dolor sit amet consectetur. Lectus in non elit sit commodo. Vel varius quis eget.",
      status: "Inactive",
      role: "12",
    },
    {
      RoleName: "CEO",
      registrationDate: "26/3/2022",
      email:
        "Lorem ipsum dolor sit amet consectetur. Lectus in non elit sit commodo. Vel varius quis eget.",
      status: "Invited",
      role: "4",
    },
    {
      RoleName: "COO",
      registrationDate: "27/3/2022",
      email:
        "Lorem ipsum dolor sit amet consectetur. Lectus in non elit sit commodo. Vel varius quis eget.",
      status: "Invited",
      role: "8",
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
    RoleName: "",
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
      (filters.status ? rental.status === filters.status : true) &&
      (filters.RoleName ? rental.RoleName === filters.RoleName : true)
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
  const breadcrumbs = [
    <Link underline="hover" key="1" color="inherit" href="/">
      <HomeOutlinedIcon />
    </Link>,
    <Typography key="2" sx={{ color: "text.primary" }}>
      Role Settings
    </Typography>,
  ];
  const [openModal, setOpenModal] = useState(false);
  const [delete1, setDelete1] = useState(false);
  const [delete2, setDelete2] = useState(false);

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };
  const handleOpenDelete1 = () => {
    setDelete1(true);
  };
  const handleClosenDelete1 = () => {
    setDelete1(false);
  };

  const handleOpenDelete2 = () => {
    setDelete2(true);
  };
  const handleClosenDelete2 = () => {
    setDelete2(false);
  };
  return (
    <div className="flex flex-col">
      <Box pb={3} pl={1}>
        <span className="text-xl">User Role and Permissions</span>
      </Box>
      <div className="m-4 mb-12">
        <div className="flex w-full justify-between">
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            aria-label="breadcrumb"
          >
            {breadcrumbs}
          </Breadcrumbs>{" "}
          {/* Add Owner Button */}
          <button
            onClick={handleOpenModal}
            className="bg-[#00173C]  cursor-pointer w-28 justify-center h-fit text-xs text-white flex items-center shadow-lg px-4 py-3 rounded-4xl mr-4 mx-2"
          >
            Add Role
          </button>{" "}
        </div>
      </div>
      <div className="flex w-full">
        {" "}
        <div className=" w-2/3  py-4  rounded-lg">
          <div className="px-2 rounded-lg">
            {/* Modal */}
            <Modal
              className="flex items-center justify-center"
              open={openModal}
              onClose={handleCloseModal}
            >
              <div className="bg-white w-[600px]  flex flex-col  ">
                {/* Modal Header */}
                <div className=" bg-[#00173C] w-full text-white px-8 py-2 flex justify-between">
                  <Typography variant="h6" component="h2">
                    New Role
                  </Typography>
                  <Button onClick={handleCloseModal}>
                    <CloseIcon />
                  </Button>
                </div>
                <div className="mx-8   mt-4  border-gray-300">
                  <TextField
                    fullWidth
                    label="Name"
                    variant="outlined"
                    margin="normal"
                    size="small"
                  />{" "}
                  <h1 className="mt-4 font-semibold">Permission</h1>
                </div>
                {/* Input Fields */}
                <div
                  mt={2}
                  className="p-4 px-8 w-full grid gap-0 mb-10 gap-x-4 grid-cols-2  "
                >
                  {" "}
                  <FormControl fullWidth margin="normal">
                    <InputLabel size="small">Dashboard Access</InputLabel>
                    <Select
                      label="Dashboard Access"
                      name="role"
                      value={filters.role}
                      onChange={handleFilterChange}
                      size="small"
                    >
                      <MenuItem value="">All Roles</MenuItem>
                      <MenuItem value="8">8</MenuItem>
                      <MenuItem value="Customer Service">
                        Customer Service
                      </MenuItem>
                      <MenuItem value="Manager">Manager</MenuItem>
                    </Select>
                  </FormControl>{" "}
                  <FormControl fullWidth margin="normal">
                    <InputLabel size="small">
                      Listing Approval Access
                    </InputLabel>
                    <Select
                      label="Listing Approval Access"
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
                  </FormControl>{" "}
                  <FormControl fullWidth margin="normal">
                    <InputLabel size="small">Administration Access</InputLabel>
                    <Select
                      label="Administration Access"
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
                <Box className="flex pb-8 gap-4 w-full px-8">
                  <button
                    variant="outlined"
                    onClick={handleCloseModal}
                    className="flex-1 text-sm py-2 rounded-full bg-[#00113D] text-white"
                  >
                    Save Changes
                  </button>
                </Box>
              </div>
            </Modal>
            {/* Modal */}
            <Modal
              className="flex items-center justify-center"
              open={delete1}
              onClose={handleClosenDelete1}
            >
              <div className="bg-white w-[600px]  flex flex-col  ">
                {/* Modal Header */}
                <div className=" bg-[#00173C] w-full text-white px-8 py-2 flex justify-between">
                  <Typography variant="h6" component="h2">
                    Delete Role
                  </Typography>
                </div>

                <div mt={2} className="m-4 mx-8  p-2  bg-blue-200 mb-10    ">
                  {" "}
                  <span className=" font-bold">Notice:</span> Please make sure
                  all users assigned to this role are reassigned before deleting
                  the role.
                </div>
                {/* Modal Actions */}
                <Box className="flex pb-8 gap-4 w-full px-8">
                  <button
                    variant="outlined"
                    onClick={handleClosenDelete1}
                    className="flex-1 text-sm py-2 rounded-full bg-white border cursor-pointer hover:bg-blue-50 text-black"
                  >
                    Go Back
                  </button>
                  <button
                    variant="outlined"
                    onClick={handleOpenDelete2}
                    className="flex-1 text-sm py-2 rounded-full bg-red-700 cursor-pointer text-white"
                  >
                    Delete Role
                  </button>
                </Box>
              </div>
            </Modal>
            <Modal
              className="flex items-center justify-center"
              open={delete2}
              onClose={handleClosenDelete2}
            >
              <div className="bg-white w-[600px]  flex flex-col  ">
                {/* Modal Header */}
                <div className=" bg-[#00173C] w-full text-white px-8 py-2 flex justify-between">
                  <Typography variant="h6" component="h2">
                    Role Assignment
                  </Typography>
                </div>
                <div mt={2} className="m-4 mx-8  p-2  bg-blue-200     ">
                  {" "}
                  <span className=" font-bold">Notice:</span> There are (5)
                  users assigned to the deleted role. Please select a role.
                </div>{" "}
                <div className="px-10">
                  <FormControl fullWidth margin="normal">
                    <InputLabel size="small">Role Name</InputLabel>
                    <Select
                      label="Role Name"
                      name="RoleName"
                      value={filters.RoleName}
                      onChange={handleFilterChange}
                      size="small"
                    >
                      <MenuItem value="">All Roles</MenuItem>
                      <MenuItem value="Admin">Admin</MenuItem>
                      <MenuItem value="Super Admin">Super Admin</MenuItem>
                      <MenuItem value="CEO">CEO</MenuItem>
                    </Select>
                  </FormControl>{" "}
                </div>
                {/* Modal Actions */}
                <Box className="flex py-8 gap-4 w-full px-8">
                  <button
                    variant="outlined"
                    onClick={handleClosenDelete2}
                    className="flex-1 text-sm py-2 rounded-full bg-white border cursor-pointer hover:bg-blue-50 text-black"
                  >
                    Go Back
                  </button>
                  <button
                    variant="outlined"
                    // onClick={handleOpenDelete2}
                    className="flex-1 text-sm py-2 rounded-full bg-[#00173C] text-white"
                  >
                    Assign Role
                  </button>
                </Box>
              </div>
            </Modal>
          </div>
          <div className="overflow-x-auto ">
            <table className="w-full bg-white border border-x-0 border-t-0 border-gray-100 rounded-lg">
              <thead>
                <tr className="bg-gray-50 font-semibold">
                  <th
                    className="px-6 text-left text-sm font-semibold py-4 text-gray-600 cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    Role Name <HiMiniArrowsUpDown className="inline ml-1" />
                  </th>

                  <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                    Description
                  </th>
                  <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                    Number of Users
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
                      {rental.RoleName}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {rental.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {rental.role}
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
        {/* right side */}
        <div className=" bg-white drop-shadow-md w-1/3 ml-10 mr-10 p-10 flex flex-col">
          <h1 className=" font-semibold text-xl">Edit</h1>
          <FormControl fullWidth margin="normal">
            <InputLabel size="small">Role Name</InputLabel>
            <Select
              label="Role Name"
              name="RoleName"
              value={filters.RoleName}
              onChange={handleFilterChange}
              size="small"
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
              <MenuItem value="Super Admin">Super Admin</MenuItem>
              <MenuItem value="CEO">CEO</MenuItem>
            </Select>
          </FormControl>{" "}
          <div className="  border-t pt-4 pb-2 mt-4  border-gray-300">
            Permission
          </div>
          <FormControl fullWidth margin="normal">
            <InputLabel size="small">Dashboard Access</InputLabel>
            <Select
              label="Dashboard Access"
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              size="small"
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="8">8</MenuItem>
              <MenuItem value="Customer Service">Customer Service</MenuItem>
              <MenuItem value="Manager">Manager</MenuItem>
            </Select>
          </FormControl>{" "}
          <FormControl fullWidth margin="normal">
            <InputLabel size="small">Listing Approval Access</InputLabel>
            <Select
              label="Listing Approval Access"
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              size="small"
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="Car Owner">Car Owner</MenuItem>
              <MenuItem value="Customer Service">Customer Service</MenuItem>
              <MenuItem value="Manager">Manager</MenuItem>
            </Select>
          </FormControl>{" "}
          <FormControl fullWidth margin="normal">
            <InputLabel size="small">Administration Access</InputLabel>
            <Select
              label="Administration Access"
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              size="small"
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="Car Owner">Car Owner</MenuItem>
              <MenuItem value="Customer Service">Customer Service</MenuItem>
              <MenuItem value="Manager">Manager</MenuItem>
            </Select>
          </FormControl>
          <Box className="flex flex-col mt-10 gap-2 w-full ">
            <button
              variant="outlined"
              //onClick={handleCloseModal}
              className="flex-1 text-sm py-2 border rounded-full bg-white cursor-pointer text-black"
            >
              Update Role
            </button>
            <button
              variant="outlined"
              onClick={handleOpenDelete1}
              className="flex-1 text-sm py-2 rounded-full bg-red-700 cursor-pointer text-white"
            >
              Delete Role
            </button>
          </Box>
        </div>
      </div>
    </div>
  );
};

export default RoleSettings;
