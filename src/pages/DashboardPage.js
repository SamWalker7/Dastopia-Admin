// src/pages/DashboardPage.js
import React from 'react';
import Box from '@mui/material/Box';
import CardSection from '../components/card-section';
import PersonIcon from '@mui/icons-material/Person';
import ListIcon from '@mui/icons-material/List';
import NotificationsIcon from '@mui/icons-material/Notifications'; 

const DashboardPage = () => {
  const userItems = [
    { icon: <PersonIcon fontSize="large" />, title: '', count: 0, period: 'Last 30 days' },
    { icon: <PersonIcon fontSize="large" />, title: '', count: 0, period: 'Last 24 hours' },
    { icon: <PersonIcon fontSize="large" />, title: '', count: 8, period: 'Total users' }
  ];

  const listingItems = [
    { icon: <ListIcon fontSize="large" />, title: '', count: 0, period: 'Last 30 days' },
    { icon: <ListIcon fontSize="large" />, title: '', count: 0, period: 'Last 24 hours' },
    { icon: <ListIcon fontSize="large" />, title: '', count: 11, period: 'Total listings' }
  ];

  const reservationItems = [
    { icon: <NotificationsIcon fontSize="large" />, title: '', count: 0, period: 'Last 30 days' },
    { icon: <NotificationsIcon fontSize="large" />, title: '', count: 0, period: 'Last 24 hours' },
    { icon: <NotificationsIcon fontSize="large" />, title: '', count: 7, period: 'Total reservations' }
  ];
  return (
    <div>
      {/* <Typography style={{fontWeight: 'bold', fontFamily: "sans-serif"}} variant="h3" bold="true">
        Dashboard
      </Typography> */}
      {/* <Typography variant="subtitle" paragraph gutterBottom>
        Welcome to the admin panel.
      </Typography> */}
      <Box sx={{ padding: '16px' }}>
        <CardSection title="Users" items={userItems} />
        <CardSection title="Listings" items={listingItems} />
        <CardSection title="Reservations" items={reservationItems} />
      </Box>
    </div>
  );
}

export default DashboardPage;
