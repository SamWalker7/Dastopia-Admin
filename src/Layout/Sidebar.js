// src/Layout/Sidebar.js
import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Divider } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { Link, useLocation } from 'react-router-dom';
import SidebarItem from './SidebarItem';

const Sidebar = ({ open, handleDrawerClose }) => {
  const location = useLocation();
  const sidebarConfig = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      text: 'Manage Vehicles',
      icon: <ManageSearchIcon />,
      path: '/rent-a-car',
    },
    {
      text: 'Add a Vehicle',
      icon: <DirectionsCarIcon />,
      path: '/add-car',
    },
  ];
  const drawerWidth = 240;

  return (
<Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#004080',
          color: '#fff',
        },
      }}
      variant="persistent"
      anchor="left"
      open={open}
    >
      <IconButton onClick={handleDrawerClose} sx={{ color: '#fff' }}>
        <ChevronLeftIcon />
      </IconButton>
      <Divider />
      <List>
        {sidebarConfig.map(({ text, icon, path }) => (
          <SidebarItem key={text} text={text} icon={icon} path={path} />
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;