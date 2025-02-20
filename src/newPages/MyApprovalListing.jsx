import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Breadcrumbs,
  Avatar,
  Typography,
  Box,
  Button,
  MenuItem,
  InputLabel,
  Select,
  FormControl,
} from "@mui/material";
import Modal from "react-modal";

import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

import {
  HomeOutlined,
  NavigateNext,
  PhoneOutlined,
  PersonOutlined,
  DirectionsCarOutlined,
  LocalOfferOutlined,
} from "@mui/icons-material";
import {
  IoChatboxOutline,
  IoLocationOutline,
  IoPersonOutline,
} from "react-icons/io5";
import { MdOutlineLocalPhone, MdOutlineMail } from "react-icons/md";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import GridViewIcon from "@mui/icons-material/GridView";
import CloseIcon from "@mui/icons-material/Close";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import image from "./avatar.png";
Modal.setAppElement("#root");
const profiles = [
  {
    id: 1,
    name: "Steven Gerard",
    phone: "+251 9243212",
    car: "BYD, Segull 2024",
    price: "2,450 birr",
    date: "Aug 09, 2024",
    avatar: image,
    status: "unassigned",
  },
  {
    id: 2,
    name: "Alex Morgan",
    phone: "+251 9243213",
    car: "Toyota, Corolla 2022",
    price: "3,150 birr",
    date: "Sep 12, 2024",
    avatar: image,
    status: "unassigned",
  },
  {
    id: 3,
    name: "Jordan Henderson",
    phone: "+251 9243214",
    car: "Honda, Civic 2021",
    price: "2,800 birr",
    date: "Oct 15, 2024",
    avatar: image,
    status: "unassigned",
  },
  {
    id: 4,
    name: "Mo Salah",
    phone: "+251 9243215",
    car: "Ford, Mustang 2023",
    price: "4,500 birr",
    date: "Jul 20, 2024",
    avatar: image,
    status: "inReview",
  },
  {
    id: 5,
    name: "Sadio Mané",
    phone: "+251 9243216",
    car: "Chevrolet, Camaro 2022",
    price: "3,950 birr",
    date: "Jun 25, 2024",
    avatar: image,
    status: "inReview",
  },
  {
    id: 6,
    name: "Virgil van Dijk",
    phone: "+251 9243217",
    car: "BMW, X5 2023",
    price: "6,000 birr",
    date: "May 18, 2024",
    avatar: image,
    status: "approved",
  },
];

const statusLabels = {
  unassigned: "Unassigned",
  inReview: "In Review",
  approved: "Approved",
  rejected: "Rejected",
};
const statusColors = {
  unassigned: "[#ffffff]",
  inReview: "[#ffffff]",
  approved: "[#76FF46]",
  rejected: "[#FF7C5F]",
};
const breadcrumbs = [
  <Link underline="hover" key="1" color="inherit" href="/">
    <HomeOutlinedIcon />
  </Link>,
  <Typography key="2" sx={{ color: "text.primary" }}>
    New Car Listings
  </Typography>,
];

const ProfileCard = ({ profile, onClick }) => (
  <div className="p-2">
    <div
      className="bg-[#FAF9FE] drop-shadow-xs shadow-xs flex flex-col shadow-blue-200 p-4 text-gray-600 text-sm rounded-2xl cursor-pointer"
      onClick={() => onClick(profile)}
    >
      <Box display="flex" alignItems="center" mb={2}>
        <Avatar
          alt={profile.name}
          src={profile.avatar}
          sx={{ width: 56, height: 56, mr: 2 }}
        />
        <Box>
          <p>
            <PersonOutlined
              fontSize="small"
              sx={{ verticalAlign: "middle", mr: 1 }}
            />
            {profile.name}
          </p>
          <p>
            <PhoneOutlined
              fontSize="small"
              sx={{ verticalAlign: "middle", mr: 1 }}
            />
            {profile.phone}
          </p>
        </Box>
      </Box>
      <Box display="flex" alignItems="center" mb={1}>
        <DirectionsCarOutlined fontSize="small" sx={{ mr: 1 }} />
        <p>{profile.car}</p>
      </Box>
      <Box display="flex" alignItems="center" mb={1}>
        <LocalOfferOutlined fontSize="small" sx={{ mr: 1 }} />
        <p>{profile.price}</p>
      </Box>
      <div className="flex justify-between text-xs mt-4 w-full">
        <p>Submission Date:</p>
        <p className="text-xs font-bold">{profile.date}</p>
      </div>
    </div>
  </div>
);

const MyApprovalListing = () => {
  const [open, setOpen] = useState(false);
  const [openReject, setOpenReject] = useState(false);

  const handleOpen = (profile) => {
    setOpen(true);
  };
  const handleOpenReject = () => {
    setOpenReject(true);
  };
  const handleCloseReject = () => {
    setOpenReject(false);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Box sx={{ padding: 0, minHeight: "100vh" }}>
      <Box pb={3} pl={1}>
        <span className="text-xl">My Approval Listing</span>
      </Box>
      <div className="m-4 mb-12">
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          {breadcrumbs}
        </Breadcrumbs>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-4 gap-6">
        {Object.keys(statusLabels).map((status) => (
          <div key={status}>
            <div
              className={`drop-shadow-xs p-2 shadow-xs shadow-blue-100 border border-${statusColors[status]} rounded-md min-h-screen`}
            >
              <Typography variant="h6" sx={{ mb: 2, px: 2 }}>
                {statusLabels[status]}
              </Typography>
              <div className="flex flex-col gap-0">
                {profiles
                  .filter((profile) => profile.status === status)
                  .map((profile) => (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      onClick={handleOpen}
                    />
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="">
        {" "}
        {/* Modal */}
        <Modal
          style={{
            overlay: {
              backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
            },
            content: {
              backgroundColor: "#fff",
              padding: "0px",
              borderRadius: "10px",
              width: "70%", // Change this value to adjust the modal's width
              maxWidth: "800px", // Optional: Max width for responsiveness
              marginLeft: "30vw", // Center the modal on the screen
            },
          }}
          isOpen={open}
          onRequestClose={handleClose}
        >
          <div className=" bg-[#00173C] w-full text-white px-8 py-2 flex justify-between">
            <Typography variant="h6" component="h2">
              Add User
            </Typography>
            <Button onClick={handleClose}>
              <CloseIcon />
            </Button>
          </div>
          <Box className="flex py-8 gap-4 w-full px-10">
            <button
              variant="outlined"
              onClick={handleOpenReject}
              className="flex-1 py-2 cursor-pointer   text-sm rounded-full bg-[#FDEAEA] text-red-700 border border-red-700"
            >
              Reject Profile
            </button>
            <button className="flex-1 cursor-pointer text-sm py-1 rounded-full bg-[#00113D] text-white">
              Pass profile for review
            </button>
          </Box>
          <Modal
            style={{
              overlay: {
                backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
              },
              content: {
                backgroundColor: "#fff",
                padding: "0px",
                borderRadius: "10px",
                width: "40%", // Change this value to adjust the modal's width
                maxWidth: "400px", // Optional: Max width for responsiveness
                marginLeft: "40vw",
                marginTop: "10vh",
                maxHeight: "400px", // Center the modal on the screen
              },
            }}
            isOpen={openReject}
            onRequestClose={handleCloseReject}
          >
            <div className=" bg-[#00173C] w-full text-white px-8 py-2 flex justify-between">
              <Typography variant="h6" component="h2">
                Reason
              </Typography>
              <Button onClick={handleCloseReject}>
                <CloseIcon />
              </Button>
            </div>
            <div className="p-8">
              <h1 className=" font-semibold mb-6">
                Please select options form below
              </h1>{" "}
              <FormGroup className="px-4">
                <FormControlLabel control={<Checkbox />} label="Owner Detail" />
                <FormControlLabel
                  control={<Checkbox />}
                  label="Vechile Overview"
                />
                <FormControlLabel
                  control={<Checkbox />}
                  label="Documents and compliance"
                />
                <FormControlLabel
                  control={<Checkbox />}
                  label="Photos and Media"
                />
              </FormGroup>
              <Box className="flex mt-4 gap-4 w-full ">
                {" "}
                <button
                  variant="outlined"
                  onClick={handleCloseReject}
                  className="flex-1 text-sm py-2 cursor-pointer rounded-full bg-[#00113D] text-white"
                >
                  {" "}
                  Reject Profile
                </button>
              </Box>
            </div>
          </Modal>
          <div className=" flex flex-col p-2">
            <div className="flex flex-col w-full h-fit bg-white p-6 space-y-6  px-10 shadow-blue-100  rounded-xl drop-shadow-sm shadow-xs  gap-4">
              {" "}
              {/* Rentee Details */}
              <div className="flex justify-between">
                {" "}
                <section className=" w-[40vw] flex flex-col gap-4 pr-8">
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
                    </div>
                  </div>{" "}
                  <div className="flex items-center cursor-pointer justify-center gap-2 mt-4 px-4 py-2 text-sm  border rounded-full border-[#00113D] text-[#00113D] bg-white">
                    <IoChatboxOutline size={16} />
                    <button>Chat With Renter</button>
                  </div>{" "}
                  <div className="flex items-center gap-8">
                    <p className="flex w-1/2 flex-col  ">
                      <span className=" text-lg font-semibold text-gray-700">
                        Assigned Admin
                      </span>
                      <span className="">Asigned to me</span>
                    </p>{" "}
                    <FormControl variant="outlined" fullWidth>
                      <InputLabel size="small">Status</InputLabel>
                      <Select label="Status" name="status" size="small">
                        <MenuItem value="">All Statuses</MenuItem>
                        <MenuItem value="Assigned">Assigned</MenuItem>
                        <MenuItem value="Unassigned">Unassigned</MenuItem>
                        <MenuItem value="Review">Review</MenuItem>
                      </Select>
                    </FormControl>
                  </div>
                </section>
                {/* Rental Details */}
                <section className="w-1/4 mr-14 ">
                  <h2 className="text-lg font-semibold text-[#00113D] mb-4">
                    Listing Detail
                  </h2>
                  <div className="flex flex-col gap-4  text-sm text-[#38393D]">
                    <div className="flex items-start gap-2">
                      <div>
                        <p className="flex flex-col items-center ">
                          <span className="">Status</span>
                          <span className=" font-semibold text-sky-950">
                            Active
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div>
                        <p className="flex flex-col items-center ">
                          <span className="-ml-6">Registration Date</span>
                          <span className=" font-semibold text-sky-950">
                            12/11/2025 | 12:05 am
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div>
                        <p className="flex flex-col items-center ">
                          <span className="-ml-2">Rent Amount</span>
                          <span className=" font-semibold text-sky-950">
                            1,453 Birr/Day
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>{" "}
            </div>
            {/* Table */}
            <div className="p-10 bg-white w-full flex flex-col  drop-shadow-sm shadow-blue-200 shadow mt-8 rounded-lg">
              <div className=" text-xl font-semibold mb-8">
                Vehicle Overview
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3  p-4 gap-4 ">
                <div className="flex items-center">
                  Vehicle Type{" "}
                  <span className="mx-2 bg-blue-100 rounded-md p-2 ">
                    Sedan
                  </span>
                </div>
                <div className="flex items-center">
                  Vehicle Make{" "}
                  <span className="mx-2 bg-blue-100 rounded-md p-2 ">BYD</span>
                </div>
                <div className="flex items-center">
                  License Plate Number{" "}
                  <span className="mx-2 bg-blue-100 rounded-md p-2 ">
                    AD D3990
                  </span>
                </div>{" "}
                <div className="flex items-center">
                  Year of Manufacture{" "}
                  <span className="mx-2 bg-blue-100 rounded-md p-2 ">2007</span>
                </div>{" "}
                <div className="flex items-center">
                  Mileage{" "}
                  <span className="mx-2 bg-blue-100 rounded-md p-2 ">
                    2000 KM
                  </span>
                </div>{" "}
                <div className="flex items-center">
                  Vehicle Model{" "}
                  <span className="mx-2 bg-blue-100 rounded-md p-2 ">
                    Segull
                  </span>
                </div>{" "}
                <div className="flex items-center">
                  Fuel Type{" "}
                  <span className="mx-2 bg-blue-100 rounded-md p-2 ">
                    Benzene
                  </span>
                </div>
                <div className="flex items-center">
                  Transmission Type{" "}
                  <span className="mx-2 bg-blue-100 rounded-md p-2 ">
                    Automatic
                  </span>
                </div>
                <div className="flex items-center">
                  Vehicle ID{" "}
                  <span className="mx-2 bg-blue-100 rounded-md p-2 ">
                    AA D90032
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-8">
              <div className="p-10 bg-white w-1/2 flex flex-col mt-4 drop-shadow-sm shadow-blue-200 shadow rounded-lg">
                <div className=" text-xl font-semibold mb-8">
                  Documents and Compliance
                </div>
                <div className=" w-full  justify-between gap-4   flex ">
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
                <div className=" text-xl font-semibold mb-8">
                  Photos and Media
                </div>
                <div className=" w-full  justify-between   flex ">
                  <div className=" w-full  justify-between gap-4   flex ">
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
        </Modal>
      </div>
    </Box>
  );
};

export default MyApprovalListing;
