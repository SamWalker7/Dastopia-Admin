// src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import CardSection from '../components/card-section';
import PersonIcon from '@mui/icons-material/Person';
import ListIcon from '@mui/icons-material/List';
import NotificationsIcon from '@mui/icons-material/Notifications'; 
import { getAllVehicles } from "../api";

const DashboardPage = () => {
  const [ totalListings, setTotalListings ] = useState(null);
  const [ listingLast7Days, setListingLast7Days ] = useState(null);
  const [ listingLas30Days, setListingLas30Days ] = useState(null);
  const [ totalUsers, setTotalUsers ] = useState(0);
  const [ totalReservations, setTotalReservations ] = useState(0);
  const [ isLoading, setIsLoading ] = useState(true);

  useEffect(() => {
    fetchVehicles();
  }, [])
  const fetchVehicles = async () => {
    setIsLoading(true);
    const { body } = await getAllVehicles();
    setTotalListings(body?.length);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const listingsLast7Days = body?.filter(item => {
        const itemDate = new Date(item.createdAt);
        return itemDate >= oneWeekAgo;
    }).length;

    setListingLast7Days(listingsLast7Days);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const listingsLast30Days = body?.filter(item => {
        const itemDate = new Date(item.createdAt);
        return itemDate >= thirtyDaysAgo;
    }).length;

    setListingLas30Days(listingsLast30Days);
  }
  const userItems = [
    { icon: <PersonIcon fontSize="large" />, title: '', count: 0, period: 'Last 30 days' },
    { icon: <PersonIcon fontSize="large" />, title: '', count: 0, period: 'Last 24 hours' },
    { icon: <PersonIcon fontSize="large" />, title: '', count: 8, period: 'Total users' }
  ];

  const listingItems = [
    { icon: <ListIcon fontSize="large" />, title: '', count: totalListings ? totalListings : 'Loading...', period: 'Total listings' },
    { icon: <ListIcon fontSize="large" />, title: '', count: listingLas30Days ? listingLas30Days : 'Loading...', period: 'Last 30 days' },
    { icon: <ListIcon fontSize="large" />, title: '', count: listingLast7Days ? listingLast7Days : 'Loading...', period: 'Last 7 days' },
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
