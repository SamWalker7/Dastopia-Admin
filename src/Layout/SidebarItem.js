// src/components/SidebarItem.js
import React from 'react';
import { ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

const SidebarItem = ({ text, icon, path }) => {
  const location = useLocation();
  const isSelected = location.pathname === path;

  return (
    <ListItem
      button
      component={Link}
      to={path}
      sx={{
        color: isSelected ? '#000' : '#fff',
        backgroundColor: isSelected ? '#fff' : 'transparent',
        borderRadius: '0 25px 25px 0',
        '&:hover': {
          backgroundColor: isSelected ? '#fff' : '#333',
        },
      }}
    >
      <ListItemIcon sx={{ color: isSelected ? '#000' : '#fff' }}>
        {icon}
      </ListItemIcon>
      <ListItemText primary={text} />
    </ListItem>
  );
};

export default SidebarItem;
