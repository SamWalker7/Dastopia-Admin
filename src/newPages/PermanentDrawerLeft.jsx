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
import LogoutIcon from "@mui/icons-material/Logout";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const param = location.pathname.split("/").pop();

  const [activeItem, setActiveItem] = useState(param);

  const [open, setOpen] = useState(false);
  // const role = getUserRole();

  const navigate = useNavigate();

  const handleMenuClick = (path, itemName) => {
    setActiveItem(itemName);
    navigate(`${path}`);
  };

  const handleClick = () => {
    setOpen(!open);
  };

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
              onClick={() => handleMenuClick("", "dashboard")}
              style={{
                backgroundColor: activeItem === "dashboard" ? "#2260A8" : "",
                borderRadius: "40px",
                padding: "5px",
                marginInline: "0px",
                color: activeItem === "dashboard" ? "white" : "",
              }}
            >
              <div
                className=" justify-center flex items-center "
                style={{
                  color: activeItem === "dashboard" ? "white" : "",
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
              onClick={() => handleMenuClick("financial-dashboard", "financial-dashboard")}
              style={{
                backgroundColor:
                  activeItem === "financial-dashboard" ? "#2260A8" : "",
                borderRadius: "40px",
                padding: "5px",

                marginInline: "0px",
                color: activeItem === "financial-dashboard" ? "white" : "",
              }}
            >
              <div
                className=" justify-center flex items-center "
                style={{
                  color: activeItem === "financial-dashboard" ? "white" : "",
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
              onClick={() => handleMenuClick("user-management", "user-management")}
              style={{
                backgroundColor:
                  activeItem === "user-management" ? "#2260A8" : "",
                borderRadius: "40px",
                padding: "5px",
                marginInline: "0px",
                color: activeItem === "user-management" ? "white" : "",
              }}
            >
              <div
                className=" justify-center flex items-center "
                style={{
                  color: activeItem === "user-management" ? "white" : "",
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
              onClick={() => handleMenuClick("vehicle-management", "vehicle-management")}
              style={{
                backgroundColor:
                  activeItem === "vehicle-management" ? "#2260A8" : "",
                borderRadius: "40px",
                padding: "5px",
                marginInline: "0px",
                color: activeItem === "vehicle-management" ? "white" : "",
              }}
            >
              <div
                className=" justify-center flex items-center "
                style={{
                  color: activeItem === "vehicle-management" ? "white" : "",
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
          <li className="">
            <ListItemButton
              className="gap-4"
              onClick={() => handleMenuClick("referral-statistics", "referral-statistics")}
              style={{
                backgroundColor:
                  activeItem === "referral-statistics" ? "#2260A8" : "",
                borderRadius: "40px",
                padding: "5px",
                marginInline: "0px",
                color: activeItem === "referral-statistics" ? "white" : "",
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  color: activeItem === "referral-statistics" ? "white" : "",
                }}
              >
                <PeopleIcon style={{ height: "14px" }} />
              </div>

              <ListItemText
                primary="Referral Statistics"
                primaryTypographyProps={{ fontSize: "12px" }}
              />
            </ListItemButton>
          </li>
          <li className="border-b border-gray-300 pb-2">
            <ListItemButton
              className="gap-4"
              onClick={() => handleMenuClick("promocode-analytics", "promocode-analytics")}
              style={{
                backgroundColor:
                  activeItem === "promocode-analytics" ? "#2260A8" : "",
                borderRadius: "40px",
                padding: "5px",
                marginInline: "0px",
                color: activeItem === "promocode-analytics" ? "white" : "",
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  color: activeItem === "promocode-analytics" ? "white" : "",
                }}
              >
                <PeopleIcon style={{ height: "14px" }} />
              </div>

              <ListItemText
                primary="Promo Code Managment"
                primaryTypographyProps={{ fontSize: "12px" }}
              />
            </ListItemButton>
          </li>

          <Box p={1}>
            <span className="">Listing Approvals</span>
          </Box>
          <li className=" pb-0 pt-0 ">
            <ListItemButton
              className=" gap-4"
              onClick={() => handleMenuClick("new-car-listings", "new-car-listings")}
              style={{
                backgroundColor:
                  activeItem === "new-car-listings" ? "#2260A8" : "",
                borderRadius: "40px",
                padding: "5px",
                marginInline: "0px",
                color: activeItem === "new-car-listings" ? "white" : "",
              }}
            >
              <div
                className=" justify-center flex items-center "
                style={{
                  color: activeItem === "new-car-listings" ? "white" : "",
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
              onClick={() => handleMenuClick("my-approval-listing", "my-approval-listing")}
              style={{
                backgroundColor:
                  activeItem === "my-approval-listing" ? "#2260A8" : "",
                borderRadius: "40px",
                padding: "5px",
                marginInline: "0px",
                color: activeItem === "my-approval-listing" ? "white" : "",
              }}
            >
              <div
                className=" justify-center flex items-center "
                style={{
                  color: activeItem === "my-approval-listing" ? "white" : "",
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
              onClick={() => handleMenuClick("booking-approval", "booking-approval")}
              style={{
                backgroundColor:
                  activeItem === "booking-approval" ? "#2260A8" : "",
                borderRadius: "40px",
                padding: "5px",
                marginInline: "0px",
                color: activeItem === "booking-approval" ? "white" : "",
              }}
            >
              <div
                className=" justify-center flex items-center "
                style={{
                  color: activeItem === "booking-approval" ? "white" : "",
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
                onClick={() => handleMenuClick("role-settings", "role-settings")}
                style={{
                  backgroundColor:
                    activeItem === "role-settings" ? "#2260A8" : "",
                  borderRadius: "40px",
                  padding: "5px",
                  marginInline: "0px",
                  color: activeItem === "role-settings" ? "white" : "",
                }}
              >
                <div
                  className=" justify-center flex items-center "
                  style={{
                    color: activeItem === "role-settings" ? "white" : "",
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
                onClick={() => handleMenuClick("user-settings", "user-settings")}
                style={{
                  backgroundColor:
                    activeItem === "user-settings" ? "#2260A8" : "",
                  borderRadius: "40px",
                  padding: "5px",
                  marginInline: "0px",
                  color: activeItem === "user-settings" ? "white" : "",
                }}
                sx={{ py: 1 }}
              >
                <div
                  className=" justify-center flex items-center "
                  style={{
                    color: activeItem === "user-settings" ? "white" : "",
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
            onClick={() => navigate("Chat")}
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
        {/* {renderContent()} */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default PermanentDrawerLeft;
