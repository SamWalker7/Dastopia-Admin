// src/Layout/Sidebar.js
import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Divider } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { Link, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const Sidebar = ({ open, handleDrawerClose }) => {
  const location = useLocation();

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#004080', // Change the color of the Drawer
          color: '#fff' // Change the color of the text
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
        {['Dashboard', 'Rent a Car'].map((text, index) => (
          <ListItem 
            button 
            key={text} 
            component={Link} 
            to={`/${text.toLowerCase().replace(/\s+/g, '-')}`} 
            sx={{ 
              color: location.pathname === `/${text.toLowerCase().replace(/\s+/g, '-')}` ? '#000' : '#fff', // Change the text color of the selected item to black
              backgroundColor: location.pathname === `/${text.toLowerCase().replace(/\s+/g, '-')}` ? '#fff' : 'transparent', // Change the background color of the selected item
              borderRadius: '0 25px 25px 0', // Round the top right and bottom right corners
              '&:hover': {
                backgroundColor: location.pathname === `/${text.toLowerCase().replace(/\s+/g, '-')}` ? '#fff' : '#333', // Change the hover background color
              },
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === `/${text.toLowerCase().replace(/\s+/g, '-')}` ? '#000' : '#fff' }}>
              {index % 2 === 0 ? <DashboardIcon /> : <DirectionsCarIcon />}
            </ListItemIcon>
            <ListItemText primary={text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;