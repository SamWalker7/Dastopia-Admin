import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PeopleIcon from "@mui/icons-material/People";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import Badge from "@mui/material/Badge";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import Collapse from "@mui/material/Collapse";
import InboxIcon from "@mui/icons-material/Inbox";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import StarBorder from "@mui/icons-material/StarBorder";
import Dashboard from "./Dashboard";
import UserManagment from "./UserManagment";
import VehicleManagment from "./VehicleManagment";
import NewCarListing from "./NewCarListing";
import CarListingApproval from "./CarListingApproval";
import MyApprovalListing from "./MyApprovalListing";
import BookingApproval from "./BookingApproval";
import RoleSettings from "./RoleSettings";
import UserSettings from "./UserSettings";
import FinancialDashboard from "./FinancialDashboard";
import ChatApp from "./chat";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import ReferralStatistics from "./ReferralStatistics";
import PromoAnalytics from "./PromoAnalytics";
const drawerWidth = 300;

function getUserRole() {
  const adminData = localStorage.getItem('admin');

  if (!adminData) {
    return null;
  }

  try {
    const parsedData = JSON.parse(adminData);

    const roleAttribute = parsedData.userAttributes.find(attr => attr.Name === 'custom:role');

    return roleAttribute ? roleAttribute.Value : null;
  } catch (error) {
    console.error('Error parsing admin data from localStorage:', error);
    return null;
  }
}


const PermanentDrawerLeft = () => {
  const [activeItem, setActiveItem] = useState("Dashboard");
  const role = getUserRole();

  const handleMenuClick = (item) => {
    setActiveItem(item);
  };
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(!open);
  };

  const renderContent = () => {
    switch (activeItem) {
      case "Dashboard":
        return <Dashboard />;
      case "Financial Dashboard":
        return <FinancialDashboard />;
      case "User Management":
        return <UserManagment />;
      case "Vehicle Management":
        return <VehicleManagment />;
      case "New Car Listings":
        return <NewCarListing />;
      case "Car Listing Approval":
        return <CarListingApproval />;
      case "My Approval Listing":
        return <MyApprovalListing />;
      case "Booking Approval":
        return <BookingApproval />;
      case "Role Settings":
        return <RoleSettings />;
      case "User Settings":
        return <UserSettings />;
      case "Chat":
        return <ChatApp />;
      case "Referral Statistics":
        return <ReferralStatistics />;
      case "PromoCode Analytics":
        return <PromoAnalytics />;


      default:
        return <Box p={2}>Select an item to view details</Box>;
    }
  };
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("admin");
    navigate("/");
  };
  return (
    <Box className="text-sm" display="flex">
      {/* Drawer */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#F4F3F8",
            borderRight: "none",
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Box pt={2} pb={1} px={4}>
          <span className="">Overview</span>
        </Box>
        <ul className="flex flex-col px-4 pb-10 space-y-2">
          <li className=" pb-0 pt-0 ">
            <ListItemButton
              className=" gap-4"
              onClick={() => handleMenuClick("Dashboard")}
              style={{
                backgroundColor: activeItem === "Dashboard" ? "#2260A8" : "",
                borderRadius: "40px",
                padding: "5px",
                marginInline: "0px",
                color: activeItem === "Dashboard" ? "white" : "",
              }}
            >
              <div
                className=" justify-center flex items-center "
                style={{
                  color: activeItem === "Dashboard" ? "white" : "",
                }}
              >
                <DashboardIcon className="" style={{ height: "14px" }} />
              </div>
              <ListItemText
                primary="Dashboard"
                primaryTypographyProps={{ fontSize: "12px" }}
              />
            </ListItemButton>
          </li>

          <li className="border-b border-gray-300 pb-2">
            <ListItemButton
              className=" gap-4"
              onClick={() => handleMenuClick("Financial Dashboard")}
              style={{
                backgroundColor:
                  activeItem === "Financial Dashboard" ? "#2260A8" : "",
                borderRadius: "40px",
                padding: "5px",

                marginInline: "0px",
                color: activeItem === "Financial Dashboard" ? "white" : "",
              }}
            >
              <div
                className=" justify-center flex items-center "
                style={{
                  color: activeItem === "Financial Dashboard" ? "white" : "",
                }}
              >
                <AttachMoneyIcon className="" style={{ height: "16px" }} />
              </div>
              <ListItemText
                primary="Financial Dashboard"
                primaryTypographyProps={{ fontSize: "12px" }}
              />
            </ListItemButton>
          </li>

          <Box p={1}>
            <span className="">Managment</span>
          </Box>
          <li className=" pb-0 pt-0 ">
            <ListItemButton
              className=" gap-4"
              onClick={() => handleMenuClick("User Management")}
              style={{
                backgroundColor:
                  activeItem === "User Management" ? "#2260A8" : "",
                borderRadius: "40px",
                padding: "5px",
                marginInline: "0px",
                color: activeItem === "User Management" ? "white" : "",
              }}
            >
              <div
                className=" justify-center flex items-center "
                style={{
                  color: activeItem === "User Management" ? "white" : "",
                }}
              >
                <PeopleIcon className="" style={{ height: "14px" }} />
              </div>
              <ListItemText
                primary="User Management"
                primaryTypographyProps={{ fontSize: "12px" }}
              />
            </ListItemButton>
          </li>

          <li className="">
            <ListItemButton
              className=" gap-4"
              onClick={() => handleMenuClick("Vehicle Management")}
              style={{
                backgroundColor:
                  activeItem === "Vehicle Management" ? "#2260A8" : "",
                borderRadius: "40px",
                padding: "5px",
                marginInline: "0px",
                color: activeItem === "Vehicle Management" ? "white" : "",
              }}
            >
              <div
                className=" justify-center flex items-center "
                style={{
                  color: activeItem === "Vehicle Management" ? "white" : "",
                }}
              >
                <DirectionsCarIcon className="" style={{ height: "16px" }} />
              </div>
              <ListItemText
                primary="Vehicle Management"
                primaryTypographyProps={{ fontSize: "12px" }}
              />
            </ListItemButton>
          </li>
          {role === "admin" && <li className="">
            <ListItemButton
              className="gap-4"
              onClick={() => handleMenuClick("Referral Statistics")}
              style={{
                backgroundColor:
                  activeItem === "Referral Statistics" ? "#2260A8" : "",
                borderRadius: "40px",
                padding: "5px",
                marginInline: "0px",
                color: activeItem === "Referral Statistics" ? "white" : "",
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  color: activeItem === "Referral Statistics" ? "white" : "",
                }}
              >
                <PeopleIcon style={{ height: "14px" }} />
              </div>

              <ListItemText
                primary="Referral Statistics"
                primaryTypographyProps={{ fontSize: "12px" }}
              />
            </ListItemButton>
          </li>}
          {role === "admin" && <li className="border-b border-gray-300 pb-2">
            <ListItemButton
              className="gap-4"
              onClick={() => handleMenuClick("PromoCode Analytics")}
              style={{
                backgroundColor:
                  activeItem === "PromoCode Analytics" ? "#2260A8" : "",
                borderRadius: "40px",
                padding: "5px",
                marginInline: "0px",
                color: activeItem === "PromoCode Analytics" ? "white" : "",
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  color: activeItem === "PromoCode Analytics" ? "white" : "",
                }}
              >
                <PeopleIcon style={{ height: "14px" }} />
              </div>

              <ListItemText
                primary="PromoCode Analytics"
                primaryTypographyProps={{ fontSize: "12px" }}
              />
            </ListItemButton>
          </li>}

          <Box p={1}>
            <span className="">Listing Approvals</span>
          </Box>
          <li className=" pb-0 pt-0 ">
            <ListItemButton
              className=" gap-4"
              onClick={() => handleMenuClick("New Car Listings")}
              style={{
                backgroundColor:
                  activeItem === "New Car Listings" ? "#2260A8" : "",
                borderRadius: "40px",
                padding: "5px",
                marginInline: "0px",
                color: activeItem === "New Car Listings" ? "white" : "",
              }}
            >
              <div
                className=" justify-center flex items-center "
                style={{
                  color: activeItem === "New Car Listings" ? "white" : "",
                }}
              >
                <PeopleIcon className="" style={{ height: "14px" }} />
              </div>
              <ListItemText
                primary="New Car Listings"
                primaryTypographyProps={{ fontSize: "12px" }}
              />
            </ListItemButton>
          </li>

          {/* <li>
            <ListItemButton
              className=" gap-4"
              onClick={() => handleMenuClick("Car Listing Approval")}
              style={{
                backgroundColor:
                  activeItem === "Car Listing Approval" ? "#2260A8" : "",
                borderRadius: "40px",
                padding: "5px",
                marginInline: "0px",
                color: activeItem === "Car Listing Approval" ? "white" : "",
              }}
            >
              <div
                className=" justify-center flex items-center "
                style={{
                  color: activeItem === "Car Listing Approval" ? "white" : "",
                }}
              >
                <DirectionsCarIcon className="" style={{ height: "16px" }} />
              </div>
              <ListItemText
                primary="Car Listing Approval"
                primaryTypographyProps={{ fontSize: "12px" }}
              />
            </ListItemButton>
          </li> */}
          <li className="border-b border-gray-300 pb-2">
            <ListItemButton
              className=" gap-4"
              onClick={() => handleMenuClick("My Approval Listing")}
              style={{
                backgroundColor:
                  activeItem === "My Approval Listing" ? "#2260A8" : "",
                borderRadius: "40px",
                padding: "5px",
                marginInline: "0px",
                color: activeItem === "My Approval Listing" ? "white" : "",
              }}
            >
              <div
                className=" justify-center flex items-center "
                style={{
                  color: activeItem === "My Approval Listing" ? "white" : "",
                }}
              >
                <DirectionsCarIcon className="" style={{ height: "16px" }} />
              </div>
              <ListItemText
                primary="My Approval Listing"
                primaryTypographyProps={{ fontSize: "12px" }}
              />
            </ListItemButton>
          </li>

          <Box p={1}>
            <span className="">Booking Approvals</span>
          </Box>
          <li className="border-b border-gray-300 pb-2 pt-0 ">
            <ListItemButton
              className=" gap-4"
              onClick={() => handleMenuClick("Booking Approval")}
              style={{
                backgroundColor:
                  activeItem === "Booking Approval" ? "#2260A8" : "",
                borderRadius: "40px",
                padding: "5px",
                marginInline: "0px",
                color: activeItem === "Booking Approval" ? "white" : "",
              }}
            >
              <div
                className=" justify-center flex items-center "
                style={{
                  color: activeItem === "Booking Approval" ? "white" : "",
                }}
              >
                <PeopleIcon className="" style={{ height: "14px" }} />
              </div>
              <ListItemText
                primary="Booking Approval"
                primaryTypographyProps={{ fontSize: "12px" }}
              />
            </ListItemButton>
          </li>
          <Box p={1}>
            <span className="">Adminstration Settings</span>
          </Box>

          <li className=" pb-0 pt-0 ">
            <ListItemButton
              className=" gap-4"
              onClick={handleClick}
              style={{
                backgroundColor:
                  activeItem === "User Role and Permission" ? "#2260A8" : "",
                borderRadius: "40px",
                padding: "5px",
                marginInline: "0px",
                color: activeItem === "User Role and Permission" ? "white" : "",
              }}
            >
              <div
                className=" justify-center flex items-center "
                style={{
                  color:
                    activeItem === "User Role and Permission" ? "white" : "",
                }}
              >
                <InboxIcon style={{ height: "16px" }} />
              </div>
              <ListItemText
                primary="User Role and Permission"
                primaryTypographyProps={{ fontSize: "12px" }}
              />{" "}
              {open ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </li>
          {/* Nested (Child) Items */}
          <Collapse
            in={open}
            timeout="auto"
            sx={{ marginBottom: 4 }}
            unmountOnExit
          >
            <List component="div" disablePadding>
              <ListItemButton
                sx={{ py: 1 }}
                onClick={() => handleMenuClick("Role Settings")}
                style={{
                  backgroundColor:
                    activeItem === "Role Settings" ? "#2260A8" : "",
                  borderRadius: "40px",
                  padding: "5px",
                  marginInline: "0px",
                  color: activeItem === "Role Settings" ? "white" : "",
                }}
              >
                <div
                  className=" justify-center flex items-center "
                  style={{
                    color: activeItem === "Role Settings" ? "white" : "",
                  }}
                >
                  <StarBorder style={{ height: "16px" }} />
                </div>
                <ListItemText
                  primary="Role Settings"
                  primaryTypographyProps={{ fontSize: "12px" }}
                />
              </ListItemButton>
              <ListItemButton
                onClick={() => handleMenuClick("User Settings")}
                style={{
                  backgroundColor:
                    activeItem === "User Settings" ? "#2260A8" : "",
                  borderRadius: "40px",
                  padding: "5px",
                  marginInline: "0px",
                  color: activeItem === "User Settings" ? "white" : "",
                }}
                sx={{ py: 1 }}
              >
                <div
                  className=" justify-center flex items-center "
                  style={{
                    color: activeItem === "User Settings" ? "white" : "",
                  }}
                >
                  <StarBorder style={{ height: "16px" }} />
                </div>
                <ListItemText
                  primary="User Settings"
                  primaryTypographyProps={{ fontSize: "12px" }}
                />
              </ListItemButton>
            </List>
          </Collapse>
        </ul>
        <Box
          onClick={handleLogout}
          position="fixed"
          top={40}
          right={40}
          px={3}
          py={2}
          bgcolor="#d32f2f"
          color="white"
          borderRadius={2}
          boxShadow={3}
          display="flex"
          alignItems="center"
          gap={1}
          sx={{
            cursor: "pointer",
            transition: "0.2s",
            "&:hover": { opacity: 0.9 },
          }}
        >
          <LogoutIcon />
          <Typography variant="body1" fontWeight={500}>
            Log Out
          </Typography>
        </Box>
        <Box
          position="fixed"
          bottom={0}
          width="300px"
          px={2}
          py={0}
          bgcolor="#001E3C"
          color="white"
        >
          <ListItemButton
            onClick={() => handleMenuClick("Chat")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <SupportAgentIcon />
            <span style={{ marginLeft: "8px" }}>Customer Support</span>
            <Badge badgeContent={0} color="error">
              <ChatBubbleIcon />
            </Badge>
          </ListItemButton>
        </Box>
      </Drawer>

      {/* Content Area */}
      <Box flex={1} p={4}>
        {renderContent()}
      </Box>
    </Box>
  );
};

export default PermanentDrawerLeft;
