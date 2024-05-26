import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";
import { getAllVehicles, getDownloadUrl } from "../api";
import VehicleCard from "../components/vehicle-components/VehicleCard";
import './page-styles.css';

const RentACarPage = () => {
  const [rows, setRows] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const toggleListing = (index) => {
    const newRows = [...rows];
    newRows[index].enabled = !newRows[index].enabled;
    setRows(newRows);
  };

  const handleAddCar = () => {
    navigate("/add-car"); // Changed from history.push
  };

  const handleClick = (event, index) => {
    setAnchorEl(event.currentTarget);
    setSelectedIndex(index);
  };

  const handleClose = (status) => {
    const newRows = [...rows];
    newRows[selectedIndex].status = status;
    setRows(newRows);
    setAnchorEl(null);
  };

  useEffect(() => {
    fetchVehicles();
  }, [])

  const createData = (image, name, status, enabled = true) => ({
    image,
    name,
    status,
    enabled,
  });

  const fetchVehicles = async () => {
    setIsLoading(true);
    const { body } = await getAllVehicles();
    let data = [];
    for (const vehicle of body) {
      data.push({
        ...vehicle,
        status: vehicle?.isEnabled ? 'Approved' : vehicle?.isEnabled === false ? 'Declined' : 'Pending',
        images: [], // Initially, set images to an empty array
        imageLoading: true // Flag to indicate images are loading
      });
    }

    setRows(data);
    setIsLoading(false);

    // Fetch images after setting vehicle data
    for (let i = 0; i < body.length; i++) {
      const vehicle = body[i];
      if (vehicle?.vehicleImageKeys?.length > 0) {
        let urls = [];
        for (const image of vehicle?.vehicleImageKeys) {
          const url = await getDownloadUrl(image.key);
          urls.push(url.body || "https://via.placeholder.com/300");
        }
        data[i].images = urls;
        data[i].imageLoading = false; // Set image loading flag to false
        setRows([...data]); // Update state with new images
      }
    }
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddCar}
          sx={{ marginBottom: "1em" }}
        >
          Add New Listing
        </Button>
      </Grid>
      {isLoading ? (
        <CircularProgress />
      ) : (
        rows.map((row, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <VehicleCard
              row={row}
              index={index}
              handleClick={handleClick}
              handleClose={handleClose}
              toggleListing={toggleListing}
              anchorEl={anchorEl}
              selectedIndex={selectedIndex}
              setAnchorEl={setAnchorEl}
            />
          </Grid>
        ))
      )}
    </Grid>
  );
};

export default RentACarPage;
