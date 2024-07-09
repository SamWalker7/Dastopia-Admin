import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import { useNavigate } from "react-router-dom";
import { getAllVehicles, getDownloadUrl } from "../api";
import VehicleCard from "../components/vehicle-components/VehicleCard";
import "./page-styles.css";

const RentACarPage = () => {
  const [rows, setRows] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    make: "",
    model: "",
    year: "",
    search: "",
  });
  const navigate = useNavigate();

  const toggleListing = (index) => {
    const newRows = [...rows];
    newRows[index].enabled = !newRows[index].enabled;
    setRows(newRows);
  };

  const handleAddCar = () => {
    navigate("/add-car");
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
  }, []);

  const fetchVehicles = async () => {
    setIsLoading(true);
    const { body } = await getAllVehicles();
    let data = [];
    for (const vehicle of body) {
      data.push({
        ...vehicle,
        status: vehicle?.isEnabled
          ? "Approved"
          : vehicle?.isEnabled === false
          ? "Declined"
          : "Pending",
        images: [], // Initially, set images to an empty array
        imageLoading: true, // Flag to indicate images are loading
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
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const filteredRows = rows.filter((row) => {
    return (
      (filters.make === "" || row.make === filters.make) &&
      (filters.model === "" || row.model === filters.model) &&
      (filters.year === "" || row.year === filters.year) &&
      (filters.search === "" ||
        (row.model &&
          row.model.toLowerCase().includes(filters.search.toLowerCase())))
    );
  });

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
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <TextField
              select
              label="Make"
              name="make"
              value={filters.make}
              onChange={handleFilterChange}
              fullWidth
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Toyota">Toyota</MenuItem>
              <MenuItem value="Honda">Honda</MenuItem>
              <MenuItem value="Ford">Ford</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={3}>
            <TextField
              select
              label="Model"
              name="model"
              value={filters.model}
              onChange={handleFilterChange}
              fullWidth
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Camry">Camry</MenuItem>
              <MenuItem value="Civic">Civic</MenuItem>
              <MenuItem value="F-150">F-150</MenuItem>
              <MenuItem value="F-150">Vitz</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={3}>
            <TextField
              label="Year"
              name="year"
              value={filters.year}
              onChange={handleFilterChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              label="search by model"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              fullWidth
            />
          </Grid>
        </Grid>
      </Grid>
      {isLoading ? (
        <CircularProgress />
      ) : (
        <>
          {filteredRows.length > 0 ? (
            filteredRows.map((row, index) => (
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
          ) : (
            <Grid item xs={12}>
              <p>No Data Found</p>
            </Grid>
          )}
        </>
      )}
    </Grid>
  );
};

export default RentACarPage;
