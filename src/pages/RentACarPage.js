import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";
import { getAllVehicles, getDownloadUrl } from "../api";
import VehicleCard from "../components/vehicle-components/VehicleCard";
import './page-styles.css';
import { useDispatch, useSelector } from "react-redux";
import { fetchImages, fetchVehicles } from "../store/slices/vehicleSlice";

const RentACarPage = () => {

  const dispatch = useDispatch();

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const navigate = useNavigate();


  const toggleListing = (index) => {
    const newRows = [...rows];
    newRows[index].enabled = !newRows[index].enabled;
    // setRows(newRows);
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
    // setRows(newRows);
    setAnchorEl(null);
  };

  const rows = useSelector((state) => state.vehicles.vehicles)
  const loading = useSelector((state) => state.vehicles.loading)

  useEffect(() => {
    const loadData = async () => {
      const response = await dispatch(fetchVehicles())
      if (fetchVehicles.fulfilled.match(response)) {
        const vehicles = response.payload;
        vehicles.map(async (vehicle) => {
          await dispatch(fetchImages(vehicle))
        })

      }
    }

    if (rows.length < 1) {
      loadData();
    }
  }, [])
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
      {loading ? (
        <CircularProgress />
      ) : (
        rows.map((row, index) => {
          return (
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
          )
        })
      )}
    </Grid>
  );
};

export default RentACarPage;
