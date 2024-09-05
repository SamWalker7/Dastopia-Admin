// src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import CardSection from '../components/card-section';
import PersonIcon from '@mui/icons-material/Person';
import ListIcon from '@mui/icons-material/List';
import CircularProgress from '@mui/material/CircularProgress';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { getAllVehicles } from "../api";
import { filterByDateRange, getPercentageChangeLast7Days, getPercentageChangeLast30Days } from '../config/helpers';
import CarListingsChart from '../components/visualization/ChartListingChart';

const DashboardPage = () => {
  const [totalListings, setTotalListings] = useState(null);
  const [listingLast7Days, setListingLast7Days] = useState(null);
  const [percentageLast7Days, setPercentageLast7Days] = useState(null);
  const [listingLas30Days, setListingLas30Days] = useState(null);
  const [percentageLast30Days, setPercentageLast30Days] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalReservations, setTotalReservations] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [data, setData] = useState([]);

  const transformAndCountData = (data) => {
    const counts = {};

    data.forEach(item => {
      const dateObj = new Date(item.createdAt);
      const dateKey = `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate()}`;

      if (counts[dateKey]) {
        counts[dateKey].count++;
      } else {
        counts[dateKey] = {
          date: dateKey,
          count: 1
        };
      }
    });

    
    const transformedData = Object.values(counts);

    return transformedData;
  };


  useEffect(() => {
    fetchVehicles();
  }, [])
  const fetchVehicles = async () => {
    setIsLoading(true);
    const { body } = await getAllVehicles();

    const transformed = transformAndCountData(body);
    console.log(transformed, "transformed")
    setData(transformed);
    setIsLoading(false);
    setTotalListings(body?.length);
    console.log(body, "car listing data")
    setListingLast7Days(filterByDateRange(body, 7));
    setPercentageLast7Days(getPercentageChangeLast7Days(body));
    setListingLas30Days(filterByDateRange(body, 30));
    setPercentageLast30Days(getPercentageChangeLast30Days(body));
  }
  const userItems = [
    { icon: <PersonIcon fontSize="large" />, title: '', count: 0, period: 'Last 30 days' },
    { icon: <PersonIcon fontSize="large" />, title: '', count: 0, period: 'Last 24 hours' },
    { icon: <PersonIcon fontSize="large" />, title: '', count: 0, period: 'Total users' }
  ];

  const listingItems = [
    { icon: <ListIcon fontSize="large" />, title: '', count: totalListings ? totalListings : <CircularProgress />, period: 'Total listings' },
    { icon: <ListIcon fontSize="large" />, title: percentageLast30Days || percentageLast30Days === 0 ? percentageLast30Days : <CircularProgress />, count: listingLas30Days ? listingLas30Days : <CircularProgress />, period: 'Last 30 days' },
    { icon: <ListIcon fontSize="large" />, title: percentageLast7Days || percentageLast7Days === 0 ? percentageLast7Days : <CircularProgress />, count: listingLast7Days ? listingLast7Days : <CircularProgress />, period: 'Last 7 days' },
  ];

  const reservationItems = [
    { icon: <NotificationsIcon fontSize="large" />, title: '', count: 0, period: 'Last 30 days' },
    { icon: <NotificationsIcon fontSize="large" />, title: '', count: 0, period: 'Last 24 hours' },
    { icon: <NotificationsIcon fontSize="large" />, title: '', count: 0, period: 'Total reservations' }
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
        {
          isLoading ? <p>loading ...</p> : <CarListingsChart data={data} />
        }
        
        <CardSection title="Reservations" items={reservationItems} />
      </Box>
    </div>
  );
}

export default DashboardPage;
