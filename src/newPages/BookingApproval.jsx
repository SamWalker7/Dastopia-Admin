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
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import AssignmentLateOutlinedIcon from "@mui/icons-material/AssignmentLateOutlined";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { FaRegCircle } from "react-icons/fa";
import image from "./avatar.png";
import image1 from "./avatar1.png";
import {
  IoChatboxOutline,
  IoLocationOutline,
  IoPersonOutline,
} from "react-icons/io5";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import GridViewIcon from "@mui/icons-material/GridView";
import { FaStar } from "react-icons/fa";
import { MdOutlineLocalPhone, MdOutlineMail } from "react-icons/md";
import { ETH } from "react-world-flags";
import CloseIcon from "@mui/icons-material/Close";

import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import CarRentalOutlinedIcon from "@mui/icons-material/CarRentalOutlined";
import DirectionsCarFilledOutlinedIcon from "@mui/icons-material/DirectionsCarFilledOutlined";
import CarCrashOutlinedIcon from "@mui/icons-material/CarCrashOutlined";
import ApprovalOutlinedIcon from "@mui/icons-material/ApprovalOutlined";
import { Grid } from "@mui/material";
import { Search, UploadFile } from "@mui/icons-material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
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
      <div className="flex w-full  gap-4">
        {" "}
        <section className="h-fit bg-white p-6 space-y-6 w-1/2 px-10 shadow-blue-300  rounded-xl drop-shadow-xs shadow-xs">
          <div className=" items-center flex gap-8">
            <img
              src={image1}
              alt="Renter Profile"
              className="w-32 h-32 rounded-full"
            />
            <div className="flex flex-col gap-2">
              <h2 className="text-lg  font-semibold text-[#00113D] mb-2">
                Owner Details
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
              <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 text-sm  border rounded-full border-[#00113D] text-[#00113D] bg-white">
                <IoChatboxOutline size={16} />
                <button>Chat With Renter</button>
              </div>
            </div>
          </div>
        </section>
        {/* Rentee Details */}
        <section className="h-fit bg-white p-6 space-y-6 w-1/2 px-10 shadow-blue-300  rounded-xl drop-shadow-ms shadow-xs">
          <div className=" items-center flex gap-8">
            <img
              src={image}
              alt="Renter Profile"
              className="w-32 h-32 rounded-full"
            />
            <div className="flex flex-col gap-2">
              <h2 className="text-lg  font-semibold text-[#00113D] mb-2">
                Renter Details
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
              <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 text-sm  border rounded-full border-[#00113D] text-[#00113D] bg-white">
                <IoChatboxOutline size={16} />
                <button>Chat With Renter</button>
              </div>
            </div>
          </div>
        </section>
      </div>
      <div className="flex w-full pt-8 gap-4">
        <section className="w-1/2 bg-white p-6 h-fit shadow-blue-300  rounded-xl drop-shadow-xs shadow-xs">
          <h2 className="text-lg font-semibold text-[#00113D] mb-4">
            Booking Details
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
                  <span className="px-r">Rent Amount</span>
                  <span className="px-4 font-semibold text-sky-950">
                    1,453 Birr/Day
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mt-7 px-4 py-2 text-sm  border rounded-full border-[#00113D] text-[#00113D] bg-white">
              <CalendarMonthOutlinedIcon fontSize="small" />
              <button>Available Dates</button>
            </div>
          </div>
        </section>{" "}
        <section className="w-1/2 bg-white p-6 h-fit  shadow-blue-300  rounded-xl drop-shadow-xs shadow-xs">
          <h2 className="text-lg font-semibold text-[#00113D] mb-4">
            Payment Details
          </h2>
          <div className="flex flex-col  text-sm text-[#38393D]">
            <div className="flex items-start gap-2 w-full">
              <div className="w-full">
                <p className="flex items-center justify-between ">
                  <span className="pr-4">Payment Method</span>
                  <span className="px-4 font-semibold text-sky-950">
                    Telebirr
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 w-full">
              <div className="w-full">
                <p className="flex items-center justify-between ">
                  <span className="pr-4">Insurance Amount</span>
                  <span className="px-4 font-semibold text-sky-950">
                    2,000 <span className="font-normal">Birr</span>
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 w-full">
              <div className="w-full">
                <p className="flex items-center justify-between ">
                  <span className="px-r">Daily Rent </span>
                  <span className="px-4 font-semibold text-sky-950">
                    1,453 <span className="font-normal">Birr/Day</span>
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 w-full">
              <div className="w-full">
                <p className="flex items-center justify-between ">
                  <span className="px-r"> Rent Duration </span>
                  <span className="px-4 font-semibold text-sky-950">
                    3 <span className="font-normal">days</span>
                  </span>
                </p>
              </div>
            </div>
            <div className="flex border-t border-gray-300 py-1 mt-4 items-start gap-2 w-full">
              <div className="w-full">
                <p className="flex items-center justify-between ">
                  <span className="px-r">Daily Rent </span>
                  <span className="px-4 font-semibold text-sky-950">
                    3,453 <span className="font-normal">Birr/Day</span>
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      {/* Table */}
      <div className="p-10 bg-white w-full flex flex-col  drop-shadow-sm shadow-blue-200 shadow mt-8 rounded-lg">
        <div className=" text-xl font-semibold mb-8">Vehicle Overview</div>
        <div className="grid grid-cols-1 sm:grid-cols-4  p-4 gap-4 ">
          <div className="flex items-center">
            Vehicle Type{" "}
            <span className="mx-2 bg-blue-100 rounded-md p-2 ">Sedan</span>
          </div>
          <div className="flex items-center">
            Vehicle Make{" "}
            <span className="mx-2 bg-blue-100 rounded-md p-2 ">BYD</span>
          </div>
          <div className="flex items-center">
            License Plate Number{" "}
            <span className="mx-2 bg-blue-100 rounded-md p-2 ">AD D3990</span>
          </div>{" "}
          <div className="flex items-center">
            Year of Manufacture{" "}
            <span className="mx-2 bg-blue-100 rounded-md p-2 ">2007</span>
          </div>{" "}
          <div className="flex items-center">
            Mileage{" "}
            <span className="mx-2 bg-blue-100 rounded-md p-2 ">2000 KM</span>
          </div>{" "}
          <div className="flex items-center">
            Vehicle Model{" "}
            <span className="mx-2 bg-blue-100 rounded-md p-2 ">Segull</span>
          </div>{" "}
          <div className="flex items-center">
            Fuel Type{" "}
            <span className="mx-2 bg-blue-100 rounded-md p-2 ">Benzene</span>
          </div>
          <div className="flex items-center">
            Transmission Type{" "}
            <span className="mx-2 bg-blue-100 rounded-md p-2 ">Automatic</span>
          </div>
          <div className="flex items-center">
            Vehicle ID{" "}
            <span className="mx-2 bg-blue-100 rounded-md p-2 ">AA D90032</span>
          </div>
        </div>
      </div>
      <div className="flex gap-8">
        <div className="p-10 bg-white w-1/2 flex flex-col mt-4 drop-shadow-sm shadow-blue-200 shadow rounded-lg">
          <div className=" text-xl font-semibold mb-8">
            Documents and Compliance
          </div>
          <div className=" w-full  justify-between   flex ">
            <div className="flex flex-col items-center">
              Libre Document{" "}
              <span className="my-2 bg-blue-100 underline rounded-md  p-2 ">
                {" "}
                <AttachFileIcon />
                Libre Document{" "}
              </span>
            </div>
            <div className="flex flex-col items-center">
              Insurance Document{" "}
              <span className="my-2 bg-blue-100 underline rounded-md p-2 ">
                <AttachFileIcon />
                Insurance Document
              </span>
            </div>
          </div>
        </div>

        <div className="p-10 bg-white w-1/2 flex flex-col mt-4 drop-shadow-sm shadow-blue-200 shadow rounded-lg">
          <div className=" text-xl font-semibold mb-8">Photos and Media</div>
          <div className=" w-full  justify-between   flex ">
            <div className=" w-full  justify-between   flex ">
              <div className="flex flex-col items-center">
                Vehicle Photos{" "}
                <span className="my-2 bg-blue-100 underline rounded-md  p-2 ">
                  {" "}
                  <GridViewIcon /> View Photos{" "}
                </span>
              </div>
              <div className="flex flex-col items-center">
                Insurance Document{" "}
                <span className="my-2 bg-blue-100 underline rounded-md p-2 ">
                  <AttachFileIcon />
                  Insurance Document
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BookingApproval = () => {
  const [rentals] = useState([
    {
      carMake: "Toyota",
      vehicleID: "B78965",
      bookingID: "B78965",
      plate: "A78544",
      YearManufactured: "23/3/2022",
      Assigned: "Admin2",
      status: "Assigned",
      payment: "Pending",
      price: "1,450 birr",
    },
    {
      carMake: "Honda",
      vehicleID: "B78966",
      bookingID: "B78966",
      plate: "A78545",
      YearManufactured: "24/3/2022",
      Assigned: "Admin1",
      status: "Unassigned",
      payment: "Failed",
      price: "1,450 birr",
    },
    {
      carMake: "Toyota",
      vehicleID: "B78965",
      bookingID: "B78965",
      plate: "A78544",
      YearManufactured: "23/3/2022",
      Assigned: "Admin2",
      status: "Assigned",
      payment: "Pending",
      price: "1,450 birr",
    },
    {
      carMake: "Honda",
      vehicleID: "B78966",
      bookingID: "B78966",
      plate: "A78545",
      YearManufactured: "24/3/2022",
      Assigned: "Admin1",
      status: "Unassigned",
      payment: "Pending",
      price: "1,450 birr",
    },
    {
      carMake: "Toyota",
      vehicleID: "B78965",
      bookingID: "B78965",
      plate: "A78544",
      YearManufactured: "23/3/2022",
      Assigned: "Admin2",
      status: "Assigned",
      payment: "Pending",
      price: "1,450 birr",
    },
    {
      carMake: "Honda",
      vehicleID: "B78966",
      bookingID: "B78966",
      plate: "A78545",
      YearManufactured: "24/3/2022",
      Assigned: "Admin1",
      status: "Review",
      payment: "Failed",
      price: "1,450 birr",
    },
    {
      carMake: "Toyota",
      vehicleID: "B78965",
      bookingID: "B78965",
      plate: "A78544",
      YearManufactured: "23/3/2022",
      Assigned: "Admin2",
      status: "Assigned",
      payment: "Pending",
      price: "1,450 birr",
    },
    {
      carMake: "Honda",
      vehicleID: "B78966",
      bookingID: "B78966",
      plate: "A78545",
      YearManufactured: "24/3/2022",
      Assigned: "Admin1",
      status: "Unassigned",
      payment: "Pending",
      price: "1,450 birr",
    },
    {
      carMake: "Toyota",
      vehicleID: "B78965",
      bookingID: "B78965",
      plate: "A78544",
      YearManufactured: "23/3/2022",
      Assigned: "Admin2",
      status: "Assigned",
      payment: "Failed",
      price: "1,450 birr",
    },
    {
      carMake: "Honda",
      vehicleID: "B78966",
      bookingID: "B78966",
      plate: "A78545",
      YearManufactured: "24/3/2022",
      Assigned: "Admin1",
      status: "Unassigned",
      payment: "Failed",
      price: "1,450 birr",
    },
    {
      carMake: "Toyota",
      vehicleID: "B78965",
      bookingID: "B78965",
      plate: "A78544",
      YearManufactured: "23/3/2022",
      Assigned: "Admin2",
      status: "Review",
      payment: "Pending",
      price: "1,450 birr",
    },
    {
      carMake: "Honda",
      vehicleID: "B78966",
      bookingID: "B78966",
      plate: "A78545",
      YearManufactured: "24/3/2022",
      Assigned: "Admin1",
      status: "Unassigned",
      payment: "Failed",
      price: "1,450 birr",
    },
    // Add more mock data as needed
  ]);

  const [filters, setFilters] = useState({
    search: "",
    carType: "",
    status: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [selectedUser, setSelectedUser] = useState(null);
  const [showAccount, setShowAccount] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const statusColors = {
    Review: "bg-[#F6DE95] text-[#816204] font-bold",
    Assigned: "bg-[#A0E6BA] text-[#136C34] font-bold",
    Unassigned: "bg-[#A4C9F9] text-[#00173C] font-bold",
  };
  const paymentColors = {
    Pending: "bg-[#A0E6BA] text-[#136C34] font-bold",
    Failed: "bg-[#FFDAD6] text-[#410002] font-bold",
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

  const handleRowClick = (user) => {
    setSelectedUser(user);
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
          onClick={() => setShowAccount(false)}
        >
          Booking Approval
        </button>,
        <Typography key="3" sx={{ color: "text.primary" }}>
          Car Details
        </Typography>,
      ]
    : [
        <Link underline="hover" key="1" color="inherit" href="/">
          <HomeOutlinedIcon />
        </Link>,
        <Typography key="2" sx={{ color: "text.primary" }}>
          Booking Approval
        </Typography>,
      ];
  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const [file, setFile] = useState(null);

  const handleFileUpload = (e) => {
    setFile(e.target.files[0]);
  };

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
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
  const paginatedRentals = sortedRentals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex flex-col">
      <Box pb={3} pl={1}>
        <span className="text-xl">Booking Approval</span>
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
        <Account selectedUser={selectedUser} />
      ) : (
        <div>
          {" "}
          <div className="gap-8 grid grid-cols-3 mb-10">
            {" "}
            <div>
              <div className="bg-white w-full drop-shadow-xs pr-32 shadow-xs flex flex-col shadow-blue-100 rounded-2xl p-4">
                <PendingActionsOutlinedIcon />

                <Typography variant="h6">200</Typography>
                <Typography variant="body8">Pending Listing</Typography>
              </div>
            </div>
            <div>
              <div className="bg-white w-full drop-shadow-xs pr-32 shadow-xs flex flex-col shadow-blue-100 rounded-2xl p-4">
                <AssignmentLateOutlinedIcon />
                <Typography variant="h6">50</Typography>
                <Typography variant="body8">Unassigned Listings</Typography>
              </div>
            </div>
            <div>
              <div className="bg-white w-full drop-shadow-xs pr-32 shadow-xs flex flex-col shadow-blue-100 rounded-2xl p-4">
                <AssignmentOutlinedIcon />
                <Typography variant="h6">12</Typography>
                <Typography variant="body8"> In-Review Listings</Typography>
              </div>
            </div>
          </div>
          <div className="bg-white w-full drop-shadow-xs shadow-blue-200 py-4 shadow-xs rounded-lg">
            <div className="px-2 rounded-lg">
              <div className="flex">
                <Box
                  className="flex justify-between px-2 w-full"
                  display="flex"
                  gap={2}
                  mb={2}
                >
                  <h2 className="text-sm font-semibold pl-2 my-4">
                    Vehicle Listing
                  </h2>
                  <div className="flex gap-4">
                    <TextField
                      label="Search Car"
                      variant="outlined"
                      name="search"
                      value={filters.search}
                      onChange={handleFilterChange}
                      size="small"
                      fullWidth
                    />
                    <FormControl fullWidth>
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
                        <MenuItem value="Assigned">Assigned</MenuItem>
                        <MenuItem value="Unassigned">Unassigned</MenuItem>
                        <MenuItem value="Review">Review</MenuItem>
                      </Select>
                    </FormControl>
                  </div>
                </Box>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-x-0 border-t-0 border-gray-100 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50 font-semibold">
                      <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                        Booking ID
                      </th>
                      <th
                        className="px-6 text-left text-sm font-semibold py-4 text-gray-600"
                        // onClick={() => handleSort("carModel")}
                      >
                        Vehicle ID{" "}
                        {/* <HiMiniArrowsUpDown className="inline ml-1 cursor-pointer" /> */}
                      </th>
                      <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                        Submission Date
                      </th>
                      <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                        Daily Pricing
                      </th>
                      <th className="px-6 text-left text-sm font-semibold py-4 text-gray-600">
                        Assigned To
                      </th>
                      <th
                        className="px-6 text-left text-sm font-semibold py-4 text-gray-600"
                        onClick={() => handleSort("status")}
                      >
                        Status{" "}
                        <HiMiniArrowsUpDown className="inline ml-1 cursor-pointer" />
                      </th>{" "}
                      <th
                        className="px-6 text-left text-sm font-semibold py-4 text-gray-600"
                        onClick={() => handleSort("payment")}
                      >
                        Payment Status{" "}
                        <HiMiniArrowsUpDown className="inline ml-1 cursor-pointer" />
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
                          {rental.bookingID}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {rental.vehicleID}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {rental.YearManufactured}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {rental.price}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {rental.Assigned}
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
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-2 rounded-xl text-xs ${
                              paymentColors[rental.payment]
                            }`}
                          >
                            {rental.payment}
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

export default BookingApproval;
