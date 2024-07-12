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
import makesData from "../api/makes.json";
import modelData from "../api/models.json"; // Import the model data
import "./page-styles.css";

const RentACarPage = () => {
  const [rows, setRows] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    make: "",
    model: "",
    startYear: "",
    endYear: "",
    email: "",
  });
  const [modelList, setModelList] = useState([]); // State for model list
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
    if (name === "make") {
      let newModel = modelData.filter((model) => {
        return Object.keys(model)[0] === value;
      });
      if (newModel.length > 0) {
        newModel = Object.values(newModel[0])[0];
      } else {
        newModel = [];
      }
      setModelList(newModel);
      setFilters({ ...filters, make: value, model: "" });
    } else {
      setFilters({ ...filters, [name]: value });
    }
  };

  const filteredRows = rows.filter((row) => {
    const startYear = filters.startYear ? parseInt(filters.startYear) : null;
    const endYear = filters.endYear ? parseInt(filters.endYear) : null;
    const yearFilter =
      (!startYear || row.year >= startYear) &&
      (!endYear || row.year <= endYear);

    return (
      (filters.make === "" || row.make === filters.make) &&
      (filters.model === "" || row.model === filters.model) &&
      yearFilter &&
      (filters.email === "" ||
        (row.ownerEmail &&
          row.ownerEmail.toLowerCase().includes(filters.email.toLowerCase())) ||
        (row.representativeEmail &&
          row.representativeEmail
            .toLowerCase()
            .includes(filters.email.toLowerCase())))
    );
  });

  const getModelOptions = () => {
    return modelList.map((model) => (
      <MenuItem key={model} value={model}>
        {model}
      </MenuItem>
    ));
  };

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
              {makesData.Makes.map((make) => (
                <MenuItem key={make.make_id} value={make.make_display}>
                  {make.make_display}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={3}>
            <TextField
              select
              label="Model"
              name="model"
              value={filters.model}
              onChange={handleFilterChange}
              disabled={!filters.make}
              fullWidth
            >
              <MenuItem value="all">All</MenuItem>
              {getModelOptions()}
            </TextField>
          </Grid>
          <Grid item xs={3}>
            <select
              label="Start Year"
              name="startYear"
              value={filters.startYear}
              onChange={handleFilterChange}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
            >
              <option value="">Select Start Year</option>
              {Array.from(
                { length: 30 },
                (_, i) => new Date().getFullYear() - i
              ).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </Grid>
          <Grid item xs={3}>
            <select
              label="End Year"
              name="endYear"
              value={filters.endYear}
              onChange={handleFilterChange}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
            >
              <option value="">Select end Year</option>
              {Array.from(
                { length: 30 },
                (_, i) => new Date().getFullYear() - i
              ).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </Grid>
          <Grid item xs={3}>
            <TextField
              label="Search by email"
              name="email"
              value={filters.email}
              onChange={handleFilterChange}
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
