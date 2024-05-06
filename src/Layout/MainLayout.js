// src/Layout/MainLayout.js
import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';

const drawerWidth = 240;

const MainLayout = ({ children, open, handleDrawerOpen, handleDrawerClose }) => (
    <>
        <TopBar open={open} handleDrawerOpen={handleDrawerOpen} />
        <Sidebar open={open} handleDrawerClose={handleDrawerClose} />
        <Box
            component="main"
            sx={{
                flexGrow: 1,
                p: 3,
                marginLeft: open ? `${drawerWidth}px` : 0, // Add margin when sidebar is open
                transition: 'margin .2s ease-out', // Smooth transition
            }}
        >
            <Toolbar /> {/* This is needed to offset the content below the app bar */}
            {children}
        </Box>
    </>
);

export default MainLayout;